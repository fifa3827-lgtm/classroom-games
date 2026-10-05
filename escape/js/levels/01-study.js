// 1단계: 오래된 서재
// 흐름: 책상 쪽지(무지개) → 튀어나온 책 4권을 빨·노·초·파 순서로 밀기 → 책장 아래 비밀 칸 → 작은 열쇠
//       양탄자 귀퉁이 → 렌즈 / 작은 열쇠로 서랍 → 돋보기 테 / 렌즈+테 = 돋보기
//       돋보기로 그림 → 「멈춘 시계」 단서 → 시계 10:25 → 금고 1025 → 문 열쇠 → 탈출
const RED = 0x8e1f1f, YEL = 0xc99a1e, GRN = 0x2f6b34, BLU = 0x1f3f86;

export default {
  title: '오래된 서재',
  intro: '눈을 떠 보니 낯선 서재다.\n벽난로가 타닥거리고, 문은 굳게 잠겨 있다.\n\n<i>끌어서 둘러보고, 눌러서 조사하세요.\n얻은 물건은 아래 가방에 들어갑니다.\n물건을 고른 뒤 다른 곳을 누르면 그곳에 씁니다.\n가방 속 물건 두 개를 차례로 누르면 조합합니다.</i>',
  outro: '무거운 문이 삐걱 열리고, 어두운 복도가 이어진다.\n아래층에서 기계 소리가 들린다…',
  env: .25, exposure: 1.05, bloom: .5,
  start: { pos: [0, 1.6, .6], look: [0, 1.45, -2] },

  items: {
    smallKey: { name: '작은 놋쇠 열쇠', desc: '손가락만 한 열쇠. 서랍 같은 작은 자물쇠에 맞을 것 같다.', model: keyModel(0xc89b4a, .6) },
    lens: { name: '둥근 유리 렌즈', desc: '볼록한 유리알. 무언가에 끼우는 부품 같다.', model: (K, g) => { K.cyl(.09, .09, .02, K.MAT.glass(0xcfe8ff, .55), { rot: [Math.PI / 2, 0, 0], parent: g }); } },
    frame: { name: '빈 돋보기 테', desc: '알이 빠진 돋보기. 테두리만 남아 있다.', model: (K, g) => magnifier(K, g, false) },
    loupe: { name: '돋보기', desc: '아주 작은 글씨도 읽을 수 있다.', model: (K, g) => magnifier(K, g, true) },
    doorKey: { name: '커다란 쇠 열쇠', desc: '묵직한 열쇠. 손잡이에 문 모양이 새겨져 있다.', model: keyModel(0x55575c, 1.1) },
  },
  combos: [['lens', 'frame', 'loupe']],

  hints: [
    { when: s => !s.compartment, text: ['책상 위 쪽지를 읽어 보세요.', '책장에서 다른 책보다 튀어나온 책이 네 권 있어요.', '무지개 색 순서(빨→주→노→초→파→남→보)대로 밀어 보세요: 빨강, 노랑, 초록, 파랑.'] },
    { when: (s, g) => !g.has('smallKey') && !s.drawer, text: ['책장 맨 아래 칸이 열렸어요.'] },
    { when: s => !s.drawer, text: ['작은 열쇠는 책상 서랍에 맞을 거예요. 열쇠를 고르고 서랍을 누르세요.'] },
    { when: (s, g) => !s.lens, text: ['방바닥을 잘 보세요. 양탄자 한쪽이 들려 있어요.'] },
    { when: (s, g) => !g.has('loupe') && !s.read, text: ['가방에서 렌즈와 빈 돋보기 테를 차례로 눌러 조합하세요.'] },
    { when: s => !s.read, text: ['돋보기로 아주 작은 글씨를 찾아야 해요.', '벽난로 위 그림, 배의 돛을 돋보기로 살펴보세요.'] },
    { when: s => !s.safe, text: ['멈춘 시계는 오른쪽 벽 괘종시계예요.', '시계는 10시 25분에 멈췄어요. 책상 아래 금고에 1025.'] },
    { text: ['문 열쇠를 고르고 문을 누르세요.'] },
  ],

  build(K) {
    const { THREE, MAT, s, game } = K;
    const W = 6, D = 6, H = 3.2;
    const wood = MAT.wood('#4a2c17'), darkWood = MAT.wood('#2e1b0e');
    K.room({ w: W, d: D, h: H, floor: MAT.floor('#4b2e18'), wall: MAT.wallpaper('#24392c', '#a8874c'), ceil: MAT.plaster('#6f6352'), trim: darkWood });
    // 아래쪽 나무 판벽
    for (const [len, at, ry] of [[W, [0, .5, -D / 2 + .02], 0], [W, [0, .5, D / 2 - .02], Math.PI], [D, [-W / 2 + .02, .5, 0], Math.PI / 2], [D, [W / 2 - .02, .5, 0], -Math.PI / 2]]) {
      K.box(len, 1, .03, wood, { at, rot: [0, ry, 0] });
      K.box(len, .05, .06, darkWood, { at: [at[0], 1.02, at[2]], rot: [0, ry, 0] });
    }
    // 천장 들보
    for (const x of [-1.5, 1.5]) K.box(.22, .2, D, darkWood, { at: [x, H - .1, 0] });

    // 빛
    K.scene.add(new THREE.HemisphereLight(0xb8c4dc, 0x3a2614, 1.1));
    // 천장 샹들리에
    const ch = K.group({ at: [0, H - .9, 0] });
    K.cyl(.006, .006, .8, MAT.iron(), { parent: ch, at: [0, .5, 0] });
    K.torus(.32, .015, MAT.brass(), { parent: ch, rot: [Math.PI / 2, 0, 0] });
    K.sphere(.05, MAT.brass(), { parent: ch });
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; K.candle({ parent: ch, at: [Math.cos(a) * .32, .01, Math.sin(a) * .32], h: .1, light: false }); }
    K.point(0xffc98a, 10, 10, { at: [0, H - 1, 0] });

    // ---------- 양탄자 ----------
    const rugMat = MAT.fabric('#6d1a1e', 1, [2, 1.5]);
    K.box(3.2, .012, 2.3, rugMat, { at: [0, .006, .2] });
    const corner = K.box(.55, .012, .55, rugMat, { at: [1.35, .07, 1.1], rot: [.35, .7, -.2] });
    const lensMesh = K.cyl(.07, .07, .014, MAT.plain(0xdff0ff, .05, .3, { emissive: 0x7a9ab8, emissiveIntensity: .7, transparent: true, opacity: .9 }), { at: [1.3, .02, 1.05] });
    K.hot(corner, {
      name: '들린 양탄자 귀퉁이', click: g => {
        if (s.rugUp) return;
        s.rugUp = true; g.sound.play('page');
        g.tween(corner.rotation, { x: -.05, z: 0 }, .5).then(() => { corner.position.y = .02; g.say('양탄자 밑에 무언가 반짝인다.'); });
      }
    });
    K.hot(lensMesh, { name: '반짝이는 것', enabled: () => s.rugUp, click: g => { lensMesh.visible = false; s.lens = true; g.give('lens'); } });

    // ---------- 북쪽: 문과 창 ----------
    const door = K.door({ w: 1.05, h: 2.2, mat: MAT.wood('#3a2212', [1, 2]), frameMat: darkWood, at: [.4, 0, -D / 2 + .08] });
    K.hot(door.pivot, {
      name: '잠긴 문', click: g => { g.sound.play('thud'); g.say('굳게 잠겨 있다. 커다란 열쇠 구멍이 보인다.'); },
      use: {
        doorKey: async g => {
          g.take('doorKey'); g.sound.play('unlock'); await g.wait(.5); g.sound.play('open');
          await g.tween(door.pivot.rotation, { y: -1.4 * door.openSign }, 1.6); g.win();
        }
      }
    });
    // 문 너머 복도 빛
    K.plane(1.05, 2.2, MAT.glow(0x1a1410, .6), { at: [.4, 1.1, -D / 2 - .15] });
    // 창문 (달빛)
    const win = K.group({ at: [-1.7, 1.75, -D / 2 + .03] });
    K.plane(1.1, 1.4, MAT.glow(0x2a4672, 1.4), { parent: win, at: [0, 0, -.01] });
    K.picture(1.1, 1.4, (g, w, h) => { // 창밖 밤하늘
      const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#0b1730'); gr.addColorStop(1, '#3a5a8c'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
      g.fillStyle = '#f4f1e0'; g.beginPath(); g.arc(w * .7, h * .25, 34, 0, 7); g.fill();
      for (let i = 0; i < 60; i++) { g.globalAlpha = Math.random(); g.fillRect(Math.random() * w, Math.random() * h * .7, 2, 2); }
      g.globalAlpha = 1; g.fillStyle = '#0a0f18'; g.beginPath(); g.moveTo(0, h); for (let x = 0; x <= w; x += 20) g.lineTo(x, h * .8 - Math.sin(x * .03) * 30 - Math.random() * 20); g.lineTo(w, h); g.fill();
    }, { parent: win, emissive: 1.1 });
    for (const x of [-.57, 0, .57]) K.box(.05, 1.5, .08, darkWood, { parent: win, at: [x, 0, .02] });
    for (const y of [-.72, 0, .72]) K.box(1.2, .05, .08, darkWood, { parent: win, at: [0, y, .02] });
    K.box(1.3, .06, .22, darkWood, { parent: win, at: [0, -.76, .08] });
    // 커튼
    for (const x of [-.75, .75]) K.box(.3, 1.9, .06, MAT.fabric('#4a1016', 0, [1, 3]), { parent: win, at: [x, -.05, .12] });
    K.spot(0x8fb0ff, 6, 9, [-.5, 0, 1.2], { at: [-1.7, 2.3, -2.6], angle: .5, penumbra: .8 });

    // ---------- 서쪽: 책장 ----------
    const shelf = K.shelf(2.4, 2.6, .42, wood, 5, { at: [-W / 2 + .24, 0, -.2], rot: [0, Math.PI / 2, 0] });
    K.zone('shelf', { pos: [-.5, 1.35, -.2], look: [-2.8, 1.2, -.2], fov: 55, range: .5 });
    K.hot(shelf, { name: '책장', goto: 'shelf' });
    const r = K.rng(4), colors = [0x5a2a1a, 0x2a3a2a, 0x3b2a4a, 0x6b4a2a, 0x2a2a3a, 0x7a5a3a, 0x4a1a1a, 0x1f2f3f];
    const special = { '1:3': ['빨간 책', RED], '3:7': ['파란 책', BLU], '2:12': ['노란 책', YEL], '4:5': ['초록 책', GRN] };
    const pushed = [];
    for (let row = 1; row < 5; row++) {
      let x = -1.12, i = 0;
      while (x < 1.05) {
        const key = `${row}:${i}`, sp = special[key];
        const bw = sp ? .07 : .035 + r() * .045, bh = .3 + r() * .12, lean = !sp && r() < .06;
        const b = K.book(bw, bh, .26, sp ? sp[1] : colors[Math.floor(r() * colors.length)], { parent: shelf, at: [x + bw / 2, shelf.rowY(row) + bh / 2, sp ? .1 : .02], rot: [0, 0, lean ? -.15 : 0], label: sp ? '' : undefined });
        if (sp) {
          b.userData.color = sp[0];
          K.hot(b, {
            name: sp[0], zone: 'shelf', click: g => {
              if (s.compartment || pushed.includes(b)) return;
              g.sound.play('click'); pushed.push(b); g.tween(b.position, { z: .02 }, .3);
              if (pushed.length === 4) {
                const ok = pushed.map(p => p.userData.color).join() === '빨간 책,노란 책,초록 책,파란 책';
                if (ok) openCompartment(g);
                else g.wait(.6).then(() => { g.sound.play('wrong'); g.say('딸깍… 책들이 도로 튀어나왔다. 순서가 틀린 것 같다.'); pushed.splice(0).forEach(p => g.tween(p.position, { z: .1 }, .3)); });
              }
            }
          });
        }
        x += bw + .004; i++;
      }
    }
    // 책장 맨 아래 칸: 비밀 판
    const panel = K.box(2.32, .44, .02, darkWood, { parent: shelf, at: [0, .32, .2] });
    K.hot(panel, { name: '책장 아래 판', zone: 'shelf', click: g => g.say('나무판으로 막혀 있다. 손으로는 열리지 않는다.') });
    const box = K.rbox(.3, .14, .2, .02, MAT.wood('#7a4a22'), { parent: shelf, at: [.6, .17, .02] });
    K.box(.06, .04, .01, MAT.brass(), { parent: box, at: [0, 0, .1] });
    function openCompartment(g) {
      s.compartment = true; g.sound.play('unlock');
      g.say('철컥! 책장 아래쪽에서 무언가 풀리는 소리가 났다.');
      g.unhot(panel); g.tween(panel.position, { y: .02 }, .9).then(() => panel.visible = false);
    }
    K.hot(box, { name: '작은 나무 상자', zone: 'shelf', enabled: () => s.compartment, click: g => { if (s.boxTaken) return; s.boxTaken = true; g.sound.play('open'); g.say('상자 안에 작은 열쇠가 있다.'); g.give('smallKey'); g.tween(box.position, { y: -.5 }, .01); box.visible = false; } });

    // ---------- 동쪽: 책상, 금고, 시계 ----------
    const desk = K.group({ at: [W / 2 - .55, 0, .6], rot: [0, -Math.PI / 2, 0] });
    K.rbox(1.6, .07, .8, .02, wood, { parent: desk, at: [0, .78, 0] });
    K.box(.5, .74, .7, wood, { parent: desk, at: [-.5, .37, 0] });             // 왼쪽 서랍장
    K.box(.06, .74, .7, wood, { parent: desk, at: [.76, .37, 0] });
    K.box(1.5, .5, .03, wood, { parent: desk, at: [0, .5, -.33] });
    for (const y of [.15, .55]) K.box(.44, .3, .02, darkWood, { parent: desk, at: [-.5, y, .36] });
    // 잠긴 서랍
    const drawer = K.group({ parent: desk, at: [.2, .67, .33] });
    K.box(.62, .13, .04, wood, { parent: drawer });
    K.box(.12, .025, .03, MAT.brass(), { parent: drawer, at: [0, 0, .035] });
    // 서랍 속은 비어 있어야 물건이 보인다: 바닥 + 양옆 + 뒤판
    const dIn = MAT.wood('#5a3a20');
    K.box(.58, .01, .5, dIn, { parent: drawer, at: [0, -.05, -.27] });
    for (const x of [-.285, .285]) K.box(.01, .1, .5, dIn, { parent: drawer, at: [x, -.005, -.27] });
    K.box(.58, .1, .01, dIn, { parent: drawer, at: [0, -.005, -.515] });
    const frameMesh = K.group({ parent: drawer, at: [0, -.035, -.25], rot: [-Math.PI / 2, 0, .4], scale: .55 }); magnifier(K, frameMesh, false);
    frameMesh.visible = false;
    K.cyl(.12, .12, .02, new K.THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, side: K.THREE.DoubleSide }), { parent: frameMesh, shadow: false }).rotation.x = Math.PI / 2; // 테 안쪽도 눌리게
    K.zone('desk', { pos: [1.15, 1.5, .6], look: [2.4, .7, .6], fov: 55, range: .5 });
    K.hot(drawer, {
      name: '서랍', zone: 'desk', click: g => {
        if (!s.drawer) { g.sound.play('wrong'); g.say('잠겨 있다. 작은 열쇠 구멍이 있다.'); return; }
      }, use: {
        smallKey: g => {
          s.drawer = true; g.take('smallKey'); g.sound.play('unlock'); frameMesh.visible = true;
          g.tween(drawer.position, { z: .7 }, .7); g.say('서랍이 열렸다.');
        }
      }
    });
    K.hot(frameMesh, { name: '돋보기 테', zone: 'desk', click: g => { frameMesh.visible = false; g.give('frame'); } });
    // 책상 위: 램프, 쪽지, 잉크병, 책
    const lamp = K.group({ parent: desk, at: [-.55, .81, -.15] });
    K.cyl(.09, .11, .03, MAT.brass(), { parent: lamp });
    K.cyl(.012, .012, .38, MAT.brass(), { parent: lamp, at: [0, .2, 0] });
    K.lathe([[.0, .0], [.16, -.0], [.12, .08], [.06, .16], [0, .17]], MAT.plain(0x1d4a2a, .3, .2, { side: THREE.DoubleSide }), { parent: lamp, at: [0, .3, 0] });
    K.sphere(.04, MAT.glow(0xffd28a, 5), { parent: lamp, at: [0, .33, 0], shadow: false });
    K.point(0xffc27a, 3, 5, { parent: lamp, at: [0, .26, 0], shadow: true, res: 512 });
    K.point(0xffc27a, 1.2, 1.6, { parent: desk, at: [.3, .45, .55] }); // 책상 아래 금고 쪽 보조 조명
    const note = K.text(['책들은', '무지개를 기억한다'], .3, .2, { parent: desk, at: [.15, .816, .1], rot: [-Math.PI / 2, 0, .12], size: .2, lh: 1.5 });
    K.hot(note, { name: '쪽지', zone: 'desk', click: g => g.note('구겨진 쪽지', '<div class="big">책들은\n무지개를\n기억한다</div>\n\n<p style="text-align:right">— H.</p>') });
    K.lathe([[0, 0], [.04, 0], [.045, .04], [.02, .06], [.015, .08], [0, .08]], MAT.glass(0x111122, .85), { parent: desk, at: [.5, .815, -.2] });
    K.book(.22, .04, .3, 0x5a1a1a, { parent: desk, at: [.45, .835, .12], rot: [-Math.PI / 2, 0, .3] });
    K.candle({ parent: desk, at: [.7, .815, -.25], intensity: .5, dist: 2.5 });
    K.chair(MAT.wood('#3b2312'), { parent: desk, at: [.65, 0, .8], rot: [0, Math.PI + .2, 0] });

    // 금고 (책상 아래)
    const safe = K.group({ parent: desk, at: [.3, 0, .05] });
    const safeMat = MAT.metal('#2a2d33', { rough: .45 });
    // 금고 몸통도 속이 빈 상자로: 위·아래·양옆·뒤
    K.box(.46, .03, .42, safeMat, { parent: safe, at: [0, .405, 0] });
    K.box(.46, .03, .42, safeMat, { parent: safe, at: [0, .015, 0] });
    for (const x of [-.215, .215]) K.box(.03, .42, .42, safeMat, { parent: safe, at: [x, .21, 0] });
    K.box(.46, .42, .03, safeMat, { parent: safe, at: [0, .21, -.195] });
    const sdoor = K.group({ parent: safe, at: [-.2, .21, .215] });
    K.rbox(.4, .36, .03, .01, MAT.metal('#3a3e46', { rough: .35 }), { parent: sdoor, at: [.2, 0, 0] });
    K.cyl(.05, .05, .03, MAT.brass(), { parent: sdoor, at: [.2, .03, .03], rot: [Math.PI / 2, 0, 0] });
    K.box(.12, .06, .01, MAT.plain(0x111111, .3), { parent: sdoor, at: [.2, -.09, .02] });
    const keyInSafe = K.group({ parent: safe, at: [0, .04, .02], rot: [-Math.PI / 2, 0, .3], scale: .3 }); keyModel(0x55575c, 1.1)(K, keyInSafe);
    K.box(.5, .2, .03, new K.THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, side: K.THREE.DoubleSide }), { parent: keyInSafe, shadow: false }); // 열쇠 둘레도 눌리게
    K.zone('safe', { pos: [1.35, .42, .9], look: [2.4, .22, .9], fov: 45, range: .4 });
    K.hot(safe, {
      name: '작은 금고', goto: 'safe', click: g => {
        if (s.safe) return;
        g.lock({ title: '금고 다이얼', text: '네 자리 숫자를 맞추세요.', type: 'digits', answer: '1025', onSolve: g => { s.safe = true; g.sound.play('open'); g.tween(sdoor.rotation, { y: -1.8 }, 1); } });
      }
    });
    K.hot(keyInSafe, { name: '열쇠', zone: 'safe', enabled: () => s.safe, click: g => { keyInSafe.visible = false; g.give('doorKey'); } });

    // 괘종시계
    const clock = K.group({ at: [W / 2 - .25, 0, -1.7], rot: [0, -Math.PI / 2, 0] });
    K.box(.5, 1.3, .32, darkWood, { parent: clock, at: [0, .65, 0] });
    K.box(.42, .8, .02, MAT.glass(0x332211, .5), { parent: clock, at: [0, .75, .17] });
    K.box(.04, .55, .01, MAT.brass(), { parent: clock, at: [0, .85, .14] });
    K.cyl(.09, .09, .01, MAT.brass(), { parent: clock, at: [0, .55, .14], rot: [Math.PI / 2, 0, 0] });
    K.box(.56, .62, .36, darkWood, { parent: clock, at: [0, 1.62, 0] });
    K.box(.6, .1, .4, darkWood, { parent: clock, at: [0, 1.98, 0] });
    K.lathe([[.0, 0], [.04, 0], [.03, .08], [0, .1]], MAT.brass(), { parent: clock, at: [0, 2.03, 0] });
    const face = K.picture(.42, .42, (g, w) => {
      const c = w / 2; g.fillStyle = '#efe3c4'; g.beginPath(); g.arc(c, c, c - 4, 0, 7); g.fill();
      g.strokeStyle = '#8a6a2a'; g.lineWidth = 10; g.stroke();
      g.fillStyle = '#2a1a0a'; g.font = "700 46px 'Noto Serif KR'"; g.textAlign = 'center'; g.textBaseline = 'middle';
      ['XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'].forEach((n, i) => { const a = i / 12 * Math.PI * 2; g.fillText(n, c + Math.sin(a) * c * .74, c - Math.cos(a) * c * .74); });
      const hand = (a, len, wd) => { g.save(); g.translate(c, c); g.rotate(a); g.fillStyle = '#111'; g.beginPath(); g.moveTo(-wd, 20); g.lineTo(0, -len); g.lineTo(wd, 20); g.fill(); g.restore(); };
      hand((10 + 25 / 60) / 12 * Math.PI * 2, c * .45, 11); hand(25 / 60 * Math.PI * 2, c * .7, 7);
      g.beginPath(); g.arc(c, c, 12, 0, 7); g.fill();
    }, { parent: clock, at: [0, 1.65, .185] });
    K.zone('clock', { pos: [1.7, 1.65, -1.7], look: [2.8, 1.62, -1.7], fov: 45, range: .4 });
    K.hot(clock, { name: '괘종시계', goto: 'clock', click: g => g.say('시계추가 멈춰 있다. 바늘도 움직이지 않는다.') });

    // ---------- 남쪽: 벽난로와 그림 ----------
    const fp = K.group({ at: [0, 0, D / 2 - .3], rot: [0, Math.PI, 0] });
    const stone = MAT.stone('#8a7f70', [1, 1]);
    for (const x of [-.74, .74]) K.box(.42, 1.25, .5, stone, { parent: fp, at: [x, .62, 0] });
    K.box(1.9, .45, .5, stone, { parent: fp, at: [0, 1.03, 0] });
    K.box(1.06, .82, .05, MAT.plain(0x0a0705, .9), { parent: fp, at: [0, .41, -.22] });
    K.box(1.9, .05, .7, stone, { parent: fp, at: [0, .025, .1] });
    K.box(2.1, .1, .62, MAT.wood('#3a2414'), { parent: fp, at: [0, 1.3, .03] });
    for (const [x, rz] of [[-.15, .3], [.15, -.25], [0, 0]]) K.cyl(.05, .06, .6, MAT.wood('#2a170a'), { parent: fp, at: [x, .12, 0], rot: [0, 0, Math.PI / 2 + rz] });
    const flames = [];
    for (let i = 0; i < 6; i++) { const f = K.cone(.07 + Math.random() * .05, .3 + Math.random() * .2, MAT.glow(i % 2 ? 0xff7a1a : 0xffb347, 4, { transparent: true, opacity: .85 }), { parent: fp, at: [(i - 2.5) * .08, .32, -.02 + (i % 2) * .05], shadow: false }); f.castShadow = false; f.userData.noRay = true; flames.push(f); }
    const fire = K.point(0xff7a2a, 8, 7, { parent: fp, at: [0, .55, .35], shadow: true });
    K.onUpdate((dt, t) => {
      flames.forEach((f, i) => { const k = .8 + Math.sin(t * 8 + i * 2) * .15 + Math.random() * .1; f.scale.set(1, k, 1); });
      fire.intensity = 7 + Math.sin(t * 7) * .8 + Math.random();
    });
    for (const x of [-.75, .75]) K.candle({ parent: fp, at: [x, 1.35, .1], intensity: .4, dist: 2 });
    // 그림: 배
    const painting = K.frame(1.3, .9, (g, w, h) => {
      const sky = g.createLinearGradient(0, 0, 0, h * .6); sky.addColorStop(0, '#3a4a5a'); sky.addColorStop(1, '#c79a5a'); g.fillStyle = sky; g.fillRect(0, 0, w, h);
      const sea = g.createLinearGradient(0, h * .6, 0, h); sea.addColorStop(0, '#2a4a5a'); sea.addColorStop(1, '#0e1a22'); g.fillStyle = sea; g.fillRect(0, h * .6, w, h * .4);
      g.strokeStyle = 'rgba(255,240,200,.25)'; for (let i = 0; i < 40; i++) { const y = h * .62 + Math.random() * h * .36; g.beginPath(); g.moveTo(Math.random() * w, y); g.lineTo(Math.random() * w, y + 2); g.stroke(); }
      g.fillStyle = '#2a1a10'; g.beginPath(); g.moveTo(w * .3, h * .62); g.lineTo(w * .7, h * .62); g.lineTo(w * .64, h * .7); g.lineTo(w * .35, h * .7); g.fill();
      g.fillRect(w * .495, h * .18, 4, h * .45); g.fillRect(w * .4, h * .25, 3, h * .38);
      g.fillStyle = '#e8dcc0'; g.beginPath(); g.moveTo(w * .505, h * .2); g.quadraticCurveTo(w * .62, h * .35, w * .51, h * .58); g.fill();
      g.beginPath(); g.moveTo(w * .405, h * .27); g.quadraticCurveTo(w * .48, h * .4, w * .41, h * .58); g.fill();
      g.fillStyle = 'rgba(40,20,10,.5)'; g.font = "8px serif"; g.fillText('…', w * .52, h * .5);
    }, { at: [0, 2.15, D / 2 - .04], rot: [0, Math.PI, 0] });
    K.zone('painting', { pos: [0, 2, 1.6], look: [0, 2.1, 3], fov: 45, range: .4 });
    K.hot(painting, {
      name: '배 그림', goto: 'painting', click: g => g.say('폭풍 전의 바다를 그린 유화다. 돛 귀퉁이에 점 같은 얼룩이 있다.'),
      use: { loupe: g => { s.read = true; g.sound.play('magic'); g.note('돋보기로 본 돛', '<div class="big" style="font-size:20px">아주 작은 글씨가 쓰여 있다.</div>\n\n<div class="big">「멈춘 시계가\n금고를 연다」</div>'); } }
    });
    K.dust(260, [5.5, 3, 5.5], { opacity: .35 });
  },
};

// 열쇠 모양
function keyModel(color, size) {
  return (K, g) => {
    const m = K.MAT.plain(color, .3, 1);
    K.torus(.05 * size, .014 * size, m, { parent: g, at: [-.13 * size, 0, 0] });
    K.cyl(.012 * size, .012 * size, .22 * size, m, { parent: g, rot: [0, 0, Math.PI / 2], at: [.02 * size, 0, 0] });
    K.box(.02 * size, .05 * size, .012 * size, m, { parent: g, at: [.1 * size, -.03 * size, 0] });
    K.box(.02 * size, .035 * size, .012 * size, m, { parent: g, at: [.06 * size, -.024 * size, 0] });
  };
}
function magnifier(K, g, withLens) {
  K.torus(.09, .012, K.MAT.brass(), { parent: g });
  K.cyl(.016, .02, .16, K.MAT.wood('#3a2010'), { parent: g, at: [0, -.17, 0] });
  if (withLens) K.cyl(.088, .088, .008, K.MAT.glass(0xcfe8ff, .45), { parent: g, rot: [Math.PI / 2, 0, 0] });
}

export const solution = [
  { hot: '쪽지' },
  { hot: '빨간 책' }, { hot: '노란 책' }, { hot: '초록 책' }, { hot: '파란 책' },
  { hot: '작은 나무 상자' },
  { hot: '서랍', item: 'smallKey' },
  { hot: '돋보기 테' },
  { hot: '들린 양탄자 귀퉁이' }, { hot: '반짝이는 것' },
  { combine: ['lens', 'frame'] },
  { hot: '배 그림', item: 'loupe' },
  { hot: '작은 금고', lock: '1025' },
  { hot: '열쇠' },
  { hot: '잠긴 문', item: 'doorKey', wait: 3 },
];
