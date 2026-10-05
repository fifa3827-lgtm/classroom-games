import { Game } from './engine.js?v=2610052000';
import { STAGES } from './levels/index.js?v=2610052000';

const $ = id => document.getElementById(id);
const KEY = 'escape15';
const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) ?? {}; } catch { return {}; } };
const save = d => { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch { } };
let data = load(); data.best ??= {}; data.opt ??= { high: false, sound: true };

const game = new Game();
game.total = STAGES.length;
window.__game = game; // 시험용
$('optHigh').checked = data.opt.high; $('optSound').checked = data.opt.sound;
game.setQuality(data.opt.high); game.sound.on = data.opt.sound;
$('optHigh').onchange = e => { data.opt.high = e.target.checked; game.setQuality(e.target.checked); save(data); };
$('optSound').onchange = e => { data.opt.sound = e.target.checked; game.sound.on = e.target.checked; save(data); };

const unlocked = i => i === 0 || data.best[i - 1] != null || new URLSearchParams(location.search).has('all');
const fmt = s => `${Math.floor(s / 60)}분 ${s % 60}초`;

function menu() {
  $('hud').classList.add('hidden'); $('title').classList.remove('hidden');
  const grid = $('stageGrid'); grid.innerHTML = '';
  STAGES.forEach((st, i) => {
    const b = document.createElement('button');
    b.className = 'stage' + (data.best[i] != null ? ' done' : '');
    b.disabled = !unlocked(i);
    b.innerHTML = `<div class="no">${String(i + 1).padStart(2, '0')}</div><div class="nm">${st.title}</div><div class="rec">${data.best[i] != null ? '최고 ' + fmt(data.best[i]) : (b.disabled ? '잠김' : st.place)}</div>`;
    b.onclick = () => play(i);
    grid.appendChild(b);
  });
}

async function play(i) {
  game.sound.ensure?.();
  $('fade').classList.remove('clear');
  $('loading').classList.remove('hidden');
  await document.fonts.ready;
  await Promise.all(["700 40px 'Noto Serif KR'", "400 40px 'Noto Serif KR'", "700 40px 'Noto Sans KR'"].map(f => document.fonts.load(f, '가A1')));
  const mod = await import(`./levels/${STAGES[i].file}?v=2610052000`);
  await game.load(mod.default, i);
  $('loading').classList.add('hidden'); $('title').classList.add('hidden'); $('hud').classList.remove('hidden');
  setTimeout(() => $('fade').classList.add('clear'), 60);
  if (mod.default.intro) setTimeout(() => game.note(mod.default.title, mod.default.intro), 500);
}

game.onWin = (i, sec) => { if (data.best[i] == null || sec < data.best[i]) data.best[i] = sec; save(data); };
game.onNext = () => play(game.index + 1);
game.onMenu = () => { $('fade').classList.add('clear'); menu(); };
game.onRestart = () => play(game.index);

menu();
setTimeout(() => $('fade').classList.add('clear'), 100);
