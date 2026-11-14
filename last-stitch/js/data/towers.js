// 탑 자료. 좌표 단위: 맵 짧은 변 = 1000
export const ELEM_NAME = { pierce: '관통', fire: '불', frost: '냉기', shock: '전기', poison: '독', bind: '묶음', echo: '공명' };

// ch: 이 장부터 세울 수 있음. ground: 나는 적을 못 맞힘
export const TOWERS = {
  archer: {
    name: '궁수 망루', elem: 'pierce', cost: 70, range: 230, rate: 0.55, dmg: 9, dtype: 'phys', proj: 'arrow', ch: 1,
    desc: '빠르게 한 발씩 쏩니다.', sfx: 'arrow_shoot', h: 150,
  },
  cannon: {
    name: '대포탑', elem: 'fire', cost: 110, range: 200, rate: 1.6, dmg: 22, splash: 70, dtype: 'blast', proj: 'ball', ch: 1, ground: true,
    desc: '넓게 터집니다. 느리지만 무리를 쓸어 냅니다. 나는 적은 못 맞힙니다.', sfx: 'cannon_fire', h: 120,
  },
  ice: {
    name: '얼음 수정', elem: 'frost', cost: 90, range: 190, rate: 1.0, dmg: 4, slow: 0.4, slowDur: 2, dtype: 'magic', proj: 'shard', ch: 1,
    desc: '맞은 적을 느리게 만듭니다.', sfx: 'ice_shot', h: 140,
  },
  lightning: {
    name: '번개 구슬', elem: 'shock', cost: 130, range: 210, rate: 1.3, dmg: 16, chain: 3, dtype: 'magic', proj: 'bolt', ch: 1,
    desc: '번개가 여러 적에게 튑니다. 갑옷도 통합니다.', sfx: 'lightning_zap', h: 150,
  },
  poison: {
    name: '독 가마솥', elem: 'poison', cost: 100, range: 180, rate: 1.2, dmg: 2, dot: 6, dotDur: 4, splash: 45, dtype: 'magic', proj: 'glob', ch: 2, ground: true,
    desc: '독을 끼얹어 계속 피해를 줍니다. 갑옷을 무시합니다.', sfx: 'ice_shot', h: 120,
  },
  crossbow: {
    name: '바늘 석궁', elem: 'pierce', cost: 150, range: 420, rate: 2.4, dmg: 70, pierceN: 2, dtype: 'phys', proj: 'needle', ch: 3,
    desc: '아주 멀리 큰 바늘을 쏩니다. 일렬의 적 둘을 꿰뚫습니다.', sfx: 'arrow_shoot', h: 130,
  },
  bell: {
    name: '종탑', elem: 'echo', cost: 120, range: 200, rate: 0, dmg: 0, aura: 0.2, proj: 'none', ch: 4,
    desc: '둘레의 탑이 20% 빨리 쏩니다. 숨은 적(천 유령)을 드러냅니다.', sfx: 'button', h: 150,
  },
  barracks: {
    name: '골무 병영', elem: 'bind', cost: 90, range: 150, rate: 0, dmg: 6, soldiers: 2, sHp: 60, sRate: 0.8, proj: 'none', ch: 4,
    desc: '병사 둘이 길을 막고 적을 붙잡아 싸웁니다. 나는 적은 못 막습니다.', sfx: 'button', h: 120,
  },
};
export const TOWER_ORDER = ['archer', 'cannon', 'ice', 'lightning'];   // M1 화면용(장면을 고칠 때 ALL로 바꿈)
export const TOWER_ORDER_ALL = ['archer', 'cannon', 'ice', 'lightning', 'poison', 'crossbow', 'bell', 'barracks'];

// 4단계 갈래. mul: towerStats에 곱하는 값, 나머지는 특수 규칙(game.js)
export const BRANCHES = {
  archer: {
    a: { name: '연발 궁수', desc: '화살을 두 배 빠르게 쏩니다.', rate: 0.5 },
    b: { name: '매 사냥꾼', desc: '나는 적에게 피해 2.5배, 사거리가 깁니다.', range: 1.25, antiAir: 2.5 },
  },
  cannon: {
    a: { name: '박격포', desc: '아주 멀리, 더 넓게 터집니다.', range: 1.8, splash: 1.25, rate: 1.25 },
    b: { name: '화염 대포', desc: '터진 곳의 적에게 불이 붙습니다.', fireDot: 14 },
  },
  ice: {
    a: { name: '눈보라', desc: '사거리 안 모든 적을 한꺼번에 느리게 합니다.', blizzard: true, range: 1.1 },
    b: { name: '빙결 창', desc: '세 번 맞힐 때마다 적을 얼려 멈춥니다.', freezeEvery: 3, dmg: 2.2 },
  },
  lightning: {
    a: { name: '폭풍 구슬', desc: '번개가 네 마리 더 튑니다.', chainAdd: 4 },
    b: { name: '번개 기둥', desc: '한 놈에게 세 배로 강하게 내리칩니다.', chainSet: 1, dmg: 3 },
  },
  poison: {
    a: { name: '역병', desc: '독이 둘레의 적에게 퍼집니다.', spread: 110 },
    b: { name: '녹이는 산', desc: '갑옷을 녹여 모든 피해를 30% 더 받게 합니다.', melt: 0.3 },
  },
  crossbow: {
    a: { name: '저격', desc: '가장 튼튼한 적을 노리고, 강한 적에게 피해 2배.', snipe: 2 },
    b: { name: '꿰뚫는 바늘', desc: '일렬로 선 적을 모두 꿰뚫습니다.', pierceAll: true },
  },
  bell: {
    a: { name: '전쟁 종', desc: '둘레의 탑이 40% 빨리 쏩니다.', aura: 0.4 },
    b: { name: '맑은 종', desc: '실패가 하나 늘고, 둘레 탑이 25% 빨라집니다.', aura: 0.25, spool: 1 },
  },
  barracks: {
    a: { name: '기사단', desc: '튼튼한 기사 셋이 길을 막습니다.', soldiers: 3, sHp: 2 },
    b: { name: '창병', desc: '창병의 피해 2배, 강한 적에게 또 2배.', dmg: 2, antiElite: 2 },
  },
};
export const BRANCH_CH = 2;   // 이 장부터 4단계 갈래를 고를 수 있음

// 단계 올리기 값: 다음 단계 = 처음 값 × 0.8, × 1.2, 4단계 갈래 = × 2.0
export function upgradeCost(type, level) {
  const c = TOWERS[type].cost;
  if (level === 1) return Math.round(c * 0.8 / 5) * 5;
  if (level === 2) return Math.round(c * 1.2 / 5) * 5;
  if (level === 3) return Math.round(c * 2.0 / 5) * 5;
  return 0;
}
export const MAX_LEVEL = 3;   // 금화로 올리는 단계. 4단계는 갈래 고르기

// 단계별 실제 수치 (branch: 4단계 갈래 'a'|'b')
export function towerStats(type, level, branch) {
  const b = TOWERS[type];
  const k = Math.pow(1.6, level - 1);
  const s = {
    ...b,
    dmg: b.dmg * k,
    dot: b.dot ? b.dot * k : 0,
    range: b.range * (1 + 0.08 * (level - 1)),
    rate: b.rate * (1 - 0.06 * (level - 1)),
    slow: b.slow ? Math.min(0.62, b.slow + 0.08 * (level - 1)) : 0,
    chain: b.chain ? b.chain + (level - 1) : 0,
    splash: b.splash ? b.splash * (1 + 0.1 * (level - 1)) : 0,
    aura: b.aura ? b.aura + 0.04 * (level - 1) : 0,
    sHp: b.sHp ? b.sHp * Math.pow(1.5, level - 1) : 0,
    soldiers: b.soldiers || 0,
  };
  const B = level >= 4 && branch ? BRANCHES[type][branch] : null;
  if (B) {
    s.branch = branch; s.branchName = B.name;
    if (B.rate) s.rate *= B.rate;
    if (B.range) s.range *= B.range;
    if (B.splash) s.splash *= B.splash;
    if (B.dmg) s.dmg *= B.dmg;
    if (B.chainAdd) s.chain += B.chainAdd;
    if (B.chainSet) s.chain = B.chainSet;
    if (B.aura) s.aura = B.aura;
    if (B.soldiers) s.soldiers = B.soldiers;
    if (B.sHp) s.sHp *= B.sHp;
    for (const key of ['antiAir', 'fireDot', 'blizzard', 'freezeEvery', 'spread', 'melt', 'snipe', 'pierceAll', 'spool', 'antiElite']) if (B[key]) s[key] = B[key];
  }
  return s;
}

// 실 조합: 두 탑의 속성을 섞은 효과
export const THREAD_RANGE = 36;   // 실 양쪽 폭
// 실로 이으면 상대 탑의 속성을 나눠 받는다(맞힌 적에게 섞여 들어감)
export const SHARE_DESC = { pierce: '피해 +20%', fire: '불붙음', frost: '느려짐', shock: '가끔 멈춤', poison: '독', bind: '가끔 붙잡음', echo: '공격력 +30%' };
export const THREAD_MAX_LEN = 400;
const C = (id, name, color, glow, desc) => ({ id, name, color, glow, desc });
export function threadCombo(e1, e2) {
  const has = (a, b) => (e1 === a && e2 === b) || (e1 === b && e2 === a);
  const any = a => e1 === a || e2 === a;
  if (e1 === e2) return C('echo', '공명 실', '#ffe08a', '#fff3c4', '같은 속성끼리 울려 두 탑의 공격력이 함께 오릅니다.');
  if (any('bind')) return C('snare', '올가미 실', '#d8b98a', '#fff1d6', '실 아래를 지나는 적을 잠깐 붙잡습니다.');
  if (any('echo')) return C('amp', '증폭 실', '#ffd36a', '#fff8d8', '이은 탑의 공격력이 크게 오르고, 실 아래의 적은 더 아프게 맞습니다.');
  if (has('poison', 'fire')) return C('smoke', '독연기 실', '#9ccf4a', '#e6ffb8', '실 아래에 넓은 독구름이 피어 지나는 적을 중독시킵니다.');
  if (any('poison')) return C('venom', '독침 실', '#7fd36a', '#dcffd0', '지나는 적이 독에 걸리고, 갑옷이 약해집니다.');
  if (has('fire', 'pierce')) return C('burn', '불화살 실', '#ff8a2a', '#ffd27a', '실 아래를 지나는 적에게 불이 붙습니다.');
  if (has('frost', 'shock')) return C('stun', '감전 서리 실', '#7fd8ff', '#e6f8ff', '지나는 적을 잠깐 멈추고 피해를 줍니다.');
  if (has('fire', 'frost')) return C('steam', '증기 실', '#e8eef2', '#ffffff', '짙은 김에 갇힌 적은 느려지고 더 아프게 맞습니다.');
  if (has('shock', 'pierce')) return C('rail', '레일 실', '#c79bff', '#f1e4ff', '실을 따라 번개가 오가며 적을 꿰뚫습니다.');
  if (has('frost', 'pierce')) return C('chill', '서리 화살 실', '#9fd6ff', '#e9f6ff', '지나는 적이 꽁꽁 느려집니다.');
  if (has('fire', 'shock')) return C('spark', '불꽃 실', '#ffb35a', '#fff0c0', '지나는 적에게 불꽃이 터져 큰 피해를 줍니다.');
  return C('echo', '공명 실', '#ffe08a', '#fff3c4', '두 탑의 공격력이 오릅니다.');
}

// 손 기술
export const SKILLS = {
  needles: { name: '바늘비', desc: '누른 곳에 바늘이 쏟아져 넓게 피해를 줍니다.', cd: 30, r: 120, dmg: 45, icon: 'skill_needles' },
  rewind: { name: '되감기', desc: '누른 곳의 적들을 길 뒤로 휙 감아 되돌립니다.', cd: 40, r: 110, back: 170, icon: 'skill_rewind' },
};
