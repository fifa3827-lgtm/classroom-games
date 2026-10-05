// 6단계: 파라오의 묘실
// 흐름: 파피루스·남쪽 벽화(네 신이 왕을 바라본다) → 네 석상을 돌려 모두 석관을 보게 → 제물상 서랍 → 마아트의 깃털
//       깃털을 저울에(동쪽 벽화: 심장과 깃털이 수평) → 받침 판이 내려감 → 숫자 석판(똬리2·활5·막대7) + 풍뎅이 왼쪽 반쪽
//       서쪽 벽 「왕의 숫자」 → 돌 감실 257 → 크기 다른 단지 넷 → 카노푸스 함(작은 것부터) ☾✶☥≋ → 풍뎅이 오른쪽 반쪽
//       반쪽 둘 조합 → 황금 풍뎅이 → 석관 홈 → 뚜껑이 미끄러지고 북쪽 돌문이 내려감 → 통로로 탈출
const SYMS = ['☥', '☼', '☾', '✶', '≋', '◬', '♁'];
const JAR_ANSWER = ['☾', '✶', '☥', '≋'];
const SARC = [0, -.6];   // 석관 가운데 (x, z)
const INK = ['#1f3f6e', '#8e2a1c', '#1a140c', '#2f6b4a', '#1f3f6e', '#1a140c'];

export default {
  title: '파라오의 묘실',
  intro: '모래 냄새와 송진 냄새. 횃불이 일렁이는 돌방이다.\n들어온 통로는 무너져 막혔다.\n벽마다 그림 글자가 빼곡하고, 한가운데 검은 석관이 놓여 있다.\n\n<i>제물상 위에 낡은 파피루스가 펼쳐져 있다.</i>',
  outro: '돌문이 땅속으로 가라앉고, 서늘한 바람이 불어온다.\n좁은 통로 끝에 별빛이 보인다.\n모래 언덕 너머, 바다 냄새가 실려 온다…',
  env: .3, exposure: 1.05, bloom: .55, bg: 0x070504,
  start: { pos: [0, 1.6, 1.9], look: [0, 1.2, -2] },

  items: {
    feather: { name: '마아트의 깃털', desc: '진실의 여신이 꽂고 다니던 하얀 타조 깃털. 거의 무게가 없다.', model: (K, g) => { K.sphere(.05, K.MAT.plain(0xf4efe2, .8), { parent: g, scale: [.6, 4, .15] }); K.cyl(.005, .005, .42, K.MAT.plain(0xcfc4a8), { parent: g }); }, iconRot: [0, 0, .5] },
    scarabL: { name: '풍뎅이 왼쪽 반쪽', desc: '금으로 된 풍뎅이의 왼쪽 절반. 나머지 반쪽이 어딘가 있을 것이다.', model: (K, g) => halfScarab(K, g, 0) },
    scarabR: { name: '풍뎅이 오른쪽 반쪽', desc: '금으로 된 풍뎅이의 오른쪽 절반. 날개에 청록 돌이 박혀 있다.', model: (K, g) => halfScarab(K, g, Math.PI) },
    scarab: { name: '황금 풍뎅이', desc: '두 반쪽이 딸깍 맞물렸다. 다시 떠오르는 해를 뜻하는 성스러운 풍뎅이.', model: (K, g) => fullScarab(K, g) },
  },
  combos: [['scarabL', 'scarabR', 'scarab']],

  hints: [
    { when: s => !s.statues, text: ['제물상 위 파피루스와 그 위 남쪽 벽화를 보세요.', '석상을 누르면 받침 위에서 90도씩 돌아요. 벽화처럼 네 신이 모두 석관(왕)을 바라보게 하세요.', '부리·주둥이가 석관을 향하면 돼요. 처음 상태에서 호루스 2번, 아누비스 1번, 토트 3번, 바스테트 1번.'] },
    { when: s => !s.balanced, text: ['동쪽 벽화: 심장과 깃털이 저울에서 수평을 이루고 있어요.', '저울 왼쪽 접시엔 심장이 있어요. 깃털을 고르고 저울을 누르세요.'] },
    { when: s => !s.naos, text: ['저울 받침에서 나온 석판의 그림은 숫자예요.', '서쪽 벽 「왕의 숫자」 그림을 보세요. 막대=1, 활(∩)=10, 똬리=100.', '똬리 2개 + 활 5개 + 막대 7개 = 257. 서쪽 돌 감실에 257.'] },
    { when: s => !s.chest, text: ['감실 안 단지 넷에 기호가 하나씩 있어요. 카노푸스 함 뚜껑 글씨를 읽어 보세요.', '단지를 작은 것부터 큰 것 순서로 놓고 기호를 읽어요.', '☾ ✶ ☥ ≋ 순서로 맞추세요.'] },
    { when: (s, g) => !s.lid && !g.has('scarab'), text: ['풍뎅이 반쪽이 둘이에요.', '가방에서 두 반쪽을 차례로 눌러 조합하세요.'] },
    { when: s => !s.lid, text: ['석관 뚜껑 가슴께에 풍뎅이 모양 홈이 있어요.', '황금 풍뎅이를 고르고 석관을 누르세요.'] },
    { text: ['북쪽 돌문이 내려갔어요. 어두운 통로를 누르세요.'] },
  ],

  build(K) {
    const { THREE, MAT, s } = K;
    const W = 7, D = 7, H = 3.6;
    const r = K.rng(31);
    const wallC = '#c4a36c';
    const stoneDark = MAT.stone('#8a6a3a', [1, 1]);
    const gold = MAT.gold({ roughness: .3 }), iron = MAT.iron();
    const room = K.room({ w: W, d: D, h: H, floor: MAT.stone('#a08458'), wall: MAT.stone(wallC), ceil: MAT.plaster('#1d2a4a') });
    room.children.find(c => c.name === 'wall_n').visible = false;
    // 북쪽 벽은 문 구멍을 남기고 세 조각으로
    for (const [w, h, x, y] of [[2.85, H, -2.075, H / 2], [2.85, H, 2.075, H / 2], [1.3, H - 2.3, 0, 2.3 + (H - 2.3) / 2]]) K.plane(w, h, MAT.stone(wallC, [w / 2, h / 2]), { at: [x, y, -D / 2] });

    // ---------- 빛 ----------
    K.scene.add(new THREE.HemisphereLight(0xffe2b8, 0x3a2614, .95));
    K.point(0xffc888, 6, 12, { at: [0, 3.1, .6], shadow: true, res: 1024 });
    const flames = [];
    K.onUpdate((dt, t) => flames.forEach(([a, b, l, p, base]) => {
      const k = .85 + Math.sin(t * 10 + p) * .08 + Math.sin(t * 23 + p) * .05 + Math.random() * .06;
      a.scale.set(1, k, 1); b.scale.set(1, k * 1.05, 1); if (l) l.intensity = base * k;
    }));
    function fire(parent, at, size, light) {
      const f1 = K.cone(.06 * size, .22 * size, MAT.glow(0xff8a2a, 5, { transparent: true, opacity: .9 }), { parent, at, shadow: false });
      const f2 = K.cone(.035 * size, .16 * size, MAT.glow(0xffd070, 7), { parent, at: [at[0], at[1] - .02 * size, at[2]], shadow: false });
      f1.userData.noRay = f2.userData.noRay = true;
      const l = light ? K.point(0xff9a40, light, 6, { parent, at: [at[0], at[1] + .12, at[2] + .05] }) : null;
      flames.push([f1, f2, l, Math.random() * 10, light]);
    }
    function torch(x, z, ry) {
      const t = K.group({ at: [x, 2.0, z], rot: [0, ry, 0] });
      K.box(.1, .28, .04, iron, { parent: t, at: [0, -.15, .02] });
      K.box(.04, .04, .2, iron, { parent: t, at: [0, -.2, .11] });
      K.cone(.06, .34, MAT.wood('#3a2410'), { parent: t, at: [0, -.07, .2], rot: [Math.PI, 0, 0] });
      K.cyl(.07, .06, .09, iron, { parent: t, at: [0, .12, .2] });
      fire(t, [0, .27, .2], 1.1, 1.7);
    }
    torch(3.47, -1.6, -Math.PI / 2); torch(-3.47, 1.7, Math.PI / 2);
    torch(-1.9, 3.47, Math.PI); torch(1.9, 3.47, Math.PI);
    torch(-1.25, -3.47, 0); torch(1.25, -3.47, 0);
    // 화로 둘
    for (const x of [-1.5, 1.5]) {
      const b = K.group({ at: [x, 0, .9] });
      for (let i = 0; i < 3; i++) { const a = i / 3 * Math.PI * 2; K.cyl(.015, .02, .8, MAT.brass(), { parent: b, at: [Math.sin(a) * .12, .4, Math.cos(a) * .12], rot: [Math.cos(a) * .15, 0, -Math.sin(a) * .15] }); }
      K.lathe([[0, 0], [.2, .02], [.24, .12], [.22, .13], [0, .06]], MAT.brass({ side: THREE.DoubleSide }), { parent: b, at: [0, .78, 0] });
      K.sphere(.13, MAT.glow(0xff6a1a, 2), { parent: b, at: [0, .86, 0], scale: [1, .35, 1], shadow: false });
      fire(b, [0, 1.0, 0], 1.8, 2.6);
      fire(b, [.07, .96, .05], 1.2, 0);
    }

    // ---------- 그림 벽 ----------
    // 별 천장
    K.picture(W, D, (g, w, h) => {
      g.fillStyle = '#16244a'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#e8c45a';
      for (let y = 30; y < h; y += 56) for (let x = 30 + (y / 56 % 2) * 28; x < w; x += 56) star(g, x, y, 12);
      g.strokeStyle = '#c99a3a'; g.lineWidth = 10; g.strokeRect(5, 5, w - 10, h - 10);
    }, { at: [0, H - .01, 0], rot: [Math.PI / 2, 0, 0], res: 1024 });
    // 위쪽 그림 글자 띠
    const band = (g, w, h) => { sandstone(g, w, h, r, '#d6b57a'); g.fillStyle = '#1f3f6e'; g.fillRect(0, 0, w, 10); g.fillRect(0, h - 10, w, 10); g.fillStyle = '#8e2a1c'; g.fillRect(0, 12, w, 5); g.fillRect(0, h - 17, w, 5); for (let x = 30; x < w; x += 44) glyph(g, Math.floor(r() * 10), x, h / 2, 1.05, INK[Math.floor(r() * INK.length)]); };
    for (const [len, at, ry] of [[W, [0, 3.25, -D / 2 + .01], 0], [W, [0, 3.25, D / 2 - .01], Math.PI], [D, [-W / 2 + .01, 3.25, 0], Math.PI / 2], [D, [W / 2 - .01, 3.25, 0], -Math.PI / 2]]) K.picture(len, .45, band, { at, rot: [0, ry, 0], res: 2048 });
    // 아래 띠
    for (const [len, at, ry] of [[W, [0, .3, D / 2 - .01], Math.PI], [D, [-W / 2 + .01, .3, 0], Math.PI / 2], [D, [W / 2 - .01, .3, 0], -Math.PI / 2], [2.85, [-2.075, .3, -D / 2 + .01], 0], [2.85, [2.075, .3, -D / 2 + .01], 0]]) K.box(len, .6, .02, stoneDark, { at, rot: [0, ry, 0] });

    // 북쪽: 돌문, 날개 달린 해, 글자 기둥
    for (const x of [-.83, .83]) K.box(.36, 2.6, .4, stoneDark, { at: [x, 1.3, -3.35] });
    K.box(2.1, .4, .45, stoneDark, { at: [0, 2.5, -3.35] });
    K.picture(2.4, .62, (g, w, h) => {
      g.clearRect(0, 0, w, h);
      for (const sgn of [-1, 1]) for (let i = 0; i < 5; i++) {
        g.fillStyle = ['#1f3f6e', '#2f6b4a', '#c99a3a', '#8e2a1c', '#1f3f6e'][i];
        g.beginPath(); g.moveTo(w / 2 + sgn * 70, h * .35 + i * 14); g.quadraticCurveTo(w / 2 + sgn * w * .3, h * .1 + i * 18, w / 2 + sgn * (w * .48 - i * 40), h * .3 + i * 20); g.lineTo(w / 2 + sgn * (w * .46 - i * 40), h * .3 + i * 20 + 14); g.quadraticCurveTo(w / 2 + sgn * w * .3, h * .2 + i * 18 + 14, w / 2 + sgn * 70, h * .35 + i * 14 + 14); g.fill();
      }
      g.fillStyle = '#b02a1a'; g.beginPath(); g.arc(w / 2, h / 2, 62, 0, 7); g.fill(); g.strokeStyle = '#e8c45a'; g.lineWidth = 8; g.stroke();
    }, { at: [0, 3.0, -3.47], transparent: true, res: 1024 });
    for (const x of [-2.1, 2.1]) K.picture(2.0, 2.3, (g, w, h) => { sandstone(g, w, h, r, '#d9bf8a'); glyphPanel(g, 20, 20, w - 40, h - 40, r, { cw: 64 }); }, { at: [x, 1.75, -3.48], res: 512 });
    const door = K.group({ at: [0, 1.15, -3.4] });
    K.box(1.3, 2.3, .26, MAT.stone('#b8955e', [1, 2]), { parent: door });
    K.picture(1.2, 2.2, (g, w, h) => {
      sandstone(g, w, h, r, '#cdb07a');
      g.strokeStyle = '#6a4a22'; g.lineWidth = 8; g.strokeRect(14, 14, w - 28, h - 28);
      g.fillStyle = '#c99a3a'; g.strokeStyle = '#c99a3a'; g.lineWidth = 26;
      g.beginPath(); g.ellipse(w / 2, h * .3, 60, 80, 0, 0, 7); g.stroke(); g.fillRect(w / 2 - 150, h * .3 + 80, 300, 34); g.fillRect(w / 2 - 17, h * .3 + 80, 34, 300);
      glyphPanel(g, 40, h * .7, w - 80, h * .27, r, { cw: 70 });
    }, { parent: door, at: [0, 0, .135], res: 512 });
    K.hot(door, { name: '돌문', click: g => { g.sound.play('thud'); g.say('거대한 돌문. 손잡이도 틈도 없다. 어딘가 장치로 움직이는 것 같다.'); } });
    // 문 너머 통로
    const corr = K.group({ at: [0, 0, -3.5] });
    const cstone = MAT.stone('#9a7a4a', [1, 2]);
    K.plane(1.3, 4, cstone, { parent: corr, at: [0, .001, -2], rot: [-Math.PI / 2, 0, 0] });
    K.plane(1.3, 4, cstone, { parent: corr, at: [0, 2.3, -2], rot: [Math.PI / 2, 0, 0] });
    K.plane(4, 2.3, cstone, { parent: corr, at: [-.65, 1.15, -2], rot: [0, Math.PI / 2, 0] });
    K.plane(4, 2.3, cstone, { parent: corr, at: [.65, 1.15, -2], rot: [0, -Math.PI / 2, 0] });
    K.picture(1.3, 2.3, (g, w, h) => {
      const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#0b1430'); gr.addColorStop(.6, '#2a3a60'); gr.addColorStop(1, '#6a5a40'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
      g.fillStyle = '#fff'; for (let i = 0; i < 40; i++) g.fillRect(r() * w, r() * h * .5, 2, 2);
      g.fillStyle = '#3a2a18'; for (let i = 0; i < 6; i++) g.fillRect(0, h * .62 + i * h * .065, w, h * .04);
    }, { parent: corr, at: [0, 1.15, -3.98], emissive: .9 });
    K.point(0x8aa0d0, 0, 5, { parent: corr, at: [0, 1.8, -3] }).name = 'corrLight';
    K.hot(corr, { name: '어두운 통로', enabled: () => !!s.doorOpen, click: g => { g.sound.play('open'); g.win(); } });

    // ---------- 동쪽: 심장의 무게 벽화 + 저울 ----------
    K.picture(2.7, 1.5, (g, w, h) => {
      sandstone(g, w, h, r, '#dcc290');
      g.strokeStyle = '#1f3f6e'; g.lineWidth = 10; g.strokeRect(8, 8, w - 16, h - 16);
      const cx = w / 2, by = h * .78;
      // 저울
      g.fillStyle = '#c99a3a'; g.fillRect(cx - 8, by - 260, 16, 260); g.fillRect(cx - 50, by - 6, 100, 12);
      g.fillRect(cx - 190, by - 262, 380, 10);
      g.strokeStyle = '#c99a3a'; g.lineWidth = 3;
      for (const sx of [-1, 1]) { const px = cx + sx * 180; g.beginPath(); g.moveTo(px, by - 254); g.lineTo(px - 40, by - 150); g.moveTo(px, by - 254); g.lineTo(px + 40, by - 150); g.stroke(); g.fillRect(px - 50, by - 152, 100, 10); }
      // 심장 (왼쪽)
      g.fillStyle = '#9a1e1e'; g.beginPath(); g.arc(cx - 190, by - 175, 14, 0, 7); g.arc(cx - 170, by - 175, 14, 0, 7); g.fill();
      g.beginPath(); g.moveTo(cx - 205, by - 170); g.lineTo(cx - 180, by - 152); g.lineTo(cx - 155, by - 170); g.fill();
      // 깃털 (오른쪽)
      g.fillStyle = '#f4efe2'; g.strokeStyle = '#1f3f6e'; g.lineWidth = 2;
      g.beginPath(); g.moveTo(cx + 180, by - 154); g.quadraticCurveTo(cx + 160, by - 200, cx + 186, by - 236); g.quadraticCurveTo(cx + 200, by - 196, cx + 180, by - 154); g.fill(); g.stroke();
      drawGod(g, cx - 330, by, 1.05, 'jackal', false);
      drawGod(g, cx + 340, by, 1.05, 'ibis', true);
      g.fillStyle = '#5a1e10'; g.font = "900 54px 'Noto Serif KR'"; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText('심장과 깃털이 수평을 이룰 때', cx, h * .1 + 20);
      g.fillText('저울은 비밀을 내어 준다', cx, h * .9);
    }, { at: [W / 2 - .01, 1.95, .4], rot: [0, -Math.PI / 2, 0], res: 1024 });
    const scale = K.group({ at: [2.95, 0, .4], rot: [0, -Math.PI / 2, 0] });
    K.box(.9, .7, .45, MAT.stone('#b8955e', [1, 1]), { parent: scale, at: [0, .35, 0] });
    K.box(.96, .06, .5, stoneDark, { parent: scale, at: [0, .72, 0] });
    const plaque = K.picture(.5, .3, drawNumberPlaque, { parent: scale, at: [0, .42, .229] });
    const panel = K.box(.7, .5, .04, MAT.stone('#a8885a', [1, 1]), { parent: scale, at: [0, .38, .25] });
    K.cyl(.05, .07, .95, gold, { parent: scale, at: [0, 1.2, 0] });
    K.sphere(.05, gold, { parent: scale, at: [0, 1.7, 0] });
    const beam = K.group({ parent: scale, at: [0, 1.62, 0] });
    K.box(1.0, .035, .035, gold, { parent: beam });
    for (const x of [-.5, .5]) K.sphere(.03, gold, { parent: beam, at: [x, 0, 0] });
    const pans = [-.45, .45].map(x => {
      const p = K.group({ parent: scale, at: [x, 1.17, 0] });
      K.cyl(.15, .1, .03, gold, { parent: p });
      for (let k = 0; k < 3; k++) {
        const a = k / 3 * Math.PI * 2, rim = new THREE.Vector3(Math.cos(a) * .13, 0, Math.sin(a) * .13), top = new THREE.Vector3(0, .45, 0);
        const rod = K.cyl(.004, .004, rim.distanceTo(top), gold, { parent: p });
        rod.position.copy(rim.clone().add(top).multiplyScalar(.5));
        rod.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), top.clone().sub(rim).normalize());
      }
      p.userData.x = x; return p;
    });
    const heart = K.group({ parent: pans[0], at: [0, .06, 0] });
    const hm = MAT.plain(0x9a1e1e, .35, .1);
    K.sphere(.045, hm, { parent: heart, at: [-.03, .03, 0] }); K.sphere(.045, hm, { parent: heart, at: [.03, .03, 0] });
    K.cone(.065, .08, hm, { parent: heart, at: [0, -.02, 0], rot: [Math.PI, 0, 0] });
    const featherMesh = K.group({ parent: pans[1], at: [0, .03, 0], rot: [0, 0, Math.PI / 2 - .2] });
    K.sphere(.04, MAT.plain(0xf4efe2, .8), { parent: featherMesh, scale: [.6, 3.5, .15] });
    featherMesh.visible = false;
    let ang = .22;
    K.onUpdate((dt, t) => {
      if (!s.balanced) ang = .22 + Math.sin(t * 1.3) * .012;
      else ang += (Math.sin(t * 2) * .01 * Math.exp(-(t - s.balT)) - ang) * Math.min(1, dt * 1.5);
      beam.rotation.z = ang;
      for (const p of pans) { const x = p.userData.x; p.position.x = x * Math.cos(ang); p.position.y = 1.62 + x * Math.sin(ang) - .45; }
    });
    K.zone('scale', { pos: [1.5, 1.5, .4], look: [3.0, 1.15, .4], fov: 58, range: .5 });
    K.hot(scale, {
      name: '저울', goto: 'scale',
      click: g => g.say(s.balanced ? '심장과 깃털이 나란히 수평을 이루었다.' : '왼쪽 접시에 붉은 돌 심장이 놓여 있다. 오른쪽 접시는 비어 있고, 저울은 심장 쪽으로 기울어 있다.'),
      use: {
        feather: async g => {
          if (s.balanced) return;
          s.balanced = true; s.balT = g.clock.elapsedTime; g.take('feather'); featherMesh.visible = true;
          g.sound.play('magic'); g.say('깃털을 올려놓자 저울이 천천히… 수평을 이룬다.');
          await g.wait(2.2);
          g.sound.play('open'); await g.tween(panel.position, { y: -.3 }, 1.0);
          s.panel = true; g.give('scarabL'); g.say('받침의 돌판이 내려갔다. 숫자 석판과 금 풍뎅이 반쪽이 있다!');
        },
      },
    });
    K.hot(plaque, { name: '저울 받침 석판', zone: 'scale', enabled: () => !!s.panel, click: g => imgNote(g, '저울 받침 석판', 512, 307, drawNumberPlaque, '그림 기호가 새겨져 있다. 무슨 수를 뜻하는 걸까?') });

    // ---------- 남쪽: 네 신 벽화 + 제물상 ----------
    K.picture(3.0, 1.35, (g, w, h) => {
      sandstone(g, w, h, r, '#dcc290');
      g.strokeStyle = '#8e2a1c'; g.lineWidth = 10; g.strokeRect(8, 8, w - 16, h - 16);
      const cx = w / 2, by = h * .84;
      // 사자 침상과 왕
      g.fillStyle = '#c99a3a'; g.fillRect(cx - 150, by - 70, 300, 18); g.fillRect(cx - 140, by - 52, 14, 52); g.fillRect(cx + 126, by - 52, 14, 52);
      g.beginPath(); g.arc(cx + 150, by - 82, 18, 0, 7); g.fill();
      g.fillStyle = '#f2ead6'; g.beginPath(); g.ellipse(cx - 10, by - 92, 130, 22, 0, 0, 7); g.fill();
      g.fillStyle = '#d0a030'; g.beginPath(); g.ellipse(cx - 125, by - 98, 26, 22, 0, 0, 7); g.fill();
      g.fillStyle = '#1f3f86'; g.fillRect(cx - 150, by - 112, 18, 30);
      drawGod(g, cx - 430, by, .9, 'falcon', false);
      drawGod(g, cx - 280, by, .9, 'jackal', false);
      drawGod(g, cx + 280, by, .9, 'ibis', true);
      drawGod(g, cx + 430, by, .9, 'cat', true);
      g.fillStyle = '#5a1e10'; g.font = "900 50px 'Noto Serif KR'"; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText('네 신이 모두 왕을 바라볼 때', cx, 55);
      g.fillText('제물상이 열린다', cx, 110);
      g.font = "700 28px 'Noto Sans KR'"; g.fillStyle = '#3a2410';
      [['호루스', -430], ['아누비스', -280], ['토트', 280], ['바스테트', 430]].forEach(([n, x]) => g.fillText(n, cx + x, by + 28));
    }, { at: [0, 2.15, D / 2 - .01], rot: [0, Math.PI, 0], res: 1024 });
    const table = K.group({ at: [0, 0, 2.95], rot: [0, Math.PI, 0] });
    K.box(1.5, .1, .75, MAT.stone('#b8955e', [1, 1]), { parent: table, at: [0, .78, 0] });
    K.box(1.3, .73, .55, MAT.stone('#a8885a', [1, 1]), { parent: table, at: [0, .365, -.05] });
    const drawer = K.group({ parent: table, at: [0, .55, .23] });
    K.box(.6, .16, .04, stoneDark, { parent: drawer, at: [0, 0, .02] });
    K.box(.56, .12, .4, MAT.stone('#8a6a3a', [1, 1]), { parent: drawer, at: [0, -.01, -.18] });
    K.cyl(.035, .035, .02, gold, { parent: drawer, at: [0, 0, .045], rot: [Math.PI / 2, 0, 0] });
    const featherIn = K.group({ parent: drawer, at: [0, .06, -.15], rot: [Math.PI / 2, 0, Math.PI / 2] });
    K.sphere(.04, MAT.plain(0xf4efe2, .8), { parent: featherIn, scale: [.6, 3.5, .15] });
    // 제물들
    const offer = K.group({ parent: table, at: [0, .83, 0] });
    K.lathe([[0, 0], [.16, .01], [.2, .07], [.21, .08]], MAT.plain(0x2f6b6a, .4, .1, { side: THREE.DoubleSide }), { parent: offer, at: [.35, 0, -.1] });
    for (const [x, z] of [[.3, -.12], [.4, -.07], [.35, -.2], [.42, -.15]]) K.sphere(.045, MAT.plain(0x8e1f1f, .5), { parent: offer, at: [x, .07, z] });
    for (const [x, z, a] of [[-.05, -.2, .3], [.1, -.25, -.4]]) K.sphere(.07, MAT.plain(0xb07a3a, .85), { parent: offer, at: [x, .04, z], scale: [1.5, .6, 1], rot: [0, a, 0] });
    K.lathe([[0, 0], [.06, 0], [.08, .1], [.05, .2], [.03, .24], [.045, .27], [0, .27]], MAT.plain(0xb0623a, .7), { parent: offer, at: [-.55, 0, -.2] });
    const papyrus = K.picture(.56, .34, (g, w, h) => {
      g.fillStyle = '#e6d3a0'; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 80; i++) { g.fillStyle = `rgba(120,90,40,${r() * .15})`; g.fillRect(0, r() * h, w, 1 + r() * 2); }
      g.fillStyle = '#5a1e10'; g.font = "900 34px 'Noto Serif KR'"; g.textAlign = 'center'; g.fillText('왕의 묘실에 든 자여', w / 2, 44);
      glyphPanel(g, 20, 64, w - 40, h - 84, r, { cw: 40 });
    }, { parent: table, at: [-.2, .832, .12], rot: [-Math.PI / 2, 0, 0] });
    K.zone('table', { pos: [0, 1.55, 1.75], look: [0, .85, 2.95], fov: 55, range: .5 });
    K.hot(papyrus, {
      name: '파피루스', zone: 'table', click: g => g.note('낡은 파피루스', '<b>왕의 묘실에 든 자여, 들으라.</b>\n\n하나, <b>네 신이 모두 왕을 바라보게</b> 하라.\n  제물상이 진실의 깃털을 내어 주리라.\n둘, 심장과 깃털을 <b>저울</b>에 올려 수평을 이루게 하라.\n셋, 왕의 수는 <b>옛 방식</b>으로 적혀 있다.\n넷, 둘로 쪼개진 <b>풍뎅이</b>를 하나로 하라.\n  그것이 왕의 관을 여는 열쇠다.')
    });
    K.hot(drawer, { name: '제물상 서랍', zone: 'table', click: g => g.say(s.statues ? '서랍은 비었다.' : '돌 서랍이 꽉 닫혀 있다. 손잡이를 당겨도 꿈쩍하지 않는다.') });
    K.hot(offer, { name: '제물', zone: 'table', click: g => g.say('말라붙은 빵과 석류, 기름 단지. 천 년 묵은 제물이다.') });

    // ---------- 네 석상 ----------
    s.face = [2, 3, 1, 3];
    const statues = [['호루스', 'falcon', -2.85, -2.85], ['아누비스', 'jackal', 2.85, -2.85], ['토트', 'ibis', 2.85, 2.85], ['바스테트', 'cat', -2.85, 2.85]].map(([name, head, x, z], i) => {
      const base = Math.atan2(SARC[0] - x, SARC[1] - z);
      const st = K.group({ at: [x, 0, z] });
      K.cyl(.32, .36, .5, MAT.stone('#b8955e', [1, 1]), { parent: st, at: [0, .25, 0] });
      K.cyl(.34, .34, .04, gold, { parent: st, at: [0, .5, 0] });
      K.text(name, .36, .12, { parent: st, at: [Math.sin(base) * .345, .3, Math.cos(base) * .345], rot: [0, base, 0], bg: '#d8c08a', color: '#3a1e0a', size: .62, res: 256 });
      const turn = K.group({ parent: st, at: [0, .52, 0], rot: [0, base + s.face[i] * Math.PI / 2, 0] });
      godStatue(K, turn, head);
      K.hot(st, {
        name: name + ' 석상', click: async g => {
          if (s.statues) { g.say('석상은 이제 꿈쩍도 하지 않는다.'); return; }
          if (s.turning) return;
          s.turning = true; g.sound.play('thud');
          s.face[i] = (s.face[i] + 1) % 4;
          await g.tween(turn.rotation, { y: turn.rotation.y + Math.PI / 2 }, .6);
          s.turning = false;
          if (s.face.every(f => f === 0)) {
            s.statues = true;
            await g.wait(.4); g.sound.play('unlock');
            g.say('네 신이 모두 왕을 바라본다. 남쪽에서 돌이 끌리는 소리…');
            await g.tween(drawer.position, { z: .55 }, 1);
            featherIn.visible = false; g.give('feather');
          }
        }
      });
      return st;
    });

    // ---------- 서쪽: 왕의 숫자 벽화, 돌 감실, 카노푸스 함 ----------
    const numMural = K.picture(1.3, 1.0, drawNumeralChart, { at: [-W / 2 + .01, 1.8, -1.9], rot: [0, Math.PI / 2, 0], res: 1024 });
    K.zone('numerals', { pos: [-2.0, 1.7, -1.9], look: [-3.5, 1.8, -1.9], fov: 50, range: .35 });
    K.hot(numMural, { name: '왕의 숫자 벽화', goto: 'numerals', click: g => imgNote(g, '왕의 숫자', 1024, 788, drawNumeralChart, '옛 이집트 사람들은 이렇게 수를 적었다. 같은 기호를 여러 번 그려 더한다.') });
    const naos = K.group({ at: [-3.15, 0, .2], rot: [0, Math.PI / 2, 0] });
    const ns = MAT.stone('#c9a86e', [1, 1]);
    K.box(1.24, .25, .7, stoneDark, { parent: naos, at: [0, .125, 0] });
    K.box(1.1, 1.2, .08, ns, { parent: naos, at: [0, .85, -.26] });
    for (const x of [-.51, .51]) K.box(.08, 1.2, .6, ns, { parent: naos, at: [x, .85, 0] });
    K.box(1.18, .08, .66, ns, { parent: naos, at: [0, 1.45, 0] });
    K.box(1.3, .12, .74, stoneDark, { parent: naos, at: [0, 1.55, 0] });
    K.box(.94, .02, .5, MAT.plain(0x2a1c10, .9), { parent: naos, at: [0, .26, -.02] });
    const ndoor = K.group({ parent: naos, at: [0, .85, .31] });
    K.box(.94, 1.12, .05, MAT.stone('#b8955e', [1, 1]), { parent: ndoor });
    K.picture(.86, 1.04, (g, w, h) => {
      sandstone(g, w, h, r, '#d2b47c');
      g.strokeStyle = '#6a4a22'; g.lineWidth = 8; g.strokeRect(10, 10, w - 20, h - 20);
      g.fillStyle = '#5a1e10'; g.font = "900 46px 'Noto Serif KR'"; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText('왕의 수를', w / 2, 70); g.fillText('대라', w / 2, 126);
      for (let i = 0; i < 3; i++) { g.fillStyle = '#3a2a18'; g.beginPath(); g.arc(w / 2 + (i - 1) * 110, h * .52, 44, 0, 7); g.fill(); g.strokeStyle = '#c99a3a'; g.lineWidth = 6; g.stroke(); }
      glyphPanel(g, 40, h * .68, w - 80, h * .26, r, { cw: 60 });
    }, { parent: ndoor, at: [0, 0, .026], res: 512 });
    const jarsG = K.group({ parent: naos, at: [0, .27, -.02] });
    const jarDefs = [[.39, '☥', 'human'], [.25, '☾', 'baboon'], [.46, '≋', 'jackal'], [.32, '✶', 'falcon']];
    jarDefs.forEach(([hgt, sym, head], i) => canopic(K, jarsG, [-.36 + i * .24, 0, 0], hgt, sym, head));
    const naosLight = K.point(0xffc888, 0, 2, { parent: naos, at: [0, 1.2, .2] });
    K.zone('naos', { pos: [-1.55, 1.35, .2], look: [-3.0, .85, .2], fov: 52, range: .45 });
    K.hot(naos, {
      name: '돌 감실', goto: 'naos', click: g => {
        if (s.naos) { g.say('크기가 제각각인 단지 넷. 몸통마다 기호가 하나씩 그려져 있다.'); return; }
        g.lock({
          title: '감실 돌 바퀴', text: '세 개의 돌 바퀴에 숫자가 새겨져 있다.', type: 'digits', answer: '257', onSolve: async g => {
            s.naos = true; g.sound.play('open');
            g.tween(naosLight, { intensity: 2.2 }, 1);
            await g.tween(ndoor.position, { x: 1.0 }, 1.2);
            g.say('감실 안에 크기가 저마다 다른 단지 네 개가 서 있다.');
          }
        });
      }
    });
    const chest = K.group({ at: [-2.5, 0, 1.4], rot: [0, Math.PI / 2, 0] });
    const cw = MAT.wood('#5a3a1c', [1, 1]);
    K.box(.6, .34, .4, cw, { parent: chest, at: [0, .2, 0] });
    for (const x of [-.27, .27]) K.box(.05, .4, .44, gold, { parent: chest, at: [x, .2, 0] });
    for (const [x, z] of [[-.27, -.17], [.27, -.17], [-.27, .17], [.27, .17]]) K.box(.05, .04, .05, gold, { parent: chest, at: [x, .02, z] });
    K.box(.5, .06, .01, MAT.plain(0x1f3f86, .5), { parent: chest, at: [0, .32, .201] });
    const clid = K.group({ parent: chest, at: [0, .37, -.2] });
    K.box(.62, .06, .42, cw, { parent: clid, at: [0, .03, .2] });
    K.picture(.56, .38, (g, w, h) => {
      g.fillStyle = '#1f3f86'; g.fillRect(0, 0, w, h); g.strokeStyle = '#d0a030'; g.lineWidth = 10; g.strokeRect(8, 8, w - 16, h - 16);
      g.fillStyle = '#f2dca6'; g.font = "900 46px 'Noto Serif KR'"; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText('작은 단지부터', w / 2, h * .36); g.fillText('큰 단지까지', w / 2, h * .66);
    }, { parent: clid, at: [0, .061, .2], rot: [-Math.PI / 2, 0, 0] });
    const slot = K.group({ parent: chest, at: [0, .2, .205] });
    K.box(.32, .1, .02, gold, { parent: slot });
    for (let i = 0; i < 4; i++) K.box(.055, .07, .01, MAT.plain(0x2a1c10, .6), { parent: slot, at: [-.11 + i * .073, 0, .012] });
    K.zone('chest', { pos: [-1.6, 1.3, 1.45], look: [-2.5, .3, 1.4], fov: 50, range: .45 });
    K.hot(chest, {
      name: '카노푸스 함', goto: 'chest', click: g => {
        if (s.chest) { g.say('함은 비었다.'); return; }
        g.lock({
          title: '카노푸스 함', text: '네 칸에 기호를 맞추세요. 뚜껑: 「작은 단지부터 큰 단지까지」', symbols: SYMS, length: 4, answer: JAR_ANSWER, onSolve: async g => {
            s.chest = true; g.sound.play('open');
            await g.tween(clid.rotation, { x: -1.6 }, .9);
            g.give('scarabR');
          }
        });
      }
    });
    // 항아리 (장식)
    for (const [x, z] of [[-2.95, -1.0], [3.0, -1.4]]) {
      const a = K.lathe([[0, 0], [.12, 0], [.2, .2], [.22, .4], [.14, .62], [.09, .68], [.11, .72], [0, .72]], MAT.plain(0x9a5a32, .8), { at: [x, 0, z] });
      K.hot(a, { name: x < 0 ? '서쪽 항아리' : '동쪽 항아리', click: g => g.say('곡식 냄새가 나는 빈 항아리.') });
    }

    // ---------- 가운데: 석관 ----------
    const sarc = K.group({ at: [SARC[0], 0, SARC[1]] });
    const granite = MAT.concrete('#2e2a27', [1, 2]);
    K.box(1.3, .22, 2.5, stoneDark, { parent: sarc, at: [0, .11, 0] });
    K.box(1.0, .08, 2.2, granite, { parent: sarc, at: [0, .26, 0] });
    for (const x of [-.46, .46]) K.box(.08, .68, 2.2, granite, { parent: sarc, at: [x, .6, 0] });
    for (const z of [-1.06, 1.06]) K.box(.84, .68, .08, granite, { parent: sarc, at: [0, .6, z] });
    for (const x of [-.505, .505]) K.picture(2.0, .5, (g, w, h) => { g.fillStyle = '#26221f'; g.fillRect(0, 0, w, h); g.fillStyle = '#c99a3a'; g.fillRect(0, 0, w, 8); g.fillRect(0, h - 8, w, 8); for (let x2 = 30; x2 < w; x2 += 44) glyph(g, Math.floor(r() * 10), x2, h / 2, 1.2, '#d0a030'); }, { parent: sarc, at: [x, .6, 0], rot: [0, x > 0 ? Math.PI / 2 : -Math.PI / 2, 0], res: 1024 });
    // 미라
    const linen = MAT.fabric('#d8ccb0', 0, [1, 3]);
    K.cyl(.2, .15, 1.6, linen, { parent: sarc, at: [0, .5, -.1], rot: [Math.PI / 2, 0, 0], scale: [1, 1, .7] });
    K.sphere(.15, linen, { parent: sarc, at: [0, .5, .78], scale: [1, .8, 1.1] });
    K.sphere(.13, gold, { parent: sarc, at: [0, .58, .8], scale: [1, .6, 1.1] });
    // 뚜껑
    const lid = K.group({ parent: sarc, at: [0, .94, 0] });
    K.rbox(1.04, .14, 2.24, .04, granite, { parent: lid, at: [0, .07, 0] });
    K.rbox(.8, .1, 1.9, .05, granite, { parent: lid, at: [0, .18, -.05] });
    K.box(.84, .03, .06, gold, { parent: lid, at: [0, .2, -.6] }); K.box(.84, .03, .06, gold, { parent: lid, at: [0, .2, -.2] });
    const face = K.group({ parent: lid, at: [0, .25, .82] });
    K.box(.5, .12, .36, MAT.plain(0x1f3f86, .4), { parent: face, at: [0, -.02, -.05] });
    for (let i = 0; i < 5; i++) K.box(.52, .125, .02, gold, { parent: face, at: [0, -.02, -.2 + i * .07] });
    K.sphere(.16, gold, { parent: face, at: [0, .06, .05], scale: [1, .6, 1.1] });
    for (const x of [-.05, .05]) K.sphere(.018, MAT.plain(0x0a0a0a, .3), { parent: face, at: [x, .14, .13] });
    K.box(.04, .03, .12, gold, { parent: face, at: [0, .08, .25] });
    for (const sgn of [-1, 1]) K.box(.06, .05, .5, gold, { parent: lid, at: [sgn * .14, .24, .35], rot: [0, sgn * .6, 0] });
    K.cyl(.09, .09, .012, MAT.plain(0x0a0806, .9), { parent: lid, at: [0, .232, .05], scale: [.75, 1, 1] });
    const scarabOn = K.group({ parent: lid, at: [0, .25, .05], rot: [0, Math.PI, 0], scale: .9 }); fullScarab(K, scarabOn);
    scarabOn.visible = false;
    K.zone('sarc', { pos: [0, 2.05, 1.15], look: [0, .9, -.3], fov: 55, range: .5 });
    const corrLight = corr.children.find(c => c.name === 'corrLight');
    K.hot(sarc, {
      name: '석관', goto: 'sarc',
      click: g => g.say(s.lid ? '천에 감긴 왕이 잠들어 있다. 편히 쉬시길.' : '검은 화강암 석관. 뚜껑 가슴께에 풍뎅이 모양 홈이 패어 있다.'),
      use: {
        scarabL: g => g.say('반쪽뿐이라 홈에 맞지 않는다.'),
        scarabR: g => g.say('반쪽뿐이라 홈에 맞지 않는다.'),
        scarab: async g => {
          if (s.lid) return;
          s.lid = true; g.take('scarab'); scarabOn.visible = true; g.sound.play('magic');
          g.say('풍뎅이가 홈에 딱 맞는다. 금빛이 번쩍인다!');
          await g.wait(1);
          g.sound.play('open');
          await g.tween(lid.position, { x: 1.05, y: 1.0 }, 1.6);
          g.say('뚜껑이 미끄러져 열렸다. 그때, 북쪽 돌문이 우르릉 가라앉는다!');
          g.sound.play('thud');
          g.tween(corrLight, { intensity: 3 }, 2);
          await g.tween(door.position, { y: -1.3 }, 2.2);
          s.doorOpen = true;
        },
      },
    });

    K.dust(220, [6.5, 3.2, 6.5], { opacity: .3, color: 0xffd8a0 });
  },
};

// ---------- 그림 도구 ----------
function star(g, x, y, R) {
  g.beginPath();
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? R * .4 : R; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
  g.fill();
}
function sandstone(g, w, h, r, base) {
  g.fillStyle = base; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 300; i++) { g.fillStyle = `rgba(${r() < .5 ? '90,60,30' : '255,240,210'},${r() * .08})`; const s = 10 + r() * 60; g.fillRect(r() * w, r() * h, s, s * (.3 + r())); }
}
// 그림 글자 하나 (가운데 x,y, 크기 s)
function glyph(g, kind, x, y, s, col) {
  g.save(); g.translate(x, y); g.scale(s, s); g.fillStyle = col; g.strokeStyle = col; g.lineWidth = 3; g.lineCap = 'round';
  g.beginPath();
  switch (kind) {
    case 0: g.ellipse(0, 0, 14, 7, 0, 0, 7); g.stroke(); g.beginPath(); g.arc(0, 0, 4, 0, 7); g.fill(); g.beginPath(); g.moveTo(-4, 7); g.lineTo(-8, 16); g.stroke(); break;            // 눈
    case 1: for (let i = 0; i <= 6; i++) g.lineTo(-15 + i * 5, i % 2 ? -4 : 4); g.stroke(); break;                                                                                   // 물
    case 2: g.ellipse(0, -8, 5, 7, 0, 0, 7); g.stroke(); g.fillRect(-10, -1, 20, 3); g.fillRect(-1.5, -1, 3, 18); break;                                                             // 앙크
    case 3: g.ellipse(0, 2, 11, 6, -.2, 0, 7); g.fill(); g.beginPath(); g.arc(9, -6, 4, 0, 7); g.fill(); g.beginPath(); g.moveTo(12, -7); g.lineTo(18, -4); g.lineTo(12, -4); g.fill(); g.fillRect(-14, 1, 8, 3); g.beginPath(); g.moveTo(0, 7); g.lineTo(-1, 15); g.moveTo(3, 7); g.lineTo(4, 15); g.stroke(); break; // 새
    case 4: g.arc(0, 0, 9, 0, 7); g.stroke(); g.beginPath(); g.arc(0, 0, 2.5, 0, 7); g.fill(); break;                                                                             // 해
    case 5: g.moveTo(0, 15); g.quadraticCurveTo(-6, 0, 0, -15); g.quadraticCurveTo(6, 0, 0, 15); g.fill(); break;                                                                   // 갈대
    case 6: g.moveTo(-15, 4); g.bezierCurveTo(-8, -8, -2, 10, 5, -2); g.lineTo(13, -6); g.stroke(); break;                                                                           // 뱀
    case 7: g.arc(0, 4, 10, Math.PI, 0); g.fill(); break;                                                                                                                          // 빵
    case 8: g.fillRect(-14, -2, 24, 5); g.beginPath(); g.arc(12, 0, 4, 0, 7); g.fill(); break;                                                                                     // 팔
    default: g.moveTo(0, 15); g.quadraticCurveTo(-7, -2, 2, -15); g.quadraticCurveTo(5, 0, 0, 15); g.fill();                                                                        // 깃털
  }
  g.restore();
}
function glyphPanel(g, x, y, w, h, r, opt = {}) {
  const cols = Math.max(1, Math.floor(w / (opt.cw ?? 46))), cw = w / cols, s = cw / 46;
  g.strokeStyle = 'rgba(60,40,20,.45)'; g.lineWidth = 2;
  for (let c = 0; c <= cols; c++) { g.beginPath(); g.moveTo(x + c * cw, y); g.lineTo(x + c * cw, y + h); g.stroke(); }
  for (let c = 0; c < cols; c++) for (let yy = y + 22 * s; yy < y + h - 16 * s; yy += 40 * s) glyph(g, Math.floor(r() * 10), x + c * cw + cw / 2, yy, s * .95, INK[Math.floor(r() * INK.length)]);
}
// 옆모습 신 (발끝 x,y, 오른쪽을 봄; flip이면 왼쪽을 봄)
function drawGod(g, x, y, s, head, flip) {
  g.save(); g.translate(x, y); g.scale(flip ? -s : s, s);
  const skin = '#8a4220', dark = '#1a1410', gold = '#d0a030', blue = '#1f3f86';
  g.fillStyle = skin;
  g.beginPath(); g.moveTo(-10, -62); g.lineTo(-2, -62); g.lineTo(-12, 0); g.lineTo(-22, 0); g.fill();
  g.beginPath(); g.moveTo(2, -62); g.lineTo(12, -62); g.lineTo(26, 0); g.lineTo(16, 0); g.fill();
  g.fillStyle = '#f2ead6'; g.beginPath(); g.moveTo(-16, -112); g.lineTo(16, -112); g.lineTo(24, -60); g.lineTo(-18, -60); g.fill();
  g.fillStyle = gold; g.fillRect(-17, -114, 34, 6);
  g.fillStyle = skin; g.beginPath(); g.moveTo(-16, -112); g.lineTo(16, -112); g.lineTo(22, -166); g.lineTo(-22, -166); g.fill();
  g.fillStyle = blue; g.beginPath(); g.ellipse(0, -164, 24, 9, 0, 0, 7); g.fill(); g.fillStyle = gold; g.beginPath(); g.ellipse(0, -168, 18, 5, 0, 0, 7); g.fill();
  g.strokeStyle = skin; g.lineWidth = 8; g.lineCap = 'round';
  g.beginPath(); g.moveTo(14, -158); g.lineTo(36, -128); g.lineTo(40, -134); g.stroke();
  g.beginPath(); g.moveTo(-14, -158); g.lineTo(-18, -118); g.stroke();
  g.strokeStyle = gold; g.lineWidth = 4; g.beginPath(); g.moveTo(42, -205); g.lineTo(42, 0); g.moveTo(42, -205); g.lineTo(52, -212); g.stroke();
  g.lineWidth = 3; g.beginPath(); g.ellipse(-18, -112, 4, 6, 0, 0, 7); g.moveTo(-26, -104); g.lineTo(-10, -104); g.moveTo(-18, -104); g.lineTo(-18, -88); g.stroke();
  if (head !== 'cat') { g.fillStyle = blue; g.beginPath(); g.moveTo(-14, -200); g.lineTo(6, -200); g.lineTo(8, -160); g.lineTo(-16, -160); g.fill(); }
  g.fillStyle = dark;
  if (head === 'falcon') { g.beginPath(); g.arc(2, -188, 15, 0, 7); g.fill(); g.beginPath(); g.moveTo(12, -194); g.lineTo(27, -184); g.lineTo(12, -180); g.fill(); g.fillStyle = '#b02a1a'; g.beginPath(); g.arc(0, -215, 13, 0, 7); g.fill(); }
  if (head === 'jackal') { g.beginPath(); g.ellipse(2, -188, 15, 12, 0, 0, 7); g.fill(); g.beginPath(); g.moveTo(10, -196); g.lineTo(38, -186); g.lineTo(36, -180); g.lineTo(10, -178); g.fill(); g.beginPath(); g.moveTo(-6, -196); g.lineTo(-2, -228); g.lineTo(6, -197); g.fill(); }
  if (head === 'ibis') { g.beginPath(); g.arc(2, -190, 12, 0, 7); g.fill(); g.strokeStyle = dark; g.lineWidth = 4; g.beginPath(); g.moveTo(12, -190); g.quadraticCurveTo(40, -186, 52, -158); g.stroke(); }
  if (head === 'cat') { g.beginPath(); g.arc(2, -188, 14, 0, 7); g.fill(); g.beginPath(); g.moveTo(-8, -196); g.lineTo(-6, -214); g.lineTo(2, -200); g.fill(); g.beginPath(); g.moveTo(4, -200); g.lineTo(10, -216); g.lineTo(14, -196); g.fill(); g.beginPath(); g.moveTo(14, -190); g.lineTo(20, -184); g.lineTo(13, -180); g.fill(); }
  g.fillStyle = '#f2ead6'; g.beginPath(); g.arc(8, -191, 3, 0, 7); g.fill();
  g.restore();
}
// 이집트 숫자: 막대(1), 활(10), 똬리(100)
function numStroke(g, x, y, s) { g.fillRect(x - 5 * s, y - 28 * s, 10 * s, 56 * s); }
function numHeel(g, x, y, s) { g.lineWidth = 9 * s; g.beginPath(); g.moveTo(x - 17 * s, y + 28 * s); g.lineTo(x - 17 * s, y - 8 * s); g.arc(x, y - 8 * s, 17 * s, Math.PI, 0); g.lineTo(x + 17 * s, y + 28 * s); g.stroke(); }
function numCoil(g, x, y, s) { g.lineWidth = 7 * s; g.beginPath(); for (let a = 0; a < Math.PI * 4; a += .1) { const rr = 3 * s + a * 2.1 * s; g.lineTo(x + Math.cos(a) * rr, y - 8 * s + Math.sin(a) * rr); } g.lineTo(x + 6 * s, y + 34 * s); g.stroke(); }
function drawNumberPlaque(g, w, h) {
  g.fillStyle = '#d9bf8a'; g.fillRect(0, 0, w, h);
  g.strokeStyle = '#6a4a22'; g.lineWidth = 10; g.strokeRect(6, 6, w - 12, h - 12);
  g.fillStyle = g.strokeStyle = '#2a1a0a'; g.lineCap = 'round';
  numCoil(g, 62, 150, 1.05); numCoil(g, 135, 150, 1.05);
  for (const [x, y] of [[200, 100], [245, 100], [290, 100], [222, 205], [267, 205]]) numHeel(g, x, y, .85);
  for (const [x, y] of [[345, 100], [372, 100], [399, 100], [426, 100], [358, 205], [385, 205], [412, 205]]) numStroke(g, x, y, .85);
}
function drawNumeralChart(g, w, h) {
  g.fillStyle = '#dcc290'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 200; i++) { g.fillStyle = `rgba(90,60,30,${Math.random() * .06})`; g.fillRect(Math.random() * w, Math.random() * h, 40, 20); }
  g.strokeStyle = '#1f3f6e'; g.lineWidth = 14; g.strokeRect(10, 10, w - 20, h - 20);
  g.fillStyle = '#5a1e10'; g.font = "900 76px 'Noto Serif KR'"; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText('왕의 숫자', w / 2, 90);
  g.textAlign = 'left'; g.font = "900 84px 'Noto Serif KR'";
  const rows = [[numStroke, '= 1', 240], [numHeel, '= 10', 400], [numCoil, '= 100', 570]];
  for (const [fn, label, y] of rows) { g.fillStyle = g.strokeStyle = '#2a1a0a'; g.lineCap = 'round'; fn(g, 330, y, 1.6); g.fillStyle = '#5a1e10'; g.fillText(label, 470, y); }
  g.font = "700 40px 'Noto Sans KR'"; g.fillStyle = '#3a2410'; g.textAlign = 'center';
  g.fillText('같은 기호는 여러 번 그려 더한다', w / 2, 690);
  g.fillStyle = g.strokeStyle = '#2a1a0a';
  numHeel(g, 380, 745, .55); numStroke(g, 430, 745, .55); numStroke(g, 455, 745, .55);
  g.fillStyle = '#5a1e10'; g.font = "900 46px 'Noto Serif KR'"; g.textAlign = 'left'; g.fillText('= 12', 500, 748);
}
// 그림을 쪽지 창에 띄우기
function imgNote(g, title, w, h, draw, text) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  g.note(title, `<img src="${c.toDataURL()}" style="width:100%;border-radius:4px">\n${text}`);
}

// ---------- 3D 모양 ----------
function godStatue(K, p, head) {
  const { MAT } = K;
  const basalt = MAT.concrete('#38332e', [1, 1]), gold = MAT.gold({ roughness: .3 }), blue = MAT.plain(0x1f3f86, .45);
  K.box(.36, .06, .5, basalt, { parent: p, at: [0, .03, .04] });
  K.box(.09, .58, .11, basalt, { parent: p, at: [-.07, .35, -.04] });
  K.box(.09, .58, .11, basalt, { parent: p, at: [.07, .35, .1], rot: [-.12, 0, 0] });
  K.box(.3, .26, .2, MAT.plain(0xe8dcc0, .7), { parent: p, at: [0, .72, 0] });
  K.box(.32, .04, .22, gold, { parent: p, at: [0, .86, 0] });
  K.box(.3, .4, .17, basalt, { parent: p, at: [0, 1.08, 0] });
  K.cyl(.17, .17, .05, gold, { parent: p, at: [0, 1.25, 0], scale: [1, 1, .65] });
  for (const x of [-.19, .19]) K.box(.07, .46, .08, basalt, { parent: p, at: [x, 1.02, 0] });
  K.cyl(.012, .012, 1.25, gold, { parent: p, at: [.19, .85, .07] });
  K.box(.08, .012, .012, gold, { parent: p, at: [.22, 1.47, .07] });
  K.cyl(.05, .05, .1, basalt, { parent: p, at: [0, 1.32, 0] });
  const h = K.group({ parent: p, at: [0, 1.46, 0] });
  if (head !== 'cat') { for (const x of [-.11, .11]) K.box(.06, .22, .04, blue, { parent: h, at: [x, -.13, .02] }); K.box(.24, .22, .12, blue, { parent: h, at: [0, -.03, -.08] }); }
  if (head === 'falcon') {
    K.sphere(.1, basalt, { parent: h });
    K.cone(.035, .1, gold, { parent: h, at: [0, -.02, .12], rot: [Math.PI / 2, 0, 0] });
    K.cyl(.1, .1, .02, MAT.plain(0x9a2a1c, .5), { parent: h, at: [0, .2, -.02], rot: [Math.PI / 2, 0, 0] });
  } else if (head === 'jackal') {
    K.box(.15, .13, .15, basalt, { parent: h });
    K.box(.07, .06, .17, basalt, { parent: h, at: [0, -.02, .14] });
    for (const x of [-.045, .045]) K.cone(.035, .16, basalt, { parent: h, at: [x, .14, -.01] });
  } else if (head === 'ibis') {
    K.sphere(.09, basalt, { parent: h });
    K.cyl(.006, .014, .32, gold, { parent: h, at: [0, -.077, .15], rot: [Math.PI / 2 + .5, 0, 0] });
  } else {
    K.sphere(.1, basalt, { parent: h });
    K.sphere(.045, basalt, { parent: h, at: [0, -.03, .08] });
    for (const x of [-.055, .055]) K.cone(.04, .09, basalt, { parent: h, at: [x, .1, 0] });
    K.torus(.02, .005, gold, { parent: h, at: [.1, -.03, 0], rot: [0, Math.PI / 2, 0] });
  }
  for (const x of [-.045, .045]) K.sphere(.014, gold, { parent: h, at: [x, .02, .085] });
}
function canopic(K, parent, at, hgt, sym, head) {
  const { MAT } = K;
  const ala = MAT.plain(0xe8dcc0, .45), g = K.group({ parent, at });
  K.lathe([[0, 0], [.055, 0], [.075, hgt * .25], [.08, hgt * .55], [.06, hgt * .82], [.045, hgt * .86], [0, hgt * .86]], ala, { parent: g });
  const h = K.group({ parent: g, at: [0, hgt * .86 + .04, 0] });
  K.sphere(.045, ala, { parent: h });
  if (head === 'baboon') K.sphere(.025, ala, { parent: h, at: [0, -.01, .04] });
  if (head === 'jackal') { K.box(.025, .02, .05, ala, { parent: h, at: [0, -.005, .05] }); for (const x of [-.02, .02]) K.cone(.012, .04, ala, { parent: h, at: [x, .05, 0] }); }
  if (head === 'falcon') K.cone(.012, .03, MAT.plain(0x3a2a18, .5), { parent: h, at: [0, -.005, .05], rot: [Math.PI / 2, 0, 0] });
  if (head === 'human') K.box(.1, .05, .03, MAT.plain(0x1f3f86, .5), { parent: h, at: [0, -.03, -.02] });
  K.text(sym, .1, .1, { parent: g, at: [0, hgt * .5, .082], bg: null, color: '#1f3f86', size: .8, res: 256, font: "'Segoe UI Symbol', 'Apple Symbols', 'Noto Sans Symbols', sans-serif" });
}
function halfScarab(K, g, phi) {
  const gold = K.MAT.gold({ roughness: .3, side: K.THREE.DoubleSide });
  K.place(new K.THREE.Mesh(new K.THREE.SphereGeometry(.06, 24, 12, phi, Math.PI), gold), { parent: g, scale: [1, .5, 1.3] });
  K.box(.004, .03, .14, K.MAT.plain(0x2f8a8a, .3), { parent: g, at: [phi ? .025 : -.025, .02, 0] });
}
function fullScarab(K, g) {
  const gold = K.MAT.gold({ roughness: .25 });
  K.sphere(.06, gold, { parent: g, scale: [1, .5, 1.3] });
  K.sphere(.03, gold, { parent: g, at: [0, 0, .085], scale: [1.2, .6, .8] });
  K.box(.004, .032, .14, K.MAT.plain(0x2f8a8a, .3), { parent: g, at: [0, .02, -.01] });
  for (const x of [-.03, .03]) K.box(.004, .025, .12, K.MAT.plain(0x2f8a8a, .3), { parent: g, at: [x, .015, -.01] });
  for (const sx of [-1, 1]) for (const z of [-.04, 0, .04]) K.box(.05, .006, .006, gold, { parent: g, at: [sx * .07, -.01, z], rot: [0, sx * z * 4, 0] });
}

export const solution = [
  { hot: '파피루스' },
  { hot: '호루스 석상' }, { hot: '호루스 석상' },
  { hot: '아누비스 석상' },
  { hot: '토트 석상' }, { hot: '토트 석상' }, { hot: '토트 석상' },
  { hot: '바스테트 석상', wait: 2.5 },
  { hot: '저울', item: 'feather', wait: 4 },
  { hot: '저울 받침 석판' },
  { hot: '왕의 숫자 벽화' },
  { hot: '돌 감실', lock: '257', wait: 1.6 },
  { hot: '카노푸스 함', lock: ['☾', '✶', '☥', '≋'] },
  { combine: ['scarabL', 'scarabR'] },
  { hot: '석관', item: 'scarab', wait: 6.5 },
  { hot: '어두운 통로', wait: 3 },
];
