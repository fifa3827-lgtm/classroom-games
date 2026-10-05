// 4단계: 화학 실험실
// 흐름: 화이트보드 「시약장 = 네 시료의 불꽃 색, 원자 번호가 작은 것부터」
//       분젠 버너 켜기 → 시료 4개를 불꽃에 대기(3D 실험) → 주기율표의 원자 번호(Li3 Na11 K19 Cu29)
//       시약장 색 자물쇠 빨·노·보·초 → 탄산수소나트륨 + 증류수 = 염기성 용액
//       흄 후드 속 강산 비커를 중화(빨강→초록) → 작은 열쇠 → 실험대 서랍 → 자외선 램프
//       빈 실험 노트에 자외선 → 「O · C · N · H」 → 원자 번호 8671 → 출입문 키패드 → 탈출
const SW = ['#e53935', '#fdd835', '#43a047', '#1e88e5', '#8e44ad', '#fafafa'];
const COLOR_ANSWER = ['#e53935', '#fdd835', '#8e44ad', '#43a047'];

export default {
  title: '화학 실험실',
  intro: '형광등이 웅웅거리는 실험실.\n플라스크마다 색색의 용액이 빛나고, 출입문은 키패드로 잠겨 있다.\n\n<i>실험 기구는 직접 써 볼 수 있습니다.\n안전 수칙을 잊지 마세요.</i>',
  outro: '삑— 문이 열리고 차가운 복도 공기가 들어온다.\n복도 끝 창문 너머로, 바다 위 등대 하나가 보인다.\n불이 꺼진 채로…',
  env: .3, exposure: .8, bloom: .35,
  start: { pos: [0, 1.6, 2.3], look: [0, 1.2, -3] },

  items: {
    soda: { name: '탄산수소나트륨', desc: '하얀 가루가 든 병. 라벨: 「약한 염기 · 물에 녹여 쓰시오」', model: (K, g) => { K.lathe([[0, 0], [.05, 0], [.05, .1], [.035, .12], [0, .12]], K.MAT.glass(0xe8f0f4, .45), { parent: g }); K.cyl(.045, .045, .06, K.MAT.plain(0xf4f4f0, .9), { parent: g, at: [0, .03, 0] }); K.cyl(.038, .038, .02, K.MAT.plain(0x1a5aa0, .5), { parent: g, at: [0, .13, 0] }); } },
    water: { name: '증류수', desc: '맑은 증류수가 든 세척병.', model: (K, g) => { K.lathe([[0, 0], [.045, 0], [.045, .14], [.02, .16], [0, .16]], K.MAT.plain(0xdfeef4, .3, 0, { transparent: true, opacity: .75 }), { parent: g }); K.cyl(.006, .006, .08, K.MAT.plain(0xffffff, .4), { parent: g, at: [.02, .19, 0], rot: [0, 0, -.6] }); } },
    baseSol: { name: '염기성 용액', desc: '탄산수소나트륨을 증류수에 녹였다. 산을 중화할 수 있다.', model: (K, g) => flaskModel(K, g, 0x7ac8ff) },
    labKey: { name: '작은 은색 열쇠', desc: '중화된 비커에서 건진 열쇠. 실험대 서랍 열쇠 같다.', model: (K, g) => { const m = K.MAT.silver(); K.torus(.03, .008, m, { parent: g, at: [-.07, 0, 0] }); K.box(.1, .012, .006, m, { parent: g, at: [0, 0, 0] }); K.box(.012, .025, .006, m, { parent: g, at: [.04, -.015, 0] }); } },
    uv: { name: '자외선 램프', desc: '보랏빛 자외선을 내는 손전등. 보이지 않는 잉크를 빛나게 한다.', model: (K, g) => uvModel(K, g) },
  },
  combos: [['soda', 'water', 'baseSol']],

  hints: [
    { when: s => !s.burner && !s.cabinet, text: ['북쪽 화이트보드에 시약장 자물쇠 이야기가 있어요.', '불꽃 색을 보려면 실험대의 분젠 버너부터 켜야 해요.', '실험대 위 분젠 버너를 눌러 불을 붙이세요.'] },
    { when: s => !s.cabinet, text: ['시료 네 개를 하나씩 눌러 불꽃에 대 보세요. 원자 번호는 동쪽 벽 주기율표에 있어요.', '리튬 3, 나트륨 11, 칼륨 19, 구리 29. 번호가 작은 것부터 불꽃 색을 차례로.', '시약장 자물쇠: 빨강 · 노랑 · 보라 · 초록.'] },
    { when: (s, g) => !g.has('baseSol') && !s.neutral, text: ['시약장에서 꺼낸 두 가지를 섞어 보세요.', '가방에서 탄산수소나트륨과 증류수를 차례로 눌러 조합하세요.'] },
    { when: s => !s.neutral, text: ['흄 후드 안 비커 바닥에 열쇠가 있어요. 강한 산이라 손을 넣을 수 없어요.', '산은 염기로 중화해요. 후드 옆 지시약 표를 보세요.', '염기성 용액을 고르고 산성 비커를 누르세요.'] },
    { when: (s, g) => !g.has('labKey') && !s.drawer, text: ['중화된 비커를 다시 눌러 열쇠를 꺼내세요.'] },
    { when: s => !s.drawer, text: ['작은 열쇠는 실험대 앞쪽 서랍에 맞아요. 열쇠를 고르고 서랍을 누르세요.'] },
    { when: (s, g) => !g.has('uv') && !s.uv, text: ['열린 서랍 안 자외선 램프를 집으세요.'] },
    { when: s => !s.uv, text: ['실험대 위 빈 실험 노트, 정말 비어 있을까요?', '보이지 않는 잉크는 자외선을 받으면 빛나요.', '자외선 램프를 고르고 실험 노트를 누르세요.'] },
    { text: ['노트에는 「O · C · N · H」. 각 원소의 원자 번호를 차례로.', '주기율표에서 O=8, C=6, N=7, H=1.', '출입문 옆 키패드에 8671.'] },
  ],

  build(K) {
    const { THREE, MAT, s } = K;
    const W = 7, D = 6, H = 3;
    K.room({ w: W, d: D, h: H, floor: MAT.tiles('#c9cfd2', '#8d969c', 8), wall: MAT.plaster('#d9dedb'), ceil: MAT.plaster('#e8eae8'), trim: MAT.plain(0x2a6a6a, .5) });
    // 벽 아래쪽 흰 타일 + 청록 띠
    for (const [len, at, ry] of [[W, [0, .7, -D / 2 + .02], 0], [W, [0, .7, D / 2 - .02], Math.PI], [D, [-W / 2 + .02, .7, 0], Math.PI / 2], [D, [W / 2 - .02, .7, 0], -Math.PI / 2]]) {
      K.box(len, 1.4, .03, MAT.tiles('#f1f4f3', '#e0e8e7', 8, [len / 1.4, 1]), { at, rot: [0, ry, 0] });
      K.box(len, .06, .045, MAT.plain(0x2a8a8a, .4), { at: [at[0], 1.43, at[2]], rot: [0, ry, 0] });
    }

    // ---------- 빛 ----------
    K.scene.add(new THREE.HemisphereLight(0xdfe8f0, 0x5a5e66, .55));
    for (const [x, z] of [[-1.3, -.4], [1.3, .6]]) {
      K.box(1.3, .04, .6, MAT.metal('#c8ccd0', { rough: .4 }), { at: [x, H - .02, z] });
      K.box(1.2, .01, .5, MAT.glow(0xf2f8ff, 2.2), { at: [x, H - .045, z], shadow: false });
    }
    K.point(0xf2f6ff, 5, 11, { at: [-1.3, H - .35, -.4], shadow: true });
    K.point(0xf2f6ff, 3.5, 10, { at: [1.3, H - .35, .6] });

    // ---------- 북쪽: 출입문, 키패드, 화이트보드 ----------
    K.plane(1.0, 2.15, MAT.glow(0x2a3238, .5), { at: [1.8, 1.075, -D / 2 + .015] });
    const door = K.door({ w: 1.0, h: 2.15, mat: MAT.metal('#c3cbcf', { rough: .45, metal: .4 }), frameMat: MAT.metal('#7a8488', { rough: .5 }), at: [1.8, 0, -D / 2 + .1] });
    K.text(['비상구'], .5, .17, { at: [1.8, 2.45, -D / 2 + .02], bg: '#14904a', color: '#ffffff', size: .6, emissive: 1.2 });
    const pad = K.group({ at: [2.6, 1.3, -D / 2 + .02] });
    K.box(.2, .3, .04, MAT.metal('#3a3e44', { rough: .4 }), { parent: pad, at: [0, 0, .02] });
    K.picture(.15, .19, (c, w, h) => {
      c.fillStyle = '#16181a'; c.fillRect(0, 0, w, h);
      c.fillStyle = '#e8e8e0'; c.font = "700 70px 'Noto Sans KR', sans-serif"; c.textAlign = 'center'; c.textBaseline = 'middle';
      ['1', '2', '3', '4', '5', '6', '7', '8', '9', '⟲', '0', '✓'].forEach((k, i) => c.fillText(k, w * (.18 + (i % 3) * .32), h * (.14 + Math.floor(i / 3) * .24)));
    }, { parent: pad, at: [0, -.03, .041] });
    const padLamp = MAT.glow(0xff3020, 1.5);
    K.box(.12, .03, .005, padLamp, { parent: pad, at: [0, .11, .042] });
    K.zone('keypad', { pos: [2.4, 1.45, -1.9], look: [2.5, 1.25, -3], fov: 50 });
    K.hot(pad, {
      name: '문 키패드', zone: 'keypad', click: g => {
        if (s.exit) return;
        g.lock({ title: '출입문 키패드', text: '네 자리 비밀번호.', type: 'pad', answer: '8671', onSolve: async g => {
          s.exit = true; padLamp.color.setHex(0x30ff70); padLamp.emissive.setHex(0x30ff70); g.sound.play('beep');
          await g.wait(.4); g.sound.play('open');
          await g.tween(door.pivot.rotation, { y: -1.4 }, 1.4); g.win();
        } });
      }
    });
    K.hot(door, { name: '출입문', click: g => { g.sound.play('thud'); g.say('잠겨 있다. 옆의 키패드로 열어야 한다.'); } });
    // 화이트보드
    const board = K.group({ at: [-1.2, 1.6, -D / 2 + .03] });
    K.box(1.9, 1.1, .03, MAT.metal('#b8bcc0', { rough: .3 }), { parent: board });
    K.box(1.9, .04, .1, MAT.metal('#b8bcc0', { rough: .3 }), { parent: board, at: [0, -.57, .05] });
    let boardURL = '';
    K.picture(1.82, 1.02, (c, w, h) => {
      c.fillStyle = '#f6f8f8'; c.fillRect(0, 0, w, h);
      c.textAlign = 'left'; c.textBaseline = 'middle';
      c.fillStyle = '#1a3a9a'; c.font = "700 92px 'Noto Sans KR', sans-serif"; c.fillText('시약장 자물쇠', 70, h * .16);
      c.strokeStyle = '#c81e1e'; c.lineWidth = 8; c.beginPath(); c.moveTo(70, h * .25); c.lineTo(640, h * .25); c.stroke();
      c.fillStyle = '#1a1a1a'; c.font = "700 74px 'Noto Sans KR', sans-serif";
      c.fillText('= 네 시료의 불꽃 색', 70, h * .42);
      c.fillText('원자 번호가 작은 것부터!', 70, h * .58);
      c.fillStyle = '#1a6a2a'; c.font = "700 64px 'Noto Sans KR', sans-serif"; c.fillText('Li ? Na ? K ? Cu ?', 70, h * .76);
      c.fillStyle = '#c81e1e'; c.font = "700 50px 'Noto Sans KR', sans-serif"; c.fillText('※ 강산은 반드시 후드 안에서', 70, h * .92);
      c.strokeStyle = '#1a3a9a'; c.lineWidth = 6; c.beginPath(); c.moveTo(w * .8, h * .3); c.lineTo(w * .8, h * .45); c.lineTo(w * .72, h * .78); c.lineTo(w * .94, h * .78); c.lineTo(w * .86, h * .45); c.lineTo(w * .86, h * .3); c.stroke();
      c.strokeStyle = '#e07a1a'; c.beginPath(); c.moveTo(w * .76, h * .64); c.lineTo(w * .9, h * .64); c.stroke();
      boardURL = c.canvas.toDataURL();
    }, { parent: board, at: [0, 0, .016], res: 1400 });
    for (const [x, col] of [[-.4, 0x1a3a9a], [-.3, 0xc81e1e], [-.2, 0x1a6a2a]]) K.cyl(.01, .01, .12, MAT.plain(col, .5), { parent: board, at: [x, -.55, .07], rot: [0, 0, Math.PI / 2] });
    K.zone('board', { pos: [-1.2, 1.6, -1.4], look: [-1.2, 1.55, -3], fov: 50 });
    K.hot(board, { name: '화이트보드', goto: 'board', click: g => g.note('화이트보드', `<img src="${boardURL}" style="width:100%;display:block">`) });

    // ---------- 동쪽: 주기율표와 시약장 ----------
    let ptURL = '';
    const poster = K.picture(1.7, 1.0, (c, w, h) => drawPeriodic(c, w, h, u => ptURL = u), { at: [W / 2 - .02, 1.98, -.6], rot: [0, -Math.PI / 2, 0], res: 1600 });
    K.zone('poster', { pos: [2.0, 1.9, -.6], look: [3.5, 1.95, -.6], fov: 52 });
    K.hot(poster, { name: '주기율표', goto: 'poster', click: g => g.note('원소 주기율표', `<img src="${ptURL}" style="width:100%;display:block">`) });

    const cab = K.group({ at: [W / 2 - .25, 0, 1.45], rot: [0, -Math.PI / 2, 0] });
    const cabMat = MAT.wood('#e8e0d0', [1, 1]), alu = MAT.metal('#a8b0b4', { rough: .35 });
    K.box(1.1, 1.0, .45, cabMat, { parent: cab, at: [0, .5, 0] });
    for (const x of [-.275, .275]) { K.box(.53, .9, .01, MAT.wood('#d8ccb8'), { parent: cab, at: [x, .5, .23] }); K.box(.02, .14, .02, alu, { parent: cab, at: [x + (x < 0 ? .22 : -.22), .55, .245] }); }
    K.box(1.1, .02, .45, cabMat, { parent: cab, at: [0, 1.88, 0] });
    K.box(1.1, .88, .02, cabMat, { parent: cab, at: [0, 1.44, -.215] });
    for (const x of [-.54, .54]) K.box(.02, .88, .45, cabMat, { parent: cab, at: [x, 1.44, 0] });
    K.box(1.06, .015, .42, cabMat, { parent: cab, at: [0, 1.43, 0] });
    K.text(['시약장'], .3, .08, { parent: cab, at: [0, 1.95, .2], bg: '#2a6a6a', color: '#fff', size: .65 });
    K.box(.32, .1, .03, cabMat, { parent: cab, at: [0, 1.95, .21] });
    // 안쪽 병들
    const r = K.rng(5);
    for (let i = 0; i < 7; i++) { const x = -.45 + i * .15; if (i === 3 || i === 4) continue; const c = [0x8a5a1a, 0x2a5a9a, 0x6a2a2a, 0x3a7a4a][i % 4]; K.lathe([[0, 0], [.04, 0], [.04, .14], [.015, .17], [.015, .2], [0, .2]], MAT.glass(c, .7), { parent: cab, at: [x, 1.44, -.05 + r() * .1] }); }
    for (let i = 0; i < 5; i++) K.lathe([[0, 0], [.035, 0], [.035, .12], [.012, .15], [0, .15]], MAT.glass([0x9a6a2a, 0x3a3a3a, 0xc8d8e0][i % 3], .7), { parent: cab, at: [-.4 + i * .2, 1.01, 0] });
    const sodaMesh = K.group({ parent: cab, at: [.05, 1.44, 0] });
    K.lathe([[0, 0], [.05, 0], [.05, .1], [.035, .12], [0, .12]], MAT.glass(0xe8f0f4, .45), { parent: sodaMesh }); K.cyl(.045, .045, .06, MAT.plain(0xf4f4f0, .9), { parent: sodaMesh, at: [0, .03, 0] }); K.cyl(.038, .038, .02, MAT.plain(0x1a5aa0, .5), { parent: sodaMesh, at: [0, .13, 0] });
    K.text(['NaHCO₃'], .08, .03, { parent: sodaMesh, at: [0, .08, .052], bg: '#ffffff', color: '#1a3a7a', size: .6 });
    const waterMesh = K.group({ parent: cab, at: [.2, 1.44, 0] });
    K.lathe([[0, 0], [.045, 0], [.045, .14], [.02, .16], [0, .16]], MAT.plain(0xdfeef4, .3, 0, { transparent: true, opacity: .75 }), { parent: waterMesh });
    K.text(['증류수'], .07, .03, { parent: waterMesh, at: [0, .07, .047], bg: '#ffffff', color: '#1a3a7a', size: .6 });
    // 유리문 두 짝 + 색 자물쇠
    const doors = [-1, 1].map(sx => {
      const p = K.group({ parent: cab, at: [sx * .55, 1.44, .235] });
      const lx = -sx * .275;
      for (const y of [-.43, .43]) K.box(.55, .03, .02, alu, { parent: p, at: [lx, y, 0] });
      for (const x of [lx - .26, lx + .26]) K.box(.03, .88, .02, alu, { parent: p, at: [x, 0, 0] });
      const gl = K.plane(.5, .83, MAT.glass(0xcfe4ea, .18), { parent: p, at: [lx, 0, 0] }); gl.userData.noRay = true;
      return p;
    });
    const lockPlate = K.group({ parent: doors[1], at: [-.47, 0, .02] });
    K.box(.1, .26, .02, alu, { parent: lockPlate });
    ['#43a047', '#1e88e5', '#e53935', '#fafafa'].forEach((c, i) => K.cyl(.02, .02, .015, MAT.plain(c, .4), { parent: lockPlate, at: [0, .09 - i * .06, .015], rot: [Math.PI / 2, 0, 0] }));
    K.zone('cabinet', { pos: [2.0, 1.5, 1.45], look: [3.3, 1.35, 1.45], fov: 52 });
    K.hot(cab, {
      name: '시약장', zone: 'cabinet', click: g => {
        if (s.cabinet) return;
        g.lock({ title: '시약장 색 자물쇠', text: '네 바퀴를 색으로 맞추세요.', type: 'colors', symbols: SW, answer: COLOR_ANSWER, onSolve: async g => {
          s.cabinet = true; g.sound.play('open');
          g.tween(doors[0].rotation, { y: -1.8 }, .9); await g.tween(doors[1].rotation, { y: 1.8 }, .9);
          sodaMesh.visible = false; waterMesh.visible = false;
          g.give('soda', true); g.give('water', true); g.sound.play('pickup');
          g.say('시약장에서 「탄산수소나트륨」과 「증류수」를 꺼냈다.');
        } });
      }
    });
    // 지시약 표 (서쪽 벽)
    K.picture(.9, .5, (c, w, h) => {
      c.fillStyle = '#ffffff'; c.fillRect(0, 0, w, h);
      c.fillStyle = '#1a1a1a'; c.font = "700 52px 'Noto Sans KR', sans-serif"; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText('만능 지시약의 색', w / 2, h * .13);
      const cols = ['#d4202a', '#e8562a', '#f08a24', '#f4c21e', '#e4e22a', '#9ccf2e', '#3cae3a', '#2a9a6a', '#2a8aa8', '#2a5ab0', '#3a3aa8', '#5a2aa0', '#6a1a8a', '#4a1a6a'];
      const cw = (w - 80) / 14;
      cols.forEach((col, i) => { c.fillStyle = col; c.fillRect(40 + i * cw, h * .3, cw - 4, h * .3); c.fillStyle = '#222'; c.font = "700 30px 'Noto Sans KR', sans-serif"; c.fillText(String(i + 1), 40 + i * cw + cw / 2, h * .68); });
      c.font = "700 40px 'Noto Sans KR', sans-serif"; c.fillStyle = '#b01a1a'; c.fillText('산성', w * .2, h * .86); c.fillStyle = '#1a8a2a'; c.fillText('중성 = 안전', w * .5, h * .86); c.fillStyle = '#4a1a8a'; c.fillText('염기성', w * .82, h * .86);
    }, { at: [-W / 2 + .02, 1.8, 1.0], rot: [0, Math.PI / 2, 0], res: 1024 });

    // ---------- 서쪽: 흄 후드와 강산 비커 ----------
    const hood = K.group({ at: [-W / 2 + .4, 0, -.3], rot: [0, Math.PI / 2, 0] });
    const hoodMat = MAT.metal('#d8dcdc', { rough: .4, metal: .3 });
    K.box(1.5, .88, .72, MAT.metal('#5d7680', { rough: .6, metal: .3 }), { parent: hood, at: [0, .44, 0] });
    K.box(1.52, .04, .76, MAT.plain(0x1a1c1e, .35), { parent: hood, at: [0, .9, 0] });
    for (const x of [-.74, .74]) K.box(.04, 1.5, .74, hoodMat, { parent: hood, at: [x, 1.67, 0] });
    K.box(1.5, 1.5, .02, MAT.plain(0xe8ecec, .5), { parent: hood, at: [0, 1.67, -.36] });
    K.box(1.52, .32, .76, hoodMat, { parent: hood, at: [0, 2.4, 0] });
    K.box(1.3, .02, .1, MAT.glow(0xeaf6ff, 2), { parent: hood, at: [0, 2.23, .1], shadow: false });
    K.point(0xe8f4ff, 2, 3, { parent: hood, at: [0, 1.95, .1] });
    const sash = K.plane(1.42, .62, MAT.glass(0xcfe4ea, .2), { parent: hood, at: [0, 1.93, .36] }); sash.userData.noRay = true;
    K.box(1.44, .04, .04, MAT.metal('#8a9296'), { parent: hood, at: [0, 1.61, .37] });
    K.cyl(.15, .15, .45, hoodMat, { parent: hood, at: [0, 2.78, -.1] });
    K.text(['흄 후드 · 강산 취급'], .6, .1, { parent: hood, at: [0, 2.4, .382], bg: '#e2c21a', color: '#1a1a1a', size: .55 });
    K.text(['산은 염기로 중화!', '지시약이 초록이면 안전'], .42, .16, { parent: hood, at: [.5, 1.3, -.345], bg: '#fff4c8', color: '#a01010', size: .3 });
    // 후드 안 팬 (돈다)
    const fan = K.group({ parent: hood, at: [-.45, 2.05, -.34] });
    for (let i = 0; i < 4; i++) K.box(.03, .16, .005, MAT.metal('#8a9296'), { parent: fan, at: [0, 0, 0], rot: [0, 0, i * Math.PI / 2] }).geometry.translate(0, .08, 0);
    K.torus(.17, .01, MAT.metal('#8a9296'), { parent: hood, at: [-.45, 2.05, -.34] });
    // 비커
    const beaker = K.group({ parent: hood, at: [0, .92, .05] });
    const liqCol = new THREE.Color(0xd42020);
    const liqMat = MAT.plain(0xd42020, .15, 0, { emissive: 0xd42020, emissiveIntensity: .35, transparent: true, opacity: .8 });
    K.cyl(.1, .1, .17, liqMat, { parent: beaker, at: [0, .09, 0], shadow: false });
    const bglass = K.cyl(.11, .11, .25, MAT.glass(0xe8f4ff, .25), { parent: beaker, at: [0, .125, 0], open: true }); bglass.userData.noRay = true;
    K.torus(.11, .006, MAT.glass(0xe8f4ff, .4), { parent: beaker, at: [0, .25, 0], rot: [Math.PI / 2, 0, 0] });
    const keyIn = K.group({ parent: beaker, at: [0, .012, 0], rot: [-Math.PI / 2, 0, .4], scale: .9 });
    K.torus(.025, .006, MAT.silver(), { parent: keyIn, at: [-.05, 0, 0] }); K.box(.07, .01, .005, MAT.silver(), { parent: keyIn, at: [.01, 0, 0] });
    K.text(['강산 pH 1', '위험!'], .1, .06, { parent: beaker, at: [0, .15, .112], bg: '#ffffff', color: '#c01010', size: .32 });
    const bubbles = [];
    for (let i = 0; i < 18; i++) { const b = K.sphere(.006 + Math.random() * .006, MAT.plain(0xffffff, .2, 0, { transparent: true, opacity: .7 }), { parent: beaker, seg: 8, shadow: false }); b.visible = false; b.userData.noRay = true; b.userData.ph = Math.random(); bubbles.push(b); }
    K.onUpdate((dt, t) => {
      fan.rotation.z += dt * 6;
      bubbles.forEach((b, i) => {
        b.visible = !!s.fizz; if (!s.fizz) return;
        const k = (t * 1.6 + b.userData.ph) % 1, a = i * 2.4;
        b.position.set(Math.cos(a) * .07 * (1 - k * .3), .02 + k * .16, Math.sin(a) * .07);
      });
    });
    K.zone('hood', { pos: [-1.95, 1.45, -.3], look: [-3.1, 1.0, -.3], fov: 50 });
    K.hot(beaker, {
      name: '산성 비커', zone: 'hood', click: g => {
        if (s.neutral && !s.keyTaken) { s.keyTaken = true; keyIn.visible = false; g.sound.play('pickup'); g.give('labKey', true); g.say('집게로 비커 바닥의 열쇠를 건져 냈다.'); return; }
        if (s.neutral) { g.say('초록빛이 도는 중성 용액. 이제 안전하다.'); return; }
        g.say('붉은 지시약이 섞인 강한 산. 바닥에 작은 열쇠가 가라앉아 있다. 맨손으로는 절대 안 된다!');
      },
      use: {
        soda: g => { g.sound.play('wrong'); g.say('가루만 부으면 거품이 넘칠 것 같다. 물에 녹여서 쓰자.'); },
        water: g => { g.sound.play('wrong'); g.say('강산에 물을 부으면 튈 수 있다. 위험하다!'); },
        baseSol: async g => {
          if (s.neutral || s.fizz) return;
          g.take('baseSol'); s.fizz = true; g.sound.play('magic'); g.say('부글부글… 거품이 일며 색이 변한다.');
          for (const hex of [0xe8642a, 0xf0c020, 0x3cc84a]) {
            liqCol.setHex(hex);
            g.tween(liqMat.emissive, { r: liqCol.r, g: liqCol.g, b: liqCol.b }, 1);
            await g.tween(liqMat.color, { r: liqCol.r, g: liqCol.g, b: liqCol.b }, 1);
          }
          s.fizz = false; s.neutral = true; g.sound.play('unlock');
          g.say('지시약이 초록색이 되었다. 중화 완료! 이제 열쇠를 꺼낼 수 있다.');
        },
      }
    });

    // ---------- 가운데: 실험대 ----------
    const IZ = .2;
    K.box(2.3, .86, .9, MAT.wood('#9a8a70', [2, 1]), { at: [0, .43, IZ] });
    K.rbox(2.4, .05, 1.0, .01, MAT.plain(0x1c1e20, .35), { at: [0, .885, IZ] });
    for (const x of [-.9, -.3]) K.box(.5, .7, .01, MAT.wood('#b8a888'), { at: [x, .42, IZ + .455] });
    K.box(.36, .7, .01, MAT.wood('#b8a888'), { at: [.2, .42, IZ + .455] });
    K.box(.5, .42, .01, MAT.wood('#b8a888'), { at: [.75, .28, IZ + .455] });
    for (const x of [-.9, -.3]) K.box(.1, .02, .02, alu, { at: [x, .62, IZ + .47] });
    const TOP = .91;
    // 서랍 (잠김)
    const drawer = K.group({ at: [.75, .66, IZ + .455] });
    K.box(.6, .2, .03, MAT.wood('#b8a888'), { parent: drawer, at: [0, 0, .01] });
    K.box(.14, .025, .02, alu, { parent: drawer, at: [0, .04, .035] });
    K.cyl(.012, .012, .01, MAT.plain(0x111111), { parent: drawer, at: [0, -.04, .03], rot: [Math.PI / 2, 0, 0] });
    K.box(.56, .16, .6, MAT.wood('#c8b898'), { parent: drawer, at: [0, -.01, -.3] });
    const uvMesh = K.group({ parent: drawer, at: [0, .08, -.15], rot: [0, .3, 0] }); uvModel(K, uvMesh);
    K.zone('drawer', { pos: [.75, 1.25, 1.75], look: [.75, .65, .7], fov: 50 });
    K.hot(drawer, {
      name: '실험대 서랍', zone: 'drawer', click: g => { if (!s.drawer) { g.sound.play('wrong'); g.say('잠겨 있다. 작은 열쇠 구멍이 있다.'); } },
      use: { labKey: g => { if (s.drawer) return; s.drawer = true; g.take('labKey'); g.sound.play('unlock'); g.tween(drawer.position, { z: IZ + .455 + .42 }, .7); g.say('서랍이 열렸다. 보라색 램프가 들어 있다.'); } }
    });
    K.hot(uvMesh, { name: '자외선 램프', zone: 'drawer', enabled: () => s.drawer && !s.uvTaken, click: g => { s.uvTaken = true; uvMesh.visible = false; g.give('uv'); } });

    // 분젠 버너
    const burner = K.group({ at: [-.45, TOP, IZ + .1] });
    K.cyl(.06, .07, .02, MAT.iron(), { parent: burner, at: [0, .01, 0] });
    K.cyl(.012, .012, .15, MAT.brass(), { parent: burner, at: [0, .09, 0] });
    K.cyl(.016, .016, .025, MAT.brass(), { parent: burner, at: [0, .05, 0] });
    K.cyl(.007, .007, .5, MAT.plain(0xd07a2a, .6), { parent: burner, at: [.23, .02, -.15], rot: [Math.PI / 2, 0, 1.0] });
    const valve = K.cyl(.02, .02, .03, MAT.plain(0xc81e1e, .4), { parent: burner, at: [.02, .02, .025], rot: [Math.PI / 2, 0, 0] });
    const flameMat = MAT.glow(0x4a7aff, 3, { transparent: true, opacity: .6, depthWrite: false });
    const flame = K.cone(.022, .14, flameMat, { parent: burner, at: [0, .24, 0], shadow: false }); flame.userData.noRay = true; flame.visible = false;
    const inner = K.cone(.012, .06, MAT.glow(0x9ad0ff, 4, { transparent: true, opacity: .8 }), { parent: burner, at: [0, .2, 0], shadow: false }); inner.userData.noRay = true; inner.visible = false;
    const flameLight = K.point(0x6a8aff, 0, 3, { parent: burner, at: [0, .28, .05] });
    const flameCol = new THREE.Color(0x4a7aff), blue = new THREE.Color(0x4a7aff);
    let testT = 0;
    K.onUpdate((dt, t) => {
      if (!s.burner) return;
      const f = .9 + Math.sin(t * 21) * .06 + Math.random() * .08;
      flame.scale.set(1, f * (testT > 0 ? 1.5 : 1), 1); inner.scale.set(1, f, 1);
      if (testT > 0) { testT -= dt; if (testT <= 0) { flameMat.color.copy(blue); flameMat.emissive.copy(blue); flameLight.color.copy(blue); } }
      flameLight.intensity = (testT > 0 ? 2.5 : .8) * f;
    });
    K.zone('bench', { pos: [-.65, 1.5, 1.45], look: [-.7, .95, IZ + .1], fov: 52, range: .5 });
    K.hot(burner, {
      name: '분젠 버너', zone: 'bench', click: g => {
        if (s.burner) { g.say('파란 불꽃이 조용히 타고 있다. 시료를 대 보자.'); return; }
        s.burner = true; g.sound.play('switch'); g.tween(valve.rotation, { y: 1.5 }, .3);
        flame.visible = inner.visible = true; g.say('치익— 가스 밸브를 열고 불을 붙였다. 파란 불꽃이 인다.');
      }
    });
    // 시료 네 개 (일부러 원자 번호 순서가 아님)
    const SAMPLES = [['구리', 'Cu', 0x2aff7a, '초록색'], ['칼륨', 'K', 0xb060ff, '연한 보라색'], ['리튬', 'Li', 0xff2a2a, '진한 빨간색'], ['나트륨', 'Na', 0xffc81a, '밝은 노란색']];
    const rack = K.group({ at: [-.95, TOP, IZ + .15] });
    K.box(.36, .05, .1, MAT.wood('#c8a878'), { parent: rack, at: [0, .025, 0] });
    SAMPLES.forEach(([kr, sym, col, word], i) => {
      const x = -.13 + i * .087;
      const loop = K.group({ parent: rack, at: [x, .05, 0] });
      K.cyl(.006, .006, .12, MAT.plain(0x3a2a1a, .6), { parent: loop, at: [0, .06, 0] });
      K.cyl(.0015, .0015, .1, MAT.silver(), { parent: loop, at: [0, .17, 0] });
      K.torus(.008, .0015, MAT.silver(), { parent: loop, at: [0, .225, 0] });
      K.box(.075, .26, .07, new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }), { parent: loop, at: [0, .11, 0], shadow: false });
      K.text([sym], .07, .045, { parent: loop, at: [0, -.024, .052], bg: '#ffffff', color: '#1a1a1a', size: .8 });
      K.hot(loop, {
        name: `${kr} 시료`, zone: 'bench', click: async g => {
          if (!s.burner) { g.say(`${kr}(${sym}) 시료. 불꽃에 대 보려면 버너부터 켜야 한다.`); return; }
          g.sound.play('magic');
          flameCol.setHex(col); flameMat.color.copy(flameCol); flameMat.emissive.copy(flameCol); flameLight.color.copy(flameCol); testT = 3;
          s['t' + sym] = true;
          g.say(`${kr}(${sym}) 시료를 불꽃에 대자 불꽃이 <b>${word}</b>으로 변했다!`);
          await g.tween(loop.position, { y: .1 }, .25); g.tween(loop.position, { y: .05 }, .4);
        }
      });
    });
    // 실험 노트 (보이지 않는 잉크)
    const notebook = K.group({ at: [.35, TOP, IZ + .1], rot: [0, -.1, 0] });
    for (const sx of [-1, 1]) K.box(.2, .008, .28, MAT.paper(), { parent: notebook, at: [sx * .101, .006, 0], rot: [0, 0, sx * -.04] });
    K.box(.42, .004, .3, MAT.plain(0x1a3a5a, .6), { parent: notebook, at: [0, .001, 0] });
    const inkMat = new THREE.MeshBasicMaterial({ map: K.canvasTexture(1024, 680, (c, w, h) => {
      c.fillStyle = '#e8d0ff'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.shadowColor = '#b080ff'; c.shadowBlur = 24;
      c.font = "700 92px 'Noto Sans KR', sans-serif"; c.fillText('문 비밀번호', w / 2, h * .18);
      c.font = "700 150px 'Noto Sans KR', sans-serif"; c.fillText('O · C · N · H', w / 2, h * .5);
      c.font = "700 70px 'Noto Sans KR', sans-serif"; c.fillText('(각 원소의 원자 번호를 차례로)', w / 2, h * .82);
    }), transparent: true, opacity: 0, depthWrite: false });
    const ink = K.plane(.4, .27, inkMat, { parent: notebook, at: [0, .013, 0], rot: [-Math.PI / 2, 0, 0] }); ink.userData.noRay = true;
    const uvSpot = K.spot(0x8a4aff, 0, 3, [.35, TOP, IZ + .1], { at: [.4, 1.55, IZ + .75], angle: .35, penumbra: .5 });
    K.zone('note', { pos: [.35, 1.45, 1.15], look: [.35, .92, IZ + .1], fov: 50 });
    K.hot(notebook, {
      name: '실험 노트', zone: 'note', click: g => {
        if (!s.uv) { g.say('빈 실험 노트. 그런데 종이 표면이 살짝 번들거린다… 무언가로 쓴 자국 같다.'); return; }
        g.note('자외선 아래의 실험 노트', '<div class="big" style="color:#5a2aa0">문 비밀번호\n\nO · C · N · H</div>\n<p style="text-align:center">(각 원소의 원자 번호를 차례로)</p>');
      },
      use: {
        uv: async g => {
          if (s.uv) { g.say('보랏빛 글씨가 또렷하다.'); return; }
          s.uv = true; g.sound.play('switch'); g.select(null);
          g.tween(uvSpot, { intensity: 6 }, .5); await g.wait(.3); g.sound.play('magic');
          await g.tween(inkMat, { opacity: 1 }, 1.2);
          g.say('보랏빛 아래, 숨어 있던 글씨가 떠올랐다!');
        }
      }
    });
    // 실험대 위 소품: 시험관 꽂이, 현미경
    const tr = K.group({ at: [.95, TOP, IZ - .25] });
    K.box(.3, .06, .08, MAT.wood('#c8a878'), { parent: tr, at: [0, .1, 0] }); K.box(.3, .02, .08, MAT.wood('#c8a878'), { parent: tr, at: [0, .01, 0] });
    [0xff4a8a, 0x4affb0, 0x4ab0ff, 0xffd04a, 0xb04aff].forEach((c, i) => { const x = -.12 + i * .06; K.cyl(.012, .012, .15, MAT.glass(0xe8f4ff, .3), { parent: tr, at: [x, .09, 0] }); K.cyl(.01, .01, .07, MAT.glow(c, 1.4, { transparent: true, opacity: .85 }), { parent: tr, at: [x, .05, 0], shadow: false }); });
    K.hot(tr, { name: '시험관 꽂이', text: '색색의 용액이 은은하게 빛난다. 이름표는 다 지워져 있다.' });
    const mic = K.group({ at: [-.1, TOP, IZ - .25] });
    K.box(.14, .03, .18, MAT.plain(0x2a2c30, .4), { parent: mic, at: [0, .015, 0] });
    K.box(.04, .24, .04, MAT.plain(0xe8e8e4, .4), { parent: mic, at: [0, .14, -.06] });
    K.cyl(.022, .022, .16, MAT.plain(0x2a2c30, .3, .5), { parent: mic, at: [0, .24, -.02], rot: [-.5, 0, 0] });
    K.box(.1, .01, .1, MAT.plain(0x2a2c30, .4), { parent: mic, at: [0, .09, .02] });
    K.hot(mic, { name: '현미경', text: '슬라이드에는 양파 껍질 세포가 보인다. 지금은 쓸 일이 없다.' });

    // ---------- 남쪽: 개수대와 빛나는 플라스크 선반 ----------
    K.box(3.4, .88, .6, MAT.wood('#9a8a70', [2, 1]), { at: [-1.1, .44, D / 2 - .32] });
    K.rbox(3.5, .05, .64, .01, MAT.plain(0x1c1e20, .35), { at: [-1.1, .905, D / 2 - .32] });
    K.box(.5, .02, .4, MAT.plain(0x8a9096, .2, .8), { at: [-2.2, .925, D / 2 - .32] });
    K.cyl(.015, .015, .3, MAT.silver(), { at: [-2.2, 1.07, D / 2 - .1] });
    K.cyl(.012, .012, .18, MAT.silver(), { at: [-2.2, 1.21, D / 2 - .18], rot: [Math.PI / 2, 0, 0] });
    K.box(2.4, .03, .3, MAT.wood('#c8b898'), { at: [-.9, 1.65, D / 2 - .17] });
    for (const x of [-2, .2]) K.box(.03, .2, .25, alu, { at: [x, 1.55, D / 2 - .15] });
    const glowFlasks = [[0xff3a8a, -1.9], [0x3aff9a, -1.4], [0x3a9aff, -.9], [0xffc03a, -.4], [0xb03aff, .1]];
    const flaskBubbles = [];
    glowFlasks.forEach(([c, x], i) => {
      const f = K.group({ at: [x, 1.665, D / 2 - .17], scale: 1.2 + (i % 2) * .3 });
      flaskModel(K, f, c);
      for (let k = 0; k < 4; k++) { const b = K.sphere(.005, MAT.glow(0xffffff, 1.5), { parent: f, seg: 6, shadow: false }); b.userData.noRay = true; b.userData.ph = Math.random(); flaskBubbles.push(b); }
    });
    K.point(0xff4aa0, .9, 2.5, { at: [-1.6, 1.85, D / 2 - .4] });
    K.point(0x4aa0ff, .9, 2.5, { at: [-.4, 1.85, D / 2 - .4] });
    K.onUpdate((dt, t) => flaskBubbles.forEach(b => { const k = (t * .5 + b.userData.ph) % 1; b.position.set(Math.sin(b.userData.ph * 20) * .02, .01 + k * .06, Math.cos(b.userData.ph * 20) * .02); }));
    // 비상 세안기, 안전 수칙, 시계
    const eye = K.group({ at: [1.6, 0, D / 2 - .1] });
    K.cyl(.03, .03, 1.1, MAT.plain(0x2aa04a, .5), { parent: eye, at: [0, .55, 0] });
    K.cyl(.12, .1, .06, MAT.plain(0x2aa04a, .5), { parent: eye, at: [0, 1.12, -.12] });
    K.text(['비상 세안기'], .4, .12, { parent: eye, at: [0, 1.5, .08], rot: [0, Math.PI, 0], bg: '#2aa04a', color: '#fff', size: .55 });
    K.hot(eye, { name: '비상 세안기', text: '눈에 약품이 튀면 바로 씻어 내는 장치. 다행히 쓸 일은 없었다.' });
    K.text(['실험실 안전 수칙', '1. 보안경을 쓴다', '2. 강산은 후드 안에서', '3. 산에 물을 붓지 않는다', '4. 냄새는 손으로 부쳐서'], .6, .75, { at: [.9, 1.9, D / 2 - .02], rot: [0, Math.PI, 0], bg: '#fffbe8', color: '#1a1a1a', size: .085, lh: 1.6 });
    const clock = K.group({ at: [-2.6, 2.3, D / 2 - .03], rot: [0, Math.PI, 0] });
    K.cyl(.16, .16, .04, MAT.plain(0xf0f0f0, .3), { parent: clock, rot: [Math.PI / 2, 0, 0] });
    K.picture(.28, .28, (c, w) => { const m = w / 2; c.fillStyle = '#fff'; c.beginPath(); c.arc(m, m, m - 2, 0, 7); c.fill(); c.fillStyle = '#222'; for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; c.fillRect(m + Math.sin(a) * m * .82 - 4, m - Math.cos(a) * m * .82 - 12, 8, 24); } }, { parent: clock, at: [0, 0, .021] });
    const sec = K.group({ parent: clock, at: [0, 0, .025] });
    K.box(.003, .12, .003, MAT.plain(0xc81e1e, .4), { parent: sec, at: [0, .05, 0] });
    K.box(.008, .08, .003, MAT.plain(0x111111, .4), { parent: clock, at: [.02, .03, .024], rot: [0, 0, -.6] });
    K.box(.006, .11, .003, MAT.plain(0x111111, .4), { parent: clock, at: [-.04, .03, .024], rot: [0, 0, 1.1] });
    K.onUpdate((dt, t) => { sec.rotation.z = -Math.floor(t) / 60 * Math.PI * 2; });

    // 바닥 배수구, 먼지
    K.cyl(.12, .12, .005, MAT.metal('#7a8086', { rough: .4 }), { at: [-1.6, .003, -1.6] });
    K.dust(160, [6.5, 2.8, 5.5], { opacity: .18, color: 0xdfe8ff });
  },
};

// 삼각 플라스크 + 빛나는 용액
function flaskModel(K, g, color) {
  K.lathe([[0, 0], [.07, 0], [.075, .01], [.03, .13], [.02, .15], [.02, .21], [.024, .215], [0, .215]], K.MAT.glass(0xe8f4ff, .25), { parent: g });
  K.lathe([[0, .004], [.066, .004], [.042, .075], [0, .075]], K.MAT.glow(color, 1.6, { transparent: true, opacity: .9 }), { parent: g, shadow: false });
}
// 자외선 램프
function uvModel(K, g) {
  K.cyl(.025, .025, .16, K.MAT.plain(0x1a1a1e, .5, .2), { parent: g, rot: [0, 0, Math.PI / 2] });
  K.box(.08, .03, .05, K.MAT.plain(0x1a1a1e, .5, .2), { parent: g, at: [.11, 0, 0] });
  K.box(.07, .012, .035, K.MAT.glow(0x8a4aff, 3), { parent: g, at: [.11, -.016, 0] });
  K.box(.02, .01, .015, K.MAT.plain(0x8a4aff, .4), { parent: g, at: [-.02, .026, 0] });
}
// 주기율표 1~36번
function drawPeriodic(c, w, h, done) {
  const E = 'H 수소,He 헬륨,Li 리튬,Be 베릴륨,B 붕소,C 탄소,N 질소,O 산소,F 플루오린,Ne 네온,Na 나트륨,Mg 마그네슘,Al 알루미늄,Si 규소,P 인,S 황,Cl 염소,Ar 아르곤,K 칼륨,Ca 칼슘,Sc 스칸듐,Ti 타이타늄,V 바나듐,Cr 크로뮴,Mn 망가니즈,Fe 철,Co 코발트,Ni 니켈,Cu 구리,Zn 아연,Ga 갈륨,Ge 저마늄,As 비소,Se 셀레늄,Br 브로민,Kr 크립톤'.split(',').map(x => x.split(' '));
  const col = n => n === 1 ? 1 : n === 2 ? 18 : n <= 10 ? (n <= 4 ? n - 2 : n + 8) : n <= 18 ? (n <= 12 ? n - 10 : n) : n - 18;
  const row = n => n <= 2 ? 0 : n <= 10 ? 1 : n <= 18 ? 2 : 3;
  const kind = n => [1, 6, 7, 8, 15, 16, 34].includes(n) ? '#bfe6b8' : [2, 10, 18, 36].includes(n) ? '#d6c4ec' : [9, 17, 35].includes(n) ? '#f6e3a8' : [3, 11, 19].includes(n) ? '#f6b8b8' : [4, 12, 20].includes(n) ? '#f8d2a8' : [5, 14, 32, 33].includes(n) ? '#b8e2e2' : n >= 21 && n <= 30 ? '#bcd0ee' : '#d8d8d8';
  c.fillStyle = '#f4f2ea'; c.fillRect(0, 0, w, h);
  c.fillStyle = '#1a2a4a'; c.font = "700 64px 'Noto Sans KR', sans-serif"; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText('원소 주기율표 (1~36번)', w / 2, h * .08);
  const x0 = w * .03, cw = (w * .94) / 18, y0 = h * .17, ch = (h * .8) / 4;
  E.forEach(([sym, name], i) => {
    const n = i + 1, x = x0 + (col(n) - 1) * cw, y = y0 + row(n) * ch;
    c.fillStyle = kind(n); c.fillRect(x + 2, y + 2, cw - 4, ch - 4);
    c.strokeStyle = '#555'; c.lineWidth = 2; c.strokeRect(x + 2, y + 2, cw - 4, ch - 4);
    c.fillStyle = '#1a1a1a'; c.textAlign = 'left'; c.font = "700 26px 'Noto Sans KR', sans-serif"; c.fillText(String(n), x + 8, y + 22);
    c.textAlign = 'center'; c.font = "700 54px 'Noto Sans KR', sans-serif"; c.fillText(sym, x + cw / 2, y + ch * .5);
    c.font = "500 18px 'Noto Sans KR', sans-serif"; c.fillText(name, x + cw / 2, y + ch * .84);
  });
  done(c.canvas.toDataURL());
}

export const solution = [
  { hot: '화이트보드' },
  { hot: '주기율표' },
  { hot: '분젠 버너' },
  { hot: '리튬 시료' }, { hot: '나트륨 시료' }, { hot: '칼륨 시료' }, { hot: '구리 시료' },
  { hot: '시약장', lock: COLOR_ANSWER, wait: 1.5 },
  { combine: ['soda', 'water'] },
  { hot: '산성 비커', item: 'baseSol', wait: 4 },
  { hot: '산성 비커' },
  { hot: '실험대 서랍', item: 'labKey', wait: 1.2 },
  { hot: '자외선 램프' },
  { hot: '실험 노트', item: 'uv', wait: 2.2 },
  { hot: '실험 노트' },
  { hot: '문 키패드', lock: '8671', wait: 3 },
];
