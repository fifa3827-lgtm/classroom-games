// 분필 대소동 — art.js (window.ART) : 칠판 위 분필 손그림. 모든 그림을 init()에서 미리 3장씩 그려 둠.
(function () {
  'use strict';
  var S = 2; // 2배 해상도로 그려 둠(선명도)
  var C = {
    board: '#1F3D2B', white: '#F7F7F2', black: '#111111', gold: '#FFD700',
    doodle: '#FFE066', worm: '#7FDBFF', redx: '#FF4D4D', num: '#FF9ECF'
  };
  var SPR = {}, ICON = {}, TILE = null, DEF_DOODLE = null, built = false;

  function mk(w, h) { var c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return c; }
  function r(a) { return (Math.random() * 2 - 1) * a; }
  var JIT = 0.7;
  function jp(pts, a) { a = (a == null) ? JIT : a; return pts.map(function (p) { return [p[0] + r(a), p[1] + r(a)]; }); }
  function mid(a, b) { return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; }

  // 점들을 이어 Path2D로 (smooth면 부드럽게)
  function poly(pts, closed, smooth) {
    var p = new Path2D(), n = pts.length, i, m;
    if (!smooth || n < 3) {
      p.moveTo(pts[0][0], pts[0][1]);
      for (i = 1; i < n; i++) p.lineTo(pts[i][0], pts[i][1]);
      if (closed) p.closePath();
      return p;
    }
    if (closed) {
      m = mid(pts[n - 1], pts[0]); p.moveTo(m[0], m[1]);
      for (i = 0; i < n; i++) { var a = pts[i], b = pts[(i + 1) % n]; m = mid(a, b); p.quadraticCurveTo(a[0], a[1], m[0], m[1]); }
      p.closePath();
    } else {
      p.moveTo(pts[0][0], pts[0][1]);
      for (i = 1; i < n - 1; i++) { m = mid(pts[i], pts[i + 1]); p.quadraticCurveTo(pts[i][0], pts[i][1], m[0], m[1]); }
      p.lineTo(pts[n - 1][0], pts[n - 1][1]);
    }
    return p;
  }
  // 삐뚤빼뚤 동그라미
  function circ(cx, cy, rx, ry, a, n) {
    n = n || 14; var pts = [];
    for (var i = 0; i < n; i++) { var t = i / n * Math.PI * 2; pts.push([cx + Math.cos(t) * rx + r(a), cy + Math.sin(t) * ry + r(a)]); }
    return poly(pts, true, true);
  }
  function line(a, b, j) { return poly(jp([a, b], j), false); }

  // 선 긋기: 검은 테두리 → 색 선 → 반투명 분필 겹선
  function inkAll(x, paths, color, w, b) {
    var i;
    x.lineCap = 'round'; x.lineJoin = 'round';
    if (b) { x.strokeStyle = C.black; x.lineWidth = w + 2 * b; for (i = 0; i < paths.length; i++) x.stroke(paths[i]); }
    x.strokeStyle = color; x.lineWidth = w; for (i = 0; i < paths.length; i++) x.stroke(paths[i]);
    x.save(); x.globalAlpha = 0.35; x.strokeStyle = '#ffffff'; x.lineWidth = Math.max(0.6, w * 0.4);
    x.translate(0.5 + r(0.3), -0.5 + r(0.3));
    for (i = 0; i < paths.length; i++) x.stroke(paths[i]);
    x.restore();
  }
  function ink(x, path, color, w, b) { inkAll(x, [path], color, w, b); }
  // 칠하기: 검은 테두리(b px 바깥) → 채움
  function fillInk(x, path, fill, b) {
    x.lineCap = 'round'; x.lineJoin = 'round';
    if (b) { x.strokeStyle = C.black; x.lineWidth = 2 * b; x.stroke(path); }
    x.fillStyle = fill; x.fill(path);
  }
  function fillAll(x, list, b) { // list: [[path, fill], ...] 테두리 먼저 모두, 그다음 채움
    var i; x.lineCap = 'round'; x.lineJoin = 'round';
    if (b) { x.strokeStyle = C.black; x.lineWidth = 2 * b; for (i = 0; i < list.length; i++) x.stroke(list[i][0]); }
    for (i = 0; i < list.length; i++) { x.fillStyle = list[i][1]; x.fill(list[i][0]); }
  }
  function dot(x, cx, cy, rr, col) { x.fillStyle = col; x.beginPath(); x.arc(cx, cy, rr, 0, Math.PI * 2); x.fill(); }
  function eye(x, cx, cy, rr, px, py, b) {
    fillInk(x, circ(cx, cy, rr, rr, rr * 0.08, 10), '#ffffff', b == null ? 1 : b);
    dot(x, cx + px, cy + py, rr * 0.52, C.black);
    dot(x, cx + px - rr * 0.18, cy + py - rr * 0.2, rr * 0.16, '#ffffff');
  }
  // 분필 알갱이: 픽셀을 살짝 갉아냄
  function grain(x, cw, ch, amt) {
    x.save(); x.setTransform(1, 0, 0, 1, 0, 0);
    x.globalCompositeOperation = 'destination-out';
    var n = Math.round(cw * ch * (amt || 0.02));
    x.fillStyle = 'rgba(0,0,0,0.3)';
    for (var i = 0; i < n; i++) x.fillRect(Math.random() * cw | 0, Math.random() * ch | 0, 1, 1);
    x.restore();
  }

  function build(id, w, h, fn, rot, noGrain) {
    var frames = [];
    for (var f = 0; f < 3; f++) {
      var c = mk(w * S, h * S), x = c.getContext('2d');
      x.scale(S, S);
      x.translate(w / 2, h / 2); x.rotate(r(rot == null ? 0.03 : rot)); x.translate(-w / 2, -h / 2);
      fn(x, w, h, f);
      if (!noGrain) grain(x, c.width, c.height);
      frames.push({ canvas: c, w: w, h: h });
    }
    SPR[id] = frames;
  }

  // ───────── 플레이어 분필이 48×48 (오른쪽 봄)
  function drawPlayer(x) {
    x.fillStyle = 'rgba(0,0,0,0.38)'; x.beginPath(); x.ellipse(24, 44.6, 12, 2.8, 0, 0, Math.PI * 2); x.fill();
    inkAll(x, [line([20, 38], [19, 44]), line([28, 38], [29.5, 44]), line([16, 25], [10.5, 30])], C.white, 3.2, 2);
    var body = poly(jp([[18, 6], [30, 6], [34, 10], [34, 38], [31, 41], [17, 41], [14, 38], [14, 10]], 0.45), true, true);
    fillInk(x, body, C.white, 2);
    // 닳은 분필 끝 + 옅은 결
    x.strokeStyle = 'rgba(0,0,0,0.10)'; x.lineWidth = 1; x.lineCap = 'round';
    x.stroke(line([17, 13], [21, 12], 0.4)); x.stroke(line([18, 34], [24, 35], 0.4));
    ink(x, line([34.5, 30], [39.5, 25.5]), C.white, 3.2, 2);
    // 얼굴
    dot(x, 26, 19.5, 1.9, C.black); dot(x, 31.5, 19.5, 1.9, C.black);
    dot(x, 25.5, 18.8, 0.6, '#fff'); dot(x, 31, 18.8, 0.6, '#fff');
    x.fillStyle = 'rgba(255,120,150,0.65)';
    x.beginPath(); x.ellipse(23.2, 23.8, 2.1, 1.3, 0, 0, 7); x.fill();
    x.beginPath(); x.ellipse(33, 23.8, 1.4, 1.3, 0, 0, 7); x.fill();
    x.strokeStyle = C.black; x.lineWidth = 1.3;
    x.beginPath(); x.arc(28.8, 23.2, 2.3, 0.15 * Math.PI, 0.85 * Math.PI); x.stroke();
  }

  // ───────── 낙서 얼굴 44×44
  function drawDoodle(x) {
    var Y = C.doodle;
    inkAll(x, [line([15, 14], [12, 6]), line([22, 12], [22.5, 5]), line([29, 14], [32.5, 6.5])], Y, 3, 3);
    var face = circ(22, 25.5, 13.5, 13.2, 0.7, 13);
    x.fillStyle = 'rgba(255,224,102,0.20)'; x.fill(face);
    ink(x, face, Y, 3, 3);
    var e = [];
    [[16.5, 22], [27.5, 22]].forEach(function (p) {
      e.push(line([p[0] - 2.6, p[1] - 2.6], [p[0] + 2.6, p[1] + 2.6], 0.4));
      e.push(line([p[0] + 2.6, p[1] - 2.6], [p[0] - 2.6, p[1] + 2.6], 0.4));
    });
    e.push(poly(jp([[14.5, 31], [18, 33.5], [22, 30], [26, 33.5], [29.5, 30.5]], 0.6), false));
    inkAll(x, e, Y, 2.4, 1.6);
  }

  // ───────── 지렁이 글씨 48×36
  function drawWorm(x) {
    var pts = [], a = 26 / (6 * Math.PI), b = 4.3;
    for (var i = 0; i <= 54; i++) { var t = i / 54 * Math.PI * 6; pts.push([9 + a * t - b * Math.sin(t), 23 + b * Math.cos(t)]); }
    pts.push([37, 19]);
    ink(x, poly(jp(pts, 0.35), false, true), C.worm, 3.4, 3);
    fillInk(x, circ(38.5, 16, 6.2, 5.8, 0.4, 11), C.worm, 3);
    dot(x, 37, 14.6, 1.4, C.black); dot(x, 41, 14.6, 1.4, C.black);
    x.strokeStyle = C.black; x.lineWidth = 1.1; x.lineCap = 'round';
    x.beginPath(); x.arc(39, 17, 2, 0.15 * Math.PI, 0.85 * Math.PI); x.stroke();
  }

  // ───────── 빨간 X 40×40
  function drawRedX(x) {
    inkAll(x, [line([9, 9], [31, 31], 0.8), line([31, 9], [9, 31], 0.8)], C.redx, 7, 3);
    fillInk(x, circ(20, 20.5, 8.8, 8.3, 0.4, 12), C.redx, 2);
    eye(x, 16.6, 19.8, 2.6, 0.7, 0.4, 0.8); eye(x, 23.4, 19.8, 2.6, -0.7, 0.4, 0.8);
    x.strokeStyle = C.black; x.lineCap = 'round'; x.lineWidth = 1.9;
    x.stroke(line([12.8, 15.5], [18.8, 17.6], 0.3)); x.stroke(line([27.2, 15.5], [21.2, 17.6], 0.3));
    x.lineWidth = 1.4;
    x.stroke(poly(jp([[16, 25.5], [18, 24.3], [20, 25.5], [22, 24.3], [24, 25.5]], 0.25), false));
  }

  // ───────── 오답 숫자 「7」 44×48 (작은 숫자는 줄여서)
  function drawSeven(x, small) {
    var shape = poly(jp([[6, 5], [38, 5], [38, 14], [25, 44], [14, 44], [27, 15], [6, 15]], 0.6), true, false);
    fillInk(x, shape, C.num, small ? 3.6 : 3);
    // 오답 빨간 줄
    if (!small) ink(x, line([7, 39], [38, 23], 0.6), C.redx, 2.6, 1.6);
    eye(x, 12.5, 10, 3.6, 0.8, 0.6, 1); eye(x, 21, 10, 3.6, 0.8, 0.6, 1);
    x.strokeStyle = C.black; x.lineCap = 'round'; x.lineWidth = small ? 2.2 : 1.8;
    x.stroke(line([8.5, 6.6], [15, 8.4], 0.3)); x.stroke(line([25, 6.6], [18.5, 8.4], 0.3));
    x.beginPath(); x.arc(28.5, 31, 3.2, 1.15 * Math.PI, 1.85 * Math.PI); x.stroke();
  }
  function drawNumber(x) { drawSeven(x, false); }
  function drawNumberSmall(x) { x.scale(28 / 44, 30 / 48); drawSeven(x, true); }

  // ───────── 종이비행기 대장 130×100
  function drawPlaneBoss(x) {
    var J = 1.2;
    var up = poly(jp([[122, 46], [9, 12], [48, 52]], J), true, false);
    var lo = poly(jp([[122, 46], [48, 52], [22, 89]], J), true, false);
    fillAll(x, [[up, '#FAFAF4'], [lo, '#D6D8D2']], 6);
    x.strokeStyle = 'rgba(0,0,0,0.25)'; x.lineWidth = 1.5; x.lineCap = 'round';
    x.stroke(line([48, 52], [120, 46.5], 0.6)); x.stroke(line([30, 24], [90, 40], 0.8));
    eye(x, 68, 42, 6.4, 1.6, 0.8, 1.5); eye(x, 86, 43.5, 5.6, 1.6, 0.8, 1.5);
    x.strokeStyle = C.black; x.lineWidth = 3.6;
    x.stroke(line([59, 33.5], [74, 38.5], 0.5)); x.stroke(line([93, 37], [81, 39.5], 0.5));
    var m = poly(jp([[68, 55], [96, 53], [91, 61.5], [72, 62.5]], 0.6), true, true);
    fillInk(x, m, '#6B1E1E', 1.6);
    x.fillStyle = '#fff';
    x.beginPath(); x.moveTo(71, 55.4); x.lineTo(75, 58.6); x.lineTo(79, 55); x.lineTo(83, 58.4); x.lineTo(87, 54.4); x.lineTo(91, 57.6); x.lineTo(94, 53.6); x.closePath(); x.fill();
    // 속도선
    inkAll(x, [line([4, 50], [16, 48], 0.6), line([6, 62], [20, 60], 0.6)], C.white, 2.2, 1.5);
  }

  // ───────── 숙제 괴물 190×190
  function drawHomeworkBoss(x) {
    var J = 1.4;
    var p1 = poly(jp([[40, 24], [140, 10], [146, 52], [46, 62]], J), true, false);
    var p2 = poly(jp([[58, 16], [160, 32], [150, 62], [50, 50]], J), true, false);
    fillAll(x, [[p1, '#E8E8E0'], [p2, '#F3F3EC']], 6);
    // 팔
    inkAll(x, [line([26, 122], [10, 106], 1), line([164, 122], [178, 104], 1)], C.white, 6, 5);
    var body = poly(jp([[28, 40], [164, 36], [168, 172], [24, 176]], J), true, false);
    fillInk(x, body, '#FBFBF6', 6);
    // 공책 줄·여백
    x.lineCap = 'round';
    x.strokeStyle = 'rgba(70,130,230,0.65)'; x.lineWidth = 1.6;
    for (var y = 60; y < 170; y += 13) x.stroke(line([36, y], [160, y - 1], 0.6));
    x.strokeStyle = 'rgba(255,77,77,0.8)'; x.lineWidth = 1.8;
    x.stroke(line([52, 42], [50, 172], 0.6));
    // 스프링
    for (var s = 50; s < 168; s += 15) {
      x.strokeStyle = C.black; x.lineWidth = 4.5; x.beginPath(); x.ellipse(28, s, 7, 3.6, -0.25, 0, Math.PI * 2); x.stroke();
      x.strokeStyle = '#CFCFCF'; x.lineWidth = 2; x.stroke();
    }
    // 빨간 0점 동그라미
    ink(x, circ(144, 60, 13, 12, 0.8, 12), C.redx, 3.4, 1.8);
    x.fillStyle = C.redx; x.font = 'bold 17px "Comic Sans MS", sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText('0', 144, 61);
    // 얼굴
    eye(x, 82, 92, 15, 3, 3, 2.5); eye(x, 122, 90, 15, -2, 3, 2.5);
    x.strokeStyle = C.black; x.lineWidth = 7;
    x.stroke(line([62, 70], [96, 80], 0.8)); x.stroke(line([142, 68], [108, 78], 0.8));
    var m = poly(jp([[64, 118], [138, 114], [128, 150], [74, 153]], 1), true, true);
    fillInk(x, m, '#5E1717', 3);
    x.fillStyle = '#FF8FA8'; x.beginPath(); x.ellipse(101, 145, 14, 5.5, 0, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#fff'; x.beginPath(); x.moveTo(68, 120);
    for (var k = 0; k < 7; k++) { x.lineTo(76 + k * 9.5, 129); x.lineTo(80.5 + k * 9.5, 119.5 - k * 0.5); }
    x.lineTo(136, 118); x.closePath(); x.fill();
    // 땀방울(웃김)
    fillInk(x, poly(jp([[158, 84], [163, 95], [158, 99], [153, 95]], 0.4), true, true), '#7FDBFF', 2);
  }

  // ───────── 아이템·투사체
  function starPts(cx, cy, ro, ri) { var p = []; for (var i = 0; i < 10; i++) { var t = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? ri : ro; p.push([cx + Math.cos(t) * rr, cy + Math.sin(t) * rr]); } return p; }
  function drawXP(x) {
    fillInk(x, poly(jp(starPts(9, 9.6, 7.6, 3.4), 0.25), true, false), C.gold, 1.6);
    dot(x, 7.5, 7.8, 1.1, 'rgba(255,255,255,0.85)');
  }
  function drawMilk(x) {
    var body = poly(jp([[5, 11], [21, 11], [21, 28], [5, 28]], 0.3), true, false);
    var top = poly(jp([[5, 11], [8.5, 5], [17.5, 5], [21, 11]], 0.3), true, false);
    var fin = poly(jp([[8.5, 5], [8.5, 2.2], [17.5, 2.2], [17.5, 5]], 0.2), true, false);
    fillAll(x, [[fin, '#E9EEF3'], [top, '#E1E8F0'], [body, '#FFFFFF']], 1.6);
    x.fillStyle = '#2F80ED'; x.fillRect(5, 16.5, 16, 6.5);
    x.fillStyle = '#fff'; x.beginPath(); x.moveTo(13, 17.4); x.quadraticCurveTo(16, 21, 13, 22.2); x.quadraticCurveTo(10, 21, 13, 17.4); x.fill();
    x.strokeStyle = 'rgba(0,0,0,0.25)'; x.lineWidth = 0.8; x.stroke(line([13, 5], [13, 11], 0.2));
  }
  function drawMagnet(x) {
    var p = new Path2D(); p.moveTo(8, 5); p.lineTo(8, 15); p.arc(14, 15, 6, Math.PI, 0, true); p.lineTo(20, 5);
    ink(x, p, '#E63B3B', 6.5, 1.8);
    x.strokeStyle = '#E5E5E5'; x.lineWidth = 6.5; x.lineCap = 'butt';
    x.beginPath(); x.moveTo(8, 4.2); x.lineTo(8, 8.4); x.moveTo(20, 4.2); x.lineTo(20, 8.4); x.stroke();
    x.lineCap = 'round';
    dot(x, 11, 20, 1, 'rgba(255,255,255,0.7)');
  }
  function drawChalkShot(x) {
    fillInk(x, poly(jp([[4, 2.2], [17, 2], [20, 4], [17, 6], [4, 5.8], [2.5, 4]], 0.2), true, true), C.white, 1.3);
    x.fillStyle = 'rgba(0,0,0,0.12)'; x.fillRect(5, 4.4, 9, 0.8);
  }
  function drawEraser(x) {
    var all = poly(jp([[4, 4], [26, 4], [26, 16], [4, 16]], 0.3), true, true);
    fillInk(x, all, '#FFFFFF', 1.6);
    x.save(); x.clip(all); x.fillStyle = '#3B7DDD'; x.fillRect(0, 0, 14, 20); x.restore();
    x.strokeStyle = 'rgba(0,0,0,0.5)'; x.lineWidth = 0.9; x.stroke(line([14, 4.5], [14, 15.5], 0.2));
  }
  function drawPostit(x) {
    var body = poly(jp([[4, 4], [26, 4], [26, 20], [20, 26], [4, 26]], 0.3), true, false);
    var fold = poly(jp([[26, 20], [20.5, 20.5], [20, 26]], 0.2), true, false);
    fillAll(x, [[body, '#FFE45C'], [fold, '#D4B23A']], 1.6);
    x.strokeStyle = 'rgba(0,0,0,0.18)'; x.lineWidth = 0.9;
    x.stroke(line([7, 10], [22, 10], 0.3)); x.stroke(line([7, 15], [20, 15], 0.3));
  }
  function drawPlaneShot(x) {
    var up = poly(jp([[24, 8], [2.5, 2.5], [10, 9]], 0.3), true, false);
    var lo = poly(jp([[24, 8], [10, 9], [5, 13.5]], 0.3), true, false);
    fillAll(x, [[up, '#FFFFFF'], [lo, '#CFD2CC']], 1.4);
    dot(x, 15, 6.8, 0.9, C.black);
  }
  function drawSmudge(x) {
    fillInk(x, circ(8, 8.3, 5.4, 5, 0.7, 9), '#8E8E8E', 1.6);
    dot(x, 6, 7, 1.3, '#6E6E6E'); dot(x, 10, 10, 1.1, '#6E6E6E'); dot(x, 9.5, 6, 0.8, '#B5B5B5');
  }
  function drawDust(x) {
    var g = x.createRadialGradient(3, 3, 0, 3, 3, 3);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.55, 'rgba(255,255,255,0.85)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g; x.beginPath(); x.arc(3 + r(0.3), 3 + r(0.3), 3, 0, Math.PI * 2); x.fill();
  }

  // ───────── 아이콘 96×96
  function iconCanvas(fn) {
    var c = mk(96, 96), x = c.getContext('2d');
    fn(x); grain(x, 96, 96, 0.012); return c;
  }
  function rot(x, a) { x.translate(48, 48); x.rotate(a); }
  var ICONS = {
    chalk: function (x) {
      rot(x, -0.6);
      fillInk(x, poly(jp([[-30, -12], [34, -12], [36, 0], [34, 12], [-30, 12], [-37, 4], [-37, -4]], 0.6), true, true), C.white, 3);
      x.strokeStyle = 'rgba(0,0,0,0.12)'; x.lineWidth = 2; x.lineCap = 'round';
      x.stroke(line([-24, 5], [22, 5], 0.6)); x.stroke(line([-20, -5], [8, -5], 0.6));
      x.setTransform(1, 0, 0, 1, 0, 0);
      dot(x, 18, 80, 3, '#fff'); dot(x, 27, 86, 2.2, '#fff'); dot(x, 12, 70, 1.8, '#fff');
    },
    eraser: function (x) {
      rot(x, -0.3);
      var all = poly(jp([[-36, -20], [36, -20], [36, 20], [-36, 20]], 0.6), true, true);
      fillInk(x, all, '#FFFFFF', 3);
      x.save(); x.clip(all); x.fillStyle = '#3B7DDD'; x.fillRect(-40, -24, 38, 48); x.restore();
      x.strokeStyle = 'rgba(0,0,0,0.6)'; x.lineWidth = 2; x.stroke(line([-2, -19], [-2, 19], 0.4));
      x.fillStyle = 'rgba(255,255,255,0.5)'; x.fillRect(-30, -14, 20, 4);
    },
    ruler: function (x) {
      rot(x, -0.55);
      fillInk(x, poly(jp([[-44, -12], [44, -12], [44, 12], [-44, 12]], 0.5), true, false), '#E2B36B', 3);
      x.strokeStyle = '#5A3A12'; x.lineWidth = 2; x.lineCap = 'round';
      for (var i = 0; i < 14; i++) { var tx = -38 + i * 6, L = i % 5 === 0 ? 10 : (i % 2 ? 4 : 6.5); x.beginPath(); x.moveTo(tx, -12); x.lineTo(tx, -12 + L); x.stroke(); }
      x.strokeStyle = 'rgba(120,70,20,0.35)'; x.lineWidth = 1.5; x.stroke(line([-40, 6], [40, 7], 1));
    },
    postit: function (x) {
      var body = poly(jp([[18, 22], [80, 22], [80, 66], [64, 82], [18, 82]], 0.6), true, false);
      var fold = poly(jp([[80, 66], [65, 67], [64, 82]], 0.4), true, false);
      fillAll(x, [[body, '#FFE45C'], [fold, '#D4B23A']], 3);
      x.strokeStyle = 'rgba(0,0,0,0.2)'; x.lineWidth = 2; x.lineCap = 'round';
      x.stroke(line([26, 40], [70, 40], 0.5)); x.stroke(line([26, 52], [66, 52], 0.5));
      // 도화선과 불꽃
      ink(x, poly(jp([[70, 24], [76, 14], [84, 12]], 0.4), false, true), '#7A5A3A', 2.5, 1.5);
      fillInk(x, poly(starPts(86, 10, 8, 3.5), true, false), '#FF8A1F', 1.5);
      dot(x, 86, 10, 2.5, '#FFF2A0');
    },
    shoes: function (x) {
      var sole = poly(jp([[12, 70], [90, 70], [90, 80], [14, 80]], 0.5), true, true);
      var body = poly(jp([[16, 74], [14, 48], [26, 30], [52, 28], [76, 40], [90, 60], [90, 74]], 0.6), true, true);
      fillAll(x, [[sole, '#8E9AA4'], [body, '#FFFFFF']], 3);
      var band = poly(jp([[56, 20], [80, 30], [96, 76], [62, 76]], 0.4), true, false);
      x.save(); x.clip(body); fillInk(x, band, '#3A7BD5', 0); x.restore();
      x.strokeStyle = C.black; x.lineWidth = 3; x.lineCap = 'round'; x.stroke(body);
      fillInk(x, circ(34, 36, 13, 4.5, 0.4, 12), '#5B6670', 1.5);
      x.strokeStyle = 'rgba(0,0,0,0.25)'; x.lineWidth = 2; x.stroke(line([22, 60], [48, 56], 0.5));
      inkAll(x, [line([2, 44], [8, 43], 0.4), line([2, 56], [7, 55.5], 0.4)], C.white, 3, 1.5);
    },
    bag: function (x) {
      var handle = new Path2D(); handle.arc(48, 24, 10, Math.PI, 0);
      ink(x, handle, '#8E2A20', 4, 2.5);
      var body = poly(jp([[24, 24], [72, 24], [78, 34], [76, 84], [20, 84], [18, 34]], 0.7), true, true);
      var flap = poly(jp([[22, 26], [74, 26], [76, 46], [20, 46]], 0.6), true, true);
      var pocket = poly(jp([[32, 58], [64, 58], [64, 78], [32, 78]], 0.5), true, true);
      fillAll(x, [[body, '#E74C3C']], 3);
      fillAll(x, [[flap, '#C0392B'], [pocket, '#F2786A']], 2);
      x.fillStyle = '#FFD43B'; x.fillRect(32, 42, 7, 8); x.fillRect(57, 42, 7, 8);
      x.strokeStyle = C.black; x.lineWidth = 1.5; x.strokeRect(32, 42, 7, 8); x.strokeRect(57, 42, 7, 8);
    },
    clock: function (x) {
      fillAll(x, [[circ(26, 24, 12, 10, 0.5, 10), '#FFD43B'], [circ(70, 24, 12, 10, 0.5, 10), '#FFD43B']], 3);
      inkAll(x, [line([30, 82], [24, 90], 0.4), line([66, 82], [72, 90], 0.4)], '#555', 4, 2);
      fillInk(x, circ(48, 54, 32, 32, 0.8, 16), '#FF4D4D', 3);
      fillInk(x, circ(48, 54, 25, 25, 0.5, 16), '#FFFFFF', 1.5);
      x.fillStyle = C.black;
      for (var i = 0; i < 12; i++) { var t = i / 12 * Math.PI * 2; dot(x, 48 + Math.cos(t) * 20, 54 + Math.sin(t) * 20, i % 3 ? 1.2 : 2.2, C.black); }
      x.strokeStyle = C.black; x.lineCap = 'round'; x.lineWidth = 4;
      x.beginPath(); x.moveTo(48, 54); x.lineTo(48, 38); x.stroke();
      x.lineWidth = 3; x.beginPath(); x.moveTo(48, 54); x.lineTo(60, 60); x.stroke();
      dot(x, 48, 54, 3, C.black);
      inkAll(x, [line([8, 40], [2, 36], 0.3), line([88, 40], [94, 36], 0.3)], C.white, 2.5, 1.2);
    },
    milk: function (x) {
      x.translate(9, 3); x.scale(3, 3); drawMilk(x);
    }
  };

  // ───────── 칠판 타일 512×512 (2배 해상도)
  function makeTile() {
    var T = 512, c = mk(T * S, T * S), x = c.getContext('2d');
    x.scale(S, S);
    x.fillStyle = C.board; x.fillRect(0, 0, T, T);
    function wrap(fn) { for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) { x.save(); x.translate(dx * T, dy * T); fn(); x.restore(); } }
    var i;
    // 지운 자국 얼룩
    for (i = 0; i < 14; i++) {
      (function () {
        var cx = Math.random() * T, cy = Math.random() * T, rr = 40 + Math.random() * 90;
        wrap(function () {
          var g = x.createRadialGradient(cx, cy, 0, cx, cy, rr);
          g.addColorStop(0, 'rgba(255,255,255,0.045)'); g.addColorStop(1, 'rgba(255,255,255,0)');
          x.fillStyle = g; x.beginPath(); x.ellipse(cx, cy, rr * 1.4, rr, 0, 0, Math.PI * 2); x.fill();
        });
      })();
    }
    for (i = 0; i < 9; i++) {
      (function () {
        var cx = Math.random() * T, cy = Math.random() * T, len = 80 + Math.random() * 140, a = r(0.5), pts = [];
        for (var k = 0; k <= 6; k++) pts.push([cx + Math.cos(a) * len * (k / 6 - 0.5) + r(6), cy + Math.sin(a) * len * (k / 6 - 0.5) + Math.sin(k) * 12]);
        var p = poly(pts, false, true), lw = 26 + Math.random() * 30;
        wrap(function () { x.strokeStyle = 'rgba(255,255,255,0.028)'; x.lineWidth = lw; x.lineCap = 'round'; x.stroke(p); });
      })();
    }
    // 아주 옅은 분필 낙서 흔적
    var words = ['1+1=2', '3×4=12', '가나다', 'ㄱㄴㄷ', 'ABC', '5-2=3', '♪', '10÷2'];
    for (i = 0; i < 16; i++) {
      (function (i) {
        var cx = ((i % 4) + 0.2 + Math.random() * 0.6) * T / 4, cy = ((i / 4 | 0) + 0.2 + Math.random() * 0.6) * T / 4;
        var kind = i % 4, ang = r(0.3), al = 0.06 + Math.random() * 0.04, word = words[(Math.random() * words.length) | 0];
        var star = poly(jp(starPts(0, 0, 14, 6), 1), true, false);
        var heart = new Path2D(); heart.moveTo(0, 8); heart.bezierCurveTo(-18, -4, -8, -16, 0, -6); heart.bezierCurveTo(8, -16, 18, -4, 0, 8);
        var smile = circ(0, 0, 14, 14, 1, 12);
        wrap(function () {
          x.translate(cx, cy); x.rotate(ang);
          x.strokeStyle = 'rgba(255,255,255,' + al + ')'; x.fillStyle = x.strokeStyle; x.lineWidth = 2.5; x.lineCap = 'round'; x.lineJoin = 'round';
          if (kind === 0) { x.font = '26px "Gaegu", "Comic Sans MS", sans-serif'; x.textAlign = 'center'; x.fillText(word, 0, 0); }
          else if (kind === 1) x.stroke(star);
          else if (kind === 2) { x.scale(1.2, 1.2); x.stroke(heart); }
          else { x.stroke(smile); x.beginPath(); x.arc(-5, -4, 1.5, 0, 7); x.arc(5, -4, 1.5, 0, 7); x.fill(); x.beginPath(); x.arc(0, 2, 7, 0.2, Math.PI - 0.2); x.stroke(); }
        });
      })(i);
    }
    // 분필 가루 결
    for (i = 0; i < 2600; i++) {
      x.fillStyle = Math.random() < 0.6 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.08)';
      x.fillRect(Math.random() * T, Math.random() * T, 1, 1);
    }
    return c;
  }

  // ───────── 내 낙서 → doodle
  function stampRing(dst, img, rad, n) {
    dst.drawImage(img, 0, 0);
    for (var i = 0; i < n; i++) { var t = i / n * Math.PI * 2; dst.drawImage(img, Math.cos(t) * rad, Math.sin(t) * rad); }
  }
  function tint(cv, color) {
    var x = cv.getContext('2d'); x.globalCompositeOperation = 'source-in'; x.fillStyle = color; x.fillRect(0, 0, cv.width, cv.height); x.globalCompositeOperation = 'source-over'; return cv;
  }
  function setDoodle(src) {
    if (!built) init();
    if (!src) { SPR.doodle = DEF_DOODLE; return; }
    try {
      var sw = src.width, sh = src.height, d = src.getContext('2d').getImageData(0, 0, sw, sh).data;
      var minX = sw, minY = sh, maxX = -1, maxY = -1, cnt = 0;
      for (var y = 0; y < sh; y++) for (var xx = 0; xx < sw; xx++) {
        if (d[(y * sw + xx) * 4 + 3] > 40) { cnt++; if (xx < minX) minX = xx; if (xx > maxX) maxX = xx; if (y < minY) minY = y; if (y > maxY) maxY = y; }
      }
      if (cnt < 25) { SPR.doodle = DEF_DOODLE; return; }
      var bw = maxX - minX + 1, bh = maxY - minY + 1, W = 44 * S, frames = [];
      var fit = Math.min(4, (34 * S) / Math.max(bw, bh));
      for (var f = 0; f < 3; f++) {
        var raw = mk(W, W), rx = raw.getContext('2d');
        rx.translate(W / 2, W / 2); rx.rotate(r(0.08)); var sc = fit * (1 + r(0.04)); rx.scale(sc, sc);
        rx.drawImage(src, minX, minY, bw, bh, -bw / 2, -bh / 2, bw, bh);
        var col = mk(W, W); stampRing(col.getContext('2d'), raw, 2.2, 10); tint(col, C.doodle);
        var blk = mk(W, W), bx = blk.getContext('2d'); stampRing(bx, col, 5.5, 16); stampRing(bx, col, 3, 10); tint(blk, C.black);
        var c = mk(W, W), x = c.getContext('2d');
        x.drawImage(blk, 0, 0); x.drawImage(col, 0, 0);
        x.globalAlpha = 0.3; x.drawImage(tint(stampRingCopy(raw), '#ffffff'), 0.8, -0.8); x.globalAlpha = 1;
        grain(x, W, W);
        frames.push({ canvas: c, w: 44, h: 44 });
      }
      SPR.doodle = frames;
    } catch (e) { SPR.doodle = DEF_DOODLE; }
  }
  function stampRingCopy(img) { var c = mk(img.width, img.height); c.getContext('2d').drawImage(img, 0, 0); return c; }

  function init() {
    if (built) return;
    build('player', 48, 48, drawPlayer, 0.04);
    build('doodle', 44, 44, drawDoodle, 0.05);
    build('worm', 48, 36, drawWorm, 0.03);
    build('redx', 40, 40, drawRedX, 0.04);
    build('number', 44, 48, drawNumber, 0.03);
    build('number_small', 28, 30, drawNumberSmall, 0.04);
    build('plane_boss', 130, 100, drawPlaneBoss, 0.012);
    build('homework_boss', 190, 190, drawHomeworkBoss, 0.012);
    build('xp', 18, 18, drawXP, 0.08);
    build('heal', 26, 30, drawMilk, 0.04);
    build('magnet', 28, 28, drawMagnet, 0.06);
    build('chalk_shot', 22, 8, drawChalkShot, 0.02);
    build('eraser', 30, 20, drawEraser, 0.04);
    build('postit', 30, 30, drawPostit, 0.04);
    build('plane_shot', 26, 16, drawPlaneShot, 0.03);
    build('smudge_shot', 16, 16, drawSmudge, 0.1);
    build('dust', 6, 6, drawDust, 0, true);
    DEF_DOODLE = SPR.doodle;
    for (var k in ICONS) ICON[k] = iconCanvas(ICONS[k]);
    TILE = makeTile();
    built = true;
  }

  window.ART = {
    init: init,
    get: function (id, frame) {
      if (!built) init();
      var s = SPR[id]; if (!s) return null;
      var f = ((frame | 0) % 3 + 3) % 3; return s[f];
    },
    setDoodle: setDoodle,
    drawBackground: function (ctx, camX, camY, viewW, viewH) {
      if (!built) init();
      var T = 512;
      camX = +camX || 0; camY = +camY || 0;
      var ox = -Math.floor(((camX % T) + T) % T), oy = -Math.floor(((camY % T) + T) % T);
      for (var y = oy; y < viewH; y += T) for (var x = ox; x < viewW; x += T) ctx.drawImage(TILE, x, y, T, T);
    },
    icon: function (id) { if (!built) init(); return ICON[id] || null; }
  };
})();
