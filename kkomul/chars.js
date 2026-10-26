/* 꼬물이 친구들 — 작고 동글동글한 우리 캐릭터 (코드 그림, 그림 파일 없음)
   쓰는 법: <script src="chars.js"></script> 뒤에
     drawChar(ctx, 'mongsil', x, y, size, { mood, squish, t, look, num, flip })
   - x, y : 발바닥 가운데(땅에 닿는 점)
   - size : 몸 너비(px)
   - mood : 'normal' | 'happy' | 'wow' | 'sad' | 'dizzy'
   - squish: -0.4~0.4 (+면 납작하게 눌림, -면 길쭉하게 늘어남) — 통통 튀는 손맛용
   - t    : 초 단위 시간(눈 깜빡임·흔들림)
   - look : -1~1 눈동자 방향(왼쪽~오른쪽)
   - num  : 배에 붙일 숫자(없으면 안 그림)
   - flip : true면 좌우 뒤집기
   CHAR_IDS: 친구 이름 목록, CHARS[id].name: 한글 이름 */
(function(){
'use strict';
const LINE = '#3d3030';
const CHARS = {
  mongsil: { name: '몽실', body: '#fffdf8', shade: '#efe6dc', deco: 'sprout' },
  kongi:   { name: '콩이', body: '#fff1a8', shade: '#f2dc7a', deco: 'tuft' },
  bori:    { name: '보리', body: '#e9c39b', shade: '#d6a87c', deco: 'bear' },
  tori:    { name: '토리', body: '#ffd3dc', shade: '#f4b5c3', deco: 'bunny' },
  haneul:  { name: '하늘', body: '#c9e8ff', shade: '#a5d2f5', deco: 'puff' },
  ssuki:   { name: '쑥이', body: '#c8efc4', shade: '#a4dc9f', deco: 'frog' },
  nabi:    { name: '나비', body: '#e3d6ff', shade: '#c9b6f5', deco: 'cat' },
  bamtol:  { name: '밤톨', body: '#d9a37a', shade: '#bf865c', deco: 'chestnut' }
};
const CHAR_IDS = Object.keys(CHARS);

function ell(ctx, x, y, rx, ry, rot){ ctx.beginPath(); ctx.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot || 0, 0, Math.PI * 2); }
function fillStroke(ctx, fill, lw){ ctx.fillStyle = fill; ctx.fill(); ctx.lineWidth = lw; ctx.strokeStyle = LINE; ctx.stroke(); }

function drawChar(ctx, id, x, y, size, o){
  o = o || {};
  const c = CHARS[id] || CHARS.mongsil;
  const mood = o.mood || 'normal', t = o.t || 0, sq = Math.max(-0.4, Math.min(0.4, o.squish || 0));
  const look = Math.max(-1, Math.min(1, o.look || 0));
  const lw = Math.max(1.5, size * 0.04);
  const w = size * (1 + sq * 0.35), h = size * 0.86 * (1 - sq * 0.5);
  const cx = 0, cy = -h / 2 - size * 0.05;          // 몸 가운데(발 위)
  ctx.save();
  ctx.translate(x, y);
  if (o.flip) ctx.scale(-1, 1);
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';

  // 그림자
  ctx.fillStyle = 'rgba(0,0,0,.12)'; ell(ctx, 0, 0, w * 0.42, size * 0.06); ctx.fill();
  // 발
  const fw = size * 0.13, fh = size * 0.08;
  ell(ctx, -w * 0.2, -fh * 0.6, fw, fh); fillStroke(ctx, c.body, lw);
  ell(ctx, w * 0.2, -fh * 0.6, fw, fh); fillStroke(ctx, c.body, lw);

  // 몸 뒤 장식(귀 등)
  const top = cy - h / 2;
  if (c.deco === 'bear'){
    for (const s of [-1, 1]){ ell(ctx, s * w * 0.3, top + h * 0.1, size * 0.13, size * 0.13); fillStroke(ctx, c.body, lw);
      ell(ctx, s * w * 0.3, top + h * 0.1, size * 0.06, size * 0.06); ctx.fillStyle = c.shade; ctx.fill(); }
  } else if (c.deco === 'bunny'){
    const flop = Math.sin(t * 3) * 0.08;
    for (const s of [-1, 1]){ ell(ctx, s * w * 0.42, top + h * 0.22, size * 0.09, size * 0.2, s * (1.0 + flop)); fillStroke(ctx, c.body, lw); }
  } else if (c.deco === 'cat'){
    for (const s of [-1, 1]){
      ctx.beginPath(); ctx.moveTo(s * w * 0.12, top + h * 0.08); ctx.lineTo(s * w * 0.33, top - size * 0.12); ctx.lineTo(s * w * 0.42, top + h * 0.2); ctx.closePath();
      fillStroke(ctx, c.body, lw);
    }
  } else if (c.deco === 'frog'){
    for (const s of [-1, 1]){ ell(ctx, s * w * 0.22, top + h * 0.06, size * 0.13, size * 0.12); fillStroke(ctx, c.body, lw); }
  }

  // 몸
  ell(ctx, cx, cy, w / 2, h / 2); fillStroke(ctx, c.body, lw);
  // 배 쪽 그늘
  ctx.save(); ell(ctx, cx, cy, w / 2 - lw / 2, h / 2 - lw / 2); ctx.clip();
  ctx.fillStyle = c.shade; ctx.globalAlpha = 0.45; ell(ctx, cx, cy + h * 0.42, w * 0.55, h * 0.22); ctx.fill(); ctx.globalAlpha = 1;
  ctx.fillStyle = 'rgba(255,255,255,.55)'; ell(ctx, cx - w * 0.2, cy - h * 0.28, w * 0.1, h * 0.06, -0.5); ctx.fill();
  ctx.restore();

  // 몸 위 장식
  if (c.deco === 'sprout'){
    const sw = Math.sin(t * 2.5) * 0.15;
    ctx.beginPath(); ctx.moveTo(0, top + lw); ctx.quadraticCurveTo(size * 0.02, top - size * 0.1, 0, top - size * 0.14); ctx.lineWidth = lw; ctx.strokeStyle = LINE; ctx.stroke();
    ell(ctx, -size * 0.08, top - size * 0.16, size * 0.09, size * 0.045, -0.5 + sw); fillStroke(ctx, '#9be08a', lw * 0.8);
    ell(ctx, size * 0.08, top - size * 0.16, size * 0.09, size * 0.045, 0.5 + sw); fillStroke(ctx, '#9be08a', lw * 0.8);
  } else if (c.deco === 'tuft'){
    ctx.lineWidth = lw; ctx.strokeStyle = LINE;
    for (const a of [-0.35, 0, 0.35]){ ctx.beginPath(); ctx.moveTo(a * size * 0.12, top + lw); ctx.quadraticCurveTo(a * size * 0.3, top - size * 0.1, a * size * 0.45 + size * 0.03, top - size * 0.09); ctx.stroke(); }
  } else if (c.deco === 'puff'){
    for (const [dx, r] of [[-0.09, 0.07], [0.02, 0.09], [0.12, 0.06]]){ ell(ctx, dx * size, top - size * 0.02, r * size, r * size * 0.85); fillStroke(ctx, '#ffffff', lw * 0.8); }
  } else if (c.deco === 'chestnut'){
    ctx.beginPath(); ctx.moveTo(-size * 0.12, top + size * 0.05); ctx.quadraticCurveTo(0, top - size * 0.2, size * 0.12, top + size * 0.05); ctx.closePath(); fillStroke(ctx, '#8a5a3c', lw);
  }

  // 팔(작은 동그라미)
  const armUp = mood === 'happy' || mood === 'wow' ? -h * 0.18 + Math.sin(t * 12) * size * 0.03 : 0;
  ell(ctx, -w * 0.47, cy + h * 0.12 + armUp, size * 0.075, size * 0.065); fillStroke(ctx, c.body, lw);
  ell(ctx, w * 0.47, cy + h * 0.12 + armUp, size * 0.075, size * 0.065); fillStroke(ctx, c.body, lw);

  // 얼굴
  const ey = cy - h * 0.04, ex = size * 0.17, lx = look * size * 0.025;
  const blink = mood === 'normal' && (t % 3.3) < 0.12;
  ctx.fillStyle = LINE; ctx.strokeStyle = LINE; ctx.lineWidth = lw;
  for (const s of [-1, 1]){
    const px = s * ex + lx;
    if (mood === 'happy'){
      ctx.beginPath(); ctx.arc(px, ey + size * 0.02, size * 0.045, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
    } else if (mood === 'dizzy'){
      ctx.beginPath(); const r = size * 0.04;
      ctx.moveTo(px - r, ey - r); ctx.lineTo(px + r, ey + r); ctx.moveTo(px + r, ey - r); ctx.lineTo(px - r, ey + r); ctx.stroke();
    } else if (blink){
      ctx.beginPath(); ctx.moveTo(px - size * 0.04, ey); ctx.lineTo(px + size * 0.04, ey); ctx.stroke();
    } else {
      const big = mood === 'wow' ? 1.35 : 1;
      ell(ctx, px, ey, size * 0.042 * big, size * 0.058 * big); ctx.fillStyle = LINE; ctx.fill();
      ctx.fillStyle = '#fff'; ell(ctx, px + size * 0.012, ey - size * 0.02 * big, size * 0.015 * big, size * 0.015 * big); ctx.fill();
      if (mood === 'wow'){ ell(ctx, px - size * 0.014, ey + size * 0.022, size * 0.008, size * 0.008); ctx.fill(); }
      ctx.fillStyle = LINE;
    }
    if (mood === 'sad'){ // 처진 눈썹
      ctx.beginPath(); ctx.moveTo(px - s * size * 0.06, ey - size * 0.11); ctx.lineTo(px + s * size * 0.03, ey - size * 0.085); ctx.lineWidth = lw * 0.8; ctx.stroke(); ctx.lineWidth = lw;
    }
  }
  // 볼
  ctx.fillStyle = 'rgba(255,120,140,.45)';
  ell(ctx, -size * 0.28 + lx, ey + size * 0.08, size * 0.07, size * 0.04); ctx.fill();
  ell(ctx, size * 0.28 + lx, ey + size * 0.08, size * 0.07, size * 0.04); ctx.fill();
  // 입
  const my = ey + size * 0.09;
  ctx.strokeStyle = LINE; ctx.lineWidth = lw * 0.85;
  if (mood === 'happy'){
    ctx.beginPath(); ctx.moveTo(lx - size * 0.07, my - size * 0.01); ctx.quadraticCurveTo(lx, my + size * 0.12, lx + size * 0.07, my - size * 0.01); ctx.closePath();
    ctx.fillStyle = '#ff8f9e'; ctx.fill(); ctx.stroke();
  } else if (mood === 'wow'){
    ell(ctx, lx, my + size * 0.02, size * 0.035, size * 0.045); ctx.fillStyle = '#ff8f9e'; ctx.fill(); ctx.stroke();
  } else if (mood === 'sad' || mood === 'dizzy'){
    ctx.beginPath(); const wv = Math.sin(t * 20) * size * 0.006;
    ctx.moveTo(lx - size * 0.05, my + size * 0.03 + wv); ctx.quadraticCurveTo(lx - size * 0.025, my - wv, lx, my + size * 0.02);
    ctx.quadraticCurveTo(lx + size * 0.025, my + wv, lx + size * 0.05, my + size * 0.03 - wv); ctx.stroke();
  } else {
    ctx.beginPath(); ctx.arc(lx - size * 0.025, my, size * 0.025, 0.1, Math.PI - 0.1); ctx.arc(lx + size * 0.025, my, size * 0.025, 0.1, Math.PI - 0.1); ctx.stroke();
  }
  // 눈물
  if (mood === 'sad'){
    const k = (t * 1.6) % 1;
    for (const s of [-1, 1]){
      const tx = s * (ex + size * 0.05) + lx, ty = ey + size * 0.04 + k * size * 0.18;
      ctx.globalAlpha = 1 - k; ctx.beginPath(); ctx.moveTo(tx, ty - size * 0.04);
      ctx.quadraticCurveTo(tx + size * 0.03, ty + size * 0.01, tx, ty + size * 0.025); ctx.quadraticCurveTo(tx - size * 0.03, ty + size * 0.01, tx, ty - size * 0.04);
      ctx.fillStyle = '#7cc6ff'; ctx.fill(); ctx.globalAlpha = 1;
    }
  }
  // 배 숫자
  if (o.num !== undefined && o.num !== null){
    const s = String(o.num), r = size * (s.length > 1 ? 0.17 : 0.14), by = cy + h * 0.27;
    ctx.save(); if (o.flip) ctx.scale(-1, 1);
    ell(ctx, 0, by, r * 1.15, r * 0.9); ctx.fillStyle = '#fff'; ctx.fill(); ctx.lineWidth = lw * 0.8; ctx.strokeStyle = LINE; ctx.stroke();
    ctx.fillStyle = LINE; ctx.font = Math.round(r * 1.25) + 'px "Jua","Malgun Gothic",sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(s, 0, by + r * 0.07);
    ctx.restore();
  }
  ctx.restore();
}

window.CHARS = CHARS; window.CHAR_IDS = CHAR_IDS; window.drawChar = drawChar;
})();
