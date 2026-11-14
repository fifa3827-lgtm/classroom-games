// 엔딩: 붉은 손을 이긴 뒤 → 장면 end_1 → 내 손가락으로 마지막 한 땀 → 엔딩 곡 → end_2~4 → 끝 화면(기록·어려운 모드)
//   new EndingScene(app, { stats: { time: 초, stars, starsMax, thimbles }, onDone })
//   onDone: 끝 화면에서 「처음 화면으로」를 누르면 부름
import { audio } from '../engine/audio.js';
import { SCENES } from '../data/story.js';
import { StoryScene, loadStoryImg, storySfx, playSfx } from './story.js';

const HOLES = [[0.306, 0.496], [0.689, 0.496]];   // end_stitch 그림 안 두 바늘구멍(비율)
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const ease = k => (k = clamp(k, 0, 1), k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
const easeOut = k => 1 - Math.pow(1 - clamp(k, 0, 1), 3);

const STYLE_ID = 'ending-scene-style';
const CSS = `
.en-root{position:fixed;inset:0;z-index:20;pointer-events:none;font-family:'Batang',serif;color:#f3e8d2}
.en-hint{position:absolute;left:50%;transform:translateX(-50%);bottom:calc(40px + var(--safe-b,0px));width:min(560px,calc(100% - 40px));text-align:center;
  font-size:clamp(15px,2vmin + 6px,19px);line-height:1.7;text-shadow:0 1px 2px #000,0 0 16px rgba(0,0,0,.8);opacity:0;transition:opacity .6s}
.en-hint.on{opacity:1}
.en-end{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:calc(30px + var(--safe-t,0px)) 24px calc(30px + var(--safe-b,0px));
  text-align:center;opacity:0;transition:opacity 1.6s}
.en-end.on{opacity:1}
.en-end .en-t{font-family:'Cinzel Deco',serif;font-size:clamp(30px,7vmin,60px);color:#f3c55a;letter-spacing:.02em;
  background:linear-gradient(#fff4d2,#f3c55a 50%,#b5771f);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;filter:drop-shadow(0 3px 6px rgba(0,0,0,.7))}
.en-end .en-fin{font-size:clamp(18px,3vmin,24px);letter-spacing:.6em;padding-left:.6em;color:#eadbbd;margin-top:-4px}
.en-end .en-stitch{width:min(260px,60vw);height:2px;margin:6px 0 4px;background:repeating-linear-gradient(90deg,#f3c55a 0 14px,transparent 14px 22px);opacity:.85}
.en-end .en-rows{display:grid;grid-template-columns:auto auto;gap:6px 22px;font-size:clamp(15px,2vmin + 6px,18px);margin:4px 0}
.en-end .en-rows span:nth-child(odd){text-align:right;color:#cdb991}
.en-end .en-rows span:nth-child(even){text-align:left;color:#fff3da;font-weight:700}
.en-end .en-hard{max-width:420px;padding:12px 18px;border:1px dashed rgba(243,197,90,.6);border-radius:6px;background:rgba(40,20,10,.45);font-size:clamp(14px,1.8vmin + 6px,17px);line-height:1.7}
.en-end .en-hard b{color:#ffb38a}
.en-end button{pointer-events:auto;margin-top:10px;min-height:48px;padding:0 30px;border-radius:24px;font-family:'Batang',serif;font-size:17px;letter-spacing:.12em;
  color:#2a180c;background:linear-gradient(#ffe7a6,#e9b44c);box-shadow:0 4px 14px rgba(0,0,0,.5),inset 0 -2px 0 rgba(120,70,10,.4);cursor:pointer}
.en-end button:active{transform:scale(.97)}
`;

export class EndingScene {
  constructor(app, opts = {}) {
    this.app = app; this.view = app.view; this.opts = opts;
    this.alive = true; this.t = 0; this.phase = 'pre'; this.child = null;
    if (!document.getElementById(STYLE_ID)) { const st = document.createElement('style'); st.id = STYLE_ID; st.textContent = CSS; document.head.appendChild(st); }
    this.root = document.createElement('div'); this.root.className = 'en-root';
    this.root.innerHTML = `<div class="en-hint">두 바늘구멍을 손가락으로 이어<br>마지막 한 땀을 꿰매 주세요</div><div class="en-end"></div>`;
    (document.getElementById('ui') || document.body).appendChild(this.root);
    this.hint = this.root.querySelector('.en-hint');
    this.pts = Array.from({ length: 60 }, () => ({ x: Math.random(), y: Math.random(), s: 0.3 + Math.random(), p: Math.random() * 6.28 }));
    ['end_stitch', 'end_4'].forEach(n => loadStoryImg(n).then(im => { if (im) EndingScene.imgs[n] = im; })); storySfx('end_burst'); storySfx('in_stitch'); storySfx('in_glint');
    const pages = SCENES.ending;
    this.child = new StoryScene(app, null, { pages: [pages[0]], music: 'story', onDone: () => this.startStitch() });
    this.onDown = e => this.down(e); this.onMove = e => this.move(e); this.onUp = e => this.up(e);
  }
  startStitch() {
    if (!this.alive) return;
    this.child?.destroy(); this.child = null;
    this.phase = 'stitch'; this.t = 0; this.drag = null; this.doneAt = null; this.lastAct = 0;
    const cv = this.view.cv;
    cv.addEventListener('pointerdown', this.onDown); window.addEventListener('pointermove', this.onMove); window.addEventListener('pointerup', this.onUp); window.addEventListener('pointercancel', this.onUp);
    setTimeout(() => this.alive && this.phase === 'stitch' && this.hint.classList.add('on'), 700);
  }
  holeScreen() {
    const im = this.img('end_stitch'); if (!im) return null;
    const r = this.imgRect(im);
    return HOLES.map(([x, y]) => [r.x + x * r.w, r.y + y * r.h]);
  }
  imgRect(im) {
    const { W, H } = this.view;
    const contain = Math.min(W / im.width, H / im.height), cover = Math.max(W / im.width, H / im.height);
    const s = W < H ? Math.min(cover, contain * 1.14) : contain;
    const w = im.width * s, h = im.height * s;
    return { x: W / 2 - w / 2, y: H / 2 - h / 2, w, h };
  }
  pos(e) { const r = this.view.cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
  near(p, q) { return Math.hypot(p[0] - q[0], p[1] - q[1]) < Math.max(38, Math.min(this.view.W, this.view.H) * 0.07); }
  down(e) {
    if (this.phase !== 'stitch' || this.doneAt != null) return;
    const hs = this.holeScreen(); if (!hs) return;
    const p = this.pos(e);
    const from = this.near(p, hs[0]) ? 0 : this.near(p, hs[1]) ? 1 : -1;
    this.lastAct = this.t;
    if (from < 0) return;
    this.drag = { from, p, id: e.pointerId };
    playSfx('in_glint', 0.5, 1.2);
  }
  move(e) { if (this.drag && e.pointerId === this.drag.id) { this.drag.p = this.pos(e); this.lastAct = this.t; } }
  up(e) {
    if (!this.drag || e.pointerId !== this.drag.id) return;
    const hs = this.holeScreen(); const to = 1 - this.drag.from;
    if (hs && this.near(this.pos(e), hs[to])) this.success();
    else { this.snap = { p: this.drag.p, from: this.drag.from, t: this.t }; }
    this.drag = null;
  }
  success() {
    this.doneAt = this.t; this.hint.classList.remove('on');
    playSfx('in_stitch', 0.8); setTimeout(() => this.alive && playSfx('end_burst', 1), 180);
    audio.playMusic('ending', 2.5);
    setTimeout(() => this.startPost(), 2600);
  }
  startPost() {
    if (!this.alive || this.phase !== 'stitch') return;
    this.phase = 'post';
    const pages = SCENES.ending;
    this.child = new StoryScene(this.app, null, { pages: pages.slice(1), music: null, onDone: () => this.startEnd() });
  }
  startEnd() {
    if (!this.alive) return;
    this.child?.destroy(); this.child = null;
    this.phase = 'end'; this.t = 0;
    const s = this.opts.stats || {};
    const rows = [];
    if (s.time != null) { const m = Math.floor(s.time / 60), sec = Math.round(s.time % 60); rows.push(['걸린 시간', m >= 60 ? `${Math.floor(m / 60)}시간 ${m % 60}분` : `${m}분 ${sec}초`]); }
    if (s.stars != null) rows.push(['모은 별', s.starsMax ? `${s.stars} / ${s.starsMax}` : `${s.stars}`]);
    if (s.thimbles != null) rows.push(['모은 골무', `${s.thimbles}`]);
    const end = this.root.querySelector('.en-end');
    end.innerHTML = `<div class="en-t">The Last Stitch</div><div class="en-fin">끝</div><div class="en-stitch"></div>
      ${rows.length ? `<div class="en-rows">${rows.map(([a, b]) => `<span>${a}</span><span>${b}</span>`).join('')}</div>` : ''}
      <div class="en-hard"><b>어려운 모드</b>가 열렸어요.<br>${this.opts.hardText || '더 거세진 붉은 물감에 맞서 모든 왕국을 다시 지켜 보세요.'}</div>
      <button class="en-btn">처음 화면으로</button>`;
    end.querySelector('.en-btn').addEventListener('click', () => { if (!this.left) { this.left = true; this.opts.onDone?.(); } });
    requestAnimationFrame(() => end.classList.add('on'));
  }
  resize() { this.view.resize(); this.child?.resize(); }

  frame(dt) {
    if (!this.alive) return;
    this.t += dt;
    if (this.child) { this.child.frame(dt); return; }
    const { ctx, dpr, W, H } = this.view;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#0b0806'; ctx.fillRect(0, 0, W, H);
    if (this.phase === 'stitch') this.drawStitch(ctx, W, H);
    else if (this.phase === 'end') this.drawEnd(ctx, W, H);
  }
  drawImgPage(ctx, name, a = 1, dark = 0) {
    const im = this.img(name); if (!im) return null;
    const { W, H } = this.view;
    const cs = Math.max(W / im.width, H / im.height) * 1.08;
    ctx.globalAlpha = a;
    ctx.drawImage(im, W / 2 - im.width * cs / 2, H / 2 - im.height * cs / 2, im.width * cs, im.height * cs);
    ctx.fillStyle = 'rgba(8,6,4,.6)'; ctx.fillRect(0, 0, W, H);
    const r = this.imgRect(im);
    ctx.drawImage(im, r.x, r.y, r.w, r.h);
    if (dark) { ctx.fillStyle = `rgba(8,6,4,${dark})`; ctx.fillRect(0, 0, W, H); }
    ctx.globalAlpha = 1;
    return r;
  }
  img(name) { return EndingScene.imgs[name] || null; }
  drawStitch(ctx, W, H) {
    const fade = ease(this.t / 1.0);
    const r = this.drawImgPage(ctx, 'end_stitch', fade, 0.15);
    if (!r) return;
    const hs = HOLES.map(([x, y]) => [r.x + x * r.w, r.y + y * r.h]);
    const unit = Math.min(W, H);
    const lw = Math.max(3, unit * 0.012);
    ctx.save();
    // 구멍 빛(맥박)
    if (this.doneAt == null) hs.forEach(([x, y], i) => {
      const pu = 0.6 + 0.4 * Math.sin(this.t * 3 + i * 1.5);
      ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createRadialGradient(x, y, 0, x, y, unit * 0.07);
      g.addColorStop(0, `rgba(255,230,160,${0.7 * pu * fade})`); g.addColorStop(1, 'rgba(255,180,80,0)');
      ctx.fillStyle = g; ctx.fillRect(x - unit * 0.07, y - unit * 0.07, unit * 0.14, unit * 0.14);
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = `rgba(255,226,150,${0.8 * pu * fade})`; ctx.lineWidth = 1.5; ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.arc(x, y, unit * 0.035 + pu * 4, 0, 6.283); ctx.stroke(); ctx.setLineDash([]);
    });
    // 도움 손짓: 한동안 가만히 있으면 빛 점이 A→B로 지나감
    if (this.doneAt == null && !this.drag && this.t - this.lastAct > 5) {
      const k = ((this.t - this.lastAct - 5) % 2.4) / 1.6;
      if (k <= 1) {
        const x = hs[0][0] + (hs[1][0] - hs[0][0]) * ease(k), y = hs[0][1] + (hs[1][1] - hs[0][1]) * ease(k) - Math.sin(k * Math.PI) * unit * 0.03;
        ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(255,240,200,.7)';
        ctx.beginPath(); ctx.arc(x, y, unit * 0.02, 0, 6.283); ctx.fill(); ctx.globalCompositeOperation = 'source-over';
      }
    }
    // 끌고 있는 실
    const drawThread = (a, b, glow) => {
      const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2 + Math.hypot(b[0] - a[0], b[1] - a[1]) * 0.08;
      ctx.lineCap = 'round';
      for (const [w, c] of [[lw * 4, `rgba(255,170,60,${0.18 * glow})`], [lw * 1.8, 'rgba(201,138,30,.95)'], [lw, 'rgba(255,236,170,1)']]) {
        ctx.lineWidth = w; ctx.strokeStyle = c; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.quadraticCurveTo(mx, my, b[0], b[1]); ctx.stroke();
      }
    };
    if (this.drag) drawThread(hs[this.drag.from], this.drag.p, 1);
    else if (this.snap && this.t - this.snap.t < 0.35) {      // 놓치면 실이 되감김
      const k = easeOut((this.t - this.snap.t) / 0.35), a = hs[this.snap.from];
      drawThread(a, [this.snap.p[0] + (a[0] - this.snap.p[0]) * k, this.snap.p[1] + (a[1] - this.snap.p[1]) * k], 1 - k);
    }
    if (this.doneAt != null) {
      const k = this.t - this.doneAt;
      // 땀: 두 구멍 사이 도톰한 금실(조금 삐뚤게)
      const a = hs[0], b = hs[1];
      ctx.lineCap = 'round';
      for (const [w, c] of [[lw * 2.6, 'rgba(120,70,10,.6)'], [lw * 2, '#d99a2b'], [lw * 0.8, '#fff0c0']]) {
        ctx.lineWidth = w; ctx.strokeStyle = c; ctx.beginPath(); ctx.moveTo(a[0], a[1]);
        ctx.quadraticCurveTo((a[0] + b[0]) / 2, (a[1] + b[1]) / 2 - unit * 0.012, b[0], b[1]); ctx.stroke();
      }
      // 금빛 터짐
      ctx.globalCompositeOperation = 'lighter';
      const cx = (a[0] + b[0]) / 2, cy = (a[1] + b[1]) / 2, R = unit * (0.2 + k * 0.9);
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
      const al = Math.max(0, 1 - k / 2.2);
      g.addColorStop(0, `rgba(255,240,200,${0.75 * al})`); g.addColorStop(0.4, `rgba(255,190,90,${0.35 * al})`); g.addColorStop(1, 'rgba(255,150,40,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < 40; i++) {
        const an = i * 2.399, sp = unit * (0.15 + (i % 7) * 0.06) * easeOut(k / 1.6);
        const x = cx + Math.cos(an) * sp, y = cy + Math.sin(an) * sp - k * k * 10;
        ctx.fillStyle = `rgba(255,230,160,${al * 0.9})`; ctx.beginPath(); ctx.arc(x, y, lw * (0.5 + (i % 3) * 0.4), 0, 6.283); ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';
      if (k > 1.8) { ctx.fillStyle = `rgba(0,0,0,${clamp((k - 1.8) / 0.8, 0, 1)})`; ctx.fillRect(0, 0, W, H); }
    }
    ctx.restore();
  }
  drawEnd(ctx, W, H) {
    this.drawImgPage(ctx, 'end_4', ease(this.t / 2) * 0.55, 0.5);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (const p of this.pts) {
      const x = ((p.x + this.t * 0.004 * p.s) % 1) * W, y = ((p.y - this.t * 0.012 * p.s) % 1 + 1) % 1 * H;
      ctx.fillStyle = `rgba(255,214,140,${0.35 * (0.5 + 0.5 * Math.sin(this.t * 2 + p.p))})`;
      ctx.beginPath(); ctx.arc(x, y, 1 + p.s * 1.6, 0, 6.283); ctx.fill();
    }
    ctx.restore();
  }
  destroy() {
    this.alive = false;
    this.child?.destroy(); this.child = null;
    this.view.cv.removeEventListener('pointerdown', this.onDown);
    window.removeEventListener('pointermove', this.onMove); window.removeEventListener('pointerup', this.onUp); window.removeEventListener('pointercancel', this.onUp);
    this.root.remove();
  }
}
EndingScene.imgs = {};
