// 2단계: 정전된 지하실
// 흐름: 철제 선반 → 빈 손전등 / 달력(빨간 동그라미 2·6·9일 「점검」) → 공구함 269 → 건전지
//       손전등+건전지 = 켜진 손전등 → 남서쪽 어두운 구석을 비추면 칠해진 화살표 ↑→→↓←
//       방향 자물쇠 보관함 → 퓨즈 → 두꺼비집에 끼움 → 전원 레버 → 불이 켜짐
//       보일러 제어판의 밸브 설정표(3시·12시·9시) → 밸브 세 개 돌리기 → 유압 철문 → 탈출
const ARROWS = ['↑', '→', '→', '↓', '←'];
const VALVE_GOAL = [1, 0, 3];    // 0=12시 1=3시 2=6시 3=9시
const VALVE_START = [3, 2, 1];

export default {
  title: '정전된 지하실',
  intro: '쿵— 하는 소리와 함께 모든 불이 꺼졌다.\n눅눅한 지하실. 붉은 비상등만 깜빡인다.\n철문은 움직이지 않고, 어디선가 물이 똑똑 떨어진다.\n\n<i>어두운 곳은 빛이 있어야 보입니다.</i>',
  outro: '피스톤이 쉭 소리를 내며 철문을 밀어낸다.\n초록 비상구 불빛을 따라 계단을 오르자,\n멀리서 기적 소리가 들려온다…',
  env: .22, exposure: 1.15, bloom: .6,
  start: { pos: [0, 1.6, .7], look: [0, 1.35, -3] },

  items: {
    flashlight: { name: '빈 손전등', desc: '고무를 씌운 손전등. 뒤 뚜껑을 열어 보니 건전지 칸이 비어 있다.', model: (K, g) => torchModel(K, g, false), iconRot: [.3, -.9, .2] },
    battery: { name: '큰 건전지', desc: '묵직한 D형 건전지. 아직 힘이 남아 있는 것 같다.', model: (K, g) => { K.cyl(.035, .035, .12, K.MAT.plain(0x1d1d1f, .4, .3), { parent: g }); K.cyl(.036, .036, .04, K.MAT.plain(0xd8a21a, .35, .4), { parent: g, at: [0, .04, 0] }); K.cyl(.01, .01, .012, K.MAT.silver(), { parent: g, at: [0, .066, 0] }); } },
    torch: { name: '켜진 손전등', desc: '건전지를 넣자 노란 빛이 힘차게 뻗어 나온다. 어두운 곳을 비춰 보자.', model: (K, g) => torchModel(K, g, true), iconRot: [.3, -.9, .2] },
    fuse: { name: '유리관 퓨즈', desc: '양 끝이 놋쇠인 유리관 퓨즈. 「30A」라고 찍혀 있다.', model: (K, g) => fuseModel(K, g) },
  },
  combos: [['flashlight', 'battery', 'torch']],

  hints: [
    { when: (s, g) => !g.has('flashlight') && !g.has('torch'), text: ['어둠 속에서 쓸 만한 물건부터 찾아보세요.', '서쪽 벽 철제 선반을 살펴보세요.', '선반 가운데 칸의 손전등을 집으세요.'] },
    { when: s => !s.toolbox, text: ['작업대 위 빨간 공구함은 숫자 세 개 자물쇠예요. 꼬리표를 읽어 보세요.', '「이번 달 점검일」은 작업대 위 달력에 적혀 있어요.', '빨간 동그라미 날짜 2일, 6일, 9일 → 269.'] },
    { when: (s, g) => !s.battery, text: ['열린 공구함 안을 보세요.'] },
    { when: (s, g) => !g.has('torch'), text: ['가방에서 빈 손전등과 건전지를 차례로 눌러 조합하세요.'] },
    { when: s => !s.lit, text: ['켜진 손전등은 빛이 닿지 않는 곳에 써야 해요.', '남쪽 벽 왼쪽, 서쪽 벽과 만나는 구석이 유난히 어두워요.', '켜진 손전등을 고르고 남서쪽 「어두운 구석」을 누르세요.'] },
    { when: s => !s.cabinet, text: ['벽의 화살표는 보관함을 여는 순서예요.', '초록 철제 보관함은 방향 버튼 자물쇠예요. 화살표를 왼쪽부터 차례로 누르세요.', '↑ → → ↓ ← 순서로 누르세요.'] },
    { when: (s, g) => !g.has('fuse') && !s.fused, text: ['열린 보관함 안 선반을 보세요.'] },
    { when: s => !s.fused, text: ['퓨즈가 들어갈 곳은 북쪽 벽의 회색 상자, 두꺼비집이에요.', '퓨즈를 고르고 두꺼비집을 누르세요.'] },
    { when: s => !s.power, text: ['두꺼비집 오른쪽 빨간 손잡이 레버를 내리세요.'] },
    { when: s => !s.valves, text: ['철문은 유압식이에요. 보일러 밸브를 맞춰야 압력이 차요.', '밸브 위 제어판에 설정표가 떠 있어요. 노란 표시가 가리키는 방향을 맞추세요. 누를 때마다 시계 방향으로 90도.', '1번은 3시(오른쪽), 2번은 12시(위), 3번은 9시(왼쪽). 처음 상태에서 각각 두 번씩 누르면 돼요.'] },
    { text: ['문 옆 등이 초록이 됐어요. 철문을 누르세요.'] },
  ],

  build(K) {
    const { THREE, MAT, s } = K;
    const W = 7, D = 6, H = 2.8;
    const conc = MAT.concrete('#64615b'), rust = MAT.rust('#5d5a55', [1, 2]), steelPipe = MAT.metal('#7c8288', { rough: .5 });
    K.room({ w: W, d: D, h: H, floor: MAT.concrete('#5b5954'), wall: MAT.brick('#6a4434', '#8d857a'), ceil: MAT.concrete('#4f4c47'), trim: MAT.concrete('#45433f') });
    // 벽 아래쪽 시멘트 띠
    for (const [len, at, ry] of [[W, [0, .3, -D / 2 + .02], 0], [W, [0, .3, D / 2 - .02], Math.PI], [D, [-W / 2 + .02, .3, 0], Math.PI / 2], [D, [W / 2 - .02, .3, 0], -Math.PI / 2]]) K.box(len, .6, .03, conc, { at, rot: [0, ry, 0] });
    // 천장 들보
    for (const x of [-1.8, 1.8]) K.box(.25, .22, D, MAT.concrete('#57544f'), { at: [x, H - .11, 0] });

    // ---------- 빛 ----------
    const hemi = new THREE.HemisphereLight(0x7d8aa6, 0x2a2119, .8); K.scene.add(hemi);
    // 천장 형광등 (정전이라 꺼져 있음)
    const tubeMats = [];
    for (const [x, z] of [[-1.1, -.7], [1.1, .9]]) {
      const f = K.group({ at: [x, H - .07, z] });
      K.box(1.3, .05, .2, MAT.metal('#8a8e92', { rough: .5 }), { parent: f });
      const m = MAT.glow(0xeaf4ff, 0); tubeMats.push(m);
      for (const dz of [-.05, .05]) K.cyl(.018, .018, 1.2, m, { parent: f, at: [0, -.045, dz], rot: [0, 0, Math.PI / 2], shadow: false });
    }
    const mainA = K.point(0xe6f0ff, 0, 10, { at: [-1.1, H - .35, -.7], shadow: true });
    const mainB = K.point(0xe6f0ff, 0, 9, { at: [1.1, H - .35, .9] });
    // 작업대 위 희미한 전구 (따로 전지로 켜진 작업등)
    const bulbAt = [W / 2 - .9, H - .78, 1.15];
    K.cyl(.006, .006, .7, MAT.plain(0x111111), { at: [bulbAt[0], H - .35, bulbAt[2]] });
    K.lathe([[.025, 0], [.06, -.03], [.15, -.13], [.16, -.14]], MAT.plain(0x2f4a3a, .5, .3, { side: THREE.DoubleSide }), { at: [bulbAt[0], H - .68, bulbAt[2]] });
    const bulbMat = MAT.glow(0xffc070, 3);
    K.sphere(.04, bulbMat, { at: bulbAt, shadow: false });
    const bulb = K.point(0xffb46a, 3.5, 6, { at: [bulbAt[0], bulbAt[1] - .06, bulbAt[2]], shadow: true, res: 512 });
    // 붉은 비상등 (문 왼쪽 위)
    const emMat = MAT.glow(0xff3018, 3);
    K.box(.26, .12, .1, MAT.metal('#3a3c3e'), { at: [-.6, 2.4, -D / 2 + .05] });
    K.box(.22, .08, .03, emMat, { at: [-.6, 2.4, -D / 2 + .11], shadow: false });
    const em = K.point(0xff3a20, 3, 7, { at: [-.6, 2.3, -D / 2 + .35] });
    // 높은 창으로 드는 달빛
    const hw = K.group({ at: [-1.6, 2.42, -D / 2 + .02] });
    K.plane(.7, .3, MAT.glow(0x3a5a8a, 1.2), { parent: hw });
    for (const x of [-.24, -.08, .08, .24]) K.cyl(.01, .01, .3, MAT.iron(), { parent: hw, at: [x, 0, .03] });
    K.box(.78, .04, .1, conc, { parent: hw, at: [0, -.17, .04] });
    K.spot(0x8fb0ff, 5, 7, [-1.1, 0, -.6], { at: [-1.6, 2.35, -2.8], angle: .45, penumbra: .7 });

    // 매 화면: 전구 떨림, 비상등 깜빡임
    let blink = 0;
    K.onUpdate((dt, t) => {
      bulb.intensity = 3.5 * (.92 + Math.sin(t * 13) * .03 + Math.random() * .05) * (Math.random() < .004 ? .3 : 1);
      if (!s.power) {
        blink -= dt; if (blink < 0) blink = Math.random() < .012 ? .1 : 0;
        const k = blink > 0 ? .15 : .7 + Math.sin(t * 2.6) * .3;
        em.intensity = 3.2 * k; emMat.emissiveIntensity = 3 * k;
      } else { em.intensity = 0; emMat.emissiveIntensity = .2; }
    });

    // ---------- 천장 배관 ----------
    const pipeX = (r, mat, y, z, x0 = -W / 2, x1 = W / 2) => K.cyl(r, r, x1 - x0, mat, { at: [(x0 + x1) / 2, y, z], rot: [0, 0, Math.PI / 2] });
    const pipeZ = (r, mat, x, y, z0, z1) => K.cyl(r, r, z1 - z0, mat, { at: [x, y, (z0 + z1) / 2], rot: [Math.PI / 2, 0, 0] });
    const pipeY = (r, mat, x, z, y0, y1) => K.cyl(r, r, y1 - y0, mat, { at: [x, (y0 + y1) / 2, z] });
    pipeX(.055, rust, 2.55, -2.72); pipeX(.035, steelPipe, 2.42, -2.55);
    pipeZ(.06, rust, 3.22, 2.5, -D / 2, D / 2); pipeZ(.04, steelPipe, -2.9, 2.6, -D / 2, D / 2);
    for (const x of [-3, -1.5, 0, 1.5, 3]) { K.box(.04, .2, .3, MAT.iron(), { at: [x, 2.62, -2.65] }); K.torus(.06, .012, MAT.iron(), { at: [x, 2.55, -2.72], rot: [0, Math.PI / 2, 0] }); }
    for (const z of [-2, 0, 2]) K.torus(.065, .012, MAT.iron(), { at: [3.22, 2.5, z] });
    // 물방울 + 웅덩이
    const puddle = K.cyl(.45, .45, .004, MAT.plain(0x15181b, .04, .3), { at: [-1.4, .003, -2.45], scale: [1.4, 1, .8] });
    K.hot(puddle, { name: '물웅덩이', text: '천장 배관에서 물이 똑똑 떨어진다. 차갑다.' });
    const drop = K.sphere(.012, MAT.glass(0xbfd8ff, .7), { at: [-1.4, 2.5, -2.72], shadow: false, scale: [1, 1.5, 1] }); drop.userData.noRay = true;
    const rippleMat = new THREE.MeshBasicMaterial({ color: 0x9fb4c8, transparent: true, opacity: 0, depthWrite: false });
    const ripple = K.torus(.05, .004, rippleMat, { at: [-1.4, .008, -2.72], rot: [Math.PI / 2, 0, 0], shadow: false }); ripple.userData.noRay = true;
    let dropT = 0;
    K.onUpdate(dt => {
      dropT += dt; const fall = dropT - 1.2;
      if (fall < 0) { drop.position.y = 2.49; drop.visible = true; }
      else { drop.position.y = 2.49 - 4.9 * fall * fall; if (drop.position.y < .01) { drop.visible = false; dropT = 0; ripple.scale.setScalar(.2); rippleMat.opacity = .7; } }
      ripple.scale.multiplyScalar(1 + dt * 2.2); rippleMat.opacity = Math.max(0, rippleMat.opacity - dt * .6);
    });

    // ---------- 북쪽: 유압 철문 ----------
    const DX = .3, DZ = -D / 2;
    const frameMat = MAT.metal('#3c4045', { rough: .55 });
    for (const x of [DX - .67, DX + .67]) K.box(.12, 2.22, .14, frameMat, { at: [x, 1.11, DZ + .07] });
    K.box(1.46, .14, .14, frameMat, { at: [DX, 2.15, DZ + .07] });
    K.box(2.8, .05, .06, MAT.iron(), { at: [DX - .6, 2.2, DZ + .22] });   // 문 레일
    // 문 너머 복도
    K.picture(1.2, 2.08, (c, w, h) => {
      const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#0d1311'); gr.addColorStop(1, '#232a26'); c.fillStyle = gr; c.fillRect(0, 0, w, h);
      c.fillStyle = '#1a201d'; c.beginPath(); c.moveTo(w * .2, h); c.lineTo(w * .4, h * .55); c.lineTo(w * .6, h * .55); c.lineTo(w * .8, h); c.fill();
      c.fillStyle = '#39d86a'; c.fillRect(w * .32, h * .18, w * .36, h * .08);
      c.fillStyle = '#04150a'; c.font = "700 44px 'Noto Sans KR', sans-serif"; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('비상구', w / 2, h * .22);
      for (let i = 0; i < 7; i++) { c.fillStyle = `rgba(80,110,90,${.5 - i * .06})`; c.fillRect(w * (.4 - i * .03), h * (.55 + i * .06), w * (.2 + i * .06), 6); }
    }, { at: [DX, 1.05, DZ + .015], emissive: .9 });
    const door = K.group({ at: [DX, 0, DZ + .2] });
    const doorMat = MAT.metal('#59626a', { rough: .5 });
    K.box(1.2, 2.08, .07, doorMat, { parent: door, at: [0, 1.04, 0] });
    for (const y of [.35, 1.04, 1.73]) K.box(1.16, .06, .03, frameMat, { parent: door, at: [0, y, .05] });
    for (const x of [-.55, .55]) for (let i = 0; i < 8; i++) K.sphere(.012, MAT.iron(), { parent: door, at: [x, .12 + i * .26, .04] });
    K.box(.04, .5, .05, MAT.iron(), { parent: door, at: [.48, 1.05, .07] });
    K.text(['출입구'], .4, .12, { parent: door, at: [0, 1.62, .072], bg: '#c9b53a', color: '#1a1a14', size: .6 });
    // 유압 피스톤과 표시등
    K.cyl(.07, .07, 1.0, MAT.plain(0x8a7a2a, .4, .6), { at: [DX + .1, 2.38, DZ + .2], rot: [0, 0, Math.PI / 2] });
    K.cyl(.025, .025, .6, MAT.silver(), { at: [DX - .65, 2.38, DZ + .2], rot: [0, 0, Math.PI / 2] });
    const lampMat = MAT.glow(0xff2a1a, .25);
    K.box(.12, .12, .05, MAT.iron(), { at: [1.4, 1.9, DZ + .03] });
    K.sphere(.035, lampMat, { at: [1.4, 1.9, DZ + .07], shadow: false });
    K.text(['유압 문', '보일러 압력 필요'], .34, .16, { at: [1.4, 1.68, DZ + .03], bg: '#d9d2bc', color: '#6a1010', size: .27 });
    K.hot(door, {
      name: '철문', click: async g => {
        if (s.open) return;
        if (!s.power) { g.sound.play('thud'); g.say('꿈쩍도 안 한다. 위쪽 피스톤으로 움직이는 유압식 문이다. 전기도 끊겨 있다.'); return; }
        if (!s.valves) { g.sound.play('wrong'); g.say('문 옆 등이 빨갛다. 「압력 부족 — 보일러 밸브를 확인하시오」'); return; }
        s.open = true; g.sound.play('open');
        await g.tween(door.position, { x: DX - 1.25 }, 2.2); g.win();
      }
    });

    // 두꺼비집 + 전원 레버
    const fb = K.group({ at: [-2.0, 1.45, DZ + .02] });
    const fbMat = MAT.metal('#7a7f78', { rough: .6 });
    K.box(.5, .6, .14, fbMat, { parent: fb, at: [0, 0, .07] });
    K.box(.44, .54, .01, MAT.plain(0x22262a, .7), { parent: fb, at: [0, 0, .142] });
    const fbDoor = K.group({ parent: fb, at: [-.25, 0, .145], rot: [0, -1.9, 0] });
    K.box(.5, .6, .015, fbMat, { parent: fbDoor, at: [.25, 0, 0] });
    K.text(['위험'], .2, .08, { parent: fbDoor, at: [.25, .18, -.009], rot: [0, Math.PI, 0], bg: '#e2c22a', color: '#111', size: .6 });
    for (let i = 0; i < 4; i++) { K.box(.05, .1, .03, MAT.plain(0x111111, .5), { parent: fb, at: [-.15 + i * .1, .17, .16] }); K.box(.03, .035, .02, MAT.plain(0xdedede, .5), { parent: fb, at: [-.15 + i * .1, .19, .18] }); }
    for (const x of [-.06, .06]) K.box(.03, .05, .04, MAT.brass(), { parent: fb, at: [x, -.06, .16] });
    K.text(['주 퓨즈 30A'], .24, .06, { parent: fb, at: [0, -.16, .148], bg: '#efe8d0', color: '#222', size: .6 });
    const fuseIn = K.group({ parent: fb, at: [0, -.06, .17], rot: [0, 0, Math.PI / 2], scale: .9 }); fuseModel(K, fuseIn); fuseIn.visible = false;
    // 레버
    K.box(.08, .26, .06, MAT.iron(), { parent: fb, at: [.33, 0, .04] });
    const lev = K.group({ parent: fb, at: [.33, 0, .08] });
    K.box(.025, .25, .025, MAT.silver(), { parent: lev, at: [0, .12, 0] });
    K.sphere(.035, MAT.plain(0xb01818, .4), { parent: lev, at: [0, .25, 0] });
    K.text(['켜짐 ↓'], .1, .05, { parent: fb, at: [.33, -.18, .072], bg: '#efe8d0', color: '#222', size: .55 });
    K.zone('fuse', { pos: [-2.0, 1.5, -1.75], look: [-1.95, 1.4, -3], fov: 50 });
    K.hot(fb, {
      name: '두꺼비집', zone: 'fuse', click: g => g.say(s.fused ? '퓨즈를 끼웠다. 옆의 레버를 내리면 될 것 같다.' : '가운데 퓨즈 자리가 비어 있다. 「주 퓨즈 30A」'),
      use: { fuse: g => { s.fused = true; g.take('fuse'); fuseIn.visible = true; g.sound.play('click'); g.say('퓨즈를 딸깍 끼워 넣었다.'); } }
    });
    K.hot(lev, {
      name: '전원 레버', zone: 'fuse', click: async g => {
        if (s.power || s.levBusy) return;
        s.levBusy = true;
        if (!s.fused) {
          g.sound.play('switch'); await g.tween(lev.rotation, { x: 2.6 }, .3); g.say('철컥… 아무 일도 일어나지 않는다. 퓨즈가 빠져 있다.');
          await g.tween(lev.rotation, { x: 0 }, .4); s.levBusy = false; return;
        }
        powerOn(g);
      }
    });
    async function powerOn(g) {
      s.power = true; g.sound.play('switch');
      await g.tween(lev.rotation, { x: 2.6 }, .3);
      g.sound.play('thud');
      for (const k of [.6, 0, 1, .15, 0, .8, 0, 1]) {
        tubeMats.forEach(m => m.emissiveIntensity = k * 2.6); mainA.intensity = k * 8; mainB.intensity = k * 6;
        g.sound.play('tick'); await g.wait(.09 + Math.random() * .08);
      }
      g.tween(hemi, { intensity: 1.15 }, 1.2);
      screenOff.visible = false; screenOn.visible = true;
      lampMat.emissiveIntensity = 2.5;
      g.say('지잉— 불이 들어왔다! 보일러 제어판 화면도 켜졌다.');
      checkValves(g);
    }

    // ---------- 북동쪽: 보일러와 밸브 ----------
    const boiler = K.group({ at: [W / 2 - .65, 0, -.3] });
    K.cyl(.55, .55, 1.8, rust, { parent: boiler, at: [0, .95, 0] });
    K.cyl(.58, .6, .1, MAT.iron(), { parent: boiler, at: [0, .05, 0] });
    K.sphere(.55, rust, { parent: boiler, at: [0, 1.85, 0], scale: [1, .35, 1] });
    for (const y of [.5, 1.2, 1.75]) K.torus(.555, .02, MAT.iron(), { parent: boiler, at: [0, y, 0], rot: [Math.PI / 2, 0, 0] });
    for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; K.sphere(.012, MAT.iron(), { parent: boiler, at: [Math.cos(a) * .56, 1.2, Math.sin(a) * .56] }); }
    // 불 창 (깜빡이는 불씨)
    K.cyl(.13, .13, .05, MAT.iron(), { parent: boiler, at: [-.54, .45, 0], rot: [0, 0, Math.PI / 2] });
    const fireMat = MAT.glow(0xff6a1a, 2.5);
    K.cyl(.1, .1, .02, fireMat, { parent: boiler, at: [-.57, .45, 0], rot: [0, 0, Math.PI / 2], shadow: false });
    const fire = K.point(0xff7a2a, 1.2, 2.5, { at: [W / 2 - 1.35, .45, -.3] });
    // 압력계
    K.cyl(.14, .14, .05, MAT.brass(), { parent: boiler, at: [-.55, 1.4, 0], rot: [0, 0, Math.PI / 2] });
    K.picture(.24, .24, (c, w) => {
      const m = w / 2; c.fillStyle = '#efe9d6'; c.beginPath(); c.arc(m, m, m - 2, 0, 7); c.fill();
      c.lineWidth = 26; const arc = (a0, a1, col) => { c.strokeStyle = col; c.beginPath(); c.arc(m, m, m * .72, a0 * Math.PI / 180, a1 * Math.PI / 180); c.stroke(); };
      arc(120, 200, '#c0392b'); arc(-70, -30, '#27ae60');
      c.fillStyle = '#222'; c.font = "700 46px 'Noto Sans KR', sans-serif"; c.textAlign = 'center'; c.fillText('압력', m, m * 1.55);
    }, { parent: boiler, at: [-.578, 1.4, 0], rot: [0, -Math.PI / 2, 0] });
    const needle = K.group({ parent: boiler, at: [-.582, 1.4, 0], rot: [0, -Math.PI / 2, 0] });
    const needlePivot = K.group({ parent: needle, rot: [0, 0, 2.0] });
    K.box(.008, .09, .004, MAT.plain(0x111111, .4), { parent: needlePivot, at: [0, .04, 0] });
    K.sphere(.01, MAT.plain(0x111111, .4), { parent: needle });
    // 보일러 위 배관 + 새는 김
    pipeY(.07, rust, W / 2 - .65, -.3, 2.0, H);
    K.cyl(.1, .1, .05, MAT.iron(), { at: [W / 2 - .65, 2.3, -.3] });
    const puffs = [];
    for (let i = 0; i < 9; i++) { const m = new THREE.MeshBasicMaterial({ color: 0xdfe6ea, transparent: true, opacity: 0, depthWrite: false }); const p = K.sphere(.05, m, { at: [W / 2 - .75, 2.3, -.3], shadow: false, seg: 12 }); p.userData.noRay = true; puffs.push(p); }
    K.onUpdate((dt, t) => {
      const sp = s.valves ? 1.4 : .45;
      puffs.forEach((p, i) => {
        const k = (t * sp + i / puffs.length) % 1;
        p.position.set(W / 2 - .78 - k * .35, 2.3 + k * .25, -.3 + Math.sin(i * 3 + t) * .05);
        p.scale.setScalar(.4 + k * 2.2); p.material.opacity = .22 * (1 - k) * (s.valves ? 1.6 : 1);
      });
      const f = .8 + Math.sin(t * 9) * .1 + Math.random() * .15;
      fireMat.emissiveIntensity = 2.5 * f; fire.intensity = 1.2 * f;
    });
    K.hot(boiler, { name: '보일러', text: '낡은 기름 보일러. 불씨가 깜빡이고, 압력계 바늘은 빨간 칸에 누워 있다.' });

    // 보일러 → 북쪽 벽 밸브 배관 → 문 피스톤
    const VZ = DZ + .16;
    pipeZ(.05, steelPipe, 3.0, 1.15, VZ, -.8);
    pipeX(.05, steelPipe, 1.15, VZ, 1.15, 3.05);
    K.sphere(.07, MAT.iron(), { at: [3.0, 1.15, VZ] });
    K.sphere(.07, MAT.iron(), { at: [1.15, 1.15, VZ] });
    pipeY(.045, steelPipe, 1.15, VZ, 1.15, 2.38);
    K.sphere(.06, MAT.iron(), { at: [1.15, 2.38, VZ] });
    pipeX(.045, steelPipe, 2.38, VZ, .6, 1.15);
    const valves = [], pos = VALVE_START.slice();
    [1.7, 2.2, 2.7].forEach((x, i) => {
      K.cyl(.018, .018, .14, MAT.iron(), { at: [x, 1.15, VZ + .08], rot: [Math.PI / 2, 0, 0] });
      K.box(.12, .12, .1, MAT.iron(), { at: [x, 1.15, VZ] });
      const v = K.group({ at: [x, 1.15, VZ + .16], rot: [0, 0, -pos[i] * Math.PI / 2] });
      K.torus(.1, .016, MAT.plain(0x8a1d1a, .45, .4), { parent: v });
      for (let k = 0; k < 3; k++) K.box(.2, .014, .014, MAT.plain(0x8a1d1a, .45, .4), { parent: v, rot: [0, 0, k * Math.PI / 3] });
      K.cyl(.025, .025, .04, MAT.iron(), { parent: v, rot: [Math.PI / 2, 0, 0] });
      K.box(.026, .09, .014, MAT.plain(0xf2d23a, .4), { parent: v, at: [0, .06, .02] });
      K.cone(.024, .035, MAT.plain(0xf2d23a, .4), { parent: v, at: [0, .118, .02] });
      K.text([String(i + 1)], .1, .1, { at: [x, 1.36, DZ + .03], bg: '#e6dfc8', color: '#1a1a1a', size: .75 });
      valves.push(v);
      let busy = false;
      K.hot(v, {
        name: `${i + 1}번 밸브`, zone: 'valves', click: async g => {
          if (busy || s.valves) return;
          busy = true; g.sound.play('click');
          pos[i] = (pos[i] + 1) % 4;
          await g.tween(v.rotation, { z: v.rotation.z - Math.PI / 2 }, .35);
          busy = false; checkValves(g);
        }
      });
    });
    function checkValves(g) {
      if (!s.power || s.valves) return;
      if (pos.join() !== VALVE_GOAL.join()) return;
      s.valves = true;
      g.sound.play('magic');
      g.tween(needlePivot.rotation, { z: -.7 }, 2);
      lampMat.color.setHex(0x2aff6a); lampMat.emissive.setHex(0x2aff6a); lampMat.emissiveIntensity = 3;
      g.say('쉬이익— 배관에 압력이 차오른다. 문 옆 등이 초록으로 바뀌었다!');
    }
    // 보일러 제어판 (전기가 들어와야 켜짐)
    const panel = K.group({ at: [2.2, 1.86, DZ + .03] });
    K.box(.74, .44, .06, MAT.metal('#3a3f44', { rough: .5 }), { parent: panel });
    const screenOff = K.plane(.64, .34, MAT.plain(0x0b0f0c, .2, .3), { parent: panel, at: [0, 0, .032] });
    let chartURL = '';
    const screenOn = K.picture(.64, .34, (c, w, h) => {
      c.fillStyle = '#051a0c'; c.fillRect(0, 0, w, h);
      c.strokeStyle = '#7dff9a'; c.fillStyle = '#7dff9a'; c.lineWidth = 6;
      c.font = "700 50px 'Noto Sans KR', sans-serif"; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText('밸브 설정표 · 정상 압력', w / 2, h * .13);
      VALVE_GOAL.forEach((p, i) => {
        const cx = w * (.2 + i * .3), cy = h * .55, r = h * .25;
        c.beginPath(); c.arc(cx, cy, r, 0, 7); c.stroke();
        for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2; c.fillRect(cx + Math.cos(a) * r * .85 - 4, cy + Math.sin(a) * r * .85 - 4, 8, 8); }
        const a = (-90 + p * 90) * Math.PI / 180;
        c.lineWidth = 12; c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + Math.cos(a) * r * .7, cy + Math.sin(a) * r * .7); c.stroke(); c.lineWidth = 6;
        c.beginPath(); c.moveTo(cx + Math.cos(a) * r * .95, cy + Math.sin(a) * r * .95); c.lineTo(cx + Math.cos(a + 2.6) * r * .35 + Math.cos(a) * r * .55, cy + Math.sin(a + 2.6) * r * .35 + Math.sin(a) * r * .55); c.lineTo(cx + Math.cos(a - 2.6) * r * .35 + Math.cos(a) * r * .55, cy + Math.sin(a - 2.6) * r * .35 + Math.sin(a) * r * .55); c.fill();
        c.font = "700 46px 'Noto Sans KR', sans-serif"; c.fillText(`${i + 1}번`, cx, h * .9);
      });
      chartURL = c.canvas.toDataURL();
    }, { parent: panel, at: [0, 0, .033], emissive: 1.3, res: 1024 });
    screenOn.visible = false;
    K.zone('valves', { pos: [2.2, 1.5, -1.75], look: [2.2, 1.45, -3], fov: 52, range: .4 });
    K.hot(panel, {
      name: '보일러 제어판', zone: 'valves', click: g => {
        if (!s.power) { g.say('화면이 꺼져 있다. 전기가 없다.'); return; }
        g.note('보일러 제어판', `<img src="${chartURL}" style="width:100%;display:block">\n<p>노란 표시가 화살표 방향을 가리키도록.</p>`, 'screen');
      }
    });

    // ---------- 동쪽: 작업대, 공구함, 달력 ----------
    const wb = K.group({ at: [W / 2 - .38, 0, 1.15], rot: [0, -Math.PI / 2, 0] });
    const benchWood = MAT.wood('#6a5236', [1, 1]);
    K.rbox(1.4, .06, .7, .01, benchWood, { parent: wb, at: [0, .88, 0] });
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) K.box(.06, .85, .06, MAT.iron(), { parent: wb, at: [sx * .64, .425, sz * .3] });
    K.box(1.3, .03, .6, benchWood, { parent: wb, at: [0, .25, 0] });
    K.box(.8, .6, .02, MAT.wood('#9c8460'), { parent: wb, at: [-.25, 1.35, -.35] });
    for (let i = 0; i < 6; i++) for (let j = 0; j < 4; j++) K.cyl(.006, .006, .021, MAT.plain(0x1a1a1a), { parent: wb, at: [-.6 + i * .14, 1.12 + j * .15, -.34], rot: [Math.PI / 2, 0, 0] });
    K.box(.04, .3, .02, MAT.plain(0x6a3a1a, .6), { parent: wb, at: [-.5, 1.4, -.32] }); K.box(.14, .05, .04, MAT.iron(), { parent: wb, at: [-.5, 1.56, -.32] });   // 망치
    K.box(.03, .26, .015, MAT.silver(), { parent: wb, at: [-.3, 1.38, -.32], rot: [0, 0, .2] });   // 스패너
    K.box(.02, .2, .02, MAT.plain(0xd0a020, .5), { parent: wb, at: [-.12, 1.38, -.32] });   // 드라이버
    // 바이스, 기름통, 걸레
    const vise = K.group({ parent: wb, at: [.5, .91, .2] });
    K.box(.16, .1, .12, MAT.plain(0x2b4a7a, .5, .4), { parent: vise, at: [0, .05, 0] }); K.cyl(.012, .012, .25, MAT.silver(), { parent: vise, at: [0, .06, .14], rot: [Math.PI / 2, 0, 0] });
    K.hot(vise, { name: '바이스', zone: 'bench', text: '단단히 조여 있다. 쓸 데는 없어 보인다.' });
    K.lathe([[0, 0], [.06, 0], [.06, .12], [.02, .16], [.008, .25], [0, .25]], MAT.plain(0x9a2a1a, .5, .5), { parent: wb, at: [.35, .91, -.15] });
    K.box(.25, .02, .18, MAT.fabric('#8a7a5a'), { parent: wb, at: [.1, .92, .18], rot: [0, .4, 0] });
    // 공구함
    const tb = K.group({ parent: wb, at: [-.3, .91, .05] });
    const tbMat = MAT.metal('#a02a22', { rough: .45, metal: .6 });
    K.box(.46, .015, .22, tbMat, { parent: tb, at: [0, .008, 0] });
    for (const z of [-.105, .105]) K.box(.46, .18, .01, tbMat, { parent: tb, at: [0, .09, z] });
    for (const x of [-.225, .225]) K.box(.01, .18, .22, tbMat, { parent: tb, at: [x, .09, 0] });
    const lid = K.group({ parent: tb, at: [0, .18, -.11] });
    K.box(.47, .04, .23, tbMat, { parent: lid, at: [0, .02, .115] });
    K.box(.18, .02, .02, MAT.iron(), { parent: lid, at: [0, .05, .115] });
    // 번호 자물쇠
    K.box(.09, .05, .02, MAT.brass(), { parent: tb, at: [0, .14, .118] });
    for (const x of [-.025, 0, .025]) K.cyl(.009, .009, .018, MAT.plain(0x222222, .4, .6), { parent: tb, at: [x, .14, .13], rot: [0, 0, Math.PI / 2] });
    K.text(['번호 = 이번 달', '점검일'], .2, .09, { parent: tb, at: [-.13, .06, .112], bg: '#efe6c8', color: '#5a1010', size: .3, rot: [0, 0, .06] });
    K.box(.43, .01, .2, MAT.plain(0x5a1a14, .6, .3), { parent: tb, at: [0, .1, 0] }); // 위 칸 받침판 (건전지가 앞판에 가리지 않게)
    const bat = K.group({ parent: tb, at: [.05, .14, 0], rot: [0, 0, Math.PI / 2] });
    K.cyl(.035, .035, .12, MAT.plain(0x1d1d1f, .4, .3), { parent: bat }); K.cyl(.036, .036, .04, MAT.plain(0xd8a21a, .35, .4), { parent: bat, at: [0, .04, 0] });
    K.box(.12, .03, .05, MAT.silver(), { parent: tb, at: [-.12, .03, -.04], rot: [0, .3, 0] });
    K.zone('bench', { pos: [1.95, 1.55, 1.15], look: [3.2, .95, 1.15], fov: 55, range: .45 });
    K.hot(tb, {
      name: '공구함', zone: 'bench', click: g => {
        if (s.toolbox) return;
        g.lock({ title: '공구함 번호 자물쇠', text: '꼬리표: 「번호 = 이번 달 점검일」', type: 'digits', answer: '269', onSolve: g => { s.toolbox = true; g.sound.play('open'); g.tween(lid.rotation, { x: -1.9 }, .8); g.say('뚜껑이 열렸다. 안에 건전지가 있다!'); } });
      }
    });
    K.hot(bat, { name: '건전지', zone: 'bench', enabled: () => s.toolbox && !s.battery, click: g => { s.battery = true; bat.visible = false; g.give('battery'); } });
    // 달력
    let calURL = '';
    const cal = K.picture(.42, .56, (c, w, h) => {
      c.fillStyle = '#f3eee2'; c.fillRect(0, 0, w, h);
      c.fillStyle = '#7a2a1a'; c.fillRect(0, 0, w, h * .2);
      c.fillStyle = '#fff'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.font = "700 110px 'Noto Serif KR', serif"; c.fillText('11월', w / 2, h * .1);
      const days = ['일', '월', '화', '수', '목', '금', '토'], cw = w / 7, top = h * .27, rh = (h - top - 20) / 5.5;
      c.font = "700 40px 'Noto Sans KR', sans-serif";
      days.forEach((d, i) => { c.fillStyle = i === 0 ? '#b02020' : '#333'; c.fillText(d, cw * (i + .5), top - 12); });
      const marks = { 2: ['점검', '#c81e1e', 1], 6: ['점검', '#c81e1e', 1], 9: ['점검', '#c81e1e', 1], 14: ['택배', '#1e4ec8', 0], 23: ['월세', '#1e4ec8', 0] };
      for (let d = 1; d <= 30; d++) {
        const i = (d - 1) % 7, r = Math.floor((d - 1) / 7), x = cw * (i + .5), y = top + 40 + r * rh;
        c.fillStyle = i === 0 ? '#b02020' : '#222'; c.font = "700 54px 'Noto Sans KR', sans-serif"; c.fillText(String(d), x, y);
        const mk = marks[d];
        if (mk) {
          c.strokeStyle = mk[1]; c.fillStyle = mk[1]; c.lineWidth = 7;
          if (mk[2]) { c.beginPath(); c.ellipse(x, y, cw * .42, rh * .36, -.1, 0, 7); c.stroke(); }
          else { c.fillRect(x - cw * .35, y + 30, cw * .7, 5); }
          c.font = "700 32px 'Noto Sans KR', sans-serif"; c.fillText(mk[0], x, y + rh * .5);
        }
      }
      c.strokeStyle = '#999'; c.lineWidth = 2; for (let r = 0; r <= 5; r++) { c.beginPath(); c.moveTo(0, top + 5 + r * rh); c.lineTo(w, top + 5 + r * rh); c.stroke(); }
      calURL = c.canvas.toDataURL();
    }, { parent: wb, at: [.42, 1.55, -.36], res: 768 });
    K.cyl(.006, .006, .02, MAT.iron(), { parent: wb, at: [.42, 1.85, -.36], rot: [Math.PI / 2, 0, 0] });
    K.zone('calendar', { pos: [2.6, 1.6, 1.57], look: [3.5, 1.55, 1.57], fov: 50 });
    K.hot(cal, { name: '달력', goto: 'calendar', click: g => g.note('벽 달력', `<img src="${calURL}" style="width:100%;max-width:340px;display:block;margin:auto">`) });

    // ---------- 서쪽: 철제 선반 ----------
    const shelf = K.shelf(1.8, 2.0, .45, MAT.metal('#5a5f66', { rough: .6 }), 4, { at: [-W / 2 + .25, 0, -.6], rot: [0, Math.PI / 2, 0] });
    const r = K.rng(21);
    for (let row = 0; row < 4; row++) {
      let x = -.8;
      while (x < .75) {
        const y = shelf.rowY(row), k = r();
        if (row === 2 && x > .05 && x < .55) { x += .1; continue; }  // 손전등 자리
        if (k < .4) { const rr = .06 + r() * .03, hh = .12 + r() * .06; K.cyl(rr, rr, hh, MAT.metal(['#7a6a3a', '#3a5a6a', '#8a8a86', '#6a2a22'][Math.floor(r() * 4)], { rough: .6 }), { parent: shelf, at: [x + rr, y + hh / 2, -.05 + r() * .1] }); x += rr * 2 + .03; }
        else if (k < .75) { const bw = .2 + r() * .15, bh = .15 + r() * .15; K.box(bw, bh, .3, MAT.plain(0x8a6a44, .9), { parent: shelf, at: [x + bw / 2, y + bh / 2, 0], rot: [0, (r() - .5) * .2, 0] }); x += bw + .03; }
        else { const gw = .05 + r() * .03; K.lathe([[0, 0], [gw, 0], [gw, .12], [gw * .6, .16], [gw * .6, .19], [0, .19]], MAT.glass(0x8a9a6a, .5), { parent: shelf, at: [x + gw, y, .05] }); x += gw * 2 + .04; }
      }
    }
    const fl = K.group({ parent: shelf, at: [.3, shelf.rowY(2) + .04, .05], rot: [0, .3, 0] }); torchModel(K, fl, false);
    K.zone('shelf', { pos: [-1.9, 1.4, -.6], look: [-3.3, 1.0, -.6], fov: 55, range: .5 });
    K.hot(shelf, { name: '철제 선반', goto: 'shelf', click: g => g.say('녹슨 깡통과 상자가 가득하다.') });
    K.hot(fl, { name: '손전등', zone: 'shelf', click: g => { fl.visible = false; g.unhot(fl); g.give('flashlight'); g.say('손전등이다! …그런데 켜지지 않는다. 건전지가 없다.'); } });

    // ---------- 남쪽: 계단, 보관함, 어두운 구석 ----------
    for (let i = 0; i < 9; i++) { const h = .3 * (i + 1); K.box(.27, h, .85, MAT.concrete('#6a6762'), { at: [W / 2 - .5 - .27 * i - .135, h / 2, D / 2 - .43] }); }
    for (let i = 0; i <= 4; i += 2) K.cyl(.015, .015, .9, MAT.iron(), { at: [W / 2 - .5 - .27 * i - .135, .3 * (i + 1) + .45, D / 2 - .86] });
    K.cyl(.02, .02, 1.62, MAT.iron(), { at: [2.325, 1.8, D / 2 - .86], rot: [0, 0, Math.atan2(1.08, 1.2)] });
    const hatch = K.box(.8, .04, .8, MAT.wood('#3a2a1a'), { at: [.75, H - .02, D / 2 - .43] });
    K.hot(hatch, { name: '막힌 뚜껑문', text: '계단 위 뚜껑문은 밖에서 무언가에 눌려 있다. 꿈쩍도 안 한다.' });

    // 초록 철제 보관함 (방향 자물쇠)
    const cab = K.group({ at: [-1.2, 0, D / 2 - .27], rot: [0, Math.PI, 0] });
    const cabMat = MAT.metal('#4f5a52', { rough: .55 });
    K.box(.72, .02, .5, cabMat, { parent: cab, at: [0, .01, 0] }); K.box(.72, .02, .5, cabMat, { parent: cab, at: [0, 1.79, 0] });
    K.box(.72, 1.8, .02, cabMat, { parent: cab, at: [0, .9, -.24] });
    for (const x of [-.35, .35]) K.box(.02, 1.8, .5, cabMat, { parent: cab, at: [x, .9, 0] });
    K.box(.68, .02, .46, cabMat, { parent: cab, at: [0, 1.0, 0] });
    const cdoor = K.group({ parent: cab, at: [-.35, .9, .255] });
    K.box(.7, 1.76, .025, MAT.metal('#5d6a60', { rough: .5 }), { parent: cdoor, at: [.35, 0, 0] });
    for (let i = 0; i < 6; i++) K.box(.4, .012, .02, MAT.iron(), { parent: cdoor, at: [.35, .7 - i * .04, .015] });
    K.picture(.16, .16, (c, w) => {
      const m = w / 2; c.fillStyle = '#c9c4b0'; c.beginPath(); c.arc(m, m, m - 3, 0, 7); c.fill();
      c.fillStyle = '#222'; c.font = "700 80px 'Noto Sans KR', sans-serif"; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText('↑', m, m * .38); c.fillText('↓', m, m * 1.62); c.fillText('←', m * .38, m); c.fillText('→', m * 1.62, m);
      c.beginPath(); c.arc(m, m, 22, 0, 7); c.fill();
    }, { parent: cdoor, at: [.58, .05, .015] });
    K.box(.03, .2, .04, MAT.iron(), { parent: cdoor, at: [.62, -.18, .03] });
    const fuseMesh = K.group({ parent: cab, at: [0, 1.04, .05], rot: [0, 0, Math.PI / 2] }); fuseModel(K, fuseMesh);
    for (const x of [-.22, .22]) K.box(.12, .18, .25, MAT.plain(0x7a6a4a, .9), { parent: cab, at: [x, 1.1, -.05] });
    K.zone('cabinet', { pos: [-1.2, 1.45, 1.55], look: [-1.2, 1.1, 3], fov: 50 });
    K.hot(cab, {
      name: '철제 보관함', zone: 'cabinet', click: g => {
        if (s.cabinet) return;
        g.lock({ title: '방향 자물쇠', text: '화살표 버튼을 순서대로 누르세요.', type: 'dirpad', answer: ARROWS, onSolve: g => { s.cabinet = true; g.sound.play('open'); g.tween(cdoor.rotation, { y: -1.9 }, 1); g.say('보관함이 열렸다. 선반에 유리관 퓨즈가 있다!'); } });
      }
    });
    K.hot(fuseMesh, { name: '퓨즈', zone: 'cabinet', enabled: g => s.cabinet && !g.has('fuse') && !s.fused, click: g => { fuseMesh.visible = false; g.give('fuse'); } });

    // 어두운 구석: 손전등을 비추면 야광 화살표가 드러남
    const corner = K.group({ at: [-2.75, 1.1, D / 2 - .02], rot: [0, Math.PI, 0] });
    K.plane(1.3, 1.5, new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }), { parent: corner });
    let arrowURL = '';
    const arrows = K.picture(1.1, .7, (c, w, h) => {
      c.strokeStyle = c.fillStyle = '#f2e04a'; c.lineCap = 'round'; c.lineJoin = 'round';
      c.font = "700 74px 'Noto Sans KR', sans-serif"; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText('보관함 ▶ 이 순서로', w / 2, h * .15);
      const step = w / (ARROWS.length + 1), L = 120;
      ARROWS.forEach((a, i) => {
        const x = step * (i + 1), y = h * .55, ang = { '↑': -Math.PI / 2, '→': 0, '↓': Math.PI / 2, '←': Math.PI }[a];
        c.save(); c.translate(x, y); c.rotate(ang); c.lineWidth = 22;
        c.beginPath(); c.moveTo(-L / 2, 0); c.lineTo(L / 2 - 20, 0); c.stroke();
        c.beginPath(); c.moveTo(L / 2 + 10, 0); c.lineTo(L / 2 - 40, -40); c.lineTo(L / 2 - 40, 40); c.closePath(); c.fill();
        c.restore();
        c.font = "700 56px 'Noto Sans KR', sans-serif"; c.fillText(String(i + 1), x, h * .88);
      });
      arrowURL = c.canvas.toDataURL();
    }, { parent: corner, at: [0, 0, .005], transparent: true, emissive: .7, res: 1024 });
    arrows.material.opacity = 0;
    // 구석 잡동사니
    K.cyl(.14, .12, .3, MAT.metal('#6a6e70', { rough: .6 }), { at: [-3.2, .15, 2.6] });
    K.cyl(.012, .012, 1.3, MAT.wood('#8a6a40'), { at: [-3.35, .65, 2.85], rot: [.15, 0, .12] });
    K.box(.5, .35, .4, MAT.plain(0x6a5434, .9), { at: [-2.4, .175, 2.7], rot: [0, .3, 0] });
    // 손전등 빛
    const torchSpot = K.spot(0xfff0c8, 0, 6, [-2.75, 1.1, 3], { at: [-2.05, 1.32, 1.7], angle: .4, penumbra: .45 });
    const beamMat = new THREE.MeshBasicMaterial({ color: 0xfff0c0, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
    const beam = K.group({ at: [-2.05, 1.32, 1.7] }); beam.lookAt(-2.75, 1.1, D / 2);
    const cone = K.cone(.62, 1.45, beamMat, { parent: beam, at: [0, 0, .725], rot: [-Math.PI / 2, 0, 0], shadow: false, seg: 40 });
    beam.userData.noRay = true; cone.userData.noRay = true;
    K.onUpdate((dt, t) => { if (s.lit) { const f = .94 + Math.sin(t * 17) * .03 + Math.random() * .03; torchSpot.intensity = 16 * f; beamMat.opacity = .07 * f; } });
    K.zone('corner', { pos: [-2.1, 1.45, 1.55], look: [-2.75, 1.15, 3], fov: 52, range: .4 });
    K.hot(corner, {
      name: '어두운 구석', zone: 'corner', click: g => {
        if (!s.lit) { g.say('너무 어둡다. 벽에 뭔가 칠해져 있는 것 같지만 보이지 않는다.'); return; }
        g.note('벽에 칠해진 화살표', `<img src="${arrowURL}" style="width:100%;display:block;background:#2a2622">`);
      },
      use: {
        flashlight: g => { g.sound.play('wrong'); g.say('딸깍, 딸깍… 건전지가 없어 켜지지 않는다.'); },
        torch: async g => {
          if (s.lit) { g.say('이미 비추고 있다.'); return; }
          s.lit = true; g.sound.play('switch'); g.select(null);
          await g.wait(.4); g.sound.play('magic');
          await g.tween(arrows.material, { opacity: 1 }, 1.2);
          g.say('벽에 노란 야광 페인트로 칠한 화살표가 드러났다!');
        },
      }
    });

    K.dust(220, [6.5, 2.7, 5.5], { opacity: .25 });
  },
};

// 손전등 모양 (옆으로 누운 모양, +x가 머리)
function torchModel(K, g, on) {
  const body = K.MAT.plain(0x2b2f36, .5, .3);
  K.cyl(.035, .035, .22, body, { parent: g, rot: [0, 0, -Math.PI / 2] });
  K.cyl(.055, .04, .07, K.MAT.plain(0x3a3f46, .4, .5), { parent: g, at: [.145, 0, 0], rot: [0, 0, -Math.PI / 2] });
  K.cyl(.05, .05, .006, on ? K.MAT.glow(0xfff1b0, 4) : K.MAT.glass(0xdde8f0, .6), { parent: g, at: [.182, 0, 0], rot: [0, 0, -Math.PI / 2] });
  K.box(.03, .012, .02, K.MAT.plain(0xc0392b, .5), { parent: g, at: [.02, .037, 0] });
  for (let i = 0; i < 5; i++) K.torus(.036, .004, body, { parent: g, at: [-.08 + i * .02, 0, 0], rot: [0, Math.PI / 2, 0] });
}
// 유리관 퓨즈 (세로)
function fuseModel(K, g) {
  K.cyl(.014, .014, .07, K.MAT.glass(0xeef4ff, .45), { parent: g });
  K.cyl(.003, .003, .07, K.MAT.silver(), { parent: g });
  for (const y of [-.042, .042]) K.cyl(.016, .016, .02, K.MAT.brass(), { parent: g, at: [0, y, 0] });
}

export const solution = [
  { hot: '달력' },
  { hot: '손전등' },
  { hot: '공구함', lock: '269' },
  { hot: '건전지' },
  { combine: ['flashlight', 'battery'] },
  { hot: '어두운 구석', item: 'torch', wait: 2.2 },
  { hot: '어두운 구석' },
  { hot: '철제 보관함', lock: ARROWS, wait: 1.4 },
  { hot: '퓨즈' },
  { hot: '두꺼비집', item: 'fuse' },
  { hot: '전원 레버', wait: 2.5 },
  { hot: '보일러 제어판' },
  { hot: '1번 밸브' }, { hot: '1번 밸브' },
  { hot: '2번 밸브' }, { hot: '2번 밸브' },
  { hot: '3번 밸브' }, { hot: '3번 밸브', wait: 1.5 },
  { hot: '철문', wait: 3 },
];
