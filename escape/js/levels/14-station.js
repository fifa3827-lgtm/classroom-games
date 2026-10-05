// 14단계: 궤도 정거장
// 흐름: 떠다니는 드라이버 → 배전반 덮개 열기 → 정비 수칙대로 케이블 꽂기(초록1 파랑2 빨강3 노랑4) → 전원
//       관제 화면 일지(암호 = 임무 날짜 × 16) + 임무 계기판(128일째) → 보급 보관함 키패드 2048 → 산소통
//       벽의 우주 헬멧 + 산소통 = 산소를 채운 헬멧 / 수면칸 그물 주머니 → 승무원증(뒷면: 패치의 별, 작은 것부터)
//       에어록 제어판: 승무원증 → 색 자물쇠(초록·빨강·파랑·노랑) / 산소 헬멧 → 해치 열림
//       에어록 안: 안쪽 문 닫기 → 감압 → 바깥 문 열기 → 탈출
const C = { red: '#e53935', yel: '#fdd835', grn: '#43a047', blu: '#1e88e5', wht: '#f5f5f5', org: '#fb8c00' };
const STAR_ORDER = [C.grn, C.red, C.blu, C.yel];

export default {
  title: '궤도 정거장',
  intro: '삐— 삐— 경보음에 눈을 떴다.\n붉은 비상등, 둥둥 떠다니는 물건들. 창밖에는 지구가 돈다.\n\n정거장의 궤도가 떨어지고 있다.\n모두 귀환선으로 떠났고, 나만 남았다.\n<i>에어록을 지나 귀환선으로 가야 한다.</i>',
  outro: '바깥 문이 열리고, 귀환선의 불빛이 손짓한다.\n등 뒤로 푸른 지구가 천천히 돈다.\n\n귀환선이 정거장을 떠나 대기권으로 떨어진다.\n불꽃 속에서 눈을 감았다 뜨니… 째깍, 째깍.\n어디선가 커다란 시계 소리가 들린다.',
  env: .35, exposure: 1.0, bloom: .55, bg: 0x000000,
  start: { pos: [0, 1.6, .4], look: [0, 1.5, -3] },

  items: {
    driver: { name: '육각 드라이버', desc: '공중에 떠다니던 공구. 끝이 육각이다.\n육각 나사로 잠긴 덮개를 열 수 있겠다.', model: driverModel, iconRot: [.3, .2, .9] },
    o2: { name: '산소통', desc: '휴대용 산소통. 「우주복 헬멧 연결용」이라고 적혀 있다.', model: tankModel },
    helmet: { name: '우주 헬멧', desc: '선외 활동용 헬멧. 뒤쪽 산소 연결구가 비어 있다.', model: (K, g) => helmetModel(K, g, false), iconRot: [.2, -.5, 0] },
    o2helmet: { name: '산소를 채운 헬멧', desc: '산소통을 연결했다. 계기에 초록불이 켜졌다.\n이제 진공 속에서도 숨을 쉴 수 있다.', model: (K, g) => helmetModel(K, g, true), iconRot: [.2, -.5, 0] },
    idCard: { name: '승무원증', desc: '앞면: 「정거장 한별 · 선장 한서윤」\n뒷면 손글씨: <b>「비상 색 암호 — 내 임무 패치의 별, 작은 별부터 차례로.」</b>', model: cardModel, iconRot: [.3, -.3, 0] },
  },
  combos: [['helmet', 'o2', 'o2helmet']],

  hints: [
    { when: (s, g) => !g.has('driver') && !s.cover, text: ['떠다니는 물건들을 잘 보세요. 쓸 만한 공구가 있어요.', '공중에 주황색 손잡이 공구가 떠 있어요.', '떠다니는 드라이버를 눌러 잡으세요. 왼쪽 벽 배전반에 쓸 거예요.'] },
    { when: s => !s.cover, text: ['육각 나사로 잠긴 덮개가 있어요.', '왼쪽 벽의 「배전반」 덮개예요.', '드라이버를 고르고 배전반 덮개를 누르세요.'] },
    { when: s => !s.power, text: ['배전반 안쪽의 정비 수칙 카드를 읽어 보세요.', '초록은 1번. 파랑은 1·4번이 안 되니 2나 3. 노랑은 빨강 바로 다음 번호예요. 파랑이 3이면 빨강·노랑이 붙어 있을 자리가 없어요.', '초록 1, 파랑 2, 빨강 3, 노랑 4. 케이블 끝을 누를 때마다 다음 번호 칸으로 옮겨져요.'] },
    { when: s => !s.locker, text: ['전원이 들어왔어요. 오른쪽 벽 관제 화면을 읽어 보세요.', '보관함 암호 = 임무 날짜 수 × 16. 날짜는 화면 위 계기판에 있어요.', '128 × 16 = 2048. 보급 보관함 키패드에 2048.'] },
    { when: (s, g) => !g.has('o2helmet') && !s.suit, text: ['산소통만으로는 숨을 쉴 수 없어요. 함께 쓸 것이 필요해요.', '에어록 가까운 오른쪽 벽에 헬멧이 걸려 있어요.', '가방에서 우주 헬멧과 산소통을 차례로 눌러 조합하세요.'] },
    { when: s => !s.card, text: ['에어록을 열려면 승무원 권한이 필요해요.', '선장은 승무원증을 수면칸에 두고 왔대요.', '왼쪽 벽 수면칸의 그물 주머니를 누르세요.'] },
    { when: s => !s.auth, text: ['승무원증 뒷면을 읽어 보세요. (가방에서 고르고 「살펴보기」)', '수면칸의 임무 패치에 크기가 다른 별 넷이 있어요. 작은 것부터.', '초록 → 빨강 → 파랑 → 노랑. 승무원증을 에어록 제어판에 쓰세요.'] },
    { when: s => !s.suit, text: ['에어록 밖은 진공이에요. 숨 쉴 준비가 필요해요.', '산소를 채운 헬멧을 에어록 제어판에 쓰세요.'] },
    { when: (s, g) => g.zone !== 'airlock', text: ['해치가 열렸어요. 에어록 안으로 들어가세요.'] },
    { text: ['에어록 안의 안전 수칙 판을 읽어 보세요.', '감압은 안쪽 문이 닫혀야 되고, 바깥 문은 감압이 끝나야 열려요.', '안쪽 문 닫기 → 감압 → 바깥 문 열기.'] },
  ],

  build(K) {
    const { THREE, MAT, s } = K;
    const W = 5, D = 7, H = 3;
    const wallMat = MAT.tiles('#eceef1', '#e0e3e7', 2, [1, 1], { rough: .45, bump: .6 });
    const room = K.room({ w: W, d: D, h: H, floor: MAT.tiles('#8e959c', '#7f868e', 4, [1, 1], { rough: .5 }), wall: wallMat, ceil: MAT.tiles('#e3e6ea', '#d4d8dd', 2, [1, 1], { rough: .5 }) });
    room.remove(room.getObjectByName('wall_n'));   // 창을 내려고 북쪽 벽은 직접 만든다
    const panel = (w, h, at, ry = 0, ox = 0, oy = 0) => {
      const m = wallMat.clone();
      for (const k of ['map', 'bumpMap']) { m[k] = wallMat[k].clone(); m[k].repeat.set(w / 2, h / 2); m[k].offset.set(ox / 2, oy / 2); m[k].needsUpdate = true; }
      return K.plane(w, h, m, { at, rot: [0, ry, 0] });
    };
    panel(1.1, H, [-1.95, H / 2, -D / 2], 0, 0, 0);
    panel(1.1, H, [1.95, H / 2, -D / 2], 0, 3.9, 0);
    panel(2.8, .75, [0, .375, -D / 2], 0, 1.1, 0);
    panel(2.8, .65, [0, 2.675, -D / 2], 0, 1.1, 2.35);

    const metal = MAT.metal('#c4c9cf', { rough: .4 }), darkM = MAT.plain(0x2b3036, .55, .4), white = MAT.plain(0xeef0f2, .4, .05);
    const railMat = MAT.plain(0x3d6fb8, .45, .2);
    const rail = (len, at, axis) => {
      const g = K.group({ at });
      K.cyl(.018, .018, len, railMat, { parent: g, rot: axis === 'x' ? [0, 0, Math.PI / 2] : axis === 'z' ? [Math.PI / 2, 0, 0] : [0, 0, 0] });
      for (const t of [-.45, .45]) { const p = axis === 'x' ? [t * len, 0, 0] : axis === 'z' ? [0, 0, t * len] : [0, t * len, 0]; K.sphere(.028, metal, { parent: g, at: p }); }
      return g;
    };

    // ---------- 빛 ----------
    K.scene.add(new THREE.HemisphereLight(0xdfe8ff, 0x4a505c, .95));
    K.spot(0xa8ccff, 7, 13, [0, .4, 1.5], { at: [.4, 2.1, -4.6], angle: .8, penumbra: .7, shadow: true });
    const mainA = K.point(0xf2f6ff, 0, 9, { at: [0, 2.6, -1.4], shadow: true });
    const mainB = K.point(0xf2f6ff, 0, 8, { at: [0, 2.6, 1.2] });
    const alarm = K.point(0xff3020, 4, 9, { at: [0, 2.5, 0] });
    const stripMat = MAT.glow(0xeaf4ff, .12);
    for (const x of [-1.0, 1.0]) K.box(.12, .03, 4.6, stripMat, { at: [x, 2.975, -.9], shadow: false });
    const alarmMat = MAT.glow(0xff2a2a, 3);
    for (const [x, z] of [[-2.3, -3.3], [2.3, -3.3], [-2.3, 1.85], [2.3, 1.85]]) K.box(.16, .06, .06, alarmMat, { at: [x, 2.9, z], shadow: false });
    K.onUpdate((dt, t) => {
      if (!s.power) { const k = .5 + Math.sin(t * 3) * .5; alarm.intensity = 2 + k * 4; alarmMat.emissiveIntensity = 1 + k * 3; }
    });

    // ---------- 북쪽: 큰 창, 지구, 별 ----------
    const wz = -D / 2 - .15;
    K.box(3.0, .14, .32, metal, { at: [0, .68, wz] });
    K.box(3.0, .14, .32, metal, { at: [0, 2.42, wz] });
    K.box(.14, 1.74, .32, metal, { at: [-1.47, 1.55, wz] });
    K.box(.14, 1.74, .32, metal, { at: [1.47, 1.55, wz] });
    for (const [x, y] of [[-1.38, .82], [1.38, .82], [-1.38, 2.28], [1.38, 2.28], [0, .82], [0, 2.28]]) K.cyl(.025, .025, .03, MAT.silver(), { at: [x, y, -3.48], rot: [Math.PI / 2, 0, 0] });
    const glass = K.plane(2.8, 1.6, MAT.glass(0x9fc4ff, .07), { at: [0, 1.55, -3.7] }); glass.userData.noRay = true;
    K.box(2.9, .02, .02, MAT.glow(0x6fb6ff, 1.2), { at: [0, .76, -3.47], shadow: false });
    rail(2.6, [0, .5, -3.38], 'x');
    K.text(['정거장 「한별」 · 관측창'], 1.4, .14, { at: [0, 2.7, -3.48], bg: '#1c2a3a', color: '#cfe3ff', size: .55, font: "'Noto Sans KR', sans-serif" });
    // 지구
    const earth = K.group({ at: [1.6, -5.6, -17] }); earth.userData.noRay = true;
    const R = 7.2, ctex = c => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.RepeatWrapping; t.anisotropy = 4; return t; };
    const planet = K.place(new THREE.Mesh(new THREE.SphereGeometry(R, 72, 48), new THREE.MeshBasicMaterial({ map: ctex(earthCanvas(K)) })), { parent: earth, shadow: false });
    const clouds = K.place(new THREE.Mesh(new THREE.SphereGeometry(R * 1.012, 72, 48), new THREE.MeshBasicMaterial({ map: ctex(cloudCanvas(K)), transparent: true, depthWrite: false })), { parent: earth, shadow: false });
    K.place(new THREE.Mesh(new THREE.SphereGeometry(R * 1.022, 72, 32), new THREE.MeshBasicMaterial({ map: ctex(nightCanvas()), transparent: true, depthWrite: false })), { parent: earth, shadow: false });
    for (const [k, o] of [[1.035, .55], [1.08, .2]]) K.place(new THREE.Mesh(new THREE.SphereGeometry(R * k, 64, 32), new THREE.MeshBasicMaterial({ color: 0x5cb4ff, transparent: true, opacity: o, side: THREE.BackSide, blending: THREE.AdditiveBlending, depthWrite: false })), { parent: earth, shadow: false });
    planet.rotation.y = 1.2; clouds.rotation.y = 1.2;
    K.onUpdate(dt => { planet.rotation.y += dt * .012; clouds.rotation.y += dt * .017; });
    // 별
    const sp = [], rs = K.rng(9);
    for (let i = 0; i < 2200; i++) {
      const th = rs() * Math.PI * 2, ph = Math.acos(2 * rs() - 1), x = Math.sin(ph) * Math.cos(th), y = Math.cos(ph), z = Math.sin(ph) * Math.sin(th);
      if (z > -.25) continue; sp.push(x * 90, y * 90, z * 90);
    }
    const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
    const stars = new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xffffff, size: .38, depthWrite: false, transparent: true, opacity: .95 }));
    stars.userData.noRay = true; K.scene.add(stars);
    // 해
    const sunTex = K.canvasTexture(256, 256, (g, w) => { const gr = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2); gr.addColorStop(0, 'rgba(255,255,250,1)'); gr.addColorStop(.12, 'rgba(255,245,220,.9)'); gr.addColorStop(.4, 'rgba(255,210,150,.18)'); gr.addColorStop(1, 'rgba(255,200,150,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, w); });
    const sun = K.plane(16, 16, new THREE.MeshBasicMaterial({ map: sunTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }), { at: [-20, 10, -70], rot: [0, .25, 0] }); sun.userData.noRay = true;
    // 태양 전지판
    const arr = K.group({ at: [-4.6, 3.0, -10.5], rot: [-.15, .2, 0] }); arr.userData.noRay = true;
    K.box(6.4, .1, .1, MAT.metal('#8a9097'), { parent: arr, shadow: false });
    for (const y of [.8, -.8]) K.picture(6, 1.4, (g, w, h) => {
      g.fillStyle = '#0e1d4a'; g.fillRect(0, 0, w, h); g.strokeStyle = '#4a6fb0'; g.lineWidth = 2;
      for (let x = 0; x <= w; x += w / 24) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
      for (let yy = 0; yy <= h; yy += h / 4) { g.beginPath(); g.moveTo(0, yy); g.lineTo(w, yy); g.stroke(); }
      g.strokeStyle = '#c9a44a'; g.lineWidth = 6; g.strokeRect(2, 2, w - 4, h - 4);
    }, { parent: arr, at: [0, y, 0], emissive: .35 });

    // ---------- 떠다니는 물건 ----------
    const floaters = [];
    const float = (o, spin, amp = .07) => { floaters.push({ o, base: o.position.clone(), ph: Math.random() * 9, spin, amp }); return o; };
    const drv = K.group({ at: [-.7, 1.95, -1.0], rot: [.4, .3, 1.1] }); driverModel(K, drv); drv.scale.setScalar(1.6);
    float(drv, [.15, .25, .1]);
    K.hot(drv, { name: '떠다니는 드라이버', click: g => { drv.visible = false; g.unhot(drv); g.give('driver'); } });
    const apple = K.group({ at: [.8, 2.2, -.5] }); K.sphere(.045, MAT.plain(0xb3201c, .35), { parent: apple, scale: [1, .9, 1] }); K.cyl(.004, .004, .03, MAT.plain(0x4a3020), { parent: apple, at: [0, .05, 0] });
    float(apple, [.2, .1, .3]); K.hot(apple, { name: '떠다니는 사과', click: g => g.say('누군가 먹다 남긴 사과가 둥둥 떠 있다. 지금은 배고플 틈이 없다.') });
    const pen = K.cyl(.006, .006, .14, MAT.plain(0x1d3f8a, .4), { at: [.25, 1.3, -2.2], rot: [1, .4, .3] }); float(pen, [.4, .1, .5], .05);
    const blob = K.sphere(.05, MAT.glass(0xcfe8ff, .45), { at: [-.3, 2.35, .2], scale: [1, .9, 1.05] }); float(blob, [.05, .3, .05], .09);
    const book = K.book(.14, .2, .03, 0x2a6a4a, { at: [1.15, 1.7, .9], rot: [.6, .8, .2] }); float(book, [.08, .15, .05]);
    const spoon = K.group({ at: [-1.3, 2.4, .1], rot: [.2, .5, 1.2] }); K.cyl(.004, .004, .12, MAT.silver(), { parent: spoon }); K.sphere(.016, MAT.silver(), { parent: spoon, at: [0, .065, 0], scale: [1, .4, 1.4] }); float(spoon, [.3, .2, .1]);
    K.onUpdate((dt, t) => {
      for (const f of floaters) {
        f.o.position.set(f.base.x + Math.sin(t * .23 + f.ph) * f.amp * 1.5, f.base.y + Math.sin(t * .37 + f.ph * 2) * f.amp, f.base.z + Math.cos(t * .19 + f.ph) * f.amp * 1.5);
        f.o.rotation.x += f.spin[0] * dt; f.o.rotation.y += f.spin[1] * dt; f.o.rotation.z += f.spin[2] * dt;
      }
    });

    // ---------- 천장과 바닥 소품 ----------
    for (const x of [-.75, .75]) rail(4.4, [x, 2.88, -.9], 'z');
    for (const x of [-2.1, 2.1]) K.cyl(.05, .05, 5.4, MAT.plain(0x6a7078, .6, .3), { at: [x, 2.92, -.8], rot: [Math.PI / 2, 0, 0] });
    for (const z of [-2.6, .3]) K.picture(.6, .4, (g, w, h) => { g.fillStyle = '#b9bfc6'; g.fillRect(0, 0, w, h); g.fillStyle = '#5a6168'; for (let y = 10; y < h - 6; y += 14) g.fillRect(14, y, w - 28, 6); }, { at: [0, 2.985, z], rot: [Math.PI / 2, 0, 0] });
    const bagMat = MAT.fabric('#d9d3c3', 0, [1, 1]);
    for (const [x, y, z, w, h, d] of [[-2.25, .2, -2.8, .4, .4, .5], [-2.25, .58, -2.75, .38, .34, .45], [2.25, .2, 1.4, .4, .4, .4], [-2.25, .22, 1.75, .42, .44, .4]]) {
      const b = K.rbox(w, h, d, .05, bagMat, { at: [x, y, z] });
      K.box(w + .01, .03, d + .01, MAT.plain(0x2a4a7a, .8), { parent: b });
    }

    // ---------- 서쪽: 배전반 ----------
    const pp = K.group({ at: [-W / 2, 0, -1.4], rot: [0, Math.PI / 2, 0] });
    const PY = 1.45;
    K.box(.9, .8, .02, darkM, { parent: pp, at: [0, PY, .01] });
    for (const [x, y, w, h] of [[-.46, PY, .04, .86], [.46, PY, .04, .86], [0, PY + .42, .96, .04], [0, PY - .42, .96, .04]]) K.box(w, h, .13, metal, { parent: pp, at: [x, y, .065] });
    K.text(['⚡ 배전반'], .5, .1, { parent: pp, at: [0, PY + .5, .01], bg: '#ffd34d', color: '#1a1a1a', size: .7, font: "'Noto Sans KR', sans-serif" });
    rail(1.2, [-2.42, .8, -1.4], 'z');
    // 수칙 카드
    const rule = K.text(['정비 수칙 · 전원 재연결', '① 초록 선은 1번 칸', '② 파란 선은 1·4번 칸 금지', '③ 노란 선은 빨간 선 바로 다음 칸'], .82, .25, { parent: pp, at: [0, PY + .26, .025], bg: '#f4f1e6', color: '#1a1a1a', size: .14, font: "'Noto Sans KR', sans-serif" });
    K.hot(rule, { name: '정비 수칙 카드', zone: 'power', enabled: () => s.cover, click: g => g.note('정비 수칙 — 전원 재연결', '케이블 넷을 번호 칸 1~4에 하나씩.\n\n① 초록 선은 1번 칸.\n② 파란 선은 양 끝 칸(1번·4번)에 꽂지 않는다.\n③ 노란 선은 빨간 선 바로 다음 번호 칸.\n\n<i>모두 맞게 꽂으면 전원이 돌아온다.</i>') });
    // 위쪽 모선과 소켓
    K.box(.82, .05, .04, MAT.plain(0x444a52, .5, .5), { parent: pp, at: [0, PY + .09, .04] });
    const SX = [-.3, -.1, .1, .3], SY = PY - .26;
    SX.forEach((x, i) => {
      K.cyl(.035, .035, .03, MAT.plain(0x111316, .5, .3), { parent: pp, at: [x, SY, .03], rot: [Math.PI / 2, 0, 0] });
      K.torus(.036, .006, MAT.silver(), { parent: pp, at: [x, SY, .045] });
      K.text([String(i + 1)], .07, .07, { parent: pp, at: [x, SY - .1, .025], bg: '#2b3036', color: '#ffffff', size: .8, font: "'Noto Sans KR', sans-serif" });
    });
    const spark = K.sphere(.04, MAT.glow(0xbfe0ff, 8), { parent: pp, at: [0, SY + .05, .1], shadow: false }); spark.visible = false; spark.userData.noRay = true;
    // 케이블: 위쪽 순서는 노랑, 파랑, 빨강, 초록
    const cables = [
      { label: '노란 케이블', col: 0xf2c718, ox: -.3, want: 4 },
      { label: '파란 케이블', col: 0x1e6fd0, ox: -.1, want: 2 },
      { label: '빨간 케이블', col: 0xd6281e, ox: .1, want: 3 },
      { label: '초록 케이블', col: 0x2f9a3a, ox: .3, want: 1 },
    ];
    const UP = new THREE.Vector3(0, 1, 0), tmp = new THREE.Vector3();
    cables.forEach((c, i) => {
      const m = MAT.plain(c.col, .45, .1);
      K.box(.05, .05, .05, m, { parent: pp, at: [c.ox, PY + .06, .06] });
      c.a = new THREE.Vector3(c.ox, PY + .04, .06);
      c.wire = K.cyl(.011, .011, 1, m, { parent: pp }); c.wire.userData.noRay = true;
      c.plug = K.group({ parent: pp, at: [c.ox + (i % 2 ? .03 : -.03), PY - .05, .095] });
      K.rbox(.055, .09, .055, .01, m, { parent: c.plug });
      K.box(.03, .03, .03, MAT.silver(), { parent: c.plug, at: [0, -.055, 0] });
      c.slot = 0;
      K.hot(c.plug, {
        name: c.label, zone: 'power', enabled: () => s.cover, click: g => {
          if (s.power) { g.say('전원이 잘 들어오고 있다. 건드리지 말자.'); return; }
          c.slot = c.slot % 4 + 1; g.sound.play('click');
          g.tween(c.plug.position, { x: SX[c.slot - 1], y: SY + .07, z: .07 + i * .004 }, .25);
          if (cables.every(q => q.slot === q.want)) g.wait(.35).then(() => powerOn(g));
          else if (cables.every(q => q.slot > 0)) g.wait(.3).then(() => {
            if (s.power) return;
            g.sound.play('wrong'); spark.visible = true; setTimeout(() => spark.visible = false, 140);
            g.say('지직! 불꽃이 튄다. 수칙과 맞지 않는 것 같다.');
          });
        }
      });
    });
    K.onUpdate(() => {
      for (const c of cables) {
        tmp.copy(c.plug.position); tmp.y += .045;
        const len = tmp.distanceTo(c.a);
        c.wire.position.copy(tmp).add(c.a).multiplyScalar(.5);
        c.wire.scale.set(1, Math.max(.01, len), 1);
        c.wire.quaternion.setFromUnitVectors(UP, tmp.sub(c.a).normalize());
      }
    });
    // 덮개
    const cover = K.group({ parent: pp, at: [-.48, PY, .135] });
    K.box(.96, .86, .02, MAT.metal('#d3d7dc', { rough: .45 }), { parent: cover, at: [.48, 0, 0] });
    K.text(['배전반', '정비 때만 열 것'], .5, .2, { parent: cover, at: [.48, .15, .011], bg: '#d3d7dc', color: '#b8231a', size: .26, font: "'Noto Sans KR', sans-serif" });
    for (const [x, y] of [[.06, .38], [.9, .38], [.06, -.38], [.9, -.38]]) K.cyl(.018, .018, .012, MAT.silver(), { parent: cover, at: [x, y, .015], rot: [Math.PI / 2, 0, 0], seg: 6 });
    K.zone('power', { pos: [-1.25, 1.5, -1.4], look: [-2.5, 1.42, -1.4], fov: 60, range: .45 });
    K.hot(cover, {
      name: '배전반 덮개', zone: 'power', click: g => g.say('육각 나사 네 개로 잠긴 덮개. 「정비 때만 열 것」.'),
      use: {
        driver: async g => {
          s.cover = true; g.take('driver'); g.unhot(cover);
          for (let i = 0; i < 4; i++) { g.sound.play('tick'); await g.wait(.15); }
          g.sound.play('open'); await g.tween(cover.rotation, { y: -1.9 }, .8);
          g.say('덮개가 열렸다. 끊어진 케이블 넷과 번호 칸, 수칙 카드가 보인다.');
        }
      }
    });
    function powerOn(g) {
      if (s.power) return;
      s.power = true; g.sound.play('switch');
      alarm.intensity = 0; alarmMat.emissiveIntensity = .15;
      g.tween(mainA, { intensity: 7 }, 1.5); g.tween(mainB, { intensity: 5 }, 1.5); g.tween(stripMat, { emissiveIntensity: 2.4 }, 1.5);
      offs.forEach((o, i) => setTimeout(() => o.visible = false, 300 + i * 220));
      btnMats.forEach(m => g.tween(m, { emissiveIntensity: 1.8 }, 1));
      redrawStat();
      g.say('웅— 정거장에 전원이 돌아왔다! 화면들이 하나씩 켜진다.');
    }

    // ---------- 서쪽: 수면칸 ----------
    const pod = K.group({ at: [-W / 2, 0, .75], rot: [0, Math.PI / 2, 0] });
    K.box(1.1, 2.0, .02, MAT.fabric('#d8d2c4', 0, [2, 3]), { parent: pod, at: [0, 1.2, .02] });
    for (const x of [-.575, .575]) K.box(.05, 2.1, .45, metal, { parent: pod, at: [x, 1.2, .22] });
    for (const y of [.15, 2.25]) K.box(1.2, .05, .45, metal, { parent: pod, at: [0, y, .22] });
    K.rbox(.55, 1.45, .16, .07, MAT.fabric('#2f5d8a', 0, [1, 2]), { parent: pod, at: [.2, 1.05, .11] });
    for (const y of [.6, 1.1, 1.55]) K.box(.6, .04, .05, MAT.plain(0x222222, .8), { parent: pod, at: [.2, y, .2] });
    K.sphere(.11, MAT.fabric('#e8e4da', 0, [1, 1]), { parent: pod, at: [.2, 1.82, .12], scale: [1.4, .8, .6] });
    K.box(.12, .05, .04, MAT.glow(0xffe0a0, 2), { parent: pod, at: [.4, 2.15, .05], shadow: false });
    K.point(0xffe0b0, 1.2, 2.2, { parent: pod, at: [.3, 2.0, .3] });
    const patchTex = (g, w) => drawPatch(g, w);
    const patch = K.picture(.42, .42, patchTex, { parent: pod, at: [-.27, 1.78, .035], transparent: true });
    const patchURL = (() => { const c = document.createElement('canvas'); c.width = c.height = 300; drawPatch(c.getContext('2d'), 300); return c.toDataURL(); })();
    K.hot(patch, { name: '임무 패치', zone: 'pod', click: g => g.note('임무 패치', `<img src="${patchURL}" style="width:240px;display:block;margin:0 auto">\n제7 원정대의 임무 패치. 크기가 다른 별 넷이 수놓여 있다.`) });
    const photo = K.picture(.16, .12, (g, w, h) => {
      const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#9cc8ee'); gr.addColorStop(1, '#6a9a5a'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
      g.fillStyle = '#3a2a20'; for (const [x, r] of [[.3, .09], [.5, .11], [.7, .07]]) { g.beginPath(); g.arc(w * x, h * .45, h * r, 0, 7); g.fill(); g.fillRect(w * x - h * r, h * .55, h * r * 2, h * .45); }
      g.strokeStyle = '#fff'; g.lineWidth = 10; g.strokeRect(0, 0, w, h);
    }, { parent: pod, at: [-.27, 1.4, .035] });
    K.hot(photo, { name: '가족사진', zone: 'pod', click: g => g.say('벨크로로 붙인 가족사진. 뒤에 「곧 돌아갈게」라고 적혀 있다.') });
    const pocket = K.group({ parent: pod, at: [-.27, 1.0, .05] });
    const cardIn = K.group({ parent: pocket, at: [0, .04, -.01] }); cardModel(K, cardIn);
    K.picture(.3, .24, (g, w, h) => { g.strokeStyle = 'rgba(30,30,30,.9)'; g.lineWidth = 3; for (let i = -h; i < w; i += 16) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + h, h); g.stroke(); g.beginPath(); g.moveTo(i + h, 0); g.lineTo(i, h); g.stroke(); } g.fillStyle = '#2a2a2a'; g.fillRect(0, 0, w, 10); }, { parent: pocket, transparent: true });
    K.hot(pocket, {
      name: '수면칸 그물 주머니', zone: 'pod', click: g => {
        if (s.card) { g.say('주머니는 비어 있다.'); return; }
        s.card = true; cardIn.visible = false; g.give('idCard');
        g.note('승무원증', '<b>앞면</b>\n정거장 「한별」 · 선장 한서윤\n\n<b>뒷면 (손글씨)</b>\n「비상 색 암호 —\n 내 임무 패치의 별,\n 작은 별부터 차례로.」');
      }
    });
    K.zone('pod', { pos: [-1.2, 1.5, .75], look: [-2.5, 1.4, .75], fov: 55, range: .5 });
    K.hot(pod, { name: '수면칸', goto: 'pod', click: g => g.say('벽에 붙은 작은 수면칸. 침낭이 벽에 묶여 있다.') });

    // ---------- 동쪽: 관제 콘솔과 계기판 ----------
    const cs = K.group({ at: [W / 2, 0, -1.4], rot: [0, -Math.PI / 2, 0] });
    K.rbox(1.7, .85, .55, .03, MAT.metal('#d9dde2', { rough: .5 }), { parent: cs, at: [0, .425, .28] });
    K.box(1.6, .04, .42, darkM, { parent: cs, at: [0, .9, .3], rot: [.35, 0, 0] });
    const btnMats = [];
    const br = K.rng(3);
    for (let i = 0; i < 14; i++) {
      const m = MAT.glow([0x3cff8a, 0xffb02a, 0x4ab0ff, 0xff4a4a][i % 4], .1); btnMats.push(m);
      K.box(.05, .02, .04, m, { parent: cs, at: [-.65 + (i % 7) * .2 + br() * .04, .93 - Math.floor(i / 7) * .06, .22 + Math.floor(i / 7) * .14], rot: [.35, 0, 0], shadow: false });
    }
    const offs = [];
    const screen = (parent, w, h, at, ry, draw) => {
      const g = K.group({ parent, at, rot: [0, ry, 0] });
      K.rbox(w + .07, h + .07, .04, .012, MAT.plain(0x1c2026, .4, .4), { parent: g, at: [0, 0, -.02] });
      K.picture(w, h, draw, { parent: g, at: [0, 0, .002], emissive: 1.1, res: 768 });
      const off = K.plane(w, h, MAT.plain(0x05070a, .2, .3), { parent: g, at: [0, 0, .006] }); offs.push(off);
      return g;
    };
    const scan = (g, w, h) => { g.fillStyle = 'rgba(93,255,156,.06)'; for (let y = 0; y < h; y += 4) g.fillRect(0, y, w, 1); };
    const console_ = K.group({ parent: cs });
    screen(console_, 1.0, .58, [0, 1.42, .05], 0, (g, w, h) => {
      g.fillStyle = '#03110a'; g.fillRect(0, 0, w, h); g.fillStyle = '#5dff9c'; g.font = `700 ${h * .09}px 'Noto Sans KR'`; g.textAlign = 'left'; g.textBaseline = 'middle';
      ['▶ 승무원 일지', '   · 보관함 암호 규칙', '   · 정비 수칙 위치', '   · 마지막 기록'].forEach((t, i) => g.fillText(t, w * .06, h * (.18 + i * .16)));
      g.fillStyle = '#ff5a5a'; g.fillText('⚠ 궤도 이탈 경보', w * .06, h * .84); scan(g, w, h);
    });
    screen(console_, .5, .36, [-.82, 1.38, .1], .3, (g, w, h) => {
      g.fillStyle = '#04101c'; g.fillRect(0, 0, w, h); g.strokeStyle = '#2a5a8a'; g.lineWidth = 1;
      for (let x = 0; x < w; x += w / 12) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
      for (let y = 0; y < h; y += h / 6) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
      g.strokeStyle = '#ffd34d'; g.lineWidth = 4; g.beginPath(); for (let x = 0; x <= w; x += 4) { const y = h / 2 - Math.sin(x / w * Math.PI * 2) * h * .3; x ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
      g.fillStyle = '#ff5a5a'; g.beginPath(); g.arc(w * .62, h / 2 - Math.sin(.62 * Math.PI * 2) * h * .3, 9, 0, 7); g.fill();
      g.fillStyle = '#9fd0ff'; g.font = `700 ${h * .1}px 'Noto Sans KR'`; g.fillText('궤도 위치', 12, h * .12);
    });
    screen(console_, .5, .36, [.82, 1.38, .1], -.3, (g, w, h) => {
      g.fillStyle = '#140606'; g.fillRect(0, 0, w, h); g.fillStyle = '#ffb0a0'; g.font = `700 ${h * .1}px 'Noto Sans KR'`; g.fillText('고도 변화', 12, h * .12);
      g.strokeStyle = '#ff5a4a'; g.lineWidth = 4; g.beginPath(); for (let x = 0; x <= w; x += 4) { const y = h * .25 + Math.pow(x / w, 2.2) * h * .6; x ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
    });
    const disp = K.group({ parent: cs, at: [0, 2.2, .03] });
    K.rbox(1.18, .44, .04, .012, MAT.plain(0x1c2026, .4, .4), { parent: disp, at: [0, -.06, -.02] });
    K.text(['임무 128일째'], 1.1, .24, { parent: disp, at: [0, 0, .002], bg: '#03110a', color: '#6dffa8', emissive: 1.5, size: .62, font: "'Noto Sans KR', sans-serif" });
    K.text(['고도 408 km · 속도 7.7 km/s'], 1.1, .12, { parent: disp, at: [0, -.19, .002], bg: '#03110a', color: '#58c3ff', emissive: 1.2, size: .5, font: "'Noto Sans KR', sans-serif" });
    offs.push(K.plane(1.1, .24, MAT.plain(0x05070a, .2, .3), { parent: disp, at: [0, 0, .006] }));
    offs.push(K.plane(1.1, .12, MAT.plain(0x05070a, .2, .3), { parent: disp, at: [0, -.19, .006] }));
    K.zone('console', { pos: [1.0, 1.6, -1.4], look: [2.5, 1.65, -1.4], fov: 58, range: .5 });
    K.hot(console_, {
      name: '관제 화면', goto: 'console', click: g => {
        if (!s.power) { g.say('화면이 모두 꺼져 있다. 전원이 필요하다.'); return; }
        g.note('관제 화면 — 승무원 일지', '<b>승무원 일지 · 정거장 「한별」</b>\n\n■ 태양 전지판 정비 끝. 창밖의 지구는 오늘도 파랗다.\n■ 정비 수칙을 배전반 덮개 안쪽에 붙여 두었다.\n■ 보급 보관함 암호를 바꿨다. 잊지 않게 규칙으로 정했다.\n   <b>암호 = 임무 날짜 수 × 하루에 지구를 도는 바퀴 수</b>\n   우리 정거장은 하루에 지구를 꼭 16바퀴 돈다.\n   날짜는 화면 위 계기판에 늘 떠 있다.\n■ 궤도가 떨어지기 시작했다. 모두 귀환선으로.\n   …승무원증을 수면칸에 두고 왔다.\n\n<span style="color:#ff6b6b">⚠ 고도 경보: 정거장 궤도 이탈 중</span>', 'screen');
      }
    });
    K.hot(disp, {
      name: '임무 계기판', goto: 'console', click: g => {
        if (!s.power) { g.say('계기판이 꺼져 있다.'); return; }
        g.note('임무 계기판', '<div class="big">임무 128일째</div>\n고도 408 km · 속도 7.7 km/s', 'screen');
      }
    });
    K.hot(cs, { name: '관제 콘솔', goto: 'console', click: g => g.say(s.power ? '버튼들이 반짝인다. 위쪽 화면을 보자.' : '콘솔이 죽은 듯 조용하다.') });
    // 식물 실험 상자
    const plant = K.group({ at: [W / 2 - .3, 1.1, -2.9], rot: [0, -Math.PI / 2, 0] });
    K.rbox(.6, .4, .4, .02, white, { parent: plant });
    K.box(.52, .3, .01, MAT.glass(0xffffff, .2), { parent: plant, at: [0, 0, .2] });
    K.box(.5, .02, .3, MAT.glow(0xc070ff, 2.5), { parent: plant, at: [0, .17, 0], shadow: false });
    for (let i = 0; i < 5; i++) K.sphere(.05, MAT.plain(0x4fae3a, .7), { parent: plant, at: [-.2 + i * .1, -.1 + (i % 2) * .04, 0], scale: [1, 1.3, 1] });
    K.point(0xc070ff, 1.5, 2, { parent: plant, at: [0, 0, .4] });
    K.hot(plant, { name: '식물 실험 상자', click: g => g.say('무중력에서 키우는 상추. 잎이 제멋대로 뻗었다.') });
    rail(1.4, [2.42, 2.65, -1.4], 'z');

    // ---------- 동쪽: 보급 보관함 ----------
    const lk = K.group({ at: [W / 2, 0, .55], rot: [0, -Math.PI / 2, 0] });
    const lkM = MAT.metal('#cfd4da', { rough: .5 });
    K.box(1.0, 1.9, .03, MAT.plain(0x8a9097, .6, .3), { parent: lk, at: [0, .95, .015] });
    for (const x of [-.485, .485]) K.box(.03, 1.9, .5, lkM, { parent: lk, at: [x, .95, .25] });
    for (const y of [.015, .95, 1.885]) K.box(1.0, .03, .5, lkM, { parent: lk, at: [0, y, .25] });
    const tank = K.group({ parent: lk, at: [-.2, .965, .25] }); tankModel(K, tank);
    tank.scale.setScalar(1.6);
    for (const [x, y, c] of [[.15, .97, 0xc94a2a], [.3, .97, 0x2a8ac9], [-.2, .03, 0xd9b43a], [.15, .03, 0x6a9a3a]]) K.rbox(.2, .25, .3, .03, MAT.plain(c, .7), { parent: lk, at: [x, y + .14, .22] });
    const ldoor = K.group({ parent: lk, at: [-.5, 0, .51] });
    K.rbox(1.0, 1.9, .035, .01, lkM, { parent: ldoor, at: [.5, .95, 0] });
    K.text(['보급품'], .4, .12, { parent: ldoor, at: [.5, 1.6, .02], bg: '#1c2a3a', color: '#ffffff', size: .7, font: "'Noto Sans KR', sans-serif" });
    K.picture(.16, .22, (g, w, h) => {
      g.fillStyle = '#20252b'; g.fillRect(0, 0, w, h); g.fillStyle = '#cfd6de'; g.font = `700 ${w * .14}px 'Noto Sans KR'`; g.textAlign = 'center'; g.textBaseline = 'middle';
      ['1', '2', '3', '4', '5', '6', '7', '8', '9', '⟲', '0', '✓'].forEach((k, i) => { const x = w * (.22 + (i % 3) * .28), y = h * (.2 + Math.floor(i / 3) * .2); g.fillStyle = '#3a414a'; g.fillRect(x - w * .11, y - h * .07, w * .22, h * .14); g.fillStyle = '#e8eef4'; g.fillText(k, x, y); });
    }, { parent: ldoor, at: [.84, 1.05, .02] });
    const ledMat = MAT.glow(0xff3a2a, 2.5);
    K.sphere(.015, ledMat, { parent: ldoor, at: [.84, 1.21, .02], shadow: false });
    K.zone('locker', { pos: [1.05, 1.45, .55], look: [2.5, 1.1, .55], fov: 63, range: .5 });
    K.hot(lk, {
      name: '보급 보관함', goto: 'locker', click: g => {
        if (s.locker) { g.say('보관함은 열려 있다.'); return; }
        if (!s.power) { g.say('키패드 화면이 꺼져 있다. 전원이 없다.'); return; }
        g.lock({
          title: '보급 보관함 키패드', text: '네 자리 암호를 누르세요.', type: 'pad', answer: '2048', onSolve: g => {
            s.locker = true; g.sound.play('open'); ledMat.color.set(0x3cff6a); ledMat.emissive.set(0x3cff6a);
            g.tween(ldoor.rotation, { y: -1.9 }, 1); g.say('삑! 보관함이 열렸다. 안에 산소통이 있다.');
          }
        });
      }
    });
    K.hot(tank, { name: '산소통', zone: 'locker', enabled: () => s.locker, click: g => { tank.visible = false; g.give('o2'); } });
    // 헬멧 걸이
    K.box(.06, .06, .2, metal, { at: [W / 2 - .1, 1.78, 1.55] });
    const helm = K.group({ at: [W / 2 - .26, 1.6, 1.55], rot: [0, -Math.PI / 2, 0] }); helmetModel(K, helm, false); helm.scale.setScalar(1.15);
    K.hot(helm, { name: '우주 헬멧', click: g => { helm.visible = false; g.give('helmet'); g.say('「우주 헬멧」을 얻었다. 산소 연결구가 비어 있다.'); } });
    rail(.8, [2.42, 1.0, 1.55], 'z');

    // ---------- 남쪽: 칸막이와 에어록 ----------
    const PZ = 2.0;
    panel(2.0, H, [-1.5, H / 2, PZ], Math.PI);
    panel(2.0, H, [1.5, H / 2, PZ], Math.PI);
    panel(1.0, .95, [0, 2.525, PZ], Math.PI);
    panel(1.0, .35, [0, .175, PZ], Math.PI);
    for (const [x, y, w, h] of [[-.56, 1.2, .12, 1.82], [.56, 1.2, .12, 1.82], [0, 2.11, 1.24, .12], [0, .29, 1.24, .12]]) K.box(w, h, .2, metal, { at: [x, y, PZ] });
    K.picture(1.24, .08, (g, w, h) => { g.fillStyle = '#ffd200'; g.fillRect(0, 0, w, h); g.fillStyle = '#111'; for (let x = -h; x < w; x += h * 2) { g.beginPath(); g.moveTo(x, h); g.lineTo(x + h, 0); g.lineTo(x + h * 2, 0); g.lineTo(x + h, h); g.fill(); } }, { at: [0, .19, PZ - .11], rot: [0, Math.PI, 0] });
    K.text(['에어록'], .7, .18, { at: [0, 2.45, PZ - .01], rot: [0, Math.PI, 0], bg: '#1c2a3a', color: '#ffd34d', emissive: .8, size: .7, font: "'Noto Sans KR', sans-serif" });
    K.text(['⚠ 귀환선 연결 통로'], 1.2, .14, { at: [-1.5, 2.3, PZ - .01], rot: [0, Math.PI, 0], bg: '#e9ecef', color: '#b8231a', size: .55, font: "'Noto Sans KR', sans-serif" });
    rail(1.6, [-1.5, 1.2, PZ - .08], 'x');
    // 안쪽 해치
    const ih = K.group({ at: [-.5, .35, PZ] });
    const hm = MAT.metal('#cfd4da', { rough: .4 });
    K.rbox(1.0, 1.7, .08, .06, hm, { parent: ih, at: [.5, .85, 0] });
    K.cyl(.13, .13, .1, MAT.glass(0x9fc4ff, .35), { parent: ih, at: [.5, 1.3, 0], rot: [Math.PI / 2, 0, 0] });
    K.torus(.14, .02, metal, { parent: ih, at: [.5, 1.3, -.05] });
    K.torus(.15, .015, MAT.plain(0x333333, .5, .6), { parent: ih, at: [.5, .78, -.08] });
    for (let i = 0; i < 3; i++) K.box(.3, .02, .02, MAT.plain(0x333333, .5, .6), { parent: ih, at: [.5, .78, -.08], rot: [0, 0, i * Math.PI / 3] });
    K.hot(ih, { name: '에어록 해치', click: g => { if (s.hatchOpen) g.goZone('airlock'); else g.say('굳게 닫힌 해치. 옆의 제어판에서 열어야 한다.'); } });
    // 제어판
    const cp = K.group({ at: [1.05, 1.35, PZ - .03], rot: [0, Math.PI, 0] });
    K.rbox(.5, .72, .05, .02, MAT.plain(0x2b3036, .5, .4), { parent: cp });
    const stat = K.picture(.38, .16, drawStat, { parent: cp, at: [0, .2, .03], emissive: 1.2, res: 512 });
    const lampA = MAT.glow(0xff3a2a, 2), lampB = MAT.glow(0xff3a2a, 2);
    K.sphere(.025, lampA, { parent: cp, at: [-.12, 0, .03], shadow: false });
    K.sphere(.025, lampB, { parent: cp, at: [.12, 0, .03], shadow: false });
    K.text(['권한'], .12, .05, { parent: cp, at: [-.12, -.06, .028], bg: '#2b3036', color: '#ffffff', size: .8, font: "'Noto Sans KR', sans-serif" });
    K.text(['산소'], .12, .05, { parent: cp, at: [.12, -.06, .028], bg: '#2b3036', color: '#ffffff', size: .8, font: "'Noto Sans KR', sans-serif" });
    K.box(.2, .03, .03, MAT.plain(0x111111, .4), { parent: cp, at: [0, -.2, .03] });
    K.text(['승무원증'], .2, .05, { parent: cp, at: [0, -.26, .028], bg: '#2b3036', color: '#cfd6de', size: .75, font: "'Noto Sans KR', sans-serif" });
    function drawStat(g, w, h) {
      g.fillStyle = '#05080c'; g.fillRect(0, 0, w, h);
      if (!s.power) return;
      g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `700 ${h * .3}px 'Noto Sans KR'`;
      const open = s.auth && s.suit;
      g.fillStyle = open ? '#4dff8a' : '#ff5a4a'; g.fillText(open ? '에어록 열림' : '에어록 잠김', w / 2, h * .32);
      g.font = `700 ${h * .2}px 'Noto Sans KR'`; g.fillStyle = '#cfe3ff';
      g.fillText(`권한 ${s.auth ? '○' : '×'}   산소 ${s.suit ? '○' : '×'}`, w / 2, h * .74);
    }
    function redrawStat() { const cv = stat.material.map.image; drawStat(cv.getContext('2d'), cv.width, cv.height); stat.material.map.needsUpdate = true; }
    const setLamp = m => { m.color.set(0x3cff6a); m.emissive.set(0x3cff6a); };
    async function tryOpen(g) {
      redrawStat();
      if (!(s.auth && s.suit) || s.hatchOpen) return;
      s.hatchOpen = true; await g.wait(.6); g.sound.play('open');
      g.tween(ih.rotation, { y: -1.7 }, 1.6); g.say('치익— 에어록 해치가 열렸다.');
    }
    K.zone('hatch', { pos: [.25, 1.5, .4], look: [.4, 1.3, 2.0], fov: 58, range: .5 });
    K.hot(cp, {
      name: '에어록 제어판', goto: 'hatch',
      click: g => {
        if (!s.power) { g.say('제어판이 꺼져 있다.'); return; }
        g.say(`「에어록 — 권한 ${s.auth ? '확인' : '없음'} / 산소 ${s.suit ? '확인' : '없음'}」<br>승무원증을 대고, 우주복 산소를 확인하십시오.`);
      },
      use: {
        idCard: g => {
          if (!s.power) { g.sound.play('wrong'); g.say('제어판이 꺼져 있다.'); return; }
          if (s.auth) { g.say('이미 권한이 확인됐다.'); return; }
          g.lock({
            title: '에어록 비상 인증', text: '승무원증을 대자 색 칸 네 개가 떴다.', type: 'colors', length: 4, symbols: [C.red, C.yel, C.grn, C.blu, C.wht, C.org], answer: STAR_ORDER, onSolve: g => {
              s.auth = true; g.take('idCard'); setLamp(lampA); g.say('삑— 「권한 확인」.'); tryOpen(g);
            }
          });
        },
        o2helmet: g => {
          if (!s.power) { g.sound.play('wrong'); g.say('제어판이 꺼져 있다.'); return; }
          s.suit = true; g.take('o2helmet'); setLamp(lampB); g.sound.play('switch');
          g.say('헬멧을 쓰고 산소 밸브를 열었다. 쉬익— 「산소 확인」.'); tryOpen(g);
        },
        helmet: g => { g.sound.play('wrong'); g.say('헬멧에 산소가 연결되어 있지 않다.'); },
        o2: g => { g.sound.play('wrong'); g.say('산소통만으로는 안 된다. 헬멧에 연결해야 한다.'); },
      }
    });

    // 에어록 방 안
    const ch = K.group();
    const chM = MAT.tiles('#dfe2e6', '#d0d4d9', 2, [1, 1], { rough: .5 });
    for (const [x, ry] of [[-1.2, Math.PI / 2], [1.2, -Math.PI / 2]]) {
      const m = chM.clone(); for (const k of ['map', 'bumpMap']) { m[k] = chM[k].clone(); m[k].repeat.set(.75, 1.5); m[k].needsUpdate = true; }
      K.plane(1.5, H, m, { parent: ch, at: [x, H / 2, 2.75], rot: [0, ry, 0] });
    }
    K.box(2.4, .02, 1.5, MAT.plain(0x3a3f45, .7, .3), { parent: ch, at: [0, .01, 2.75] });
    for (const x of [-1.15, 1.15]) rail(1.2, [x, 1.3, 2.75], 'z');
    K.hot(ch, { name: '에어록 안', goto: 'airlock', click: g => g.say('좁은 에어록. 바깥 문 너머는 우주다. 귀환선이 기다린다.') });
    // 열린 해치 자리: 눈에 안 보이는 누르는 판. 누르면 에어록 안으로 들어간다.
    const doorway = K.plane(1.0, 1.7, new K.THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, side: K.THREE.DoubleSide }), { at: [0, 1.2, PZ + .06] });
    K.hot(doorway, { name: '에어록 입구', goto: 'airlock', enabled: () => s.hatchOpen, click: g => g.say('좁은 에어록. 바깥 문 너머는 우주다. 귀환선이 기다린다.') });
    K.point(0xffffff, 2.5, 4, { at: [0, 2.7, 2.8] });
    const beaconMat = MAT.glow(0xff2a1a, .2);
    const beacon = K.group({ at: [0, 2.94, 2.75] });
    K.cyl(.06, .07, .08, beaconMat, { parent: beacon, shadow: false });
    const beaconL = K.point(0xff2a1a, 0, 4, { at: [0, 2.8, 2.75] });
    // 바깥 해치와 우주 그림
    K.picture(.86, 1.66, (g, w, h) => {
      g.fillStyle = '#01030a'; g.fillRect(0, 0, w, h);
      const r = K.rng(5); g.fillStyle = '#fff'; for (let i = 0; i < 160; i++) { g.globalAlpha = .3 + r() * .7; g.fillRect(r() * w, r() * h * .7, 2, 2); } g.globalAlpha = 1;
      const eg = g.createRadialGradient(w * .5, h * 1.6, h * .5, w * .5, h * 1.6, h * .95); eg.addColorStop(0, '#1d5fb8'); eg.addColorStop(.9, '#4aa0ff'); eg.addColorStop(1, 'rgba(120,190,255,0)');
      g.fillStyle = eg; g.beginPath(); g.arc(w * .5, h * 1.6, h * .95, 0, 7); g.fill();
      g.fillStyle = '#d8dde3'; g.beginPath(); g.moveTo(w * .3, h * .62); g.lineTo(w * .7, h * .62); g.lineTo(w * .6, h * .38); g.lineTo(w * .4, h * .38); g.fill();
      g.fillStyle = '#ffd98a'; g.beginPath(); g.arc(w * .5, h * .5, w * .06, 0, 7); g.fill();
      g.fillStyle = '#8a9097'; g.fillRect(w * .46, h * .62, w * .08, h * .12);
    }, { at: [0, 1.2, D / 2 - .015], rot: [0, Math.PI, 0], emissive: 1 });
    const outer = K.group({ at: [0, 1.2, D / 2 - .05] });
    K.rbox(.92, 1.7, .06, .06, hm, { parent: outer });
    K.cyl(.1, .1, .07, MAT.glass(0x223355, .7), { parent: outer, at: [0, .4, 0], rot: [Math.PI / 2, 0, 0] });
    K.torus(.11, .018, metal, { parent: outer, at: [0, .4, -.035] });
    K.box(.6, .05, .03, MAT.plain(0xffd200, .5), { parent: outer, at: [0, -.6, -.035] });
    K.hot(outer, { name: '바깥 해치', zone: 'airlock', click: g => g.say('바깥 문. 기압이 남아 있으면 열리지 않는다.') });
    // 수칙 판
    const rules = K.text(['에어록 안전 수칙', '1. 감압은 안쪽 문이', '   닫혀 있을 때만 된다.', '2. 바깥 문은 감압이', '   끝난 뒤에만 열린다.', '3. 가압하면 처음부터.'], .62, .8, { at: [-.8, 1.4, D / 2 - .02], rot: [0, Math.PI, 0], bg: '#f2f4f6', color: '#1a2230', size: .072, align: 'left', pad: 34, font: "'Noto Sans KR', sans-serif" });
    K.hot(rules, { name: '에어록 수칙', zone: 'airlock', click: g => g.note('에어록 안전 수칙', '1. 감압은 안쪽 문이 닫혀 있을 때만 시작된다.\n2. 바깥 문은 감압이 끝난 뒤(기압 0)에만 열린다.\n3. 가압하면 공기가 다시 차니 처음부터.', 'metal') });
    // 버튼 판
    const bp = K.group({ at: [.82, 1.3, D / 2 - .03], rot: [0, Math.PI, 0] });
    K.rbox(.46, .9, .04, .02, MAT.plain(0x2b3036, .5, .4), { parent: bp });
    K.picture(.2, .2, (g, w) => {
      g.fillStyle = '#e9ecef'; g.beginPath(); g.arc(w / 2, w / 2, w / 2 - 2, 0, 7); g.fill(); g.strokeStyle = '#333'; g.lineWidth = 6; g.stroke();
      g.fillStyle = '#111'; g.font = `700 ${w * .14}px 'Noto Sans KR'`; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText('0', w / 2 - Math.sin(1) * w * .33, w / 2 - Math.cos(1) * w * .33); g.fillText('1', w / 2 + Math.sin(1) * w * .33, w / 2 - Math.cos(1) * w * .33);
      g.font = `700 ${w * .12}px 'Noto Sans KR'`; g.fillText('기압', w / 2, w * .72);
    }, { parent: bp, at: [0, .32, .025] });
    const needle = K.group({ parent: bp, at: [0, .32, .03], rot: [0, 0, -1] });
    K.box(.008, .08, .004, MAT.plain(0xd01a1a, .4), { parent: needle, at: [0, .04, 0] });
    const BTN = [['가압', 0x2a7fd0, .12], ['바깥 문 열기', 0xd0402a, -.02], ['안쪽 문 닫기', 0xe0a020, -.16], ['감압', 0x2aa04a, -.3]];
    const press = (g, b) => { g.sound.play('click'); g.tween(b.position, { z: .01 }, .08).then(() => g.tween(b.position, { z: .03 }, .12)); };
    for (const [label, col, y] of BTN) {
      const grp = K.group({ parent: bp, at: [0, y, 0] });
      const b = K.cyl(.04, .04, .03, MAT.plain(col, .35, .1), { parent: grp, at: [.13, 0, .03], rot: [Math.PI / 2, 0, 0] });
      K.text([label], .26, .07, { parent: grp, at: [-.06, 0, .022], bg: '#2b3036', color: '#ffffff', size: .6, font: "'Noto Sans KR', sans-serif" });
      K.hot(grp, { name: label, zone: 'airlock', click: g => { if (s.out) return; press(g, b); airBtn(g, label); } });
    }
    K.onUpdate((dt, t) => {
      if (s.depressing) { beaconMat.emissiveIntensity = 2 + Math.sin(t * 10) * 2; beaconL.intensity = 1.5 + Math.sin(t * 10) * 1.5; beacon.rotation.y += dt * 6; }
    });
    function airBtn(g, label) {
      if (label === '안쪽 문 닫기') {
        if (s.inner) { g.say('안쪽 문은 이미 닫혀 있다.'); return; }
        s.inner = true; g.tween(ih.rotation, { y: 0 }, 1.2).then(() => g.sound.play('thud')); g.say('쿵. 안쪽 문이 닫혔다.');
      } else if (label === '감압') {
        if (!s.inner) { g.sound.play('wrong'); g.say('「경고: 안쪽 문 열림」 이대로 공기를 빼면 정거장 공기가 다 빠진다.'); return; }
        if (s.vac) { g.say('이미 기압 0이다.'); return; }
        s.vac = true; s.depressing = true; g.sound.play('open');
        g.tween(needle.rotation, { z: 1 }, 2.2).then(() => { s.depressing = false; beaconMat.emissiveIntensity = .2; beaconL.intensity = 0; g.sound.play('beep'); });
        g.say('쉬이이익… 공기가 빠져나간다. 기압 0.');
      } else if (label === '가압') {
        if (!s.vac) { g.say('기압은 이미 정상이다.'); return; }
        s.vac = false; g.tween(needle.rotation, { z: -1 }, 1.2); g.say('공기가 다시 찼다. 처음부터 해야 한다.');
      } else if (label === '바깥 문 열기') {
        if (!s.vac) { g.sound.play('wrong'); g.say('「경고: 기압 있음」 바깥 문이 꿈쩍도 하지 않는다.'); return; }
        exitAirlock(g);
      }
    }
    async function exitAirlock(g) {
      s.out = true; g.sound.play('unlock'); await g.wait(.6); g.sound.play('open');
      await g.tween(outer.position, { y: outer.position.y + 1.9 }, 2.0);
      g.sound.play('magic'); g.goZone('outside');
      await g.wait(1.6); g.win();
    }
    K.zone('airlock', { pos: [0, 1.5, 2.3], look: [0, 1.35, 3.5], fov: 64, range: .55 });
    K.zone('outside', { pos: [0, 1.25, D / 2 - .25], look: [0, 1.3, 6], fov: 55, range: .2 });

    K.dust(160, [4.6, 2.8, 5.5], { opacity: .25, color: 0xdfeaff, speed: .01 });
  },
};

// ---------- 그림 도구 ----------
function periodicNoise(r) {
  const N = 256, p = new Float32Array(N * N);
  for (let i = 0; i < p.length; i++) p[i] = r();
  return (x, y, per) => {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    const sx = xf * xf * (3 - 2 * xf), sy = yf * yf * (3 - 2 * yf);
    const x0 = ((xi % per) + per) % per, x1 = (x0 + 1) % per, y0 = yi & 255, y1 = (yi + 1) & 255;
    const a = p[y0 * N + x0], b = p[y0 * N + x1], c = p[y1 * N + x0], d = p[y1 * N + x1];
    return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
  };
}
function fbm(n, u, v, base, oct) { let s = 0, amp = .5, f = base, tot = 0; for (let i = 0; i < oct; i++) { s += n(u * f, v * f, f) * amp; tot += amp; f *= 2; amp *= .5; } return s / tot; }
function earthCanvas(K) {
  const W = 1024, H = 512, c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d'), img = g.createImageData(W, H), n = periodicNoise(K.rng(31)), n2 = periodicNoise(K.rng(77));
  for (let y = 0; y < H; y++) {
    const v = y / H, lat = Math.abs(v - .5) * 2;
    for (let x = 0; x < W; x++) {
      const u = x / W, h = fbm(n, u, v / 2, 4, 5) - lat * .06;
      let r, gg, b;
      if (h > .53) {
        const t = fbm(n2, u, v / 2, 8, 3), dry = Math.min(1, Math.max(0, (t - .45) * 3 + (1 - lat) * .3 - .15)), k = .8 + (h - .53) * 2;
        r = (40 + dry * 150) * k; gg = (95 + dry * 70) * k; b = (40 + dry * 30) * k;
      } else { const d = Math.min(1, (.53 - h) * 5); r = 12 + (1 - d) * 25; gg = 50 + (1 - d) * 75; b = 115 + (1 - d) * 60; }
      if (lat > .8) { const ice = Math.min(1, (lat - .8) * 8); r += (235 - r) * ice; gg += (240 - gg) * ice; b += (245 - b) * ice; }
      const i = (y * W + x) * 4; img.data[i] = r; img.data[i + 1] = gg; img.data[i + 2] = b; img.data[i + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0); return c;
}
function cloudCanvas(K) {
  const W = 512, H = 256, c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d'), img = g.createImageData(W, H), n = periodicNoise(K.rng(55));
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const a = Math.max(0, Math.min(1, (fbm(n, x / W, y / H / 2, 6, 5) - .5) * 3.2));
    const i = (y * W + x) * 4; img.data[i] = img.data[i + 1] = img.data[i + 2] = 250; img.data[i + 3] = a * 235;
  }
  g.putImageData(img, 0, 0); return c;
}
// 밤 쪽 그늘 (움직이지 않음): 해는 왼쪽 앞
function nightCanvas() {
  const W = 512, c = document.createElement('canvas'); c.width = W; c.height = 8;
  const g = c.getContext('2d');
  for (let x = 0; x < W; x++) {
    const lit = Math.cos(Math.PI * 2 * (x / W - .17)), a = Math.max(0, Math.min(.93, (-lit + .2) * 1.6));
    g.fillStyle = `rgba(0,2,10,${a})`; g.fillRect(x, 0, 1, 8);
  }
  return c;
}
function drawPatch(g, w) {
  const c = w / 2;
  g.clearRect(0, 0, w, w);
  g.fillStyle = '#0d1b3d'; g.beginPath(); g.arc(c, c, c - 4, 0, 7); g.fill();
  g.save(); g.beginPath(); g.arc(c, c, c - w * .05, 0, 7); g.clip();
  const eg = g.createRadialGradient(c, w * 1.35, w * .2, c, w * 1.35, w * .55); eg.addColorStop(0, '#3a8ae0'); eg.addColorStop(1, '#16407e');
  g.fillStyle = eg; g.beginPath(); g.arc(c, w * 1.35, w * .55, 0, 7); g.fill();
  g.restore();
  g.lineWidth = w * .05; g.strokeStyle = '#c9a43a'; g.beginPath(); g.arc(c, c, c - w * .03, 0, 7); g.stroke();
  for (const [x, y, r, col] of [[.3, .36, .17, C.yel], [.7, .22, .055, C.grn], [.42, .66, .09, C.red], [.7, .48, .125, C.blu]]) {
    g.beginPath();
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = (i % 2 ? r * .45 : r) * w; g.lineTo(x * w + Math.cos(a) * rr, y * w + Math.sin(a) * rr); }
    g.closePath(); g.fillStyle = col; g.fill(); g.lineWidth = w * .008; g.strokeStyle = 'rgba(255,255,255,.6)'; g.stroke();
  }
  g.fillStyle = '#f2e6c0'; g.font = `700 ${w * .065}px 'Noto Sans KR'`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('한별 · 제7 원정대', c, w * .88);
}

// ---------- 물건 모양 ----------
function driverModel(K, g) {
  K.cyl(.022, .026, .11, K.MAT.plain(0xe8711c, .45), { parent: g, at: [0, -.07, 0] });
  K.cyl(.027, .027, .015, K.MAT.plain(0x222222, .6), { parent: g, at: [0, -.015, 0] });
  K.cyl(.006, .006, .14, K.MAT.silver(), { parent: g, at: [0, .06, 0] });
  K.cyl(.009, .009, .02, K.MAT.silver(), { parent: g, at: [0, .135, 0], seg: 6 });
}
function tankModel(K, g) {
  const w = K.MAT.plain(0xf0f2f4, .35, .1);
  K.cyl(.07, .07, .34, w, { parent: g, at: [0, .17, 0] });
  K.sphere(.07, w, { parent: g, at: [0, .34, 0] });
  K.cyl(.072, .072, .06, K.MAT.plain(0x1e6fd0, .4), { parent: g, at: [0, .2, 0] });
  K.cyl(.02, .025, .07, K.MAT.silver(), { parent: g, at: [0, .43, 0] });
  K.torus(.03, .008, K.MAT.plain(0x2a7f3a, .5), { parent: g, at: [0, .46, 0], rot: [Math.PI / 2, 0, 0] });
}
function helmetModel(K, g, withO2) {
  const T = K.THREE, shell = K.MAT.plain(0xf4f4f2, .3, .05);
  K.sphere(.17, shell, { parent: g });
  K.place(new T.Mesh(new T.SphereGeometry(.174, 32, 16, Math.PI / 2 - .95, 1.9, .85, 1.0), K.MAT.plain(0xc8952f, .08, 1)), { parent: g });
  K.torus(.13, .025, K.MAT.plain(0x8a9097, .4, .6), { parent: g, at: [0, -.15, 0], rot: [Math.PI / 2, 0, 0] });
  K.box(.06, .04, .04, K.MAT.plain(0x555a60, .4, .6), { parent: g, at: [0, -.02, -.17] });
  if (withO2) {
    K.cyl(.045, .045, .2, K.MAT.plain(0xf0f2f4, .35, .1), { parent: g, at: [0, -.04, -.24] });
    K.cyl(.047, .047, .04, K.MAT.plain(0x1e6fd0, .4), { parent: g, at: [0, -.04, -.24] });
    K.sphere(.015, K.MAT.glow(0x3cff6a, 3), { parent: g, at: [.15, .02, .06] });
  }
}
function cardModel(K, g) {
  K.rbox(.17, .108, .004, .008, K.MAT.plain(0xf2f4f7, .4), { parent: g });
  K.picture(.16, .1, (c, w, h) => {
    c.fillStyle = '#f2f4f7'; c.fillRect(0, 0, w, h);
    c.fillStyle = '#1f4f8f'; c.fillRect(0, 0, w, h * .28);
    c.fillStyle = '#fff'; c.font = `700 ${h * .15}px 'Noto Sans KR'`; c.textBaseline = 'middle'; c.fillText('정거장 한별 승무원증', w * .05, h * .14);
    c.fillStyle = '#9fb3c8'; c.fillRect(w * .06, h * .38, w * .25, h * .5);
    c.fillStyle = '#222'; c.font = `700 ${h * .14}px 'Noto Sans KR'`; c.fillText('선장 한서윤', w * .38, h * .52);
    c.fillStyle = '#c33'; c.fillRect(w * .38, h * .7, w * .5, h * .08);
  }, { parent: g, at: [0, 0, .0025] });
}

export const solution = [
  { hot: '떠다니는 드라이버' },
  { hot: '배전반 덮개', item: 'driver', wait: 2 },
  { hot: '정비 수칙 카드' },
  { hot: '초록 케이블' },
  { hot: '파란 케이블' }, { hot: '파란 케이블' },
  { hot: '빨간 케이블' }, { hot: '빨간 케이블' }, { hot: '빨간 케이블' },
  { hot: '노란 케이블' }, { hot: '노란 케이블' }, { hot: '노란 케이블' }, { hot: '노란 케이블', wait: 2 },
  { hot: '관제 화면' },
  { hot: '임무 계기판' },
  { hot: '보급 보관함', lock: '2048' },
  { hot: '산소통' },
  { hot: '우주 헬멧' },
  { combine: ['helmet', 'o2'] },
  { hot: '수면칸 그물 주머니' },
  { hot: '임무 패치' },
  { hot: '에어록 제어판', item: 'idCard', lock: [C.grn, C.red, C.blu, C.yel] },
  { hot: '에어록 제어판', item: 'o2helmet', wait: 2.5 },
  { hot: '에어록 입구' },
  { hot: '안쪽 문 닫기', wait: 1.5 },
  { hot: '감압', wait: 3 },
  { hot: '바깥 문 열기', wait: 5 },
];
