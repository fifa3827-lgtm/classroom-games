/* 분필 대소동 — game.js (게임 본체)
   ART(window.ART), SFX(window.SFX)가 없거나 오류여도 색 도형·무음으로 돌아간다. */
(function () {
  'use strict';

  // ───────── 기본 값 ─────────
  var FONT = '"Jua", "Gaegu", "Comic Sans MS", system-ui, sans-serif';
  var STEP = 1 / 60, GAME_LEN = 240, TAU = Math.PI * 2;
  var HP_GROW = 200; // 60초부터 일반 적 체력이 늘어남(240초에 1.9배)
  var BOSS_NAMES = ['숙제 괴물', '받아쓰기 대마왕', '구구단 마왕', '일기장 도깨비', '방학숙제 괴물'];

  var Q = {};
  try {
    location.search.replace(/^\?/, '').split('&').forEach(function (p) {
      if (!p) return;
      var kv = p.split('=');
      Q[decodeURIComponent(kv[0])] = decodeURIComponent(kv[1] === undefined ? '1' : kv[1]);
    });
  } catch (e) {}
  var P_MUTE = Q.mute === '1', P_GOD = Q.god === '1', P_FAST = Q.fast === '1';
  var P_T = Math.max(0, parseFloat(Q.t) || 0);

  // ───────── ART / SFX 안전 호출 ─────────
  function hasArt(fn) { return !!(window.ART && typeof window.ART[fn] === 'function'); }
  function artCall(fn, a, b, c, d, e) {
    if (!hasArt(fn)) return null;
    try { return window.ART[fn](a, b, c, d, e); } catch (err) { return null; }
  }
  function sfxCall(fn, a) {
    var S = window.SFX;
    if (!S || typeof S[fn] !== 'function') return;
    try { S[fn](a); } catch (e) {}
  }
  function sfx(name) { sfxCall('play', name); }

  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function lsDel(k) { try { localStorage.removeItem(k); } catch (e) {} }

  artCall('init');
  if (P_MUTE) sfxCall('setMuted', true);

  // ───────── 캔버스 ─────────
  var cv = document.getElementById('c');
  var ctx = cv.getContext('2d');
  var W = 800, H = 600, DPR = 1;
  function resize() {
    DPR = Math.min(2, window.devicePixelRatio || 1);
    W = Math.max(1, window.innerWidth); H = Math.max(1, window.innerHeight);
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
  }
  window.addEventListener('resize', resize);
  resize();

  // ───────── 그림 (캐시 + 대체) ─────────
  var spriteCache = {}, whiteCache = {}, doodleFb = null;
  var hasDoodle = false, doodleArtOK = false;
  var doodleCanvas = document.createElement('canvas');
  doodleCanvas.width = 200; doodleCanvas.height = 200;

  function resetSprites() { spriteCache = {}; whiteCache = {}; doodleFb = null; }

  function makeDoodleFallback() {
    if (doodleFb) return doodleFb;
    var c = document.createElement('canvas'); c.width = 44; c.height = 44;
    var x = c.getContext('2d');
    x.beginPath(); x.arc(22, 22, 19, 0, TAU);
    x.fillStyle = '#FFE066'; x.fill(); x.lineWidth = 3; x.strokeStyle = '#000'; x.stroke();
    var t = document.createElement('canvas'); t.width = 200; t.height = 200;
    var tx = t.getContext('2d');
    tx.drawImage(doodleCanvas, 0, 0);
    tx.globalCompositeOperation = 'source-in';
    tx.fillStyle = '#222'; tx.fillRect(0, 0, 200, 200);
    x.drawImage(t, 5, 5, 34, 34);
    doodleFb = { canvas: c, w: 44, h: 44 };
    return doodleFb;
  }

  function getSprite(id, f) {
    f = ((f % 3) + 3) % 3;
    var key = id + f;
    var s = spriteCache[key];
    if (s !== undefined) return s;
    s = null;
    if (id === 'doodle' && hasDoodle && !doodleArtOK) s = makeDoodleFallback();
    else {
      var r = artCall('get', id, f);
      if (r && r.canvas && r.w > 0 && r.h > 0) s = r;
      else if (id === 'doodle' && hasDoodle) s = makeDoodleFallback();
    }
    spriteCache[key] = s;
    return s;
  }

  function getWhite(s, key) {
    var w = whiteCache[key];
    if (w) return w;
    try {
      w = document.createElement('canvas');
      w.width = s.canvas.width; w.height = s.canvas.height;
      var x = w.getContext('2d');
      x.drawImage(s.canvas, 0, 0);
      x.globalCompositeOperation = 'source-in';
      x.fillStyle = '#fff'; x.fillRect(0, 0, w.width, w.height);
    } catch (e) { w = s.canvas; }
    whiteCache[key] = w;
    return w;
  }

  // 월드 좌표계 기준 그리기 (ctx는 월드 변환 상태)
  function drawSpr(id, f, x, y, col, r, flash, lw) {
    var s = getSprite(id, f);
    if (s) {
      var img = flash > 0 ? getWhite(s, id + (((f % 3) + 3) % 3)) : s.canvas;
      ctx.drawImage(img, x - s.w / 2, y - s.h / 2, s.w, s.h);
      return;
    }
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU);
    ctx.fillStyle = flash > 0 ? '#fff' : col; ctx.fill();
    if (lw) { ctx.lineWidth = lw; ctx.strokeStyle = '#000'; ctx.stroke(); }
  }

  var OX = 0, OY = 0; // 월드→화면 이동량
  function setWorld() { ctx.setTransform(DPR, 0, 0, DPR, OX * DPR, OY * DPR); }
  function drawRot(id, f, x, y, ang, flip, col, fw, fh) {
    var c = Math.cos(ang) * DPR, s = Math.sin(ang) * DPR, fx = flip ? -1 : 1;
    ctx.setTransform(c * fx, s * fx, -s, c, (x + OX) * DPR, (y + OY) * DPR);
    var sp = getSprite(id, f);
    if (sp) ctx.drawImage(sp.canvas, -sp.w / 2, -sp.h / 2, sp.w, sp.h);
    else { ctx.fillStyle = col; ctx.fillRect(-fw / 2, -fh / 2, fw, fh); }
    setWorld();
  }

  // ───────── 상태 ─────────
  var ETYPES = {
    doodle:        { hp: 10,   spd: 60, r: 18, col: '#FFE066' },
    worm:          { hp: 14,   spd: 70, r: 17, col: '#7FDBFF' },
    redx:          { hp: 12,   spd: 50, r: 17, col: '#FF4D4D' },
    number:        { hp: 40,   spd: 45, r: 20, col: '#FF9ECF' },
    number_small:  { hp: 8,    spd: 90, r: 12, col: '#FF9ECF' },
    plane_boss:    { hp: 600,  spd: 80, r: 48, col: '#FFFFFF', boss: 1 },
    homework_boss: { hp: 2000, spd: 55, r: 80, col: '#FFFFFF', boss: 2 }
  };

  var G = {
    screen: 'title', t: 0, kills: 0, level: 1, xp: 0, need: 7, pending: 0,
    bossIdx: 0, spawnT: 0, planeDone: false, swarmDone: false, finalSpawned: false,
    endT: 0, won: false, lost: false, shakeT: 0, shakeAmp: 0, hintT: 0, hurtFlash: 0,
    bannerT: 0, cap: 250, finalBoss: null, planeBoss: null, cardLockT: 0
  };
  var player = { x: 0, y: 0, r: 16, hp: 100, maxHp: 100, inv: 0, face: 1, dx: 1, dy: 0 };
  var lv = {};
  var wt = { chalk: 0, ruler: 0, postit: 0, eraAng: 0 };

  var enemies = [], enemyFree = [];
  var shots = [], shotFree = [];
  var eshots = [], eshotFree = [];
  var picks = [], pickFree = [];
  var bombs = [], booms = [], swings = [];
  var PART_N = 500, parts = [], partIdx = 0;
  for (var pi = 0; pi < PART_N; pi++) parts.push({ alive: false, x: 0, y: 0, vx: 0, vy: 0, life: 0, max: 1 });
  var NUM_N = 40, nums = [], numIdx = 0;
  for (var ni = 0; ni < NUM_N; ni++) nums.push({ alive: false, x: 0, y: 0, v: 0, life: 0 });

  function needFor(n) { return P_FAST ? 1 : 4 + n * 3; }

  // ───────── 64px 칸 충돌 ─────────
  var CELL = 64, grid = new Map(), gridKeys = [], qid = 0, qOut = [];
  function gkey(cx, cy) { return ((cx & 0xffff) << 16) | (cy & 0xffff); }
  function gridBuild() {
    for (var i = 0; i < gridKeys.length; i++) grid.get(gridKeys[i]).length = 0;
    gridKeys.length = 0;
    if (grid.size > 4000) grid.clear();
    for (var j = 0; j < enemies.length; j++) {
      var e = enemies[j];
      if (!e.alive) continue;
      var x0 = Math.floor((e.x - e.r) / CELL), x1 = Math.floor((e.x + e.r) / CELL);
      var y0 = Math.floor((e.y - e.r) / CELL), y1 = Math.floor((e.y + e.r) / CELL);
      for (var cy = y0; cy <= y1; cy++) for (var cx = x0; cx <= x1; cx++) {
        var k = gkey(cx, cy), a = grid.get(k);
        if (!a) { a = []; grid.set(k, a); }
        if (a.length === 0) gridKeys.push(k);
        a.push(e);
      }
    }
  }
  // 결과 배열(qOut)은 다음 query 때 덮어씀. 겹쳐 부르지 말 것.
  function query(x, y, r) {
    qid++; qOut.length = 0;
    var x0 = Math.floor((x - r) / CELL), x1 = Math.floor((x + r) / CELL);
    var y0 = Math.floor((y - r) / CELL), y1 = Math.floor((y + r) / CELL);
    for (var cy = y0; cy <= y1; cy++) for (var cx = x0; cx <= x1; cx++) {
      var a = grid.get(gkey(cx, cy));
      if (!a) continue;
      for (var i = 0; i < a.length; i++) {
        var e = a[i];
        if (e.qid !== qid && e.alive) { e.qid = qid; qOut.push(e); }
      }
    }
    return qOut;
  }
  function separate() {
    for (var i = 0; i < gridKeys.length; i++) {
      var a = grid.get(gridKeys[i]), n = Math.min(a.length, 12);
      for (var p = 0; p < n; p++) {
        var A = a[p];
        if (A.boss) continue;
        for (var q = p + 1; q < n; q++) {
          var B = a[q];
          if (B.boss) continue;
          var dx = B.x - A.x, dy = B.y - A.y, rr = A.r + B.r, d2 = dx * dx + dy * dy;
          if (d2 < rr * rr && d2 > 0.01) {
            var d = Math.sqrt(d2), push = (rr - d) * 0.25 / d;
            A.x -= dx * push; A.y -= dy * push; B.x += dx * push; B.y += dy * push;
          }
        }
      }
    }
  }

  // ───────── 만들기 ─────────
  function newEnemy(type, x, y) {
    var d = ETYPES[type], e = enemyFree.pop() || {};
    e.type = type; e.x = x; e.y = y; e.r = d.r; e.hp = d.boss ? d.hp : Math.round(d.hp * (1 + Math.max(0, Math.min(G.t, GAME_LEN) - 60) / HP_GROW)); e.maxHp = e.hp; e.spd = d.spd;
    e.col = d.col; e.boss = d.boss || 0; e.lw = d.boss ? 6 : 3; e.alive = true; e.flash = 0;
    e.qid = 0; e.eraT = -9; e.seed = Math.random() * 100; e.state = 0;
    e.st = type === 'redx' ? Math.random() * 2 : 0;
    e.vx = 0; e.vy = 0; e.kx = 0; e.ky = 0; e.shotT = 0; e.sumT = 0;
    enemies.push(e);
    return e;
  }
  var tmpP = { x: 0, y: 0 };
  function edgePoint(out) {
    var hw = W / 2 + 60, hh = H / 2 + 60, L = hw * 2, M = hh * 2, r = Math.random() * (L + M) * 2;
    if (r < L) { out.x = player.x - hw + r; out.y = player.y - hh; }
    else if (r < 2 * L) { out.x = player.x - hw + (r - L); out.y = player.y + hh; }
    else if (r < 2 * L + M) { out.x = player.x - hw; out.y = player.y - hh + (r - 2 * L); }
    else { out.x = player.x + hw; out.y = player.y - hh + (r - 2 * L - M); }
    return out;
  }
  function pickType(t) {
    var r = Math.random();
    if (t >= 120) { if (r < 0.15) return 'number'; r = (r - 0.15) / 0.85; }
    if (t >= 60) { if (r < 0.22) return 'redx'; r = (r - 0.22) / 0.78; }
    return r < 0.6 ? 'doodle' : 'worm';
  }
  function spawnInterval(t) {
    var k = Math.min(1, t / 220);
    return Math.max(0.15, 0.9 - 0.75 * Math.pow(k, 1.4));
  }
  function newShot(x, y, ang, dmg, pierce) {
    var s = shotFree.pop() || {};
    s.x = x; s.y = y; s.ang = ang; s.vx = Math.cos(ang) * 460; s.vy = Math.sin(ang) * 460;
    s.life = 1.3; s.dmg = dmg; s.pierce = pierce; s.h1 = null; s.alive = true;
    shots.push(s);
  }
  function newEShot(kind, x, y, ang, spd, dmg) {
    var s = eshotFree.pop() || {};
    s.kind = kind; s.x = x; s.y = y; s.ang = ang; s.vx = Math.cos(ang) * spd; s.vy = Math.sin(ang) * spd;
    s.life = 5; s.dmg = dmg; s.r = 8; s.alive = true;
    eshots.push(s);
  }
  function dropPick(kind, x, y) {
    if (kind === 'xp' && picks.length >= 450) {
      var o = picks[(G.kills * 7) % picks.length];
      if (o && o.kind === 'xp' && o.alive) { o.val++; return; }
    }
    var p = pickFree.pop() || {};
    p.kind = kind; p.x = x; p.y = y; p.val = 1; p.mag = false; p.v = 0; p.alive = true;
    picks.push(p);
  }
  function dust(x, y, n, spdMul) {
    spdMul = spdMul || 1;
    for (var i = 0; i < n; i++) {
      var p = parts[partIdx]; partIdx = (partIdx + 1) % PART_N;
      var a = Math.random() * TAU, sp = (40 + Math.random() * 110) * spdMul;
      p.alive = true; p.x = x; p.y = y; p.vx = Math.cos(a) * sp; p.vy = Math.sin(a) * sp;
      p.max = p.life = 0.4 + Math.random() * 0.35;
    }
  }
  function addNum(x, y, v) {
    var n = nums[numIdx]; numIdx = (numIdx + 1) % NUM_N;
    n.alive = true; n.x = x + (Math.random() * 30 - 15); n.y = y; n.v = Math.round(v); n.life = 0.7;
  }
  function shake(amp, t) {
    if (amp >= G.shakeAmp || G.shakeT <= 0) { G.shakeAmp = amp; }
    G.shakeT = Math.max(G.shakeT, t);
  }

  // ───────── 띠 글씨 ─────────
  var elBanner = document.getElementById('banner');
  function banner(text, sec, big) {
    elBanner.textContent = text;
    elBanner.className = big ? 'big' : '';
    G.bannerT = sec; hc.ban = undefined;
  }

  // ───────── 피해 / 지우기 ─────────
  function hurt(e, dmg, dx, dy) {
    if (!e.alive) return;
    e.hp -= dmg; e.flash = 0.08;
    if (e.boss) { addNum(e.x, e.y - e.r, dmg); shake(1.5, 0.08); }
    else if (dx !== undefined) {
      var l = Math.sqrt(dx * dx + dy * dy) || 1;
      e.kx += dx / l * 120; e.ky += dy / l * 120;
    }
    sfx('hit');
    if (e.hp <= 0) killE(e, true);
  }
  function killE(e, drops) {
    if (!e.alive) return;
    e.alive = false;
    G.kills++;
    dust(e.x, e.y, e.boss ? 40 : 6, e.boss ? 2.5 : 1);
    sfx('erase');
    if (!drops) return;
    if (e.type === 'number') {
      newEnemy('number_small', e.x - 12, e.y);
      newEnemy('number_small', e.x + 12, e.y);
    }
    if (e.boss) {
      for (var i = 0; i < 20; i++) {
        var a = Math.random() * TAU, d = 10 + Math.random() * 50;
        dropPick('xp', e.x + Math.cos(a) * d, e.y + Math.sin(a) * d);
      }
      dropPick('magnet', e.x, e.y);
      if (e === G.planeBoss) G.planeBoss = null;
      if (e === G.finalBoss) winGame();
    } else {
      dropPick('xp', e.x, e.y);
      if (Math.random() < 0.03) dropPick('heal', e.x + 10, e.y);
    }
  }
  function hurtPlayer(dmg) {
    if (G.endT > 0 || player.inv > 0) return;
    player.inv = 0.5;
    if (P_GOD) return;
    player.hp -= dmg;
    G.hurtFlash = 0.25;
    sfx('hurt');
    if (player.hp <= 0) { player.hp = 0; loseGame(); }
  }

  // ───────── 사건(두목·떼) ─────────
  function spawnPlane() {
    G.planeDone = true;
    edgePoint(tmpP);
    G.planeBoss = newEnemy('plane_boss', tmpP.x, tmpP.y);
    banner('종이비행기 대장 등장!', 2.5, false);
    sfx('boss'); shake(3, 0.5);
  }
  function spawnSwarm() {
    G.swarmDone = true;
    var a = Math.random() * TAU, dist = Math.max(W, H) / 2 + 80;
    var bx = player.x + Math.cos(a) * dist, by = player.y + Math.sin(a) * dist;
    var px = -Math.sin(a), py = Math.cos(a);
    for (var i = 0; i < 30; i++) {
      var side = (Math.random() * 2 - 1) * 260, depth = Math.random() * 120;
      newEnemy('doodle', bx + px * side + Math.cos(a) * depth, by + py * side + Math.sin(a) * depth);
    }
    banner('떼 습격!', 2.2, false);
    sfx('boss');
  }
  function spawnFinal() {
    G.finalSpawned = true;
    var d = H / 2 + 110;
    G.finalBoss = newEnemy('homework_boss', player.x, player.y - d);
    banner(BOSS_NAMES[G.bossIdx] + ' 등장!', 3, true);
    sfx('boss'); shake(3, 0.7);
  }

  // ───────── 무기 ─────────
  function cdMul() { return 1 - 0.1 * (lv.clock || 0); }
  var nearBuf = [], nearD = [];
  function nearest(k, range) {
    nearBuf.length = 0; nearD.length = 0;
    var r2 = range * range;
    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      if (!e.alive) continue;
      var dx = e.x - player.x, dy = e.y - player.y, d2 = dx * dx + dy * dy;
      if (d2 > r2) continue;
      if (nearBuf.length < k) { nearBuf.push(e); nearD.push(d2); }
      else {
        var wi = 0;
        for (var j = 1; j < k; j++) if (nearD[j] > nearD[wi]) wi = j;
        if (d2 < nearD[wi]) { nearBuf[wi] = e; nearD[wi] = d2; }
      }
    }
    return nearBuf;
  }

  function updWeapons(dt) {
    // 분필 던지기
    var cl = lv.chalk || 0;
    if (cl > 0) {
      wt.chalk -= dt;
      if (wt.chalk <= 0) {
        // 노리는 거리는 분필이 실제로 닿는 거리(460px/초 × 1.3초 ≈ 598px) 안으로
        var rng = Math.min(Math.max(W, H) * 0.6 + 60, 560);
        var tg = nearest(cl, rng);
        // 첫 발은 최종 두목을 노림(졸개에 막혀 두목전이 안 끝나는 것 방지)
        var fb = G.finalBoss;
        if (tg.length && fb && fb.alive && (fb.x - player.x) * (fb.x - player.x) + (fb.y - player.y) * (fb.y - player.y) < rng * rng) tg[0] = fb;
        if (tg.length) {
          for (var i = 0; i < cl; i++) {
            var e = tg[i % tg.length];
            var ang = Math.atan2(e.y - player.y, e.x - player.x);
            if (i >= tg.length) ang += (i % 2 ? 0.18 : -0.18);
            newShot(player.x, player.y, ang, 10, cl >= 3 ? 1 : 0);
          }
          sfx('shoot');
          wt.chalk = [0, 0.8, 0.7, 0.55][cl] * cdMul();
        } else wt.chalk = 0.1;
      }
    }
    // 지우개 회오리
    var el = lv.eraser || 0;
    if (el > 0) {
      wt.eraAng += dt * 3.4;
      var R = el >= 3 ? 90 : 70;
      for (var k = 0; k < el; k++) {
        var a = wt.eraAng + k * TAU / el;
        var ex = player.x + Math.cos(a) * R, ey = player.y + Math.sin(a) * R;
        var list = query(ex, ey, 15);
        for (var m = 0; m < list.length; m++) {
          var en = list[m], dx = en.x - ex, dy = en.y - ey, rr = en.r + 15;
          if (dx * dx + dy * dy < rr * rr && G.t - en.eraT >= 0.4) {
            en.eraT = G.t;
            hurt(en, 8, en.x - player.x, en.y - player.y);
          }
        }
      }
    }
    // 자 휘두르기
    var rl = lv.ruler || 0;
    if (rl > 0) {
      wt.ruler -= dt;
      if (wt.ruler <= 0) {
        wt.ruler = 1.6 * cdMul();
        var base = Math.atan2(player.dy, player.dx);
        var arc = (rl >= 2 ? 120 : 90) * Math.PI / 180, len = rl >= 2 ? 110 : 90, dmg = rl >= 3 ? 24 : 18;
        swing(base, arc, len, dmg);
        if (rl >= 3) swing(base + Math.PI, arc, len, dmg);
        sfx('shoot');
      }
    }
    // 포스트잇 폭탄
    var pl = lv.postit || 0;
    if (pl > 0) {
      wt.postit -= dt;
      if (wt.postit <= 0) {
        wt.postit = (pl >= 2 ? 2 : 2.5) * cdMul();
        var rad = pl >= 3 ? 100 : 80;
        if (pl >= 3) {
          bombs.push({ x: player.x - 24, y: player.y + 6, fuse: 1, r: rad });
          bombs.push({ x: player.x + 24, y: player.y - 6, fuse: 1, r: rad });
        } else bombs.push({ x: player.x, y: player.y, fuse: 1, r: rad });
      }
    }
  }
  function angDiff(a, b) {
    var d = a - b;
    while (d > Math.PI) d -= TAU;
    while (d < -Math.PI) d += TAU;
    return Math.abs(d);
  }
  function swing(base, arc, len, dmg) {
    swings.push({ ang: base, arc: arc, len: len, t: 0.18 });
    var list = query(player.x, player.y, len);
    var hits = [];
    for (var i = 0; i < list.length; i++) {
      var e = list[i], dx = e.x - player.x, dy = e.y - player.y, d = Math.sqrt(dx * dx + dy * dy);
      if (d > len + e.r) continue;
      var tol = d > 1 ? Math.atan(e.r / d) : Math.PI;
      if (angDiff(Math.atan2(dy, dx), base) <= arc / 2 + tol) hits.push(e);
    }
    for (var j = 0; j < hits.length; j++) hurt(hits[j], dmg, hits[j].x - player.x, hits[j].y - player.y);
  }

  // ───────── 한 걸음 (1/60초) ─────────
  var keys = {};
  var joy = { on: false, id: -1, bx: 0, by: 0, x: 0, y: 0 };

  function step(dt) {
    G.t += dt;
    var ending = G.endT > 0;

    // 분필이 이동
    if (!G.lost) {
      var mx = 0, my = 0;
      if (keys.KeyD || keys.ArrowRight) mx += 1;
      if (keys.KeyA || keys.ArrowLeft) mx -= 1;
      if (keys.KeyS || keys.ArrowDown) my += 1;
      if (keys.KeyW || keys.ArrowUp) my -= 1;
      if (mx || my) { var ml = Math.sqrt(mx * mx + my * my); mx /= ml; my /= ml; }
      else if (joy.on) {
        var jx = joy.x - joy.bx, jy = joy.y - joy.by, jl = Math.sqrt(jx * jx + jy * jy);
        if (jl > 8) { var s = Math.min(1, jl / 60); mx = jx / jl * s; my = jy / jl * s; }
      }
      var spd = 150 * (1 + 0.12 * (lv.shoes || 0));
      player.x += mx * spd * dt; player.y += my * spd * dt;
      if (mx || my) {
        var l2 = Math.sqrt(mx * mx + my * my);
        player.dx = mx / l2; player.dy = my / l2;
        if (Math.abs(mx) > 0.05) player.face = mx > 0 ? 1 : -1;
      }
    }
    if (player.inv > 0) player.inv -= dt;

    // 출현
    if (!ending) {
      if (G.t < GAME_LEN) {
        G.spawnT -= dt;
        while (G.spawnT <= 0) {
          G.spawnT += spawnInterval(G.t);
          var grp = G.t < 140 ? 1 : (G.t < 200 ? 2 : 3);
          for (var gi = 0; gi < grp && enemies.length < G.cap; gi++) { edgePoint(tmpP); newEnemy(pickType(G.t), tmpP.x, tmpP.y); }
        }
      }
      if (!G.planeDone && G.t >= 120) spawnPlane();
      if (!G.swarmDone && G.t >= 180) spawnSwarm();
      if (!G.finalSpawned && G.t >= GAME_LEN) spawnFinal();
    }

    // 적 움직임
    var far = Math.max(W, H) * 0.9 + 300;
    for (var i = 0, n = enemies.length; i < n; i++) {
      var e = enemies[i];
      if (!e.alive) continue;
      if (e.flash > 0) e.flash -= dt;
      var dx = player.x - e.x, dy = player.y - e.y, d = Math.sqrt(dx * dx + dy * dy) || 1;
      var ux = dx / d, uy = dy / d, sp = e.spd, vx = ux * sp, vy = uy * sp;
      if (G.lost) { vx *= 0.3; vy *= 0.3; }
      switch (e.type) {
        case 'worm':
          var wv = Math.sin(G.t * 4 + e.seed) * sp * 0.9;
          vx += -uy * wv; vy += ux * wv;
          break;
        case 'redx':
          e.st += dt;
          if (e.state === 0) { if (e.st >= 4) { e.state = 1; e.st = 0; } }
          else if (e.state === 1) { vx = 0; vy = 0; e.vx = ux; e.vy = uy; if (e.st >= 1) { e.state = 2; e.st = 0; } }
          else { vx = e.vx * 320; vy = e.vy * 320; if (e.st >= 0.6) { e.state = 0; e.st = 0; } }
          break;
        case 'plane_boss':
          e.shotT += dt;
          if (e.shotT >= 3 && !ending) {
            e.shotT = 0;
            var a0 = Math.atan2(dy, dx);
            for (var k = -2; k <= 2; k++) newEShot('plane_shot', e.x, e.y, a0 + k * 0.26, 170, 8);
          }
          break;
        case 'homework_boss':
          e.shotT += dt; e.sumT += dt;
          if (e.shotT >= 2 && !ending) {
            e.shotT = 0;
            var a1 = Math.atan2(dy, dx);
            for (var k2 = -1; k2 <= 1; k2++) newEShot('smudge_shot', e.x, e.y, a1 + k2 * 0.3, 170, 8);
          }
          if (e.sumT >= 7 && !ending) {
            e.sumT = 0;
            if (enemies.length < 320) {
              for (var k3 = 0; k3 < 6; k3++) {
                var a2 = k3 * TAU / 6;
                newEnemy('doodle', e.x + Math.cos(a2) * (e.r + 30), e.y + Math.sin(a2) * (e.r + 30));
              }
            }
          }
          break;
      }
      e.x += (vx + e.kx) * dt; e.y += (vy + e.ky) * dt;
      e.kx *= 0.85; e.ky *= 0.85;
      if (d > far) { edgePoint(tmpP); e.x = tmpP.x; e.y = tmpP.y; }
    }

    gridBuild();
    separate();

    if (!G.lost) updWeapons(dt);

    // 분필 투사체
    for (var si = 0; si < shots.length; si++) {
      var s1 = shots[si];
      if (!s1.alive) continue;
      s1.x += s1.vx * dt; s1.y += s1.vy * dt; s1.life -= dt;
      if (s1.life <= 0) { s1.alive = false; continue; }
      var hl = query(s1.x, s1.y, 6);
      for (var h = 0; h < hl.length; h++) {
        var he = hl[h];
        if (he === s1.h1) continue;
        var hx = he.x - s1.x, hy = he.y - s1.y, hr = he.r + 6;
        if (hx * hx + hy * hy < hr * hr) {
          hurt(he, s1.dmg, s1.vx, s1.vy);
          s1.h1 = he;
          if (--s1.pierce < 0) { s1.alive = false; break; }
        }
      }
    }
    // 적 투사체
    for (var ei = 0; ei < eshots.length; ei++) {
      var es = eshots[ei];
      if (!es.alive) continue;
      es.x += es.vx * dt; es.y += es.vy * dt; es.life -= dt;
      if (es.life <= 0) { es.alive = false; continue; }
      var ex = es.x - player.x, ey = es.y - player.y, er = es.r + player.r - 2;
      if (ex * ex + ey * ey < er * er && !G.lost) { es.alive = false; hurtPlayer(es.dmg); }
    }
    // 포스트잇 폭탄
    for (var bi = bombs.length - 1; bi >= 0; bi--) {
      var b = bombs[bi];
      b.fuse -= dt;
      if (b.fuse <= 0) {
        bombs.splice(bi, 1);
        booms.push({ x: b.x, y: b.y, r: b.r, t: 0.3 });
        dust(b.x, b.y, 14, 2);
        sfx('bomb');
        var bl = query(b.x, b.y, b.r), bh = [];
        for (var bj = 0; bj < bl.length; bj++) {
          var be = bl[bj], bx = be.x - b.x, by = be.y - b.y, brr = b.r + be.r;
          if (bx * bx + by * by < brr * brr) bh.push(be);
        }
        for (var bk = 0; bk < bh.length; bk++) hurt(bh[bk], 30, bh[bk].x - b.x, bh[bk].y - b.y);
      }
    }
    for (var oi = booms.length - 1; oi >= 0; oi--) { booms[oi].t -= dt; if (booms[oi].t <= 0) booms.splice(oi, 1); }
    for (var wi = swings.length - 1; wi >= 0; wi--) { swings[wi].t -= dt; if (swings[wi].t <= 0) swings.splice(wi, 1); }

    // 줍기
    if (!G.lost) {
      for (var pk = 0; pk < picks.length; pk++) {
        var p = picks[pk];
        if (!p.alive) continue;
        var px = player.x - p.x, py = player.y - p.y, pd2 = px * px + py * py;
        if (p.mag || pd2 < 70 * 70) {
          p.v = Math.min(p.v + 1100 * dt, 800);
          var pd = Math.sqrt(pd2) || 1, mv = Math.min(pd, p.v * dt);
          p.x += px / pd * mv; p.y += py / pd * mv;
          pd2 = (player.x - p.x) * (player.x - p.x) + (player.y - p.y) * (player.y - p.y);
        }
        if (pd2 < (player.r + 12) * (player.r + 12)) { p.alive = false; collect(p); }
      }
    }

    // 닿기 피해
    if (!G.lost && !ending) {
      var cl = query(player.x, player.y, player.r);
      for (var ci = 0; ci < cl.length; ci++) {
        var ce = cl[ci], cx = ce.x - player.x, cy = ce.y - player.y, crr = ce.r + player.r - 4;
        if (cx * cx + cy * cy < crr * crr) { hurtPlayer(ce.boss ? 15 : 5); break; }
      }
    }

    // 입자·숫자
    for (var q = 0; q < PART_N; q++) {
      var pa = parts[q];
      if (!pa.alive) continue;
      pa.life -= dt;
      if (pa.life <= 0) { pa.alive = false; continue; }
      pa.x += pa.vx * dt; pa.y += pa.vy * dt; pa.vx *= 0.93; pa.vy *= 0.93;
    }
    for (var nq = 0; nq < NUM_N; nq++) {
      var nu = nums[nq];
      if (!nu.alive) continue;
      nu.life -= dt; nu.y -= 40 * dt;
      if (nu.life <= 0) nu.alive = false;
    }

    // 정리 (죽은 것 재사용 목록으로)
    compact(enemies, enemyFree);
    compact(shots, shotFree);
    compact(eshots, eshotFree);
    compact(picks, pickFree);

    // 타이머
    if (G.shakeT > 0) G.shakeT -= dt;
    if (G.hintT > 0) G.hintT -= dt;
    if (G.hurtFlash > 0) G.hurtFlash -= dt;
    if (G.bannerT > 0) G.bannerT -= dt;
    if (G.endT > 0) { G.endT -= dt; if (G.endT <= 0) showResult(); }
  }
  function compact(arr, free) {
    var j = 0;
    for (var i = 0; i < arr.length; i++) {
      var o = arr[i];
      if (o.alive) arr[j++] = o; else free.push(o);
    }
    arr.length = j;
  }
  function collect(p) {
    if (p.kind === 'xp') {
      G.xp += p.val;
      sfx('pickup');
      while (G.xp >= G.need) { G.xp -= G.need; G.level++; G.need = needFor(G.level); G.pending++; }
    } else if (p.kind === 'heal') {
      player.hp = Math.min(player.maxHp, player.hp + 25);
      sfx('heal');
    } else if (p.kind === 'magnet') {
      for (var i = 0; i < picks.length; i++) if (picks[i].kind === 'xp') picks[i].mag = true;
      sfx('magnet');
    }
  }

  // ───────── 그리기 ─────────
  var titleT = 0;
  function drawBg(camX, camY, shx, shy) {
    ctx.setTransform(DPR, 0, 0, DPR, shx * DPR, shy * DPR);
    var ok = false;
    if (hasArt('drawBackground')) {
      try { ctx.save(); window.ART.drawBackground(ctx, camX, camY, W, H); ok = true; } catch (e) { ok = false; }
      try { ctx.restore(); } catch (e2) {}
      ctx.setTransform(DPR, 0, 0, DPR, shx * DPR, shy * DPR);
    }
    if (ok) return;
    ctx.fillStyle = '#1F3D2B';
    ctx.fillRect(-10, -10, W + 20, H + 20);
    ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 2;
    ctx.beginPath();
    var g = 128, x0 = -(((camX % g) + g) % g), y0 = -(((camY % g) + g) % g);
    for (var x = x0; x < W; x += g) { ctx.moveTo(x, 0); ctx.lineTo(x, H); }
    for (var y = y0; y < H; y += g) { ctx.moveTo(0, y); ctx.lineTo(W, y); }
    ctx.stroke();
  }

  function render() {
    if (G.screen === 'title' || G.screen === 'draw') {
      drawBg(titleT * 25, titleT * 12, 0, 0);
      return;
    }
    var shx = 0, shy = 0;
    if (G.shakeT > 0 && G.screen === 'play') {
      shx = (Math.random() * 2 - 1) * G.shakeAmp; shy = (Math.random() * 2 - 1) * G.shakeAmp;
    }
    var camX = player.x - W / 2, camY = player.y - H / 2;
    drawBg(camX, camY, shx, shy);
    OX = -camX + shx; OY = -camY + shy;
    setWorld();
    var vx0 = camX - 110, vx1 = camX + W + 110, vy0 = camY - 110, vy1 = camY + H + 110;
    var af = (G.t * 6) | 0;
    var i;

    // 줍는 것
    for (i = 0; i < picks.length; i++) {
      var p = picks[i];
      if (p.x < vx0 || p.x > vx1 || p.y < vy0 || p.y > vy1) continue;
      if (p.kind === 'xp') drawSpr('xp', af, p.x, p.y, '#FFD700', p.val > 1 ? 9 : 7, 0, 0);
      else if (p.kind === 'heal') drawSpr('heal', af, p.x, p.y, '#ffffff', 12, 0, 2);
      else drawSpr('magnet', af, p.x, p.y, '#FF4D4D', 13, 0, 2);
    }
    // 포스트잇·폭발
    for (i = 0; i < bombs.length; i++) {
      var b = bombs[i];
      if (b.fuse < 0.35 && ((G.t * 16) | 0) % 2) continue;
      drawRot('postit', af, b.x, b.y, 0.15, false, '#FFE066', 26, 26);
    }
    for (i = 0; i < booms.length; i++) {
      var bo = booms[i], k = 1 - bo.t / 0.3;
      ctx.globalAlpha = Math.max(0, 1 - k);
      ctx.beginPath(); ctx.arc(bo.x, bo.y, bo.r * (0.4 + 0.6 * k), 0, TAU);
      ctx.fillStyle = 'rgba(255,224,102,0.35)'; ctx.fill();
      ctx.lineWidth = 6; ctx.strokeStyle = '#fff'; ctx.stroke();
      ctx.globalAlpha = 1;
    }
    // 적 (졸개 먼저, 두목은 나중에 그려 위에 보이게)
    for (var pass = 0; pass < 2; pass++)
    for (i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      if (!e.alive || (e.boss ? 1 : 0) !== pass || e.x + e.r < vx0 || e.x - e.r > vx1 || e.y + e.r < vy0 || e.y - e.r > vy1) continue;
      if (e.type === 'redx' && e.state === 1 && ((G.t * 14) | 0) % 2) ctx.globalAlpha = 0.45;
      drawSpr(e.type, af + ((e.seed * 3) | 0), e.x, e.y, e.col, e.r, e.flash, e.lw);
      ctx.globalAlpha = 1;
    }
    // 자 휘두르기
    for (i = 0; i < swings.length; i++) {
      var sw = swings[i];
      ctx.globalAlpha = Math.max(0, sw.t / 0.18) * 0.55;
      ctx.beginPath(); ctx.moveTo(player.x, player.y);
      ctx.arc(player.x, player.y, sw.len, sw.ang - sw.arc / 2, sw.ang + sw.arc / 2);
      ctx.closePath(); ctx.fillStyle = '#F5D27A'; ctx.fill();
      ctx.globalAlpha = 1;
    }
    // 지우개
    var erl = lv.eraser || 0;
    if (erl > 0 && !G.lost) {
      var R = erl >= 3 ? 90 : 70;
      for (i = 0; i < erl; i++) {
        var a = wt.eraAng + i * TAU / erl;
        drawRot('eraser', af, player.x + Math.cos(a) * R, player.y + Math.sin(a) * R, a + Math.PI / 2, false, '#FF9ECF', 28, 18);
      }
    }
    // 투사체
    for (i = 0; i < shots.length; i++) {
      var s = shots[i];
      if (s.x < vx0 || s.x > vx1 || s.y < vy0 || s.y > vy1) continue;
      drawRot('chalk_shot', 0, s.x, s.y, s.ang, false, '#ffffff', 20, 7);
    }
    for (i = 0; i < eshots.length; i++) {
      var es = eshots[i];
      if (es.x < vx0 || es.x > vx1 || es.y < vy0 || es.y > vy1) continue;
      if (es.kind === 'plane_shot') drawRot('plane_shot', af, es.x, es.y, es.ang, false, '#eeeeee', 24, 12);
      else drawSpr('smudge_shot', af, es.x, es.y, '#888888', 8, 0, 2);
    }
    // 분필 가루
    var dsp = getSprite('dust', 0);
    ctx.fillStyle = '#fff';
    for (i = 0; i < PART_N; i++) {
      var pa = parts[i];
      if (!pa.alive || pa.x < vx0 || pa.x > vx1 || pa.y < vy0 || pa.y > vy1) continue;
      ctx.globalAlpha = pa.life / pa.max;
      if (dsp) ctx.drawImage(dsp.canvas, pa.x - 3, pa.y - 3, 6, 6);
      else ctx.fillRect(pa.x - 2.5, pa.y - 2.5, 5, 5);
    }
    ctx.globalAlpha = 1;
    // 분필이 (맨 위)
    if (!G.lost) {
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath(); ctx.ellipse(player.x, player.y + 20, 15, 5, 0, 0, TAU); ctx.fill();
      // 흰 후광(노란 낙서 무리 속에서도 분필이가 보이게)
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.beginPath(); ctx.arc(player.x, player.y, 26, 0, TAU); ctx.fill();
      // 무적 깜빡임은 사라지지 않고 반투명으로(무리 속에서도 내 위치가 보이게)
      if (player.inv > 0 && ((G.t * 20) | 0) % 2) ctx.globalAlpha = 0.45;
      {
        var ps = getSprite('player', af);
        if (ps) drawRot('player', af, player.x, player.y, 0, player.face < 0, '#fff', 0, 0);
        else {
          ctx.beginPath(); ctx.arc(player.x, player.y, player.r, 0, TAU);
          ctx.fillStyle = '#fff'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = '#000'; ctx.stroke();
          ctx.fillStyle = '#000';
          ctx.fillRect(player.x + player.face * 4 - 2, player.y - 5, 4, 5);
        }
      }
      ctx.globalAlpha = 1;
    }
    // 두목 피해 숫자
    ctx.font = 'bold 33px ' + FONT; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.lineWidth = 6; ctx.strokeStyle = '#000'; ctx.fillStyle = '#FFFFFF';
    for (i = 0; i < NUM_N; i++) {
      var nu = nums[i];
      if (!nu.alive) continue;
      ctx.globalAlpha = Math.min(1, nu.life / 0.3);
      ctx.strokeText(nu.v, nu.x, nu.y); ctx.fillText(nu.v, nu.x, nu.y);
    }
    ctx.globalAlpha = 1;

    // ── 화면 좌표 ──
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    if (joy.on && G.screen === 'play') {
      ctx.globalAlpha = 0.35;
      ctx.beginPath(); ctx.arc(joy.bx, joy.by, 60, 0, TAU);
      ctx.lineWidth = 4; ctx.strokeStyle = '#fff'; ctx.stroke();
      var jx = joy.x - joy.bx, jy = joy.y - joy.by, jl = Math.sqrt(jx * jx + jy * jy);
      if (jl > 60) { jx = jx / jl * 60; jy = jy / jl * 60; }
      ctx.beginPath(); ctx.arc(joy.bx + jx, joy.by + jy, 26, 0, TAU);
      ctx.fillStyle = '#fff'; ctx.fill();
      ctx.globalAlpha = 1;
    }
    var bossE = G.finalBoss && G.finalBoss.alive ? G.finalBoss : (G.planeBoss && G.planeBoss.alive ? G.planeBoss : null);
    if (bossE) {
      var bw = Math.min(W - 40, 520), bx = (W - bw) / 2, by = H - 46;
      ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(bx, by, bw, 22);
      ctx.fillStyle = '#FF4D4D'; ctx.fillRect(bx, by, bw * Math.max(0, bossE.hp / bossE.maxHp), 22);
      ctx.lineWidth = 3; ctx.strokeStyle = '#fff'; ctx.strokeRect(bx, by, bw, 22);
      ctx.font = '24px ' + FONT; ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
      ctx.lineWidth = 4; ctx.strokeStyle = '#000';
      var bn = bossE === G.finalBoss ? BOSS_NAMES[G.bossIdx] : '종이비행기 대장';
      ctx.strokeText(bn, W / 2, by - 4); ctx.fillText(bn, W / 2, by - 4);
    }
    if (G.hurtFlash > 0) {
      ctx.globalAlpha = Math.min(1, G.hurtFlash / 0.25) * 0.5;
      ctx.lineWidth = 30; ctx.strokeStyle = '#FF4D4D';
      ctx.strokeRect(0, 0, W, H);
      ctx.globalAlpha = 1;
    }
  }

  // ───────── HUD ─────────
  function $(id) { return document.getElementById(id); }
  var el = {
    hud: $('hud'), hpFill: $('hpFill'), hpText: $('hpText'), timeText: $('timeText'),
    lvFill: $('lvFill'), lvText: $('lvText'), killText: $('killText'), hint: $('hint'),
    title: $('title'), draw: $('draw'), pause: $('pause'), levelup: $('levelup'), result: $('result'),
    cards: $('cards'), resTitle: $('resTitle'), resStats: $('resStats'), bestLine: $('bestLine'),
    btnBoss: $('btnBoss'), btnDraw: $('btnDraw')
  };
  var hc = {};
  function setText(node, key, v) { if (hc[key] !== v) { hc[key] = v; node.textContent = v; } }
  function setW(node, key, f) {
    var v = Math.round(Math.max(0, Math.min(1, f)) * 1000) / 10;
    if (hc[key] !== v) { hc[key] = v; node.style.width = v + '%'; }
  }
  function setHidden(node, key, hide) { if (hc[key] !== hide) { hc[key] = hide; node.classList.toggle('hidden', hide); } }
  function fmt(sec) { sec = Math.max(0, Math.floor(sec)); var m = (sec / 60) | 0, s = sec % 60; return m + ':' + (s < 10 ? '0' : '') + s; }
  function fmtKo(sec) { sec = Math.max(0, Math.floor(sec)); var m = (sec / 60) | 0, s = sec % 60; return (m ? m + '분 ' : '') + s + '초'; }

  function updateHud() {
    var inGame = G.screen === 'play' || G.screen === 'pause' || G.screen === 'levelup';
    setHidden(el.hud, 'hud', !inGame);
    setHidden(el.hint, 'hint', !(G.screen === 'play' && G.hintT > 0));
    setHidden(elBanner, 'ban', !(G.screen === 'play' && G.bannerT > 0));
    if (!inGame) return;
    setW(el.hpFill, 'hpw', player.hp / player.maxHp);
    setText(el.hpText, 'hpt', '❤ ' + Math.ceil(player.hp) + ' / ' + player.maxHp);
    setText(el.timeText, 'tt', G.t < GAME_LEN ? '남은 시간 ' + fmt(GAME_LEN - G.t) : '두목을 지워라!');
    setW(el.lvFill, 'lvw', G.xp / G.need);
    setText(el.lvText, 'lvt', '⭐ 레벨 ' + G.level);
    setText(el.killText, 'kt', '지운 낙서 ' + G.kills);
  }

  // ───────── 화면 전환 ─────────
  var SCREENS = ['title', 'draw', 'pause', 'levelup', 'result'];
  function show(name) {
    G.screen = name;
    for (var i = 0; i < SCREENS.length; i++) el[SCREENS[i]].classList.toggle('hidden', SCREENS[i] !== name);
    joy.on = false; keys = {};
  }

  function readBest() {
    var b = null;
    try { b = JSON.parse(lsGet('chalk_best') || 'null'); } catch (e) { b = null; }
    if (!b || typeof b.time !== 'number') b = { time: 0, won: false };
    return b;
  }
  function refreshTitle() {
    el.btnBoss.textContent = '두목: ' + BOSS_NAMES[G.bossIdx] + ' 🔄';
    el.btnDraw.textContent = hasDoodle ? '✏️ 내 낙서 고치기 ✔' : '✏️ 내 낙서 그리기';
    var b = readBest();
    el.bestLine.textContent = b.time > 0 ? '최고 기록: ' + fmtKo(b.time) + ' 버팀' + (b.won ? ' · 👑 두목 지움!' : '') : '최고 기록: 아직 없어요';
  }

  function clearAll() {
    var i;
    for (i = 0; i < enemies.length; i++) { enemies[i].alive = false; enemyFree.push(enemies[i]); }
    enemies.length = 0;
    for (i = 0; i < shots.length; i++) shotFree.push(shots[i]);
    shots.length = 0;
    for (i = 0; i < eshots.length; i++) eshotFree.push(eshots[i]);
    eshots.length = 0;
    for (i = 0; i < picks.length; i++) pickFree.push(picks[i]);
    picks.length = 0;
    bombs.length = 0; booms.length = 0; swings.length = 0;
    for (i = 0; i < PART_N; i++) parts[i].alive = false;
    for (i = 0; i < NUM_N; i++) nums[i].alive = false;
  }

  var isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
  var playTime = 0;

  function startGame() {
    clearAll();
    player.x = 0; player.y = 0; player.hp = 100; player.maxHp = 100; player.inv = 0;
    player.face = 1; player.dx = 1; player.dy = 0;
    lv = { chalk: 1, eraser: 0, ruler: 0, postit: 0, shoes: 0, bag: 0, clock: 0 };
    wt.chalk = 0.3; wt.ruler = 0; wt.postit = 0; wt.eraAng = 0;
    G.t = P_T; G.kills = 0; G.level = 1; G.xp = 0; G.need = needFor(1); G.pending = 0;
    G.spawnT = 0.5; G.planeDone = P_T > 120; G.swarmDone = P_T > 180; G.finalSpawned = false;
    G.endT = 0; G.won = false; G.lost = false; G.shakeT = 0; G.hurtFlash = 0; G.bannerT = 0;
    G.finalBoss = null; G.planeBoss = null;
    G.hintT = 4;
    el.hint.textContent = isTouch ? '끌어서 움직여요!' : 'WASD로 움직여요!';
    playTime = 0;
    show('play');
    sfxCall('music', true);
  }

  function pauseGame() {
    if (G.screen !== 'play') return;
    show('pause');
    sfxCall('music', false);
  }
  function resumeGame() {
    if (G.screen !== 'pause') return;
    show('play');
    sfxCall('music', true);
  }

  function winGame() {
    if (G.endT > 0) return;
    G.won = true; G.endT = 1.6;
    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      if (e.alive && e !== G.finalBoss) { e.alive = false; dust(e.x, e.y, 3); }
    }
    for (var j = 0; j < eshots.length; j++) eshots[j].alive = false;
    banner('낙서를 다 지웠다!', 1.6, true);
    sfxCall('music', false);
    sfx('win');
    shake(3, 0.5);
  }
  function loseGame() {
    if (G.endT > 0) return;
    G.lost = true; G.endT = 1.3;
    dust(player.x, player.y, 30, 1.8);
    sfxCall('music', false);
    sfx('lose');
  }

  function showResult() {
    var win = G.won;
    var b = readBest(), isNew = false;
    if (G.t > b.time) { b.time = G.t; isNew = true; }
    if (win) b.won = true;
    lsSet('chalk_best', JSON.stringify(b));
    el.resTitle.textContent = win ? '낙서를 다 지웠다!' : '분필이 부러졌다…';
    el.resStats.innerHTML = '';
    var lines = [
      '버틴 시간: ' + fmtKo(G.t),
      '지운 낙서: ' + G.kills + '개',
      '레벨: ' + G.level,
      '두목: ' + BOSS_NAMES[G.bossIdx]
    ];
    for (var i = 0; i < lines.length; i++) {
      var d = document.createElement('div'); d.textContent = lines[i]; el.resStats.appendChild(d);
    }
    if (isNew) {
      var nb = document.createElement('div'); nb.textContent = '🎉 새 기록!';
      nb.style.cssText = 'color:#FFD700;font-size:1.3em;font-weight:bold';
      el.resStats.insertBefore(nb, el.resStats.firstChild);
    }
    show('result');
    sfxCall('music', false);
  }

  // ───────── 레벨 업 카드 ─────────
  var CARD = {
    chalk:  { nm: '분필 던지기', emo: '🖍️', ds: ['가까운 낙서에 분필 휙!', '분필 2발!', '분필 3발, 뚫고 간다!'] },
    eraser: { nm: '지우개 회오리', emo: '🧽', ds: ['몸 둘레를 빙글빙글!', '지우개 2개!', '지우개 3개, 더 넓게!'] },
    ruler:  { nm: '자 휘두르기', emo: '📏', ds: ['앞쪽을 착! 휘둘러요', '더 넓고 길게!', '앞뒤로 두 번, 더 세게!'] },
    postit: { nm: '포스트잇 폭탄', emo: '🟨', ds: ['발밑에 펑!', '더 자주 펑!', '2개씩, 더 크게 펑!'] },
    shoes:  { nm: '실내화', emo: '👟', ds: ['더 빨리 달려요!', '더 빨리 달려요!', '더 빨리 달려요!'] },
    bag:    { nm: '책가방', emo: '🎒', ds: ['최대 체력 +25!', '최대 체력 +25!', '최대 체력 +25!'] },
    clock:  { nm: '시계', emo: '⏰', ds: ['무기가 더 자주!', '무기가 더 자주!', '무기가 더 자주!'] },
    milk:   { nm: '우유 팩', emo: '🥛', ds: ['체력 30 회복!'] }
  };
  var ORDER = ['chalk', 'eraser', 'ruler', 'postit', 'shoes', 'bag', 'clock'];
  var curCards = [];

  function iconNode(id) {
    var box = document.createElement('div'); box.className = 'ic';
    var c = artCall('icon', id);
    var src = c && c.canvas ? c.canvas : c;
    if (src && src.width > 0 && typeof src.getContext === 'function') {
      try {
        var cc = document.createElement('canvas'); cc.width = 96; cc.height = 96;
        cc.getContext('2d').drawImage(src, 0, 0, 96, 96);
        box.appendChild(cc);
        return box;
      } catch (e) {}
    }
    box.textContent = CARD[id].emo;
    return box;
  }

  function openLevelUp() {
    var pool = [];
    for (var i = 0; i < ORDER.length; i++) if ((lv[ORDER[i]] || 0) < 3) pool.push(ORDER[i]);
    for (var j = pool.length - 1; j > 0; j--) { var r = (Math.random() * (j + 1)) | 0, tmp = pool[j]; pool[j] = pool[r]; pool[r] = tmp; }
    curCards = pool.length ? pool.slice(0, 3) : ['milk'];
    el.cards.innerHTML = '';
    curCards.forEach(function (id, idx) {
      var cur = lv[id] || 0, info = CARD[id];
      var btn = document.createElement('button'); btn.className = 'card';
      btn.appendChild(iconNode(id));
      var tx = document.createElement('div'); tx.className = 'tx';
      var nm = document.createElement('div'); nm.className = 'nm'; nm.textContent = info.nm;
      var ds = document.createElement('div'); ds.className = 'ds'; ds.textContent = id === 'milk' ? info.ds[0] : info.ds[cur];
      var st = document.createElement('div'); st.className = 'st';
      st.textContent = id === 'milk' ? '' : (cur === 0 ? '✨ 새로!' : '★★★'.slice(0, cur + 1) + '☆☆☆'.slice(0, 2 - cur));
      tx.appendChild(nm); tx.appendChild(ds); tx.appendChild(st);
      btn.appendChild(tx);
      btn.addEventListener('click', function () { pickCard(idx); });
      el.cards.appendChild(btn);
    });
    G.cardLockT = performance.now() + 350;
    show('levelup');
    sfx('levelup');
    shake(3, 0.3);
  }
  function pickCard(idx) {
    if (G.screen !== 'levelup' || performance.now() < G.cardLockT) return;
    var id = curCards[idx];
    if (!id) return;
    sfx('click');
    if (id === 'milk') player.hp = Math.min(player.maxHp, player.hp + 30);
    else {
      lv[id] = Math.min(3, (lv[id] || 0) + 1);
      if (id === 'bag') { player.maxHp += 25; player.hp = Math.min(player.maxHp, player.hp + 25); }
    }
    G.pending--;
    player.inv = Math.max(player.inv, 0.5);
    if (G.pending > 0) openLevelUp();
    else show('play');
  }

  // ───────── 낙서 그리기 ─────────
  var dcv = document.getElementById('drawCv'), dctx = dcv.getContext('2d');
  var drawing = { on: false, id: -1, lx: 0, ly: 0, any: false };
  function dPos(ev) {
    var r = dcv.getBoundingClientRect();
    return { x: (ev.clientX - r.left) * 200 / r.width, y: (ev.clientY - r.top) * 200 / r.height };
  }
  function dStyle() { dctx.strokeStyle = '#fff'; dctx.fillStyle = '#fff'; dctx.lineWidth = 6; dctx.lineCap = 'round'; dctx.lineJoin = 'round'; }
  dcv.addEventListener('pointerdown', function (ev) {
    ev.preventDefault();
    try { dcv.setPointerCapture(ev.pointerId); } catch (e) {}
    var p = dPos(ev);
    drawing.on = true; drawing.id = ev.pointerId; drawing.lx = p.x; drawing.ly = p.y; drawing.any = true;
    dStyle(); dctx.beginPath(); dctx.arc(p.x, p.y, 3, 0, TAU); dctx.fill();
  });
  dcv.addEventListener('pointermove', function (ev) {
    if (!drawing.on || ev.pointerId !== drawing.id) return;
    var p = dPos(ev);
    dStyle(); dctx.beginPath(); dctx.moveTo(drawing.lx, drawing.ly); dctx.lineTo(p.x, p.y); dctx.stroke();
    drawing.lx = p.x; drawing.ly = p.y;
  });
  function dEnd(ev) { if (ev.pointerId === drawing.id) drawing.on = false; }
  dcv.addEventListener('pointerup', dEnd);
  dcv.addEventListener('pointercancel', dEnd);

  function applyDoodle(src) {
    hasDoodle = !!src;
    doodleArtOK = false;
    if (src) {
      var x = doodleCanvas.getContext('2d');
      x.clearRect(0, 0, 200, 200);
      x.drawImage(src, 0, 0, 200, 200);
    }
    if (hasArt('setDoodle')) {
      try { window.ART.setDoodle(src ? doodleCanvas : null); doodleArtOK = true; } catch (e) { doodleArtOK = false; }
    }
    resetSprites();
  }
  function openDraw() {
    dctx.clearRect(0, 0, 200, 200);
    if (hasDoodle) dctx.drawImage(doodleCanvas, 0, 0);
    drawing.any = hasDoodle; drawing.on = false;
    show('draw');
  }

  // 저장된 낙서 불러오기
  (function () {
    var url = lsGet('chalk_doodle');
    if (!url || url.indexOf('data:image') !== 0) return;
    var img = new Image();
    img.onload = function () {
      try {
        var t = document.createElement('canvas'); t.width = 200; t.height = 200;
        t.getContext('2d').drawImage(img, 0, 0, 200, 200);
        applyDoodle(t);
        refreshTitle();
      } catch (e) {}
    };
    img.onerror = function () {};
    img.src = url;
  })();

  // ───────── 성적표 PNG ─────────
  function saveCard() {
    try {
      var c = document.createElement('canvas'); c.width = 600; c.height = 400;
      var x = c.getContext('2d');
      x.fillStyle = '#1F3D2B'; x.fillRect(0, 0, 600, 400);
      if (hasArt('drawBackground')) {
        try { x.save(); window.ART.drawBackground(x, 0, 0, 600, 400); } catch (e) {}
        try { x.restore(); } catch (e2) {}
        x.setTransform(1, 0, 0, 1, 0, 0);
      }
      x.lineWidth = 16; x.strokeStyle = '#8B5A2B'; x.strokeRect(8, 8, 584, 384);
      x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = '#fff';
      x.font = '40px ' + FONT;
      x.fillText('분필 대소동 성적표', 300, 58);
      x.font = '30px ' + FONT; x.textAlign = 'left';
      x.fillStyle = G.won ? '#FFE066' : '#FF9ECF';
      x.fillText(G.won ? '낙서를 다 지웠다!' : '분필이 부러졌다…', 40, 120);
      x.fillStyle = '#fff'; x.font = '26px ' + FONT;
      x.fillText('버틴 시간: ' + fmtKo(G.t), 40, 175);
      x.fillText('지운 낙서: ' + G.kills + '개', 40, 220);
      x.fillText('레벨: ' + G.level, 40, 265);
      x.fillText('두목: ' + BOSS_NAMES[G.bossIdx], 40, 310);
      // 내 낙서
      var cx = 470, cy = 215;
      x.beginPath(); x.arc(cx, cy, 82, 0, TAU);
      x.fillStyle = 'rgba(0,0,0,0.25)'; x.fill();
      x.setLineDash([8, 6]); x.lineWidth = 3; x.strokeStyle = 'rgba(255,255,255,0.7)'; x.stroke(); x.setLineDash([]);
      if (hasDoodle) x.drawImage(doodleCanvas, cx - 75, cy - 75, 150, 150);
      else {
        var s = getSprite('doodle', 0);
        if (s) x.drawImage(s.canvas, cx - 66, cy - 66, 132, 132);
        else {
          x.beginPath(); x.arc(cx, cy, 60, 0, TAU); x.fillStyle = '#FFE066'; x.fill();
          x.lineWidth = 5; x.strokeStyle = '#000'; x.stroke();
        }
      }
      x.textAlign = 'center'; x.font = '20px ' + FONT; x.fillStyle = '#fff';
      x.fillText('내 낙서', cx, cy + 102);
      var d = new Date();
      x.textAlign = 'right'; x.font = '20px ' + FONT;
      x.fillText(d.getFullYear() + '. ' + (d.getMonth() + 1) + '. ' + d.getDate() + '.', 570, 365);
      var name = '분필대소동_성적표.png';
      var go = function (href, revoke) {
        var a = document.createElement('a');
        a.href = href; a.download = name; a.style.display = 'none';
        document.body.appendChild(a); a.click();
        setTimeout(function () { try { document.body.removeChild(a); if (revoke) URL.revokeObjectURL(href); } catch (e) {} }, 1500);
      };
      if (c.toBlob && window.URL && URL.createObjectURL) {
        c.toBlob(function (blob) {
          try { if (blob) go(URL.createObjectURL(blob), true); else go(c.toDataURL('image/png'), false); } catch (e) {}
        }, 'image/png');
      } else go(c.toDataURL('image/png'), false);
    } catch (e) {}
  }

  // ───────── 입력 ─────────
  function wakeSound() {
    sfxCall('init');
    if (P_MUTE) sfxCall('setMuted', true);
  }
  document.addEventListener('pointerdown', wakeSound, true);
  document.addEventListener('keydown', wakeSound, true);
  document.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  document.addEventListener('selectstart', function (e) { e.preventDefault(); });
  document.addEventListener('dblclick', function (e) { e.preventDefault(); });
  document.addEventListener('gesturestart', function (e) { e.preventDefault(); });

  var GAME_KEYS = { KeyW: 1, KeyA: 1, KeyS: 1, KeyD: 1, ArrowUp: 1, ArrowDown: 1, ArrowLeft: 1, ArrowRight: 1, Space: 1 };
  window.addEventListener('keydown', function (e) {
    if (e.code === 'Escape' || e.code === 'KeyP') {
      if (G.screen === 'play') pauseGame(); else if (G.screen === 'pause') resumeGame();
      e.preventDefault();
      return;
    }
    if (G.screen === 'play' && GAME_KEYS[e.code]) { keys[e.code] = true; e.preventDefault(); }
  });
  window.addEventListener('keyup', function (e) { keys[e.code] = false; });
  window.addEventListener('blur', function () { keys = {}; joy.on = false; });

  cv.addEventListener('pointerdown', function (e) {
    if (G.screen !== 'play' || joy.on) return;
    e.preventDefault();
    try { cv.setPointerCapture(e.pointerId); } catch (er) {}
    joy.on = true; joy.id = e.pointerId; joy.bx = joy.x = e.clientX; joy.by = joy.y = e.clientY;
  });
  cv.addEventListener('pointermove', function (e) {
    if (!joy.on || e.pointerId !== joy.id) return;
    joy.x = e.clientX; joy.y = e.clientY;
  });
  function joyEnd(e) { if (e.pointerId === joy.id) { joy.on = false; joy.id = -1; } }
  cv.addEventListener('pointerup', joyEnd);
  cv.addEventListener('pointercancel', joyEnd);

  document.addEventListener('visibilitychange', function () { if (document.hidden) pauseGame(); });

  function onBtn(id, fn) {
    $(id).addEventListener('click', function (e) { e.preventDefault(); fn(); });
  }
  onBtn('btnStart', function () { sfx('click'); startGame(); });
  onBtn('btnDraw', function () { sfx('click'); openDraw(); });
  onBtn('btnBoss', function () { sfx('click'); G.bossIdx = (G.bossIdx + 1) % BOSS_NAMES.length; refreshTitle(); });
  onBtn('btnClear', function () { sfx('click'); dctx.clearRect(0, 0, 200, 200); drawing.any = false; });
  onBtn('btnDone', function () {
    sfx('click');
    if (drawing.any) {
      applyDoodle(dcv);
      try { lsSet('chalk_doodle', doodleCanvas.toDataURL('image/png')); } catch (e) {}
    } else {
      applyDoodle(null);
      lsDel('chalk_doodle');
    }
    refreshTitle(); show('title');
  });
  onBtn('btnDefault', function () {
    sfx('click');
    applyDoodle(null);
    lsDel('chalk_doodle');
    refreshTitle(); show('title');
  });
  onBtn('btnPause', function () { sfx('click'); pauseGame(); });
  onBtn('btnResume', function () { sfx('click'); resumeGame(); });
  onBtn('btnHome', function () { sfx('click'); sfxCall('music', false); clearAll(); refreshTitle(); show('title'); });
  onBtn('btnHome2', function () { sfx('click'); clearAll(); refreshTitle(); show('title'); });
  onBtn('btnAgain', function () { sfx('click'); startGame(); });
  onBtn('btnCard', function () { sfx('click'); saveCard(); });

  // ───────── 돌리기 ─────────
  // avgFrame: 한 프레임 계산·그리기에 실제로 걸린 시간(ms). 화면 주기(30Hz 기기, 숨은 창)와 무관
  var last = 0, acc = 0, avgFrame = 2;
  function frame(now) {
    requestAnimationFrame(frame);
    var w0 = performance.now();
    var dt = last ? (now - last) / 1000 : 0;
    last = now;
    if (dt > 0.25) dt = 0.25;
    if (dt < 0) dt = 0;
    titleT += dt;
    var playing = G.screen === 'play';
    if (playing) {
      playTime += dt;
      if (playTime > 3 && avgFrame > 12 && G.cap > 150) G.cap = 150;
      acc += dt;
      var n = 0;
      while (acc >= STEP && n < 5) {
        step(STEP); acc -= STEP; n++;
        if (G.screen !== 'play' || G.pending > 0) break;
      }
      if (n >= 5) acc = 0;
      if (G.pending > 0 && G.screen === 'play' && G.endT <= 0) { acc = 0; openLevelUp(); }
    } else acc = 0;
    render();
    updateHud();
    if (playing) avgFrame = avgFrame * 0.95 + (performance.now() - w0) * 0.05;
  }

  // ───────── 시험용 창 ─────────
  window.__game = {
    get time() { return G.t; },
    get enemies() { var c = 0; for (var i = 0; i < enemies.length; i++) if (enemies[i].alive) c++; return c; },
    get level() { return G.level; },
    get hp() { return player.hp; },
    get maxHp() { return player.maxHp; },
    get screen() { return G.screen; },
    get frameMs() { return Math.round(avgFrame * 10) / 10; },
    get kills() { return G.kills; },
    get enemyCap() { return G.cap; },
    get weapons() { return JSON.parse(JSON.stringify(lv)); },
    get world() { return { player: player, enemies: enemies, picks: picks }; },
    get boss() { var b = G.finalBoss || G.planeBoss; return b && b.alive ? { type: b.type, hp: b.hp, maxHp: b.maxHp } : null; },
    start: function () { startGame(); },
    pick: function (i) { G.cardLockT = 0; pickCard(i || 0); },
    pause: pauseGame,
    resume: resumeGame,
    // 시험용: 게임 시간을 sec초만큼 바로 진행(레벨 업 카드는 자동으로 첫 장)
    advance: function (sec) {
      var n = Math.round((sec || 1) * 60);
      for (var i = 0; i < n; i++) {
        if (G.screen === 'levelup') { G.cardLockT = 0; pickCard(0); }
        if (G.screen !== 'play') break;
        step(STEP);
        if (G.pending > 0 && G.screen === 'play' && G.endT <= 0) openLevelUp();
      }
      render(); updateHud();
      return G.screen;
    }
  };

  refreshTitle();
  show('title');
  requestAnimationFrame(frame);
})();
