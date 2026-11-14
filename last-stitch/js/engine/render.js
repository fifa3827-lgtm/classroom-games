// 그리기: 맵, 탑, 적, 실, 탄, 입자, 손맛 연출. 게임 논리는 읽기만 한다.
import { IMG } from './assets.js';
import { TOWERS, towerStats } from '../data/towers.js';

const PAD_R = 62;
const TOWER_W = { archer: 150, cannon: 150, ice: 140, lightning: 140 };
const LV_SCALE = [0, 1, 1.08, 1.16];

// 그림의 흰 실루엣(맞을 때 번쩍) · 파란 실루엣(느려짐) 캐시
const tintCache = new Map();
function tinted(img, color) {
  const key = img.src + color;
  let c = tintCache.get(key);
  if (c) return c;
  c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
  const x = c.getContext('2d');
  x.drawImage(img, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = color; x.fillRect(0, 0, c.width, c.height);
  tintCache.set(key, c);
  return c;
}

export class Renderer {
  constructor(view) {
    this.v = view; this.ctx = view.ctx;
    this.parts = []; this.decals = []; this.floats = []; this.bolts = []; this.rails = [];
    this.shakeA = 0; this.shakeT = 0; this.flash = 0;
    this.drops = new Map();   // 탑 id → 떨어지는 연출 시작 시각
    this.recoil = new Map();
    this.wobble = new Map();  // 실 id → 떨림 시작 시각
    this.t = 0;
    this.ui = { pads: false, sel: null, range: null, preview: null, drag: null, selThread: null, rangeOk: true };
  }
  setMap(img) {
    this.mapImg = img;
    // 띠가 생길 때 깔 흐린 바탕 (작게 줄였다 키우면 흐려진다)
    const c = document.createElement('canvas'); c.width = 24; c.height = Math.round(24 * img.height / img.width);
    const x = c.getContext('2d'); x.drawImage(img, 0, 0, c.width, c.height);
    this.blurImg = c;
  }
  shake(a) { this.shakeA = Math.max(this.shakeA, a); }

  // ── 연출 만들기 ──
  dust(x, y, n = 14, col = '#e9d6b0') {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, sp = 60 + Math.random() * 120;
      this.parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.45 - 20, g: -30, life: 0, max: 0.5 + Math.random() * 0.4, size: 10 + Math.random() * 14, col, kind: 'puff' });
    }
  }
  splat(x, y, col = '#d42a2a', n = 12, big = 1) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, sp = (80 + Math.random() * 200) * big;
      this.parts.push({ x, y: y - 20, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.6 - 160 * big, g: 700, life: 0, max: 0.45 + Math.random() * 0.3, size: (4 + Math.random() * 7) * big, col, kind: 'drop', floor: y + (Math.random() - 0.5) * 20 });
    }
    this.decals.push({ x, y, r: 20 * big + Math.random() * 8, life: 0, max: 3.2, col, seed: Math.random() * 10 });
    if (this.decals.length > 40) this.decals.shift();
  }
  sparks(x, y, col, n = 8, sp0 = 160) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, sp = sp0 * (0.4 + Math.random());
      this.parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, g: 0, life: 0, max: 0.25 + Math.random() * 0.25, size: 3 + Math.random() * 3, col, kind: 'spark' });
    }
  }
  ember(x, y) { this.parts.push({ x: x + (Math.random() - 0.5) * 24, y, vx: (Math.random() - 0.5) * 20, vy: -60 - Math.random() * 60, g: 0, life: 0, max: 0.5, size: 5 + Math.random() * 4, col: Math.random() < 0.5 ? '#ffb02e' : '#ff5a1f', kind: 'spark' }); }
  float(x, y, text, col = '#ffe48a', icon = null) { this.floats.push({ x, y, text, col, icon, life: 0, max: 1.1 }); }
  bolt(pts, col = '#c9a6ff') { this.bolts.push({ pts: pts.map(p => p.slice()), life: 0, max: 0.22, col, seed: Math.random() }); }
  rail(th) { this.rails.push({ th, life: 0, max: 0.45 }); }
  boom(x, y, r) {
    this.parts.push({ x, y, vx: 0, vy: 0, g: 0, life: 0, max: 0.35, size: r, col: '#ffd27a', kind: 'ring' });
    for (let i = 0; i < 10; i++) this.ember(x, y);
    this.dust(x, y, 10, '#b9a48a');
    this.decals.push({ x, y, r: r * 0.55, life: 0, max: 2.2, col: '#3a2a1a', seed: Math.random() * 10 });
  }
  dropTower(t) { this.drops.set(t.id, this.t); }
  pulseTower(t) { this.recoil.set(t.id, this.t); }
  wobbleThread(th) { this.wobble.set(th.id, this.t); }

  // ── 그리기 ──
  draw(game, dt) {
    this.t += dt;
    const { ctx, v } = this;
    const s = v.s;
    ctx.setTransform(v.dpr, 0, 0, v.dpr, 0, 0);
    // 흔들림
    this.shakeA *= Math.pow(0.0015, dt);
    const sx = (Math.random() - 0.5) * this.shakeA, sy = (Math.random() - 0.5) * this.shakeA;
    if (v.banded && this.blurImg) {
      const sc = Math.max(v.W / this.blurImg.width, v.H / this.blurImg.height);
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(this.blurImg, (v.W - this.blurImg.width * sc) / 2, (v.H - this.blurImg.height * sc) / 2, this.blurImg.width * sc, this.blurImg.height * sc);
      ctx.fillStyle = 'rgba(20,14,8,.25)'; ctx.fillRect(0, 0, v.W, v.H);
    }
    ctx.setTransform(v.dpr * s, 0, 0, v.dpr * s, v.dpr * (v.ox + sx), v.dpr * (v.oy + sy));
    const geo = game.geo;
    if (this.mapImg) ctx.drawImage(this.mapImg, 0, 0, geo.W, geo.H);

    // 바닥 얼룩
    for (const d of this.decals) {
      d.life += dt;
      const a = Math.max(0, 1 - d.life / d.max) * 0.55;
      ctx.fillStyle = d.col; ctx.globalAlpha = a;
      ctx.beginPath();
      for (let i = 0; i < 9; i++) { const ang = i / 9 * Math.PI * 2, rr = d.r * (0.75 + 0.35 * Math.sin(d.seed + i * 2.3)); ctx.lineTo(d.x + Math.cos(ang) * rr, d.y + Math.sin(ang) * rr * 0.55); }
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    this.decals = this.decals.filter(d => d.life < d.max);

    // 빈자리 안내 (탑 고를 때, 실 끌 때)
    const U = this.ui;
    if (U.pads) {
      const pulse = 0.5 + 0.5 * Math.sin(this.t * 5);
      geo.pads.forEach(([x, y], i) => {
        if (game.towerAt(i)) return;
        ctx.strokeStyle = `rgba(255,236,170,${0.35 + 0.45 * pulse})`; ctx.lineWidth = 5;
        ctx.beginPath(); ctx.ellipse(x, y, PAD_R * 0.95, PAD_R * 0.62, 0, 0, Math.PI * 2); ctx.stroke();
      });
    }
    // 실 그림자(효과가 미치는 땅 위 줄)
    for (const th of game.threads) {
      const p = game.padPos(th.a.pad), q = game.padPos(th.b.pad);
      ctx.strokeStyle = 'rgba(30,20,10,.16)'; ctx.lineWidth = 36 * 2; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.stroke();
      ctx.strokeStyle = this.hexA(th.combo.color, 0.22); ctx.lineWidth = 8;
      ctx.setLineDash([14, 14]); ctx.lineDashOffset = -this.t * 40;
      ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.stroke();
      ctx.setLineDash([]);
    }
    // 사거리
    if (U.range) {
      const [x, y, r] = U.range;
      ctx.fillStyle = U.rangeOk ? 'rgba(120,190,255,.14)' : 'rgba(255,120,100,.14)';
      ctx.strokeStyle = U.rangeOk ? 'rgba(200,230,255,.75)' : 'rgba(255,170,150,.75)'; ctx.lineWidth = 4;
      ctx.setLineDash([18, 10]); ctx.lineDashOffset = -this.t * 30;
      ctx.beginPath(); ctx.ellipse(x, y, r, r, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.setLineDash([]);
    }

    // 탑·적을 위→아래 순으로
    const items = [];
    for (const t of game.towers) items.push([game.padPos(t.pad)[1], 0, t]);
    for (const e of game.enemies) items.push([e.y, 1, e]);
    if (U.preview) items.push([geo.pads[U.preview.pad][1], 2, U.preview]);
    items.sort((a, b) => a[0] - b[0]);
    for (const [, k, o] of items) {
      if (k === 0) this.drawTower(game, o);
      else if (k === 1) this.drawEnemy(game, o);
      else this.drawGhost(game, o);
    }

    // 실
    for (const th of game.threads) this.drawThread(game, th);
    for (const r of this.rails) {
      r.life += dt;
      const a = game.towerTop(r.th.a), b = game.towerTop(r.th.b);
      const u = Math.min(1, r.life / r.max), uu = u < 0.5 ? u * 2 : 2 - u * 2;
      const px = a[0] + (b[0] - a[0]) * uu, py = a[1] + (b[1] - a[1]) * uu + Math.sin(uu * Math.PI) * this.sag(a, b);
      ctx.fillStyle = '#fff'; ctx.shadowColor = '#c79bff'; ctx.shadowBlur = 30;
      ctx.beginPath(); ctx.arc(px, py, 12, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
      if (Math.random() < 0.6) this.sparks(px, py, '#e6d4ff', 2, 120);
    }
    this.rails = this.rails.filter(r => r.life < r.max);
    if (U.drag) this.drawDrag(game, U.drag);

    // 탄
    for (const sh of game.shots) this.drawShot(sh);
    // 번개
    for (const b of this.bolts) {
      b.life += dt;
      const a = 1 - b.life / b.max;
      ctx.strokeStyle = b.col; ctx.lineWidth = 9; ctx.globalAlpha = a * 0.35; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      this.zigzag(b.pts, b.seed + Math.floor(b.life * 30)); ctx.stroke();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 3.5; ctx.globalAlpha = a; this.zigzag(b.pts, b.seed + Math.floor(b.life * 30)); ctx.stroke();
    }
    ctx.globalAlpha = 1;
    this.bolts = this.bolts.filter(b => b.life < b.max);

    // 입자
    for (const p of this.parts) {
      p.life += dt;
      p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt;
      const u = p.life / p.max;
      if (p.kind === 'drop') {
        if (p.y > p.floor) { p.y = p.floor; p.vx *= 0.3; p.vy = 0; p.g = 0; }
        ctx.fillStyle = p.col; ctx.globalAlpha = 1 - u * u;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (1 - u * 0.4), 0, Math.PI * 2); ctx.fill();
      } else if (p.kind === 'puff') {
        p.vx *= 0.92; p.vy *= 0.92;
        const rr = p.size * (0.6 + u);
        const gr = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, rr);
        gr.addColorStop(0, p.col); gr.addColorStop(1, this.hexA(p.col, 0));
        ctx.fillStyle = gr; ctx.globalAlpha = (1 - u) * 0.5;
        ctx.beginPath(); ctx.arc(p.x, p.y, rr, 0, Math.PI * 2); ctx.fill();
      } else if (p.kind === 'spark') {
        ctx.fillStyle = p.col; ctx.globalAlpha = 1 - u;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (1 - u * 0.5), 0, Math.PI * 2); ctx.fill();
      } else if (p.kind === 'ring') {
        ctx.strokeStyle = p.col; ctx.globalAlpha = (1 - u) * 0.9; ctx.lineWidth = 10 * (1 - u) + 2;
        ctx.beginPath(); ctx.ellipse(p.x, p.y, p.size * (0.3 + u * 0.9), p.size * (0.3 + u * 0.9) * 0.6, 0, 0, Math.PI * 2); ctx.stroke();
        const fr = Math.max(1, p.size * 0.6 * (1 - u));
        const fg = ctx.createRadialGradient(p.x, p.y - 10, 0, p.x, p.y - 10, fr);
        fg.addColorStop(0, 'rgba(255,250,220,1)'); fg.addColorStop(0.5, 'rgba(255,190,80,.8)'); fg.addColorStop(1, 'rgba(255,120,30,0)');
        ctx.fillStyle = fg; ctx.globalAlpha = Math.max(0, 1 - u * 2.2);
        ctx.beginPath(); ctx.arc(p.x, p.y - 10, fr, 0, Math.PI * 2); ctx.fill();
      } else if (p.kind === 'frost') {
        ctx.fillStyle = p.col; ctx.globalAlpha = 1 - u;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.life * 4); ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size); ctx.restore();
      }
    }
    ctx.globalAlpha = 1;
    this.parts = this.parts.filter(p => p.life < p.max);
    if (this.parts.length > 600) this.parts.splice(0, this.parts.length - 600);

    // 체력 막대
    for (const e of game.enemies) {
      if (e.hp >= e.maxHp || e.d < 0) continue;
      const w = 50, h = 8, x = e.x - w / 2, y = e.y - e.def.size * 1.15 - 6;
      ctx.fillStyle = 'rgba(20,10,5,.75)'; this.rr(x - 2, y - 2, w + 4, h + 4, 5); ctx.fill();
      const f = Math.max(0, e.hp / e.maxHp);
      ctx.fillStyle = f > 0.5 ? '#7ad04a' : f > 0.25 ? '#f2c13a' : '#ef4b3a';
      this.rr(x, y, w * f, h, 3); ctx.fill();
    }
    // 떠오르는 글자
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const f of this.floats) {
      f.life += dt;
      const u = f.life / f.max;
      const y = f.y - 40 - u * 50;
      ctx.globalAlpha = u > 0.7 ? (1 - u) / 0.3 : 1;
      const sc = u < 0.15 ? 0.6 + u / 0.15 * 0.5 : 1.1 - Math.min(0.1, (u - 0.15));
      ctx.font = `700 ${Math.round(30 * sc)}px Dodum, sans-serif`;
      ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(40,20,5,.85)'; ctx.strokeText(f.text, f.x + (f.icon ? 12 : 0), y);
      ctx.fillStyle = f.col; ctx.fillText(f.text, f.x + (f.icon ? 12 : 0), y);
      if (f.icon && IMG[f.icon]) ctx.drawImage(IMG[f.icon], f.x - 34 * sc - 8, y - 15 * sc, 30 * sc, 30 * sc);
    }
    ctx.globalAlpha = 1;
    this.floats = this.floats.filter(f => f.life < f.max);
  }

  sag(a, b) { return Math.hypot(b[0] - a[0], b[1] - a[1]) * 0.07; }
  hexA(hex, a) { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; }
  rr(x, y, w, h, r) { const c = this.ctx; c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  zigzag(pts, seed) {
    const c = this.ctx; let r = seed * 9301 + 49297;
    const rnd = () => { r = (r * 9301 + 49297) % 233280; return r / 233280 - 0.5; };
    c.beginPath(); c.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) {
      const [ax, ay] = pts[i - 1], [bx, by] = pts[i];
      const n = 6, nx = -(by - ay), ny = bx - ax, l = Math.hypot(nx, ny) || 1;
      for (let j = 1; j < n; j++) { const u = j / n, o = rnd() * 36; c.lineTo(ax + (bx - ax) * u + nx / l * o, ay + (by - ay) * u + ny / l * o); }
      c.lineTo(bx, by);
    }
  }

  towerImg(t) { return IMG[`${t.type}_${t.level}`]; }
  drawTower(game, t) {
    const { ctx } = this;
    const [x, y] = game.padPos(t.pad);
    const img = this.towerImg(t);
    const w = TOWER_W[t.type] * LV_SCALE[t.level];
    // 떨어지기: 0.28초 동안 위에서 내려와 눌렸다 펴짐
    let dy = 0, sqx = 1, sqy = 1;
    const d0 = this.drops.get(t.id);
    if (d0 !== undefined) {
      const u = (this.t - d0);
      if (u < 0.26) { const k = u / 0.26; dy = -420 * (1 - k * k); }
      else if (u < 0.6) { const k = (u - 0.26) / 0.34; const b = Math.sin(k * Math.PI * 2) * Math.exp(-k * 4); sqx = 1 + b * 0.18; sqy = 1 - b * 0.2; }
      else this.drops.delete(t.id);
    }
    const r0 = this.recoil.get(t.id);
    if (r0 !== undefined) { const u = this.t - r0; if (u < 0.12) { sqy *= 1 - 0.06 * Math.sin(u / 0.12 * Math.PI); sqx *= 1 + 0.03 * Math.sin(u / 0.12 * Math.PI); } else this.recoil.delete(t.id); }
    // 그림자
    const sh = d0 !== undefined && dy < 0 ? Math.max(0.3, 1 + dy / 600) : 1;
    ctx.fillStyle = 'rgba(30,20,10,.28)';
    ctx.beginPath(); ctx.ellipse(x + 6, y + 10, PAD_R * 0.85 * sh, PAD_R * 0.42 * sh, 0, 0, Math.PI * 2); ctx.fill();
    if (!img) return;
    const h = w * img.height / img.width;
    const flip = t.type === 'cannon' && t.aim < 0 ? -1 : 1;
    ctx.save();
    ctx.translate(x, y + PAD_R * 0.32 + dy);
    ctx.scale(sqx * flip, sqy);
    ctx.drawImage(img, -w / 2, -h, w, h);
    ctx.restore();
    // 마법 탑의 빛
    if (t.type === 'lightning' || t.type === 'ice') {
      const top = y + PAD_R * 0.32 + dy - h * 0.86;
      const g = ctx.createRadialGradient(x, top, 2, x, top, 46);
      const c = t.type === 'lightning' ? '200,150,255' : '170,225,255';
      const p = 0.35 + 0.2 * Math.sin(this.t * 3 + t.id);
      g.addColorStop(0, `rgba(${c},${p})`); g.addColorStop(1, `rgba(${c},0)`);
      ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, top, 46, 0, Math.PI * 2); ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
    }
    if (this.ui.sel === t) {
      ctx.strokeStyle = 'rgba(255,224,120,.9)'; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.ellipse(x, y, PAD_R, PAD_R * 0.62, 0, 0, Math.PI * 2); ctx.stroke();
    }
    // 실 끌 때 이을 수 있는 탑 표시
    const D = this.ui.drag;
    if (D && D.from !== t) {
      const ok = game.linkCheck(D.from, t) === 'ok';
      ctx.strokeStyle = ok ? (D.over === t ? 'rgba(255,240,150,1)' : 'rgba(255,240,150,.55)') : 'rgba(255,255,255,.18)';
      ctx.lineWidth = D.over === t ? 8 : 4;
      ctx.beginPath(); ctx.ellipse(x, y, PAD_R * 1.05, PAD_R * 0.66, 0, 0, Math.PI * 2); ctx.stroke();
    }
  }
  drawGhost(game, pv) {
    const { ctx } = this;
    const img = IMG[`${pv.type}_1`];
    if (!img) return;
    const [x, y] = game.geo.pads[pv.pad];
    const w = TOWER_W[pv.type], h = w * img.height / img.width;
    ctx.globalAlpha = 0.55 + 0.15 * Math.sin(this.t * 6);
    ctx.drawImage(img, x - w / 2, y + PAD_R * 0.32 - h, w, h);
    ctx.globalAlpha = 1;
  }
  drawEnemy(game, e) {
    const { ctx } = this;
    const img = IMG[e.def.img];
    if (!img) return;
    const w = e.def.size, h = w * img.height / img.width;
    const age = this.t * 1 + e.id * 0.37;
    const speedK = e.stunT > 0 ? 0 : (1 - e.slow);
    const ph = (game.time * 9 * speedK + e.id) % (Math.PI * 2);
    const hop = Math.abs(Math.sin(ph)) * 14 * e.def.hop;
    const sq = Math.cos(ph * 2) * 0.06 * e.def.hop;
    const tilt = Math.sin(ph) * 0.07;
    const flip = e.dx < -0.25 ? -1 : 1;
    // 들어오는 순간 서서히 나타남
    const fade = Math.min(1, (e.d + 20) / 40);
    ctx.globalAlpha = fade;
    ctx.fillStyle = 'rgba(30,15,10,.3)';
    ctx.beginPath(); ctx.ellipse(e.x, e.y, w * 0.36 * (1 - hop / 60), w * 0.15, 0, 0, Math.PI * 2); ctx.fill();
    ctx.save();
    ctx.translate(e.x, e.y - hop);
    ctx.rotate(tilt); ctx.scale(flip * (1 + sq), 1 - sq);
    ctx.drawImage(img, -w / 2, -h, w, h);
    const sinceHit = game.time - e.hitT;
    if (sinceHit < 0.08) { ctx.globalAlpha = fade * 0.75; ctx.drawImage(tinted(img, '#ffffff'), -w / 2, -h, w, h); }
    else if (e.slow > 0 || e.stunT > 0) { ctx.globalAlpha = fade * (e.stunT > 0 ? 0.55 : 0.32); ctx.drawImage(tinted(img, e.stunT > 0 ? '#bfefff' : '#6cc8ff'), -w / 2, -h, w, h); }
    ctx.restore();
    ctx.globalAlpha = 1;
    if (e.burnT > 0 && Math.random() < 0.35) this.ember(e.x, e.y - h * 0.5);
    if (e.slow > 0 && Math.random() < 0.08) this.parts.push({ x: e.x + (Math.random() - 0.5) * w * 0.6, y: e.y - Math.random() * h, vx: 0, vy: 20, g: 0, life: 0, max: 0.6, size: 5, col: '#dff6ff', kind: 'frost' });
    if (e.stunT > 0 && Math.random() < 0.3) this.sparks(e.x, e.y - h * 0.6, '#bfefff', 1, 90);
  }
  drawThread(game, th) {
    const { ctx } = this;
    const a = game.towerTop(th.a), b = game.towerTop(th.b);
    // 떨어지는 중인 탑은 따라 내려온다
    const sag = this.sag(a, b);
    let wob = 0;
    const w0 = this.wobble.get(th.id);
    if (w0 !== undefined) { const u = this.t - w0; if (u < 1.2) wob = Math.sin(u * 38) * Math.exp(-u * 4.5) * 34; else this.wobble.delete(th.id); }
    const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2 + sag + wob;
    const c = th.combo;
    const sel = this.ui.selThread === th;
    ctx.lineCap = 'round';
    ctx.strokeStyle = this.hexA(c.color, sel ? 0.55 : 0.28); ctx.lineWidth = sel ? 22 : 16;
    ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.quadraticCurveTo(mx, my, b[0], b[1]); ctx.stroke();
    ctx.strokeStyle = c.color; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.quadraticCurveTo(mx, my, b[0], b[1]); ctx.stroke();
    ctx.strokeStyle = c.glow; ctx.lineWidth = 2.2;
    ctx.setLineDash([10, 18]); ctx.lineDashOffset = -this.t * 90;
    ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.quadraticCurveTo(mx, my, b[0], b[1]); ctx.stroke();
    ctx.setLineDash([]);
    // 실 끝 매듭
    for (const p of [a, b]) { ctx.fillStyle = c.glow; ctx.beginPath(); ctx.arc(p[0], p[1], 6, 0, Math.PI * 2); ctx.fill(); }
    // 반짝임
    if (Math.random() < 0.15) {
      const u = Math.random(), q = 1 - u;
      const px = q * q * a[0] + 2 * q * u * mx + u * u * b[0], py = q * q * a[1] + 2 * q * u * my + u * u * b[1];
      this.parts.push({ x: px, y: py, vx: 0, vy: 30, g: 0, life: 0, max: 0.5, size: 3, col: c.glow, kind: 'spark' });
    }
    th._mid = [mx, my];
  }
  drawDrag(game, D) {
    const { ctx } = this;
    const a = game.towerTop(D.from);
    const b = D.over ? game.towerTop(D.over) : [D.x, D.y];
    const len = Math.hypot(game.padPos(D.from.pad)[0] - D.gx, game.padPos(D.from.pad)[1] - D.gy);
    const bad = D.over ? game.linkCheck(D.from, D.over) !== 'ok' : len > game.maxThreadLen();
    const col = bad ? '#ff5a4a' : '#ffe9a8';
    const sag = this.sag(a, b) * 0.6;
    const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2 + sag;
    ctx.lineCap = 'round';
    ctx.strokeStyle = this.hexA(col, 0.3); ctx.lineWidth = 16;
    ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.quadraticCurveTo(mx, my, b[0], b[1]); ctx.stroke();
    ctx.strokeStyle = col; ctx.lineWidth = 4; ctx.setLineDash([16, 8]); ctx.lineDashOffset = -this.t * 120;
    ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.quadraticCurveTo(mx, my, b[0], b[1]); ctx.stroke(); ctx.setLineDash([]);
    // 실 길이 한계 원
    const p = game.padPos(D.from.pad);
    ctx.strokeStyle = 'rgba(255,233,168,.35)'; ctx.lineWidth = 3; ctx.setLineDash([6, 10]);
    ctx.beginPath(); ctx.arc(p[0], p[1], game.maxThreadLen(), 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = col; ctx.beginPath(); ctx.arc(b[0], b[1], 9, 0, Math.PI * 2); ctx.fill();
  }
  drawShot(sh) {
    const { ctx } = this;
    if (sh.k === 'arrow') {
      ctx.save(); ctx.translate(sh.x, sh.y); ctx.rotate(sh.ang || 0);
      ctx.strokeStyle = '#6b4424'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-24, 0); ctx.lineTo(8, 0); ctx.stroke();
      ctx.fillStyle = '#d9d9d9'; ctx.beginPath(); ctx.moveTo(14, 0); ctx.lineTo(4, -5); ctx.lineTo(4, 5); ctx.fill();
      ctx.fillStyle = '#4a7fe0'; ctx.fillRect(-26, -4, 8, 3); ctx.fillRect(-26, 1, 8, 3);
      ctx.restore();
    } else if (sh.k === 'shard') {
      ctx.save(); ctx.translate(sh.x, sh.y); ctx.rotate((sh.ang || 0));
      ctx.shadowColor = '#bfe9ff'; ctx.shadowBlur = 14;
      ctx.fillStyle = '#e8f8ff'; ctx.beginPath(); ctx.moveTo(14, 0); ctx.lineTo(0, -7); ctx.lineTo(-12, 0); ctx.lineTo(0, 7); ctx.fill();
      ctx.restore();
      if (Math.random() < 0.5) this.parts.push({ x: sh.x, y: sh.y, vx: 0, vy: 0, g: 0, life: 0, max: 0.3, size: 4, col: '#cdeeff', kind: 'spark' });
    } else if (sh.k === 'ball') {
      const u = sh.t / sh.T;
      const gy = sh.y0 + (sh.ty - sh.y0) * u;
      ctx.fillStyle = 'rgba(30,20,10,.25)'; ctx.beginPath(); ctx.ellipse(sh.x, gy + 30, 12, 6, 0, 0, Math.PI * 2); ctx.fill();
      const g = ctx.createRadialGradient(sh.x - 4, sh.y - 4, 2, sh.x, sh.y, 14);
      g.addColorStop(0, '#6a6a72'); g.addColorStop(1, '#1d1d22');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(sh.x, sh.y, 13, 0, Math.PI * 2); ctx.fill();
      if (Math.random() < 0.5) this.ember(sh.x, sh.y);
    }
  }
}

export { PAD_R, TOWER_W };
