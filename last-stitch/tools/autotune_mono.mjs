// 탑 하나 전략을 꺾는 체력 배수(사용자 「더 빡빡하게」, M5): 판마다 「탑 하나 최고 승률 ≤ 30%」가 되는 가장 낮은 hpMul.
// 지금 값보다 낮추지는 않는다(지금 값이 이미 조건을 지키면 그대로). 그 값에서 full 승률도 함께 낸다.
// 사용: node tools/autotune_mono.mjs [판...] [--n 40] [--steps 7]
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
const { LEVELS, getLevel } = await import('../js/data/levels.js');
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? +args[i + 1] : d; };
const N = opt('--n', 40), STEPS = opt('--steps', 7), CAP = 0.3;
const named = args.filter((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--')));
const ids = named.length ? named : LEVELS.filter(l => !l.test && l.id !== '1-1').map(l => l.id);
const tmp = fileURLToPath(new URL('./_mono.json', import.meta.url));
const run = hp => {
  execFileSync(process.execPath, [fileURLToPath(new URL('./balance.mjs', import.meta.url)), ...ids, '--n', String(N), '--s', 'only,mix,full', '--hp', ids.map(id => `${id}=${hp[id]}`).join(','), '--out', tmp], { stdio: 'ignore' });
  const rows = JSON.parse(fs.readFileSync(tmp, 'utf8')), out = {};
  for (const id of ids) { const rs = rows.filter(r => r.id === id); out[id] = { mono: Math.max(...rs.filter(r => r.s.startsWith('only:')).map(r => r.win)), mix: Math.max(...rs.filter(r => r.s.startsWith('mix:')).map(r => r.win)), full: rs.find(r => r.s === 'full').win, lives: rs.find(r => r.s === 'full').lives }; }
  return out;
};
const cur = Object.fromEntries(ids.map(id => [id, getLevel(id).hpMul]));
const lo = { ...cur }, hi = Object.fromEntries(ids.map(id => [id, Math.max(cur[id] * 4, 2)]));
const first = run(cur);
const done = new Set(ids.filter(id => first[id].mono <= CAP));
for (let k = 0; k < STEPS; k++) {
  const mid = Object.fromEntries(ids.map(id => [id, done.has(id) ? cur[id] : +((lo[id] + hi[id]) / 2).toFixed(3)]));
  const r = run(mid);
  for (const id of ids) if (!done.has(id)) { if (r[id].mono <= CAP) hi[id] = mid[id]; else lo[id] = mid[id]; }
  process.stderr.write(`단계 ${k + 1}/${STEPS}\n`);
}
const fin = Object.fromEntries(ids.map(id => [id, done.has(id) ? cur[id] : +hi[id].toFixed(2)]));
const check = run(fin);
fs.unlinkSync(tmp);
for (const id of ids) console.error(`${id} ${cur[id]} → ${fin[id]}  탑하나 ${Math.round(check[id].mono * 100)}%  둘섞기최고 ${Math.round(check[id].mix * 100)}%  잘함 ${Math.round(check[id].full * 100)}% 생명 ${check[id].lives.toFixed(1)}`);
console.log(JSON.stringify(fin));
