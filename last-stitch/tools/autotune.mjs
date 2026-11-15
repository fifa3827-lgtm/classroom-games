// 판마다 체력 배수 자동 맞춤(이분 찾기, 모든 판을 한 번에):
//   기준 봇(--by, 기본 full)의 평균 생명 ≥ 목표(판 순서대로 줄어듦) 그리고 full 승률 ≥ 90%
//   조건을 지키는 가장 높은 hpMul. 사용: node tools/autotune.mjs [--n 40] [--steps 8]
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
const { LEVELS } = await import('../js/data/levels.js');
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? +args[i + 1] : d; };
const N = opt('--n', 40), STEPS = opt('--steps', 8);
const BY = (() => { const i = args.indexOf('--by'); return i >= 0 ? args[i + 1] : 'full'; })();
const HI = opt('--top', 17), LO = opt('--bottom', 7);
const ids = LEVELS.filter(l => !l.test).map(l => l.id);
// 목표 생명: 1-1 은 HI-1 (연습판), 1-2 HI → 5-3 LO 로 고르게 줄어듦
export const target = id => { const i = ids.indexOf(id); return i === 0 ? HI - 1 : HI - (i - 1) * ((HI - LO) / (ids.length - 2)); };
const lo = Object.fromEntries(ids.map(id => [id, 0.05])), hi = Object.fromEntries(ids.map(id => [id, 4]));
const tmp = fileURLToPath(new URL('./_auto.json', import.meta.url));
for (let k = 0; k < STEPS; k++) {
  const mid = Object.fromEntries(ids.map(id => [id, +((lo[id] + hi[id]) / 2).toFixed(3)]));
  execFileSync(process.execPath, [fileURLToPath(new URL('./balance.mjs', import.meta.url)), '--n', String(N), '--s', BY === 'full' ? 'full' : BY + ',full', '--hp', ids.map(id => `${id}=${mid[id]}`).join(','), '--out', tmp], { stdio: 'ignore' });
  const rows = JSON.parse(fs.readFileSync(tmp, 'utf8'));
  for (const id of ids) {
    const c = rows.find(r => r.id === id && r.s === BY), f = rows.find(r => r.id === id && r.s === 'full');
    if (c.lives >= target(id) && f.win >= 0.9) lo[id] = mid[id]; else hi[id] = mid[id];
  }
  process.stderr.write(`단계 ${k + 1}/${STEPS}\n`);
}
fs.unlinkSync(tmp);
console.log(JSON.stringify(Object.fromEntries(ids.map(id => [id, +lo[id].toFixed(2)]))));
