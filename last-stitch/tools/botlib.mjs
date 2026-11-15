// 자동 플레이 봇 (화면에 보이는 정보만: 금화·빈자리·탑·적 위치·실). 무작위 씨앗을 엿보지 않는다.
// 전략:
//   full      열린 탑 모두 섞기 + 올리기·갈래 + 실 + 손 기술 (잘하는 사람)
//   casual    full 과 같되 2단계까지만, 갈래·손 기술 안 씀, 생각이 느림 (보통 사람)
//   nothread  full 에서 실만 안 씀
//   only:<탑> 그 탑 하나만 (올리기·갈래·실·손 기술은 씀)
//   mix:<탑>+<탑> 공격 탑 둘을 섞기(+종탑) — 잘 섞는 사람
//   few:<N>   full 과 같되 탑은 N개까지만 세우고 남는 금화는 올리기·갈래에 (11-15 사용자 「탑 3~4개로 깸」 재기)
import { Game } from '../js/engine/game.js';
import { TOWER_ORDER_ALL, TOWERS } from '../js/data/towers.js';

// 빈자리 점수: 길마다 「사거리 안에 드는 길 점 비율」의 합 (길이 둘이면 두 길을 고르게 봄)
function padScore(g, pad) { const [x, y] = g.padPos(pad); let s = 0; for (const P of g.geo.paths) { let n = 0; for (const [px, py] of P.pts) if ((px - x) ** 2 + (py - y) ** 2 < 210 * 210) n++; s += n / P.pts.length; } return s; }

export function play(level, strat, seed, ori = 'v', mods) {
  const g = new Game(level, ori, { seed, mods });
  const [S, capS] = (typeof strat === 'string' ? strat : strat.name).split('@');   // 뒤에 @N 을 붙이면 탑 N개까지만 (예: mix:archer+lightning@4)
  const only = S.startsWith('only:') ? S.slice(5) : null;
  const few = S.startsWith('few:') ? +S.slice(4) : +capS || 0;
  const useThread = S !== 'nothread';
  const useSkill = S !== 'casual';
  const maxLv = S === 'casual' ? 2 : 4;
  const thinkEvery = S === 'casual' ? 75 : 30;
  const pads = [...g.geo.pads.keys()].sort((a, b) => padScore(g, b) - padScore(g, a));
  // 섞기: 피해를 주는 탑을 돌아가며 세우고, 보조 탑(얼음·독·병영·종탑)은 종류마다 하나씩(종탑은 길마다)만 섞는다
  const DMG = ['archer', 'cannon', 'lightning', 'crossbow'], SUP = ['ice', 'poison', 'barracks', 'bell'];
  const allow = t => g.towerAllowed(t);
  let types;
  const mix = S.startsWith('mix:') ? S.slice(4).split('+') : null;   // 두 가지 섞기: 공격 탑 둘 + 보조 탑(종탑만, 길마다)
  if (only) types = [only];
  else if (mix) { types = [...mix]; if (allow('bell')) types.splice(1, 0, 'bell'); }
  else { const d = DMG.filter(allow), sp = SUP.filter(allow); types = []; d.forEach((t, i) => { types.push(t); if (sp[i]) types.push(sp[i]); }); sp.slice(d.length).forEach(t => types.push(t)); }
  const supCap = t => t === 'bell' ? g.geo.paths.length : 1;
  let ti = 0, tick = 0, bells = 0;
  const think = () => {
    const free = pads.filter(p => !g.towerAt(p));
    if (free.length && (!few || g.towers.length < few)) {
      let type = types[ti % types.length];
      for (let k = 0; k < types.length && !only && !mix && SUP.includes(type) && g.towers.filter(t => t.type === type).length >= supCap(type); k++) { ti++; type = types[ti % types.length]; }
      // 나는 적이 보이면 하늘을 칠 수 있는 탑부터
      if (!only && TOWERS[type].ground && g.enemies.some(e => e.def.fly)) { const air = types.find(t => !TOWERS[t].ground && !SUP.includes(t)); if (air) type = air; }
      if (mix && type === 'bell' && g.towers.filter(t => t.type === 'bell').length >= supCap('bell')) { ti++; type = types[ti % types.length]; }
      if (g.gold >= g.cost(type)) { if (g.build(free[0], type) && type === types[ti % types.length]) ti++; return; }
      if (g.towers.length < 3) return;
    }
    const cands = g.towers.filter(t => (t.level < Math.min(3, maxLv) && g.upgradePrice(t)) || (maxLv >= 4 && g.branchOpen() && t.level === 3));
    const t = cands.sort((a, b) => a.level - b.level || padScore(g, b.pad) - padScore(g, a.pad))[0];
    if (t && t.level === 3) g.branch(t, t.id % 2 ? 'a' : 'b'); else if (t && g.gold >= g.upgradePrice(t)) g.upgrade(t);
    if (useThread && g.spoolsFree() > 0) {
      let best = null, bs = -1;
      // 길을 가로지르는 짝, 본길(보스가 오는 길)을 가로지르면 먼저
      const main = g.geo.paths[0];
      const crossMain = (a, b) => { const p = g.padPos(a.pad), q = g.padPos(b.pad); return main.pts.some(([x, y]) => { const dx = q[0] - p[0], dy = q[1] - p[1], l2 = dx * dx + dy * dy || 1; const u = Math.max(0, Math.min(1, ((x - p[0]) * dx + (y - p[1]) * dy) / l2)); return Math.hypot(x - p[0] - dx * u, y - p[1] - dy * u) < 50; }); };
      for (const a of g.towers) for (const b of g.towers) { if (a.id >= b.id || g.linkCheck(a, b) !== 'ok' || !g.threadCrosses(a, b)) continue; const s = 1000 - g.threadLen(a, b) + (crossMain(a, b) ? 2000 : 0); if (s > bs) { bs = s; best = [a, b]; } }
      if (best) g.link(...best);
    }
    if (useSkill && g.enemies.length) {
      const front = g.enemies.filter(e => e.d > 0).sort((a, b) => g.progress(b) - g.progress(a))[0];
      if (front && g.progress(front) > 0.55) { if (g.skillReady('rewind')) g.useSkill('rewind', front.x, front.y); else if (g.skillReady('needles')) g.useSkill('needles', front.x, front.y); }
    }
  };
  g.callWave();
  while (!g.result && g.time < 60 * 20) { g.step(); g.events.length = 0; if (++tick % thinkEvery === 0) think(); }
  return { win: g.result === 'win', lives: g.lives, time: g.time, stars: g.result === 'win' ? g.stars : 0 };
}
