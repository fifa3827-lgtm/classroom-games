// 저장: 진행(별)·골무·장인의 공구함·설정. localStorage 읽기·쓰기는 모두 try/catch
import { LEVELS } from '../data/levels.js';
import { TOWERS, TOWER_ORDER_ALL } from '../data/towers.js';

export const SAVE_KEY = 'last-stitch-v1';
export function loadSave() {
  let d = {};
  try { d = JSON.parse(localStorage.getItem(SAVE_KEY)) || {}; } catch { d = {}; }
  if (typeof d !== 'object' || !d) d = {};
  d.stars ||= {}; d.tools ||= {};
  d.settings = { music: 0.7, sfx: 0.85, vibe: true, ...(d.settings || {}) };
  return d;
}
export function writeSave(d) { try { localStorage.setItem(SAVE_KEY, JSON.stringify(d)); return true; } catch { return false; } }

// 지도에 나오는 판(시험판 빼고) 순서
export const playable = () => LEVELS.filter(l => !l.test);
export function levelUnlocked(d, id) {
  const P = playable(), i = P.findIndex(l => l.id === id);
  if (i <= 0) return i === 0;
  return (d.stars[P[i - 1].id] || 0) > 0;
}
export function nextLevelId(id) { const P = playable(), i = P.findIndex(l => l.id === id); return i >= 0 && i < P.length - 1 ? P[i + 1].id : null; }
// 판을 깨면: 가장 좋은 별만 남기고, 늘어난 만큼 골무를 받는다
export function recordWin(d, id, stars) {
  const old = d.stars[id] || 0;
  if (stars > old) d.stars[id] = stars;
  return Math.max(0, stars - old);   // 새로 받은 골무
}
export const thimblesEarned = d => Object.entries(d.stars).reduce((a, [id, s]) => a + (LEVELS.some(l => l.id === id && !l.test) ? s : 0), 0);

// ── 장인의 공구함 ──
// 칸: id, 가지, 이름, 설명, 단계별 값(골무). mods 에 반영하는 법은 modsFrom
const TOWER_NODES = TOWER_ORDER_ALL.flatMap(t => [
  { id: `dmg_${t}`, group: 'tower', tower: t, name: '날 세우기', desc: `${TOWERS[t].name} 공격력 +12%`, cost: [1] },
  { id: `range_${t}`, group: 'tower', tower: t, name: '멀리 보기', desc: `${TOWERS[t].name} 사거리 +10%`, cost: [1] },
  { id: `disc_${t}`, group: 'tower', tower: t, name: '아껴 쓰기', desc: `${TOWERS[t].name} 세우는 값 10% 할인`, cost: [1] },
]);
export const TOOL_NODES = [
  ...TOWER_NODES,
  { id: 'spools', group: 'thread', name: '실패 하나 더', desc: '이을 수 있는 실이 하나 늘어납니다.', cost: [2, 3, 4], icon: 'icon_spool' },
  { id: 'threadLen', group: 'thread', name: '긴 실', desc: '실이 닿는 거리 +12%', cost: [2, 2], icon: 'icon_spool' },
  { id: 'threadPow', group: 'thread', name: '단단한 실', desc: '실 효과 +20%', cost: [2, 3], icon: 'icon_spool' },
  { id: 'needles', group: 'skill', name: '바늘비 강화', desc: '피해 +40%, 범위 +12%, 기다림 -15%', cost: [1, 2, 3], icon: 'skill_needles' },
  { id: 'rewind', group: 'skill', name: '되감기 강화', desc: '되감는 거리 +25%, 범위 +12%, 기다림 -15%', cost: [1, 2, 3], icon: 'skill_rewind' },
];
export const nodeLv = (d, id) => d.tools[id] || 0;
export function thimblesSpent(d) {
  let s = 0;
  for (const n of TOOL_NODES) { const lv = nodeLv(d, n.id); for (let i = 0; i < lv; i++) s += n.cost[i]; }
  return s;
}
export const thimblesFree = d => thimblesEarned(d) - thimblesSpent(d);
export function nextCost(d, n) { const lv = nodeLv(d, n.id); return lv < n.cost.length ? n.cost[lv] : 0; }
export function buyNode(d, n) {
  const c = nextCost(d, n);
  if (!c || thimblesFree(d) < c) return false;
  d.tools[n.id] = nodeLv(d, n.id) + 1;
  return true;
}
export function resetTools(d) { const had = thimblesSpent(d); d.tools = {}; return had; }
// 공구함 → 게임 강화 값
export function modsFrom(d) {
  const m = { dmg: {}, range: {}, discount: {}, skill: {} };
  for (const t of TOWER_ORDER_ALL) {
    if (nodeLv(d, `dmg_${t}`)) m.dmg[t] = 0.12;
    if (nodeLv(d, `range_${t}`)) m.range[t] = 0.10;
    if (nodeLv(d, `disc_${t}`)) m.discount[t] = 0.10;
  }
  m.spools = nodeLv(d, 'spools');
  m.threadLen = 0.12 * nodeLv(d, 'threadLen');
  m.threadPow = 0.2 * nodeLv(d, 'threadPow');
  m.skill.needles = nodeLv(d, 'needles');
  m.skill.rewind = nodeLv(d, 'rewind');
  return m;
}
