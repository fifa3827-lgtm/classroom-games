// 게임 엔진: 화면 그리기, 둘러보기, 누르기, 가방, 자물쇠, 쪽지, 힌트, 소리
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { makeKit, MAT } from './lib.js?v=2610052000';

const $ = id => document.getElementById(id);
window.__EXPO ??= 1.6; window.__AMB ??= 1.2; // 밝기 조절값 (시험 중 바꿔 볼 수 있게)
const wrapAngle = a => Math.atan2(Math.sin(a), Math.cos(a));
const yawPitchTo = (from, to) => {
  const d = new THREE.Vector3().subVectors(to, from);
  return { yaw: Math.atan2(-d.x, -d.z), pitch: Math.atan2(d.y, Math.hypot(d.x, d.z)) };
};
// 받침에 맞는 조사: josa('열쇠','을','를')
const josa = (w, a, b) => { const c = String(w).replace(/[^가-힣]+$/, '').slice(-1).charCodeAt(0) - 0xac00; return w + (c >= 0 && c <= 11171 && c % 28 ? a : b); };
const esc = s => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

// ---------- 소리 (파일 없이 합성) ----------
class Sound {
  constructor() { this.on = true; this.ctx = null; }
  ensure() { if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)(); if (this.ctx.state === 'suspended') this.ctx.resume(); }
  tone(f, dur, type = 'sine', vol = .15, at = 0, slide = 0) {
    const c = this.ctx, t = c.currentTime + at, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.exponentialRampToValueAtTime(f * slide, t + dur);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .01); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.connect(g).connect(c.destination); o.start(t); o.stop(t + dur + .05);
  }
  noise(dur, vol = .2, at = 0, freq = 1200) {
    const c = this.ctx, t = c.currentTime + at, n = c.sampleRate * dur, b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    f.type = 'bandpass'; f.frequency.value = freq; g.gain.value = vol; s.buffer = b; s.connect(f).connect(g).connect(c.destination); s.start(t);
  }
  play(name) {
    if (!this.on) return; try { this.ensure(); } catch { return; }
    const P = {
      click: () => this.noise(.05, .25, 0, 2500),
      tick: () => this.noise(.03, .18, 0, 4000),
      pickup: () => { this.tone(660, .12, 'triangle', .12); this.tone(990, .18, 'triangle', .1, .07); },
      combine: () => { this.tone(440, .1, 'triangle', .1); this.tone(660, .1, 'triangle', .1, .08); this.tone(880, .25, 'triangle', .1, .16); },
      wrong: () => { this.tone(180, .25, 'sawtooth', .07); this.tone(150, .3, 'sawtooth', .07, .1); },
      unlock: () => { this.noise(.08, .3, 0, 1800); this.noise(.12, .35, .12, 900); this.tone(523, .3, 'sine', .08, .2); this.tone(784, .5, 'sine', .08, .3); },
      open: () => { this.noise(.6, .12, 0, 300); this.tone(90, .6, 'sine', .08, 0, .7); },
      switch: () => { this.noise(.04, .35, 0, 1500); this.tone(1200, .04, 'square', .03); },
      beep: () => this.tone(1320, .12, 'square', .05),
      page: () => this.noise(.25, .15, 0, 3500),
      win: () => [523, 659, 784, 1047].forEach((f, i) => this.tone(f, .6, 'triangle', .1, i * .12)),
      thud: () => { this.tone(70, .4, 'sine', .25, 0, .5); this.noise(.2, .2, 0, 200); },
      magic: () => [880, 1175, 1568, 2093].forEach((f, i) => this.tone(f, .5, 'sine', .06, i * .07)),
    };
    (P[name] ?? P.click)();
  }
}

export class Game {
  constructor() {
    this.canvas = $('view');
    this.high = false;
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.pmrem = new THREE.PMREMGenerator(this.renderer);
    this.envTex = this.pmrem.fromScene(new RoomEnvironment(), .04).texture;
    this.camera = new THREE.PerspectiveCamera(62, 1, .03, 200);
    this.sound = new Sound();
    this.ray = new THREE.Raycaster();
    this.clock = new THREE.Clock();
    this.view = { pos: new THREE.Vector3(), yaw: 0, pitch: 0, fov: 62 };   // 지금
    this.goal = { pos: new THREE.Vector3(), yaw: 0, pitch: 0, fov: 62 };   // 가려는 곳
    this.bindInput();
    this.bindUI();
    addEventListener('resize', () => this.resize());
    this.resize();
    this.renderer.setAnimationLoop(() => this.frame());
  }

  setQuality(high) {
    this.high = high;
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, high ? 2 : 1.25));
    this.resize();
  }
  resize() {
    const w = innerWidth, h = innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
    if (this.composer) { this.composer.setPixelRatio(this.renderer.getPixelRatio()); this.composer.setSize(w, h); }
  }

  // ---------- 단계 불러오기 ----------
  async load(def, index) {
    this.clear();
    this.def = def; this.index = index;
    this.s = {};                 // 단계마다의 상태
    this.items = {};             // 가방 물건 정의
    this.inv = [];               // 가방 속
    this.selected = null;
    this.hots = new Map();       // 누를 수 있는 것
    this.zones = {};
    this.zone = null;
    this.updates = [];
    this.hintStep = 0;
    this.done = false;
    this.busy = false;
    const scene = this.scene = new THREE.Scene();
    scene.environment = this.envTex;
    scene.environmentIntensity = def.env ?? .35;
    scene.background = new THREE.Color(def.bg ?? 0x050403);
    if (def.fog) scene.fog = new THREE.FogExp2(def.fog[0], def.fog[1]);
    this.renderer.toneMappingExposure = (def.exposure ?? 1) * window.__EXPO; // 학교 화면에서도 보이게
    scene.add(new THREE.AmbientLight(0xfff2e0, window.__AMB)); // 어두운 구석을 고르게 밝히는 은은한 빛

    const kit = makeKit(scene, fn => this.updates.push(fn));
    const api = this.api = Object.assign(kit, {
      game: this, scene, s: this.s,
      hot: (obj, rec) => this.hot(obj, rec),
      zone: (id, z) => { this.zones[id] = { pos: new THREE.Vector3(...z.pos), look: new THREE.Vector3(...z.look), fov: z.fov ?? 50, range: z.range ?? .35, parent: z.parent }; },
      item: (id, d) => { this.items[id] = { id, ...d }; },
      onUpdate: fn => this.updates.push(fn),
    });
    for (const [id, d] of Object.entries(def.items ?? {})) api.item(id, d);
    this.combos = def.combos ?? [];
    await def.build(api);

    // 시작 위치
    const st = def.start ?? { pos: [0, 1.6, 0], look: [0, 1.4, -1] };
    this.home = { pos: new THREE.Vector3(...st.pos), look: new THREE.Vector3(...st.look), fov: st.fov ?? 62 };
    const yp = yawPitchTo(this.home.pos, this.home.look);
    this.yawRange = st.yawRange ?? null; this.homeYaw = yp.yaw; this.homePitch = yp.pitch;
    Object.assign(this.view, { yaw: yp.yaw, pitch: yp.pitch, fov: this.home.fov }); this.view.pos.copy(this.home.pos);
    Object.assign(this.goal, { yaw: yp.yaw, pitch: yp.pitch, fov: this.home.fov }); this.goal.pos.copy(this.home.pos);

    // 후처리: 빛 번짐
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(scene, this.camera));
    this.bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), def.bloom ?? .45, .6, 1.6); // 정말 빛나는 것만 번지게 (밝기 조정 전 값이라 1보다 높게: 비친 종이는 번지지 않음)
    this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass());
    this.resize();
    this.renderer.compile(scene, this.camera);

    $('stageName').textContent = `${index + 1}. ${def.title}`;
    this.renderInv();
    this.startTime = performance.now();
    $('btnBack').classList.add('hidden');
    $('tip').classList.add('hidden');
  }

  clear() {
    if (!this.scene) return;
    this.scene.traverse(o => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => { for (const k in m) if (m[k]?.isTexture) m[k].dispose(); m.dispose(); });
    });
    this.composer?.dispose();
    this.scene = null;
  }

  // ---------- 누를 수 있는 것 등록 ----------
  // rec: { name, zone, goto, click(g), use:{itemId(g)}, enabled() }
  hot(obj, rec) { const r = { obj, ...rec }; this.hots.set(obj, r); obj.userData.hot = r; return r; }
  unhot(obj) { this.hots.delete(obj); delete obj.userData.hot; }

  pick(cx, cy) {
    const r = this.canvas.getBoundingClientRect();
    const v = new THREE.Vector2(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
    this.ray.setFromCamera(v, this.camera);
    const hits = this.ray.intersectObjects(this.scene.children, true);
    for (const h of hits) {
      let o = h.object, skip = false;
      for (let p = o; p; p = p.parent) if (p.userData.noRay || p.visible === false) { skip = true; break; }
      if (skip || h.object.isPoints || h.object.isSprite || h.object.isLine) continue;
      for (; o; o = o.parent) if (o.userData.hot) {
        const rec = o.userData.hot;
        if (rec.enabled && !rec.enabled(this)) continue; // 꺼진 곳은 감싸는 물체에 넘긴다
        return rec;
      }
      return null; // 처음 맞은 물체가 막고 있음
    }
    return null;
  }

  activate(rec) {
    if (this.busy || this.done) return;
    // 아직 다가가지 않은 곳이면 먼저 다가간다
    if (rec.zone && this.zone !== rec.zone) { this.goZone(rec.zone); return; }
    if (rec.goto && this.zone !== rec.goto) { this.goZone(rec.goto); return; }
    if (this.selected) {
      const fn = rec.use?.[this.selected];
      if (fn) { fn(this); return; }
      if (rec.useAny) { rec.useAny(this, this.selected); return; }
      this.sound.play('wrong');
      this.say(rec.noUse ?? `${josa(this.items[this.selected].name, '은', '는')} 여기에 쓸 수 없다.`);
      return;
    }
    if (rec.click) rec.click(this);
    else if (rec.text) this.say(rec.text);
  }

  goZone(id) {
    const z = this.zones[id]; if (!z) return;
    this.zone = id; this.sound.play('tick');
    const yp = yawPitchTo(z.pos, z.look);
    this.goal.pos.copy(z.pos); this.goal.yaw = this.view.yaw + wrapAngle(yp.yaw - this.view.yaw); this.goal.pitch = yp.pitch; this.goal.fov = z.fov;
    this.zoneYaw = this.goal.yaw; this.zonePitch = yp.pitch;
    $('btnBack').classList.remove('hidden');
  }
  back() {
    if (!this.zone) return;
    // 다가간 곳 안에 또 다가간 곳이 있으면 한 단계만 물러난다
    const parent = this.zones[this.zone].parent;
    if (parent) { this.goZone(parent); return; }
    this.zone = null;
    this.goal.pos.copy(this.home.pos); this.goal.fov = this.home.fov;
    this.goal.pitch = this.homePitch; // 물러나면 처음 눈높이로
    $('btnBack').classList.add('hidden');
  }

  // ---------- 입력 ----------
  bindInput() {
    const cv = this.canvas, pts = new Map();
    let downAt = null, moved = 0, pinch0 = 0, fov0 = 0;
    cv.addEventListener('pointerdown', e => {
      cv.setPointerCapture(e.pointerId); pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pts.size === 1) { downAt = { x: e.clientX, y: e.clientY, t: performance.now() }; moved = 0; }
      if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch0 = Math.hypot(a.x - b.x, a.y - b.y); fov0 = this.goal.fov; moved = 99; }
      this.sound.ensure?.call(this.sound);
    });
    cv.addEventListener('pointermove', e => {
      const p = pts.get(e.pointerId);
      if (!p) { if (e.pointerType === 'mouse' && this.scene) this.hover(e.clientX, e.clientY); return; }
      const dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY;
      if (pts.size === 2) {
        const [a, b] = [...pts.values()], d = Math.hypot(a.x - b.x, a.y - b.y);
        this.goal.fov = THREE.MathUtils.clamp(fov0 * pinch0 / d, 25, 75); return;
      }
      moved += Math.abs(dx) + Math.abs(dy);
      if (moved > 6 && this.scene) {
        cv.classList.add('dragging'); $('tip').classList.add('hidden');
        const k = this.goal.fov / 62 * .0042;
        this.goal.yaw += dx * k; this.goal.pitch = THREE.MathUtils.clamp(this.goal.pitch + dy * k, -1.35, 1.35);
        this.limitLook();
      }
    });
    const up = e => {
      if (!pts.has(e.pointerId)) return;
      pts.delete(e.pointerId); cv.classList.remove('dragging');
      if (pts.size === 0 && downAt && moved <= 6 && this.scene && e.button === 0) { // 왼쪽 버튼(터치 포함)만 누르기로 친다
        const rec = this.pick(e.clientX, e.clientY);
        if (rec) this.activate(rec);
        else if (this.selected) this.select(null);
        else if (this.zone) this.back(); // 다가간 상태에서 빈 곳을 누르면 뒤로
      }
      if (pts.size === 0) downAt = null;
    };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    cv.addEventListener('wheel', e => { this.goal.fov = THREE.MathUtils.clamp(this.goal.fov + e.deltaY * .03, 25, 75); e.preventDefault(); }, { passive: false });
    cv.addEventListener('contextmenu', e => { e.preventDefault(); this.back(); });
    addEventListener('keydown', e => {
      if (e.key === 'Escape') { if (!$('modal').classList.contains('hidden')) this.closeModal(); else if (this.selected) this.select(null); else this.back(); }
    });
  }
  limitLook() {
    if (this.zone) {
      const r = this.zones[this.zone].range;
      this.goal.yaw = THREE.MathUtils.clamp(this.goal.yaw, this.zoneYaw - r, this.zoneYaw + r);
      this.goal.pitch = THREE.MathUtils.clamp(this.goal.pitch, this.zonePitch - r, this.zonePitch + r);
    } else if (this.yawRange) {
      const d = wrapAngle(this.goal.yaw - this.homeYaw), c = THREE.MathUtils.clamp(d, -this.yawRange, this.yawRange);
      this.goal.yaw += c - d;
    }
  }
  hover(x, y) {
    const rec = this.pick(x, y), tip = $('tip');
    this.canvas.classList.toggle('pointing', !!rec && !this.selected);
    this.canvas.classList.toggle('using', !!this.selected);
    if (rec && rec.name) {
      tip.textContent = this.selected ? `${this.items[this.selected].name} → ${rec.name}` : rec.name;
      tip.style.left = x + 'px'; tip.style.top = y + 'px'; tip.classList.remove('hidden');
    } else tip.classList.add('hidden');
  }

  // ---------- 매 화면 ----------
  frame() {
    const dt = Math.min(this.clock.getDelta(), .05), t = this.clock.elapsedTime;
    if (!this.scene) return;
    const k = 1 - Math.pow(.0015, dt);
    this.view.pos.lerp(this.goal.pos, k);
    this.view.yaw += wrapAngle(this.goal.yaw - this.view.yaw) * k;
    this.view.pitch += (this.goal.pitch - this.view.pitch) * k;
    this.view.fov += (this.goal.fov - this.view.fov) * k;
    const c = this.camera;
    c.position.copy(this.view.pos);
    c.rotation.set(this.view.pitch, this.view.yaw, 0, 'YXZ');
    if (Math.abs(c.fov - this.view.fov) > .01) { c.fov = this.view.fov; c.updateProjectionMatrix(); }
    for (const fn of this.updates) fn(dt, t, this);
    this.tweenStep(dt);
    this.composer.render();
    if (!this.done && this.startTime) {
      const s = Math.floor((performance.now() - this.startTime) / 1000);
      $('timer').textContent = `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
    }
  }

  // ---------- 움직임 ----------
  // g.tween(obj, {position:{y:1}, rotation:{x:.5}, 'material.opacity':0}, 0.8).then(...)
  tween(obj, props, dur = .6, ease = 'inOut') {
    this.tweens ??= [];
    return new Promise(res => {
      const list = [];
      for (const [k, v] of Object.entries(props)) {
        if (typeof v === 'object') for (const [kk, vv] of Object.entries(v)) list.push([obj[k], kk, obj[k][kk], vv]);
        else { const path = k.split('.'), last = path.pop(), tgt = path.reduce((o, p) => o[p], obj); list.push([tgt, last, tgt[last], v]); }
      }
      this.tweens.push({ list, t: 0, dur, ease, res });
    });
  }
  tweenStep(dt) {
    if (!this.tweens?.length) return;
    this.tweens = this.tweens.filter(tw => {
      tw.t = Math.min(1, tw.t + dt / tw.dur);
      const x = tw.t, e = tw.ease === 'out' ? 1 - Math.pow(1 - x, 3) : tw.ease === 'linear' ? x : x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
      for (const [o, k, a, b] of tw.list) o[k] = a + (b - a) * e;
      if (tw.t >= 1) { tw.res(); return false; }
      return true;
    });
  }
  wait(sec) { return new Promise(r => setTimeout(r, sec * 1000)); }

  // ---------- 가방 ----------
  has(id) { return this.inv.includes(id); }
  give(id, quiet) {
    if (this.inv.includes(id)) return;
    const it = this.items[id]; if (!it) { console.warn('없는 물건', id); return; }
    this.inv.push(id); this.renderInv(id);
    if (!quiet) { this.sound.play('pickup'); this.say(`${josa(it.name, '을', '를')} 얻었다.`); }
  }
  take(id) { this.inv = this.inv.filter(x => x !== id); if (this.selected === id) this.selected = null; this.renderInv(); }
  select(id) {
    this.selected = id; this.renderInv();
    this.canvas.classList.toggle('using', !!id);
  }
  tapSlot(id) {
    this.sound.play('tick');
    if (this.selected && this.selected !== id) {
      const a = this.selected, b = id;
      const c = this.combos.find(r => (r[0] === a && r[1] === b) || (r[0] === b && r[1] === a));
      if (c) {
        const [x, y, result, after] = c;
        if (typeof result === 'function') { result(this); return; }
        this.take(x); this.take(y); this.give(result, true); this.select(null);
        this.sound.play('combine'); this.say(`조합했다 → 「${this.items[result].name}」`);
        after?.(this); return;
      }
    }
    this.select(this.selected === id ? null : id);
  }
  renderInv(newId) {
    const box = $('inv'); box.innerHTML = '';
    for (const id of this.inv) {
      const it = this.items[id], d = document.createElement('button');
      d.className = 'slot' + (this.selected === id ? ' sel' : '') + (newId === id ? ' new' : '');
      d.title = it.name;
      const icon = this.iconFor(id);
      if (icon) d.style.backgroundImage = `url(${icon})`; else d.innerHTML = `<span class="emo">${it.emoji ?? '❔'}</span>`;
      d.onclick = () => this.tapSlot(id);
      d.ondblclick = () => this.inspect(id);
      box.appendChild(d);
    }
    $('invActions').classList.toggle('hidden', !this.selected);
    if (this.selected) $('selName').textContent = this.items[this.selected].name + ' — 쓸 곳을 누르세요';
  }

  // 물건 그림: 3D 모양을 작은 그림으로 찍어 둔다
  aux() {
    if (!this._aux) {
      const r = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
      r.outputColorSpace = THREE.SRGBColorSpace; r.toneMapping = THREE.ACESFilmicToneMapping;
      const sc = new THREE.Scene(), pm = new THREE.PMREMGenerator(r);
      sc.environment = pm.fromScene(new RoomEnvironment(), .04).texture;
      const key = new THREE.DirectionalLight(0xfff1dd, 2.2); key.position.set(2, 3, 2); sc.add(key);
      const rim = new THREE.DirectionalLight(0x99bbff, 1.2); rim.position.set(-2, 1, -2); sc.add(rim);
      sc.add(new THREE.AmbientLight(0xffffff, .4));
      const cam = new THREE.PerspectiveCamera(35, 1, .01, 50);
      this._aux = { r, sc, cam };
    }
    return this._aux;
  }
  modelFor(id) {
    const it = this.items[id]; if (!it.model) return null;
    const A = this.aux(), g = new THREE.Group();
    const kit = makeKit(g, () => { });
    it.model(kit, g);
    // 크기 맞추기
    const box = new THREE.Box3().setFromObject(g), size = box.getSize(new THREE.Vector3()), ctr = box.getCenter(new THREE.Vector3());
    const holder = new THREE.Group(); g.position.sub(ctr); holder.add(g);
    holder.userData.radius = Math.max(size.x, size.y, size.z) * .5 || .1;
    return holder;
  }
  iconFor(id) {
    const it = this.items[id];
    if (it._icon !== undefined) return it._icon;
    const m = this.modelFor(id); if (!m) return (it._icon = null);
    const A = this.aux(); A.r.setPixelRatio(1); A.r.setSize(128, 128, false);
    A.sc.add(m); m.rotation.set(...(it.iconRot ?? [.5, -.6, 0]));
    const R = m.userData.radius; A.cam.position.set(0, 0, R * 3.4); A.cam.lookAt(0, 0, 0); A.cam.aspect = 1; A.cam.updateProjectionMatrix();
    A.r.render(A.sc, A.cam); it._icon = A.r.domElement.toDataURL(); A.sc.remove(m);
    return it._icon;
  }
  inspect(id) {
    const it = this.items[id]; this.sound.play('page');
    const box = this.openModal(`<h2>${esc(it.name)}</h2><canvas id="inspectCanvas"></canvas><div class="inspectDesc">${it.desc ?? ''}</div><div class="mBtns" id="inspBtns"></div>`);
    const holder = $('inspectCanvas'), m = this.modelFor(id);
    if (!m) { holder.outerHTML = `<div style="font-size:90px;text-align:center">${it.emoji ?? '❔'}</div>`; }
    else {
      const A = this.aux(); holder.replaceWith(A.r.domElement); A.r.domElement.id = 'inspectCanvas';
      const w = Math.min(420, innerWidth * .8), h = Math.min(340, innerHeight * .48);
      A.r.setPixelRatio(Math.min(devicePixelRatio, 2)); A.r.setSize(w, h, false); A.r.domElement.style.width = w + 'px'; A.r.domElement.style.height = h + 'px';
      A.sc.add(m); m.rotation.set(...(it.iconRot ?? [.4, -.5, 0]));
      const R = m.userData.radius; A.cam.aspect = w / h; A.cam.position.set(0, 0, R * 3.6); A.cam.lookAt(0, 0, 0); A.cam.updateProjectionMatrix();
      let drag = null, alive = true, vy = .4;
      const el = A.r.domElement;
      el.onpointerdown = e => { drag = { x: e.clientX, y: e.clientY }; el.setPointerCapture(e.pointerId); vy = 0; };
      el.onpointermove = e => { if (!drag) return; m.rotation.y += (e.clientX - drag.x) * .01; m.rotation.x += (e.clientY - drag.y) * .01; drag = { x: e.clientX, y: e.clientY }; };
      el.onpointerup = () => drag = null;
      const loop = () => { if (!alive) return; m.rotation.y += vy * .016; A.r.render(A.sc, A.cam); requestAnimationFrame(loop); };
      loop();
      this.onModalClose = () => { alive = false; A.sc.remove(m); };
    }
    if (it.onInspect) it.onInspect(this, $('inspBtns'));
  }

  // ---------- 글 ----------
  say(text, sec = 3.2) {
    const el = $('say'); el.innerHTML = text; el.classList.add('show');
    clearTimeout(this._sayT); this._sayT = setTimeout(() => el.classList.remove('show'), sec * 1000 + text.length * 40);
  }
  openModal(html, { closable = true } = {}) {
    const m = $('modal'), b = $('modalBox');
    this.onModalClose?.(); this.onModalClose = null;
    b.innerHTML = (closable ? '<button class="mClose" aria-label="닫기">✕</button>' : '') + html;
    b.querySelector('.mClose')?.addEventListener('click', () => this.closeModal());
    m.classList.remove('hidden');
    m.onpointerdown = e => { if (e.target === m && closable) this.closeModal(); };
    return b;
  }
  closeModal() {
    $('modal').classList.add('hidden'); $('modalBox').innerHTML = '';
    this.onModalClose?.(); this.onModalClose = null;
    const cb = this._afterClose; this._afterClose = null; cb?.();
  }
  // 쪽지: style = paper | screen | metal
  note(title, body, style = 'paper', after) {
    this.sound.play('page');
    this.openModal(`<h2>${esc(title)}</h2><div class="paper ${style}">${body}</div>`);
    this._afterClose = after;
  }
  // 고르기 창: options = [{label, fn}]
  choose(title, text, options) {
    const b = this.openModal(`<h2>${esc(title)}</h2><p>${text}</p><div class="mBtns"></div>`);
    const row = b.querySelector('.mBtns');
    for (const o of options) { const x = document.createElement('button'); x.className = 'btn' + (o.ghost ? ' ghost' : ''); x.textContent = o.label; x.onclick = () => { this.closeModal(); o.fn?.(this); }; row.appendChild(x); }
  }

  // ---------- 자물쇠 ----------
  // o: { title, text, type:'digits'|'letters'|'symbols'|'colors'|'pad', length, answer, symbols, onSolve, id }
  lock(o) {
    const sets = {
      digits: '0123456789'.split(''),
      letters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''),
      dirs: ['↑', '→', '↓', '←'],
    };
    if (o.type === 'pad' || o.type === 'dirpad') return this.padLock(o);
    const sym = o.symbols ?? sets[o.type] ?? sets.digits;
    const n = o.length ?? (Array.isArray(o.answer) ? o.answer.length : String(o.answer).length);
    this._lockMem ??= {};
    const key = o.id ?? o.title;
    const val = this._lockMem[key] ?? Array(n).fill(0);
    const isColor = o.type === 'colors';
    const b = this.openModal(`<h2>${esc(o.title)}</h2>${o.text ? `<p>${o.text}</p>` : ''}<div class="lock"></div><div class="mBtns"><button class="btn" id="lockOk">열어 본다</button></div>`);
    const row = b.querySelector('.lock');
    const draw = () => {
      row.innerHTML = '';
      val.forEach((v, i) => {
        const w = document.createElement('div'); w.className = 'wheel';
        const up = document.createElement('button'); up.textContent = '▲';
        const dn = document.createElement('button'); dn.textContent = '▼';
        const d = document.createElement('div'); d.className = 'val' + (isColor ? ' sw' : '');
        if (isColor) d.style.background = sym[v]; else d.textContent = sym[v];
        up.onclick = () => { val[i] = (v + 1) % sym.length; this.sound.play('tick'); draw(); };
        dn.onclick = () => { val[i] = (v + sym.length - 1) % sym.length; this.sound.play('tick'); draw(); };
        w.append(up, d, dn); row.appendChild(w);
      });
      this._lockMem[key] = val;
    };
    draw();
    b.querySelector('#lockOk').onclick = () => {
      const got = val.map(v => sym[v]);
      const ans = Array.isArray(o.answer) ? o.answer : String(o.answer).split('');
      if (got.join('|') === ans.join('|')) {
        this.closeModal(); this.sound.play('unlock'); o.onSolve?.(this);
      } else { this.sound.play('wrong'); row.classList.remove('shake'); void row.offsetWidth; row.classList.add('shake'); o.onWrong?.(this, got); }
    };
  }
  // 누르는 판: 숫자 키패드나 방향 버튼
  padLock(o) {
    const keys = o.keys ?? (o.type === 'dirpad' ? ['', '↑', '', '←', '⟲', '→', '', '↓', ''] : ['1', '2', '3', '4', '5', '6', '7', '8', '9', '⟲', '0', '✓']);
    const ans = Array.isArray(o.answer) ? o.answer : String(o.answer).split('');
    let seq = [];
    const b = this.openModal(`<h2>${esc(o.title)}</h2>${o.text ? `<p>${o.text}</p>` : ''}<div class="seq" id="seq"></div><div class="pads" ${o.cols ? `style="grid-template-columns:repeat(${o.cols},64px)"` : ''}></div>`);
    const pads = b.querySelector('.pads'), out = b.querySelector('#seq');
    const show = () => out.textContent = seq.join(o.sep ?? ' ') || ' ';
    const check = () => {
      if (seq.join('|') === ans.join('|')) { this.closeModal(); this.sound.play('unlock'); o.onSolve?.(this); }
      else { this.sound.play('wrong'); out.classList.remove('shake'); void out.offsetWidth; out.classList.add('lock', 'shake'); seq = []; setTimeout(show, 300); }
    };
    for (const k of keys) {
      const x = document.createElement('button'); x.textContent = k;
      if (!k) { x.style.visibility = 'hidden'; }
      x.onclick = () => {
        if (k === '⟲') { seq = []; this.sound.play('tick'); }
        else if (k === '✓') { check(); return; }
        else { seq.push(k); this.sound.play('beep'); if (o.auto !== false && seq.length >= ans.length) { show(); setTimeout(check, 200); return; } }
        show();
      };
      pads.appendChild(x);
    }
    show();
  }

  // ---------- 힌트 ----------
  hint() {
    const list = this.def.hints ?? [];
    const h = list.find(x => !x.when || x.when(this.s, this));
    if (!h) { this.say('힌트가 없다. 이미 거의 다 왔다!'); return; }
    if (this._hintFor !== h) { this._hintFor = h; this.hintStep = 0; }
    const all = Array.isArray(h.text) ? h.text : [h.text];
    // 힌트는 핵심 하나만: 정답이 아니라 방향을 알려 주는 첫 번째 힌트
    const texts = [all[0]];
    const i = Math.min(this.hintStep, texts.length - 1);
    const more = i < texts.length - 1;
    this.choose('힌트', texts[i], [
      ...(more ? [{ label: '더 알려 줘', fn: () => { this.hintStep++; this.hint(); } }] : []),
      { label: '알겠어', ghost: more },
    ]);
  }

  // ---------- 탈출 ----------
  async win(text) {
    if (this.done) return;
    this.done = true; this.sound.play('win');
    const sec = Math.floor((performance.now() - this.startTime) / 1000);
    this.onWin?.(this.index, sec);
    await this.wait(1.4);
    const last = this.index >= this.total - 1;
    this.openModal(`<h2>탈출 성공!</h2><p>${text ?? this.def.outro ?? '문이 열렸다.'}</p><p style="color:var(--dim)">걸린 시간 ${Math.floor(sec / 60)}분 ${sec % 60}초</p><div class="mBtns">${last ? '' : '<button class="btn" id="goNext">다음 방으로</button>'}<button class="btn ghost" id="goMenu">처음 화면</button></div>`, { closable: false });
    $('goNext')?.addEventListener('click', () => { this.closeModal(); this.onNext?.(); });
    $('goMenu').addEventListener('click', () => { this.closeModal(); this.onMenu?.(); });
  }

  bindUI() {
    $('btnBack').onclick = () => this.back();
    $('btnHint').onclick = () => this.hint();
    $('btnInspect').onclick = () => this.selected && this.inspect(this.selected);
    $('btnMenu').onclick = () => this.choose('메뉴', '어떻게 할까요?', [
      { label: '계속하기' },
      { label: '이 방 처음부터', ghost: true, fn: () => this.onRestart?.() },
      { label: '처음 화면', ghost: true, fn: () => this.onMenu?.() },
    ]);
  }
}
