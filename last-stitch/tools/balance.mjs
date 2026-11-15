// 균형 표: 판 × 전략, 세로·가로 반씩, 여러 코어로. 사용:
//   node tools/balance.mjs [판...] [--n 400] [--s full,casual,nothread,only] [--hp 판=값,...]
//   only 는 그 판에서 열린 탑마다 only:<탑> 전략을 돈다(종탑 빼고).
// 결과: 표 출력 + tools/balance_last.json
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';
import os from 'node:os';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

if (!isMainThread) {
  const { getLevel } = await import('../js/data/levels.js');
  const { play } = await import('./botlib.mjs');
  const { PACE } = await import('../js/engine/game.js');
  if (workerData.pace) Object.assign(PACE, workerData.pace);
  const out = [];
  for (const j of workerData.jobs) {
    const L = { ...getLevel(j.id), ...(j.hp ? { hpMul: j.hp } : {}) };
    out.push({ ...j, ...play(L, j.s, j.seed, j.ori) });
  }
  parentPort.postMessage(out);
} else {
  const { LEVELS, getLevel } = await import('../js/data/levels.js');
  const { TOWERS, TOWER_ORDER_ALL } = await import('../js/data/towers.js');
  const args = process.argv.slice(2);
  const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
  const N = +opt('--n', 40);
  const strats = opt('--s', 'full,casual,nothread,only').split(',');
  const pace = opt('--pace', '') ? (([c, l]) => ({ clear: +c, left: +l }))(opt('--pace').split('/')) : null;
  const hpOver = Object.fromEntries((opt('--hp', '') || '').split(',').filter(Boolean).map(x => x.split('=')).map(([a, b]) => [a, +b]));
  const ids = args.filter((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--')));
  const levels = ids.length ? ids : LEVELS.filter(l => !l.test).map(l => l.id);
  const jobs = [];
  for (const id of levels) {
    const L = getLevel(id);
    const DMG = ['archer', 'cannon', 'lightning', 'crossbow', 'poison'].filter(t => TOWERS[t].ch <= L.chapter);
    const pairs = DMG.flatMap((a, i) => DMG.slice(i + 1).map(b => `mix:${a}+${b}`));
    const ss = strats.flatMap(s => s === 'only' ? TOWER_ORDER_ALL.filter(t => t !== 'bell' && (TOWERS[t].ch <= L.chapter)).map(t => 'only:' + t) : s === 'mix' ? pairs : [s]);
    for (const s of ss) for (let i = 0; i < N; i++) jobs.push({ id, s, ori: i % 2 ? 'h' : 'v', seed: 1000 + i * 7919, hp: hpOver[id] });
  }
  const W = Math.max(1, os.cpus().length - 1);
  const chunks = Array.from({ length: W }, () => []);
  jobs.forEach((j, i) => chunks[i % W].push(j));
  const t0 = Date.now();
  const res = (await Promise.all(chunks.filter(c => c.length).map(c => new Promise((ok, no) => {
    const w = new Worker(fileURLToPath(import.meta.url), { workerData: { jobs: c, pace } });
    w.on('message', ok); w.on('error', no);
  })))).flat();
  const tab = {};
  for (const r of res) { const k = r.id + '|' + r.s; (tab[k] ||= []).push(r); }
  const rows = [];
  console.log(`판   전략              판수  승률   세로/가로   평균생명  별3    분     (${((Date.now() - t0) / 1000).toFixed(0)}초)`);
  for (const id of levels) for (const k of Object.keys(tab).filter(k => k.startsWith(id + '|'))) {
    const rs = tab[k], s = k.split('|')[1];
    const w = a => a.length ? a.filter(r => r.win).length / a.length : 0;
    const v = rs.filter(r => r.ori === 'v'), h = rs.filter(r => r.ori === 'h');
    const row = { id, s, n: rs.length, win: w(rs), winV: w(v), winH: w(h), lives: rs.reduce((a, r) => a + r.lives, 0) / rs.length,
      star3: rs.filter(r => r.stars === 3).length / rs.length, min: rs.filter(r => r.win).reduce((a, r) => a + r.time, 0) / Math.max(1, rs.filter(r => r.win).length) / 60 };
    rows.push(row);
    console.log(`${id}  ${s.padEnd(16)} ${String(row.n).padStart(4)}  ${(row.win * 100).toFixed(0).padStart(4)}%  ${(row.winV * 100).toFixed(0).padStart(4)}/${(row.winH * 100).toFixed(0).padEnd(4)}  ${row.lives.toFixed(1).padStart(6)}  ${(row.star3 * 100).toFixed(0).padStart(4)}%  ${row.min.toFixed(1).padStart(4)}`);
  }
  fs.writeFileSync(opt('--out', fileURLToPath(new URL('./balance_last.json', import.meta.url))), JSON.stringify(rows, null, 1));
}
