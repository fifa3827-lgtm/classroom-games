// 13단계: 은행 대금고
// 흐름: 책상 위 전보(열쇠는 외투에, 번호는 장부에, 해지된 상자는 빔) → 경비원 외투 → 은행 열쇠
//       고객 장부: 한서진 38번(해지)·21번 → 21번 보관함 → 빨간 셀로판 + 안경테 + 편지
//       셀로판 + 안경테 = 빨간 안경 → 어지러운 무늬 판: 「광선은 낮은 것부터 높은 것 순서로」
//       왼쪽 기둥 번호판(아래부터 3·1·5·2·4) → 레이저 제어판 31524 → 광선이 꺼진다
//       편지: 별 찍힌 금괴의 숫자 왼쪽부터 → 금고 다이얼 8164 → 바퀴 여섯 번 → 빗장 풀림 → 문이 열린다 → 탈출
const TARGET = 21;

export default {
  title: '은행 대금고',
  intro: '철커덩— 육중한 문이 닫히는 소리.\n은행 마감 시각, 당신은 지하 대금고 안에 갇혔다.\n붉은 레이저가 금고 문 앞을 가로막고 있다.\n\n<i>책상 위에 누군가 남긴 전보가 있다.</i>',
  outro: '거대한 원형 문이 천천히 돌아 열린다.\n따뜻한 불빛이 비치는 계단 위로, 새벽 공기가 내려온다…',
  env: .45, exposure: .9, bloom: .55, bg: 0x050505,
  start: { pos: [0, 1.6, 2.6], look: [0, 1.5, -4] },

  items: {
    guardKey: { name: '은행 열쇠', desc: '「대금고 — 경비용」 꼬리표가 달린 놋쇠 열쇠. 보관함 열쇠 구멍에 맞을 것 같다.', model: keyModel(0xc89b4a, .9) },
    film: { name: '빨간 셀로판', desc: '손바닥만 한 빨간 투명 필름. 눈에 대면 세상이 온통 붉다.', model: (K, g) => { K.box(.16, .11, .003, K.MAT.glass(0xff2020, .6), { parent: g }); } },
    specs: { name: '알 없는 안경테', desc: '렌즈가 빠진 둥근 안경테.', model: (K, g) => specsModel(K, g, false) },
    redGlasses: { name: '빨간 안경', desc: '셀로판을 끼운 안경. 빨간 선은 사라지고 다른 색만 또렷이 보인다.', model: (K, g) => specsModel(K, g, true) },
  },
  combos: [['film', 'specs', 'redGlasses']],

  hints: [
    { when: (s, g) => !g.has('guardKey') && !s.box, text: ['남쪽 책상 위 전보를 읽어 보세요.', '은행 열쇠는 경비원 외투 주머니에 있어요. 오른쪽 뒤 옷걸이를 보세요.'] },
    { when: s => !s.box, text: ['책상 위 고객 장부에서 한서진의 보관함 번호를 찾으세요.', '한서진은 두 번 나와요. 38번은 「해지」, 즉 이미 빈 상자예요.', '왼쪽 벽 21번 보관함에 은행 열쇠를 쓰세요.'] },
    { when: s => !s.rule, text: ['가방에서 빨간 셀로판과 안경테를 조합하세요.', '빨간 안경을 고르고, 오른쪽 기둥의 어지러운 무늬 판에 쓰세요.'] },
    { when: s => !s.lasersOff, text: ['광선은 낮은 것부터 높은 것 순서로 꺼야 해요.', '왼쪽 기둥에 광선마다 번호판이 붙어 있어요. 아래에서 위로 읽으세요.', '오른쪽 기둥 레이저 제어판에 3 1 5 2 4.'] },
    { when: s => !s.dial, text: ['편지: 별이 찍힌 금괴의 숫자만, 왼쪽부터.', '왼쪽 앞 수레의 금괴를 가까이 보세요. 별은 8, 1, 6, 4에 찍혀 있어요.', '금고 다이얼에 8164.'] },
    { text: ['금고 문 가운데 바퀴를 빗장이 다 풀릴 때까지 여러 번 돌리세요.'] },
  ],

  build(K) {
    const { THREE, MAT, s } = K;
    const W = 7, D = 8, H = 3.4, DY = 1.6, DR = 1.25;
    const concrete = MAT.concrete('#8f8b84', [1, 1]);
    const steelWall = MAT.metal('#7d858b', { rough: .45, metal: .8 });
    const steelDS = MAT.metal('#5d656b', { rough: .45, metal: .8 }); steelDS.side = THREE.DoubleSide;

    // ---------- 방 ----------
    const wall = (w, h, holes, mat, at, ry) => {
      const sh = new THREE.Shape(); sh.moveTo(-w / 2, 0); sh.lineTo(w / 2, 0); sh.lineTo(w / 2, h); sh.lineTo(-w / 2, h); sh.closePath();
      for (const [x, y, r] of holes) { const p = new THREE.Path(); p.absarc(x, y, r, 0, Math.PI * 2, true); sh.holes.push(p); }
      const m = new THREE.Mesh(new THREE.ShapeGeometry(sh, 48), mat); m.position.set(...at); m.rotation.set(0, ry, 0); m.receiveShadow = true; K.scene.add(m); return m;
    };
    wall(W, H, [[0, DY, DR]], steelWall, [0, 0, -D / 2], 0);
    wall(W, H, [], concrete, [0, 0, D / 2], Math.PI);
    wall(D, H, [], concrete, [-W / 2, 0, 0], Math.PI / 2);
    wall(D, H, [], concrete, [W / 2, 0, 0], -Math.PI / 2);
    K.plane(W, D, MAT.concrete('#6f6c66', [3, 3]), { rot: [Math.PI / 2, 0, 0], at: [0, H, 0] });
    const floorTex = marble(K, true); floorTex.repeat.set(W / 2, D / 2);
    K.plane(W, D, new THREE.MeshStandardMaterial({ map: floorTex, roughness: .12, metalness: 0 }), { rot: [-Math.PI / 2, 0, 0] });
    const pillarTex = marble(K, false); pillarTex.repeat.set(1, 3);
    const marbleMat = new THREE.MeshStandardMaterial({ map: pillarTex, roughness: .18 });
    // 북쪽 강철 벽 이음새
    for (const x of [-2.4, 2.4]) K.box(.04, H, .03, MAT.iron(), { at: [x, H / 2, -D / 2 + .015] });
    K.box(W, .12, .05, MAT.iron(), { at: [0, .06, -D / 2 + .025] });
    // 걸레받이
    for (const [len, at, ry] of [[D, [-W / 2 + .02, .07, 0], Math.PI / 2], [D, [W / 2 - .02, .07, 0], -Math.PI / 2], [W, [0, .07, D / 2 - .02], Math.PI]]) K.box(len, .14, .04, MAT.metal('#3a3226'), { at, rot: [0, ry, 0] });

    // ---------- 빛 ----------
    K.scene.add(new THREE.HemisphereLight(0xdfe6f0, 0x3a3020, 1.0));
    K.point(0xfff0dc, 8, 12, { at: [0, H - .35, .6], shadow: true });
    for (const z of [-2.2, 2.4]) K.point(0xfff0dc, 3, 7, { at: [0, H - .3, z] });
    for (const x of [-1.5, 1.5]) for (const z of [-2.4, 0, 2.4]) K.box(.5, .02, 1.1, MAT.glow(0xfff4e0, 1.6), { at: [x, H - .011, z], shadow: false });
    K.spot(0xffe2b0, 14, 9, [0, DY, -D / 2], { at: [0, H - .1, -1.2], angle: .55, penumbra: .6 });
    const redLight = K.point(0xff2020, 1.8, 6, { at: [0, .9, -1.2] });

    // ---------- 양쪽 벽: 보관함 ----------
    const COLS = 8, ROWS = 6, CW = .46, CH = .38, TW = COLS * CW, TH = ROWS * CH, Y0 = .42;
    const doorMat = MAT.brass({ roughness: .32 }), bodyMat = MAT.metal('#3a3226', { rough: .5 });
    const doorGeo = new THREE.BoxGeometry(CW - .025, CH - .025, .03);
    const keyUse = n => g => {
      g.sound.play('wrong');
      g.say(n === 38 ? '열쇠가 돌아갔다… 하지만 텅 비어 있다. 안쪽에 「해지」 딱지.' : '열쇠가 들어가긴 하지만 돌아가지 않는다. 이 상자가 아니다.');
    };
    let boxPivot = null, envelope = null;
    [[-W / 2 + .02, Math.PI / 2, 0, 'westBoxes'], [W / 2 - .02, -Math.PI / 2, 48, 'eastBoxes']].forEach(([x, ry, base, zone]) => {
      const wg = K.group({ at: [x, 0, 1.3], rot: [0, ry, 0] });
      K.box(TW + .12, TH + .12, .25, bodyMat, { parent: wg, at: [0, Y0 + TH / 2, .125] });
      K.box(TW + .2, .08, .3, bodyMat, { parent: wg, at: [0, Y0 + TH + .1, .15] });
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
        const n = base + r * COLS + c + 1, bx = -TW / 2 + (c + .5) * CW, by = Y0 + TH - (r + .5) * CH;
        if (n === TARGET) {
          const blk = K.plane(CW - .04, CH - .04, MAT.plain(0x050505, .9), { parent: wg, at: [bx, by, .252] }); blk.userData.noRay = true;
          envelope = K.box(.22, .13, .012, MAT.paper(), { parent: wg, at: [bx, by - .06, .262] }); envelope.visible = false;
          boxPivot = K.group({ parent: wg, at: [bx - (CW - .025) / 2, by, .265] });
          const d = new THREE.Mesh(doorGeo, doorMat); d.position.x = (CW - .025) / 2; d.receiveShadow = true; boxPivot.add(d);
          const pl = K.picture(CW - .025, CH - .025, (g, w, h) => plate(g, w / 2, h / 2, n, w, h), { parent: boxPivot, at: [(CW - .025) / 2, 0, .03], transparent: true, res: 256 });
          pl.userData.noRay = true;
          K.hot(boxPivot, {
            name: `보관함 ${n}`, zone, click: g => g.say(s.box ? '텅 빈 보관함. 편지는 이미 꺼냈다.' : '잠긴 보관함. 열쇠 구멍이 있다.'),
            use: {
              guardKey: g => {
                if (s.box) return;
                s.box = true; g.take('guardKey'); g.sound.play('unlock'); envelope.visible = true;
                g.tween(boxPivot.rotation, { y: -1.7 }, .8);
                g.give('film'); g.give('specs', true);
                g.note('보관함 속 편지', '이 편지를 찾았다면, 너는 금고 문 앞까지 온 거다.\n\n봉투 안에 <b>빨간 셀로판</b>과 내 낡은 <b>안경테</b>를 넣어 두었다.\n그걸 쓰고 레이저 제어판 위의 무늬를 보아라.\n\n금고 문 다이얼은 수레의 금괴가 알고 있다.\n<b>별이 찍힌 금괴</b>의 숫자만, 왼쪽부터.\n\n<p style="text-align:right">— 한서진</p>');
              },
            },
          });
        } else {
          const d = new THREE.Mesh(doorGeo, doorMat); d.position.set(bx, by, .265); d.receiveShadow = true; wg.add(d);
          K.hot(d, { name: `보관함 ${n}`, zone, click: g => g.say('잠긴 보관함. 열쇠 구멍이 있다.'), use: { guardKey: keyUse(n) } });
        }
      }
      const ov = K.picture(TW, TH, (g, w, h) => {
        for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
          const n = base + r * COLS + c + 1; if (n === TARGET) continue;
          plate(g, (c + .5) * w / COLS, (r + .5) * h / ROWS, n, w / COLS, h / ROWS);
        }
      }, { parent: wg, at: [0, Y0 + TH / 2, .282], transparent: true, res: 2048 });
      ov.userData.noRay = true; ov.material.depthWrite = false; // 21번 번호판을 가리지 않게
    });
    K.zone('westBoxes', { pos: [-1.5, 1.55, 1.3], look: [-3.4, 1.45, 1.3], fov: 62, range: .8 });
    K.zone('eastBoxes', { pos: [1.5, 1.55, 1.3], look: [3.4, 1.45, 1.3], fov: 62, range: .8 });

    // ---------- 레이저와 기둥 ----------
    const LZ = -1.4, HEIGHTS = [.3, .6, .9, 1.2, 1.5], NUMS = [3, 1, 5, 2, 4];
    const westPillar = K.group({});
    for (const x of [-3.25, 3.25]) {
      K.box(.4, H, .4, marbleMat, { at: [x, H / 2, LZ], parent: x < 0 ? westPillar : undefined });
      K.box(.5, .12, .5, MAT.brass({ roughness: .4 }), { at: [x, .06, LZ] });
      K.box(.5, .12, .5, MAT.brass({ roughness: .4 }), { at: [x, H - .06, LZ] });
    }
    const beams = [];
    HEIGHTS.forEach((y, i) => {
      for (const sd of [-1, 1]) {
        K.box(.06, .07, .09, MAT.plain(0x111111, .4, .5), { at: [sd * 3.03, y, LZ] });
        K.sphere(.016, MAT.glow(0xff2020, 4), { at: [sd * 2.995, y, LZ], seg: 10, shadow: false });
      }
      const core = K.cyl(.0045, .0045, 5.98, MAT.glow(0xff2a2a, 5, { transparent: true, opacity: .95 }), { at: [0, y, LZ], rot: [0, 0, Math.PI / 2], seg: 6, shadow: false });
      const halo = K.cyl(.02, .02, 5.98, MAT.glow(0xff3030, 1.5, { transparent: true, opacity: .16, depthWrite: false }), { at: [0, y, LZ], rot: [0, 0, Math.PI / 2], seg: 10, shadow: false });
      core.userData.noRay = halo.userData.noRay = true;
      beams.push({ core, halo, n: NUMS[i] });
      // 왼쪽 기둥 앞면 번호판
      K.text(`${NUMS[i]} ▶`, .26, .16, { parent: westPillar, at: [-3.25, y, LZ + .202], size: .7, bg: '#f2ead8', color: '#8a1010' });
    });
    K.zone('beams', { pos: [-2.2, 1.0, .3], look: [-3.25, .9, -1.2], fov: 50, range: .5 });
    K.hot(westPillar, { name: '레이저 발사기', goto: 'beams', click: g => g.say('광선마다 번호판이 붙어 있다. 아래에서부터 3, 1, 5, 2, 4.') });
    K.dust(200, [6, 2, 1.2], { color: 0xffb0a0, opacity: .25, speed: .02 }).position.set(0, 0, LZ);
    // 레이저 제어판 (오른쪽 기둥 앞면)
    const cp = K.group({ at: [3.25, 1.3, LZ + .2] });
    K.rbox(.32, .42, .05, .02, MAT.metal('#2a2e33'), { parent: cp, at: [0, 0, .025] });
    const lampMat = MAT.glow(0xff2020, 3);
    K.box(.22, .06, .01, lampMat, { parent: cp, at: [0, .15, .055], shadow: false });
    K.text('LASER', .2, .05, { parent: cp, at: [0, .15, .062], size: .7, bg: null, color: '#ffffff' });
    for (let i = 0; i < 12; i++) K.box(.055, .045, .02, MAT.plain(0xd8d8d8, .4, .3), { parent: cp, at: [-.07 + (i % 3) * .07, .06 - Math.floor(i / 3) * .06, .06] });
    const pattern = K.picture(.36, .36, drawPattern, { at: [3.25, 2.0, LZ + .203], res: 512 });
    K.zone('laser', { pos: [2.3, 1.6, .2], look: [3.25, 1.6, -1.2], fov: 50, range: .5 });
    K.hot(pattern, {
      name: '어지러운 무늬 판', zone: 'laser', click: g => g.say('빨갛고 파란 선이 어지럽게 얽혀 있다. 눈이 아프다. 빨간 선만 지울 수 있다면…'),
      use: { redGlasses: g => { s.rule = true; g.sound.play('magic'); g.note('빨간 안경으로 본 무늬', '<div style="background:#c8302a;padding:18px;border-radius:6px"><div class="big" style="color:#10163a">광선은\n낮은 것부터\n높은 것 순서로 끈다.</div></div>\n\n번호는 왼쪽 기둥, 광선 옆에.'); } },
    });
    K.hot(cp, {
      name: '레이저 제어판', zone: 'laser', click: g => {
        if (s.lasersOff) { g.say('광선이 모두 꺼졌다.'); return; }
        g.lock({
          title: '레이저 제어판', text: '광선 번호를 끄는 순서대로 누르세요.', type: 'pad', answer: '31524',
          onSolve: async g => {
            s.lasersOff = true;
            for (const n of [3, 1, 5, 2, 4]) {
              const b = beams.find(x => x.n === n); g.sound.play('switch');
              g.tween(b.core.material, { opacity: 0 }, .3); g.tween(b.halo.material, { opacity: 0 }, .3);
              await g.wait(.4); b.core.visible = b.halo.visible = false;
            }
            redLight.intensity = 0; lampMat.color.set(0x30ff60); lampMat.emissive.set(0x30ff60);
            g.say('광선이 하나씩 꺼졌다. 이제 금고 문에 다가갈 수 있다.');
          },
        });
      },
    });
    const alarm = g => {
      g.sound.play('wrong'); g.say('삐— 삐— 레이저 경보! 광선을 끄기 전에는 다가갈 수 없다.');
      redLight.intensity = 8; g.tween(redLight, { intensity: 1.8 }, 1.2);
    };

    // ---------- 북쪽: 거대한 금고 문 ----------
    const frame = K.group({ at: [0, DY, -D / 2] });
    K.torus(DR + .07, .1, MAT.metal('#5d656b', { rough: .35 }), { parent: frame, at: [0, 0, .05], seg: 64 });
    K.cyl(DR, DR, 1.6, steelDS, { parent: frame, at: [0, 0, -.8], rot: [Math.PI / 2, 0, 0], open: true, seg: 64 });
    for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; K.sphere(.035, MAT.silver(), { parent: frame, at: [Math.cos(a) * (DR + .07), Math.sin(a) * (DR + .07), .14], seg: 8 }); }
    // 문 너머 계단 빛
    const stairs = K.picture(2.5, 2.5, (g, w, h) => {
      const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#fff2d8'); gr.addColorStop(1, '#8a6a40'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
      g.fillStyle = 'rgba(60,40,20,.55)'; for (let i = 0; i < 9; i++) { const y = h * .95 - i * h * .09; g.fillRect(w * (.15 + i * .035), y, w * (.7 - i * .07), h * .025); }
    }, { at: [0, DY, -D / 2 - 1.55], emissive: 1.2 });
    stairs.userData.noRay = true;
    const tunnelLight = K.point(0xffd8a0, 0, 6, { at: [0, DY, -D / 2 - .9] });
    const hp = K.group({ at: [-DR - .05, DY, -D / 2 + .05] });
    const doorG = K.group({ parent: hp, at: [DR + .05, 0, 0] });
    const doorSteel = MAT.metal('#a2abb2', { rough: .28, metal: 1 });
    K.cyl(DR - .03, DR - .03, .4, doorSteel, { parent: doorG, rot: [Math.PI / 2, 0, 0], seg: 64 });
    K.torus(1.05, .03, doorSteel, { parent: doorG, at: [0, 0, .2], seg: 64 });
    K.torus(.72, .02, MAT.brass(), { parent: doorG, at: [0, 0, .2], seg: 48 });
    K.cyl(.6, .6, .03, MAT.metal('#8c949a', { rough: .2 }), { parent: doorG, at: [0, 0, .21], rot: [Math.PI / 2, 0, 0], seg: 48 });
    for (const y of [-.7, .7]) K.cyl(.09, .09, .4, MAT.metal('#5d656b'), { parent: doorG, at: [-DR + .02, y, .12], seg: 16 });
    K.text('대금고', .5, .14, { parent: doorG, at: [0, -.9, .205], size: .7, bg: null, color: '#3a3f44' });
    // 빗장
    const bolts = [];
    for (let i = 0; i < 12; i++) {
      const a = i / 12 * Math.PI * 2 + .26, bg = K.group({ parent: doorG, at: [0, 0, .24], rot: [0, 0, a] });
      const b = K.cyl(.045, .045, .26, MAT.silver(), { parent: bg, at: [0, .98, 0], seg: 16 });
      bolts.push(b);
    }
    // 바퀴
    const wheel = K.group({ parent: doorG, at: [0, 0, .32] });
    K.torus(.45, .035, MAT.brass(), { parent: wheel, seg: 48 });
    K.cyl(.11, .11, .1, MAT.brass(), { parent: wheel, rot: [Math.PI / 2, 0, 0] });
    for (let i = 0; i < 6; i++) {
      const sp = K.group({ parent: wheel, rot: [0, 0, i * Math.PI / 3] });
      K.cyl(.022, .022, .5, MAT.brass(), { parent: sp, at: [0, .25, 0], seg: 10 });
      K.sphere(.05, MAT.brass(), { parent: sp, at: [0, .53, 0], seg: 14 });
    }
    // 다이얼
    const dialG = K.group({ parent: doorG, at: [.68, .62, .22] });
    const dTex = K.canvasTexture(256, 256, (g, w) => {
      const c = w / 2; g.fillStyle = '#1c1f22'; g.beginPath(); g.arc(c, c, c, 0, 7); g.fill();
      g.fillStyle = '#e8dcc0'; g.font = "700 34px 'Noto Sans KR', sans-serif"; g.textAlign = 'center'; g.textBaseline = 'middle';
      for (let v = 0; v < 10; v++) { const a = v / 10 * Math.PI * 2; g.fillText(String(v), c + Math.sin(a) * c * .76, c - Math.cos(a) * c * .76); }
    });
    const dFace = new THREE.Mesh(new THREE.CircleGeometry(.2, 40), new THREE.MeshStandardMaterial({ map: dTex, roughness: .4 })); dialG.add(dFace);
    K.torus(.2, .015, MAT.brass(), { parent: dialG, seg: 32 });
    const knob = K.group({ parent: dialG, at: [0, 0, .03] });
    K.cyl(.08, .08, .05, MAT.silver(), { parent: knob, rot: [Math.PI / 2, 0, 0], seg: 24 });
    K.box(.012, .07, .01, MAT.plain(0xb01818, .5), { parent: knob, at: [0, .045, .03] });
    K.cone(.02, .035, MAT.plain(0xb01818, .5), { parent: dialG, at: [0, .23, .01], rot: [0, 0, Math.PI], seg: 3 });
    K.zone('door', { pos: [0, 1.6, -1.9], look: [0, 1.6, -4], fov: 62, range: .5 });
    K.hot(doorG, {
      name: '거대한 금고 문', click: g => {
        if (!s.lasersOff) { alarm(g); return; }
        if (g.zone !== 'door') { g.goZone('door'); return; }
        g.say(s.dial ? '다이얼이 맞았다. 가운데 바퀴를 돌려 빗장을 풀자.' : '두께가 한 뼘은 넘는 강철 문. 오른쪽 위에 다이얼이 있다.');
      },
    });
    K.hot(dialG, {
      name: '금고 다이얼', click: g => {
        if (!s.lasersOff) { alarm(g); return; }
        if (s.dial) { g.say('다이얼은 이미 맞췄다.'); return; }
        g.lock({
          title: '금고 다이얼', text: '네 자리 숫자를 맞추세요.', type: 'digits', answer: '8164',
          onSolve: g => { s.dial = true; g.tween(knob.rotation, { z: -Math.PI * 4 }, 1.2); g.say('철컥. 안쪽에서 무언가 풀렸다. 이제 바퀴가 돌 것 같다.'); },
        });
      },
    });
    let turns = 0;
    K.hot(wheel, {
      name: '금고 문 바퀴', click: async g => {
        if (!s.lasersOff) { alarm(g); return; }
        if (!s.dial) { g.sound.play('wrong'); g.say('다이얼이 맞지 않아 바퀴가 꿈쩍도 않는다.'); return; }
        if (turns >= 6 || s.turning) return;
        s.turning = true; turns++; g.sound.play('click');
        bolts.forEach(b => g.tween(b.position, { y: .98 - turns * .035 }, .4));
        await g.tween(wheel.rotation, { z: -turns * Math.PI / 3 }, .4);
        s.turning = false;
        if (turns < 6) { g.say(`빗장이 조금씩 물러난다. (${turns}/6)`, 1.5); return; }
        g.sound.play('unlock'); await g.wait(.5);
        g.sound.play('open'); g.tween(tunnelLight, { intensity: 8 }, 2);
        await g.tween(hp.rotation, { y: -1.5 }, 2.6);
        g.win();
      },
    });
    // 시간 잠금 장치
    const tl = K.group({ at: [2.25, 2.1, -D / 2 + .06] });
    K.rbox(.95, .45, .1, .02, MAT.brass({ roughness: .35 }), { parent: tl });
    const hands = [];
    for (let i = 0; i < 3; i++) {
      const x = -.3 + i * .3;
      const face = K.picture(.22, .22, (g, w) => {
        const c = w / 2; g.fillStyle = '#f2ead6'; g.beginPath(); g.arc(c, c, c - 2, 0, 7); g.fill();
        g.strokeStyle = '#2a2a2a'; g.lineWidth = 4; for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; g.beginPath(); g.moveTo(c + Math.sin(a) * c * .78, c - Math.cos(a) * c * .78); g.lineTo(c + Math.sin(a) * c * .92, c - Math.cos(a) * c * .92); g.stroke(); }
        g.fillStyle = '#2a2a2a'; g.font = "700 26px 'Noto Sans KR', sans-serif"; g.textAlign = 'center'; g.fillText(['72h', '48h', '24h'][i], c, c * 1.5);
      }, { parent: tl, at: [x, .03, .052], res: 256, transparent: true });
      const hd = K.group({ parent: tl, at: [x, .03, .056] });
      K.box(.006, .085, .004, MAT.plain(0x111111), { parent: hd, at: [0, .04, 0], shadow: false });
      hands.push([hd, .4 + i * .5]);
    }
    K.text('시간 잠금 장치', .6, .07, { parent: tl, at: [0, -.17, .052], size: .7, bg: '#2a2016', color: '#e8cf8a' });
    K.hot(tl, { name: '시간 잠금 장치', click: g => g.say('세 개의 시계 장치가 째깍거린다. 아래에 「비상 다이얼로 해제 가능」이라고 새겨져 있다.') });

    // ---------- 왼쪽 앞: 금괴 수레 ----------
    const cart = K.group({ at: [-2.25, 0, -2.45] });
    const cartM = MAT.metal('#4a4c50', { rough: .4 });
    K.box(1.4, .05, .62, cartM, { parent: cart, at: [0, .55, 0] });
    for (const x of [-.65, .65]) for (const z of [-.27, .27]) { K.box(.04, .48, .04, cartM, { parent: cart, at: [x, .3, z] }); K.cyl(.07, .07, .04, MAT.plain(0x1a1a1a, .7), { parent: cart, at: [x, .07, z], rot: [Math.PI / 2, 0, 0], seg: 16 }); }
    K.box(1.3, .03, .55, cartM, { parent: cart, at: [0, .2, 0] });
    for (const z of [-.27, .27]) K.box(.04, .55, .04, cartM, { parent: cart, at: [-.72, .8, z] });
    K.cyl(.02, .02, .58, cartM, { parent: cart, at: [-.72, 1.07, 0], rot: [Math.PI / 2, 0, 0] });
    const gold = MAT.gold();
    const bar = (at) => { const b = K.group({ parent: cart, at, scale: [1.5, 1, 1] }); K.cyl(.07, .09, .05, gold, { parent: b, rot: [0, Math.PI / 4, 0], seg: 4 }); return b; };
    const BARS = [[8, 1], [3, 0], [1, 1], [9, 0], [6, 1], [4, 1]];
    BARS.forEach(([d, star], i) => {
      const x = -.525 + i * .21;
      bar([x, .6, .14]);
      K.picture(.13, .085, (g, w, h) => {
        g.fillStyle = 'rgba(90,55,0,.85)'; g.font = "700 150px 'Noto Serif KR', serif"; g.textAlign = 'center'; g.textBaseline = 'middle';
        g.fillText(String(d), w * .42, h * .55);
        if (star) { g.font = "700 90px sans-serif"; g.fillText('★', w * .82, h * .3); }
        g.strokeStyle = 'rgba(90,55,0,.6)'; g.lineWidth = 6; g.strokeRect(8, 8, w - 16, h - 16);
      }, { parent: cart, at: [x, .6251, .14], rot: [-Math.PI / 2, 0, 0], transparent: true, res: 384 });
      bar([x, .6, -.12]);
    });
    for (let i = 0; i < 5; i++) bar([-.42 + i * .21, .65, -.12]);
    K.zone('cart', { pos: [-2.25, 1.35, -.95], look: [-2.25, .6, -2.45], fov: 42, range: .45 });
    K.hot(cart, { name: '금괴 수레', zone: 'cart', click: g => g.note('금괴에 찍힌 도장', '앞줄 금괴 여섯 개. 왼쪽부터:\n\n<div class="big">8★ · 3 · 1★ · 9 · 6★ · 4★</div>', 'metal') });
    // 돈 자루
    const bags = K.group({});
    for (const [x, z, r] of [[1.6, -3.4, .2], [2.0, -3.3, -.4], [1.8, -2.9, .9]]) {
      const bag = K.group({ parent: bags, at: [x, 0, z], rot: [0, r, 0] });
      K.sphere(.25, MAT.fabric('#8a7a5a', 0, [1, 1]), { parent: bag, at: [0, .24, 0], scale: [1, 1, .85] });
      K.cyl(.06, .12, .12, MAT.fabric('#8a7a5a', 0, [1, 1]), { parent: bag, at: [0, .5, 0] });
      K.text('₩', .16, .16, { parent: bag, at: [0, .27, .215], size: .8, bg: null, color: '#3a2a10' });
    }
    K.hot(bags, { name: '돈 자루', click: g => g.say('묵직한 돈 자루. 손대는 순간 경보가 울릴 것 같다.') });

    // ---------- 남쪽: 책상, 옷걸이, 안내판 ----------
    const desk = K.group({ at: [-1.6, 0, 3.3], rot: [0, Math.PI, 0] });
    const dw = MAT.wood('#3a2414', [1, 1]);
    K.rbox(1.5, .06, .75, .015, dw, { parent: desk, at: [0, .78, 0] });
    K.box(.5, .74, .7, dw, { parent: desk, at: [-.48, .37, 0] }); K.box(.5, .74, .7, dw, { parent: desk, at: [.48, .37, 0] });
    K.box(1.44, .5, .03, dw, { parent: desk, at: [0, .5, -.33] });
    for (const x of [-.48, .48]) for (const y of [.2, .5]) K.box(.4, .22, .02, MAT.wood('#2a180c'), { parent: desk, at: [x, y, .36] });
    K.box(.6, .015, .4, MAT.leather('#1e3a2a'), { parent: desk, at: [-.05, .815, .05] });
    // 장부
    const ledger = K.group({ parent: desk, at: [-.2, .82, .05], rot: [0, .08, 0] });
    K.box(.62, .03, .42, MAT.leather('#4a1a14'), { parent: ledger });
    K.picture(.58, .38, drawLedger, { parent: ledger, at: [0, .016, 0], rot: [-Math.PI / 2, 0, 0], res: 1024 });
    K.hot(ledger, {
      name: '고객 장부', zone: 'desk', click: g => g.note('고객 보관함 장부', '<b>성명 ········· 보관함 ····· 비고</b>\n\n김도윤 ········· 12번\n한서진 ········· 38번 ······ <span style="color:#a01818"><b>해지</b></span>\n박하은 ········· 63번\n한서진 ········· 21번\n이준호 ········· 77번 ······ <span style="color:#a01818"><b>해지</b></span>\n최유나 ········· 54번\n\n<i>해지된 보관함은 내용물을 모두 돌려주었음.</i>'),
    });
    // 전보
    const tele = K.text(['전 보', '…번호는 장부에', '열쇠는 외투에…'], .2, .15, { parent: desk, at: [.42, .816, .12], rot: [-Math.PI / 2, 0, -.2], size: .17 });
    K.hot(tele, { name: '전보', zone: 'desk', click: g => g.note('전보', '<div class="big">내 보관함을 열어 다오</div>\n\n은행 열쇠는 <b>경비원 외투</b> 주머니에 있다.\n보관함 번호는 <b>고객 장부</b>에 있다.\n해지된 상자는 이미 비었으니 헛걸음 말 것.\n\n<p style="text-align:right">— 한서진</p>') });
    // 은행원 램프
    const lamp = K.group({ parent: desk, at: [.45, .81, -.2] });
    K.cyl(.07, .08, .02, MAT.brass(), { parent: lamp });
    K.cyl(.01, .01, .3, MAT.brass(), { parent: lamp, at: [0, .16, 0] });
    const shade = K.cyl(.05, .1, .1, MAT.glass(0x1f7a3a, .85, { emissive: 0x1f7a3a, emissiveIntensity: .6 }), { parent: lamp, at: [0, .32, .02], rot: [.35, 0, 0], seg: 24, open: true });
    shade.material.side = THREE.DoubleSide;
    K.sphere(.025, MAT.glow(0xffe0a0, 5), { parent: lamp, at: [0, .3, .02], shadow: false });
    K.point(0xffd890, .3, 3.5, { parent: lamp, at: [0, .25, .05] });
    K.cyl(.035, .03, .07, MAT.brass(), { parent: desk, at: [.15, .85, -.25] });
    K.chair(MAT.wood('#2a180c'), { at: [-1.55, 0, 2.6], rot: [0, Math.PI + .3, 0] });
    K.zone('desk', { pos: [-1.6, 1.55, 2.15], look: [-1.6, .8, 3.3], fov: 55, range: .5 });
    // 옷걸이와 외투
    const stand = K.group({ at: [1.9, 0, 3.35] });
    K.cyl(.025, .03, 1.85, MAT.wood('#2a180c'), { parent: stand, at: [0, .925, 0] });
    K.cyl(.22, .25, .04, MAT.wood('#2a180c'), { parent: stand, at: [0, .02, 0] });
    for (let i = 0; i < 4; i++) K.cyl(.01, .01, .18, MAT.brass(), { parent: stand, at: [Math.cos(i * 1.57) * .08, 1.78, Math.sin(i * 1.57) * .08], rot: [Math.sin(i * 1.57) * .8, 0, -Math.cos(i * 1.57) * .8] });
    const coat = K.group({ parent: stand, at: [0, 1.25, -.12] });
    K.rbox(.5, 1.0, .16, .07, MAT.fabric('#1e2a40', 0, [1, 2]), { parent: coat });
    for (const y of [.25, .05, -.15]) K.sphere(.018, MAT.brass(), { parent: coat, at: [.06, y, .085], seg: 8 });
    K.box(.14, .02, .01, MAT.brass(), { parent: coat, at: [-.15, .3, .085] });
    K.cyl(.12, .14, .08, MAT.fabric('#1e2a40', 0, [1, 1]), { parent: stand, at: [0, 1.92, 0] });
    K.hot(coat, { name: '경비원 외투', click: g => { if (s.coat) { g.say('주머니는 비었다.'); return; } s.coat = true; g.give('guardKey'); } });
    // 안내판
    K.frame(.9, .6, (g, w, h) => {
      g.fillStyle = '#1e2a24'; g.fillRect(0, 0, w, h); g.fillStyle = '#e8d8a8'; g.textAlign = 'center';
      g.font = "700 46px 'Noto Serif KR', serif"; g.fillText('대금고 수칙', w / 2, 70);
      g.font = "500 28px 'Noto Serif KR', serif";
      ['1. 레이저가 켜진 동안 문에 다가가지 말 것', '2. 다이얼 번호는 기록하지 말 것', '3. 마감 후 홀로 남지 말 것'].forEach((t, i) => g.fillText(t, w / 2, 140 + i * 50));
    }, { at: [0, 1.7, D / 2 - .03], rot: [0, Math.PI, 0], res: 768 });
    // 감시 카메라
    const cam = K.group({ at: [-3.2, H - .2, 3.7], rot: [0, -2.4, 0] });
    K.box(.08, .1, .08, MAT.plain(0xdedede, .5), { parent: cam });
    K.box(.1, .1, .25, MAT.plain(0xdedede, .5), { parent: cam, at: [0, -.08, .12], rot: [.35, 0, 0] });
    const led = MAT.glow(0xff2020, 3);
    K.sphere(.012, led, { parent: cam, at: [.03, -.05, .25], seg: 8, shadow: false });
    K.hot(cam, { name: '감시 카메라', click: g => g.say('붉은 불이 깜빡인다. 누군가 보고 있을까?') });

    // ---------- 움직임 ----------
    K.onUpdate((dt, t) => {
      if (!s.lasersOff) for (const b of beams) { b.halo.material.opacity = .13 + Math.sin(t * 13 + b.n) * .03 + Math.random() * .03; }
      for (const [hd, sp] of hands) hd.rotation.z -= dt * sp;
      led.emissiveIntensity = Math.sin(t * 4) > 0 ? 3 : .2;
    });
  },
};

// ---------- 그림 ----------
function plate(g, cx, cy, n, cw, ch) {
  const pw = cw * .42, ph = ch * .28;
  g.fillStyle = '#efe4c4'; g.fillRect(cx - pw / 2, cy - ch * .36, pw, ph);
  g.strokeStyle = '#5a4520'; g.lineWidth = 3; g.strokeRect(cx - pw / 2, cy - ch * .36, pw, ph);
  g.fillStyle = '#2a1a08'; g.font = `700 ${Math.round(ph * .8)}px 'Noto Sans KR', sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(String(n), cx, cy - ch * .36 + ph / 2 + 2);
  g.fillStyle = '#1a1208';
  for (const dx of [-.12, .12]) { g.beginPath(); g.arc(cx + dx * cw, cy + ch * .14, ch * .045, 0, 7); g.fill(); g.fillRect(cx + dx * cw - ch * .015, cy + ch * .14, ch * .03, ch * .08); }
  g.strokeStyle = 'rgba(60,40,10,.6)'; g.lineWidth = 2; g.strokeRect(cx - cw * .44, cy - ch * .42, cw * .88, ch * .84);
}
function drawLedger(g, w, h) {
  g.fillStyle = '#efe6cc'; g.fillRect(0, 0, w, h);
  g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(w / 2 - 3, 0, 6, h);
  g.strokeStyle = 'rgba(80,110,160,.35)'; g.lineWidth = 2;
  for (let y = 90; y < h; y += 52) { g.beginPath(); g.moveTo(20, y); g.lineTo(w - 20, y); g.stroke(); }
  g.fillStyle = '#2a1a0a'; g.textBaseline = 'middle'; g.textAlign = 'left';
  g.font = "700 40px 'Noto Serif KR', serif"; g.fillText('고객 보관함 장부', 40, 50);
  const rows = [['김도윤', '12', ''], ['한서진', '38', '해지'], ['박하은', '63', ''], ['한서진', '21', ''], ['이준호', '77', '해지'], ['최유나', '54', '']];
  g.font = "600 38px 'Noto Serif KR', serif";
  rows.forEach(([nm, no, st], i) => {
    const col = i < 3 ? 0 : w / 2;
    const yy = i < 3 ? 116 + i * 52 : 116 + (i - 3) * 52;
    g.fillStyle = '#2a1a0a'; g.fillText(nm, col + 40, yy); g.fillText(no + '번', col + 210, yy);
    if (st) { g.save(); g.translate(col + 380, yy); g.rotate(-.2); g.strokeStyle = '#b01818'; g.lineWidth = 4; g.strokeRect(-48, -24, 96, 48); g.fillStyle = '#b01818'; g.textAlign = 'center'; g.fillText(st, 0, 2); g.restore(); g.textAlign = 'left'; }
  });
}
function drawPattern(g, w, h) {
  g.fillStyle = '#f0e8e0'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#2a3aa8'; g.font = "700 64px 'Noto Sans KR', sans-serif"; g.textAlign = 'center'; g.textBaseline = 'middle';
  ['광선은', '낮은 것부터', '높은 것 순서로'].forEach((t, i) => g.fillText(t, w / 2, h * .28 + i * 90));
  const r = (() => { let sd = 77; return () => ((sd = (sd * 9301 + 49297) % 233280) / 233280); })();
  for (let i = 0; i < 900; i++) {
    g.strokeStyle = r() < .85 ? `rgba(220,30,30,${.6 + r() * .4})` : `rgba(40,60,170,${.3 + r() * .3})`;
    g.lineWidth = 2 + r() * 6; g.beginPath(); const x = r() * w, y = r() * h; g.moveTo(x, y);
    g.bezierCurveTo(x + (r() - .5) * 120, y + (r() - .5) * 120, x + (r() - .5) * 120, y + (r() - .5) * 120, x + (r() - .5) * 90, y + (r() - .5) * 90); g.stroke();
  }
}
function marble(K, checker) {
  const { THREE } = K;
  const t = K.canvasTexture(1024, 1024, (g, w) => {
    const r = K.rng(checker ? 31 : 17), tiles = checker ? 2 : 1, ts = w / tiles;
    for (let i = 0; i < tiles; i++) for (let j = 0; j < tiles; j++) {
      const darkT = checker && (i + j) % 2 === 1;
      g.save(); g.beginPath(); g.rect(i * ts, j * ts, ts, ts); g.clip();
      const gr = g.createLinearGradient(i * ts, j * ts, (i + 1) * ts, (j + 1) * ts);
      gr.addColorStop(0, darkT ? '#21403a' : '#efebe3'); gr.addColorStop(1, darkT ? '#132a24' : '#d9d2c6');
      g.fillStyle = gr; g.fillRect(i * ts, j * ts, ts, ts);
      for (let k = 0; k < 16; k++) {
        g.strokeStyle = darkT ? `rgba(210,230,220,${.06 + r() * .22})` : `rgba(95,92,100,${.05 + r() * .2})`;
        g.lineWidth = .5 + r() * 2.5;
        let x = i * ts + r() * ts, y = j * ts; g.beginPath(); g.moveTo(x, y);
        for (let q = 0; q < 8; q++) { const nx = x + (r() - .5) * ts * .45, ny = y + ts / 8 + r() * 20; g.quadraticCurveTo(x + (r() - .5) * 80, (y + ny) / 2, nx, ny); x = nx; y = ny; }
        g.stroke();
      }
      g.restore();
      if (checker) { g.strokeStyle = 'rgba(30,30,30,.55)'; g.lineWidth = 3; g.strokeRect(i * ts, j * ts, ts, ts); }
    }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}
function specsModel(K, g, lens) {
  const m = K.MAT.plain(0x2a2018, .4, .3);
  for (const x of [-.06, .06]) {
    K.torus(.045, .006, m, { parent: g, at: [x, 0, 0] });
    if (lens) K.cyl(.044, .044, .003, K.MAT.glass(0xff2020, .6), { parent: g, at: [x, 0, 0], rot: [Math.PI / 2, 0, 0] });
  }
  K.torus(.015, .005, m, { parent: g, at: [0, .01, 0], arc: Math.PI });
  for (const x of [-.105, .105]) K.box(.006, .006, .14, m, { parent: g, at: [x, 0, -.07] });
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
  { hot: '전보' },
  { hot: '경비원 외투' },
  { hot: '고객 장부' },
  { hot: `보관함 ${TARGET}`, item: 'guardKey' },
  { combine: ['film', 'specs'] },
  { hot: '어지러운 무늬 판', item: 'redGlasses' },
  { hot: '레이저 발사기' },
  { hot: '레이저 제어판', lock: '31524', wait: 3 },
  { hot: '금괴 수레' },
  { hot: '금고 다이얼', lock: '8164' },
  { hot: '금고 문 바퀴' }, { hot: '금고 문 바퀴' }, { hot: '금고 문 바퀴' },
  { hot: '금고 문 바퀴' }, { hot: '금고 문 바퀴' },
  { hot: '금고 문 바퀴', wait: 4 },
];
