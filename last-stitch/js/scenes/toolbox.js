// 장인의 공구함: 골무로 영구 강화를 산다. 언제든 되돌려 다시 나눌 수 있다
import { IMG } from '../engine/assets.js';
import { audio, vibrate } from '../engine/audio.js';
import { TOWERS, TOWER_ORDER_ALL, SKILLS } from '../data/towers.js';
import { TOOL_NODES, nodeLv, nextCost, buyNode, resetTools, thimblesFree, thimblesEarned, thimblesSpent, playable, levelUnlocked } from '../engine/save.js';
import { el, drawCover, vignette, Motes } from './ui.js';

const TABS = [['tower', '탑'], ['thread', '실'], ['skill', '손 기술']];

export class ToolboxScene {
  constructor(app, opt = {}) {
    this.app = app; this.view = app.view; this.t = 0; this.opt = opt;
    this.motes = new Motes(30);
    this.tab = opt.tab || 'tower';
    this.view.resize();
    audio.playMusic('title');
    this.build();
  }
  // 아직 만나지 않은 탑(그 장 첫 판이 안 열림)은 잠금
  towerOpen(type) {
    const ch = TOWERS[type].ch, d = this.app.data;
    return ch <= 1 || playable().some(l => l.chapter >= ch && levelUnlocked(d, l.id));
  }
  build() {
    const ui = this.ui = this.app.ui();
    ui.innerHTML = '';
    const root = this.root = el('div', 'scr-tools');
    root.innerHTML = `
      <div class="scr-top">
        <button class="rbtn" data-a="back" aria-label="뒤로"><svg viewBox="0 0 24 24"><path d="M15.5 4.5 8 12l7.5 7.5" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
        <div class="scr-chap"><small>골무로 사는 영구 강화</small><span>장인의 공구함</span></div>
        <div class="chip scr-thimble"><img src="assets/ui/icon_thimble.webp" alt=""><span class="v"></span></div>
      </div>
      <div class="scr-tabs" role="tablist">${TABS.map(([k, n]) => `<button role="tab" data-t="${k}">${n}</button>`).join('')}</div>
      <div class="scr-panel parch"><div class="scr-list"></div></div>
      <div class="scr-foot"><span class="info"></span><button class="btn small" data-a="reset">되돌려 다시 나누기</button></div>`;
    ui.append(root);
    root.querySelector('[data-a=back]').onclick = () => { audio.play('button'); this.app.go(this.opt.back || 'map', { focus: this.opt.focus, quick: true }); };
    root.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { audio.play('button', { rate: 1.1 }); this.tab = b.dataset.t; this.render(); });
    const rs = root.querySelector('[data-a=reset]');
    rs.onclick = () => {
      audio.play('button');
      if (!thimblesSpent(this.app.data)) return this.flash('아직 쓴 골무가 없어요.');
      if (!rs.dataset.sure) { rs.dataset.sure = '1'; rs.textContent = '정말 되돌릴까요?'; return; }
      delete rs.dataset.sure; rs.textContent = '되돌려 다시 나누기';
      const n = resetTools(this.app.data); this.app.save();
      audio.play('coin'); this.flash(`골무 ${n}개를 돌려받았어요.`); this.render();
    };
    this.render();
  }
  flash(text) {
    const f = this.root.querySelector('.scr-foot .info');
    f.textContent = text; f.classList.remove('pop'); void f.offsetWidth; f.classList.add('pop');
  }
  render() {
    const d = this.app.data, free = thimblesFree(d);
    this.root.querySelector('.scr-thimble .v').textContent = `${free} / ${thimblesEarned(d)}`;
    this.root.querySelectorAll('[data-t]').forEach(b => { b.classList.toggle('on', b.dataset.t === this.tab); b.setAttribute('aria-selected', b.dataset.t === this.tab); });
    const list = this.root.querySelector('.scr-list');
    list.innerHTML = '';
    if (!thimblesEarned(d)) list.append(el('p', 'scr-hint', '판을 지키면 받은 별만큼 골무가 생겨요. 골무로 여기서 탑·실·손 기술을 영구히 강화합니다.'));
    if (this.tab === 'tower') {
      for (const type of TOWER_ORDER_ALL) {
        const open = this.towerOpen(type);
        const row = el('div', 'scr-trow' + (open ? '' : ' locked'));
        row.innerHTML = `<img class="tw" src="assets/towers/${type}_1.webp" alt=""><div class="tn"><b>${TOWERS[type].name}${open ? '' : `<small>${TOWERS[type].ch}장에서 만나요</small>`}</b><div class="nodes"></div></div>`;
        const box = row.querySelector('.nodes');
        for (const n of TOOL_NODES.filter(n => n.tower === type)) box.append(this.nodeBtn(n, open, free));
        list.append(row);
      }
    } else {
      for (const n of TOOL_NODES.filter(n => n.group === this.tab)) {
        const row = el('div', 'scr-trow wide');
        const lv = nodeLv(d, n.id);
        const extra = n.group === 'skill' ? `<small>${SKILLS[n.id].desc}</small>` : '';
        row.innerHTML = `<img class="tw ic" src="assets/ui/${n.icon}.webp" alt=""><div class="tn"><b>${n.name}</b><small>${n.desc}</small>${extra}
          <span class="pips">${n.cost.map((_, i) => `<i class="${i < lv ? 'on' : ''}"></i>`).join('')}</span></div><div class="nodes"></div>`;
        row.querySelector('.nodes').append(this.nodeBtn(n, true, free, true));
        list.append(row);
      }
    }
  }
  nodeBtn(n, open, free, big) {
    const d = this.app.data, lv = nodeLv(d, n.id), c = nextCost(d, n), max = !c;
    const b = el('button', 'scr-nodebtn' + (max ? ' own' : c > free || !open ? ' poor' : '') + (big ? ' big' : ''));
    b.innerHTML = big ? (max ? '<span class="ok">✓</span><small>다 올림</small>' : `<small>올리기</small><span class="c"><img src="assets/ui/icon_thimble.webp" alt="">${c}</span>`)
      : `<small>${n.name}</small>${max ? '<span class="ok">✓</span>' : `<span class="c"><img src="assets/ui/icon_thimble.webp" alt="">${c}</span>`}`;
    b.title = n.desc;
    b.setAttribute('aria-label', `${n.name}: ${n.desc}${max ? ' (샀음)' : ` 골무 ${c}개`}`);
    b.onclick = () => {
      if (max) { audio.play('button'); return this.flash(n.desc); }
      if (!open) { audio.play('button'); return this.flash('아직 만나지 않은 탑이에요.'); }
      if (!buyNode(d, n)) { audio.play('button', { rate: 0.8 }); b.animate([{ transform: 'translateX(-4px)' }, { transform: 'translateX(4px)' }, { transform: 'none' }], { duration: 200 }); return this.flash(`골무가 ${c - free}개 모자라요.`); }
      this.app.save(); audio.play('tower_upgrade'); vibrate(15);
      this.flash(`${n.desc}${lv + 1 < n.cost.length ? ` (${lv + 1}/${n.cost.length})` : ''}`);
      this.render();
    };
    return b;
  }
  resize() { this.view.resize(); }
  frame(dt) {
    this.t += dt;
    const v = this.view, ctx = v.ctx, W = v.W, H = v.H;
    ctx.setTransform(v.dpr, 0, 0, v.dpr, 0, 0);
    ctx.fillStyle = '#160f0a'; ctx.fillRect(0, 0, W, H);
    const img = IMG[W < H ? 'menu_v' : 'menu_h'];
    if (img) { ctx.globalAlpha = 0.55; drawCover(ctx, img, W, H, this.t, 0.015); ctx.globalAlpha = 1; }
    vignette(ctx, W, H, 0.7);
    this.motes.draw(ctx, W, H, dt);
  }
  destroy() { this.ui.innerHTML = ''; }
}
