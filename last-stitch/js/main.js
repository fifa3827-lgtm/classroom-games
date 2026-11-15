// 시작점: 불러오기, 저장, 장면 바꾸기 (인트로 → 제목 → 지도 → 판 → 결과 → 이야기 장면)
import { View } from './engine/view.js';
import { loadAll, loadImage, TOWER_IMGS, ENEMY_IMGS, UI_IMGS, CANNON_PARTS, ARCHER_PARTS } from './engine/assets.js';
import { audio } from './engine/audio.js';
import { getLevel, LEVELS } from './data/levels.js';
import { LevelScene } from './scenes/level.js';
import { M2_IMGS } from './engine/render_m2.js';
import { loadSave, writeSave, modsFrom, thimblesEarned } from './engine/save.js';
import { MAPS } from './data/maps.js';
import { SCENES } from './data/story.js';

const LAST_ID = '5-3';

const SFX = ['tower_place', 'tower_upgrade', 'tower_sell', 'thread_pull', 'thread_ting', 'thread_cut', 'arrow_shoot', 'cannon_fire', 'cannon_hit',
  'ice_shot', 'lightning_zap', 'hit_paint', 'hit_wood', 'hit_metal', 'enemy_pop', 'life_lost', 'wave_start', 'button', 'coin', 'fire_burn', 'freeze',
  'zap_chain', 'skill_needles', 'skill_rewind', 'star', 'boss_appear', 'whoosh', 'victory', 'defeat'];

const FIRST_SFX = ['button', 'whoosh', 'coin', 'tower_upgrade'];   // 제목·지도·공구함에서 쓰는 소리
// 주소에 아무것도 없을 때 처음 화면 (자동 검사는 ?level=1-1 로 판을 바로 연다)
const FIRST_SCREEN = 'intro';
// 제목·지도·공구함 배경
const MENU_IMGS = [['menu_v', 'assets/intro/intro_c7_bg.webp'], ['menu_h', 'assets/intro/intro_c7_bg.webp']];

const app = {
  view: new View(document.getElementById('game')),
  scene: null,
  data: loadSave(),
  hasIntro: true,
  get settings() { return this.data.settings; },
  ui() { return document.getElementById('ui'); },
  save() { writeSave(this.data); window.__settings = this.settings; },
  wipe() { this.data = { stars: {}, tools: {}, settings: this.data.settings }; this.save(); },
  mods() { return modsFrom(this.data); },
  // 장면 바꾸기. 같은 장면 안 예약(setTimeout 등)은 장면이 스스로 alive로 막는다
  async go(name, opt = {}) {
    // 아직 못 본 장 끝 이야기·엔딩이 있으면 지도 대신 그것부터 (본 뒤에야 지움 → 놓치거나 새로고침해도 다시 나옴)
    const P = this.data.pending;
    if (name === 'map' && P) return P.kind === 'ending' ? this.go('ending', {}) : this.go('story', { key: P.key, then: 'map', thenOpt: { focus: P.focus }, clear: true });
    const token = this.goToken = (this.goToken || 0) + 1;
    let Next;
    if (name === 'level') {
      const L = getLevel(opt.id || LEVELS[0].id);
      if (!L) return this.go('map');
      await this.loadGame();
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
      Next = class { constructor(app, o) { return new mod.IntroScene(app, { onDone: r => app.go('title', { t: r?.t, quick: true }), ...(o.replay ? { titleOnly: false } : {}) }); } };
    } else if (name === 'story') {
      const mod = await import('./scenes/story.js');
      Next = class { constructor(app, o) { return new mod.StoryScene(app, o.key, { onDone: () => {
        if (o.clear) delete app.data.pending;
        if (o.seen) app.data[o.seen] = true;
        if (o.clear || o.seen) app.save();
        app.go(o.then || 'map', o.thenOpt || {});
      } }); } };
    } else if (name === 'ending') {
      const mod = await import('./scenes/ending.js');
      Next = class { constructor(app, o) { return new mod.EndingScene(app, { stats: o.stats || app.endStats(), onDone: () => { delete app.data.pending; app.data.cleared = true; app.save(); app.go('title', { quick: true }); } }); } };
    } else return;
    if (token !== this.goToken) return;
    this.scene?.destroy();
    document.body.classList.remove('land');
    this.scene = new Next(this, opt);
    document.body.dataset.scene = name;
  },
  startLevel(id) { return this.go('level', { id }); },
  // 판에서 쓰는 그림·효과음 (한 번만 받음)
  loadGame() { return (this.gameP ||= Promise.all([loadAll([...TOWER_IMGS, ...CANNON_PARTS, ...ARCHER_PARTS, ...ENEMY_IMGS, ...M2_IMGS]), audio.load(SFX.filter(n => !FIRST_SFX.includes(n)))])); },
  // 판 고르기: 마지막 판 앞에는 장인의 마지막 일기 장면
  enterLevel(id) {
    if (id === LAST_ID && !this.data.seenFinal) return this.go('story', { key: 'before_final', then: 'level', thenOpt: { id }, seen: 'seenFinal' });
    return this.go('level', { id });
  },
  // 판을 처음 깬 순간(결과 창보다 먼저) 부름: 장의 마지막 판이면 이야기, 마지막 판이면 엔딩을 「볼 것」으로 저장
  markWin(id, first) {
    if (!first) return;
    const ids = Object.keys(MAPS).sort(), nx = ids[ids.indexOf(id) + 1], ch = id.split('-')[0];
    if (id === LAST_ID) this.data.pending = { kind: 'ending' };
    else if (nx && nx.split('-')[0] !== ch && SCENES[`ch${ch}_after`]) this.data.pending = { kind: 'story', key: `ch${ch}_after`, focus: nx };
  },
  // 결과 창 「다음으로」: 지도로 (볼 장면이 있으면 go 가 먼저 틀어 줌), 다음 판에 초점
  afterWin(id) {
    const ids = Object.keys(MAPS).sort(), nx = ids[ids.indexOf(id) + 1];
    return this.go('map', { focus: nx || id });
  },
  endStats() {
    const ids = Object.keys(MAPS);
    return { time: this.data.playTime || 0, stars: ids.reduce((a, id) => a + (this.data.stars[id] || 0), 0), starsMax: ids.length * 3, thimbles: thimblesEarned(this.data) };
  },
};
window.__settings = app.settings;
window.__app = app; // 시험용

async function boot() {
  audio.init();
  audio.setVolume('music', app.settings.music);
  audio.setVolume('sfx', app.settings.sfx);
  app.view.resize();
  // 첫 화면(인트로·제목)에 필요한 것만 먼저 받고(3MB 이하), 판 그림·효과음은 뒤에서 받는다
  await Promise.all([loadAll(UI_IMGS), audio.load(FIRST_SFX), document.fonts?.load?.('16px Dodum').catch(() => {})]);
  const q = new URLSearchParams(location.search);
  if (q.get('level')) await app.loadGame();
  if (q.get('level')) await app.go('level', { id: q.get('level') });
  else await app.go(q.get('screen') || FIRST_SCREEN, {});
  document.getElementById('boot').classList.add('hide');
  // 인트로가 첫 묶음을 다 받은 뒤(또는 6초 뒤) 판 그림·효과음을 뒤에서 받기
  { const t0 = performance.now(); const wait = () => (app.scene?.state && app.scene.state === 'load' && performance.now() - t0 < 6000) ? setTimeout(wait, 300) : app.loadGame(); setTimeout(wait, 300); }
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
