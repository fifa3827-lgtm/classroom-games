// 게임 논리 (화면·소리와 분리). 브라우저와 Node(자동 플레이 봇) 둘 다에서 돈다.
import { TOWERS, towerStats, upgradeCost, MAX_LEVEL, threadCombo, THREAD_RANGE, THREAD_MAX_LEN, BRANCH_CH, SKILLS } from '../data/towers.js';
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
function segInter(a, b, c, d) {
  const o = (p, q, r) => Math.sign((q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]));
  return o(a, b, c) !== o(a, b, d) && o(c, d, a) !== o(c, d, b);
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
  const paths = M.paths.map(p => buildPath(p.map(([x, y]) => [x * W, y * H])));
  return {
    ori, W, H, paths,
    // 나는 적의 길: 길 들머리에서 끝(성문)까지 곧장
    fly: paths.map(P => buildPath([P.pts[0], P.pts[P.pts.length - 1]])),
    pads: M.pads.map(([x, y]) => [x * W, y * H]),
    gate: [M.gate[0] * W, M.gate[1] * H],
  };
}

const SOLDIER_RESPAWN = 8;
const BLOCK_R = 46;        // 병사가 적을 붙잡는 거리
const SOLDIER_SEE = 95;    // 병사가 적을 알아보는 거리(자기 자리에서)

export class Game {
  constructor(level, ori = 'v', opt = {}) {
    this.level = level;
    this.rand = rng(opt.seed ?? 12345);
    this.mods = opt.mods || {};          // 공구함 강화
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
    this.spoolsBase = 2 + (this.mods.spools || 0);
    this.spoolsMax = this.spoolsBase;
    this.spoolCool = [];                  // 끊은 실 다시 쓰기까지 남은 초
    this.skillCd = { needles: 0, rewind: 0 };
    this.pending = [];                    // 늦게 터지는 일(바늘비)
    this.events = [];
    this.result = null;
    this.nextId = 1;
    this.stats = { kills: 0, leaked: 0, built: 0, linked: 0, goldSpent: 0, skills: 0 };
  }

  setOrientation(ori) {
    const old = this.geo;
    this.ori = ori;
    this.geo = mapGeometry(this.level.map, ori);
    this.speedScale = this.geo.paths.map((p, i) => p.len / this.refGeo.paths[i].len);
    this.flyScale = this.geo.fly.map((p, i) => p.len / this.refGeo.fly[i].len);
    if (old) for (const e of this.enemies) e.d = e.d / this.pathOf(e, old).len * this.pathOf(e).len;
    this.shots = [];
    this.updatePositions();
    if (this.threads) for (const th of this.threads) th.crosses = this.threadCrosses(th.a, th.b);
    if (this.towers) for (const t of this.towers) if (t.type === 'barracks') this.placeRally(t);
  }
  pathOf(e, geo = this.geo) { return e.def.fly ? geo.fly[e.path] : geo.paths[e.path]; }

  emit(t, o = {}) { this.events.push({ t, ...o }); }

  // ── 명령 (화면·봇이 부름) ──
  towerAllowed(type) { return !!TOWERS[type] && (this.level.allTowers || TOWERS[type].ch <= this.level.chapter); }
  canBuild(pad, type) { return this.towerAllowed(type) && !this.towerAt(pad) && this.gold >= this.cost(type); }
  cost(type) { return Math.round(TOWERS[type].cost * (1 - (this.mods.discount?.[type] || 0))); }
  build(pad, type) {
    if (this.result || !this.canBuild(pad, type)) return null;
    const c = this.cost(type);
    this.gold -= c; this.stats.goldSpent += c; this.stats.built++;
    const t = { id: this.nextId++, pad, type, level: 1, spent: c, cd: 0.3, aim: 1, born: this.time, stunT: 0, hits: 0 };
    this.towers.push(t);
    if (type === 'barracks') { t.soldiers = []; this.placeRally(t); this.fillSoldiers(t, true); }
    this.emit('build', { tower: t });
    return t;
  }
  stats4(t) { return towerStats(t.type, t.level, t.branch); }
  rangeOf(t) { return this.stats4(t).range * (1 + (this.mods.range?.[t.type] || 0)); }
  upgradePrice(t) { return t.level < MAX_LEVEL ? upgradeCost(t.type, t.level) : 0; }
  upgrade(t) {
    const c = this.upgradePrice(t);
    if (this.result || !c || this.gold < c) return false;
    this.gold -= c; t.spent += c; t.level++; this.stats.goldSpent += c;
    t.born = this.time;
    if (t.type === 'barracks') this.fillSoldiers(t, false);
    this.emit('upgrade', { tower: t });
    return true;
  }
  // 4단계 갈래
  branchOpen() { return !!this.level.branches || this.level.chapter >= BRANCH_CH; }
  branchPrice(t) { return t.level === MAX_LEVEL ? upgradeCost(t.type, MAX_LEVEL) : 0; }
  canBranch(t) { return !this.result && this.branchOpen() && t.level === MAX_LEVEL && this.gold >= this.branchPrice(t); }
  branch(t, which) {
    if (!this.canBranch(t) || (which !== 'a' && which !== 'b')) return false;
    const c = this.branchPrice(t);
    this.gold -= c; t.spent += c; t.level = 4; t.branch = which; this.stats.goldSpent += c;
    t.born = this.time;
    if (t.type === 'barracks') this.fillSoldiers(t, false);
    this.emit('upgrade', { tower: t, branch: which });
    return true;
  }
  sellPrice(t) { return Math.floor(t.spent * 0.7); }
  sell(t) {
    if (this.result) return;
    this.gold += this.sellPrice(t);
    this.threads = this.threads.filter(th => { if (th.a === t || th.b === t) { this.emit('cut', { thread: th, silent: true }); return false; } return true; });
    this.towers = this.towers.filter(x => x !== t);
    if (t.soldiers) for (const s of t.soldiers) this.release(s);
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
  // 실이 길을 가로지르는가(실 밑 땅 선에서 THREAD_RANGE 안에 길이 지나가는가)
  threadCrosses(a, b) {
    const p = this.padPos(a.pad), q = this.padPos(b.pad);
    for (const P of this.geo.paths) for (const [x, y] of P.pts) if (segDist(x, y, p[0], p[1], q[0], q[1])[0] < THREAD_RANGE + 20) return true;
    // 점 사이가 성기므로 길 선분끼리도 본다
    for (const P of this.geo.paths) for (let i = 1; i < P.pts.length; i++) if (segInter(P.pts[i - 1], P.pts[i], p, q)) return true;
    return false;
  }
  // 이 탑과 실로 이어진 상대 탑들의 속성
  partners(t) { const r = []; for (const th of this.threads) { if (th.a === t) r.push([th.b, th]); else if (th.b === t) r.push([th.a, th]); } return r; }
  link(a, b) {
    if (this.result || this.linkCheck(a, b) !== 'ok') return null;
    const combo = threadCombo(TOWERS[a.type].elem, TOWERS[b.type].elem);
    const th = { id: this.nextId++, a, b, combo, born: this.time, railT: 0.5, hitCd: new Map(), crosses: this.threadCrosses(a, b) };
    this.threads.push(th); this.stats.linked++;
    this.emit('link', { thread: th });
    return th;
  }
  cut(th, by) {
    if (!this.threads.includes(th)) return;
    this.threads = this.threads.filter(x => x !== th);
    this.spoolCool.push(4);
    this.emit('cut', { thread: th, by });
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

  // ── 손 기술 ──
  skillLv(k) { return this.mods.skill?.[k] || 0; }
  skillInfo(k) {
    const S = SKILLS[k], lv = this.skillLv(k);
    return { cd: S.cd * (1 - 0.15 * lv), r: S.r * (1 + 0.12 * lv), dmg: (S.dmg || 0) * (1 + 0.4 * lv), back: (S.back || 0) * (1 + 0.25 * lv) };
  }
  skillReady(k) { return !this.result && this.skillCd[k] <= 0; }
  useSkill(k, x, y) {
    if (!SKILLS[k] || !this.skillReady(k)) return false;
    const I = this.skillInfo(k);
    this.skillCd[k] = I.cd; this.skillMax = this.skillMax || {}; this.skillMax[k] = I.cd;
    this.stats.skills++;
    this.emit('skill', { k, x, y, r: I.r });
    if (k === 'needles') {
      this.pending.push({ at: this.time + 0.35, fn: () => {
        let n = 0;
        for (const e of this.enemies) if (e.alive && !e.hidden && (e.x - x) ** 2 + ((e.y - y) * 1.25) ** 2 < I.r * I.r) { this.damage(e, I.dmg, 'phys'); n++; }
        this.emit('needles_hit', { x, y, r: I.r, n });
      } });
    } else if (k === 'rewind') {
      for (const e of this.enemies) {
        if (!e.alive || e.d < 0 || (e.x - x) ** 2 + ((e.y - y) * 1.25) ** 2 > I.r * I.r) continue;
        const fx = e.x, fy = e.y;
        const back = I.back * (e.def.elite ? 0.45 : 1);
        e.d = Math.max(-10, e.d - back);
        if (e.blocked) this.release(e.blocked);
        this.placeEnemy(e);
        this.emit('rewound', { enemy: e, fx, fy });
      }
    }
    return true;
  }

  // ── 한 걸음 (1/60초) ──
  step(dt = DT) {
    if (this.result) return;
    this.time += dt;
    for (let i = this.spoolCool.length - 1; i >= 0; i--) if ((this.spoolCool[i] -= dt) <= 0) this.spoolCool.splice(i, 1);
    for (const k in this.skillCd) if (this.skillCd[k] > 0) this.skillCd[k] = Math.max(0, this.skillCd[k] - dt);
    if (this.pending.length) for (let i = this.pending.length - 1; i >= 0; i--) if (this.pending[i].at <= this.time) { const p = this.pending[i]; this.pending.splice(i, 1); p.fn(); }
    let extra = 0;
    for (const t of this.towers) if (t.branch === 'b' && t.type === 'bell') extra += 1;
    this.spoolsMax = this.spoolsBase + extra;
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
    this.enemyAbilities(dt);
    this.moveEnemies(dt);
    this.threadEffects(dt);
    this.soldierStep(dt);
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

  hpFor(type) { return ENEMIES[type].hp * Math.pow(CHAPTER_HP, this.level.chapter - 1) * (this.level.hpMul || 1); }
  spawn(s) {
    const def = ENEMIES[s.type];
    const hp = this.hpFor(s.type);
    const npath = this.geo.paths.length;
    const path = s.path >= 0 ? s.path % npath : (this.nextId % npath);
    const e = this.newEnemy(s.type, def, hp, path, -20, (this.rand() - 0.5) * 34);
    this.enemies.push(e);
    this.placeEnemy(e);
    return e;
  }
  newEnemy(type, def, hp, path, d, lane) {
    return { id: this.nextId++, type, def, hp, maxHp: hp, path, d, lane,
      slow: 0, slowT: 0, stunT: 0, burnT: 0, burnDps: 0, vulnT: 0, vuln: 1, poisonT: 0, poisonDps: 0, meltT: 0,
      x: 0, y: 0, dx: 0, dy: 1, alive: true, born: this.time, hitT: -9,
      hidden: false, seen: !def.ghost, haste: 1, wind: 1, windT: 0, pauseT: 0, abT: 0, cutCd: 0, shedNext: 1 - (def.shed || 0), blocked: null };
  }
  // 죽은 자리에서 작은 적이 나옴(갈라지는 방울·골렘)
  spawnChild(parent, type, k) {
    const def = ENEMIES[type];
    const e = this.newEnemy(type, def, this.hpFor(type), parent.path, Math.max(0, parent.d + (k - 0.5) * 24), parent.lane + (k - 0.5) * 30);
    e.born = this.time; e.child = true;
    this.enemies.push(e);
    this.placeEnemy(e);
    this.emit('child', { enemy: e, from: parent });
    return e;
  }
  placeEnemy(e) {
    const P = this.pathOf(e);
    const [x, y, dx, dy] = pathAt(P, e.d);
    e.x = x - dy * e.lane; e.y = y + dx * e.lane; e.dx = dx; e.dy = dy;
  }
  updatePositions() { for (const e of this.enemies) this.placeEnemy(e); }
  progress(e) { return e.d / this.pathOf(e).len; }

  slowE(e, amt, dur) { if (e.def.frostImmune) return; e.slow = Math.max(e.slow, amt); e.slowT = Math.max(e.slowT, dur); }
  stunE(e, dur, frost) { if (frost && e.def.frostImmune) return; e.stunT = Math.max(e.stunT, e.def.elite ? dur * 0.5 : dur); }
  poisonE(e, dps, dur) { e.poisonDps = Math.max(e.poisonT > 0 ? e.poisonDps : 0, dps); e.poisonT = Math.max(e.poisonT, dur); }

  // 적의 특수 능력 (움직이기 전에)
  enemyAbilities(dt) {
    const bells = this.towers.filter(t => t.type === 'bell');
    for (const e of this.enemies) e.haste = 1;
    for (const e of this.enemies) {
      if (!e.alive) continue;
      const D = e.def;
      if (D.ghost) e.seen = bells.some(b => { const p = this.padPos(b.pad), r = this.rangeOf(b); return (e.x - p[0]) ** 2 + (e.y - p[1]) ** 2 < r * r; });
      if (D.burrow && e.d > 0) {
        e.abT += dt;
        const [up, down] = D.burrow, cyc = e.abT % (up + down);
        const h = cyc >= up;
        if (h !== e.hidden) { e.hidden = h; if (h && e.blocked) this.release(e.blocked); this.emit(h ? 'burrow' : 'unburrow', { enemy: e }); }
      }
      if (D.heal) {
        e.abT += dt;
        const [r, pct, every] = D.heal;
        if (e.abT >= every) {
          e.abT -= every;
          let n = 0;
          for (const o of this.enemies) if (o !== e && o.alive && o.hp < o.maxHp && (o.x - e.x) ** 2 + (o.y - e.y) ** 2 < r * r) { o.hp = Math.min(o.maxHp, o.hp + o.maxHp * pct); n++; this.emit('healed', { enemy: o }); }
          if (n) this.emit('heal', { enemy: e, r });
        }
      }
      if (D.haste) { const [r, k] = D.haste; for (const o of this.enemies) if (o !== e && o.alive && (o.x - e.x) ** 2 + (o.y - e.y) ** 2 < r * r) o.haste = Math.max(o.haste, k); }
      if (D.windup) {
        const [every, add, cap] = D.windup;
        if (e.pauseT > 0) { e.pauseT -= dt; if (e.pauseT <= 0) { e.wind = Math.min(cap, e.wind + add); this.emit('windup', { enemy: e }); } }
        else if ((e.windT += dt) >= every) { e.windT = 0; e.pauseT = 0.5; }
      }
      if (D.stunTowers && e.d > 0) {
        e.abT += dt;
        const [r, dur, every] = D.stunTowers;
        if (e.abT >= every) {
          e.abT -= every;
          const hit = [];
          for (const t of this.towers) { const p = this.padPos(t.pad); if ((p[0] - e.x) ** 2 + (p[1] - e.y) ** 2 < r * r) { t.stunT = Math.max(t.stunT || 0, dur); hit.push(t); } }
          this.emit('towerstun', { enemy: e, r, towers: hit });
        }
      }
      if ((D.cutter || D.inkCut) && e.d > 0 && !e.hidden) {
        if (e.cutCd > 0) e.cutCd -= dt;
        else for (const th of this.threads) {
          if (!th.crosses) continue;
          const p = this.padPos(th.a.pad), q = this.padPos(th.b.pad);
          if (segDist(e.x, e.y, p[0], p[1], q[0], q[1])[0] < THREAD_RANGE + 6) {
            this.emit('enemycut', { enemy: e, thread: th, ink: !!D.inkCut });
            this.cut(th, D.inkCut ? 'ink' : 'scissor');
            e.cutCd = D.inkCut ? 2 : 5;
            break;
          }
        }
      }
    }
  }

  moveEnemies(dt) {
    for (const e of this.enemies) {
      if (!e.alive) continue;
      if (e.burnT > 0) { e.burnT -= dt; this.damage(e, e.burnDps * dt, 'magic', null, true); if (!e.alive) continue; }
      if (e.poisonT > 0) { e.poisonT -= dt; this.damage(e, e.poisonDps * dt, 'poison', null, true); if (!e.alive) continue; }
      if (e.meltT > 0) e.meltT -= dt;
      if (e.slowT > 0) e.slowT -= dt; else e.slow = 0;
      if (e.vulnT > 0) e.vulnT -= dt; else e.vuln = 1;
      if (e.stunT > 0) { e.stunT -= dt; continue; }
      if (e.blocked || e.pauseT > 0) continue;
      const sp = e.def.speed * (1 - e.slow) * e.haste * e.wind * (e.def.fly ? this.flyScale[e.path] : this.speedScale[e.path]);
      e.d += sp * dt;
      if (e.d >= this.pathOf(e).len) {
        e.alive = false; e.leaked = true;
        this.lives -= e.def.lives; this.stats.leaked++;
        this.emit('leak', { enemy: e, lives: e.def.lives });
        continue;
      }
      this.placeEnemy(e);
    }
  }

  damage(e, amt, dtype, src, quiet) {
    if (!e.alive || e.hidden) return 0;
    let a = amt * e.vuln * (e.meltT > 0 ? 1.3 : 1);
    if (dtype === 'phys' && e.def.physResist && !(e.meltT > 0)) a *= 1 - e.def.physResist;
    let infuse = null;
    if (src) {
      a *= this.echoMul(src) * (1 + (this.mods.dmg?.[src.type] || 0));
      infuse = this.partners(src);
      for (const [o, th] of infuse) {
        if (TOWERS[o.type].elem === 'pierce' && TOWERS[src.type].elem !== 'pierce') a *= 1.2;
        if (th.combo.id === 'amp') a *= 1.4;
      }
    }
    e.hp -= a;
    // 실로 나눠 받은 속성: 맞은 적에게 상대 탑의 힘이 섞여 들어간다
    if (infuse && !quiet && e.hp > 0) for (const [o, th] of infuse) {
      const el = TOWERS[o.type].elem, mul = this.threadMul(th);
      if (el === TOWERS[src.type].elem) continue;
      if (el === 'fire') { e.burnDps = Math.max(e.burnT > 0 ? e.burnDps : 0, 4 * mul); e.burnT = Math.max(e.burnT, 2); }
      else if (el === 'frost') this.slowE(e, 0.22, 1);
      else if (el === 'shock' && this.rand() < 0.2) { this.stunE(e, 0.25); this.emit('thread_fx', { kind: 'stun_small', x: e.x, y: e.y }); }
      else if (el === 'poison') this.poisonE(e, 3 * mul, 2);
      else if (el === 'bind' && this.rand() < 0.1) { this.stunE(e, 0.4); this.emit('thread_fx', { kind: 'snare_small', x: e.x, y: e.y }); }
    }
    if (!quiet) { e.hitT = this.time; this.emit('hit', { enemy: e, mat: e.def.mat, dtype, amt: a, src }); }
    // 골렘: 맞을수록 작은 방울을 흘림
    if (e.def.shed && e.hp > 0) while (e.hp / e.maxHp < e.shedNext) { e.shedNext -= e.def.shed; this.spawnChild(e, 'mini', this.rand()); }
    if (e.hp <= 0) {
      e.alive = false; this.gold += e.def.reward; this.stats.kills++;
      if (e.blocked) this.release(e.blocked);
      this.emit('kill', { enemy: e, reward: e.def.reward });
      if (e.def.split) for (let i = 0; i < e.def.split; i++) this.spawnChild(e, 'mini', i / Math.max(1, e.def.split - 1));
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
        if (!e.alive || e.def.fly || e.hidden) continue;
        const [d] = segDist(e.x, e.y, p[0], p[1], q[0], q[1]);
        if (d > THREAD_RANGE + e.def.size * 0.3) continue;
        any = true;
        const cd = th.hitCd.get(e.id) || 0;
        if (k === 'burn') { if (e.burnT <= 0.1) this.emit('thread_fx', { kind: k, x: e.x, y: e.y }); e.burnDps = Math.max(e.burnT > 0 ? e.burnDps : 0, 10 * mul); e.burnT = 2.5; }
        else if (k === 'steam') { this.slowE(e, 0.3, 1); e.vuln = 1.25 + 0.05 * (mul - 1); e.vulnT = 1.2; }
        else if (k === 'chill') this.slowE(e, Math.min(0.6, 0.42 * mul), 1);
        else if (k === 'stun' && this.time >= cd) { this.stunE(e, 0.7, true); th.hitCd.set(e.id, this.time + 2.5); this.damage(e, 18 * mul, 'magic'); this.emit('thread_fx', { kind: k, x: e.x, y: e.y }); }
        else if (k === 'spark' && this.time >= cd) { th.hitCd.set(e.id, this.time + 2.2); this.damage(e, 34 * mul, 'magic'); this.emit('thread_fx', { kind: k, x: e.x, y: e.y }); }
        else if (k === 'snare' && this.time >= cd) { this.stunE(e, 0.8); th.hitCd.set(e.id, this.time + 3); this.emit('thread_fx', { kind: k, x: e.x, y: e.y }); }
        else if (k === 'amp') { e.vuln = Math.max(e.vuln, 1.15); e.vulnT = Math.max(e.vulnT, 0.6); }
        else if (k === 'smoke') { if (e.poisonT <= 0.1) this.emit('thread_fx', { kind: k, x: e.x, y: e.y }); this.poisonE(e, 9 * mul, 2.5); }
        else if (k === 'venom') { this.poisonE(e, 7 * mul, 2.5); e.meltT = Math.max(e.meltT, 1); }
        else if (railFire) { this.damage(e, 22 * mul, 'magic'); }
      }
      // 독연기: 실 둘레로 퍼지는 구름 (넓게)
      if (k === 'smoke') for (const e of this.enemies) {
        if (!e.alive || e.def.fly || e.hidden) continue;
        const [d] = segDist(e.x, e.y, p[0], p[1], q[0], q[1]);
        if (d <= THREAD_RANGE * 2.6 && d > THREAD_RANGE + e.def.size * 0.3) this.poisonE(e, 5 * mul, 1.5);
      }
      if (railFire && any) this.emit('thread_fx', { kind: 'rail', thread: th });
      else if (railFire) th.railT = 0.15; // 적이 없으면 곧 다시 살핀다
    }
  }

  // ── 골무 병영 병사 ──
  // 집결지: 병영에서 가장 가까운 길 위 지점(사거리 안)
  placeRally(t) {
    const [px, py] = this.padPos(t.pad);
    let best = null, bd = 1e18;
    this.geo.paths.forEach((P, pi) => {
      for (let d = 0; d <= P.len; d += 10) {
        const q = pathAt(P, d), dd = (q[0] - px) ** 2 + (q[1] - py) ** 2;
        if (dd < bd) { bd = dd; best = [pi, d, q]; }
      }
    });
    t.rally = best ? { path: best[0], d: best[1], x: best[2][0], y: best[2][1], dx: best[2][2], dy: best[2][3] } : null;
    if (t.soldiers) t.soldiers.forEach((s, i) => this.postSoldier(t, s, i));
  }
  postSoldier(t, s, i) {
    const R = t.rally; if (!R) return;
    const n = t.soldiers.length, off = (i - (n - 1) / 2) * 34;
    // 길을 가로로 막아 선다
    s.hx = R.x - R.dy * off; s.hy = R.y + R.dx * off;
    if (!s.target) { s.x = s.hx; s.y = s.hy; }
  }
  fillSoldiers(t, fresh) {
    const S = this.stats4(t);
    while (t.soldiers.length < S.soldiers) t.soldiers.push({ id: this.nextId++, hp: S.sHp, maxHp: S.sHp, dead: 0, cd: 0.4, target: null, x: 0, y: 0, ang: Math.PI / 2, tower: t });
    for (const s of t.soldiers) { const k = s.hp / s.maxHp; s.maxHp = S.sHp; s.hp = s.dead > 0 ? 0 : (fresh ? S.sHp : Math.max(k * S.sHp, S.sHp * 0.5)); }
    t.soldiers.forEach((s, i) => this.postSoldier(t, s, i));
  }
  release(s) { if (s.target) { s.target.blocked = null; s.target = null; } }
  soldierStep(dt) {
    for (const t of this.towers) {
      if (t.type !== 'barracks' || !t.rally) continue;
      const S = this.stats4(t);
      t.soldiers.forEach((s, i) => {
        if (s.dead > 0) {
          if ((s.dead -= dt) <= 0) { s.dead = 0; s.hp = s.maxHp; this.postSoldier(t, s, i); s.x = s.hx; s.y = s.hy; this.emit('soldier_up', { soldier: s, tower: t }); }
          return;
        }
        if (s.target && (!s.target.alive || s.target.hidden || s.target.blocked !== s)) { s.target = null; }
        if (!s.target) {
          // 붙잡히지 않은 가까운 땅 위 적
          let best = null, bd = SOLDIER_SEE * SOLDIER_SEE;
          for (const e of this.enemies) {
            if (!e.alive || e.def.fly || e.hidden || !e.seen || e.blocked || e.d < 0) continue;
            const d2 = (e.x - s.hx) ** 2 + (e.y - s.hy) ** 2;
            if (d2 < bd) { bd = d2; best = e; }
          }
          if (best) { s.target = best; best.blocked = s; }
          else { s.x += (s.hx - s.x) * Math.min(1, dt * 6); s.y += (s.hy - s.y) * Math.min(1, dt * 6); }
        }
        const e = s.target;
        if (e) {
          s.ang = Math.atan2(e.y - s.y, e.x - s.x);
          const d = Math.hypot(e.x - s.x, e.y - s.y);
          if (d > BLOCK_R * 0.8) { const m = Math.min(d - BLOCK_R * 0.7, 160 * dt); s.x += (e.x - s.x) / d * m; s.y += (e.y - s.y) / d * m; }
          if ((s.cd -= dt) <= 0) {
            s.cd = S.sRate;
            const dmg = S.dmg * (S.antiElite && e.def.elite ? S.antiElite : 1);
            this.damage(e, dmg, 'phys', t);
            this.emit('soldier_hit', { soldier: s, enemy: e });
          }
          // 적도 병사를 친다
          if (e.alive) {
            s.hp -= (3 + e.def.hp * 0.03) * dt;
            if (s.hp <= 0) { this.release(s); s.dead = SOLDIER_RESPAWN; this.emit('soldier_die', { soldier: s, tower: t }); }
          }
        }
      });
    }
  }

  towerTop(t) { const p = this.padPos(t.pad); return [p[0], p[1] - TOWERS[t.type].h * 0.75]; }
  // 종탑 기운: 둘레 탑의 공격 속도
  auraFor(t) {
    let a = 0;
    const [px, py] = this.padPos(t.pad);
    for (const b of this.towers) {
      if (b.type !== 'bell' || b === t) continue;
      const S = this.stats4(b), p = this.padPos(b.pad), R = this.rangeOf(b);
      const linked = this.threads.some(th => th.combo.id === 'amp' && ((th.a === b && th.b === t) || (th.b === b && th.a === t)));
      if (linked || (px - p[0]) ** 2 + (py - p[1]) ** 2 < R * R) a = Math.max(a, S.aura * (linked ? 1.5 : 1));
    }
    return a;
  }
  canTarget(e, s) {
    if (!e.alive || e.d < 0 || e.hidden || !e.seen) return false;
    if (e.def.fly && s.ground) return false;
    return true;
  }
  towerAttacks(dt) {
    for (const t of this.towers) {
      if (t.stunT > 0) { t.stunT -= dt; continue; }
      if (t.type === 'bell' || t.type === 'barracks') continue;
      t.cd -= dt;
      if (t.cd > 0) continue;
      const s = this.stats4(t);
      const range = this.rangeOf(t);
      const [px, py] = this.padPos(t.pad);
      let best = null, bp = -1;
      for (const e of this.enemies) {
        if (!this.canTarget(e, s)) continue;
        if ((e.x - px) ** 2 + (e.y - py) ** 2 > range * range) continue;
        const pr = s.snipe ? e.hp : this.progress(e);
        if (pr > bp) { bp = pr; best = e; }
      }
      if (!best) { t.cd = 0.05; continue; }
      t.cd = s.rate / (1 + this.auraFor(t));
      t.aim = best.x < px ? -1 : 1;
      { const [tx0, ty0] = this.towerTop(t); t.ang = Math.atan2(best.y - best.def.size * 0.4 - ty0, best.x - tx0); }
      const [ox, oy] = this.towerTop(t);
      const nShots = this.shots.length;
      const air = s.antiAir && best.def.fly ? s.antiAir : 1;
      if (s.proj === 'arrow') this.shots.push({ k: 'arrow', x: ox, y: oy, tgt: best, sp: 950, dmg: s.dmg * air, src: t, dtype: s.dtype });
      else if (s.proj === 'shard') {
        if (s.blizzard) {
          // 눈보라: 사거리 안 모두
          for (const e of this.enemies) if (this.canTarget(e, s) && (e.x - px) ** 2 + (e.y - py) ** 2 <= range * range) { this.damage(e, s.dmg, s.dtype, t); if (e.alive) this.slowE(e, s.slow, s.slowDur); }
          this.emit('blizzard', { tower: t, r: range });
        } else {
          t.hits = (t.hits || 0) + 1;
          const freeze = s.freezeEvery && t.hits % s.freezeEvery === 0;
          this.shots.push({ k: 'shard', x: ox, y: oy, tgt: best, sp: 620, dmg: s.dmg, src: t, slow: s.slow, slowDur: s.slowDur, dtype: s.dtype, freeze });
        }
      }
      else if (s.proj === 'ball' || s.proj === 'glob') {
        const T = s.proj === 'glob' ? 0.5 : 0.55 * (s.branch === 'a' && t.type === 'cannon' ? 1.4 : 1);
        const sp = best.def.speed * (1 - best.slow) * best.haste * best.wind * this.speedScale[best.path];
        const fut = pathAt(this.geo.paths[best.path], best.stunT > 0 || best.blocked ? best.d : best.d + sp * T);
        this.shots.push({ k: s.proj, x0: ox, y0: oy, tx: fut[0], ty: fut[1], t: 0, T, dmg: s.dmg, splash: s.proj === 'glob' ? (s.spread || s.splash) : s.splash,
          src: t, x: ox, y: oy, dtype: s.dtype, dot: s.dot, dotDur: s.dotDur, melt: s.melt, fireDot: s.fireDot });
      } else if (s.proj === 'needle') {
        const snipe = s.snipe && best.def.elite ? s.snipe : 1;
        const tx = best.x, ty = best.y - best.def.size * 0.4, l = Math.hypot(tx - ox, ty - oy) || 1;
        this.shots.push({ k: 'needle', x: ox, y: oy, vx: (tx - ox) / l, vy: (ty - oy) / l, sp: 1500, left: range + 120, dmg: s.dmg * snipe, src: t, dtype: s.dtype,
          pierce: s.pierceAll ? 99 : s.pierceN, hit: new Set(), tgt: best, ang: Math.atan2(ty - oy, tx - ox) });
      } else if (s.proj === 'bolt') {
        const hit = [best]; let cur = best, dmg = s.dmg;
        const pts = [[ox, oy], [best.x, best.y - best.def.size * 0.4]];
        this.damage(best, dmg, 'magic', t);
        for (let i = 1; i < s.chain; i++) {
          let nb = null, nd = 140 * 140;
          for (const e of this.enemies) {
            if (!this.canTarget(e, s) || hit.includes(e)) continue;
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
      if (s.k === 'ball' || s.k === 'glob') {
        s.t += dt;
        const u = Math.min(1, s.t / s.T);
        s.x = s.x0 + (s.tx - s.x0) * u; s.y = s.y0 + (s.ty - s.y0) * u - Math.sin(u * Math.PI) * (s.k === 'glob' ? 110 : 140);
        if (u >= 1) {
          s.done = true;
          let n = 0;
          for (const e of this.enemies) if (e.alive && !e.def.fly && (e.x - s.tx) ** 2 + (e.y - s.ty) ** 2 < s.splash * s.splash) {
            this.damage(e, s.dmg, s.dtype, s.src); n++;
            if (!e.alive) continue;
            if (s.dot) this.poisonE(e, s.dot, s.dotDur);
            if (s.melt) e.meltT = Math.max(e.meltT, 4);
            if (s.fireDot) { e.burnDps = Math.max(e.burnT > 0 ? e.burnDps : 0, s.fireDot); e.burnT = Math.max(e.burnT, 3); }
          }
          this.emit(s.k === 'glob' ? 'splash' : 'boom', { x: s.tx, y: s.ty, r: s.splash, n, src: s.src, fire: !!s.fireDot });
        }
        continue;
      }
      if (s.k === 'needle') {
        const step = s.sp * dt;
        const nx = s.x + s.vx * step, ny = s.y + s.vy * step;
        for (const e of this.enemies) {
          if (!e.alive || s.hit.has(e.id) || e.hidden || !e.seen) continue;
          const [d] = segDist(e.x, e.y - e.def.size * 0.4, s.x, s.y, nx, ny);
          if (d < 26 + e.def.size * 0.3) { s.hit.add(e.id); this.damage(e, s.dmg, s.dtype, s.src); if (s.hit.size >= s.pierce) { s.done = true; break; } }
        }
        s.x = nx; s.y = ny; s.left -= step;
        if (s.left <= 0) s.done = true;
        continue;
      }
      const e = s.tgt;
      const tx = e.x, ty = e.y - e.def.size * 0.4;
      const dx = tx - s.x, dy = ty - s.y, d = Math.hypot(dx, dy);
      s.ang = Math.atan2(dy, dx);
      const gone = !e.alive || e.hidden;
      if (d < s.sp * dt + 8) {
        s.done = true;
        if (!gone) {
          this.damage(e, s.dmg, s.dtype, s.src);
          if (s.k === 'shard' && e.alive) { this.slowE(e, s.slow, s.slowDur); if (s.freeze) { this.stunE(e, 1.2, true); this.emit('freeze', { enemy: e }); } }
        }
      } else if (gone) {
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
