// 세로·가로 따로 난이도 맞추기 (11-15 검수 「한쪽 화면은 최고 조합도 0%」): 그 화면에서 가장 잘 고른 조합(탑 개수 제한 없음·4개까지)이
// R판 중 절반 넘게 이기는 가장 큰 배수 f. 사용: node tools/tuneori.mjs <판> <v|h> [R]
import { play } from './botlib.mjs';
import { getLevel } from '../js/data/levels.js';
import { TOWERS } from '../js/data/towers.js';
const [id, ori] = process.argv.slice(2, 4), R = +(process.argv[4] || 6), L0 = getLevel(id);
const D = ['archer', 'cannon', 'lightning', 'crossbow', 'poison', 'ice', 'barracks'].filter(t => TOWERS[t].ch <= L0.chapter);
const combos = [...D.map(t => 'only:' + t), ...D.flatMap((x, i) => D.slice(i + 1).map(y => `mix:${x}+${y}`)), 'full'].flatMap(s => [s, s + '@4']);
const need = Math.ceil(R / 2);
const bestAt = f => {
  const L = { ...L0, oriMul: { ...(L0.oriMul || {}), [ori]: (L0.oriMul?.[ori] || 1) * f } };
  let b = { s: '', w: 0 };
  for (const s of combos) {
    let w = 0;
    for (let i = 0; i < R; i++) { if (play(L, s, 3000 + i * 7919, ori).win) w++; if (w + (R - 1 - i) < Math.max(need, b.w + 1)) break; }
    if (w > b.w) b = { s, w };
    if (b.w >= need + 1) break;
  }
  return b;
};
let pick = null, info = null;
for (const f of [1.6, 1.35, 1.15, 1, 0.85, 0.72, 0.6, 0.5, 0.4]) { const b = bestAt(f); if (b.w >= need) { pick = f; info = b; break; } }
console.log(JSON.stringify({ id, ori, f: pick, best: info && `${info.s} ${info.w}/${R}` }));
