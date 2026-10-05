// 7단계: 선장실
// 흐름: 선장의 편지 → 방 안 술병 세기(초록3·갈색4·투명2) → 책상 서랍 342 → 망원경 렌즈
//       대포 포구 → 놋쇠 통 / 렌즈+통 = 망원경 → 선미 창 받침에 세우기 → 돌려 보며 섬 셋 살피기 → 해골섬(선장 깃발)
//       해도: 북쪽이 오른쪽! 해골섬 뱃길 오른·오른·아래·오른·오른·위 → ↑↑→↑↑← → 보물 상자 → 선장실 열쇠 → 문
const DIRS = ['↑', '↑', '→', '↑', '↑', '←'];
const SCOPE_ANG = [.48, 0, -.48];          // 망원경 방향: 왼쪽, 가운데, 오른쪽
const ISLAND_X = [-3.5, 0, 3.5];           // 바다 그림 속 섬 위치 (바위섬, 등대섬, 해골섬)

export default {
  title: '선장실',
  intro: '삐걱… 삐걱… 방 전체가 천천히 기운다.\n해적선 선미의 선장실이다. 문은 밖에서 잠겼고, 창밖엔 달빛 바다가 출렁인다.\n\n<i>책상 위에 선장이 남긴 편지가 있다.</i>',
  outro: '찰칵, 문이 열리고 밤바다의 짠바람이 밀려든다.\n갑판 너머 해골섬이 달빛 아래 가까워진다.\n섬 꼭대기엔 낡은 천문대 지붕이 보인다…',
  env: .3, exposure: 1.1, bloom: .5, bg: 0x05070d,
  start: { pos: [0, 1.6, 2.0], look: [0, 1.4, -2] },

  items: {
    lens: { name: '망원경 렌즈', desc: '놋쇠 테에 끼운 두툼한 유리알. 통에 끼우면 멀리 볼 수 있겠다.', model: (K, g) => { K.cyl(.06, .06, .025, K.MAT.glass(0xcfe8ff, .55), { parent: g, rot: [Math.PI / 2, 0, 0] }); K.torus(.062, .008, K.MAT.brass(), { parent: g }); } },
    tube: { name: '놋쇠 통', desc: '속이 빈 길쭉한 놋쇠 통. 한쪽 끝에 렌즈를 끼우는 홈이 있다.', model: (K, g) => tubeModel(K, g, false) },
    telescope: { name: '망원경', desc: '선장의 망원경. 받침에 세우면 먼 섬도 또렷이 보일 것이다.', model: (K, g) => tubeModel(K, g, true) },
    doorKey: { name: '선장실 열쇠', desc: '해골이 새겨진 묵직한 쇠 열쇠.', model: keyModel(0x4a4c50, 1.1) },
  },
  combos: [['lens', 'tube', 'telescope']],

  hints: [
    { when: s => !s.drawer, text: ['책상 위 선장의 편지를 읽어 보세요.', '서랍 번호는 이 방의 술병 수예요. 선반만이 아니라 책상 위, 바닥에 굴러다니는 병도 세요.', '초록 3(선반 2+책상 1), 갈색 4(선반 3+바닥 1), 투명 2(선반 1+책상 1) → 책상 서랍에 342.'] },
    { when: s => !s.tube, text: ['서쪽 벽 대포를 살펴보세요.', '대포를 누르면 포구에 박힌 것을 꺼낼 수 있어요.'] },
    { when: (s, g) => !s.scope && !g.has('telescope'), text: ['렌즈와 놋쇠 통을 합치면?', '가방에서 렌즈와 놋쇠 통을 차례로 눌러 조합하세요.'] },
    { when: s => !s.scope, text: ['선미 창 앞에 빈 받침대가 있어요.', '망원경을 고르고 받침대를 누르세요.'] },
    { when: s => !s.sawSkull, text: ['편지: 「내 깃발이 꽂힌 섬」. 선장의 깃발은 서쪽 벽의 해골 깃발이에요.', '망원경을 눌러 왼쪽·오른쪽으로 돌려 가며 섬 셋을 들여다보세요.', '망원경을 오른쪽으로 돌리고 들여다보면 해골섬이 보여요.'] },
    { when: s => !s.chest, text: ['해도에서 해골섬으로 가는 뱃길을 따라가 보세요. 화살표 한 개가 한 칸이에요.', '편지: 해도는 북쪽이 위가 아니에요. 나침반 무늬를 보면 북쪽이 오른쪽! 오른쪽=↑, 아래=→, 왼쪽=↓, 위=←.', '해골섬 뱃길: 오른쪽·오른쪽·아래·오른쪽·오른쪽·위 → 보물 상자에 ↑ ↑ → ↑ ↑ ←'] },
    { text: ['선장실 열쇠를 고르고 남쪽 문을 누르세요.'] },
  ],

  build(K) {
    const { THREE, MAT, s } = K;
    const W = 7, D = 6, H = 2.7;
    s.aim = 1;
    const wood = MAT.wood('#5a3a1e'), darkWood = MAT.wood('#2e1b0d'), plank = c => MAT.floor('#5c3b1d', c);
    const iron = MAT.iron(), brass = MAT.brass();
    const room = K.room({ w: W, d: D, h: H, floor: MAT.floor('#4a2e16'), wall: plank([1, 1]), ceil: MAT.wood('#3a2412'), trim: darkWood });
    room.children.find(c => c.name === 'wall_n').visible = false;
    // 선미 창이 뚫린 북쪽 벽
    const WY0 = 1.0, WY1 = 2.0;
    const pieces = [[W, WY0, 0, WY0 / 2], [W, H - WY1, 0, (WY1 + H) / 2], [1.45, 1, -2.775, 1.5], [.7, 1, -.8, 1.5], [.7, 1, .8, 1.5], [1.45, 1, 2.775, 1.5]];
    for (const [w, h, x, y] of pieces) K.plane(w, h, plank([w / 2, h / 2]), { at: [x, y, -D / 2] });
    for (const wx of [-1.6, 0, 1.6]) {
      const win = K.group({ at: [wx, 1.5, -D / 2] });
      const gl = K.plane(.9, 1.0, MAT.glass(0x9ab0c8, .1), { parent: win, at: [0, 0, .01] }); gl.userData.noRay = true;
      for (const x of [-.45, -.15, .15, .45]) K.box(x === -.45 || x === .45 ? .07 : .03, 1.06, .08, darkWood, { parent: win, at: [x, 0, .03] });
      for (const y of [-.5, -.17, .17, .5]) K.box(.96, y === -.5 || y === .5 ? .07 : .03, .08, darkWood, { parent: win, at: [0, y, .03] });
      K.box(1.05, .06, .22, darkWood, { parent: win, at: [0, -.55, .1] });
    }
    // 천장 들보
    for (const z of [-2.2, -.8, .6, 2.0]) K.box(W, .16, .2, darkWood, { at: [0, H - .08, z] });
    for (const x of [-3.4, 3.4]) for (const z of [-2.2, -.8, .6, 2.0]) K.box(.12, H, .16, darkWood, { at: [x, H / 2, z] });

    // ---------- 빛 ----------
    K.scene.add(new THREE.HemisphereLight(0x9fb0d0, 0x3a2614, 1.0));
    K.spot(0x9fb4e0, 5, 10, [0, 0, -.5], { at: [0, 2.4, -3.3], angle: .75, penumbra: .8 });
    // 흔들리는 등불
    const pend = K.group({ at: [0, H - .02, -.45] });
    K.cyl(.006, .006, .55, iron, { parent: pend, at: [0, -.27, 0] });
    const lb = K.group({ parent: pend, at: [0, -.72, 0] });
    K.cone(.12, .12, brass, { parent: lb, at: [0, .2, 0] });
    K.torus(.03, .006, brass, { parent: lb, at: [0, .28, 0] });
    const lg = K.cyl(.085, .085, .22, MAT.glass(0xffe2b0, .3), { parent: lb, at: [0, .04, 0], shadow: false }); lg.userData.noRay = true;
    for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + .4; K.box(.012, .24, .012, brass, { parent: lb, at: [Math.sin(a) * .09, .04, Math.cos(a) * .09] }); }
    K.cyl(.1, .1, .04, brass, { parent: lb, at: [0, -.09, 0] });
    K.sphere(.025, MAT.glow(0xffc070, 7), { parent: lb, at: [0, .02, 0], scale: [1, 1.8, 1], shadow: false }).userData.noRay = true;
    const lamp = K.point(0xffbf78, 8, 10, { parent: lb, at: [0, -.05, 0], shadow: true, res: 1024 });

    // ---------- 가운데: 해도 탁자 ----------
    const table = K.table(1.6, 1.0, .82, wood, { at: [0, 0, -.4] });
    const chart = K.picture(1.3, .85, drawChart, { parent: table, at: [0, .822, -.02], rot: [-Math.PI / 2, 0, 0], res: 1024 });
    K.zone('table', { pos: [0, 1.85, .65], look: [0, .8, -.42], fov: 55, range: .5 });
    K.hot(chart, { name: '해도', zone: 'table', click: g => imgNote(g, '검은 돛 선장의 해도', 1024, 670, drawChart, '세 뱃길이 배에서 세 섬으로 이어진다. 화살표 하나가 한 칸이다.\n오른쪽 아래에 나침반 무늬가 있다.') });
    const comp = K.group({ parent: table, at: [.72, .83, -.62] });
    K.cyl(.065, .07, .03, brass, { parent: comp, at: [0, .015, 0] });
    K.picture(.11, .11, (g, w) => { const c = w / 2; g.fillStyle = '#efe4c8'; g.beginPath(); g.arc(c, c, c, 0, 7); g.fill(); g.fillStyle = '#2a1e12'; g.font = "900 60px 'Noto Serif KR'"; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('북', c, c * .35); }, { parent: comp, at: [0, .031, 0], rot: [-Math.PI / 2, 0, 0], res: 256 });
    const needle = K.group({ parent: comp, at: [0, .035, 0] });
    K.cone(.008, .09, MAT.plain(0xb02a1a, .4), { parent: needle, at: [0, 0, -.022], rot: [-Math.PI / 2, 0, 0] });
    K.cone(.008, .045, MAT.plain(0xdddddd, .4), { parent: needle, at: [0, 0, .022], rot: [Math.PI / 2, 0, 0] });
    K.cyl(.07, .07, .005, MAT.glass(0xffffff, .15), { parent: comp, at: [0, .04, 0] }).userData.noRay = true;
    K.hot(comp, { name: '놋쇠 나침반', zone: 'table', click: g => g.say('바늘이 떨며 선미 창 쪽을 가리킨다. 이 배의 북쪽은 창 너머다.') });
    // 디바이더, 컵
    for (const a of [-.25, .25]) K.box(.006, .006, .2, iron, { parent: table, at: [-.55 + a * .1, .83, .02], rot: [0, a, 0] });
    const mug = K.group({ parent: table, at: [-.7, .82, -.75] });
    K.cyl(.045, .04, .1, MAT.plain(0x8a8f92, .35, .8), { parent: mug, at: [0, .05, 0] });
    K.torus(.03, .007, MAT.plain(0x8a8f92, .35, .8), { parent: mug, at: [.05, .05, 0] });

    // ---------- 바닥: 굴러다니는 병 ----------
    const roll = K.group({ at: [-1.0, .042, 1.05] });
    bottle(K, roll, 'b', [0, 0, -.15], [Math.PI / 2, 0, 0]);
    K.hot(roll, { name: '굴러다니는 병', click: g => g.say('배가 기울 때마다 데굴데굴 굴러다니는 갈색 병. 텅 비었다.') });

    // ---------- 북쪽: 망원경 받침, 지구의 ----------
    const stand = K.group({ at: [0, 0, -2.35] });
    for (let i = 0; i < 3; i++) { const a = i / 3 * Math.PI * 2 + .5; K.cyl(.018, .022, 1.25, wood, { parent: stand, at: [Math.sin(a) * .16, .6, Math.cos(a) * .16], rot: [Math.cos(a) * .26, 0, -Math.sin(a) * .26] }); }
    K.cyl(.05, .06, .08, brass, { parent: stand, at: [0, 1.2, 0] });
    const yoke = K.group({ parent: stand, at: [0, 1.25, 0] });
    for (const x of [-.06, .06]) K.box(.012, .1, .03, brass, { parent: yoke, at: [x, .04, 0] });
    const scope = K.group({ parent: yoke, at: [0, .08, 0], rot: [0, SCOPE_ANG[1], 0] });
    const scopeBody = K.group({ parent: scope, rot: [.06, 0, 0] }); tubeModel(K, scopeBody, true, 1.6);
    scope.visible = false;
    K.zone('scope', { pos: [0, 1.6, -1.3], look: [0, 1.35, -3], fov: 55, range: .5 });
    K.hot(stand, {
      name: '망원경 받침', goto: 'scope',
      click: g => g.say(s.scope ? '망원경이 단단히 서 있다.' : '선미 창 앞의 세 발 받침. 위에 무언가를 끼우는 놋쇠 고리가 비어 있다.'),
      use: { telescope: g => { s.scope = true; g.take('telescope'); scope.visible = true; g.sound.play('click'); g.say('망원경을 받침에 끼웠다. 창밖 바다를 향한다.'); } },
    });
    const VIEW = ['왼쪽', '가운데', '오른쪽'];
    K.hot(scope, {
      name: '망원경', zone: 'scope', click: g => g.choose('망원경', `지금 창밖 <b>${VIEW[s.aim]}</b>을 향하고 있다.`, [
        { label: '들여다본다', fn: g => look(g) },
        { label: '왼쪽으로 돌린다', ghost: true, fn: g => turn(g, -1) },
        { label: '오른쪽으로 돌린다', ghost: true, fn: g => turn(g, 1) },
      ])
    });
    function turn(g, d) {
      const n = s.aim + d;
      if (n < 0 || n > 2) { g.sound.play('wrong'); g.say('더는 돌아가지 않는다.'); return; }
      s.aim = n; g.sound.play('tick');
      g.tween(scope.rotation, { y: SCOPE_ANG[n] }, .6);
      g.say(`망원경을 ${VIEW[n]}으로 돌렸다.`);
    }
    function look(g) {
      if (s.aim === 2) s.sawSkull = true;
      const text = ['뾰족한 바위만 솟은 작은 섬. 갈매기들이 맴돈다. 아무 표시도 없다.', '하얀 등대가 서 있는 섬. 불빛이 돌고 있다. 깃발은 보이지 않는다.', '해골처럼 생긴 섬! 꼭대기에 <b>해골 깃발</b>이 펄럭인다. 선장의 깃발이다.'][s.aim];
      imgNote(g, '망원경 속', 512, 512, (c, w, h) => drawView(c, w, h, s.aim), text);
    }
    const globe = K.group({ at: [2.85, 0, -2.45] });
    for (let i = 0; i < 3; i++) { const a = i / 3 * Math.PI * 2; K.cyl(.015, .02, .7, darkWood, { parent: globe, at: [Math.sin(a) * .12, .35, Math.cos(a) * .12], rot: [Math.cos(a) * .2, 0, -Math.sin(a) * .2] }); }
    K.torus(.2, .012, brass, { parent: globe, at: [0, .95, 0], rot: [0, Math.PI / 2, .4] });
    const ball = K.place(new THREE.Mesh(new THREE.SphereGeometry(.18, 40, 20), new THREE.MeshStandardMaterial({ map: K.canvasTexture(512, 256, drawGlobe), roughness: .5 })), { parent: globe, at: [0, .95, 0], rot: [0, 0, .4] });
    let spin = .15;
    K.hot(globe, { name: '지구의', click: g => { spin = 3; g.sound.play('tick'); g.say('지구의가 빙글빙글 돈다.'); } });

    // ---------- 동쪽: 술병 선반, 책상 ----------
    const rack = K.group({ at: [W / 2 - .14, 0, -1.6], rot: [0, -Math.PI / 2, 0] });
    for (const y of [1.0, 1.42]) { K.box(1.1, .03, .26, wood, { parent: rack, at: [0, y, 0] }); K.box(1.1, .04, .01, darkWood, { parent: rack, at: [0, y + .06, .12] }); }
    for (const x of [-.55, .55]) K.box(.03, .7, .26, wood, { parent: rack, at: [x, 1.2, 0] });
    [['g', -.36], ['b', -.12], ['b', .1], ['c', .32]].forEach(([k, x]) => bottle(K, rack, k, [x, 1.015, 0]));
    [['b', -.25], ['g', .2]].forEach(([k, x]) => bottle(K, rack, k, [x, 1.435, 0]));
    K.zone('rack', { pos: [1.7, 1.45, -1.6], look: [3.4, 1.25, -1.6], fov: 50, range: .4 });
    K.hot(rack, { name: '술병 선반', goto: 'rack', click: g => g.say('럼주 병들이 선반에 놓여 있다. 초록 병, 갈색 병, 투명한 병…') });

    const desk = K.group({ at: [W / 2 - .45, 0, .55], rot: [0, -Math.PI / 2, 0] });
    K.rbox(1.3, .06, .62, .015, wood, { parent: desk, at: [0, .76, 0] });
    for (const sx of [-1, 1]) K.box(.06, .73, .58, wood, { parent: desk, at: [sx * .6, .365, 0] });
    K.box(1.2, .2, .03, wood, { parent: desk, at: [0, .64, -.28] });
    const drawer = K.group({ parent: desk, at: [0, .66, .28] });
    K.box(.6, .13, .03, darkWood, { parent: drawer });
    K.box(.1, .025, .03, brass, { parent: drawer, at: [0, 0, .025] });
    K.box(.56, .1, .45, MAT.wood('#5a3a20'), { parent: drawer, at: [0, 0, -.24] });
    const lensIn = K.group({ parent: drawer, at: [0, .06, -.2], rot: [Math.PI / 2, 0, 0] });
    K.cyl(.05, .05, .02, MAT.glass(0xcfe8ff, .55), { parent: lensIn }); K.torus(.052, .007, brass, { parent: lensIn, rot: [Math.PI / 2, 0, 0] });
    const letter = K.picture(.3, .38, (g, w, h) => {
      g.fillStyle = '#e9dcbc'; g.fillRect(0, 0, w, h);
      g.strokeStyle = 'rgba(40,25,10,.6)'; g.lineWidth = 3;
      for (let i = 0; i < 12; i++) { g.beginPath(); g.moveTo(40, 80 + i * 44); for (let x = 40; x < w - 40 - (i % 4) * 30; x += 10) g.lineTo(x, 80 + i * 44 + Math.sin(x * .25 + i) * 4); g.stroke(); }
      g.fillStyle = '#8e1f1f'; g.beginPath(); g.arc(w - 80, h - 70, 34, 0, 7); g.fill();
    }, { parent: desk, at: [-.25, .792, .05], rot: [-Math.PI / 2, 0, .15] });
    K.zone('desk', { pos: [1.75, 1.5, .55], look: [3.1, .8, .55], fov: 55, range: .45 });
    K.hot(letter, {
      name: '선장의 편지', zone: 'desk', click: g => g.note('선장의 편지', '갑판장 보아라.\n\n내 책상 서랍 번호는 <b>이 방에 남은 술병 수</b>다.\n<b>초록 병, 갈색 병, 투명한 병</b> — 이 차례로 세 자리.\n선반 위만 세지 마라. 너희가 아무 데나 굴려 놓으니까.\n\n보물 상자는 <b>뱃길</b>로 연다.\n해도의 뱃길 셋 중 진짜는 <b>망원경</b>만 안다.\n<b>내 깃발</b>이 꽂힌 섬, 그리로 가는 길이다.\n\n명심해라. 내 해도는 <b>북쪽이 위가 아니다</b>.\n\n<p style="text-align:right">— 검은 돛 선장</p>')
    });
    K.hot(drawer, {
      name: '책상 서랍', zone: 'desk', click: g => {
        if (s.drawer) { g.say('서랍은 비었다.'); return; }
        g.lock({
          title: '서랍 숫자 자물쇠', text: '세 자리 숫자를 맞추세요.', type: 'digits', answer: '342', onSolve: g => {
            s.drawer = true; g.sound.play('open'); g.tween(drawer.position, { z: .6 }, .6);
            lensIn.visible = false; g.give('lens');
          }
        });
      }
    });
    bottle(K, desk, 'g', [.42, .79, -.12]);
    bottle(K, desk, 'c', [.53, .79, .02]);
    K.candle({ parent: desk, at: [-.5, .79, -.15], intensity: 1.2, dist: 3.5 });
    K.chair(MAT.wood('#3b2312'), { at: [2.35, 0, .85], rot: [0, Math.PI / 2 + .3, 0] });

    // ---------- 서쪽: 대포, 해골 깃발, 보물 상자 ----------
    const cannon = K.group({ at: [-2.75, 0, -.7] });
    K.box(.9, .26, .55, darkWood, { parent: cannon, at: [0, .25, 0] });
    for (const x of [-.32, .32]) for (const z of [-.3, .3]) K.cyl(.13, .13, .06, darkWood, { parent: cannon, at: [x, .13, z], rot: [Math.PI / 2, 0, 0] });
    K.lathe([[0, 0], [.15, 0], [.16, .08], [.13, .2], [.11, .9], [.13, .95], [.13, 1.05], [.085, 1.05], [.085, .3], [0, .3]], MAT.metal('#2a2c30', { rough: .45 }), { parent: cannon, at: [.45, .52, 0], rot: [0, 0, Math.PI / 2] });
    K.sphere(.05, MAT.metal('#2a2c30'), { parent: cannon, at: [.5, .52, 0] });
    const plug = K.cyl(.07, .07, .05, brass, { parent: cannon, at: [-.6, .52, 0], rot: [0, 0, Math.PI / 2] });
    const port = K.group({ at: [-W / 2 + .02, .6, -.7], rot: [0, Math.PI / 2, 0] });
    K.box(.7, .7, .05, plank([1, 1]), { parent: port });
    for (const y of [-.2, .2]) K.box(.72, .05, .02, iron, { parent: port, at: [0, y, .03] });
    for (const at of [[-3.1, .07, .1], [-2.96, .07, .1], [-3.03, .07, .22], [-3.03, .18, .14]]) K.sphere(.07, MAT.metal('#222428'), { at });
    K.zone('cannon', { pos: [-1.5, 1.4, -.7], look: [-3.1, .6, -.7], fov: 52, range: .45 });
    K.point(0xffb060, 2, 3, { at: [-2.2, 1.4, -.7] }); // 대포 쪽 보조 조명
    K.hot(cannon, {
      name: '대포', goto: 'cannon', click: g => {
        if (s.tube) { g.say('녹슨 대포. 포탄은 없다.'); return; }
        s.tube = true; plug.visible = false; g.sound.play('pickup');
        g.give('tube'); g.say('포구에 놋쇠 통이 쑤셔 박혀 있었다. 쑥 뽑아냈다.');
      }
    });
    const flag = K.picture(1.1, .72, (g, w, h) => {
      g.fillStyle = '#121212'; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 60; i++) { g.fillStyle = `rgba(255,255,255,${Math.random() * .04})`; g.fillRect(Math.random() * w, 0, 3, h); }
      g.fillStyle = '#ece6d6'; g.strokeStyle = '#ece6d6'; g.lineCap = 'round'; g.lineWidth = 34;
      g.beginPath(); g.moveTo(w / 2 - 150, h / 2 - 20); g.lineTo(w / 2 + 150, h / 2 + 170); g.moveTo(w / 2 + 150, h / 2 - 20); g.lineTo(w / 2 - 150, h / 2 + 170); g.stroke();
      g.beginPath(); g.arc(w / 2, h / 2 - 50, 95, 0, 7); g.fill(); g.fillRect(w / 2 - 55, h / 2, 110, 70);
      g.fillStyle = '#121212'; for (const x of [-38, 38]) { g.beginPath(); g.arc(w / 2 + x, h / 2 - 55, 26, 0, 7); g.fill(); }
      g.beginPath(); g.moveTo(w / 2, h / 2 - 20); g.lineTo(w / 2 - 12, h / 2 + 5); g.lineTo(w / 2 + 12, h / 2 + 5); g.fill();
      for (let i = 0; i < 4; i++) g.fillRect(w / 2 - 40 + i * 25, h / 2 + 35, 5, 35);
    }, { at: [-W / 2 + .02, 1.85, -.7], rot: [0, Math.PI / 2, 0] });
    K.hot(flag, { name: '해골 깃발', click: g => g.say('검은 돛 선장의 깃발. 웃는 해골과 엇갈린 뼈.') });

    const chest = K.group({ at: [-2.75, 0, 1.35], rot: [0, Math.PI / 2, 0] });
    const cw = MAT.wood('#6a4422', [1, 1]);
    K.box(.8, .42, .5, cw, { parent: chest, at: [0, .21, 0] });
    for (const x of [-.3, .3]) K.box(.05, .43, .52, iron, { parent: chest, at: [x, .21, 0] });
    const coins = K.group({ parent: chest, at: [0, .425, 0] });
    for (let i = 0; i < 24; i++) K.cyl(.025, .025, .006, MAT.gold(), { parent: coins, at: [(Math.random() - .5) * .6, Math.random() * .04, (Math.random() - .5) * .36], rot: [Math.random(), 0, Math.random()] });
    const keyIn = K.group({ parent: chest, at: [0, .44, .05], rot: [-Math.PI / 2, 0, .4], scale: .7 }); keyModel(0x4a4c50, 1.1)(K, keyIn);
    const clid = K.group({ parent: chest, at: [0, .42, -.25] });
    K.place(new THREE.Mesh(new THREE.CylinderGeometry(.25, .25, .8, 24, 1, false, 0, Math.PI), cw), { parent: clid, at: [0, 0, .25], rot: [0, 0, Math.PI / 2] });
    for (const x of [-.3, .3]) K.place(new THREE.Mesh(new THREE.CylinderGeometry(.255, .255, .05, 24, 1, true, 0, Math.PI), iron), { parent: clid, at: [x, 0, .25], rot: [0, 0, Math.PI / 2] });
    const lockPlate = K.group({ parent: chest, at: [0, .3, .26] });
    K.box(.2, .16, .02, brass, { parent: lockPlate });
    K.text(['↑', '← →', '↓'], .14, .12, { parent: lockPlate, at: [0, 0, .012], bg: '#2a1c10', color: '#e8c87a', size: .3, lh: 1.05, res: 256, font: 'sans-serif' });
    K.zone('chest', { pos: [-1.55, 1.4, 1.35], look: [-2.75, .35, 1.35], fov: 52, range: .45 });
    K.hot(chest, {
      name: '보물 상자', goto: 'chest', click: g => {
        if (s.chest) { g.say('금화가 가득하다. 하지만 지금 필요한 건 열쇠다.'); return; }
        g.lock({
          title: '뱃길 자물쇠', text: '뱃길을 방위로 차례로 누르세요.<br>↑ 북 · → 동 · ↓ 남 · ← 서', type: 'dirpad', answer: DIRS, onSolve: async g => {
            s.chest = true; g.sound.play('open');
            await g.tween(clid.rotation, { x: -1.7 }, 1);
            keyIn.visible = false; g.give('doorKey');
            g.say('금화 더미 위에 선장실 열쇠가 놓여 있었다!');
          }
        });
      }
    });
    // 침대
    const bunk = K.group({ at: [-2.35, 0, 2.5] });
    K.box(2.0, .45, .9, darkWood, { parent: bunk, at: [0, .225, 0] });
    K.box(1.9, .12, .82, MAT.fabric('#7a6a50', 0, [2, 1]), { parent: bunk, at: [0, .5, 0] });
    K.box(1.2, .06, .84, MAT.fabric('#6a1e22', 1, [2, 1]), { parent: bunk, at: [.3, .58, 0] });
    K.rbox(.4, .1, .3, .04, MAT.fabric('#d8ccb0', 0, [1, 1]), { parent: bunk, at: [-.7, .6, 0] });
    K.box(2.0, .03, .03, brass, { parent: bunk, at: [0, 1.9, -.45] });
    K.box(.5, 1.3, .03, MAT.fabric('#5a1a1e', 0, [1, 2]), { parent: bunk, at: [.72, 1.25, -.45] });
    K.hot(bunk, { name: '선장 침대', click: g => g.say('눅눅한 담요. 베개 밑엔 아무것도 없다.') });

    // ---------- 남쪽: 문 ----------
    const door = K.door({ w: 1.0, h: 2.05, mat: MAT.wood('#4a2a14', [1, 2]), frameMat: darkWood, at: [1.6, 0, D / 2 - .08], rot: [0, Math.PI, 0] });
    K.plane(1.0, 2.05, MAT.glow(0x1a2438, .7), { at: [1.6, 1.025, D / 2 - .015], rot: [0, Math.PI, 0] });
    K.hot(door.pivot, {
      name: '선장실 문', click: g => { g.sound.play('thud'); g.say('밖에서 잠겼다. 자물쇠에 해골 무늬가 새겨져 있다.'); },
      use: {
        doorKey: async g => {
          g.take('doorKey'); g.sound.play('unlock'); await g.wait(.5); g.sound.play('open');
          await g.tween(door.pivot.rotation, { y: -1.4 * door.openSign }, 1.6); g.win();
        }
      }
    });
    // 지도 액자 (장식)
    K.frame(.9, .6, (g, w, h) => { g.fillStyle = '#d9c391'; g.fillRect(0, 0, w, h); g.strokeStyle = '#6a4a22'; g.lineWidth = 3; for (let i = 0; i < 6; i++) { g.beginPath(); g.ellipse(Math.random() * w, Math.random() * h, 30 + Math.random() * 60, 20 + Math.random() * 30, Math.random(), 0, 7); g.stroke(); } g.fillStyle = '#3a2410'; g.font = "900 40px 'Noto Serif KR'"; g.textAlign = 'center'; g.fillText('남쪽 바다', w / 2, 50); }, { at: [-.4, 1.6, D / 2 - .02], rot: [0, Math.PI, 0], frameMat: darkWood });

    K.dust(160, [6.5, 2.6, 5.5], { opacity: .25 });

    // ---------- 움직임 ----------
    K.onUpdate((dt, t) => {
      pend.rotation.z = Math.sin(t * .9) * .2; pend.rotation.x = Math.sin(t * .6) * .05;
      lamp.intensity = 7.6 + Math.sin(t * 9) * .3 + Math.random() * .4;
      needle.rotation.y = Math.sin(t * 1.7) * .08;
      spin += (.15 - spin) * dt * .8; ball.rotation.y += spin * dt;
      const x = -1.0 - Math.sin(t * .55 - .8) * .55;
      roll.position.x = x; roll.rotation.z = -(x + 1.0) / .042;
    });

    // ---------- 배 전체가 흔들린다 (바다 그림은 그대로) ----------
    const ship = new THREE.Group();
    for (const c of [...K.scene.children]) ship.add(c);
    K.scene.add(ship);
    K.onUpdate((dt, t) => { ship.rotation.z = Math.sin(t * .55) * .03; ship.rotation.x = Math.sin(t * .37 + 1) * .012; ship.position.y = Math.sin(t * .55 + .5) * .03; });
    // 달빛 바다
    const sea = K.picture(26, 12, drawSea, { at: [0, 1.5, -9.5], emissive: 1, res: 2048 });
    sea.userData.noRay = true;
  },
};

// ---------- 그림 ----------
function drawSea(g, w, h) {
  const hz = h * .504, rnd = mulberry(5);
  const sky = g.createLinearGradient(0, 0, 0, hz); sky.addColorStop(0, '#050a18'); sky.addColorStop(.7, '#14234a'); sky.addColorStop(1, '#3a4f80');
  g.fillStyle = sky; g.fillRect(0, 0, w, hz);
  g.fillStyle = '#fff'; for (let i = 0; i < 500; i++) { g.globalAlpha = rnd() * .9; g.fillRect(rnd() * w, rnd() * hz * .95, 2, 2); } g.globalAlpha = 1;
  const mx = w * .535, my = h * .44;
  const glow = g.createRadialGradient(mx, my, 10, mx, my, 160); glow.addColorStop(0, 'rgba(255,250,220,.6)'); glow.addColorStop(1, 'rgba(255,250,220,0)'); g.fillStyle = glow; g.fillRect(mx - 160, my - 160, 320, 320);
  g.fillStyle = '#fbf6e0'; g.beginPath(); g.arc(mx, my, 24, 0, 7); g.fill();
  const sea = g.createLinearGradient(0, hz, 0, h); sea.addColorStop(0, '#24365e'); sea.addColorStop(.2, '#0f1a34'); sea.addColorStop(1, '#03060e');
  g.fillStyle = sea; g.fillRect(0, hz, w, h - hz);
  for (let i = 0; i < 900; i++) {
    const t = rnd(), y = hz + 2 + Math.pow(t, 1.6) * (h - hz), x = rnd() * w, near = Math.abs(x - mx) < 40 + t * 160;
    g.strokeStyle = near ? `rgba(255,245,210,${.3 + rnd() * .5})` : `rgba(150,180,230,${.05 + rnd() * .15})`;
    g.lineWidth = 1 + t * 3; const len = 6 + t * 60; g.beginPath(); g.moveTo(x, y); g.lineTo(x + len, y); g.stroke();
  }
  const ix = x => w * (x + 13) / 26, s = w / 26;   // 1m당 픽셀
  // 바위섬
  g.fillStyle = '#0a0f1c'; g.beginPath(); g.moveTo(ix(-4.1), hz + 2);
  [[-3.9, .25], [-3.7, .5], [-3.55, .3], [-3.4, .6], [-3.2, .35], [-3.0, .2], [-2.9, 0]].forEach(([x, y]) => g.lineTo(ix(x), hz - y * s));
  g.fill();
  // 등대섬
  g.beginPath(); g.moveTo(ix(-.6), hz + 2); g.quadraticCurveTo(ix(0), hz - .45 * s, ix(.6), hz + 2); g.fill();
  g.fillRect(ix(-.05), hz - .75 * s, .1 * s, .4 * s);
  g.fillStyle = '#ffe9a0'; g.beginPath(); g.arc(ix(0), hz - .78 * s, 5, 0, 7); g.fill();
  // 해골섬
  g.fillStyle = '#0a0f1c'; g.beginPath(); g.moveTo(ix(2.9), hz + 2); g.bezierCurveTo(ix(2.9), hz - .75 * s, ix(4.1), hz - .75 * s, ix(4.1), hz + 2); g.fill();
  g.fillStyle = '#26365c'; for (const x of [3.3, 3.7]) { g.beginPath(); g.arc(ix(x), hz - .32 * s, .1 * s, 0, 7); g.fill(); }
  g.fillStyle = '#0a0f1c'; g.fillRect(ix(3.5), hz - .95 * s, 2, .4 * s); g.fillRect(ix(3.5), hz - .95 * s, .2 * s, .12 * s);
}
function drawChart(g, w, h) {
  g.fillStyle = '#e8d6a8'; g.fillRect(0, 0, w, h);
  const gr = g.createRadialGradient(w / 2, h / 2, h * .3, w / 2, h / 2, w * .62); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(110,70,20,.45)'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  const X0 = 92, Y0 = 72, CW = 100, CH = 88;
  g.strokeStyle = 'rgba(90,60,30,.25)'; g.lineWidth = 2;
  for (let c = 0; c <= 8; c++) { g.beginPath(); g.moveTo(X0 + c * CW, Y0); g.lineTo(X0 + c * CW, Y0 + 6 * CH); g.stroke(); }
  for (let r = 0; r <= 6; r++) { g.beginPath(); g.moveTo(X0, Y0 + r * CH); g.lineTo(X0 + 8 * CW, Y0 + r * CH); g.stroke(); }
  const P = (c, r) => [X0 + c * CW + CW / 2, Y0 + r * CH + CH / 2];
  g.strokeStyle = 'rgba(60,90,120,.35)'; g.lineWidth = 2;
  for (let i = 0; i < 26; i++) { const x = 110 + (i * 137) % 780, y = 90 + (i * 89) % 500; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 10, y - 8, x + 20, y); g.quadraticCurveTo(x + 30, y + 8, x + 40, y); g.stroke(); }
  g.fillStyle = '#2a1e12'; g.font = "900 40px 'Noto Serif KR'"; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText('검은 돛 선장의 해도', w / 2, 38);
  const route = moves => { let [c, r] = [1, 3]; const pts = [P(c, r)]; for (const m of moves) { if (m === 'R') c++; if (m === 'L') c--; if (m === 'U') r--; if (m === 'D') r++; pts.push(P(c, r)); } return pts; };
  const drawRoute = pts => {
    g.strokeStyle = '#8e1f1f'; g.lineWidth = 5; g.setLineDash([12, 10]);
    g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.stroke(); g.setLineDash([]);
    g.fillStyle = '#8e1f1f';
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1], b = pts[i], ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
      g.save(); g.translate((a[0] + b[0]) / 2, (a[1] + b[1]) / 2); g.rotate(ang); g.beginPath(); g.moveTo(12, 0); g.lineTo(-10, -12); g.lineTo(-10, 12); g.fill(); g.restore();
    }
  };
  drawRoute(route('UUR'));
  drawRoute(route('DDRR'));
  drawRoute(route('RRDRRU'));
  // 암초
  const [rx, ry] = P(4, 3);
  g.strokeStyle = '#2a1e12'; g.lineWidth = 4;
  for (const [dx, dy] of [[-18, -14], [12, -18], [-6, 10], [20, 12]]) { g.beginPath(); g.moveTo(rx + dx - 7, ry + dy - 7); g.lineTo(rx + dx + 7, ry + dy + 7); g.moveTo(rx + dx + 7, ry + dy - 7); g.lineTo(rx + dx - 7, ry + dy + 7); g.stroke(); }
  g.font = "700 22px 'Noto Sans KR'"; g.fillStyle = '#2a1e12'; g.fillText('암초', rx, ry + 34);
  // 배
  const [sx, sy] = P(1, 3);
  g.fillStyle = '#e8d6a8'; g.beginPath(); g.arc(sx, sy, 30, 0, 7); g.fill();
  g.fillStyle = '#2a1e12'; g.beginPath(); g.moveTo(sx - 24, sy + 6); g.lineTo(sx + 24, sy + 6); g.lineTo(sx + 16, sy + 18); g.lineTo(sx - 16, sy + 18); g.fill();
  g.fillRect(sx - 2, sy - 26, 4, 32); g.beginPath(); g.moveTo(sx + 3, sy - 24); g.lineTo(sx + 20, sy); g.lineTo(sx + 3, sy); g.fill();
  // 섬 셋
  const island = (c, r, kind) => {
    const [x, y] = P(c, r);
    g.fillStyle = '#c9b07a'; g.strokeStyle = '#4a3418'; g.lineWidth = 4;
    g.beginPath(); g.ellipse(x, y, 34, 28, 0, 0, 7); g.fill(); g.stroke();
    g.fillStyle = '#2a1e12';
    if (kind === 'rock') { g.beginPath(); g.moveTo(x - 20, y + 12); g.lineTo(x - 8, y - 18); g.lineTo(x + 2, y + 2); g.lineTo(x + 12, y - 12); g.lineTo(x + 22, y + 12); g.fill(); }
    if (kind === 'light') { g.fillRect(x - 6, y - 20, 12, 32); g.fillStyle = '#c9a227'; g.beginPath(); g.arc(x, y - 22, 7, 0, 7); g.fill(); }
    if (kind === 'skull') { g.beginPath(); g.arc(x, y - 4, 18, 0, 7); g.fill(); g.fillRect(x - 10, y + 8, 20, 12); g.fillStyle = '#c9b07a'; for (const dx of [-7, 7]) { g.beginPath(); g.arc(x + dx, y - 6, 5, 0, 7); g.fill(); } }
  };
  island(2, 1, 'rock'); island(3, 5, 'light'); island(5, 3, 'skull');
  // 나침반 무늬: 북쪽이 오른쪽
  const [cx, cy] = [X0 + 7 * CW + 20, Y0 + 5 * CH + 10];
  g.fillStyle = '#e8d6a8'; g.beginPath(); g.arc(cx, cy, 62, 0, 7); g.fill();
  g.strokeStyle = '#2a1e12'; g.lineWidth = 3; g.beginPath(); g.arc(cx, cy, 44, 0, 7); g.stroke();
  const pt = (ang, len, col) => { g.fillStyle = col; g.beginPath(); g.moveTo(cx + Math.cos(ang) * len, cy + Math.sin(ang) * len); g.lineTo(cx + Math.cos(ang + Math.PI / 2) * 9, cy + Math.sin(ang + Math.PI / 2) * 9); g.lineTo(cx + Math.cos(ang - Math.PI / 2) * 9, cy + Math.sin(ang - Math.PI / 2) * 9); g.fill(); };
  pt(Math.PI / 2, 38, '#2a1e12'); pt(Math.PI, 38, '#2a1e12'); pt(-Math.PI / 2, 38, '#2a1e12'); pt(0, 50, '#b02a1a');
  g.font = "900 26px 'Noto Serif KR'"; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = '#b02a1a'; g.fillText('북', cx + 72, cy);
  g.fillStyle = '#2a1e12'; g.fillText('남', cx - 72, cy); g.fillText('동', cx, cy + 70); g.fillText('서', cx, cy - 70);
}
function drawView(g, w, h, idx) {
  g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
  g.save(); g.beginPath(); g.arc(w / 2, h / 2, w * .46, 0, 7); g.clip();
  const hz = h * .62;
  const sky = g.createLinearGradient(0, 0, 0, hz); sky.addColorStop(0, '#0a1430'); sky.addColorStop(1, '#3a5080'); g.fillStyle = sky; g.fillRect(0, 0, w, hz);
  const sea = g.createLinearGradient(0, hz, 0, h); sea.addColorStop(0, '#23355a'); sea.addColorStop(1, '#070c18'); g.fillStyle = sea; g.fillRect(0, hz, w, h - hz);
  g.strokeStyle = 'rgba(180,200,240,.25)'; g.lineWidth = 2; for (let i = 0; i < 40; i++) { const y = hz + 6 + (i * 37) % (h - hz); const x = (i * 97) % w; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 30, y); g.stroke(); }
  g.fillStyle = '#0c1222';
  if (idx === 0) {
    g.beginPath(); g.moveTo(90, hz + 4); [[130, hz - 70], [170, hz - 30], [220, hz - 140], [270, hz - 50], [320, hz - 100], [370, hz - 20], [420, hz + 4]].forEach(([x, y]) => g.lineTo(x, y)); g.fill();
    g.strokeStyle = '#dfe6f0'; g.lineWidth = 3; for (const [x, y] of [[160, 150], [300, 120], [350, 170]]) { g.beginPath(); g.moveTo(x - 12, y); g.quadraticCurveTo(x - 6, y - 8, x, y); g.quadraticCurveTo(x + 6, y - 8, x + 12, y); g.stroke(); }
  } else if (idx === 1) {
    g.beginPath(); g.moveTo(80, hz + 4); g.quadraticCurveTo(w / 2, hz - 110, w - 80, hz + 4); g.fill();
    g.fillStyle = '#e8e4da'; g.fillRect(w / 2 - 22, hz - 230, 44, 160);
    g.fillStyle = '#a82a1e'; for (let i = 0; i < 3; i++) g.fillRect(w / 2 - 22, hz - 210 + i * 50, 44, 18);
    g.fillStyle = '#1a1a1a'; g.fillRect(w / 2 - 28, hz - 250, 56, 22);
    const gl = g.createRadialGradient(w / 2, hz - 260, 4, w / 2, hz - 260, 90); gl.addColorStop(0, 'rgba(255,240,170,.95)'); gl.addColorStop(1, 'rgba(255,240,170,0)'); g.fillStyle = gl; g.fillRect(w / 2 - 90, hz - 350, 180, 180);
  } else {
    g.beginPath(); g.moveTo(70, hz + 4); g.bezierCurveTo(70, hz - 260, w - 70, hz - 260, w - 70, hz + 4); g.fill();
    g.fillStyle = '#2a3b62'; for (const dx of [-60, 60]) { g.beginPath(); g.ellipse(w / 2 + dx, hz - 95, 34, 40, 0, 0, 7); g.fill(); }
    g.beginPath(); g.moveTo(w / 2, hz - 60); g.lineTo(w / 2 - 16, hz - 25); g.lineTo(w / 2 + 16, hz - 25); g.fill();
    for (let i = 0; i < 5; i++) g.fillRect(w / 2 - 60 + i * 26, hz - 18, 12, 22);
    g.fillStyle = '#0c1222'; g.fillRect(w / 2 + 40, hz - 330, 5, 140);
    g.fillStyle = '#111'; g.fillRect(w / 2 + 45, hz - 330, 90, 58);
    g.fillStyle = '#ece6d6'; g.beginPath(); g.arc(w / 2 + 90, hz - 307, 14, 0, 7); g.fill();
    g.strokeStyle = '#ece6d6'; g.lineWidth = 5; g.beginPath(); g.moveTo(w / 2 + 70, hz - 292); g.lineTo(w / 2 + 110, hz - 278); g.moveTo(w / 2 + 110, hz - 292); g.lineTo(w / 2 + 70, hz - 278); g.stroke();
    g.fillStyle = '#111'; for (const dx of [-5, 5]) { g.beginPath(); g.arc(w / 2 + 90 + dx, hz - 309, 3, 0, 7); g.fill(); }
  }
  g.restore();
  g.strokeStyle = '#3a2a14'; g.lineWidth = 18; g.beginPath(); g.arc(w / 2, h / 2, w * .46, 0, 7); g.stroke();
  const v = g.createRadialGradient(w / 2, h / 2, w * .3, w / 2, h / 2, w * .46); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.7)'); g.fillStyle = v; g.beginPath(); g.arc(w / 2, h / 2, w * .46, 0, 7); g.fill();
}
function drawGlobe(g, w, h) {
  g.fillStyle = '#2a5a7a'; g.fillRect(0, 0, w, h);
  const rnd = mulberry(9);
  g.fillStyle = '#c9b07a';
  for (let i = 0; i < 14; i++) { const x = rnd() * w, y = h * .15 + rnd() * h * .7; g.beginPath(); g.ellipse(x, y, 20 + rnd() * 50, 12 + rnd() * 35, rnd() * 3, 0, 7); g.fill(); }
  g.strokeStyle = 'rgba(240,230,200,.4)'; g.lineWidth = 1;
  for (let i = 1; i < 12; i++) { g.beginPath(); g.moveTo(i * w / 12, 0); g.lineTo(i * w / 12, h); g.stroke(); }
  for (let i = 1; i < 6; i++) { g.beginPath(); g.moveTo(0, i * h / 6); g.lineTo(w, i * h / 6); g.stroke(); }
}
function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function imgNote(g, title, w, h, draw, text) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  g.note(title, `<img src="${c.toDataURL()}" style="width:100%;border-radius:4px">\n${text}`);
}

// ---------- 3D 모양 ----------
function bottle(K, parent, kind, at, rot) {
  const [col, op] = { g: [0x1f6a2a, .82], b: [0x5a2a0a, .88], c: [0xe8f0f0, .32] }[kind];
  const b = K.group({ parent, at, rot });
  K.lathe([[0, 0], [.04, 0], [.042, .015], [.042, .17], [.03, .205], [.015, .235], [.015, .29], [0, .29]], K.MAT.glass(col, op), { parent: b, shadow: false });
  K.cyl(.013, .013, .035, K.MAT.wood('#a07a4a'), { parent: b, at: [0, .3, 0] });
  K.cyl(.0425, .0425, .05, K.MAT.paper(), { parent: b, at: [0, .09, 0], open: true });
  return b;
}
function tubeModel(K, g, withLens, len = 1) {
  const brass = K.MAT.brass();
  K.cyl(.035, .045, .5 * len, brass, { parent: g, rot: [Math.PI / 2, 0, 0] });
  K.cyl(.048, .048, .14 * len, K.MAT.leather('#4a2414'), { parent: g, at: [0, 0, .05 * len], rot: [Math.PI / 2, 0, 0] });
  K.cyl(.02, .025, .08, brass, { parent: g, at: [0, 0, .28 * len], rot: [Math.PI / 2, 0, 0] });
  for (const z of [-.25, .25]) K.torus(.046, .006, brass, { parent: g, at: [0, 0, z * len * .95] });
  if (withLens) K.cyl(.043, .043, .01, K.MAT.glass(0xcfe8ff, .55), { parent: g, at: [0, 0, -.252 * len], rot: [Math.PI / 2, 0, 0] });
}
function keyModel(color, size) {
  return (K, g) => {
    const m = K.MAT.plain(color, .3, 1);
    K.torus(.05 * size, .014 * size, m, { parent: g, at: [-.13 * size, 0, 0] });
    K.cyl(.012 * size, .012 * size, .22 * size, m, { parent: g, rot: [0, 0, Math.PI / 2], at: [.02 * size, 0, 0] });
    K.box(.02 * size, .05 * size, .012 * size, m, { parent: g, at: [.1 * size, -.03 * size, 0] });
    K.box(.02 * size, .035 * size, .012 * size, m, { parent: g, at: [.06 * size, -.024 * size, 0] });
  };
}

export const solution = [
  { hot: '선장의 편지' },
  { hot: '술병 선반' },
  { hot: '굴러다니는 병' },
  { hot: '책상 서랍', lock: '342' },
  { hot: '대포' },
  { combine: ['lens', 'tube'] },
  { hot: '망원경 받침', item: 'telescope' },
  { hot: '망원경', choose: '오른쪽으로' },
  { hot: '망원경', choose: '들여다본다' },
  { hot: '해도' },
  { hot: '보물 상자', lock: ['↑', '↑', '→', '↑', '↑', '←'], wait: 1.5 },
  { hot: '선장실 문', item: 'doorKey', wait: 3 },
];
