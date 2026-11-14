// 적 자료. speed: 세로판 길 기준 초당 거리. mat: 맞을 때 소리 재질
// 특수: fly(날아서 성문으로 곧장), frostImmune(냉기 무시), burrow(땅속 숨기), cutter(실 끊기), heal(주변 회복),
//       ghost(종탑 둘레에서만 보임), split(죽으면 작은 방울), shed(맞을수록 방울 흘림), stunTowers(둘레 탑 멈춤),
//       haste(둘레 적 빠르게), windup(태엽: 갈수록 빨라짐), inkCut(실을 검게 물들여 끊음), elite(정예)
export const ENEMIES = {
  blob:   { name: '물감 방울', hp: 30,  speed: 62,  reward: 5,  lives: 1, mat: 'paint', size: 78, img: 'enemy_blob',   hop: 1.0 },
  pawn:   { name: '졸병 말',   hp: 60,  speed: 50,  reward: 8,  lives: 1, mat: 'wood',  size: 92, img: 'enemy_pawn',   hop: 0.6 },
  mouse:  { name: '태엽 쥐',   hp: 25,  speed: 108, reward: 6,  lives: 1, mat: 'metal', size: 80, img: 'enemy_mouse',  hop: 0.25 },
  knight: { name: '방패 기사', hp: 140, speed: 40,  reward: 16, lives: 2, mat: 'metal', size: 106, img: 'enemy_knight', hop: 0.45, physResist: 0.5 },
  mini:   { name: '작은 방울', hp: 14,  speed: 74,  reward: 2,  lives: 1, mat: 'paint', size: 54, img: 'enemy_blob',   hop: 1.2 },
  splitblob: { name: '갈라지는 방울', hp: 70, speed: 52, reward: 8, lives: 1, mat: 'paint', size: 92, img: 'enemy_splitblob', hop: 0.9, split: 2 },
  crane:  { name: '종이학',     hp: 45,  speed: 70,  reward: 9,  lives: 1, mat: 'wood',  size: 92, img: 'enemy_crane', hop: 0, fly: true },
  snowman:{ name: '눈사람 병정', hp: 110, speed: 44, reward: 12, lives: 1, mat: 'wood',  size: 96, img: 'enemy_snowman', hop: 0.35, frostImmune: true },
  mole:   { name: '두더지 말',  hp: 90,  speed: 54,  reward: 11, lives: 1, mat: 'wood',  size: 90, img: 'enemy_mole', hop: 0.5, burrow: [3.2, 1.6] },
  scissorbug: { name: '가위벌레', hp: 75, speed: 66, reward: 12, lives: 1, mat: 'metal', size: 86, img: 'enemy_scissorbug', hop: 0.3, cutter: true },
  bishop: { name: '치유 주교',  hp: 120, speed: 42,  reward: 15, lives: 1, mat: 'wood',  size: 100, img: 'enemy_bishop', hop: 0.4, heal: [150, 0.06, 2] },
  ghost:  { name: '천 유령',    hp: 95,  speed: 56,  reward: 13, lives: 1, mat: 'paint', size: 94, img: 'enemy_ghost', hop: 0, ghost: true, float: true },
  crab:   { name: '게 기사',    hp: 130, speed: 76,  reward: 14, lives: 1, mat: 'metal', size: 100, img: 'enemy_crab', hop: 0.2, physResist: 0.35, sideways: true },
  // 정예
  golem:  { name: '물감 골렘',  hp: 650, speed: 30, reward: 45, lives: 3, mat: 'paint', size: 150, img: 'enemy_golem', hop: 0.25, elite: true, shed: 0.2 },
  rook:   { name: '흑성채',     hp: 520, speed: 26, reward: 45, lives: 3, mat: 'wood',  size: 140, img: 'enemy_rook', hop: 0.15, elite: true, stunTowers: [130, 1.6, 4] },
  queen:  { name: '여왕 말',    hp: 340, speed: 40, reward: 40, lives: 3, mat: 'wood',  size: 130, img: 'enemy_queen', hop: 0.3, elite: true, haste: [160, 1.35] },
  clockknight: { name: '태엽 기사', hp: 420, speed: 30, reward: 42, lives: 3, mat: 'metal', size: 136, img: 'enemy_clockknight', hop: 0.35, elite: true, physResist: 0.3, windup: [3, 0.18, 2.2] },
  inkgiant: { name: '먹물 거인', hp: 760, speed: 28, reward: 50, lives: 4, mat: 'paint', size: 160, img: 'enemy_inkgiant', hop: 0.2, elite: true, inkCut: true },
};
export const CHAPTER_HP = 1.35; // 장마다 체력 배수
export const ENEMY_ORDER = ['blob', 'pawn', 'mouse', 'knight', 'splitblob', 'crane', 'snowman', 'mole', 'scissorbug', 'bishop', 'ghost', 'crab', 'golem', 'rook', 'queen', 'clockknight', 'inkgiant'];
