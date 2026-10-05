// 15단계: 시계탑의 꼭대기 (마지막 방)
// 흐름: 작업대의 시계공 편지(전체 길잡이) / 여정판(I~XV, 이곳은 XV)
//       종 허리의 로마 숫자 MDCCCXCIV = 1894 → 공구함 → 녹슨 톱니바퀴
//       남쪽 선반 기름통 + 녹슨 톱니바퀴 = 기름칠한 톱니바퀴 → 톱니 장치의 빈 축 → 시계가 다시 간다
//       시계 중심의 손잡이로 바늘을 15시(=3시 정각)에 → 종 줄이 내려옴
//       시각만큼 종 3번 → 유리의 먼지가 떨어지며 II·V·VIII·XI 곁에 금빛 글자
//       숫자 순서대로 「새벽하늘」 → 시계 유리가 문처럼 열리고 새벽하늘로 → 탈출
const TAU = Math.PI * 2;
const SYL = ['별', '새', '달', '벽', '밤', '하', '문', '늘', '빛', '종'];
const ANSWER = ['새', '벽', '하', '늘'];
const MARKS = { 2: '새', 5: '벽', 8: '하', 11: '늘' };
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV'];
const ROOMS = ['오래된 서재', '정전된 지하실', '야간열차 7호 객실', '화학 실험실', '꺼진 등대', '파라오의 묘실', '선장실', '별을 보는 방', '1207호', '한밤의 미술관', '잠긴 온실', '심해 잠수함', '은행 대금고', '궤도 정거장', '시계탑의 꼭대기'];

export default {
  title: '시계탑의 꼭대기',
  intro: '고요하다.\n거대한 톱니바퀴들이 멈춘 채 어둠 속에 서 있다.\n등 뒤의 달빛이 커다란 시계 유리를 하얗게 비춘다.\n\n여기가 마지막 방이다.\n<i>지나온 열네 개의 방을 떠올리며, 마지막 문을 여세요.</i>',
  outro: '시계 유리가 문처럼 활짝 열리고,\n열다섯 개의 빛이 새벽하늘로 날아올라 별이 된다.\n\n<b>축하합니다!</b>\n열다섯 개의 방을 모두 탈출했습니다.\n오래된 서재에서 시작된 긴 밤이 드디어 끝났습니다.\n\n<i>— 「열다섯 개의 문」 끝 —</i>',
  env: .3, exposure: 1.0, bloom: .55, bg: 0x05070f,
  start: { pos: [0, 1.7, 2.3], look: [0, 2.9, -3.4] },

  items: {
    rustyGear: { name: '녹슨 톱니바퀴', desc: '이가 열여섯 개인 톱니바퀴. 녹이 슬어 뻑뻑하다.\n이대로 끼우면 돌지 않겠다.', model: (K, g) => K.place(new K.THREE.Mesh(gearGeo(K.THREE, 16, .045, .06, 5), K.MAT.rust('#6b5040')), { parent: g }), iconRot: [.3, .3, 0] },
    oilCan: { name: '기름통', desc: '시계 기름이 든 작은 깡통. 주둥이가 길다.', model: oilModel, iconRot: [.2, -.6, 0] },
    oiledGear: { name: '기름칠한 톱니바퀴', desc: '기름을 먹여 반짝인다. 이제 부드럽게 맞물려 돌 것이다.', model: (K, g) => K.place(new K.THREE.Mesh(gearGeo(K.THREE, 16, .045, .06, 5), K.MAT.brass({ roughness: .2 })), { parent: g }), iconRot: [.3, .3, 0] },
  },
  combos: [['rustyGear', 'oilCan', 'oiledGear']],

  hints: [
    { when: s => !s.letter, text: ['오른쪽 작업대를 살펴보세요.', '작업대 위에 편지가 놓여 있어요.', '시계공의 편지를 누르세요. 이 방의 길잡이예요.'] },
    { when: s => !s.chest, text: ['공구함 번호는 「종이 태어난 해」예요.', '천장의 종 허리에 로마 숫자가 새겨져 있어요: MDCCCXCIV.', 'M=1000, DCCC=800, XC=90, IV=4 → 1894. 공구함에 1894.'] },
    { when: (s, g) => !s.gear && !g.has('oiledGear'), text: ['녹슨 톱니는 그대로는 돌지 않아요.', '뒤쪽(남쪽) 선반에 기름통이 있어요.', '가방에서 녹슨 톱니바퀴와 기름통을 차례로 눌러 조합하세요.'] },
    { when: s => !s.gear, text: ['왼쪽 벽 톱니 장치에 톱니 하나가 빠진 자리가 있어요.', '기름칠한 톱니바퀴를 고르고 「빈 톱니 축」을 누르세요.'] },
    { when: s => !s.timeSet, text: ['편지: 바늘을 「여정의 수」에 맞추어라.', '여정판을 보면 이곳은 열다섯 번째 방(XV)이에요. 15시는 열두 시간 시계로 3시, 정각.', '시계 한가운데 손잡이로 3시 정각(시침은 III, 분침은 XII)을 만드세요. 시침 손잡이는 한 시간, 분침 손잡이는 15분씩 돌아가요. 처음 11시 45분이면: 분침 한 번, 시침 세 번.'] },
    { when: s => !s.revealed, text: ['종 줄이 내려왔어요.', '시계탑은 바늘이 가리키는 시각만큼 종을 쳐요.', '종 줄을 세 번 당기고 잠시 기다리세요.'] },
    { text: ['시계 유리에서 먼지가 떨어진 자리를 보세요.', '금빛 글자를 숫자 작은 순서대로: II, V, VIII, XI. (뒤에서 보니 숫자가 좌우로 뒤집혀 보여요.)', '새 · 벽 · 하 · 늘. 시계 한가운데 글자 자물쇠에 넣으세요.'] },
  ],

  build(K) {
    const { THREE, MAT, s } = K;
    const W = 7, D = 7, H = 7.5, FY = 3.0, FR = 1.85, NZ = -D / 2;
    const wood = MAT.wood('#4a2c17'), darkWood = MAT.wood('#2e1b0e');
    const room = K.room({ w: W, d: D, h: H, floor: MAT.floor('#4a3220'), wall: MAT.stone('#8b8378'), ceil: MAT.wood('#2e1b0e', [3, 3]), trim: darkWood });
    room.remove(room.getObjectByName('wall_n'));
    // 북쪽 벽: 둥근 구멍
    const shp = new THREE.Shape();
    shp.moveTo(-W / 2, 0); shp.lineTo(W / 2, 0); shp.lineTo(W / 2, H); shp.lineTo(-W / 2, H); shp.lineTo(-W / 2, 0);
    const hole = new THREE.Path(); hole.absarc(0, FY, FR, 0, TAU, true); shp.holes.push(hole);
    K.place(new THREE.Mesh(new THREE.ShapeGeometry(shp, 64), MAT.stone('#8b8378', [.5, .5])), { at: [0, 0, NZ] });
    const tubeMat = MAT.stone('#6f675d', [3, .3]); tubeMat.side = THREE.DoubleSide;
    K.cyl(FR, FR, .6, tubeMat, { at: [0, FY, NZ - .3], rot: [Math.PI / 2, 0, 0], open: true, seg: 64 });
    K.torus(FR + .03, .08, MAT.iron(), { at: [0, FY, NZ + .03], seg: 96 });
    for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; K.sphere(.05, MAT.iron(), { at: [Math.sin(a) * (FR + .03), FY + Math.cos(a) * (FR + .03), NZ + .1] }); }

    // ---------- 빛 ----------
    K.scene.add(new THREE.HemisphereLight(0x9fb0d8, 0x3a2a1a, 1.0));
    const moon = K.spot(0xc4d4ff, 6, 18, [0, 1.2, 3.0], { at: [0, 4.0, -6.5], angle: .56, penumbra: .35, shadow: true });
    K.point(0xdfe6ff, 1, 6, { at: [0, FY, -2.6] });
    K.point(0x9fb4e0, 4, 7, { at: [0, 6.0, 1.8] });
    // 톱니 쪽 매달린 등불
    const hl = K.group({ at: [-2.0, 4.2, .9] });
    K.cyl(.006, .006, 1.0, MAT.iron(), { parent: hl, at: [0, .6, 0] });
    K.cyl(.07, .08, .2, MAT.glass(0xffd9a0, .35), { parent: hl });
    K.cone(.09, .08, MAT.iron(), { parent: hl, at: [0, .14, 0] });
    K.sphere(.035, MAT.glow(0xffb347, 6), { parent: hl, shadow: false });
    const hlL = K.point(0xffc078, 3.5, 6, { at: [-2.0, 4.1, .9] });
    K.onUpdate((dt, t) => { hlL.intensity = 3.5 + Math.sin(t * 6 + 1) * .3; hl.rotation.z = Math.sin(t * .7) * .03; });

    // ---------- 밖 하늘 (밤과 새벽) ----------
    const night = K.picture(80, 45, (g, w, h) => drawSky(g, w, h, false), { at: [0, 6, -32], emissive: 1, res: 2048 });
    const dawn = K.picture(80, 45, (g, w, h) => drawSky(g, w, h, true), { at: [0, 6, -31.9], emissive: 1, res: 2048, transparent: true });
    dawn.material.opacity = 0; night.userData.noRay = true; dawn.userData.noRay = true;

    // ---------- 북쪽: 커다란 시계 유리 (뒤에서 본 모습) ----------
    const fp = K.group({ at: [FR, FY, NZ + .02] });   // 경첩: 오른쪽 끝
    const face = K.picture(FR * 2, FR * 2, (g, w) => drawFace(g, w, false), { parent: fp, at: [-FR, 0, 0], transparent: true, emissive: .12, res: 1024 });
    const redrawFace = rev => { const cv = face.material.map.image; drawFace(cv.getContext('2d'), cv.width, rev); face.material.map.needsUpdate = true; };
    const handMat = MAT.plain(0x15120f, .5, .6);
    const hourHand = K.group({ parent: fp, at: [-FR, 0, .05] });
    K.box(.09, .9, .025, handMat, { parent: hourHand, at: [0, .38, 0] });
    K.torus(.08, .02, handMat, { parent: hourHand, at: [0, .78, 0] });
    K.cone(.1, .2, handMat, { parent: hourHand, at: [0, .95, 0], seg: 4 });
    const minHand = K.group({ parent: fp, at: [-FR, 0, .08] });
    K.box(.06, 1.4, .02, handMat, { parent: minHand, at: [0, .58, 0] });
    K.cone(.07, .2, handMat, { parent: minHand, at: [0, 1.36, 0], seg: 4 });
    K.box(.05, .4, .02, handMat, { parent: minHand, at: [0, -.2, 0] });
    const clk = { T: 705, hr: 705 / 720 * TAU, mn: 45 / 60 * TAU };   // 11시 45분에 멈춰 있다
    hourHand.rotation.z = clk.hr; minHand.rotation.z = clk.mn;
    // 가운데 장치 상자 + 손잡이 + 글자 자물쇠
    const hubMat = MAT.brass({ color: 0x9a7a3a, roughness: .45 });
    K.rbox(.5, .5, .26, .04, hubMat, { parent: fp, at: [-FR, 0, .22] });
    const lockPlate = K.group({ parent: fp, at: [-FR, 0, .36] });
    K.cyl(.18, .18, .03, MAT.gold({ roughness: .65, color: 0xa8843a }), { parent: lockPlate, rot: [Math.PI / 2, 0, 0] });
    K.picture(.26, .07, (g, w, h) => { g.fillStyle = '#1a140c'; g.fillRect(0, 0, w, h); g.fillStyle = '#e8d6a8'; for (let i = 0; i < 4; i++) g.fillRect(w * (.05 + i * .24), h * .15, w * .18, h * .7); }, { parent: lockPlate, at: [0, 0, .017] });
    const knob = (x, label) => {
      const k = K.group({ parent: fp, at: [-FR + x, -.02, .22] });
      K.cyl(.03, .03, .2, MAT.iron(), { parent: k, at: [-Math.sign(x) * .05, 0, 0], rot: [0, 0, Math.PI / 2] });
      const wheel = K.group({ parent: k, at: [Math.sign(x) * .1, 0, 0] });
      K.cyl(.09, .09, .07, MAT.brass(), { parent: wheel, rot: [0, 0, Math.PI / 2] });
      for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; K.box(.075, .02, .02, MAT.brass({ color: 0xb08a40 }), { parent: wheel, at: [0, Math.sin(a) * .09, Math.cos(a) * .09], rot: [a, 0, 0] }); }
      K.text([label], .2, .08, { parent: k, at: [Math.sign(x) * .06, -.19, .14], bg: '#2a1e12', color: '#f0d9a0', size: .7 });
      k.wheel = wheel; return k;
    };
    const hKnob = knob(-.36, '시침'), mKnob = knob(.36, '분침');
    K.zone('face', { pos: [0, 2.75, -.5], look: [0, 3.0, -3.4], fov: 62, range: .5 });
    K.hot(fp, { name: '시계 유리', goto: 'face', click: g => g.say(s.revealed ? '숫자 넷 곁에 금빛 글자가 빛난다.' : '뒤에서 보니 로마 숫자가 거울처럼 뒤집혀 있다. 숫자 넷 안쪽에 먼지가 두껍게 앉았다.') });
    const turn = (g, dT, kn) => {
      if (!s.gear) { g.sound.play('wrong'); g.say('톱니가 멈춰 있어 손잡이가 꿈쩍도 하지 않는다.'); return; }
      if (s.timeSet) { g.say('바늘이 3시 정각에 단단히 걸려 있다.'); return; }
      g.sound.play('tick'); g.tween(kn.wheel.rotation, { x: kn.wheel.rotation.x + 1.2 }, .4);
      clk.T = (clk.T + dT) % 720; clk.hr += dT / 720 * TAU; clk.mn += dT / 60 * TAU;
      g.tween(hourHand.rotation, { z: clk.hr }, .5); g.tween(minHand.rotation, { z: clk.mn }, .5);
      if (clk.T === 180) g.wait(.7).then(() => timeSet(g));
    };
    K.hot(hKnob, { name: '시침 손잡이', zone: 'face', click: g => turn(g, 60, hKnob) });
    K.hot(mKnob, { name: '분침 손잡이', zone: 'face', click: g => turn(g, 15, mKnob) });
    K.hot(lockPlate, {
      name: '중심 자물쇠', zone: 'face', click: g => {
        if (s.final) return;
        g.lock({ title: '시계 중심의 글자 자물쇠', text: '네 칸에 한 글자씩. 마지막 낱말을 넣으세요.', type: 'letters', length: 4, symbols: SYL, answer: ANSWER, onSolve: g => finale(g) });
      }
    });

    // ---------- 서쪽: 톱니 장치 ----------
    const tr = K.group({ at: [-W / 2 + .15, 0, .6], rot: [0, Math.PI / 2, 0] });
    K.box(4.6, 4.1, .05, MAT.rust('#5a4a3a', [2, 2]), { parent: tr, at: [1.0, 2.5, -.08] });
    for (const x of [-1.25, 3.25]) K.box(.1, 4.3, .08, MAT.iron(), { parent: tr, at: [x, 2.5, .14] });
    K.box(4.6, .1, .08, MAT.iron(), { parent: tr, at: [1.0, 4.6, .14] });
    const M = .045, brassG = MAT.brass({ roughness: .32 }), bronze = MAT.plain(0x9a7438, .38, 1);
    const GS = [
      { N: 44, at: [0, 1.65] },
      { N: 20, from: 0, ang: 35 },
      { N: 36, from: 1, ang: -25 },
      { N: 16, from: 2, ang: 75, missing: true },
      { N: 28, from: 3, ang: 140 },
      { N: 24, from: 4, ang: 185 },
    ];
    GS.forEach((G, i) => {
      G.rp = M * G.N / 2;
      if (G.from == null) { G.x = G.at[0]; G.y = G.at[1]; G.r0 = 0; G.w = .22; }
      else {
        const P = GS[G.from], th = G.ang * Math.PI / 180, d = P.rp + G.rp, pp = TAU / P.N;
        G.x = P.x + Math.cos(th) * d; G.y = P.y + Math.sin(th) * d;
        const phi = (((th - P.r0) / pp) % 1 + 1) % 1;
        G.r0 = th + Math.PI - (.5 - phi) * TAU / G.N;
        G.w = -P.w * P.N / G.N;
      }
      G.grp = K.group({ parent: tr, at: [G.x, G.y, 0] });
      G.mesh = K.place(new THREE.Mesh(gearGeo(THREE, G.N, M, .06, 5), i % 2 ? bronze : brassG), { parent: G.grp });
      G.mesh.rotation.z = G.r0;
      K.cyl(.035, .035, .26, MAT.iron(), { parent: G.grp, at: [0, 0, .04], rot: [Math.PI / 2, 0, 0] });
      K.cyl(.07, .07, .04, MAT.brass(), { parent: G.grp, at: [0, 0, .06], rot: [Math.PI / 2, 0, 0] });
    });
    const slot = GS.find(G => G.missing);
    slot.mesh.visible = false;
    K.cyl(slot.rp + .06, slot.rp + .06, .005, MAT.plain(0x1e1610, .95), { parent: slot.grp, at: [0, 0, -.05], rot: [Math.PI / 2, 0, 0] });
    // 태엽 북과 추
    K.cyl(.2, .2, .16, MAT.wood('#4a3020'), { parent: GS[0].grp, at: [0, 0, .17], rot: [Math.PI / 2, 0, 0] });
    K.cyl(.012, .012, .7, MAT.fabric('#8a7a5a'), { parent: tr, at: [.2, 1.3, .17] });
    K.cyl(.12, .12, .4, MAT.iron(), { parent: tr, at: [.2, .75, .17] });
    const run = { v: 0, t: 0 };
    K.zone('gears', { pos: [-1.0, 2.5, -.5], look: [-3.4, 2.5, -.6], fov: 62, range: .5 });
    K.hot(tr, { name: '톱니 장치', goto: 'gears', click: g => g.say(s.gear ? '톱니들이 서로 물려 째깍째깍 돈다.' : '커다란 톱니들이 멈춰 있다. 한 곳이 비어 있다.') });
    K.hot(slot.grp, {
      name: '빈 톱니 축', zone: 'gears', click: g => g.say(s.gear ? '새 톱니가 힘차게 돈다.' : '톱니 하나가 빠진 자리. 축만 덩그러니 남았다. 작은 톱니가 들어갈 자리다.'),
      use: {
        rustyGear: g => { g.sound.play('wrong'); g.say('녹이 슬어 이가 뻑뻑하다. 끼워도 돌지 않겠다. 기름이 필요하다.'); },
        oiledGear: async g => {
          s.gear = true; g.take('oiledGear');
          slot.mesh.visible = true; slot.mesh.position.z = .3;
          await g.tween(slot.mesh.position, { z: 0 }, .6); g.sound.play('thud');
          await g.wait(.4); g.sound.play('unlock');
          g.tween(run, { v: 1 }, 2.5);
          g.say('딱 맞물렸다! 톱니들이 하나둘 돌기 시작하고, 시계추가 흔들린다.');
        },
      }
    });
    // 시계 쪽으로 가는 축
    K.cyl(.03, .03, 1.3, MAT.iron(), { at: [-2.75, 4.95, -3.25], rot: [0, 0, Math.PI / 2] });
    K.box(.32, .32, .2, MAT.rust('#5a4a3a'), { at: [-2.0, 4.95, -3.36] });
    const smallG = K.place(new THREE.Mesh(gearGeo(THREE, 14, .03, .04, 0), brassG), { at: [-2.0, 4.95, -3.22] });
    // 시계추
    const pend = K.group({ at: [-W / 2 + .55, 4.75, -.55] });
    K.cyl(.06, .06, .14, MAT.iron(), { parent: pend, rot: [0, 0, Math.PI / 2] });
    K.box(.02, 3.4, .035, MAT.brass(), { parent: pend, at: [0, -1.7, 0] });
    K.cyl(.24, .24, .06, MAT.brass({ roughness: .22 }), { parent: pend, at: [0, -3.4, 0], rot: [0, 0, Math.PI / 2] });
    K.hot(pend, { name: '시계추', click: g => g.say(s.gear ? '시계추가 느릿느릿 흔들린다. 째깍, 째깍.' : '커다란 시계추가 멈춰 있다.') });
    let lastSide = 0;
    K.onUpdate((dt, t, g) => {
      run.t += dt * run.v;
      for (const G of GS) G.mesh.rotation.z = G.r0 + G.w * run.t;
      smallG.rotation.z = -run.t * 1.3;
      const sw = Math.sin(t * Math.PI);
      pend.rotation.x = Math.min(1, run.v) * .14 * sw;
      const side = Math.sign(sw);
      if (run.v > .5 && side !== lastSide && !g.done) { const S = g.sound; if (S.on && S.ctx) S.tone(2200, .025, 'square', .012); }
      lastSide = side;
    });

    // ---------- 천장: 종 ----------
    const bell = K.group({ at: [0, 6.75, .4] });
    const bellMat = MAT.brass({ color: 0x8f6c32, roughness: .42, side: THREE.DoubleSide });
    K.lathe([[0, 1.15], [.18, 1.15], [.27, 1.1], [.33, .95], [.36, .75], [.4, .5], [.48, .28], [.6, .12], [.72, .03], [.75, 0], [.69, .02], [.58, .1]], bellMat, { parent: bell, at: [0, -1.25, 0] });
    K.torus(.405, .02, bellMat, { parent: bell, at: [0, -.75, 0], rot: [Math.PI / 2, 0, 0] });
    K.torus(.62, .025, bellMat, { parent: bell, at: [0, -1.17, 0], rot: [Math.PI / 2, 0, 0] });
    K.cyl(.015, .015, .8, MAT.iron(), { parent: bell, at: [0, -.6, 0] });
    K.sphere(.08, MAT.iron(), { parent: bell, at: [0, -1.05, 0] });
    K.rbox(.46, .13, .03, .01, MAT.brass({ color: 0xd9b46a, roughness: .35 }), { parent: bell, at: [0, -.62, .37], rot: [.18, 0, 0] });
    K.text(['MDCCCXCIV'], .44, .11, { parent: bell, at: [0, -.62, .388], rot: [.18, 0, 0], bg: null, color: '#1e1206', size: .5 });
    K.box(1.7, .22, .22, darkWood, { parent: bell, at: [0, 0, 0] });
    for (const x of [-.25, .25]) K.box(.04, .3, .26, MAT.iron(), { parent: bell, at: [x, -.2, 0] });
    const bwheel = K.group({ parent: bell, at: [.95, 0, 0] });
    K.torus(.6, .03, wood, { parent: bwheel, rot: [0, Math.PI / 2, 0] });
    for (let i = 0; i < 4; i++) K.box(.04, 1.2, .04, wood, { parent: bwheel, rot: [i * Math.PI / 4, 0, 0] });
    for (const x of [-.8, .8]) K.box(.25, .25, D, darkWood, { at: [x, 6.52, 0] });
    K.zone('bell', { pos: [0, 3.9, 2.9], look: [0, 6.0, .77], fov: 42, range: .45 });
    K.hot(bell, { name: '종', goto: 'bell', click: g => g.say('묵직한 청동 종. 허리의 놋쇠 판에 「MDCCCXCIV」라고 새겨져 있다.') });
    // 종 줄
    const rope = { len: 1.8 };
    const ropeRoot = K.group({ at: [.95, 6.75, 1.0] });
    const ropeS = K.group({ parent: ropeRoot });
    K.cyl(.02, .02, 1, MAT.fabric('#b49a6a', 0, [1, 8]), { parent: ropeS, at: [0, -.5, 0] });
    const tassel = K.group({ parent: ropeRoot });
    K.cyl(.045, .028, .2, MAT.fabric('#8a1f1f'), { parent: tassel, at: [0, -.1, 0] });
    const jig = { a: 0 };
    K.onUpdate((dt, t) => { ropeS.scale.y = rope.len; tassel.position.y = -rope.len; ropeRoot.rotation.z = Math.sin(t * .9) * .012 + jig.a; });
    let ringT = null;
    K.hot(ropeRoot, {
      name: '종 줄', click: g => {
        if (!s.timeSet) { g.say('줄 끝이 종 바퀴에 높이 감겨 있다. 손이 닿지 않는다.'); return; }
        if (s.final) return;
        ringBell(g);
        if (s.revealed) return;
        s.rings = (s.rings || 0) + 1;
        clearTimeout(ringT);
        const sc = g.scene;
        ringT = setTimeout(() => { if (g.scene !== sc || g.done) return; judge(g); }, 2600);
      }
    });
    async function ringBell(g) {
      bellSound(g);
      g.tween(jig, { a: .06 }, .15).then(() => g.tween(jig, { a: 0 }, .5));
      await g.tween(bell.rotation, { x: .3 }, .35, 'out');
      await g.tween(bell.rotation, { x: -.16 }, .5);
      await g.tween(bell.rotation, { x: 0 }, .6);
    }
    function judge(g) {
      if (s.revealed) return;
      if (s.rings === 3) reveal(g);
      else g.say(s.rings < 3 ? '종소리가 잦아든다. …아무 일도 일어나지 않았다.' : '종소리가 어지럽게 엉킨다. 아무 일도 일어나지 않았다.');
      s.rings = 0;
    }
    // 먼지 떨어지기
    const dustN = 120, dpos = new Float32Array(dustN * 3), dvel = [];
    const dgeo = new THREE.BufferGeometry(); dgeo.setAttribute('position', new THREE.BufferAttribute(dpos, 3));
    const dmat = new THREE.PointsMaterial({ color: 0x8a7458, size: .03, transparent: true, opacity: .9, depthWrite: false });
    const dpts = new THREE.Points(dgeo, dmat); dpts.visible = false; K.scene.add(dpts);
    let dustT = -1;
    function reveal(g) {
      s.revealed = true; g.sound.play('magic'); redrawFace(true);
      const hs = Object.keys(MARKS).map(Number);
      for (let i = 0; i < dustN; i++) {
        const a = hs[i % 4] / 12 * TAU, r = FR * .5 + (Math.random() - .5) * .3;
        dpos[i * 3] = -Math.sin(a) * r + (Math.random() - .5) * .2; dpos[i * 3 + 1] = FY + Math.cos(a) * r + (Math.random() - .5) * .2; dpos[i * 3 + 2] = NZ + .06 + Math.random() * .05;
        dvel[i] = .3 + Math.random() * .6;
      }
      dgeo.attributes.position.needsUpdate = true; dpts.visible = true; dmat.opacity = .9; dustT = 0;
      g.say('종의 울림에 시계 유리가 떨린다. 먼지가 우수수 떨어지고… 숫자 넷 곁에 금빛 글자가 드러났다!');
    }
    K.onUpdate(dt => {
      if (dustT < 0) return;
      dustT += dt;
      for (let i = 0; i < dustN; i++) { dpos[i * 3 + 1] -= dvel[i] * dt; dpos[i * 3 + 2] += dt * .05; }
      dgeo.attributes.position.needsUpdate = true; dmat.opacity = Math.max(0, .9 - dustT * .3);
      if (dustT > 3.2) { dpts.visible = false; dustT = -1; }
    });
    function timeSet(g) {
      if (s.timeSet) return;
      s.timeSet = true; g.sound.play('unlock');
      g.tween(rope, { len: 5.4 }, 1.8);
      g.say('철컥! 시계 속에서 걸쇠가 풀렸다. 종 줄이 스르르 내려온다.');
    }

    // ---------- 마지막: 시계 유리가 열린다 ----------
    const motes = [];
    for (let i = 0; i < 15; i++) {
      const m = K.sphere(.05, MAT.glow(i === 14 ? 0xffffff : 0xffe2a0, 6), { at: [0, FY, NZ + .3], shadow: false });
      m.visible = false; m.userData.noRay = true; motes.push(m);
    }
    K.zone('watch', { pos: [-.6, 2.6, 1.6], look: [0, 3.0, -3.4], fov: 62, range: .3 });
    K.zone('sky', { pos: [0, FY, NZ - 1.3], look: [0, FY + .9, -25], fov: 62, range: .3 });
    async function finale(g) {
      s.final = true; g.sound.play('unlock');
      g.goZone('watch');   // 유리 문이 안쪽으로 열리므로 한 걸음 물러선다
      g.tween(lockPlate.rotation, { z: lockPlate.rotation.z + TAU }, 1.4);
      g.tween(run, { v: 4 }, 2);
      ringBell(g);
      await g.wait(1.3);
      g.sound.play('open');
      g.tween(moon, { intensity: 24 }, 3);
      await g.tween(fp.rotation, { y: 1.55 }, 2.6);
      g.goZone('sky'); g.sound.play('magic');
      const r = K.rng(15);
      motes.forEach((m, i) => {
        m.visible = true;
        g.wait(i * .12).then(() => g.tween(m.position, { x: (r() - .5) * 26, y: 7 + r() * 11, z: -24 - r() * 4 }, 3.6, 'out'));
      });
      g.tween(dawn.material, { opacity: 1 }, 6);
      await g.wait(4.5); g.win();
    }

    // ---------- 기둥과 들보 ----------
    for (const x of [-W / 2 + .15, W / 2 - .15]) for (const z of [-D / 2 + .15, D / 2 - .15]) K.box(.3, H, .3, darkWood, { at: [x, H / 2, z] });
    for (const [len, at, ry] of [[W, [0, 5.3, -D / 2 + .15], 0], [W, [0, 5.3, D / 2 - .15], 0], [D, [-W / 2 + .15, 5.3, 0], Math.PI / 2], [D, [W / 2 - .15, 5.3, 0], Math.PI / 2]]) K.box(len, .28, .28, darkWood, { at, rot: [0, ry, 0] });
    for (const z of [-1.8, 1.8]) K.box(W, .22, .22, darkWood, { at: [0, 7.3, z] });
    for (const [x, z, ry] of [[-2.6, 3.2, 0], [2.6, 3.2, 0]]) K.box(.16, 1.6, .16, darkWood, { at: [x, 4.6, z], rot: [0, ry, x > 0 ? .7 : -.7] });

    // ---------- 동쪽: 작업대, 편지, 여정판, 창 ----------
    const wb = K.group({ at: [W / 2 - .45, 0, -.5], rot: [0, -Math.PI / 2, 0] });
    K.table(1.6, .8, .9, MAT.wood('#5a3a20'), { parent: wb });
    const letter = K.text(['마지막 방에 온', '손님에게', '', '— 시계공 H.'], .3, .38, { parent: wb, at: [.15, .905, .05], rot: [-Math.PI / 2, 0, .15], size: .1 });
    K.zone('bench', { pos: [1.0, 1.9, -.5], look: [3.4, 1.8, -.5], fov: 68, range: .5 });
    K.hot(letter, {
      name: '시계공의 편지', zone: 'bench', click: g => {
        s.letter = true;
        g.note('시계공의 편지', '마지막 방에 온 손님에게.\n\n이 탑의 시계는 내가 떠나던 날 멈췄다.\n톱니 하나가 녹슬어 공구함에 넣어 두었지.\n공구함의 번호는 <b>종이 태어난 해</b>. 종이 기억하고 있다.\n\n시계가 다시 가거든, 바늘을 <b>너의 여정의 수</b>에 맞추어라.\n(이 시계는 열두 시간뿐이니 넘치는 수는 접어서, 정각으로.)\n그다음엔 탑의 법대로 종을 쳐라. <b>바늘이 가리키는 시각만큼.</b>\n\n마지막 낱말은 숫자들이 작은 것부터 차례로 말해 줄 것이다.\n\n<p style="text-align:right">— 시계공 H.</p>');
      }
    });
    // 등불
    const lamp = K.group({ parent: wb, at: [-.55, .9, -.1] });
    K.cyl(.08, .09, .03, MAT.iron(), { parent: lamp });
    K.cyl(.065, .065, .18, MAT.glass(0xffe0a0, .3), { parent: lamp, at: [0, .11, 0] });
    for (let i = 0; i < 4; i++) { const a = i / 4 * TAU; K.box(.01, .2, .01, MAT.iron(), { parent: lamp, at: [Math.cos(a) * .068, .11, Math.sin(a) * .068] }); }
    K.sphere(.03, MAT.glow(0xffb347, 6), { parent: lamp, at: [0, .1, 0], shadow: false });
    K.cone(.09, .08, MAT.iron(), { parent: lamp, at: [0, .24, 0] });
    K.torus(.03, .006, MAT.iron(), { parent: lamp, at: [0, .3, 0] });
    const lampL = K.point(0xffb060, 6, 7, { parent: wb, at: [-.55, 1.1, -.1], shadow: true });
    K.onUpdate((dt, t) => { lampL.intensity = 6 + Math.sin(t * 7) * .4 + Math.random() * .4; });
    // 작업대 위 소품
    for (const [x, z, n] of [[.5, -.15, 12], [.62, .12, 9], [-.2, .2, 14]]) K.place(new THREE.Mesh(gearGeo(THREE, n, .012, .01, 0), MAT.brass()), { parent: wb, at: [x, .91, z], rot: [-Math.PI / 2, 0, x] });
    const watch = K.group({ parent: wb, at: [-.15, .91, -.2] });
    K.cyl(.05, .05, .015, MAT.gold(), { parent: watch });
    K.picture(.085, .085, (g, w) => { g.fillStyle = '#f2ead6'; g.beginPath(); g.arc(w / 2, w / 2, w / 2 - 2, 0, 7); g.fill(); g.strokeStyle = '#222'; g.lineWidth = 6; g.beginPath(); g.moveTo(w / 2, w / 2); g.lineTo(w / 2, w * .2); g.moveTo(w / 2, w / 2); g.lineTo(w * .72, w * .6); g.stroke(); }, { parent: watch, at: [0, .009, 0], rot: [-Math.PI / 2, 0, 0], transparent: true });
    K.hot(watch, { name: '회중시계', zone: 'bench', click: g => g.say('시계공의 회중시계. 이것도 멈춰 있다.') });
    K.chair(MAT.wood('#3b2312'), { at: [2.2, 0, .1], rot: [0, -Math.PI / 2 - .3, 0] });
    // 여정판
    const board = K.group({ at: [W / 2 - .03, 2.65, -.5], rot: [0, -Math.PI / 2, 0] });
    K.box(1.46, 1.92, .03, darkWood, { parent: board, at: [0, 0, -.01] });
    K.text(['열다섯 개의 문'], 1.3, .2, { parent: board, at: [0, .82, .01], bg: '#e6d6b0', color: '#5a1e10', size: .62 });
    const lines = ROOMS.map((r, i) => `${ROMAN[i]}   ${r}${i === 14 ? '  ◀ 지금 여기' : ''}`);
    K.text(lines, 1.3, 1.55, { parent: board, at: [0, -.1, .01], bg: '#e6d6b0', color: '#2b2116', size: .046, align: 'left', pad: 70 });
    K.hot(board, { name: '여정판', zone: 'bench', click: g => g.note('여정판 — 열다섯 개의 문', ROOMS.map((r, i) => `${ROMAN[i]}  ${r}${i === 14 ? '   <b>◀ 지금 여기</b>' : ''}`).join('\n')) });
    // 창 (구름이 흘러간다)
    const win = K.group({ at: [W / 2 - .02, 2.7, -2.5], rot: [0, -Math.PI / 2, 0] });
    K.picture(.8, 1.2, (g, w, h) => {
      const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#060c22'); gr.addColorStop(1, '#22365e'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
      const r = K.rng(8); g.fillStyle = '#fff'; for (let i = 0; i < 70; i++) { g.globalAlpha = .3 + r() * .7; g.fillRect(r() * w, r() * h * .8, 2, 2); } g.globalAlpha = 1;
      const mg = g.createRadialGradient(w * .62, h * .28, 0, w * .62, h * .28, w * .35); mg.addColorStop(0, 'rgba(240,240,220,.6)'); mg.addColorStop(1, 'rgba(240,240,220,0)'); g.fillStyle = mg; g.fillRect(0, 0, w, h);
      g.fillStyle = '#f4f1e0'; g.beginPath(); g.arc(w * .62, h * .28, w * .1, 0, 7); g.fill();
    }, { parent: win, emissive: .9 });
    const cloudPic = K.picture(.8, 1.2, (g, w, h) => {
      const r = K.rng(21);
      for (let i = 0; i < 9; i++) { const x = r() * w, y = h * (.15 + r() * .5), rw = w * (.2 + r() * .3); const cg = g.createRadialGradient(x, y, 0, x, y, rw); cg.addColorStop(0, 'rgba(120,135,170,.55)'); cg.addColorStop(1, 'rgba(120,135,170,0)'); g.fillStyle = cg; g.beginPath(); g.ellipse(x, y, rw, rw * .3, 0, 0, 7); g.fill(); }
    }, { parent: win, at: [0, 0, .005], transparent: true, emissive: .5 });
    cloudPic.material.map.wrapS = THREE.RepeatWrapping; cloudPic.material.map.needsUpdate = true;
    K.onUpdate(dt => { cloudPic.material.map.offset.x += dt * .012; });
    for (const x of [-.43, 0, .43]) K.box(.06, 1.3, .08, darkWood, { parent: win, at: [x, 0, .03] });
    for (const y of [-.63, 0, .63]) K.box(.92, .06, .08, darkWood, { parent: win, at: [0, y, .03] });
    K.box(1.0, .08, .25, MAT.stone('#6f675d', [.5, .3]), { parent: win, at: [0, -.68, .1] });
    K.hot(win, { name: '작은 창', click: g => g.say('달빛 아래 구름이 천천히 흘러간다. 탑 아래로 잠든 마을이 보인다.') });

    // ---------- 동남: 공구함 ----------
    const cg = K.group({ at: [W / 2 - .55, 0, 1.9], rot: [0, -Math.PI / 2, 0] });
    const chestW = MAT.wood('#5a3418');
    K.box(1.0, .04, .9, chestW, { parent: cg, at: [0, .04, 0] });
    for (const z of [-.43, .43]) K.box(1.0, .5, .04, chestW, { parent: cg, at: [0, .27, z] });
    for (const x of [-.48, .48]) K.box(.04, .5, .9, chestW, { parent: cg, at: [x, .27, 0] });
    for (const x of [-.3, .3]) for (const z of [-.455, .455]) K.box(.06, .52, .02, MAT.iron(), { parent: cg, at: [x, .27, z] });
    const lid = K.group({ parent: cg, at: [0, .52, -.45] });
    K.box(1.04, .06, .94, chestW, { parent: lid, at: [0, .03, .47] });
    for (const x of [-.3, .3]) K.box(.06, .015, .95, MAT.iron(), { parent: lid, at: [x, .065, .47] });
    const plate = K.group({ parent: cg, at: [0, .36, .46] });
    K.box(.32, .14, .02, MAT.brass(), { parent: plate });
    for (let i = 0; i < 4; i++) K.cyl(.025, .025, .05, MAT.plain(0x2a2018, .5, .6), { parent: plate, at: [-.105 + i * .07, 0, .02], rot: [0, 0, Math.PI / 2] });
    const rg = K.group({ parent: cg, at: [0, .1, 0], rot: [-Math.PI / 2, 0, .3] });
    K.place(new THREE.Mesh(gearGeo(THREE, 16, .045, .06, 5), MAT.rust('#6b5040')), { parent: rg });
    K.zone('chest', { pos: [1.6, 1.5, 1.9], look: [2.9, .35, 1.9], fov: 55, range: .5 });
    K.hot(cg, {
      name: '공구함', goto: 'chest', click: g => {
        if (s.chest) { g.say('뚜껑이 열려 있다.'); return; }
        g.lock({
          title: '공구함 자물쇠', text: '네 자리 숫자를 맞추세요.', type: 'digits', answer: '1894', onSolve: g => {
            s.chest = true; g.sound.play('open'); g.tween(lid.rotation, { x: -1.9 }, 1);
            g.say('뚜껑이 열렸다. 녹슨 톱니바퀴가 들어 있다.');
          }
        });
      }
    });
    K.hot(rg, { name: '녹슨 톱니바퀴', zone: 'chest', enabled: () => s.chest, click: g => { rg.visible = false; g.give('rustyGear'); } });

    // ---------- 남쪽: 선반, 사다리, 뚜껑문 ----------
    const sh = K.shelf(1.8, 2.0, .38, MAT.wood('#4a2c17'), 4, { at: [-1.4, 0, D / 2 - .2], rot: [0, Math.PI, 0] });
    const oil = K.group({ parent: sh, at: [-.45, sh.rowY(2), .02] }); oilModel(K, oil); oil.scale.setScalar(1.3);
    K.hot(oil, { name: '기름통', click: g => { oil.visible = false; g.give('oilCan'); } });
    const clocks = K.group({ parent: sh });
    for (const [x, r, hh, mm] of [[-.55, 1, 4, 10], [-.15, 1, 9, 35], [.35, 3, 1, 50], [.65, 3, 7, 5], [.1, 2, 6, 20]]) {
      const c = K.group({ parent: clocks, at: [x, sh.rowY(r) + .11, .05] });
      K.cyl(.1, .1, .05, MAT.wood('#3a2212'), { parent: c, rot: [Math.PI / 2, 0, 0] });
      K.picture(.16, .16, (g, w) => {
        g.fillStyle = '#efe3c4'; g.beginPath(); g.arc(w / 2, w / 2, w / 2 - 2, 0, 7); g.fill();
        g.strokeStyle = '#2a1a0a'; g.lineWidth = 12; g.lineCap = 'round';
        const hand = (a, l) => { g.beginPath(); g.moveTo(w / 2, w / 2); g.lineTo(w / 2 + Math.sin(a) * l, w / 2 - Math.cos(a) * l); g.stroke(); };
        hand((hh + mm / 60) / 12 * TAU, w * .22); g.lineWidth = 7; hand(mm / 60 * TAU, w * .36);
      }, { parent: c, at: [0, 0, .027], transparent: true, res: 128 });
    }
    K.hot(clocks, { name: '작은 시계들', click: g => g.say('작은 시계들이 저마다 다른 시각에 멈춰 있다. 이 탑의 시간은 저 큰 시계가 정한다.') });
    for (const [x, r] of [[.6, 1], [-.6, 3]]) K.lathe([[0, 0], [.05, 0], [.055, .12], [.03, .16], [.03, .19], [0, .19]], MAT.glass(0x7a6a40, .6), { parent: sh, at: [x, sh.rowY(r), .05] });
    K.torus(.07, .012, MAT.iron(), { parent: sh, at: [.2, sh.rowY(0) + .02, .05], rot: [Math.PI / 2, 0, 0] });
    K.candle({ parent: sh, at: [.55, 2.0, 0], intensity: .8, dist: 3 });
    // 사다리
    const lad = K.group({ at: [1.3, 2.0, 3.0], rot: [.2, 0, 0] });
    for (const x of [-.22, .22]) K.box(.06, 4.2, .06, wood, { parent: lad, at: [x, 0, 0] });
    for (let y = -1.8; y <= 1.9; y += .32) K.box(.44, .04, .04, wood, { parent: lad, at: [0, y, 0] });
    K.hot(lad, { name: '사다리', goto: 'bell', click: g => g.say('사다리에 올라 종을 올려다본다.') });
    // 뚜껑문
    const trap = K.group({ at: [-.2, .02, 2.75] });
    K.box(1.0, .04, 1.0, MAT.wood('#3a2414', [1, 1]), { parent: trap });
    for (const z of [-.3, .3]) K.box(1.0, .045, .06, MAT.iron(), { parent: trap, at: [0, .005, z] });
    K.torus(.07, .012, MAT.iron(), { parent: trap, at: [.3, .03, 0], rot: [Math.PI / 2, 0, 0] });
    K.hot(trap, { name: '올라온 뚜껑문', click: g => g.say('올라온 계단의 뚜껑문. 뒤로 돌아갈 길은 없다. 앞으로 나아갈 뿐.') });

    K.dust(260, [6.5, 6.5, 6.5], { opacity: .3, color: 0xcfd8ff, speed: .015 });
  },
};

// ---------- 소리 ----------
function bellSound(g) {
  const S = g.sound; if (!S.on) return;
  try { S.ensure(); [[196, .16, 4], [392, .09, 3.2], [470, .06, 2.6], [588, .05, 2.2], [784, .03, 1.6]].forEach(([f, v, d]) => S.tone(f, d, 'sine', v)); S.noise(.08, .2, 0, 600); } catch (e) { }
}

// ---------- 톱니바퀴 모양 ----------
function gearGeo(THREE, N, m, depth, spokes) {
  const rp = m * N / 2, ro = rp + m, rr = rp - 1.25 * m, p = Math.PI * 2 / N;
  const sh = new THREE.Shape();
  for (let k = 0; k < N; k++) {
    const c = k * p;
    [[rr, c - .5 * p], [rr, c - .27 * p], [ro, c - .12 * p], [ro, c + .12 * p], [rr, c + .27 * p]].forEach(([r, a], i) => {
      const x = Math.cos(a) * r, y = Math.sin(a) * r;
      if (k === 0 && i === 0) sh.moveTo(x, y); else sh.lineTo(x, y);
    });
  }
  sh.closePath();
  const hub = new THREE.Path(); hub.absarc(0, 0, Math.min(.04, rp * .2), 0, Math.PI * 2, true); sh.holes.push(hub);
  if (spokes) {
    const R1 = Math.max(rp * .3, .07), R2 = rr - m * 1.6, sw = .05 + rp * .06;
    if (R2 - R1 > .05) for (let j = 0; j < spokes; j++) {
      const a0 = j * Math.PI * 2 / spokes, a1 = (j + 1) * Math.PI * 2 / spokes;
      const h = new THREE.Path();
      h.absarc(0, 0, R2, a0 + sw / 2 / R2, a1 - sw / 2 / R2, false);
      h.absarc(0, 0, R1, a1 - sw / 2 / R1, a0 + sw / 2 / R1, true);
      sh.holes.push(h);
    }
  }
  const geo = new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: true, bevelThickness: depth * .15, bevelSize: m * .12, bevelSegments: 1, curveSegments: 10 });
  geo.translate(0, 0, -depth / 2);
  return geo;
}

// ---------- 시계 유리 (안쪽에서 보므로 숫자는 좌우로 뒤집힘) ----------
function drawFace(g, w, revealed) {
  const c = w / 2, R = c - 6;
  g.clearRect(0, 0, w, w);
  const gr = g.createRadialGradient(c, c, R * .05, c, c, R);
  gr.addColorStop(0, 'rgba(255,250,230,.97)'); gr.addColorStop(.7, 'rgba(228,233,246,.93)'); gr.addColorStop(1, 'rgba(180,196,230,.9)');
  g.fillStyle = gr; g.beginPath(); g.arc(c, c, R, 0, TAU); g.fill();
  g.strokeStyle = 'rgba(45,38,30,.5)'; g.lineWidth = 5;
  for (const k of [.3, .66]) { g.beginPath(); g.arc(c, c, R * k, 0, TAU); g.stroke(); }
  for (let i = 0; i < 12; i++) { const a = (i + .5) / 12 * TAU; g.beginPath(); g.moveTo(c + Math.sin(a) * R * .3, c - Math.cos(a) * R * .3); g.lineTo(c + Math.sin(a) * R * .85, c - Math.cos(a) * R * .85); g.stroke(); }
  g.strokeStyle = '#1d1712';
  for (let i = 0; i < 60; i++) {
    const a = i / 60 * TAU, big = i % 5 === 0, r0 = R * (big ? .86 : .895);
    g.lineWidth = big ? 9 : 4; g.beginPath(); g.moveTo(c - Math.sin(a) * r0, c - Math.cos(a) * r0); g.lineTo(c - Math.sin(a) * R * .94, c - Math.cos(a) * R * .94); g.stroke();
  }
  g.lineWidth = 6; for (const k of [.85, .955]) { g.beginPath(); g.arc(c, c, R * k, 0, TAU); g.stroke(); }
  g.lineWidth = 14; g.beginPath(); g.arc(c, c, R - 7, 0, TAU); g.stroke();
  g.fillStyle = '#17120d'; g.font = `700 ${w * .07}px 'Noto Serif KR', serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
  for (let i = 1; i <= 12; i++) {
    const a = i / 12 * TAU;
    g.save(); g.translate(c - Math.sin(a) * R * .75, c - Math.cos(a) * R * .75); g.scale(-1, 1); g.fillText(ROMAN[i - 1], 0, 0); g.restore();
  }
  for (const [hs, syl] of Object.entries(MARKS)) {
    const a = Number(hs) / 12 * TAU, x = c - Math.sin(a) * R * .5, y = c - Math.cos(a) * R * .5;
    if (!revealed) {
      const dg = g.createRadialGradient(x, y, 0, x, y, R * .15);
      dg.addColorStop(0, 'rgba(70,55,40,.9)'); dg.addColorStop(.6, 'rgba(85,68,48,.6)'); dg.addColorStop(1, 'rgba(85,68,48,0)');
      g.fillStyle = dg; g.beginPath(); g.arc(x, y, R * .15, 0, TAU); g.fill();
    } else {
      g.save(); g.shadowColor = '#ffcf5a'; g.shadowBlur = 34; g.fillStyle = '#b06a00'; g.font = `700 ${w * .11}px 'Noto Serif KR', serif`; g.fillText(syl, x, y); g.fillText(syl, x, y); g.restore();
    }
  }
}

// ---------- 밖 하늘 ----------
function drawSky(g, w, h, isDawn) {
  const gr = g.createLinearGradient(0, 0, 0, h);
  if (isDawn) { gr.addColorStop(0, '#1d2c5e'); gr.addColorStop(.42, '#6a5a8e'); gr.addColorStop(.66, '#f0906a'); gr.addColorStop(.8, '#ffd9a0'); }
  else { gr.addColorStop(0, '#03071a'); gr.addColorStop(.75, '#16285a'); gr.addColorStop(.8, '#25386a'); }
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
  const r = rngLocal(isDawn ? 3 : 7);
  g.fillStyle = '#fff';
  for (let i = 0; i < (isDawn ? 120 : 700); i++) { g.globalAlpha = .2 + r() * .8; const s = r() < .1 ? 3 : 2; g.fillRect(r() * w, r() * h * (isDawn ? .3 : .75), s, s); }
  g.globalAlpha = 1;
  if (isDawn) {
    const sg = g.createRadialGradient(w * .5, h * .8, 0, w * .5, h * .8, w * .35); sg.addColorStop(0, 'rgba(255,240,200,1)'); sg.addColorStop(.15, 'rgba(255,200,140,.7)'); sg.addColorStop(1, 'rgba(255,170,120,0)');
    g.fillStyle = sg; g.fillRect(0, 0, w, h);
  } else {
    const mx = w * .74, my = h * .22, mr = h * .05;
    const mg = g.createRadialGradient(mx, my, mr, mx, my, mr * 6); mg.addColorStop(0, 'rgba(220,230,255,.45)'); mg.addColorStop(1, 'rgba(220,230,255,0)'); g.fillStyle = mg; g.fillRect(0, 0, w, h);
    g.fillStyle = '#f6f2e2'; g.beginPath(); g.arc(mx, my, mr, 0, TAU); g.fill();
    g.fillStyle = 'rgba(200,195,175,.5)'; for (const [dx, dy, rr] of [[-.3, -.2, .2], [.25, .3, .15], [.1, -.4, .1]]) { g.beginPath(); g.arc(mx + dx * mr, my + dy * mr, rr * mr, 0, TAU); g.fill(); }
    for (let i = 0; i < 6; i++) { const x = r() * w, y = h * (.3 + r() * .35), rw = w * (.08 + r() * .12); const cg = g.createRadialGradient(x, y, 0, x, y, rw); cg.addColorStop(0, 'rgba(110,125,165,.35)'); cg.addColorStop(1, 'rgba(110,125,165,0)'); g.fillStyle = cg; g.beginPath(); g.ellipse(x, y, rw, rw * .22, 0, 0, TAU); g.fill(); }
  }
  // 마을 실루엣 (밤·새벽 같은 모양)
  const t = rngLocal(42), base = h * .82, roofs = [];
  g.fillStyle = isDawn ? '#1a1220' : '#04060c'; g.beginPath(); g.moveTo(0, h);
  let x = 0;
  while (x < w) {
    const bw = w * (.015 + t() * .03), bh = h * (.03 + t() * .08), peak = t() < .5;
    roofs.push([x, bw, bh]);
    g.lineTo(x, base - bh); if (peak) g.lineTo(x + bw / 2, base - bh - h * .025); g.lineTo(x + bw, base - bh);
    x += bw;
  }
  g.lineTo(w, h); g.closePath(); g.fill();
  g.beginPath(); g.moveTo(w * .3, base - h * .1); g.lineTo(w * .31, base - h * .22); g.lineTo(w * .32, base - h * .1); g.fill();
  for (const [x0, bw, bh] of roofs) for (let i = 0; i < 3; i++) if (t() < (isDawn ? .15 : .45)) { g.fillStyle = t() < .5 ? '#ffd27a' : '#ffb45a'; g.fillRect(x0 + bw * (.15 + t() * .6), base - bh * (.2 + t() * .6), w * .003, h * .008); }
}
function rngLocal(seed) {
  let s = seed >>> 0 || 1;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

// ---------- 물건 모양 ----------
function oilModel(K, g) {
  const m = K.MAT.plain(0x7a1e14, .4, .5);
  K.lathe([[0, 0], [.06, 0], [.065, .02], [.065, .08], [.05, .11], [.02, .12], [0, .12]], m, { parent: g });
  K.cyl(.006, .012, .16, K.MAT.brass(), { parent: g, at: [.06, .15, 0], rot: [0, 0, -.9] });
  K.torus(.035, .007, K.MAT.iron(), { parent: g, at: [-.05, .08, 0], rot: [0, 0, 0] });
}

export const solution = [
  { hot: '시계공의 편지' },
  { hot: '여정판' },
  { hot: '종' },
  { hot: '공구함', lock: '1894' },
  { hot: '녹슨 톱니바퀴' },
  { hot: '기름통' },
  { combine: ['rustyGear', 'oilCan'] },
  { hot: '빈 톱니 축', item: 'oiledGear', wait: 2.5 },
  { hot: '분침 손잡이' },
  { hot: '시침 손잡이' }, { hot: '시침 손잡이' }, { hot: '시침 손잡이', wait: 2.5 },
  { hot: '종 줄' }, { hot: '종 줄' }, { hot: '종 줄', wait: 4 },
  { hot: '중심 자물쇠', lock: ANSWER, wait: 9 },
];
