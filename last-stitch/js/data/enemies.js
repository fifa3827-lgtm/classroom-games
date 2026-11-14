// 적 자료. speed: 세로판 길 기준 초당 거리. mat: 맞을 때 소리 재질
export const ENEMIES = {
  blob:   { name: '물감 방울', hp: 30,  speed: 62,  reward: 5,  lives: 1, mat: 'paint', size: 78, img: 'enemy_blob',   hop: 1.0 },
  pawn:   { name: '졸병 말',   hp: 60,  speed: 50,  reward: 8,  lives: 1, mat: 'wood',  size: 92, img: 'enemy_pawn',   hop: 0.6 },
  mouse:  { name: '태엽 쥐',   hp: 25,  speed: 108, reward: 6,  lives: 1, mat: 'metal', size: 80, img: 'enemy_mouse',  hop: 0.25 },
  knight: { name: '방패 기사', hp: 140, speed: 40,  reward: 16, lives: 2, mat: 'metal', size: 106, img: 'enemy_knight', hop: 0.45, physResist: 0.5 },
};
export const CHAPTER_HP = 1.35; // 장마다 체력 배수
