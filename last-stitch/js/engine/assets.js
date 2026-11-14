// 그림 불러오기
export const IMG = {};
export function loadImage(key, src) {
  if (IMG[key]) return Promise.resolve(IMG[key]);
  return new Promise(res => {
    const im = new Image();
    im.decoding = 'async';
    im.onload = () => { IMG[key] = im; res(im); };
    im.onerror = () => { console.warn('그림 못 읽음', src); res(null); };
    im.src = src;
  });
}
export function loadAll(list) { return Promise.all(list.map(([k, s]) => loadImage(k, s))); }

export const TOWER_IMGS = ['archer', 'cannon', 'ice', 'lightning'].flatMap(t => [1, 2, 3].map(l => [`${t}_${l}`, `assets/towers/${t}_${l}.webp`]));
export const CANNON_PARTS = [1, 2, 3].flatMap(l => [[`cannon_base_${l}`, `assets/towers/cannon_base_${l}.webp`], [`cannon_barrel_${l}`, `assets/towers/cannon_barrel_${l}.webp`]]);
export const ENEMY_IMGS = ['blob', 'pawn', 'mouse', 'knight'].map(e => [`enemy_${e}`, `assets/enemies/enemy_${e}.webp`]);
export const UI_IMGS = ['icon_coin', 'icon_heart', 'icon_spool', 'icon_thimble', 'icon_star', 'icon_skull', 'skill_needles', 'skill_rewind'].map(k => [k, `assets/ui/${k}.webp`]);
