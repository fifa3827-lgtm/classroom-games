// 이야기 장면: 장 사이 그림 + 글(한 글자씩) + 장인의 일기.  { frame(dt), resize(), destroy() }
//   new StoryScene(app, 'ch1_after', { onDone })   — 키는 data/story.js 의 SCENES 키
//   opts.pages: 키 대신 쪽 목록을 직접 줄 때,  opts.music: 'story'(기본) | null(음악 그대로)
// 세로 9:16 그림. 가로 화면에서는 가운데 두고 양옆은 같은 그림을 흐리게 늘려 채운다.
import { audio } from '../engine/audio.js';
import { SCENES, DIARY } from '../data/story.js';

const EXT = 'mp3';   // 소리는 mp3 한 벌(용량 줄이기 M5, 모든 브라우저가 재생)
const cache = { img: {}, blur: {}, sfx: {}, loading: {} };
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const ease = k => (k = clamp(k, 0, 1), k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);

export function loadStoryImg(name) {
  if (cache.img[name]) return Promise.resolve(cache.img[name]);
  return (cache.loading[name] ||= new Promise(res => {
    const im = new Image(); im.decoding = 'async';
    im.onload = () => { cache.img[name] = im; res(im); };
    im.onerror = () => { console.warn('장면 그림 못 읽음', name); res(null); };
    im.src = `assets/story/${name}.webp`;
  }));
}
function blurOf(name) {
  if (cache.blur[name]) return cache.blur[name];
  const im = cache.img[name]; if (!im) return null;
  const w = Math.round(im.width / 8), h = Math.round(im.height / 8);
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d');
  if ('filter' in x) { x.filter = 'blur(3px)'; x.drawImage(im, 0, 0, w, h); }
  else { const s = document.createElement('canvas'); s.width = w >> 2; s.height = h >> 2; s.getContext('2d').drawImage(im, 0, 0, s.width, s.height); x.drawImage(s, 0, 0, w, h); }
  return (cache.blur[name] = c);
}
export async function storySfx(name) {
  if (name in cache.sfx) return cache.sfx[name];
  cache.sfx[name] = null;
  if (!audio.ctx) return null;
  try {
    const ab = await (await fetch(`assets/intro/sfx/${name}.${EXT}`)).arrayBuffer();
    cache.sfx[name] = await new Promise((ok, no) => audio.ctx.decodeAudioData(ab, ok, no));
  } catch { console.warn('소리 못 읽음', name); }
  return cache.sfx[name];
}
export function playSfx(name, vol = 1, rate = 1) {
  const b = cache.sfx[name], ctx = audio.ctx;
  if (!b || !ctx || ctx.state !== 'running') return null;
  const s = ctx.createBufferSource(); s.buffer = b; s.playbackRate.value = rate;
  const g = ctx.createGain(); g.gain.value = vol; s.connect(g); g.connect(audio.sfxBus); s.start();
  return s;
}

const STYLE_ID = 'story-scene-style';
const CSS = `
.st-root{position:fixed;inset:0;z-index:20;font-family:'Batang','Noto Serif KR',serif}
#ui .st-root,#ui .st-root *,.st-root,.st-root *{pointer-events:none}
#ui .st-root .st-skip{pointer-events:auto}
.st-skip{position:absolute;top:calc(8px + var(--safe-t,0px));right:calc(8px + var(--safe-r,0px));pointer-events:auto!important;
  min-width:44px;min-height:44px;padding:0 14px;font-family:'Batang',serif;font-size:15px;letter-spacing:.14em;color:rgba(240,226,200,.85);
  background:none;border:0;text-shadow:0 1px 3px rgba(0,0,0,.9),0 0 10px rgba(0,0,0,.7);cursor:pointer;transition:opacity .4s}
.st-skip::after{content:'';display:block;height:1px;margin-top:3px;background:repeating-linear-gradient(90deg,rgba(243,197,90,.7) 0 6px,transparent 6px 10px)}
.st-skip:active{transform:scale(.96)}
.st-text{position:absolute;left:50%;transform:translateX(-50%);bottom:calc(26px + var(--safe-b,0px));width:min(640px,calc(100% - 40px));
  text-align:center;color:#f3e8d2;font-size:clamp(16px,2.3vmin + 6px,20px);line-height:1.8;letter-spacing:.01em;
  text-shadow:0 1px 2px rgba(0,0,0,.9),0 0 18px rgba(0,0,0,.7);min-height:5.4em;display:flex;flex-direction:column;justify-content:flex-end;transition:opacity .45s}
.st-text .st-line{white-space:pre-wrap;word-break:keep-all;text-wrap:balance}
.st-text .st-ch{opacity:0;transition:opacity .25s}
.st-text .st-ch.on{opacity:1}
.st-next{margin-top:10px;height:22px;font-size:clamp(14px,.8vmin + 9px,17px);letter-spacing:.2em;color:rgba(243,197,90,.9);opacity:0;transition:opacity .4s}
.st-next.on{opacity:1;animation:stblink 1.6s ease-in-out infinite}
@keyframes stblink{50%{opacity:.35}}
.st-dots{display:flex;gap:7px;justify-content:center;margin-bottom:12px}
.st-dots i{width:6px;height:6px;border-radius:50%;background:rgba(243,226,190,.28)}
.st-dots i.on{background:#f3c55a;box-shadow:0 0 6px rgba(243,197,90,.8)}
.st-diary{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:24px;background:rgba(6,4,3,.55);opacity:0;transition:opacity .5s}
.st-diary.on{opacity:1}
.st-page{position:relative;width:min(420px,88vw);max-height:78vh;padding:34px 30px 28px 42px;color:#3a2414;border-radius:3px;
  background:
   radial-gradient(ellipse at 30% 20%,rgba(255,255,255,.35),transparent 60%),
   radial-gradient(ellipse at 80% 90%,rgba(140,90,40,.22),transparent 55%),
   repeating-linear-gradient(transparent 0 31px,rgba(120,80,40,.13) 31px 32px),
   linear-gradient(160deg,#f6e7c6,#ead3a4 60%,#dcbd86);
  box-shadow:0 18px 50px rgba(0,0,0,.6),inset 0 0 40px rgba(120,70,20,.25);
  transform:perspective(900px) rotateX(70deg) translateY(40px) rotate(-1.2deg);transform-origin:50% 0;transition:transform .7s cubic-bezier(.2,.9,.25,1.1)}
.st-diary.on .st-page{transform:perspective(900px) rotateX(0) translateY(0) rotate(-1.2deg)}
.st-page::before{content:'';position:absolute;left:18px;top:14px;bottom:14px;border-left:2px dashed rgba(201,138,30,.8)}
.st-page h3{margin:0 0 4px;font-size:clamp(13px,.6vmin + 9px,16px);font-weight:700;letter-spacing:.3em;color:#8a5a2a}
.st-page .st-date{font-size:clamp(13px,.6vmin + 9px,16px);color:#7a5634;margin-bottom:14px}
.st-page p{margin:0;font-size:clamp(15px,1.6vmin + 9px,18px);line-height:2;word-break:keep-all}
.st-page .st-sign{margin-top:16px;text-align:right;font-size:clamp(13px,.6vmin + 9px,15px);color:#8a5a2a;letter-spacing:.2em}
.st-page .st-tap{margin-top:14px;text-align:center;font-size:clamp(13px,.6vmin + 9px,15px);letter-spacing:.2em;color:rgba(90,58,30,.8)}
`;

export class StoryScene {
  constructor(app, key, opts = {}) {
    if (typeof opts === 'function') opts = { onDone: opts };
    this.app = app; this.view = app.view; this.opts = opts; this.key = key;
    this.pages = opts.pages || SCENES[key] || [];
    this.alive = true; this.i = -1; this.t = 0; this.state = 'load';
    this.prev = null; this.fadeT = 1; this.outT = 0;
    if (!document.getElementById(STYLE_ID)) { const st = document.createElement('style'); st.id = STYLE_ID; st.textContent = CSS; document.head.appendChild(st); }
    this.root = document.createElement('div'); this.root.className = 'st-root';
    this.root.innerHTML = `<button class="st-skip">건너뛰기 ▸</button>
      <div class="st-text"><div class="st-dots"></div><div class="st-line"></div><div class="st-next">눌러서 넘기기 ▸</div></div>
      <div class="st-diary"><div class="st-page"><h3>장인의 일기</h3><div class="st-date"></div><p></p><div class="st-sign">— 스승님의 글씨</div><div class="st-tap">눌러서 덮기</div></div></div>`;
    (document.getElementById('ui') || document.body).appendChild(this.root);
    this.$ = s => this.root.querySelector(s);
    this.$('.st-skip').addEventListener('click', e => { e.stopPropagation(); this.end(); });
    if (opts.skippable === false) this.$('.st-skip').style.display = 'none';
    this.$('.st-dots').innerHTML = this.pages.length > 1 ? this.pages.map(() => '<i></i>').join('') : '';
    this.onDown = e => { if (e.target.closest?.('.st-skip')) return; this.tap(); };
    this.onKey = e => { if (['Enter', ' ', 'ArrowRight'].includes(e.key)) this.tap(); else if (e.key === 'Escape') this.end(); };
    window.addEventListener('pointerdown', this.onDown);
    window.addEventListener('keydown', this.onKey);
    if (opts.music !== null) audio.playMusic(opts.music || 'story', 1.5);
    this.resize();
    Promise.all([this.pages.length ? loadStoryImg(this.pages[0].img) : null, storySfx('st_page'), storySfx('st_unfold')]).then(() => {
      if (!this.alive || this.state === 'out' || !this.pages.length) return;
      this.pages.slice(1).forEach(p => loadStoryImg(p.img));
      this.go(0);
    });
    if (!this.pages.length) setTimeout(() => this.end(), 0);
  }
  go(i) {
    if (i >= this.pages.length) { this.end(); return; }
    if (this.i >= 0) { this.prev = { img: this.pages[this.i].img, t: this.t }; playSfx('st_page', 0.6); }
    this.i = i; this.t = 0; this.fadeT = 0; this.state = 'type';
    const p = this.pages[i];
    const line = this.$('.st-line');
    line.innerHTML = '';
    this.chars = [...p.text].map(ch => { const s = document.createElement('span'); s.className = 'st-ch'; s.textContent = ch; line.appendChild(s); return s; });
    this.shown = 0;
    this.$('.st-next').classList.remove('on');
    this.$('.st-dots').querySelectorAll('i').forEach((d, j) => d.classList.toggle('on', j === i));
    this.typeAt = 0.55;           // 그림이 바뀐 뒤 조금 있다가 글 시작
  }
  tap() {
    if (this.state === 'type') { this.showAll(); return; }
    if (this.state === 'wait') {
      const p = this.pages[this.i];
      if (p.diary && !this.diaryShown) { this.openDiary(p.diary); return; }
      this.go(this.i + 1); return;
    }
    if (this.state === 'diary' && this.t - this.diaryAt > 1.2) { this.closeDiary(); }
  }
  showAll() { for (const c of this.chars) c.classList.add('on'); this.shown = this.chars.length; this.state = 'wait'; this.waitAt = this.t; this.$('.st-next').classList.add('on'); }
  openDiary(n) {
    const d = DIARY[n]; if (!d) { this.go(this.i + 1); return; }
    this.diaryShown = true; this.state = 'diary'; this.diaryAt = this.t;
    this.$('.st-date').textContent = d.date; this.$('.st-page p').textContent = d.text;
    this.$('.st-diary').classList.add('on'); this.$('.st-text').style.opacity = '0';
    playSfx('st_unfold', 0.8);
  }
  closeDiary() {
    this.$('.st-diary').classList.remove('on'); this.$('.st-text').style.opacity = '';
    playSfx('st_page', 0.5, 0.9);
    this.diaryShown = false; this.state = 'closing';
    setTimeout(() => this.alive && this.state === 'closing' && this.go(this.i + 1), 380);
  }
  end() {
    if (this.state === 'out' || !this.alive) return;
    this.state = 'out'; this.outT = 0;
    this.$('.st-text').style.opacity = '0'; this.$('.st-diary').classList.remove('on'); this.$('.st-skip').style.opacity = '0';
  }
  resize() { this.view.resize(); }

  frame(dt) {
    if (!this.alive) return;
    this.t += dt; this.fadeT += dt;
    const { ctx, dpr, W, H } = this.view;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#0b0806'; ctx.fillRect(0, 0, W, H);
    if (this.i >= 0) this.drawPages(ctx, W, H);
    if (this.state === 'out') {
      this.outT += dt;
      ctx.fillStyle = `rgba(0,0,0,${clamp(this.outT / 0.7, 0, 1)})`; ctx.fillRect(0, 0, W, H);
      if (this.outT > 0.75 && !this.finished) { this.finished = true; this.opts.onDone?.(); }
    }
  }
  drawPages(ctx, W, H) {
    const fk = ease(this.fadeT / 0.8);
    if (this.prev && fk < 1) this.drawPage(ctx, this.prev.img, this.prev.t + this.t, 1);
    this.drawPage(ctx, this.pages[this.i].img, this.t, this.prev ? fk : ease(this.fadeT / 1.0));
    // 아래 글자 자리 어둡게
    const g = ctx.createLinearGradient(0, H * 0.55, 0, H);
    g.addColorStop(0, 'rgba(8,6,4,0)'); g.addColorStop(1, 'rgba(8,6,4,.88)');
    ctx.fillStyle = g; ctx.fillRect(0, H * 0.55, W, H * 0.45);
    // 한 글자씩
    if (this.state === 'type' && this.t > this.typeAt) {
      const want = Math.floor((this.t - this.typeAt) * 26);
      while (this.shown < Math.min(want, this.chars.length)) this.chars[this.shown++].classList.add('on');
      if (this.shown >= this.chars.length) { this.state = 'wait'; this.waitAt = this.t; setTimeout(() => this.alive && this.state === 'wait' && this.$('.st-next').classList.add('on'), 500); }
    }
  }
  // 세로 그림: 세로 화면은 거의 꽉 채우고, 가로 화면은 가운데 + 양옆 흐린 그림
  drawPage(ctx, name, t, a) { drawStoryImage(ctx, this.view, name, t, a); }
  destroy() {
    this.alive = false;
    window.removeEventListener('pointerdown', this.onDown);
    window.removeEventListener('keydown', this.onKey);
    this.root.remove();
  }
}

// 세로 장면 그림 한 장: 세로 화면은 거의 꽉 채우고, 가로 화면은 가운데 + 양옆은 같은 그림을 흐리게 늘려 채움.
// 돌려주는 값: 선명한 그림이 놓인 자리 {x, y, w, h}
export function drawStoryImage(ctx, view, name, t = 0, a = 1) {
  const im = cache.img[name]; if (!im) return null;
  const { W, H } = view;
  ctx.globalAlpha = a;
  const bl = blurOf(name);
  const cs = Math.max(W / im.width, H / im.height) * 1.08;
  if (bl) { ctx.drawImage(bl, W / 2 - im.width * cs / 2, H / 2 - im.height * cs / 2, im.width * cs, im.height * cs); ctx.fillStyle = `rgba(8,6,4,${0.45 * a})`; ctx.fillRect(0, 0, W, H); }
  const r = storyRect(view, im, t);
  ctx.drawImage(im, r.x, r.y, r.w, r.h);
  ctx.globalAlpha = 1;
  // 가장자리를 흐린 바탕에 부드럽게 녹임(어두운 테가 생기지 않게 약하게)
  if (r.x > 1) {
    const f = Math.min(r.w * 0.1, 70);
    for (const [x0, x1] of [[r.x, r.x + f], [r.x + r.w, r.x + r.w - f]]) {
      const g = ctx.createLinearGradient(x0, 0, x1, 0);
      g.addColorStop(0, `rgba(14,10,7,${0.4 * a})`); g.addColorStop(1, 'rgba(14,10,7,0)');
      ctx.fillStyle = g; ctx.fillRect(Math.min(x0, x1), 0, f, H);
    }
  }
  if (r.y > 1) {
    const f = Math.min(r.h * 0.06, 50);
    for (const [y0, y1] of [[r.y, r.y + f], [r.y + r.h, r.y + r.h - f]]) {
      const g = ctx.createLinearGradient(0, y0, 0, y1);
      g.addColorStop(0, `rgba(14,10,7,${0.5 * a})`); g.addColorStop(1, 'rgba(14,10,7,0)');
      ctx.fillStyle = g; ctx.fillRect(0, Math.min(y0, y1), W, f);
    }
  }
  return r;
}
export function storyRect(view, im, t = 0) {
  const { W, H } = view;
  const contain = Math.min(W / im.width, H / im.height), cover = Math.max(W / im.width, H / im.height);
  const s = (W < H ? Math.min(cover, contain * 1.14) : contain) * (1.02 + 0.04 * clamp(t / 12, 0, 1));
  const w = im.width * s, h = im.height * s;
  return { x: W / 2 - w / 2, y: H / 2 - h / 2 - h * 0.01 * clamp(t / 12, 0, 1), w, h };
}
// 흐린 그림만 깔기(끝 화면 바탕)
export function drawStoryBlur(ctx, view, name, a = 1) {
  const im = cache.img[name]; const bl = im && blurOf(name); if (!bl) return;
  const { W, H } = view; const cs = Math.max(W / im.width, H / im.height) * 1.08;
  ctx.globalAlpha = a; ctx.drawImage(bl, W / 2 - im.width * cs / 2, H / 2 - im.height * cs / 2, im.width * cs, im.height * cs); ctx.globalAlpha = 1;
}
