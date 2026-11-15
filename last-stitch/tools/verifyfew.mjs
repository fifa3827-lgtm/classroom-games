// 판마다: 가장 좋은 조합(개수 제한 없음)·탑 4개 최고 조합의 승률(R판). 사용: node tools/verifyfew.mjs <판> [R]
import { play } from './botlib.mjs';
import { getLevel } from '../js/data/levels.js';
import { TOWERS } from '../js/data/towers.js';
const id = process.argv[2], R = +(process.argv[3] || 8), L = getLevel(id);
const D = ['archer', 'cannon', 'lightning', 'crossbow', 'poison', 'ice', 'barracks'].filter(t => TOWERS[t].ch <= L.chapter);
const combos = [...D.map(t => 'only:' + t), ...D.flatMap((x, i) => D.slice(i + 1).map(y => `mix:${x}+${y}`)), 'full'];
const best = cap => { let b = { s: '', w: -1, t: 0 }; for (const s of combos) { let w = 0, t = 0; for (let i = 0; i < R; i++) { const r = play(L, cap ? s + '@' + cap : s, 5000 + i * 7919, i % 2 ? 'h' : 'v'); if (r.win) { w++; t += r.time; } } if (w > b.w) b = { s, w, t: w ? t / w / 60 : 0 }; } return b; };
const f = best(0), c4 = best(4), cas = (() => { let w = 0; for (let i = 0; i < R; i++) w += play(L, 'casual', 5000 + i * 7919, i % 2 ? 'h' : 'v').win ? 1 : 0; return w; })();
console.log(`${id}\t최고 ${f.s} ${Math.round(f.w / R * 100)}% (${f.t.toFixed(1)}분)\t탑4개 최고 ${c4.s} ${Math.round(c4.w / R * 100)}%\t보통봇 ${Math.round(cas / R * 100)}%`);
