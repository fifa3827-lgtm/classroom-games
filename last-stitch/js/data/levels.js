// 판 자료: 웨이브·금화·대사. 길·빈자리 좌표는 maps.js(그림에서 따낸 좌표)
import { MAPS } from './maps.js';

// 어떤 화면비에서도 보여야 하는 구역 (tools/layout.py 의 SAFE 와 같게)
export const SAFE = { v: [0.14, 0.09, 0.86, 0.91], h: [0.09, 0.17, 0.91, 0.83] };

// 웨이브 글: "blob*6/1.1" = 물감 방울 6마리 1.1초 간격. 쉼표로 무리를 잇고, "+2" 는 앞 무리 시작 2초 뒤 같이 출발
function W(str) {
  const groups = [];
  let t = 0;
  for (const part of str.split(',')) {
    const m = part.trim().match(/^(\+[\d.]+\s+)?(\w+)\*(\d+)\/([\d.]+)(?:@(\d))?$/);
    if (!m) throw new Error('웨이브 글 오류: ' + part);
    const start = m[1] ? groups.length ? groups[groups.length - 1].t + parseFloat(m[1]) : 0 : t;
    const g = { t: start, type: m[2], n: +m[3], gap: +m[4], path: m[5] ? +m[5] : -1 };
    groups.push(g);
    t = Math.max(t, start + g.n * g.gap + 1.2);
  }
  return groups;
}

export const LEVELS = [
  {
    id: '1-1', chapter: 1, name: '숲의 입구', gold: 200, lives: 20, music: 'ch1', hpMul: 1.6,
    waves: [
      W('blob*6/1.3'),
      W('blob*9/1.0'),
      W('pawn*4/1.6, blob*6/0.9'),
      W('blob*8/0.7, +3 pawn*4/1.4'),
      W('mouse*6/0.9'),
      W('pawn*6/1.1, +4 mouse*5/0.8'),
      W('knight*2/3.0, blob*10/0.6'),
      W('pawn*8/0.9, +2 mouse*7/0.7'),
      W('knight*4/2.2, +3 pawn*6/1.0'),
      W('blob*14/0.45, +2 knight*4/2.0, +4 mouse*8/0.6'),
    ],
    // 판 시작 말풍선
    talk: [
      { who: '장인의 일기', text: '"작은 왕국에도 성문은 있다. 성문을 지키는 건 늘 가장 작은 손이다."' },
      { who: '나', text: '스승님의 바늘과 실… 이걸로 숲 왕국부터 지켜야 해.' },
    ],
    tutorial: true,
  },
  // 시험판(지도에 안 나옴): 8종 탑·갈래·적 17종 행동 확인용. ?level=test
  {
    id: 'test', mapId: '1-1', chapter: 1, name: '시험판', gold: 6000, lives: 60, music: 'ch1', hpMul: 1, test: true, allTowers: true, branches: true,
    waves: [
      W('blob*3/1, pawn*3/1, mouse*3/0.8, knight*2/2'),
      W('splitblob*4/1.4, crane*4/1.4'),
      W('snowman*3/1.6, mole*3/1.6'),
      W('scissorbug*3/1.8, bishop*1/1, +1 pawn*6/0.8'),
      W('ghost*4/1.5, crab*4/1.2'),
      W('golem*1/1, rook*1/1'),
      W('queen*1/1, +1 pawn*6/0.6, clockknight*1/1'),
      W('inkgiant*1/1'),
    ],
    talk: [],
  },
];

export function getLevel(id) {
  const L = LEVELS.find(l => l.id === id);
  return L ? { ...L, map: MAPS[L.mapId || id] } : null;
}
