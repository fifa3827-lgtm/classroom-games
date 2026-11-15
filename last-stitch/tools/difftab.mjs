// 판·화면마다 보통 봇(casual)·잘하는 봇(full)·탑 4개 잘하는 봇(full@4) 승률. 사용: node tools/difftab.mjs <판> [R]
import { play } from './botlib.mjs';
import { getLevel } from '../js/data/levels.js';
const id = process.argv[2], R = +(process.argv[3] || 10), L = getLevel(id), out = [];
for (const ori of ['v', 'h']) for (const s of ['casual', 'full', 'full@4']) { let w = 0; for (let i = 0; i < R; i++) if (play(L, s, 9000 + i * 7919, ori).win) w++; out.push(`${ori}:${s} ${Math.round(w / R * 100)}%`); }
console.log(id + '\t' + out.join('  '));
