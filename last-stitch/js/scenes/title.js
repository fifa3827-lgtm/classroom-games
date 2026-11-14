// 제목 화면: 밤 작업대 그림 + 금실이 꿰매듯 나타나는 제목 + 시작·공구함·설정
import { IMG } from '../engine/assets.js';
import { audio } from '../engine/audio.js';
import { el, openSettings, drawCover, vignette, Motes } from './ui.js';

const TITLE = 'The Last Stitch';

export class TitleScene {
  constructor(app, opt = {}) {
    this.app = app; this.view = app.view; this.t = 0; this.alive = true;
    this.motes = new Motes(50);
    this.skipAnim = !!opt.quick;
    this.view.resize();
    audio.playMusic('title');
    audio.duck(false);
    this.build();
  }
  build() {
    const ui = this.ui = this.app.ui();
    ui.innerHTML = '';
    const d = this.app.data, has = Object.keys(d.stars).length > 0;
    const box = this.box = el('div', 'scr-title');
    box.innerHTML = `<div class="scr-title-sub" aria-hidden="true"></div>
      <h1 class="vh">The Last Stitch · 마지막 한 땀</h1>
      <div class="scr-title-btns">
        <button class="btn" data-a="play">${has ? '이어하기' : '시작하기'}</button>
        <button class="btn small" data-a="tools"><img src="assets/ui/icon_thimble.webp" alt="">장인의 공구함</button>
        <div class="scr-title-row">
          <button class="rbtn" data-a="settings" aria-label="설정"><svg viewBox="0 0 24 24"><path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Zm8.6 2.1-1.9-.4a6.9 6.9 0 0 0-.7-1.7l1.1-1.6-1.9-1.9-1.6 1.1a6.9 6.9 0 0 0-1.7-.7L13.5 3h-3l-.4 1.9a6.9 6.9 0 0 0-1.7.7L6.8 4.5 4.9 6.4 6 8a6.9 6.9 0 0 0-.7 1.7l-1.9.4v3l1.9.4c.2.6.4 1.2.7 1.7l-1.1 1.6 1.9 1.9 1.6-1.1c.5.3 1.1.5 1.7.7l.4 1.9h3l.4-1.9c.6-.2 1.2-.4 1.7-.7l1.6 1.1 1.9-1.9-1.1-1.6c.3-.5.5-1.1.7-1.7l1.9-.4v-3Z"/></svg></button>
          ${this.app.hasIntro ? '<button class="scr-link" data-a="intro">인트로 다시 보기</button>' : ''}
        </div>
      </div>`;
    ui.append(box);
    const go = (a, fn) => { const b = box.querySelector(`[data-a=${a}]`); if (b) b.onclick = () => { if (this.modal) return; audio.play('button'); fn(); }; };
    go('play', () => this.app.go('map'));
    go('tools', () => this.app.go('toolbox', { back: 'title' }));
    go('settings', () => { this.modal = openSettings(this.app, () => { this.modal = null; }); });
    go('intro', () => this.app.go('intro'));
    // 단추는 제목이 다 꿰매진 뒤 떠오름
    box.classList.toggle('show', this.skipAnim);
    if (!this.skipAnim) setTimeout(() => this.alive && box.classList.add('show'), 2300);
  }
  resize() { this.view.resize(); }
  frame(dt) {
    this.t += dt;
    const v = this.view, ctx = v.ctx, W = v.W, H = v.H;
    ctx.setTransform(v.dpr, 0, 0, v.dpr, 0, 0);
    ctx.fillStyle = '#120c08'; ctx.fillRect(0, 0, W, H);
    const img = IMG[W < H ? 'menu_v' : 'menu_h'];
    ctx.globalAlpha = Math.min(1, this.t / 1.2);
    drawCover(ctx, img, W, H, this.t, 0.025);
    ctx.globalAlpha = 1;
    // 위쪽을 어둡게 해 제목이 또렷하게
    const g = ctx.createLinearGradient(0, 0, 0, H * 0.55);
    g.addColorStop(0, 'rgba(10,6,4,.62)'); g.addColorStop(1, 'rgba(10,6,4,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H * 0.55);
    // 아래도 살짝 (단추 자리)
    const g2 = ctx.createLinearGradient(0, H * 0.62, 0, H);
    g2.addColorStop(0, 'rgba(10,6,4,0)'); g2.addColorStop(1, 'rgba(10,6,4,.55)');
    ctx.fillStyle = g2; ctx.fillRect(0, H * 0.62, W, H * 0.38);
    // 촛불 흔들림
    const fl = 0.06 + 0.03 * Math.sin(this.t * 7.3) + 0.02 * Math.sin(this.t * 13.1);
    ctx.fillStyle = `rgba(255,170,80,${fl})`; ctx.globalCompositeOperation = 'soft-light'; ctx.fillRect(0, 0, W, H); ctx.globalCompositeOperation = 'source-over';
    vignette(ctx, W, H, 0.5);
    this.motes.draw(ctx, W, H, dt);
    this.drawTitle(ctx, W, H);
  }
  // 금실로 꿰매듯: 점선 바늘땀이 먼저 지나가고, 뒤따라 금빛 글자가 채워진다
  drawTitle(ctx, W, H) {
    const land = W > H;
    const t = this.skipAnim ? 9 : this.t - 0.5;
    const cy = land ? H * 0.2 : H * 0.17;
    let fs = Math.min(land ? 88 : 72, W * 0.115);
    ctx.font = `700 ${fs}px "Cinzel Deco", "Cinzel", serif`;
    let tw = ctx.measureText(TITLE).width;
    if (tw > W * 0.9) { fs *= W * 0.9 / tw; ctx.font = `700 ${fs}px "Cinzel Deco", "Cinzel", serif`; tw = ctx.measureText(TITLE).width; }
    const x0 = (W - tw) / 2;
    const u = Math.max(0, Math.min(1, t / 1.8));            // 바늘이 지나간 비율
    const ease = 1 - Math.pow(1 - u, 2.2);
    const head = x0 - 20 + (tw + 40) * ease;
    ctx.save();
    ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
    // 1) 바늘땀 테두리
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, head, H); ctx.clip();
    ctx.setLineDash([fs * 0.09, fs * 0.07]); ctx.lineDashOffset = -this.t * 6;
    ctx.lineWidth = Math.max(1.5, fs * 0.035); ctx.strokeStyle = 'rgba(255,224,150,.95)';
    ctx.shadowColor = 'rgba(255,190,90,.8)'; ctx.shadowBlur = fs * 0.15;
    ctx.strokeText(TITLE, x0, cy);
    ctx.restore();
    // 2) 금빛 채움 (바늘보다 조금 늦게)
    const fillU = Math.max(0, Math.min(1, (t - 0.5) / 1.6));
    if (fillU > 0) {
      ctx.save(); ctx.beginPath(); ctx.rect(0, 0, x0 - 20 + (tw + 40) * fillU, H); ctx.clip();
      const gg = ctx.createLinearGradient(0, cy - fs * 0.5, 0, cy + fs * 0.5);
      gg.addColorStop(0, '#fff3c4'); gg.addColorStop(0.45, '#f3c55a'); gg.addColorStop(1, '#a8661a');
      ctx.shadowColor = 'rgba(0,0,0,.55)'; ctx.shadowBlur = fs * 0.12; ctx.shadowOffsetY = fs * 0.04;
      ctx.fillStyle = gg; ctx.fillText(TITLE, x0, cy);
      ctx.shadowColor = 'transparent';
      // 반짝임이 글자 위를 천천히 지나감
      const sh = ((this.t * 0.25) % 1.6) - 0.3;
      const sg = ctx.createLinearGradient(x0 + tw * sh - fs, 0, x0 + tw * sh + fs, 0);
      sg.addColorStop(0, 'rgba(255,255,255,0)'); sg.addColorStop(0.5, 'rgba(255,255,240,.55)'); sg.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.globalCompositeOperation = 'source-atop'; ctx.fillStyle = sg; ctx.fillText(TITLE, x0, cy);
      ctx.restore();
    }
    // 3) 바늘과 금실 (꿰매는 동안)
    if (u > 0 && u < 1) {
      const ny = cy + Math.sin(this.t * 22) * fs * 0.28;
      ctx.strokeStyle = 'rgba(255,214,120,.9)'; ctx.lineWidth = 2; ctx.setLineDash([]);
      ctx.beginPath(); ctx.moveTo(x0 - 30, cy + fs * 0.62); ctx.quadraticCurveTo((x0 + head) / 2, cy + fs * 0.9, head, ny); ctx.stroke();
      ctx.save(); ctx.translate(head, ny); ctx.rotate(-0.6);
      const ng = ctx.createLinearGradient(-fs * 0.5, 0, fs * 0.2, 0);
      ng.addColorStop(0, '#9aa4b0'); ng.addColorStop(0.6, '#f4f7fb'); ng.addColorStop(1, '#c8d0da');
      ctx.fillStyle = ng; ctx.beginPath(); ctx.moveTo(fs * 0.25, 0); ctx.lineTo(-fs * 0.45, -fs * 0.04); ctx.lineTo(-fs * 0.45, fs * 0.04); ctx.closePath(); ctx.fill();
      ctx.restore();
      ctx.globalCompositeOperation = 'lighter';
      const gl = ctx.createRadialGradient(head, ny, 0, head, ny, fs * 0.5);
      gl.addColorStop(0, 'rgba(255,230,160,.9)'); gl.addColorStop(1, 'rgba(255,200,100,0)');
      ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(head, ny, fs * 0.5, 0, Math.PI * 2); ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
    }
    // 4) 한국어 부제와 바늘땀 줄
    const su = Math.max(0, Math.min(1, (t - 1.6) / 0.8));
    if (su > 0) {
      const sfs = Math.max(15, fs * 0.3), sy = cy + fs * 0.78;
      ctx.globalAlpha = su; ctx.textAlign = 'center';
      ctx.font = `700 ${sfs}px "Batang", serif`;
      ctx.fillStyle = '#f6e6c4'; ctx.shadowColor = 'rgba(0,0,0,.7)'; ctx.shadowBlur = 8;
      ctx.fillText('마 지 막   한   땀', W / 2, sy);
      ctx.shadowBlur = 0;
      const lw = Math.min(tw * 0.62, W * 0.6) * su;
      ctx.setLineDash([8, 6]); ctx.strokeStyle = 'rgba(243,197,90,.85)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(W / 2 - lw / 2, sy + sfs * 0.95); ctx.lineTo(W / 2 + lw / 2, sy + sfs * 0.95); ctx.stroke();
      ctx.setLineDash([]); ctx.globalAlpha = 1;
    }
    ctx.restore();
  }
  destroy() { this.alive = false; this.ui.innerHTML = ''; }
}
