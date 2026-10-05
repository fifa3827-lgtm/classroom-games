// 9단계: 1207호 (호텔)
// 흐름: TV 켜기(메시지 알림·미니바 요금표) / 객실 전화 음성 메시지(카드키를 반으로 잘라 숨겼다)
//       휴지통 영수증(콜라1·맥주2·초콜릿1) + TV 요금표 → 미니바 숫자 자물쇠 19500 → 카드 조각(끝 쪽)
//       샤워 손잡이 돌리기 → 김 서린 욕실 거울에 「금고 4826」 → 옷장 열기 → 금고 키패드 → 카드 조각(칩 쪽)
//       두 조각 조합 → 카드키 → 객실 문 → 탈출
const PI = Math.PI;
const PRICES = [['생수', 2000], ['콜라', 3500], ['맥주', 6000], ['땅콩', 5500], ['초콜릿', 4000], ['와인', 18000]];
const ROAD = [170, 192];   // 야경 그림에서 지평선 아래 도로 두 줄의 높이(픽셀)
const won = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const lcg = seed => () => (seed = (seed * 16807) % 2147483647) / 2147483647;

export default {
  title: '1207호',
  intro: '호텔 침대 위에서 눈을 떴다.\n창밖으로 도시의 불빛이 끝없이 깔려 있다.\n문은 잠겼고, 카드키가 보이지 않는다.\n\n<i>방 안의 기계들이 무언가 알려 줄지도 모른다.</i>',
  outro: '삑— 초록 불. 문이 부드럽게 열린다.\n조용한 복도 끝, 엘리베이터가 기다리고 있다.\n로비에 내려가니 쪽지 한 장: 「미술관에서 보자.」',
  env: .35, exposure: 1.05, bloom: .2, bg: 0x05060c,
  start: { pos: [.2, 1.6, 1.0], look: [0, 1.45, -3.5] },

  items: {
    cardA: { name: '카드키 조각 (칩 쪽)', desc: '반으로 잘린 카드키. 금색 칩이 박힌 쪽이다.', model: (K, g) => cardPic(K, g, 0), iconRot: [0, 0, 0] },
    cardB: { name: '카드키 조각 (끝 쪽)', desc: '반으로 잘린 카드키. 「07」이 보인다.', model: (K, g) => cardPic(K, g, 1), iconRot: [0, 0, 0] },
    keycard: { name: '1207호 카드키', desc: '두 조각을 홈에 맞춰 끼웠다. 칩과 안테나가 다시 이어졌다.', model: (K, g) => { cardPic(K, g, 0, -.0215); cardPic(K, g, 1, .0215); }, iconRot: [0, 0, 0] },
  },
  combos: [['cardA', 'cardB', 'keycard', g => g.say('딸깍, 두 조각이 홈에 맞물렸다. 카드키 완성!')]],

  hints: [
    { when: s => !s.vm, text: ['침대 옆 탁자에서 무언가 빨갛게 깜박여요.', '객실 전화에 음성 메시지가 와 있어요.', '창 쪽 침대 옆 탁자의 객실 전화를 누르세요.'] },
    { when: s => !s.minibar, text: ['메시지에서 영수증은 휴지통, 값은 TV라고 했어요.', 'TV 화면을 눌러 켜면 미니바 요금표가 나와요. 휴지통 영수증의 개수와 곱해 더하세요.', '콜라 3,500 + 맥주 6,000×2 + 초콜릿 4,000 = 19,500. 미니바 자물쇠에 19500.'] },
    { when: (s, g) => !s.gotB, text: ['열린 미니바 안의 카드 조각을 집으세요.'] },
    { when: s => !s.shower, text: ['메시지가 「뜨거운 물」 이야기를 했죠.', '욕실로 들어가 샤워 부스 안 손잡이를 돌려 보세요.', '샤워 손잡이를 누르고, 김이 서린 세면대 거울을 보세요.'] },
    { when: s => !s.safe, text: ['김 서린 거울에 손가락 글씨가 나타났어요.', '금고는 옷장 안에 있어요. 옷장 문을 먼저 밀어 여세요.', '옷장 금고 키패드에 4826.'] },
    { when: (s, g) => !s.gotA, text: ['금고 안의 카드 조각을 집으세요.'] },
    { when: (s, g) => !g.has('keycard'), text: ['카드 조각 두 개가 가방에 있어요.', '가방에서 두 조각을 차례로 눌러 맞춰 끼우세요.'] },
    { text: ['완성한 카드키를 고르고 객실 문이나 옆의 카드 리더기를 누르세요.'] },
  ],

  build(K) {
    const { THREE, MAT, s } = K;
    const W = 7, D = 7, H = 2.8;
    const wallC = '#8e8476', walnut = MAT.wood('#3a2a1e'), dark = MAT.wood('#22180f');

    // ---------- 방 ----------
    K.plane(W, D, MAT.floor('#4a3626', [3.5, 3.5]), { rot: [-PI / 2, 0, 0] });
    K.plane(W, D, MAT.plaster('#d8d2c6', [3.5, 3.5]), { rot: [PI / 2, 0, 0], at: [0, H, 0] });
    K.plane(D, H, MAT.plaster(wallC, [3.5, 1.4]), { at: [-W / 2, H / 2, 0], rot: [0, PI / 2, 0] });
    K.plane(D, H, MAT.plaster(wallC, [3.5, 1.4]), { at: [W / 2, H / 2, 0], rot: [0, -PI / 2, 0] });
    K.plane(W, H, MAT.plaster(wallC, [3.5, 1.4]), { at: [0, H / 2, D / 2], rot: [0, PI, 0] });
    const nWall = MAT.plaster(wallC, [1, 1]);
    K.box(W, .45, .12, nWall, { at: [0, .225, -D / 2] });
    K.box(W, .25, .12, nWall, { at: [0, H - .125, -D / 2] });
    for (const x of [-3.15, 3.15]) K.box(.7, 2.1, .12, nWall, { at: [x, 1.5, -D / 2] });
    // 걸레받이
    for (const [len, at, ry] of [[D, [-W / 2 + .01, .06, 0], PI / 2], [D, [W / 2 - .01, .06, 0], -PI / 2], [W, [0, .06, D / 2 - .01], PI]]) K.box(len, .12, .02, dark, { at, rot: [0, ry, 0] });
    // 천장 간접등 띠
    const cove = MAT.glow(0xffd9a8, 1.6);
    K.box(.04, .02, 6.6, cove, { at: [W / 2 - .12, H - .04, 0], shadow: false });
    K.box(.04, .02, 6.6, cove, { at: [-W / 2 + .12, H - .04, 0], shadow: false });
    for (const [x, z] of [[-1.6, -1.6], [1.6, -1.6], [-1.6, 1.0], [1.6, 1.0], [0, -.3]]) K.cyl(.06, .06, .01, MAT.glow(0xfff0d8, 3), { at: [x, H - .006, z], shadow: false });

    // ---------- 빛 ----------
    K.scene.add(new THREE.HemisphereLight(0x9fa8d0, 0x3a2a20, .95));
    K.point(0xffd7a8, 6.5, 10, { at: [.3, 2.55, 0], shadow: true });
    K.point(0x5a6aff, 2.6, 7, { at: [0, 1.8, -3.0] });

    // ---------- 북쪽: 큰 창과 야경 ----------
    K.plane(5.6, 2.1, MAT.glass(0x9fb8d8, .1), { at: [0, 1.5, -3.47] }).userData.noRay = true;
    const frameM = MAT.plain(0x15161a, .4, .7);
    for (const x of [-2.8, -1.4, 0, 1.4, 2.8]) K.box(.05, 2.1, .08, frameM, { at: [x, 1.5, -3.46] });
    K.box(5.7, .05, .08, frameM, { at: [0, 2.55, -3.46] });
    K.box(5.8, .06, .3, MAT.stone('#d6d0c4', [2, .3]), { at: [0, .45, -3.36] });
    const tw = [];
    let tower = null;
    const city = K.picture(30, 16, (g, Wp, Hp) => {
      const r = lcg(77), hz = Hp * .525;
      const sky = g.createLinearGradient(0, 0, 0, hz + 40);
      sky.addColorStop(0, '#04061a'); sky.addColorStop(.55, '#141a44'); sky.addColorStop(.85, '#3c2f5a'); sky.addColorStop(1, '#7a4a52');
      g.fillStyle = sky; g.fillRect(0, 0, Wp, Hp);
      for (let i = 0; i < 160; i++) { g.fillStyle = `rgba(255,255,255,${r() * .6})`; g.fillRect(r() * Wp, r() * hz * .7, 2, 2); }
      g.fillStyle = '#f2ecd8'; g.beginPath(); g.arc(Wp * .8, Hp * .14, 34, 0, 7); g.fill();
      g.fillStyle = sky; g.beginPath(); g.arc(Wp * .8 + 16, Hp * .14 - 8, 32, 0, 7); g.fill();
      for (let i = 0; i < 6; i++) { g.fillStyle = 'rgba(120,100,150,.12)'; g.beginPath(); g.ellipse(r() * Wp, hz * (.35 + r() * .4), 200 + r() * 300, 18 + r() * 20, 0, 0, 7); g.fill(); }
      const layerDraw = (minTop, maxTop, minW, maxW, col, ww, wh, lit, xr = [0, Wp], keepTw = 0) => {
        let x = xr[0] - 10;
        while (x < xr[1]) {
          const w = minW + r() * (maxW - minW), top = minTop + r() * (maxTop - minTop);
          g.fillStyle = col; g.fillRect(x, top, w, Hp - top);
          if (r() < .3) { g.fillRect(x + w * .4, top - 14 - r() * 30, 3, 40); }
          for (let wy = top + 8; wy < Hp; wy += wh * 1.8) for (let wx = x + 4; wx < x + w - ww - 2; wx += ww * 1.9) {
            if (r() < lit) {
              const warm = r() < .7; g.fillStyle = warm ? `rgba(255,${200 + r() * 40 | 0},${120 + r() * 60 | 0},${.55 + r() * .45})` : `rgba(190,220,255,${.5 + r() * .4})`;
              g.fillRect(wx, wy, ww, wh);
              if (keepTw && r() < keepTw) tw.push([(wx + ww / 2) / Wp, (wy + wh / 2) / Hp]);
            }
          }
          if (!tower || (top - 4) / Hp < tower[1]) tower = [(x + w / 2) / Wp, (top - 4) / Hp];
          x += w + r() * 6;
        }
      };
      layerDraw(hz - 30, hz + 50, 30, 80, '#0d1022', 3, 3, .35, [0, Wp], .01);
      tower = null;
      layerDraw(hz - 150, hz + 120, 60, 150, '#090b18', 5, 5, .3, [0, Wp], .02);
      // 도로
      g.fillStyle = '#05060c'; g.fillRect(0, hz + ROAD[0] - 18, Wp, 60);
      g.strokeStyle = 'rgba(255,200,120,.5)'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, hz + ROAD[0]); g.lineTo(Wp, hz + ROAD[0]); g.stroke();
      g.strokeStyle = 'rgba(255,80,60,.4)'; g.beginPath(); g.moveTo(0, hz + ROAD[1]); g.lineTo(Wp, hz + ROAD[1]); g.stroke();
      layerDraw(hz + 120, hz + 260, 120, 220, '#06070f', 8, 7, .25, [0, 520], .03);
      layerDraw(hz + 120, hz + 260, 120, 220, '#06070f', 8, 7, .25, [1520, Wp], .03);
    }, { at: [0, 2, -12], emissive: .95, res: 2048 });
    K.hot(city, { name: '창밖 야경', click: g => g.say('열두 층 아래로 도시가 반짝인다. 창은 열리지 않는다.') });
    const dot = K.canvasTexture(32, 32, (g) => { const gr = g.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 32, 32); });
    const toWorld = ([u, v], z) => [(u - .5) * 30, 10 - v * 16, z];
    const twMats = [];
    for (let k = 0; k < 3; k++) {
      const list = tw.filter((_, i) => i % 3 === k), p = new Float32Array(list.length * 3);
      list.forEach((q, i) => p.set(toWorld(q, -11.9), i * 3));
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(p, 3));
      const m = new THREE.PointsMaterial({ size: 5, sizeAttenuation: false, map: dot, color: [0xffd9a0, 0xbfe0ff, 0xffffff][k], transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
      const pts = new THREE.Points(geo, m); pts.userData.noRay = true; K.scene.add(pts); twMats.push(m);
    }
    const aviation = K.sphere(.08, MAT.glow(0xff2a1a, 8), { at: toWorld(tower ?? [.5, .4], -11.85), shadow: false });
    aviation.userData.noRay = true;
    // 지나가는 차 불빛
    const NC = 70, cp = new Float32Array(NC * 3), cs = [];
    const roadY1 = 10 - (1092 * .525 + ROAD[0]) / 1092 * 16, roadY2 = 10 - (1092 * .525 + ROAD[1]) / 1092 * 16;
    for (let i = 0; i < NC; i++) { const lane = i % 2; cs.push({ x: -5.5 + Math.random() * 11, lane, sp: (lane ? -1 : 1) * (.6 + Math.random() * .6) }); }
    const carGeo = new THREE.BufferGeometry(); carGeo.setAttribute('position', new THREE.BufferAttribute(cp, 3));
    const carCol = new Float32Array(NC * 3); cs.forEach((c, i) => carCol.set(c.lane ? [1, .25, .2] : [1, .92, .75], i * 3));
    carGeo.setAttribute('color', new THREE.BufferAttribute(carCol, 3));
    const cars = new THREE.Points(carGeo, new THREE.PointsMaterial({ size: 3.5, sizeAttenuation: false, map: dot, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    cars.userData.noRay = true; K.scene.add(cars);
    // 커튼
    const drapes = [];
    for (const x of [-3.0, 3.0]) drapes.push(K.box(.5, 2.5, .08, MAT.fabric('#5a4a3e', 0, [1, 3]), { at: [x, 1.4, -3.3] }));
    const sheer = K.plane(1.6, 2.4, MAT.plain(0xf4efe6, .9, 0, { transparent: true, opacity: .35, side: THREE.DoubleSide }), { at: [-2.1, 1.45, -3.34] });
    sheer.userData.noRay = true;
    K.box(6.8, .04, .04, MAT.brass(), { at: [0, 2.68, -3.3] });
    K.onUpdate((dt, t) => {
      twMats.forEach((m, k) => m.opacity = .45 + .55 * Math.abs(Math.sin(t * (.7 + k * .4) + k * 2)));
      aviation.visible = (t % 1.6) < .5;
      const a = carGeo.attributes.position.array;
      cs.forEach((c, i) => { c.x += c.sp * dt; if (c.x > 6.2) c.x = -6.2; if (c.x < -6.2) c.x = 6.2; a[i * 3] = c.x; a[i * 3 + 1] = c.lane ? roadY2 : roadY1; a[i * 3 + 2] = -11.9; });
      carGeo.attributes.position.needsUpdate = true;
      sheer.rotation.y = Math.sin(t * .6) * .05; sheer.position.z = -3.34 + Math.sin(t * .8) * .02;
      drapes[0].rotation.z = Math.sin(t * .5) * .008;
    });

    // 창가 의자와 스탠드
    const armM = MAT.fabric('#6a5a48', 0, [1, 1]);
    const chair = K.group({ at: [2.1, 0, -2.6], rot: [0, -.6, 0] });
    K.rbox(.75, .4, .7, .06, armM, { parent: chair, at: [0, .25, 0] });
    K.rbox(.75, .55, .15, .06, armM, { parent: chair, at: [0, .6, -.3] });
    for (const x of [-.35, .35]) K.rbox(.12, .25, .7, .05, armM, { parent: chair, at: [x, .5, 0] });
    for (const x of [-.3, .3]) for (const z of [-.28, .28]) K.cyl(.02, .015, .06, MAT.brass(), { parent: chair, at: [x, .03, z] });
    const fl = K.group({ at: [2.9, 0, -3.0] });
    K.cyl(.14, .16, .03, MAT.brass(), { parent: fl });
    K.cyl(.012, .012, 1.5, MAT.brass(), { parent: fl, at: [0, .76, 0] });
    K.cyl(.14, .2, .26, MAT.plain(0xf2e6d0, .9, 0, { side: THREE.DoubleSide, emissive: 0xffc890, emissiveIntensity: .7 }), { parent: fl, at: [0, 1.55, 0], open: true });
    K.point(0xffc890, 1.6, 3.5, { parent: fl, at: [0, 1.45, 0] });
    const side = K.group({ at: [1.3, 0, -2.75] });
    K.cyl(.28, .28, .03, MAT.stone('#d8d2c8', [1, 1]), { parent: side, at: [0, .55, 0] });
    K.cyl(.03, .03, .54, MAT.brass(), { parent: side, at: [0, .27, 0] });
    K.cyl(.18, .2, .02, MAT.brass(), { parent: side, at: [0, .01, 0] });
    const tray = K.group({ parent: side, at: [0, .57, 0] });
    K.cyl(.2, .2, .015, MAT.silver(), { parent: tray });
    K.cyl(.16, .16, .1, MAT.silver({ roughness: .15 }), { parent: tray, at: [-.02, .06, 0] });
    K.lathe([[0, 0], [.03, 0], [.035, .05], [.012, .14], [.012, .2], [0, .2]], MAT.glass(0x6a1020, .8), { parent: tray, at: [.13, .01, .08] });
    K.hot(tray, { name: '룸서비스 쟁반', click: g => g.say('뚜껑 덮인 접시. 안은 비어 있다. 누군가 이미 먹었다.') });

    // ---------- 동쪽: 침대 ----------
    const headM = MAT.fabric('#4a4038', 1, [3, 2]);
    K.box(.06, 2.8, 3.4, walnut, { at: [W / 2 - .03, 1.4, -.6] });
    for (let i = 0; i < 9; i++) K.box(.02, 2.8, .02, dark, { at: [W / 2 - .065, 1.4, -2.2 + i * .4] });
    K.rbox(.12, 1.25, 2.3, .04, headM, { at: [W / 2 - .12, .9, -.6] });
    K.plane(3.0, .02, MAT.glow(0xffc890, 2), { at: [W / 2 - .07, 1.62, -.6], rot: [0, -PI / 2, 0] });
    K.plane(3.0, 3.2, MAT.fabric('#3c4452', 1, [3, 3]), { at: [2.0, .004, -.6], rot: [-PI / 2, 0, 0] });
    const bed = K.group({ at: [2.25, 0, -.6] });
    K.rbox(2.1, .28, 2.1, .03, dark, { parent: bed, at: [0, .2, 0] });
    K.rbox(2.04, .26, 2.04, .08, MAT.fabric('#ece8e0', 0, [2, 2]), { parent: bed, at: [0, .47, 0] });
    K.rbox(1.55, .08, 2.12, .04, MAT.fabric('#f4f1ea', 0, [2, 2]), { parent: bed, at: [-.3, .62, 0] });
    K.rbox(.5, .085, 2.16, .03, MAT.fabric('#7a5a38', 1, [1, 3]), { parent: bed, at: [-.55, .64, 0] });
    for (const z of [-.5, .5]) { K.rbox(.22, .2, .7, .09, MAT.fabric('#f6f4ef', 0, [1, 1]), { parent: bed, at: [.82, .72, z], rot: [0, 0, .25] }); K.rbox(.16, .16, .5, .07, MAT.fabric('#8a6a48', 1, [1, 1]), { parent: bed, at: [.6, .7, z * .8], rot: [0, 0, .2] }); }
    K.hot(bed, { name: '침대', click: g => g.say('푹신한 침대. 이불이 흐트러져 있다. 얼마나 잤던 걸까.') });
    const remote = K.group({ at: [2.0, .67, -.1], rot: [0, .5, 0] });
    K.rbox(.05, .02, .18, .008, MAT.plain(0x18181c, .4), { parent: remote });
    for (let i = 0; i < 4; i++) K.cyl(.006, .006, .006, MAT.plain(0x555560, .5), { parent: remote, at: [0, .012, -.05 + i * .03] });
    K.hot(remote, { name: '리모컨', click: g => g.say('건전지가 빠진 리모컨이다. TV는 직접 눌러 켜야겠다.') });
    // 침대 옆 탁자와 스탠드
    const lamps = [];
    for (const z of [-2.15, .95]) {
      const ns = K.group({ at: [3.15, 0, z] });
      K.rbox(.5, .5, .45, .02, walnut, { parent: ns, at: [0, .25, 0] });
      K.box(.46, .02, .02, MAT.brass(), { parent: ns, at: [0, .3, .23] });
      const l = K.group({ parent: ns, at: [.05, .5, z < 0 ? .12 : -.08] });
      K.lathe([[0, 0], [.08, 0], [.09, .06], [.05, .2], [.02, .24], [0, .24]], MAT.plain(0x2a2a30, .2, .6), { parent: l });
      K.cyl(.11, .14, .2, MAT.plain(0xf2e6d0, .9, 0, { side: THREE.DoubleSide, emissive: 0xffc890, emissiveIntensity: .3 }), { parent: l, at: [0, .34, 0], open: true });
      lamps.push(K.point(0xffc890, .6, 3.5, { parent: l, at: [0, .3, 0], shadow: z < 0, res: 512 }));
    }
    // 객실 전화
    const phone = K.group({ at: [3.08, .5, -2.3], rot: [0, -PI / 2 + .3, 0] });
    K.rbox(.2, .05, .16, .02, MAT.plain(0xe8e4dc, .35), { parent: phone, at: [0, .025, 0] });
    K.rbox(.2, .035, .05, .015, MAT.plain(0xe8e4dc, .35), { parent: phone, at: [0, .065, -.05] });
    for (let i = 0; i < 9; i++) K.box(.025, .008, .02, MAT.plain(0x888888, .5), { parent: phone, at: [-.04 + (i % 3) * .035, .052, .0 + Math.floor(i / 3) * .03] });
    const led = K.sphere(.016, new THREE.MeshBasicMaterial({ color: 0x9a0808 }), { parent: phone, at: [.075, .062, .05], shadow: false });
    K.zone('bedside', { pos: [2.0, 1.45, -1.5], look: [3.15, .7, -2.2], fov: 48 });
    K.hot(phone, {
      name: '객실 전화', zone: 'bedside', click: g => {
        s.vm = true; g.sound.play('beep');
        g.note('음성 사서함', '▶ 새 메시지 1건 · 오후 11시 12분\n\n「나야. 놀랐지? 장난 좀 쳤어.\n네 카드키, 반으로 잘라서 숨겨 놨거든.\n\n한쪽은 옷장 금고 안에 있어.\n번호? 뜨거운 물 틀고 욕실 거울을 봐.\n\n다른 쪽은 미니바 안이야.\n자물쇠 번호는 내가 어젯밤 먹은 것 값을 전부 더한 금액.\n영수증은 휴지통에 버렸어. 값은 TV에 다 나와.\n\n두 조각을 맞춰 끼우면 멀쩡히 열릴 거야.\n로비에서 기다릴게.」\n\n— 메시지 끝 —', 'screen');
      }
    });
    K.onUpdate((dt, t) => { led.visible = !s.vm && (t % 1.2) < .6; });

    // ---------- 서쪽: TV, 콘솔, 미니바 ----------
    const con = K.group({ at: [-3.2, 0, -1.4], rot: [0, PI / 2, 0] });
    K.rbox(1.84, .04, .48, .01, MAT.stone('#2a2a2e', [2, 1], { rough: .25 }), { parent: con, at: [0, .57, 0] });
    K.box(1.15, .5, .44, walnut, { parent: con, at: [.325, .3, 0] });
    for (const x of [.2, .65]) { K.box(.42, .4, .02, dark, { parent: con, at: [x, .3, .225] }); K.box(.18, .015, .02, MAT.brass(), { parent: con, at: [x, .44, .24] }); }
    // 미니바 칸 (속이 빈 상자)
    K.box(.65, .04, .44, walnut, { parent: con, at: [-.575, .07, 0] });
    K.box(.02, .5, .44, walnut, { parent: con, at: [-.89, .3, 0] });
    K.box(.6, .46, .02, MAT.glow(0xdcecff, 1.2), { parent: con, at: [-.575, .3, -.2], shadow: false });
    for (const [x, c, h] of [[-.7, 0x2a6a3a, .22], [-.62, 0x8a5a1a, .18], [-.5, 0xd8e8f0, .2], [-.42, 0xa01818, .16]]) K.lathe([[0, 0], [.025, 0], [.025, h * .65], [.01, h * .8], [.01, h], [0, h]], MAT.glass(c, .85), { parent: con, at: [x, .1, -.05] });
    const mbDoor = K.group({ parent: con, at: [-.825, .3, .23] });
    K.box(.55, .42, .03, walnut, { parent: mbDoor, at: [.275, 0, 0] });
    K.text('MINIBAR', .2, .04, { parent: mbDoor, at: [.275, .14, .016], bg: '#22180f', color: '#d8b56a', size: .7 });
    const mbLock = K.group({ parent: mbDoor, at: [.46, -.02, .02] });
    K.rbox(.07, .12, .03, .006, MAT.brass(), { parent: mbLock });
    for (let i = 0; i < 5; i++) K.box(.04, .012, .012, MAT.plain(0x221a10, .5, .4), { parent: mbLock, at: [0, .045 - i * .022, .016] });
    const mbLight = K.point(0xcfe8ff, 0, 2, { parent: con, at: [-.55, .35, .1] });
    const cardBMesh = K.group({ parent: con, at: [-.62, .095, .1], rot: [-PI / 2, 0, .4], scale: 2 }); cardPic(K, cardBMesh, 1);
    K.zone('console', { pos: [-1.65, 1.3, -.7], look: [-3.1, .35, -.95], fov: 50 });
    K.hot(mbDoor, {
      name: '미니바', zone: 'console', click: g => {
        if (s.minibar) return;
        g.lock({ title: '미니바 숫자 자물쇠', text: '다섯 자리 숫자. 「합계 금액(원)」이라고 새겨져 있다.', type: 'digits', answer: '19500', onSolve: g => { s.minibar = true; g.sound.play('open'); g.tween(mbDoor.rotation, { y: -1.7 }, .9); g.tween(mbLight, { intensity: .9 }, .8); g.say('미니바가 열렸다. 차가운 불빛 속에 무언가 반짝인다.'); } });
      }
    });
    K.hot(cardBMesh, { name: '미니바 속 카드 조각', zone: 'console', enabled: () => s.minibar && !s.gotB, click: g => { s.gotB = true; cardBMesh.visible = false; g.give('cardB'); } });
    // 휴지통
    const bin = K.group({ at: [-2.95, 0, -.2] });
    K.cyl(.14, .12, .32, MAT.metal('#3a3c40', { rough: .4 }), { parent: bin, at: [0, .16, 0], open: true });
    K.cyl(.12, .12, .01, MAT.plain(0x1a1a1a), { parent: bin, at: [0, .02, 0] });
    K.sphere(.06, MAT.paper(), { parent: bin, at: [.02, .28, .01], scale: [1, .8, 1.1] });
    K.hot(bin, {
      name: '휴지통', zone: 'console', click: g => {
        s.receipt = true;
        g.note('구겨진 영수증', '<div style="text-align:center"><b>GRAND AURUM HOTEL</b>\n1207호 · 미니바 이용 내역</div><table><tr><th>품목</th><th>개수</th></tr><tr><td>콜라</td><td>1</td></tr><tr><td>맥주</td><td>2</td></tr><tr><td>초콜릿</td><td>1</td></tr></table><div style="text-align:center">합계 : <i>객실 TV 「미니바 요금」 참고</i></div>');
      }
    });
    // TV
    const tv = K.group({ at: [-3.44, 1.45, -1.4], rot: [0, PI / 2, 0] });
    K.rbox(1.5, .88, .05, .01, MAT.plain(0x0a0a0c, .25, .5), { parent: tv });
    K.plane(1.44, .82, MAT.plain(0x050608, .12, .6), { parent: tv, at: [0, 0, .026] });
    const screen = K.picture(1.44, .82, drawTV, { parent: tv, at: [0, 0, .028], emissive: 1, res: 1024 });
    screen.material.emissiveIntensity = 0; screen.visible = false;
    const tvLight = K.point(0x7a9aff, 0, 4, { at: [-2.9, 1.45, -1.4] });
    K.zone('tv', { pos: [-1.0, 1.5, -1.4], look: [-3.44, 1.4, -1.4], fov: 50 });
    K.hot(tv, {
      name: '텔레비전', zone: 'tv', click: g => {
        if (!s.tv) {
          s.tv = true; g.sound.play('switch'); screen.visible = true;
          g.tween(screen.material, { emissiveIntensity: 1.05 }, 1); g.tween(tvLight, { intensity: 1.8 }, 1);
          g.say('화면이 켜졌다. 호텔 안내 방송이다.'); return;
        }
        g.note('객실 TV', '<div style="text-align:center"><b>GRAND AURUM</b> · 오후 11:47\n\n1207호 손님, 환영합니다.\n<span style="color:#ff8a8a">● 새 음성 메시지 1건 — 객실 전화를 눌러 들으세요</span></div><table><tr><th colspan="2">미니바 요금</th></tr>' + PRICES.map(([n, p]) => `<tr><td>${n}</td><td>${won(p)}원</td></tr>`).join('') + '</table>', 'screen');
      }
    });
    K.onUpdate((dt, t) => { if (s.tv && screen.material.emissiveIntensity > .9) screen.material.emissiveIntensity = 1.02 + Math.sin(t * 40) * .02 + Math.sin(t * 3) * .02; });

    // ---------- 서쪽: 옷장과 금고 ----------
    const clo = K.group({ at: [-3.2, 0, .7], rot: [0, PI / 2, 0] });
    for (const x of [-.69, .69]) K.box(.03, 2.3, .6, walnut, { parent: clo, at: [x, 1.15, 0] });
    K.box(1.4, .03, .6, walnut, { parent: clo, at: [0, 2.285, 0] });
    K.box(1.4, .05, .6, walnut, { parent: clo, at: [0, .025, 0] });
    K.box(1.4, 2.3, .02, MAT.wood('#4a3626'), { parent: clo, at: [0, 1.15, -.29] });
    K.cyl(.012, .012, 1.34, MAT.brass(), { parent: clo, at: [0, 1.95, 0], rot: [0, 0, PI / 2] });
    for (const x of [-.5, -.1, .1, .45]) { K.torus(.03, .004, MAT.brass(), { parent: clo, at: [x, 1.97, 0] }); K.box(.38, .01, .02, MAT.wood('#c8a87a'), { parent: clo, at: [x, 1.9, 0] }); }
    K.rbox(.4, .95, .25, .1, MAT.fabric('#f2efe8', 0, [1, 2]), { parent: clo, at: [.3, 1.42, 0] });
    K.text('귀중품은 금고에 보관하세요', .5, .06, { parent: clo, at: [-.35, 1.2, -.278], bg: '#e8e2d4', size: .5 });
    const doorA = K.group({ parent: clo, at: [-.35, 1.15, .27] });
    K.box(.7, 2.26, .03, walnut, { parent: doorA });
    K.box(.02, .5, .03, MAT.brass(), { parent: doorA, at: [.3, 0, .025] });
    const doorB = K.group({ parent: clo, at: [.35, 1.15, .23] });
    K.box(.7, 2.26, .03, walnut, { parent: doorB });
    K.plane(.6, 2.0, MAT.plain(0x9aa4ae, .05, 1), { parent: doorB, at: [0, 0, .017] });
    // 금고
    const safe = K.group({ parent: clo, at: [-.35, .05, -.02] });
    const sm = MAT.metal('#2c2f35', { rough: .4 });
    K.box(.46, .03, .42, sm, { parent: safe, at: [0, .015, 0] });
    K.box(.46, .03, .42, sm, { parent: safe, at: [0, .385, 0] });
    for (const x of [-.215, .215]) K.box(.03, .4, .42, sm, { parent: safe, at: [x, .2, 0] });
    K.box(.46, .4, .03, sm, { parent: safe, at: [0, .2, -.195] });
    const sDoor = K.group({ parent: safe, at: [-.21, .2, .215] });
    K.rbox(.42, .36, .03, .01, MAT.metal('#3a3e46', { rough: .35 }), { parent: sDoor, at: [.21, 0, 0] });
    K.picture(.12, .14, (g, Wp, Hp) => {
      g.fillStyle = '#111'; g.fillRect(0, 0, Wp, Hp); g.fillStyle = '#ccc'; g.font = "700 36px sans-serif"; g.textAlign = 'center'; g.textBaseline = 'middle';
      ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].forEach((k, i) => { const x = (i % 3 + .5) * Wp / 3, y = Hp * .28 + Math.floor(i / 3) * Hp * .18; g.fillStyle = '#2a2a2e'; g.fillRect(x - 30, y - 22, 60, 44); g.fillStyle = '#ddd'; g.fillText(k, x, y); });
    }, { parent: sDoor, at: [.28, -.03, .017], res: 256 });
    K.box(.1, .03, .01, MAT.glow(0xff3a2a, 2), { parent: sDoor, at: [.28, .11, .017], shadow: false });
    K.box(.03, .1, .03, MAT.silver(), { parent: sDoor, at: [.08, 0, .03] });
    const cardAMesh = K.group({ parent: safe, at: [0, .04, .02], rot: [-PI / 2, 0, -.3], scale: 2 }); cardPic(K, cardAMesh, 0); cardAMesh.visible = false;
    K.zone('closet', { pos: [-1.5, 1.4, .75], look: [-3.2, .75, .75], fov: 52 });
    K.hot(clo, {
      name: '옷장', zone: 'closet', click: g => {
        if (s.closet) { g.say('호텔 가운이 걸려 있다. 주머니는 비어 있다.'); return; }
        s.closet = true; g.sound.play('open'); g.tween(doorA.position, { x: .33 }, .9); g.say('옷장 문을 옆으로 밀었다. 바닥에 작은 금고가 있다.');
      }
    });
    K.hot(safe, {
      name: '객실 금고', zone: 'closet', enabled: () => s.closet, click: g => {
        if (s.safe) return;
        g.lock({ title: '객실 금고', text: '네 자리 비밀번호를 누르세요.', type: 'pad', answer: '4826', onSolve: g => { s.safe = true; g.sound.play('open'); cardAMesh.visible = true; g.tween(sDoor.rotation, { y: -1.7 }, 1); g.say('금고 문이 열렸다.'); } });
      }
    });
    K.hot(cardAMesh, { name: '금고 속 카드 조각', zone: 'closet', enabled: () => s.safe && !s.gotA, click: g => { s.gotA = true; cardAMesh.visible = false; g.give('cardA'); } });

    // ---------- 남서: 욕실 ----------
    const part = MAT.plaster(wallC, [1, 1]);
    const bathWalls = [
      K.box(1.0, H, .1, part, { at: [-3.0, H / 2, 1.5] }),
      K.box(.2, H, .1, part, { at: [-1.6, H / 2, 1.5] }),
      K.box(.8, .7, .1, part, { at: [-2.1, H - .35, 1.5] }),
      K.box(.1, H, 2.0, part, { at: [-1.5, H / 2, 2.5] }),
    ];
    // 욕실 벽 어디를 눌러도 욕실 안으로 (입구 틈이 좁아서)
    for (const w of bathWalls) K.hot(w, { name: '욕실 벽', goto: 'bath', click: g => g.say('하얀 타일의 욕실. 거울과 샤워기가 보인다.') });
    for (const x of [-2.5, -1.7]) K.box(.06, 2.1, .14, dark, { at: [x, 1.05, 1.5] });
    K.box(.86, .06, .14, dark, { at: [-2.1, 2.13, 1.5] });
    const tileW = MAT.tiles('#e4e0d8', '#d6d0c6', 6, [2, 2], { rough: .2 });
    K.plane(1.95, 1.95, MAT.tiles('#2a2a2e', '#34343a', 4, [1, 1], { rough: .25 }), { at: [-2.525, .004, 2.525], rot: [-PI / 2, 0, 0] });
    K.plane(1.95, H, tileW, { at: [-3.49, H / 2, 2.525], rot: [0, PI / 2, 0] });
    K.plane(1.95, H, tileW, { at: [-2.525, H / 2, 3.49], rot: [0, PI, 0] });
    K.plane(1.0, H, tileW, { at: [-3.0, H / 2, 1.556] });
    K.plane(1.95, H, tileW, { at: [-1.556, H / 2, 2.525], rot: [0, -PI / 2, 0] });
    K.point(0xfff0d8, 3, 4, { at: [-2.5, 2.5, 2.4] });
    K.cyl(.1, .1, .01, MAT.glow(0xfff4e0, 3), { at: [-2.5, H - .006, 2.4], shadow: false });
    // 세면대
    const van = K.group({ at: [-3.22, 0, 2.2], rot: [0, PI / 2, 0] });
    K.rbox(1.0, .06, .52, .01, MAT.stone('#efeae2', [1, 1], { rough: .15 }), { parent: van, at: [0, .85, 0] });
    K.box(.96, .4, .48, walnut, { parent: van, at: [0, .6, -.01] });
    K.lathe([[0, 0], [.18, 0], [.2, .1], [.2, .12], [0, .12]], MAT.plain(0xf6f6f2, .15), { parent: van, at: [0, .86, .03], scale: [1, .6, .8] });
    K.cyl(.012, .012, .2, MAT.silver(), { parent: van, at: [0, .98, -.15] });
    K.cyl(.01, .01, .12, MAT.silver(), { parent: van, at: [0, 1.07, -.1], rot: [PI / 2, 0, 0] });
    K.hot(van, { name: '세면대', zone: 'mirror', click: g => g.say('수건과 작은 비누. 물이 미지근하다. 뜨거운 물은 샤워기에서 나올 것이다.') });
    const mir = K.group({ at: [-3.46, 1.6, 2.2], rot: [0, PI / 2, 0] });
    K.box(1.16, .86, .02, MAT.brass({ roughness: .35 }), { parent: mir, at: [0, 0, -.01] });
    K.plane(1.1, .8, MAT.plain(0x252b31, .04, 1), { parent: mir, at: [0, 0, .002] });
    const fog = K.picture(1.1, .8, drawFog, { parent: mir, at: [0, 0, .006], transparent: true, res: 512 });
    fog.material.opacity = 0;
    K.cyl(.015, .015, .9, MAT.glow(0xfff2e0, 2.5), { parent: mir, at: [0, .48, .03], rot: [0, 0, PI / 2], shadow: false });
    K.zone('mirror', { pos: [-2.3, 1.6, 2.2], look: [-3.46, 1.5, 2.2], fov: 50, parent: 'bath' });
    K.hot(mir, {
      name: '욕실 거울', zone: 'mirror', click: g => {
        if (fog.material.opacity < .5) { g.say('거울에 지친 얼굴이 비친다. 그 밖엔 아무것도 없다.'); return; }
        s.mirror = true; g.note('김 서린 거울', '<div class="big">금고\n4 8 2 6</div>\n\n뿌연 김 위에 누군가 손가락으로 써 둔 글씨다.');
      }
    });
    // 샤워 부스
    K.box(.95, .06, .9, MAT.stone('#e8e4dc', [1, 1], { rough: .3 }), { at: [-2.02, .03, 3.03] });
    const gl = MAT.glass(0xcfe4ee, .14);
    K.box(.9, 2.0, .015, gl, { at: [-2.05, 1.06, 2.56] }).userData.noRay = true;
    K.box(.015, 2.0, .92, gl, { at: [-2.5, 1.06, 3.02] }).userData.noRay = true;
    K.box(.02, 2.0, .02, MAT.silver(), { at: [-1.6, 1.06, 2.56] });
    K.cyl(.012, .012, .5, MAT.silver(), { at: [-2.0, 2.15, 3.25], rot: [PI / 2, 0, 0] });
    K.cyl(.1, .1, .02, MAT.silver(), { at: [-2.0, 2.12, 3.02] });
    const valve = K.group({ at: [-2.0, 1.15, 3.44], rot: [0, PI, 0] });
    K.cyl(.07, .07, .015, MAT.silver(), { parent: valve, rot: [PI / 2, 0, 0] });
    const lever = K.group({ parent: valve, at: [0, 0, .02] });
    K.box(.16, .025, .025, MAT.silver(), { parent: lever, at: [.06, 0, .01] });
    K.sphere(.02, MAT.silver(), { parent: lever, at: [0, 0, .01] });
    K.box(.03, .01, .002, MAT.glow(0xff3a2a, 1.5), { parent: valve, at: [-.05, .045, .01], shadow: false });
    K.box(.03, .01, .002, MAT.glow(0x3a7aff, 1.5), { parent: valve, at: [.05, .045, .01], shadow: false });
    K.zone('shower', { pos: [-2.1, 1.6, 1.75], look: [-2.0, 1.2, 3.3], fov: 52, parent: 'bath' });
    // 욕실 입구: 눌러서 욕실 안으로 들어간다 (안에서는 거울과 샤워기가 한눈에 보인다)
    K.zone('bath', { pos: [-2.1, 1.6, 1.68], look: [-2.6, 1.3, 2.7], fov: 72, range: .9 });
    const bathDoor = K.plane(.8, 2.1, new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }), { at: [-2.1, 1.05, 1.5] });
    K.hot(bathDoor, { name: '욕실', goto: 'bath', click: g => g.say('하얀 타일의 욕실. 거울과 샤워기가 보인다.') });
    // 물줄기와 김
    const mkPts = (n, size, color) => {
      const geo = new THREE.BufferGeometry(), p = new Float32Array(n * 3); geo.setAttribute('position', new THREE.BufferAttribute(p, 3));
      const m = new THREE.PointsMaterial({ size, map: dot, color, transparent: true, opacity: 0, depthWrite: false });
      const pts = new THREE.Points(geo, m); pts.userData.noRay = true; K.scene.add(pts); return { geo, m, p, n };
    };
    const water = mkPts(160, .025, 0xdfefff), steam = mkPts(220, .5, 0xf4f6f8);
    for (let i = 0; i < water.n; i++) water.p.set([-2.0 + (Math.random() - .5) * .18, Math.random() * 2.1, 3.02 + (Math.random() - .5) * .18], i * 3);
    for (let i = 0; i < steam.n; i++) steam.p.set([-3.3 + Math.random() * 1.7, Math.random() * 2.6, 1.7 + Math.random() * 1.7], i * 3);
    K.onUpdate((dt, t) => {
      if (!s.shower) return;
      const a = water.p;
      for (let i = 0; i < water.n; i++) { a[i * 3 + 1] -= dt * 3.5; if (a[i * 3 + 1] < .06) { a[i * 3 + 1] = 2.1; a[i * 3] = -2.0 + (Math.random() - .5) * .18; a[i * 3 + 2] = 3.02 + (Math.random() - .5) * .18; } }
      water.geo.attributes.position.needsUpdate = true;
      const b = steam.p;
      for (let i = 0; i < steam.n; i++) { b[i * 3 + 1] += dt * (.12 + (i % 5) * .03); b[i * 3] += Math.sin(t + i) * dt * .05; if (b[i * 3 + 1] > 2.7) b[i * 3 + 1] = .3; }
      steam.geo.attributes.position.needsUpdate = true;
    });
    K.hot(valve, {
      name: '샤워 손잡이', zone: 'shower', click: g => {
        if (s.shower) { g.say('뜨거운 물이 계속 쏟아지고 있다.'); return; }
        s.shower = true; g.sound.play('switch');
        g.tween(lever.rotation, { z: -1.4 }, .6);
        g.tween(water.m, { opacity: .7 }, .6);
        g.tween(steam.m, { opacity: .16 }, 3);
        g.tween(fog.material, { opacity: 1 }, 3.2);
        g.say('쏴아— 뜨거운 물이 쏟아진다. 욕실에 하얀 김이 차오른다.');
      }
    });

    // ---------- 남쪽: 객실 문 ----------
    const door = K.door({ w: .95, h: 2.15, mat: MAT.wood('#2e2016', [1, 2]), frameMat: dark, at: [1.0, 0, 3.44], rot: [0, PI, 0], knob: false });
    K.box(.04, .2, .04, MAT.silver(), { parent: door.pivot, at: [-door.openSign * (.95 - .1), 1.05, .05] });
    K.picture(.9, 2.1, (g, Wp, Hp) => { // 문 너머 복도
      const gr = g.createLinearGradient(0, 0, 0, Hp); gr.addColorStop(0, '#2a2016'); gr.addColorStop(1, '#4a3424'); g.fillStyle = gr; g.fillRect(0, 0, Wp, Hp);
      g.fillStyle = '#6a2a24'; g.beginPath(); g.moveTo(0, Hp); g.lineTo(Wp, Hp); g.lineTo(Wp * .6, Hp * .6); g.lineTo(Wp * .4, Hp * .6); g.fill();
      g.fillStyle = 'rgba(255,210,150,.8)'; for (let i = 0; i < 4; i++) { const y = Hp * (.15 + i * .1), w = Wp * (.3 - i * .05); g.fillRect(Wp / 2 - w / 2, y, w, 6); }
    }, { at: [1.0, 1.05, 3.485], rot: [0, PI, 0], emissive: .7 });
    K.text(['방해하지', '마세요'], .14, .3, { parent: door.pivot, at: [-door.openSign * .66, 1.3, .04], bg: '#8a1a1a', color: '#f4e8d0', size: .09 });
    const reader = K.group({ at: [1.68, 1.15, 3.47], rot: [0, PI, 0] });
    K.rbox(.08, .13, .02, .006, MAT.plain(0x111114, .3, .5), { parent: reader });
    const rLed = K.box(.03, .008, .004, MAT.glow(0xff2a1a, 4), { parent: reader, at: [0, .045, .012], shadow: false });
    K.box(.05, .05, .002, MAT.plain(0x2a2a30, .3, .6), { parent: reader, at: [0, -.01, .011] });
    K.zone('door', { pos: [1.15, 1.6, 1.7], look: [1.25, 1.3, 3.45], fov: 52 });
    const openDoor = async g => {
      if (s.out) return;
      s.out = true; g.take('keycard'); g.sound.play('beep'); rLed.material = MAT.glow(0x2aff6a, 5);
      await g.wait(.6); g.sound.play('unlock'); await g.wait(.3); g.sound.play('open');
      await g.tween(door.pivot.rotation, { y: 1.4 * door.openSign }, 1.5); g.win();
    };
    const lockedMsg = g => { g.sound.play('thud'); g.say('잠겨 있다. 문 옆 카드 리더기에 빨간 불이 켜져 있다.'); };
    K.hot(door.pivot, { name: '객실 문', goto: 'door', click: lockedMsg, use: { keycard: openDoor } });
    K.hot(reader, { name: '카드 리더기', goto: 'door', click: lockedMsg, use: { keycard: openDoor } });
    // 문 옆 그림과 가방
    K.frame(.8, 1.1, (g, Wp, Hp) => {
      g.fillStyle = '#e8e0d0'; g.fillRect(0, 0, Wp, Hp);
      const cs = ['#c8643a', '#2a3a5a', '#d8b56a', '#6a7a6a'];
      for (let i = 0; i < 4; i++) { g.fillStyle = cs[i]; g.globalAlpha = .85; g.beginPath(); g.arc(Wp * (.3 + (i % 2) * .4), Hp * (.3 + Math.floor(i / 2) * .4), Wp * (.22 - i * .02), 0, 7); g.fill(); }
      g.globalAlpha = 1; g.strokeStyle = '#1a1a1a'; g.lineWidth = 6; g.beginPath(); g.moveTo(Wp * .1, Hp * .85); g.bezierCurveTo(Wp * .4, Hp * .5, Wp * .6, Hp * .95, Wp * .9, Hp * .2); g.stroke();
    }, { at: [2.6, 1.5, 3.47], rot: [0, PI, 0], frameMat: MAT.plain(0x111111, .4, .3), border: .03 });
    const bag = K.group({ at: [-.7, 0, 3.0], rot: [0, .3, 0] });
    K.rbox(.45, .65, .26, .05, MAT.plain(0x2a4a5a, .35, .1), { parent: bag, at: [0, .36, 0] });
    for (const x of [-.12, .12]) K.cyl(.008, .008, .3, MAT.silver(), { parent: bag, at: [x, .83, 0] });
    K.box(.3, .02, .03, MAT.plain(0x111111, .5), { parent: bag, at: [0, .98, 0] });
    for (const x of [-.18, .18]) K.cyl(.025, .025, .02, MAT.plain(0x111111, .5), { parent: bag, at: [x, .025, .1], rot: [0, 0, PI / 2] });
    K.hot(bag, { name: '여행 가방', click: g => g.say('내 여행 가방이다. 지갑도, 휴대폰도 사라졌다.') });
  },
};

// ---------- 그림 ----------
function drawTV(g, W, H) {
  const gr = g.createLinearGradient(0, 0, W, H); gr.addColorStop(0, '#0b1d3a'); gr.addColorStop(1, '#1e1030'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  g.textBaseline = 'middle'; g.textAlign = 'left';
  g.fillStyle = '#d8b56a'; g.font = "700 44px 'Noto Serif KR', serif"; g.fillText('GRAND AURUM', 48, 56);
  g.textAlign = 'right'; g.fillStyle = '#fff'; g.font = "600 32px sans-serif"; g.fillText('오후 11:47', W - 48, 56);
  g.fillStyle = 'rgba(216,181,106,.6)'; g.fillRect(48, 96, W - 96, 3);
  g.textAlign = 'left'; g.fillStyle = '#fff'; g.font = "700 48px sans-serif"; g.fillText('1207호 손님,', 48, 160); g.fillText('환영합니다.', 48, 222);
  g.fillStyle = 'rgba(255,90,90,.2)'; g.fillRect(44, 280, 470, 130);
  g.fillStyle = '#ff9a9a'; g.font = "700 34px sans-serif"; g.fillText('● 새 음성 메시지 1건', 70, 322);
  g.fillStyle = '#ffe8c8'; g.font = "500 28px sans-serif"; g.fillText('객실 전화를 눌러 들으세요', 70, 372);
  const x0 = W * .56, x1 = W - 48;
  g.fillStyle = 'rgba(255,255,255,.08)'; g.fillRect(x0 - 20, 120, x1 - x0 + 40, H - 160);
  g.fillStyle = '#d8b56a'; g.font = "700 38px sans-serif"; g.fillText('미니바 요금', x0, 160);
  PRICES.forEach(([n, p], i) => {
    const y = 222 + i * 52; g.fillStyle = '#fff'; g.font = "600 34px sans-serif";
    g.textAlign = 'left'; g.fillText(n, x0, y); g.textAlign = 'right'; g.fillText(won(p) + '원', x1, y);
  });
  g.textAlign = 'left';
}
function drawFog(g, W, H) {
  const r = lcg(9);
  g.fillStyle = 'rgba(226,230,234,.94)'; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 400; i++) { g.fillStyle = `rgba(255,255,255,${r() * .25})`; g.beginPath(); g.arc(r() * W, r() * H, 2 + r() * 10, 0, 7); g.fill(); }
  g.globalCompositeOperation = 'destination-out';
  g.fillStyle = '#000'; g.strokeStyle = '#000'; g.lineWidth = 7; g.lineJoin = 'round';
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = "700 96px 'Noto Sans KR', sans-serif"; g.fillText('금고', W / 2, H * .3); g.strokeText('금고', W / 2, H * .3);
  g.font = "700 112px 'Noto Sans KR', sans-serif"; g.fillText('4 8 2 6', W / 2, H * .7); g.strokeText('4 8 2 6', W / 2, H * .7);
  for (let i = 0; i < 9; i++) { g.fillStyle = 'rgba(0,0,0,.6)'; g.fillRect(W * .15 + r() * W * .7, H * (.38 + r() * .1), 3, 20 + r() * 40); }
  g.globalCompositeOperation = 'source-over';
}
// 카드키 반쪽: part 0 = 칩 쪽(왼쪽), 1 = 끝 쪽(오른쪽)
function cardPic(K, g, part, dx = 0) {
  const m = K.picture(.043, .054, (c, W, H) => {
    const FW = W * 2;
    c.save(); c.translate(part ? -W : 0, 0);
    const gr = c.createLinearGradient(0, 0, FW, H); gr.addColorStop(0, '#1a2340'); gr.addColorStop(1, '#2a1a3a'); c.fillStyle = gr; c.fillRect(0, 0, FW, H);
    c.strokeStyle = '#d8b56a'; c.lineWidth = 6; c.strokeRect(10, 10, FW - 20, H - 20);
    c.fillStyle = '#d8b56a'; c.font = `700 ${H * .15 | 0}px 'Noto Serif KR', serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText('GRAND AURUM', FW / 2, H * .2);
    c.fillStyle = '#e8c878'; c.fillRect(FW * .1, H * .38, FW * .16, H * .24);
    c.strokeStyle = '#8a6a2a'; c.lineWidth = 3; c.strokeRect(FW * .1, H * .38, FW * .16, H * .24); c.beginPath(); c.moveTo(FW * .18, H * .38); c.lineTo(FW * .18, H * .62); c.moveTo(FW * .1, H * .5); c.lineTo(FW * .26, H * .5); c.stroke();
    c.fillStyle = '#fff'; c.font = `800 ${H * .3 | 0}px sans-serif`; c.fillText('12', FW * .38, H * .76); c.fillText('07', FW * .62, H * .76);
    c.restore();
    c.globalCompositeOperation = 'destination-out'; c.beginPath();
    const r = lcg(part ? 5 : 6), ex = part ? 0 : W; c.moveTo(ex, 0);
    for (let y = 0; y <= H; y += 18) c.lineTo(part ? 3 + r() * 8 : W - 3 - r() * 8, y);
    c.lineTo(ex, H); c.fill(); c.globalCompositeOperation = 'source-over';
  }, { parent: g, at: [dx, 0, 0], transparent: true, res: 256 });
  m.material.side = K.THREE.DoubleSide;
  return m;
}

export const solution = [
  { hot: '텔레비전', wait: 1.2 },
  { hot: '텔레비전' },
  { hot: '객실 전화' },
  { hot: '휴지통' },
  { hot: '미니바', lock: '19500' },
  { hot: '미니바 속 카드 조각' },
  { hot: '샤워 손잡이', wait: 4 },
  { hot: '욕실 거울' },
  { hot: '옷장' },
  { hot: '객실 금고', lock: '4826' },
  { hot: '금고 속 카드 조각' },
  { combine: ['cardA', 'cardB'] },
  { hot: '객실 문', item: 'keycard', wait: 3.5 },
];
