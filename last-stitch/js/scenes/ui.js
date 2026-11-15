// 화면들이 함께 쓰는 것: 요소 만들기, 설정 창, 배경 그림 깔기, 떠다니는 먼지
import { audio, vibrate } from '../engine/audio.js';

// 전체 화면 (웹킷 접두어 포함). 아이폰 사파리처럼 안 되는 기기에서는 단추를 숨긴다(홈 화면에 추가하면 꽉 참)
const DE = () => document.documentElement;
export const fsSupported = () => !!(DE().requestFullscreen || DE().webkitRequestFullscreen) && (document.fullscreenEnabled !== false || document.webkitFullscreenEnabled);
export const isFs = () => !!(document.fullscreenElement || document.webkitFullscreenElement);
export function toggleFs() {
  try {
    if (isFs()) (document.exitFullscreen || document.webkitExitFullscreen).call(document)?.catch?.(() => {});
    else (DE().requestFullscreen || DE().webkitRequestFullscreen).call(DE(), { navigationUI: 'hide' })?.catch?.(() => {});
  } catch {}
}
export const FS_ICON = {
  on: '<svg viewBox="0 0 24 24"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  off: '<svg viewBox="0 0 24 24"><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
};
// 둥근 전체 화면 단추 html (지원 안 하면 빈 글)
export const fsButtonHtml = () => fsSupported() ? `<button class="rbtn scr-fs" data-a="fs" aria-label="${isFs() ? '전체 화면 나가기' : '전체 화면'}" aria-pressed="${isFs()}">${isFs() ? FS_ICON.off : FS_ICON.on}</button>` : '';
// 화면에 있는 전체 화면 단추들의 모양을 지금 상태에 맞춤 (fullscreenchange 때 main.js 가 부름)
export function syncFsButtons() {
  const on = isFs();
  document.querySelectorAll('[data-a=fs]').forEach(b => {
    if (b.classList.contains('toggle')) b.classList.toggle('on', on);
    else b.innerHTML = on ? FS_ICON.off : FS_ICON.on;
    b.setAttribute('aria-pressed', on); if (!b.classList.contains('toggle')) b.setAttribute('aria-label', on ? '전체 화면 나가기' : '전체 화면');
  });
}

export const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };

// 설정 창: 음악·효과음 크기, 진동, 진행 지우기
export function openSettings(app, onClose, { inGame = false } = {}) {
  const S = app.settings;
  const m = el('div', 'modal');
  m.innerHTML = `<div class="box parch"><h2>설정</h2>
    <div class="row"><span>음악</span><input type="range" min="0" max="1" step="0.05" value="${S.music}" data-k="music" aria-label="음악 크기"></div>
    <div class="row"><span>효과음</span><input type="range" min="0" max="1" step="0.05" value="${S.sfx}" data-k="sfx" aria-label="효과음 크기"></div>
    <div class="row"><span>진동</span><button class="toggle ${S.vibe ? 'on' : ''}" aria-label="진동"></button></div>
    ${inGame ? '' : '<div class="row"><span>진행 지우기</span><button class="scr-danger" data-a="wipe">지우기</button></div>'}
    <div class="btns"><button class="btn" data-a="close">닫기</button></div></div>`;
  app.ui().append(m);
  m.querySelectorAll('input[type=range]').forEach(r => r.oninput = () => { S[r.dataset.k] = +r.value; audio.setVolume(r.dataset.k, +r.value); app.save(); });
  const tg = m.querySelector('.toggle');
  tg.onclick = () => { S.vibe = !S.vibe; tg.classList.toggle('on', S.vibe); app.save(); vibrate(20); };
  const wipe = m.querySelector('[data-a=wipe]');
  if (wipe) wipe.onclick = () => {
    audio.play('button');
    if (!wipe.dataset.sure) { wipe.dataset.sure = '1'; wipe.textContent = '정말 지울까요?'; return; }
    app.wipe(); wipe.textContent = '지웠어요'; wipe.disabled = true;
  };
  const close = () => { audio.play('button'); m.remove(); onClose?.(); };
  m.querySelector('[data-a=close]').onclick = close;
  m.addEventListener('pointerdown', e => { if (e.target === m) close(); });
  return m;
}

// 그림을 화면에 cover로 깔기 (천천히 숨쉬듯 움직임)
export function drawCover(ctx, img, W, H, t = 0, drift = 0.02) {
  if (!img) return;
  const z = 1 + drift + Math.sin(t * 0.12) * drift;
  const sc = Math.max(W / img.width, H / img.height) * z;
  const w = img.width * sc, h = img.height * sc;
  const ox = (W - w) / 2 + Math.sin(t * 0.07) * drift * W * 0.5, oy = (H - h) / 2 + Math.cos(t * 0.09) * drift * H * 0.3;
  ctx.drawImage(img, ox, oy, w, h);
}
export function vignette(ctx, W, H, a = 0.55, col = '12,8,4') {
  const g = ctx.createRadialGradient(W / 2, H * 0.55, Math.min(W, H) * 0.25, W / 2, H * 0.55, Math.max(W, H) * 0.8);
  g.addColorStop(0, `rgba(${col},0)`); g.addColorStop(1, `rgba(${col},${a})`);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}
// 촛불빛에 떠다니는 금빛 먼지
export class Motes {
  constructor(n = 46) { this.p = []; this.n = n; }
  draw(ctx, W, H, dt) {
    while (this.p.length < this.n) this.p.push({ x: Math.random() * W, y: H * (0.2 + Math.random() * 0.9), r: 0.8 + Math.random() * 2.2, vy: -(6 + Math.random() * 16), ph: Math.random() * 6, a: 0.25 + Math.random() * 0.55 });
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (const m of this.p) {
      m.y += m.vy * dt; m.ph += dt; m.x += Math.sin(m.ph * 0.8) * 8 * dt;
      if (m.y < -10) { m.y = H + 10; m.x = Math.random() * W; }
      const tw = 0.6 + 0.4 * Math.sin(m.ph * 2.3);
      ctx.fillStyle = `rgba(255,214,140,${m.a * tw})`;
      ctx.beginPath(); ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }
}
// 금빛 수놓은 별 3개 (지도·결과)
export const starsHtml = (n, cls = '') => `<span class="scr-stars ${cls}">${[0, 1, 2].map(i => `<img src="assets/ui/icon_star.webp" alt="" class="${i < n ? 'on' : ''}">`).join('')}</span>`;
