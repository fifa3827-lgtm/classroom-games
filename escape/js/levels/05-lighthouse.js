// 5단계: 꺼진 등대
// 흐름: 항해 일지(18·19·20시 기압 → 21시 981) → 책상 서랍 981 → 깔때기·성냥갑
//       북서쪽 배의 깜빡이는 불빛(모스) + 남쪽 벽 모스 부호표 → HOPE → 기름 창고 → 기름통
//       기름통+깔때기 → 렌즈 등잔에 기름 → 성냥으로 불 → 회전 손잡이로 과녁을 북서(배)로 → 배 답신 → 승강구 열림
const R = 3;              // 등실 반지름
const SHIP_B = 315;       // 배가 있는 방위(도, 북=0 시계 방향)
const D2R = Math.PI / 180;
const NAMES = ['북', '북동', '동', '남동', '남', '남서', '서', '북서'];
const dirOf = (b, r = 1) => [Math.sin(b * D2R) * r, -Math.cos(b * D2R) * r];
const onWall = (b, r, y) => ({ at: [dirOf(b, r)[0], y, dirOf(b, r)[1]], rot: [0, -b * D2R, 0] });
const MORSE = {
  A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.', G: '--.', H: '....', I: '..', J: '.---', K: '-.-', L: '.-..', M: '--',
  N: '-.', O: '---', P: '.--.', Q: '--.-', R: '.-.', S: '...', T: '-', U: '..-', V: '...-', W: '.--', X: '-..-', Y: '-.--', Z: '--..',
};
const pretty = c => c.replace(/\./g, '·').replace(/-/g, '−');
// 깜빡임 순서: [켜짐?, 초]
function morseSchedule(word) {
  const u = .3, seq = [];
  for (const ch of word) {
    for (const c of MORSE[ch]) { seq.push([1, c === '.' ? u : u * 3]); seq.push([0, u]); }
    seq[seq.length - 1][1] = u * 4;
  }
  seq[seq.length - 1][1] = u * 10;
  return seq;
}
const lensR = y => .64 - .14 * Math.pow((y - .68) / .68, 2);   // 렌즈 둘레 모양

export default {
  title: '꺼진 등대',
  intro: '폭풍우 치는 밤, 등대 꼭대기 등불 방에 갇혔다.\n등은 꺼져 있고, 바닥 승강구는 아래에서 잠겼다.\n승강구 위에 쪽지가 놓여 있다.\n\n<i>「등을 밝혀 저 배에 답해 주면 열어 주지. — 등대지기」</i>',
  outro: '승강구가 열리고 나선 계단이 아래로 이어진다.\n멀리 배가 암초를 비켜 항구 쪽으로 뱃머리를 돌린다.\n계단 끝에서 마른 모래 냄새가 올라온다…',
  env: .3, exposure: 1.1, bloom: .6, bg: 0x0a0e14,
  start: { pos: [0, 1.65, 1.75], look: [0, 1.4, -2] },

  items: {
    funnel: { name: '양철 깔때기', desc: '좁은 주둥이에 무언가를 부을 때 쓴다.', model: (K, g) => { K.lathe([[.012, 0], [.014, .07], [.09, .16], [.095, .17]], K.MAT.metal('#a8adb3', { rough: .4 }), { parent: g }).material.side = K.THREE.DoubleSide; } },
    matches: { name: '성냥갑', desc: '눅눅하지 않은 성냥이 몇 개비 남아 있다.', model: (K, g) => { K.box(.11, .025, .07, K.MAT.plain(0x9a2a1e, .7), { parent: g }); K.box(.11, .026, .015, K.MAT.plain(0x3a2a1a, .9), { parent: g, at: [0, 0, .03] }); } },
    oilCan: { name: '등유 기름통', desc: '묵직하다. 주둥이가 넓어 그냥 부으면 흘러넘칠 것 같다.', model: oilCanModel(false) },
    fuelCan: { name: '깔때기 꽂은 기름통', desc: '이제 좁은 등잔에도 흘리지 않고 부을 수 있다.', model: oilCanModel(true) },
  },
  combos: [['oilCan', 'funnel', 'fuelCan']],

  hints: [
    { when: s => !s.drawer, text: ['동쪽 책상 위 항해 일지를 읽어 보세요.', '서랍 번호는 등이 꺼진 21시의 기압이에요. 기압계는 깨졌으니 일지 기록에서 규칙을 찾아요.', '1002 → 995 → 988, 한 시간에 7씩 내려가요. 21시는 981. 책상 서랍에 981.'] },
    { when: s => !s.locker, text: ['북서쪽 창밖, 배 한 척이 불빛을 깜빡이고 있어요.', '배를 눌러 불빛을 받아 적고, 남쪽 벽의 모스 부호표로 한 글자씩 읽어 보세요.', '···· −−− ·−−· · = H O P E. 기름 창고에 HOPE.'] },
    { when: (s, g) => !s.fueled && !g.has('fuelCan'), text: ['기름통 주둥이가 넓어요. 무언가를 끼우면 좋겠어요.', '가방에서 기름통과 깔때기를 차례로 눌러 조합하세요.'] },
    { when: s => !s.fueled, text: ['기름은 렌즈 한가운데 등잔에 넣어요.', '깔때기 꽂은 기름통을 고르고 렌즈를 누르세요.'] },
    { when: s => !s.lit, text: ['기름을 넣었으면 이제 불을 붙여야죠.', '성냥갑을 고르고 렌즈를 누르세요.'] },
    { when: s => !s.aligned, text: ['일지: 배가 신호하면 렌즈의 과녁(붉은 표가 달린 둥근 유리)을 그 배 쪽으로 돌려 답하라.', '렌즈 받침대 앞 회전 손잡이를 누르면 렌즈가 45도씩 돌아요. 창 위의 방위 판을 보세요.', '배는 북서쪽에 있어요. 과녁이 「북서」를 볼 때까지 손잡이를 돌리세요(지금 남쪽이면 세 번).'] },
    { text: ['빗장이 풀렸어요. 바닥 승강구를 누르세요.'] },
  ],

  build(K) {
    const { THREE, MAT, s } = K;
    s.lens = 4;   // 과녁이 보는 방위 번호 (0=북 … 4=남 … 7=북서)
    const iron = MAT.metal('#34383e', { rough: .55 });
    const ironD = MAT.metal('#2b2e33', { rough: .6 }); ironD.side = THREE.DoubleSide;
    const roofMat = MAT.metal('#4d3a2c', { rough: .6 }); roofMat.side = THREE.DoubleSide;
    const paint = MAT.plaster('#cfc6b3', [8, 1]); paint.side = THREE.DoubleSide;
    const paint2 = MAT.plaster('#c9bfaa', [2, 1]); paint2.side = THREE.DoubleSide;
    const brass = MAT.brass(), brassD = MAT.brass({ side: THREE.DoubleSide });
    const wood = MAT.wood('#5a3a20'), darkWood = MAT.wood('#33200f');
    const arc = (r, h, t0, tl, mat, o) => K.place(new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 72, 1, true, t0, tl), mat), o);

    // ---------- 방 뼈대 ----------
    K.place(new THREE.Mesh(new THREE.CircleGeometry(R, 72), MAT.floor('#4a3018', [3, 3])), { rot: [-Math.PI / 2, 0, 0] });
    arc(R, 1, 0, Math.PI * 2, paint, { at: [0, .5, 0] });                                   // 아래 둘레 벽
    arc(R - .02, .16, 0, Math.PI * 2, darkWood, { at: [0, .08, 0] });                         // 걸레받이
    arc(R, 1.6, -Math.PI / 8, Math.PI / 4, paint2, { at: [0, 1.8, 0] });                       // 남쪽 막힌 벽
    const glass = arc(R - .01, 1.6, Math.PI / 8, Math.PI * 2 - Math.PI / 4, MAT.glass(0x9fb8c8, .1), { at: [0, 1.8, 0], shadow: false });
    glass.userData.noRay = true;
    arc(R, .26, 0, Math.PI * 2, ironD, { at: [0, 2.73, 0] });                                 // 위 띠
    K.place(new THREE.Mesh(new THREE.ConeGeometry(R + .05, 1.5, 72, 1, true), roofMat), { at: [0, 2.86 + .75, 0] });
    K.cyl(.12, .12, .1, brass, { at: [0, 4.3, 0] });
    for (const y of [1.0, 2.6]) K.torus(R - .03, .035, brass, { at: [0, y, 0], rot: [Math.PI / 2, 0, 0] });
    K.torus(R - .02, .015, iron, { at: [0, 1.8, 0], rot: [Math.PI / 2, 0, 0] });
    for (let k = 0; k < 8; k++) K.box(.07, 1.6, .09, iron, onWall(22.5 + k * 45, R - .04, 1.8));
    // 방위 판
    NAMES.forEach((n, k) => K.text(n, .36, .15, { ...onWall(k * 45, R - .06, 2.73), bg: '#c89b4a', color: '#24170a', size: .62, res: 256 }));
    // 바닥 나침 무늬
    K.picture(2.8, 2.8, (g, w) => {
      const c = w / 2; g.strokeStyle = 'rgba(214,170,90,.85)'; g.lineWidth = 6;
      g.beginPath(); g.arc(c, c, c * .92, 0, 7); g.stroke(); g.lineWidth = 3; g.beginPath(); g.arc(c, c, c * .82, 0, 7); g.stroke();
      for (let i = 0; i < 32; i++) { const a = i / 32 * Math.PI * 2, l = i % 4 ? .05 : .1; g.beginPath(); g.moveTo(c + Math.sin(a) * c * .82, c - Math.cos(a) * c * .82); g.lineTo(c + Math.sin(a) * c * (.82 - l), c - Math.cos(a) * c * (.82 - l)); g.stroke(); }
      g.fillStyle = 'rgba(226,186,110,.9)'; g.font = "900 70px 'Noto Serif KR'"; g.textAlign = 'center'; g.textBaseline = 'middle';
      [['북', 0], ['동', 90], ['남', 180], ['서', 270]].forEach(([n, b]) => g.fillText(n, c + Math.sin(b * D2R) * c * .7, c - Math.cos(b * D2R) * c * .7));
    }, { transparent: true, at: [0, .004, 0], rot: [-Math.PI / 2, 0, 0], res: 1024 });

    // ---------- 바깥: 난간, 폭풍 바다, 비, 번개 ----------
    K.place(new THREE.Mesh(new THREE.RingGeometry(R + .02, R + .9, 72), MAT.metal('#24272b', { rough: .7 })), { at: [0, .98, 0], rot: [-Math.PI / 2, 0, 0] });
    for (const y of [1.45, 1.95]) K.torus(R + .85, .025, iron, { at: [0, y, 0], rot: [Math.PI / 2, 0, 0] });
    for (let k = 0; k < 24; k++) { const [x, z] = dirOf(k * 15 + 7.5, R + .85); K.cyl(.018, .018, 1, iron, { at: [x, 1.47, z] }); }
    const r = K.rng(17);
    const panoTex = K.canvasTexture(2048, 1024, (g, w, h) => {
      const hz = h * .49;
      const sky = g.createLinearGradient(0, 0, 0, hz); sky.addColorStop(0, '#0b1017'); sky.addColorStop(.65, '#232e3b'); sky.addColorStop(1, '#4b5a69');
      g.fillStyle = sky; g.fillRect(0, 0, w, hz);
      for (let i = 0; i < 320; i++) {
        const x = r() * w, y = r() * hz * .92, rad = 40 + r() * 150, dark = r() < .62;
        const gr = g.createRadialGradient(x, y, 0, x, y, rad);
        gr.addColorStop(0, dark ? 'rgba(8,11,16,.5)' : 'rgba(125,140,160,.2)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
        g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
      }
      // 비 커튼
      g.strokeStyle = 'rgba(160,175,190,.08)'; g.lineWidth = 2;
      for (let i = 0; i < 300; i++) { const x = r() * w; g.beginPath(); g.moveTo(x, hz * .4 + r() * hz * .3); g.lineTo(x - 30, hz); g.stroke(); }
      const sea = g.createLinearGradient(0, hz, 0, h); sea.addColorStop(0, '#34434d'); sea.addColorStop(.12, '#18242c'); sea.addColorStop(1, '#05090c');
      g.fillStyle = sea; g.fillRect(0, hz, w, h - hz);
      for (let i = 0; i < 1600; i++) {
        const t = r(), y = hz + 3 + Math.pow(t, 1.7) * (h - hz), len = 8 + t * 90, x = r() * w;
        g.strokeStyle = `rgba(205,220,230,${.06 + r() * .22})`; g.lineWidth = 1 + t * 4;
        g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + len / 2, y - 2 - t * 8, x + len, y); g.stroke();
      }
      g.fillStyle = 'rgba(170,185,200,.35)'; g.fillRect(0, hz - 1, w, 2);
    });
    const panoMat = new THREE.MeshBasicMaterial({ map: panoTex, side: THREE.BackSide, fog: false });
    const pano = new THREE.Mesh(new THREE.CylinderGeometry(14, 14, 16, 64, 1, true), panoMat);
    pano.position.y = 1; pano.userData.noRay = true; K.scene.add(pano);
    // 빗줄기
    const N = 700, rp = new Float32Array(N * 6), rr = K.rng(3);
    for (let i = 0; i < N; i++) { const a = rr() * Math.PI * 2, d = 3.5 + rr() * 6, x = Math.cos(a) * d, z = Math.sin(a) * d, y = -2 + rr() * 9; rp.set([x, y, z, x + .06, y - .45, z], i * 6); }
    const rgeo = new THREE.BufferGeometry(); rgeo.setAttribute('position', new THREE.BufferAttribute(rp, 3));
    const rain = new THREE.LineSegments(rgeo, new THREE.LineBasicMaterial({ color: 0xaabfce, transparent: true, opacity: .35, depthWrite: false }));
    rain.userData.noRay = true; K.scene.add(rain);
    K.onUpdate(dt => {
      const a = rgeo.attributes.position.array;
      for (let i = 0; i < N; i++) { let y = a[i * 6 + 1] - dt * 11; if (y < -2) y += 9; a[i * 6 + 1] = y; a[i * 6 + 4] = y - .45; }
      rgeo.attributes.position.needsUpdate = true;
    });

    // ---------- 빛 ----------
    const hemi = new THREE.HemisphereLight(0x8a9bb5, 0x3a2a1c, 1.0); K.scene.add(hemi);
    const flash = new THREE.DirectionalLight(0xc4d4ff, 0); flash.position.set(-8, 9, -6); K.scene.add(flash);
    // 매달린 등불 (주 조명)
    const lant = K.group({ at: [-1.05, 3.45, .95] });
    K.cyl(.006, .006, .7, iron, { parent: lant, at: [0, -.35, 0] });
    const lbody = K.group({ parent: lant, at: [0, -.85, 0] });
    K.cone(.13, .12, brass, { parent: lbody, at: [0, .2, 0] });
    K.cyl(.09, .09, .22, MAT.glass(0xffe2b0, .3), { parent: lbody, at: [0, .04, 0], shadow: false }).userData.noRay = true;
    for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + .4; K.box(.012, .24, .012, brass, { parent: lbody, at: [Math.sin(a) * .095, .04, Math.cos(a) * .095] }); }
    K.cyl(.11, .11, .04, brass, { parent: lbody, at: [0, -.09, 0] });
    K.sphere(.025, MAT.glow(0xffc070, 7), { parent: lbody, at: [0, .02, 0], scale: [1, 1.8, 1], shadow: false }).userData.noRay = true;
    const lantLight = K.point(0xffc27a, 8, 10, { parent: lbody, at: [0, -.05, 0], shadow: true, res: 1024 });
    K.onUpdate((dt, t) => {
      lant.rotation.z = Math.sin(t * 1.1) * .05; lant.rotation.x = Math.sin(t * .8 + 1) * .03;
      lantLight.intensity = 7.6 + Math.sin(t * 9) * .3 + Math.random() * .4;
    });
    K.spot(0x7f95c0, 3, 9, [0, 0, 0], { at: [-2, 3.2, -2], angle: .8, penumbra: .9 });

    // ---------- 가운데: 프레넬 렌즈 ----------
    const lamp = K.group();
    K.cyl(.5, .6, .85, iron, { parent: lamp, at: [0, .425, 0] });
    K.cyl(.64, .64, .06, brass, { parent: lamp, at: [0, .88, 0] });
    K.cyl(.66, .7, .08, brass, { parent: lamp, at: [0, .04, 0] });
    for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2 + Math.PI / 8; K.box(.05, .7, .04, brass, { parent: lamp, at: [Math.sin(a) * .54, .45, Math.cos(a) * .54], rot: [0, a, 0] }); }
    const rot = K.group({ parent: lamp, at: [0, .91, 0], rot: [0, -s.lens * Math.PI / 4, 0] });
    K.torus(.645, .025, brass, { parent: rot, at: [0, .02, 0], rot: [Math.PI / 2, 0, 0] });
    K.torus(.52, .025, brass, { parent: rot, at: [0, 1.36, 0], rot: [Math.PI / 2, 0, 0] });
    for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2 + Math.PI / 8; K.box(.03, 1.34, .03, brass, { parent: rot, at: [Math.sin(a) * .655, .69, Math.cos(a) * .655] }); }
    const lensGlass = MAT.glass(0xdff2ff, .14), prism = MAT.glass(0xe9fbff, .4, { emissive: 0x1c2a36 });
    const prof = []; for (let i = 0; i <= 8; i++) { const y = i * .17; prof.push([lensR(y), y]); }
    K.lathe(prof, lensGlass, { parent: rot, shadow: false });
    for (const y of [.08, .17, .26, .35, .44, .92, 1.01, 1.1, 1.19, 1.28]) K.torus(lensR(y) + .012, .022, prism, { parent: rot, at: [0, y, 0], rot: [Math.PI / 2, 0, 0], shadow: false });
    K.lathe([[.56, 0], [.5, .08], [.32, .16], [.1, .21], [0, .22]], brassD, { parent: rot, at: [0, 1.36, 0] });
    // 과녁 렌즈 (붉은 표)
    const bull = K.group({ parent: rot, at: [0, .68, -.68] });
    for (const r0 of [.07, .13, .19, .25]) K.torus(r0, .018, prism, { parent: bull, shadow: false });
    K.cyl(.06, .06, .03, prism, { parent: bull, rot: [Math.PI / 2, 0, 0], shadow: false });
    K.torus(.3, .022, brass, { parent: bull });
    K.box(.1, .06, .03, MAT.glow(0xff3a20, 2.5), { parent: bull, at: [0, .34, 0] });
    // 등잔
    K.cyl(.12, .16, .36, brass, { parent: rot, at: [0, .3, 0] });
    K.cyl(.05, .05, .1, brass, { parent: rot, at: [0, .52, 0] });
    K.cyl(.018, .018, .05, MAT.plain(0x1a1a1a, .9), { parent: rot, at: [0, .59, 0] });
    const flame = K.sphere(.06, MAT.glow(0xffd27a, 9), { parent: rot, at: [0, .67, 0], scale: [1, 1.9, 1], shadow: false });
    flame.visible = false;
    const lampLight = K.point(0xffdcaa, 0, 14, { parent: lamp, at: [0, 1.6, 0] });
    const beamMat = new THREE.MeshBasicMaterial({ color: 0xfff0c0, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    const beam = K.place(new THREE.Mesh(new THREE.ConeGeometry(1.4, 9, 32, 1, true), beamMat), { parent: rot, at: [0, .68, -.68 - 4.5], rot: [Math.PI / 2, 0, 0], shadow: false });
    beam.visible = false;
    rot.traverse(o => { if (o.isMesh && o.material.transparent) { o.userData.noRay = true; o.castShadow = false; } });
    K.onUpdate((dt, t) => {
      if (!s.lit) return;
      flame.scale.set(1, 1.9 * (.9 + Math.sin(t * 11) * .06 + Math.random() * .05), 1);
      lampLight.intensity = 11 + Math.sin(t * 7) * .6;
      beamMat.opacity = .1 + Math.sin(t * 2) * .02;
    });
    K.zone('lens', { pos: [0, 1.55, 1.3], look: [0, 1.25, 0], fov: 55, range: .5 });
    K.hot(lamp, {
      name: '등대 렌즈', goto: 'lens',
      click: g => g.say(!s.fueled ? '렌즈 한가운데 등잔이 바짝 말라 있다. 기름이 한 방울도 없다.' : !s.lit ? '기름은 찼다. 이제 불을 붙여야 한다.' : '등잔이 환하게 타오른다. 붉은 표가 달린 과녁 렌즈로 빛이 모인다.'),
      use: {
        oilCan: g => g.say('주둥이가 넓어 좁은 등잔에 부으면 다 흘러넘칠 것 같다. 깔때기가 있으면…'),
        funnel: g => g.say('깔때기만 꽂아서는 소용없다. 부을 기름이 있어야 한다.'),
        fuelCan: g => { s.fueled = true; g.take('fuelCan'); g.sound.play('pickup'); g.say('꼴꼴꼴… 등잔에 기름을 가득 채웠다.'); },
        matches: async g => {
          if (!s.fueled) { g.sound.play('wrong'); g.say('성냥불이 마른 심지에 닿자 금방 꺼진다. 기름부터 넣어야 한다.'); return; }
          if (s.lit) return;
          s.lit = true; g.take('matches'); g.sound.play('magic');
          flame.visible = true; beam.visible = true;
          g.tween(lampLight, { intensity: 11 }, 1.2);
          g.say('화르륵! 등잔에 불이 붙었다. 렌즈가 빛을 모아 한 줄기로 쏘아 보낸다.');
          await g.wait(.5); check(g);
        },
      },
    });
    // 회전 손잡이
    const crank = K.group({ at: [0, .55, .62] });
    const wheel = K.group({ parent: crank });
    K.torus(.13, .015, brass, { parent: wheel });
    for (let i = 0; i < 4; i++) K.box(.26, .018, .018, brass, { parent: wheel, rot: [0, 0, i * Math.PI / 4] });
    K.cyl(.02, .02, .1, wood, { parent: wheel, at: [.12, 0, .05], rot: [Math.PI / 2, 0, 0] });
    K.cyl(.035, .035, .08, brass, { parent: crank, at: [0, 0, -.04], rot: [Math.PI / 2, 0, 0] });
    K.hot(crank, {
      name: '회전 손잡이', zone: 'lens', click: async g => {
        if (s.turning || s.aligned) return;
        s.turning = true; g.sound.play('click');
        s.lens = (s.lens + 1) % 8;
        g.tween(wheel.rotation, { z: wheel.rotation.z - Math.PI }, .6);
        await g.tween(rot.rotation, { y: rot.rotation.y - Math.PI / 4 }, .6);
        s.turning = false; g.sound.play('tick');
        g.say(`끼익… 과녁 렌즈가 「${NAMES[s.lens]}」 쪽을 향한다.`);
        check(g);
      }
    });
    async function check(g) {
      if (!s.lit || s.lens !== 7 || s.aligned) return;
      s.aligned = true;
      await g.wait(.8);
      g.sound.play('beep'); g.say('빛줄기가 배에 닿았다! 배가 짧고 빠르게 깜빡이며 답한다.');
      await g.wait(2.2);
      g.say('뱃머리가 천천히 암초를 비켜 돈다…');
      await g.wait(1.2);
      s.free = true; g.sound.play('unlock');
      g.say('아래층에서 철컥, 승강구 빗장 풀리는 소리가 났다.');
    }

    // ---------- 북서쪽: 신호하는 배 ----------
    const [sx, sz] = dirOf(SHIP_B, 11);
    const shipG = K.group({ at: [sx, .95, sz], rot: [0, -SHIP_B * D2R + Math.PI / 2, 0] });
    const sil = new THREE.MeshBasicMaterial({ color: 0x080b10, fog: false });
    K.box(1.2, .16, .22, sil, { parent: shipG });
    K.box(.3, .1, .2, sil, { parent: shipG, at: [.62, .04, 0], rot: [0, 0, .5] });
    K.box(.42, .13, .18, sil, { parent: shipG, at: [.2, .14, 0] });
    K.box(.03, .75, .03, sil, { parent: shipG, at: [-.18, .45, 0] });
    K.box(.03, .55, .03, sil, { parent: shipG, at: [.32, .45, 0] });
    K.box(.5, .02, .02, sil, { parent: shipG, at: [.07, .7, 0], rot: [0, 0, -.25] });
    for (const x of [.06, .16, .26]) K.box(.04, .03, .23, MAT.glow(0xffb860, 3), { parent: shipG, at: [x, .15, 0], shadow: false });
    const sigMat = MAT.glow(0xfff0c0, 0);
    K.sphere(.09, sigMat, { parent: shipG, at: [-.18, .86, 0], shadow: false });
    const sched = morseSchedule('HOPE'), total = sched.reduce((a, b) => a + b[1], 0);
    K.onUpdate((dt, t) => {
      shipG.position.y = .95 + Math.sin(t * .9) * .05; shipG.rotation.x = Math.sin(t * .7) * .06;
      let on = 0;
      if (s.aligned) on = (t * 3) % 1 < .5 ? 1 : 0;
      else { let p = t % total; for (const [v, d] of sched) { if (p < d) { on = v; break; } p -= d; } }
      sigMat.emissiveIntensity = on ? 14 : 0;
    });
    const [zx, zz] = dirOf(SHIP_B, 2.2);
    K.zone('ship', { pos: [zx, 1.7, zz], look: [sx, 1.25, sz], fov: 26, range: .3 });
    K.hot(shipG, {
      name: '깜빡이는 배', zone: 'ship', click: g => {
        s.signal = true;
        g.note('배의 불빛', '북서쪽 바다, 배 한 척이 같은 불빛을 되풀이해 깜빡인다.\n짧은 빛(·)과 긴 빛(−)을 받아 적었다.\n\n<div class="big">····   −−−   ·−−·   ·</div>\n\n조금 길게 쉬는 곳마다 한 글자가 끝나는 것 같다.\n아주 길게 쉰 뒤에는 처음부터 다시 깜빡인다.');
      }
    });

    // ---------- 번개 ----------
    let nextFlash = 3 + Math.random() * 3, flashT = -9, thunderAt = 0;
    K.onUpdate((dt, t, g) => {
      if (t > nextFlash) { flashT = t; nextFlash = t + 7 + Math.random() * 8; thunderAt = t + .9 + Math.random() * 1.2; }
      const e = t - flashT;
      const k = e < 0 || e > .7 ? 0 : e < .07 ? 1 : e < .15 ? .15 : e < .24 ? .85 : Math.max(0, 1 - (e - .24) / .46) * .5;
      panoMat.color.setScalar(.6 + k * 2.4);
      flash.intensity = k * 5; hemi.intensity = 1 + k * .9;
      if (thunderAt && t > thunderAt) { thunderAt = 0; if (!g.done) g.sound.play('thud'); }
    });

    // ---------- 남쪽 벽: 모스 부호표, 기압계 ----------
    const chart = K.group(onWall(168, R - .06, 1.78));
    K.box(1.0, .86, .03, darkWood, { parent: chart, at: [0, 0, -.01] });
    K.picture(.92, .78, (g, w, h) => {
      g.fillStyle = '#efe4c8'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#2a1e12'; g.font = "900 54px 'Noto Serif KR'"; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText('모스 부호표', w / 2, 46);
      g.fillStyle = '#5a4630'; g.font = "700 26px 'Noto Sans KR'"; g.fillText('●  짧은 빛     ▬  긴 빛', w / 2, 96);
      const keys = Object.keys(MORSE), rowH = (h - 130) / 13;
      keys.forEach((ch, i) => {
        const col = Math.floor(i / 13), row = i % 13, x0 = 70 + col * w / 2, y = 136 + row * rowH + rowH / 2;
        g.fillStyle = '#7a1e12'; g.font = "900 46px 'Noto Serif KR'"; g.textAlign = 'center'; g.fillText(ch, x0, y);
        g.fillStyle = '#1a140c'; let x = x0 + 50;
        for (const c of MORSE[ch]) { if (c === '.') { g.beginPath(); g.arc(x + 9, y, 9, 0, 7); g.fill(); x += 32; } else { g.fillRect(x, y - 7, 46, 14); x += 60; } }
      });
      g.strokeStyle = 'rgba(90,70,48,.5)'; g.lineWidth = 3; g.beginPath(); g.moveTo(w / 2, 120); g.lineTo(w / 2, h - 10); g.stroke();
    }, { parent: chart, at: [0, 0, .01], res: 1024 });
    const [cx, cz] = dirOf(168, 1.4);
    K.zone('chart', { pos: [cx, 1.7, cz], look: [chart.position.x, 1.75, chart.position.z], fov: 45, range: .35 });
    K.hot(chart, {
      name: '모스 부호표', goto: 'chart', click: g => {
        const rows = Object.keys(MORSE).map(c => `<td><b>${c}</b></td><td>${pretty(MORSE[c])}</td>`);
        let html = '<table>'; for (let i = 0; i < 13; i++) html += `<tr>${rows[i]}${rows[i + 13]}</tr>`; html += '</table>';
        g.note('모스 부호표', '· 짧은 빛   − 긴 빛\n' + html);
      }
    });
    const baro = K.group(onWall(196, R - .06, 1.72));
    K.cyl(.24, .24, .05, darkWood, { parent: baro, rot: [Math.PI / 2, 0, 0] });
    K.torus(.215, .02, brass, { parent: baro, at: [0, 0, .03] });
    K.picture(.4, .4, (g, w) => {
      const c = w / 2; g.fillStyle = '#efe6cf'; g.beginPath(); g.arc(c, c, c, 0, 7); g.fill();
      g.strokeStyle = '#2a1e12'; g.fillStyle = '#2a1e12'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = "700 26px 'Noto Sans KR'";
      for (let v = 960; v <= 1040; v += 5) {
        const a = (-135 + (v - 960) / 80 * 270) * D2R, big = v % 20 === 0;
        g.lineWidth = big ? 4 : 2; g.beginPath(); g.moveTo(c + Math.sin(a) * c * .88, c - Math.cos(a) * c * .88); g.lineTo(c + Math.sin(a) * c * (big ? .74 : .8), c - Math.cos(a) * c * (big ? .74 : .8)); g.stroke();
        if (big) g.fillText(v, c + Math.sin(a) * c * .6, c - Math.cos(a) * c * .6);
      }
      g.font = "900 30px 'Noto Serif KR'"; g.fillText('폭풍', c - c * .45, c + c * .5); g.fillText('맑음', c + c * .45, c + c * .5);
      g.font = "700 22px 'Noto Sans KR'"; g.fillText('hPa', c, c + c * .3);
      g.strokeStyle = 'rgba(40,40,40,.8)'; g.lineWidth = 2;
      g.beginPath(); g.moveTo(c * .3, c * .4); g.lineTo(c * .9, c * 1.1); g.lineTo(c * 1.2, c * 1.7); g.moveTo(c * .9, c * 1.1); g.lineTo(c * 1.6, c * .8); g.lineTo(c * 1.8, c * .5); g.stroke();
      g.fillStyle = '#2a1e12'; g.beginPath(); g.arc(c, c, 10, 0, 7); g.fill();
    }, { parent: baro, at: [0, 0, .03] });
    const [bx, bz] = dirOf(196, 1.6);
    K.zone('baro', { pos: [bx, 1.65, bz], look: [baro.position.x, 1.72, baro.position.z], fov: 40, range: .3 });
    K.hot(baro, { name: '기압계', goto: 'baro', click: g => g.say('유리가 깨지고 바늘이 떨어져 나갔다. 지금 기압은 이 기압계로는 알 수 없다.') });

    // ---------- 동쪽: 책상 ----------
    const desk = K.group(onWall(90, 2.45, 0));
    K.rbox(1.3, .06, .62, .015, wood, { parent: desk, at: [0, .76, 0] });
    for (const sx2 of [-1, 1]) for (const sz2 of [-1, 1]) K.box(.06, .73, .06, wood, { parent: desk, at: [sx2 * .58, .365, sz2 * .26] });
    K.box(1.2, .14, .03, wood, { parent: desk, at: [0, .66, -.27] });
    const drawer = K.group({ parent: desk, at: [.25, .66, .28] });
    K.box(.5, .12, .03, darkWood, { parent: drawer });
    K.box(.1, .025, .03, brass, { parent: drawer, at: [0, 0, .025] });
    K.box(.46, .1, .45, MAT.wood('#5a3a20'), { parent: drawer, at: [0, 0, -.24] });
    K.box(.05, .06, .03, brass, { parent: drawer, at: [.18, 0, .03] });
    const logPage = K.picture(.5, .36, (g, w, h) => {
      g.fillStyle = '#efe4c8'; g.fillRect(0, 0, w, h);
      g.fillStyle = 'rgba(80,55,25,.35)'; g.fillRect(w / 2 - 2, 0, 4, h);
      g.fillStyle = '#2a1e12'; g.font = "900 40px 'Noto Serif KR'"; g.textAlign = 'center'; g.fillText('항해 일지', w / 4, 52);
      g.font = "700 30px 'Noto Serif KR'"; g.textAlign = 'left';
      ['18시  1002', '19시   995', '20시   988', '21시   '].forEach((l, i) => g.fillText(l, 40, 120 + i * 50));
      g.fillStyle = 'rgba(20,20,60,.7)'; g.beginPath(); g.ellipse(180, 262, 50, 20, .2, 0, 7); g.fill();
      g.strokeStyle = 'rgba(40,30,20,.45)'; g.lineWidth = 3;
      for (let i = 0; i < 8; i++) { g.beginPath(); g.moveTo(w / 2 + 30, 60 + i * 40); for (let x = w / 2 + 30; x < w - 30; x += 12) g.lineTo(x, 60 + i * 40 + Math.sin(x * .3 + i) * 4); g.stroke(); }
    }, { parent: desk, at: [-.05, .795, .02], rot: [-Math.PI / 2, 0, 0] });
    K.box(.52, .015, .37, MAT.leather('#4a2414'), { parent: desk, at: [-.05, .787, .02] });
    K.zone('desk', { pos: [1.15, 1.5, 0], look: [2.45, .8, 0], fov: 55, range: .45 });
    K.hot(logPage, {
      name: '항해 일지', zone: 'desk', click: g => {
        s.log = true;
        g.note('등대 항해 일지', '<b>10월 3일, 폭풍</b>\n\n18시  기압 1002\n19시  기압 995\n20시  기압 988\n21시  기압 ─ <i>(잉크가 번져 읽을 수 없다)</i>\n\n21시 정각, 등이 꺼졌다. 기름이 바닥났다.\n\n· 성냥과 깔때기는 책상 서랍에.\n  서랍 번호는 <b>등이 꺼진 시각의 기압</b>.\n· 기름은 기름 창고에. 창고 낱말을 자꾸 잊어서,\n  「북극성호」 선장이 지날 때마다 <b>불빛으로</b> 일러 준다.\n· 배가 신호하면, 렌즈의 <b>과녁(붉은 표)</b>을\n  <b>그 배 쪽으로</b> 돌려 빛으로 답할 것.');
      }
    });
    K.hot(drawer, {
      name: '책상 서랍', zone: 'desk', click: g => {
        if (s.drawer) { g.say('서랍은 비었다.'); return; }
        g.lock({
          title: '서랍 숫자 자물쇠', text: '세 자리 숫자를 맞추세요.', type: 'digits', answer: '981', onSolve: g => {
            s.drawer = true; g.sound.play('open'); g.tween(drawer.position, { z: .55 }, .6);
            g.give('funnel'); g.give('matches', true);
            g.say('서랍 안에 깔때기와 성냥갑이 있다. 둘 다 챙겼다.');
          }
        });
      }
    });
    const thermos = K.group({ parent: desk, at: [.48, .79, -.12] });
    K.cyl(.045, .045, .26, MAT.plain(0x2f5a3a, .4, .3), { parent: thermos, at: [0, .13, 0] });
    K.cyl(.05, .05, .06, MAT.silver(), { parent: thermos, at: [0, .29, 0] });
    K.hot(thermos, { name: '보온병', zone: 'desk', click: g => g.say('식은 홍차가 조금 남아 있다. 등대지기는 단것을 좋아했나 보다.') });
    K.chair(wood, { at: [1.65, 0, .35], rot: [0, Math.PI / 2 + .3, 0] });

    // ---------- 서쪽: 기름 창고 ----------
    const locker = K.group(onWall(270, 2.55, 0));
    const lockMat = MAT.metal('#5b2a22', { rough: .5 });
    K.box(.8, 1.3, .5, lockMat, { parent: locker, at: [0, .65, 0] });
    K.box(.74, .03, .44, iron, { parent: locker, at: [0, .55, .02] });
    const oilMesh = K.group({ parent: locker, at: [0, .58, .05], scale: 1.4 }); oilCanModel(false)(K, oilMesh);
    const ldoor = K.group({ parent: locker, at: [-.4, .65, .26] });
    K.box(.78, 1.26, .03, lockMat, { parent: ldoor, at: [.39, 0, 0] });
    for (const y of [-.45, .45]) K.box(.6, .02, .01, brass, { parent: ldoor, at: [.39, y, .02] });
    K.text('기름 창고', .42, .13, { parent: ldoor, at: [.39, .3, .02], bg: '#c89b4a', color: '#24170a', size: .6, res: 256 });
    const plock = K.group({ parent: ldoor, at: [.66, 0, .04] });
    K.box(.12, .16, .05, brass, { parent: plock });
    for (let i = 0; i < 4; i++) K.cyl(.012, .012, .1, MAT.plain(0x2a2018, .5), { parent: plock, at: [0, .055 - i * .037, .028], rot: [0, 0, Math.PI / 2] });
    K.zone('locker', { pos: [-1.1, 1.45, .1], look: [-2.5, .8, 0], fov: 55, range: .45 });
    K.hot(locker, {
      name: '기름 창고', goto: 'locker', click: g => {
        if (s.locker) { g.say('창고는 비었다.'); return; }
        g.lock({
          title: '창고 글자 자물쇠', text: '영어 글자 네 개를 맞추세요.', type: 'letters', answer: 'HOPE', onSolve: async g => {
            s.locker = true; g.sound.play('open');
            await g.tween(ldoor.rotation, { y: -1.9 }, .9);
            oilMesh.visible = false; g.give('oilCan');
          }
        });
      }
    });
    // 비옷
    const coat = K.group(onWall(247.5, R - .14, 1.45));
    K.box(.46, .85, .07, MAT.fabric('#c9a227', 0, [1, 1]), { parent: coat, at: [0, -.2, 0] });
    K.sphere(.13, MAT.fabric('#c9a227', 0, [1, 1]), { parent: coat, at: [0, .27, -.02], scale: [1, 1, .6] });
    K.cyl(.012, .012, .12, brass, { parent: coat, at: [0, .32, -.06], rot: [Math.PI / 2, 0, 0] });
    K.hot(coat, { name: '낡은 비옷', click: g => g.say('젖은 노란 비옷. 주머니엔 사탕 껍질뿐이다.') });

    // ---------- 바닥 승강구 ----------
    const hatch = K.group({ at: [-1.0, 0, 1.95] });
    K.plane(.82, .82, MAT.plain(0x050403, 1), { parent: hatch, at: [0, .003, 0], rot: [-Math.PI / 2, 0, 0] });
    K.plane(.6, .6, MAT.glow(0x3a2414, .5), { parent: hatch, at: [0, -.4, 0], rot: [-Math.PI / 2, 0, 0] });
    for (const [w, d, x, z] of [[.96, .06, 0, -.45], [.96, .06, 0, .45], [.06, .96, -.45, 0], [.06, .96, .45, 0]]) K.box(w, .03, d, iron, { parent: hatch, at: [x, .015, z] });
    const hpiv = K.group({ parent: hatch, at: [0, .02, -.42] });
    K.box(.84, .04, .84, MAT.metal('#3b3f45', { rough: .6 }), { parent: hpiv, at: [0, .02, .42] });
    for (const x of [-.25, 0, .25]) K.box(.04, .012, .8, iron, { parent: hpiv, at: [x, .045, .42] });
    K.torus(.06, .012, brass, { parent: hpiv, at: [0, .05, .76], rot: [Math.PI / 2, 0, 0] });
    K.text(['등을 밝혀', '배에 답하면', '열어 주지'], .24, .3, { parent: hpiv, at: [.2, .046, .3], rot: [-Math.PI / 2, 0, .2], size: .14, lh: 1.5 });
    K.hot(hatch, {
      name: '바닥 승강구', click: async g => {
        if (!s.free) {
          g.sound.play('thud');
          g.note('승강구 위 쪽지', '<div class="big">등을 밝혀\n저 배에 답해 주면\n열어 주지.</div>\n\n<p style="text-align:right">— 등대지기</p>\n승강구는 아래에서 단단히 잠겨 있다.');
          return;
        }
        if (s.opened) return;
        s.opened = true; g.sound.play('open');
        await g.tween(hpiv.rotation, { x: -1.9 }, 1.4);
        g.win();
      }
    });

    K.dust(150, [5, 2.6, 5], { opacity: .25 });
  },
};

// 기름통 모양
function oilCanModel(withFunnel) {
  return (K, g) => {
    const red = K.MAT.plain(0x8e2a1c, .45, .5), tin = K.MAT.metal('#a8adb3', { rough: .4 });
    K.cyl(.07, .07, .16, red, { parent: g, at: [0, .08, 0] });
    K.cyl(.072, .072, .015, tin, { parent: g, at: [0, .16, 0] });
    K.cyl(.025, .03, .05, tin, { parent: g, at: [.035, .19, 0] });
    K.torus(.045, .008, tin, { parent: g, at: [-.02, .2, 0], arc: Math.PI });
    if (withFunnel) {
      const f = K.lathe([[.012, 0], [.014, .06], [.07, .13], [.075, .14]], tin, { parent: g, at: [.035, .2, 0] });
      f.material = tin.clone(); f.material.side = K.THREE.DoubleSide;
    }
  };
}

export const solution = [
  { hot: '항해 일지' },
  { hot: '기압계' },
  { hot: '책상 서랍', lock: '981' },
  { hot: '깜빡이는 배' },
  { hot: '모스 부호표' },
  { hot: '기름 창고', lock: 'HOPE' },
  { combine: ['oilCan', 'funnel'] },
  { hot: '등대 렌즈', item: 'fuelCan' },
  { hot: '등대 렌즈', item: 'matches', wait: 1.5 },
  { hot: '회전 손잡이' },
  { hot: '회전 손잡이' },
  { hot: '회전 손잡이', wait: 6 },
  { hot: '바닥 승강구', wait: 3 },
];
