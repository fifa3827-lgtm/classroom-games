// 탑 N개로 깰 수 있나: 판마다 「공격 탑 둘 섞기」·「한 가지」 조합을 모두 N개 제한으로 돌려 가장 좋은 승률. 사용: node tools/fewgrid.mjs [N] [판수] [판...]
import { play } from './botlib.mjs';
import { LEVELS, getLevel } from '../js/data/levels.js';
import { TOWERS } from '../js/data/towers.js';
const a = process.argv.slice(2), N = +(a[0] || 4), R = +(a[1] || 6), ids = a.slice(2).length ? a.slice(2) : LEVELS.filter(l => !l.test).map(l => l.id);
for (const id of ids) {
  const L = getLevel(id);
  const D = ['archer', 'cannon', 'lightning', 'crossbow', 'poison', 'ice', 'barracks'].filter(t => TOWERS[t].ch <= L.chapter);
  const S = [...D.map(t => 'only:' + t), ...D.flatMap((x, i) => D.slice(i + 1).map(y => `mix:${x}+${y}`)), 'full'].map(s => s + '@' + N);
  let best = null;
  for (const s of S) { let w = 0; for (let i = 0; i < R; i++) w += play(L, s, 1000 + i * 7919, i % 2 ? 'h' : 'v').win ? 1 : 0; if (!best || w > best.w) best = { s, w }; }
  console.log(id, `탑 ${N}개 최고`, best.s, `${Math.round(best.w / R * 100)}%`);
}
