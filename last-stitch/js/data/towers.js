// 탑 자료. 좌표 단위: 맵 짧은 변 = 1000
export const ELEM_NAME = { pierce: '관통', fire: '불', frost: '냉기', shock: '전기', poison: '독', bind: '묶음', echo: '공명' };

export const TOWERS = {
  archer: {
    name: '궁수 망루', elem: 'pierce', cost: 70, range: 230, rate: 0.55, dmg: 9, dtype: 'phys', proj: 'arrow',
    desc: '빠르게 한 발씩 쏩니다.', sfx: 'arrow_shoot', h: 150,
  },
  cannon: {
    name: '대포탑', elem: 'fire', cost: 110, range: 200, rate: 1.6, dmg: 22, splash: 70, dtype: 'blast', proj: 'ball',
    desc: '넓게 터집니다. 느리지만 무리를 쓸어 냅니다.', sfx: 'cannon_fire', h: 120,
  },
  ice: {
    name: '얼음 수정', elem: 'frost', cost: 90, range: 190, rate: 1.0, dmg: 4, slow: 0.4, slowDur: 2, dtype: 'magic', proj: 'shard',
    desc: '맞은 적을 느리게 만듭니다.', sfx: 'ice_shot', h: 140,
  },
  lightning: {
    name: '번개 구슬', elem: 'shock', cost: 130, range: 210, rate: 1.3, dmg: 16, chain: 3, dtype: 'magic', proj: 'bolt',
    desc: '번개가 여러 적에게 튑니다. 갑옷도 통합니다.', sfx: 'lightning_zap', h: 150,
  },
};
export const TOWER_ORDER = ['archer', 'cannon', 'ice', 'lightning'];

// 단계 올리기 값: 다음 단계 = 처음 값 × 0.8, × 1.2
export function upgradeCost(type, level) {
  const c = TOWERS[type].cost;
  if (level === 1) return Math.round(c * 0.8 / 5) * 5;
  if (level === 2) return Math.round(c * 1.2 / 5) * 5;
  return 0;
}
export const MAX_LEVEL = 3;

// 단계별 실제 수치
export function towerStats(type, level) {
  const b = TOWERS[type];
  const k = Math.pow(1.6, level - 1);
  return {
    ...b,
    dmg: b.dmg * k,
    range: b.range * (1 + 0.08 * (level - 1)),
    rate: b.rate * (1 - 0.06 * (level - 1)),
    slow: b.slow ? Math.min(0.62, b.slow + 0.08 * (level - 1)) : 0,
    chain: b.chain ? b.chain + (level - 1) : 0,
    splash: b.splash ? b.splash * (1 + 0.1 * (level - 1)) : 0,
  };
}

// 실 조합: 두 탑의 속성을 섞은 효과
// kind: burn(불붙음), stun(멈춤+피해), steam(느려짐+받는피해↑), rail(실 따라 번개 왕복), echo(두 탑 공격력↑), chill(느려짐), spark(한 번 큰 피해)
export const THREAD_RANGE = 36;   // 실 양쪽 폭
// 실로 이으면 상대 탑의 속성을 나눠 받는다(맞힌 적에게 섞여 들어감)
export const SHARE_DESC = { pierce: '피해 +20%', fire: '불붙음', frost: '느려짐', shock: '가끔 멈춤', echo: '공격력 +30%' };
export const THREAD_MAX_LEN = 400;
export function threadCombo(e1, e2) {
  const has = (a, b) => (e1 === a && e2 === b) || (e1 === b && e2 === a);
  if (e1 === e2) return { id: 'echo', name: '공명 실', color: '#ffe08a', glow: '#fff3c4', desc: '같은 속성끼리 울려 두 탑의 공격력이 함께 오릅니다.' };
  if (has('fire', 'pierce')) return { id: 'burn', name: '불화살 실', color: '#ff8a2a', glow: '#ffd27a', desc: '실 아래를 지나는 적에게 불이 붙습니다.' };
  if (has('frost', 'shock')) return { id: 'stun', name: '감전 서리 실', color: '#7fd8ff', glow: '#e6f8ff', desc: '지나는 적을 잠깐 멈추고 피해를 줍니다.' };
  if (has('fire', 'frost')) return { id: 'steam', name: '증기 실', color: '#e8eef2', glow: '#ffffff', desc: '짙은 김에 갇힌 적은 느려지고 더 아프게 맞습니다.' };
  if (has('shock', 'pierce')) return { id: 'rail', name: '레일 실', color: '#c79bff', glow: '#f1e4ff', desc: '실을 따라 번개가 오가며 적을 꿰뚫습니다.' };
  if (has('frost', 'pierce')) return { id: 'chill', name: '서리 화살 실', color: '#9fd6ff', glow: '#e9f6ff', desc: '지나는 적이 꽁꽁 느려집니다.' };
  if (has('fire', 'shock')) return { id: 'spark', name: '불꽃 실', color: '#ffb35a', glow: '#fff0c0', desc: '지나는 적에게 불꽃이 터져 큰 피해를 줍니다.' };
  return { id: 'echo', name: '공명 실', color: '#ffe08a', glow: '#fff3c4', desc: '두 탑의 공격력이 오릅니다.' };
}
