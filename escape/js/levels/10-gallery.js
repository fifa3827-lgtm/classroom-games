// 10단계: 한밤의 미술관
// 흐름: 경비원 책상(경비 일지 + 손전등) → 「창가의 소녀」가 바라보는 등대 = 서쪽 벽 「밤의 항구」
//       → 조각상을 45도씩 돌려 서쪽을 보게 → 받침대 서랍에서 보라색 필터
//       → 손전등 + 필터 = 자외선 손전등 → 「네 개의 창」에 비추면 색 창마다 숫자 1~4
//       → 진열장 색 자물쇠(파랑·빨강·초록·노랑) → 수첩 둘째 장(「밤」이 든 제목의 연도 끝 두 자리, 오래된 것부터)
//       → 명판: 밤의 항구 1889, 한밤의 정원 1907 → 보안 패널 8907 → 비상문 → 탈출
const PI = Math.PI;
const COL = { red: '#c0392b', yellow: '#f1c40f', blue: '#2e6fd6', green: '#27ae60', white: '#ecf0f1', black: '#1c1c1c' };
const lcg = seed => () => (seed = (seed * 16807) % 2147483647) / 2147483647;
// 「네 개의 창」 칸: [x, y, w, h](비율), 색, 자외선 숫자
const CELLS = [
  [.08, .08, .36, .36, COL.red, '2'],
  [.56, .1, .34, .3, COL.blue, '1'],
  [.1, .56, .32, .34, COL.yellow, '4'],
  [.54, .52, .38, .4, COL.green, '3'],
];
const PAINTINGS = [
  { key: 'gent', title: '붉은 옷의 신사', artist: '장 모로', year: 1862 },
  { key: 'girl', title: '창가의 소녀', artist: '안나 벨', year: 1874 },
  { key: 'garden', title: '한밤의 정원', artist: '이서림', year: 1907 },
  { key: 'harbour', title: '밤의 항구', artist: '토마스 그레이', year: 1889 },
  { key: 'abstract', title: '네 개의 창', artist: '피터 몬', year: 1931 },
];

export default {
  title: '한밤의 미술관',
  intro: '정신을 차리니 불 꺼진 미술관 한가운데.\n조명은 그림들만 비추고, 비상문은 보안 패널로 잠겼다.\n어디선가 감시 카메라가 천천히 고개를 돌린다.\n\n<i>경비원은 어디 갔을까? 책상부터 살펴보자.</i>',
  outro: '삐빅— 보안 패널에 초록 불이 켜지고 비상문이 열린다.\n계단 아래로 차가운 밤바람이 불어온다.\n그림 속 소녀가 잠깐 웃은 것 같았다.',
  env: .3, exposure: 1.05, bloom: .5, bg: 0x040406,
  start: { pos: [.6, 1.65, 2.6], look: [0, 1.6, -3.5] },

  items: {
    torch: { name: '경비원 손전등', desc: '묵직한 손전등. 앞쪽 유리 테에 무언가 끼울 홈이 있다.', model: (K, g) => torchModel(K, g, false) },
    filter: { name: '보라색 필터', desc: '동그란 보라색 유리. 「UV」라고 새겨져 있다.', model: filterModel },
    uvTorch: { name: '자외선 손전등', desc: '보라색 빛이 나오는 손전등. 보이지 않는 잉크를 드러낸다.', model: (K, g) => torchModel(K, g, true) },
  },
  combos: [['torch', 'filter', 'uvTorch', g => g.say('필터를 끼우니 손전등에서 보랏빛이 새어 나온다.')]],

  hints: [
    { when: s => !s.log, text: ['남서쪽 구석(비상문 왼쪽 벽 끝)에 경비원 책상이 있어요.', '책상 위 경비 일지를 읽어 보세요.', '경비 일지를 누르고, 옆의 손전등도 챙기세요.'] },
    { when: s => !s.statue, text: ['일지: 조각상은 「창가의 소녀」가 바라보는 곳을 함께 봐야 해요.', '소녀는 창밖 항구의 줄무늬 등대를 보고 있어요. 같은 등대는 서쪽 벽 「밤의 항구」에 있어요.', '조각상을 누르면 45도씩 돌아요. 얼굴이 서쪽 벽(밤의 항구)을 보게 하세요. 처음 자리에서 여섯 번.'] },
    { when: s => !s.gotFilter, text: ['조각상 받침대 서랍이 열렸어요. 안의 필터를 꺼내세요.'] },
    { when: (s, g) => !s.uv && !g.has('uvTorch'), text: ['필터는 손전등 앞에 끼우는 부품이에요.', '손전등은 경비원 책상 위에 있어요. 가방에서 손전등과 필터를 차례로 눌러 조합하세요.'] },
    { when: s => !s.uv, text: ['일지: 진열장 순서는 「네 개의 창」에 보이지 않는 잉크로 적혀 있어요.', '자외선 손전등을 고르고 동쪽 벽의 「네 개의 창」을 누르세요.'] },
    { when: s => !s.vitrine, text: ['색 창마다 숫자 1~4가 떠올랐어요.', '진열장 색 자물쇠에 숫자 순서대로 색을 넣으세요.', '파랑 → 빨강 → 초록 → 노랑.'] },
    { when: s => !s.page2, text: ['열린 진열장 안 수첩 둘째 장을 읽으세요.'] },
    { text: ['제목에 「밤」이 들어간 그림의 명판을 찾아 연도를 보세요.', '「밤의 항구」 1889년, 「한밤의 정원」 1907년. 오래된 것부터 끝 두 자리씩.', '보안 패널에 8907.'] },
  ],

  build(K) {
    const { THREE, MAT, s } = K;
    const W = 8, D = 7, H = 3.6;
    const dark = MAT.wood('#24180e'), walnut = MAT.wood('#3a2616');
    const marble = new THREE.MeshStandardMaterial({ map: marbleTex(K), roughness: .22 });
    K.room({ w: W, d: D, h: H, floor: MAT.floor('#5a3a22', [2, 2], { rough: .2 }), wall: MAT.plaster('#3a4352'), ceil: MAT.plaster('#25282e'), trim: dark });
    // 벽 위쪽 몰딩 띠
    for (const [len, at, ry] of [[W, [0, 2.75, -D / 2 + .02], 0], [W, [0, 2.75, D / 2 - .02], PI], [D, [-W / 2 + .02, 2.75, 0], PI / 2], [D, [W / 2 - .02, 2.75, 0], -PI / 2]]) K.box(len, .05, .04, MAT.plain(0x8a8070, .5), { at, rot: [0, ry, 0] });

    // ---------- 빛 ----------
    K.scene.add(new THREE.HemisphereLight(0xb8c0d8, 0x2a2018, 1.0));
    K.point(0xffe2c0, 6, 11, { at: [0, 3.3, 1.2], shadow: true });
    // 천창
    K.picture(2.0, 1.4, (g, w, h) => {
      const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#0a1430'); gr.addColorStop(1, '#2a3a6a'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
      const r = lcg(4); for (let i = 0; i < 80; i++) { g.fillStyle = `rgba(255,255,255,${r()})`; g.fillRect(r() * w, r() * h, 2, 2); }
      const mg = g.createRadialGradient(w * .7, h * .35, 4, w * .7, h * .35, 60); mg.addColorStop(0, '#fffbe8'); mg.addColorStop(.35, 'rgba(255,250,230,.9)'); mg.addColorStop(1, 'rgba(255,250,230,0)'); g.fillStyle = mg; g.fillRect(0, 0, w, h);
    }, { at: [0, H - .02, .2], rot: [PI / 2, 0, 0], emissive: .9 });
    for (const x of [-1.02, 0, 1.02]) K.box(.05, .1, 1.5, dark, { at: [x, H - .05, .2] });
    for (const z of [-.52, .2, .92]) K.box(2.1, .1, .05, dark, { at: [0, H - .05, z] });
    K.spot(0xd8e2ff, 5, 8, [0, 1.3, .2], { at: [.3, 3.5, .7], angle: .42, penumbra: .6, shadow: true });

    // ---------- 그림들 ----------
    const draws = { gent: paintGent, girl: paintGirl, garden: paintGarden, harbour: paintHarbour, abstract: paintAbstract };
    const place = {
      gent: { w: .8, h: 1.0, at: [-2.5, 1.75, -3.47], rot: 0, zone: { pos: [-2.4, 1.6, -1.8], look: [-2.2, 1.6, -3.5] } },
      girl: { w: 1.1, h: 1.4, at: [0, 1.85, -3.47], rot: 0, zone: { pos: [.2, 1.65, -1.6], look: [.2, 1.7, -3.5] } },
      garden: { w: 1.2, h: .9, at: [2.5, 1.75, -3.47], rot: 0, zone: { pos: [2.6, 1.6, -1.8], look: [2.8, 1.6, -3.5] } },
      harbour: { w: 1.8, h: 1.1, at: [-3.97, 1.75, .2], rot: PI / 2, zone: { pos: [-2.2, 1.65, -.1], look: [-4, 1.65, -.1] } },
      abstract: { w: 1.2, h: 1.2, at: [3.97, 1.75, -.8], rot: -PI / 2, zone: { pos: [2.3, 1.65, -.5], look: [4, 1.65, -.5] } },
    };
    const talk = {
      gent: '붉은 외투의 신사가 엄숙하게 정면을 바라본다.',
      girl: '창가에 앉은 소녀가 창밖을 바라본다. 그 너머, 항구의 줄무늬 등대가 빛을 뿌린다.',
      garden: '달빛 아래 등불이 켜진 정원. 연못에 달이 비친다.',
      harbour: '밤바다의 항구. 줄무늬 등대의 불빛이 물 위에 길게 번진다.',
      abstract: '검은 선이 하얀 화면을 나눈다. 빨강·파랑·노랑·초록, 네 개의 색 창.',
    };
    const frames = {};
    for (const p of PAINTINGS) {
      const q = place[p.key], ry = q.rot;
      const fr = K.frame(q.w, q.h, draws[p.key], { at: q.at, rot: [0, ry, 0], res: 512, border: p.key === 'abstract' ? .03 : .07, frameMat: p.key === 'abstract' ? MAT.plain(0x111111, .4, .2) : MAT.gold({ roughness: .38 }) });
      frames[p.key] = fr;
      // 명판: 그림 오른쪽(보는 사람 기준)
      const right = new THREE.Vector3(Math.cos(ry), 0, -Math.sin(ry));
      const pa = new THREE.Vector3(...q.at).addScaledVector(right, q.w / 2 + .38); pa.y = 1.3;
      const nrm = new THREE.Vector3(Math.sin(ry), 0, Math.cos(ry)); pa.addScaledVector(nrm, -.015);
      const plq = K.text([`「${p.title}」`, p.artist, `${p.year}년`], .36, .24, { at: pa.toArray(), rot: [0, ry, 0], bg: '#d9c9a0', color: '#2b2116', size: .14, lh: 1.35 });
      K.zone(p.key, { ...q.zone, fov: 50, range: .45 });
      K.hot(plq, { name: `명판: ${p.title}`, goto: p.key, click: g => g.note('명판', `<div class="big">「${p.title}」</div>\n<div style="text-align:center">${p.artist}\n<b>${p.year}년</b></div>`) });
      if (p.key !== 'abstract') K.hot(fr, {
        name: `「${p.title}」`, goto: p.key, click: g => g.say(talk[p.key], 4),
        useAny: (g, id) => { g.sound.play('wrong'); g.say(id === 'uvTorch' ? '보랏빛을 비춰 보았지만 아무것도 떠오르지 않는다.' : '그림에 손대면 경보가 울릴 것 같다.'); },
      });
      // 그림 조명
      const lp = new THREE.Vector3(...q.at).addScaledVector(nrm, 1.3); lp.y = 3.45;
      K.spot(0xffe6c4, 8, 6, q.at, { at: lp.toArray(), angle: .36, penumbra: .55 });
      const lampG = K.group({ at: new THREE.Vector3(...q.at).addScaledVector(nrm, .25).setY(2.95).toArray(), rot: [0, ry, 0] });
      K.box(.5, .03, .03, MAT.brass(), { parent: lampG });
      K.cyl(.035, .045, .14, MAT.plain(0x1a1a1a, .4, .5), { parent: lampG, at: [0, -.02, .1], rot: [.9, 0, 0] });
    }
    // 「네 개의 창」 + 자외선 글씨
    const uv = K.picture(1.2, 1.2, (g, w, h) => {
      g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = "800 150px 'Noto Sans KR', sans-serif";
      g.shadowColor = '#d7a6ff'; g.shadowBlur = 24; g.fillStyle = '#f0dcff';
      for (const [x, y, cw, ch, , n] of CELLS) g.fillText(n, (x + cw / 2) * w, (y + ch / 2) * h);
    }, { parent: frames.abstract, at: [0, 0, .006], transparent: true, emissive: 1.4 });
    uv.material.opacity = 0; uv.userData.noRay = true;
    const uvLight = K.point(0x9a4aff, 0, 3, { at: [3.3, 1.75, -.8] });
    K.hot(frames.abstract, {
      name: '「네 개의 창」', goto: 'abstract', click: g => g.say(s.uv ? '보랏빛 아래 색 창마다 숫자가 떠 있다.' : talk.abstract, 4),
      use: {
        uvTorch: g => {
          if (!s.uv) { s.uv = true; g.sound.play('magic'); g.tween(uv.material, { opacity: 1 }, 1.2); g.tween(uvLight, { intensity: 2.5 }, .8); }
          g.wait(1.3).then(() => g.note('보랏빛 아래의 「네 개의 창」', uvSVG() + '\n<div style="text-align:center">보이지 않던 잉크로 숫자가 적혀 있다.</div>'));
        }
      },
      useAny: (g, id) => { g.sound.play('wrong'); g.say('그림에 손대면 경보가 울릴 것 같다.'); },
    });

    // ---------- 가운데: 조각상 ----------
    const plinth = K.group({ at: [0, 0, .2] });
    K.box(.8, .08, .8, marble, { parent: plinth, at: [0, .04, 0] });
    K.box(.7, .86, .7, marble, { parent: plinth, at: [0, .5, 0] });
    K.box(.84, .08, .84, marble, { parent: plinth, at: [0, .97, 0] });
    K.text(['「바라보는 사람」', '작자 미상'], .5, .14, { parent: plinth, at: [0, .78, .352], bg: '#c8a860', color: '#2b2116', size: .3, lh: 1.25 });
    const drawer = K.group({ parent: plinth, at: [0, .45, .33] });
    K.box(.42, .14, .03, marble, { parent: drawer, at: [0, 0, .02] });
    K.box(.06, .015, .02, MAT.brass(), { parent: drawer, at: [0, 0, .04] });
    K.box(.38, .02, .3, dark, { parent: drawer, at: [0, -.06, -.14] });
    const filterMesh = K.group({ parent: drawer, at: [0, -.03, -.1], rot: [-PI / 2 + .3, 0, 0] }); filterModel(K, filterMesh);
    K.hot(plinth, { name: '받침대', zone: 'statue', click: g => g.say(s.statue ? '서랍이 열려 있다.' : '대리석 받침대. 앞쪽에 가느다란 서랍 틈이 보인다. 꿈쩍도 않는다.') });
    K.hot(filterMesh, { name: '보라색 필터', zone: 'statue', enabled: () => s.statue && !s.gotFilter, click: g => { s.gotFilter = true; filterMesh.visible = false; g.give('filter'); } });
    // 돌림판 위 조각상
    const turn = K.group({ at: [0, 1.01, .2] });
    K.cyl(.3, .32, .04, MAT.brass({ roughness: .4 }), { parent: turn, at: [0, .02, 0] });
    const fig = K.group({ parent: turn, at: [0, .04, 0] });
    K.cyl(.22, .24, .06, marble, { parent: fig, at: [0, .03, 0] });
    K.lathe([[0, 0], [.21, 0], [.2, .25], [.17, .5], [.14, .68], [.17, .78], [.16, .84], [.1, .9], [.05, .92], [0, .92]], marble, { parent: fig, at: [0, .06, 0] });
    for (let i = 0; i < 7; i++) { const a = -1 + i * .33; K.cyl(.012, .02, .5, marble, { parent: fig, at: [Math.sin(a) * .19, .32, Math.cos(a) * .19], rot: [Math.cos(a) * .12, 0, -Math.sin(a) * .12] }); }
    K.cyl(.045, .05, .1, marble, { parent: fig, at: [0, 1.0, 0] });
    K.sphere(.105, marble, { parent: fig, at: [0, 1.12, 0], scale: [.95, 1.08, 1] });
    K.cone(.022, .06, marble, { parent: fig, at: [0, 1.11, .105], rot: [PI / 2, 0, 0] });
    for (const x of [-.04, .04]) K.sphere(.012, MAT.plain(0x8a8680, .4), { parent: fig, at: [x, 1.15, .093] });
    K.sphere(.07, marble, { parent: fig, at: [0, 1.17, -.09] });
    // 가리키는 팔(앞쪽 = 바라보는 쪽)
    const arm = K.group({ parent: fig, at: [.15, .86, .02], rot: [1.25, 0, -.15] });
    K.cyl(.035, .03, .42, marble, { parent: arm, at: [0, .21, 0] });
    K.sphere(.04, marble, { parent: arm, at: [0, .44, 0] });
    K.cyl(.01, .008, .08, marble, { parent: arm, at: [0, .5, 0] });
    K.cyl(.035, .03, .45, marble, { parent: fig, at: [-.17, .65, .03], rot: [.1, 0, -.12] });
    let dir = 0, turns = 0;
    K.zone('statue', { pos: [0, 1.75, 2.1], look: [0, 1.25, .2], fov: 52, range: .45 });
    K.hot(turn, {
      name: '조각상', zone: 'statue', click: g => {
        if (s.statue) { g.say('조각상이 서쪽 그림을 바라본 채 단단히 고정되었다.'); return; }
        turns++; dir = (dir + 1) % 8; g.sound.play('click');
        g.tween(turn.rotation, { y: turns * PI / 4 }, .5).then(() => {
          if (dir === 6 && !s.statue) {
            s.statue = true; g.sound.play('unlock');
            g.tween(drawer.position, { z: .62 }, 1); g.say('철컥. 받침대 서랍이 미끄러져 나왔다!');
          }
        });
      }
    });
    // 벨벳 줄
    const rope = MAT.fabric('#7a0e18', 0, [1, 4]);
    const posts = [[-.95, -.75], [.95, -.75], [.95, 1.15], [-.95, 1.15]];
    for (const [x, z] of posts) {
      K.cyl(.13, .15, .03, MAT.brass(), { at: [x, .015, z] });
      K.cyl(.022, .022, .9, MAT.brass(), { at: [x, .46, z] });
      K.sphere(.045, MAT.brass(), { at: [x, .93, z] });
    }
    for (let i = 0; i < 4; i++) {
      const [x1, z1] = posts[i], [x2, z2] = posts[(i + 1) % 4];
      const c = new THREE.QuadraticBezierCurve3(new THREE.Vector3(x1, .88, z1), new THREE.Vector3((x1 + x2) / 2, .55, (z1 + z2) / 2), new THREE.Vector3(x2, .88, z2));
      const m = K.place(new THREE.Mesh(new THREE.TubeGeometry(c, 24, .022, 8), rope), {});
      m.userData.noRay = true;
    }

    // ---------- 동쪽 남: 진열장 ----------
    const vit = K.group({ at: [3.0, 0, 1.9], rot: [0, -PI / 2, 0] });
    K.box(.8, .9, .55, walnut, { parent: vit, at: [0, .45, 0] });
    K.box(.84, .04, .59, dark, { parent: vit, at: [0, .92, 0] });
    K.text(['네 개의 창이', '차례를 안다'], .34, .12, { parent: vit, at: [0, .74, .277], bg: '#c8a860', color: '#2b2116', size: .3, lh: 1.2 });
    const btns = K.group({ parent: vit, at: [0, .55, .28] });
    K.rbox(.36, .1, .02, .01, MAT.brass(), { parent: btns });
    [COL.red, COL.blue, COL.yellow, COL.green].forEach((c, i) => K.cyl(.025, .025, .02, MAT.plain(c, .3), { parent: btns, at: [-.12 + i * .08, 0, .015], rot: [PI / 2, 0, 0] }));
    K.box(.6, .03, .4, MAT.fabric('#5a0e18', 0, [1, 1]), { parent: vit, at: [0, .955, 0] });
    const crown = K.group({ parent: vit, at: [-.12, 1.02, 0] });
    K.cyl(.09, .1, .07, MAT.gold(), { parent: crown, open: true, at: [0, .035, 0] });
    for (let i = 0; i < 8; i++) { const a = i / 8 * PI * 2; K.cone(.018, .06, MAT.gold(), { parent: crown, at: [Math.cos(a) * .095, .1, Math.sin(a) * .095] }); K.sphere(.012, MAT.glow([0xff2a4a, 0x2a8aff, 0x2aff8a][i % 3], 1.5), { parent: crown, at: [Math.cos(a) * .1, .04, Math.sin(a) * .1], shadow: false }); }
    const page2 = K.picture(.16, .21, (g, w, h) => {
      g.fillStyle = '#efe4c8'; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(60,80,140,.3)';
      for (let y = 30; y < h; y += 26) { g.beginPath(); g.moveTo(10, y); g.lineTo(w - 10, y); g.stroke(); }
      g.fillStyle = '#2b2116'; g.font = "700 30px 'Noto Serif KR', serif"; g.textAlign = 'center'; g.fillText('둘째 장', w / 2, 60);
    }, { parent: vit, at: [.17, .975, .03], rot: [-PI / 2, 0, .3], res: 256 });
    const caseG = K.group({ parent: vit, at: [0, .94, 0] });
    const gm = MAT.glass(0xd8eef8, .14);
    for (const [w, h, d, at] of [[.66, .5, .01, [0, .25, .225]], [.66, .5, .01, [0, .25, -.225]], [.01, .5, .45, [.33, .25, 0]], [.01, .5, .45, [-.33, .25, 0]], [.66, .01, .45, [0, .5, 0]]]) K.box(w, h, d, gm, { parent: caseG, at, shadow: false }).userData.noRay = true;
    for (const x of [-.33, .33]) for (const z of [-.225, .225]) K.box(.015, .5, .015, MAT.brass(), { parent: caseG, at: [x, .25, z] });
    K.point(0xfff0d8, 1.2, 1.6, { parent: vit, at: [0, 1.6, .1] });
    K.zone('vitrine', { pos: [1.85, 1.6, 1.9], look: [3.0, 1.0, 1.9], fov: 50 });
    const colSyms = [COL.red, COL.yellow, COL.blue, COL.green, COL.white, COL.black];
    K.hot(vit, {
      name: '진열장', zone: 'vitrine', click: g => {
        if (s.vitrine) return;
        g.lock({ title: '진열장 색 자물쇠', text: '색 단추 네 개를 차례로 맞추세요.', type: 'colors', symbols: colSyms, answer: [COL.blue, COL.red, COL.green, COL.yellow], onSolve: g => { s.vitrine = true; g.sound.play('open'); g.tween(caseG.position, { y: 1.32 }, 1.2); g.say('유리 덮개가 천천히 올라갔다.'); } });
      }
    });
    K.hot(page2, {
      name: '수첩 둘째 장', zone: 'vitrine', enabled: () => s.vitrine, click: g => {
        s.page2 = true;
        g.note('경비 수첩 — 둘째 장', '보안 패널 번호를 바꿨다. 잊지 않게 적어 둔다.\n\n<b>제목에 「밤」이 들어간 그림들,\n그 제작 연도의 끝 두 자리를\n오래된 그림부터 차례로.</b>\n\n명판을 보면 금방 안다.');
      }
    });

    // ---------- 남서: 경비원 책상 ----------
    const desk = K.group({ at: [-3.15, 0, 2.5], rot: [0, PI / 2, 0] });
    K.rbox(1.3, .05, .65, .01, walnut, { parent: desk, at: [0, .75, 0] });
    K.box(.4, .72, .6, walnut, { parent: desk, at: [-.42, .36, 0] });
    K.box(.04, .72, .6, walnut, { parent: desk, at: [.62, .36, 0] });
    const mon = K.group({ parent: desk, at: [-.3, .78, -.12], rot: [0, .25, 0] });
    K.rbox(.5, .34, .05, .01, MAT.plain(0x1a1a1c, .4, .3), { parent: mon, at: [0, .25, 0] });
    K.cyl(.02, .02, .08, MAT.plain(0x1a1a1c, .4, .3), { parent: mon, at: [0, .04, 0] });
    K.box(.16, .01, .1, MAT.plain(0x1a1a1c, .4, .3), { parent: mon, at: [0, .005, 0] });
    K.picture(.46, .3, (g, w, h) => {
      g.fillStyle = '#0a120e'; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 4; i++) {
        const x = (i % 2) * w / 2, y = Math.floor(i / 2) * h / 2;
        const gr = g.createLinearGradient(x, y, x, y + h / 2); gr.addColorStop(0, '#2a3a32'); gr.addColorStop(1, '#4a5a52'); g.fillStyle = gr; g.fillRect(x + 3, y + 3, w / 2 - 6, h / 2 - 6);
        g.fillStyle = '#7a8a82'; g.fillRect(x + w * .1, y + h * .12, w * .12, h * .18); g.fillRect(x + w * .3, y + h * .16, w * .1, h * .14);
        g.fillStyle = '#cfe'; g.font = '14px monospace'; g.fillText('CAM ' + (i + 1), x + 8, y + 18);
      }
      g.fillStyle = '#ff3a2a'; g.font = '700 16px monospace'; g.fillText('● REC', w - 70, h - 10);
    }, { parent: mon, at: [0, .25, .027], emissive: .9, res: 256 });
    const scan = K.box(.44, .006, .002, MAT.glow(0x9affc8, 1.2), { parent: mon, at: [0, .25, .03], shadow: false });
    scan.userData.noRay = true;
    const logMesh = K.group({ parent: desk, at: [.12, .776, .08], rot: [0, -.2, 0] });
    K.box(.32, .02, .23, MAT.leather('#2a2a3a'), { parent: logMesh });
    K.picture(.3, .21, (g, w, h) => { g.fillStyle = '#efe4c8'; g.fillRect(0, 0, w, h); g.fillStyle = '#2b2116'; g.font = "700 40px 'Noto Serif KR', serif"; g.textAlign = 'center'; g.fillText('경비 일지', w / 2, h * .45); g.font = "28px 'Noto Serif KR', serif"; g.fillText('10월 3일 밤', w / 2, h * .72); }, { parent: logMesh, at: [0, .011, 0], rot: [-PI / 2, 0, 0], res: 256 });
    K.hot(logMesh, {
      name: '경비 일지', zone: 'guard', click: g => {
        s.log = true;
        g.note('경비 일지 — 10월 3일 밤', '· 관장님 당부: 조각상 「바라보는 사람」은\n  언제나 <b>「창가의 소녀」가 바라보는 곳</b>을\n  함께 바라보게 둘 것. 그래야 받침대 서랍이 열린다.\n\n· 자외선 필터는 그 서랍 속에. 손전등에 끼워 쓸 것.\n\n· 진열장 색 자물쇠의 순서는\n  「네 개의 창」에 보이지 않는 잉크로 적어 두었다.\n\n· 보안 패널 번호는 진열장 속 둘째 장에.');
      }
    });
    const torchMesh = K.group({ parent: desk, at: [.45, .8, -.12], rot: [0, 0, PI / 2] }); torchModel(K, torchMesh, false);
    K.hot(torchMesh, { name: '경비원 손전등', zone: 'guard', click: g => { torchMesh.visible = false; g.give('torch'); } });
    K.cyl(.04, .035, .1, MAT.plain(0xe8e4dc, .3), { parent: desk, at: [-.05, .825, -.2] });
    K.cyl(.033, .033, .005, MAT.plain(0x3a2010, .3), { parent: desk, at: [-.05, .872, -.2] });
    K.chair(MAT.plain(0x2a2a2e, .5, .3), { parent: desk, at: [0, 0, .7], rot: [0, PI + .2, 0] });
    K.zone('guard', { pos: [-1.85, 1.55, 2.5], look: [-3.15, .8, 2.5], fov: 50 });
    K.hot(mon, { name: '감시 화면', zone: 'guard', click: g => g.say('카메라 네 대의 화면. 어디에도 경비원은 보이지 않는다.') });

    // 감시 카메라 (북동쪽 천장 구석)
    const camBase = K.group({ at: [3.85, 3.3, -3.35] });
    K.box(.1, .1, .1, MAT.plain(0xdedede, .5), { parent: camBase });
    const camPan = K.group({ parent: camBase, at: [-.05, -.1, .05] });
    K.cyl(.015, .015, .12, MAT.plain(0xdedede, .5), { parent: camPan, at: [0, .02, 0] });
    const camBody = K.group({ parent: camPan, at: [0, -.05, 0], rot: [.45, 0, 0] });
    K.rbox(.12, .1, .26, .02, MAT.plain(0xf2f2f2, .4), { parent: camBody, at: [0, 0, .08] });
    K.cyl(.035, .035, .03, MAT.plain(0x111111, .2, .6), { parent: camBody, at: [0, 0, .22], rot: [PI / 2, 0, 0] });
    const camLed = K.sphere(.01, MAT.glow(0xff2020, 8), { parent: camBody, at: [.04, .045, .16], shadow: false });
    K.onUpdate((dt, t) => {
      camPan.rotation.y = -PI * .25 + Math.sin(t * .35) * .6;
      camLed.visible = (t % 1.4) < .7;
      scan.position.y = .25 + ((t * .25) % 1 - .5) * .28;
    });

    // 벤치
    const bench = K.group({ at: [1.9, 0, .2] });
    K.rbox(.5, .12, 1.4, .03, MAT.leather('#2a1a14'), { parent: bench, at: [0, .45, 0] });
    for (const z of [-.6, .6]) K.box(.44, .4, .06, MAT.iron(), { parent: bench, at: [0, .2, z] });
    K.hot(bench, { name: '벤치', click: g => g.say('관람객용 가죽 벤치. 앉아 쉬고 싶지만 시간이 없다.') });

    // ---------- 남쪽: 비상문과 보안 패널 ----------
    const door = K.door({ w: 1.1, h: 2.3, mat: MAT.metal('#6a727c', { rough: .55, metal: .45 }), frameMat: MAT.iron(), at: [1.2, 0, 3.44], rot: [0, PI, 0] });
    K.picture(1.05, 2.25, (g, w, h) => {
      g.fillStyle = '#0c1410'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#1a3a24'; for (let i = 0; i < 8; i++) g.fillRect(0, h * (.55 + i * .055), w * (1 - i * .08), h * .02);
      const gr = g.createRadialGradient(w * .5, h * .15, 4, w * .5, h * .15, w * .6); gr.addColorStop(0, 'rgba(120,255,160,.6)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    }, { at: [1.2, 1.12, 3.485], rot: [0, PI, 0], emissive: .7 });
    K.text('비상구', .5, .18, { at: [1.2, 2.62, 3.47], rot: [0, PI, 0], bg: '#0a6a2a', color: '#eaffea', emissive: 1.3, size: .6 });
    K.point(0x3aff7a, .8, 2.5, { at: [1.2, 2.5, 3.2] });
    const panel = K.group({ at: [2.3, 1.35, 3.47], rot: [0, PI, 0] });
    K.rbox(.22, .32, .04, .01, MAT.metal('#2a2d33', { rough: .4 }), { parent: panel });
    K.picture(.16, .2, (g, w, h) => {
      g.fillStyle = '#111'; g.fillRect(0, 0, w, h); g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = '700 30px sans-serif';
      ['1', '2', '3', '4', '5', '6', '7', '8', '9', '⟲', '0', '✓'].forEach((k, i) => { const x = (i % 3 + .5) * w / 3, y = h * .2 + Math.floor(i / 3) * h * .2; g.fillStyle = '#2a2c30'; g.fillRect(x - 32, y - 22, 64, 44); g.fillStyle = '#ddd'; g.fillText(k, x, y); });
    }, { parent: panel, at: [0, -.04, .021], res: 256 });
    const pLed = K.box(.12, .025, .005, MAT.glow(0xff2a1a, 3), { parent: panel, at: [0, .12, .022], shadow: false });
    K.zone('exit', { pos: [1.8, 1.6, 1.7], look: [1.9, 1.4, 3.5], fov: 52 });
    K.point(0xffe2c0, 5, 4, { at: [1.4, 2.1, 2.6] }); // 비상문 쪽 보조 조명
    K.hot(door.pivot, { name: '비상문', goto: 'exit', click: g => { g.sound.play('thud'); g.say('두꺼운 철문. 옆의 보안 패널로 잠겨 있다.'); } });
    K.hot(panel, {
      name: '보안 패널', goto: 'exit', click: g => {
        g.lock({ title: '보안 패널', text: '네 자리 번호를 누르세요.', type: 'pad', answer: '8907', onSolve: async g => { pLed.material = MAT.glow(0x2aff6a, 4); g.sound.play('beep'); await g.wait(.5); g.sound.play('open'); await g.tween(door.pivot.rotation, { y: 1.4 * door.openSign }, 1.6); g.win(); } });
      }
    });

    K.dust(240, [7, 3.4, 6], { opacity: .25 });
  },
};

// ---------- 도우미 ----------
function marbleTex(K) {
  return K.canvasTexture(512, 512, (g, W, H) => {
    g.fillStyle = '#ece8e2'; g.fillRect(0, 0, W, H);
    const r = lcg(31);
    for (let i = 0; i < 60; i++) { g.fillStyle = `rgba(190,185,178,${r() * .15})`; g.beginPath(); g.arc(r() * W, r() * H, 20 + r() * 80, 0, 7); g.fill(); }
    for (let v = 0; v < 16; v++) {
      g.strokeStyle = `rgba(110,105,100,${.12 + r() * .3})`; g.lineWidth = .6 + r() * 2.2; g.beginPath();
      let x = r() * W, y = 0; g.moveTo(x, y);
      while (y < H) { x += (r() - .5) * 40; y += 10 + r() * 20; g.lineTo(x, y); }
      g.stroke();
    }
  });
}
function torchModel(K, g, uv) {
  K.cyl(.025, .025, .2, K.MAT.plain(0x1a1a1c, .4, .5), { parent: g });
  K.cyl(.04, .028, .06, K.MAT.plain(0x2a2a2e, .3, .7), { parent: g, at: [0, .13, 0] });
  K.cyl(.036, .036, .006, uv ? K.MAT.glow(0x9a4aff, 3) : K.MAT.glass(0xeef4ff, .6), { parent: g, at: [0, .163, 0] });
  K.box(.012, .03, .012, K.MAT.plain(0xc03020, .4), { parent: g, at: [.026, .02, 0] });
}
function filterModel(K, g) {
  K.torus(.05, .006, K.MAT.silver(), { parent: g });
  K.cyl(.048, .048, .006, K.MAT.glow(0x7a2aff, .6, { transparent: true, opacity: .8 }), { parent: g, rot: [PI / 2, 0, 0] });
}
function uvSVG() {
  let s = '<svg viewBox="0 0 240 240" width="250" height="250" style="display:block;margin:4px auto;background:#f2eee4;border:6px solid #111">';
  for (const [x, y, w, h, c, n] of CELLS) s += `<rect x="${x * 240}" y="${y * 240}" width="${w * 240}" height="${h * 240}" fill="${c}" stroke="#111" stroke-width="4"/><text x="${(x + w / 2) * 240}" y="${(y + h / 2) * 240 + 14}" font-size="40" font-weight="800" text-anchor="middle" fill="#f4e4ff" stroke="#5a1a8a" stroke-width="1.5">${n}</text>`;
  return s + '</svg>';
}
function drawLighthouse(g, x, base, h, w) {
  g.save();
  const beam = g.createLinearGradient(x, 0, x - w * 14, 0); beam.addColorStop(0, 'rgba(255,240,170,.55)'); beam.addColorStop(1, 'rgba(255,240,170,0)');
  g.fillStyle = beam; g.beginPath(); g.moveTo(x, base - h * .95); g.lineTo(x - w * 14, base - h * 1.4); g.lineTo(x - w * 14, base - h * .55); g.fill();
  for (let i = 0; i < 5; i++) { g.fillStyle = i % 2 ? '#f2ece0' : '#c02a20'; const y0 = base - h * (i + 1) * .16, tw = w * (1 - i * .08); g.fillRect(x - tw / 2, y0, tw, h * .16 + 1); }
  g.fillStyle = '#1a1a1a'; g.fillRect(x - w * .45, base - h * .98, w * .9, h * .04);
  const lg = g.createRadialGradient(x, base - h * .9, 1, x, base - h * .9, w * 1.6); lg.addColorStop(0, '#fffbe0'); lg.addColorStop(1, 'rgba(255,230,140,0)');
  g.fillStyle = lg; g.beginPath(); g.arc(x, base - h * .9, w * 1.6, 0, 7); g.fill();
  g.fillStyle = '#1a1a1a'; g.beginPath(); g.moveTo(x - w * .5, base - h * .97); g.lineTo(x, base - h * 1.08); g.lineTo(x + w * .5, base - h * .97); g.fill();
  g.restore();
}
function vignette(g, W, H) {
  const v = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .3, W / 2, H / 2, Math.max(W, H) * .75);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(20,10,0,.45)'); g.fillStyle = v; g.fillRect(0, 0, W, H);
}
function paintGent(g, W, H) {
  const bg = g.createRadialGradient(W * .5, H * .35, 10, W * .5, H * .45, W * .9); bg.addColorStop(0, '#5a4028'); bg.addColorStop(1, '#120a05'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
  g.fillStyle = '#8a1a14'; g.beginPath(); g.moveTo(W * .05, H); g.quadraticCurveTo(W * .1, H * .6, W * .5, H * .58); g.quadraticCurveTo(W * .9, H * .6, W * .95, H); g.fill();
  g.fillStyle = '#5a0e0a'; g.beginPath(); g.moveTo(W * .36, H * .6); g.lineTo(W * .46, H); g.lineTo(W * .3, H); g.fill(); g.beginPath(); g.moveTo(W * .64, H * .6); g.lineTo(W * .54, H); g.lineTo(W * .7, H); g.fill();
  g.fillStyle = '#c8957a'; g.fillRect(W * .44, H * .48, W * .12, H * .13);
  g.fillStyle = '#efe8da'; g.beginPath(); g.moveTo(W * .4, H * .59); g.lineTo(W * .6, H * .59); g.lineTo(W * .5, H * .8); g.fill();
  const fg = g.createRadialGradient(W * .46, H * .35, 5, W * .5, H * .4, W * .2); fg.addColorStop(0, '#f0c8a8'); fg.addColorStop(1, '#9a644e'); g.fillStyle = fg;
  g.beginPath(); g.ellipse(W * .5, H * .38, W * .14, H * .15, 0, 0, 7); g.fill();
  g.fillStyle = '#2a1a10'; g.beginPath(); g.ellipse(W * .5, H * .28, W * .155, H * .075, 0, PI, 0); g.fill();
  g.fillRect(W * .355, H * .27, W * .03, H * .12); g.fillRect(W * .615, H * .27, W * .03, H * .12);
  for (const x of [.445, .555]) { g.beginPath(); g.ellipse(W * x, H * .37, W * .018, H * .01, 0, 0, 7); g.fill(); }
  g.beginPath(); g.ellipse(W * .5, H * .455, W * .06, H * .012, 0, 0, 7); g.fill();
  g.strokeStyle = 'rgba(120,70,50,.6)'; g.lineWidth = 2; g.beginPath(); g.moveTo(W * .5, H * .38); g.lineTo(W * .49, H * .43); g.lineTo(W * .51, H * .435); g.stroke();
  g.fillStyle = '#d8b56a'; g.beginPath(); g.arc(W * .38, H * .78, W * .015, 0, 7); g.fill();
  vignette(g, W, H);
}
function paintGirl(g, W, H) {
  const bg = g.createLinearGradient(0, 0, W, 0); bg.addColorStop(0, '#20180f'); bg.addColorStop(1, '#4a3a28'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
  const wx = W * .5, wy = H * .1, ww = W * .42, wh = H * .5;
  const sky = g.createLinearGradient(0, wy, 0, wy + wh * .62); sky.addColorStop(0, '#1a2a4a'); sky.addColorStop(1, '#d88a52'); g.fillStyle = sky; g.fillRect(wx, wy, ww, wh * .62);
  const sea = g.createLinearGradient(0, wy + wh * .62, 0, wy + wh); sea.addColorStop(0, '#2a4a5a'); sea.addColorStop(1, '#0e1a22'); g.fillStyle = sea; g.fillRect(wx, wy + wh * .62, ww, wh * .38);
  g.save(); g.beginPath(); g.rect(wx, wy, ww, wh); g.clip();
  drawLighthouse(g, wx + ww * .78, wy + wh * .66, wh * .5, ww * .06);
  g.fillStyle = '#1a120c'; for (const bx of [.2, .45]) { g.beginPath(); g.moveTo(wx + ww * bx, wy + wh * .75); g.lineTo(wx + ww * (bx + .12), wy + wh * .75); g.lineTo(wx + ww * (bx + .1), wy + wh * .79); g.lineTo(wx + ww * (bx + .02), wy + wh * .79); g.fill(); g.fillRect(wx + ww * (bx + .055), wy + wh * .6, 2, wh * .15); }
  g.restore();
  g.strokeStyle = '#2a1a0e'; g.lineWidth = 10; g.strokeRect(wx, wy, ww, wh); g.lineWidth = 6;
  g.beginPath(); g.moveTo(wx + ww / 2, wy); g.lineTo(wx + ww / 2, wy + wh); g.moveTo(wx, wy + wh * .45); g.lineTo(wx + ww, wy + wh * .45); g.stroke();
  g.fillStyle = '#5a4028'; g.fillRect(wx - 20, wy + wh, ww + 40, H * .03);
  // 소녀: 옆모습, 오른쪽(창)을 본다
  g.fillStyle = '#2a4a7a'; g.beginPath(); g.moveTo(W * .1, H); g.quadraticCurveTo(W * .12, H * .62, W * .28, H * .55); g.quadraticCurveTo(W * .44, H * .58, W * .46, H * .75); g.lineTo(W * .5, H); g.fill();
  g.fillStyle = '#1e3a64'; g.beginPath(); g.moveTo(W * .3, H * .62); g.quadraticCurveTo(W * .42, H * .66, W * .5, H * .64); g.lineTo(W * .5, H * .68); g.quadraticCurveTo(W * .4, H * .7, W * .3, H * .68); g.fill();
  g.fillStyle = '#e8c0a0'; g.fillRect(W * .29, H * .47, W * .06, H * .09);
  const fg = g.createRadialGradient(W * .38, H * .4, 4, W * .34, H * .42, W * .1); fg.addColorStop(0, '#ffd8b8'); fg.addColorStop(1, '#b07a5a'); g.fillStyle = fg;
  g.beginPath(); g.ellipse(W * .33, H * .41, W * .075, H * .075, 0, 0, 7); g.fill();
  g.beginPath(); g.moveTo(W * .4, H * .4); g.lineTo(W * .425, H * .43); g.lineTo(W * .395, H * .44); g.fill();
  g.fillStyle = '#3a200e'; g.beginPath(); g.ellipse(W * .31, H * .385, W * .07, H * .07, -.3, PI * .55, PI * 1.75); g.fill();
  g.beginPath(); g.arc(W * .245, H * .4, W * .04, 0, 7); g.fill();
  g.fillStyle = '#1a0e06'; g.beginPath(); g.ellipse(W * .375, H * .405, W * .01, H * .006, 0, 0, 7); g.fill();
  g.fillStyle = 'rgba(255,200,140,.18)'; g.beginPath(); g.moveTo(wx, wy); g.lineTo(W * .3, H * .3); g.lineTo(W * .3, H * .7); g.lineTo(wx, wy + wh); g.fill();
  vignette(g, W, H);
}
function paintGarden(g, W, H) {
  const sky = g.createLinearGradient(0, 0, 0, H * .6); sky.addColorStop(0, '#0a1230'); sky.addColorStop(1, '#2a3a6a'); g.fillStyle = sky; g.fillRect(0, 0, W, H);
  const r = lcg(14);
  g.fillStyle = '#fffbe8'; g.beginPath(); g.arc(W * .74, H * .2, W * .06, 0, 7); g.fill();
  const mg = g.createRadialGradient(W * .74, H * .2, 4, W * .74, H * .2, W * .2); mg.addColorStop(0, 'rgba(255,250,220,.4)'); mg.addColorStop(1, 'rgba(255,250,220,0)'); g.fillStyle = mg; g.fillRect(0, 0, W, H);
  g.fillStyle = '#0c1a14'; g.fillRect(0, H * .6, W, H * .4);
  for (let i = 0; i < 14; i++) { const x = r() * W, y = H * (.45 + r() * .2), rr = W * (.05 + r() * .08); g.fillStyle = `rgb(${10 + r() * 10 | 0},${24 + r() * 20 | 0},${20 + r() * 12 | 0})`; g.beginPath(); g.arc(x, y, rr, 0, 7); g.fill(); g.fillRect(x - 3, y, 6, H * .2); }
  g.fillStyle = '#16243a'; g.beginPath(); g.ellipse(W * .55, H * .82, W * .2, H * .06, 0, 0, 7); g.fill();
  g.fillStyle = 'rgba(255,250,220,.6)'; g.beginPath(); g.ellipse(W * .58, H * .82, W * .025, H * .012, 0, 0, 7); g.fill();
  g.strokeStyle = '#6a6a5a'; g.lineWidth = 12; g.beginPath(); g.moveTo(W * .1, H); g.quadraticCurveTo(W * .35, H * .78, W * .3, H * .66); g.stroke();
  for (const [x, y] of [[.2, .55], [.38, .6], [.86, .58], [.12, .7], [.66, .62]]) {
    const lg = g.createRadialGradient(W * x, H * y, 2, W * x, H * y, W * .05); lg.addColorStop(0, '#ffe0a0'); lg.addColorStop(.3, '#ff9a3a'); lg.addColorStop(1, 'rgba(255,140,40,0)');
    g.fillStyle = lg; g.beginPath(); g.arc(W * x, H * y, W * .05, 0, 7); g.fill();
  }
  vignette(g, W, H);
}
function paintHarbour(g, W, H) {
  const sky = g.createLinearGradient(0, 0, 0, H * .6); sky.addColorStop(0, '#060a1c'); sky.addColorStop(1, '#2a3050'); g.fillStyle = sky; g.fillRect(0, 0, W, H);
  const r = lcg(22);
  for (let i = 0; i < 90; i++) { g.fillStyle = `rgba(255,255,240,${r() * .8})`; g.fillRect(r() * W, r() * H * .5, 1.5, 1.5); }
  const sea = g.createLinearGradient(0, H * .6, 0, H); sea.addColorStop(0, '#1a2a40'); sea.addColorStop(1, '#05080e'); g.fillStyle = sea; g.fillRect(0, H * .6, W, H * .4);
  g.fillStyle = '#0a0c12'; g.beginPath(); g.moveTo(W * .7, H * .62); g.lineTo(W, H * .5); g.lineTo(W, H * .66); g.fill();
  drawLighthouse(g, W * .84, H * .58, H * .42, W * .035);
  g.fillStyle = 'rgba(255,230,150,.35)'; for (let i = 0; i < 18; i++) g.fillRect(W * .84 - 10 + (r() - .5) * 20, H * (.64 + i * .018), 20 + r() * 20, 2);
  g.fillStyle = '#0a0a0e'; for (const bx of [.15, .32, .52]) { g.beginPath(); g.moveTo(W * bx, H * .7); g.lineTo(W * (bx + .1), H * .7); g.lineTo(W * (bx + .085), H * .74); g.lineTo(W * (bx + .015), H * .74); g.fill(); g.fillRect(W * (bx + .048), H * .45, 2, H * .25); }
  g.fillStyle = '#ffcc66'; for (const bx of [.18, .37, .55]) g.fillRect(W * bx, H * .69, 3, 3);
  g.fillStyle = '#0c0a08'; g.fillRect(0, H * .86, W * .45, H * .14);
  vignette(g, W, H);
}
function paintAbstract(g, W, H) {
  g.fillStyle = '#f2eee4'; g.fillRect(0, 0, W, H);
  for (const [x, y, w, h, c] of CELLS) { g.fillStyle = c; g.fillRect(x * W, y * H, w * W, h * H); }
  g.strokeStyle = '#111'; g.lineWidth = 12;
  for (const [x, y, w, h] of CELLS) g.strokeRect(x * W, y * H, w * W, h * H);
  g.lineWidth = 9; g.beginPath(); g.moveTo(0, H * .49); g.lineTo(W, H * .49); g.moveTo(W * .49, 0); g.lineTo(W * .49, H); g.moveTo(W * .96, 0); g.lineTo(W * .96, H); g.stroke();
}

export const solution = [
  { hot: '경비 일지' },
  { hot: '경비원 손전등' },
  { hot: '「창가의 소녀」' },
  { hot: '「밤의 항구」' },
  { hot: '조각상' }, { hot: '조각상' }, { hot: '조각상' }, { hot: '조각상' }, { hot: '조각상' }, { hot: '조각상', wait: 1.5 },
  { hot: '보라색 필터' },
  { combine: ['torch', 'filter'] },
  { hot: '「네 개의 창」', item: 'uvTorch', wait: 2 },
  { hot: '진열장', lock: [COL.blue, COL.red, COL.green, COL.yellow] },
  { hot: '수첩 둘째 장' },
  { hot: '명판: 밤의 항구' },
  { hot: '명판: 한밤의 정원' },
  { hot: '보안 패널', lock: '8907', wait: 3 },
];
