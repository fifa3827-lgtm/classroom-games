// M2 규칙 시험: 탑 8종·갈래·적 17종 행동·손 기술을 Node에서 확인한다. 사용: node tools/m2test.mjs
import { Game } from '../js/engine/game.js';
import { getLevel } from '../js/data/levels.js';
import { TOWER_ORDER_ALL, BRANCHES } from '../js/data/towers.js';
import { ENEMY_ORDER } from '../js/data/enemies.js';

const L = getLevel('test');
let fail = 0, pass = 0;
const ok = (c, msg) => { if (c) pass++; else { fail++; console.log('  실패:', msg); } };
const G = () => { const g = new Game({ ...L, waves: [[]] }, 'v', { seed: 7 }); g.started = true; g.wave = 0; return g; };
const run = (g, sec) => { for (let i = 0; i < sec * 60; i++) { g.step(); } };
const put = (g, type, d = 300, path = 0) => { const e = g.spawn({ type, path }); e.d = d; g.placeEnemy(e); return e; };
// 길 위 d 지점에 가장 가까운 빈자리
const padNear = (g, d, skip = []) => { const [x, y] = [g.geo.paths[0].pts, 0] && (() => { const P = g.geo.paths[0]; let c = 0; for (let i = 1; i < P.pts.length; i++) if (P.cum[i] >= d) return P.pts[i]; return P.pts[P.pts.length - 1]; })(); let b = -1, bd = 1e9; g.geo.pads.forEach((p, i) => { if (skip.includes(i)) return; const dd = Math.hypot(p[0] - x, p[1] - y); if (dd < bd) { bd = dd; b = i; } }); return b; };
const evs = (g, t) => g.events.filter(e => e.t === t);

console.log('탑 8종 세우기·쏘기');
for (const type of TOWER_ORDER_ALL) {
  const g = G(); const pad = padNear(g, 500);
  const t = g.build(pad, type); ok(!!t, type + ' 세움');
  const e = put(g, 'pawn', 500); e.hp = e.maxHp = 1e6;
  run(g, 4);
  const hurt = e.maxHp - e.hp;
  if (type === 'bell') ok(hurt === 0, 'bell은 공격 안 함');
  else ok(hurt > 0, type + ' 피해 줌 ' + hurt.toFixed(1));
  for (const br of ['a', 'b']) {
    const g2 = G(); const t2 = g2.build(pad, type); g2.upgrade(t2); g2.upgrade(t2);
    ok(t2.level === 3 && g2.canBranch(t2), type + ' 3단계·갈래 가능');
    ok(g2.branch(t2, br) && t2.level === 4 && t2.branch === br, type + ' 갈래 ' + br + ' ' + BRANCHES[type][br].name);
    const e2 = put(g2, 'pawn', 500); e2.hp = e2.maxHp = 1e6;
    run(g2, 4);
    if (type !== 'bell') ok(e2.maxHp - e2.hp > hurt, type + br + ' 가 3단계보다 셈? ' + (e2.maxHp - e2.hp).toFixed(0) + ' > ' + hurt.toFixed(0));
  }
}
{ // 1-1에서는 독·석궁·종·병영 못 세움, 갈래 닫힘
  const g = new Game(getLevel('1-1'), 'v', { seed: 1 }); g.gold = 9999;
  ok(!g.build(0, 'poison') && !g.build(1, 'bell'), '1-1 은 4종만');
  const t = g.build(0, 'archer'); g.upgrade(t); g.upgrade(t); ok(!g.canBranch(t), '1-1 갈래 닫힘');
}
console.log('탑 특수');
{ // 독: 계속 피해
  const g = G(); g.build(padNear(g, 500), 'poison'); const e = put(g, 'knight', 500); e.hp = e.maxHp = 1e5; run(g, 2.2); ok(e.poisonT > 0, '독 걸림');
}
{ // 석궁: 둘 꿰뚫기
  const g = G(); const t = g.build(padNear(g, 500), 'crossbow'); const a = put(g, 'pawn', 500), b = put(g, 'pawn', 495); a.hp = a.maxHp = b.hp = b.maxHp = 1e5; a.lane = b.lane = 0; g.placeEnemy(a); g.placeEnemy(b);
  run(g, 1); ok(a.hp < a.maxHp && b.hp < b.maxHp, '석궁 둘 꿰뚫음');
}
{ // 종탑: 공격 속도
  const g = G(); const p = padNear(g, 500); const t = g.build(p, 'archer'); const b = g.build(padNear(g, 500, [p]), 'bell');
  ok(g.auraFor(t) >= 0.2 || Math.hypot(g.padPos(t.pad)[0] - g.padPos(b.pad)[0], g.padPos(t.pad)[1] - g.padPos(b.pad)[1]) > 200, '종탑 기운 ' + g.auraFor(t));
  g.upgrade(b); g.upgrade(b); g.branch(b, 'b'); run(g, 0.1); ok(g.spoolsMax === 3, '맑은 종 실패 +1');
}
{ // 병영: 막기
  const g = G(); const t = g.build(padNear(g, 500), 'barracks'); const e = put(g, 'pawn', t.rally.d - 120); e.hp = e.maxHp = 1e5;
  run(g, 4); ok(!!e.blocked, '병사가 붙잡음'); const d0 = e.d; run(g, 1); ok(Math.abs(e.d - d0) < 1, '붙잡힌 적은 멈춤');
  const f = put(g, 'crane', 300); run(g, 2); ok(!f.blocked, '나는 적은 못 막음');
}
console.log('적 17종');
{ const g = G(); const e = put(g, 'splitblob', 400); g.damage(e, 1e4, 'magic'); ok(g.enemies.filter(x => x.type === 'mini' && x.alive).length === 2, '갈라지는 방울 → 2'); }
{ const g = G(); const e = put(g, 'crane', 10); const P = g.geo.fly[0]; ok(P.pts.length === 2, '종이학 곧은 길');
  g.build(padNear(g, 300), 'cannon'); run(g, 3); ok(e.hp === e.maxHp, '대포는 종이학 못 맞힘'); }
{ const g = G(); g.build(padNear(g, 500), 'ice'); const e = put(g, 'snowman', 480); e.hp = e.maxHp = 1e5; run(g, 3); ok(e.hp < e.maxHp && e.slow === 0, '눈사람 냉기 무시'); }
{ const g = G(); const e = put(g, 'mole', 300); let hid = false; for (let i = 0; i < 300; i++) { g.step(); if (e.hidden) { hid = true; ok(g.damage(e, 10, 'magic') === 0, '숨은 두더지 안 맞음'); break; } } ok(hid, '두더지 숨음'); }
{ const g = G(); g.gold = 1e5;
  // 길을 가로지르는 실 찾기
  let pair = null; for (let i = 0; i < g.geo.pads.length && !pair; i++) for (let j = i + 1; j < g.geo.pads.length; j++) { const a = g.build(i, 'archer') || g.towerAt(i), b = g.build(j, 'archer') || g.towerAt(j); if (g.linkCheck(a, b) === 'ok' && g.threadCrosses(a, b)) { pair = [a, b]; break; } }
  const th = g.link(...pair); ok(!!th, '실 이음');
  const e = put(g, 'scissorbug', 0); e.hp = e.maxHp = 1e6; let cut = false; for (let i = 0; i < 60 * 60 && !cut; i++) { g.step(); if (!g.threads.includes(th)) cut = true; } ok(cut, '가위벌레가 실 끊음');
  const g2 = G(); g2.gold = 1e5; const a = g2.build(pair[0].pad, 'archer'), b = g2.build(pair[1].pad, 'archer'); const th2 = g2.link(a, b);
  const ig = put(g2, 'inkgiant', 0); ig.hp = ig.maxHp = 1e7; let cut2 = false; for (let i = 0; i < 60 * 120 && !cut2; i++) { g2.step(); if (!g2.threads.includes(th2)) cut2 = true; } ok(cut2, '먹물 거인이 실 끊음'); }
{ const g = G(); const b = put(g, 'bishop', 300), p = put(g, 'pawn', 310); p.hp = 10; run(g, 2.2); ok(p.hp > 10, '치유 주교 회복'); }
{ const g = G(); const e = put(g, 'ghost', 500); e.hp = e.maxHp = 1e5; e.stunT = 99; const pad = padNear(g, 500); g.build(pad, 'archer'); run(g, 2); ok(e.hp === e.maxHp, '종탑 없으면 유령 못 봄');
  g.build(padNear(g, 500, [pad]), 'bell'); run(g, 2); ok(e.hp < e.maxHp, '종탑 있으면 유령 맞음'); }
{ const g = G(); const e = put(g, 'crab', 300); const h0 = e.hp; g.damage(e, 100, 'phys'); ok(Math.abs(h0 - e.hp - 65) < 0.01, '게 등껍질 물리 35% 막음'); }
{ const g = G(); const e = put(g, 'golem', 300); g.damage(e, e.maxHp * 0.45, 'magic'); ok(g.enemies.filter(x => x.type === 'mini').length === 2, '골렘 방울 흘림'); }
{ const g = G(); const t = g.build(padNear(g, 400), 'archer'); const e = put(g, 'rook', 400); e.hp = e.maxHp = 1e6; run(g, 4.2); ok(evs(g, 'towerstun').length > 0, '흑성채 탑 멈춤 ' + t.stunT.toFixed(2)); }
{ const g = G(); const q = put(g, 'queen', 300); const p = put(g, 'pawn', 320); g.step(); ok(p.haste > 1.3, '여왕 둘레 빠르게'); }
{ const g = G(); const e = put(g, 'clockknight', 100); e.hp = e.maxHp = 1e6; run(g, 8); ok(e.wind > 1.2, '태엽 기사 빨라짐 ' + e.wind.toFixed(2)); }
{ // 17종 전부 길 끝까지 가는지(막힘 없음)
  for (const type of ENEMY_ORDER) { const g = G(); const e = put(g, type, 0); e.hp = e.maxHp = 1e9; run(g, 120); ok(!g.enemies.includes(e) && g.lives < L.lives, type + ' 성문 도착'); }
}
console.log('손 기술');
{ const g = G(); const e = put(g, 'pawn', 500); const h = e.hp; ok(g.useSkill('needles', e.x, e.y), '바늘비 씀'); ok(!g.useSkill('needles', e.x, e.y), '바늘비 대기'); run(g, 0.5); ok(e.hp < h, '바늘비 피해'); run(g, 30); ok(g.skillReady('needles'), '바늘비 다시'); }
{ const g = G(); const e = put(g, 'pawn', 500); const d0 = e.d; g.useSkill('rewind', e.x, e.y); ok(e.d < d0 - 100, '되감기'); }
{ const g = new Game({ ...L, waves: [[]] }, 'v', { seed: 7, mods: { skill: { needles: 3 }, spools: 2 } }); ok(g.skillInfo('needles').dmg > 45 && g.spoolsMax === 4, '공구함 강화 적용'); }
console.log('돌리기');
{ const g = G(); g.build(padNear(g, 500), 'barracks'); const c = put(g, 'crane', 200); const f = g.progress(c); g.setOrientation('h'); ok(Math.abs(g.progress(c) - f) < 0.01, '돌려도 나는 적 진행 같음'); run(g, 1); }
{ // 시험판 웨이브 끝까지
  const g = new Game(L, 'v', { seed: 3 }); for (const p of [...g.geo.pads.keys()]) g.build(p, TOWER_ORDER_ALL[p % 8]); g.callWave(); let n = 0;
  while (!g.result && n++ < 60 * 60 * 15) { g.step(); g.events.length = 0; }
  ok(!!g.result, '시험판 끝까지 감: ' + g.result + ' 생명 ' + g.lives);
}
console.log(`\n통과 ${pass} · 실패 ${fail}`);
process.exit(fail ? 1 : 0);
