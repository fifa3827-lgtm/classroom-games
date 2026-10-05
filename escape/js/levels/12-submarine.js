// 12단계: 심해 잠수함
// 흐름: 침대 위 항해 일지(보관함 번호 규칙, 부상 절차) → 계기판 바늘 7·2·5 + 소나 점 3개 → 비상 보관함 7253 → 렌치 머리
//       매트리스 밑 쇠 막대 / 렌치 머리 + 쇠 막대 = 렌치 → 밸러스트 밸브 판을 렌치로 풀기
//       세 탱크 밸브(이웃 탱크와 이어짐)로 모두 4 맞추기: 앞×2, 뒤×1 → 항로 화면의 가장 짧은 길 ↑↑→→↑↑ (조타 장치)
//       밸러스트 배출 레버 → 떠오름 → 천장 해치 → 탈출
const ROUTE = ['↑', '↑', '→', '→', '↑', '↑'];

export default {
  title: '심해 잠수함',
  intro: '쿵— 하는 소리에 정신이 들었다.\n붉은 경보등이 빙글빙글 돈다. 여기는 잠수함 조종실.\n깊이 312미터, 엔진은 멈췄고 승무원은 아무도 없다.\n\n<i>스스로 떠올라야 한다.</i>',
  outro: '해치가 열리자 차가운 밤바람과 파도 소리가 쏟아진다.\n사다리를 올라 갑판에 서니, 수평선 위로 달이 떠 있다…',
  env: .4, exposure: 1.05, bloom: .6, bg: 0x02060c,
  start: { pos: [0, 1.55, 1.3], look: [0, 1.4, -3] },

  items: {
    wrenchHead: { name: '렌치 머리', desc: '커다란 몽키 스패너의 머리 부분. 손잡이가 빠져 있어 힘을 줄 수 없다.', model: (K, g) => wrenchModel(K, g, true, false) },
    bar: { name: '쇠 막대', desc: '팔뚝만 한 쇠 막대. 한쪽 끝에 끼우는 홈이 있다.', model: (K, g) => wrenchModel(K, g, false, true) },
    wrench: { name: '렌치', desc: '머리와 손잡이를 맞춘 렌치. 꽉 낀 밸브도 풀 수 있겠다.', model: (K, g) => wrenchModel(K, g, true, true) },
  },
  combos: [['wrenchHead', 'bar', 'wrench']],

  hints: [
    { when: s => !s.locker, text: ['서쪽 침대 위 선반의 항해 일지를 읽어 보세요.', '보관함 번호: 계기판 세 바늘(왼쪽부터) + 소나 화면에 잡힌 점의 수.', '바늘은 7, 2, 5. 소나에 점이 3개. 비상 보관함에 7253.'] },
    { when: (s, g) => !g.has('wrench') && !s.loose, text: ['렌치 머리에는 손잡이가 필요해요. 침대를 살펴보세요.', '매트리스를 들추면 쇠 막대가 있어요. 가방에서 렌치 머리와 쇠 막대를 조합하세요.'] },
    { when: s => !s.loose, text: ['동쪽 벽 밸러스트 밸브 판에 렌치를 쓰세요.'] },
    { when: s => !s.ballast, text: ['세 탱크를 모두 4로 맞춰야 해요. 밸브 하나를 돌리면 이웃 탱크도 1씩 오릅니다(4 다음은 0).', '앞 밸브: 앞+가운데, 가운데 밸브: 셋 모두, 뒤 밸브: 가운데+뒤.', '처음 2·1·3에서 앞 탱크 밸브 두 번, 뒤 탱크 밸브 한 번.'] },
    { when: s => !s.route, text: ['항로 화면을 보세요. 노란 세모가 우리 배, 위쪽이 바위 틈 출구예요.', '바위(어두운 칸)를 피해 가장 짧은 길로 조타 장치에 입력하세요.', '↑ ↑ → → ↑ ↑'] },
    { when: s => !s.surfaced, text: ['콘솔 왼쪽의 빨간 밸러스트 배출 레버를 당기세요.'] },
    { text: ['물 위로 떠올랐어요. 뒤쪽 사다리 위 천장 해치를 여세요.'] },
  ],

  build(K) {
    const { THREE, MAT, s } = K;
    const W = 5, D = 6, H = 2.6, HZ = 2.2;
    const steel = MAT.metal('#5b686d', { rough: .55, metal: .7 });
    const steelDS = steel.clone(); steelDS.side = THREE.DoubleSide;
    const dark = MAT.metal('#353d41', { rough: .5, metal: .8 });
    const paint = MAT.metal('#3d564f', { rough: .7, metal: .3 });
    const rivetPos = [];

    // ---------- 방: 벽에 구멍(둥근 창, 해치) ----------
    const wall = (w, h, holes, mat, at, ry) => {
      const sh = new THREE.Shape(); sh.moveTo(-w / 2, 0); sh.lineTo(w / 2, 0); sh.lineTo(w / 2, h); sh.lineTo(-w / 2, h); sh.closePath();
      for (const [x, y, r] of holes) { const p = new THREE.Path(); p.absarc(x, y, r, 0, Math.PI * 2, true); sh.holes.push(p); }
      const m = new THREE.Mesh(new THREE.ShapeGeometry(sh, 40), mat); m.position.set(...at); m.rotation.set(0, ry, 0); m.receiveShadow = true; K.scene.add(m); return m;
    };
    wall(W, H, [], steel, [0, 0, -D / 2], 0); wall(W, H, [], steel, [0, 0, D / 2], Math.PI);
    wall(D, H, [], steel, [-W / 2, 0, 0], Math.PI / 2); wall(D, H, [[0, 1.5, .36]], steel, [W / 2, 0, 0], -Math.PI / 2);
    { // 천장 (해치 구멍)
      const sh = new THREE.Shape(); sh.moveTo(-W / 2, -D / 2); sh.lineTo(W / 2, -D / 2); sh.lineTo(W / 2, D / 2); sh.lineTo(-W / 2, D / 2); sh.closePath();
      const p = new THREE.Path(); p.absarc(0, HZ, .42, 0, Math.PI * 2, true); sh.holes.push(p);
      const m = new THREE.Mesh(new THREE.ShapeGeometry(sh, 40), dark); m.position.y = H; m.rotation.x = Math.PI / 2; K.scene.add(m);
    }
    K.plane(W, D, MAT.tiles('#4d5458', '#3c4246', 6, [3, 3.6], { rough: .45, metal: .5 }), { rot: [-Math.PI / 2, 0, 0] });
    // 아래쪽 칠한 판
    for (const [len, at, ry] of [[W, [0, .5, -D / 2 + .015], 0], [W, [0, .5, D / 2 - .015], Math.PI], [D, [-W / 2 + .015, .5, 0], Math.PI / 2], [D, [W / 2 - .015, .5, 0], -Math.PI / 2]]) {
      K.box(len, 1, .02, paint, { at, rot: [0, ry, 0] });
      K.box(len, .05, .04, MAT.plain(0xc9a227, .5, .3), { at: [at[0], 1.02, at[2]], rot: [0, ry, 0] });
    }
    // 선체 늑골과 리벳
    const rib = (at, size) => { K.box(...size, dark, { at }); };
    for (const x of [-2, 2]) for (const z of [D / 2 - .05]) { rib([x, H / 2, z], [.12, H, .1]); for (let y = .1; y < H; y += .2) for (const dx of [-.04, .04]) rivetPos.push([x + dx, y, z + Math.sign(-z) * .05]); }
    for (const z of [-2.5, -1.25, .6, 2.6]) {
      for (const x of [-W / 2 + .05, W / 2 - .05]) { rib([x, H / 2, z], [.1, H, .12]); for (let y = .1; y < H; y += .2) for (const dz of [-.04, .04]) rivetPos.push([x - Math.sign(x) * .05, y, z + dz]); }
      if (Math.abs(z - HZ) > .6) { rib([0, H - .05, z], [W, .1, .12]); for (let x = -2.4; x < 2.4; x += .2) rivetPos.push([x, H - .1, z]); }
    }
    // 판 이음새 리벳
    for (let x = -2.4; x < 2.4; x += .15) { rivetPos.push([x, 1.08, -D / 2 + .01]); rivetPos.push([x, 1.08, D / 2 - .01]); }
    for (let z = -2.9; z < 2.9; z += .15) { rivetPos.push([-W / 2 + .01, 1.08, z]); rivetPos.push([W / 2 - .01, 1.08, z]); }

    // ---------- 빛 ----------
    K.scene.add(new THREE.HemisphereLight(0x9fb3c8, 0x2b2620, .95));
    for (const [z, sh] of [[-1.8, true], [1.1, false]]) {
      const lamp = K.group({ at: [0, H - .08, z] });
      K.cyl(.13, .15, .05, dark, { parent: lamp });
      const bulb = K.sphere(.08, MAT.glow(0xffe6b8, 3), { parent: lamp, at: [0, -.07, 0], shadow: false }); bulb.castShadow = false;
      for (let i = 0; i < 4; i++) K.torus(.1, .006, MAT.iron(), { parent: lamp, at: [0, -.07, 0], rot: [0, i * Math.PI / 4, 0], arc: Math.PI }).rotation.x = Math.PI;
      lamp.traverse(c => { if (c.isMesh) c.castShadow = false; });
      K.point(0xffe2b8, 6.5, 8, { at: [0, H - .3, z], shadow: sh });
    }
    // 붉은 경보등 (돌아감)
    const alarm = K.group({ at: [-.9, H - .02, .3] });
    K.cyl(.1, .1, .04, dark, { parent: alarm });
    const domeMat = MAT.glow(0xff2a1a, 2.5, { transparent: true, opacity: .85 });
    K.sphere(.085, domeMat, { parent: alarm, at: [0, -.05, 0], scale: [1, 1.2, 1], shadow: false });
    const spin = K.group({ parent: alarm, at: [0, -.06, 0] });
    K.box(.02, .06, .1, MAT.silver(), { parent: spin, shadow: false });
    const redA = K.spot(0xff2a1a, 14, 7, [1, -.35, 0], { parent: spin, angle: .4, penumbra: .5 });
    const redB = K.spot(0xff2a1a, 14, 7, [-1, -.35, 0], { parent: spin, angle: .4, penumbra: .5 });
    alarm.traverse(c => { if (c.isMesh) { c.castShadow = false; c.userData.noRay = true; } });

    // ---------- 파이프 ----------
    const red = MAT.metal('#8a2a22', { rough: .5, metal: .5 }), yel = MAT.metal('#a8862a', { rough: .5, metal: .5 });
    for (const [x, y, m, r] of [[-1.9, H - .22, red, .05], [-1.65, H - .16, steel, .035], [1.85, H - .2, yel, .045], [1.6, H - .14, dark, .03]]) {
      pipe(K, [x, y, -D / 2], [x, y, D / 2], r, m);
      for (let z = -2.4; z < 2.6; z += 1.2) K.torus(r + .005, .012, m, { at: [x, y, z], seg: 20 });
    }
    pipe(K, [-W / 2 + .12, .3, -D / 2], [-W / 2 + .12, .3, D / 2], .04, red);
    pipe(K, [W / 2 - .12, 2.1, -D / 2], [W / 2 - .12, 2.1, D / 2], .035, steel);
    pipe(K, [-2.3, 0, -2.85], [-2.3, H, -2.85], .05, yel); pipe(K, [2.3, 0, -2.85], [2.3, H, -2.85], .05, steel);
    pipe(K, [2.3, 0, 2.85], [2.3, H, 2.85], .045, red);

    // ---------- 북쪽: 조종 콘솔 ----------
    K.box(4.5, .06, .7, dark, { at: [0, .9, -2.62] });
    K.box(4.5, .87, .04, paint, { at: [0, .45, -2.29] });
    K.box(4.5, 1.5, .06, dark, { at: [0, 1.7, -2.96] });
    // 깜빡이는 단추
    const blinks = [];
    for (let i = 0; i < 18; i++) {
      const c = [0xff4a3a, 0x5aff7a, 0xffc24a, 0x4ab0ff][i % 4];
      const m = MAT.glow(c, 1.5);
      K.box(.035, .02, .035, m, { at: [-.6 + (i % 9) * .1, .935, -2.78 + Math.floor(i / 9) * .1], shadow: false });
      blinks.push([m, Math.random() * 6, .4 + Math.random() * 2]);
    }
    for (let i = 0; i < 6; i++) { K.box(.03, .05, .03, MAT.silver(), { at: [-.55 + i * .12, .95, -2.45], rot: [.5, 0, 0] }); }
    // 계기판 3개
    const gaugeG = K.group({ at: [-1.25, 1.85, -2.92] });
    K.rbox(1.5, .55, .03, .02, MAT.metal('#2a3034'), { parent: gaugeG, at: [0, 0, -.01] });
    const needles = [];
    [[7, '깊이'], [2, '산소'], [5, '전력']].forEach(([v, label], i) => {
      const x = -.5 + i * .5;
      const face = dial(K, .19, 10, label, '#efe9da', '#1a1a1a');
      face.position.set(x, 0, .02); gaugeG.add(face);
      K.torus(.19, .022, MAT.brass(), { parent: gaugeG, at: [x, 0, .02], seg: 32 });
      const nd = K.group({ parent: gaugeG, at: [x, 0, .035] });
      K.box(.022, .15, .008, MAT.plain(0x8a0c0c, .7), { parent: nd, at: [0, .06, 0], shadow: false });
      K.cyl(.018, .018, .012, MAT.brass(), { parent: nd, rot: [Math.PI / 2, 0, 0], seg: 12 });
      needles.push([nd, v, Math.random() * 6]);
    });
    K.zone('gauges', { pos: [-1.25, 1.75, -1.95], look: [-1.25, 1.82, -3], fov: 50, range: .4 });
    K.hot(gaugeG, { name: '계기판', goto: 'gauges', click: g => g.say('세 바늘이 가늘게 떨리고 있다. 그래도 가리키는 숫자는 분명하다.') });
    // 소나 화면
    const sonar = K.group({ at: [.15, 1.6, -2.92] });
    K.torus(.36, .03, dark, { parent: sonar, at: [0, 0, .01], seg: 40 });
    const sTex = K.canvasTexture(512, 512, (g, w) => {
      const c = w / 2; g.fillStyle = '#021a0c'; g.fillRect(0, 0, w, w);
      g.strokeStyle = 'rgba(90,255,140,.45)'; g.lineWidth = 3;
      for (const r of [.25, .5, .75, .97]) { g.beginPath(); g.arc(c, c, c * r, 0, 7); g.stroke(); }
      g.beginPath(); g.moveTo(c, 0); g.lineTo(c, w); g.moveTo(0, c); g.lineTo(w, c); g.stroke();
      g.fillStyle = '#ffd84a'; g.beginPath(); g.moveTo(c, c - 16); g.lineTo(c + 11, c + 12); g.lineTo(c - 11, c + 12); g.fill();
      g.fillStyle = 'rgba(120,255,160,.8)'; g.font = "700 30px 'Noto Sans KR', sans-serif"; g.textAlign = 'center'; g.fillText('SONAR', c, w * .93);
    });
    const sMat = new THREE.MeshStandardMaterial({ map: sTex, emissive: 0xffffff, emissiveMap: sTex, emissiveIntensity: 1.1 });
    const sFace = new THREE.Mesh(new THREE.CircleGeometry(.34, 48), sMat); sFace.position.z = .015; sonar.add(sFace);
    const sweep = new THREE.Mesh(new THREE.CircleGeometry(.335, 24, 0, .6), MAT.glow(0x5aff8a, 1.2, { transparent: true, opacity: .35, depthWrite: false }));
    sweep.position.z = .02; sonar.add(sweep);
    const blips = [[.7, .22], [2.6, .15], [4.6, .26]].map(([a, r]) => {
      const m = MAT.glow(0x9affb0, .5);
      const b = new THREE.Mesh(new THREE.CircleGeometry(.022, 16), m); b.position.set(Math.cos(a) * r, Math.sin(a) * r, .025); sonar.add(b);
      return [m, a];
    });
    K.zone('sonar', { pos: [.15, 1.6, -2.05], look: [.15, 1.6, -3], fov: 50, range: .4 });
    K.hot(sonar, { name: '소나 화면', goto: 'sonar', click: g => { g.sound.play('beep'); g.say('삐— 초록 빛줄기가 화면을 훑는다. 가운데 노란 세모가 우리 배다.'); } });
    // 항로 화면
    const navTex = K.canvasTexture(512, 512, (g, w, h) => drawNav(g, w, h, false));
    const navMat = new THREE.MeshStandardMaterial({ map: navTex, emissive: 0xffffff, emissiveMap: navTex, emissiveIntensity: .9 });
    const nav = K.group({ at: [1.35, 1.65, -2.92] });
    K.rbox(.82, .82, .04, .02, dark, { parent: nav, at: [0, 0, -.005] });
    const navFace = new THREE.Mesh(new THREE.PlaneGeometry(.72, .72), navMat); navFace.position.z = .018; nav.add(navFace);
    K.zone('nav', { pos: [1.35, 1.55, -1.85], look: [1.35, 1.4, -3], fov: 55, range: .45 });
    K.hot(nav, { name: '항로 화면', goto: 'nav', click: g => g.say('바위 처마 아래의 지도. 노란 세모가 우리 배, 위쪽 끝이 바위 틈 출구다.') });
    // 조타 장치
    const helm = K.group({ at: [1.35, .93, -2.45] });
    K.cyl(.05, .07, .08, dark, { parent: helm, at: [0, .04, 0] });
    K.cyl(.025, .025, .3, steel, { parent: helm, at: [0, .18, .1], rot: [.6, 0, 0] });
    const yoke = K.group({ parent: helm, at: [0, .3, .2] });
    K.box(.42, .04, .04, dark, { parent: yoke });
    for (const x of [-.22, .22]) K.cyl(.025, .025, .14, MAT.leather('#222222'), { parent: yoke, at: [x, .05, 0] });
    K.hot(helm, {
      name: '조타 장치', zone: 'nav', click: g => {
        if (s.route) { g.say('바위 틈을 빠져나왔다. 머리 위가 탁 트였다.'); return; }
        if (!s.ballast) { g.sound.play('wrong'); g.say('탱크 균형이 맞지 않아 배가 기우뚱거린다. 밸러스트부터 맞춰야 한다.'); return; }
        g.lock({
          title: '조타 장치', text: '항로 화면을 보고, 바위를 피해 출구까지 <b>가장 짧은 길</b>로 조타하세요.', type: 'dirpad', answer: ROUTE,
          onSolve: g => {
            s.route = true; drawNav(navTex.image.getContext('2d'), 512, 512, true); navTex.needsUpdate = true;
            g.sound.play('thud'); g.say('끼이익… 선체가 바위를 스치며 빠져나왔다. 이제 위가 트였다!');
          },
        });
      },
    });
    // 밸러스트 배출 레버
    const lever = K.group({ at: [-1.95, .93, -2.5] });
    K.box(.16, .08, .22, dark, { parent: lever, at: [0, .04, 0] });
    const arm = K.group({ parent: lever, at: [0, .08, 0], rot: [-.5, 0, 0] });
    K.cyl(.018, .018, .4, MAT.silver(), { parent: arm, at: [0, .2, 0] });
    K.sphere(.045, MAT.plain(0xc81e1e, .35, .2), { parent: arm, at: [0, .42, 0] });
    K.picture(.3, .08, (g, w, h) => {
      for (let i = -2; i < 20; i++) { g.fillStyle = i % 2 ? '#111' : '#e8c020'; g.beginPath(); g.moveTo(i * 20, 0); g.lineTo(i * 20 + 20, 0); g.lineTo(i * 20 - 10, h); g.lineTo(i * 20 - 30, h); g.fill(); }
      g.fillStyle = '#111'; g.fillRect(w * .12, h * .2, w * .76, h * .6); g.fillStyle = '#ffd84a'; g.font = "700 46px 'Noto Sans KR', sans-serif"; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('밸러스트 배출', w / 2, h / 2 + 2);
    }, { at: [-1.95, .935, -2.32], rot: [-Math.PI / 2, 0, 0], res: 512 });
    K.hot(lever, {
      name: '밸러스트 배출 레버', click: async g => {
        if (s.surfaced || s.blowing) return;
        if (!s.ballast) { g.sound.play('wrong'); g.say('탱크 압력이 제각각이다. 지금 당기면 배가 뒤집힌다.'); return; }
        if (!s.route) { g.sound.play('wrong'); g.say('소나 경보! 머리 위가 바위 처마로 막혀 있다. 먼저 빠져나가야 한다.'); return; }
        s.blowing = true; g.sound.play('switch');
        await g.tween(arm.rotation, { x: .7 }, .5);
        g.sound.play('open'); g.say('쉬이이익— 탱크에서 물이 뿜어져 나간다! 배가 위로 솟구친다.');
        g.tween(seaMat, { emissiveIntensity: 1.6 }, 3.5); g.tween(seaLight, { intensity: 6 }, 3.5);
        await g.wait(3.2);
        g.sound.play('thud'); s.blowing = false; s.surfaced = true;
        redA.intensity = redB.intensity = 0; domeMat.emissiveIntensity = .2;
        g.tween(K.scene.rotation, { z: 0 }, .6);
        g.say('출렁— 물 위로 떠올랐다! 경보가 멎었다. 창밖이 환하다.');
      },
    });
    // 잠망경
    const peri = K.group({ at: [1.05, 0, -.4] });
    K.cyl(.07, .07, H - 1.3, steel, { parent: peri, at: [0, 1.3 + (H - 1.3) / 2, 0] });
    K.rbox(.2, .22, .26, .03, dark, { parent: peri, at: [0, 1.5, 0] });
    K.cyl(.045, .045, .08, MAT.plain(0x111111, .4), { parent: peri, at: [0, 1.52, .15], rot: [Math.PI / 2, 0, 0] });
    for (const x of [-.16, .16]) K.cyl(.022, .022, .16, MAT.leather('#1e1e1e'), { parent: peri, at: [x, 1.45, 0], rot: [0, 0, Math.PI / 2] });
    K.torus(.1, .02, MAT.brass(), { parent: peri, at: [0, H - .02, 0], rot: [Math.PI / 2, 0, 0] });
    K.hot(peri, { name: '잠망경', click: g => g.say(s.surfaced ? '렌즈 너머로 둥근 달과 잔잔한 밤바다가 보인다.' : '렌즈 너머가 온통 검푸르다. 아직 깊은 바닷속이다.') });

    // ---------- 동쪽: 둥근 창과 바닷속 ----------
    const port = K.group({ at: [W / 2, 1.5, 0] });
    K.torus(.41, .06, MAT.brass(), { parent: port, at: [-.03, 0, 0], rot: [0, Math.PI / 2, 0], seg: 48 });
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; K.sphere(.018, MAT.brass(), { parent: port, at: [-.08, Math.sin(a) * .41, Math.cos(a) * .41], seg: 8 }); }
    K.cyl(.36, .36, .25, steelDS, { parent: port, at: [.12, 0, 0], rot: [0, 0, Math.PI / 2], open: true, seg: 40 });
    const pg = K.cyl(.36, .36, .01, MAT.glass(0x9fd0ff, .15), { parent: port, at: [.02, 0, 0], rot: [0, 0, Math.PI / 2], seg: 40 }); pg.userData.noRay = true;
    K.hot(port, { name: '둥근 창', click: g => g.say(s.surfaced ? '창밖에 달빛이 일렁인다. 물 위다!' : '두꺼운 유리 너머로 깊은 바다. 이상한 물고기가 천천히 지나간다.') });
    // 바닷속 풍경
    const seaTex = K.canvasTexture(1024, 640, (g, w, h) => {
      const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#0a3a5a'); gr.addColorStop(.5, '#04182c'); gr.addColorStop(1, '#010810'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
      g.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 7; i++) { const x = w * (.1 + i * .13); const lg = g.createLinearGradient(x, 0, x + 60, h * .8); lg.addColorStop(0, 'rgba(120,190,255,.16)'); lg.addColorStop(1, 'rgba(120,190,255,0)'); g.fillStyle = lg; g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 40, 0); g.lineTo(x + 140, h * .8); g.lineTo(x + 60, h * .8); g.fill(); }
      g.globalCompositeOperation = 'source-over';
      g.fillStyle = '#020a10'; g.beginPath(); g.moveTo(0, h); for (let x = 0; x <= w; x += 16) g.lineTo(x, h * .78 - Math.abs(Math.sin(x * .011)) * 90 - Math.sin(x * .05) * 12); g.lineTo(w, h); g.fill();
      g.fillStyle = 'rgba(160,220,255,.5)'; for (let i = 0; i < 120; i++) g.fillRect(Math.random() * w, Math.random() * h, 2, 2);
    });
    const seaMat = new THREE.MeshStandardMaterial({ map: seaTex, emissive: 0xffffff, emissiveMap: seaTex, emissiveIntensity: .7 });
    const seaPic = new THREE.Mesh(new THREE.PlaneGeometry(9, 5.6), seaMat); seaPic.position.set(6.5, 1.5, 0); seaPic.rotation.y = -Math.PI / 2; K.scene.add(seaPic);
    const seaLight = K.point(0x3a8fd0, 2.5, 5, { at: [4, 2, 0] });
    K.point(0x4a9ae0, 1.2, 3, { at: [2.1, 1.5, 0] });
    const fishes = [];
    const fishCol = [0x6a7f8a, 0x8a6a5a, 0x5a7a6a, 0x9a8a5a, 0x6a6a8a];
    for (let i = 0; i < 6; i++) {
      const f = K.group({});
      const bm = MAT.plain(fishCol[i % 5], .5, .3, { emissive: 0x0a2030, emissiveIntensity: .5 });
      K.sphere(.12, bm, { parent: f, scale: [1, .55, .35], seg: 14 });
      K.cone(.07, .12, bm, { parent: f, at: [-.16, 0, 0], rot: [0, 0, Math.PI / 2], scale: [1, 1, .3], seg: 8 });
      K.sphere(.015, MAT.glow(0xcfe8ff, 2), { parent: f, at: [.08, .02, .035], seg: 6 });
      if (i === 0) { K.cyl(.004, .004, .14, bm, { parent: f, at: [.1, .1, 0], rot: [0, 0, -.8] }); K.sphere(.022, MAT.glow(0x9affff, 6), { parent: f, at: [.16, .15, 0], seg: 8 }); f.scale.setScalar(1.6); }
      fishes.push([f, 4.0 + (i % 3) * .4, .6 + (i % 2) * .5, 1.0 + i * .18, .25 + i * .07, i * 1.7]);
    }
    const jelly = K.group({ at: [4.2, 1.6, .4] });
    K.sphere(.16, MAT.glow(0xff9ad8, .8, { transparent: true, opacity: .55 }), { parent: jelly, scale: [1, .7, 1], seg: 18 });
    for (let i = 0; i < 6; i++) K.cyl(.004, .004, .45, MAT.glow(0xffb0e0, .6, { transparent: true, opacity: .5 }), { parent: jelly, at: [Math.cos(i) * .08, -.25, Math.sin(i) * .08] });
    const bubbles = [];
    for (let i = 0; i < 26; i++) { const b = K.sphere(.012 + Math.random() * .02, MAT.glass(0xdff4ff, .45), { at: [2.75 + Math.random() * .5, Math.random() * 3, -.5 + Math.random() * 1], seg: 8, shadow: false }); b.userData.noRay = true; bubbles.push(b); }
    const snow = K.dust(220, [3, 3, 3], { color: 0xbfd8ff, opacity: .5, speed: .02, px: .015 }); snow.position.set(4.2, 0, 0);

    // ---------- 동쪽: 밸러스트 밸브 판 ----------
    const bp = K.group({ at: [W / 2 - .03, 0, 1.6], rot: [0, -Math.PI / 2, 0] });
    const plate = K.box(1.5, 1.2, .03, MAT.metal('#2e3a3c'), { parent: bp, at: [0, 1.55, 0] });
    K.text(['부상 준비: 세 탱크 모두 4', '밸브는 이웃 탱크와 이어져 있다'], 1.3, .2, { parent: bp, at: [0, 2.03, .02], size: .3, bg: '#151b1d', color: '#ffd84a' });
    const tankSt = [2, 1, 3], eff = [[0, 1], [0, 1, 2], [1, 2]];
    const tNeedles = [], tWheels = [];
    const tNames = ['앞 탱크 밸브', '가운데 탱크 밸브', '뒤 탱크 밸브'];
    pipe(K, [-.45, 1.25, .06], [.45, 1.25, .06], .022, steel, bp);
    ['앞', '가운데', '뒤'].forEach((lb, i) => {
      const x = -.45 + i * .45;
      const face = dial(K, .13, 5, lb, '#e9e4d4', '#1a1a1a'); face.position.set(x, 1.7, .03); bp.add(face);
      K.torus(.13, .016, MAT.brass(), { parent: bp, at: [x, 1.7, .03], seg: 32 });
      const nd = K.group({ parent: bp, at: [x, 1.7, .045] });
      K.box(.01, .1, .005, MAT.plain(0xb01818, .5), { parent: nd, at: [0, .04, 0], shadow: false });
      tNeedles.push(nd);
      pipe(K, [x, 1.25, .06], [x, 1.57, .06], .02, steel, bp);
      const v = K.group({ parent: bp, at: [x, 1.25, .08] });
      K.cyl(.04, .04, .1, dark, { parent: v, rot: [Math.PI / 2, 0, 0], seg: 14 });
      const wh = K.group({ parent: v, at: [0, 0, .07] });
      K.torus(.09, .014, red, { parent: wh });
      for (let k = 0; k < 3; k++) K.box(.18, .016, .012, red, { parent: wh, rot: [0, 0, k * Math.PI / 3] });
      K.sphere(.012, MAT.plain(0xf2f2f2, .4), { parent: wh, at: [0, .09, .01], seg: 8 });
      tWheels.push(wh);
      K.hot(v, { name: tNames[i], zone: 'ballast', click: g => turnTank(g, i) });
    });
    const dialAng = v => -(-135 + v * 67.5) * Math.PI / 180;
    tNeedles.forEach((n, i) => n.rotation.z = dialAng(tankSt[i]));
    K.zone('ballast', { pos: [1.15, 1.55, 1.6], look: [2.5, 1.55, 1.6], fov: 64, range: .45 });
    K.hot(plate, {
      name: '밸러스트 밸브 판', zone: 'ballast', click: g => g.say(s.loose ? '밸브가 풀려 있다. 이제 손으로 돌릴 수 있다.' : '탱크 밸브 세 개. 녹이 슬어 꽉 끼어 있다.'),
      use: { wrench: g => { g.take('wrench'); s.loose = true; g.sound.play('thud'); g.say('끼익… 렌치로 힘껏 비틀자 밸브 세 개가 모두 풀렸다.'); } },
    });
    function turnTank(g, i) {
      if (s.ballast) { g.say('세 탱크 모두 4. 준비 완료.'); return; }
      if (!s.loose) { g.sound.play('wrong'); g.say('녹슬어 꽉 끼었다. 맨손으로는 꿈쩍도 않는다.'); return; }
      g.sound.play('switch');
      g.tween(tWheels[i].rotation, { z: tWheels[i].rotation.z - Math.PI * 2 / 5 }, .35);
      for (const k of eff[i]) tankSt[k] = (tankSt[k] + 1) % 5;
      if (tankSt.every(v => v === 4)) {
        s.ballast = true;
        g.wait(.5).then(() => { g.sound.play('unlock'); g.say('세 탱크 모두 4! 부상 준비 완료. …그런데 소나가 운다. 머리 위가 바위로 막혀 있다.'); });
      }
    }

    // ---------- 서쪽: 침대와 비상 보관함 ----------
    const bk = K.group({ at: [-2.1, 0, .25], rot: [0, Math.PI / 2, 0] });
    for (const x of [-.98, .98]) K.box(.05, 1.8, .78, dark, { parent: bk, at: [x, .9, 0] });
    K.box(2, .05, .78, dark, { parent: bk, at: [0, .4, 0] });
    K.box(2, .12, .02, dark, { parent: bk, at: [0, .45, .39] });
    const mat = K.group({ parent: bk, at: [0, .43, -.35] });
    K.rbox(1.9, .14, .7, .05, MAT.fabric('#5a6070', 0, [2, 1]), { parent: mat, at: [0, .07, .35] });
    K.rbox(1.3, .05, .72, .02, MAT.fabric('#3a4a3a', 1, [2, 1]), { parent: mat, at: [.25, .15, .35] });
    K.rbox(.4, .1, .5, .05, MAT.fabric('#d8d4c8', 0, [1, 1]), { parent: mat, at: [-.7, .19, .35] });
    const barG = K.group({ parent: bk, at: [.2, .45, .05], rot: [0, .3, 0] }); wrenchModel(K, barG, false, true);
    K.zone('bunk', { pos: [-1.05, 1.5, .25], look: [-2.2, .95, .25], fov: 55, range: .6 });
    K.hot(mat, {
      name: '침대 매트리스', zone: 'bunk', click: g => {
        if (s.mattress) { g.say('얇은 매트리스. 밑을 이미 살펴봤다.'); return; }
        s.mattress = true; g.sound.play('page'); g.tween(mat.rotation, { x: -.75 }, .6); g.say('매트리스를 들추자 밑에 쇠 막대가 있다.');
      },
    });
    K.hot(barG, { name: '쇠 막대', zone: 'bunk', enabled: () => s.mattress, click: g => { barG.visible = false; g.unhot(barG); g.give('bar'); } });
    // 선반과 항해 일지
    K.box(1.9, .03, .25, dark, { parent: bk, at: [0, 1.1, -.26] });
    const log = K.group({ parent: bk, at: [-.3, 1.12, -.26] });
    K.box(.26, .05, .2, MAT.leather('#2a3a5a'), { parent: log, at: [0, .025, 0] });
    K.text(['항해', '일지'], .2, .14, { parent: log, at: [0, .052, 0], rot: [-Math.PI / 2, 0, 0], size: .3, bg: '#2a3a5a', color: '#e8d8a8' });
    K.hot(log, { name: '항해 일지', zone: 'bunk', click: g => g.note('항해 일지 — 제 41일', '엔진 정지. 깊이 312m. 머리 위는 바위 처마.\n\n<b>비상 보관함</b> 번호를 잊지 말 것.\n계기판 세 바늘이 가리키는 숫자를 왼쪽부터,\n마지막 자리는 <b>소나에 잡힌 물체의 수</b>.\n\n<b>비상 부상 절차</b>\n1. 밸러스트 탱크 셋을 모두 <b>4</b>로. (밸브가 녹슬었으니 렌치로)\n2. 항로 화면을 보고 바위 틈을 <b>가장 짧은 길</b>로 빠져나간다.\n3. 밸러스트 배출 레버를 당긴다.\n4. 물 위에 뜨면 천장 해치를 연다.\n\n<p style="text-align:right">— 함장 R.</p>') });
    K.cyl(.04, .035, .09, MAT.plain(0xe8e4dc, .4), { parent: bk, at: [.3, 1.16, -.25] });
    K.frame(.16, .2, (g, w, h) => { g.fillStyle = '#c8b898'; g.fillRect(0, 0, w, h); g.fillStyle = '#5a4a3a'; g.beginPath(); g.arc(w / 2, h * .4, w * .2, 0, 7); g.fill(); g.fillRect(w * .25, h * .6, w * .5, h * .4); }, { parent: bk, at: [.6, 1.23, -.36], border: .015, frameMat: MAT.wood('#4a2a14') });
    // 비상 보관함
    const lk = K.group({ at: [-2.3, 0, -2.0], rot: [0, Math.PI / 2, 0] });
    const lkMat = MAT.metal('#8a2222', { rough: .5, metal: .5 });
    K.box(.6, .9, .34, lkMat, { parent: lk, at: [0, 1.35, 0] });
    K.box(.5, .02, .3, dark, { parent: lk, at: [0, 1.3, 0] });
    const head = K.group({ parent: lk, at: [0, 1.33, 0], rot: [0, 0, .3], scale: .6 }); wrenchModel(K, head, true, false);
    const lDoor = K.group({ parent: lk, at: [-.3, 1.35, .175] });
    K.box(.6, .9, .025, lkMat, { parent: lDoor, at: [.3, 0, 0] });
    K.text(['비상', '보관함'], .3, .2, { parent: lDoor, at: [.3, .22, .015], size: .32, bg: '#f2f2f2', color: '#a01818' });
    K.rbox(.16, .2, .02, .01, MAT.plain(0x1a1a1a, .4), { parent: lDoor, at: [.3, -.12, .02] });
    for (let i = 0; i < 9; i++) K.box(.03, .03, .01, MAT.silver(), { parent: lDoor, at: [.26 + (i % 3) * .04, -.08 - Math.floor(i / 3) * .045, .03] });
    K.zone('locker', { pos: [-1.25, 1.5, -2.0], look: [-2.3, 1.35, -2.0], fov: 50, range: .4 });
    K.hot(lk, {
      name: '비상 보관함', zone: 'locker', click: g => {
        if (s.locker) { g.say('빈 보관함이다.'); return; }
        g.lock({ title: '비상 보관함', text: '네 자리 번호를 맞추세요.', type: 'digits', answer: '7253', onSolve: g => { s.locker = true; g.sound.play('open'); g.tween(lDoor.rotation, { y: -1.8 }, .9); head.visible = false; g.give('wrenchHead'); } });
      },
    });

    // ---------- 남쪽: 사다리와 해치 ----------
    for (const x of [-.22, .22]) K.box(.04, H, .04, steel, { at: [x, H / 2, 2.66] });
    for (let y = .3; y < H; y += .3) K.cyl(.015, .015, .44, steel, { at: [0, y, 2.66], rot: [0, 0, Math.PI / 2], seg: 10 });
    K.cyl(.44, .44, 1.0, steelDS, { at: [0, H + .5, HZ], open: true, seg: 40 });
    K.torus(.44, .03, dark, { at: [0, H - .01, HZ], rot: [Math.PI / 2, 0, 0], seg: 40 });
    const skyMat = MAT.glow(0x08101a, 1);
    K.cyl(.44, .44, .01, skyMat, { at: [0, H + 1.0, HZ], seg: 40 });
    const moon = K.point(0xbcd0ff, 0, 5, { at: [0, H + .6, HZ] });
    const hp = K.group({ at: [-.42, H - .03, HZ] });
    const lid = K.group({ parent: hp, at: [.42, 0, 0] });
    K.cyl(.42, .42, .05, MAT.metal('#4a5458', { rough: .45 }), { parent: lid, seg: 40 });
    const hw = K.group({ parent: lid, at: [0, -.09, 0] });
    K.torus(.18, .018, red, { parent: hw, rot: [Math.PI / 2, 0, 0], seg: 32 });
    for (let k = 0; k < 2; k++) K.box(.36, .015, .02, red, { parent: hw, rot: [0, k * Math.PI / 2, 0] });
    K.cyl(.012, .012, .08, steel, { parent: lid, at: [0, -.05, 0] });
    K.zone('hatch', { pos: [0, 1.5, 1.35], look: [0, 2.6, 2.25], fov: 60, range: .5 });
    K.point(0xffe8c8, 2, 3, { at: [0, 2.2, 1.6] }); // 해치 쪽 보조 조명
    K.hot(lid, {
      name: '해치', zone: 'hatch', click: async g => {
        if (!s.surfaced) { g.sound.play('wrong'); g.say('물속 312미터. 지금 열면 바닷물이 쏟아져 들어온다!'); return; }
        if (s.hatch) return;
        s.hatch = true; g.sound.play('switch');
        await g.tween(hw.rotation, { y: Math.PI * 3 }, 1.2);
        g.sound.play('open'); skyMat.color.set(0x5a7aa8); skyMat.emissive.set(0x5a7aa8); g.tween(moon, { intensity: 5 }, 1);
        await g.tween(hp.rotation, { z: 1.5 }, 1.2);
        g.win();
      },
    });
    // 구명 튜브, 외투
    const ring = K.group({ at: [-1.4, 1.6, D / 2 - .08] });
    for (let i = 0; i < 8; i++) K.torus(.22, .055, MAT.fabric(i % 2 ? '#e8e4dc' : '#c82a1e', 0, [1, 1]), { parent: ring, arc: Math.PI / 4, rot: [0, 0, i * Math.PI / 4], seg: 8 });
    K.hot(ring, { name: '구명 튜브', click: g => g.say('「제7잠수함」 이라고 쓰여 있다. 물 위에 떠야 쓸모가 있다.') });
    K.rbox(.45, .9, .12, .05, MAT.fabric('#2a3340', 0, [1, 1]), { at: [1.2, 1.35, D / 2 - .1] });
    K.cyl(.02, .02, .1, MAT.brass(), { at: [1.2, 1.85, D / 2 - .05], rot: [Math.PI / 2, 0, 0] });

    // 리벳 (한꺼번에)
    const rv = new THREE.InstancedMesh(new THREE.SphereGeometry(.013, 6, 4), dark, rivetPos.length);
    const mm = new THREE.Matrix4(); rivetPos.forEach((p, i) => rv.setMatrixAt(i, mm.makeTranslation(p[0], p[1], p[2])));
    K.scene.add(rv);

    // ---------- 움직임 ----------
    const wrap = a => ((a % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    K.onUpdate((dt, t) => {
      spin.rotation.y += dt * (s.surfaced ? 0 : 3.5);
      for (const [n, v, ph] of needles) n.rotation.z = -(-135 + (v + Math.sin(t * 3 + ph) * .1 + Math.sin(t * 11 + ph) * .04) * 30) * Math.PI / 180;
      tNeedles.forEach((n, i) => { const tg = dialAng(tankSt[i]); n.rotation.z += (tg - n.rotation.z) * Math.min(1, dt * 5); });
      const sw = -t * 1.4; sweep.rotation.z = sw;
      for (const [m, a] of blips) { const d = wrap(a - sw); m.emissiveIntensity = .25 + 3 * Math.exp(-d * 1.6); }
      for (const [m, ph, sp] of blinks) m.emissiveIntensity = Math.sin(t * sp + ph) > .2 ? 2 : .15;
      for (const [f, cx, r, y, w, ph] of fishes) {
        const a = t * w + ph; f.position.set(cx + Math.cos(a) * r, y + Math.sin(a * 1.7) * .1, Math.sin(a) * r * 1.3);
        f.rotation.y = Math.atan2(-Math.cos(a) * r * 1.3, -Math.sin(a) * r) ;
      }
      jelly.position.y = 1.6 + Math.sin(t * .8) * .15; jelly.scale.y = 1 + Math.sin(t * 2.4) * .08;
      const bs = s.blowing ? 2.2 : .35;
      for (const b of bubbles) { b.position.y += dt * bs * (1 + (b.id % 5) * .15); b.position.x = 2.95 + Math.sin(t * 2 + b.id) * .2; if (b.position.y > 3) b.position.y = 0; }
      if (s.blowing) K.scene.rotation.z = Math.sin(t * 9) * .006 + Math.sin(t * 2.3) * .01;
    });
  },
};

// 0~(n-1) 숫자가 270도에 걸쳐 적힌 계기판 얼굴
function dial(K, r, n, label, bg, fg) {
  const { THREE } = K;
  const tex = K.canvasTexture(256, 256, (g, w) => {
    const c = w / 2; g.fillStyle = bg; g.beginPath(); g.arc(c, c, c, 0, 7); g.fill();
    g.fillStyle = fg; g.strokeStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = `700 ${n > 6 ? 30 : 38}px 'Noto Sans KR', sans-serif`;
    for (let v = 0; v < n; v++) {
      const a = (-135 + v * 270 / (n - 1)) * Math.PI / 180;
      g.fillText(String(v), c + Math.sin(a) * c * .72, c - Math.cos(a) * c * .72);
      g.lineWidth = 5; g.beginPath(); g.moveTo(c + Math.sin(a) * c * .88, c - Math.cos(a) * c * .88); g.lineTo(c + Math.sin(a) * c * .98, c - Math.cos(a) * c * .98); g.stroke();
    }
    g.font = "700 26px 'Noto Sans KR', sans-serif"; g.fillText(label, c, c * 1.55);
  });
  return new THREE.Mesh(new THREE.CircleGeometry(r, 40), new THREE.MeshStandardMaterial({ map: tex, roughness: .95, color: 0xb8b8b8, envMapIntensity: .2 }));
}
// 항로 지도: 5×5, 0행이 위
const OPEN = ['4,1', '3,1', '2,1', '2,2', '2,3', '1,3', '0,3', '2,0', '1,1', '0,1', '3,3', '4,3', '4,4'];
const PATH = [[4, 1], [3, 1], [2, 1], [2, 2], [2, 3], [1, 3], [0, 3]];
function drawNav(g, w, h, done) {
  g.fillStyle = '#04121a'; g.fillRect(0, 0, w, h);
  const N = 5, m = 46, cs = (w - m * 2) / N, y0 = 64;
  g.font = "700 24px 'Noto Sans KR', sans-serif"; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = '#7affc0'; g.fillText(done ? '항로: 바위 틈 통과' : '항로 화면 — 바위 처마 아래', w / 2, 18);
  g.font = "700 30px 'Noto Sans KR', sans-serif";
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
    const x = m + c * cs, y = y0 + r * cs, open = OPEN.includes(`${r},${c}`);
    g.fillStyle = open ? '#0c3a4a' : '#3a2a1e'; g.fillRect(x + 2, y + 2, cs - 4, cs - 4);
    if (!open) { g.fillStyle = '#5a4430'; g.beginPath(); g.arc(x + cs * .35, y + cs * .4, cs * .18, 0, 7); g.arc(x + cs * .62, y + cs * .62, cs * .22, 0, 7); g.fill(); }
  }
  g.strokeStyle = 'rgba(120,255,200,.35)'; g.lineWidth = 2;
  for (let i = 0; i <= N; i++) { g.beginPath(); g.moveTo(m, y0 + i * cs); g.lineTo(m + N * cs, y0 + i * cs); g.moveTo(m + i * cs, y0); g.lineTo(m + i * cs, y0 + N * cs); g.stroke(); }
  // 출구
  const ex = m + 3.5 * cs; g.fillStyle = '#7affc0'; g.beginPath(); g.moveTo(ex, y0 - 26); g.lineTo(ex + 14, y0 - 6); g.lineTo(ex - 14, y0 - 6); g.fill();
  g.fillText('출구', ex + 50, y0 - 16);
  if (done) {
    g.strokeStyle = '#ffd84a'; g.lineWidth = 6; g.beginPath();
    PATH.forEach(([r, c], i) => { const x = m + (c + .5) * cs, y = y0 + (r + .5) * cs; i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.stroke();
  }
  const [sr, sc] = done ? [0, 3] : [4, 1], sx = m + (sc + .5) * cs, sy = y0 + (sr + .5) * cs;
  g.fillStyle = '#ffd84a'; g.beginPath(); g.moveTo(sx, sy - cs * .3); g.lineTo(sx + cs * .24, sy + cs * .25); g.lineTo(sx - cs * .24, sy + cs * .25); g.fill();
  g.fillStyle = '#9fb8c0'; g.font = "700 20px 'Noto Sans KR', sans-serif";
  g.fillText('▲ 우리 배    ■ 바위', w / 2, h - 13);
}
function pipe(K, a, b, r, mat, parent) {
  const { THREE } = K;
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), d = B.clone().sub(A), len = d.length();
  const m = K.cyl(r, r, len, mat, { parent, seg: 14 });
  m.position.copy(A).add(B).multiplyScalar(.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
  return m;
}
function wrenchModel(K, g, withHead, withBar) {
  const st = K.MAT.metal('#9aa0a6', { rough: .3 });
  if (withHead) {
    K.box(.09, .06, .025, st, { parent: g, at: [.2, 0, 0] });
    K.box(.03, .07, .025, st, { parent: g, at: [.25, .055, 0] });
    K.box(.03, .05, .025, st, { parent: g, at: [.25, -.045, 0] });
    K.cyl(.012, .012, .05, K.MAT.brass(), { parent: g, at: [.18, 0, 0] });
  }
  if (withBar) K.cyl(.016, .016, .34, K.MAT.metal('#5a6066', { rough: .4 }), { parent: g, at: [0, 0, 0], rot: [0, 0, Math.PI / 2], seg: 12 });
}

export const solution = [
  { hot: '항해 일지' },
  { hot: '계기판' },
  { hot: '소나 화면' },
  { hot: '비상 보관함', lock: '7253' },
  { hot: '침대 매트리스' },
  { hot: '쇠 막대' },
  { combine: ['wrenchHead', 'bar'] },
  { hot: '밸러스트 밸브 판', item: 'wrench' },
  { hot: '앞 탱크 밸브' }, { hot: '앞 탱크 밸브' }, { hot: '뒤 탱크 밸브', wait: 1.2 },
  { hot: '항로 화면' },
  { hot: '조타 장치', lock: ROUTE },
  { hot: '밸러스트 배출 레버', wait: 6 },
  { hot: '해치', wait: 4 },
];
