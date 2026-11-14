// 게임 논리 (화면·소리와 분리). 브라우저와 Node(자동 플레이 봇) 둘 다에서 돈다.
import { TOWERS, towerStats, upgradeCost, MAX_LEVEL, threadCombo, THREAD_RANGE, THREAD_MAX_LEN } from '../data/towers.js';
import { ENEMIES, CHAPTER_HP } from '../data/enemies.js';

export const DT = 1 / 60;

export function rng(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

// 길: 점 목록(world) + 누적 거리
function buildPath(pts) {
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  return { pts, cum, len: cum[cum.length - 1] };
}
export function pathAt(path, d) {
  const { pts, cum } = path;
  if (d <= 0) { const dx = pts[1][0] - pts[0][0], dy = pts[1][1] - pts[0][1], l = Math.hypot(dx, dy) || 1; return [pts[0][0] + dx / l * d, pts[0][1] + dy / l * d, dx / l, dy / l]; }
  let lo = 0, hi = cum.length - 1;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (cum[m] <= d) lo = m; else hi = m; }
  const seg = cum[hi] - cum[lo] || 1, t = Math.min(1, (d - cum[lo]) / seg);
  const dx = pts[hi][0] - pts[lo][0], dy = pts[hi][1] - pts[lo][1];
  return [pts[lo][0] + dx * t, pts[lo][1] + dy * t, dx / seg, dy / seg];
}
function segDist(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy || 1;
  let t = ((px - ax) * dx + (py - ay) * dy) / l2; t = Math.max(0, Math.min(1, t));
  return [Math.hypot(px - ax - dx * t, py - ay - dy * t), t];
}

export function mapGeometry(map, ori) {
  const M = map[ori];
  const a = M.aspect;
  const W = ori === 'v' ? 1000 : 1000 * a, H = ori === 'v' ? 1000 / a : 1000;
  return {
    ori, W, H,
    paths: M.paths.map(p => buildPath(p.map(([x, y]) => [x * W, y * H]))),
    pads: M.pads.map(([x, y]) => [x * W, y * H]),
    gate: [M.gate[0] * W, M.gate[1] * H],
  };
}

export class Game {
  constructor(level, ori = 'v', opt = {}) {
    this.level = level;
    this.rand = rng(opt.seed ?? 12345);
    this.mods = opt.mods || {};          // 공구함 강화(M2)
    this.refGeo = mapGeometry(level.map, 'v');
    this.enemies = []; this.shots = [];
    this.setOrientation(ori);
    this.gold = level.gold;
    this.lives = this.maxLives = level.lives;
    this.wave = -1;                       // 지금 웨이브 번호(0부터). -1 = 시작 전
    this.spawning = [];                   // 남은 출발 예약
    this.waveTime = 0;
    this.betweenT = 0;                    // 다음 웨이브 자동 시작까지 남은 초
    this.started = false;
    this.time = 0;
    this.enemies = []; this.towers = []; this.threads = []; this.shots = [];
    this.spoolsMax = 2 + (this.mods.spools || 0);
    this.spoolCool = [];                  // 끊은 실 다시 쓰기까지 남은 초
    this.events = [];
    this.result = null;
    this.nextId = 1;
    this.stats = { kills: 0, leaked: 0, built: 0, linked: 0, goldSpent: 0 };
  }

  setOrientation(ori) {
    const old = this.geo;
    this.ori = ori;
    this.geo = mapGeometry(this.level.map, ori);
    this.speedScale = this.geo.paths.map((p, i) => p.len / this.refGeo.paths[i].len);
    if (old) for (const e of this.enemies) e.d = e.d / old.paths[e.path].len * this.geo.paths[e.path].len;
    this.shots = [];
    this.updatePositions();
  }

  emit(t, o = {}) { this.events.push({ t, ...o }); }

  // ── 명령 (화면·봇이 부름) ──
  canBuild(pad, type) { return !this.towerAt(pad) && this.gold >= this.cost(type); }
  cost(type) { return Math.round(TOWERS[type].cost * (1 - (this.mods.discount?.[type] || 0))); }
  build(pad, type) {
    if (this.result || !this.canBuild(pad, type)) return null;
    const c = this.cost(type);
    this.gold -= c; this.stats.goldSpent += c; this.stats.built++;
    const t = { id: this.nextId++, pad, type, level: 1, spent: c, cd: 0.3, aim: 1, born: this.time };
    this.towers.push(t);
    this.emit('build', { tower: t });
    return t;
  }
  upgradePrice(t) { return t.level < MAX_LEVEL ? upgradeCost(t.type, t.level) : 0; }
  upgrade(t) {
    const c = this.upgradePrice(t);
    if (this.result || !c || this.gold < c) return false;
    this.gold -= c; t.spent += c; t.level++; this.stats.goldSpent += c;
    t.born = this.time;
    this.emit('upgrade', { tower: t });
    return true;
  }
  sellPrice(t) { return Math.floor(t.spent * 0.7); }
  sell(t) {
    if (this.result) return;
    this.gold += this.sellPrice(t);
    this.threads = this.threads.filter(th => { if (th.a === t || th.b === t) { this.emit('cut', { thread: th, silent: true }); return false; } return true; });
    this.towers = this.towers.filter(x => x !== t);
    this.emit('sell', { tower: t });
  }
  towerAt(pad) { return this.towers.find(t => t.pad === pad); }
  padPos(pad) { return this.geo.pads[pad]; }
  spoolsFree() { return this.spoolsMax - this.threads.length - this.spoolCool.length; }
  threadLen(a, b) { const p = this.padPos(a.pad), q = this.padPos(b.pad); return Math.hypot(p[0] - q[0], p[1] - q[1]); }
  maxThreadLen() { return THREAD_MAX_LEN * (1 + (this.mods.threadLen || 0)); }
  linkCheck(a, b) {
    if (!a || !b || a === b) return 'same';
    if (this.threads.some(th => (th.a === a && th.b === b) || (th.a === b && th.b === a))) return 'dup';
    if (this.threadLen(a, b) > this.maxThreadLen()) return 'far';
    if (this.spoolsFree() <= 0) return 'nospool';
    return 'ok';
  }
  link(a, b) {
    if (this.result || this.linkCheck(a, b) !== 'ok') return null;
    const combo = threadCombo(TOWERS[a.type].elem, TOWERS[b.type].elem);
    const th = { id: this.nextId++, a, b, combo, born: this.time, railT: 0.5, hitCd: new Map() };
    this.threads.push(th); this.stats.linked++;
    this.emit('link', { thread: th });
    return th;
  }
  cut(th) {
    this.threads = this.threads.filter(x => x !== th);
    this.spoolCool.push(4);
    this.emit('cut', { thread: th });
  }
  // 웨이브 부르기 (처음 시작 또는 일찍 부르기)
  canCallWave() { return !this.result && this.wave < this.level.waves.length - 1 && this.spawning.length === 0; }
  earlyBonus() { return this.started && this.betweenT > 0 ? Math.max(0, Math.round(this.betweenT * 1.5)) : 0; }
  callWave() {
    if (!this.canCallWave()) return false;
    const bonus = this.earlyBonus();
    if (bonus) { this.gold += bonus; this.emit('bonus', { gold: bonus }); }
    this.started = true;
    this.wave++;
    this.waveTime = 0;
    this.betweenT = 0;
    const L = this.level;
    for (const g of L.waves[this.wave]) for (let i = 0; i < g.n; i++) this.spawning.push({ at: g.t + i * g.gap, type: g.type, path: g.path });
    this.spawning.sort((a, b) => a.at - b.at);
    this.emit('wave', { n: this.wave + 1, total: L.waves.length });
    return true;
  }

  // ── 한 걸음 (1/60초) ──
  step(dt = DT) {
    if (this.result) return;
    this.time += dt;
    for (let i = this.spoolCool.length - 1; i >= 0; i--) if ((this.spoolCool[i] -= dt) <= 0) this.spoolCool.splice(i, 1);
    if (this.started) {
      this.waveTime += dt;
      while (this.spawning.length && this.spawning[0].at <= this.waveTime) this.spawn(this.spawning.shift());
      if (!this.spawning.length && this.wave < this.level.waves.length - 1) {
        if (this.betweenT <= 0 && this.enemies.length === 0) this.betweenT = 8;
        else if (this.betweenT <= 0 && this.waveTime > 0) this.betweenT = 14;  // 남은 적이 있어도 14초 뒤 다음 웨이브
        this.betweenT -= dt;
        if (this.betweenT <= 0.0001) { this.betweenT = 0; this.callWave(); }
      }
    }
    this.moveEnemies(dt);
    this.threadEffects(dt);
    this.towerAttacks(dt);
    this.moveShots(dt);
    this.cleanup();
    if (this.lives <= 0) { this.lives = 0; this.result = 'lose'; this.emit('lose'); }
    else if (this.started && this.wave === this.level.waves.length - 1 && !this.spawning.length && !this.enemies.length) {
      this.result = 'win';
      this.stars = this.lives >= this.maxLives ? 3 : this.lives >= 12 ? 2 : 1;
      this.emit('win', { stars: this.stars });
    }
  }

  spawn(s) {
    const def = ENEMIES[s.type];
    const hp = def.hp * Math.pow(CHAPTER_HP, this.level.chapter - 1) * (this.level.hpMul || 1);
    const npath = this.geo.paths.length;
    const path = s.path >= 0 ? s.path % npath : (this.nextId % npath);
    const e = { id: this.nextId++, type: s.type, def, hp, maxHp: hp, path, d: -20, lane: (this.rand() - 0.5) * 34,
      slow: 0, slowT: 0, stunT: 0, burnT: 0, burnDps: 0, vulnT: 0, vuln: 1, x: 0, y: 0, dx: 0, dy: 1, alive: true, born: this.time, hitT: -9 };
    this.enemies.push(e);
    this.placeEnemy(e);
  }
  placeEnemy(e) {
    const P = this.geo.paths[e.path];
    const [x, y, dx, dy] = pathAt(P, e.d);
    e.x = x - dy * e.lane; e.y = y + dx * e.lane; e.dx = dx; e.dy = dy;
  }
  updatePositions() { for (const e of this.enemies) this.placeEnemy(e); }
  progress(e) { return e.d / this.geo.paths[e.path].len; }

  moveEnemies(dt) {
    for (const e of this.enemies) {
      if (!e.alive) continue;
      if (e.burnT > 0) { e.burnT -= dt; this.damage(e, e.burnDps * dt, 'magic', null, true); if (!e.alive) continue; }
      if (e.slowT > 0) e.slowT -= dt; else e.slow = 0;
      if (e.vulnT > 0) e.vulnT -= dt; else e.vuln = 1;
      if (e.stunT > 0) { e.stunT -= dt; continue; }
      const sp = e.def.speed * (1 - e.slow) * this.speedScale[e.path];
      e.d += sp * dt;
      if (e.d >= this.geo.paths[e.path].len) {
        e.alive = false; e.leaked = true;
        this.lives -= e.def.lives; this.stats.leaked++;
        this.emit('leak', { enemy: e, lives: e.def.lives });
        continue;
      }
      this.placeEnemy(e);
    }
  }

  damage(e, amt, dtype, src, quiet) {
    if (!e.alive) return 0;
    let a = amt * e.vuln;
    if (dtype === 'phys' && e.def.physResist) a *= 1 - e.def.physResist;
    if (src) a *= this.echoMul(src) * (1 + (this.mods.dmg?.[src.type] || 0));
    e.hp -= a;
    if (!quiet) { e.hitT = this.time; this.emit('hit', { enemy: e, mat: e.def.mat, dtype, amt: a, src }); }
    if (e.hp <= 0) {
      e.alive = false; this.gold += e.def.reward; this.stats.kills++;
      this.emit('kill', { enemy: e, reward: e.def.reward });
    }
    return a;
  }
  echoMul(t) {
    let m = 1;
    for (const th of this.threads) if (th.combo.id === 'echo' && (th.a === t || th.b === t)) m *= 1.3 + 0.1 * (this.threadMul(th) - 1);
    return m;
  }
  threadMul(th) { return (1 + 0.3 * ((th.a.level + th.b.level) / 2 - 1)) * (1 + (this.mods.threadPow || 0)); }

  threadEffects(dt) {
    for (const th of this.threads) {
      const k = th.combo.id;
      if (k === 'echo') continue;
      const p = this.padPos(th.a.pad), q = this.padPos(th.b.pad);
      const mul = this.threadMul(th);
      th.railT -= dt;
      const railFire = k === 'rail' && th.railT <= 0;
      if (railFire) th.railT = 1.1;
      let any = false;
      for (const e of this.enemies) {
        if (!e.alive) continue;
        const [d] = segDist(e.x, e.y, p[0], p[1], q[0], q[1]);
        if (d > THREAD_RANGE + e.def.size * 0.3) continue;
        any = true;
        const cd = th.hitCd.get(e.id) || 0;
        if (k === 'burn') { if (e.burnT <= 0.1) this.emit('thread_fx', { kind: k, x: e.x, y: e.y }); e.burnDps = Math.max(e.burnT > 0 ? e.burnDps : 0, 10 * mul); e.burnT = 2.5; }
        else if (k === 'steam') { e.slow = Math.max(e.slow, 0.3); e.slowT = Math.max(e.slowT, 1); e.vuln = 1.25 + 0.05 * (mul - 1); e.vulnT = 1.2; }
        else if (k === 'chill') { e.slow = Math.max(e.slow, Math.min(0.6, 0.42 * mul)); e.slowT = Math.max(e.slowT, 1); }
        else if (k === 'stun' && this.time >= cd) { e.stunT = 0.7; th.hitCd.set(e.id, this.time + 2.5); this.damage(e, 18 * mul, 'magic'); this.emit('thread_fx', { kind: k, x: e.x, y: e.y }); }
        else if (k === 'spark' && this.time >= cd) { th.hitCd.set(e.id, this.time + 2.2); this.damage(e, 34 * mul, 'magic'); this.emit('thread_fx', { kind: k, x: e.x, y: e.y }); }
        else if (railFire) { this.damage(e, 22 * mul, 'magic'); }
      }
      if (railFire && any) this.emit('thread_fx', { kind: 'rail', thread: th });
      else if (railFire) th.railT = 0.15; // 적이 없으면 곧 다시 살핀다
    }
  }

  towerTop(t) { const p = this.padPos(t.pad); return [p[0], p[1] - TOWERS[t.type].h * 0.75]; }
  towerAttacks(dt) {
    for (const t of this.towers) {
      t.cd -= dt;
      if (t.cd > 0) continue;
      const s = towerStats(t.type, t.level);
      const range = s.range * (1 + (this.mods.range?.[t.type] || 0));
      const [px, py] = this.padPos(t.pad);
      let best = null, bp = -1;
      for (const e of this.enemies) {
        if (!e.alive || e.d < 0) continue;
        if ((e.x - px) ** 2 + (e.y - py) ** 2 > range * range) continue;
        const pr = this.progress(e);
        if (pr > bp) { bp = pr; best = e; }
      }
      if (!best) { t.cd = 0.05; continue; }
      t.cd = s.rate;
      t.aim = best.x < px ? -1 : 1;
      { const [tx0, ty0] = this.towerTop(t); t.ang = Math.atan2(best.y - best.def.size * 0.4 - ty0, best.x - tx0); }
      const [ox, oy] = this.towerTop(t);
      const nShots = this.shots.length;
      if (s.proj === 'arrow') this.shots.push({ k: 'arrow', x: ox, y: oy, tgt: best, sp: 950, dmg: s.dmg, src: t, dtype: s.dtype });
      else if (s.proj === 'shard') this.shots.push({ k: 'shard', x: ox, y: oy, tgt: best, sp: 620, dmg: s.dmg, src: t, slow: s.slow, slowDur: s.slowDur, dtype: s.dtype });
      else if (s.proj === 'ball') {
        const T = 0.55;
        const sp = best.def.speed * (1 - best.slow) * this.speedScale[best.path];
        const fut = pathAt(this.geo.paths[best.path], best.stunT > 0 ? best.d : best.d + sp * T);
        this.shots.push({ k: 'ball', x0: ox, y0: oy, tx: fut[0], ty: fut[1], t: 0, T, dmg: s.dmg, splash: s.splash, src: t, x: ox, y: oy, dtype: s.dtype });
      } else if (s.proj === 'bolt') {
        const hit = [best]; let cur = best, dmg = s.dmg;
        const pts = [[ox, oy], [best.x, best.y - best.def.size * 0.4]];
        this.damage(best, dmg, 'magic', t);
        for (let i = 1; i < s.chain; i++) {
          let nb = null, nd = 140 * 140;
          for (const e of this.enemies) {
            if (!e.alive || hit.includes(e)) continue;
            const d2 = (e.x - cur.x) ** 2 + (e.y - cur.y) ** 2;
            if (d2 < nd) { nd = d2; nb = e; }
          }
          if (!nb) break;
          dmg *= 0.85; hit.push(nb); cur = nb;
          pts.push([nb.x, nb.y - nb.def.size * 0.4]);
          this.damage(nb, dmg, 'magic', t);
        }
        this.emit('bolt', { pts, tower: t });
      }
      this.emit('shoot', { tower: t, target: best, shot: this.shots.length > nShots ? this.shots[this.shots.length - 1] : null });
    }
  }

  moveShots(dt) {
    for (const s of this.shots) {
      if (s.k === 'ball') {
        s.t += dt;
        const u = Math.min(1, s.t / s.T);
        s.x = s.x0 + (s.tx - s.x0) * u; s.y = s.y0 + (s.ty - s.y0) * u - Math.sin(u * Math.PI) * 140;
        if (u >= 1) {
          s.done = true;
          let n = 0;
          for (const e of this.enemies) if (e.alive && (e.x - s.tx) ** 2 + (e.y - s.ty) ** 2 < s.splash * s.splash) { this.damage(e, s.dmg, s.dtype, s.src); n++; }
          this.emit('boom', { x: s.tx, y: s.ty, r: s.splash, n });
        }
        continue;
      }
      const e = s.tgt;
      const tx = e.x, ty = e.y - e.def.size * 0.4;
      const dx = tx - s.x, dy = ty - s.y, d = Math.hypot(dx, dy);
      s.ang = Math.atan2(dy, dx);
      if (d < s.sp * dt + 8) {
        s.done = true;
        if (e.alive) {
          this.damage(e, s.dmg, s.dtype, s.src);
          if (s.k === 'shard' && e.alive) { e.slow = Math.max(e.slow, s.slow); e.slowT = Math.max(e.slowT, s.slowDur); }
        }
      } else if (!e.alive) {
        // 과녁이 사라지면 그 자리까지 날아가 사라진다
        s.x += dx / d * s.sp * dt; s.y += dy / d * s.sp * dt;
        if (d < 30) s.done = true;
      } else { s.x += dx / d * s.sp * dt; s.y += dy / d * s.sp * dt; }
    }
  }
  cleanup() {
    if (this.enemies.some(e => !e.alive)) this.enemies = this.enemies.filter(e => e.alive);
    if (this.shots.some(s => s.done)) this.shots = this.shots.filter(s => !s.done);
    for (const th of this.threads) if (th.hitCd.size > 64) for (const [id] of th.hitCd) if (!this.enemies.some(e => e.id === id)) th.hitCd.delete(id);
  }
}
