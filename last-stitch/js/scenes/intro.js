// 인트로: 인트로 음악(60초, 120bpm, 8초마다 큰 박)에 맞춘 7컷 + 제목 「The Last Stitch」.
// 장면 규약 { frame(dt), resize(), destroy() }. 붙이는 법은 인계지침_인트로.md
//   new IntroScene(app, { onDone, titleOnly })  — onDone: 제목에서 「눌러서 시작」을 누르면 부름
//   titleOnly 를 안 주면: 처음이면 인트로 전체, 본 적 있으면(localStorage) 바로 제목
import { audio } from '../engine/audio.js';

const BASE = 'assets/intro/';
const SEEN_KEY = 'last-stitch-intro-seen';
const EXT = (() => { try { return new Audio().canPlayType('audio/ogg; codecs="vorbis"') ? 'ogg' : 'mp3'; } catch { return 'mp3'; } })();
const MUSIC_LEN = 60;

// ── 그림 안 자리 (그림 폭·높이에 대한 비율). 그림을 바꾸면 여기만 고친다 ──
const POS = {
  c1: { candle: [0.19, 0.44], window: [0.87, 0.16], beamTo: [0.42, 0.95] },
  c1fg: { flame: [0.262, 0.139] },           // 앞 촛대 그림 안 불꽃 자리
  c3: { candle: [0.075, 0.2], bottle: [0.47, 0.74], bottleH: 0.4 },   // bottle: 병 바닥 가운데
  c3bottle: { mouth: [0.5, 0.12] },          // 병 그림 안 주둥이 자리
  // 눈 무리(박마다 한 무리씩 켜짐, 마지막은 가운데 큰 기사). [x, y, r] 비율 — intro_c5_eyes 와 c5_bg 차이로 찾음
  c5: { eyes: [
    [[0.267, 0.414, 0.009], [0.300, 0.412, 0.009]],
    [[0.701, 0.417, 0.009], [0.736, 0.408, 0.009]],
    [[0.431, 0.342, 0.014], [0.458, 0.326, 0.015], [0.442, 0.316, 0.008], [0.472, 0.291, 0.008], [0.486, 0.295, 0.012], [0.493, 0.317, 0.008], [0.494, 0.243, 0.009], [0.422, 0.373, 0.008]],
    [[0.031, 0.529, 0.008], [0.017, 0.760, 0.008], [0.035, 0.772, 0.008]],
    [[0.710, 0.561, 0.008], [0.714, 0.638, 0.008], [0.736, 0.688, 0.010]],
    [[0.082, 0.823, 0.009], [0.106, 0.814, 0.008], [0.115, 0.829, 0.009], [0.152, 0.770, 0.008]],
    [[0.227, 0.686, 0.008], [0.257, 0.680, 0.011], [0.303, 0.678, 0.010]],
    [[0.454, 0.520, 0.008], [0.468, 0.544, 0.017], [0.437, 0.787, 0.008]],
    [[0.480, 0.439, 0.013], [0.541, 0.432, 0.013]],
  ] },
  c6: { path: [[0.42, 0.66], [0.55, 0.5], [0.68, 0.62], [0.78, 0.42], [0.9, 0.48], [1.05, 0.3]] },
  c6hand: { tip: [0.93, 0.07] },             // 손 그림 안 바늘 끝
};

// ── 컷 시간표 (음악 시각, 초). 큰 박: 16·24·32·40·48 ──
const CUT_T = [
  [0, 8.3],      // 1 작업실
  [7.7, 16.3],   // 2 선반 위 왕국들 (8.0 박에 초점 이동으로 넘어감)
  [15.7, 25.4],  // 3 잉크병 (24.0 쓰러짐)
  [24.35, 32.15],// 4 물감 번짐 (잉크가 화면을 덮으며 넘어감)
  [31.85, 40.25],// 5 붉은 눈
  [39.75, 48.6], // 6 바늘과 금빛 실
  [47.8, 1e9],   // 7 제목
];
const T_TITLE = 48;          // 띠가 걷히기 시작
const T_STITCH = 49.0;       // 제목 꿰매기 시작
const T_STITCH_END = 54.0;
const T_PRESS = 55.5;        // 「눌러서 시작」
const CAPTIONS = [
  [1.6, 6.9, '이름난 모형 장인의 작업실. 그날 밤, 스승님은 돌아오지 않았다.'],
  [9.4, 15.0, '선반 위에는 스승님이 평생 만든 작은 왕국들이 잠들어 있었다.'],
  [26.0, 31.2, '쏟아진 붉은 물감이 왕국 속으로 스며들었다.'],
  [33.4, 39.0, '물든 말들이 눈을 떴다. 성을 향해.'],
  [42.2, 47.0, '스승님의 바늘과 실. 이제 내 손에 있다.'],
];
// 효과음 시간표 [시각, 이름, 크기, 빠르기]
const SFX_PLAN = [
  [0.05, 'in_room', 0.9], [7.75, 'in_whoosh', 0.5], [15.65, 'in_whoosh', 0.55],
  [16.2, 'in_wobble', 0.7], [18.1, 'in_wobble', 0.8, 0.94], [20.0, 'in_wobble', 0.85, 0.82], [21.9, 'in_wobble', 0.9, 0.7],
  [23.92, 'in_crash', 1], [24.3, 'in_ooze', 0.7], [25.8, 'in_ooze', 0.85, 0.9], [26.0, 'in_heart', 1],
  [39.8, 'in_whoosh', 0.5], [41.3, 'in_glint', 0.9], [42.0, 'in_thread', 1], [44.2, 'in_thread', 0.6, 1.15],
  [47.55, 'in_whoosh', 0.6], [53.85, 'in_title', 1],
];
const EYE_T0 = 33.0;         // 첫 눈이 켜지는 때(박마다 하나씩)
const THREAD_T = [42.0, 46.6];

const IMG_LIST = ['intro_c1_bg', 'intro_c1_fg', 'intro_c2_bg', 'intro_c2_fg', 'intro_c3_bg', 'intro_c3_bottle', 'intro_c4_bg', 'intro_c4_red',
  'intro_c5_bg', 'intro_c5_eyes', 'intro_c6_bg', 'intro_c6_hand', 'intro_c7_bg'];
const FIRST = ['intro_c1_bg', 'intro_c1_fg', 'intro_c2_bg', 'intro_c2_fg'];
const SFX_LIST = ['in_room', 'in_whoosh', 'in_wobble', 'in_crash', 'in_ooze', 'in_heart', 'in_eye', 'in_glint', 'in_thread', 'in_stitch', 'in_title'];

// 장면을 다시 만들어도 다시 받지 않게 모아 둔다
const cache = { img: {}, blur: {}, sfx: {}, music: null, loading: {} };

// ── 작은 도구 ──
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, k) => a + (b - a) * k;
const ease = k => (k = clamp(k, 0, 1), k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
const easeOut = k => 1 - Math.pow(1 - clamp(k, 0, 1), 3);
const easeIn = k => Math.pow(clamp(k, 0, 1), 3);
const seg = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
function rnd(seed) { let s = seed >>> 0 || 1; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; }

function loadImg(name) {
  if (cache.img[name]) return Promise.resolve(cache.img[name]);
  if (cache.loading[name]) return cache.loading[name];
  return (cache.loading[name] = new Promise(res => {
    const im = new Image();
    im.decoding = 'async';
    im.onload = () => { cache.img[name] = im; res(im); };
    im.onerror = () => { console.warn('인트로 그림 못 읽음', name); res(null); };
    im.src = BASE + name + '.webp';
  }));
}
// 흐린 그림: 한 번만 만든다(작게 줄였다가 늘리면 흐려진다. filter가 되면 더 곱게)
function blurOf(name) {
  if (cache.blur[name]) return cache.blur[name];
  const im = cache.img[name]; if (!im) return null;
  const w = Math.max(8, Math.round(im.width / 4)), h = Math.max(8, Math.round(im.height / 4));
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d');
  if ('filter' in x) { x.filter = 'blur(5px)'; x.drawImage(im, 0, 0, w, h); }
  else {
    const s = document.createElement('canvas'); s.width = Math.max(4, w >> 2); s.height = Math.max(4, h >> 2);
    s.getContext('2d').drawImage(im, 0, 0, s.width, s.height);
    x.imageSmoothingQuality = 'high'; x.drawImage(s, 0, 0, w, h);
  }
  return (cache.blur[name] = c);
}
async function loadBuf(url) {
  if (!audio.ctx) return null;
  try {
    const ab = await (await fetch(url)).arrayBuffer();
    return await new Promise((ok, no) => audio.ctx.decodeAudioData(ab, ok, no));
  } catch { console.warn('인트로 소리 못 읽음', url); return null; }
}
function loadSfx() {
  return Promise.all(SFX_LIST.map(async n => { if (!(n in cache.sfx)) cache.sfx[n] = await loadBuf(`${BASE}sfx/${n}.${EXT}`); }));
}
function loadMusic() {
  if (cache.music !== null) return Promise.resolve(cache.music);
  return (cache.loading.music ||= loadBuf(`${BASE}intro_music.${EXT}`).then(b => (cache.music = b)));
}

function makeDust() { return Array.from({ length: 70 }, (_, i) => { const r = rnd(i * 97 + 13); return { x: r(), y: r(), z: 0.4 + r() * 0.8, p: r() * 6.28, s: 0.3 + r() * 0.7 }; }); }
// 유기적인 얼룩 모양(물감)
function blob(ctx, cx, cy, r, seed, t, sy = 1) {
  const N = 48;
  for (let i = 0; i <= N; i++) {
    const a = i / N * Math.PI * 2;
    const k = 1 + 0.16 * Math.sin(3 * a + seed) + 0.09 * Math.sin(5 * a + seed * 2.1 + t * 0.8) + 0.05 * Math.sin(11 * a + seed * 3.3 - t * 1.3);
    const x = cx + Math.cos(a) * r * k, y = cy + Math.sin(a) * r * k * sy;
    i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
  }
  ctx.closePath();
}

const STYLE_ID = 'intro-scene-style';
const CSS = `
.intro-root{position:fixed;inset:0;z-index:20}
#ui .intro-root,.intro-root{pointer-events:none}
.intro-skip,#ui .intro-root .intro-skip{position:absolute;top:calc(14px + var(--safe-t,0px));right:calc(14px + var(--safe-r,0px));pointer-events:auto;
  min-width:44px;min-height:44px;padding:0 18px;border-radius:22px;font-family:'Batang',serif;font-size:14px;letter-spacing:.12em;
  color:rgba(240,226,200,.82);background:rgba(10,8,6,.38);border:1px solid rgba(243,197,90,.28);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);
  opacity:0;transition:opacity .6s;cursor:pointer}
#ui .intro-root .intro-skip.show,.intro-skip.show{opacity:1}
.intro-skip:active{transform:scale(.96)}
`;

export class IntroScene {
  constructor(app, opts = {}) {
    this.app = app; this.view = app.view; this.opts = opts;
    this.alive = true;
    this.manual = !!opts.manual || /[?&]introclock=manual\b/.test(location.search);
    let seen = false; try { seen = localStorage.getItem(SEEN_KEY) === '1'; } catch {}
    this.titleOnly = opts.titleOnly ?? seen;
    this.state = 'load';           // load → gate(누르기 기다림) → play → title
    this.t = this.titleOnly ? T_TITLE + 0.01 : 0;
    this.srcs = []; this.started = false; this.pressShown = false;
    this.fast = null;              // 건너뛰기·제목만: 빠른 제목 꿰매기 시작 시각
    this.buf = document.createElement('canvas'); this.bctx = this.buf.getContext('2d');
    this.mask = document.createElement('canvas'); this.mask.width = 480; this.mask.height = 270;
    this.tmp = document.createElement('canvas'); this.tmp.width = 960; this.tmp.height = 540;
    this.makeGrain();
    this.dust = makeDust();
    this.drops = Array.from({ length: 46 }, (_, i) => { const r = rnd(i * 31 + 7); return { a: -Math.PI * (0.05 + r() * 0.9), v: 0.35 + r() * 0.75, s: 0.004 + r() * 0.012, d: r() * 0.12 }; });
    if (!document.getElementById(STYLE_ID)) { const st = document.createElement('style'); st.id = STYLE_ID; st.textContent = CSS; document.head.appendChild(st); }
    this.root = document.createElement('div'); this.root.className = 'intro-root';
    this.skipBtn = document.createElement('button'); this.skipBtn.className = 'intro-skip'; this.skipBtn.textContent = '건너뛰기';
    this.skipBtn.addEventListener('click', e => { e.stopPropagation(); this.skip(); });
    this.root.appendChild(this.skipBtn);
    (document.getElementById('ui') || document.body).appendChild(this.root);
    this.onDown = e => { if (!e.target.closest?.('.intro-skip')) this.press(e); };
    this.onKey = e => { if (e.key === 'Enter' || e.key === ' ') this.press(e); else if (e.key === 'Escape' && this.state === 'play') this.skip(); };
    window.addEventListener('pointerdown', this.onDown);
    window.addEventListener('keydown', this.onKey);
    this.resize();
    this.load();
  }

  async load() {
    const need = this.titleOnly ? ['intro_c7_bg'] : FIRST;
    this.loadP = 0;
    const all = this.titleOnly ? need : IMG_LIST;
    let done = 0;
    const firstP = Promise.all(need.map(n => loadImg(n).then(() => { done++; })));
    if (!this.titleOnly) all.filter(n => !need.includes(n)).forEach(n => loadImg(n)); // 나머지는 뒤에서
    await Promise.all([firstP, loadSfx(), this.titleOnly ? null : loadMusic(), document.fonts?.load?.('700 40px "Cinzel Deco"').catch(() => {})]);
    if (!this.alive) return;
    for (const n of need) blurOf(n);
    if (this.titleOnly) { this.enterTitle(true); return; }
    this.state = (audio.ctx && audio.ctx.state !== 'running' && !this.manual) ? 'gate' : 'ready';
    if (this.state === 'ready') this.begin();
  }
  // 첫 화면: 소리가 잠겨 있으면 한 번 눌러야 시작(음악과 박자를 맞추려면 소리가 켜져 있어야 함)
  press(e) {
    if (this.state === 'gate') { this.begin(); return; }
    if (this.state === 'title') {
      if (this.pressShown) { this.finish(); return; }
      // 꿰매는 중이면 바로 끝까지
      this.fast = { at: this.now() - 10, keepClock: true };
    }
  }
  now() { return performance.now() / 1000; }

  begin() {
    if (this.started || !this.alive) return;
    this.started = true; this.state = 'play';
    const ctx = audio.ctx;
    if (ctx && ctx.state !== 'running') ctx.resume().catch(() => {});
    if (ctx && cache.music && !this.manual) {
      this.t0 = ctx.currentTime + 0.15;
      this.gain = ctx.createGain(); this.gain.connect(audio.musicBus);
      const g = this.gain.gain;
      g.setValueAtTime(1, this.t0);
      g.setValueAtTime(1, this.t0 + 25.4); g.linearRampToValueAtTime(0.55, this.t0 + 26.5);   // 물감이 번질 때 낮아짐
      g.setValueAtTime(0.55, this.t0 + 31.6); g.linearRampToValueAtTime(1, this.t0 + 32.0);    // 터짐
      const m = ctx.createBufferSource(); m.buffer = cache.music; m.connect(this.gain); m.start(this.t0);
      this.srcs.push(m); this.musicSrc = m;
      audio.playMusic(null, 0.6);
      for (const [at, n, v, r] of SFX_PLAN) this.playAt(n, this.t0 + at, v, r);
      POS.c5.eyes.forEach((_, i, a) => this.playAt('in_eye', this.t0 + this.eyeT(i), i === a.length - 1 ? 0.95 : 0.5, i === a.length - 1 ? 0.75 : 0.9 + (i % 3) * 0.08));
      for (const k of [0.3, 0.55, 0.8]) this.playAt('in_glint', this.t0 + lerp(THREAD_T[0], THREAD_T[1], k), 0.45, 1.1);
      this.titleLetterSfx(this.t0 + T_STITCH, (T_STITCH_END - T_STITCH));
      this.clock = 'audio';
    } else { this.clock = 'dt'; this.t = 0; }
    setTimeout(() => this.alive && this.state === 'play' && this.skipBtn.classList.add('show'), 900);
  }
  playAt(name, at, vol = 1, rate = 1) {
    const b = cache.sfx[name], ctx = audio.ctx;
    if (!b || !ctx) return;
    const src = ctx.createBufferSource(); src.buffer = b; src.playbackRate.value = rate || 1;
    const g = ctx.createGain(); g.gain.value = vol ?? 1;
    src.connect(g); g.connect(audio.sfxBus);
    src.start(Math.max(ctx.currentTime, at));
    this.srcs.push(src);
  }
  titleLetterSfx(at, dur) {
    const n = this.letterCount();
    for (let i = 0; i < n; i++) this.playAt('in_stitch', at + (i + 0.5) / n * dur, 0.4, 0.92 + (i % 4) * 0.05);
  }
  letterCount() { return 'TheLastStitch'.length; }
  stopSounds() {
    for (const s of this.srcs) { try { s.stop(); } catch {} try { s.disconnect(); } catch {} }
    this.srcs = [];
    if (this.gain) { try { this.gain.disconnect(); } catch {} this.gain = null; }
  }
  markSeen() { try { localStorage.setItem(SEEN_KEY, '1'); } catch {} }

  // 건너뛰기: 남은 예약 소리·음악을 모두 멈추고 제목으로
  skip() {
    if (this.state !== 'play' && this.state !== 'gate') return;
    this.stopSounds();
    this.enterTitle(true);
  }
  enterTitle(fast) {
    this.state = 'title';
    this.skipBtn.classList.remove('show');
    this.markSeen();
    if (fast) {
      this.clock = 'fast';
      this.fast = { at: this.now() };
      this.t = T_TITLE + 2.2;
      audio.playMusic('title', 1.5);
      loadImg('intro_c7_bg');
      const ctx = audio.ctx;
      if (ctx) { this.titleLetterSfx(ctx.currentTime + 0.5, 2.0); this.playAt('in_title', ctx.currentTime + 2.3, 0.8); }
    }
  }
  finish() {
    if (!this.alive || this.done) return;
    this.done = true;
    audio.ctx && this.playAt('in_glint', audio.ctx.currentTime, 0.6);
    this.opts.onDone?.({ t: this.t });
  }
  // 시험용: 원하는 시각으로 옮겨 그리기(소리 없음)
  seek(t) { this.stopSounds(); this.clock = 'manual'; this.t = t; this.state = t >= T_TITLE ? 'title' : 'play'; if (t >= T_PRESS) this.pressShown = true; this.started = true; }

  time(dt) {
    if (this.clock === 'audio') {
      const ctx = audio.ctx; this.t = ctx.currentTime - this.t0;
    } else if (this.clock === 'dt') this.t += dt;
    else if (this.clock === 'fast' && this.fast && !this.fast.keepClock) this.t = T_TITLE + 2.2 + (this.now() - this.fast.at);
    return this.t;
  }

  resize() {
    this.view.resize();
    const { cv } = this.view;
    this.buf.width = cv.width; this.buf.height = cv.height;
  }
  makeGrain() {
    const c = document.createElement('canvas'); c.width = c.height = 160;
    const x = c.getContext('2d'); const d = x.createImageData(160, 160); const r = rnd(5);
    for (let i = 0; i < d.data.length; i += 4) { const v = 100 + r() * 155; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
    x.putImageData(d, 0, 0); this.grain = c;
  }

  // ── 그리기 ──
  frame(dt) {
    if (!this.alive) return;
    const t = this.time(dt);
    const { ctx, dpr, W, H } = this.view;
    this.W = W; this.H = H; this.ori = W < H ? 'v' : 'h';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    if (this.state === 'load' || this.state === 'gate' || (this.state === 'ready' && !this.started)) { this.drawGate(ctx); return; }
    if (this.state === 'play' && t >= T_TITLE) this.enterTitle(false);
    if (this.state === 'title' && !this.titleMusic && t > MUSIC_LEN - 0.6 && this.clock !== 'fast') { this.titleMusic = true; audio.playMusic('title', 2.5); }
    this.drawCuts(ctx, t);
    this.drawOverlay(ctx, t);
  }

  drawGate(ctx) {
    const { W, H } = this;
    const im = cache.img.intro_c1_bg;
    const b = im && blurOf('intro_c1_bg');
    if (b) { ctx.globalAlpha = 0.28; this.cover(ctx, b, { x: 0.5, y: 0.5, z: 1.1 }, b.width, b.height); ctx.globalAlpha = 1; }
    const ready = this.state === 'gate';
    const tt = this.now();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const fs = clamp(Math.min(W, H) * 0.042, 15, 22);
    // 바늘과 실
    const cx = W / 2, cy = H * 0.44, r = fs * 1.4;
    ctx.strokeStyle = 'rgba(243,197,90,.85)'; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
    ctx.beginPath();
    const sp = ready ? 1 : (tt * 1.4) % 1;
    for (let i = 0; i <= 40; i++) { const k = i / 40; const a = k * Math.PI * 2 * 0.86 + tt * (ready ? 0.6 : 3); const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r * 0.42; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
    ctx.globalAlpha = ready ? 0.9 : 0.5 + 0.3 * Math.sin(sp * 6.28); ctx.stroke(); ctx.globalAlpha = 1;
    ctx.strokeStyle = '#d9dde3'; ctx.lineWidth = 2.2;
    ctx.beginPath(); ctx.moveTo(cx - r * 0.2, cy + r * 0.9); ctx.lineTo(cx + r * 0.2, cy - r * 0.9); ctx.stroke();
    ctx.font = `400 ${fs}px Batang, serif`; ctx.fillStyle = 'rgba(240,226,200,.9)';
    if (ready) {
      ctx.globalAlpha = 0.65 + 0.35 * Math.sin(tt * 2.6);
      ctx.fillText('화면을 눌러 이야기를 시작하세요', cx, H * 0.6);
      ctx.globalAlpha = 0.55; ctx.font = `400 ${fs * 0.72}px Batang, serif`;
      ctx.fillText('소리를 켜면 더 좋아요', cx, H * 0.6 + fs * 1.7);
      ctx.globalAlpha = 1;
    } else {
      ctx.globalAlpha = 0.6; ctx.fillText('실을 감는 중…', cx, H * 0.6); ctx.globalAlpha = 1;
    }
  }

  // 그림을 화면에 덮어 깔기. cam: 그림 안 가운데(x,y 비율)와 확대(z). 그림 밖이 보이지 않게 가운데를 묶는다
  cover(ctx, img, cam, iw = img.width, ih = img.height, shake = [0, 0]) {
    const tf = this.camTf(cam, iw, ih, shake);
    ctx.drawImage(img, tf.ox, tf.oy, iw * tf.s, ih * tf.s);
    return tf;
  }
  camTf(cam, iw, ih, shake = [0, 0]) {
    const { W, H } = this;
    const s = Math.max(W / iw, H / ih) * cam.z;
    const vw = W / s, vh = H / s;
    const cx = clamp(cam.x * iw, vw / 2, iw - vw / 2), cy = clamp(cam.y * ih, vh / 2, ih - vh / 2);
    return { s, ox: W / 2 - cx * s + shake[0], oy: H / 2 - cy * s + shake[1], iw, ih };
  }
  // 바탕 그림(흐림 b: 0 선명 ~ 1 흐림)
  bg(ctx, name, cam, b = 0, shake) {
    const im = cache.img[name]; if (!im) return this.camTf(cam, 1920, 1080, shake);
    const tf = this.camTf(cam, im.width, im.height, shake);
    if (b < 0.98) ctx.drawImage(im, tf.ox, tf.oy, im.width * tf.s, im.height * tf.s);
    if (b > 0.02) { const bl = blurOf(name); if (bl) { const a = ctx.globalAlpha; ctx.globalAlpha = a * clamp(b, 0, 1); ctx.drawImage(bl, tf.ox, tf.oy, im.width * tf.s, im.height * tf.s); ctx.globalAlpha = a; } }
    return tf;
  }
  // 카메라 열쇠: [[t, x, y, z], ...] 사이를 부드럽게
  cam(keys, t) {
    const k = keys[this.ori] || keys.h;
    if (t <= k[0][0]) return { x: k[0][1], y: k[0][2], z: k[0][3] };
    for (let i = 0; i < k.length - 1; i++) {
      const a = k[i], b = k[i + 1];
      if (t <= b[0]) { const e = ease((t - a[0]) / (b[0] - a[0])); return { x: lerp(a[1], b[1], e), y: lerp(a[2], b[2], e), z: lerp(a[3], b[3], e) }; }
    }
    const l = k[k.length - 1]; return { x: l[1], y: l[2], z: l[3] };
  }
  // 앞에 놓는 낱개 그림: 화면 기준 자리. size 는 바탕 높이(화면에 보이는 그림 높이)에 대한 비율
  layer(ctx, name, o, tf, b = 0) {
    const im = cache.img[name]; if (!im) return null;
    const unit = tf.ih * tf.s;
    const h = o.h * unit, w = h * im.width / im.height;
    const x = o.x * this.W - o.px * w + (o.dx || 0), y = o.y * this.H - o.py * h + (o.dy || 0);
    if (b < 0.98) ctx.drawImage(im, x, y, w, h);
    if (b > 0.02) { const bl = blurOf(name); if (bl) { const a = ctx.globalAlpha; ctx.globalAlpha = a * b; ctx.drawImage(bl, x, y, w, h); ctx.globalAlpha = a; } }
    return { x, y, w, h };
  }
  w2s(tf, fx, fy) { return [tf.ox + fx * tf.iw * tf.s, tf.oy + fy * tf.ih * tf.s]; }

  drawCuts(ctx, t) {
    const act = [];
    for (let i = 0; i < CUT_T.length; i++) if (t >= CUT_T[i][0] && t < CUT_T[i][1]) act.push(i);
    if (!act.length) return;
    const first = act[0];
    this.drawCut(ctx, first, t);
    for (let j = 1; j < act.length; j++) {
      const i = act[j];
      const b = this.bctx; const { dpr } = this.view;
      b.setTransform(dpr, 0, 0, dpr, 0, 0); b.globalAlpha = 1; b.globalCompositeOperation = 'source-over';
      b.fillStyle = '#000'; b.fillRect(0, 0, this.W, this.H);
      this.drawCut(b, i, t);
      const [a0] = CUT_T[i], a1 = CUT_T[act[j - 1]][1];
      const k = seg(t, a0, a1);
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
      if (i === 3) this.inkWipe(ctx, k);
      else { ctx.globalAlpha = i === 4 ? ease(k) : ease(k); ctx.drawImage(this.buf, 0, 0); }
      ctx.restore();
    }
  }
  // 잉크가 화면을 덮으며 다음 컷이 드러남
  inkWipe(ctx, k) {
    const { dpr } = this.view;
    const [mx, my] = this.mouthScreen || [this.W * 0.55, this.H * 0.6];
    const R = Math.hypot(this.W, this.H) * 1.15 * easeIn(k * 0.85 + 0.15 * k * k) + 2;
    ctx.save(); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.beginPath(); blob(ctx, mx, my, R, 2.3, k * 4); blob(ctx, mx + R * 0.35, my - R * 0.2, R * 0.6, 5.1, k * 3);
    ctx.save(); ctx.clip(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(this.buf, 0, 0); ctx.restore();
    ctx.lineWidth = Math.max(6, R * 0.05); ctx.strokeStyle = 'rgba(120,6,18,.9)'; ctx.stroke();
    ctx.lineWidth = Math.max(1.5, R * 0.008); ctx.strokeStyle = 'rgba(255,120,120,.35)'; ctx.stroke();
    ctx.restore();
  }

  drawCut(ctx, i, t) {
    [this.cut1, this.cut2, this.cut3, this.cut4, this.cut5, this.cut6, this.cut7][i].call(this, ctx, t, t - CUT_T[i][0]);
  }

  // 컷 1: 어두운 작업실. 앞 촛불에 초점 → 뒤로 초점 이동, 천천히 다가감
  cut1(ctx, t) {
    const cam = this.cam({ h: [[0, 0.5, 0.52, 1.06], [8.3, 0.52, 0.5, 1.2]], v: [[0, 0.3, 0.52, 1.0], [8.3, 0.52, 0.5, 1.08]] }, t);
    const focus = ease(seg(t, 2.6, 5.0));           // 0: 앞이 또렷, 1: 뒤가 또렷
    const tf = this.bg(ctx, 'intro_c1_bg', cam, (1 - focus) * 0.85 + seg(t, 7.6, 8.3) * 0.9);
    this.moonbeam(ctx, tf, POS.c1.window, POS.c1.beamTo, t, 1);
    this.glow(ctx, tf, POS.c1.candle, 0.16, t, 1);
    this.drawDust(ctx, t, 1, 0.9);
    const o = this.ori === 'v' ? { x: -0.04, y: 1.03, px: 0, py: 1, h: 0.36 } : { x: -0.01, y: 1.04, px: 0, py: 1, h: 0.7 };
    o.dx = -(cam.x - 0.5) * 900 * 0.35 * tf.s; o.dy = (t * 2);
    const r = this.layer(ctx, 'intro_c1_fg', o, tf, 0.15 + focus * 0.85);
    if (r) this.flameGlow(ctx, r.x + POS.c1fg.flame[0] * r.w, r.y + POS.c1fg.flame[1] * r.h, r.h * 0.35, t, 0.5 + 0.5 * (1 - focus));
  }
  // 컷 2: 선반 위 왕국들. 옆으로 미끄러지며 앞 물건이 더 빨리 지나감
  cut2(ctx, t, lt) {
    const cam = this.cam({ h: [[7.7, 0.36, 0.5, 1.22], [16.3, 0.64, 0.48, 1.26]], v: [[7.7, 0.16, 0.5, 1.0], [16.3, 0.84, 0.5, 1.0]] }, t);
    const inF = 1 - ease(seg(t, 7.7, 8.8)), outF = seg(t, 15.8, 16.3);
    const tf = this.bg(ctx, 'intro_c2_bg', cam, Math.max(inF, outF) * 0.9);
    this.glowWindows(ctx, t);
    this.drawDust(ctx, t, 2, 0.6);
    const im = cache.img.intro_c2_fg;
    if (im) {
      const unit = tf.ih * tf.s, h = (this.ori === 'v' ? 0.34 : 0.42) * unit, w = h * im.width / im.height;
      const px = -(cam.x - 0.5) * tf.iw * tf.s * 1.8;
      const y = this.H + h * 0.08 - h;
      const bl = blurOf('intro_c2_fg');
      for (let k = -1; k <= 1; k++) {           // 길게 이어 붙여 빈틈이 없게
        const x = this.W / 2 - w / 2 + px + k * w * 0.98;
        if (x > this.W || x + w < 0) continue;
        ctx.globalAlpha = 0.95; if (bl) ctx.drawImage(bl, x, y, w, h); ctx.globalAlpha = 1;
      }
    }
  }
  // 컷 3: 잉크병이 흔들리다 느리게 기울어 쓰러짐 → 쾅, 흔들림, 잉크가 쏟아짐
  cut3(ctx, t) {
    const slow = ease(seg(t, 21.5, 23.6));
    const cam = this.cam({ h: [[15.7, 0.5, 0.56, 1.12], [21.5, 0.48, 0.6, 1.24], [23.8, 0.5, 0.62, 1.32], [24.3, 0.55, 0.63, 1.3], [25.4, 0.56, 0.63, 1.28]],
      v: [[15.7, 0.56, 0.58, 1.0], [21.5, 0.5, 0.6, 1.08], [23.7, 0.52, 0.62, 1.1], [24.2, 0.6, 0.63, 1.08], [25.4, 0.62, 0.63, 1.06]] }, t);
    let shake = [0, 0];
    if (t > 24) { const d = Math.exp(-(t - 24) * 5.5) * Math.min(this.W, this.H) * 0.035; shake = [Math.sin(t * 91) * d, Math.cos(t * 77) * d * 0.8]; }
    const tf = this.bg(ctx, 'intro_c3_bg', cam, seg(t, 15.7, 16.4) > 0 ? 1 - ease(seg(t, 15.7, 16.6)) : 1, shake);
    this.glow(ctx, tf, POS.c3.candle, 0.2, t, 0.9);
    // 병 기울기: 흔들림(16~20) → 느린 기울기(20~23.7) → 빠르게 쓰러짐(23.7~24.0)
    let ang = 0, piv = 0;
    if (t < 20) { const k = seg(t, 16.2, 20); ang = Math.sin(t * 7.5) * 0.05 * k * (0.6 + 0.4 * Math.sin(t * 1.3)); piv = 0; }
    else if (t < 23.7) { ang = lerp(0.03, 0.42, easeIn(seg(t, 20, 23.7)) * 0.7 + seg(t, 20, 23.7) * 0.3) + Math.sin(t * 9) * 0.015 * (1 - seg(t, 20, 23.7)); piv = 1; }
    else { ang = lerp(0.42, Math.PI / 2 + 0.06, easeIn(seg(t, 23.7, 24.0))); piv = 1; if (t > 24) ang = Math.PI / 2 + 0.06 - Math.sin((t - 24) * 18) * 0.05 * Math.exp(-(t - 24) * 6); }
    const bt = cache.img.intro_c3_bottle;
    const [bx, by] = this.w2s(tf, POS.c3.bottle[0], POS.c3.bottle[1]);
    if (bt) {
      const h = POS.c3.bottleH * tf.ih * tf.s, w = h * bt.width / bt.height;
      // 잉크 웅덩이(쓰러진 뒤)
      if (t > 23.98) this.inkPool(ctx, bx + w * 0.5 + h * 0.6, by - w * 0.15, h, t - 23.98);
      ctx.save();
      const pvx = bx + (piv ? w * 0.42 : 0), pvy = by;
      ctx.translate(pvx, pvy); ctx.rotate(ang);
      ctx.drawImage(bt, -w / 2 - (piv ? w * 0.42 : 0), -h, w, h);
      // 주둥이 위치(화면) 기억 → 잉크 덮개 시작점
      const mx = -w / 2 - (piv ? w * 0.42 : 0) + POS.c3bottle.mouth[0] * w, my = -h + POS.c3bottle.mouth[1] * h;
      this.mouthScreen = [pvx + mx * Math.cos(ang) - my * Math.sin(ang), pvy + mx * Math.sin(ang) + my * Math.cos(ang)];
      ctx.restore();
      if (t > 23.98) this.splash(ctx, this.mouthScreen, h, t - 23.98);
    }
    this.drawDust(ctx, t, 3, 0.5, 1 - slow * 0.8);
    // 쾅! 하는 순간 번쩍(밝기 200을 넘지 않게 약하게)
    if (t > 23.98 && t < 24.4) { ctx.fillStyle = `rgba(255,220,200,${0.22 * (1 - seg(t, 23.98, 24.4))})`; ctx.fillRect(0, 0, this.W, this.H); }
  }
  inkPool(ctx, x, y, h, lt) {
    const r = h * 1.1 * easeOut(lt / 1.2);
    ctx.save();
    const g = ctx.createRadialGradient(x - r * 0.2, y - r * 0.1, r * 0.1, x, y, r * 1.1);
    g.addColorStop(0, '#d01a2c'); g.addColorStop(0.6, '#8e0a18'); g.addColorStop(1, '#4a0008');
    ctx.fillStyle = g; ctx.beginPath(); blob(ctx, x, y, r, 1.7, lt * 2, 0.32); ctx.fill();
    ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.25;
    ctx.fillStyle = '#ff9a9a'; ctx.beginPath(); blob(ctx, x - r * 0.25, y - r * 0.08, r * 0.25, 4.2, lt, 0.25); ctx.fill();
    ctx.restore();
  }
  splash(ctx, [mx, my], h, lt) {
    if (lt > 1.4) return;
    ctx.save();
    for (const d of this.drops) {
      const l = lt - d.d; if (l <= 0) continue;
      const v = d.v * h * 3.2;
      const x = mx + Math.cos(d.a) * v * l + h * 0.8 * l, y = my + Math.sin(d.a) * v * l + 0.5 * h * 7 * l * l;
      const r = d.s * h * 4 * (1 - seg(l, 0.6, 1.3));
      if (r <= 0.3) continue;
      ctx.fillStyle = '#b3121f'; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.283); ctx.fill();
      ctx.fillStyle = 'rgba(255,150,150,.5)'; ctx.beginPath(); ctx.arc(x - r * 0.3, y - r * 0.3, r * 0.35, 0, 6.283); ctx.fill();
    }
    ctx.restore();
  }
  // 컷 4: 붉은 물감이 숲 왕국으로 번짐(물든 그림을 퍼지는 얼룩 모양으로 드러냄), 심장박동
  cut4(ctx, t) {
    const beat = t > 26 && t < 31.6 ? Math.exp(-((t - 26) % 1) * 7) : 0;
    const cam = this.cam({ h: [[24.35, 0.52, 0.5, 1.08], [32.2, 0.5, 0.52, 1.2]], v: [[24.35, 0.62, 0.5, 1.0], [32.2, 0.42, 0.52, 1.06]] }, t);
    cam.z += beat * 0.008;
    const tf = this.bg(ctx, 'intro_c4_bg', cam, 0);
    const red = cache.img.intro_c4_red;
    const k = seg(t, 25.0, 31.6);
    if (red && k > 0) {
      const m = this.mask.getContext('2d'); const MW = this.mask.width, MH = this.mask.height;
      m.clearRect(0, 0, MW, MH); m.fillStyle = '#fff';
      const seeds = [[1.0, 0.0, 0, 1.25], [0.62, 0.3, 0.12, 0.6], [0.4, 0.55, 0.3, 0.55], [0.2, 0.25, 0.45, 0.5], [0.75, 0.8, 0.35, 0.55], [0.1, 0.85, 0.6, 0.45]];
      seeds.forEach(([sx, sy, d, R], j) => {
        const q = seg(k, d, 1), kk = Math.pow(q, 0.8) * 0.75 + easeOut(q) * 0.25;
        if (kk <= 0) return;
        m.beginPath(); blob(m, sx * MW, sy * MH, R * MW * 0.55 * kk, j * 1.7 + 0.5, t * 0.6); m.fill();
      });
      const T = this.tmp.getContext('2d'); const TW = this.tmp.width, TH = this.tmp.height;
      T.globalCompositeOperation = 'source-over'; T.clearRect(0, 0, TW, TH);
      T.drawImage(red, 0, 0, TW, TH);
      T.globalCompositeOperation = 'destination-in'; T.drawImage(this.mask, 0, 0, TW, TH);
      T.globalCompositeOperation = 'source-over';
      ctx.drawImage(this.tmp, tf.ox, tf.oy, tf.iw * tf.s, tf.ih * tf.s);
    }
    this.drawDust(ctx, t, 4, 0.35);
    if (beat > 0.01) {     // 박동마다 붉은 가장자리
      const g = ctx.createRadialGradient(this.W / 2, this.H / 2, Math.min(this.W, this.H) * 0.3, this.W / 2, this.H / 2, Math.hypot(this.W, this.H) * 0.6);
      g.addColorStop(0, 'rgba(120,0,10,0)'); g.addColorStop(1, `rgba(120,0,10,${0.45 * beat})`);
      ctx.fillStyle = g; ctx.fillRect(0, 0, this.W, this.H);
    }
  }
  eyeT(i) { return EYE_T0 + i * 0.5 + (i === POS.c5.eyes.length - 1 ? 0.5 : 0); }
  // 컷 5: 물든 말들의 눈이 박마다 하나씩 켜짐
  cut5(ctx, t) {
    const cam = this.cam({ h: [[31.85, 0.5, 0.5, 1.06], [40.25, 0.5, 0.48, 1.22]], v: [[31.85, 0.3, 0.5, 1.0], [36, 0.55, 0.5, 1.04], [40.25, 0.7, 0.48, 1.1]] }, t);
    const tf = this.bg(ctx, 'intro_c5_bg', cam, seg(t, 39.8, 40.25) * 0.8);
    const eyes = POS.c5.eyes, lit = cache.img.intro_c5_eyes;
    if (eyes.length) {
      // 켜진 눈 둘레만 「빛나는 눈」 그림으로 바꿔 그림
      const m = this.mask.getContext('2d'); const MW = this.mask.width, MH = this.mask.height;
      m.clearRect(0, 0, MW, MH);
      let any = false;
      eyes.forEach((grp, i) => grp.forEach(([ex, ey, er]) => {
        const a = easeOut(seg(t, this.eyeT(i), this.eyeT(i) + 0.35)); if (a <= 0) return; any = true;
        const g = m.createRadialGradient(ex * MW, ey * MH, 0, ex * MW, ey * MH, er * MW * 2.2);
        g.addColorStop(0, `rgba(255,255,255,${a})`); g.addColorStop(0.55, `rgba(255,255,255,${a * 0.8})`); g.addColorStop(1, 'rgba(255,255,255,0)');
        m.fillStyle = g; m.fillRect(0, 0, MW, MH);
      }));
      if (any && lit) {
        const T = this.tmp.getContext('2d'); const TW = this.tmp.width, TH = this.tmp.height;
        T.globalCompositeOperation = 'source-over'; T.clearRect(0, 0, TW, TH); T.drawImage(lit, 0, 0, TW, TH);
        T.globalCompositeOperation = 'destination-in'; T.drawImage(this.mask, 0, 0, TW, TH); T.globalCompositeOperation = 'source-over';
        ctx.drawImage(this.tmp, tf.ox, tf.oy, tf.iw * tf.s, tf.ih * tf.s);
      }
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      eyes.forEach((grp, i) => grp.forEach(([ex, ey, er]) => {
        const a = easeOut(seg(t, this.eyeT(i), this.eyeT(i) + 0.25)); if (a <= 0) return;
        const flick = 0.85 + 0.15 * Math.sin(t * 13 + i * 2.1);
        const fl = 1 + 1.5 * Math.exp(-(t - this.eyeT(i)) * 6);   // 켜지는 순간 번쩍
        const [sx, sy] = this.w2s(tf, ex, ey); const r = er * tf.iw * tf.s * 3.2 * fl;
        const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, r);
        g.addColorStop(0, `rgba(255,190,120,${0.85 * a * flick})`); g.addColorStop(0.25, `rgba(255,60,30,${0.5 * a * flick})`); g.addColorStop(1, 'rgba(160,0,0,0)');
        ctx.fillStyle = g; ctx.fillRect(sx - r, sy - r, r * 2, r * 2);
      }));
      ctx.restore();
    }
    this.drawDust(ctx, t, 5, 0.3);
  }
  // 컷 6: 제자의 손이 바늘을 쥐고, 금빛 실이 뻗어 나감
  cut6(ctx, t) {
    const th = seg(t, THREAD_T[0], THREAD_T[1]);
    const cam = this.cam({ h: [[39.75, 0.5, 0.52, 1.08], [48.6, 0.56, 0.5, 1.16]], v: [[39.75, 0.3, 0.55, 1.0], [42, 0.32, 0.55, 1.0], [46.6, 0.78, 0.5, 1.04], [48.6, 0.8, 0.5, 1.06]] }, t);
    const tf = this.bg(ctx, 'intro_c6_bg', cam, (1 - ease(seg(t, 39.75, 40.6))) * 0.9);
    this.glow(ctx, tf, [0.05, 0.5], 0.22, t, 0.7);
    this.drawDust(ctx, t, 6, 0.6);
    // 손: 왼쪽 아래에서 미끄러져 들어옴
    const inK = easeOut(seg(t, 40.0, 41.4));
    const o = this.ori === 'v' ? { x: 0, y: 1, px: 0, py: 1, h: 0.27 } : { x: 0, y: 1, px: 0, py: 1, h: 0.55 };
    const im = cache.img.intro_c6_hand;
    let tip = null;
    if (im) {
      const unit = tf.ih * tf.s, hh = o.h * unit, ww = hh * im.width / im.height;
      o.dx = -ww * 0.5 * (1 - inK) - (cam.x - 0.3) * tf.iw * tf.s * 0.25 * (this.ori === 'v' ? 1 : 0);
      o.dy = hh * 0.35 * (1 - inK) + Math.sin(t * 1.6) * 2;
      const r = this.layer(ctx, 'intro_c6_hand', o, tf, 0);
      if (r) tip = [r.x + POS.c6hand.tip[0] * r.w, r.y + POS.c6hand.tip[1] * r.h];
    }
    if (!tip) return;
    // 바늘 끝 반짝
    const gl = Math.exp(-Math.pow((t - 41.4) * 3, 2));
    if (gl > 0.01) this.star(ctx, tip[0], tip[1], Math.min(this.W, this.H) * 0.09 * gl, gl);
    // 금빛 실: 바늘 끝에서 왕국 위로 뻗어 나감
    if (th > 0) {
      const pts = [tip, ...POS.c6.path.map(([x, y]) => this.w2s(tf, x, y))];
      this.thread(ctx, pts, easeOut(th) * 0.9 + th * 0.1, t);
    }
    // 마지막: 금빛이 화면을 채우며 제목으로
    const bloom = seg(t, 47.0, 48.4);
    if (bloom > 0) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createRadialGradient(this.W * 0.6, this.H * 0.45, 0, this.W * 0.6, this.H * 0.45, Math.hypot(this.W, this.H) * 0.7);
      g.addColorStop(0, `rgba(255,200,110,${0.55 * bloom})`); g.addColorStop(1, `rgba(120,70,20,${0.25 * bloom})`);
      ctx.fillStyle = g; ctx.fillRect(0, 0, this.W, this.H); ctx.restore();
    }
  }
  // 곡선 실: 점들을 부드럽게 잇고 k(0~1)만큼만 그림. 머리에 빛
  thread(ctx, pts, k, t) {
    const path = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
      for (let s = 0; s < 16; s++) {
        const u = s / 16, u2 = u * u, u3 = u2 * u;
        path.push([0.5 * ((2 * p1[0]) + (-p0[0] + p2[0]) * u + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * u2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * u3),
          0.5 * ((2 * p1[1]) + (-p0[1] + p2[1]) * u + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * u2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * u3)]);
      }
    }
    path.push(pts[pts.length - 1]);
    const n = Math.max(2, Math.floor(path.length * k));
    const lw = Math.max(1.5, Math.min(this.W, this.H) * 0.004);
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.globalCompositeOperation = 'lighter';
    for (const [w, c] of [[lw * 7, 'rgba(255,170,60,.12)'], [lw * 3, 'rgba(255,200,90,.35)'], [lw, 'rgba(255,240,190,.95)']]) {
      ctx.lineWidth = w; ctx.strokeStyle = c; ctx.beginPath();
      for (let i = 0; i < n; i++) i ? ctx.lineTo(path[i][0], path[i][1]) : ctx.moveTo(path[i][0], path[i][1]);
      ctx.stroke();
    }
    // 반짝이 가루
    const r = rnd(9);
    for (let i = 0; i < n; i += 3) {
      const tw = 0.5 + 0.5 * Math.sin(t * 8 + i);
      const age = (n - i) / path.length;
      if (r() > 0.55 || age > 0.5) continue;
      ctx.fillStyle = `rgba(255,230,160,${0.6 * tw * (1 - age * 2)})`;
      ctx.beginPath(); ctx.arc(path[i][0] + (r() - 0.5) * lw * 8, path[i][1] + (r() - 0.5) * lw * 8 - age * 30, lw * (0.6 + r()), 0, 6.283); ctx.fill();
    }
    const h = path[n - 1];
    if (k < 0.999) this.star(ctx, h[0], h[1], lw * 14, 0.9);
    ctx.restore();
  }
  star(ctx, x, y, r, a) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(255,250,225,${a})`); g.addColorStop(0.2, `rgba(255,210,120,${a * 0.6})`); g.addColorStop(1, 'rgba(255,160,60,0)');
    ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
    ctx.strokeStyle = `rgba(255,245,210,${a * 0.8})`; ctx.lineWidth = Math.max(1, r * 0.04);
    ctx.beginPath(); ctx.moveTo(x - r, y); ctx.lineTo(x + r, y); ctx.moveTo(x, y - r * 0.8); ctx.lineTo(x, y + r * 0.8); ctx.stroke();
    ctx.restore();
  }
  // 컷 7: 제목. 띠가 걷히고 금빛 실이 글자를 꿰맴
  cut7(ctx, t) {
    const cam = this.cam({ h: [[47.8, 0.5, 0.62, 1.12], [56, 0.5, 0.56, 1.04], [70, 0.5, 0.55, 1.0]], v: [[47.8, 0.5, 0.62, 1.1], [56, 0.5, 0.58, 1.02], [70, 0.5, 0.57, 1.0]] }, t);
    const tf = this.bg(ctx, 'intro_c7_bg', cam, (1 - ease(seg(t, 47.8, 49.2))) * 0.9);
    this.drawDust(ctx, t, 7, 0.8);
    // 제목 자리 어둡게(글자가 잘 보이게)
    const g = ctx.createLinearGradient(0, 0, 0, this.H * 0.55);
    g.addColorStop(0, 'rgba(8,6,12,.55)'); g.addColorStop(1, 'rgba(8,6,12,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, this.W, this.H * 0.55);
    this.title(ctx, t);
  }
  // 제목 꿰매기 진행(0~1)
  stitchK(t) {
    if (this.final) return 1;
    if (this.fast) return seg(this.now(), this.fast.at + 0.4, this.fast.at + 2.4);
    return seg(t, T_STITCH, T_STITCH_END);
  }
  pressK(t) {
    if (this.final) return this.finalPress ? 1 : 0;
    if (this.fast) return seg(this.now(), this.fast.at + 2.8, this.fast.at + 3.6);
    return seg(t, T_PRESS, T_PRESS + 0.9);
  }
  title(ctx, t) {
    const { W, H } = this;
    const k = this.stitchK(t);
    // 글자 배치: 가로는 한 줄, 좁은 세로는 두 줄. 글자 사이·낱말 사이를 조금 띄운다
    const layout = (str, f) => {
      ctx.font = `700 ${f}px "Cinzel Deco", serif`;
      const out = []; let x = 0;
      for (const ch of str) {
        if (ch === ' ') { x += ctx.measureText(' ').width + f * 0.22; continue; }
        const w = ctx.measureText(ch).width; out.push({ ch, x, w }); x += w + f * 0.03;
      }
      return { out, width: x - f * 0.03 };
    };
    let fs = Math.min(W * 0.085, H * 0.15);
    let lines = ['The Last Stitch'];
    if (this.ori === 'v' || layout(lines[0], fs).width > W * 0.88) { fs = Math.min(W * 0.15, H * 0.1); lines = ['The Last', 'Stitch']; }
    ctx.font = `700 ${fs}px "Cinzel Deco", serif`;
    const lh = fs * 1.12;
    const top = (this.ori === 'v' ? H * 0.2 : H * 0.17) + Math.max(0, (this.view.inset?.t || 0));
    const letters = [];
    lines.forEach((ln, li) => {
      const L = layout(ln, fs); const x0 = W / 2 - L.width / 2; const y = top + li * lh + fs * 0.5;
      for (const c of L.out) letters.push({ ch: c.ch, x: x0 + c.x, w: c.w, y, cx: x0 + c.x + c.w / 2 });
    });
    ctx.font = `700 ${fs}px "Cinzel Deco", serif`;
    const n = letters.length;
    // 바늘이 지나가는 길: 글자 아래위를 오가는 홈질
    const base = fs * 0.62;
    ctx.save();
    ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
    const head = k * n;           // 몇 번째 글자까지 왔나
    letters.forEach((L, i) => {
      const a = clamp(head - i, 0, 1);             // 바늘이 지나간 정도
      if (a <= 0) return;
      const fill = easeOut(clamp((head - i - 0.6) / 1.4, 0, 1));
      // 바느질 땀 테두리
      ctx.lineWidth = Math.max(1.2, fs * 0.028);
      ctx.setLineDash([fs * 0.07, fs * 0.05]); ctx.lineDashOffset = -i * fs * 0.03;
      ctx.strokeStyle = `rgba(255,226,150,${0.95 * a})`;
      ctx.shadowColor = 'rgba(255,170,60,.8)'; ctx.shadowBlur = fs * 0.18 * a;
      ctx.strokeText(L.ch, L.x, L.y);
      ctx.shadowBlur = 0; ctx.setLineDash([]);
      if (fill > 0) {
        const gr = ctx.createLinearGradient(0, L.y - fs * 0.5, 0, L.y + fs * 0.5);
        gr.addColorStop(0, `rgba(255,246,214,${fill})`); gr.addColorStop(0.45, `rgba(243,197,90,${fill})`); gr.addColorStop(1, `rgba(170,104,26,${fill})`);
        ctx.shadowColor = `rgba(0,0,0,${0.6 * fill})`; ctx.shadowBlur = fs * 0.12; ctx.shadowOffsetY = fs * 0.04;
        ctx.fillStyle = gr; ctx.fillText(L.ch, L.x, L.y);
        ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
        ctx.setLineDash([fs * 0.07, fs * 0.05]); ctx.lineWidth = Math.max(1, fs * 0.02);
        ctx.strokeStyle = `rgba(255,240,200,${0.55 * fill})`; ctx.strokeText(L.ch, L.x, L.y); ctx.setLineDash([]);
      }
    });
    // 아래 홈질 실(지나간 데까지)
    if (k > 0) {
      ctx.lineWidth = Math.max(1.4, fs * 0.03); ctx.lineCap = 'round';
      ctx.setLineDash([fs * 0.16, fs * 0.1]);
      ctx.strokeStyle = 'rgba(255,214,120,.9)'; ctx.shadowColor = 'rgba(255,170,60,.7)'; ctx.shadowBlur = fs * 0.15;
      lines.forEach((ln, li) => {
        const ls = letters.filter(L => L.y === top + li * lh + fs * 0.5); if (!ls.length) return;
        const x0 = ls[0].x - fs * 0.2, x1 = ls[ls.length - 1].x + ls[ls.length - 1].w + fs * 0.2;
        const idx0 = letters.indexOf(ls[0]);
        const p = clamp((head - idx0) / ls.length, 0, 1); if (p <= 0) return;
        const y = ls[0].y + base;
        ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(lerp(x0, x1, p), y); ctx.stroke();
      });
      ctx.setLineDash([]); ctx.shadowBlur = 0;
      // 바늘 머리
      if (k < 1) {
        const i = Math.min(n - 1, Math.floor(head)), L = letters[i], f = head - i;
        const hx = L.x + L.w * f, hy = L.y + base - Math.abs(Math.sin(f * Math.PI)) * fs * 0.9;
        ctx.strokeStyle = '#e6eaf0'; ctx.lineWidth = Math.max(1.5, fs * 0.035);
        ctx.beginPath(); ctx.moveTo(hx - fs * 0.12, hy + fs * 0.32); ctx.lineTo(hx + fs * 0.06, hy - fs * 0.18); ctx.stroke();
        this.star(ctx, hx + fs * 0.06, hy - fs * 0.18, fs * 0.5, 0.9);
      }
    }
    // 다 꿰맨 뒤: 빛이 글자 위를 한 번 지나감
    const sh = this.final ? 0 : this.fast ? seg(this.now(), this.fast.at + 2.4, this.fast.at + 3.6) : seg(t, T_STITCH_END, T_STITCH_END + 1.4);
    if (sh > 0 && sh < 1) {
      ctx.globalCompositeOperation = 'lighter';
      const x = lerp(W * 0.1, W * 0.9, sh);
      const gg = ctx.createLinearGradient(x - fs * 1.5, 0, x + fs * 1.5, 0);
      gg.addColorStop(0, 'rgba(255,230,160,0)'); gg.addColorStop(0.5, 'rgba(255,240,200,.35)'); gg.addColorStop(1, 'rgba(255,230,160,0)');
      ctx.fillStyle = gg; ctx.fillRect(x - fs * 1.5, top - fs * 0.2, fs * 3, lines.length * lh + fs * 0.3);
      ctx.globalCompositeOperation = 'source-over';
    }
    // 부제
    const sub = this.final ? 1 : this.fast ? seg(this.now(), this.fast.at + 2.2, this.fast.at + 3.2) : seg(t, T_STITCH_END + 0.2, T_STITCH_END + 1.4);
    if (sub > 0) {
      const ss = Math.max(13, fs * 0.22);
      ctx.font = `700 ${ss}px Batang, serif`; ctx.textAlign = 'center';
      ctx.fillStyle = `rgba(240,222,186,${0.92 * sub})`;
      ctx.shadowColor = 'rgba(0,0,0,.8)'; ctx.shadowBlur = 6;
      const sp = 'letterSpacing' in ctx;
      if (sp) ctx.letterSpacing = `${ss * 0.45}px`;
      ctx.fillText('마지막 한 땀', W / 2 + (sp ? ss * 0.22 : 0), top + (lines.length - 1) * lh + fs * 0.5 + base + ss * 1.7);
      if (sp) ctx.letterSpacing = '0px';
      ctx.shadowBlur = 0;
    }
    // 눌러서 시작
    const pk = this.pressK(t);
    if (pk > 0) {
      this.pressShown = true;
      const ps = clamp(Math.min(W, H) * 0.04, 15, 22);
      const y = H * (this.ori === 'v' ? 0.86 : 0.86) - (this.view.inset?.b || 0);
      ctx.font = `400 ${ps}px Batang, serif`; ctx.textAlign = 'center';
      const pulse = 0.55 + 0.45 * Math.sin(this.now() * 2.4);
      ctx.fillStyle = `rgba(250,236,206,${pk * pulse})`;
      ctx.shadowColor = 'rgba(0,0,0,.8)'; ctx.shadowBlur = 8;
      ctx.fillText('눌러서 시작', W / 2, y);
      ctx.shadowBlur = 0;
      ctx.strokeStyle = `rgba(243,197,90,${0.6 * pk * pulse})`; ctx.lineWidth = 1.2; ctx.setLineDash([6, 5]);
      ctx.beginPath(); ctx.moveTo(W / 2 - ps * 3.2, y + ps * 0.95); ctx.lineTo(W / 2 + ps * 3.2, y + ps * 0.95); ctx.stroke(); ctx.setLineDash([]);
    }
    ctx.restore();
  }

  // ── 빛·먼지 ──
  glow(ctx, tf, [fx, fy], size, t, a) {
    const [x, y] = this.w2s(tf, fx, fy);
    const r = size * tf.ih * tf.s * (1 + 0.05 * Math.sin(t * 11) + 0.04 * Math.sin(t * 17.3));
    const fl = a * (0.8 + 0.12 * Math.sin(t * 9.1) + 0.08 * Math.sin(t * 23.7));
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(255,170,80,${0.32 * fl})`); g.addColorStop(0.4, `rgba(255,120,40,${0.12 * fl})`); g.addColorStop(1, 'rgba(255,90,20,0)');
    ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
    ctx.restore();
  }
  flameGlow(ctx, x, y, r, t, a) {
    const fl = a * (0.85 + 0.1 * Math.sin(t * 13) + 0.06 * Math.sin(t * 29));
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(255,200,120,${0.45 * fl})`); g.addColorStop(0.3, `rgba(255,140,60,${0.16 * fl})`); g.addColorStop(1, 'rgba(255,100,30,0)');
    ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
    ctx.restore();
  }
  moonbeam(ctx, tf, from, to, t, a) {
    const [x0, y0] = this.w2s(tf, from[0], from[1]), [x1, y1] = this.w2s(tf, to[0], to[1]);
    const wid = tf.ih * tf.s * 0.16;
    const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy), nx = -dy / L, ny = dx / L;
    ctx.save(); ctx.globalCompositeOperation = 'screen';
    const g = ctx.createLinearGradient(x0, y0, x1, y1);
    const sh = 0.85 + 0.15 * Math.sin(t * 0.7);
    g.addColorStop(0, `rgba(150,180,255,${0.16 * a * sh})`); g.addColorStop(1, 'rgba(120,150,230,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(x0 + nx * wid * 0.3, y0 + ny * wid * 0.3); ctx.lineTo(x0 - nx * wid * 0.3, y0 - ny * wid * 0.3);
    ctx.lineTo(x1 - nx * wid * 1.4, y1 - ny * wid * 1.4); ctx.lineTo(x1 + nx * wid * 1.4, y1 + ny * wid * 1.4); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  glowWindows() {}
  drawDust(ctx, t, seed, a, speed = 1) {
    const { W, H } = this;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const tt = t * speed;
    for (const d of this.dust) {
      const x = ((d.x + tt * 0.006 * d.s + 0.02 * Math.sin(tt * 0.3 + d.p + seed)) % 1 + 1) % 1 * W;
      const y = ((d.y - tt * 0.004 * d.s + 0.015 * Math.cos(tt * 0.4 + d.p)) % 1 + 1) % 1 * H;
      const tw = 0.4 + 0.6 * Math.sin(tt * 1.3 + d.p * 3);
      const r = d.z * Math.min(W, H) * 0.0035;
      ctx.fillStyle = `rgba(255,236,200,${0.35 * a * tw * d.z})`;
      ctx.beginPath(); ctx.arc(x, y, r, 0, 6.283); ctx.fill();
    }
    ctx.restore();
  }

  // 맨 위: 처음 어둠에서 밝아짐, 비네트, 필름 결, 위아래 검은 띠, 자막
  drawOverlay(ctx, t) {
    const { W, H } = this;
    if (this.clock === 'fast' && this.fast && !this.fast.keepClock) { const k = seg(this.now(), this.fast.at, this.fast.at + 0.7); if (k < 1) { ctx.fillStyle = `rgba(0,0,0,${0.85 * (1 - k)})`; ctx.fillRect(0, 0, W, H); } }
    if (this.clock !== 'fast' && t < 1.6) { ctx.fillStyle = `rgba(0,0,0,${0.6 * (1 - ease(t / 1.6))})`; ctx.fillRect(0, 0, W, H); }
    const v = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.hypot(W, H) * 0.62);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.55)');
    ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
    // 필름 결
    ctx.save(); ctx.globalAlpha = 0.05; ctx.globalCompositeOperation = 'overlay';
    const p = ctx.createPattern(this.grain, 'repeat');
    const o = Math.floor(this.now() * 24) % 7;
    ctx.translate(o * 23, o * 17); ctx.fillStyle = p; ctx.fillRect(-200, -200, W + 400, H + 400);
    ctx.restore();
    // 검은 띠
    const raw = this.ori === 'h' ? (H - W / 2.39) / 2 : H * 0.11;
    const full = Math.max(raw, H * (this.ori === 'h' ? 0.085 : 0.11));
    const open = this.clock === 'fast' ? 1 : ease(seg(t, T_TITLE + 0.2, T_TITLE + 2.2));
    const bh = full * (1 - open);
    if (bh > 0.5) { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, bh); ctx.fillRect(0, H - bh, W, bh); }
    // 자막 (컷이 바뀌기 전에 사라짐)
    if (this.state === 'play') for (const [a, b, s] of CAPTIONS) {
      if (t < a || t > b) continue;
      const al = Math.min(seg(t, a, a + 0.6), 1 - seg(t, b - 0.6, b));
      const fs = clamp(Math.min(W, H) * 0.036, 14, 21);
      ctx.save(); ctx.font = `400 ${fs}px Batang, serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = `rgba(236,224,200,${0.92 * al})`;
      const lines = this.wrap(ctx, s, W * 0.86);
      const y0 = H - bh / 2 - (lines.length - 1) * fs * 0.75;
      lines.forEach((ln, i) => ctx.fillText(ln, W / 2, y0 + i * fs * 1.5));
      ctx.restore();
    }
  }
  wrap(ctx, s, maxW) {
    if (ctx.measureText(s).width <= maxW) return [s];
    // 문장부호 뒤에서 먼저 나눔
    const m = s.match(/^(.+?[.,]) (.+)$/);
    if (m && ctx.measureText(m[1]).width <= maxW && ctx.measureText(m[2]).width <= maxW) return [m[1], m[2]];
    const words = s.split(' '); const out = []; let cur = '';
    for (const w of words) { const nx = cur ? cur + ' ' + w : w; if (ctx.measureText(nx).width > maxW && cur) { out.push(cur); cur = w; } else cur = nx; }
    if (cur) out.push(cur); return out;
  }

  destroy() {
    this.alive = false;
    this.stopSounds();
    window.removeEventListener('pointerdown', this.onDown);
    window.removeEventListener('keydown', this.onKey);
    this.root.remove();
  }
}
// 미리 받아 두기(제목 화면 전에 불러 두고 싶을 때)
IntroScene.preload = () => Promise.all([...IMG_LIST.map(loadImg), loadSfx(), loadMusic()]);
// 시험용(자동 검사가 시간표를 읽음)
export const INTRO_TIMING = { CUT_T, CAPTIONS, T_TITLE, T_PRESS };

// 제목 화면만 그리기(인트로가 끝난 뒤 다른 장면이 같은 그림·같은 글자 자리 위에 단추를 띄울 때).
//   drawIntroTitle(app.view, t, { press })  — 매 프레임 부름. t: 인트로 onDone({ t })로 받은 값에서 이어서 늘리면 카메라가 이어짐.
//   다 꿰매진 제목 + 부제 + 먼지·비네트·필름 결. press: 「눌러서 시작」도 그릴지(기본 false).
let painter = null;
export function drawIntroTitle(view, t = 56, { press = false } = {}) {
  if (!painter) {
    painter = Object.create(IntroScene.prototype);
    painter.makeGrain(); painter.dust = makeDust();
    painter.clock = 'fast'; painter.fast = null; painter.final = true; painter.state = 'title';
    loadImg('intro_c7_bg');
    document.fonts?.load?.('700 40px "Cinzel Deco"').catch(() => {});
  }
  painter.view = view; painter.finalPress = press;
  const { ctx, dpr, W, H } = view;
  painter.W = W; painter.H = H; painter.ori = W < H ? 'v' : 'h';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  painter.cut7(ctx, Math.max(t, 50));
  painter.drawOverlay(ctx, Math.max(t, 50));
}
