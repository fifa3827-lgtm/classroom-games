// 시작점: 불러오기, 설정 저장, 장면 돌리기
import { View } from './engine/view.js';
import { loadAll, TOWER_IMGS, ENEMY_IMGS, UI_IMGS, CANNON_PARTS } from './engine/assets.js';
import { audio } from './engine/audio.js';
import { getLevel, LEVELS } from './data/levels.js';
import { LevelScene } from './scenes/level.js';

const SFX = ['tower_place', 'tower_upgrade', 'tower_sell', 'thread_pull', 'thread_ting', 'thread_cut', 'arrow_shoot', 'cannon_fire', 'cannon_hit',
  'ice_shot', 'lightning_zap', 'hit_paint', 'hit_wood', 'hit_metal', 'enemy_pop', 'life_lost', 'wave_start', 'button', 'coin', 'fire_burn', 'freeze',
  'zap_chain', 'skill_needles', 'skill_rewind', 'star', 'boss_appear', 'whoosh', 'victory', 'defeat'];

const KEY = 'last-stitch-v1';
function loadSave() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } }

const app = {
  view: new View(document.getElementById('game')),
  scene: null,
  data: loadSave(),
  get settings() { return (this.data.settings ||= { music: 0.7, sfx: 0.85, vibe: true }); },
  save() { try { localStorage.setItem(KEY, JSON.stringify(this.data)); } catch {} window.__settings = this.settings; },
  async startLevel(id) {
    const L = getLevel(id);
    await loadAll(['v', 'h'].map(o => [`map_${id}_${o}`, L.map[o].img]));
    this.scene?.destroy();
    this.scene = new LevelScene(this, L);
  },
};
window.__settings = app.settings;
window.__app = app; // 시험용

async function boot() {
  audio.init();
  audio.setVolume('music', app.settings.music);
  audio.setVolume('sfx', app.settings.sfx);
  app.view.resize();
  await Promise.all([loadAll([...TOWER_IMGS, ...CANNON_PARTS, ...ENEMY_IMGS, ...UI_IMGS]), audio.load(SFX), document.fonts?.load?.('16px Dodum').catch(() => {})]);
  const first = new URLSearchParams(location.search).get('level') || LEVELS[0].id;
  await app.startLevel(first);
  document.getElementById('boot').classList.add('hide');
  let last = performance.now();
  const loop = now => {
    const dt = Math.min(0.1, (now - last) / 1000); last = now;
    app.scene?.frame(dt);
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
  let rz = 0;
  const onResize = () => { cancelAnimationFrame(rz); rz = requestAnimationFrame(() => app.scene?.resize()); };
  window.addEventListener('resize', onResize);
  window.addEventListener('orientationchange', () => setTimeout(onResize, 120));
}
boot();
