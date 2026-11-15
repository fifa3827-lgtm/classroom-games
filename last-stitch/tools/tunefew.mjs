// 판마다 체력 배수 f 찾기 (11-15 사용자 「탑 3~4개로 깸」): 탑 4개 최고 조합이 25% 이하로 지는 가장 작은 f,
// 그때 개수 제한 없는 최고 조합 승률도 잰다. 사용: node tools/tunefew.mjs <판> [판수R]
import { play } from './botlib.mjs';
import { getLevel } from '../js/data/levels.js';
import { TOWERS } from '../js/data/towers.js';
const id = process.argv[2], R = +(process.argv[3] || 4);
const L0 = getLevel(id);
const D = ['archer', 'cannon', 'lightning', 'crossbow', 'poison', 'ice', 'barracks'].filter(t => TOWERS[t].ch <= L0.chapter);
const combos = [...D.map(t => 'only:' + t), ...D.flatMap((x, i) => D.slice(i + 1).map(y => `mix:${x}+${y}`)), 'full'];
const best = (f, cap, quick) => {
  const L = { ...L0, hpMul: L0.hpMul * f, bossMul: (L0.bossMul || 1) * f };
  let b = { s: '', w: -1 };
  for (const s of combos) {
    let w = 0;
    for (let i = 0; i < R; i++) { w += play(L, cap ? s + '@' + cap : s, 1000 + i * 7919, i % 2 ? 'h' : 'v').win ? 1 : 0; if (quick && w > R / 4) break; }
    if (w > b.w) b = { s, w };
    if (quick && b.w > R / 4) break;     // 이미 기준을 넘음
  }
  return b;
};
let pick = null;
for (const f of [1, 1.15, 1.3, 1.5, 1.75, 2, 2.4, 2.8]) {
  const b4 = best(f, 4, true);
  if (b4.w <= R / 4) { pick = f; break; }
}
const f = pick ?? 2.8;
const b4 = best(f, 4), b5 = best(f, 5), bf = best(f, 0);
console.log(JSON.stringify({ id, f, cap4: `${b4.s} ${Math.round(b4.w / R * 100)}%`, cap5: `${b5.s} ${Math.round(b5.w / R * 100)}%`, free: `${bf.s} ${Math.round(bf.w / R * 100)}%` }));
