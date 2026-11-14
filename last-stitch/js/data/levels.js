// 판 자료: 웨이브·금화·대사. 길·빈자리 좌표는 maps.js(그림에서 따낸 좌표)
import { MAPS } from './maps.js';
import { LEVEL_TEXT } from './story.js';

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

// ── M3: 1-2 ~ 5-3 ──  적 첫 등장은 기획서 6장, 탑 열림은 towers.js 의 ch
const M3 = {
  '1-2': { gold: 220, hpMul: 1.6, waves: [
    'blob*8/1.0', 'pawn*5/1.4, blob*5/0.9', 'mouse*6/0.8', 'pawn*6/1.0, +3 mouse*5/0.7', 'knight*2/2.6, blob*10/0.6',
    'blob*12/0.5, +2 pawn*6/1.0', 'knight*3/2.2, +3 mouse*8/0.6', 'pawn*10/0.8, +2 knight*3/2.0', 'mouse*14/0.45, +4 pawn*6/0.9', 'knight*5/1.8, +2 blob*16/0.4, +6 mouse*8/0.5'] },
  '1-3': { gold: 240, hpMul: 1.7, waves: [
    'blob*8/0.9', 'pawn*6/1.1, +2 blob*6/0.8', 'mouse*8/0.6', 'knight*2/2.2, +2 pawn*6/1.0', 'blob*14/0.45, +3 mouse*6/0.6',
    'pawn*8/0.8, +3 knight*3/2.0', 'mouse*12/0.45, +2 blob*12/0.5', 'knight*5/1.6, +4 pawn*8/0.8', 'blob*18/0.35, +3 mouse*10/0.5, +6 knight*3/1.8',
    'pawn*12/0.6, +2 knight*6/1.4, +8 mouse*12/0.4', 'knight*8/1.2, +3 blob*20/0.3, +8 pawn*10/0.6'] },
  '1-4': { gold: 260, hpMul: 1.7, boss: 'inkbottle', waves: [
    'blob*10/0.8', 'pawn*8/0.9, +3 mouse*6/0.7', 'knight*3/2.0, +2 blob*12/0.5', 'mouse*14/0.4, +4 pawn*8/0.8', 'knight*5/1.6, +3 pawn*10/0.7',
    'blob*20/0.35, +3 knight*4/1.6, +6 mouse*10/0.5', 'pawn*14/0.6, +4 knight*6/1.4', 'mouse*18/0.35, +3 blob*20/0.3, +8 knight*5/1.4',
    'knight*8/1.2, +4 pawn*14/0.5', 'inkbottle*1/1, +4 blob*16/0.6, +10 pawn*10/0.8'] },
  // 2장: 독 가마솥(2-2부터 ch2라 2-1부터 세움), 갈라지는 방울·종이학·눈사람, 정예 골렘
  '2-1': { gold: 260, hpMul: 1.25, waves: [
    'blob*10/0.8', 'crane*5/1.5', 'pawn*8/0.9, +3 crane*4/1.4', 'splitblob*5/1.4, +3 blob*8/0.7', 'snowman*4/1.8, +3 pawn*8/0.8',
    'crane*8/1.0, +4 mouse*10/0.5', 'splitblob*8/1.0, +3 knight*4/1.6', 'snowman*6/1.4, +3 crane*8/0.9', 'knight*6/1.4, +3 splitblob*8/0.9, +8 crane*6/0.8',
    'mouse*16/0.4, +3 snowman*8/1.1, +8 crane*10/0.6', 'splitblob*12/0.7, +4 knight*8/1.2, +10 crane*10/0.6'] },
  '2-2': { gold: 280, hpMul: 1.3, waves: [
    'pawn*8/0.9', 'splitblob*6/1.2', 'crane*8/1.0, +3 blob*10/0.6', 'knight*4/1.6, +3 snowman*4/1.6', 'splitblob*10/0.8, +3 crane*6/1.0',
    'snowman*8/1.1, +4 mouse*12/0.45', 'golem*1/1, +3 pawn*10/0.7', 'crane*12/0.7, +4 knight*6/1.3', 'splitblob*14/0.6, +4 snowman*8/1.0',
    'golem*2/6, +3 crane*12/0.6, +6 mouse*14/0.4', 'knight*10/1.0, +4 splitblob*14/0.6, +10 crane*12/0.5', 'golem*3/5, +2 snowman*10/0.9, +8 crane*14/0.5'] },
  '2-3': { gold: 300, hpMul: 1.35, waves: [
    'splitblob*8/1.0', 'crane*10/0.9', 'snowman*6/1.3, +3 pawn*10/0.7', 'splitblob*12/0.7, +4 mouse*12/0.45', 'golem*1/1, +3 crane*10/0.8',
    'knight*8/1.1, +3 snowman*6/1.2', 'splitblob*16/0.5, +4 crane*12/0.6', 'golem*2/5, +4 knight*8/1.0', 'snowman*12/0.8, +3 mouse*20/0.35',
    'crane*18/0.45, +4 splitblob*16/0.5', 'golem*3/4, +3 knight*12/0.8, +10 crane*14/0.5', 'splitblob*20/0.4, +3 snowman*14/0.7, +8 golem*2/5'] },
  '2-4': { gold: 320, hpMul: 1.35, boss: 'bear', waves: [
    'splitblob*10/0.9', 'crane*10/0.8, +3 snowman*4/1.5', 'golem*1/1, +3 pawn*12/0.6', 'knight*8/1.1, +4 crane*10/0.7', 'snowman*10/1.0, +3 splitblob*12/0.6',
    'golem*2/5, +4 mouse*18/0.4', 'crane*16/0.5, +4 knight*10/0.9', 'splitblob*18/0.45, +4 golem*2/5', 'snowman*14/0.7, +4 crane*16/0.5',
    'bear*1/1, +6 splitblob*14/0.7, +14 snowman*8/1.0'] },
  // 3장: 바늘 석궁, 두더지·가위벌레·치유 주교, 정예 흑성채·태엽 기사
  '3-1': { gold: 320, hpMul: 1.2, waves: [
    'pawn*10/0.8', 'mole*5/1.4', 'knight*6/1.2, +3 mole*5/1.2', 'scissorbug*4/1.6, +3 pawn*10/0.7', 'bishop*2/3, +2 knight*8/1.0',
    'mole*10/0.9, +3 crane*8/0.8', 'scissorbug*8/1.0, +4 splitblob*10/0.7', 'rook*1/1, +3 pawn*14/0.6', 'bishop*3/2.5, +2 snowman*10/0.9, +6 mole*8/0.9',
    'scissorbug*12/0.7, +4 knight*10/0.9', 'rook*2/6, +3 mole*14/0.6, +8 bishop*3/2', 'clockknight*1/1, +3 scissorbug*14/0.6, +8 knight*10/0.8'] },
  '3-2': { gold: 340, hpMul: 1.25, waves: [
    'scissorbug*6/1.2', 'mole*8/1.0, +3 pawn*8/0.8', 'bishop*2/3, +2 knight*8/1.0', 'crane*12/0.7, +3 scissorbug*6/1.0', 'rook*1/1, +3 mole*10/0.8',
    'splitblob*14/0.6, +3 bishop*3/2.5', 'clockknight*1/1, +3 scissorbug*10/0.8', 'mole*16/0.6, +4 knight*10/0.9', 'rook*2/5, +4 bishop*4/2, +8 crane*12/0.6',
    'scissorbug*16/0.5, +3 snowman*12/0.8', 'clockknight*2/5, +3 mole*18/0.5, +10 bishop*4/2', 'golem*2/5, +3 rook*2/5, +6 scissorbug*18/0.5, +12 clockknight*1/1'] },
  '3-3': { gold: 360, hpMul: 1.3, waves: [
    'bishop*2/3, +1 pawn*12/0.6', 'mole*10/0.9', 'scissorbug*8/1.0, +3 knight*8/1.0', 'rook*1/1, +3 bishop*3/2.5', 'crane*14/0.6, +4 mole*10/0.8',
    'clockknight*1/1, +3 splitblob*16/0.5', 'bishop*5/2, +3 knight*12/0.8', 'scissorbug*16/0.5, +4 rook*2/5', 'mole*20/0.45, +4 clockknight*2/5',
    'golem*2/5, +3 bishop*6/1.6, +8 crane*16/0.5', 'rook*3/4, +3 scissorbug*20/0.4, +10 snowman*12/0.8', 'clockknight*3/4, +3 bishop*6/1.5, +6 mole*20/0.4, +12 golem*2/5'] },
  '3-4': { gold: 380, hpMul: 1.3, boss: 'snake', waves: [
    'mole*10/0.9', 'scissorbug*10/0.8, +3 bishop*2/3', 'rook*1/1, +3 knight*10/0.9', 'crane*16/0.5, +4 mole*12/0.7', 'clockknight*2/5, +3 bishop*4/2',
    'splitblob*18/0.45, +4 scissorbug*14/0.6', 'golem*2/5, +4 rook*2/5', 'bishop*6/1.5, +3 mole*20/0.4, +8 clockknight*2/5', 'scissorbug*20/0.4, +4 snowman*14/0.7',
    'snake*1/1, +6 bishop*4/2.5, +12 mole*14/0.7'] },
  // 4장: 종탑·골무 병영, 천 유령·게 기사, 정예 여왕 말. 길 둘(4-2~)
  '4-1': { gold: 400, hpMul: 1.15, waves: [
    'pawn*12/0.7', 'ghost*4/1.5', 'crab*6/1.0, +3 pawn*10/0.7', 'ghost*6/1.2, +3 mole*8/0.9', 'queen*1/1, +2 pawn*14/0.5',
    'crab*10/0.8, +3 scissorbug*8/0.9', 'ghost*10/0.9, +4 bishop*3/2.5', 'rook*2/5, +3 crab*12/0.7', 'queen*1/1, +2 knight*14/0.7, +8 ghost*8/1.0',
    'clockknight*2/5, +3 crab*16/0.55', 'ghost*16/0.6, +4 queen*2/5, +10 splitblob*16/0.5', 'golem*3/4, +3 crab*20/0.45, +8 ghost*12/0.7, +14 queen*1/1'] },
  '4-2': { gold: 420, hpMul: 1.2, waves: [
    'pawn*8/0.8@0, +0 pawn*8/0.8@1', 'crab*6/1.0@0, +2 ghost*5/1.3@1', 'queen*1/1@0, +1 pawn*12/0.6@0, +3 knight*8/1.0@1', 'scissorbug*8/0.9@1, +2 mole*10/0.8@0',
    'ghost*10/0.9, +3 crab*10/0.8', 'rook*1/1@0, +2 bishop*4/2@1, +4 crab*10/0.7@1', 'clockknight*2/5@1, +3 ghost*12/0.7@0', 'queen*2/5, +3 knight*16/0.6',
    'crane*16/0.5, +3 crab*16/0.6', 'golem*2/5@0, +2 rook*2/5@1, +8 ghost*14/0.6', 'queen*2/4, +2 clockknight*2/4, +6 crab*20/0.45, +10 scissorbug*16/0.5',
    'inkgiant*1/1@0, +4 ghost*18/0.5@1, +10 crab*20/0.4'] },
  '4-3': { gold: 440, hpMul: 1.2, waves: [
    'crab*10/0.8', 'ghost*8/1.0, +3 pawn*12/0.6', 'queen*1/1, +2 splitblob*14/0.6', 'scissorbug*10/0.8, +3 crab*10/0.7', 'rook*2/5, +3 ghost*10/0.8',
    'bishop*5/1.8, +3 crab*14/0.6', 'clockknight*2/5, +3 mole*16/0.5', 'queen*2/5, +3 ghost*16/0.55', 'inkgiant*1/1, +4 crab*18/0.5', 'golem*3/4, +3 scissorbug*18/0.45',
    'queen*3/4, +3 ghost*20/0.45, +10 clockknight*2/4', 'inkgiant*2/8, +4 crab*24/0.4, +10 queen*2/4, +16 ghost*16/0.5'] },
  '4-4': { gold: 460, hpMul: 1.2, boss: 'ship', waves: [
    'crab*10/0.8', 'ghost*10/0.8, +3 pawn*14/0.5', 'queen*1/1, +2 crab*12/0.6', 'scissorbug*12/0.7, +3 ghost*10/0.8', 'rook*2/5, +3 bishop*4/2',
    'clockknight*2/5, +3 crab*16/0.5', 'inkgiant*1/1, +3 ghost*16/0.55', 'queen*2/5, +3 crab*20/0.45, +8 golem*2/5', 'scissorbug*20/0.4, +4 ghost*20/0.45',
    'ship*1/1, +6 crab*16/0.6, +14 ghost*12/0.7'] },
  // 5장: 모두. 정예 먹물 거인 많음
  '5-1': { gold: 480, hpMul: 1.1, waves: [
    'pawn*14/0.5', 'splitblob*14/0.6, +3 crane*10/0.7', 'mole*12/0.7, +3 scissorbug*8/0.9', 'ghost*12/0.7, +3 crab*10/0.7', 'golem*2/5, +3 bishop*4/2',
    'queen*2/5, +2 knight*16/0.6', 'inkgiant*1/1, +3 scissorbug*14/0.6', 'clockknight*3/4, +3 crane*20/0.4', 'rook*3/4, +3 ghost*18/0.5, +8 snowman*14/0.6',
    'inkgiant*2/6, +4 crab*20/0.45', 'queen*3/4, +3 splitblob*24/0.35, +8 golem*3/4', 'clockknight*4/3, +3 mole*24/0.35, +10 inkgiant*2/6',
    'golem*4/3, +3 queen*3/4, +6 ghost*24/0.35, +12 crab*24/0.4'] },
  '5-2': { gold: 500, hpMul: 1.15, waves: [
    'crab*12/0.7@0, +0 crane*10/0.8@1', 'ghost*12/0.7, +3 mole*12/0.7', 'scissorbug*12/0.7@1, +2 bishop*4/2@0', 'golem*2/5@0, +2 queen*1/1@1, +3 knight*16/0.6@1',
    'inkgiant*1/1, +3 crab*18/0.5', 'clockknight*3/4, +3 ghost*18/0.5', 'rook*3/4@0, +2 splitblob*24/0.35@1', 'queen*3/4, +3 crane*24/0.35, +8 mole*20/0.4',
    'inkgiant*2/6, +4 scissorbug*24/0.35', 'golem*4/3, +3 bishop*6/1.5, +8 crab*24/0.35', 'clockknight*4/3@1, +3 ghost*28/0.3@0, +10 queen*3/4',
    'inkgiant*3/5, +4 crab*28/0.3, +10 golem*3/4', 'queen*4/3, +3 clockknight*4/3, +6 rook*3/4, +12 ghost*30/0.3'] },
  '5-3': { gold: 540, hpMul: 1.15, boss: 'hand', waves: [
    'crab*14/0.6', 'ghost*14/0.6, +3 scissorbug*10/0.8', 'golem*2/5, +3 queen*1/1, +4 mole*16/0.5', 'inkgiant*1/1, +3 crane*20/0.4', 'clockknight*3/4, +3 bishop*5/1.8',
    'rook*3/4, +3 crab*22/0.4', 'queen*3/4, +3 ghost*24/0.35, +8 inkgiant*1/1', 'golem*4/3, +3 scissorbug*24/0.35', 'clockknight*4/3, +3 splitblob*28/0.3, +8 queen*2/4',
    'inkgiant*3/5, +4 ghost*28/0.3, +10 crab*24/0.35', 'hand*1/1, +8 golem*3/5, +20 queen*3/5, +30 inkgiant*2/8'] },
};

for (const [id, d] of Object.entries(M3)) {
  const ch = +id[0], T = LEVEL_TEXT[id] || {};
  LEVELS.splice(LEVELS.findIndex(l => l.test), 0, {
    id, chapter: ch, name: T.name || id, gold: d.gold, lives: 20, music: 'ch' + ch, bossMusic: ch <= 2 ? 'boss1' : 'boss2', hpMul: d.hpMul,
    boss: d.boss || null, waves: d.waves.map(W), talk: (T.talk || []).map(([who, text]) => ({ who, text })),
  });
}

export function getLevel(id) {
  const L = LEVELS.find(l => l.id === id);
  return L ? { ...L, map: MAPS[L.mapId || id] } : null;
}
