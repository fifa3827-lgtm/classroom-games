'use strict';
(() => {
  // ===== 기본 설정 =====
  const W = 960, H = 540;
  const AR = { l: 30, t: 34, r: 930, b: 462 }; // 싸움터(벽 안쪽)
  const BR = 5;          // 탄 반지름
  const STOP = 45;       // 이 속도 아래면 멈춤
  const SHOT_SPEED = 760;
  const LOCK_MS = 300;   // 화면이 바뀐 뒤 누르기를 받지 않는 시간
  const FONT = '"Malgun Gothic","Apple SD Gothic Neo","Noto Sans KR",sans-serif';
  const qs = new URLSearchParams(location.search);
  const MUTE = qs.get('mute') === '1';
  const ROOM_PARAM = parseInt(qs.get('room'), 10);
  const STAGE_PARAM = parseInt(qs.get('stage'), 10);
  const LAST_ROOM = 15;
  // 주인공(12.11): 판초(기본)·쌍권총 로사(2발 부채꼴)·올가미 짐(바닥 탄 끌어오기). ?hero=pancho|rosa|jim 으로 고를 수 있다(시험용)
  const HEROES = {
    pancho: { name: '판초', spr: 'player', desc: ['기본 총잡이', '한 번에 한 발'] },
    rosa: { name: '쌍권총 로사', spr: 'rosa', desc: ['한 번에 두 발을 부채꼴로', '빗나가면 적 탄약도 두 배'] },
    jim: { name: '올가미 짐', spr: 'jim', desc: ['올가미로 가까운 바닥 탄을', '손으로 끌어온다(4초마다)'] },
  };
  const HERO_KEYS = Object.keys(HEROES);
  const HERO_PARAM = HERO_KEYS.includes(qs.get('hero')) ? qs.get('hero') : null;
  const TEST_RUN = (ROOM_PARAM >= 1 && ROOM_PARAM <= LAST_ROOM) || (STAGE_PARAM >= 0 && STAGE_PARAM <= 5);
  const INTRO_PARAM = qs.get('intro') === '1', ENDING_PARAM = qs.get('ending') === '1'; // 검수용: ?intro=1 인트로 다시, ?ending=1 엔딩 바로

  const cv = document.getElementById('c');
  const ctx = cv.getContext('2d');
  let scale = 1, dpr = 1;
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    let px = 0, py = 0; // 안전 영역(노치): body 안쪽 여백만큼 뺀다
    try { const cs = getComputedStyle(document.body); px = (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0); py = (parseFloat(cs.paddingTop) || 0) + (parseFloat(cs.paddingBottom) || 0); } catch (e) { /* 없음 */ }
    scale = Math.min((window.innerWidth - px) / W, (window.innerHeight - py) / H);
    const cw = Math.floor(W * scale), ch = Math.floor(H * scale);
    cv.style.width = cw + 'px'; cv.style.height = ch + 'px';
    cv.width = Math.max(1, Math.floor(cw * dpr)); cv.height = Math.max(1, Math.floor(ch * dpr));
  }
  window.addEventListener('resize', resize); resize();

  // ===== 전체 화면 (지원하지 않으면 조용히 넘어간다. 아이폰 사파리는 단추를 숨긴다) =====
  const docEl = document.documentElement;
  const FS_OK = !!(docEl && (docEl.requestFullscreen || docEl.webkitRequestFullscreen)) && document.fullscreenEnabled !== false && document.webkitFullscreenEnabled !== false;
  const isFS = () => !!(document.fullscreenElement || document.webkitFullscreenElement);
  function enterFS() {
    if (!FS_OK || isFS()) return;
    try {
      const r = docEl.requestFullscreen ? docEl.requestFullscreen() : docEl.webkitRequestFullscreen();
      const lock = () => { try { if (screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(() => {}); } catch (e) { /* 무시 */ } };
      if (r && r.then) r.then(lock, () => {}); else lock();
    } catch (e) { /* 무시 */ }
  }
  function exitFS() {
    try { const r = document.exitFullscreen ? document.exitFullscreen() : document.webkitExitFullscreen && document.webkitExitFullscreen(); if (r && r.catch) r.catch(() => {}); } catch (e) { /* 무시 */ }
  }
  function toggleFS() { if (isFS()) exitFS(); else enterFS(); }
  function onFSChange() { // 크기를 바로 다시 맞추고, 놀이 중에 전체 화면이 풀리면 저절로 멈춘다(크롬은 전체 화면에서 Esc를 가져간다)
    resize();
    if (!isFS() && game.state === 'play' && !game.paused) togglePause();
  }
  document.addEventListener('fullscreenchange', onFSChange);
  document.addEventListener('webkitfullscreenchange', onFSChange);

  // ===== 그림 파일 (한 번만 불러온다. 못 불러온 그림은 코드 그림으로 그린다) =====
  const ASSET_V = '2610202300'; // 그림 주소 번호(index.html의 game.js?v= 와 같게)
  // 인물: 위에서 본 모습, 총구는 오른쪽(각도 0). ax, ay = 기준점(몸통 무게 중심) 비율, br = 몸 반지름(px), hat = 그림 속 모자 반지름(px), dark = 어둡게(탄보다 밝지 않게)
  const SPR = {
    player: { ax: 0.376, ay: 0.449, br: 74, hat: 44, dark: 0.8 },
    rosa: { ax: 0.417, ay: 0.448, br: 64, hat: 40, dark: 0.8 },
    jim: { ax: 0.406, ay: 0.394, br: 62, hat: 40, dark: 0.8 },
    thug: { ax: 0.396, ay: 0.451, br: 66, hat: 45, dark: 1 },
    knife: { ax: 0.316, ay: 0.459, br: 63, hat: 46, dark: 1 },
    sniper: { ax: 0.281, ay: 0.452, br: 53, hat: 38, dark: 1 },
    boss: { ax: 0.356, ay: 0.473, br: 73, hat: 43, dark: 1 },
    vulture: { ax: 0.444, ay: 0.485, br: 68, hat: 30, dark: 1, drawK: 1.35, lift: 0.22 }, // drawK = 그림만 크게(맞는 거리는 그대로), lift = 그림을 밝게(조각 2-2)
    mole: { ax: 0.468, ay: 0.509, br: 82, hat: 34, dark: 1 },
    witch: { ax: 0.374, ay: 0.493, br: 61, hat: 40, dark: 1 },
    miner: { ax: 0.325, ay: 0.462, br: 61, hat: 36, dark: 1 },
    sheriff: { ax: 0.486, ay: 0.480, br: 83, hat: 46, dark: 1 },
    molly: { ax: 0.430, ay: 0.539, br: 70, hat: 34, dark: 1 },
  };
  const SPR_K = 1.6;  // 그림 배율: 그림의 몸 반지름 = r x 1.6
  const HIT_K = 1.35; // 적·두목이 맞는 거리 = r x 1.35(그림 몸통에 맞춤). 플레이어·이동·벽은 r 그대로
  const RING = { player: '#1fc2b3', rosa: '#1fc2b3', jim: '#1fc2b3', thug: '#ff4636', knife: '#b86cff', sniper: '#3fd46a', boss: '#ffd060', vulture: '#f0a850', mole: '#c9a04a', witch: '#ff8a2a', miner: '#e8702a', sheriff: '#8fb4ff', molly: '#ffc04a' }; // 종류별 발밑 테두리 색
  const IMG = {};
  let imgReady = false, imgLeft = 0;
  const onReady = [];
  function whenReady(f) { if (imgReady) f(); else onReady.push(f); }
  function bakeSprite(key, im) { // 어둡게 한 그림 + 맞을 때 겹칠 흰 그림을 미리 만든다
    const mk = (fill) => {
      const c = document.createElement('canvas'); c.width = im.width; c.height = im.height;
      const g = c.getContext('2d'); g.drawImage(im, 0, 0);
      if (fill) { g.globalCompositeOperation = 'source-atop'; g.fillStyle = fill; g.fillRect(0, 0, c.width, c.height); }
      return c;
    };
    const d = SPR[key].dark, li = SPR[key].lift;
    return { img: mk(d < 1 ? `rgba(0,0,0,${1 - d})` : li ? `rgba(255,236,200,${li})` : null), white: mk('#ffffff'), w: im.width, h: im.height };
  }
  (function loadImages() {
    const names = ['player.png', 'thug.png', 'knife.png', 'sniper.png', 'boss.png', 'vulture.png', 'mole.png', 'witch.png', 'miner.png', 'sheriff.png', 'molly.png', 'rosa.png', 'jim.png', 'floor.jpg', 'ice.jpg', 'sand.jpg', 'mine.jpg', 'rail.jpg', 'crate.jpg', 'rock.jpg', 'timber.jpg', 'keyart.jpg'];
    if (typeof Image === 'undefined') { imgReady = true; return; } // 그림을 못 쓰는 곳(봇 시험 장치)
    imgLeft = names.length;
    const finish = () => { if (imgReady) return; imgReady = true; for (const f of onReady.splice(0)) f(); };
    const done = () => { if (--imgLeft === 0) finish(); };
    setTimeout(finish, 8000); // 8초 안에 못 불러온 그림은 코드 그림으로 하고 시작한다
    for (const n of names) {
      const key = n.split('.')[0], im = new Image();
      im.onload = () => { if (imgReady) return; try { IMG[key] = SPR[key] ? bakeSprite(key, im) : im; } catch (e) { /* 코드 그림으로 */ } done(); };
      im.onerror = done;
      im.src = 'img/' + n + '?v=' + ASSET_V;
    }
  })();

  // ===== 도구 =====
  const rand = (a, b) => a + Math.random() * (b - a); // 그림·소리용(씨앗과 무관)
  // 씨앗 난수(?seed=N): 씨앗이 같으면 같은 방 배치·물결 자리·각인 후보가 나온다. 없으면 지금처럼 무작위.
  const SEED = /^\d+$/.test(qs.get('seed') || '') ? parseInt(qs.get('seed'), 10) >>> 0 : null;
  function mulberry32(a) { return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const mkRng = (k) => (SEED === null ? Math.random : mulberry32((SEED ^ Math.imul(k + 1, 0x9E3779B1)) >>> 0));
  let R = Math.random, AIR = Math.random, TAPR = Math.random;  // R = 이번 방의 배치용(방마다 새로), AIR = 적 행동용(판마다 새로)
  const srand = (a, b) => a + R() * (b - a), arand = (a, b) => a + AIR() * (b - a);
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const norm = (x, y) => { const d = Math.hypot(x, y) || 1; return { x: x / d, y: y / d }; };
  function angDiff(a, b) { let d = a - b; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return d; }
  function shuffle(a, rng) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor((rng || R)() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  function fmtTime(s) { s = Math.floor(s); return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); }

  // ===== 저장 =====
  const BEST_KEY = 'sixshots_best', RUNS_KEY = 'sixshots_runs', MUSIC_KEY = 'sixshots_music', HERO_KEY = 'sixshots_hero', INTRO_KEY = 'sixshots_intro';
  function loadIntroSeen() { try { return localStorage.getItem(INTRO_KEY) === '1'; } catch (e) { return false; } }
  function saveIntroSeen() { try { localStorage.setItem(INTRO_KEY, '1'); } catch (e) { /* 저장 못 해도 진행 */ } }
  function loadHero() { try { const h = localStorage.getItem(HERO_KEY); return HERO_KEYS.includes(h) ? h : 'pancho'; } catch (e) { return 'pancho'; } }
  function saveHero(h) { try { localStorage.setItem(HERO_KEY, h); } catch (e) { /* 저장 못 해도 진행 */ } }
  function loadBest() {
    const d = { room: 0, introRoom: 0, unlocked: 1, engs: [], stageTimes: {}, hunter: false, cleared: false, heroBest: {} };
    try {
      const s = localStorage.getItem(BEST_KEY); const o = s ? JSON.parse(s) : null;
      if (o && typeof o === 'object') {
        d.room = o.room || 0; d.introRoom = o.introRoom || 0; d.unlocked = clamp(o.unlocked || 1, 1, 5);
        d.engs = Array.isArray(o.engs) ? o.engs.filter((k) => ['magnet', 'fire', 'ghost'].includes(k)) : [];
        d.stageTimes = o.stageTimes && typeof o.stageTimes === 'object' ? o.stageTimes : {};
        if (o.time && !d.stageTimes[1]) d.stageTimes[1] = o.time; // 예전 형식
        d.hunter = !!o.hunter; d.cleared = !!o.cleared;
        if (o.heroBest && typeof o.heroBest === 'object') for (const h of HERO_KEYS) if (o.heroBest[h] && typeof o.heroBest[h] === 'object') d.heroBest[h] = o.heroBest[h];
      }
    } catch (e) { /* 기본값 */ }
    return d;
  }
  function saveBest(b) { try { localStorage.setItem(BEST_KEY, JSON.stringify(b)); } catch (e) { /* 저장 못 해도 진행 */ } }
  function loadRuns() { try { const s = localStorage.getItem(RUNS_KEY); const a = s ? JSON.parse(s) : []; return Array.isArray(a) ? a : []; } catch (e) { return []; } }
  function saveRuns(a) { try { localStorage.setItem(RUNS_KEY, JSON.stringify(a.slice(-100))); } catch (e) { /* 무시 */ } }
  function loadMusic() { try { return localStorage.getItem(MUSIC_KEY) !== '0'; } catch (e) { return true; } }
  function saveMusic(on) { try { localStorage.setItem(MUSIC_KEY, on ? '1' : '0'); } catch (e) { /* 무시 */ } }
  // 나중에 서버로 보낼 자리. 지금은 아무것도 하지 않는다.
  function sendRun(run) { /* 비워 둠 */ }

  // ===== 소리(Web Audio 합성) =====
  let ac = null, master = null, musicGain = null, noiseBuf = null;
  const MUSIC_VOL = 0.07; // 음악은 예고음·줍기음보다 확실히 작게
  const music = { on: loadMusic(), next: 0, step: 0 };
  function initAudio() {
    if (MUTE) return;
    try {
      if (!ac) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        ac = new AC(); master = ac.createGain(); master.gain.value = 0.45; master.connect(ac.destination);
        musicGain = ac.createGain(); musicGain.gain.value = music.on ? MUSIC_VOL : 0; musicGain.connect(master);
      }
      if (ac.state === 'suspended') ac.resume();
    } catch (e) { ac = null; }
  }
  function tone(freq, dur, type, vol, slide, delay) {
    if (!ac) return;
    const t = ac.currentTime + (delay || 0);
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.02);
  }
  function noise(dur, vol, freq, at, dest, ftype) {
    if (!ac) return;
    if (!noiseBuf) {
      noiseBuf = ac.createBuffer(1, Math.floor(ac.sampleRate * 0.6), ac.sampleRate);
      const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    const t = at || ac.currentTime;
    const s = ac.createBufferSource(); s.buffer = noiseBuf;
    const f = ac.createBiquadFilter(); f.type = ftype || 'lowpass'; f.frequency.value = freq;
    const g = ac.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(dest || master); s.start(t); s.stop(t + dur);
  }
  let lastTing = 0;
  const SFX = {
    shot() { noise(0.15, 0.5, 3000); tone(140, 0.12, 'square', 0.1, 50); },
    ting() { const n = performance.now(); if (n - lastTing < 35) return; lastTing = n; tone(2300, 0.12, 'sine', 0.1, 1700); },
    click() { tone(1800, 0.025, 'square', 0.14); tone(1200, 0.035, 'square', 0.14, 0, 0.045); },
    hit() { tone(320, 0.15, 'sawtooth', 0.12, 80); noise(0.08, 0.25, 1500); },
    hurt() { tone(220, 0.3, 'square', 0.18, 60); },
    boom() { noise(0.5, 0.6, 600); tone(90, 0.4, 'sine', 0.4, 30); },
    fire() { noise(0.6, 0.3, 900); },
    warn() { tone(600, 0.18, 'square', 0.16, 950); },
    slash() { noise(0.12, 0.3, 4000); },
    clear() { tone(523, 0.15, 'triangle', 0.12); tone(659, 0.15, 'triangle', 0.12, 0, 0.12); tone(784, 0.3, 'triangle', 0.12, 0, 0.24); },
  };

  // ----- 배경음악: 서부풍 반복곡 -----
  const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);
  const CHORDS = [{ b: 45, a: [57, 60, 64, 60] }, { b: 43, a: [55, 59, 62, 59] }, { b: 41, a: [53, 57, 60, 57] }, { b: 40, a: [52, 56, 59, 56] }];
  const PHRASES = [
    [[0, 69, 1], [1, 72, 1], [2, 76, 2], [4, 74, 1], [5, 72, 1], [6, 69, 2]],
    [[0, 67, 1], [1, 71, 1], [2, 74, 2], [4, 72, 1], [5, 71, 1], [6, 67, 2]],
    [[0, 65, 1], [1, 69, 1], [2, 72, 2], [4, 69, 1], [5, 67, 1], [6, 65, 2]],
    [[0, 64, 2], [2, 68, 1], [3, 71, 1], [4, 76, 3]],
  ];
  function mPluck(t, f, v) {
    const o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f;
    const fl = ac.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.setValueAtTime(2600, t); fl.frequency.exponentialRampToValueAtTime(300, t + 0.3);
    const g = ac.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
    o.connect(fl); fl.connect(g); g.connect(musicGain); o.start(t); o.stop(t + 0.55);
  }
  function mWhistle(t, f, d) {
    const o = ac.createOscillator(); o.type = 'sine'; o.frequency.value = f;
    const l = ac.createOscillator(); l.frequency.value = 5.5; const lg = ac.createGain(); lg.gain.value = f * 0.012; l.connect(lg); lg.connect(o.frequency);
    const g = ac.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.22, t + 0.06); g.gain.setValueAtTime(0.22, t + d * 0.7); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g); g.connect(musicGain); o.start(t); l.start(t); o.stop(t + d + 0.02); l.stop(t + d + 0.02);
  }
  function mBass(t, f, d) {
    const o = ac.createOscillator(); o.type = 'triangle'; o.frequency.value = f;
    const g = ac.createGain(); g.gain.setValueAtTime(0.5, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g); g.connect(musicGain); o.start(t); o.stop(t + d + 0.02);
  }
  function mDrum(t, kind) {
    if (kind === 'kick') {
      const o = ac.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(45, t + 0.18);
      const g = ac.createGain(); g.gain.setValueAtTime(0.9, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
      o.connect(g); g.connect(musicGain); o.start(t); o.stop(t + 0.25);
    } else if (kind === 'snare') noise(0.14, 0.45, 1800, t, musicGain, 'bandpass');
    else noise(0.04, 0.15, 7000, t, musicGain, 'highpass');
  }
  function playStep(s, t, spb, boss) {
    const ch = CHORDS[s >> 4], e = s & 15;
    if (boss || e % 2 === 0) mPluck(t, midi(ch.a[(boss ? e : e >> 1) % 4]), boss ? 0.28 : 0.35);
    if (e % 8 === 0) mBass(t, midi(ch.b), spb * 3.5);
    if (e % 8 === 4) mBass(t, midi(ch.b + 7), spb * 3);
    for (const n of PHRASES[s >> 4]) if (n[0] * 2 === e) mWhistle(t, midi(n[1] + 12), n[2] * 2 * spb);
    if (boss) { if (e % 4 === 0) mDrum(t, 'kick'); else if (e % 4 === 2) mDrum(t, 'snare'); else mDrum(t, 'hat'); }
  }
  function schedMusic() {
    if (!ac || MUTE || !music.on) return;
    if (game.paused || document.hidden) { music.next = 0; return; }
    const boss = isBossRoom(game.room) && (game.state === 'play' || game.state === 'over');
    const spb = 60 / (boss ? 132 : 84) / 2; // 8분음표 길이
    if (music.next < ac.currentTime) music.next = ac.currentTime + 0.05;
    while (music.next < ac.currentTime + 0.3) { playStep(music.step, music.next, spb, boss); music.next += spb; music.step = (music.step + 1) % 64; }
  }
  setInterval(schedMusic, 100);
  function toggleMusic() {
    if (MUTE) return; // 소리 꺼진 주소에서는 저장된 설정을 바꾸지 않음
    music.on = !music.on; saveMusic(music.on);
    if (musicGain && ac) { musicGain.gain.setValueAtTime(music.on ? MUSIC_VOL : 0, ac.currentTime); }
    music.next = 0;
  }

  // ===== 각인 =====
  const ENG = {
    ret: { name: '귀환', sym: '↺', col: '#4fd1ff', desc: ['멈추고 1.5초 뒤', '내게 천천히 굴러 온다'] },
    boom: { name: '폭발', sym: '✸', col: '#ff6a3d', desc: ['멈출 때 작은 폭발', '(나도 맞는다)'] },
    trap: { name: '덫', sym: '⚠', col: '#c77dff', desc: ['바닥에 2.5초 놓이면 켜짐', '적이 주우면 작게 터진다'] },
    pierce: { name: '관통', sym: '➤', col: '#7dff8a', desc: ['적을 한 명', '뚫고 지나간다'] },
    rubber: { name: '고무', sym: '◎', col: '#ff8fd0', desc: ['튕겨도 느려지지 않고', '더 멀리 굴러간다'] },
    magnet: { name: '자석', sym: '∪', col: '#ffe14d', desc: ['바닥에서 가까우면', '주인 쪽으로 끌려온다'] },
    fire: { name: '화염', sym: '♨', col: '#ff9a2a', desc: ['멈춘 자리에 2초 불길', '나도 맞음 · 3초간 못 주움'] },
    ghost: { name: '유령', sym: '☁', col: '#b8c8ff', desc: ['날아갈 때 엄폐물', '한 개를 통과한다'] },
  };
  const TRAP_ARM = 2.5; // 덫이 켜지기까지 바닥에 놓여 있어야 하는 시간(6차 측정에서 1.5 → 2.5)
  const TRAP_R = 30;    // 덫이 적을 맞히는 범위(30+r, 6차 측정에서 60 → 30)
  const BOOM_R = 45;    // 폭발 각인이 적을 맞히는 범위(45+r, 플레이어는 40+r. 6차 측정에서 60 → 45)
  const FIRE_R = 8;     // 화염 불길이 적을 맞히는 범위(8+r, 플레이어는 40+r. 6차 측정에서 30 → 15, 검수 뒤 15 → 8)
  const RET_SPEED = 120, RET_WAIT = 1.5; // 귀환: 굴러 오는 속도, 멈춘 뒤 굴러 오기 시작할 때까지(초)
  const BASE_ENGS = ['ret', 'boom', 'trap', 'pierce', 'rubber'];
  const STAGE_ENG = { 1: 'magnet', 2: 'fire', 3: 'ghost' };

  // ===== 엄폐물 배치 (틈은 모두 56 이상) =====
  const LAYOUTS = [
    [[520, 140, 40, 70], [520, 310, 40, 70], [700, 228, 70, 40]],
    [[300, 110, 120, 30], [300, 360, 120, 30], [600, 190, 30, 130], [780, 100, 40, 40], [780, 330, 40, 40]],
    [[420, 100, 30, 100], [420, 300, 30, 100], [640, 170, 100, 30], [640, 330, 100, 30]],
    [[350, 205, 40, 40], [480, 110, 40, 40], [480, 330, 40, 40], [650, 215, 50, 50], [780, 110, 40, 40], [780, 330, 40, 40]],
    [[250, 180, 30, 140], [480, 95, 160, 30], [480, 375, 160, 30], [740, 200, 30, 130]],
  ];
  const LAMPS = [
    [[200, 58], [660, 58], [480, 438]],
    [[150, 438], [460, 58], [820, 438]],
    [[54, 130], [850, 58], [700, 438]],
  ];
  // 방별 물결(적 수가 점점 늘어남, 칼잡이는 한 물결에 최대 1명, 저격수는 4번 방부터) + 10번 두목
  const T_ = 'thug', K_ = 'knife', S_ = 'sniper', V_ = 'vulture', M_ = 'mole', MI = 'miner', SH = 'sheriff';
  // 1막 술집: 방 1~4 + 5번 방 두목 여섯손가락 잭
  const WAVES = {
    1: [[T_, T_]],
    2: [[T_, T_, T_]],
    3: [[T_, T_], [T_, K_]],
    4: [[T_, T_, S_], [T_, K_]],
    5: [['boss']],
  };
  // 2막 모래 협곡: 방 6~9(건달·독수리·두더지) + 10번 방 두목 모래바람 마녀(건달 물결을 부른다)
  const WAVES2 = {
    6: [[T_, V_], [T_, M_]],
    7: [[T_, M_], [T_, V_]],
    8: [[T_, V_], [T_, M_]],
    9: [[T_, V_], [M_]],
    10: [['witch'], [T_]],
  };
  // 3막 폐광: 방 11~14(건달·광부·거울 보안관) + 15번 방 두목 광산왕 몰리(광부 물결을 부른다)
  const WAVES3 = {
    11: [[T_, MI], [T_]],
    12: [[T_, MI], [SH]],
    13: [[T_, MI], [SH, T_]],
    14: [[T_, SH], [MI, T_]],
    15: [['molly'], [MI]],
  };
  // 버팀목 배치(폐광, 틈은 모두 56 이상). 레일 후보 자리(RAIL_H·RAIL_V) 가운데 몇 줄은 늘 비어 있다.
  const LAYOUTS3 = [
    [[360, 90, 40, 45], [360, 330, 40, 60], [560, 210, 60, 60], [760, 90, 40, 45], [760, 340, 40, 50]],
    [[260, 240, 110, 30], [520, 90, 30, 80], [520, 300, 30, 70], [700, 220, 110, 30]],
    [[330, 190, 40, 110], [480, 95, 110, 30], [480, 375, 110, 30], [720, 170, 40, 130]],
    [[300, 90, 50, 45], [300, 325, 50, 50], [600, 220, 50, 50], [800, 90, 40, 45], [800, 330, 40, 40]],
  ];
  // 바위 배치(모래 협곡, 틈은 모두 56 이상)
  const LAYOUTS2 = [
    [[300, 150, 60, 60], [520, 300, 60, 60], [700, 120, 50, 50], [760, 330, 60, 50]],
    [[380, 90, 40, 120], [380, 320, 40, 86], [620, 210, 120, 40], [820, 90, 40, 40]],
    [[260, 300, 120, 40], [480, 120, 40, 100], [640, 300, 40, 100], [780, 160, 60, 40]],
    [[340, 220, 50, 50], [520, 100, 50, 50], [520, 340, 50, 50], [720, 220, 50, 50]],
  ];
  // 문 자리(오른쪽 벽 2곳, 위쪽 벽 3곳). 왼쪽(플레이어 시작 쪽)·아래(탄창 판)·오른쪽 아래(터치 발사 버튼)에는 두지 않는다.
  const DOOR_SPOTS = [
    { x: AR.r, y: 110, sx: AR.r - 28, sy: 110, ix: -1, iy: 0 },
    { x: AR.r, y: 248, sx: AR.r - 28, sy: 248, ix: -1, iy: 0 },
    { x: 360, y: AR.t, sx: 360, sy: AR.t + 28, ix: 0, iy: 1 },
    { x: 560, y: AR.t, sx: 560, sy: AR.t + 28, ix: 0, iy: 1 },
    { x: 760, y: AR.t, sx: 760, sy: AR.t + 28, ix: 0, iy: 1 },
  ];
  const ETYPES = {
    thug: { hp: 1, r: 17, speed: 165, pick: true, name: '건달', hat: '#46312a' },
    knife: { hp: 2, r: 17, speed: 182, pick: false, name: '칼잡이', hat: '#40283f' },
    sniper: { hp: 1, r: 16, speed: 150, pick: true, name: '저격수', hat: '#2e3b2b' },
    boss: { hp: 6, hp5: 13, r: 25, speed: 165, pick: true, boss: true, name: '여섯손가락 잭', hat: '#1c1716' },
    vulture: { hp: 1, r: 16, speed: 215, pick: true, fly: true, name: '독수리', hat: '#5a3a1e' },
    mole: { hp: 2, r: 18, speed: 150, pick: true, name: '두더지', hat: '#6a4a22' },
    witch: { hp: 4, hp5: 14, r: 24, speed: 160, pick: true, boss: true, name: '모래바람 마녀', hat: '#3a1a2a' },
    miner: { hp: 1, r: 17, speed: 150, pick: false, name: '광부', hat: '#7a5a20' },
    sheriff: { hp: 2, r: 18, speed: 105, pick: true, name: '거울 보안관', hat: '#1a2240' },
    molly: { hp: 10, hp5: 14, r: 25, speed: 110, pick: true, boss: true, name: '광산왕 몰리', hat: '#6a4a1a' },
  };

  // ===== 바닥 법칙(연결 함수): entK = 사람 미끄럼(작을수록 미끄러움), fr·lin = 날아가는 탄 마찰, update(dt) = 매 프레임 바닥 일, canPick(e, b, dt) = 줍기 조건 =====
  const FLOOR_RULES = {
    plain: { label: '', entK: 16, fr: 1.15, lin: 45, tile: 'floor', shade: 'rgba(8,5,6,0.32)', tint: 'rgba(25,30,80,0.3)', code: () => `hsl(${22 + rand(-4, 4)},30%,${10 + rand(0, 4)}%)`, update: null, canPick: null, drawTop: null },
    ice: { label: '얼음 바닥', hudCol: '#9fd8ff', entK: 2.2, fr: 0.4, lin: 12, tile: 'ice', shade: 'rgba(4,8,14,0.45)', tint: 'rgba(180,220,255,0.05)', code: () => `hsl(${200 + rand(-6, 6)},34%,${20 + rand(0, 5)}%)`, cracks: true, update: null, canPick: null, drawTop: null },
    // 모래(12.8): 바람에 바닥 탄이 구르고, 바닥에 놓인 지 5초 지나면 묻혀 0.5초 서 있어야 줍는다
    // 폐광(12.11): 광차 레일. 레일이 1초 빛난 뒤 광차가 끝에서 끝까지 달리며 레일 위 바닥 탄을 싣고 레일 끝에 내려놓는다
    mine: { label: '광차 레일', hudCol: '#c8d4e8', entK: 16, fr: 1.15, lin: 45, tile: 'mine', shade: 'rgba(6,7,10,0.22)', tint: 'rgba(80,110,170,0.10)', code: () => `hsl(${215 + rand(-6, 6)},12%,${11 + rand(0, 4)}%)`, rails: true, update: mineUpdate, canPick: null, drawTop: null },
    sand: { label: '모래 바닥', hudCol: '#e8c98a', entK: 16, fr: 1.15, lin: 45, tile: 'sand', shade: 'rgba(30,16,6,0.26)', tint: 'rgba(235,200,140,0.10)', bulletEdge: 'rgba(45,22,4,0.9)', code: () => `hsl(${34 + rand(-4, 4)},30%,${13 + rand(0, 4)}%)`, wind: true, update: sandUpdate, canPick: sandCanPick, drawTop: drawWind },
  };
  // ===== 지역 자료: 방 배치·등불·물결·특별 바닥 방·두목·바닥 그림 =====
  const REGIONS = {
    saloon: { name: '술집', layouts: LAYOUTS, lamps: LAMPS, waves: WAVES, floor: 'plain', obsTile: 'crate', special: { rule: 'ice', pool: [2, 3, 4], count: 1 }, boss: 'boss', winText: '여섯손가락 잭을 쓰러뜨렸다!' },
    canyon: { name: '모래 협곡', layouts: LAYOUTS2, lamps: LAMPS, waves: WAVES2, floor: 'sand', obsTile: 'rock', special: null, boss: 'witch', winText: '모래바람 마녀를 쓰러뜨렸다!' },
    mine: { name: '폐광', layouts: LAYOUTS3, lamps: LAMPS, waves: WAVES3, floor: 'mine', obsTile: 'timber', special: null, boss: 'molly', winText: '광산왕 몰리를 쓰러뜨렸다!' },
  };
  // 막: 방 번호 구간과 지역. 마지막 방이 두목 방.
  const ACTS = [{ region: 'saloon', first: 1, last: 5 }, { region: 'canyon', first: 6, last: 10 }, { region: 'mine', first: 11, last: 15 }];
  const actOf = (n) => ACTS.find((a) => n >= a.first && n <= a.last) || ACTS[ACTS.length - 1];
  const isBossRoom = (n) => actOf(n).last === n;

  // ===== 상태 =====
  const game = {
    state: 'title', stage: 1, selStage: 1, room: 1, kills: 0, time: 0, ice: false, rule: FLOOR_RULES.plain, region: REGIONS.saloon, paused: false,
    freeze: 0, slow: 0, shake: 0, flash: 0, clearing: false, clearT: 0, overT: 0, won: false, roomT: 0, roomStart: 0,
    cards: null, chosen: null, best: loadBest(), usedTouch: false, newBest: false, clock: 0, lockUntil: 0,
    test: TEST_RUN, unlockMsg: [], run: null, lamps: LAMPS[0],
    special: {}, rails: [], act: 1, wave: 1, waves: 1, waveT: 0, waveWarn: 0, doors: [], waveList: [],
    hitDirs: [], lastHit: '', pickHints: 0, pickHint: 0, touchRun: false, prevHeld: 6, noAimT: 0,
    hero: HERO_PARAM || loadHero(), heroSel: 0, lassoFail: 0,
  };
  game.heroSel = HERO_KEYS.indexOf(game.hero);
  const runs = loadRuns();
  game.selStage = !game.best.room && !runs.length ? 0 : game.best.unlocked; // 처음 한 번은 입문(0단계)을 자동으로 고름
  const stageName = (s) => (s === 0 ? '0단계(입문)' : s + '단계');
  let obstacles = [], enemies = [], particles = [], fires = [], dyns = [], floorCanvas = null;
  const player = { isPlayer: true, x: 90, y: 248, vx: 0, vy: 0, r: 16, hp: 3, maxHp: 3, inv: 0, aim: 0, held: [], shotCd: 0, recoil: 0, alive: true, speed: 215, lassoCd: 0 };
  const bullets = [];
  for (let i = 1; i <= 6; i++) {
    bullets.push({ id: i, eng: null, state: 'held', owner: player, x: 0, y: 0, vx: 0, vy: 0, bounces: 0, pierceLeft: 0, rubberLeft: 0, ghostLeft: 0, ghostObs: null, hitSet: new Set(), lockT: 0, trapArmed: true, retT: 0, trail: [], blink: Math.random() * 6 });
  }
  const sortHeld = (e) => e.held.sort((a, b) => a.id - b.id);
  const sceneKey = () => (game.paused ? 'paused' : game.state);
  // 카드 자리와 번호 단추 자리가 겹쳐서, 번호 고르기 화면은 조금 더 오래 잠근다
  function setScene(s) { game.state = s; game.lockUntil = performance.now() + (s === 'pickBullet' ? 600 : s === 'result' ? 800 : LOCK_MS); } // 결과 화면 0.8초: 엔딩 연타로 「단계 열림·칭호」 안내를 건너뛰지 않게(조각 3-2)
  const locked = () => performance.now() < game.lockUntil;

  // ===== 충돌 =====
  function circleRect(x, y, r, o) {
    const qx = clamp(x, o.x, o.x + o.w), qy = clamp(y, o.y, o.y + o.h);
    const dx = x - qx, dy = y - qy; return dx * dx + dy * dy < r * r;
  }
  function pointFree(x, y, r) {
    if (x < AR.l + r || x > AR.r - r || y < AR.t + r || y > AR.b - r) return false;
    for (const o of obstacles) if (circleRect(x, y, r, o)) return false;
    return true;
  }
  const inBox = (x, y, o) => x > o.x - BR && x < o.x + o.w + BR && y > o.y - BR && y < o.y + o.h + BR;
  function bulletFree(x, y, ignore) {
    if (x < AR.l + BR - 0.01 || x > AR.r - BR + 0.01 || y < AR.t + BR - 0.01 || y > AR.b - BR + 0.01) return false;
    for (const o of obstacles) if (o !== ignore && inBox(x, y, o)) return false;
    return true;
  }
  function collideEnt(e) {
    const r = e.r;
    if (e.x < AR.l + r) { e.x = AR.l + r; e.vx = Math.max(0, e.vx); }
    if (e.x > AR.r - r) { e.x = AR.r - r; e.vx = Math.min(0, e.vx); }
    if (e.y < AR.t + r) { e.y = AR.t + r; e.vy = Math.max(0, e.vy); }
    if (e.y > AR.b - r) { e.y = AR.b - r; e.vy = Math.min(0, e.vy); }
    for (const o of obstacles) {
      const qx = clamp(e.x, o.x, o.x + o.w), qy = clamp(e.y, o.y, o.y + o.h);
      const dx = e.x - qx, dy = e.y - qy; const d2 = dx * dx + dy * dy;
      if (d2 >= r * r) continue;
      if (d2 > 0.0001) {
        const d = Math.sqrt(d2); e.x += dx / d * (r - d); e.y += dy / d * (r - d);
      } else {
        const pl = e.x - o.x, pr = o.x + o.w - e.x, pt = e.y - o.y, pb = o.y + o.h - e.y;
        const m = Math.min(pl, pr, pt, pb);
        if (m === pl) e.x = o.x - r; else if (m === pr) e.x = o.x + o.w + r; else if (m === pt) e.y = o.y - r; else e.y = o.y + o.h + r;
      }
    }
  }
  function moveEnt(e, dvx, dvy, dt) {
    const k = game.rule.entK;
    const a = 1 - Math.exp(-k * dt);
    e.vx += (dvx - e.vx) * a; e.vy += (dvy - e.vy) * a;
    e.x += e.vx * dt; e.y += e.vy * dt;
    collideEnt(e);
  }
  // 예고선: 첫 엄폐물/벽까지의 길이
  function rayLen(x, y, a, max) {
    const c = Math.cos(a), s = Math.sin(a);
    for (let d = 0; d < max; d += 4) if (!bulletFree(x + c * d, y + s * d)) return d;
    return max;
  }

  // ===== 격자 흐름장(길 찾기) =====
  const CS = 20, GW = Math.ceil((AR.r - AR.l) / CS), GH = Math.ceil((AR.b - AR.t) / CS);
  const blocked = new Uint8Array(GW * GH);
  const fieldP = new Int32Array(GW * GH), fieldB = new Int32Array(GW * GH);
  let anyFloor = false, fieldT = 0;
  const cellX = (c) => AR.l + ((c % GW) + 0.5) * CS, cellY = (c) => AR.t + (Math.floor(c / GW) + 0.5) * CS;
  function cellOf(x, y) { const i = clamp(Math.floor((x - AR.l) / CS), 0, GW - 1), j = clamp(Math.floor((y - AR.t) / CS), 0, GH - 1); return j * GW + i; }
  function buildBlocked() { for (let c = 0; c < GW * GH; c++) blocked[c] = pointFree(cellX(c), cellY(c), 15) ? 0 : 1; }
  const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
  const queue = new Int32Array(GW * GH);
  function bfs(srcs, out) {
    out.fill(1e9); let h = 0, t = 0;
    for (const s of srcs) if (out[s] > 0) { out[s] = 0; queue[t++] = s; }
    while (h < t) {
      const c = queue[h++]; const cx = c % GW, cy = (c / GW) | 0;
      for (const [dx, dy] of DIRS) {
        const nx = cx + dx, ny = cy + dy;
        if (nx < 0 || ny < 0 || nx >= GW || ny >= GH) continue;
        const n = ny * GW + nx; if (blocked[n]) continue;
        if (dx && dy && (blocked[cy * GW + nx] || blocked[ny * GW + cx])) continue;
        if (out[n] > out[c] + 1) { out[n] = out[c] + 1; queue[t++] = n; }
      }
    }
  }
  function openCell(c, x, y) { // 막힌 칸(맨 구석·엄폐물 옆)의 탄은 탄 자리에서 가장 가까운 열린 칸을 목표로 삼는다(재검수 사소 B)
    if (!blocked[c]) return c;
    let best = c, bd = 1e9;
    for (let n = 0; n < GW * GH; n++) if (!blocked[n]) { const d = (cellX(n) - x) ** 2 + (cellY(n) - y) ** 2; if (d < bd) { bd = d; best = n; } }
    return best;
  }
  function updateFields() {
    bfs([cellOf(player.x, player.y)], fieldP);
    const src = [];
    for (const b of bullets) if (b.state === 'floor' && b.lockT <= 0) src.push(openCell(cellOf(b.x, b.y), b.x, b.y));
    anyFloor = src.length > 0;
    bfs(src, fieldB);
  }
  function flowDir(field, x, y, tx, ty) {
    const c = cellOf(x, y); const cx = c % GW, cy = (c / GW) | 0;
    let best = field[c], bi = -1;
    if (best === 0) return norm(tx - x, ty - y);
    for (const [dx, dy] of DIRS) {
      const nx = cx + dx, ny = cy + dy;
      if (nx < 0 || ny < 0 || nx >= GW || ny >= GH) continue;
      const n = ny * GW + nx; if (blocked[n]) continue;
      if (dx && dy && (blocked[cy * GW + nx] || blocked[ny * GW + cx])) continue;
      if (field[n] < best) { best = field[n]; bi = n; }
    }
    if (bi < 0) return norm(tx - x, ty - y);
    return norm(cellX(bi) - x, cellY(bi) - y);
  }
  function fleeDir(x, y, e) {
    const c = cellOf(x, y); const cx = c % GW, cy = (c / GW) | 0;
    let best = fieldP[c] >= 1e9 ? -1 : fieldP[c], bi = -1;
    for (const [dx, dy] of DIRS) {
      const nx = cx + dx, ny = cy + dy;
      if (nx < 0 || ny < 0 || nx >= GW || ny >= GH) continue;
      const n = ny * GW + nx; if (blocked[n] || fieldP[n] >= 1e9) continue;
      if (dx && dy && (blocked[cy * GW + nx] || blocked[ny * GW + cx])) continue;
      if (fieldP[n] > best) { best = fieldP[n]; bi = n; }
    }
    if (bi < 0) { const d = norm(player.x - x, player.y - y); return { x: -d.y * e.strafe, y: d.x * e.strafe }; }
    return norm(cellX(bi) - x, cellY(bi) - y);
  }

  // ===== 방 =====
  function makeFloor(rule, reg) {
    const c = document.createElement('canvas'); c.width = W * 2; c.height = H * 2;
    const g = c.getContext('2d'); g.scale(2, 2);
    g.fillStyle = '#120b0e'; g.fillRect(0, 0, W, H);
    const tile = IMG[rule.tile];
    if (tile) { // 바닥 그림을 이어 깔고, 탄이 묻히지 않게 코드 바닥 밝기쯤으로 어둡게 덮는다
      const T = 256;
      g.save(); g.beginPath(); g.rect(AR.l, AR.t, AR.r - AR.l, AR.b - AR.t); g.clip();
      for (let y = AR.t; y < AR.b; y += T) for (let x = AR.l; x < AR.r; x += T) g.drawImage(tile, x, y, T, T);
      g.restore();
      g.fillStyle = rule.shade; g.fillRect(AR.l, AR.t, AR.r - AR.l, AR.b - AR.t);
    } else for (let y = AR.t; y < AR.b; y += 22) {
      let x = AR.l - rand(0, 120);
      while (x < AR.r) {
        const len = rand(90, 190);
        g.fillStyle = rule.code();
        const x0 = Math.max(x, AR.l), x1 = Math.min(x + len, AR.r);
        if (x1 > x0) g.fillRect(x0, y, x1 - x0 - 1, Math.min(21, AR.b - y));
        x += len;
      }
    }
    if (rule.rails) for (const rl of game.rails) { // 레일(rail.jpg 48칸을 이어 붙임, 세로 레일은 돌려서). 탄보다 어둡게 덮는다
      const rim = IMG.rail;
      g.save(); g.beginPath(); g.rect(AR.l, AR.t, AR.r - AR.l, AR.b - AR.t); g.clip();
      if (rl.dir === 'v') { g.translate(rl.p, 0); g.rotate(Math.PI / 2); g.translate(0, -rl.p); }
      const L0 = rl.dir === 'h' ? 0 : 0, L1 = rl.dir === 'h' ? W : H, q = rl.p;
      for (let s = L0; s < L1; s += 48) {
        if (rim) g.drawImage(rim, s, q - 24, 48, 48);
        else { g.fillStyle = '#3a2614'; for (let k = 0; k < 48; k += 12) g.fillRect(s + k, q - 18, 6, 36); g.fillStyle = '#8a8f98'; g.fillRect(s, q - 10, 48, 4); g.fillRect(s, q + 6, 48, 4); }
      }
      g.fillStyle = 'rgba(0,0,0,0.22)'; g.fillRect(L0, q - 24, L1 - L0, 48);
      g.restore();
    }
    g.fillStyle = rule.tint; g.fillRect(AR.l, AR.t, AR.r - AR.l, AR.b - AR.t);
    if (rule.cracks && !tile) {
      g.strokeStyle = 'rgba(230,245,255,0.16)'; g.lineWidth = 2;
      for (let i = 0; i < 26; i++) { const x = rand(AR.l, AR.r), y = rand(AR.t, AR.b), l = rand(30, 110); g.beginPath(); g.moveTo(x, y); g.lineTo(x + l, y - l * 0.35); g.stroke(); }
    }
    // 등불 2~3개: 둥근 따뜻한 빛
    for (const [lx, ly] of game.lamps) {
      const gr = g.createRadialGradient(lx, ly, 0, lx, ly, 260);
      gr.addColorStop(0, 'rgba(255,165,70,0.26)'); gr.addColorStop(0.5, 'rgba(255,140,60,0.1)'); gr.addColorStop(1, 'rgba(255,140,60,0)');
      g.fillStyle = gr; g.fillRect(lx - 260, ly - 260, 520, 520);
    }
    // 어두운 가장자리(비네트)
    const vg = g.createRadialGradient(W / 2, H / 2 - 20, 160, W / 2, H / 2 - 20, 560);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,8,0.62)');
    g.fillStyle = vg; g.fillRect(0, 0, W, H);
    // 벽
    g.fillStyle = '#2a1a10';
    g.fillRect(0, 0, W, AR.t); g.fillRect(0, AR.b, W, H - AR.b); g.fillRect(0, 0, AR.l, H); g.fillRect(AR.r, 0, W - AR.r, H);
    g.strokeStyle = '#6a4424'; g.lineWidth = 3; g.strokeRect(AR.l - 1.5, AR.t - 1.5, AR.r - AR.l + 3, AR.b - AR.t + 3);
    if (rule.rails) for (const rl of game.rails) for (const end of [0, 1]) { // 레일 끝 굴 입구(벽 안)
      const hz = rl.dir === 'h', x = hz ? (end ? AR.r - 1 : 0) : rl.p - 24, y = hz ? rl.p - 24 : (end ? AR.b - 1 : 0), w = hz ? AR.l + 1 : 48, h = hz ? 48 : AR.t + 1;
      g.fillStyle = '#040203'; g.fillRect(x, y, w, h);
      g.strokeStyle = '#7a5430'; g.lineWidth = 4; g.strokeRect(x + 2, y + 2, w - 4, h - 4);
    }
    // 문
    for (const d of game.doors) {
      const vert = d.ix !== 0, w = vert ? 30 : 48, h = vert ? 48 : 34;
      const x = vert ? AR.r : d.x - 24, y = vert ? d.y - 24 : 0;
      g.fillStyle = '#3a2210'; g.fillRect(x, y, w, h);
      g.strokeStyle = '#b07a3a'; g.lineWidth = 3; g.strokeRect(x + 1.5, y + 1.5, w - 3, h - 3);
      g.strokeStyle = '#1a0e06'; g.lineWidth = 2; g.beginPath();
      if (vert) { g.moveTo(x + 4, d.y); g.lineTo(x + w - 4, d.y); } else { g.moveTo(d.x, y + 4); g.lineTo(d.x, y + h - 4); }
      g.stroke();
    }
    // 엄폐물(상자)
    for (const o of obstacles) {
      g.fillStyle = 'rgba(0,0,0,0.4)'; g.beginPath(); g.ellipse(o.x + o.w / 2 + 5, o.y + o.h / 2 + 7, o.w / 2 + 6, o.h / 2 + 5, 0, 0, 7); g.fill();
      g.fillStyle = '#5e3b20'; g.fillRect(o.x, o.y, o.w, o.h);
      const ot = IMG[reg.obsTile];
      if (ot) { // 짧은 변 길이의 정사각형 상자를 이어 붙인다(늘리지 않음, 끝이 안 맞으면 조금 겹침)
        const s = Math.min(o.w, o.h), L = Math.max(o.w, o.h), n = Math.ceil(L / s - 0.001), step = n > 1 ? (L - s) / (n - 1) : 0, horiz = o.w >= o.h;
        for (let i = 0; i < n; i++) g.drawImage(ot, horiz ? o.x + i * step : o.x, horiz ? o.y : o.y + i * step, s, s);
        g.fillStyle = 'rgba(10,5,2,0.38)'; g.fillRect(o.x, o.y, o.w, o.h);
        g.strokeStyle = '#2e1a0c'; g.lineWidth = 3; g.strokeRect(o.x + 1.5, o.y + 1.5, o.w - 3, o.h - 3);
      } else {
      g.strokeStyle = '#2e1a0c'; g.lineWidth = 3; g.strokeRect(o.x + 1.5, o.y + 1.5, o.w - 3, o.h - 3);
      g.lineWidth = 2; g.beginPath(); g.moveTo(o.x + 3, o.y + 3); g.lineTo(o.x + o.w - 3, o.y + o.h - 3); g.moveTo(o.x + o.w - 3, o.y + 3); g.lineTo(o.x + 3, o.y + o.h - 3); g.stroke();
      }
      g.fillStyle = 'rgba(255,190,110,0.12)'; g.fillRect(o.x, o.y, o.w, 4);
    }
    return c;
  }
  function findSpawn(r) {
    for (let k = 0; k < 400; k++) {
      const x = srand(560, 900), y = srand(60, 440);
      if (!pointFree(x, y, r + 6)) continue;
      if (Math.hypot(player.x - x, player.y - y) < 80 + r) continue;
      if (enemies.some((e) => Math.hypot(e.x - x, e.y - y) < e.r + r + 14)) continue;
      return { x, y };
    }
    for (let k = 0; k < 400; k++) { const x = srand(420, 900), y = srand(50, 450); if (pointFree(x, y, r + 2) && Math.hypot(player.x - x, player.y - y) >= 80 + r) return { x, y }; }
    return { x: 880, y: 248 };
  }
  function makeEnemy(type, x, y) {
    const T = ETYPES[type];
    const hp = T.hp5 && game.stage >= 5 ? T.hp5 : T.hp;
    return { type, x, y, vx: 0, vy: 0, r: T.r, hp, maxHp: hp, speed: T.speed, pick: T.pick, held: [], state: 'seek', t: type === 'miner' ? 2.2 : 0, cartHits: 0, cartKey: {}, aimAng: Math.PI, aimOff: 0, face: Math.PI, flash: 0, alive: true, seekT: 0, strafe: R() < 0.5 ? 1 : -1, strafeT: srand(1, 3), isPlayer: false, slashFx: 0, dashHit: false, inv: 0, fly: !!T.fly, under: false, upT: 0, sweepCd: 5 };
  }
  function newRun(stage, room) {
    for (const b of bullets) b.eng = null;
    game.stage = clamp(stage == null || isNaN(stage) ? 1 : stage, 0, 5);
    player.maxHp = game.stage === 0 ? 5 : game.stage >= 4 ? 2 : 3; // 0단계(입문): 체력 5(기획 4 → 봇 완주율 58%라 5로, 13장)
    player.hp = player.maxHp; player.alive = true;
    game.kills = 0; game.time = 0; game.paused = false; game.pickHints = 0; game.lastHit = ''; game.touchRun = game.usedTouch; game.newBest = false; game.unlockMsg = [];
    AIR = mkRng(9); TAPR = mkRng(12); // TAPR = 톡 흔들림용(적 행동 난수와 따로)
    game.special = {}; // 특별 바닥 방(지역 자료의 special: 1막 얼음 등). 막마다 씨앗을 따로 쓴다(첫 막은 예전과 같은 mkRng(0)).
    ACTS.forEach((a, i) => { const sp = REGIONS[a.region].special; if (sp) for (const n of shuffle(sp.pool.slice(), mkRng(i === 0 ? 0 : 300 + i)).slice(0, sp.count)) game.special[n] = sp.rule; });
    game.run = { date: new Date().toISOString(), hero: game.hero, stage: game.stage, room: 0, lassos: 0, engShots: {}, won: false, time: 0, roomTimes: [], death: null,
      hitsBy: { '내 탄': 0, '적 탄': 0, '칼': 0, '폭발': 0, '화염': 0, '광차': 0, '다이너마이트': 0 }, stolen: 0, shots: 0, hits: 0, hitShots: 0, engravings: [], test: game.test };
    startRoom(room || 1);
  }
  function startRoom(n) {
    const act = actOf(n), reg = REGIONS[act.region];
    game.room = n; game.act = ACTS.indexOf(act) + 1; game.region = reg;
    game.rule = FLOOR_RULES[game.special[n] || reg.floor]; game.ice = game.rule === FLOOR_RULES.ice;
    R = mkRng(100 + n);
    const li = game.act > 1 ? Math.floor(R() * reg.layouts.length) : n === 1 ? 0 : 1 + Math.floor(R() * (reg.layouts.length - 1)); // 1번 방(처음 방)은 늘 첫 배치(1막만). 2막부터는 배치 전부에서 고른다
    obstacles = reg.layouts[li].map((a) => ({ x: a[0], y: a[1], w: a[2], h: a[3] }));
    game.lamps = n === 1 ? reg.lamps[0] : reg.lamps[Math.floor(R() * reg.lamps.length)];
    buildBlocked();
    // 문 2~4개 (막히지 않은 자리에서 고름)
    // 바람(모래 바닥): 방마다 씨앗으로 방향을 정한다
    game.wind = game.rule.wind ? (() => { const a = R() * Math.PI * 2; return { x: Math.cos(a), y: Math.sin(a), a }; })() : null;
    game.rails = game.rule.rails ? pickRails() : []; // 광차 레일(폐광): 방마다 씨앗으로 1~2줄
    const nd = reg.waves[n].length < 2 ? 0 : isBossRoom(n) ? 2 : n <= 3 ? 2 : n <= 6 ? 3 : 4;
    game.doors = shuffle(DOOR_SPOTS.filter((d) => pointFree(d.sx, d.sy, 27))).slice(0, nd);
    game.waveList = reg.waves[n].map((w) => w.slice());
    mixWaves(n, game.act, game.waveList);
    if (game.stage >= 5 && n >= 3) game.waveList[game.waveList.length - 1].push('thug'); // 5단계: 3번 방부터 마지막 물결에 적 +1
    game.waves = game.waveList.length; game.wave = 1; game.waveT = 0; game.waveWarn = 0;
    floorCanvas = makeFloor(game.rule, reg);
    Object.assign(player, { x: 90, y: 248, vx: 0, vy: 0, inv: 0, held: [], shotCd: 0, recoil: 0, aim: 0, lassoCd: 0 });
    for (const b of bullets) {
      Object.assign(b, { state: 'held', owner: player, vx: 0, vy: 0, bounces: 0, lockT: 0, trapArmed: true, retT: 0, retWait: 0, burnT: 0, floorT: 0, x: player.x, y: player.y, ghostObs: null, ghostLeft: 0, buried: false, sweepT: 0, cart: null });
      b.trail.length = 0; b.hitSet.clear(); player.held.push(b);
    }
    sortHeld(player);
    enemies = []; particles = []; fires = []; dyns = [];
    const list = game.waveList[0].slice();
    if (n === 1) {
      enemies.push(makeEnemy('thug', 860, 140), makeEnemy('thug', 860, 340));
      for (const type of list.slice(2)) { const p = findSpawn(ETYPES[type].r); enemies.push(makeEnemy(type, p.x, p.y)); }
    } else {
      list.sort((a, b) => (ETYPES[a].boss ? -1 : ETYPES[b].boss ? 1 : 0));
      for (const type of list) {
        if (ETYPES[type].boss && pointFree(820, 248, 31)) { enemies.push(makeEnemy(type, 820, 248)); continue; }
        const p = findSpawn(ETYPES[type].r); enemies.push(makeEnemy(type, p.x, p.y));
      }
    }
    setScene('play');
    game.actT = n === act.first && game.act > 1 ? 1.5 : 0; // 막이 바뀌면 지역 이름 화면 1.5초
    game.sweep = null; game.tick = 0;
    game.clearing = false; game.slow = 0; game.freeze = 0; game.flash = 0; game.shake = 0; game.roomT = 0; game.roomStart = game.time;
    game.hitDirs = []; game.pickHint = 0; game.noAimT = 0; game.prevHeld = 6;
    stick.active = false; aimT.active = false;
    fieldT = 0; updateFields();
  }
  // 단계별 적 섞임(12.8 조각 2, 12.11 조각 3): 단계가 오르면 각 막에 다른 막의 적이 섞인다
  function mixWaves(n, act, list) {
    if (isBossRoom(n)) return;
    const last = list[list.length - 1];
    if (act === 3) {
      if (game.stage >= 2) last.push('knife');                               // 2단계~: 3막 마지막 물결에 칼잡이
      if (game.stage >= 3 && n >= 12) list[Math.min(1, list.length - 1)].push('sniper'); // 3단계~: 12~14번 방 둘째 물결에 저격수
      if (game.stage >= 4 && n >= 13) last.push('mole');                     // 4단계~: 13·14번 방 마지막 물결에 두더지
    } else if (act === 2) {
      if (game.stage >= 2) last.push('knife');                               // 2단계~: 2막 마지막 물결에 칼잡이
      if (game.stage >= 3 && n >= 7) list[Math.min(1, list.length - 1)].push('sniper'); // 3단계~: 7~9번 방 둘째 물결에 저격수
      if (game.stage >= 4 && n >= 8) last.push('miner');                     // 4단계~: 8·9번 방 마지막 물결에 광부
    } else {
      if (game.stage >= 5 && n === 4) last.push('sheriff');                  // 5단계: 1막 4번 방 마지막 물결에 거울 보안관
      if (game.stage >= 3 && n >= 3) last.push('vulture');                   // 3단계~: 1막 3·4번 방 마지막 물결에 독수리
      if (game.stage >= 4 && n === 2) last.push('vulture');                  // 4단계~: 2번 방에도 독수리
    }
  }
  function finishRoom() {
    for (const b of bullets) { // 6발 모두 플레이어에게
      if (b.state === 'held' && b.owner !== player) { const o = b.owner; o.held = o.held.filter((x) => x !== b); }
      Object.assign(b, { state: 'held', owner: player, vx: 0, vy: 0, x: player.x, y: player.y, ghostObs: null });
    }
    player.held = bullets.slice();
    fires = []; dyns = []; for (const rl of game.rails) rl.load = [];
    game.run.roomTimes.push(Math.round((game.time - game.roomStart) * 10) / 10);
    if (game.room >= LAST_ROOM) { showResult(true); return; } // 마지막 막의 두목 방
    const pool = BASE_ENGS.concat(game.best.engs);
    game.cards = shuffle(pool.slice(), mkRng(200 + game.room)).slice(0, 3);
    setScene('cards');
  }
  // 일일 도전 대비(조각 1-2): 각인 후보 3장을 「해금 목록」 대신 씨앗·단계·방 번호만으로 정한다. 지금 게임은 이 함수를 쓰지 않는다.
  // 후보 = 기본 5종 + 그 단계 아래 단계를 깨면 열리는 각인(2단계면 자석, 3단계면 자석·화염, 4단계 이상이면 자석·화염·유령).
  function cardsBySeed(seed, stage, room) {
    const pool = BASE_ENGS.slice();
    for (let st = 1; st < stage; st++) if (STAGE_ENG[st]) pool.push(STAGE_ENG[st]);
    return shuffle(pool, mulberry32(((seed >>> 0) ^ Math.imul(200 + room + 1, 0x9E3779B1)) >>> 0)).slice(0, 3);
  }
  function showResult(won) {
    // 결과 화면 탄창에 「날아감」이 남지 않게 탄을 바닥에 내려놓음
    for (const b of bullets) if (b.state === 'fly' || b.state === 'return') { b.state = 'floor'; b.vx = b.vy = 0; if (b.ghostObs) { b.ghostObs = null; } }
    for (const b of bullets) if (b.state === 'cart') { Object.assign(b, freeSpot(clamp(b.x, AR.l + BR + 1, AR.r - BR - 1), clamp(b.y, AR.t + BR + 1, AR.b - BR - 1))); b.state = 'floor'; b.cart = null; }
    for (const rl of game.rails) rl.load = [];
    fires = []; dyns = [];
    game.won = won; setScene('result');
    const reached = game.room, b = game.best, st = game.stage;
    const run = game.run;
    run.room = reached; run.won = won; run.time = Math.round(game.time * 10) / 10;
    if (!won) run.roomTimes.push(Math.round((game.time - game.roomStart) * 10) / 10);
    game.newBest = false; game.unlockMsg = [];
    game.endLong = !b.cleared; // 처음 깼으면 엔딩을 길게(칭호 연출)
    if (!game.test) {
      let changed = false;
      const hb = b.heroBest[game.hero] = b.heroBest[game.hero] || {}, hr = hb[st] = hb[st] || { room: 0, time: 0 }; // 주인공별·단계별 최고 기록
      if (reached > hr.room) { hr.room = reached; changed = true; }
      if (won && (!hr.time || game.time < hr.time)) { hr.time = Math.round(game.time * 10) / 10; changed = true; }
      if (st === 0) { if (reached > b.introRoom) { if (reached > 1) game.newBest = true; b.introRoom = reached; changed = true; } } // 0단계(입문) 기록은 따로
      else if (reached > b.room) { if (reached > 1) game.newBest = true; b.room = reached; changed = true; }
      if (won) {
        const prev = b.stageTimes[st];
        if (!prev || game.time < prev) { b.stageTimes[st] = Math.round(game.time * 10) / 10; game.newBest = true; changed = true; }
        if (st < 5 && b.unlocked < st + 1) { b.unlocked = st + 1; game.unlockMsg.push((st + 1) + '단계가 열렸다!'); changed = true; }
        const ne = STAGE_ENG[st];
        if (ne && !b.engs.includes(ne)) { b.engs.push(ne); game.unlockMsg.push('새 각인 「' + ENG[ne].name + '」이(가) 열렸다!'); changed = true; }
        if (!b.hunter) { b.hunter = true; game.unlockMsg.push('칭호 「현상금 사냥꾼」을 얻었다!'); changed = true; } // 12.11: 처음 끝까지 깨면 칭호(엔딩에서 길게 보여 줌)
        if (!b.cleared) { b.cleared = true; changed = true; }
        game.selStage = Math.max(game.selStage, Math.min(5, st + 1));
      }
      if (changed) saveBest(b);
    }
    runs.push(run); if (runs.length > 100) runs.splice(0, runs.length - 100);
    if (!game.test) saveRuns(runs);
    sendRun(run);
    if (won) { game.endT = 0; setScene('ending'); game.lockUntil = performance.now() + 800; } // 마지막 두목을 깨면 엔딩 → 결과(쏘던 손에 바로 건너뛰지 않게 0.8초 잠금)
  }

  // ===== 탄 =====
  function prepFlight(b, owner, vx, vy) {
    b.state = 'fly'; b.owner = owner; b.vx = vx; b.vy = vy; b.bounces = 0;
    b.pierceLeft = b.eng === 'pierce' ? 1 : 0; b.rubberLeft = b.eng === 'rubber' ? 3 : 0;
    b.ghostLeft = b.eng === 'ghost' ? 1 : 0; b.ghostObs = null;
    b.hitSet.clear(); b.trail.length = 0; b.pShot = false; b.pHit = false;
  }
  function fire(e, ang, speed) {
    if (!e.held.length) return false;
    const b = e.held.shift();
    b.x = e.x; b.y = e.y;
    prepFlight(b, e, Math.cos(ang) * speed, Math.sin(ang) * speed);
    const mx = e.x + Math.cos(ang) * (e.r + 10), my = e.y + Math.sin(ang) * (e.r + 10);
    particles.push({ x: mx, y: my, vx: 0, vy: 0, life: 0.07, max: 0.07, flash: 11, col: '#fff3c0' });
    for (let i = 0; i < 7; i++) particles.push({ x: mx, y: my, vx: Math.cos(ang + rand(-0.5, 0.5)) * rand(80, 240), vy: Math.sin(ang + rand(-0.5, 0.5)) * rand(80, 240), life: 0.15, max: 0.15, col: '#ffd070', size: 2.5 });
    SFX.shot();
    return true;
  }
  function onBounce(b) {
    b.bounces++;
    if (b.eng === 'rubber' && b.rubberLeft > 0) b.rubberLeft--;
    else { b.vx *= 0.78; b.vy *= 0.78; }
    for (let i = 0; i < 6; i++) particles.push({ x: b.x, y: b.y, vx: rand(-160, 160), vy: rand(-160, 160), life: 0.2, max: 0.2, col: i % 2 ? '#fff2b0' : '#ff9a3a', size: 2 });
    SFX.ting();
  }
  function checkHits(b) {
    for (let i = -1; i < enemies.length; i++) {
      const e = i < 0 ? player : enemies[i];
      if (!e.alive || b.hitSet.has(e)) continue;
      if (!e.isPlayer && (e.inv > 0 || e.under)) continue; // 막 들어온 적은 무적(탄이 지나감), 땅속 두더지도 맞지 않음
      if (e === b.owner && b.bounces < 1) continue;   // 쏜 사람은 한 번 튕긴 뒤부터 맞음
      if (e.type === 'molly' && e.held.length && !b.hitSet.has(e.cartKey)) { // 몰리의 광차: 탄이 실려 있을 때만 맞는다. 3번 맞으면 모인 탄을 쏟는다
        const c = mollyCart(e), q = Math.hypot(b.x - c.x, b.y - c.y);
        if (q < MCART_R + BR) {
          b.hitSet.add(e.cartKey); reflectOff(b, c.x, c.y, MCART_R + BR + 0.5);
          e.cartHits++; e.flash = 0.08; SFX.hit();
          for (let k = 0; k < 6; k++) particles.push({ x: c.x, y: c.y, vx: rand(-140, 140), vy: rand(-140, 140), life: 0.25, max: 0.25, col: '#ffe08a', size: 2.5 });
          if (e.cartHits >= 3) dumpCart(e);
          return;
        }
      }
      const dx = e.x - b.x, dy = e.y - b.y, rr = (e.isPlayer ? e.r : e.r * HIT_K) + BR;
      if (dx * dx + dy * dy >= rr * rr) continue;
      if (e.type === 'sheriff' && Math.abs(angDiff(Math.atan2(b.y - e.y, b.x - e.x), e.face)) <= SHIELD_A) { // 거울 보안관: 앞쪽 ±60°에서 맞은 탄은 튕겨 낸다(피해 없음)
        reflectOff(b, e.x, e.y, rr + 0.5);
        for (let k = 0; k < 6; k++) particles.push({ x: b.x, y: b.y, vx: rand(-120, 120), vy: rand(-120, 120), life: 0.2, max: 0.2, col: '#e8f0ff', size: 2.5 });
        return;
      }
      b.hitSet.add(e);
      if (e.isPlayer && (player.inv > 0 || game.clearing)) continue;
      if (!e.isPlayer && b.owner === player) { game.run.hits++; if (b.pShot && !b.pHit) { b.pHit = true; game.run.hitShots++; } } // hitShots: 적을 1명 이상 맞힌 쏜 탄(빗나감 비율용)
      hurt(e, b.owner === player ? '내 탄' : '적 탄', { x: b.x - b.vx * 0.05, y: b.y - b.vy * 0.05, name: b.owner && !b.owner.isPlayer && ETYPES[b.owner.type] ? ETYPES[b.owner.type].name : '' });
      if (!e.isPlayer && b.pierceLeft > 0) { b.pierceLeft--; continue; }
      b.vx *= -0.12; b.vy *= -0.12;
      return;
    }
  }
  // 둥근 것(보안관 방패·몰리 광차)에 맞은 탄을 튕겨 낸다: 바깥쪽으로 밀고 속도를 거울처럼 뒤집는다.
  // 쏜 사람이 바로 제 탄에 맞지 않게 「튕긴 횟수」에는 넣지 않는다(벽에 한 번 튕긴 뒤부터 맞음은 그대로)
  function reflectOff(b, cx, cy, rad) {
    let n = norm(b.x - cx, b.y - cy); if (!(Math.abs(n.x) + Math.abs(n.y))) n = { x: 1, y: 0 };
    const dot = b.vx * n.x + b.vy * n.y;
    if (dot < 0) { b.vx -= 2 * dot * n.x; b.vy -= 2 * dot * n.y; }
    const nx = cx + n.x * rad, ny = cy + n.y * rad;
    if (bulletFree(nx, ny, b.ghostObs)) { b.x = nx; b.y = ny; }
    const n0 = b.bounces; onBounce(b); b.bounces = n0;
  }
  // 한 프레임을 3px 이하로 쪼개 움직이며 벽·상자에 튕김
  function stepBullet(b, dt, doHits) {
    const sp = Math.hypot(b.vx, b.vy);
    const steps = Math.max(1, Math.ceil(sp * dt / 3));
    const sdt = dt / steps;
    for (let s = 0; s < steps; s++) {
      const px = b.x, py = b.y;
      b.x += b.vx * sdt; b.y += b.vy * sdt;
      let bounced = false;
      if (b.x < AR.l + BR) { b.x = AR.l + BR; b.vx = Math.abs(b.vx); bounced = true; }
      else if (b.x > AR.r - BR) { b.x = AR.r - BR; b.vx = -Math.abs(b.vx); bounced = true; }
      if (b.y < AR.t + BR) { b.y = AR.t + BR; b.vy = Math.abs(b.vy); bounced = true; }
      else if (b.y > AR.b - BR) { b.y = AR.b - BR; b.vy = -Math.abs(b.vy); bounced = true; }
      for (const o of obstacles) {
        if (o === b.ghostObs) continue;
        if (inBox(b.x, b.y, o)) {
          if (b.state === 'fly' && b.ghostLeft > 0) { b.ghostLeft = 0; b.ghostObs = o; continue; } // 유령: 통과
          const x1 = o.x - BR, x2 = o.x + o.w + BR, y1 = o.y - BR, y2 = o.y + o.h + BR;
          const outX = px <= x1 || px >= x2, outY = py <= y1 || py >= y2;
          if (outX && !outY) { b.vx = -b.vx; b.x = px; }
          else if (outY && !outX) { b.vy = -b.vy; b.y = py; }
          else { b.vx = -b.vx; b.vy = -b.vy; b.x = px; b.y = py; }
          bounced = true;
        }
      }
      if (b.state === 'fly') for (const rl of game.rails) { // 달리는 광차에 튕긴다
        if (rl.phase !== 'run') continue;
        const o = cartRect(rl);
        if (!inBox(b.x, b.y, o)) continue;
        const x1 = o.x - BR, x2 = o.x + o.w + BR, y1 = o.y - BR, y2 = o.y + o.h + BR;
        const outX = px <= x1 || px >= x2, outY = py <= y1 || py >= y2;
        if (outX && !outY) { b.vx = -b.vx; b.x = px; }
        else if (outY && !outX) { b.vy = -b.vy; b.y = py; }
        else if (outX && outY) { b.vx = -b.vx; b.vy = -b.vy; b.x = px; b.y = py; }
        else { // 광차가 탄 위로 왔다: 광차 앞으로 밀어 내고, 앞이 벽이면 옆으로
          const hz = rl.dir === 'h', ahead = rl.sgn > 0 ? (hz ? x2 : y2) + 0.5 : (hz ? x1 : y1) - 0.5, sp = Math.max(Math.hypot(b.vx, b.vy), CART_SP + 80);
          const ax = hz ? ahead : b.x, ay = hz ? b.y : ahead;
          if (bulletFree(ax, ay)) { b.x = ax; b.y = ay; if (hz) { b.vx = rl.sgn * sp; } else { b.vy = rl.sgn * sp; } }
          else { const side = (hz ? b.y - rl.p : b.x - rl.p) >= 0 ? 1 : -1; if (hz) { b.y = rl.p + side * (CART_W / 2 + BR + 0.5); b.vy = side * sp; } else { b.x = rl.p + side * (CART_W / 2 + BR + 0.5); b.vx = side * sp; } }
        }
        bounced = true;
      }
      if (!bulletFree(b.x, b.y, b.ghostObs)) { b.x = px; b.y = py; }
      if (b.ghostObs && !inBox(b.x, b.y, b.ghostObs)) b.ghostObs = null;
      if (bounced && b.state === 'fly') onBounce(b);
      if (doHits && b.state === 'fly') checkHits(b);
    }
  }
  function stopBullet(b) {
    b.vx = 0; b.vy = 0; b.state = 'floor'; b.trail.length = 0;
    if (b.eng === 'boom') explode(b.x, b.y, false, BOOM_R);
    if (b.eng === 'fire') { fires.push({ x: b.x, y: b.y, t: 2, hit: new Set() }); SFX.fire(); b.lockT = 3; b.burnT = 3; } // 화염탄은 3초 불타는 동안 아무도 못 주움
    if (b.eng === 'ret' && player.alive) { b.retWait = RET_WAIT; if (RET_WAIT <= 0) { b.state = 'return'; b.retT = 4; } } // 귀환(12.9): 멈추고 RET_WAIT초 뒤 굴러 옴, 일회용 아님. 귀환의 주인은 언제나 플레이어
  }
  function updateBullets(dt) {
    for (const b of bullets) {
      if (b.lockT > 0) b.lockT -= dt;
      if (b.burnT > 0) b.burnT -= dt;
      b.floorT = b.state === 'floor' ? (b.floorT || 0) + dt : 0; // 바닥에 놓인 시간(덫이 켜지는 데 씀)
      if (b.state === 'held') { b.x = b.owner.x; b.y = b.owner.y; continue; }
      if (b.state === 'fly') {
        stepBullet(b, dt, true);
        let fr = game.rule.fr, lin = game.rule.lin;
        if (b.eng === 'rubber') { fr *= 0.5; lin *= 0.5; } // 고무: 바닥 마찰 절반
        const sp = Math.hypot(b.vx, b.vy);
        let nsp = sp * Math.exp(-fr * dt) - lin * dt;
        if (b.ghostObs) nsp = Math.max(nsp, STOP + 30); // 엄폐물 안에서 멈추지 않게
        if (nsp < STOP || sp < 0.001) stopBullet(b);
        else { b.vx *= nsp / sp; b.vy *= nsp / sp; b.trail.push(b.x, b.y); if (b.trail.length > 16) b.trail.splice(0, 2); }
      } else if (b.state === 'return') {
        const o = player;
        b.retT -= dt;
        if (!o.alive || b.retT <= 0) { b.state = 'floor'; b.vx = b.vy = 0; continue; }
        const d = flowDir(fieldP, b.x, b.y, o.x, o.y);
        b.vx = d.x * RET_SPEED; b.vy = d.y * RET_SPEED;
        stepBullet(b, dt, false);
      } else if (b.state === 'floor' && b.retWait > 0) { // 귀환: 기다렸다가 굴러 오기 시작
        b.retWait -= dt;
        if (b.retWait <= 0 && player.alive) { b.state = 'return'; b.retT = 4; b.buried = false; }
      } else if (b.state === 'floor' && b.eng === 'magnet') { // 자석: 반지름 80 안이면 주인 쪽으로 천천히(4차 측정 +16%p라 120 → 80, 조각 1-2)
        const o = player; // 자석의 주인은 언제나 플레이어
        if (o.alive && Math.hypot(o.x - b.x, o.y - b.y) < 80) {
          const d = norm(o.x - b.x, o.y - b.y); b.vx = d.x * 70; b.vy = d.y * 70;
          stepBullet(b, dt, false); b.vx = b.vy = 0;
        }
      }
    }
  }
  function updateFires(dt) {
    for (const f of fires) {
      f.t -= dt;
      if (Math.random() < 0.6) particles.push({ x: f.x + rand(-30, 30), y: f.y + rand(-30, 30), vx: rand(-10, 10), vy: rand(-60, -20), life: 0.4, max: 0.4, col: Math.random() < 0.5 ? '#ff7a20' : '#ffc040', size: rand(3, 5) });
      for (let i = -1; i < enemies.length; i++) {
        const e = i < 0 ? player : enemies[i];
        if (!e.alive || f.hit.has(e) || e.under) continue;
        if (e.isPlayer && f.t > 1.5) continue; // 플레이어는 불길이 생기고 0.5초 뒤부터 맞음. 적이 맞는 범위는 FIRE_R+r(8+r), 플레이어는 40+r
        if (Math.hypot(e.x - f.x, e.y - f.y) < (e.isPlayer ? 40 : FIRE_R) + e.r) { if (hurt(e, '화염', { x: f.x, y: f.y })) f.hit.add(e); }
      }
    }
    fires = fires.filter((f) => f.t > 0);
  }
  function give(e, b) {
    b.state = 'held'; b.owner = e; b.vx = b.vy = 0; b.trail.length = 0; b.x = e.x; b.y = e.y; b.buried = false; b.sweepT = 0; b.retWait = 0;
    e.held.push(b);
    if (e.isPlayer) { sortHeld(e); if (b.eng === 'trap') b.trapArmed = true; }
    else game.run.stolen++;
    for (let i = 0; i < 5; i++) particles.push({ x: e.x, y: e.y, vx: rand(-60, 60), vy: rand(-60, 60), life: 0.25, max: 0.25, col: '#ffe9a0', size: 2 });
    SFX.click();
  }
  function updatePickups(dt) {
    const cp = game.rule.canPick; // 바닥 법칙의 줍기 조건(없으면 닿으면 바로 줍는다)
    for (const b of bullets) {
      if (b.state !== 'floor' && b.state !== 'return') continue;
      if (player.alive && !(b.burnT > 0) && Math.hypot(player.x - b.x, player.y - b.y) < player.r + BR + 4 && (!cp || cp(player, b, dt))) { give(player, b); continue; }
      if (b.lockT > 0) continue;
      for (const e of enemies) {
        if (!e.alive || !e.pick || e.under) continue;
        if (Math.hypot(e.x - b.x, e.y - b.y) >= e.r + BR + 4) continue;
        if (cp && !cp(e, b, dt)) continue; // 이 적이 아직 파는 중이면 다른 적을 본다
        enemyTake(e, b);
        break;
      }
    }
  }
  function enemyTake(e, b) {
    if (b.eng === 'trap' && b.trapArmed && b.floorT > TRAP_ARM) { // 덫: 바닥에 TRAP_ARM초 놓인 뒤에만 켜짐. 터지면 내가 다시 주울 때까지 꺼짐(일회용 아님, 12.9)
      b.trapArmed = false; b.lockT = 1.2; b.state = 'floor'; b.vx = b.vy = 0;
      explode(b.x, b.y, true, TRAP_R);
    } else give(e, b);
  }
  // ----- 모래 바닥 법칙(12.8) -----
  const WIND_SPEED = 12, BURY_T = 5, DIG_T = 0.5, DIG_GRACE = 0.25;
  function sandUpdate(dt) { // 바람: 바닥 탄이 초속 12로 구른다(벽·바위에 막히면 멈춤). 바닥에 놓인 지 5초 지나면 묻혀서 더는 구르지 않는다.
    for (const b of bullets) {
      if (b.state !== 'floor') { b.buried = false; continue; }
      if (b.sweepT > 0) continue;
      if (b.floorT >= BURY_T) { b.buried = true; continue; }
      if (!game.wind) continue;
      b.vx = game.wind.x * WIND_SPEED; b.vy = game.wind.y * WIND_SPEED;
      stepBullet(b, dt, false); b.vx = b.vy = 0;
    }
  }
  function sandCanPick(e, b, dt) { // 묻힌 탄은 그 위에 0.5초 서 있어야 줍는다(플레이어·적 모두). 한 사람이 한 탄씩 판다.
    if (!b.buried) return true;
    const cur = e.digB, live = e.digTick >= game.tick - 1 || (!e.isPlayer && game.time - (e.digTime == null ? -9 : e.digTime) <= DIG_GRACE); // 지난 프레임이나 이번 프레임에 파던 탄이 있는가(적은 0.25초 안에 다시 들어오면 이어 판다: 줍는 거리 경계를 들락날락하던 불량, 조각 3-2)
    // 파던 탄이 아직 묻힌 채 줍는 거리 안이면 그 탄만 판다(두 발이 함께 닿을 때 목표가 번갈아 바뀌어 영영 못 줍던 불량, 조각 2-2 검수)
    if (cur && cur !== b && live && cur.state === 'floor' && cur.buried && Math.hypot(e.x - cur.x, e.y - cur.y) < e.r + BR + 4) return false;
    if (cur !== b || !live) { e.digB = b; e.digT = 0; }
    if (e.digTick !== game.tick) { e.digTick = game.tick; e.digTime = game.time; e.digT += dt; }
    return e.digT >= DIG_T;
  }
  // 마녀의 쓸어 보내기: 예고(1.2초) 뒤 방 안의 모든 바닥 탄을 화살표 방향 벽으로 보낸다
  function updateSweep(dt) {
    const sw = game.sweep;
    if (sw && sw.t > 0) {
      sw.t -= dt;
      if (sw.t <= 0) {
        for (const b of bullets) if (b.state === 'floor') { b.sweepT = 1.6; b.sweepDir = sw.dir; b.sweepSp = 520; b.buried = false; b.floorT = 0; }
        game.shake = Math.max(game.shake, 0.3); SFX.fire();
        game.sweep = null;
      }
    }
    for (const b of bullets) {
      if (!(b.sweepT > 0)) continue;
      if (b.state !== 'floor') { b.sweepT = 0; continue; }
      b.sweepT -= dt;
      const px = b.x, py = b.y;
      const ssp = b.sweepSp || 520; // 마녀 쓸기 520, 다이너마이트에 흩어진 탄은 더 느리게
      b.vx = b.sweepDir.x * ssp; b.vy = b.sweepDir.y * ssp;
      stepBullet(b, dt, false); b.vx = b.vy = 0; b.floorT = 0;
      if (Math.hypot(b.x - px, b.y - py) < 0.5) b.sweepT = 0; // 벽·바위에 막힘
      if (Math.random() < 0.3) particles.push({ x: b.x, y: b.y, vx: rand(-30, 30), vy: rand(-30, 30), life: 0.35, max: 0.35, dust: rand(3, 6), col: '#b8925a' });
    }
  }
  // ----- 폐광 바닥 법칙: 광차 레일(12.11) -----
  const CART_L = 46, CART_W = 34, CART_SP = 400, CART_GAP = 7; // 광차 길이·폭, 빠르기, 다음 광차까지(초)
  const RAIL_H = [165, 335, 405], RAIL_V = [220, 300, 460, 640, 700]; // 레일 후보(가로는 y, 세로는 x). 시작 자리(y 248)·문 자리를 피함
  function pickRails() { // 버팀목과 겹치지 않는 후보에서 1~2줄(같은 방향이면 120 이상 떨어지게)
    const free = (dir, p) => { for (const o of obstacles) if (dir === 'h' ? (o.y < p + 26 && o.y + o.h > p - 26) : (o.x < p + 26 && o.x + o.w > p - 26)) return false; return true; };
    const cands = shuffle(RAIL_H.filter((y) => free('h', y)).map((p) => ({ dir: 'h', p })).concat(RAIL_V.filter((x) => free('v', x)).map((p) => ({ dir: 'v', p }))));
    const want = R() < 0.5 ? 1 : 2, out = [];
    for (const c of cands) { if (out.length >= want) break; if (out.some((o) => o.dir === c.dir && Math.abs(o.p - c.p) < 120)) continue; out.push(c); }
    return out.map((c, i) => ({ dir: c.dir, p: c.p, phase: 'idle', t: 2.5 + i * 3 + R() * 1.5, max: 1, s: 0, sgn: R() < 0.5 ? 1 : -1, load: [], hit: new Set() }));
  }
  const railEnds = (rl) => (rl.dir === 'h' ? [AR.l - CART_L / 2 - 8, AR.r + CART_L / 2 + 8] : [AR.t - CART_L / 2 - 8, AR.b + CART_L / 2 + 8]);
  const cartRect = (rl) => (rl.dir === 'h' ? { x: rl.s - CART_L / 2, y: rl.p - CART_W / 2, w: CART_L, h: CART_W } : { x: rl.p - CART_W / 2, y: rl.s - CART_L / 2, w: CART_W, h: CART_L });
  function mineUpdate(dt) {
    for (const rl of game.rails) {
      if (rl.phase === 'idle') { rl.t -= dt; if (rl.t <= 0) { rl.phase = 'warn'; rl.t = rl.max = game.stage === 0 ? 1.3 : 1.0; SFX.warn(); } continue; }
      if (rl.phase === 'warn') { rl.t -= dt; if (rl.t <= 0) { rl.phase = 'run'; const [a, b] = railEnds(rl); rl.s = rl.sgn > 0 ? a : b; rl.hit.clear(); } continue; }
      rl.s += rl.sgn * CART_SP * dt;
      const c = cartRect(rl);
      for (const b of bullets) if ((b.state === 'floor' || b.state === 'return') && inBox(b.x, b.y, c)) { // 레일 위 바닥 탄을 싣는다
        Object.assign(b, { state: 'cart', cart: rl, vx: 0, vy: 0, retWait: 0, buried: false, sweepT: 0 }); b.trail.length = 0; rl.load.push(b);
      }
      rl.load.forEach((b, i) => { const u = (i % 3 - 1) * 10, v = (Math.floor(i / 3) - 0.5) * 9; b.x = rl.dir === 'h' ? rl.s + u : rl.p + v; b.y = rl.dir === 'h' ? rl.p + v : rl.s + u; });
      for (let i = -1; i < enemies.length; i++) { // 닿으면 피해 1, 옆으로 밀림(플레이어·적 모두. 나는 적·땅속 적은 빼고)
        const e = i < 0 ? player : enemies[i];
        if (!e.alive || e.fly || e.under || rl.hit.has(e) || !circleRect(e.x, e.y, e.r, c)) continue;
        rl.hit.add(e);
        const hz = rl.dir === 'h', side = Math.sign(hz ? e.y - rl.p : e.x - rl.p) || 1, out = CART_W / 2 + e.r + 1;
        if (hz) { e.y = rl.p + side * out; e.vy = side * 420; } else { e.x = rl.p + side * out; e.vx = side * 420; }
        collideEnt(e);
        hurt(e, '광차', { x: c.x + c.w / 2, y: c.y + c.h / 2, name: '' });
        game.shake = Math.max(game.shake, 0.25);
      }
      const [a, b] = railEnds(rl);
      if ((rl.sgn > 0 && rl.s >= b) || (rl.sgn < 0 && rl.s <= a)) { unloadCart(rl); rl.phase = 'idle'; rl.t = (game.stage >= 3 ? CART_GAP - 1 : CART_GAP) + arand(-1, 1); rl.sgn = -rl.sgn; }
    }
  }
  function unloadCart(rl) { // 레일 끝(벽 앞) 양옆에 내려놓는다(레일 띠 밖이라 다음 광차가 바로 다시 싣지 않음)
    const hz = rl.dir === 'h', endS = rl.sgn > 0 ? (hz ? AR.r : AR.b) - 22 : (hz ? AR.l : AR.t) + 22;
    rl.load.forEach((b, i) => {
      const side = i % 2 ? 1 : -1, off = CART_W / 2 + BR + 6 + Math.floor(i / 2) * 11, s = endS - rl.sgn * (i % 3) * 10;
      const p = offButtons(freeSpot(clamp(hz ? s : rl.p + side * off, AR.l + BR + 1, AR.r - BR - 1), clamp(hz ? rl.p + side * off : s, AR.t + BR + 1, AR.b - BR - 1)));
      Object.assign(b, { state: 'floor', owner: null, cart: null, x: p.x, y: p.y, vx: 0, vy: 0, floorT: 0, buried: false, sweepT: 0 });
    });
    rl.load = [];
  }
  // 폰 발사·올가미·멈춤 단추 밑(누름 범위 + 탄 반지름)이면 가까운 바깥 열린 자리로(레일 띠도 피함, 조각 3-2)
  const onButton = (x, y) => Math.hypot(x - FB.x, y - FB.y) < FB_HIT + BR || Math.hypot(x - LB.x, y - LB.y) < LB_HIT + BR || (x > PB.x - 6 - BR && y < PB.y + PB.h + 6 + BR);
  const onRailBand = (x, y) => game.rails.some((rl) => Math.abs((rl.dir === 'h' ? y : x) - rl.p) < CART_W / 2 + BR + 1);
  function offButtons(p) {
    if (!onButton(p.x, p.y)) return p;
    for (let rr = 6; rr < 400; rr += 6) for (let i = 0; i < 24; i++) { const a = i * Math.PI / 12, nx = p.x + Math.cos(a) * rr, ny = p.y + Math.sin(a) * rr; if (bulletFree(nx, ny) && !onButton(nx, ny) && !onRailBand(nx, ny)) return { x: nx, y: ny }; }
    return p;
  }
  // ----- 광부(12.11): 플레이어가 있던 자리에 다이너마이트. 바닥 빨간 원 1초 예고 뒤 터져 피해 1, 범위 안 바닥 탄을 흩는다 -----
  const DYN_R = 50, DYN_T = 1.0; // 플레이어가 맞는 범위 = 50 + 몸 반지름(원은 그 크기로 그린다)
  function throwDyn(e) {
    const t = game.stage === 0 ? DYN_T * 1.3 : DYN_T;
    dyns.push({ x: clamp(player.x, AR.l + 8, AR.r - 8), y: clamp(player.y, AR.t + 8, AR.b - 8), sx: e.x, sy: e.y, t, max: t });
    SFX.warn();
  }
  function updateDyns(dt) {
    for (const d of dyns) {
      d.t -= dt;
      if (d.t > 0) { if (Math.random() < 0.5) particles.push({ x: d.x + rand(-3, 3), y: d.y - 6, vx: rand(-30, 30), vy: rand(-70, -30), life: 0.25, max: 0.25, col: '#ffe08a', size: 2 }); continue; }
      for (let i = 0; i < 26; i++) { const a = rand(0, 7), s = rand(60, 260); particles.push({ x: d.x, y: d.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: rand(0.25, 0.5), max: 0.5, col: i % 2 ? '#ff6a3d' : '#ffd36a', size: rand(2, 4) }); }
      particles.push({ x: d.x, y: d.y, vx: 0, vy: 0, life: 0.3, max: 0.3, ring: DYN_R + player.r, col: '#ff3a2a' });
      game.shake = Math.max(game.shake, 0.35); SFX.boom();
      if (player.alive && Math.hypot(player.x - d.x, player.y - d.y) < DYN_R + player.r) hurt(player, '다이너마이트', { x: d.x, y: d.y, name: '광부' });
      for (const b of bullets) if (b.state === 'floor') { // 바닥 탄을 바깥으로 흩는다(약 100px 굴러감)
        const q = Math.hypot(b.x - d.x, b.y - d.y); if (q >= DYN_R + 20) continue;
        const a = q > 1 ? Math.atan2(b.y - d.y, b.x - d.x) : AIR() * Math.PI * 2;
        Object.assign(b, { sweepT: 0.3, sweepDir: { x: Math.cos(a), y: Math.sin(a) }, sweepSp: 330, buried: false, floorT: 0, retWait: 0 });
      }
    }
    dyns = dyns.filter((d) => d.t > 0);
  }
  // ----- 광산왕 몰리(12.11): 주운 탄을 광차에 모은다. 3발 이상이면 예고 1.2초 뒤 부채꼴 일제 사격. 광차를 3번 맞히면 모인 탄을 쏟는다 -----
  const MCART_R = 15, SHIELD_A = Math.PI / 3; // 몰리 광차 맞는 반지름, 보안관 방패 반각(±60°)
  function mollyCart(e) { // 광차 자리 = 그림 속 광차 가운데(기준점에서 앞 53.6, 오른쪽 22.6 그림 px)
    const k = e.r * SPR_K / SPR.molly.br, c = Math.cos(e.face), s = Math.sin(e.face), u = 53.6 * k, v = 22.6 * k;
    return { x: e.x + c * u - s * v, y: e.y + s * u + c * v };
  }
  function dumpCart(e) {
    const c = mollyCart(e), a0 = Math.atan2(c.y - e.y, c.x - e.x); let k = 0;
    for (const b of e.held) { // 광차 바깥쪽(몰리 반대편)으로 부채꼴로 쏟고, 1.5초 동안 적은 못 줍는다(몰리가 바로 다시 줍지 않게)
      const a = a0 + (k - (e.held.length - 1) / 2) * 0.55, p = freeSpot(clamp(c.x + Math.cos(a) * 34, AR.l + BR + 1, AR.r - BR - 1), clamp(c.y + Math.sin(a) * 34, AR.t + BR + 1, AR.b - BR - 1));
      Object.assign(b, { state: 'floor', owner: null, x: p.x, y: p.y, vx: 0, vy: 0, floorT: 0, buried: false, sweepT: 0, lockT: 1.5 }); b.trail.length = 0; k++;
    }
    e.held = []; e.cartHits = 0; e.state = 'away'; e.t = 0.8; e.seekT = 0;
    game.shake = Math.max(game.shake, 0.3); SFX.boom();
    particles.push({ x: c.x, y: c.y - 24, vx: 0, vy: -30, life: 1, max: 1, text: '광차 쏟음!', col: '#ffe08a' });
  }
  function lineWide(x1, y1, x2, y2, pad) { // 엄폐물에서 pad만큼 떨어진 곧은 길인가(두더지가 잘 보이는 자리에 솟게)
    const d = Math.hypot(x2 - x1, y2 - y1), n = Math.max(1, Math.ceil(d / 4));
    for (let i = 1; i < n; i++) { const x = x1 + (x2 - x1) * i / n, y = y1 + (y2 - y1) * i / n; for (const o of obstacles) if (x > o.x - pad && x < o.x + o.w + pad && y > o.y - pad && y < o.y + o.h + pad) return false; }
    return true;
  }
  function bodySpot(x, y, r) { // 몸(반지름 r)이 들어가는 가장 가까운 자리
    if (pointFree(x, y, r)) return { x, y };
    for (let rr = 6; rr < 240; rr += 6) for (let i = 0; i < 16; i++) { const a = i * Math.PI / 8, nx = x + Math.cos(a) * rr, ny = y + Math.sin(a) * rr; if (pointFree(nx, ny, r)) return { x: nx, y: ny }; }
    return { x: 480, y: 248 };
  }
  // 날던 적이 엄폐물 위에서 쓰러져도 탄이 바위 안에 놓이지 않게, 가장 가까운 빈 자리를 찾는다
  function freeSpot(x, y) {
    if (bulletFree(x, y)) return { x, y };
    for (let rr = 6; rr < 200; rr += 6) for (let i = 0; i < 16; i++) { const a = i * Math.PI / 8, nx = x + Math.cos(a) * rr, ny = y + Math.sin(a) * rr; if (bulletFree(nx, ny)) return { x: nx, y: ny }; }
    return { x: clamp(x, AR.l + BR + 1, AR.r - BR - 1), y: clamp(y, AR.t + BR + 1, AR.b - BR - 1) };
  }
  function explode(x, y, enemiesOnly, rad = 60) {
    for (let i = 0; i < 26; i++) { const a = rand(0, 7), s = rand(60, 260); particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: rand(0.25, 0.5), max: 0.5, col: i % 2 ? '#ff8a3d' : '#ffd36a', size: rand(2, 4) }); }
    particles.push({ x, y, vx: 0, vy: 0, life: 0.3, max: 0.3, ring: rad, col: enemiesOnly ? '#c77dff' : '#ff6a3d' });
    game.shake = Math.max(game.shake, 0.35); SFX.boom();
    if (!enemiesOnly && player.alive && Math.hypot(player.x - x, player.y - y) < 40 + player.r) hurt(player, '폭발', { x, y });
    for (const e of enemies.slice()) if (e.alive && !e.under && Math.hypot(e.x - x, e.y - y) < rad + e.r) hurt(e, '폭발'); // 폭발·화염·덫 범위는 r 기준(적 맞는 거리 확대와 떼어 냄, 12.3)
  }

  // ===== 피해 (피해를 줬으면 true) =====
  function hurt(e, cause, src) {
    if (e.isPlayer) {
      if (player.inv > 0 || !player.alive || game.clearing || game.state !== 'play') return false;
      if (src) game.hitDirs.push({ a: Math.atan2(src.y - player.y, src.x - player.x), t: 0.5 });
      game.lastHit = cause + (src && src.name ? '(' + src.name + ')' : '');
      player.hp--; player.inv = 0.8; game.flash = 0.35; game.shake = Math.max(game.shake, 0.35); game.freeze = 0.05; SFX.hurt();
      if (game.run.hitsBy[cause] !== undefined) game.run.hitsBy[cause]++;
      if (player.hp <= 0) { player.alive = false; game.run.death = cause; game.run.lastHit = game.lastHit; game.state = 'over'; game.overT = 0.6; }
      return true;
    }
    if (!e.alive || e.inv > 0) return false;
    e.hp--; e.flash = 0.12; game.freeze = 0.05; game.shake = Math.max(game.shake, 0.22); SFX.hit();
    for (let i = 0; i < 8; i++) particles.push({ x: e.x, y: e.y, vx: rand(-150, 150), vy: rand(-150, 150), life: 0.3, max: 0.3, col: '#c0392b', size: 2.5 });
    if (e.hp <= 0) kill(e);
    return true;
  }
  function kill(e) {
    e.alive = false; game.kills++;
    let k = 0;
    for (const b of e.held) {
      let x = e.x, y = e.y, ok = false;
      for (let tries = 0; tries < 8; tries++) {
        const a = (k + tries) * 1.7, nx = e.x + Math.cos(a) * 12, ny = e.y + Math.sin(a) * 12;
        if (bulletFree(nx, ny)) { x = nx; y = ny; ok = true; break; }
      }
      if (!ok) ({ x, y } = freeSpot(e.x, e.y)); // 독수리가 바위 위에서 쓰러진 경우 등
      Object.assign(b, { state: 'floor', owner: null, x, y, vx: 0, vy: 0, floorT: 0, buried: false, sweepT: 0 }); b.trail.length = 0; k++;
    }
    e.held = [];
    // 먼지 + 날아가는 모자
    for (let i = 0; i < 10; i++) { const a = rand(0, 7), s = rand(20, 90); particles.push({ x: e.x, y: e.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: rand(0.5, 0.9), max: 0.9, dust: rand(6, 12), col: '#8a7a68' }); }
    const ha = rand(0, 7);
    particles.push({ x: e.x, y: e.y, vx: Math.cos(ha) * 160, vy: Math.sin(ha) * 160, life: 0.9, max: 0.9, hat: IMG[e.type] ? SPR[e.type].hat * e.r * SPR_K / SPR[e.type].br : e.r * 0.9, col: ETYPES[e.type].hat, rot: rand(0, 7), vr: rand(-12, 12) });
    if (!enemies.some((o) => o.alive) && game.wave >= game.waves && game.waveWarn <= 0) { game.slow = 0.9; }
  }

  // ===== 플레이어 =====
  const keys = {};
  const mouse = { x: 480, y: 248 };
  let aimMode = 'mouse';
  let stick = { active: false }, aimT = { active: false };
  const STICK_PUSH = 110;                           // 스틱 중심을 플레이어에게서 이만큼 떨어뜨림
  const FB = { x: 862, y: 396, r: 60 };              // 터치 발사 버튼(공격 스틱, 12.7)
  const FB_HIT = FB.r + 10;                         // 이만큼 안을 누르면 발사 버튼
  const LB = { x: 862, y: 292, r: 30 }, LB_HIT = LB.r + 4; // 터치 올가미 단추(짐일 때만): 발사 버튼 위, 누름 판정이 발사 버튼(326부터)과 겹치지 않게
  const PB = { x: W - 136, y: 0, w: 132, h: 56 };    // 터치 멈춤 단추(130×56 이상)

  // ----- 터치 조준(12.2) -----
  function lineClear(x1, y1, x2, y2) { // 탄 가운데가 지나는 길에 엄폐물이 없는가
    const d = Math.hypot(x2 - x1, y2 - y1), n = Math.max(1, Math.ceil(d / 4));
    for (let i = 1; i < n; i++) { const x = x1 + (x2 - x1) * i / n, y = y1 + (y2 - y1) * i / n; for (const o of obstacles) if (inBox(x, y, o)) return false; }
    return true;
  }
  const TAP_RANGE = 450, TAP_JIT = 10 * Math.PI / 180; // 톡 약화(12.9): 이보다 먼 적은 노리지 않음, 쏠 때 ±10° 흔들림(±6°는 기준 미달이라 팀장이 10°로 정함)
  function tapTarget() { // 톡: 곧게 쏴서 맞힐 수 있는 가장 가까운 적(지금 위치, 앞을 내다보지 않음), TAP_RANGE 안만
    let best = null, bd = 1e9;
    for (const e of enemies) {
      if (!e.alive || e.inv > 0 || e.under) continue;
      const d = Math.hypot(e.x - player.x, e.y - player.y);
      if (d < bd && d <= TAP_RANGE && lineClear(player.x, player.y, e.x, e.y)) { bd = d; best = e; }
    }
    return best;
  }
  const ASSIST = 8 * Math.PI / 180;
  function assistAim(a) { // 끌기: 끈 방향 ±8° 안에 적이 있으면 그 적 쪽으로(가장 각도 차가 작은 적)
    let best = a, bd = ASSIST;
    for (const e of enemies) {
      if (!e.alive || e.inv > 0 || e.under) continue;
      const ea = Math.atan2(e.y - player.y, e.x - player.x), d = Math.abs(angDiff(ea, a));
      if (d <= bd) { bd = d; best = ea; }
    }
    return best;
  }
  function countEng(b) { if (b.eng) game.run.engShots[b.eng] = (game.run.engShots[b.eng] || 0) + 1; } // 각인별 쏜 수(엔딩 결과의 「가장 많이 쓴 각인」)
  function topEng(run) { let k = null, n = 0; for (const e in run.engShots || {}) if (run.engShots[e] > n) { n = run.engShots[e]; k = e; } return k ? { name: ENG[k].name, n } : null; }
  function playerShoot() {
    if (game.state !== 'play' || game.paused || !player.alive || player.shotCd > 0 || game.roomT < 0.3 || game.actT > 0) return;
    if (!player.held.length) return;
    player.shotCd = 0.12;
    const b0 = player.held[0];
    if (game.hero === 'rosa' && player.held.length >= 2) { // 쌍권총 로사: 손의 탄 2발을 ±6° 부채꼴로
      const b1 = player.held[1];
      fire(player, player.aim - ROSA_FAN, SHOT_SPEED); fire(player, player.aim + ROSA_FAN, SHOT_SPEED);
      game.run.shots += 2; b0.pShot = true; b1.pShot = true; countEng(b0); countEng(b1);
      player.vx -= Math.cos(player.aim) * 160; player.vy -= Math.sin(player.aim) * 160;
      player.recoil = 0.1; game.shake = Math.max(game.shake, 0.1);
    } else if (fire(player, player.aim, SHOT_SPEED)) {
      game.run.shots++; b0.pShot = true; countEng(b0);
      player.vx -= Math.cos(player.aim) * 140; player.vy -= Math.sin(player.aim) * 140;
      player.recoil = 0.1; game.shake = Math.max(game.shake, 0.08);
    }
  }
  const ROSA_FAN = 6 * Math.PI / 180, LASSO_R = 260, LASSO_CD = 4; // 로사 부채꼴 반각, 짐 올가미 반지름·재사용 대기(초)
  // 올가미 짐: 반지름 260 안의 가장 가까운 바닥 탄(묻힌 탄도) 하나를 손으로 끌어온다. 닿는 탄이 없으면 대기 시간을 쓰지 않는다.
  function playerLasso() {
    if (game.hero !== 'jim' || game.state !== 'play' || game.paused || !player.alive || game.roomT < 0.3 || game.actT > 0 || game.clearing) return;
    if (player.lassoCd > 0) return;
    let best = null, bd = LASSO_R;
    for (const b of bullets) if (b.state === 'floor' && !(b.burnT > 0)) { const d = Math.hypot(b.x - player.x, b.y - player.y); if (d <= bd) { bd = d; best = b; } }
    if (!best) { game.lassoFail = 0.5; return; }
    player.lassoCd = LASSO_CD; game.run.lassos++;
    particles.push({ x: best.x, y: best.y, vx: 0, vy: 0, life: 0.3, max: 0.3, rope: true });
    give(player, best);
  }
  function updatePlayer(dt) {
    if (!player.alive) return;
    let mx = 0, my = 0;
    if (keys.KeyA || keys.ArrowLeft) mx -= 1;
    if (keys.KeyD || keys.ArrowRight) mx += 1;
    if (keys.KeyW || keys.ArrowUp) my -= 1;
    if (keys.KeyS || keys.ArrowDown) my += 1;
    let mag = Math.hypot(mx, my);
    if (stick.active) {
      const dx = stick.x - stick.ox, dy = stick.y - stick.oy, d = Math.hypot(dx, dy);
      if (d > 6) { mx = dx / d; my = dy / d; mag = Math.min(1, d / 50); } else { mx = my = 0; mag = 0; }
    } else if (mag > 0) { mx /= mag; my /= mag; mag = 1; }
    moveEnt(player, mx * mag * player.speed, my * mag * player.speed, dt);
    if (aimMode === 'mouse') player.aim = Math.atan2(mouse.y - player.y, mouse.x - player.x);
    player.inv = Math.max(0, player.inv - dt);
    player.shotCd = Math.max(0, player.shotCd - dt);
    player.recoil = Math.max(0, player.recoil - dt);
    player.lassoCd = Math.max(0, player.lassoCd - dt); game.lassoFail = Math.max(0, game.lassoFail - dt);
  }

  // ===== 적 AI: 줍기 → 조준(예고) → 쏘기 → 거리 두기 =====
  function beginAim(e) {
    e.state = 'aim';
    const isB = !!ETYPES[e.type].boss, enraged = isB && e.hp <= e.maxHp / 2;
    let t = e.type === 'sniper' ? 1.0 : e.type === 'molly' ? 1.2 : e.type === 'sheriff' ? 0.75 : isB ? (enraged ? 0.5 : 0.6) : 0.5; // 몰리 일제 사격 예고 1.2초, 보안관은 천천히 겨눔
    if (game.stage >= 3) t = Math.max(0.35, t * 0.8);
    if (game.stage === 0) t *= 1.3; // 0단계(입문): 예고 1.3배
    e.t = t;
    e.aimOff = e.type === 'thug' || e.type === 'mole' ? arand(-0.14, 0.14) : e.type === 'sheriff' ? arand(-0.18, 0.18) : isB ? arand(-0.05, 0.05) : 0;
    SFX.warn();
  }
  function keepDistance(e, ideal, d, dx, dy) {
    if (d > ideal + 60) return flowDir(fieldP, e.x, e.y, player.x, player.y);
    if (d < ideal - 60) return fleeDir(e.x, e.y, e);
    const n = norm(dx, dy); return { x: -n.y * e.strafe * 0.6, y: n.x * e.strafe * 0.6 };
  }
  function updateEnemy(e, dt) {
    const dx = player.x - e.x, dy = player.y - e.y, d = Math.hypot(dx, dy), angP = Math.atan2(dy, dx);
    const isB = !!ETYPES[e.type].boss, enraged = isB && e.hp <= e.maxHp / 2;
    const sp = e.speed * (enraged ? 1.22 : 1);
    e.inv = Math.max(0, e.inv - dt);
    let mv = { x: 0, y: 0 }, spMul = 1;
    e.t -= dt; e.flash = Math.max(0, e.flash - dt); e.slashFx = Math.max(0, e.slashFx - dt);
    e.strafeT -= dt; if (e.strafeT <= 0) { e.strafe *= -1; e.strafeT = arand(1.2, 3); }
    if (e.type === 'knife') {
      if (e.state === 'seek') {
        mv = flowDir(fieldP, e.x, e.y, player.x, player.y);
        if (player.alive && d < 120 && rayLen(e.x, e.y, angP, d) >= d - player.r) { e.state = 'windup'; e.t = game.stage === 0 ? 0.39 : 0.3; e.aimAng = angP; SFX.warn(); }
      } else if (e.state === 'windup') {
        if (e.t <= 0) { e.state = 'dash'; e.t = 0.35; e.dashHit = false; SFX.slash(); }
      } else if (e.state === 'dash') { // 돌진: 0.35초 동안 1.8배
        mv = { x: Math.cos(e.aimAng), y: Math.sin(e.aimAng) }; spMul = 1.8; e.slashFx = 0.1;
        if (!e.dashHit && player.alive && d < e.r + player.r + 6) { e.dashHit = true; hurt(player, '칼', { x: e.x, y: e.y, name: '칼잡이' }); }
        if (e.t <= 0) { e.state = 'away'; e.t = 0.6; }
      } else { // away: 잠깐 물러남
        mv = fleeDir(e.x, e.y, e); spMul = 0.5;
        if (e.t <= 0) e.state = 'seek';
      }
    } else if (e.type === 'vulture') {
      mv = vultureMove(e, d);
    } else if (e.type === 'mole') {
      mv = moleMove(e, dt, angP);
    } else if (e.type === 'miner') { // 광부: 탄을 줍지 않고 250쯤 떨어져 다이너마이트를 던진다
      if (e.state === 'throw') { if (e.t <= 0) { e.state = 'seek'; e.t = arand(2.8, 3.6) * (game.stage >= 3 ? 0.85 : 1); } }
      else {
        mv = keepDistance(e, 250, d, dx, dy);
        if (e.t <= 0 && player.alive && d < 560 && !game.clearing) { e.state = 'throw'; e.t = 0.4; e.aimAng = angP; throwDyn(e); }
      }
    } else {
      if (e.type === 'witch') witchSweep(e, dt);
      if (e.state === 'seek') {
        e.seekT += dt;
        const want = isB ? 3 : 1;
        if (e.held.length >= want || (e.held.length > 0 && (e.seekT > 2.5 || !anyFloor))) {
          if (e.type === 'sniper') { e.state = 'back'; e.t = 1.6; } else beginAim(e);
        } else if (anyFloor && fieldB[cellOf(e.x, e.y)] < 1e9) {
          let near = null, nd = 1e9;
          for (const b of bullets) if (b.state === 'floor' && b.lockT <= 0) { const q = Math.hypot(b.x - e.x, b.y - e.y); if (q < nd) { nd = q; near = b; } }
          const sp0 = near ? bodySpot(near.x, near.y, e.r) : { x: e.x, y: e.y }; // 탄 옆 몸이 들어가는 자리로 곧장(엄폐물 모서리에 끼던 불량)
          mv = Math.hypot(sp0.x - e.x, sp0.y - e.y) < 40 && lineWide(e.x, e.y, sp0.x, sp0.y, e.r - 3) ? norm(sp0.x - e.x, sp0.y - e.y) : flowDir(fieldB, e.x, e.y, sp0.x, sp0.y); // 가깝고 몸이 지나갈 길이 트였으면 곧장
          if (isB && e.type !== 'molly') spMul = 1.15;    // 두목은 빠르게 줍는다(광차를 끄는 몰리는 빼고)
          if (game.stage >= 2) spMul *= 1.2;       // 2단계: 1.2배 빨리 주우러 감
        } else {
          mv = keepDistance(e, e.type === 'sniper' ? 340 : 230, d, dx, dy);
        }
      } else if (e.state === 'back') {
        mv = fleeDir(e.x, e.y, e);
        if (d > 330 || e.t <= 0) beginAim(e);
      } else if (e.state === 'aim') {
        if (!(e.type === 'molly' && e.t < 0.35)) e.aimAng = angP + e.aimOff;
        if (e.t <= 0) {
          if (!player.alive || !e.held.length) { e.state = 'seek'; e.seekT = 0; }
          else {
            if (e.type === 'molly') { const n = e.held.length; for (let i = 0; i < n; i++) fire(e, e.aimAng + (i - (n - 1) / 2) * MOLLY_SPREAD, 460); e.cartHits = 0; } // 몰리: 모인 탄을 모두 부채꼴로
            else if (isB && e.held.length >= 3) { fire(e, e.aimAng - 0.26, 680); fire(e, e.aimAng, 680); fire(e, e.aimAng + 0.26, 680); }
            else fire(e, e.aimAng, e.type === 'sniper' ? 860 : isB ? 680 : e.type === 'sheriff' ? SHERIFF_SHOT : 620);
            e.state = 'away'; e.t = e.type === 'molly' ? 1.5 : isB ? 0.5 : 0.7;
          }
        }
      } else if (e.state === 'away') {
        mv = fleeDir(e.x, e.y, e);
        if (e.t <= 0) { e.state = 'seek'; e.seekT = 0; }
      }
    }
    let v = sp * spMul;
    if (isB) v = Math.min(v, player.speed * 1.05); // 두목 속도 상한
    if (e.fly || e.under) moveFree(e, mv.x * v, mv.y * v, dt); else moveEnt(e, mv.x * v, mv.y * v, dt);
    if (e.type === 'sheriff') { // 방패를 든 채 천천히 돈다: 탄을 주우러 갈 때는 가는 쪽, 아니면 플레이어 쪽(옆·뒤를 노릴 틈)
      const moving = Math.hypot(e.vx, e.vy) > 20, toFloor = e.state === 'seek' && anyFloor && e.held.length === 0;
      const want = e.state === 'aim' ? e.aimAng : (toFloor || e.state === 'away') && moving ? Math.atan2(e.vy, e.vx) : angP;
      const da = angDiff(want, e.face), mx = SHERIFF_TURN * dt; e.face = angDiff(e.face + clamp(da, -mx, mx), 0);
    } else if (e.state === 'aim' || e.state === 'windup' || e.state === 'dash' || e.state === 'throw') e.face = e.aimAng;
    else if (Math.hypot(e.vx, e.vy) > 20) e.face = Math.atan2(e.vy, e.vx);
  }
  const SHERIFF_TURN = 0.8, MOLLY_SPREAD = 0.3, SHERIFF_SHOT = 520; // 보안관이 도는 빠르기(라디안/초), 몰리 일제 사격 탄 사이 각
  // 나는 적·땅속 적: 엄폐물을 넘고(싸움터 벽만 막음) 미끄러지지 않는다
  function moveFree(e, dvx, dvy, dt) {
    const a = 1 - Math.exp(-16 * dt);
    e.vx += (dvx - e.vx) * a; e.vy += (dvy - e.vy) * a;
    e.x = clamp(e.x + e.vx * dt, AR.l + e.r, AR.r - e.r); e.y = clamp(e.y + e.vy * dt, AR.t + e.r, AR.b - e.r);
  }
  // 독수리(12.8): 가장 가까운 바닥 탄을 낚아채, 가장 가까운 다른 적 위로 날아가 떨어뜨려 준다. 직접 쏘지 않는다.
  function vultureMove(e, d) {
    if (e.held.length) {
      let to = null, td = 1e9;
      for (const o of enemies) if (o !== e && o.alive && o.pick && !o.under && !o.fly) { const q = Math.hypot(o.x - e.x, o.y - e.y); if (q < td) { td = q; to = o; } }
      if (to) {
        if (td < to.r + e.r + 6) { // 떨어뜨려 준다(빼앗긴 탄 수는 처음 낚아챌 때만 센다)
          for (const b of e.held) { b.owner = to; to.held.push(b); }
          e.held = []; e.state = 'rest'; e.t = 1.6; SFX.click();
          return { x: 0, y: 0 };
        }
        return norm(to.x - e.x, to.y - e.y);
      }
      if (bulletFree(e.x, e.y)) { // 받을 적이 없으면 그 자리에 떨어뜨리고 쉰다
        for (const b of e.held) Object.assign(b, { state: 'floor', owner: null, x: e.x, y: e.y, vx: 0, vy: 0, floorT: 0, buried: false, sweepT: 0, lockT: 0.6 });
        e.held = []; e.state = 'rest'; e.t = 2.2;
        return { x: 0, y: 0 };
      }
      return norm(480 - e.x, 248 - e.y);
    }
    if (e.t <= 0) {
      let near = null, nd = 1e9;
      for (const b of bullets) if (b.state === 'floor' && b.lockT <= 0 && !(b.burnT > 0)) { const q = Math.hypot(b.x - e.x, b.y - e.y); if (q < nd) { nd = q; near = b; } }
      if (near) { e.state = 'seek'; const n = norm(near.x - e.x, near.y - e.y), k = Math.min(1, nd / 30); return { x: n.x * k, y: n.y * k }; }
    }
    // 쉬는 중이거나 바닥 탄이 없으면 플레이어 둘레(약 220)를 돈다
    const n = norm(e.x - player.x, e.y - player.y), rr = d < 180 ? 0.8 : d > 260 ? -0.8 : 0;
    return { x: -n.y * e.strafe + n.x * rr, y: n.x * e.strafe + n.y * rr };
  }
  // 두더지(12.8): 땅속(맞지 않음)으로 바닥 탄 밑까지 가서 0.7초 흙 들썩임 예고 뒤 솟아 탄을 줍는다. 솟은 뒤 1.5초 동안 땅 위(맞음), 탄이 있으면 건달처럼 예고 뒤 쏜다.
  // 노릴 바닥 탄이 없거나 탄을 들고 있으면 플레이어에게서 약 190 떨어진 곳에 솟는다(언제나 다시 솟아 쓰러뜨릴 수 있게).
  function moleMove(e, dt, angP) {
    if (e.state === 'seek' || e.state === 'under') {
      if (e.state === 'seek') { e.state = 'under'; e.under = true; e.seekT = 0; e.molT = null; }
      e.seekT += dt;
      let tx, ty, near = null, nd = 1e9;
      if (!e.held.length) for (const b of bullets) if (b.state === 'floor' && b.lockT <= 0 && !(b.burnT > 0)) { const q = Math.hypot(b.x - e.x, b.y - e.y); if (q < nd) { nd = q; near = b; } }
      if (near) { tx = near.x; ty = near.y; }
      else if (e.molT && e.seekT - e.molT.t < 3) { tx = e.molT.x; ty = e.molT.y; } // 정한 자리는 3초 동안 고정(프레임마다 반대편으로 뒤집히던 불량, 조각 2-2 검수)
      else { // 플레이어가 곧게 쏴서 맞힐 수 있는(가운데 엄폐물 없는) 자리를 고른다. 지금 쪽에서 가까운 각도부터.
        const a0 = Math.atan2(e.y - player.y, e.x - player.x);
        tx = clamp(player.x + Math.cos(a0) * 190, AR.l + 40, AR.r - 40); ty = clamp(player.y + Math.sin(a0) * 190, AR.t + 40, AR.b - 40);
        for (let i = 0; i < 16; i++) {
          const a = a0 + (i % 2 ? 1 : -1) * Math.ceil(i / 2) * Math.PI / 8, x = clamp(player.x + Math.cos(a) * 190, AR.l + 40, AR.r - 40), y = clamp(player.y + Math.sin(a) * 190, AR.t + 40, AR.b - 40);
          if (pointFree(x, y, e.r) && lineWide(player.x, player.y, x, y, 14)) { tx = x; ty = y; break; }
        }
        e.molT = { x: tx, y: ty, t: e.seekT };
      }
      ({ x: tx, y: ty } = bodySpot(tx, ty, e.r)); // 바위·벽 옆의 탄이면 몸이 들어가는 가장 가까운 자리에서 솟는다
      const q = Math.hypot(tx - e.x, ty - e.y);
      if (e.seekT > 4 && !pointFree(e.x, e.y, e.r)) { const p = bodySpot(e.x, e.y, e.r); e.x = p.x; e.y = p.y; } // 4초 안에 못 솟으면 가까운 빈자리에서 반드시 솟는다
      if ((q < 10 || e.seekT > 4) && e.seekT > 0.8 && pointFree(e.x, e.y, e.r)) { e.state = 'rumble'; e.t = game.stage === 0 ? 0.91 : 0.7; SFX.warn(); return { x: 0, y: 0 }; }
      const n = norm(tx - e.x, ty - e.y), k = Math.min(1, q / 30);
      return { x: n.x * k, y: n.y * k };
    }
    if (e.state === 'rumble') {
      if (Math.random() < 0.5) particles.push({ x: e.x + rand(-e.r, e.r), y: e.y + rand(-e.r, e.r), vx: rand(-40, 40), vy: rand(-60, -10), life: 0.3, max: 0.3, col: '#a07a48', size: 3 });
      if (e.t <= 0) { // 솟음: 그 자리의 바닥 탄(묻힌 탄도)을 줍는다
        e.under = false; e.state = 'up'; e.upT = 1.5;
        for (const b of bullets) if (e.alive && b.state === 'floor' && b.lockT <= 0 && !(b.burnT > 0) && Math.hypot(b.x - e.x, b.y - e.y) < e.r + BR + 24) enemyTake(e, b); // 덫에 쓰러지면 더 줍지 않음
        for (let i = 0; i < 10; i++) { const a = rand(0, 7), sp = rand(30, 120); particles.push({ x: e.x, y: e.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0.5, max: 0.5, dust: rand(5, 9), col: '#9a7448' }); }
        if (e.alive && e.held.length && player.alive) beginAim(e);
      }
      return { x: 0, y: 0 };
    }
    e.upT -= dt;
    if (e.state === 'aim') {
      e.aimAng = angP + e.aimOff;
      if (e.t <= 0) { if (e.held.length && player.alive) fire(e, e.aimAng, 620); e.state = 'up'; }
    } else if (e.upT <= 0) { e.state = 'under'; e.under = true; e.seekT = 0; e.molT = null; }
    else if (e.held.length && player.alive && e.upT > 0.6) beginAim(e);
    return { x: 0, y: 0 };
  }
  // 모래바람 마녀: 일정 간격(9초, 3단계부터 7초)으로 큰 화살표 예고 1.2초 뒤 바닥 탄을 모두 화살표 방향 벽으로 쓸어 보낸다(플레이어에게서 마녀 쪽으로)
  function witchSweep(e, dt) {
    if (game.sweep) return;
    e.sweepCd -= dt;
    if (e.sweepCd > 0 || !bullets.some((b) => b.state === 'floor')) return;
    const vx = e.x - player.x, vy = e.y - player.y;
    const dir = Math.abs(vx) >= Math.abs(vy) ? { x: Math.sign(vx) || 1, y: 0 } : { x: 0, y: Math.sign(vy) || 1 };
    game.sweep = { t: game.stage === 0 ? 1.56 : 1.2, max: game.stage === 0 ? 1.56 : 1.2, dir };
    e.sweepCd = game.stage >= 3 ? 7 : 9;
    SFX.warn();
  }
  function separate() {
    for (let i = 0; i < enemies.length; i++) for (let j = i + 1; j < enemies.length; j++) {
      const a = enemies[i], b = enemies[j]; if (!a.alive || !b.alive || a.under || b.under || a.fly || b.fly) continue; // 나는 적·땅속 적은 밀지 않음
      const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy), m = a.r + b.r;
      if (d < m && d > 0.01) { const p = (m - d) / 2, nx = dx / d, ny = dy / d; a.x -= nx * p; a.y -= ny * p; b.x += nx * p; b.y += ny * p; collideEnt(a); collideEnt(b); }
    }
  }

  // ===== 개발용 검사: 방 안 탄은 언제나 6발 =====
  let lastWarn = 0;
  function devCheck() {
    const probs = [];
    if (bullets.length !== 6) probs.push('탄 개수 ' + bullets.length);
    let heldSum = player.held.length, free = 0;
    for (const e of enemies) heldSum += e.held.length;
    for (const b of bullets) {
      if (b.state === 'held') {
        const o = b.owner;
        if (!o || !(o === player || (o.alive && enemies.includes(o))) || !o.held.includes(b)) probs.push(b.id + '번 탄 주인 이상');
      } else if (b.state === 'cart') {
        free++;
        if (!b.cart || !game.rails.includes(b.cart) || !b.cart.load.includes(b) || !isFinite(b.x) || !isFinite(b.y)) probs.push(b.id + '번 탄 광차 이상');
      } else if (b.state === 'fly' || b.state === 'floor' || b.state === 'return') {
        free++;
        if (!bulletFree(b.x, b.y, b.ghostObs) || !isFinite(b.x) || !isFinite(b.y)) probs.push(b.id + '번 탄이 벽 안/밖에 있음 (' + b.x.toFixed(1) + ',' + b.y.toFixed(1) + ')');
      } else probs.push(b.id + '번 탄 상태 이상: ' + b.state);
    }
    if (heldSum + free !== 6) probs.push('들고 있는 탄 ' + heldSum + ' + 밖의 탄 ' + free + ' ≠ 6');
    if (probs.length) {
      const n = performance.now();
      if (n - lastWarn > 1000) { lastWarn = n; console.warn('[여섯 발 검사] ' + probs.join(' / ')); }
    }
  }

  // ===== 화면 안내(줍기) =====
  function updateHints(dt) {
    for (const h of game.hitDirs) h.t -= dt;
    game.hitDirs = game.hitDirs.filter((h) => h.t > 0);
    if (!player.alive) return;
    // 줍기: 손에 든 탄이 0발이 되면(1단계 1~3번 방, 판마다 처음 두 번)
    const held = player.held.length;
    if (held === 0 && game.prevHeld > 0 && game.stage <= 1 && game.room <= 3 && game.pickHints < 2) { game.pickHints++; game.pickHint = 5; }
    game.prevHeld = held;
    if (game.pickHint > 0) { game.pickHint -= dt; if (held > 0) game.pickHint = 0; }
    if (game.noAimT > 0) { game.noAimT -= dt; if (tapTarget()) game.noAimT = 0; } // 노릴 적이 생기면 바로 지운다
  }

  // ===== 물결 =====
  function spawnWave() {
    const list = game.waveList[game.wave]; game.wave++; game.waveT = 0;
    game.doors.sort((a, b) => Math.hypot(player.x - b.sx, player.y - b.sy) - Math.hypot(player.x - a.sx, player.y - a.sy));
    const used = {};
    list.forEach((type, i) => {
      const r = ETYPES[type].r;
      let p = null;
      if (game.doors.length) {
        const di = i % game.doors.length, d = game.doors[di], k = used[di] = (used[di] || 0) + 1;
        for (let step = k - 1; step < k + 6 && !p; step++) {
          const x = d.sx + d.ix * step * 42, y = d.sy + d.iy * step * 42;
          if (pointFree(x, y, r + 1) && !enemies.some((e) => Math.hypot(e.x - x, e.y - y) < e.r + r + 4) && Math.hypot(player.x - x, player.y - y) >= 80 + r) p = { x, y };
        }
      }
      if (!p) p = findSpawn(r);
      const e = makeEnemy(type, p.x, p.y); e.inv = 0.5; // 들어오는 순간 0.5초 무적
      enemies.push(e);
    });
  }
  function updateWaves(dt) {
    if (game.wave >= game.waves || game.clearing) return;
    game.waveT += dt;
    if (game.waveWarn > 0) {
      game.waveWarn -= dt;
      if (game.waveWarn <= 0) { game.waveWarn = 0; spawnWave(); }
      return;
    }
    const alive = enemies.filter((e) => e.alive).length;
    if (alive <= 1 || game.waveT >= 15) { game.waveWarn = 1.0; SFX.warn(); } // 1초 전 문이 빨갛게 빛남
  }

  // ===== 갱신 =====
  function updateParticles(dt) {
    for (const p of particles) { p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.92; p.vy *= 0.92; if (p.vr) p.rot += p.vr * dt; }
    particles = particles.filter((p) => p.life > 0);
  }
  const rotateEl = document.getElementById('rotate');
  function isPortraitPhone() { return !!(rotateEl && getComputedStyle(rotateEl).display !== 'none'); }
  function update(rdt) {
    if (game.state === 'play' && !game.paused && isPortraitPhone()) togglePause();
    if (game.paused || document.hidden) return;
    game.clock += rdt;
    if (game.state === 'intro') { if (imgReady) { game.introT += rdt; if (game.introT >= INTRO_SC.reduce((s, x) => s + x, 0)) endIntro(); } return; }
    if (game.state === 'ending') { game.endT += rdt; if (game.endT >= (game.endLong ? END_LONG : END_SHORT).reduce((s, x) => s + x, 0)) endEnding(); return; }
    game.flash = Math.max(0, game.flash - rdt);
    game.shake = Math.max(0, game.shake - rdt * 1.6);
    if (game.state === 'play') {
      if (game.freeze > 0) { game.freeze -= rdt; return; }
      if (game.actT > 0) { game.actT -= rdt; return; } // 막 이름 화면 동안은 멈춤
      game.tick++;
      let ts = 1;
      if (game.slow > 0) { game.slow -= rdt; ts = 0.3; }
      const dt = rdt * ts;
      game.time += rdt; game.roomT += rdt;
      fieldT -= dt; if (fieldT <= 0) { updateFields(); fieldT = 0.15; }
      updatePlayer(dt);
      for (const e of enemies) if (e.alive) updateEnemy(e, dt);
      separate();
      updateBullets(dt);
      if (game.rule.update) game.rule.update(dt);
      updateDyns(dt);
      updateSweep(dt);
      updatePickups(dt);
      updateFires(dt);
      updateHints(dt);
      enemies = enemies.filter((e) => e.alive);
      updateParticles(dt);
      if (game.state === 'play') {
        updateWaves(dt);
        if (!game.clearing && enemies.length === 0 && game.wave >= game.waves && game.waveWarn <= 0) { game.clearing = true; game.clearT = 0.9; SFX.clear(); }
        if (game.clearing) { game.clearT -= rdt; if (game.clearT <= 0) finishRoom(); }
      }
      if (game.state === 'play' || game.state === 'over') devCheck();
    } else if (game.state === 'over') {
      updateParticles(rdt);
      game.overT -= rdt; if (game.overT <= 0) showResult(false);
    }
  }

  // ===== 그리기 =====
  const ui = [];
  function btn(x, y, w, h, fn) { ui.push({ x, y, w, h, fn, scene: sceneKey() }); }
  function txt(s, x, y, size, col, align, weight) {
    ctx.font = (weight || 'bold') + ' ' + size + 'px ' + FONT; ctx.fillStyle = col; ctx.textAlign = align || 'center'; ctx.textBaseline = 'middle'; ctx.fillText(s, x, y);
  }
  function rrect(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
  function glow(x, y, rad, a) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
    g.addColorStop(0, `rgba(255,240,160,${a})`); g.addColorStop(0.4, `rgba(255,205,70,${a * 0.55})`); g.addColorStop(1, 'rgba(255,190,50,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, rad, 0, 7); ctx.fill();
  }
  function shadow(x, y, r) { ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.beginPath(); ctx.ellipse(x + 3, y + r * 0.55, r * 1.1, r * 0.55, 0, 0, 7); ctx.fill(); }
  function circ(x, y, r, fill, stroke, lw) { ctx.beginPath(); ctx.arc(x, y, r, 0, 7); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 2; ctx.stroke(); } }
  function ell(x, y, rx, ry, rot, fill, stroke, lw) { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rot, 0, 7); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 2; ctx.stroke(); } }
  function gunLine(x, y, a, from, to, col, lw) {
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#000'; ctx.lineWidth = lw + 2.5; ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * from, y + Math.sin(a) * from); ctx.lineTo(x + Math.cos(a) * to, y + Math.sin(a) * to); ctx.stroke();
    ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * from, y + Math.sin(a) * from); ctx.lineTo(x + Math.cos(a) * to, y + Math.sin(a) * to); ctx.stroke();
  }
  // 인물: 위에서 본 실루엣(판초·코트 + 모자/두건 + 무기)
  // 인물 그림: 기준점(몸통 무게 중심)을 인물 위치에 두고 조준 각도로 돌린다. 몸 반지름이 r의 1.6배(SPR_K)가 되게 그린다(이동·벽 충돌은 r 그대로, 적이 맞는 거리는 r×1.35).
  function drawChar(kind, x, y, r, a, fl, extra) {
    const s = IMG[kind];
    if (!s) { drawCharCode(kind, x, y, r, a, fl, extra); return; }
    const S = SPR[kind], dk = S.drawK || 1, k = r * SPR_K * dk / S.br, w = s.w * k, h = s.h * k;
    if (kind === 'vulture') shadow(x + 10, y + 18, r * 1.1); else shadow(x, y, r * 1.3); // 나는 독수리는 그림자가 떨어져 있다
    // 종류별 색 빛(그림 뒤): 어두운 바닥에서도 종류가 구별되게, 그림은 가리지 않게
    const hr = r * 2.1 * dk, halo = ctx.createRadialGradient(x, y, r * 0.9, x, y, hr);
    halo.addColorStop(0, RING[kind]); halo.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.save(); ctx.globalAlpha *= dk > 1 ? 0.8 : 0.55; ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(x, y, hr, 0, 7); ctx.fill(); ctx.restore();
    ctx.save(); ctx.translate(x, y); ctx.rotate(a);
    ctx.drawImage(s.img, -S.ax * w, -S.ay * h, w, h);
    if (fl) { ctx.globalAlpha *= 0.85; ctx.drawImage(s.white, -S.ax * w, -S.ay * h, w, h); } // 맞을 때 하얗게
    ctx.restore();
  }
  function drawCharCode(kind, x, y, r, a, fl, extra) {
    shadow(x, y, r);
    const W8 = fl ? '#ffffff' : null, bx = x - Math.cos(a) * 2, by = y - Math.sin(a) * 2;
    if (kind === 'player') {
      gunLine(x, y, a, r * 0.3, r + 12, '#e8e8e8', 4);
      // 판초(크림색) + 청록 테두리 + 줄무늬
      ell(bx, by, r * 1.05, r * 0.95, a, W8 || '#f4e6c4', '#1fc2b3', 3.5);
      ctx.save(); ctx.beginPath(); ctx.ellipse(bx, by, r * 1.05, r * 0.95, a, 0, 7); ctx.clip();
      ctx.strokeStyle = fl ? '#fff' : '#c8603a'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(bx + Math.cos(a + 1.57) * r * 1.2 - Math.cos(a) * r * 0.45, by + Math.sin(a + 1.57) * r * 1.2 - Math.sin(a) * r * 0.45); ctx.lineTo(bx - Math.cos(a + 1.57) * r * 1.2 - Math.cos(a) * r * 0.45, by - Math.sin(a + 1.57) * r * 1.2 - Math.sin(a) * r * 0.45); ctx.stroke();
      ctx.restore();
      ell(x, y, r * 0.56, r * 0.56, 0, W8 || '#9a6a38', '#3a2210', 2);  // 모자 챙
      circ(x, y, r * 0.3, W8 || '#6e4620', '#2a1608', 1.5);              // 모자 꼭대기
    } else if (kind === 'thug') {
      gunLine(x, y, a, r * 0.3, r + 10, '#b0b0b0', 4);
      ell(bx, by, r, r * 0.92, a, W8 || '#6a3a26', '#f0b89a', 2.5);       // 갈색 조끼
      // 빨간 두건: 머리 + 뒤로 묶은 매듭
      const kx = x - Math.cos(a) * r * 0.6, ky = y - Math.sin(a) * r * 0.6;
      ctx.fillStyle = W8 || '#e0302a';
      ctx.beginPath(); ctx.moveTo(kx, ky); ctx.lineTo(kx - Math.cos(a + 0.5) * 9, ky - Math.sin(a + 0.5) * 9); ctx.lineTo(kx - Math.cos(a - 0.5) * 9, ky - Math.sin(a - 0.5) * 9); ctx.closePath(); ctx.fill();
      circ(x, y, r * 0.55, W8 || '#e8342c', '#ffd0c0', 2);
    } else if (kind === 'knife') {
      // 칼: 흰 삼각 날
      const L = extra ? r + 22 : r + 12, s = r * 0.5;
      ctx.fillStyle = '#000'; ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * (L + 2), y + Math.sin(a) * (L + 2)); ctx.lineTo(x + Math.cos(a) * s + Math.cos(a + 1.57) * 6, y + Math.sin(a) * s + Math.sin(a + 1.57) * 6); ctx.lineTo(x + Math.cos(a) * s - Math.cos(a + 1.57) * 6, y + Math.sin(a) * s - Math.sin(a + 1.57) * 6); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#f4f4ff'; ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * L, y + Math.sin(a) * L); ctx.lineTo(x + Math.cos(a) * s + Math.cos(a + 1.57) * 4, y + Math.sin(a) * s + Math.sin(a + 1.57) * 4); ctx.lineTo(x + Math.cos(a) * s - Math.cos(a + 1.57) * 4, y + Math.sin(a) * s - Math.sin(a + 1.57) * 4); ctx.closePath(); ctx.fill();
      ell(bx, by, r, r * 0.92, a, W8 || '#7a3aa0', '#e0b0ff', 2.5);       // 보라 망토
      circ(x, y, r * 0.5, W8 || '#3a1a4a', '#c890ff', 2);                 // 두건
    } else if (kind === 'sniper') {
      gunLine(x, y, a, -r * 0.4, r + 30, '#d0b880', 3.5);                  // 긴 총
      ell(x - Math.cos(a) * r * 0.45, y - Math.sin(a) * r * 0.45, r * 1.3, r * 0.85, a, W8 || '#2f7a46', '#b8f0c0', 2.5); // 긴 코트
      ell(x, y, r * 0.75, r * 0.75, 0, W8 || '#2a3a24', '#9ad0a0', 2);    // 모자 챙
      circ(x, y, r * 0.38, W8 || '#1a2616');
    } else if (kind === 'vulture' || kind === 'mole' || kind === 'witch' || kind === 'miner' || kind === 'sheriff' || kind === 'molly') { // 그림을 못 불러왔을 때
      ell(bx, by, r * 1.1, r * 0.9, a, W8 || RING[kind], '#1a1010', 2.5);
      circ(x + Math.cos(a) * r * 0.6, y + Math.sin(a) * r * 0.6, r * 0.35, W8 || '#2a1a10');
    } else { // 두목
      gunLine(x, y, a - 0.45, r * 0.4, r + 12, '#e8c050', 4.5);
      gunLine(x, y, a + 0.45, r * 0.4, r + 12, '#e8c050', 4.5);
      ell(bx, by, r * 1.05, r * 0.95, a, W8 || '#2a1410', '#ffd060', 3.5);
      for (let i = -1; i <= 1; i++) circ(bx + Math.cos(a) * r * 0.75 + Math.cos(a + 1.57) * i * 6, by + Math.sin(a) * r * 0.75 + Math.sin(a + 1.57) * i * 6, 2.2, '#ffd060');
      ell(x, y, r * 0.85, r * 0.85, 0, W8 || '#140a08', '#ffd060', 2.5);  // 넓은 챙
      circ(x, y, r * 0.45, W8 || '#24120c', '#e8b030', 3);                 // 금띠
    }
  }
  function drawHatParticle(p) {
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.globalAlpha = Math.min(1, p.life / p.max * 1.5);
    ell(0, 0, p.hat, p.hat * 0.8, 0, p.col, '#000', 1.5); circ(0, 0, p.hat * 0.45, p.col, 'rgba(0,0,0,0.6)', 1.5);
    ctx.restore(); ctx.globalAlpha = 1;
  }
  function drawBullet(b, a) {
    const edge = game.rule.bulletEdge; // 밝은 바닥(모래): 빛을 키우고 진한 테두리를 둘러 탄이 여전히 가장 밝게
    ctx.globalCompositeOperation = 'lighter';
    glow(b.x, b.y, (b.state === 'fly' ? 26 : 20) * (edge ? 1.35 : 1), a);
    ctx.globalCompositeOperation = 'source-over';
    if (edge) circ(b.x, b.y, BR + 1.5, null, edge, 2.5);
    if (b.eng) {
      const off = (b.burnT > 0) || (b.eng === 'trap' && (!b.trapArmed || (b.state === 'floor' && b.floorT <= TRAP_ARM))); // 불타는 중(못 주움)·아직 안 켜진 덫·터진 뒤 꺼진 덫
      if (off) ctx.setLineDash([3, 3]);
      circ(b.x, b.y, BR + 3, null, b.burnT > 0 ? '#ff5a1a' : ENG[b.eng].col, 2);
      if (off) ctx.setLineDash([]);
    }
    circ(b.x, b.y, BR, '#ffd84d');
    circ(b.x - 1.2, b.y - 1.2, BR * 0.55, '#ffffff');
  }
  // 땅속 두더지: 흙 자국(움직이는 흙 둔덕). 솟기 예고(0.7초)에는 흙이 들썩이고 주황 고리가 줄어든다.
  function drawMoleDirt(e) {
    const rumble = e.state === 'rumble';
    const j = rumble ? Math.sin(game.clock * 60) * 2 : 0;
    ell(e.x + j, e.y + 4, e.r * 1.25, e.r * 0.8, 0, 'rgba(70,46,22,0.85)', 'rgba(190,150,90,0.6)', 2);
    for (let i = 0; i < 5; i++) { const a = i * 1.26 + e.x * 0.05; circ(e.x + Math.cos(a) * e.r * 0.8 + j, e.y + 4 + Math.sin(a) * e.r * 0.45, 3.5, '#8a6a3c'); }
    if (rumble) {
      const k = Math.max(0, e.t) / 0.7;
      ctx.save(); ctx.setLineDash([6, 5]);
      circ(e.x, e.y, e.r * 1.6 + 18 * k, null, 'rgba(255,150,40,0.95)', 3.5);
      ctx.restore();
      txt('!', e.x, e.y - e.r * 1.6 - 22, 26, '#ffb040');
    }
    if (e.held.length) circ(e.x, e.y + 4, 3, '#ffd84d');
  }
  // 묻힌 탄: 반쯤 묻혀 흐리다(그래도 바닥보다는 밝게)
  function drawBuried(b) {
    ctx.globalCompositeOperation = 'lighter'; glow(b.x, b.y, 13, 0.32); ctx.globalCompositeOperation = 'source-over';
    ell(b.x, b.y + 2, BR + 4, BR * 0.7, 0, 'rgba(120,88,48,0.9)');
    ctx.save(); ctx.beginPath(); ctx.rect(b.x - 10, b.y - 10, 20, 10.5); ctx.clip();
    circ(b.x, b.y, BR, 'rgba(255,216,77,0.75)'); ctx.restore();
    if (b.eng) circ(b.x, b.y, BR + 3, null, ENG[b.eng].col, 1.5);
  }
  // 마녀의 쓸어 보내기 예고: 싸움터를 가로지르는 큰 화살표, 차오르는 막대
  function drawSweep(sw) {
    const k = 1 - Math.max(0, sw.t) / sw.max, cx = (AR.l + AR.r) / 2, cy = (AR.t + AR.b) / 2, a = Math.atan2(sw.dir.y, sw.dir.x);
    const L = sw.dir.x ? 340 : 160, Wd = 70;
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(a);
    ctx.globalAlpha = 0.16 + 0.12 * Math.abs(Math.sin(game.clock * 10)); // 플레이어·탄이 비쳐 보이게 반투명(조각 2-2)
    ctx.fillStyle = '#ff8a2a';
    ctx.beginPath(); ctx.moveTo(-L, -Wd / 2); ctx.lineTo(L - 70, -Wd / 2); ctx.lineTo(L - 70, -Wd * 1.3); ctx.lineTo(L + 30, 0); ctx.lineTo(L - 70, Wd * 1.3); ctx.lineTo(L - 70, Wd / 2); ctx.lineTo(-L, Wd / 2); ctx.closePath(); ctx.fill();
    ctx.globalAlpha = 0.6; ctx.strokeStyle = '#ffd08a'; ctx.lineWidth = 3; ctx.stroke();
    ctx.globalAlpha = 0.4; ctx.fillStyle = '#ffe0a0'; ctx.fillRect(-L, -6, (L * 2 - 70) * k, 12);
    ctx.restore();
  }
  // 광차 레일 예고(레일이 빛나고 가는 쪽 화살표), 다이너마이트 예고(바닥 빨간 원)
  function drawRailWarn(rl) {
    const hz = rl.dir === 'h', k = 1 - Math.max(0, rl.t) / rl.max, pul = 0.5 + 0.5 * Math.abs(Math.sin(game.clock * 14));
    ctx.save();
    ctx.fillStyle = `rgba(255,70,40,${0.16 + 0.16 * pul})`;
    if (hz) ctx.fillRect(AR.l, rl.p - 22, AR.r - AR.l, 44); else ctx.fillRect(rl.p - 22, AR.t, 44, AR.b - AR.t);
    ctx.strokeStyle = `rgba(255,90,60,${0.55 + 0.35 * pul})`; ctx.lineWidth = 2.5; ctx.setLineDash([10, 8]);
    ctx.beginPath();
    if (hz) { ctx.moveTo(AR.l, rl.p - 22); ctx.lineTo(AR.r, rl.p - 22); ctx.moveTo(AR.l, rl.p + 22); ctx.lineTo(AR.r, rl.p + 22); } else { ctx.moveTo(rl.p - 22, AR.t); ctx.lineTo(rl.p - 22, AR.b); ctx.moveTo(rl.p + 22, AR.t); ctx.lineTo(rl.p + 22, AR.b); }
    ctx.stroke(); ctx.setLineDash([]);
    const L = hz ? AR.r - AR.l : AR.b - AR.t, a = hz ? (rl.sgn > 0 ? 0 : Math.PI) : (rl.sgn > 0 ? Math.PI / 2 : -Math.PI / 2);
    for (let i = 0; i < 5; i++) { // 화살표가 들어오는 쪽에서 차오른다
      const f = (i + 0.5) / 5; if (f > k + 0.2) break;
      const s = (rl.sgn > 0 ? f : 1 - f) * L + (hz ? AR.l : AR.t), x = hz ? s : rl.p, y = hz ? rl.p : s;
      ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.fillStyle = 'rgba(255,200,170,0.85)';
      ctx.beginPath(); ctx.moveTo(12, 0); ctx.lineTo(-6, -11); ctx.lineTo(-6, 11); ctx.closePath(); ctx.fill(); ctx.restore();
    }
    ctx.restore();
  }
  function drawCart(rl) { // 달리는 광차: 나무 상자 + 쇠테 + 바퀴, 실린 탄은 위에(가장 밝게)
    const c = cartRect(rl), hz = rl.dir === 'h';
    ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(c.x + 4, c.y + 6, c.w, c.h);
    ctx.fillStyle = '#1a1410';
    for (const [u, v] of [[0.2, -0.08], [0.8, -0.08], [0.2, 1.08], [0.8, 1.08]]) { const x = hz ? c.x + c.w * u : c.x + c.w * (v < 0 ? -0.06 : 1.06), y = hz ? c.y + c.h * (v < 0 ? -0.06 : 1.06) : c.y + c.h * u; circ(x, y, 5, '#2a2420', '#8a8f98', 1.5); }
    rrect(c.x, c.y, c.w, c.h, 5); ctx.fillStyle = '#6a4424'; ctx.fill(); ctx.strokeStyle = '#b8c0c8'; ctx.lineWidth = 3; ctx.stroke();
    rrect(c.x + 6, c.y + 6, c.w - 12, c.h - 12, 3); ctx.fillStyle = '#2a1a0e'; ctx.fill();
    for (const b of rl.load) drawBullet(b, 0.95);
  }
  function drawDyn(d) {
    const k = 1 - Math.max(0, d.t) / d.max, R2 = DYN_R + player.r, pul = 0.5 + 0.5 * Math.abs(Math.sin(game.clock * 12));
    ctx.save();
    ctx.fillStyle = `rgba(255,40,30,${0.14 + 0.14 * pul})`; ctx.beginPath(); ctx.arc(d.x, d.y, R2, 0, 7); ctx.fill();
    circ(d.x, d.y, R2, null, 'rgba(255,60,40,0.95)', 3);
    circ(d.x, d.y, R2 * (1 - k), null, 'rgba(255,170,140,0.8)', 2); // 줄어드는 고리 = 남은 시간
    const f = Math.min(1, k / 0.3), x = d.sx + (d.x - d.sx) * f, y = d.sy + (d.y - d.sy) * f - Math.sin(f * Math.PI) * 40; // 던져서 날아오는 다이너마이트
    ctx.translate(x, y); ctx.rotate(f * 8);
    ctx.fillStyle = '#d02a1a'; ctx.fillRect(-9, -4, 18, 8); ctx.strokeStyle = '#300'; ctx.lineWidth = 1.5; ctx.strokeRect(-9, -4, 18, 8);
    ctx.restore();
  }
  function drawWorld() {
    // 등불
    for (const [lx, ly] of game.lamps) { circ(lx, ly, 7, '#5a3818', '#2a1608', 2); circ(lx, ly, 3.5, '#ffbf60'); }
    for (const rl of game.rails) if (rl.phase === 'warn') drawRailWarn(rl);
    for (const d of dyns) drawDyn(d);
    // 화염
    for (const f of fires) {
      const a = Math.min(1, f.t * 2);
      // 안쪽(채움+실선) = 적이 맞는 범위(몸 가운데가 FIRE_R + 건달 몸 반지름 17 안), 바깥 점선 = 플레이어가 맞는 범위(40 + 플레이어 몸 반지름)(재검수 사소 C)
      const er = FIRE_R + 17, pr = 40 + player.r;
      const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, er);
      g.addColorStop(0, `rgba(255,150,40,${0.55 * a})`); g.addColorStop(1, `rgba(255,80,20,${0.12 * a})`);
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(f.x, f.y, er, 0, 7); ctx.fill();
      circ(f.x, f.y, er, null, `rgba(255,140,40,${0.7 * a})`, 2);
      ctx.save(); ctx.setLineDash([5, 6]); circ(f.x, f.y, pr, null, `rgba(255,120,40,${0.45 * a})`, 1.5); ctx.restore();
    }
    // 다음 물결 예고: 문이 빨갛게 빛남
    if (game.waveWarn > 0) for (const d of game.doors) {
      const g = ctx.createRadialGradient(d.sx, d.sy, 0, d.sx, d.sy, 70);
      g.addColorStop(0, 'rgba(255,40,30,0.75)'); g.addColorStop(1, 'rgba(255,30,20,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(d.sx, d.sy, 70, 0, 7); ctx.fill();
      const vert = d.ix !== 0;
      ctx.strokeStyle = '#ff3a2a'; ctx.lineWidth = 4;
      if (vert) ctx.strokeRect(AR.r + 2, d.y - 24, 26, 48); else ctx.strokeRect(d.x - 24, 2, 48, 30);
    }
    // 적
    for (const e of enemies) {
      if (!e.alive) continue;
      if (e.under) { drawMoleDirt(e); continue; } // 땅속 두더지는 그림 대신 흙 자국만
      if (e.held.length) { // 탄을 쥔 적은 빛남(조준 중엔 더 세게, 깜박이지 않음)
        const strong = e.state === 'aim';
        const g = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, e.r * 2.4);
        g.addColorStop(0, `rgba(255,70,50,${strong ? 0.55 : 0.25})`); g.addColorStop(1, 'rgba(255,40,30,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(e.x, e.y, e.r * 2.4, 0, 7); ctx.fill();
      }
      if (e.inv > 0) ctx.globalAlpha = Math.floor(e.inv * 16) % 2 ? 0.45 : 0.85;
      drawChar(e.type, e.x, e.y, e.r, e.face, e.flash > 0, e.state === 'windup' || e.state === 'dash');
      ctx.globalAlpha = 1;
      if (e.type === 'knife' && e.state === 'windup') {
        ctx.strokeStyle = 'rgba(255,50,40,0.95)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(e.x, e.y, e.r + 12, e.aimAng - 0.9, e.aimAng + 0.9); ctx.stroke();
      }
      if (e.maxHp > 1 && !ETYPES[e.type].boss) for (let i = 0; i < e.maxHp; i++) { ctx.fillStyle = i < e.hp ? '#ff5a4a' : '#3a2a2a'; ctx.fillRect(e.x - 9 + i * 10, e.y - e.r - 10, 8, 4); }
      if (e.type === 'sheriff') { // 방패 쪽(앞 ±60°)을 은빛 호로 보인다
        ctx.strokeStyle = 'rgba(220,235,255,0.75)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(e.x, e.y, e.r * HIT_K + 9, e.face - SHIELD_A, e.face + SHIELD_A); ctx.stroke();
      }
      if (e.type === 'molly') { // 광차에 모인 탄 수(금빛 점)와 맞힌 횟수
        const c = mollyCart(e);
        e.held.forEach((b, i) => { const a = i * 2.4; ctx.globalCompositeOperation = 'lighter'; glow(c.x + Math.cos(a) * 7, c.y + Math.sin(a) * 5, 12, 0.6); ctx.globalCompositeOperation = 'source-over'; circ(c.x + Math.cos(a) * 7, c.y + Math.sin(a) * 5, 3.5, '#ffd84d'); });
        // 실린 탄 수 칸(조각 3-2): 3칸(3발 넘으면 그만큼). 찬 칸 = 금빛 탄, 3발이 차면 테두리가 빨갛게 깜박 = 곧 일제 사격
        const n = e.held.length, slots = Math.max(3, n), full = n >= 3, pulse = full && Math.floor(game.clock * 6) % 2 === 0, dy0 = c.y >= e.y ? 1 : -1, dy = (c.y + dy0 * 46 > AR.b - 4 || c.y + dy0 * 46 < AR.t + 4) ? -dy0 : dy0; // 몰리 몸 반대쪽(광차 위나 아래)에. 벽 쪽이라 싸움터 밖으로 나가면 반대쪽에 그린다(재검수 사소 A)
        for (let i = 0; i < slots; i++) { const sx = c.x + (i - (slots - 1) / 2) * 13, sy = c.y + dy * 27; circ(sx, sy, 5.5, i < n ? '#ffd84d' : 'rgba(20,12,6,0.75)', full ? (pulse ? '#ff3a2a' : '#7a1a10') : i < n ? '#1a0e06' : 'rgba(255,230,180,0.55)', full ? 2.5 : 1.5); }
        if (n) for (let i = 0; i < 3; i++) circ(c.x - 10 + i * 10, c.y + dy * 40, 3.5, i < e.cartHits ? '#ff5a4a' : 'rgba(255,255,255,0.35)', '#1a0e06', 1);
      } else if (e.held.length) circ(e.x + Math.cos(e.face) * (e.r - 3), e.y + Math.sin(e.face) * (e.r - 3), 3.5, '#ffd84d');
    }
    // 플레이어
    if (player.alive) {
      const blink = player.inv > 0 && Math.floor(player.inv * 20) % 2 === 0;
      ctx.globalAlpha = blink ? 0.35 : 1;
      const rk = player.recoil * 30;
      drawChar(HEROES[game.hero].spr, player.x - Math.cos(player.aim) * rk, player.y - Math.sin(player.aim) * rk, player.r, player.aim, false);
      ctx.globalAlpha = 1;
      const drag = aimT.active && Math.hypot(aimT.x - aimT.ox, aimT.y - aimT.oy) >= 15; // 발사 버튼을 끄는 중: 조준선을 길고 뚜렷하게
      const al = drag ? 160 : 50;
      ctx.strokeStyle = drag ? 'rgba(255,240,200,0.85)' : 'rgba(255,240,200,0.35)'; ctx.lineWidth = drag ? 2.5 : 1.5; ctx.setLineDash([4, 6]);
      ctx.beginPath(); ctx.moveTo(player.x + Math.cos(player.aim) * 24, player.y + Math.sin(player.aim) * 24); ctx.lineTo(player.x + Math.cos(player.aim) * al, player.y + Math.sin(player.aim) * al); ctx.stroke();
      ctx.setLineDash([]);
    }
    // 바닥 탄: 인물 그림 밑에 숨지 않게 인물 뒤에 그린다
    for (const b of bullets) if (b.state === 'floor' || b.state === 'return') {
      if (b.buried) { drawBuried(b); continue; }
      drawBullet(b, 0.6 + 0.35 * Math.sin(game.clock * 3 + b.blink));
    }
    for (const rl of game.rails) if (rl.phase === 'run') drawCart(rl);
    if (game.sweep) drawSweep(game.sweep);
    // 예고선: 빨강, 깜박이지 않음, 굵고 빛남, 첫 엄폐물에서 끊김
    ctx.lineCap = 'round';
    for (const e of enemies) {
      if (!e.alive) continue;
      let lines = [];
      if (e.state === 'aim') {
        const max = e.type === 'sniper' ? 1100 : 300;
        const n = e.held.length, angs = e.type === 'molly' ? Array.from({ length: n }, (_, i) => e.aimAng + (i - (n - 1) / 2) * MOLLY_SPREAD) : ETYPES[e.type].boss && n >= 3 ? [e.aimAng - 0.26, e.aimAng, e.aimAng + 0.26] : [e.aimAng];
        lines = angs.map((a) => [a, rayLen(e.x, e.y, a, max)]);
      } else if (e.type === 'knife' && e.state === 'windup') lines = [[e.aimAng, rayLen(e.x, e.y, e.aimAng, 120)]];
      for (const [a, len] of lines) {
        const x1 = e.x + Math.cos(a) * e.r, y1 = e.y + Math.sin(a) * e.r, x2 = e.x + Math.cos(a) * len, y2 = e.y + Math.sin(a) * len;
        if (len <= e.r) continue;
        ctx.strokeStyle = 'rgba(255,40,30,0.28)'; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
        ctx.strokeStyle = 'rgba(255,70,55,0.95)'; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      }
    }
    // 날아가는 탄 (꼬리 + 가장 밝게)
    for (const b of bullets) {
      if (b.state !== 'fly') continue;
      const t = b.trail;
      if (t.length >= 4) {
        ctx.strokeStyle = 'rgba(255,215,90,0.6)'; ctx.lineWidth = 3; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(t[0], t[1]); for (let i = 2; i < t.length; i += 2) ctx.lineTo(t[i], t[i + 1]); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
      drawBullet(b, 1);
    }
    // 파편
    for (const p of particles) {
      const a = Math.max(0, p.life / p.max);
      if (p.hat) { drawHatParticle(p); continue; }
      if (p.rope) { // 올가미 줄: 짐에서 탄이 있던 자리까지
        ctx.globalAlpha = a; ctx.strokeStyle = '#d8b070'; ctx.lineWidth = 3; ctx.setLineDash([7, 4]);
        ctx.beginPath(); ctx.moveTo(player.x, player.y); ctx.lineTo(p.x, p.y); ctx.stroke(); ctx.setLineDash([]);
        circ(p.x, p.y, 10 * (1.4 - a * 0.4), null, '#d8b070', 2.5); ctx.globalAlpha = 1; continue;
      }
      if (p.text) { ctx.globalAlpha = Math.min(1, a * 1.5); txt(p.text, p.x, p.y, 20, p.col); ctx.globalAlpha = 1; continue; }
      if (p.ring) { ctx.strokeStyle = p.col; ctx.globalAlpha = a; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(p.x, p.y, p.ring * (1 - a * 0.6), 0, 7); ctx.stroke(); ctx.globalAlpha = 1; continue; }
      if (p.dust) { ctx.globalAlpha = a * 0.45; circ(p.x, p.y, p.dust * (1.6 - a * 0.6), p.col); ctx.globalAlpha = 1; continue; }
      if (p.flash) { ctx.globalCompositeOperation = 'lighter'; glow(p.x, p.y, p.flash * 1.8, a); ctx.globalCompositeOperation = 'source-over'; continue; }
      ctx.globalAlpha = a; ctx.fillStyle = p.col; ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size); ctx.globalAlpha = 1;
    }
  }
  function drawHints() {
    if (game.state !== 'play' || !player.alive) return;
    if (game.pickHint > 0) {
      let nb = null, nd = 1e9;
      for (const b of bullets) if (b.state === 'floor' || b.state === 'return') { const d = Math.hypot(b.x - player.x, b.y - player.y); if (d < nd) { nd = d; nb = b; } }
      if (nb) {
        // 상자는 늘 탄 바로 옆(위→아래→왼쪽→오른쪽 순)에 붙인다. 플레이어를 덮지 않고 싸움터 안에 드는 첫 자리를 쓴다.
        const BW = 68, BH = 28, G = 18, PR = player.r * SPR_K + 6;
        // 후보 자리를 싸움터 안으로 당긴 뒤, 탄과 플레이어를 덮지 않는 첫 자리를 고른다
        const cands = [[0, -1], [0, 1], [-1, 0], [1, 0]].map(([ux, uy]) => ({ ux, uy,
          cx: clamp(nb.x + ux * (BW / 2 + G), AR.l + BW / 2, AR.r - BW / 2), cy: clamp(nb.y + uy * (BH / 2 + G), AR.t + BH / 2, AR.b - BH / 2) }));
        const gap = (c, x, y) => Math.hypot(x - clamp(x, c.cx - BW / 2, c.cx + BW / 2), y - clamp(y, c.cy - BH / 2, c.cy + BH / 2));
        const ok = (c) => gap(c, nb.x, nb.y) > 12 && gap(c, player.x, player.y) > PR && (!game.usedTouch || (gap(c, FB.x, FB.y) > FB.r + 4 && (game.hero !== 'jim' || gap(c, LB.x, LB.y) > LB.r + 4) && !(c.cx + BW / 2 > PB.x - 4 && c.cy - BH / 2 < PB.y + PB.h + 4))); // 터치 판: 발사·올가미 버튼·멈춤 단추도 피함
        const pick = cands.find(ok) || cands.find(c => gap(c, nb.x, nb.y) > 12) || cands[0];
        const bob = Math.sin(game.clock * 6) * 3;
        const cx = clamp(pick.cx + pick.ux * bob, AR.l + BW / 2, AR.r - BW / 2), cy = clamp(pick.cy + pick.uy * bob, AR.t + BH / 2, AR.b - BH / 2);
        rrect(cx - BW / 2, cy - BH / 2, BW, BH, 8); ctx.fillStyle = 'rgba(20,12,8,0.85)'; ctx.fill();
        txt('줍기!', cx, cy, 20, '#ffe14d');
        // 화살표: 상자의 탄 쪽 가장자리에서 탄을 향해
        const bx = cx - pick.ux * BW / 2, by = cy - pick.uy * BH / 2, tx = nb.x + pick.ux * 7, ty = nb.y + pick.uy * 7;
        const px = -pick.uy * 8, py = pick.ux * 8;
        ctx.fillStyle = '#ffe14d'; ctx.beginPath(); ctx.moveTo(bx + px, by + py); ctx.lineTo(bx - px, by - py); ctx.lineTo(tx, ty); ctx.closePath(); ctx.fill();
      }
    }
    // 어디서 맞았나: 화면 가장자리 빨간 쐐기
    for (const h of game.hitDirs) {
      const c = Math.cos(h.a), s = Math.sin(h.a);
      const tx = c > 0 ? (W - 14 - player.x) / c : c < 0 ? (14 - player.x) / c : 1e9;
      const ty = s > 0 ? (AR.b - 10 - player.y) / s : s < 0 ? (14 - player.y) / s : 1e9;
      const t = Math.min(tx, ty), x = player.x + c * t, y = player.y + s * t;
      ctx.globalAlpha = Math.min(1, h.t / 0.5);
      ctx.fillStyle = '#ff2a20'; ctx.beginPath();
      ctx.moveTo(x - c * 34, y - s * 34);
      ctx.lineTo(x - s * 22, y + c * 22); ctx.lineTo(x + s * 22, y - c * 22); ctx.closePath(); ctx.fill();
      ctx.globalAlpha = 1;
    }
  }
  function heart(x, y, s, full) {
    ctx.fillStyle = full ? '#e8433a' : '#3a2524';
    ctx.beginPath(); ctx.moveTo(x, y + s * 0.35);
    ctx.bezierCurveTo(x - s, y - s * 0.4, x - s * 0.4, y - s, x, y - s * 0.35);
    ctx.bezierCurveTo(x + s * 0.4, y - s, x + s, y - s * 0.4, x, y + s * 0.35);
    ctx.fill();
  }
  function drawHUD() {
    ctx.fillStyle = '#160e0b'; ctx.fillRect(0, AR.b + 3, W, H - AR.b - 3);
    for (let i = 0; i < player.maxHp; i++) heart(42 + i * 42, 504, 17, i < player.hp);
    // 탄창 6칸 (글자 18px 이상)
    const sw = 72, gap = 7, x0 = W / 2 - (sw * 6 + gap * 5) / 2, y0 = 469, sh = 68;
    const showMag = game.state === 'play' || game.state === 'over';
    for (let i = 0; i < 6 && showMag; i++) {
      const b = bullets[i], x = x0 + i * (sw + gap);
      const mine = b.state === 'held' && b.owner === player;
      const next = mine && (player.held[0] === b || (game.hero === 'rosa' && player.held[1] === b)) && game.state === 'play'; // 로사는 한 번에 나갈 두 칸(조각 3-2)
      if (mine) { const g = ctx.createLinearGradient(0, y0, 0, y0 + sh); g.addColorStop(0, '#5e4518'); g.addColorStop(1, '#3e2c10'); ctx.fillStyle = g; }
      else ctx.fillStyle = '#241a14';
      rrect(x, y0, sw, sh, 8); ctx.fill();
      ctx.lineWidth = next ? 3 : 1.5; ctx.strokeStyle = next ? '#f6e6b8' : mine ? '#8a6a30' : '#4a3a2c'; rrect(x, y0, sw, sh, 8); ctx.stroke();
      txt(String(b.id), x + (b.eng ? sw / 2 - 8 : sw / 2), y0 + 22, 28, mine ? '#fff0c8' : '#7a6a58');
      let lab = '';
      if (!mine) lab = b.state === 'held' ? '적 손' : b.state === 'fly' ? '날아감' : b.state === 'return' ? '돌아옴' : b.state === 'cart' ? '광차' : '바닥';
      else if (b.eng) lab = ENG[b.eng].name;
      if (lab) txt(lab, x + sw / 2, y0 + 51, 18, !mine && b.state === 'held' ? '#ff7a6a' : mine ? '#ffe8b0' : '#c9b8a0');
      if (b.eng) { const E = ENG[b.eng]; circ(x + sw - 15, y0 + 21, 12, E.col); txt(E.sym, x + sw - 15, y0 + 22, 18, '#1a1010'); }
      if (next) { ctx.fillStyle = '#f6e6b8'; ctx.beginPath(); ctx.moveTo(x + sw / 2 - 9, y0 - 12); ctx.lineTo(x + sw / 2 + 9, y0 - 12); ctx.lineTo(x + sw / 2, y0 - 2); ctx.closePath(); ctx.fill(); }
    }
    // 오른쪽 아래 글은 탄창 6번 칸(오른쪽 끝 713.5) 오른쪽에만: 단계·물결 줄과 바닥 이름 줄을 나눈다(조각 2-2 검수)
    txt(game.act + '막 · ' + (isBossRoom(game.room) ? game.room + '번 방 · 두목' : game.room + '번 방/' + LAST_ROOM), W - 24, 482, 20, '#f0d9b0', 'right');
    const l2 = [game.stage === 0 ? '입문' : stageName(game.stage)];
    if (!isBossRoom(game.room)) l2.push('물결 ' + Math.min(game.wave, game.waves) + '/' + game.waves);
    txt(l2.join(' · '), W - 24, 506, 18, game.waveWarn > 0 ? '#ff7a6a' : '#c9b8a0', 'right');
    if (game.rule.label) txt(game.rule.label, W - 24, 528, 18, game.rule.hudCol || '#c9b8a0', 'right');
    if (game.rule.drawTop && (game.state === 'play' || game.state === 'over')) game.rule.drawTop();
    const boss = enemies.find((e) => ETYPES[e.type].boss && e.alive);
    if (boss) {
      // 이름(위)·체력 막대(아래)는 왼쪽 위 146~300: 바람 표시(135까지)와 위쪽 첫 문(336부터)·그 빛 사이라 물결 예고를 가리지 않는다(조각 3-2)
      txt(ETYPES[boss.type].name, 146, 12, 18, '#f0d9b0', 'left');
      ctx.fillStyle = '#2a1a14'; ctx.fillRect(146, 24, 154, 7);
      ctx.fillStyle = '#d4af37'; ctx.fillRect(146, 24, 154 * boss.hp / boss.maxHp, 7);
    }
    // 위쪽 벽 띠(싸움터 밖) 글자: 「노릴 적 없음」 > 1번 방 첫 5초 터치 조작 안내 > 1번 방 규칙 한 줄. 안내는 싸움터 위에 그리지 않는다.
    if (game.state === 'play' && game.noAimT > 0) txt('노릴 적 없음', boss ? 668 : W / 2, 17, 18, '#ff9a8a'); // 두목 방: 가운데 문(584까지)과 오른쪽 문(736부터) 사이
    else if (game.state === 'play' && game.room === 1) {
      if (game.touchRun && game.roomT < 5 && !game.paused) txt('왼쪽 끌기: 이동 · 발사 톡: 가까운 적 자동 조준 · 끌었다 놓기: 직접 조준', W / 2, 17, 18, '#ffe14d');
      else txt('총알은 여섯 발뿐. 빗나간 총알은 누구나 줍는다.', W / 2, 17, 18, '#ffe9b8');
    }
    if (game.hero === 'jim' && (game.state === 'play' || game.state === 'over')) { // 올가미 준비 표시(하트 줄 위: 화면 맨 아래에 붙지 않게, 탄창·하트와 안 겹침, 조각 3-2)
      const rd = player.lassoCd < 0.05; // 0.05초 아래는 「준비」(「올가미 0.0초」가 나오지 않게)
      txt(rd ? '올가미 준비' : '올가미 ' + player.lassoCd.toFixed(1) + '초', 24, 477, 18, game.lassoFail > 0 ? '#ff8a7a' : rd ? '#e8c890' : '#8a7a68', 'left');
    }
    if (game.usedTouch && game.state === 'play') {
      drawFireButton();
      if (game.hero === 'jim') drawLassoButton();
      rrect(PB.x, PB.y, PB.w, PB.h, 10); ctx.fillStyle = 'rgba(40,24,12,0.75)'; ctx.fill(); ctx.strokeStyle = 'rgba(255,230,180,0.6)'; ctx.lineWidth = 1.5; ctx.stroke();
      txt('멈춤', PB.x + PB.w / 2, PB.y + PB.h / 2, 22, '#fff2d8');
      if (stick.active) { // 반투명
        circ(stick.ox, stick.oy, 50, 'rgba(255,255,255,0.06)', 'rgba(255,255,255,0.3)', 2);
        const dx = stick.x - stick.ox, dy = stick.y - stick.oy, d = Math.hypot(dx, dy), k = d > 50 ? 50 / d : 1;
        circ(stick.ox + dx * k, stick.oy + dy * k, 20, 'rgba(255,255,255,0.25)');
      }
    }
  }
  // 발사 버튼(12.7): 반투명. 노릴 적이 없으면 흐리게, 있으면 톡 고리 색(노랑). 끄는 동안 손잡이가 끈 쪽으로 움직인다.
  function drawFireButton() {
    const live = player.alive && player.held.length > 0 && !game.clearing && !!tapTarget();
    ctx.save(); ctx.globalAlpha = live || aimT.active ? 1 : 0.45;
    circ(FB.x, FB.y, FB.r, live ? 'rgba(255,225,77,0.14)' : 'rgba(255,255,255,0.05)', live ? 'rgba(255,225,77,0.85)' : 'rgba(255,255,255,0.35)', live ? 3 : 2);
    let kx = FB.x, ky = FB.y;
    if (aimT.active) { const dx = aimT.x - aimT.ox, dy = aimT.y - aimT.oy, d = Math.hypot(dx, dy), k = d > FB.r * 0.6 ? FB.r * 0.6 / d : 1; kx += dx * k; ky += dy * k; }
    circ(kx, ky, 26, aimT.active ? 'rgba(255,240,200,0.3)' : 'rgba(255,255,255,0.1)', null);
    txt('발사', kx, ky, 20, live ? '#fff2c0' : 'rgba(255,242,216,0.8)');
    ctx.restore();
  }
  function drawLassoButton() { // 작은 올가미 단추: 대기 중이면 흐리고 남은 시간만큼 어두운 부채꼴
    const rd = player.lassoCd < 0.05 && player.alive;
    ctx.save(); ctx.globalAlpha = rd ? 1 : 0.55;
    circ(LB.x, LB.y, LB.r, rd ? 'rgba(216,176,112,0.18)' : 'rgba(255,255,255,0.05)', game.lassoFail > 0 ? 'rgba(255,120,100,0.9)' : rd ? 'rgba(216,176,112,0.9)' : 'rgba(255,255,255,0.35)', 2.5);
    if (!rd) { // 남은 대기 부채꼴: 어두운 채움 + 밝은 테두리(어두운 바닥에서도 보이게, 조각 3-2)
      ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.beginPath(); ctx.moveTo(LB.x, LB.y); ctx.arc(LB.x, LB.y, LB.r - 2, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * player.lassoCd / LASSO_CD); ctx.closePath(); ctx.fill();
      ctx.globalAlpha = 1; ctx.strokeStyle = 'rgba(255,226,160,0.95)'; ctx.lineWidth = 2; ctx.stroke();
      ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(LB.x, LB.y, LB.r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * player.lassoCd / LASSO_CD); ctx.stroke(); ctx.globalAlpha = 0.55;
    }
    txt('올가미', LB.x, LB.y, 18, rd ? '#fff2c0' : 'rgba(255,242,216,0.8)');
    ctx.restore();
  }
  // 스틱 고리나 발사 버튼이 플레이어와 겹치면 플레이어 테두리 실루엣을 맨 위에 덧그린다
  function drawStickSilhouette() {
    if (!player.alive || game.state !== 'play' || game.paused) return;
    const pr = player.r * SPR_K;
    const nearStick = stick.active && Math.hypot(stick.ox - player.x, stick.oy - player.y) < 50 + pr;
    const nearFire = game.usedTouch && (Math.hypot(FB.x - player.x, FB.y - player.y) < FB.r + pr || (game.hero === 'jim' && Math.hypot(LB.x - player.x, LB.y - player.y) < LB.r + pr));
    if (!nearStick && !nearFire) return;
    ctx.save(); ctx.lineCap = 'round';
    for (const [col, lw] of [['rgba(0,0,0,0.7)', 5], ['#1fc2b3', 2.5]]) {
      ctx.strokeStyle = col; ctx.lineWidth = lw;
      ctx.beginPath(); ctx.arc(player.x, player.y, pr, 0, 7); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(player.x + Math.cos(player.aim) * pr, player.y + Math.sin(player.aim) * pr); ctx.lineTo(player.x + Math.cos(player.aim) * (pr + 12), player.y + Math.sin(player.aim) * (pr + 12)); ctx.stroke();
    }
    ctx.restore();
  }
  // 톡 조준 고리: 손에 탄이 있으면 지금 톡 하면 노릴 적에게 작은 고리(끄는 동안은 숨김)
  function drawTapRing() {
    if (!game.usedTouch || game.state !== 'play' || game.paused || !player.alive || !player.held.length || game.clearing) return;
    if (aimT.active && Math.hypot(aimT.x - aimT.ox, aimT.y - aimT.oy) >= 15) return; // 끄는 동안은 숨김
    const t = tapTarget(); if (!t) return;
    const rr = t.r * SPR_K + 5;
    ctx.save();
    for (const [col, lw] of [['rgba(0,0,0,0.6)', 4], ['#ffe14d', 2]]) {
      ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.beginPath(); ctx.arc(t.x, t.y, rr, 0, 7); ctx.stroke();
      ctx.beginPath();
      for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + Math.PI / 4; ctx.moveTo(t.x + Math.cos(a) * (rr - 4), t.y + Math.sin(a) * (rr - 4)); ctx.lineTo(t.x + Math.cos(a) * (rr + 5), t.y + Math.sin(a) * (rr + 5)); }
      ctx.stroke();
    }
    ctx.restore();
  }
  // 위쪽 벽 띠 왼쪽: 바람 화살표(모래 바닥)
  function drawWind() {
    if (!game.wind) return;
    const x = 120, y = 17, a = game.wind.a;
    txt('바람', x - 46, y, 18, '#e8c98a');
    ctx.save(); ctx.translate(x, y); ctx.rotate(a);
    ctx.strokeStyle = '#ffe0a0'; ctx.fillStyle = '#ffe0a0'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    const o = (game.clock * 10) % 6;
    ctx.beginPath(); ctx.moveTo(-14 + o * 0.3, 0); ctx.lineTo(8, 0); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(15, 0); ctx.lineTo(4, -7); ctx.lineTo(4, 7); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  // 막 이름 화면(1.5초): 「2막 · 모래 협곡」
  function drawActTitle() {
    const k = game.actT / 1.5, a = Math.min(1, k * 4, (1 - k) * 6 + 0.2);
    ctx.save(); ctx.globalAlpha = Math.min(1, a);
    overlay(0.55);
    rrect(W / 2 - 260, H / 2 - 80, 520, 130, 16); ctx.fillStyle = 'rgba(30,18,8,0.88)'; ctx.fill(); ctx.strokeStyle = '#e8b060'; ctx.lineWidth = 3; ctx.stroke();
    txt(game.act + '막 · ' + game.region.name, W / 2, H / 2 - 30, 50, '#ffd34d');
    txt('두목: ' + ETYPES[game.region.boss].name, W / 2, H / 2 + 22, 22, '#f0d9b0', 'center', 'normal');
    ctx.restore();
  }
  function overlay(a) { ctx.fillStyle = `rgba(8,5,8,${a})`; ctx.fillRect(0, 0, W, H); }
  // ----- 인트로(12.11): 8~10초, 장면 4개. 처음 한 번만 저절로, 누르면 바로 건너뛴다 -----
  const INTRO_SC = [2.4, 2.8, 2.2, 2.2]; // 장면별 길이(합 9.6초)
  const sceneAt = (t, list) => { let s = 0; for (let i = 0; i < list.length; i++) { if (t < s + list[i]) return { i, k: (t - s) / list[i], lt: t - s }; s += list[i]; } return null; };
  function fadeK(sc, len) { return Math.min(1, sc.lt / 0.35, (len - sc.lt) / 0.35); }
  function keyartBack(dim, zoom) {
    ctx.fillStyle = '#0b0709'; ctx.fillRect(0, 0, W, H);
    const im = IMG.keyart; if (!im) return;
    const k = Math.max(W / im.width, H / im.height) * (zoom || 1), iw = im.width * k, ih = im.height * k;
    ctx.drawImage(im, (W - iw) / 2, (H - ih) / 2, iw, ih); overlay(dim);
  }
  function drawSprUp(key, x, y, size, rot) { // 위에서 본 인물 그림을 위쪽을 보게(초상화처럼) 그린다
    const s = IMG[key], S = SPR[key]; if (!s) { circ(x, y, size * 0.5, RING[key] || '#888'); return; }
    const k = size / S.br * 0.5, w = s.w * k, h = s.h * k;
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot == null ? -Math.PI / 2 : rot); ctx.drawImage(s.img, -S.ax * w, -S.ay * h, w, h); ctx.restore();
  }
  const POSTERS = [{ key: 'boss', name: '여섯손가락 잭', pay: '현상금 500' }, { key: 'witch', name: '모래바람 마녀', pay: '현상금 1,000' }, { key: 'molly', name: '광산왕 몰리', pay: '현상금 2,000' }];
  function drawPoster(cx, cy, p, rot, stampK) { // 현상금 전단(종이 틀은 코드로). stampK > 0 이면 「잡음」 도장
    const w = 210, h = 290;
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot);
    ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(-w / 2 + 8, -h / 2 + 10, w, h);
    rrect(-w / 2, -h / 2, w, h, 4); ctx.fillStyle = '#e6d0a0'; ctx.fill(); ctx.strokeStyle = '#7a5430'; ctx.lineWidth = 3; ctx.stroke();
    ctx.strokeStyle = 'rgba(90,56,24,0.6)'; ctx.lineWidth = 1.5; ctx.strokeRect(-w / 2 + 8, -h / 2 + 8, w - 16, h - 16);
    txt('현상수배', 0, -h / 2 + 32, 30, '#4a2410');
    ctx.fillStyle = '#cdb27e'; ctx.fillRect(-w / 2 + 20, -h / 2 + 56, w - 40, 138);
    ctx.save(); ctx.beginPath(); ctx.rect(-w / 2 + 20, -h / 2 + 56, w - 40, 138); ctx.clip(); drawSprUp(p.key, 0, -h / 2 + 126, 105); ctx.restore();
    txt(p.name, 0, h / 2 - 66, 22, '#3a1a08');
    txt(p.pay, 0, h / 2 - 34, 20, '#6a3a10', 'center', 'normal');
    if (stampK > 0) {
      const sk = 1 + 1.4 * Math.max(0, 1 - stampK * 3), a = Math.min(1, stampK * 3);
      ctx.save(); ctx.globalAlpha *= a; ctx.rotate(-0.32); ctx.scale(sk, sk);
      ctx.strokeStyle = '#c8201a'; ctx.lineWidth = 6; rrect(-72, -34, 144, 68, 10); ctx.stroke();
      txt('잡음', 0, 2, 44, '#c8201a');
      ctx.restore();
    }
    ctx.restore();
  }
  function drawSkipHint() { txt('누르면 건너뛰기', W - 16, H - 16, 18, 'rgba(240,217,176,0.7)', 'right', 'normal'); }
  function drawIntro() {
    const t = game.introT, sc = sceneAt(t, INTRO_SC);
    if (!sc) return;
    const a = fadeK(sc, INTRO_SC[sc.i]);
    if (sc.i === 0) { // 대표 그림 + 첫 문장
      keyartBack(0.35 + 0.25 * (1 - a), 1.06 - 0.06 * sc.k);
      ctx.save(); ctx.globalAlpha = a; txt('세상에 남은 총알은 여섯 발뿐.', W / 2, H - 92, 36, '#ffe9b8'); ctx.restore();
    } else if (sc.i === 1) { // 세 두목의 현상금 전단
      keyartBack(0.8);
      ctx.save(); ctx.globalAlpha = a;
      POSTERS.forEach((p, i) => { const d = Math.max(0, Math.min(1, (sc.lt - i * 0.35) / 0.4)); if (d > 0) drawPoster(W / 2 + (i - 1) * 270, H / 2 + 6 + (1 - d) * 60, p, (i - 1) * 0.05, 0); });
      ctx.restore();
    } else if (sc.i === 2) { // 빗나간 한 발 → 적의 탄약
      ctx.fillStyle = '#100a0c'; ctx.fillRect(0, 0, W, H);
      ctx.save(); ctx.globalAlpha = a;
      const bx = W / 2 - 20, by = 250, got = sc.k >= 0.45, jx = got ? bx + 70 : W / 2 + 300 - (230 - 70) * (sc.k / 0.45) - 70 * (sc.k / 0.45), jy = 250; // 잭이 걸어와 바닥 탄을 줍고, 빨간 예고선을 겨눈다
      const tx = got ? jx - 34 : bx, ty = got ? jy + 4 : by;
      if (got) { ctx.strokeStyle = 'rgba(255,60,45,0.35)'; ctx.lineWidth = 12; ctx.beginPath(); ctx.moveTo(jx - 40, jy); ctx.lineTo(90, jy + 40); ctx.stroke(); ctx.strokeStyle = 'rgba(255,70,55,0.95)'; ctx.lineWidth = 4; ctx.stroke(); }
      drawSprUp('boss', jx, jy, 120, got ? Math.PI + 0.2 : Math.PI);
      ctx.globalCompositeOperation = 'lighter'; glow(tx, ty, 40, 0.8 + 0.2 * Math.sin(game.clock * 6)); ctx.globalCompositeOperation = 'source-over';
      circ(tx, ty, 7, '#ffd84d'); circ(tx - 2, ty - 2, 3.5, '#ffffff');
      txt('빗나간 한 발은 적의 탄약이 된다.', W / 2, H - 110, 36, '#ffe9b8');
      ctx.restore();
    } else { // 제목
      keyartBack(0.62);
      ctx.save(); ctx.globalAlpha = a;
      txt('여섯 발', W / 2, H / 2 - 30, 96, '#ffd34d');
      for (let i = 0; i < 6; i++) { const on = sc.lt > 0.2 + i * 0.18; if (on) { ctx.globalCompositeOperation = 'lighter'; glow(W / 2 - 125 + i * 50, H / 2 + 70, 24, 0.8); ctx.globalCompositeOperation = 'source-over'; } circ(W / 2 - 125 + i * 50, H / 2 + 70, 8, on ? '#ffd34d' : '#4a3a28'); }
      ctx.restore();
    }
    drawSkipHint();
  }
  // ----- 엔딩(12.11): 도장 → 해 질 녘 사막으로 걷는 주인공 → 문구 (처음 깼으면 + 칭호). 누르면 건너뛴다 -----
  const END_LONG = [2.0, 2.4, 2.0, 1.6], END_SHORT = [1.6, 2.4, 2.0]; // 처음 8.0초, 다음부터 6.0초. 「다음 현상금이 기다린다…」 장면 2.0초(다 보이는 시간 1.3초, 조각 3-2)
  const END_X = 0.4; // 도장 장면 → 해 질 녘 장면 교차 페이드(검은 화면을 거치지 않음, 조각 3-2)
  function drawSunset(k) {
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#2a1440'); g.addColorStop(0.45, '#c8582a'); g.addColorStop(0.62, '#ffb04a'); g.addColorStop(0.63, '#5a2a14'); g.addColorStop(1, '#2a140a');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter'; const sg = ctx.createRadialGradient(W / 2, 330, 10, W / 2, 330, 160); sg.addColorStop(0, 'rgba(255,220,140,0.55)'); sg.addColorStop(1, 'rgba(255,140,60,0)'); ctx.fillStyle = sg; ctx.fillRect(0, 100, W, 440); ctx.globalCompositeOperation = 'source-over'; // 해 둘레 빛을 덜 꽉 차게(걷는 사람 대비, 조각 3-2)
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, 340); ctx.clip(); circ(W / 2, 340, 70, '#ffe0a0'); ctx.restore();
    ctx.fillStyle = '#3a1a0c'; ctx.beginPath(); ctx.moveTo(0, 360); for (let x = 0; x <= W; x += 40) ctx.lineTo(x, 352 + Math.sin(x * 0.012) * 10); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#24100a'; ctx.beginPath(); ctx.moveTo(0, 430); for (let x = 0; x <= W; x += 40) ctx.lineTo(x, 420 + Math.sin(x * 0.008 + 1) * 16); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fill();
    // 주인공: 해를 향해 걸어간다(점점 작게, 흔들리며). 뒤로 긴 그림자
    const x = 150 + (W / 2 - 150) * k, y = 470 - 120 * k, sz = 120 * (1 - 0.55 * k), bob = Math.sin(game.clock * 10) * 3;
    ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.beginPath(); ctx.ellipse(x - sz * 0.9, y + sz * 0.25, sz * 1.2, sz * 0.12, -0.08, 0, 7); ctx.fill();
    drawWalker(x, y + bob, sz / 120, game.hero, game.clock * 7);
  }
  function drawWalker(x, y, s, hero, ph) { // 해를 등진 옆모습 실루엣(코드 그림): 모자·몸·걷는 다리 + 주인공 표시(판초 자락·로사 쌍권총과 붉은 목도리·짐 올가미)
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.shadowColor = 'rgba(255,176,96,0.9)'; ctx.shadowBlur = 9; // 둘레 빛: 어두운 땅 위에서도 실루엣이 보이게(조각 3-2)
    const C = '#1a0c06', l = Math.sin(ph) * 14;
    ctx.strokeStyle = C; ctx.lineCap = 'round'; ctx.lineWidth = 9;
    ctx.beginPath(); ctx.moveTo(0, -40); ctx.lineTo(l, 0); ctx.moveTo(0, -40); ctx.lineTo(-l, 0); ctx.stroke(); // 다리
    ctx.fillStyle = C;
    if (hero === 'pancho') { ctx.beginPath(); ctx.moveTo(-6, -92); ctx.lineTo(26, -36); ctx.lineTo(-30, -36); ctx.closePath(); ctx.fill(); } // 판초 자락
    else { rrect(-13, -90, 26, 54, 8); ctx.fill(); }
    circ(0, -102, 12, C);                                                     // 머리
    ctx.beginPath(); ctx.ellipse(0, -110, 26, 5, 0, 0, 7); ctx.fill();          // 모자 챙
    rrect(-12, -128, 24, 20, 6); ctx.fill();                                    // 모자 꼭대기
    if (hero === 'rosa') {
      ctx.strokeStyle = C; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(10, -60); ctx.lineTo(26, -46); ctx.moveTo(-10, -60); ctx.lineTo(-24, -46); ctx.stroke(); // 쌍권총
      ctx.fillStyle = '#a8201a'; ctx.beginPath(); ctx.moveTo(-6, -90); ctx.lineTo(-30, -84 + Math.sin(ph * 0.7) * 4); ctx.lineTo(-8, -82); ctx.closePath(); ctx.fill(); // 붉은 목도리
    } else if (hero === 'jim') { ctx.strokeStyle = '#f0c878'; ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(16, -54, 9, 13, 0.3, 0, 7); ctx.stroke(); } // 올가미 고리(밝은 밧줄색, 조각 3-2)
    ctx.restore();
  }
  function drawEnding() {
    const list = game.endLong ? END_LONG : END_SHORT, sc = sceneAt(game.endT, list);
    if (!sc) return;
    const a = fadeK(sc, list[sc.i]);
    const posters = (lt, al) => { // 세 전단에 「잡음」 도장이 차례로(al = 전체 투명도)
      ctx.save(); ctx.globalAlpha = al; keyartBack(0.8);
      ctx.globalAlpha = al * Math.min(1, lt / 0.3);
      const step = list[0] / 3.6;
      POSTERS.forEach((p, i) => drawPoster(W / 2 + (i - 1) * 270, H / 2 + 6, p, (i - 1) * 0.05, Math.max(0, (lt - 0.3 - i * step) / step)));
      ctx.restore();
    };
    if (sc.i === 0) posters(sc.lt, 1);
    else if (sc.i === 1) { drawSunset(sc.k); if (sc.lt < END_X) posters(list[0], 1 - sc.lt / END_X); } // 도장 장면 위에서 해 질 녘으로 교차 페이드
    else if (sc.i === 2) { drawSunset(1); overlay(0.45 * Math.min(1, sc.lt / 0.35)); ctx.save(); ctx.globalAlpha = a; txt('다음 현상금이 기다린다…', W / 2, H / 2 - 20, 40, '#ffe9b8'); ctx.restore(); } // 덮개는 남기고 글만 사라짐
    else { // 처음 깼을 때: 칭호(덮개 0.45 → 0.6으로 이어짐)
      drawSunset(1); overlay(0.45 + 0.15 * Math.min(1, sc.lt / 0.35));
      ctx.save(); ctx.globalAlpha = a;
      const s = 0.8 + 0.2 * Math.min(1, sc.lt / 0.4);
      ctx.translate(W / 2, H / 2); ctx.scale(s, s);
      ctx.globalCompositeOperation = 'lighter'; glow(0, -10, 200, 0.5); ctx.globalCompositeOperation = 'source-over';
      rrect(-250, -80, 500, 150, 18); ctx.fillStyle = 'rgba(40,24,10,0.92)'; ctx.fill(); ctx.strokeStyle = '#ffd34d'; ctx.lineWidth = 4; ctx.stroke();
      txt('칭호를 얻었다', 0, -40, 22, '#f0d9b0', 'center', 'normal');
      txt('★ 현상금 사냥꾼 ★', 0, 14, 44, '#ffd34d');
      ctx.restore();
    }
    drawSkipHint();
  }
  function endEnding() { if (game.state === 'ending') setScene('result'); }
  function startEndingTest() { // ?ending=1: 바로 엔딩(기록은 저장하지 않음)
    game.test = true; newRun(1, LAST_ROOM); enemies = [];
    game.run.roomTimes = []; showResult(true);
  }
  function startIntro() { game.introT = 0; setScene('intro'); game.lockUntil = 0; }
  function endIntro() { saveIntroSeen(); setScene('title'); game.lockUntil = performance.now() + 500; } // 인트로 연타가 주인공 고르기까지 넘어가지 않게 0.5초(조각 3-2)
  function drawButton(x, y, w, h, label, fn, col) {
    rrect(x, y, w, h, 10); ctx.fillStyle = col || '#d9a21f'; ctx.fill();
    ctx.strokeStyle = '#fff0b0'; ctx.lineWidth = 2; ctx.stroke();
    txt(label, x + w / 2, y + h / 2, 22, '#2a1606');
    btn(x, y, w, h, fn);
  }
  function startSelected() { if (imgReady) { enterFS(); newRun(game.selStage, 1); } } // 그림을 다 불러온 뒤에 시작
  function openHeroPick() { if (imgReady) { game.heroSel = HERO_KEYS.indexOf(game.hero); setScene('hero'); } } // 단계를 고르면 주인공 고르기로
  function pickHero(k) { game.hero = k; game.heroSel = HERO_KEYS.indexOf(k); saveHero(k); startSelected(); }
  // 주인공 고르기(12.11): 그림·이름·한 줄 설명. 마지막에 고른 주인공이 밝게 표시된다
  function drawHeroPick() {
    drawTitleBack();
    txt('주인공 고르기', W / 2, 62, 40, '#ffd34d');
    txt('현상금 ' + stageName(game.selStage) + ' · 누르면 바로 시작', W / 2, 104, 20, '#f0d9b0', 'center', 'normal');
    const cw = 260, ch = 290, gap = 30, x0 = W / 2 - (cw * 3 + gap * 2) / 2, y0 = 132;
    HERO_KEYS.forEach((k, i) => {
      const H0 = HEROES[k], x = x0 + i * (cw + gap), sel = i === game.heroSel;
      rrect(x, y0, cw, ch, 14); ctx.fillStyle = sel ? 'rgba(70,46,20,0.95)' : 'rgba(34,22,14,0.92)'; ctx.fill();
      ctx.strokeStyle = sel ? '#ffe9a0' : '#7a5a34'; ctx.lineWidth = sel ? 4 : 2; ctx.stroke();
      const s = IMG[H0.spr], S = SPR[H0.spr];
      if (s) { const k2 = 120 / S.br, w = s.w * k2 * 0.48, h = s.h * k2 * 0.48; ctx.save(); ctx.translate(x + cw / 2, y0 + 104); ctx.rotate(-Math.PI / 2); ctx.drawImage(s.img, -S.ax * w, -S.ay * h, w, h); ctx.restore(); }
      else drawCharCode('player', x + cw / 2, y0 + 92, 30, -Math.PI / 2, false);
      txt(H0.name, x + cw / 2, y0 + 186, 26, '#fff2d8');
      txt(H0.desc[0], x + cw / 2, y0 + 224, 18, '#d9c8b0', 'center', 'normal');
      txt(H0.desc[1], x + cw / 2, y0 + 250, 18, '#d9c8b0', 'center', 'normal');
      btn(x, y0, cw, ch, () => pickHero(k));
    });
    txt(game.usedTouch ? '짐의 올가미: 발사 버튼 위 작은 「올가미」 버튼' : '짐의 올가미: 오른쪽 클릭 또는 Space · ←/→ 고르고 Enter로 시작', W / 2, 452, 18, '#c9b8a0', 'center', 'normal');
    drawButton(W / 2 - 90, 476, 180, 48, '뒤로', () => setScene('title'), '#a08050');
  }
  function drawTitleBack() {
    if (IMG.keyart) { // 대표 그림을 꽉 차게 깔고, 글이 읽히게 어둡게 덮는다
      const im = IMG.keyart, k = Math.max(W / im.width, H / im.height), iw = im.width * k, ih = im.height * k;
      ctx.drawImage(im, (W - iw) / 2, (H - ih) / 2, iw, ih);
      const d = ctx.createLinearGradient(0, 0, 0, H); d.addColorStop(0, 'rgba(8,5,8,0.35)'); d.addColorStop(0.45, 'rgba(8,5,8,0.62)'); d.addColorStop(1, 'rgba(8,5,8,0.72)');
      ctx.fillStyle = d; ctx.fillRect(0, 0, W, H);
    } else { const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#1a1030'); g.addColorStop(1, '#2a160c'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
  }
  function drawTitle() {
    drawTitleBack();
    ctx.globalCompositeOperation = 'lighter'; for (let i = 0; i < 6; i++) glow(W / 2 - 125 + i * 50, 232, 24, 0.6 + 0.3 * Math.sin(game.clock * 3 + i)); ctx.globalCompositeOperation = 'source-over';
    for (let i = 0; i < 6; i++) circ(W / 2 - 125 + i * 50, 232, 7, '#ffd34d');
    txt('여섯 발', W / 2, 100, 80, '#ffd34d');
    { // 개발판 표시: 제목 오른쪽 위 둥근 띠
      const tw = ctx.measureText('여섯 발').width;
      ctx.font = 'bold 18px ' + FONT; const bw2 = ctx.measureText('개발판').width + 22, bx = W / 2 + tw / 2 + 8, by = 52;
      rrect(bx, by, bw2, 28, 14); ctx.fillStyle = 'rgba(30,18,8,0.85)'; ctx.fill(); ctx.strokeStyle = '#d9a21f'; ctx.lineWidth = 2; ctx.stroke();
      txt('개발판', bx + bw2 / 2, by + 14, 18, '#ffd34d');
    }
    txt('세상에 총알은 여섯 발뿐. 빗나간 한 발은 적의 탄약이 된다.', W / 2, 168, 20, '#f0d9b0', 'center', 'normal');
    txt('아직 만들고 있는 게임이에요. 그림·난이도·내용이 바뀔 수 있어요.', W / 2, 195, 18, '#bfae94', 'center', 'normal');
    // 현상금 단계 고르기
    const bw = 140, bh = 72, gap = 12, x0 = W / 2 - (bw * 6 + gap * 5) / 2, y0 = 270;
    for (let s = 0; s <= 5; s++) { // 0단계(입문)는 늘 열려 있음
      const x = x0 + s * (bw + gap), open = s <= game.best.unlocked, sel = s === game.selStage;
      rrect(x, y0, bw, bh, 10); ctx.fillStyle = open ? (sel ? '#d9a21f' : '#7a5a24') : '#2a2420'; ctx.fill();
      ctx.strokeStyle = sel ? '#fff0b0' : '#4a3a2c'; ctx.lineWidth = sel ? 3 : 1.5; ctx.stroke();
      txt('현상금 ' + s + '단계', x + bw / 2, y0 + 24, 20, open ? '#2a1606' : '#6a5a4a');
      const bt = game.best.stageTimes[s];
      txt(open ? (bt ? '최단 ' + fmtTime(bt) : s === 0 ? '입문 · 체력 5' : '도전!') : '잠김', x + bw / 2, y0 + 52, 18, open ? '#3a2208' : '#6a5a4a', 'center', 'normal');
      if (open) btn(x, y0, bw, bh, () => { game.selStage = s; openHeroPick(); });
    }
    txt('WASD 이동 · 마우스 조준 · 왼쪽 클릭 쏘기 · Esc 멈춤 · M 음악', W / 2, 372, 18, '#c9b8a0', 'center', 'normal');
    txt('터치: 왼쪽 끌기 이동 · 오른쪽 아래 발사 버튼 톡 자동 조준 · 끌었다 놓기 직접 조준', W / 2, 398, 18, '#c9b8a0', 'center', 'normal');
    txt(imgReady ? '단계를 누르거나 ←/→로 고르고 Enter → 주인공 고르기' : '불러오는 중…', W / 2, 452, 22, `rgba(255,240,200,${0.8 + 0.2 * Math.sin(game.clock * 4)})`);
    const rec = ['주인공: ' + HEROES[game.hero].name];
    if (game.best.hunter) rec.push('칭호: 현상금 사냥꾼');
    if (game.best.room) rec.push('최고 기록: ' + game.best.room + '번 방');
    if (rec.length) txt(rec.join(' · '), W / 2, 424, 18, '#d8c090', 'center', 'normal');
    drawButton(30, 478, 200, 44, '인트로 다시 보기', () => startIntro(), '#a08050');
    drawButton(244, 478, 150, 44, '기록 보기', () => setScene('records'), '#a08050');
    if (FS_OK) drawButton(W - 230, 478, 200, 44, isFS() ? '전체 화면 끄기' : '전체 화면 켜기', () => toggleFS(), '#a08050');
  }
  function drawRecords() { // 주인공별·단계별 최고 기록(12.11)
    drawTitleBack(); overlay(0.35);
    txt('주인공별 최고 기록', W / 2, 60, 36, '#ffd34d');
    const x0 = 60, cw = 108, top = 120, rh = 92, cxOf = (s) => 256 + s * cw + cw / 2;
    for (let s = 0; s <= 5; s++) txt(s === 0 ? '입문' : s + '단계', cxOf(s), top, 20, '#f0d9b0');
    HERO_KEYS.forEach((h, i) => {
      const y = top + 40 + i * rh, hb = game.best.heroBest[h] || {};
      rrect(x0 - 10, y - 6, W - 2 * x0 + 20, rh - 12, 10); ctx.fillStyle = 'rgba(30,18,10,0.85)'; ctx.fill();
      drawSprUp(HEROES[h].spr, x0 + 34, y + 34, 44);
      txt(HEROES[h].name, x0 + 70, y + 34, 22, '#fff2d8', 'left');
      for (let s = 0; s <= 5; s++) {
        const r = hb[s], cx = cxOf(s);
        txt(r && r.room ? r.room + '번 방' : '-', cx, y + 22, 20, r && r.room ? '#ffe9b8' : '#6a5a4a');
        if (r && r.time) txt('깸 ' + fmtTime(r.time), cx, y + 50, 18, '#ffd34d', 'center', 'normal');
      }
    });
    txt('방 = 가장 멀리 간 방 · 깸 = 끝까지 깬 가장 짧은 시간', W / 2, 432, 18, '#c9b8a0', 'center', 'normal');
    drawButton(W / 2 - 90, 470, 180, 48, '뒤로', () => setScene('title'), '#a08050');
  }
  function drawSteps(step) {
    rrect(W / 2 - 200, 26, 400, 36, 10); ctx.fillStyle = 'rgba(20,12,8,0.9)'; ctx.fill();
    txt('① 각인 고르기', W / 2 - 100, 44, 20, step === 1 ? '#ffd34d' : '#7a6a58');
    txt('→', W / 2, 44, 20, '#c9b8a0');
    txt('② 새길 탄 고르기', W / 2 + 100, 44, 20, step === 2 ? '#ffd34d' : '#7a6a58');
  }
  function drawCards() {
    overlay(0.72);
    drawSteps(1);
    txt('방 정리! 각인을 하나 고르세요', W / 2, 90, 30, '#ffd34d');
    const cw = 220, ch = 230, gap = 30, x0 = W / 2 - (cw * 3 + gap * 2) / 2, y0 = 150;
    game.cards.forEach((k, i) => {
      const E = ENG[k], x = x0 + i * (cw + gap);
      rrect(x, y0, cw, ch, 14); ctx.fillStyle = '#2a1c14'; ctx.fill(); ctx.strokeStyle = E.col; ctx.lineWidth = 3; ctx.stroke();
      circ(x + cw / 2, y0 + 60, 34, E.col);
      txt(E.sym, x + cw / 2, y0 + 61, 34, '#1a1010');
      txt(E.name, x + cw / 2, y0 + 122, 26, '#fff2d8');
      txt(E.desc[0], x + cw / 2, y0 + 163, 18, '#d9c8b0', 'center', 'normal');
      txt(E.desc[1], x + cw / 2, y0 + 190, 18, '#d9c8b0', 'center', 'normal');
      btn(x, y0, cw, ch, () => { game.chosen = k; setScene('pickBullet'); });
    });
  }
  function drawPickBullet() {
    overlay(0.72);
    drawSteps(2);
    const E = ENG[game.chosen];
    txt('「' + E.name + '」 각인을 새길 총알 번호를 고르세요', W / 2, 120, 26, '#ffd34d');
    txt('이미 각인이 있으면 새 각인으로 바뀝니다', W / 2, 160, 18, '#c9b8a0', 'center', 'normal');
    const bw = 104, gap = 10, x0 = W / 2 - (bw * 6 + gap * 5) / 2, y0 = 220;
    bullets.forEach((b, i) => {
      const x = x0 + i * (bw + gap);
      rrect(x, y0, bw, 110, 12); ctx.fillStyle = '#e8b83a'; ctx.fill(); ctx.strokeStyle = '#fff0b0'; ctx.lineWidth = 2; ctx.stroke();
      txt(String(b.id), x + bw / 2, y0 + 40, 38, '#2a1606');
      txt(b.eng ? ENG[b.eng].sym + ENG[b.eng].name : '없음', x + bw / 2, y0 + 86, 18, b.eng ? '#4a1a08' : '#6a4a20');
      btn(x, y0, bw, 110, () => {
        b.eng = game.chosen;
        game.run.engravings.push({ room: game.room, eng: ENG[game.chosen].name, bullet: b.id });
        startRoom(game.room + 1);
      });
    });
  }
  function drawResult() {
    overlay(0.8);
    txt(game.won ? REGIONS[ACTS[ACTS.length - 1].region].winText : '쓰러졌다…', W / 2, 90, 40, game.won ? '#ffd34d' : '#ff7a6a');
    txt('현상금 ' + stageName(game.stage) + ' · 도달한 방: ' + game.room + '번 방', W / 2, 160, 22, '#f0d9b0', 'center', 'normal');
    txt('주인공: ' + HEROES[game.run.hero || game.hero].name + ' · 쓰러뜨린 적: ' + game.kills + ' · 걸린 시간: ' + fmtTime(game.time), W / 2, 196, 22, '#f0d9b0', 'center', 'normal');
    const ty = game.won ? 32 : 0; // 이긴 판: 「가장 많이 쓴 각인」 줄을 더하고 아래 줄을 내린다
    if (game.won) { const te = topEng(game.run); txt('가장 많이 쓴 각인: ' + (te ? te.name + '(' + te.n + '발)' : '없음'), W / 2, 230, 20, '#ffd9a0', 'center', 'normal'); }
    const bt = game.best.stageTimes[game.stage];
    let line = game.stage === 0 ? '입문 최고 기록: ' + game.best.introRoom + '번 방' + (bt ? ' · 입문 최단 ' + fmtTime(bt) : '')
      : '최고 기록: ' + game.best.room + '번 방' + (bt ? ' · ' + stageName(game.stage) + ' 최단 ' + fmtTime(bt) : '');
    if (game.test) line = '시험 시작 판이라 기록을 저장하지 않습니다';
    else if (game.newBest) line += '  (새 기록!)';
    txt(line, W / 2, 236 + ty, 18, '#c9b8a0', 'center', 'normal');
    if (!game.won && game.lastHit) txt('마지막 한 방: ' + game.lastHit, W / 2, 360, 20, '#ff9a8a');
    game.unlockMsg.forEach((m, i) => txt(m, W / 2, 278 + ty + i * 30, 20, '#ffe14d'));
    drawButton(W / 2 - 200, 400, 180, 60, '다시', () => newRun(game.stage, 1));
    drawButton(W / 2 + 20, 400, 180, 60, '제목으로', () => setScene('title'), '#a08050');
    if (!game.usedTouch) txt('Enter·Space: 다시', W / 2, 490, 18, '#a89880', 'center', 'normal'); // 터치로 한 판에는 키보드 안내를 숨긴다
  }
  const quitArmed = () => (game.quitArm || 0) > performance.now(); // 「제목으로」 두 번 누르기 대기(실제 시각, 멈춤 중에도 흐름)
  function drawPause() {
    overlay(0.25);
    const ph = 160 + (game.usedTouch ? 24 : 0) + (MUTE ? 24 : 0) + 58 + (quitArmed() ? 26 : 0); // 맨 아래 줄: 전체 화면·제목으로
    rrect(W / 2 - 290, 40, 580, ph, 14); ctx.fillStyle = 'rgba(20,12,8,0.8)'; ctx.fill(); ctx.strokeStyle = 'rgba(255,220,150,0.5)'; ctx.lineWidth = 2; ctx.stroke();
    txt('멈춤', W / 2, 72, 36, '#ffd34d');
    drawButton(W / 2 - 200, 96, 180, 56, '계속', () => togglePause());
    drawButton(W / 2 + 20, 96, 180, 56, music.on ? '음악 끄기' : '음악 켜기', () => toggleMusic(), '#a08050');
    txt(game.usedTouch ? '왼쪽 끌기: 이동 · 발사 버튼 톡: 가까운 적 자동 조준' : 'Esc: 계속 · M: 음악 켜기/끄기', W / 2, 180, 18, '#f0d9b0', 'center', 'normal');
    if (game.usedTouch) txt('발사 버튼을 끌었다 놓기: 직접 겨눠 쏘기', W / 2, 204, 18, '#f0d9b0', 'center', 'normal');
    if (MUTE) txt('소리 꺼진 주소로 열었습니다', W / 2, game.usedTouch ? 226 : 204, 18, '#c9b8a0', 'center', 'normal');
    // 맨 아래 줄: 전체 화면(지원할 때) + 제목으로. 실수로 판을 잃지 않게 2초 안에 두 번 눌러야 나간다(사용자 지적 10-20)
    const by = 40 + ph - 62 - (quitArmed() ? 26 : 0);
    if (FS_OK) drawButton(W / 2 - 230, by, 220, 46, isFS() ? '전체 화면 끄기' : '전체 화면 켜기', () => toggleFS(), '#a08050');
    drawButton(FS_OK ? W / 2 + 10 : W / 2 - 110, by, 220, 46, quitArmed() ? '정말 제목으로' : '제목으로', () => {
      if (quitArmed()) { game.quitArm = 0; game.paused = false; setScene('title'); } else game.quitArm = performance.now() + 2000;
    }, quitArmed() ? '#c0503a' : '#a08050');
    if (quitArmed()) txt('한 번 더 누르면 이 판을 그만두고 제목으로 가요', W / 2, by + 64, 18, '#ffb0a0', 'center', 'normal');
  }
  function draw() {
    ctx.setTransform(dpr * scale, 0, 0, dpr * scale, 0, 0);
    ui.length = 0;
    if (game.state === 'intro') { drawIntro(); return; }
    if (game.state === 'ending') { drawEnding(); return; }
    if (game.state === 'title') { drawTitle(); return; }
    if (game.state === 'hero') { drawHeroPick(); return; }
    if (game.state === 'records') { drawRecords(); return; }
    ctx.save();
    if (game.shake > 0) { const s = game.shake * 14; ctx.translate(rand(-s, s), rand(-s, s)); }
    ctx.drawImage(floorCanvas, 0, 0, W, H);
    drawWorld();
    drawTapRing();
    ctx.restore();
    drawHUD();
    drawHints();
    drawStickSilhouette();
    if (game.flash > 0) { ctx.fillStyle = `rgba(255,40,30,${game.flash * 0.8})`; ctx.fillRect(0, 0, W, H); }
    if (game.state === 'play' && game.clearing) txt('방 정리!', W / 2, H / 2 - 40, 48, '#ffd34d');
    if (game.state === 'play' && game.actT > 0) drawActTitle();
    if (game.paused) drawPause();
    else if (game.state === 'cards') drawCards();
    else if (game.state === 'pickBullet') drawPickBullet();
    else if (game.state === 'result') drawResult();
  }

  // ===== 입력 (문서 전체에서 받음) =====
  // 캔버스 기준 좌표(범위 밖이면 가장자리 값). 끄는 거리는 자르지 않은 값(rx, ry)으로 잰다.
  function toLogical(e) {
    const r = cv.getBoundingClientRect();
    const rx = (e.clientX - r.left) / r.width * W, ry = (e.clientY - r.top) / r.height * H;
    return { x: clamp(rx, 0, W), y: clamp(ry, 0, H), rx, ry };
  }
  function uiClick(p) {
    if (locked()) return;
    const key = sceneKey();
    for (let i = ui.length - 1; i >= 0; i--) {
      const b = ui[i];
      if (b.scene !== key) continue; // 지금 화면의 단추만
      if (p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h) { b.fn(); return; }
    }
  }
  function togglePause() {
    game.quitArm = 0;
    if (game.state !== 'play' && !game.paused) return;
    game.paused = !game.paused;
    game.lockUntil = game.paused ? performance.now() + LOCK_MS : 0; // 멈출 때만 잠금. 풀 때는 바로 쏠 수 있음
    if (game.paused) { for (const k in keys) keys[k] = false; stick.active = false; aimT.active = false; }
  }
  window.addEventListener('keydown', (e) => {
    if (isPortraitPhone()) return; // 세로 안내가 떠 있으면 모든 입력 무시
    initAudio();
    if (game.state === 'intro') { if (!e.repeat) endIntro(); return; }
    if (game.state === 'ending') { if (!e.repeat && !locked()) endEnding(); return; }
    if (game.state === 'title' && !game.paused && (e.code === 'ArrowLeft' || e.code === 'ArrowRight')) {
      e.preventDefault();
      game.selStage = clamp(game.selStage + (e.code === 'ArrowLeft' ? -1 : 1), 0, game.best.unlocked);
      return;
    }
    if (game.state === 'hero' && (e.code === 'ArrowLeft' || e.code === 'ArrowRight')) { e.preventDefault(); game.heroSel = clamp(game.heroSel + (e.code === 'ArrowLeft' ? -1 : 1), 0, HERO_KEYS.length - 1); return; }
    if ((game.state === 'hero' || game.state === 'records') && e.code === 'Escape') { setScene('title'); return; }
    if (e.code === 'Escape') { togglePause(); return; }
    if (e.code === 'KeyM') { toggleMusic(); return; }
    if (e.code === 'KeyF') { if (!e.repeat) toggleFS(); return; }
    if (e.code === 'Enter' || e.code === 'Space') {
      e.preventDefault();
      if (e.repeat) return;
      if (game.paused) return;
      if (game.state === 'play') { playerLasso(); return; } // 놀이 중 Space = 짐의 올가미(다른 주인공은 아무 일도 없음)
      if (locked()) return;
      if (game.state === 'title') openHeroPick();
      else if (game.state === 'hero') pickHero(HERO_KEYS[game.heroSel]);
      else if (game.state === 'result') newRun(game.stage, 1);
      return;
    }
    keys[e.code] = true;
    if (e.code.startsWith('Arrow')) e.preventDefault();
  });
  window.addEventListener('keyup', (e) => { keys[e.code] = false; });
  window.addEventListener('blur', () => { for (const k in keys) keys[k] = false; });
  document.addEventListener('visibilitychange', () => { if (document.hidden && game.state === 'play' && !game.paused) togglePause(); });
  document.addEventListener('contextmenu', (e) => e.preventDefault());
  window.addEventListener('pointerdown', (e) => {
    if (e.cancelable) e.preventDefault();
    if (isPortraitPhone()) return; // 세로 안내가 떠 있으면 모든 입력 무시
    initAudio();
    const p = toLogical(e);
    if (e.pointerType !== 'mouse') game.usedTouch = true;
    if (game.state === 'intro') { endIntro(); return; }
    if (game.state === 'ending') { if (!locked()) endEnding(); return; }
    if (game.state !== 'play' || game.paused) { uiClick(p); return; }
    if (locked()) return;
    if (e.pointerType === 'mouse') {
      mouse.x = p.x; mouse.y = p.y; aimMode = 'mouse';
      player.aim = Math.atan2(mouse.y - player.y, mouse.x - player.x); // 누른 그 자리로 바로 겨눔(지난 프레임 방향으로 나가지 않게)
      if (game.usedTouch && p.x >= PB.x && p.y <= PB.y + PB.h) { togglePause(); return; }
      if (e.button === 0) playerShoot(); else if (e.button === 2) playerLasso(); // 오른쪽 클릭 = 짐의 올가미
      return;
    }
    aimMode = 'touch';
    if (p.x >= PB.x - 6 && p.y <= PB.y + PB.h + 6) { togglePause(); return; }
    if (game.hero === 'jim' && Math.hypot(p.x - LB.x, p.y - LB.y) < LB_HIT) { playerLasso(); return; }
    if (Math.hypot(p.x - FB.x, p.y - FB.y) < FB_HIT) { // 발사 버튼: 톡 = 자동 조준, 끌기 = 직접 조준(놓을 때 쏨)
      if (!aimT.active) aimT = { active: true, id: e.pointerId, ox: p.rx, oy: p.ry, x: p.rx, y: p.ry };
      return;
    }
    if (p.x < W / 2) { // 스틱 고리 중심은 캔버스 가장자리에서 고리 반지름(50)만큼 안쪽
      if (!stick.active) {
        let sx = p.x, sy = p.y; const pdx = sx - player.x, pdy = sy - player.y, pd = Math.hypot(pdx, pdy);
        if (pd < STICK_PUSH) { const ux = pd > 0.5 ? pdx / pd : -1, uy = pd > 0.5 ? pdy / pd : 0; sx = player.x + ux * STICK_PUSH; sy = player.y + uy * STICK_PUSH; } // 플레이어와 110 안이면 반대쪽으로 밀어냄
        const ox = clamp(sx, 50, W - 50), oy = clamp(sy, 50, H - 50); stick = { active: true, id: e.pointerId, ox, oy, x: ox, y: oy, rox: p.rx, roy: p.ry }; }
    }
    // 버튼 밖의 오른쪽 터치는 아무 일도 하지 않는다(12.7)
  }, { passive: false });
  window.addEventListener('pointermove', (e) => {
    if (isPortraitPhone()) return;
    const p = toLogical(e);
    if (e.pointerType === 'mouse') { mouse.x = p.x; mouse.y = p.y; aimMode = 'mouse'; return; }
    if (stick.active && e.pointerId === stick.id) { stick.x = stick.ox + (p.rx - stick.rox); stick.y = stick.oy + (p.ry - stick.roy); }
    if (aimT.active && e.pointerId === aimT.id) {
      aimT.x = p.rx; aimT.y = p.ry;
      const dx = p.rx - aimT.ox, dy = p.ry - aimT.oy;
      if (Math.hypot(dx, dy) >= 15) player.aim = assistAim(Math.atan2(dy, dx));
    }
  });
  function endPointer(e, cancel) {
    if (e.pointerType === 'mouse') return;
    if (stick.active && e.pointerId === stick.id) stick.active = false;
    if (aimT.active && e.pointerId === aimT.id) {
      aimT.active = false;
      const dx = aimT.x - aimT.ox, dy = aimT.y - aimT.oy;
      if (cancel) return;
      if (Math.hypot(dx, dy) < 15) { // 톡(15px 미만): 자동 조준. 맞힐 적이 없으면 쏘지 않음
        const t = tapTarget();
        if (t && player.held.length) { player.aim = Math.atan2(t.y - player.y, t.x - player.x) + (TAPR() * 2 - 1) * TAP_JIT; playerShoot(); } // 흔들림은 씨앗 난수
        else if (!t && player.held.length && game.state === 'play' && !game.paused) game.noAimT = 1; // 안 쏘고 「노릴 적 없음」을 1초
        return;
      }
      player.aim = assistAim(Math.atan2(dy, dx)); // 끌었다 놓기: 직접 조준 + ±8° 보정
      playerShoot();
    }
  }
  window.addEventListener('pointerup', (e) => endPointer(e, false));
  window.addEventListener('pointercancel', (e) => endPointer(e, true));

  // ===== 검수용 노출 =====
  function ownerName(b) {
    const o = b.owner;
    if (b.state === 'cart') return 'cart';
    if (b.state === 'floor' || !o) return null;
    if (o === player) return 'player';
    return o.type + '#' + enemies.indexOf(o);
  }
  window.__game = {
    get room() { return game.room; },
    get stage() { return game.stage; },
    get wave() { return game.wave; },
    get waves() { return game.waves; },
    get state() { return game.paused ? 'paused' : game.state; },
    get introT() { return Math.round((game.introT || 0) * 100) / 100; },
    get endT() { return Math.round((game.endT || 0) * 100) / 100; },
    get endLong() { return !!game.endLong; },
    get best() { return JSON.parse(JSON.stringify(game.best)); },
    get hp() { return player.hp; },
    get hero() { return game.hero; },
    get lassoCd() { return Math.round(player.lassoCd * 100) / 100; },
    get player() { return { x: Math.round(player.x), y: Math.round(player.y), hp: player.hp, held: player.held.map((b) => b.id) }; },
    get bullets() { return bullets.map((b) => ({ id: b.id, x: Math.round(b.x * 10) / 10, y: Math.round(b.y * 10) / 10, state: b.state, owner: ownerName(b), eng: b.eng, buried: !!b.buried })); },
    get enemies() { return enemies.filter((e) => e.alive).map((e) => ({ type: e.type, x: Math.round(e.x), y: Math.round(e.y), hp: e.hp, state: e.state, held: e.held.map((b) => b.id), under: !!e.under, inv: e.inv > 0, face: Math.round(e.face * 100) / 100, cartHits: e.cartHits })); },
    get rails() { return game.rails.map((rl) => ({ dir: rl.dir, p: rl.p, phase: rl.phase, t: Math.round(rl.t * 100) / 100, sgn: rl.sgn, s: Math.round(rl.s), load: rl.load.map((b) => b.id) })); },
    get dyn() { return dyns.map((d) => ({ x: Math.round(d.x), y: Math.round(d.y), t: Math.round(d.t * 100) / 100, r: DYN_R + player.r })); },
    get kills() { return game.kills; },
    get ice() { return game.ice; },
    get act() { return game.act; },
    get region() { return game.region.name; },
    get wind() { return game.wind ? { x: Math.round(game.wind.x * 100) / 100, y: Math.round(game.wind.y * 100) / 100 } : null; },
    get actTitle() { return game.actT > 0; },
    get sweep() { return game.sweep ? { t: Math.round(game.sweep.t * 100) / 100, dir: game.sweep.dir } : null; },
    get music() { return music.on; },
    get runs() { return runs.slice(); },
  };

  // ===== 시작 =====
  if (TEST_RUN) whenReady(() => newRun(STAGE_PARAM >= 0 && STAGE_PARAM <= 5 ? STAGE_PARAM : 1, ROOM_PARAM >= 1 && ROOM_PARAM <= LAST_ROOM ? ROOM_PARAM : 1));
  else if (ENDING_PARAM) whenReady(startEndingTest);
  else if (INTRO_PARAM || !loadIntroSeen()) startIntro(); // 처음 한 번만 저절로(그림을 다 불러오면 흐르기 시작)
  let last = performance.now();
  function frame(now) {
    let dt = (now - last) / 1000; last = now;
    if (dt > 0.05) dt = 0.05; if (dt < 0) dt = 0;
    update(dt); draw();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
