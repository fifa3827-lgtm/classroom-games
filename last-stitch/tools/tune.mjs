// 판마다 체력 배수(hpMul)를 찾는다: 「full」 봇(열린 탑 모두·갈래·실·손 기술)이 목표 승률을 넘는 가장 높은 값.
// 사용: node tools/tune.mjs [판...] [--n 6] [--goal 0.67]   → 판별 추천 hpMul 표
import { Game } from '../js/engine/game.js';
import { getLevel, LEVELS } from '../js/data/levels.js';
import { TOWER_ORDER_ALL } from '../js/data/towers.js';

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? +args[i + 1] : d; };
const N = opt('--n', 6), GOAL = opt('--goal', 0.67);
const ids = args.filter((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--')));
const levels = ids.length ? ids : LEVELS.filter(l => !l.test && l.id !== '1-1').map(l => l.id);

function padScore(g, pad) { const [x, y] = g.padPos(pad); let n = 0; for (const P of g.geo.paths) for (const [px, py] of P.pts) if ((px - x) ** 2 + (py - y) ** 2 < 210 * 210) n++; return n; }
export function playFull(level, seed, ori = 'v') {
  const g = new Game(level, ori, { seed });
  const pads = [...g.geo.pads.keys()].sort((a, b) => padScore(g, b) - padScore(g, a));
  const types = TOWER_ORDER_ALL.filter(t => g.towerAllowed(t) && t !== 'bell');
  if (g.towerAllowed('bell')) types.splice(1, 0, 'bell');   // 종탑은 두 번째로 하나 (유령을 보려고)
  let ti = 0, tick = 0, bells = 0;
  const think = () => {
    const free = pads.filter(p => !g.towerAt(p));
    if (free.length) {
      let type = types[ti % types.length];
      if (type === 'bell' && bells >= 1) { ti++; type = types[ti % types.length]; }
      if (g.gold >= g.cost(type)) { if (g.build(free[0], type)) { ti++; if (type === 'bell') bells++; } return; }
      if (g.towers.length < 3) return;
    }
    const t = g.towers.filter(t => g.upgradePrice(t) || (g.branchOpen() && t.level === 3)).sort((a, b) => padScore(g, b.pad) - padScore(g, a.pad))[0];
    if (t && t.level === 3) g.branch(t, t.id % 2 ? 'a' : 'b'); else if (t && g.gold >= g.upgradePrice(t)) g.upgrade(t);
    if (g.spoolsFree() > 0) {
      let best = null, bs = 0;
      for (const a of g.towers) for (const b of g.towers) { if (a.id >= b.id || g.linkCheck(a, b) !== 'ok' || !g.threadCrosses(a, b)) continue; const s = 1000 - g.threadLen(a, b); if (s > bs) { bs = s; best = [a, b]; } }
      if (best) g.link(...best);
    }
    if (g.enemies.length) {
      const front = g.enemies.filter(e => e.d > 0).sort((a, b) => g.progress(b) - g.progress(a))[0];
      if (front && g.progress(front) > 0.55) { if (g.skillReady('rewind')) g.useSkill('rewind', front.x, front.y); else if (g.skillReady('needles')) g.useSkill('needles', front.x, front.y); }
    }
  };
  g.callWave();
  while (!g.result && g.time < 60 * 20) { g.step(); g.events.length = 0; if (++tick % 30 === 0) think(); }
  return { win: g.result === 'win', lives: g.lives, time: g.time };
}
// 세로·가로 각각 N판, 낮은 쪽 승률로 판정 (화면 방향마다 길 모양이 달라 난이도가 다름)
function rate(L, hpMul) {
  const one = ori => { const rs = []; for (let i = 0; i < N; i++) rs.push(playFull({ ...L, hpMul }, 500 + i * 7919, ori)); return rs; };
  const v = one('v'), h = one('h'), all = v.concat(h), w = rs => rs.filter(r => r.win).length / rs.length;
  return { w: Math.min(w(v), w(h)), lives: all.reduce((a, r) => a + r.lives, 0) / all.length, min: all.reduce((a, r) => a + r.time, 0) / all.length / 60 };
}
if (import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/').split('/').pop())) {
  console.log('판   지금hpMul  →  추천   승률  생명  분');
  for (const id of levels) {
    const L = getLevel(id);
    let lo = 0.15, hi = Math.max(L.hpMul, 2.5), best = null;
    for (let k = 0; k < 7; k++) {
      const m = (lo + hi) / 2, r = rate(L, m);
      if (r.w >= GOAL) { best = [m, r]; lo = m; } else hi = m;
    }
    if (!best) { const r = rate(L, lo); best = [lo, r]; }
    const [m, r] = best;
    console.log(`${id}  ${L.hpMul.toFixed(2).padStart(6)}  →  ${m.toFixed(2)}  ${(r.w * 100).toFixed(0).padStart(4)}%  ${r.lives.toFixed(1).padStart(4)}  ${r.min.toFixed(1)}`);
  }
}
