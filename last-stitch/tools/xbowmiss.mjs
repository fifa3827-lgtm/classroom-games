// 석궁 1단계 빗나감 재기: 탑 아래쪽(dy>0) 과녁에 쏜 바늘 가운데 아무도 못 맞히고 사라진 비율. 사용: node tools/xbowmiss.mjs
import { Game } from '../js/engine/game.js';
import { getLevel } from '../js/data/levels.js';
import { ENEMIES } from '../js/data/enemies.js';
const L = getLevel('test');
let shots = 0, miss = 0, below = 0, belowMiss = 0;
const fast = Object.keys(ENEMIES).filter(k => !ENEMIES[k].boss && !ENEMIES[k].fly).sort((a, b) => ENEMIES[b].speed - ENEMIES[a].speed).slice(0, 4);
for (const ori of ['v', 'h']) for (const type of fast) {
  const g0 = new Game({ ...L, waves: [[]] }, ori, { seed: 3 });
  for (let pi = 0; pi < g0.geo.pads.length; pi++) {
   for (let d0 = 0; d0 < g0.geo.paths[0].len; d0 += 150) {
    const g = new Game({ ...L, waves: [[]] }, ori, { seed: 3 }); g.started = true; g.wave = 0;
    const t = g.build(pi, 'crossbow'); if (!t) continue;
    { const e = g.spawn({ type, path: 0 }); e.d = d0; e.hp = e.maxHp = 1e6; g.placeEnemy(e); }
    const seen = new Set();
    for (let i = 0; i < 60 * 3; i++) {
      g.step();
      for (const s of g.shots) if (s.k === 'needle' && !seen.has(s)) { seen.add(s); s._below = s.vy > 0.8; }
    }
    for (const s of seen) { if (!s.done && s.left > 0) continue; shots++; if (s._below) below++; if (!s.hit.size) { miss++; if (s._below) belowMiss++; } }
   }
  }
}
console.log(`바늘 ${shots}발 중 빗나감 ${miss} (${(miss / shots * 100).toFixed(1)}%) · 아래로 쏜 ${below}발 중 빗나감 ${belowMiss} (${(belowMiss / Math.max(1, below) * 100).toFixed(1)}%) · 적 ${fast.join(',')}`);
