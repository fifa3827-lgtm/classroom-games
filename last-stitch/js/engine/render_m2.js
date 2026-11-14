// M2 그리기 덧붙임: 새 탑(독·석궁·종·병영)과 4단계 갈래, 적 특수 모습, 손 기술·적 능력 연출, 새 탄.
// render.js 의 Renderer(R)를 받아 그 위에 그린다. 게임 논리는 읽기만 한다.
import { IMG } from './assets.js';
import { TOWERS } from '../data/towers.js';

// 단계 열쇠: 1~3단계는 숫자, 4단계는 '4a'|'4b'
export const lvKey = t => (t.level === 4 ? '4' + (t.branch || 'a') : String(t.level));
export const TOWER_W2 = { poison: 140, crossbow: 150, bell: 132, barracks: 150 };
export const LV_SCALE2 = { 1: 1, 2: 1.08, 3: 1.16, '4a': 1.24, '4b': 1.24 };

// 석궁: 받침 + 위에서 본 석궁(오른쪽 향함). top=받침 바닥에서 축(높이 비율), pivot=석궁 그림 속 축, tip=축→바늘 끝(폭 비율), bw=폭
export const CROSSBOW = {
  1: { top: 0.57, pivot: [0.10, 0.47], tip: 0.95, bw: 150 },
  2: { top: 0.73, pivot: [0.10, 0.47], tip: 0.95, bw: 158 },
  3: { top: 0.74, pivot: [0.10, 0.47], tip: 0.95, bw: 166 },
  '4a': { top: 0.76, pivot: [0.10, 0.5], tip: 0.95, bw: 178 },
  '4b': { top: 0.72, pivot: [0.10, 0.5], tip: 0.95, bw: 178 },
};
// 대포·궁수 4단계 (render.js 의 CANNON·ARCHER 에 합침)
export const CANNON4 = {
  '4a': { top: 0.62, pivot: [0.2, 0.5], tip: 0.8, bw: 118 },
  '4b': { top: 0.65, pivot: [0.15, 0.5], tip: 0.88, bw: 150 },
};
export const ARCHER4 = {
  '4a': { top: 0.74, spots: [[-0.14, 0.01], [0.14, 0.01]], fig: 'c', fh: 84 },
  '4b': { top: 0.74, spots: [[0, 0.01]], fig: 'd', fh: 92 },
};
// 병사 그림: 1~3단계 soldier_fig_*, 기사단 soldier_fig_k_*, 창병 soldier_fig_s_*
const SOLDIER_FIG = { 1: 'soldier_fig', 2: 'soldier_fig', 3: 'soldier_fig', '4a': 'soldier_fig_k', '4b': 'soldier_fig_s' };
export const SOLDIER_H = 70;

// 판에서 미리 받아 둘 그림
const BR = ['4a', '4b'];
export const M2_IMGS = [
  ...['poison', 'bell', 'barracks'].flatMap(t => [1, 2, 3].map(l => [`${t}_${l}`, `assets/towers/${t}_${l}.webp`])),
  ...[1, 2, 3].map(l => [`crossbow_${l}`, `assets/towers/crossbow_${l}.webp`]),
  ...[1, 2, 3, ...BR].flatMap(l => [[`crossbow_base_${l}`, `assets/towers/crossbow_base_${l}.webp`], [`crossbow_arm_${l}`, `assets/towers/crossbow_arm_${l}.webp`]]),
  ...BR.flatMap(l => [[`cannon_base_${l}`, `assets/towers/cannon_base_${l}.webp`], [`cannon_barrel_${l}`, `assets/towers/cannon_barrel_${l}.webp`], [`archer_base_${l}`, `assets/towers/archer_base_${l}.webp`]]),
  ...['ice', 'lightning', 'poison', 'bell', 'barracks'].flatMap(t => BR.map(l => [`${t}_${l}`, `assets/towers/${t}_${l}.webp`])),
  ...['c', 'd'].flatMap(v => [0, 1, 2, 3, 4].map(i => [`archer_fig_${v}_${i}`, `assets/towers/archer_fig_${v}_${i}.webp`])),
  ...['soldier_fig', 'soldier_fig_k', 'soldier_fig_s'].flatMap(v => [0, 1, 2, 3, 4].map(i => [`${v}_${i}`, `assets/towers/${v}_${i}.webp`])),
  ...['splitblob', 'crane', 'snowman', 'mole', 'scissorbug', 'bishop', 'ghost', 'crab', 'golem', 'rook', 'queen', 'clockknight', 'inkgiant'].map(e => [`enemy_${e}`, `assets/enemies/enemy_${e}.webp`]),
];
// 메뉴에 쓸 한 장 그림(4단계는 갈래 그림이 없으면 3단계)
export function iconSrc(type, key) {
  if (key === '4a' || key === '4b') {
    if (['cannon', 'crossbow', 'archer'].includes(type)) return `assets/towers/${type}_${key}_icon.webp`;
    return `assets/towers/${type}_${key}.webp`;
  }
  return `assets/towers/${type}_${key}.webp`;
}

// 5방향 그림 고르기 (a: 화면 각도, 오른쪽 0, 아래 +)
export function dirFrame(a) {
  const left = Math.cos(a) < 0;
  const r = left ? Math.PI - a : a;
  const n = Math.atan2(Math.sin(r), Math.cos(r));
  const idx = n > 3 * Math.PI / 8 ? 0 : n > Math.PI / 8 ? 1 : n > -Math.PI / 8 ? 2 : n > -3 * Math.PI / 8 ? 3 : 4;
  return [idx, left ? -1 : 1];
}

const tintCache = new Map();
export function tinted(img, color) {
  const key = img.src + color;
  let c = tintCache.get(key);
  if (c) return c;
  c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
  const x = c.getContext('2d');
  x.drawImage(img, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = color; x.fillRect(0, 0, c.width, c.height);
  tintCache.set(key, c);
  return c;
}

// ── 병영 병사 ──
export function drawSoldier(R, game, s) {
  const { ctx } = R, t = s.tower;
  if (s.dead > 0) {
    // 다시 나올 자리에 작은 골무 표시
    const k = 1 - s.dead / 8;
    ctx.globalAlpha = 0.35 + 0.25 * Math.sin(R.t * 4);
    ctx.strokeStyle = '#d9e6ff'; ctx.lineWidth = 3; ctx.setLineDash([6, 6]);
    ctx.beginPath(); ctx.ellipse(s.hx, s.hy, 18, 9, 0, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * k); ctx.stroke(); ctx.setLineDash([]);
    ctx.globalAlpha = 1;
    return;
  }
  const key = SOLDIER_FIG[lvKey(t)];
  const [fi, fl] = dirFrame(s.ang ?? Math.PI / 2);
  const img = IMG[`${key}_${fi}`] || IMG[`soldier_fig_${fi}`];
  ctx.fillStyle = 'rgba(30,20,10,.3)'; ctx.beginPath(); ctx.ellipse(s.x, s.y, 20, 8, 0, 0, Math.PI * 2); ctx.fill();
  if (!img) return;
  const h = SOLDIER_H * (t.level === 4 && t.branch === 'a' ? 1.12 : 1), w = h * img.width / img.height;
  const swing = s.target && game.time % 0.8 < 0.15 ? 0.94 : 1;
  const bob = Math.sin(R.t * 3 + s.id) * 1.2;
  ctx.save(); ctx.translate(s.x, s.y + bob); ctx.scale(fl, swing);
  ctx.drawImage(img, -w / 2, -h, w, h);
  if (game.time - (s.hitT ?? -9) < 0.08) { ctx.globalAlpha = 0.6; ctx.drawImage(tinted(img, '#ff8a7a'), -w / 2, -h, w, h); }
  ctx.restore();
  // 다친 병사만 체력 막대
  if (s.hp < s.maxHp) {
    const bw = 34, x = s.x - bw / 2, y = s.y - h - 10, f = Math.max(0, s.hp / s.maxHp);
    ctx.fillStyle = 'rgba(20,10,5,.75)'; R.rr(x - 2, y - 2, bw + 4, 9, 4); ctx.fill();
    ctx.fillStyle = '#6fb7ff'; R.rr(x, y, bw * f, 5, 2.5); ctx.fill();
  }
}

// ── 적 모습 바꾸기 ── (render.drawEnemy 안에서 부름) → { alpha, lift, shadow, mound, skip }
export function enemyLook(R, game, e) {
  const D = e.def, o = { alpha: 1, lift: 0, shadow: 1, mound: false };
  if (D.fly) { o.lift = 46 + Math.sin(R.t * 3 + e.id) * 6; o.shadow = 0.6; }
  if (D.float) o.lift = 16 + Math.sin(R.t * 2.2 + e.id) * 5;
  if (D.ghost && !e.seen) o.alpha = 0.22 + 0.08 * Math.sin(R.t * 3 + e.id);
  if (D.burrow && e.hidden) { o.mound = true; o.alpha = 0; }
  return o;
}
// 땅속 두더지: 흙더미가 길을 따라 움직임
export function drawMound(R, e) {
  const { ctx } = R;
  const k = 1 + 0.08 * Math.sin(R.t * 12 + e.id);
  ctx.fillStyle = '#7a5532';
  ctx.beginPath(); ctx.ellipse(e.x, e.y, 30 * k, 14, 0, Math.PI, 0); ctx.fill();
  ctx.fillStyle = '#9b7046';
  ctx.beginPath(); ctx.ellipse(e.x - 4, e.y - 6, 18 * k, 8, 0, Math.PI, 0); ctx.fill();
  if (R.dt > 0 && Math.random() < 0.3) R.parts.push({ x: e.x + (Math.random() - 0.5) * 40, y: e.y - 4, vx: (Math.random() - 0.5) * 60, vy: -60 - Math.random() * 40, g: 300, life: 0, max: 0.5, size: 4, col: '#8a6238', kind: 'drop', floor: e.y + 4 });
}
// 적 머리 위 표시 (정예 금테, 여왕·주교 기운)
export function drawEnemyAura(R, game, e) {
  const { ctx } = R, D = e.def;
  if (D.haste) { ctx.strokeStyle = `rgba(255,120,90,${0.22 + 0.1 * Math.sin(R.t * 4)})`; ctx.lineWidth = 3; ctx.setLineDash([10, 10]); ctx.lineDashOffset = R.t * 30;
    ctx.beginPath(); ctx.ellipse(e.x, e.y, D.haste[0], D.haste[0] * 0.55, 0, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]); }
  if (e.haste > 1 && R.dt > 0 && Math.random() < 0.15) R.parts.push({ x: e.x - e.dx * 30, y: e.y - 10, vx: -e.dx * 80, vy: -e.dy * 80, g: 0, life: 0, max: 0.3, size: 4, col: '#ffb09a', kind: 'spark' });
  if (D.windup && e.pauseT > 0) { R.parts.push({ x: e.x + 18, y: e.y - D.size * 0.7, vx: 0, vy: -30, g: 0, life: 0, max: 0.25, size: 3, col: '#ffe08a', kind: 'spark' }); }
}

// ── 종탑: 둘레로 퍼지는 소리 고리 ──
export function drawBellRings(R, game) {
  const { ctx } = R;
  for (const t of game.towers) {
    if (t.type !== 'bell') continue;
    const [x, y] = game.padPos(t.pad), r = game.rangeOf(t);
    for (let i = 0; i < 2; i++) {
      const u = ((R.t * 0.45 + i * 0.5 + t.id * 0.13) % 1);
      ctx.strokeStyle = `rgba(255,226,150,${0.32 * (1 - u)})`; ctx.lineWidth = 4 * (1 - u) + 1;
      ctx.beginPath(); ctx.ellipse(x, y, r * u, r * u * 0.6, 0, 0, Math.PI * 2); ctx.stroke();
    }
  }
}

// ── 새 탄 ──
export function drawShotM2(R, sh) {
  const { ctx } = R;
  if (sh.k === 'needle') {
    ctx.save(); ctx.translate(sh.x, sh.y); ctx.rotate(sh.ang || 0);
    ctx.strokeStyle = 'rgba(230,240,255,.45)'; ctx.lineWidth = 10; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-90, 0); ctx.lineTo(0, 0); ctx.stroke();
    const g = ctx.createLinearGradient(-46, 0, 30, 0); g.addColorStop(0, '#8d97a4'); g.addColorStop(0.6, '#f6f9fc'); g.addColorStop(1, '#c9d2dc');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(34, 0); ctx.lineTo(-46, -5); ctx.lineTo(-46, 5); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#4b5562'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(-36, 0, 6, 2.4, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = '#f3c55a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-36, 0); ctx.quadraticCurveTo(-60, 8, -80, 2); ctx.stroke();
    ctx.restore();
    return true;
  }
  if (sh.k === 'glob') {
    const u = sh.t / sh.T, gy = sh.y0 + (sh.ty - sh.y0) * u;
    ctx.fillStyle = 'rgba(30,20,10,.25)'; ctx.beginPath(); ctx.ellipse(sh.x, gy + 26, 13, 6, 0, 0, Math.PI * 2); ctx.fill();
    const g = ctx.createRadialGradient(sh.x - 4, sh.y - 5, 1, sh.x, sh.y, 15);
    g.addColorStop(0, '#e9ffb0'); g.addColorStop(0.5, '#86d83a'); g.addColorStop(1, '#2f7a1c');
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(sh.x, sh.y, 14, 12, Math.sin(R.t * 10) * 0.3, 0, Math.PI * 2); ctx.fill();
    if (R.dt > 0 && Math.random() < 0.5) R.parts.push({ x: sh.x, y: sh.y, vx: (Math.random() - 0.5) * 20, vy: 30, g: 200, life: 0, max: 0.4, size: 4, col: '#9be24a', kind: 'drop', floor: gy + 20 });
    return true;
  }
  return false;
}

// ── 사건 → 연출 (level.js handleEvents 에서 부름). 소리 이름을 돌려주면 장면이 낸다
export function fxEvent(R, game, ev) {
  switch (ev.t) {
    case 'splash': {
      R.parts.push({ x: ev.x, y: ev.y, vx: 0, vy: 0, g: 0, life: 0, max: 0.4, size: ev.r, col: '#9be24a', kind: 'ring' });
      R.splat(ev.x, ev.y + 10, '#6cc23a', 10, 0.8);
      R.decals.push({ x: ev.x, y: ev.y, r: ev.r * 0.7, life: 0, max: 2.6, col: '#3f8a22', seed: Math.random() * 10 });
      for (let i = 0; i < 6; i++) R.parts.push({ x: ev.x + (Math.random() - 0.5) * ev.r, y: ev.y, vx: 0, vy: -20 - Math.random() * 30, g: -10, life: 0, max: 1 + Math.random() * 0.6, size: 14 + Math.random() * 12, col: '#a6e05a', kind: 'puff' });
      return ['hit_paint', 0.5];
    }
    case 'blizzard': {
      const [x, y] = game.padPos(ev.tower.pad);
      R.parts.push({ x, y, vx: 0, vy: 0, g: 0, life: 0, max: 0.5, size: ev.r * 1.6, col: '#dff6ff', kind: 'ring' });
      for (let i = 0; i < 26; i++) { const a = Math.random() * Math.PI * 2, rr = Math.random() * ev.r; R.parts.push({ x: x + Math.cos(a) * rr, y: y + Math.sin(a) * rr * 0.6 - 60, vx: Math.cos(a + 1.6) * 90, vy: 30, g: 0, life: 0, max: 0.8, size: 5 + Math.random() * 4, col: '#f2fbff', kind: 'frost' }); }
      return ['ice_shot', 0.6];
    }
    case 'freeze': { const e = ev.enemy; R.sparks(e.x, e.y - 30, '#cfefff', 16, 180); return ['freeze', 0.6]; }
    case 'child': { const e = ev.enemy; R.splat(e.x, e.y, '#d42a2a', 4, 0.5); return null; }
    case 'heal': {
      const e = ev.enemy;
      R.parts.push({ x: e.x, y: e.y, vx: 0, vy: 0, g: 0, life: 0, max: 0.6, size: ev.r * 1.4, col: '#ff8a8a', kind: 'ring' });
      return ['star', 0.25];
    }
    case 'healed': { const e = ev.enemy; for (let i = 0; i < 3; i++) R.parts.push({ x: e.x + (Math.random() - 0.5) * 30, y: e.y - e.def.size * 0.5, vx: 0, vy: -50, g: 0, life: 0, max: 0.6, size: 4, col: '#ffb3b3', kind: 'spark' }); return null; }
    case 'towerstun': {
      const e = ev.enemy;
      R.parts.push({ x: e.x, y: e.y, vx: 0, vy: 0, g: 0, life: 0, max: 0.6, size: ev.r * 1.5, col: '#5a4a6a', kind: 'ring' });
      R.shake(6);
      for (const t of ev.towers) { const [x, y] = game.padPos(t.pad); R.dust(x, y, 8, '#6a5a7a'); }
      return ['cannon_hit', 0.5];
    }
    case 'enemycut': {
      const th = ev.thread, a = game.towerTop(th.a), b = game.towerTop(th.b);
      const m = th._mid || [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      R.sparks(m[0], m[1], ev.ink ? '#2a1a2a' : '#ffffff', 16, 200);
      R.float(m[0], m[1], ev.ink ? '먹물에 실이 끊겼다!' : '실이 잘렸다!', '#ff9a8a');
      R.shake(4);
      return null;   // 끊는 소리는 'cut' 사건이 낸다
    }
    case 'burrow': case 'unburrow': { const e = ev.enemy; R.dust(e.x, e.y, 10, '#9b7046'); return ['hit_wood', 0.35]; }
    case 'windup': { const e = ev.enemy; R.sparks(e.x, e.y - e.def.size * 0.6, '#ffe08a', 8, 120); return ['zap_chain', 0.25]; }
    case 'soldier_hit': { const e = ev.enemy; R.sparks(e.x, e.y - e.def.size * 0.4, '#e6eefc', 3, 100); ev.soldier.hitT = game.time; return null; }
    case 'soldier_die': { const s = ev.soldier; R.dust(s.x, s.y, 10, '#c9d6ea'); return ['hit_metal', 0.5]; }
    case 'soldier_up': { const s = ev.soldier; R.sparks(s.x, s.y - 30, '#bcd8ff', 10, 120); return null; }
    case 'skill': {
      if (ev.k === 'needles') R.needleRain = { x: ev.x, y: ev.y, r: ev.r, t0: R.t };
      else { R.rewindFx = { x: ev.x, y: ev.y, r: ev.r, t0: R.t }; R.shake(5); }
      return [ev.k === 'needles' ? 'skill_needles' : 'skill_rewind', 0.9];
    }
    case 'needles_hit': { R.shake(7 + ev.n); for (let i = 0; i < 14; i++) R.dust(ev.x + (Math.random() - 0.5) * ev.r * 1.4, ev.y + (Math.random() - 0.5) * ev.r * 0.8, 2, '#d9cdb5'); return null; }
    case 'rewound': {
      const e = ev.enemy;
      (R.rewindTrails ||= []).push({ fx: ev.fx, fy: ev.fy, e, t0: R.t });
      return null;
    }
  }
  return null;
}

// 손 기술 연출 (탄·입자 위에 그림)
export function drawSkillFx(R, game) {
  const { ctx } = R;
  const N = R.needleRain;
  if (N) {
    const u = (R.t - N.t0) / 0.9;
    if (u > 1) R.needleRain = null;
    else {
      // 둥근 표적 + 하늘에서 쏟아지는 바늘
      ctx.strokeStyle = `rgba(255,240,200,${0.7 * (1 - u)})`; ctx.lineWidth = 4; ctx.setLineDash([12, 8]);
      ctx.beginPath(); ctx.ellipse(N.x, N.y, N.r, N.r * 0.8, 0, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
      const n = 18;
      for (let i = 0; i < n; i++) {
        const s = Math.sin(i * 12.9898) * 43758.5453, rx = s - Math.floor(s), s2 = Math.sin(i * 78.233) * 12345.678, ry = s2 - Math.floor(s2);
        const a = rx * Math.PI * 2, rr = Math.sqrt(ry) * N.r;
        const gx = N.x + Math.cos(a) * rr, gy = N.y + Math.sin(a) * rr * 0.8;
        const fall = Math.min(1, Math.max(0, (u * 1.6 - i / n * 0.6) / 0.4));
        if (fall <= 0) continue;
        const y = gy - 420 * (1 - fall);
        ctx.globalAlpha = fall >= 1 ? Math.max(0, 1 - (u - 0.6) / 0.4) : 1;
        ctx.save(); ctx.translate(gx, y); ctx.rotate(Math.PI / 2 + 0.15);
        const g = ctx.createLinearGradient(-30, 0, 18, 0); g.addColorStop(0, '#8d97a4'); g.addColorStop(0.7, '#ffffff'); g.addColorStop(1, '#c9d2dc');
        ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(18, 0); ctx.lineTo(-30, -3); ctx.lineTo(-30, 3); ctx.closePath(); ctx.fill();
        if (fall < 1) { ctx.strokeStyle = 'rgba(255,255,255,.4)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-30, 0); ctx.lineTo(-90, 0); ctx.stroke(); }
        ctx.restore();
      }
      ctx.globalAlpha = 1;
    }
  }
  const W = R.rewindFx;
  if (W) {
    const u = (R.t - W.t0) / 0.8;
    if (u > 1) R.rewindFx = null;
    else {
      ctx.save(); ctx.translate(W.x, W.y); ctx.scale(1, 0.62);
      for (let k = 0; k < 3; k++) {
        ctx.strokeStyle = `rgba(190,170,255,${0.7 * (1 - u)})`; ctx.lineWidth = 6 - k * 1.5;
        ctx.beginPath();
        for (let i = 0; i <= 40; i++) { const a = -i / 40 * Math.PI * 3.2 - u * 9 + k * 2.1, r = W.r * (1 - i / 48) * (0.6 + u * 0.5); i ? ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r) : ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
        ctx.stroke();
      }
      ctx.restore();
    }
  }
  if (R.rewindTrails) {
    R.rewindTrails = R.rewindTrails.filter(tr => R.t - tr.t0 < 0.5);
    for (const tr of R.rewindTrails) {
      const u = (R.t - tr.t0) / 0.5;
      ctx.strokeStyle = `rgba(200,180,255,${0.8 * (1 - u)})`; ctx.lineWidth = 5; ctx.setLineDash([8, 8]);
      ctx.beginPath(); ctx.moveTo(tr.fx, tr.fy - 30); ctx.quadraticCurveTo((tr.fx + tr.e.x) / 2, Math.min(tr.fy, tr.e.y) - 120, tr.e.x, tr.e.y - 30); ctx.stroke(); ctx.setLineDash([]);
    }
  }
}
// 멈춘 탑(흑성채): 회색 덮개와 빙글 도는 별
export function drawTowerStun(R, game, t, x, y, h) {
  if (!(t.stunT > 0)) return;
  const { ctx } = R;
  for (let i = 0; i < 3; i++) {
    const a = R.t * 4 + i * 2.1;
    ctx.fillStyle = '#d6c8f0'; ctx.beginPath(); ctx.arc(x + Math.cos(a) * 26, y - h - 6 + Math.sin(a) * 8, 4, 0, Math.PI * 2); ctx.fill();
  }
}
export { TOWERS };
