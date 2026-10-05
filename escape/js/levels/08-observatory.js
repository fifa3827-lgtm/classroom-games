// 8단계: 별을 보는 방 (천문대)
// 흐름: 관측 일지(행성 배치도) → 태양계 모형 행성 4개 돌리기 → 태양이 열리며 접안렌즈
//       접안렌즈 → 망원경: W 모양 별자리 → 벽의 별자리 약어표에서 CAS → 성도함(글자 자물쇠) → 성도 오른쪽 반
//       책상의 성도 왼쪽 반 + 오른쪽 반 = 온전한 성도(α~ε 표시)
//       → 돔 틈 하늘의 별 다섯 개를 α→β→γ→δ→ε 순서로 누르기 → 북쪽 벽에 빛 글씨
//       → 천문 연표에서 「카시오페이아의 새 별」 1572 → 돔 문 다이얼 → 탈출
const PI = Math.PI;
const R = 3.5, WH = 2.6, GAP = .9;          // 돔 반지름, 벽 높이, 돔 틈 너비(라디안)
const SKY_EYE = [0, 1.5, 1.0];              // 하늘을 올려다보는 자리
// 하늘의 별 (a: 옆 각도, e: 고도, 단위 도) — 위에서부터 β α γ δ ε 로 W를 세운 모양
const CAS = [
  { name: '쉐다르', greek: 'α', a: 3, e: 49 },
  { name: '카프', greek: 'β', a: -5, e: 56 },
  { name: '나비', greek: 'γ', a: -4, e: 42 },
  { name: '루크바', greek: 'δ', a: 4, e: 35 },
  { name: '세긴', greek: 'ε', a: -2, e: 28 },
];
const DECOY = [
  { name: '북극성', a: -9, e: 33 },
  { name: '미르팍', a: 9, e: 41 },
  { name: '알골', a: 8, e: 25 },
];
const W_LINE = ['카프', '쉐다르', '나비', '루크바', '세긴'];
const TRACE = ['쉐다르', '카프', '나비', '루크바', '세긴'];
// 태양계 모형: start/goal = 0 북, 1 동, 2 남, 3 서
const PLANETS = [
  { name: '수성', r: .15, y: .9, size: .022, color: 0x9a9a9a, css: '#9a9a9a', start: 0, goal: 1 },
  { name: '금성', r: .23, y: .94, size: .03, color: 0xe8c872, css: '#e8c872', start: 1, goal: 3 },
  { name: '지구', r: .31, y: .98, size: .034, color: 0x3a7ad0, css: '#3a7ad0', start: 2, goal: 0 },
  { name: '화성', r: .40, y: 1.02, size: .028, color: 0xc8502e, css: '#c8502e', start: 3, goal: 2 },
];

export default {
  title: '별을 보는 방',
  intro: '차가운 밤공기에 눈을 떴다.\n둥근 지붕이 갈라진 틈으로 별이 쏟아진다.\n산꼭대기 천문대, 문은 잠겨 있다.\n\n<i>책상 위 관측 일지부터 살펴보자.</i>',
  outro: '돔 문이 열리자 별빛 아래 산길이 이어진다.\n멀리 도시의 불빛이 반짝인다.\n저 높은 호텔 창 하나만 유난히 밝다…',
  env: .3, exposure: 1.1, bloom: .6, bg: 0x02030a,
  start: { pos: [.4, 1.6, 2.4], look: [0, 2.3, -2.5] },

  items: {
    chartL: { name: '성도 왼쪽 반', desc: '찢어진 별 지도의 왼쪽. 오른쪽 반이 어딘가 있을 것이다.', model: (K, g) => chartHalf(K, g, 0), iconRot: [0, 0, 0] },
    chartR: { name: '성도 오른쪽 반', desc: '찢어진 별 지도의 오른쪽. 그리스 문자가 적힌 별들이 보인다.', model: (K, g) => chartHalf(K, g, 1), iconRot: [0, 0, 0] },
    chart: {
      name: '온전한 성도', desc: '두 반쪽을 맞춘 별 지도. 아래 「펼쳐 보기」로 다시 볼 수 있다.', iconRot: [0, 0, 0],
      model: (K, g) => { chartHalf(K, g, 0, -.115); chartHalf(K, g, 1, .115); },
      onInspect: (g, row) => { const b = document.createElement('button'); b.className = 'btn'; b.textContent = '펼쳐 보기'; b.onclick = () => showChart(g); row.appendChild(b); },
    },
    eyepiece: { name: '접안렌즈', desc: '망원경 뒤쪽에 끼우는 눈대. 놋쇠 테에 렌즈가 박혀 있다.', model: eyepieceModel },
  },
  combos: [['chartL', 'chartR', 'chart', g => showChart(g)]],

  hints: [
    { when: s => !s.orrery, text: ['책상 위 관측 일지를 읽어 보세요.', '일지의 그림은 동쪽 탁자 위 태양계 모형의 배치예요. 행성을 누르면 팔이 90도씩 돌아요. 받침판에 북·동·남·서가 적혀 있어요.', '수성은 동, 금성은 서, 지구는 북, 화성은 남으로 돌리세요.'] },
    { when: (s, g) => !s.eyepieceTaken, text: ['태양계 모형의 태양이 열렸어요.', '열린 태양 속을 눌러 접안렌즈를 꺼내세요.'] },
    { when: s => !s.scope, text: ['접안렌즈는 망원경에 끼우는 부품이에요.', '가방에서 접안렌즈를 고르고, 방 가운데 놋쇠 망원경을 누르세요.'] },
    { when: s => !s.cabinet, text: ['망원경으로 본 별자리 모양을 기억하세요.', '북서쪽 벽의 「별자리 약어표」에서 같은 모양을 찾으세요. 성도함 자물쇠는 알파벳 세 글자예요.', 'W 모양은 카시오페이아자리, 약어는 CAS. 성도함에 CAS를 넣으세요.'] },
    { when: (s, g) => !g.has('chart') && !s.traced, text: ['책상 위에 찢어진 성도가 있어요. 성도함 서랍에도 반쪽이 있고요.', '두 반쪽을 모두 가방에 넣고, 가방에서 차례로 눌러 합치세요.'] },
    { when: s => !s.traced, text: ['성도는 가방에서 고른 뒤 「살펴보기」→「펼쳐 보기」로 다시 볼 수 있어요.', '돔 틈으로 보이는 북쪽 하늘에서 W 모양의 다섯 별을 찾아, α부터 ε까지 차례로 누르세요.', '순서: 쉐다르(α, 위에서 둘째) → 카프(β, 맨 위) → 나비(γ) → 루크바(δ) → 세긴(ε, 맨 아래).'] },
    { text: ['북쪽 벽에 떠오른 빛 글씨를 읽으세요.', '북동쪽 벽 「천문 연표」에서 카시오페이아자리에 새 별이 나타난 해를 찾으세요.', '돔 문 다이얼에 1572.'] },
  ],

  build(K) {
    const { THREE, MAT, s } = K;
    const polar = (a, r, y) => { const t = a * PI / 180; return [Math.sin(t) * r, y, -Math.cos(t) * r]; };
    const onWall = (a, y, r = 3.4) => ({ at: polar(a, r, y), rot: [0, -a * PI / 180, 0] });
    const wood = MAT.wood('#4a2e1a'), darkWood = MAT.wood('#2a1a0e'), iron = MAT.iron();

    // ---------- 바닥·벽·돔 ----------
    K.plane(7.2, 7.2, MAT.floor('#3b2a1e', [3.6, 3.6]), { rot: [-PI / 2, 0, 0] });
    const wallMat = MAT.plaster('#596173', [9, 1.6]); wallMat.side = THREE.BackSide;
    K.cyl(R, R, WH, wallMat, { at: [0, WH / 2, 0], open: true, seg: 72, shadow: false });
    const wainMat = MAT.wood('#3a2616', [14, 1]); wainMat.side = THREE.BackSide;
    K.cyl(R - .03, R - .03, 1, wainMat, { at: [0, .5, 0], open: true, seg: 72, shadow: false });
    K.torus(R - .045, .03, darkWood, { at: [0, 1.0, 0], rot: [PI / 2, 0, 0], seg: 96 });
    K.torus(R - .04, .05, darkWood, { at: [0, .05, 0], rot: [PI / 2, 0, 0], seg: 96 });
    const domeMat = MAT.plaster('#6c7486', [6, 3]); domeMat.side = THREE.DoubleSide;
    const dome = K.place(new THREE.Mesh(new THREE.SphereGeometry(R, 72, 24, 1.5 * PI + GAP / 2, 2 * PI - GAP, 0, PI / 2), domeMat), { at: [0, WH, 0], shadow: false });
    K.hot(dome, { name: '열린 돔 틈', goto: 'sky', click: g => g.say('갈라진 지붕 틈으로 북쪽 하늘이 보인다. 은하수가 흐른다.') });
    // 갈비살(뼈대)
    for (const ph of [1.5 * PI + GAP / 2, 1.5 * PI - GAP / 2]) K.torus(R - .03, .06, iron, { at: [0, WH, 0], rot: [0, ph + PI, 0], arc: PI / 2, seg: 40 });
    for (let k = 1; k < 8; k++) { const ph = 1.5 * PI + GAP / 2 + k / 8 * (2 * PI - GAP); K.torus(R - .02, .025, iron, { at: [0, WH, 0], rot: [0, ph + PI, 0], arc: PI / 2, seg: 40 }); }
    for (const th of [.5, .95]) { const rr = R * Math.sin(th); K.torus(rr - .02, .02, iron, { at: [0, WH + R * Math.cos(th), 0], rot: [PI / 2, 0, 1.5 * PI + GAP / 2], arc: 2 * PI - GAP, seg: 72 }); }

    // 도는 돔 링(톱니) + 구동 톱니바퀴
    const ring = K.group({ at: [0, WH - .02, 0] });
    K.torus(R - .07, .05, MAT.brass({ roughness: .45 }), { parent: ring, rot: [PI / 2, 0, 0], seg: 120 });
    const toothMat = MAT.iron();
    for (let i = 0; i < 96; i++) { const a = i / 96 * PI * 2; K.box(.03, .05, .05, toothMat, { parent: ring, at: [Math.cos(a) * (R - .13), 0, Math.sin(a) * (R - .13)], rot: [0, -a, 0], shadow: false }); }
    const ringGlow = K.torus(R - .07, .012, MAT.glow(0x6fa8ff, 0), { parent: ring, at: [0, -.06, 0], rot: [PI / 2, 0, 0], seg: 120, shadow: false });
    const gears = [];
    for (const a of [100, 260]) {
      const m = K.group({ ...onWall(a, 2.3, 3.33) });
      K.rbox(.32, .26, .2, .02, MAT.metal('#3c4048', { rough: .5 }), { parent: m, at: [0, 0, .05] });
      const gear = K.group({ parent: m, at: [0, .2, .12] });
      K.cyl(.1, .1, .04, MAT.brass(), { parent: gear });
      for (let i = 0; i < 12; i++) { const t = i / 12 * PI * 2; K.box(.03, .04, .03, MAT.brass(), { parent: gear, at: [Math.cos(t) * .11, 0, Math.sin(t) * .11], rot: [0, -t, 0] }); }
      gears.push(gear);
    }
    K.onUpdate((dt) => {
      const sp = s.traced ? .25 : .04;
      ring.rotation.y += dt * sp;
      gears.forEach((gr, i) => gr.rotation.y += dt * sp * 12 * (i ? -1 : 1));
    });

    // ---------- 밤하늘 ----------
    const skyTex = K.canvasTexture(2048, 1024, (g, W, H) => {
      const gr = g.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, '#03050f'); gr.addColorStop(.4, '#081230'); gr.addColorStop(.5, '#1a2748'); gr.addColorStop(.52, '#05070e'); gr.addColorStop(1, '#020306');
      g.fillStyle = gr; g.fillRect(0, 0, W, H);
      const toUV = (x, y, z) => { const l = Math.hypot(x, y, z); x /= l; y /= l; z /= l; let ph = Math.atan2(z, -x); if (ph < 0) ph += 2 * PI; return [ph / (2 * PI) * W, Math.acos(Math.max(-1, Math.min(1, y))) / PI * H]; };
      const r = K.rng(8);
      const a = [1, 0, 0], b = [0, .6, -.8], n = [0, .8, .6];
      const along = (t, off) => [Math.cos(t) * a[0] + Math.sin(t) * b[0] + off * n[0], Math.cos(t) * a[1] + Math.sin(t) * b[1] + off * n[1], Math.cos(t) * a[2] + Math.sin(t) * b[2] + off * n[2]];
      g.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 3200; i++) {
        const t = r() * PI * 2, off = (r() + r() + r() - 1.5) * .2, [u, v] = toUV(...along(t, off));
        const rad = 5 + r() * 20, warm = r() < .3;
        g.fillStyle = warm ? `rgba(220,190,170,${.025 + r() * .03})` : `rgba(160,180,235,${.03 + r() * .04})`;
        g.beginPath(); g.arc(u, v, rad, 0, 7); g.fill();
      }
      g.globalCompositeOperation = 'source-over';
      for (let i = 0; i < 900; i++) { // 먼지 띠(어두운 갈래)
        const t = r() * PI * 2, off = (r() - .5) * .06 + Math.sin(t * 3) * .03, [u, v] = toUV(...along(t, off));
        g.fillStyle = `rgba(3,4,10,${.05 + r() * .08})`; g.beginPath(); g.arc(u, v, 3 + r() * 9, 0, 7); g.fill();
      }
      for (let i = 0; i < 9000; i++) { g.fillStyle = `rgba(220,230,255,${r() * .7})`; g.fillRect(r() * W, r() * H * .52, 1.2, 1.2); }
      // 지평선의 산 그림자
      g.fillStyle = '#020306'; g.beginPath(); g.moveTo(0, H); for (let x = 0; x <= W; x += 16) g.lineTo(x, H * .5 - 6 - Math.abs(Math.sin(x * .004)) * 22 - r() * 6); g.lineTo(W, H); g.fill();
    });
    const sky = new THREE.Mesh(new THREE.SphereGeometry(60, 64, 32), new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide, depthWrite: false }));
    sky.userData.noRay = true; K.scene.add(sky);
    const dot = K.canvasTexture(32, 32, (g) => { const gr = g.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.35, 'rgba(255,255,255,.6)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 32, 32); });
    const starLayers = [];
    const layer = (n, size, seed) => {
      const geo = new THREE.BufferGeometry(), p = new Float32Array(n * 3), c = new Float32Array(n * 3), r = K.rng(seed);
      for (let i = 0; i < n; i++) {
        let x, y, z;
        if (r() < .45) { const t = r() * PI * 2, off = (r() + r() - 1) * .18; x = Math.cos(t); y = Math.sin(t) * .6 + off * .8; z = -Math.sin(t) * .8 + off * .6; }
        else { y = r() * 1.05 - .05; const t = r() * PI * 2, q = Math.sqrt(1 - y * y); x = q * Math.cos(t); z = q * Math.sin(t); }
        const l = Math.hypot(x, y, z) / 55; p[i * 3] = x / l; p[i * 3 + 1] = y / l; p[i * 3 + 2] = z / l;
        const k = r(); c[i * 3] = k < .2 ? .75 : 1; c[i * 3 + 1] = k < .2 ? .85 : k > .85 ? .85 : .97; c[i * 3 + 2] = k > .85 ? .65 : 1;
      }
      geo.setAttribute('position', new THREE.BufferAttribute(p, 3)); geo.setAttribute('color', new THREE.BufferAttribute(c, 3));
      const m = new THREE.PointsMaterial({ size, sizeAttenuation: false, map: dot, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
      const pts = new THREE.Points(geo, m); pts.userData.noRay = true; K.scene.add(pts); starLayers.push(m);
    };
    layer(2600, 2, 21); layer(420, 3.2, 22); layer(70, 5, 23);
    // 달
    const moonTex = K.canvasTexture(256, 256, (g, W, H) => {
      g.fillStyle = '#e9e6da'; g.fillRect(0, 0, W, H); const r = K.rng(4);
      for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(120,115,105,${.1 + r() * .25})`; g.beginPath(); g.arc(r() * W, r() * H, 4 + r() * 26, 0, 7); g.fill(); }
    });
    const moon = new THREE.Mesh(new THREE.SphereGeometry(.9, 32, 16), new THREE.MeshBasicMaterial({ map: moonTex, color: new THREE.Color(1.7, 1.65, 1.5) }));
    moon.position.set(...skyPos(12, 19, 40)); moon.userData.noRay = true; K.scene.add(moon);

    // 누를 수 있는 별들
    const hitMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
    const starObjs = {}, picked = [];
    for (const st of [...CAS, ...DECOY]) {
      const grp = K.group({ at: skyPos(st.a, st.e) });
      const core = K.sphere(st.greek ? .17 : .14, MAT.glow(st.greek ? 0xe4ecff : 0xfff0d8, 7), { parent: grp, shadow: false, seg: 12 });
      K.sphere(.6, hitMat, { parent: grp, shadow: false, seg: 8 });
      starObjs[st.name] = { core, ph: Math.random() * 9 };
      K.hot(grp, {
        name: st.name, zone: 'sky', click: g => {
          if (s.traced) { g.say(`${st.name}. 빛의 선이 고요히 이어져 있다.`); return; }
          if (picked.includes(st.name)) return;
          picked.push(st.name); g.sound.play('tick');
          if (picked.length === 5) {
            if (picked.join() === TRACE.join()) traced(g);
            else g.wait(.5).then(() => { g.sound.play('wrong'); g.say('별빛이 흩어졌다. 순서가 틀린 것 같다.'); picked.splice(0); });
          }
        }
      });
    }
    K.onUpdate((dt, t) => {
      starLayers[1].opacity = .8 + Math.sin(t * 2.3) * .2; starLayers[2].opacity = .85 + Math.sin(t * 3.1 + 1) * .15;
      for (const [nm, o] of Object.entries(starObjs)) {
        const sel = picked.includes(nm) || (s.traced && TRACE.includes(nm));
        o.core.scale.setScalar((sel ? 1.9 : 1) * (1 + Math.sin(t * 2.7 + o.ph) * .12));
      }
    });
    const linePts = W_LINE.map(nm => { const st = CAS.find(c => c.name === nm); return new THREE.Vector3(...skyPos(st.a, st.e)); });
    const lineMat = new THREE.LineBasicMaterial({ color: 0x9fc8ff, transparent: true, opacity: 0 });
    K.scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(linePts), lineMat));
    K.zone('sky', { pos: SKY_EYE, look: skyPos(0, 42, 10), fov: 46, range: .4 });

    // ---------- 빛 ----------
    K.scene.add(new THREE.HemisphereLight(0x8fa6d8, 0x2a1e14, 1.0));
    const pend = K.group({ at: [.7, 2.75, 1.1] });
    K.cyl(.005, .005, 3.1, iron, { parent: pend, at: [0, 1.6, 0] });
    K.lathe([[.0, .0], [.2, -.0], [.16, .08], [.05, .16], [0, .17]], MAT.plain(0x2a3a2a, .4, .5, { side: THREE.DoubleSide }), { parent: pend });
    K.sphere(.05, MAT.glow(0xffd7a0, 5), { parent: pend, at: [0, -.03, 0], shadow: false });
    K.point(0xffd7a0, 7, 11, { at: [.7, 2.65, 1.1], shadow: true });
    K.spot(0x9fb8ff, 7, 14, [0, 0, .4], { at: [0, 7.5, -6], angle: .3, penumbra: .9 }); // 달빛
    for (const a of [25, 155, 205, 335]) {
      const l = K.group({ ...onWall(a, 2.25, 3.42) });
      K.box(.1, .14, .06, iron, { parent: l });
      K.sphere(.045, MAT.glow(0xff2a14, 4), { parent: l, at: [0, -.02, .06], shadow: false });
    }
    K.point(0xff3a20, 1.6, 4, { at: polar(155, 3.1, 2.1) });
    K.point(0xff3a20, 1.6, 4, { at: polar(335, 3.1, 2.1) });

    // ---------- 가운데: 망원경 ----------
    K.cyl(1.25, 1.25, .012, MAT.fabric('#3a2030', 1, [3, 3]), { at: [-.3, .006, .3], seg: 48 });
    K.cyl(.22, .3, 1.0, MAT.concrete('#7a756d', [1, 1]), { at: [-.9, .5, .2] });
    K.cyl(.34, .36, .06, iron, { at: [-.9, .03, .2] });
    const piv = [-.9, 1.75, .2], tgt = [0, 6.5, -5];
    const yaw = Math.atan2(tgt[0] - piv[0], tgt[2] - piv[2]);
    const fork = K.group({ at: piv, rot: [0, yaw, 0] });
    K.box(.5, .08, .26, iron, { parent: fork, at: [0, -.5, 0] });
    for (const x of [-.22, .22]) { K.box(.05, .55, .14, iron, { parent: fork, at: [x, -.25, 0] }); K.cyl(.05, .05, .06, MAT.brass(), { parent: fork, at: [x * 1.2, 0, 0], rot: [0, 0, PI / 2] }); }
    K.cyl(.08, .14, .26, iron, { parent: fork, at: [0, -.66, 0] });
    const scope = K.group({ at: piv }); scope.lookAt(...tgt);
    const brassT = MAT.brass({ roughness: .33 });
    K.cyl(.15, .13, 2.0, brassT, { parent: scope, rot: [PI / 2, 0, 0], at: [0, 0, .2] });
    K.cyl(.175, .175, .42, MAT.plain(0x17181c, .5, .4), { parent: scope, rot: [PI / 2, 0, 0], at: [0, 0, 1.25] });
    K.cyl(.16, .16, .01, MAT.glass(0x6a8ad0, .55), { parent: scope, rot: [PI / 2, 0, 0], at: [0, 0, 1.2] });
    for (const z of [-.6, .1, .8, 1.04, 1.46]) K.torus(.155, .018, MAT.brass(), { parent: scope, at: [0, 0, z] });
    K.cyl(.12, .07, .14, brassT, { parent: scope, rot: [PI / 2, 0, 0], at: [0, 0, -.87] });
    K.cyl(.035, .035, .18, MAT.plain(0x222226, .4, .6), { parent: scope, rot: [PI / 2, 0, 0], at: [0, 0, -1.0] });
    K.cyl(.025, .025, .14, MAT.brass(), { parent: scope, rot: [0, 0, PI / 2], at: [0, -.06, -.95] });
    K.cyl(.035, .035, .5, MAT.plain(0x17181c, .4, .5), { parent: scope, rot: [PI / 2, 0, 0], at: [.17, .15, .3] }); // 보조 망원경
    for (const z of [.15, .45]) K.box(.03, .1, .03, MAT.brass(), { parent: scope, at: [.12, .1, z] });
    const eyeMesh = K.group({ parent: scope, at: [0, 0, -1.12], rot: [-PI / 2, 0, 0] }); eyepieceModel(K, eyeMesh); eyeMesh.visible = false;
    K.zone('scope', { pos: [-.1, 1.45, 1.9], look: [-.95, 1.35, .45], fov: 50 });
    K.hot(scope, {
      name: '망원경', goto: 'scope',
      click: g => { if (!s.scope) { g.sound.play('thud'); g.say('커다란 놋쇠 망원경. 눈을 댈 자리에 접안렌즈가 빠져 있다.'); return; } showScope(g); },
      use: { eyepiece: g => { g.take('eyepiece'); s.scope = true; eyeMesh.visible = true; g.sound.play('click'); g.wait(.5).then(() => showScope(g)); } },
    });
    K.hot(fork, { name: '망원경 받침', goto: 'scope', click: g => g.say('육중한 쇠 받침. 망원경은 북쪽 하늘을 겨누고 있다.') });

    // ---------- 동쪽: 태양계 모형 ----------
    const orr = K.group({ at: [2.3, 0, .2] });
    K.cyl(.55, .55, .05, wood, { parent: orr, at: [0, .78, 0], seg: 48 });
    K.cyl(.06, .09, .74, darkWood, { parent: orr, at: [0, .38, 0] });
    K.cyl(.3, .34, .04, darkWood, { parent: orr, at: [0, .02, 0] });
    K.cyl(.47, .48, .03, MAT.brass({ roughness: .4 }), { parent: orr, at: [0, .82, 0], seg: 48 });
    K.picture(.9, .9, (g, W, H) => {
      const c = W / 2; g.fillStyle = '#16203a'; g.beginPath(); g.arc(c, c, c - 6, 0, 7); g.fill();
      g.strokeStyle = 'rgba(230,200,120,.55)'; g.setLineDash([8, 8]); g.lineWidth = 3;
      for (const p of PLANETS) { g.beginPath(); g.arc(c, c, p.r / .45 * c, 0, 7); g.stroke(); }
      g.setLineDash([]); g.fillStyle = '#f2d48a'; g.font = "700 64px 'Noto Serif KR', serif"; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText('북', c, 46); g.fillText('남', c, W - 46); g.fillText('동', W - 46, c); g.fillText('서', 46, c);
    }, { parent: orr, at: [0, .837, 0], rot: [-PI / 2, 0, 0], transparent: true });
    K.cyl(.012, .012, .36, MAT.brass(), { parent: orr, at: [0, 1.0, 0] });
    const sunMat = MAT.glow(0xffa83a, 2.6, { side: THREE.DoubleSide });
    const hemi = top => new THREE.Mesh(new THREE.SphereGeometry(.075, 32, 16, 0, 2 * PI, top ? 0 : PI / 2, PI / 2), sunMat);
    const sunBot = K.place(hemi(false), { parent: orr, at: [0, 1.2, 0], shadow: false });
    const sunTop = K.place(hemi(true), { parent: orr, at: [0, 1.2, 0], shadow: false });
    K.torus(.076, .006, MAT.brass(), { parent: orr, at: [0, 1.2, 0], rot: [PI / 2, 0, 0] });
    K.point(0xffb050, .9, 1.6, { parent: orr, at: [0, 1.35, 0] });
    const eyeInSun = K.group({ parent: orr, at: [0, 1.19, 0], scale: .8 }); eyepieceModel(K, eyeInSun);
    s.orr = PLANETS.map(p => p.start);
    const turns = PLANETS.map(p => p.start), spinners = [];
    let moonPiv = null;
    PLANETS.forEach((p, i) => {
      const arm = K.group({ parent: orr, at: [0, p.y, 0], rot: [0, -p.start * PI / 2, 0] });
      K.torus(.018, .006, MAT.brass(), { parent: arm, rot: [PI / 2, 0, 0] });
      K.cyl(.004, .004, p.r, MAT.brass(), { parent: arm, rot: [PI / 2, 0, 0], at: [0, 0, -p.r / 2] });
      const up = 1.1 - p.y;
      K.cyl(.003, .003, up, MAT.brass(), { parent: arm, at: [0, up / 2, -p.r] });
      const pl = K.sphere(p.size, MAT.plain(p.color, .55, .1), { parent: arm, at: [0, up, -p.r] });
      spinners.push(pl);
      if (p.name === '지구') { moonPiv = K.group({ parent: arm, at: [0, up, -p.r] }); K.sphere(.01, MAT.plain(0xcfcfcf, .7), { parent: moonPiv, at: [.06, 0, 0] }); }
      K.sphere(.045, hitMat, { parent: arm, at: [0, up, -p.r], shadow: false, seg: 8 });
      K.hot(arm, {
        name: p.name, zone: 'orrery', click: g => {
          if (s.orrery) { g.say('행성들이 제자리에 멈춰 있다.'); return; }
          turns[i]++; s.orr[i] = (s.orr[i] + 1) % 4; g.sound.play('click');
          g.tween(arm.rotation, { y: -turns[i] * PI / 2 }, .45).then(() => checkOrr(g));
        }
      });
    });
    function checkOrr(g) {
      if (s.orrery || !PLANETS.every((p, i) => s.orr[i] === p.goal)) return;
      s.orrery = true; g.sound.play('unlock');
      g.tween(sunTop.position, { y: 1.34 }, 1.2); g.tween(sunTop.rotation, { x: -.6 }, 1.2);
      g.tween(eyeInSun.position, { y: 1.25 }, 1.2);
      g.say('딸깍. 태양이 반으로 갈라지며 열렸다!');
    }
    K.onUpdate((dt, t) => {
      spinners.forEach((m, i) => m.rotation.y += dt * (1 + i * .3));
      if (moonPiv) moonPiv.rotation.y += dt * 1.6;
      sunMat.emissiveIntensity = 2.4 + Math.sin(t * 2) * .3;
    });
    K.zone('orrery', { pos: [1.35, 1.7, .75], look: [2.3, .95, .2], fov: 46 });
    K.hot(orr, { name: '태양계 모형', goto: 'orrery', click: g => g.say('놋쇠로 만든 태양계 모형. 행성을 누르면 팔이 돌아간다.') });
    K.hot(eyeInSun, { name: '접안렌즈', zone: 'orrery', enabled: () => s.orrery && !s.eyepieceTaken, click: g => { s.eyepieceTaken = true; eyeInSun.visible = false; g.give('eyepiece'); } });

    // ---------- 서쪽: 책상 ----------
    const desk = K.group({ at: [-2.65, 0, -.2], rot: [0, PI / 2, 0] });
    K.rbox(1.5, .06, .7, .015, wood, { parent: desk, at: [0, .76, 0] });
    K.box(.45, .72, .64, wood, { parent: desk, at: [-.5, .36, 0] });
    K.box(.05, .72, .64, wood, { parent: desk, at: [.7, .36, 0] });
    K.box(1.4, .45, .02, wood, { parent: desk, at: [0, .5, -.3] });
    for (const y of [.15, .42, .62]) { K.box(.4, .18, .02, darkWood, { parent: desk, at: [-.5, y, .325] }); K.box(.08, .02, .02, MAT.brass(), { parent: desk, at: [-.5, y, .34] }); }
    // 램프
    const lamp = K.group({ parent: desk, at: [-.52, .79, -.18] });
    K.cyl(.08, .09, .03, MAT.brass(), { parent: lamp });
    K.cyl(.01, .01, .32, MAT.brass(), { parent: lamp, at: [0, .17, 0] });
    K.cyl(.05, .13, .1, MAT.plain(0x1d5a34, .25, .2, { side: THREE.DoubleSide, emissive: 0x0a3a1a, emissiveIntensity: .6 }), { parent: lamp, at: [0, .34, .05], rot: [.3, 0, 0], open: true });
    K.sphere(.03, MAT.glow(0xffd28a, 5), { parent: lamp, at: [0, .31, .06], shadow: false });
    K.point(0xffc27a, .5, 4.5, { parent: lamp, at: [0, .27, .1], shadow: true, res: 512 });
    // 관측 일지
    K.box(.52, .025, .36, MAT.leather('#3a1c12'), { parent: desk, at: [.08, .8, .06] });
    const log = K.picture(.5, .34, (g, W, H) => {
      g.fillStyle = '#efe2c2'; g.fillRect(0, 0, W, H); g.fillStyle = 'rgba(80,50,20,.25)'; g.fillRect(W / 2 - 2, 0, 4, H);
      g.strokeStyle = 'rgba(60,80,140,.25)'; g.lineWidth = 1; for (let y = 40; y < H; y += 22) { g.beginPath(); g.moveTo(14, y); g.lineTo(W / 2 - 14, y); g.stroke(); }
      g.fillStyle = '#2b2116'; g.font = "700 26px 'Noto Serif KR', serif"; g.textAlign = 'left';
      ['관측 일지', '10월 3일, 맑음', '행성들의 자리 →', '모형도 똑같이.'].forEach((l, i) => g.fillText(l, 22, 46 + i * 44));
      drawOrbit(g, W * .75, H / 2 + 8, H * .36);
    }, { parent: desk, at: [.08, .814, .06], rot: [-PI / 2, 0, 0], res: 512 });
    K.hot(log, { name: '관측 일지', zone: 'desk', click: g => g.note('관측 일지', `<div style="text-align:center">10월 3일, 맑음</div>${orbitSVG()}오늘 밤 행성들은 이 자리에 섰다.\n태양계 모형도 똑같이 맞춰 둘 것.\n태양은 제자리를 찾은 행성들에게만 속을 연다.\n\n<i>추신. 눈대(접안렌즈)를 또 잃어버리지 말 것.\n별자리를 찾으면 성도를 펴 볼 것.</i>`) });
    const chartLMesh = K.group({ parent: desk, at: [.5, .794, .14], rot: [-PI / 2, 0, -.25] });
    chartHalf(K, chartLMesh, 0);
    K.hot(chartLMesh, { name: '찢어진 성도', zone: 'desk', click: g => { chartLMesh.visible = false; g.give('chartL'); g.say('별 지도의 반쪽이다. 가운데가 거칠게 찢겨 있다.'); } });
    // 천구의
    const globe = K.group({ parent: desk, at: [-.12, .79, -.2] });
    K.cyl(.05, .07, .03, darkWood, { parent: globe });
    K.cyl(.008, .008, .12, MAT.brass(), { parent: globe, at: [0, .07, 0] });
    const gTex = K.canvasTexture(256, 128, (g, W, H) => {
      g.fillStyle = '#1a2a5a'; g.fillRect(0, 0, W, H); g.strokeStyle = 'rgba(230,200,120,.5)';
      for (let x = 0; x < W; x += 32) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); }
      for (let y = 0; y < H; y += 21) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
      const r = K.rng(5); g.fillStyle = '#f2e2b0'; for (let i = 0; i < 90; i++) g.fillRect(r() * W, r() * H, 2, 2);
    });
    const gSph = K.sphere(.11, new THREE.MeshStandardMaterial({ map: gTex, roughness: .4 }), { parent: globe, at: [0, .2, 0] });
    K.torus(.12, .006, MAT.brass(), { parent: globe, at: [0, .2, 0], rot: [0, 0, .4] });
    K.onUpdate(dt => gSph.rotation.y += dt * .15);
    K.hot(globe, { name: '천구의', zone: 'desk', click: g => g.say('하늘을 공처럼 그린 천구의. 천천히 돌고 있다.') });
    K.cyl(.04, .035, .09, MAT.plain(0x6a2a1a, .4), { parent: desk, at: [.62, .835, -.2] });
    K.cyl(.006, .006, .16, MAT.plain(0xc89b4a, .5), { parent: desk, at: [.3, .797, -.15], rot: [0, .4, PI / 2] });
    K.chair(MAT.wood('#3b2312'), { parent: desk, at: [.1, 0, .75], rot: [0, PI + .3, 0] });
    K.zone('desk', { pos: [-1.35, 1.55, -.2], look: [-2.65, .8, -.2], fov: 50 });

    // ---------- 남서: 성도함 ----------
    const cab = K.group({ ...onWall(230, 0, 3.05) });
    K.box(1.1, .95, .6, wood, { parent: cab, at: [0, .475, 0] });
    K.box(1.16, .04, .64, darkWood, { parent: cab, at: [0, .97, 0] });
    for (const y of [.14, .32, .5, .68]) { K.box(1.02, .15, .02, darkWood, { parent: cab, at: [0, y, .305] }); K.box(.16, .025, .02, MAT.brass(), { parent: cab, at: [0, y, .32] }); }
    const drawer = K.group({ parent: cab, at: [0, .86, .3] });
    K.box(1.02, .15, .02, darkWood, { parent: drawer, at: [0, 0, .005] });
    K.box(.98, .02, .56, wood, { parent: drawer, at: [0, -.06, -.28] });
    K.rbox(.2, .07, .03, .01, MAT.brass(), { parent: drawer, at: [0, 0, .025] });
    for (const x of [-.06, 0, .06]) K.cyl(.022, .022, .04, MAT.plain(0x2a2116, .4, .6), { parent: drawer, at: [x, 0, .045], rot: [0, 0, PI / 2] });
    const chartRMesh = K.group({ parent: drawer, at: [.1, -.045, -.25], rot: [-PI / 2, 0, .3] });
    chartHalf(K, chartRMesh, 1); chartRMesh.visible = false;
    K.zone('cabinet', { pos: polar(230, 1.75, 1.55), look: polar(230, 3.0, .8), fov: 48 });
    K.hot(cab, {
      name: '성도함', goto: 'cabinet', click: g => {
        if (s.cabinet) return;
        g.lock({ title: '성도함 글자 자물쇠', text: '놋쇠 바퀴 세 개에 알파벳이 새겨져 있다.', type: 'letters', answer: 'CAS', onSolve: g => { s.cabinet = true; g.sound.play('open'); chartRMesh.visible = true; g.tween(drawer.position, { z: .62 }, .8); g.say('서랍이 스르르 열렸다. 찢어진 종이가 보인다.'); } });
      }
    });
    K.hot(chartRMesh, { name: '성도 반쪽', zone: 'cabinet', enabled: () => s.cabinet && !s.gotR, click: g => { s.gotR = true; chartRMesh.visible = false; g.give('chartR'); } });

    // ---------- 벽: 약어표, 연표, 빛 글씨 ----------
    const abbr = K.frame(1.0, 1.2, drawAbbr, { ...onWall(300, 1.6, 3.38), frameMat: darkWood, border: .04, res: 768 });
    K.zone('abbr', { pos: polar(300, 1.4, 1.6), look: polar(300, 3.4, 1.6), fov: 50 });
    K.hot(abbr, { name: '별자리 약어표', goto: 'abbr', click: g => g.note('별자리 약어표', '<table><tr><th>모양</th><th>별자리</th><th>약어</th></tr><tr><td>국자 (별 7개)</td><td>큰곰자리</td><td>UMA</td></tr><tr><td>모래시계 + 띠 3개</td><td>오리온자리</td><td>ORI</td></tr><tr><td>십자가</td><td>백조자리</td><td>CYG</td></tr><tr><td>W (별 5개)</td><td>카시오페이아자리</td><td>CAS</td></tr><tr><td>밝은 별 + 작은 마름모</td><td>거문고자리</td><td>LYR</td></tr></table>') });
    const tl = K.frame(1.1, 1.3, drawTimeline, { ...onWall(60, 1.6, 3.36), frameMat: darkWood, border: .04, res: 768 });
    K.zone('timeline', { pos: polar(60, 1.4, 1.6), look: polar(60, 3.4, 1.6), fov: 50 });
    K.hot(tl, { name: '천문 연표', goto: 'timeline', click: g => g.note('천문 연표', '<table><tr><td><b>1054</b></td><td>황소자리에 「손님 별」. 낮에도 보였다.</td></tr><tr><td><b>1572</b></td><td>티코 브라헤가 본 카시오페이아자리의 새 별</td></tr><tr><td><b>1604</b></td><td>케플러가 본 뱀주인자리의 새 별</td></tr><tr><td><b>1610</b></td><td>갈릴레이, 목성의 달 넷을 찾다</td></tr><tr><td><b>1781</b></td><td>허셜, 천왕성을 찾다</td></tr></table>') });
    const msg = K.text(['카시오페이아에', '새 별이 뜬 해가', '돔 문을 연다'], 1.5, .85, { ...onWall(0, 1.95, 3.33), bg: null, color: '#dbe9ff', emissive: 1.6, glow: '#6fa8ff', size: .22 });
    msg.material.opacity = 0;
    K.zone('msg', { pos: [0, 1.6, -1.2], look: [0, 1.95, -3.4], fov: 50 });
    K.hot(msg, { name: '빛나는 글씨', goto: 'msg', enabled: () => s.traced, click: g => g.note('벽에 떠오른 빛 글씨', '<div class="big">카시오페이아에\n새 별이 뜬 해가\n돔 문을 연다</div>') });
    // 꾸밈 그림 두 장
    K.frame(.6, .6, (g, W, H) => { // 별자리 원판
      g.fillStyle = '#0f1a33'; g.fillRect(0, 0, W, H); const c = W / 2;
      g.strokeStyle = '#c8a45a'; g.lineWidth = 6; g.beginPath(); g.arc(c, c, c - 20, 0, 7); g.stroke();
      g.lineWidth = 1.5; for (let i = 0; i < 24; i++) { const a = i / 24 * PI * 2; g.beginPath(); g.moveTo(c + Math.cos(a) * (c - 20), c + Math.sin(a) * (c - 20)); g.lineTo(c + Math.cos(a) * (c - 44), c + Math.sin(a) * (c - 44)); g.stroke(); }
      const r = K.rng(12); g.fillStyle = '#f4ecd0'; for (let i = 0; i < 120; i++) { const a = r() * 7, d = r() * (c - 50); g.beginPath(); g.arc(c + Math.cos(a) * d, c + Math.sin(a) * d, r() * 2.5 + .5, 0, 7); g.fill(); }
    }, { ...onWall(-22, 1.5, 3.4), frameMat: MAT.brass({ roughness: .5 }), border: .03 });
    K.frame(.5, .62, (g, W, H) => { // 달 사진
      g.fillStyle = '#0a0a0c'; g.fillRect(0, 0, W, H); const r = K.rng(6);
      g.fillStyle = '#d8d4c8'; g.beginPath(); g.arc(W / 2, H / 2, W * .36, 0, 7); g.fill();
      for (let i = 0; i < 30; i++) { g.fillStyle = `rgba(90,88,80,${.15 + r() * .3})`; g.beginPath(); g.arc(W / 2 + (r() - .5) * W * .5, H / 2 + (r() - .5) * W * .5, 3 + r() * 16, 0, 7); g.fill(); }
      g.fillStyle = 'rgba(0,0,0,.65)'; g.beginPath(); g.arc(W / 2 + W * .16, H / 2, W * .36, -PI / 2, PI / 2); g.fill();
    }, { ...onWall(22, 1.5, 3.4), frameMat: darkWood, border: .03 });

    // ---------- 남동: 책장, 사다리 ----------
    const shelf = K.shelf(1.2, 2.0, .34, wood, 4, { ...onWall(130, 0, 3.12) });
    const rb = K.rng(17), cols = [0x5a2a1a, 0x2a3a5a, 0x3b2a4a, 0x6b4a2a, 0x1f2f3f, 0x7a5a3a];
    for (let row = 0; row < 4; row++) { let x = -.56; while (x < .5) { const bw = .035 + rb() * .04, bh = .26 + rb() * .1; K.book(bw, bh, .22, cols[Math.floor(rb() * cols.length)], { parent: shelf, at: [x + bw / 2, shelf.rowY(row) + bh / 2, .02] }); x += bw + .004; } }
    K.hot(shelf, { name: '책장', click: g => g.say('『별의 목록』, 『행성의 운행』… 두꺼운 천문학 책들이다.') });
    const ladder = K.group({ at: polar(-40, 3.0, 0), rot: [0, 40 * PI / 180, 0] });
    for (const x of [-.22, .22]) K.box(.05, 2.6, .05, wood, { parent: ladder, at: [x, 1.25, .1], rot: [-.22, 0, 0] });
    for (let i = 0; i < 8; i++) K.cyl(.015, .015, .44, wood, { parent: ladder, at: [0, .2 + i * .3, .1 - (i * .3 - 1.05) * .223], rot: [0, 0, PI / 2] });
    K.hot(ladder, { name: '사다리', click: g => g.say('돔 틈을 여닫을 때 쓰는 사다리다. 지금은 올라갈 필요가 없다.') });

    // ---------- 남쪽: 돔 문 ----------
    const door = K.door({ w: 1.0, h: 2.1, mat: MAT.metal('#4a5260', { rough: .5 }), frameMat: iron, at: [0, 0, 3.36], rot: [0, PI, 0] });
    K.plane(1.0, 2.1, MAT.glow(0x1a2238, .5), { at: [0, 1.05, 3.45], rot: [0, PI, 0] });
    const dial = K.group({ at: [.62, 1.2, 3.27], rot: [0, PI, 0] });
    K.rbox(.16, .26, .05, .01, MAT.brass({ roughness: .4 }), { parent: dial });
    for (let i = 0; i < 4; i++) K.cyl(.018, .018, .1, MAT.plain(0x221a10, .5, .5), { parent: dial, at: [0, .08 - i * .055, .03], rot: [0, 0, PI / 2] });
    const doorLamp = K.sphere(.016, MAT.glow(0x333333, .2), { parent: dial, at: [0, .14, .03], shadow: false });
    K.zone('door', { pos: [0, 1.6, 1.7], look: [.2, 1.3, 3.4], fov: 52 });
    K.point(0xffd7a0, 6, 4, { at: [.2, 1.9, 2.8] }); // 문 쪽이 너무 어두워 보조 조명
    K.hot(door.pivot, {
      name: '돔 문', goto: 'door', click: g => {
        if (!s.traced) { g.sound.play('thud'); g.say('네 자리 숫자 다이얼이 꽉 얼어붙어 있다. 위의 작은 등도 꺼져 있다.'); return; }
        g.lock({ title: '돔 문 다이얼', text: '네 자리 숫자.', type: 'digits', answer: '1572', onSolve: async g => { s.door = true; g.sound.play('open'); await g.tween(door.pivot.rotation, { y: 1.4 * door.openSign }, 1.6); g.win(); } });
      }
    });
    K.hot(dial, { name: '문 다이얼', goto: 'door', click: g => g.say(s.traced ? '작은 등이 파랗게 켜졌다. 이제 다이얼이 돌아간다.' : '다이얼이 얼어붙은 듯 움직이지 않는다.') });

    K.dust(220, [6, 2.6, 6], { opacity: .22, color: 0xcfdcff });

    function traced(g) {
      s.traced = true; g.sound.play('magic');
      g.tween(lineMat, { opacity: .9 }, 1.5);
      g.tween(msg.material, { opacity: 1 }, 2.5);
      g.tween(ringGlow.material, { emissiveIntensity: 3 }, 2);
      doorLamp.material = MAT.glow(0x6fb0ff, 5);
      g.say('별들이 빛의 선으로 이어졌다. 북쪽 벽에 글씨가 떠오르고, 돔 링이 빠르게 돈다…', 5);
    }
  },
};

// ---------- 도우미 ----------
function skyPos(a, e, dist = 22) {
  const er = e * PI / 180, ur = (a / Math.cos(er)) * PI / 180;
  return [SKY_EYE[0] + Math.sin(ur) * Math.cos(er) * dist, SKY_EYE[1] + Math.sin(er) * dist, SKY_EYE[2] - Math.cos(ur) * Math.cos(er) * dist];
}
const lcg = seed => () => (seed = (seed * 16807) % 2147483647) / 2147483647;

// 행성 배치도 (캔버스)
function drawOrbit(g, cx, cy, rad) {
  g.fillStyle = '#e8a83a'; g.beginPath(); g.arc(cx, cy, rad * .12, 0, 7); g.fill();
  PLANETS.forEach((p, i) => {
    const rr = rad * (.3 + i * .2), a = p.goal * PI / 2;
    g.strokeStyle = 'rgba(80,60,30,.6)'; g.setLineDash([4, 4]); g.lineWidth = 1.5; g.beginPath(); g.arc(cx, cy, rr, 0, 7); g.stroke(); g.setLineDash([]);
    g.fillStyle = p.css; g.beginPath(); g.arc(cx + Math.sin(a) * rr, cy - Math.cos(a) * rr, rad * .07, 0, 7); g.fill();
  });
  g.fillStyle = '#2b2116'; g.font = `700 ${Math.round(rad * .16)}px 'Noto Serif KR', serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText('북', cx, cy - rad * 1.08);
}
// 행성 배치도 (쪽지용 SVG)
function orbitSVG() {
  const c = 120, names = ['수성', '금성', '지구', '화성'];
  let s = `<svg viewBox="0 0 240 240" width="250" height="250" style="display:block;margin:4px auto"><circle cx="${c}" cy="${c}" r="12" fill="#e8a83a"/>`;
  PLANETS.forEach((p, i) => {
    const r = 30 + i * 22, a = p.goal * PI / 2, x = c + Math.sin(a) * r, y = c - Math.cos(a) * r;
    s += `<circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="#7a6038" stroke-dasharray="3 3"/><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="7" fill="${p.css}" stroke="#2b2116"/><text x="${x.toFixed(1)}" y="${(y - 11).toFixed(1)}" font-size="12" font-weight="700" text-anchor="middle" fill="#2b2116">${names[i]}</text>`;
  });
  s += `<g font-size="15" font-weight="700" fill="#7a2a14" text-anchor="middle"><text x="${c}" y="14">북</text><text x="${c}" y="236">남</text><text x="232" y="${c + 5}">동</text><text x="9" y="${c + 5}">서</text></g></svg>`;
  return s;
}
// 온전한 성도 (SVG)
function chartSVG() {
  const r = lcg(11);
  let s = '<svg viewBox="0 0 420 360" width="100%" style="max-width:420px;display:block;margin:0 auto;background:#14213a;border-radius:6px">';
  for (let i = 0; i < 80; i++) s += `<circle cx="${(r() * 420).toFixed(1)}" cy="${(r() * 360).toFixed(1)}" r="${(r() * 1.2 + .3).toFixed(1)}" fill="#c9d6ff" opacity="${(r() * .5 + .2).toFixed(2)}"/>`;
  s += '<path d="M212 0 L205 40 L215 80 L206 130 L217 180 L205 230 L214 280 L207 330 L211 360" stroke="#efe4c8" stroke-width="2" fill="none" stroke-dasharray="5 4" opacity=".5"/>';
  const ud = [[30, 90], [70, 80], [104, 95], [134, 118], [140, 160], [186, 168], [180, 124]];
  s += `<polyline points="${ud.map(p => p.join(',')).join(' ')} 134,118" fill="none" stroke="#8fb0e8" stroke-width="1.5" opacity=".7"/>`;
  ud.forEach(p => s += `<circle cx="${p[0]}" cy="${p[1]}" r="4" fill="#fff"/>`);
  s += '<text x="40" y="210" fill="#e9d9a8" font-size="15">큰곰자리 UMA</text>';
  const P = st => [300 + st.a * 14, 30 + (60 - st.e) * 9.5];
  s += `<polyline points="${W_LINE.map(nm => P(CAS.find(c => c.name === nm)).join(',')).join(' ')}" fill="none" stroke="#8fb0e8" stroke-width="1.5" opacity=".7"/>`;
  CAS.forEach(st => { const [x, y] = P(st); s += `<circle cx="${x}" cy="${y}" r="5.5" fill="#fff"/><text x="${x + 11}" y="${y + 6}" fill="#ffd98a" font-size="20" font-weight="700">${st.greek}</text>`; });
  s += '<text x="250" y="352" fill="#e9d9a8" font-size="15">카시오페이아자리 CAS</text><text x="410" y="22" fill="#e9d9a8" font-size="13" text-anchor="end">↑ 하늘 꼭대기</text></svg>';
  return s;
}
function showChart(g) {
  g.note('온전한 성도', `${chartSVG()}<div style="text-align:center">돔 틈으로 본 북쪽 하늘.\n<b>망원경이 겨눈 별자리를\nα → β → γ → δ → ε 차례로 짚을 것.</b></div>`);
}
function showScope(g) {
  const r = lcg(5);
  let s = '<svg viewBox="0 0 300 300" width="270" height="270" style="display:block;margin:0 auto"><defs><radialGradient id="sv"><stop offset="0" stop-color="#0d1a38"/><stop offset=".85" stop-color="#050914"/><stop offset="1" stop-color="#000"/></radialGradient></defs><rect width="300" height="300" fill="#000"/><circle cx="150" cy="150" r="140" fill="url(#sv)"/>';
  for (let i = 0; i < 60; i++) { const a = r() * 7, d = r() * 130; s += `<circle cx="${(150 + Math.cos(a) * d).toFixed(1)}" cy="${(150 + Math.sin(a) * d).toFixed(1)}" r="${(r() + .3).toFixed(1)}" fill="#cfe0ff" opacity="${(r() * .6 + .2).toFixed(2)}"/>`; }
  for (const [x, y] of [[62, 112], [106, 172], [150, 126], [194, 178], [238, 120]]) s += `<circle cx="${x}" cy="${y}" r="13" fill="#9fc0ff" opacity=".25"/><circle cx="${x}" cy="${y}" r="5" fill="#fff"/>`;
  s += '<line x1="150" y1="12" x2="150" y2="288" stroke="#3a6a4a" stroke-width=".7"/><line x1="12" y1="150" x2="288" y2="150" stroke="#3a6a4a" stroke-width=".7"/></svg>';
  g.note('망원경 속', `${s}<div style="text-align:center">렌즈 너머로 밝은 별 다섯 개.\n가지런한 <b>W</b> 모양이다.</div>`, 'screen');
}
// 성도 반쪽 모형 (가방·책상용)
function chartHalf(K, g, side, dx = 0) {
  const m = K.picture(.22, .32, (c, W, H) => {
    c.fillStyle = '#e6d6b0'; c.fillRect(0, 0, W, H);
    c.fillStyle = '#18264a'; c.fillRect(8, 8, W - 16, H - 16);
    const r = lcg(side ? 7 : 3); c.fillStyle = '#dfe8ff';
    for (let i = 0; i < 60; i++) { c.beginPath(); c.arc(r() * W, r() * H, r() * 2 + .5, 0, 7); c.fill(); }
    c.strokeStyle = 'rgba(160,190,240,.7)'; c.lineWidth = 2; c.beginPath();
    if (side) { c.moveTo(W * .4, H * .2); c.lineTo(W * .7, H * .35); c.lineTo(W * .45, H * .5); c.lineTo(W * .72, H * .65); c.lineTo(W * .5, H * .8); }
    else { c.moveTo(W * .1, H * .3); c.lineTo(W * .35, H * .27); c.lineTo(W * .55, H * .35); c.lineTo(W * .7, H * .45); c.lineTo(W * .8, H * .6); }
    c.stroke();
    // 찢긴 쪽 가장자리
    c.globalCompositeOperation = 'destination-out'; c.beginPath();
    const ex = side ? 0 : W; c.moveTo(ex, 0);
    for (let y = 0; y <= H; y += 14) c.lineTo(side ? 6 + r() * 14 : W - 6 - r() * 14, y);
    c.lineTo(ex, H); c.fill(); c.globalCompositeOperation = 'source-over';
  }, { parent: g, at: [dx, 0, 0], transparent: true, res: 256 });
  m.material.side = K.THREE.DoubleSide;
  return m;
}
function eyepieceModel(K, g) {
  K.cyl(.03, .03, .09, K.MAT.plain(0x111114, .4, .3), { parent: g });
  K.cyl(.036, .036, .02, K.MAT.brass(), { parent: g, at: [0, .04, 0] });
  K.cyl(.022, .022, .05, K.MAT.brass(), { parent: g, at: [0, -.065, 0] });
  K.cyl(.027, .027, .004, K.MAT.glass(0x88aaff, .6), { parent: g, at: [0, .052, 0] });
}
// 별자리 약어표
function drawAbbr(g, W, H) {
  g.fillStyle = '#e9dcbc'; g.fillRect(0, 0, W, H);
  g.fillStyle = '#2b2116'; g.font = "700 60px 'Noto Serif KR', serif"; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText('별자리 약어표', W / 2, 62);
  g.strokeStyle = '#6a5030'; g.lineWidth = 3; g.beginPath(); g.moveTo(40, 108); g.lineTo(W - 40, 108); g.stroke();
  const rows = [
    ['UMA', '큰곰', [[0, .3], [.2, .25], [.38, .35], [.55, .45], [.6, .75], [.95, .8], [.9, .48]], [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 3]]],
    ['ORI', '오리온', [[.15, .05], [.85, .1], [.4, .5], [.5, .48], [.6, .46], [.2, .95], [.8, .9]], [[0, 2], [1, 4], [2, 3], [3, 4], [2, 5], [4, 6]]],
    ['CYG', '백조', [[.5, .02], [.5, .4], [.5, .98], [.08, .32], [.92, .48]], [[0, 1], [1, 2], [3, 1], [1, 4]]],
    ['CAS', '카시오페이아', [[0, .15], [.25, .85], [.5, .3], [.75, .9], [1, .1]], [[0, 1], [1, 2], [2, 3], [3, 4]]],
    ['LYR', '거문고', [[.2, .05], [.45, .35], [.75, .4], [.55, .95], [.85, 1]], [[1, 2], [2, 4], [4, 3], [3, 1], [0, 1]]],
  ];
  const top = 130, rh = (H - top - 20) / rows.length;
  rows.forEach(([code, nm, pts, lines], i) => {
    const y0 = top + i * rh, bx = 60, bw = 220, bh = rh - 40;
    g.fillStyle = '#18264a'; g.fillRect(bx - 16, y0 + 8, bw + 32, rh - 16);
    const P = p => [bx + p[0] * bw, y0 + 20 + p[1] * bh];
    g.strokeStyle = '#9fc0f0'; g.lineWidth = 3;
    for (const [a, b] of lines) { g.beginPath(); g.moveTo(...P(pts[a])); g.lineTo(...P(pts[b])); g.stroke(); }
    g.fillStyle = '#fff'; for (const p of pts) { g.beginPath(); g.arc(...P(p), 8, 0, 7); g.fill(); }
    g.fillStyle = '#7a2a14'; g.font = "800 84px 'Noto Serif KR', serif"; g.textAlign = 'left'; g.fillText(code, 340, y0 + rh / 2 - 12);
    g.fillStyle = '#2b2116'; g.font = "700 34px 'Noto Serif KR', serif"; g.fillText(nm + '자리', 344, y0 + rh / 2 + 46);
  });
}
// 천문 연표
function drawTimeline(g, W, H) {
  g.fillStyle = '#ece0c0'; g.fillRect(0, 0, W, H);
  const gr = g.createRadialGradient(W / 2, H / 2, W * .2, W / 2, H / 2, W * .8); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(110,75,30,.35)'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  g.fillStyle = '#2b2116'; g.font = "700 62px 'Noto Serif KR', serif"; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText('천문 연표', W / 2, 66);
  const rows = [['1054', '황소자리에 「손님 별」', '낮에도 보였다'], ['1572', '티코 브라헤가 본', '카시오페이아의 새 별'], ['1604', '케플러가 본', '뱀주인자리의 새 별'], ['1610', '갈릴레이,', '목성의 달 넷'], ['1781', '허셜,', '천왕성 발견']];
  const top = 130, rh = (H - top - 20) / rows.length;
  rows.forEach(([y, a, b], i) => {
    const y0 = top + i * rh;
    g.strokeStyle = 'rgba(90,60,30,.4)'; g.lineWidth = 2; g.beginPath(); g.moveTo(30, y0); g.lineTo(W - 30, y0); g.stroke();
    g.textAlign = 'left'; g.fillStyle = '#7a2a14'; g.font = "800 66px 'Noto Serif KR', serif"; g.fillText(y, 34, y0 + rh / 2);
    g.fillStyle = '#2b2116'; g.font = "700 36px 'Noto Serif KR', serif"; g.fillText(a, 240, y0 + rh / 2 - 24); g.fillText(b, 240, y0 + rh / 2 + 24);
  });
}

export const solution = [
  { hot: '관측 일지' },
  { hot: '찢어진 성도' },
  { hot: '수성' },
  { hot: '금성' }, { hot: '금성' },
  { hot: '지구' }, { hot: '지구' },
  { hot: '화성' }, { hot: '화성' }, { hot: '화성', wait: 1.5 },
  { hot: '접안렌즈' },
  { hot: '망원경', item: 'eyepiece', wait: 1.2 },
  { hot: '별자리 약어표' },
  { hot: '성도함', lock: 'CAS' },
  { hot: '성도 반쪽' },
  { combine: ['chartL', 'chartR'] },
  { hot: '쉐다르' }, { hot: '카프' }, { hot: '나비' }, { hot: '루크바' }, { hot: '세긴', wait: 1.5 },
  { hot: '빛나는 글씨' },
  { hot: '천문 연표' },
  { hot: '돔 문', lock: '1572', wait: 3 },
];
