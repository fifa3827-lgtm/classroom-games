// 자동 플레이 봇: 화면에 보이는 정보(금화·빈자리·적 위치)만 쓴다. 판마다 여러 전략·씨앗으로 돌려 표를 낸다.
// 사용: node tools/bot.mjs [판번호...] [--n 40]
import { Game } from '../js/engine/game.js';
import { getLevel, LEVELS } from '../js/data/levels.js';
import { TOWER_ORDER } from '../js/data/towers.js';

const args = process.argv.slice(2);
const nIdx = args.indexOf('--n');
const N = nIdx >= 0 ? +args[nIdx + 1] : 40;
const ids = args.filter((a, i) => !a.startsWith('--') && (nIdx < 0 || i !== nIdx + 1));
const levels = ids.length ? ids : LEVELS.filter(l => !l.test).map(l => l.id);

// 빈자리를 「길에 가까운 정도」로 줄 세운다(길 점들과 사거리 안에 드는 수)
function padScore(g, pad) {
  const [x, y] = g.padPos(pad);
  let n = 0;
  for (const P of g.geo.paths) for (const [px, py] of P.pts) if ((px - x) ** 2 + (py - y) ** 2 < 210 * 210) n++;
  return n;
}
const STRATS = {
  // 한 종류만 + 올리기
  only_archer: { types: ['archer'], upgrade: true, thread: false },
  only_cannon: { types: ['cannon'], upgrade: true, thread: false },
  // 섞어서 + 올리기 + 실
  mixed_thread: { types: ['archer', 'cannon', 'ice', 'lightning'], upgrade: true, thread: true },
  mixed_nothread: { types: ['archer', 'cannon', 'ice', 'lightning'], upgrade: true, thread: false },
  // 서툰 사람: 탑 3개까지만, 올리기 안 함
  lazy: { types: ['archer', 'cannon'], upgrade: false, thread: false, maxTowers: 3 },
};

function play(level, strat, seed) {
  const g = new Game(level, 'v', { seed });
  const pads = [...g.geo.pads.keys()].sort((a, b) => padScore(g, b) - padScore(g, a));
  let ti = 0, tick = 0;
  const think = () => {
    // 세우기
    const free = pads.filter(p => !g.towerAt(p));
    if (free.length && (!strat.maxTowers || g.towers.length < strat.maxTowers)) {
      const type = strat.types[ti % strat.types.length];
      if (g.gold >= g.cost(type)) { g.build(free[0], type); ti++; return; }
      if (!strat.upgrade || g.towers.length < 3) return;
    }
    // 올리기: 가장 길에 가까운 탑부터
    if (strat.upgrade) {
      const t = g.towers.filter(t => g.upgradePrice(t)).sort((a, b) => padScore(g, b.pad) - padScore(g, a.pad))[0];
      if (t && g.gold >= g.upgradePrice(t)) g.upgrade(t);
    }
    // 실: 길을 가로지르는 짝을 잇는다
    if (strat.thread && g.spoolsFree() > 0) {
      let best = null, bs = 0;
      for (const a of g.towers) for (const b of g.towers) {
        if (a.id >= b.id || g.linkCheck(a, b) !== 'ok') continue;
        const p = g.padPos(a.pad), q = g.padPos(b.pad);
        let cross = 0;
        for (const P of g.geo.paths) for (const [x, y] of P.pts) {
          const dx = q[0] - p[0], dy = q[1] - p[1], l2 = dx * dx + dy * dy;
          const u = Math.max(0, Math.min(1, ((x - p[0]) * dx + (y - p[1]) * dy) / l2));
          if (Math.hypot(x - p[0] - dx * u, y - p[1] - dy * u) < 40) cross++;
        }
        if (cross > bs) { bs = cross; best = [a, b]; }
      }
      if (best) g.link(...best);
    }
  };
  g.callWave();
  while (!g.result && g.time < 60 * 15) {
    g.step();
    g.events.length = 0;
    if (++tick % 30 === 0) think();
  }
  return { win: g.result === 'win', lives: g.lives, time: g.time, stars: g.result === 'win' ? g.stars : 0 };
}

console.log('판   전략             승률   평균생명  별3   시간(분)');
for (const id of levels) {
  const L = getLevel(id);
  for (const [name, st] of Object.entries(STRATS)) {
    const rs = [];
    for (let i = 0; i < N; i++) rs.push(play(L, st, 1000 + i * 7919));
    const w = rs.filter(r => r.win).length / N;
    const lv = rs.reduce((a, r) => a + r.lives, 0) / N;
    const s3 = rs.filter(r => r.stars === 3).length / N;
    const tm = rs.reduce((a, r) => a + r.time, 0) / N / 60;
    console.log(`${id}  ${name.padEnd(15)}  ${(w * 100).toFixed(0).padStart(4)}%  ${lv.toFixed(1).padStart(7)}  ${(s3 * 100).toFixed(0).padStart(4)}%  ${tm.toFixed(1).padStart(6)}`);
  }
}
