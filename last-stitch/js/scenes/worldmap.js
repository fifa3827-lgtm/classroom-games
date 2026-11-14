// 지도: 장(왕국)을 넘겨 보며 판을 고른다. 판마다 수틀 속 맵 미리보기 + 별, 금실로 이어진 길
import { IMG, loadImage } from '../engine/assets.js';
import { audio } from '../engine/audio.js';
import { MAPS } from '../data/maps.js';
import { CHAPTERS, LEVEL_TEXT } from '../data/story.js';
import { levelUnlocked, playable, thimblesFree } from '../engine/save.js';
import { el, openSettings, drawCover, vignette, Motes, starsHtml } from './ui.js';

const ICON = {
  back: '<svg viewBox="0 0 24 24"><path d="M15.5 4.5 8 12l7.5 7.5" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  next: '<svg viewBox="0 0 24 24"><path d="M8.5 4.5 16 12l-7.5 7.5" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  gear: '<svg viewBox="0 0 24 24"><path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Zm8.6 2.1-1.9-.4a6.9 6.9 0 0 0-.7-1.7l1.1-1.6-1.9-1.9-1.6 1.1a6.9 6.9 0 0 0-1.7-.7L13.5 3h-3l-.4 1.9a6.9 6.9 0 0 0-1.7.7L6.8 4.5 4.9 6.4 6 8a6.9 6.9 0 0 0-.7 1.7l-1.9.4v3l1.9.4c.2.6.4 1.2.7 1.7l-1.1 1.6 1.9 1.9 1.6-1.1c.5.3 1.1.5 1.7.7l.4 1.9h3l.4-1.9c.6-.2 1.2-.4 1.7-.7l1.6 1.1 1.9-1.9-1.1-1.6c.3-.5.5-1.1.7-1.7l1.9-.4v-3Z"/></svg>',
  lock: '<svg viewBox="0 0 24 24"><path d="M7 10V7.5a5 5 0 0 1 10 0V10" fill="none" stroke="#f3e3c3" stroke-width="2.4"/><rect x="5" y="10" width="14" height="10" rx="2.5" fill="#f3e3c3"/><circle cx="12" cy="15" r="1.8" fill="#4a2e1a"/></svg>',
};
// 수틀 자리 (가운데 영역 비율). 세로는 위→아래, 가로는 왼→오른 지그재그
const SPOTS = {
  v: { 4: [[0.3, 0.13], [0.7, 0.38], [0.3, 0.62], [0.7, 0.87]], 3: [[0.3, 0.17], [0.7, 0.5], [0.3, 0.83]] },
  h: { 4: [[0.13, 0.36], [0.38, 0.64], [0.62, 0.36], [0.87, 0.64]], 3: [[0.18, 0.38], [0.5, 0.62], [0.82, 0.38]] },
};
export const chapterOf = id => +id.split('-')[0];
const idsOf = ch => Object.keys(MAPS).filter(id => chapterOf(id) === ch).sort();

export class MapScene {
  constructor(app, opt = {}) {
    this.app = app; this.view = app.view; this.t = 0; this.alive = true;
    this.motes = new Motes(36);
    this.view.resize();
    this.ori = this.view.W < this.view.H ? 'v' : 'h';
    const d = app.data, P = playable();
    // 처음 보여 줄 장: 고른 판 → 아직 안 깬 첫 판 → 마지막 장
    const cur = P.find(l => levelUnlocked(d, l.id) && !d.stars[l.id]) || P.filter(l => levelUnlocked(d, l.id)).pop() || P[0];
    this.focus = opt.focus || cur?.id || '1-1';
    this.ch = chapterOf(this.focus);
    this.bgFade = 1; this.prevBg = null;
    audio.playMusic('title');
    audio.duck(false);
    this.build();
    this.showChapter(this.ch, true);
  }
  build() {
    const ui = this.ui = this.app.ui();
    ui.innerHTML = '';
    const root = this.root = el('div', 'scr-map');
    root.innerHTML = `
      <div class="scr-top">
        <button class="rbtn" data-a="back" aria-label="제목으로">${ICON.back}</button>
        <div class="scr-chap"><small></small><span></span></div>
        <button class="chip scr-thimble" data-a="tools" aria-label="장인의 공구함"><img src="assets/ui/icon_thimble.webp" alt=""><span class="v"></span></button>
        <button class="rbtn" data-a="settings" aria-label="설정">${ICON.gear}</button>
      </div>
      <div class="scr-levels"><svg class="scr-thread" aria-hidden="true"></svg></div>
      <button class="scr-arrow l" data-a="prev" aria-label="앞 장">${ICON.back}</button>
      <button class="scr-arrow r" data-a="next" aria-label="다음 장">${ICON.next}</button>
      <div class="scr-dots"></div>`;
    ui.append(root);
    this.levelsEl = root.querySelector('.scr-levels');
    const on = (a, fn) => { root.querySelector(`[data-a=${a}]`).onclick = () => { if (this.modal) return; audio.play('button'); fn(); }; };
    on('back', () => this.app.go('title', { quick: true }));
    on('tools', () => this.app.go('toolbox', { back: 'map', focus: this.focus }));
    on('settings', () => { this.closeSheet(); this.modal = openSettings(this.app, () => { this.modal = null; }); });
    on('prev', () => this.showChapter(this.ch - 1));
    on('next', () => this.showChapter(this.ch + 1));
    root.querySelector('.scr-thimble .v').textContent = thimblesFree(this.app.data);
    // 밀어서 장 넘기기
    this.levelsEl.addEventListener('pointerdown', e => { this.swipe = { x: e.clientX, y: e.clientY, id: e.pointerId }; });
    this.onUp = e => {
      const s = this.swipe; this.swipe = null;
      if (!s || s.id !== e.pointerId || this.modal) return;
      const dx = e.clientX - s.x, dy = e.clientY - s.y;
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.4) this.showChapter(this.ch + (dx < 0 ? 1 : -1));
    };
    window.addEventListener('pointerup', this.onUp);
  }
  showChapter(ch, first) {
    if (ch < 1 || ch > 5) return;
    if (!first) audio.play('whoosh', { vol: 0.4 });
    const old = this.ch; this.ch = ch;
    this.closeSheet();
    const C = CHAPTERS[ch];
    this.root.querySelector('.scr-chap small').textContent = C.sub;
    this.root.querySelector('.scr-chap span').textContent = C.name;
    this.root.querySelector('[data-a=prev]').style.visibility = ch > 1 ? '' : 'hidden';
    this.root.querySelector('[data-a=next]').style.visibility = ch < 5 ? '' : 'hidden';
    this.root.querySelector('.scr-dots').innerHTML = [1, 2, 3, 4, 5].map(i => `<i class="${i === ch ? 'on' : ''}"></i>`).join('');
    // 배경: 그 장 첫 판의 맵
    this.prevBg = this.bg; this.bgFade = first ? 1 : 0;
    this.bg = null;
    const key = `map_${ch}-1_${this.ori}`;
    loadImage(key, `assets/maps/${ch}-1_${this.ori}.webp`).then(im => { if (this.alive && this.ch === ch) this.bg = this.blurred(im); });
    this.layout(first ? 0 : Math.sign(ch - old));
  }
  blurred(im) {
    if (!im) return null;
    const c = document.createElement('canvas'), k = 0.5;
    c.width = Math.round(im.width * k); c.height = Math.round(im.height * k);
    const x = c.getContext('2d');
    try { x.filter = 'blur(3px) saturate(1.05)'; } catch {}
    x.drawImage(im, 0, 0, c.width, c.height);
    return c;
  }
  layout(dir = 0) {
    const L = this.levelsEl, d = this.app.data, ch = this.ch;
    L.querySelectorAll('.scr-node').forEach(n => n.remove());
    const ids = idsOf(ch), spots = SPOTS[this.ori][ids.length] || SPOTS[this.ori][4];
    const P = playable();
    const next = P.find(l => levelUnlocked(d, l.id) && !d.stars[l.id]);
    this.nodes = ids.map((id, i) => {
      const open = levelUnlocked(d, id), ready = P.some(l => l.id === id);
      const stars = d.stars[id] || 0;
      const n = el('button', 'scr-node' + (open ? '' : ' locked') + (next && next.id === id ? ' cur' : '') + (id === this.focus ? ' focus' : ''));
      n.style.left = (spots[i][0] * 100) + '%'; n.style.top = (spots[i][1] * 100) + '%';
      n.style.animationDelay = (i * 0.06) + 's';
      if (dir) n.style.setProperty('--from', (dir * 40) + 'px');
      const name = LEVEL_TEXT[id]?.name || '';
      n.innerHTML = `<span class="hoop"><img src="assets/maps/${id}_${this.ori}_m.webp" alt="" draggable="false">${open ? '' : `<span class="lk">${ICON.lock}</span>`}</span>
        <span class="nm"><b>${id}</b> ${name}</span>${open ? starsHtml(stars) : `<span class="soon">${ready ? '앞 판을 깨면 열려요' : '준비 중'}</span>`}`;
      n.setAttribute('aria-label', `${id} ${name}${open ? ` 별 ${stars}개` : ' 잠김'}`);
      n.onclick = () => { if (this.modal) return; audio.play('button'); open ? this.openSheet(id) : this.toast(ready ? '앞 판을 먼저 지켜야 열려요.' : '이 왕국은 아직 준비 중이에요.'); };
      L.append(n);
      return n;
    });
    requestAnimationFrame(() => this.drawThread());
  }
  // 수틀끼리 금실 바늘땀으로 잇기
  drawThread() {
    const svg = this.levelsEl.querySelector('.scr-thread');
    const r = this.levelsEl.getBoundingClientRect();
    svg.setAttribute('viewBox', `0 0 ${r.width} ${r.height}`);
    const pts = this.nodes.map(n => { const b = n.querySelector('.hoop').getBoundingClientRect(); return [b.left + b.width / 2 - r.left, b.top + b.height / 2 - r.top]; });
    let dpath = '';
    pts.forEach((p, i) => {
      if (!i) { dpath += `M${p[0]},${p[1]}`; return; }
      const q = pts[i - 1], mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2;
      dpath += this.ori === 'v' ? ` C${q[0]},${my} ${p[0]},${my} ${p[0]},${p[1]}` : ` C${mx},${q[1]} ${mx},${p[1]} ${p[0]},${p[1]}`;
    });
    const d = this.app.data, ids = idsOf(this.ch);
    const doneN = ids.filter(id => d.stars[id]).length;
    svg.innerHTML = `<path d="${dpath}" class="bg"/><path d="${dpath}" class="st"/>`;
    const st = svg.querySelector('.st'), len = st.getTotalLength?.() || 0;
    // 깬 판까지는 금실, 그 뒤는 흐린 점선
    const frac = ids.length > 1 ? Math.min(1, doneN / (ids.length - 1)) : 0;
    st.style.setProperty('--len', len); st.style.setProperty('--on', len * frac);
  }
  openSheet(id) {
    this.closeSheet();
    this.focus = id;
    this.nodes.forEach(n => n.classList.toggle('focus', n.querySelector('.nm b').textContent === id));
    const d = this.app.data, stars = d.stars[id] || 0, T = LEVEL_TEXT[id];
    const sh = this.sheet = el('div', 'scr-sheet parch');
    sh.innerHTML = `<div class="in"><div class="hd"><b>${id} · ${T?.name || ''}</b>${starsHtml(stars, 'sm')}</div>
      <p>${stars ? (stars === 3 ? '별 셋을 모두 받았어요. 다른 전략도 시험해 보세요.' : `별 ${stars}개. 생명을 지키면 별을 더 받아요.`) : '아직 지키지 못한 곳이에요.'}</p>
      <div class="btns row2"><button class="btn small ghost" data-a="x">닫기</button><button class="btn" data-a="go">출발</button></div></div>`;
    this.root.append(sh);
    sh.querySelector('[data-a=go]').onclick = () => { audio.play('button'); this.app.go('level', { id }); };
    sh.querySelector('[data-a=x]').onclick = () => { audio.play('button'); this.closeSheet(); };
  }
  closeSheet() { this.sheet?.remove(); this.sheet = null; }
  toast(text) {
    this.toastEl?.remove();
    const b = el('div', 'toast parch pass', text);
    b.style.top = '50%';
    this.toastEl = b; this.root.append(b);
    setTimeout(() => b.remove(), 2700);
  }
  resize() {
    this.view.resize();
    const o = this.view.W < this.view.H ? 'v' : 'h';
    if (o !== this.ori) { this.ori = o; this.showChapter(this.ch, true); }
    else this.drawThread();
  }
  frame(dt) {
    this.t += dt;
    const v = this.view, ctx = v.ctx, W = v.W, H = v.H;
    ctx.setTransform(v.dpr, 0, 0, v.dpr, 0, 0);
    ctx.fillStyle = '#1a120c'; ctx.fillRect(0, 0, W, H);
    this.bgFade = Math.min(1, this.bgFade + dt * 2.5);
    if (this.prevBg && this.bgFade < 1) drawCover(ctx, this.prevBg, W, H, this.t, 0.02);
    if (this.bg) { ctx.globalAlpha = this.bgFade; drawCover(ctx, this.bg, W, H, this.t, 0.02); ctx.globalAlpha = 1; }
    ctx.fillStyle = 'rgba(16,10,6,.38)'; ctx.fillRect(0, 0, W, H);
    vignette(ctx, W, H, 0.6);
    this.motes.draw(ctx, W, H, dt);
  }
  destroy() { this.alive = false; window.removeEventListener('pointerup', this.onUp); this.ui.innerHTML = ''; }
}
