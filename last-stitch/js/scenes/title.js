// 제목 화면: 인트로 끝 장면(drawIntroTitle — 밤 작업대·꿰매진 제목)을 그대로 이어 그리고, 그 위에 시작·공구함·설정 단추
import { audio } from '../engine/audio.js';
import { drawIntroTitle } from './intro.js';
import { el, openSettings } from './ui.js';

const GEAR = '<svg viewBox="0 0 24 24"><path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Zm8.6 2.1-1.9-.4a6.9 6.9 0 0 0-.7-1.7l1.1-1.6-1.9-1.9-1.6 1.1a6.9 6.9 0 0 0-1.7-.7L13.5 3h-3l-.4 1.9a6.9 6.9 0 0 0-1.7.7L6.8 4.5 4.9 6.4 6 8a6.9 6.9 0 0 0-.7 1.7l-1.9.4v3l1.9.4c.2.6.4 1.2.7 1.7l-1.1 1.6 1.9 1.9 1.6-1.1c.5.3 1.1.5 1.7.7l.4 1.9h3l.4-1.9c.6-.2 1.2-.4 1.7-.7l1.6 1.1 1.9-1.9-1.1-1.6c.3-.5.5-1.1.7-1.7l1.9-.4v-3Z"/></svg>';

export class TitleScene {
  constructor(app, opt = {}) {
    this.app = app; this.view = app.view; this.alive = true;
    this.t = opt.t ?? 56;          // 인트로에서 넘어오면 그 시각부터 이어서 (카메라가 끊기지 않음)
    this.view.resize();
    audio.playMusic('title');
    audio.duck(false);
    this.build(opt);
  }
  build(opt) {
    const ui = this.ui = this.app.ui();
    ui.innerHTML = '';
    const has = Object.keys(this.app.data.stars).length > 0;
    const box = this.box = el('div', 'scr-title');
    box.innerHTML = `<h1 class="vh">The Last Stitch · 마지막 한 땀</h1>
      <div class="scr-title-btns">
        <button class="btn" data-a="play">${has ? '이어하기' : '시작하기'}</button>
        <button class="btn small" data-a="tools"><img src="assets/ui/icon_thimble.webp" alt="">장인의 공구함</button>
        <div class="scr-title-row">
          <button class="rbtn" data-a="settings" aria-label="설정">${GEAR}</button>
          ${this.app.hasIntro ? '<button class="scr-link" data-a="intro">인트로 다시 보기</button>' : ''}
        </div>
      </div>`;
    ui.append(box);
    const go = (a, fn) => { const b = box.querySelector(`[data-a=${a}]`); if (b) b.onclick = () => { if (this.modal || !box.classList.contains('show')) return; audio.play('button'); fn(); }; };
    go('play', () => this.app.go('map'));
    go('tools', () => this.app.go('toolbox', { back: 'title' }));
    go('settings', () => { this.modal = openSettings(this.app, () => { this.modal = null; }); });
    go('intro', () => this.app.go('intro', { replay: true }));
    // 단추가 살며시 떠오름 (인트로에서 넘어오면 조금 빨리)
    setTimeout(() => this.alive && box.classList.add('show'), opt.quick ? 60 : 450);
  }
  resize() { this.view.resize(); }
  frame(dt) {
    this.t += dt;
    drawIntroTitle(this.view, this.t, { press: false });
  }
  destroy() { this.alive = false; this.ui.innerHTML = ''; }
}
