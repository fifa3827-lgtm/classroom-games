// 11단계: 잠긴 온실
// 흐름: 정원 일지(피는 달 순서) → 꽃밭 이름표(3·5·6·8월) → 씨앗 상자 색 자물쇠(노·분·파·주) → 밸브 손잡이
//       손잡이를 오른쪽 빈 축에 끼우고 세 밸브 화살표를 「이어진 관」(↑ ↓ →)으로 → 분수가 솟는다
//       빈 유리병으로 분숫물 / 물뿌리개 + 분숫물 = 물 담긴 물뿌리개 → 잠든 꽃봉오리에 물 → 자라서 핀다 → 꽃 속 쪽지
//       쪽지: 피는 순서대로 이름 첫 글자 → 공구함 RAIN → 대문 열쇠 → 철문 → 탈출
const YEL = '#e8c62a', PNK = '#ee6fa6', BLU = '#3f6fe0', ORG = '#f08a24', RED = '#c62a2a', WHT = '#ececec';
const COLORS = [RED, YEL, WHT, PNK, BLU, ORG];
const SEED_ANSWER = [YEL, PNK, BLU, ORG];

export default {
  title: '잠긴 온실',
  intro: '빗소리에 눈을 떴다.\n밤의 유리 온실. 지붕을 두드리는 빗방울, 젖은 흙 냄새.\n정원으로 나가는 철문은 잠겨 있다.\n\n<i>정원사는 모든 것을 꽃의 말로 잠가 두었다고 한다.</i>',
  outro: '철문이 끼익 열리고, 젖은 정원 길이 어둠 속으로 이어진다.\n등 뒤에서 하얀 꽃 한 송이가 빗속에 빛난다…',
  env: .35, exposure: 1.1, bloom: .55, bg: 0x0a1119, fog: [0x0c141b, .03],
  start: { pos: [0, 1.6, 1.9], look: [0, 1.3, -2] },

  items: {
    handle: { name: '빨간 밸브 손잡이', desc: '둥근 쇠 바퀴. 가운데에 놋쇠 화살표가 달려 있다. 어딘가의 빈 축에 끼우는 것 같다.', model: (K, g) => valveWheel(K, g) },
    jar: { name: '빈 유리병', desc: '코르크 마개가 달린 빈 병. 물을 떠 담을 수 있겠다.', model: (K, g) => jarModel(K, g, false) },
    water: { name: '분숫물 한 병', desc: '맑은 물이 찰랑인다.', model: (K, g) => jarModel(K, g, true) },
    can: { name: '빈 물뿌리개', desc: '녹색 칠이 벗겨진 물뿌리개. 속이 텅 비었다. 위쪽 구멍이 작아서 병으로 부어 채워야 한다.', model: (K, g) => canModel(K, g) },
    canFull: { name: '물이 담긴 물뿌리개', desc: '묵직하다. 이제 꽃에 물을 줄 수 있다.', model: (K, g) => canModel(K, g) },
    gateKey: { name: '대문 열쇠', desc: '덩굴무늬가 새겨진 묵직한 쇠 열쇠.', model: keyModel(0x4a4f48, 1.1) },
  },
  combos: [['can', 'water', 'canFull']],

  hints: [
    { when: s => !s.seed, text: ['작업대 위 정원 일지를 읽어 보세요.', '씨앗 상자의 색은 꽃이 피는 달 순서예요. 동쪽 꽃밭 이름표에 달이 적혀 있어요.', '3월 노랑 → 5월 분홍 → 6월 파랑 → 8월 주황.'] },
    { when: s => !s.handle, text: ['밸브 손잡이를 남쪽 벽 물길 밸브에 쓰세요.', '손잡이가 빠진 것은 오른쪽 밸브예요. 손잡이를 고르고 오른쪽 밸브를 누르세요.'] },
    { when: s => !s.flow, text: ['밸브마다 관이 네 방향으로 나 있는데, 끝이 막히지 않고 길게 이어진 관은 하나뿐이에요.', '손잡이의 놋쇠 화살표가 이어진 관을 가리키게 돌리세요. 누를 때마다 시계 방향으로 90도.', '왼쪽 밸브는 위(↑), 가운데 밸브는 아래(↓), 오른쪽 밸브는 오른쪽(→).'] },
    { when: (s, g) => !g.has('canFull') && !s.bloom, text: ['분수 물이 얕아서 물뿌리개는 잠기지 않아요. 작업대의 빈 유리병으로 떠 보세요.', '작업대 앞 바닥의 물뿌리개도 챙기세요.', '가방에서 물뿌리개와 분숫물 한 병을 차례로 눌러 조합하세요.'] },
    { when: s => !s.bloom, text: ['구석 큰 화분의 잠든 꽃봉오리에 물을 주세요.'] },
    { when: s => !s.card, text: ['활짝 핀 꽃 한가운데에 쪽지가 있어요.'] },
    { when: s => !s.tool, text: ['쪽지: 피는 순서대로 꽃 이름의 첫 글자를 이으세요.', '이름표의 영어 이름: 3월 Ranunculus, 5월 Azalea, 6월 Iris, 8월 Nasturtium.', '남동쪽 공구함에 R·A·I·N.'] },
    { text: ['대문 열쇠를 고르고 북쪽 철문을 누르세요.'] },
  ],

  build(K) {
    const { THREE, MAT, s } = K;
    const W = 7, D = 7, EH = 2.6, RH = 3.9, HW = 3.4;
    const iron = MAT.iron({ color: 0x24302a, roughness: .5 });
    const glass = MAT.glass(0xcfe3ea, .1);
    const soil = MAT.sand('#3a2a1c', [1, 1]);
    const potMat = MAT.concrete('#a4573a', [1, 1]); potMat.side = THREE.DoubleSide;
    const LEAF = new THREE.SphereGeometry(1, 10, 6);
    const greens = ['#2f6b2a', '#3d7f34', '#255a26', '#4f8f3c'].map(c => MAT.plain(c, .5, 0, { side: THREE.DoubleSide }));
    const sway = [];
    const leaf = (parent, at, rot, sc, mat) => {
      const m = new THREE.Mesh(LEAF, mat ?? greens[0]); m.position.set(...at); m.rotation.set(...rot); m.scale.set(...sc);
      m.castShadow = m.receiveShadow = true; parent.add(m); return m;
    };
    // 밑동에서 뻗는 잎: yaw 방향, up 각도, 길이 L, 너비 w
    const blade = (parent, at, yaw, up, L, w, mat) => {
      const p = new THREE.Group(); p.position.set(...at); p.rotation.set(0, yaw, 0); parent.add(p);
      leaf(p, [0, Math.sin(up) * L, Math.cos(up) * L], [-up, 0, 0], [w, .012, L], mat); return p;
    };
    const pot = (at, r = .2, h = .3, parent) => {
      const g = K.group({ parent, at });
      K.lathe([[0, 0], [r * .7, 0], [r * .75, .02], [r * .95, h * .85], [r * 1.06, h * .87], [r * 1.06, h], [r * .93, h], [r * .9, h * .9], [0, h * .9]], potMat, { parent: g, seg: 24 });
      K.cyl(r * .9, r * .9, .02, soil, { parent: g, at: [0, h * .9, 0], seg: 20 });
      return g;
    };
    const fern = (at, sc = 1, n = 14) => {
      const g = pot(at, .2 * sc, .3 * sc);
      for (let i = 0; i < n; i++) blade(g, [0, .27 * sc, 0], i / n * Math.PI * 2 + Math.random() * .3, .2 + Math.random() * .8, (.2 + Math.random() * .12) * sc, .055 * sc, greens[i % 4]);
      return g;
    };
    const palm = (at, h = 1.7) => {
      const g = pot(at, .32, .45), trunk = MAT.wood('#5a4630');
      for (let i = 0; i < 6; i++) K.cyl(.065 - i * .005, .075 - i * .005, h / 6 + .02, trunk, { parent: g, at: [Math.sin(i * .6) * .03, .4 + (i + .5) * h / 6, 0], seg: 12 });
      const top = K.group({ parent: g, at: [0, .4 + h, 0] });
      for (let i = 0; i < 9; i++) {
        const p = blade(top, [0, 0, 0], i / 9 * Math.PI * 2, .5, .42, .09, greens[i % 4]);
        blade(p, [0, Math.sin(.5) * .84, Math.cos(.5) * .84], 0, -.55, .42, .08, greens[(i + 1) % 4]);
      }
      sway.push([top, Math.random() * 6, .035]);
      return g;
    };
    const vine = (parent, at, n) => {
      const g = K.group({ parent, at });
      K.cyl(.004, .004, n * .065, greens[2], { parent: g, at: [0, -n * .065 / 2, 0], seg: 5 });
      for (let j = 0; j < n; j++) leaf(g, [Math.sin(j * 1.7) * .03, -j * .065, Math.cos(j * 1.3) * .02], [Math.random() - .5, j * 2.1, .6 + Math.random() * .5], [.035, .006, .05], greens[j % 4]);
      sway.push([g, Math.random() * 6, .05]);
      return g;
    };

    // ---------- 바닥, 낮은 벽돌 벽, 유리벽, 지붕 ----------
    K.plane(W, D, MAT.tiles('#9c5b3b', '#7d4329', 8, [3.5, 3.5], { rough: .45 }), { rot: [-Math.PI / 2, 0, 0] });
    K.plane(40, 40, MAT.plain(0x0e1712, .95), { rot: [-Math.PI / 2, 0, 0], at: [0, -.01, 0] });
    const brick = len => MAT.brick('#7a3b28', '#a89a84', [len / 1.4, .55]);
    const capStone = MAT.stone('#8f887c', [2, .2]);
    const knee = (len, at, ry) => {
      K.box(len, .75, .2, brick(len), { at: [at[0], .375, at[1]], rot: [0, ry, 0] });
      K.box(len + .04, .06, .28, capStone, { at: [at[0], .78, at[1]], rot: [0, ry, 0] });
    };
    knee(W, [0, HW], 0); knee(D - .4, [-HW, 0], Math.PI / 2); knee(D - .4, [HW, 0], Math.PI / 2);
    knee(2.55, [-2.12, -HW], 0); knee(2.55, [2.12, -HW], 0);
    const gH = EH - .81, gY = (EH + .81) / 2;
    const pane = (w, h, at, ry) => { const p = K.plane(w, h, glass, { at, rot: [0, ry, 0] }); p.userData.noRay = true; return p; };
    pane(W - .2, gH, [0, gY, HW], Math.PI); pane(D - .2, gH, [-HW, gY, 0], Math.PI / 2); pane(D - .2, gH, [HW, gY, 0], -Math.PI / 2);
    pane(2.5, gH, [-2.15, gY, -HW], 0); pane(2.5, gH, [2.15, gY, -HW], 0); pane(1.8, EH - 2.5, [0, (EH + 2.5) / 2, -HW], 0);
    // 쇠 창살
    for (let t = -HW; t <= HW + .01; t += .68) {
      K.box(.05, gH, .06, iron, { at: [t, gY, HW] });
      K.box(.06, gH, .05, iron, { at: [-HW, gY, t] }); K.box(.06, gH, .05, iron, { at: [HW, gY, t] });
      if (Math.abs(t) > .9) K.box(.05, gH, .06, iron, { at: [t, gY, -HW] });
    }
    for (const y of [.82, 1.75, EH]) {
      K.box(W - .2, .05, .07, iron, { at: [0, y, HW] }); K.box(.07, .05, D - .2, iron, { at: [-HW, y, 0] }); K.box(.07, .05, D - .2, iron, { at: [HW, y, 0] });
      for (const x of [-2.15, 2.15]) K.box(2.5, .05, .07, iron, { at: [x, y, -HW] });
    }
    // 박공 유리
    const tri = new THREE.Shape(); tri.moveTo(-HW, EH); tri.lineTo(HW, EH); tri.lineTo(0, RH); tri.closePath();
    for (const z of [-HW, HW]) { const m = new THREE.Mesh(new THREE.ShapeGeometry(tri), glass); m.position.z = z; m.userData.noRay = true; K.scene.add(m); }
    // 경사 지붕
    const slope = Math.hypot(HW, RH - EH), ang = Math.atan2(RH - EH, HW);
    for (const sd of [-1, 1]) {
      const rg = K.group({ at: [sd * HW / 2, (EH + RH) / 2, 0], rot: [0, 0, -sd * ang] });
      const p = K.plane(slope, D - .2, glass, { parent: rg, rot: [-Math.PI / 2, 0, 0] }); p.userData.noRay = true;
      for (let z = -HW; z <= HW + .01; z += .68) K.box(slope, .06, .045, iron, { parent: rg, at: [0, -.03, z] });
      // 박공 가장자리 쇠틀
      for (const z of [-HW, HW]) K.box(slope, .07, .07, iron, { parent: rg, at: [0, -.03, z] });
    }
    K.box(.1, .12, D - .2, iron, { at: [0, RH, 0] });
    for (const x of [-HW, HW]) K.box(.1, .1, D - .2, iron, { at: [x, EH, 0] });
    for (const z of [-1.7, 0, 1.7]) K.box(2 * HW, .05, .05, iron, { at: [0, EH, z] });
    // 바깥: 비 오는 밤의 정원
    const night = [[0, 3, -10, 0], [0, 3, 10, Math.PI], [-10, 3, 0, Math.PI / 2], [10, 3, 0, -Math.PI / 2]];
    night.forEach(([x, y, z, ry], i) => K.picture(22, 9, drawNight(i * 7 + 3), { at: [x, y, z], rot: [0, ry, 0], emissive: .45, res: 1024 }));
    K.plane(1.4, 6, MAT.stone('#5a5650', [1, 3]), { rot: [-Math.PI / 2, 0, 0], at: [0, .003, -6.6] });
    const post = K.group({ at: [1.5, 0, -5.6] });
    K.cyl(.04, .05, 2, iron, { parent: post, at: [0, 1, 0] });
    K.box(.2, .26, .2, MAT.glass(0xffe2a8, .5), { parent: post, at: [0, 2.13, 0] });
    K.sphere(.06, MAT.glow(0xffd28a, 5), { parent: post, at: [0, 2.13, 0], shadow: false });
    K.cone(.17, .14, iron, { parent: post, at: [0, 2.33, 0], seg: 4 });
    K.point(0xffc27a, 3, 6, { at: [1.5, 2.1, -5.3] });

    // ---------- 빛 ----------
    const hemi = new THREE.HemisphereLight(0xa8c0d0, 0x2c2418, 1.0); K.scene.add(hemi);
    K.point(0xffd29a, 8, 11, { at: [0, 2.55, .4], shadow: true });
    K.spot(0x8fb0ff, 5, 16, [0, 0, 0], { at: [2.5, 7, -4], angle: .7, penumbra: 1 });
    const sky = K.point(0xcfe0ff, 0, 30, { at: [0, 8, -6] });
    // 가운데 등불
    lantern(K, [0, 2.6, .4], 1.0);
    // 줄 전구
    const bulbMats = [0, 1, 2].map(() => MAT.glow(0xffd59a, 3));
    for (const z of [-1.7, 0, 1.7]) {
      for (let i = 0; i <= 16; i++) {
        const x = -HW + i * (2 * HW / 16), y = EH - .02 - Math.sin(i / 16 * Math.PI) * .35;
        const b = K.sphere(.022, bulbMats[(i + Math.round(z + 2)) % 3], { at: [x, y, z], shadow: false, seg: 8 }); b.userData.noRay = true;
      }
    }
    K.point(0xffcf8a, 1.5, 5, { at: [-1.6, 2.3, 0] }); K.point(0xffcf8a, 1.5, 5, { at: [1.6, 2.3, 0] });

    // ---------- 가운데: 분수 ----------
    const fo = K.group({ at: [0, 0, -.7] });
    const fstone = MAT.stone('#a39d90', [2, 1]); fstone.side = THREE.DoubleSide;
    K.lathe([[0, 0], [.9, 0], [.92, .38], [.98, .42], [.98, .48], [.84, .48], [.8, .14], [0, .14]], fstone, { parent: fo, seg: 48 });
    K.lathe([[.18, 0], [.14, .1], [.1, .3], [.12, .7], [.09, .86], [0, .86]], fstone, { parent: fo, at: [0, .14, 0], seg: 24 });
    K.lathe([[0, 0], [.06, 0], [.38, .12], [.41, .16], [.37, .16], [0, .05]], fstone, { parent: fo, at: [0, .98, 0], seg: 32 });
    K.lathe([[0, 0], [.06, 0], [.08, .08], [.05, .18], [0, .24]], fstone, { parent: fo, at: [0, 1.12, 0], seg: 16 });
    const waterMat = MAT.plain(0x1f4a58, .05, .3, { transparent: true, opacity: .85 });
    const pool = K.cyl(.82, .82, .02, waterMat, { parent: fo, at: [0, .2, 0], seg: 40 });
    const bowlWater = K.cyl(.34, .34, .02, waterMat, { parent: fo, at: [0, 1.1, 0], seg: 24 }); bowlWater.visible = false;
    const jet = K.cyl(.015, .03, .3, MAT.glow(0xbfe6ff, .8, { transparent: true, opacity: .55 }), { parent: fo, at: [0, 1.5, 0], shadow: false });
    const sheet = K.cyl(.4, .5, .72, MAT.glow(0x9fd4f0, .5, { transparent: true, opacity: .22, side: THREE.DoubleSide, depthWrite: false }), { parent: fo, at: [0, .76, 0], open: true, shadow: false });
    for (const m of [jet, sheet, pool, bowlWater]) m.userData.noRay = true;
    jet.visible = sheet.visible = false;
    const rings = [0, 1, 2].map(i => { const r = K.torus(.3, .006, MAT.glow(0xcfefff, .5, { transparent: true, opacity: 0 }), { parent: fo, at: [0, .22, 0], rot: [Math.PI / 2, 0, 0], shadow: false }); r.userData.noRay = true; r.userData.ph = i / 3; return r; });
    const fLight = K.point(0x6fc0ff, 0, 4, { at: [0, .9, -.7] });
    const spray = makeSpray(K, [0, 1.62, -.7]);
    let flowing = false;
    K.hot(fo, {
      name: '분수', click: g => g.say(s.flow ? '맑은 물이 솟는다. 물은 얕아서 작은 그릇으로 떠야겠다.' : '바싹 마른 분수. 바닥에 흙탕물이 조금 고여 있다. 물길이 막힌 것 같다.'),
      use: {
        jar: g => {
          if (!s.flow) { g.sound.play('wrong'); g.say('고인 물은 흙탕물이다. 맑은 물이 솟아야 한다.'); return; }
          g.take('jar'); g.give('water');
        },
        can: g => { g.sound.play('wrong'); g.say('물이 얕고 물뿌리개 구멍은 작다. 병으로 떠서 부어야겠다.'); },
      },
    });
    function startFlow(g) {
      flowing = true; jet.visible = sheet.visible = bowlWater.visible = true;
      g.sound.play('open'); g.say('쿠르릉… 관을 따라 물이 달린다. 분수가 솟아오른다!');
      g.tween(pool.position, { y: .4 }, 2.5); g.tween(fLight, { intensity: 3 }, 2);
      waterMat.color.set(0x2f6f86);
    }

    // ---------- 서쪽: 작업대 ----------
    const bn = K.group({ at: [-2.95, 0, .2], rot: [0, Math.PI / 2, 0] });
    const bw = MAT.wood('#6a4a2e', [2, 1]);
    K.box(2.2, .06, .7, bw, { parent: bn, at: [0, .88, 0] });
    for (const x of [-1.02, 1.02]) for (const z of [-.3, .3]) K.box(.06, .85, .06, bw, { parent: bn, at: [x, .425, z] });
    K.box(2.1, .04, .62, bw, { parent: bn, at: [0, .25, 0] });
    for (const x of [-.7, -.2, .3, .75]) pot([x, .27, -.05], .1, .16, bn);
    K.rbox(.5, .35, .35, .06, MAT.fabric('#7a6a4a', 0, [1, 1]), { parent: bn, at: [-.75, .45, .05], rot: [0, .3, 0] });
    K.zone('bench', { pos: [-1.55, 1.55, .2], look: [-3.0, .9, .2], fov: 55, range: .5 });
    K.hot(bn, { name: '작업대', goto: 'bench', click: g => g.say('흙 묻은 정원사의 작업대. 일지와 상자가 놓여 있다.') });
    // 정원 일지
    const journal = K.group({ parent: bn, at: [-.6, .915, .05], rot: [0, .15, 0] });
    K.box(.44, .02, .3, MAT.leather('#4a2a18'), { parent: journal });
    K.text(['정원 일지', '피는 달의', '순서대로…'], .2, .27, { parent: journal, at: [-.105, .012, 0], rot: [-Math.PI / 2, 0, 0], size: .14 });
    K.text(['밸브는', '이어진 관을', '가리킨다'], .2, .27, { parent: journal, at: [.105, .012, 0], rot: [-Math.PI / 2, 0, 0], size: .14 });
    K.hot(journal, { name: '정원 일지', zone: 'bench', click: g => g.note('정원 일지 — 비 오는 목요일', '씨앗 상자는 꽃들이 <b>피는 달의 순서</b>대로\n색을 맞춰야 열린다. (꽃밭 이름표를 볼 것)\n그 안에 밸브 손잡이를 넣어 두었다.\n\n물길 밸브의 화살표는\n<b>막히지 않고 이어진 관</b>을 가리켜야 한다.\n\n구석의 이름 없는 꽃은 비 오는 밤에만 핀다.\n물을 주면, 비밀을 들려줄 것이다.\n\n<p style="text-align:right">— 정원사 M.</p>') });
    // 씨앗 상자 (색 자물쇠)
    const seed = K.group({ parent: bn, at: [.05, .91, -.05] });
    K.rbox(.44, .2, .28, .015, MAT.wood('#8a5a32'), { parent: seed, at: [0, .1, 0] });
    const seedLid = K.group({ parent: seed, at: [0, .2, -.14] });
    K.rbox(.46, .04, .3, .015, MAT.wood('#6a4020'), { parent: seedLid, at: [0, .02, .14] });
    K.text('씨 앗', .2, .06, { parent: seedLid, at: [0, .041, .14], rot: [-Math.PI / 2, 0, 0], size: .7, bg: '#6a4020', color: '#f2dca6' });
    for (let i = 0; i < 4; i++) K.cyl(.03, .03, .02, MAT.plain(0x888478, .4, .6), { parent: seed, at: [-.135 + i * .09, .1, .145], rot: [Math.PI / 2, 0, 0], seg: 16 });
    K.hot(seed, {
      name: '씨앗 상자', zone: 'bench', click: g => {
        if (s.seed) { g.say('빈 상자다. 씨앗 냄새만 남아 있다.'); return; }
        g.lock({
          title: '씨앗 상자', text: '네 칸의 색을 맞추세요. (왼쪽 칸이 먼저)', type: 'colors', symbols: COLORS, answer: SEED_ANSWER,
          onSolve: g => { s.seed = true; g.sound.play('open'); g.tween(seedLid.rotation, { x: -1.7 }, .8); g.give('handle'); },
        });
      },
    });
    // 빈 유리병
    const jarG = K.group({ parent: bn, at: [.6, .91, .12] }); jarModel(K, jarG, false);
    K.hot(jarG, { name: '빈 유리병', zone: 'bench', click: g => { jarG.visible = false; g.unhot(jarG); g.give('jar'); } });
    // 씨앗 봉투들
    const packets = K.group({ parent: bn, at: [.92, .915, .02] });
    [[YEL, '라넌큘러스'], [BLU, '아이리스'], [PNK, '진달래'], [ORG, '한련화']].forEach(([c, n], i) => K.picture(.12, .17, (g, w, h) => {
      g.fillStyle = '#efe3c4'; g.fillRect(0, 0, w, h); g.fillStyle = c; g.beginPath(); g.arc(w / 2, h * .4, w * .28, 0, 7); g.fill();
      g.fillStyle = '#3a2a1a'; g.font = "700 44px 'Noto Serif KR'"; g.textAlign = 'center'; g.fillText(n, w / 2, h * .85);
    }, { parent: packets, at: [(i % 2) * .13 - .06, .002 + i * .001, Math.floor(i / 2) * .16 - .08], rot: [-Math.PI / 2, 0, (i - 1.5) * .2], res: 256 }));
    K.hot(packets, { name: '씨앗 봉투들', zone: 'bench', click: g => g.say('씨앗 봉투들. 봉투 그림만 보고는 언제 피는지 알 수 없다.') });
    // 모종삽
    K.box(.04, .015, .14, MAT.wood('#4a2a14'), { parent: bn, at: [.35, .92, .2], rot: [0, .5, 0] });
    K.box(.07, .01, .1, MAT.metal('#8a8f96'), { parent: bn, at: [.31, .92, .1], rot: [0, .5, 0] });
    // 물뿌리개 (바닥)
    const canG = K.group({ parent: bn, at: [.65, 0, .62], rot: [0, -.6, 0], scale: 1.3 }); canModel(K, canG);
    K.hot(canG, { name: '물뿌리개', zone: 'bench', click: g => { canG.visible = false; g.unhot(canG); g.give('can'); } });
    lantern(K, [-2.55, 2.25, .2], 1.4);
    K.cyl(.006, .006, .6, iron, { at: [-2.55, 2.66, .2] });

    // ---------- 동쪽: 꽃밭과 이름표 ----------
    const fb = K.group({ at: [2.85, 0, .5], rot: [0, -Math.PI / 2, 0] });
    K.box(2.6, .5, .7, brick(2.6), { parent: fb, at: [0, .25, 0] });
    K.box(2.66, .05, .76, capStone, { parent: fb, at: [0, .5, 0] });
    K.box(2.5, .02, .6, soil, { parent: fb, at: [0, .51, 0] });
    const FL = [
      { c: BLU, kr: '아이리스', en: 'Iris', m: '6월' },
      { c: YEL, kr: '라넌큘러스', en: 'Ranunculus', m: '3월' },
      { c: ORG, kr: '한련화', en: 'Nasturtium', m: '8월' },
      { c: PNK, kr: '진달래', en: 'Azalea', m: '5월' },
    ];
    FL.forEach((f, i) => {
      const x = -.96 + i * .64, pm = MAT.plain(f.c, .45, 0, { side: THREE.DoubleSide });
      for (let k = 0; k < 3; k++) {
        const fx = x + (k - 1) * .14, fz = -.12 + (k % 2) * .1, h = .45 + k * .08 + (i % 2) * .05;
        K.cyl(.007, .009, h, greens[2], { parent: fb, at: [fx, .52 + h / 2, fz], seg: 6 });
        const hg = K.group({ parent: fb, at: [fx, .52 + h, fz], rot: [.5, k, 0] });
        for (let p = 0; p < 6; p++) { const pv = K.group({ parent: hg, rot: [0, p / 6 * Math.PI * 2, 0] }); leaf(pv, [0, .01, .045], [-.25, 0, 0], [.03, .01, .05], pm); }
        K.sphere(.018, MAT.plain(0x5a3a10, .7), { parent: hg, at: [0, .015, 0], seg: 10 });
        blade(fb, [fx, .52, fz], k * 2.1 + i, .5, .12, .035, greens[(k + i) % 4]);
      }
      K.box(.02, .4, .02, MAT.wood('#7a5a3a'), { parent: fb, at: [x, .65, .3] });
      K.text([f.en, f.kr, f.m], .44, .32, { parent: fb, at: [x, .86, .32], size: .22, lh: 1.25 });
    });
    K.zone('bed', { pos: [1.5, 1.45, .5], look: [2.9, .75, .5], fov: 55, range: .5 });
    K.hot(fb, { name: '꽃밭', goto: 'bed', click: g => g.say('이름표마다 꽃 이름과 피는 달이 적혀 있다.') });

    // ---------- 북동쪽: 잠든 꽃봉오리 ----------
    const bud = K.group({ at: [2.5, 0, -1.9] });
    pot([0, 0, 0], .3, .55, bud);
    K.text(['이름 없는 꽃', '비 오는 밤에만'], .3, .12, { parent: bud, at: [-.235, .3, .235], rot: [0, -Math.PI / 4, 0], size: .3 });
    const stemG = K.group({ parent: bud, at: [0, .5, 0], scale: [1, .4, 1] });
    K.cyl(.02, .03, 1, greens[2], { parent: stemG, at: [0, .5, 0], seg: 10 });
    for (let i = 0; i < 5; i++) blade(bud, [0, .52, 0], i * 1.3, .35, .22, .09, greens[i % 4]);
    for (let i = 0; i < 3; i++) blade(stemG, [0, .3 + i * .22, 0], i * 2.2, .5, .12, .05, greens[(i + 1) % 4]);
    const head = K.group({ parent: bud, at: [0, .9, 0] });
    const petalMat = MAT.plain('#f4f0ff', .4, 0, { emissive: 0xb8b0ff, emissiveIntensity: 0, side: THREE.DoubleSide });
    const petals = [];
    for (let i = 0; i < 7; i++) {
      const p = K.group({ parent: head, rot: [0, i / 7 * Math.PI * 2, 0] }), q = K.group({ parent: p, rot: [.12, 0, 0] });
      K.sphere(1, petalMat, { parent: q, at: [0, .13, 0], scale: [.055, .13, .014], seg: 12 });
      petals.push(q);
    }
    K.sphere(.05, greens[1], { parent: head, scale: [1, .7, 1], seg: 12 });
    const core = K.sphere(.035, MAT.glow(0xfff1b0, 3), { parent: head, at: [0, .05, 0], scale: .01, shadow: false });
    const budLight = K.point(0xd8d0ff, 0, 3.5, { parent: head, at: [0, .2, 0] });
    const card = K.text(['꽃의', '쪽지'], .1, .08, { parent: head, at: [0, .2, 0], rot: [0, Math.atan2(-1.3, 1), 0], size: .32 });
    card.visible = false;
    K.zone('bud', { pos: [1.2, 1.6, -.9], look: [2.5, 1.2, -1.9], fov: 50, range: .5 });
    K.hot(bud, {
      name: '잠든 꽃봉오리', zone: 'bud', click: g => g.say(s.bloom ? '빗속에서 빛나는 하얀 꽃.' : '단단히 오므린 하얀 꽃봉오리. 흙이 바짝 말라 있다.'),
      use: {
        canFull: async g => {
          g.take('canFull'); g.sound.play('magic'); g.say('물이 흙에 스며든다… 줄기가 꿈틀거린다!');
          g.tween(stemG.scale, { y: 1 }, 2.4, 'out'); g.tween(head.position, { y: 1.5 }, 2.4, 'out');
          await g.wait(2.2);
          petals.forEach(p => g.tween(p.rotation, { x: 1.2 }, 1.4, 'out'));
          g.tween(petalMat, { emissiveIntensity: .6 }, 1.4); g.tween(core.scale, { x: 1, y: 1, z: 1 }, 1.4); g.tween(budLight, { intensity: 3 }, 1.4);
          await g.wait(1.5);
          s.bloom = true; card.visible = true; g.sound.play('unlock');
          g.say('하얀 꽃이 활짝 피었다. 꽃 한가운데에 작은 쪽지가 꽂혀 있다.');
        },
        can: g => { g.sound.play('wrong'); g.say('물뿌리개가 비어 있다.'); },
        water: g => { g.sound.play('wrong'); g.say('병 하나로는 모자라다. 물뿌리개에 부어서 주자.'); },
      },
    });
    K.hot(card, { name: '꽃 속 쪽지', zone: 'bud', enabled: () => s.bloom, click: g => { s.card = true; g.note('꽃 속 쪽지', '<div class="big">빗속에 핀 나처럼\n네 꽃에게도 피는 순서가 있다.</div>\n\n피는 달의 순서대로\n그 <b>이름의 첫 글자</b>를 이으면\n공구함이 열린다.'); } });

    // ---------- 남쪽: 물길 밸브 ----------
    const pan = K.group({ at: [0, 0, 3.22], rot: [0, Math.PI, 0] });
    K.box(2.7, 1.6, .04, MAT.wood('#3a2a1c', [2, 1]), { parent: pan, at: [.2, 1.5, 0] });
    const pipeM = MAT.metal('#8a6a3a', { rough: .4 }), capM = MAT.plain(0xa82a1a, .5, .3);
    const P = (a, b) => pipe(K, a, b, .025, pipeM, pan);
    const Z = .09, vx = [-.65, 0, .65];
    // 이어진 관: 왼쪽 ↑, 가운데 ↓, 오른쪽 →
    P([-.65, 1.25, Z], [-.65, 1.85, Z]); P([-.65, 1.85, Z], [1.25, 1.85, Z]);
    P([0, 1.25, Z], [0, .85, Z]); P([0, .85, Z], [1.25, .85, Z]);
    P([.65, 1.25, Z], [1.25, 1.25, Z]);
    P([1.25, 1.85, Z], [1.25, .05, Z]);
    for (const p of [[-.65, 1.85], [1.25, 1.85], [0, .85], [1.25, .85], [1.25, 1.25], [1.25, .05]]) K.sphere(.034, pipeM, { parent: pan, at: [p[0], p[1], Z], seg: 12 });
    // 막힌 관 (빨간 마개)
    const dirs = [[0, 1], [1, 0], [0, -1], [-1, 0]], open = [0, 2, 1];
    vx.forEach((x, i) => dirs.forEach(([dx, dy], d) => {
      if (d === open[i]) return;
      P([x, 1.25, Z], [x + dx * .15, 1.25 + dy * .15, Z]);
      K.cyl(.036, .036, .04, capM, { parent: pan, at: [x + dx * .16, 1.25 + dy * .16, Z], rot: [0, 0, dx ? Math.PI / 2 : 0], seg: 12 });
    }));
    // 바닥 관 → 분수
    const fp = (a, b) => pipe(K, a, b, .025, pipeM);
    fp([-1.25, .05, 3.13], [-1.25, .05, -.7]); fp([-1.25, .05, -.7], [-.86, .05, -.7]);
    K.text(['물길 밸브', '화살표 → 이어진 관'], .9, .28, { parent: pan, at: [-.2, 2.13, .025], size: .3, bg: '#2a1e14', color: '#f2dca6' });
    K.text('분수로 ↓', .32, .1, { parent: pan, at: [1.25, 1.55, .12], size: .55, bg: '#e9dcbc' });
    const st = [2, 1, 0], goal = [0, 2, 1], rots = [], wheels = [];
    const names = ['왼쪽 밸브', '가운데 밸브', '오른쪽 밸브'];
    vx.forEach((x, i) => {
      const v = K.group({ parent: pan, at: [x, 1.25, Z] });
      K.cyl(.05, .05, .1, pipeM, { parent: v, at: [0, 0, .03], rot: [Math.PI / 2, 0, 0], seg: 16 });
      K.cyl(.012, .012, .1, MAT.iron(), { parent: v, at: [0, 0, .1], rot: [Math.PI / 2, 0, 0], seg: 8 });
      rots[i] = -st[i] * Math.PI / 2;
      const wh = K.group({ parent: v, at: [0, 0, .13], rot: [0, 0, rots[i]] }); valveWheel(K, wh);
      if (i === 2) wh.visible = false;
      wheels.push(wh);
      K.hot(v, {
        name: names[i], zone: 'valves', click: g => turn(g, i),
        use: i === 2 ? { handle: g => { g.take('handle'); s.handle = true; wh.visible = true; g.sound.play('click'); g.say('손잡이를 빈 축에 끼웠다. 딱 맞는다.'); } } : undefined,
      });
    });
    function turn(g, i) {
      if (s.flow) { g.say('물이 잘 흐르고 있다. 더 돌릴 필요는 없다.'); return; }
      if (i === 2 && !s.handle) { g.sound.play('wrong'); g.say('손잡이가 빠진 빈 축이다. 맨손으로는 돌릴 수 없다.'); return; }
      st[i] = (st[i] + 1) % 4; rots[i] -= Math.PI / 2; g.sound.play('switch');
      g.tween(wheels[i].rotation, { z: rots[i] }, .35);
      if (s.handle && st.every((v, k) => v === goal[k])) { s.flow = true; g.wait(.5).then(() => startFlow(g)); }
    }
    K.zone('valves', { pos: [0, 1.45, 1.75], look: [0, 1.3, 3.3], fov: 55, range: .5 });

    // ---------- 남동쪽: 공구함 ----------
    const tb = K.group({ at: [2.35, 0, 2.75], rot: [0, -1.92, 0] });
    const tw = MAT.wood('#5a3a1e', [1, 1]);
    K.box(.8, .4, .45, tw, { parent: tb, at: [0, .2, 0] });
    for (const x of [-.38, .38]) for (const z of [-.2, .2]) K.box(.05, .42, .05, MAT.brass(), { parent: tb, at: [x, .21, z] });
    const tLid = K.group({ parent: tb, at: [0, .4, -.225] });
    K.box(.82, .06, .47, tw, { parent: tLid, at: [0, .03, .225] });
    const padl = K.group({ parent: tb, at: [0, .33, .25] });
    K.torus(.035, .008, MAT.silver(), { parent: padl, at: [0, .07, 0], arc: Math.PI });
    K.rbox(.16, .1, .04, .01, MAT.brass(), { parent: padl, at: [0, .02, 0] });
    K.text('A A A A', .13, .03, { parent: padl, at: [0, .02, .021], size: .8, bg: '#222', color: '#f2dca6' });
    const tKey = K.group({ parent: tb, at: [0, .415, 0], rot: [-Math.PI / 2, 0, .4], scale: .4 }); keyModel(0x4a4f48, 1.1)(K, tKey);
    tKey.visible = false;
    K.zone('tool', { pos: [1.5, 1.35, 1.85], look: [2.35, .35, 2.75], fov: 50, range: .45 });
    K.hot(tb, {
      name: '공구함', zone: 'tool', click: g => {
        if (s.tool) { g.say('녹슨 공구들뿐이다.'); return; }
        g.lock({ title: '공구함 글자 자물쇠', text: '네 글자를 맞추세요.', type: 'letters', answer: 'RAIN', onSolve: g => { s.tool = true; g.sound.play('open'); padl.visible = false; tKey.visible = true; g.tween(tLid.rotation, { x: -1.9 }, .9); g.say('공구함이 열렸다. 안에 쇠 열쇠가 있다.'); } });
      },
    });
    K.hot(tKey, { name: '대문 열쇠', zone: 'tool', enabled: () => s.tool, click: g => { tKey.visible = false; g.unhot(tKey); g.give('gateKey'); } });
    lantern(K, [2.6, 2.2, 2.4], 1.2);
    K.cyl(.006, .006, .7, iron, { at: [2.6, 2.7, 2.4] });

    // ---------- 북쪽: 철문 ----------
    const gt = K.group({ at: [0, 0, -HW] });
    for (const x of [-.9, .9]) { K.box(.12, 2.6, .12, iron, { parent: gt, at: [x, 1.3, 0] }); K.sphere(.08, iron, { parent: gt, at: [x, 2.66, 0] }); }
    K.torus(.9, .03, iron, { parent: gt, at: [0, 2.45, 0], arc: Math.PI });
    const leafG = sd => {
      const pv = K.group({ parent: gt, at: [sd * -.84, 0, 0] });
      for (let k = 0; k < 9; k++) K.cyl(.012, .012, 2.3, iron, { parent: pv, at: [sd * (.06 + k * .09), 1.2, 0], seg: 8 });
      for (const y of [.12, 1.1, 2.3]) K.box(.8, .04, .03, iron, { parent: pv, at: [sd * .42, y, 0] });
      for (const y of [.5, 1.6]) K.torus(.13, .012, iron, { parent: pv, at: [sd * .42, y, 0] });
      K.box(.1, .22, .06, MAT.brass(), { parent: pv, at: [sd * .76, 1.1, .02] });
      return pv;
    };
    const gL = leafG(1), gR = leafG(-1);
    K.hot(gt, {
      name: '철문', click: g => { g.sound.play('thud'); g.say('굳게 잠긴 철문. 덩굴무늬 열쇠 구멍이 있다.'); },
      use: {
        gateKey: async g => {
          g.take('gateKey'); g.sound.play('unlock'); await g.wait(.5); g.sound.play('open');
          g.tween(gL.rotation, { y: 1.3 }, 1.8); await g.tween(gR.rotation, { y: -1.3 }, 1.8); g.win();
        },
      },
    });

    // ---------- 식물들 ----------
    palm([-2.75, 0, -2.75], 1.9); palm([-2.8, 0, 2.8], 1.6);
    fern([-1.0, 0, -1.6], 1.3); fern([1.1, 0, -1.5], 1.1); fern([-1.75, 0, -.9], .9); fern([1.4, 0, -2.9], 1.2); fern([-1.5, 0, -3.0], 1.0);
    fern([1.0, 0, 3.0], 1.0); fern([-1.2, 0, 2.9], .8);
    // 몬스테라처럼 큰 잎 화분
    const big = pot([.9, 0, -2.6], .26, .4);
    for (let i = 0; i < 6; i++) blade(big, [0, .38, 0], i * 1.05, .7 - (i % 2) * .3, .3, .16, greens[i % 4]);
    // 매달린 바구니와 늘어진 덩굴
    for (const [x, z] of [[-1.8, -2.0], [1.8, 1.0], [-1.6, 1.9], [1.6, -2.4]]) {
      const ry = EH + (1 - Math.abs(x) / HW) * (RH - EH), by = 2.45;
      K.cyl(.004, .004, ry - by, iron, { at: [x, (ry + by) / 2, z], seg: 4 });
      const bk = K.group({ at: [x, by, z] });
      K.lathe([[0, -.16], [.12, -.15], [.2, -.05], [.22, 0], [0, -.02]], MAT.wood('#7a5a34'), { parent: bk, seg: 20 });
      for (let i = 0; i < 8; i++) blade(bk, [0, -.02, 0], i * .8, .2, .12, .045, greens[i % 4]);
      for (let i = 0; i < 5; i++) vine(bk, [Math.cos(i * 1.3) * .17, -.05, Math.sin(i * 1.3) * .17], 9 + (i * 3) % 7);
      sway.push([bk, Math.random() * 6, .02]);
    }
    // 처마에서 늘어진 덩굴
    for (let i = 0; i < 9; i++) { vine(undefined, [-HW + .1, EH - .03, -3 + i * .75], 6 + (i * 5) % 9); vine(undefined, [HW - .1, EH - .03, -3 + i * .75], 5 + (i * 7) % 9); }
    // 흙 자루, 의자
    const sack = K.rbox(.45, .55, .3, .1, MAT.fabric('#8a7a58', 0, [1, 1]), { at: [-2.9, .27, -1.6], rot: [0, .4, .08] });
    K.hot(sack, { name: '흙 자루', click: g => g.say('「상토 20kg」 무겁기만 하다.') });
    K.chair(MAT.wood('#4a3a28'), { at: [-1.9, 0, 1.4], rot: [0, 2.2, 0] });
    K.dust(160, [6, 3, 6], { color: 0xcfe8ff, opacity: .2, speed: .015 });

    // ---------- 비, 번개, 흔들림 ----------
    const N = 700, rp = new Float32Array(N * 6), rr = K.rng(11);
    const roofY = (x, z) => (Math.abs(x) < 3.5 && Math.abs(z) < 3.5) ? EH + Math.max(0, 1 - Math.abs(x) / HW) * (RH - EH) + .05 : 0;
    const drop = (i, top) => {
      const x = (rr() - .5) * 18, z = (rr() - .5) * 18, f = roofY(x, z), y = top ? 9 + rr() * 2 : f + rr() * (10 - f);
      rp.set([x, y, z, x + .02, y + .28, z], i * 6);
    };
    for (let i = 0; i < N; i++) drop(i, false);
    const rgeo = new THREE.BufferGeometry(); rgeo.setAttribute('position', new THREE.BufferAttribute(rp, 3));
    const rain = new THREE.LineSegments(rgeo, new THREE.LineBasicMaterial({ color: 0x9fb6c8, transparent: true, opacity: .35 }));
    rain.userData.noRay = true; rain.frustumCulled = false; K.scene.add(rain);
    // 유리에 흘러내리는 물방울
    const dropMat = MAT.glass(0xe6f4ff, .55);
    const beads = [];
    for (let i = 0; i < 60; i++) {
      const side = i % 3, t = (rr() - .5) * 6.6;
      const at = side === 0 ? [-HW - .03, 0, t] : side === 1 ? [HW + .03, 0, t] : [t, 0, HW + .03];
      const b = K.sphere(.011, dropMat, { at, scale: [1, 1.6, 1], seg: 6, shadow: false }); b.userData.noRay = true;
      b.position.y = .85 + rr() * (EH - .9); beads.push([b, .05 + rr() * .2]);
    }
    let nextFlash = 5, flash = 0;
    K.onUpdate((dt, t) => {
      const a = rgeo.attributes.position.array;
      for (let i = 0; i < N; i++) {
        const k = i * 6; a[k + 1] -= dt * 7; a[k + 4] -= dt * 7;
        if (a[k + 1] < roofY(a[k], a[k + 2])) drop(i, true);
      }
      rgeo.attributes.position.needsUpdate = true;
      for (const [b, v] of beads) { b.position.y -= dt * v * (1 + Math.sin(t * 3 + b.position.x * 9) * .8); if (b.position.y < .85) b.position.y = EH - .05; }
      if (t > nextFlash) { flash = 1; nextFlash = t + 8 + Math.random() * 10; }
      flash = Math.max(0, flash - dt * 2.5);
      const f = flash > 0 && Math.random() > .35 ? flash : flash * .2;
      hemi.intensity = 1 + f * 1.6; sky.intensity = f * 60;
      bulbMats.forEach((m, i) => m.emissiveIntensity = 2.2 + Math.sin(t * 2.2 + i * 2.1) * 1.2);
      for (const [o, ph, amp] of sway) { o.rotation.z = Math.sin(t * .8 + ph) * amp; o.rotation.x = Math.cos(t * .6 + ph) * amp * .6; }
      if (flowing) {
        jet.scale.y = 1 + Math.sin(t * 13) * .08;
        sheet.material.opacity = .2 + Math.sin(t * 9) * .04;
        rings.forEach(r => { const p = (t * .5 + r.userData.ph) % 1; r.scale.setScalar(.6 + p * 1.9); r.material.opacity = (1 - p) * .45; r.position.y = pool.position.y + .015; });
      }
      spray.update(dt, flowing);
    });
  },
};

// ---------- 도구 ----------
function pipe(K, a, b, r, mat, parent) {
  const { THREE } = K;
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), d = B.clone().sub(A), len = d.length();
  const m = K.cyl(r, r, len, mat, { parent, seg: 14 });
  m.position.copy(A).add(B).multiplyScalar(.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
  return m;
}
// 분수 꼭대기에서 흩어지는 물보라
function makeSpray(K, at) {
  const { THREE } = K, n = 140, p = new Float32Array(n * 3), v = new Float32Array(n * 3);
  const reset = i => { p[i * 3] = at[0]; p[i * 3 + 1] = at[1] - 9; p[i * 3 + 2] = at[2]; v[i * 3 + 1] = -1; };
  for (let i = 0; i < n; i++) reset(i);
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(p, 3));
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ size: .025, color: 0xcfefff, transparent: true, opacity: .7, depthWrite: false }));
  pts.userData.noRay = true; pts.frustumCulled = false; K.scene.add(pts);
  let acc = 0;
  return {
    update(dt, on) {
      if (on) {
        acc += dt * 120;
        for (let i = 0; i < n && acc >= 1; i++) if (p[i * 3 + 1] < at[1] - 5) {
          const a = Math.random() * 7, sp = .3 + Math.random() * .4;
          p[i * 3] = at[0]; p[i * 3 + 1] = at[1]; p[i * 3 + 2] = at[2];
          v[i * 3] = Math.cos(a) * sp; v[i * 3 + 1] = .6 + Math.random() * .6; v[i * 3 + 2] = Math.sin(a) * sp; acc--;
        }
        acc = Math.min(acc, 5);
      }
      for (let i = 0; i < n; i++) {
        if (p[i * 3 + 1] < at[1] - 5) continue;
        v[i * 3 + 1] -= 9.8 * dt;
        p[i * 3] += v[i * 3] * dt; p[i * 3 + 1] += v[i * 3 + 1] * dt; p[i * 3 + 2] += v[i * 3 + 2] * dt;
        if (p[i * 3 + 1] < at[1] - .55) reset(i);
      }
      geo.attributes.position.needsUpdate = true;
    },
  };
}
function lantern(K, at, intensity) {
  const { MAT } = K, g = K.group({ at });
  const ir = MAT.iron({ color: 0x1e2420 });
  K.box(.2, .02, .2, ir, { parent: g, at: [0, -.15, 0] });
  K.cone(.16, .12, ir, { parent: g, at: [0, .21, 0], seg: 4, rot: [0, Math.PI / 4, 0] });
  for (const x of [-.09, .09]) for (const z of [-.09, .09]) K.box(.015, .3, .015, ir, { parent: g, at: [x, 0, z] });
  const gl = K.box(.17, .28, .17, MAT.glass(0xffe6b0, .25), { parent: g }); gl.userData.noRay = true;
  K.torus(.035, .006, ir, { parent: g, at: [0, .3, 0] });
  K.candle({ parent: g, at: [0, -.14, 0], h: .12, light: false });
  K.point(0xffb060, intensity, 4.5, { parent: g, at: [0, 0, 0] });
  g.traverse(c => { if (c.isMesh) c.castShadow = false; });
  return g;
}
function drawNight(seed) {
  return (g, w, h) => {
    let sd = seed * 977 + 1; const r = () => ((sd = (sd * 9301 + 49297) % 233280) / 233280);
    const sky = g.createLinearGradient(0, 0, 0, h); sky.addColorStop(0, '#0a121c'); sky.addColorStop(.6, '#1c2a36'); sky.addColorStop(1, '#0d1612');
    g.fillStyle = sky; g.fillRect(0, 0, w, h);
    for (let layer = 0; layer < 3; layer++) {
      g.fillStyle = ['#17232c', '#111c1b', '#0a120e'][layer]; g.beginPath(); g.moveTo(0, h);
      for (let x = 0; x <= w; x += 8) g.lineTo(x, h * (.5 + layer * .09) - Math.abs(Math.sin(x * .015 + layer * 3 + seed)) * 70 - r() * 16);
      g.lineTo(w, h); g.fill();
    }
    for (let i = 0; i < 6; i++) {
      const x = r() * w, y = h * (.58 + r() * .14), gr = g.createRadialGradient(x, y, 0, x, y, 24);
      gr.addColorStop(0, 'rgba(255,205,130,.9)'); gr.addColorStop(1, 'rgba(255,205,130,0)'); g.fillStyle = gr; g.fillRect(x - 24, y - 24, 48, 48);
    }
    g.strokeStyle = 'rgba(170,190,210,.18)'; g.lineWidth = 1;
    for (let i = 0; i < 300; i++) { const x = r() * w, y = r() * h; g.beginPath(); g.moveTo(x, y); g.lineTo(x - 3, y + 26); g.stroke(); }
  };
}
function valveWheel(K, g) {
  const red = K.MAT.metal('#8c2020', { rough: .45, metal: .6 });
  K.torus(.1, .016, red, { parent: g });
  for (let i = 0; i < 3; i++) K.box(.2, .02, .015, red, { parent: g, rot: [0, 0, i * Math.PI / 3] });
  K.cyl(.03, .03, .04, K.MAT.brass(), { parent: g, rot: [Math.PI / 2, 0, 0], seg: 16 });
  K.cone(.028, .07, K.MAT.brass(), { parent: g, at: [0, .145, .012], seg: 12 });
}
function jarModel(K, g, full) {
  K.lathe([[0, 0], [.06, 0], [.065, .02], [.065, .14], [.04, .17], [.03, .19], [.032, .21], [0, .21]], K.MAT.glass(0xd8eef0, .35), { parent: g, seg: 24 });
  K.cyl(.028, .025, .04, K.MAT.wood('#b48a5a'), { parent: g, at: [0, .22, 0], seg: 12 });
  if (full) K.cyl(.058, .058, .12, K.MAT.glass(0x3d8fb5, .7), { parent: g, at: [0, .07, 0], seg: 20 });
}
function canModel(K, g) {
  const m = K.MAT.metal('#3f6b4a', { rough: .5, metal: .5 });
  K.cyl(.11, .13, .24, m, { parent: g, at: [0, .12, 0], seg: 24 });
  K.cyl(.012, .022, .32, m, { parent: g, at: [.2, .2, 0], rot: [0, 0, -1.0], seg: 10 });
  K.cyl(.045, .02, .04, K.MAT.brass(), { parent: g, at: [.34, .29, 0], rot: [0, 0, -1.0], seg: 12 });
  K.torus(.1, .012, m, { parent: g, at: [-.02, .26, 0], arc: Math.PI });
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
  { hot: '정원 일지' },
  { hot: '꽃밭' },
  { hot: '씨앗 상자', lock: SEED_ANSWER },
  { hot: '오른쪽 밸브', item: 'handle' },
  { hot: '왼쪽 밸브' }, { hot: '왼쪽 밸브' },
  { hot: '가운데 밸브' },
  { hot: '오른쪽 밸브', wait: 1.5 },
  { hot: '빈 유리병' },
  { hot: '분수', item: 'jar' },
  { hot: '물뿌리개' },
  { combine: ['can', 'water'] },
  { hot: '잠든 꽃봉오리', item: 'canFull', wait: 5 },
  { hot: '꽃 속 쪽지' },
  { hot: '공구함', lock: 'RAIN' },
  { hot: '대문 열쇠' },
  { hot: '철문', item: 'gateKey', wait: 3 },
];
