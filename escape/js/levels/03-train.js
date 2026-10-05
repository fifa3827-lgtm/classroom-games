// 3단계: 야간열차 7호 객실
// 흐름: 외투 주머니 → 찢어진 승차권(4호차 7호실 · 03:40 도착) → 벽 시각표에서 03:40 = 밀양 MYG
//       짐칸 여행 가방(알파벳 MYG) → 손잡이 몸통
//       신문의 라디오 방송표(FM 98.5 심야 안내 방송) → 라디오 손잡이 돌리기 → 「금고 번호 = 호차·호실」
//       객실 금고 0407 → 사각 쇠막대 / 손잡이 몸통 + 사각 쇠막대 = 문 손잡이 → 미닫이문 → 탈출
const FREQS = [88.1, 91.7, 95.3, 98.5, 102.9, 106.3];

export default {
  title: '야간열차 7호 객실',
  intro: '덜컹, 덜컹… 침대칸에서 눈을 떴다.\n창밖으로 달빛 들판이 흘러가고, 객실 문은 열리지 않는다.\n누군가 안쪽 손잡이를 뽑아 가 버렸다.\n\n<i>다음 역에 닿기 전에 이 방을 나가야 한다.</i>',
  outro: '문이 스르륵 열리고, 좁은 복도에 따뜻한 등불이 줄지어 있다.\n「곧 밀양역입니다.」\n열차가 속도를 줄이는 사이, 당신은 승강구로 향한다…',
  env: .3, exposure: 1.05, bloom: .55,
  start: { pos: [.3, 1.5, .75], look: [.2, 1.3, -1.5] },

  items: {
    ticket: { name: '찢어진 승차권', desc: '「은하호 · 4호차 7호실 · 03:40 도착」<br>도착역 이름 부분은 찢겨 나갔다.', model: (K, g) => { K.text(['은하호 승차권', '4호차 7호실', '03:40 도착'], .2, .1, { parent: g, bg: '#e9d8a8', color: '#3a2010', size: .22 }); }, iconRot: [0, 0, 0] },
    leverPart: { name: '손잡이 몸통', desc: '놋쇠로 된 문 손잡이. 가운데 네모난 구멍이 비어 있다. 축이 빠져 있다.', model: (K, g) => leverModel(K, g, false) },
    spindle: { name: '사각 쇠막대', desc: '네모난 쇠막대. 끝 모양이 객실 문의 네모난 구멍과 꼭 맞는다.', model: (K, g) => { K.box(.016, .13, .016, K.MAT.iron(), { parent: g }); } },
    handle: { name: '문 손잡이', desc: '쇠막대를 끼워 다시 맞춘 손잡이. 이제 문에 꽂아 돌릴 수 있다.', model: (K, g) => leverModel(K, g, true) },
  },
  combos: [['leverPart', 'spindle', 'handle']],

  hints: [
    { when: s => !s.ticket, text: ['이 객실 주인의 물건부터 살펴보세요.', '문 옆 옷걸이에 외투가 걸려 있어요.', '외투를 누르면 주머니에서 승차권이 나와요.'] },
    { when: s => !s.suitcase, text: ['짐칸 여행 가방은 알파벳 세 개 자물쇠예요. 「내릴 역의 부호」.', '승차권에는 도착 시각 03:40만 남았어요. 문 옆 시각표에서 그 시각을 찾으세요.', '03:40 도착은 밀양, 부호는 MYG.'] },
    { when: s => !s.radio, text: ['탁자 위 신문을 읽어 보세요. 아래쪽에 라디오 방송표가 있어요.', '「은하호 심야 안내 방송」은 FM 98.5예요.', '라디오 오른쪽 손잡이를 눌러 98.5에 맞추세요. 처음부터 세 번 누르면 돼요.'] },
    { when: s => !s.safe, text: ['방송이 금고 번호를 바꿨다고 했어요.', '승차권에 적힌 호차와 호실 번호를 네 자리로.', '4호차 7호실 → 0407. 소파 옆 금고 키패드에 넣으세요.'] },
    { when: (s, g) => !g.has('handle'), text: ['가방에서 손잡이 몸통과 사각 쇠막대를 차례로 눌러 조합하세요.'] },
    { text: ['고친 문 손잡이를 고르고 미닫이문을 누르세요.'] },
  ],

  build(K) {
    const { THREE, MAT, s } = K;
    const W = 5, D = 3, H = 2.5;
    const veneer = MAT.wood('#5a3420', [1, 1]), dark = MAT.wood('#2e1a0e'), brass = MAT.brass();
    K.room({ w: W, d: D, h: H, floor: MAT.fabric('#3a1418', 1), wall: MAT.wallpaper('#4a1e22', '#b08a50'), ceil: MAT.plaster('#d8ccb0'), trim: dark });
    // 아래쪽 나무 판벽 + 놋쇠 띠
    for (const [len, at, ry] of [[W, [0, .5, -D / 2 + .02], 0], [W, [0, .5, D / 2 - .02], Math.PI], [D, [-W / 2 + .02, .5, 0], Math.PI / 2], [D, [W / 2 - .02, .5, 0], -Math.PI / 2]]) {
      K.box(len, 1, .03, veneer, { at, rot: [0, ry, 0] });
      K.box(len, .025, .045, brass, { at: [at[0], 1.01, at[2]], rot: [0, ry, 0] });
    }
    // 둥근 천장 느낌의 들보
    for (const x of [-1.6, 0, 1.6]) K.box(.08, .06, D, dark, { at: [x, H - .03, 0] });

    // ---------- 빛 ----------
    K.scene.add(new THREE.HemisphereLight(0xa8b4d0, 0x3a2418, .95));
    const dome = K.group({ at: [0, H - .02, .1] });
    K.sphere(.16, MAT.glow(0xffe2b0, 1.6), { parent: dome, scale: [1, .35, 1], shadow: false });
    K.torus(.16, .012, brass, { parent: dome, rot: [Math.PI / 2, 0, 0] });
    K.point(0xffd9a0, 6, 7, { at: [0, H - .2, .1], shadow: true });
    // 달빛
    K.spot(0x8fb0ff, 6, 7, [.2, .3, .6], { at: [.2, 2.1, -2.3], angle: .5, penumbra: .8 });
    // 지나가는 역 불빛
    const pass = K.point(0xffb060, 0, 5, { at: [3, 1.4, -2.1] });
    K.onUpdate((dt, t) => {
      const p = (t % 9) / 9;
      if (p < .2) { pass.position.x = 3 - p / .2 * 6; pass.intensity = 7 * Math.sin(Math.PI * p / .2); } else pass.intensity = 0;
    });

    // ---------- 북쪽: 창과 탁자 ----------
    const win = K.group({ at: [.2, 1.47, -D / 2] });
    const WW = 1.5, WH = .85;
    K.picture(WW, WH, (c, w, h) => {
      const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#070e24'); gr.addColorStop(1, '#2c4572'); c.fillStyle = gr; c.fillRect(0, 0, w, h);
      for (let i = 0; i < 90; i++) { c.globalAlpha = .3 + Math.random() * .7; c.fillStyle = '#fff'; c.fillRect(Math.random() * w, Math.random() * h * .6, 1.5, 1.5); }
      c.globalAlpha = 1;
      const mg = c.createRadialGradient(w * .76, h * .24, 10, w * .76, h * .24, 90); mg.addColorStop(0, 'rgba(230,236,255,.55)'); mg.addColorStop(1, 'rgba(230,236,255,0)'); c.fillStyle = mg; c.fillRect(0, 0, w, h);
      c.fillStyle = '#f6f3e6'; c.beginPath(); c.arc(w * .76, h * .24, 26, 0, 7); c.fill();
      c.fillStyle = 'rgba(180,195,230,.12)'; for (let i = 0; i < 4; i++) { c.beginPath(); c.ellipse(w * (.15 + i * .22), h * (.18 + (i % 2) * .1), 70, 10, 0, 0, 7); c.fill(); }
    }, { parent: win, at: [0, 0, .006], emissive: 1 });
    const scroller = (draw, z, speed) => {
      const t = K.canvasTexture(2048, 512, draw); t.wrapS = THREE.RepeatWrapping; t.repeat.x = (WW / WH) / 4; t.needsUpdate = true;
      K.plane(WW, WH, new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false }), { parent: win, at: [0, 0, z] });
      K.onUpdate(dt => { t.offset.x = (t.offset.x + dt * speed) % 1; });
    };
    // 먼 산과 마을 불빛 (천천히)
    scroller((c, w, h) => {
      const P = Math.PI * 2, hill = u => h * .62 - (Math.sin(P * 2 * u) * 40 + Math.sin(P * 5 * u + 1) * 22 + Math.sin(P * 11 * u + 2) * 8);
      c.fillStyle = '#121b30'; c.beginPath(); c.moveTo(0, h); for (let x = 0; x <= w; x += 8) c.lineTo(x, hill(x / w)); c.lineTo(w, h); c.fill();
      const r = K.rng(8);
      for (let i = 0; i < 40; i++) { const x = 30 + r() * (w - 60); c.fillStyle = r() < .7 ? '#ffcf7a' : '#fff1c8'; c.fillRect(x, hill(x / w) + 10 + r() * 40, 3, 3); }
    }, .01, .012);
    // 가까운 나무와 전봇대 (빠르게)
    scroller((c, w, h) => {
      const r = K.rng(31), P = Math.PI * 2;
      c.fillStyle = '#04060b';
      c.beginPath(); c.moveTo(0, h); for (let x = 0; x <= w; x += 16) c.lineTo(x, h * .8 + Math.sin(P * 6 * x / w) * 6); c.lineTo(w, h); c.fill();
      const tree = (x, sz) => { c.beginPath(); c.moveTo(x, h * .82 - sz * 1.7); c.lineTo(x - sz * .45, h * .84); c.lineTo(x + sz * .45, h * .84); c.fill(); };
      for (let i = 0; i < 16; i++) { const x = r() * w, sz = 40 + r() * 80; for (const dx of [-w, 0, w]) tree(x + dx, sz); }
      for (let x = 100; x < w + 600; x += 512) { c.fillRect(x - 6, h * .24, 12, h * .62); c.fillRect(x - 34, h * .27, 68, 7); }
      c.strokeStyle = 'rgba(4,6,11,.95)'; c.lineWidth = 2.5;
      for (let x = 100 - 512; x < w; x += 512) for (const dy of [0, 16]) { c.beginPath(); c.moveTo(x, h * .28 + dy); c.quadraticCurveTo(x + 256, h * .38 + dy, x + 512, h * .28 + dy); c.stroke(); }
    }, .014, .28);
    const glass = K.plane(WW, WH, MAT.glass(0x9ab4d8, .12), { parent: win, at: [0, 0, .03] }); glass.userData.noRay = true;
    for (const y of [-WH / 2 - .04, WH / 2 + .04]) K.box(WW + .16, .08, .1, dark, { parent: win, at: [0, y, .04] });
    for (const x of [-WW / 2 - .04, WW / 2 + .04]) K.box(.08, WH, .1, dark, { parent: win, at: [x, 0, .04] });
    K.box(WW + .1, .02, .02, brass, { parent: win, at: [0, -.05, .07] });
    K.cyl(.04, .04, WW + .2, MAT.fabric('#c9b48a'), { parent: win, at: [0, WH / 2 + .1, .08], rot: [0, 0, Math.PI / 2] });
    const curtains = [-1, 1].map(sx => K.group({ parent: win, at: [sx * (WW / 2 + .2), WH / 2 + .1, .1] }));
    curtains.forEach(cg => K.box(.34, 1.15, .04, MAT.fabric('#6a1a20', 1, [1, 3]), { parent: cg, at: [0, -.575, 0] }));
    K.cyl(.012, .012, WW + .8, brass, { parent: win, at: [0, WH / 2 + .12, .1], rot: [0, 0, Math.PI / 2] });
    K.hot(win, { name: '창밖', text: '달빛 들판과 전봇대가 휙휙 지나간다. 창은 열리지 않게 고정되어 있다.' });

    // 접이식 탁자
    const TY = .74;
    K.rbox(.95, .04, .48, .01, veneer, { at: [.2, TY - .02, -D / 2 + .25] });
    K.box(.06, TY - .04, .06, dark, { at: [.2, (TY - .04) / 2, -D / 2 + .3] });
    K.box(.5, .04, .3, dark, { at: [.2, .02, -D / 2 + .3] });
    // 찻잔
    const cup = K.group({ at: [.56, TY, -1.4] });
    K.cyl(.07, .06, .012, MAT.plain(0xf2efe6, .3), { parent: cup, at: [0, .006, 0] });
    K.lathe([[0, 0], [.03, 0], [.04, .06], [.042, .065], [0, .065]], MAT.plain(0xf2efe6, .3), { parent: cup, at: [0, .012, 0] });
    K.cyl(.036, .036, .002, MAT.plain(0x6a3a14, .1), { parent: cup, at: [0, .066, 0] });
    const spoon = K.box(.005, .004, .09, MAT.silver(), { parent: cup, at: [.05, .015, .02], rot: [0, .5, 0] });
    K.hot(cup, { name: '찻잔', zone: 'table', text: '식은 홍차. 기차가 흔들릴 때마다 숟가락이 달그락거린다.' });
    // 작은 스탠드
    const lampG = K.group({ at: [-.22, TY, -1.38] });
    K.cyl(.05, .06, .02, brass, { parent: lampG });
    K.cyl(.008, .008, .2, brass, { parent: lampG, at: [0, .11, 0] });
    K.lathe([[.0, .0], [.1, -.0], [.07, .08], [.03, .11], [0, .11]], MAT.plain(0x1d5a3a, .3, .2, { side: THREE.DoubleSide }), { parent: lampG, at: [0, .18, 0] });
    K.sphere(.025, MAT.glow(0xffd28a, 5), { parent: lampG, at: [0, .2, 0], shadow: false });
    K.point(0xffc27a, 1.6, 3.5, { parent: lampG, at: [0, .16, .05], shadow: true, res: 512 });
    K.hot(lampG, { name: '스탠드', zone: 'table', text: '초록 갓을 씌운 작은 스탠드. 따뜻한 빛이 탁자를 비춘다.' });

    // 라디오 (주파수 손잡이를 돌리는 3D 퍼즐)
    const radio = K.group({ at: [.03, TY, -1.3] });
    K.rbox(.36, .2, .16, .025, MAT.wood('#6a3a1a'), { parent: radio, at: [0, .1, 0] });
    K.plane(.2, .1, MAT.fabric('#b9a27a', 1, [1, 1]), { parent: radio, at: [-.06, .075, .081] });
    for (let i = 0; i < 5; i++) K.box(.2, .004, .004, MAT.wood('#4a2810'), { parent: radio, at: [-.06, .035 + i * .02, .083] });
    const dial = K.picture(.3, .05, (c, w, h) => {
      c.fillStyle = '#e8b85a'; c.fillRect(0, 0, w, h);
      c.fillStyle = '#3a2008'; c.strokeStyle = '#3a2008'; c.font = "700 44px 'Noto Sans KR', sans-serif"; c.textAlign = 'center'; c.textBaseline = 'middle';
      for (let f = 88; f <= 108; f++) { const x = w * (.06 + (f - 88) / 20 * .88); c.lineWidth = f % 4 === 0 ? 4 : 2; c.beginPath(); c.moveTo(x, h * .62); c.lineTo(x, h * (f % 4 === 0 ? .98 : .82)); c.stroke(); if (f % 4 === 0) c.fillText(String(f), x, h * .3); }
    }, { parent: radio, at: [0, .165, .081], emissive: .9, res: 1024 });
    const dialX = f => .3 * (.06 + (f - 88) / 20 * .88) - .15;
    const needle = K.box(.004, .045, .004, MAT.plain(0xc81e1e, .4), { parent: radio, at: [dialX(FREQS[0]), .165, .085] });
    const knob = K.group({ parent: radio, at: [.12, .07, .085] });
    K.cyl(.032, .032, .025, MAT.plain(0x2a1a10, .4), { parent: knob, rot: [Math.PI / 2, 0, 0] });
    K.box(.006, .03, .006, MAT.plain(0xe8d8b0, .4), { parent: knob, at: [0, .015, .014] });
    for (const x of [-.14, .14]) K.cyl(.012, .012, .02, MAT.plain(0x111111), { parent: radio, at: [x, .005, .06] });
    K.hot(radio, { name: '라디오', zone: 'table', text: '낡은 진공관 라디오. 오른쪽 손잡이로 주파수를 맞춘다.' });
    let fi = 0, turning = false;
    const STATIONS = ['치지직… 잡음뿐이다.', '♪ 느린 피아노 곡이 흐른다.', '치익… 알아들을 수 없는 외국어 방송이다.', '', '치지직… 잡음뿐이다.', '일기 예보: 「남부 지방, 새벽에 짙은 안개…」'];
    K.hot(knob, {
      name: '라디오 손잡이', zone: 'table', click: async g => {
        if (turning) return;
        turning = true; g.sound.play('tick');
        fi = (fi + 1) % FREQS.length;
        g.tween(knob.rotation, { z: knob.rotation.z - 1.05 }, .3);
        await g.tween(needle.position, { x: dialX(FREQS[fi]) }, .35);
        turning = false;
        if (FREQS[fi] === 98.5) {
          s.radio = true; g.sound.play('beep');
          g.note('라디오 — FM 98.5', '<p>「…은하호 심야 안내 방송입니다.」</p><div class="big">4호차 7호실 손님께 알립니다.\n객실 금고의 비밀번호를\n승차권에 적힌\n호차·호실 번호로 바꾸어 두었습니다.</div><p>(예: 2호차 15호실 → 0215)</p>');
        } else g.say(`FM ${FREQS[fi]} — ${STATIONS[fi]}`);
      }
    });
    // 신문
    const paper = K.text(['은하호, 30년 만에', '다시 달린다', '— 심야 방송표 안쪽 —'], .34, .24, { at: [.42, TY + .003, -1.17], rot: [-Math.PI / 2, 0, -.15], size: .16, lh: 1.4, bg: '#e4dcc6', color: '#1a1a1a' });
    K.hot(paper, {
      name: '신문', zone: 'table', click: g => g.note('은하신문', '<div class="big">은하호, 30년 만에 다시 달린다</div>\n<p>서울에서 부산까지 밤새 달리는 침대 열차 「은하호」가 오늘 밤 다시 운행을 시작했다. 승객들은 객실마다 놓인 금고와 낡은 라디오가 옛 모습 그대로라며 반가워했다.</p>\n<hr>\n<b>오늘 밤 라디오</b>\nFM 91.7 · 클래식의 밤\nFM 98.5 · 은하호 심야 안내 방송 (03:00~)\nFM 106.3 · 새벽 일기 예보')
    });
    K.zone('table', { pos: [.18, 1.3, -.4], look: [.18, .8, -1.3], fov: 55, range: .45 });

    // ---------- 서쪽: 2층 침대 ----------
    const bunkZ = -.55, BL = 1.9;
    K.box(.8, .4, BL, veneer, { at: [-2.1, .2, bunkZ] });
    K.rbox(.76, .14, BL - .04, .04, MAT.fabric('#e8e0cc'), { at: [-2.1, .47, bunkZ] });
    K.rbox(.78, .06, 1.2, .02, MAT.fabric('#7a1f22', 1, [2, 2]), { at: [-2.08, .56, bunkZ + .3], rot: [0, 0, .03] });
    K.rbox(.5, .1, .3, .05, MAT.fabric('#f2ede0'), { at: [-2.15, .6, bunkZ - .75] });
    const lowerBunk = K.box(.8, .02, BL, MAT.plain(0, 1, 0, { transparent: true, opacity: 0, depthWrite: false }), { at: [-2.1, .62, bunkZ], shadow: false });
    K.hot(lowerBunk, { name: '아래 침대', text: '이불이 흐트러져 있다. 베개 밑에는 아무것도 없다.' });
    const up = K.group({ at: [-2.1, 1.45, bunkZ] });
    K.box(.8, .06, BL, veneer, { parent: up });
    K.rbox(.76, .12, BL - .04, .04, MAT.fabric('#e8e0cc'), { parent: up, at: [0, .09, 0] });
    K.rbox(.78, .05, 1.0, .02, MAT.fabric('#2a3a5a', 1, [2, 2]), { parent: up, at: [0, .16, .4] });
    K.box(.04, .16, 1.3, veneer, { parent: up, at: [.38, .22, -.2] });
    for (const z of [-.9, .9]) K.cyl(.012, .012, 1.05, brass, { parent: up, at: [.38, .52, z] });
    K.hot(up, { name: '위 침대', text: '빈 침대. 누군가 급히 떠난 듯 시트가 구겨져 있다.' });
    // 사다리
    for (const z of [.12, .42]) K.cyl(.014, .014, 1.75, brass, { at: [-1.66, .875, z] });
    for (let i = 0; i < 5; i++) K.cyl(.01, .01, .3, brass, { at: [-1.66, .3 + i * .3, .27], rot: [Math.PI / 2, 0, 0] });
    // 침대 독서등
    for (const y of [1.0, 1.98]) {
      K.box(.06, .1, .08, brass, { at: [-2.47, y, -1.2] });
      K.lathe([[0, 0], [.06, -.0], [.045, .06], [0, .06]], MAT.plain(0xf0dcb0, .5, 0, { side: THREE.DoubleSide, emissive: 0xffc070, emissiveIntensity: .6 }), { at: [-2.4, y + .02, -1.2], rot: [0, 0, Math.PI] });
      K.sphere(.02, MAT.glow(0xffd28a, 4), { at: [-2.4, y - .01, -1.2], shadow: false });
      K.point(0xffc27a, 1.4, 2.5, { at: [-2.35, y - .05, -1.15] });
    }

    // ---------- 동쪽: 소파, 짐칸, 여행 가방, 금고 ----------
    const sofa = K.group({ at: [2.15, 0, -.55] });
    K.box(.7, .4, 1.8, veneer, { parent: sofa, at: [0, .2, 0] });
    K.rbox(.68, .14, 1.76, .05, MAT.fabric('#7a1f22', 1, [2, 2]), { parent: sofa, at: [-.02, .47, 0] });
    K.rbox(.14, .6, 1.76, .05, MAT.fabric('#7a1f22', 1, [2, 2]), { parent: sofa, at: [.27, .85, 0] });
    K.hot(sofa, { name: '소파', text: '푹신한 객실 소파. 틈새에는 빵 부스러기뿐이다.' });
    // 짐칸
    for (const x of [2.12, 2.42]) K.cyl(.012, .012, 1.8, brass, { at: [x, 1.95, -.55], rot: [Math.PI / 2, 0, 0] });
    for (const z of [-1.35, -.55, .25]) { K.box(.36, .015, .015, brass, { at: [2.3, 1.95, z] }); K.cyl(.008, .008, .3, brass, { at: [2.3, 2.1, z], rot: [0, 0, .9] }); }
    for (let i = 0; i < 10; i++) K.cyl(.004, .004, .32, brass, { at: [2.27, 1.95, -1.35 + i * .18], rot: [0, 0, Math.PI / 2] });
    const hatBox = K.cyl(.16, .16, .2, MAT.fabric('#2a4a5a', 1), { at: [2.28, 2.06, .05] });
    K.hot(hatBox, { name: '모자 상자', zone: 'rack', text: '안에는 낡은 중절모 하나뿐이다.' });
    // 여행 가방 (알파벳 자물쇠)
    const bag = K.group({ at: [2.27, 1.96, -.75], rot: [0, -Math.PI / 2, 0] });
    const leather = MAT.leather('#6a3a1e');
    K.rbox(.62, .13, .4, .02, leather, { parent: bag, at: [0, .065, 0] });
    K.box(.58, .02, .36, MAT.fabric('#5a2228'), { parent: bag, at: [0, .12, 0] });
    const bagLid = K.group({ parent: bag, at: [0, .13, -.2] });
    K.rbox(.62, .09, .4, .02, leather, { parent: bagLid, at: [0, .045, .2] });
    for (const x of [-.22, .22]) K.box(.06, .2, .41, MAT.leather('#3a1e0e'), { parent: bag, at: [x, .11, 0] });
    K.torus(.04, .01, brass, { parent: bag, at: [0, .15, .21], arc: Math.PI, rot: [0, 0, 0] });
    K.box(.12, .04, .012, brass, { parent: bag, at: [0, .11, .205] });
    for (const x of [-.03, 0, .03]) K.cyl(.01, .01, .02, MAT.plain(0x222222, .4, .6), { parent: bag, at: [x, .11, .215], rot: [0, 0, Math.PI / 2] });
    K.text(['이름표: 내릴 역의 부호'], .2, .045, { parent: bag, at: [0, .045, .207], bg: '#efe6c8', color: '#3a1010', size: .45 });
    const lever0 = K.group({ parent: bag, at: [-.05, .13, 0], rot: [-Math.PI / 2, 0, .5], scale: .8 }); leverModel(K, lever0, false); lever0.visible = false;
    K.zone('rack', { pos: [1.25, 1.75, -.65], look: [2.3, 2.05, -.7], fov: 50, range: .45 });
    K.hot(bag, {
      name: '여행 가방', zone: 'rack', click: g => {
        if (s.suitcase) return;
        g.lock({ title: '여행 가방 자물쇠', text: '알파벳 바퀴 세 개. 이름표: 「내릴 역의 부호」', type: 'letters', answer: 'MYG', onSolve: async g => {
          s.suitcase = true; g.sound.play('open'); lever0.visible = true;
          await g.tween(bagLid.rotation, { x: -1.7 }, .8);
          g.say('가방이 열렸다. 옷가지 사이에 놋쇠 손잡이가 있다!'); lever0.visible = false; g.give('leverPart');
        } });
      }
    });
    // 금고 (키패드)
    const safe = K.group({ at: [2.25, 0, .95], rot: [0, -Math.PI / 2, 0] });
    const sm = MAT.metal('#2e3236', { rough: .45 });
    K.rbox(.42, .46, .4, .015, sm, { parent: safe, at: [0, .23, 0] });
    const sdoor = K.group({ parent: safe, at: [-.18, .23, .205] });
    K.rbox(.36, .38, .025, .008, MAT.metal('#3c4148', { rough: .35 }), { parent: sdoor, at: [.18, 0, 0] });
    K.picture(.1, .13, (c, w, h) => {
      c.fillStyle = '#1a1c1e'; c.fillRect(0, 0, w, h);
      c.fillStyle = '#d8d8d0'; c.font = "700 60px 'Noto Sans KR', sans-serif"; c.textAlign = 'center'; c.textBaseline = 'middle';
      ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].forEach((k, i) => c.fillText(k, w * (.2 + (i % 3) * .3), h * (.14 + Math.floor(i / 3) * .24)));
    }, { parent: sdoor, at: [.26, -.04, .014] });
    K.box(.1, .03, .005, MAT.glow(0x40ff80, 1.2), { parent: sdoor, at: [.26, .1, .014] });
    K.box(.03, .12, .03, MAT.silver(), { parent: sdoor, at: [.08, 0, .03] });
    K.text(['객실 금고'], .14, .04, { parent: sdoor, at: [.18, .16, .014], bg: '#c9a96a', color: '#1a1206', size: .6 });
    K.zone('safe', { pos: [1.3, .95, .95], look: [2.3, .3, .95], fov: 50 });
    K.hot(safe, {
      name: '객실 금고', zone: 'safe', click: g => {
        if (s.safe) return;
        g.lock({ title: '객실 금고', text: '네 자리 비밀번호를 누르세요.', type: 'pad', answer: '0407', onSolve: async g => {
          s.safe = true; g.sound.play('open');
          await g.tween(sdoor.rotation, { y: -1.8 }, .9);
          g.say('금고 안에 네모난 쇠막대가 있다!'); g.give('spindle');
        } });
      }
    });
    // 동쪽 벽 액자
    K.frame(.5, .34, (c, w, h) => {
      const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#1a2a4a'); gr.addColorStop(1, '#c87a3a'); c.fillStyle = gr; c.fillRect(0, 0, w, h);
      c.fillStyle = '#111'; c.fillRect(0, h * .7, w, h * .3); for (let i = 0; i < 6; i++) c.fillRect(w * (.1 + i * .14), h * .55, w * .12, h * .17);
      c.fillStyle = '#ffd890'; c.font = "700 46px 'Noto Serif KR', serif"; c.textAlign = 'center'; c.fillText('은하호 1994', w / 2, h * .22);
    }, { at: [W / 2 - .03, 1.55, .95], rot: [0, -Math.PI / 2, 0], frameMat: brass, border: .03 });

    // ---------- 남쪽: 미닫이문, 외투, 시각표, 시계, 비상 손잡이 ----------
    const DX = -.6, DZ = D / 2;
    for (const x of [DX - .46, DX + .46]) K.box(.1, 2.1, .07, dark, { at: [x, 1.05, DZ - .035] });
    K.box(1.02, .1, .07, dark, { at: [DX, 2.08, DZ - .035] });
    K.text(['7'], .14, .14, { at: [DX, 2.26, DZ - .01], rot: [0, Math.PI, 0], bg: '#c9a04a', color: '#2a1a06', size: .8 });
    K.picture(.82, 2.02, (c, w, h) => {
      const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#3a2414'); gr.addColorStop(1, '#1a0e08'); c.fillStyle = gr; c.fillRect(0, 0, w, h);
      c.fillStyle = '#5a1a1e'; c.beginPath(); c.moveTo(w * .3, h); c.lineTo(w * .45, h * .6); c.lineTo(w * .55, h * .6); c.lineTo(w * .7, h); c.fill();
      c.fillStyle = '#ffd08a'; for (let i = 0; i < 4; i++) { c.globalAlpha = 1 - i * .2; c.beginPath(); c.arc(w * .2 + i * w * .06, h * (.32 + i * .05), 14 - i * 3, 0, 7); c.fill(); }
      c.globalAlpha = 1; c.fillStyle = '#20345a'; c.fillRect(w * .62, h * .25, w * .2, h * .2);
    }, { at: [DX, 1.01, DZ - .012], rot: [0, Math.PI, 0], emissive: .8 });
    const door = K.group({ at: [DX, 0, DZ - .1] });
    K.box(.82, 2.0, .04, veneer, { parent: door, at: [0, 1.0, 0] });
    K.box(.5, .6, .01, MAT.glow(0xf2d8a8, .5), { parent: door, at: [0, 1.45, -.024] });
    for (const y of [1.14, 1.76]) K.box(.56, .03, .02, brass, { parent: door, at: [0, y, -.028] });
    for (const x of [-.28, .28]) K.box(.03, .65, .02, brass, { parent: door, at: [x, 1.45, -.028] });
    K.box(.07, .07, .012, MAT.brass({ roughness: .5 }), { parent: door, at: [-.3, 1.0, -.026] });
    K.box(.018, .018, .02, MAT.plain(0x050505), { parent: door, at: [-.3, 1.0, -.03] });
    const knobOnDoor = K.group({ parent: door, at: [-.3, 1.0, -.035], rot: [Math.PI / 2, 0, 0] }); leverModel(K, knobOnDoor, true); knobOnDoor.visible = false;
    K.zone('door', { pos: [DX, 1.45, .45], look: [DX, 1.2, DZ], fov: 55 });
    K.hot(door, {
      name: '미닫이문', zone: 'door', click: g => { g.sound.play('thud'); g.say('안쪽 손잡이가 뽑혀 나가고 네모난 구멍만 남았다. 손가락으로는 꿈쩍도 안 한다.'); },
      use: {
        leverPart: g => { g.sound.play('wrong'); g.say('구멍에 대 보았지만 헛돈다. 가운데 네모난 축이 빠져 있다.'); },
        spindle: g => { g.sound.play('wrong'); g.say('막대만 꽂아서는 돌릴 수가 없다. 손잡이가 필요하다.'); },
        handle: async g => {
          if (s.door) return;
          s.door = true; g.take('handle'); knobOnDoor.visible = true; g.sound.play('click');
          await g.tween(knobOnDoor.rotation, { y: -.8 }, .4);
          g.sound.play('unlock'); await g.wait(.3); g.sound.play('open');
          await g.tween(door.position, { x: DX + .8 }, 1.4); g.win();
        },
      }
    });
    // 외투
    K.box(.12, .03, .03, brass, { at: [-1.45, 1.8, DZ - .02] });
    const coat = K.group({ at: [-1.45, 1.78, DZ - .1] });
    const camel = MAT.fabric('#8a6a42', 0, [1, 2]);
    K.cyl(.025, .025, .48, MAT.wood('#4a2a14'), { parent: coat, at: [0, -.05, 0], rot: [0, 0, Math.PI / 2] });
    K.rbox(.46, .9, .12, .05, camel, { parent: coat, at: [0, -.52, 0] });
    for (const sx of [-1, 1]) K.rbox(.12, .7, .12, .05, camel, { parent: coat, at: [sx * .27, -.42, -.01], rot: [0, 0, sx * .12] });
    K.box(.2, .1, .02, MAT.fabric('#6a4a2a'), { parent: coat, at: [0, -.08, -.06] });
    for (let i = 0; i < 4; i++) K.sphere(.012, MAT.plain(0x2a1a10, .4), { parent: coat, at: [.05, -.25 - i * .14, -.065] });
    for (const sx of [-1, 1]) K.box(.13, .1, .015, MAT.fabric('#7a5a36'), { parent: coat, at: [sx * .12, -.75, -.065] });
    const ticketPeek = K.box(.06, .03, .002, MAT.plain(0xe9d8a8, .9), { parent: coat, at: [.14, -.7, -.074], rot: [0, 0, .3] });
    K.zone('coat', { pos: [-1.45, 1.4, .45], look: [-1.45, 1.3, DZ], fov: 50 });
    K.hot(coat, {
      name: '외투', zone: 'coat', click: g => {
        if (s.ticket) { g.say('주머니는 이제 비어 있다.'); return; }
        s.ticket = true; ticketPeek.visible = false; g.give('ticket', true); g.sound.play('pickup');
        g.note('외투 주머니에서 나온 승차권', '<div class="big">은하호 승차권\n\n4호차 7호실\n03:40 도착</div>\n<p>도착역 이름이 적힌 부분은 찢겨 나갔다.</p>');
      }
    });
    // 시각표
    let ttURL = '';
    const tt = K.frame(.55, .7, (c, w, h) => {
      c.fillStyle = '#f1e8d0'; c.fillRect(0, 0, w, h);
      c.fillStyle = '#1e3a6a'; c.fillRect(0, 0, w, h * .15);
      c.fillStyle = '#fff'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = "700 64px 'Noto Serif KR', serif"; c.fillText('은하호 시각표', w / 2, h * .075);
      c.fillStyle = '#333'; c.font = "700 40px 'Noto Sans KR', sans-serif";
      [['역', .2], ['부호', .52], ['도착', .82]].forEach(([t, x]) => c.fillText(t, w * x, h * .2));
      const rows = [['서울', 'SEO', '22:00 출발'], ['대전', 'DJN', '23:48'], ['김천', 'GCN', '01:12'], ['동대구', 'DDG', '02:25'], ['밀양', 'MYG', '03:40'], ['부산', 'BSN', '04:30']];
      rows.forEach((r, i) => {
        const y = h * (.29 + i * .115);
        c.fillStyle = i % 2 ? '#e6dcc0' : '#f1e8d0'; c.fillRect(0, y - h * .055, w, h * .11);
        c.fillStyle = '#1a1a1a'; c.font = "700 50px 'Noto Sans KR', sans-serif";
        c.fillText(r[0], w * .2, y); c.fillStyle = '#8a1a1a'; c.fillText(r[1], w * .52, y); c.fillStyle = '#1a1a1a'; c.font = "700 42px 'Noto Sans KR', sans-serif"; c.fillText(r[2], w * .82, y);
      });
      ttURL = c.canvas.toDataURL();
    }, { at: [.95, 1.45, DZ - .03], rot: [0, Math.PI, 0], frameMat: brass, border: .03, res: 768 });
    K.zone('timetable', { pos: [.95, 1.45, .55], look: [.95, 1.45, DZ], fov: 45 });
    K.hot(tt, { name: '시각표', goto: 'timetable', click: g => g.note('은하호 시각표', `<img src="${ttURL}" style="width:100%;max-width:340px;display:block;margin:auto">`) });
    // 시계 (03:22, 초침이 돈다)
    const clock = K.group({ at: [1.9, 1.95, DZ - .03], rot: [0, Math.PI, 0] });
    K.cyl(.13, .13, .03, brass, { parent: clock, rot: [Math.PI / 2, 0, 0] });
    K.picture(.22, .22, (c, w) => {
      const m = w / 2; c.fillStyle = '#f4eedc'; c.beginPath(); c.arc(m, m, m - 2, 0, 7); c.fill();
      c.fillStyle = '#222'; c.font = "700 54px 'Noto Sans KR', sans-serif"; c.textAlign = 'center'; c.textBaseline = 'middle';
      for (let i = 1; i <= 12; i++) { const a = i / 12 * Math.PI * 2; c.fillText(String(i), m + Math.sin(a) * m * .75, m - Math.cos(a) * m * .75); }
    }, { parent: clock, at: [0, 0, .017] });
    const hand = (len, wd, ang) => { const p = K.group({ parent: clock, at: [0, 0, .02], rot: [0, 0, -ang] }); K.box(wd, len, .004, MAT.plain(0x111111, .4), { parent: p, at: [0, len / 2 - .01, 0] }); return p; };
    hand(.06, .01, (3 + 22 / 60) / 12 * Math.PI * 2); hand(.09, .007, 22 / 60 * Math.PI * 2);
    const sec = hand(.095, .003, 0); sec.children[0].material = MAT.plain(0xc81e1e, .4);
    K.onUpdate((dt, t) => { sec.rotation.z = -Math.floor(t) / 60 * Math.PI * 2; });
    K.hot(clock, { name: '시계', text: '새벽 3시 22분. 다음 역까지 얼마 남지 않았다.' });
    // 비상 정지 손잡이
    const em = K.group({ at: [1.9, 1.3, DZ - .03], rot: [0, Math.PI, 0] });
    K.box(.24, .3, .05, MAT.plain(0xb01818, .5, .2), { parent: em });
    K.text(['비상 정지'], .2, .06, { parent: em, at: [0, .1, .026], bg: '#f2e8d0', color: '#a01010', size: .6 });
    K.box(.14, .03, .05, MAT.silver(), { parent: em, at: [0, -.04, .04] });
    K.hot(em, { name: '비상 정지 손잡이', text: '납으로 봉인돼 있다. 기차를 세운다고 이 문이 열리지는 않는다.' });

    // ---------- 움직임: 객실 흔들림, 외투·커튼 흔들림, 숟가락 ----------
    K.onUpdate((dt, t, g) => {
      const c = g.camera;
      c.position.y += Math.sin(t * 9.3) * .0018 + Math.sin(t * 2.1) * .002;
      c.position.x += Math.sin(t * 1.7) * .002;
      c.rotation.z = Math.sin(t * 1.3) * .006 + Math.sin(t * 3.7) * .002;
      coat.rotation.z = Math.sin(t * 1.3 + .4) * .04; coat.rotation.x = Math.sin(t * 2.1) * .015;
      curtains.forEach((cg, i) => { cg.rotation.z = Math.sin(t * 1.3 + i) * .025; });
      spoon.rotation.y = .5 + Math.sin(t * 23) * .03;
    });
    K.dust(150, [4.6, 2.4, 2.8], { opacity: .25 });
  },
};

// 놋쇠 문 손잡이 (withShaft: 네모 축이 끼워짐)
function leverModel(K, g, withShaft) {
  const b = K.MAT.brass();
  K.cyl(.035, .035, .015, b, { parent: g, rot: [Math.PI / 2, 0, 0] });
  K.rbox(.13, .025, .025, .01, b, { parent: g, at: [.07, 0, .02] });
  K.cyl(.012, .012, .03, b, { parent: g, at: [0, 0, .015], rot: [Math.PI / 2, 0, 0] });
  if (withShaft) K.box(.016, .016, .1, K.MAT.iron(), { parent: g, at: [0, 0, -.05] });
}

export const solution = [
  { hot: '외투' },
  { hot: '시각표' },
  { hot: '여행 가방', lock: 'MYG', wait: 1.6 },
  { hot: '신문' },
  { hot: '라디오 손잡이' }, { hot: '라디오 손잡이' }, { hot: '라디오 손잡이' },
  { hot: '객실 금고', lock: '0407', wait: 1.5 },
  { combine: ['leverPart', 'spindle'] },
  { hot: '미닫이문', item: 'handle', wait: 3 },
];
