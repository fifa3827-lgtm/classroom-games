// FIT 찾기: 그 판·화면에서 잘하는 봇(full, full@4 가운데 나은 쪽)이 R판 중 need판 넘게 이기는 가장 큰 배수. 사용: node tools/tunefit.mjs <판> <v|h> [R] [need]
import { play } from './botlib.mjs';
import { getLevel } from '../js/data/levels.js';
const [id, ori] = process.argv.slice(2, 4), R = +(process.argv[4] || 10), need = +(process.argv[5] || 8), L0 = getLevel(id);
const wins = f => { const L = { ...L0, oriMul: { ...(L0.oriMul || {}), [ori]: (L0.oriMul?.[ori] || 1) * f } }; let best = 0, bs = '';
  for (const s of ['full', 'full@4']) { let w = 0; for (let i = 0; i < R; i++) { if (play(L, s, 9000 + i * 7919, ori).win) w++; if (w + R - 1 - i < need) break; } if (w > best) { best = w; bs = s; } } return [best, bs]; };
let pick = 1, info = wins(1);
if (info[0] >= need) for (const f of [1.15, 1.3, 1.5, 1.75, 2, 2.4, 2.8]) { const r = wins(f); if (r[0] >= need) { pick = f; info = r; } else break; }
console.log(JSON.stringify({ id, ori, f: pick, best: `${info[1]} ${info[0]}/${R}` }));
