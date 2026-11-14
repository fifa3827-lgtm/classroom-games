// 시작점: 불러오기, 저장, 장면 바꾸기 (인트로 → 제목 → 지도 → 판 → 결과 → 이야기 장면)
import { View } from './engine/view.js';
import { loadAll, loadImage, TOWER_IMGS, ENEMY_IMGS, UI_IMGS, CANNON_PARTS, ARCHER_PARTS } from './engine/assets.js';
import { audio } from './engine/audio.js';
import { getLevel, LEVELS } from './data/levels.js';
import { LevelScene } from './scenes/level.js';
import { loadSave, writeSave, modsFrom } from './engine/save.js';

const SFX = ['tower_place', 'tower_upgrade', 'tower_sell', 'thread_pull', 'thread_ting', 'thread_cut', 'arrow_shoot', 'cannon_fire', 'cannon_hit',
  'ice_shot', 'lightning_zap', 'hit_paint', 'hit_wood', 'hit_metal', 'enemy_pop', 'life_lost', 'wave_start', 'button', 'coin', 'fire_burn', 'freeze',
  'zap_chain', 'skill_needles', 'skill_rewind', 'star', 'boss_appear', 'whoosh', 'victory', 'defeat'];

// 주소에 아무것도 없을 때 처음 화면. (M1 검수 동안은 'level' — 자동 검사가 바로 판을 기다림)
const FIRST_SCREEN = 'level';
// 제목·지도·공구함 배경
const MENU_IMGS = [['menu_v', 'assets/maps/1-1_v.webp'], ['menu_h', 'assets/maps/1-1_h.webp']];

const app = {
  view: new View(document.getElementById('game')),
  scene: null,
  data: loadSave(),
  hasIntro: false,
  get settings() { return this.data.settings; },
  ui() { return document.getElementById('ui'); },
  save() { writeSave(this.data); window.__settings = this.settings; },
  wipe() { this.data = { stars: {}, tools: {}, settings: this.data.settings }; this.save(); },
  mods() { return modsFrom(this.data); },
  // 장면 바꾸기. 같은 장면 안 예약(setTimeout 등)은 장면이 스스로 alive로 막는다
  async go(name, opt = {}) {
    const token = this.goToken = (this.goToken || 0) + 1;
    let Next;
    if (name === 'level') {
      const L = getLevel(opt.id || LEVELS[0].id);
      if (!L) return this.go('map');
      await loadAll(['v', 'h'].map(o => [`map_${L.id}_${o}`, L.map[o].img]));
      if (token !== this.goToken) return;
      this.scene?.destroy();
      this.scene = new LevelScene(this, L);
      document.body.dataset.scene = 'level';
      return;
    }
    if (name === 'title' || name === 'map' || name === 'toolbox') {
      const [mod] = await Promise.all([
        name === 'title' ? import('./scenes/title.js') : name === 'map' ? import('./scenes/worldmap.js') : import('./scenes/toolbox.js'),
        loadAll(MENU_IMGS),
      ]);
      Next = name === 'title' ? mod.TitleScene : name === 'map' ? mod.MapScene : mod.ToolboxScene;
    } else if (name === 'intro') {
      const mod = await import('./scenes/intro.js');
      Next = class { constructor(app) { return new mod.IntroScene(app, { onDone: () => app.go('title', { fromIntro: true }), titleOnly: false }); } };
    } else if (name === 'story') {
      const mod = await import('./scenes/story.js');
      Next = class { constructor(app, o) { return new mod.StoryScene(app, o.key, { onDone: () => app.go(o.then || 'map', o.thenOpt || {}) }); } };
    } else return;
    if (token !== this.goToken) return;
    this.scene?.destroy();
    document.body.classList.remove('land');
    this.scene = new Next(this, opt);
    document.body.dataset.scene = name;
  },
  startLevel(id) { return this.go('level', { id }); },
};
window.__settings = app.settings;
window.__app = app; // 시험용

async function boot() {
  audio.init();
  audio.setVolume('music', app.settings.music);
  audio.setVolume('sfx', app.settings.sfx);
  app.view.resize();
  await Promise.all([loadAll([...TOWER_IMGS, ...CANNON_PARTS, ...ARCHER_PARTS, ...ENEMY_IMGS, ...UI_IMGS]), audio.load(SFX), document.fonts?.load?.('16px Dodum').catch(() => {})]);
  const q = new URLSearchParams(location.search);
  if (q.get('level')) await app.go('level', { id: q.get('level') });
  else await app.go(q.get('screen') || FIRST_SCREEN, {});
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
