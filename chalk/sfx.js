(function () {
  'use strict';

  var ctx = null, master = null, sfxBus = null, musicBus = null, noiseBuf = null;
  var muted = false;
  var wantMusic = false, musicOn = false, musicGain = null, timer = null;
  var nextStepTime = 0, step = 0;
  var lastPlayed = {};   // 이름 -> 마지막 재생 시각(ms)
  var voices = [];       // 울리는 소리가 끝나는 AudioContext 시각들
  var MAX_VOICES = 12;

  function mtof(m) { return 440 * Math.pow(2, (m - 69) / 12); }

  // ---------- 기본 부품 ----------
  function tone(t, dur, type, f0, f1, vol, dest) {
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    if (f1 && f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest || sfxBus);
    o.start(t); o.stop(t + dur + 0.02);
  }

  function noise(t, dur, ftype, fa, fb, vol, q) {
    var s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noiseBuf;
    f.type = ftype;
    f.Q.value = q || 0.8;
    f.frequency.setValueAtTime(fa, t);
    if (fb && fb !== fa) f.frequency.exponentialRampToValueAtTime(fb, t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(sfxBus);
    s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
  }

  // ---------- 효과음 (이름 -> [길이(초), 만드는 함수]) ----------
  var SOUNDS = {
    shoot: [0.05, function (t) {
      noise(t, 0.04, 'highpass', 3000, 3000, 0.35, 0.7);
      tone(t, 0.03, 'square', 1200, 800, 0.05);
    }],
    hit: [0.08, function (t) {
      tone(t, 0.07, 'sine', 320, 180, 0.28);
    }],
    erase: [0.1, function (t) {
      noise(t, 0.09, 'bandpass', 2600, 700, 0.4, 1.2);
    }],
    pickup: [0.22, function (t) {
      var f = 1000 * (1 + (Math.random() - 0.5) * 0.12);
      tone(t, 0.18, 'sine', f, f, 0.28);
      tone(t, 0.12, 'triangle', f * 2, f * 2, 0.06);
    }],
    levelup: [0.6, function (t) {
      var n = [60, 64, 67, 72];
      for (var i = 0; i < 4; i++) tone(t + i * 0.1, 0.22, 'triangle', mtof(n[i]), mtof(n[i]), 0.3);
    }],
    hurt: [0.3, function (t) {
      tone(t, 0.28, 'sawtooth', 200, 70, 0.22);
      tone(t, 0.28, 'sine', 120, 55, 0.2);
    }],
    heal: [0.4, function (t) {
      tone(t, 0.2, 'sine', mtof(67), mtof(67), 0.25);
      tone(t + 0.12, 0.26, 'sine', mtof(72), mtof(72), 0.25);
    }],
    magnet: [0.45, function (t) {
      tone(t, 0.4, 'triangle', 200, 900, 0.22);
      tone(t, 0.4, 'sine', 400, 1400, 0.08);
    }],
    bomb: [0.4, function (t) {
      tone(t, 0.3, 'sine', 140, 40, 0.5);
      noise(t, 0.25, 'lowpass', 1500, 200, 0.4, 0.7);
    }],
    boss: [0.9, function (t) {
      for (var i = 0; i < 2; i++) {
        tone(t + i * 0.45, 0.2, 'sawtooth', mtof(43), mtof(43), 0.2);
        tone(t + i * 0.45 + 0.2, 0.2, 'sawtooth', mtof(38), mtof(38), 0.2);
      }
    }],
    win: [1.1, function (t) {
      var n = [60, 64, 67, 72, 67, 76];
      var d = [0.12, 0.12, 0.12, 0.18, 0.12, 0.5];
      var at = t;
      for (var i = 0; i < n.length; i++) {
        tone(at, d[i] + 0.12, 'triangle', mtof(n[i]), mtof(n[i]), 0.3);
        tone(at, d[i] + 0.1, 'square', mtof(n[i] - 12), mtof(n[i] - 12), 0.05);
        at += d[i];
      }
    }],
    lose: [0.8, function (t) {
      var n = [67, 64, 60];
      for (var i = 0; i < 3; i++) tone(t + i * 0.2, 0.3, 'triangle', mtof(n[i]), mtof(n[i]) * 0.97, 0.28);
    }],
    click: [0.07, function (t) {
      tone(t, 0.06, 'sine', 600, 380, 0.3);
    }]
  };

  // ---------- 배경음 ----------
  var BPM = 130, STEP = 60 / BPM / 2;       // 8분음표 하나
  var CHORD_ROOT = [48, 45, 41, 43];        // C, Am, F, G (낮은 음)
  // 4마디 x 8스텝, 0은 쉼표 (MIDI)
  var MELODY = [
    72, 0, 76, 0, 79, 76, 0, 72,
    69, 0, 72, 0, 76, 72, 0, 69,
    65, 0, 69, 0, 72, 69, 0, 65,
    67, 0, 71, 74, 71, 0, 67, 0
  ];

  function scheduleStep(i, t) {
    var bar = Math.floor(i / 8), s = i % 8, root = CHORD_ROOT[bar];
    // 베이스: 박마다 으뜸음, 사이는 한 옥타브 위
    if (s % 2 === 0) {
      var bm = (s === 2 || s === 6) ? root + 12 : root;
      tone(t, STEP * 1.6, 'triangle', mtof(bm), mtof(bm), 0.9, musicGain);
    }
    var m = MELODY[i];
    if (m) tone(t, STEP * 1.5, 'square', mtof(m), mtof(m), 0.28, musicGain);
    // 가벼운 박자 소리
    if (s % 4 === 0) noise2(t, 0.05, 1200, 0.5);
    else if (s % 2 === 0) noise2(t, 0.025, 6000, 0.2);
  }

  function noise2(t, dur, fc, vol) {
    var s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noiseBuf;
    f.type = fc > 3000 ? 'highpass' : 'lowpass';
    f.frequency.value = fc;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(musicGain);
    s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
  }

  function pump() {
    try {
      if (!ctx || !musicOn) return;
      while (nextStepTime < ctx.currentTime + 0.25) {
        scheduleStep(step, nextStepTime);
        nextStepTime += STEP;
        step = (step + 1) % 32;
      }
    } catch (e) {}
  }

  function startMusic() {
    if (!ctx || musicOn) return;
    musicOn = true;
    musicGain = ctx.createGain();
    musicGain.gain.setValueAtTime(0.0001, ctx.currentTime);
    musicGain.gain.linearRampToValueAtTime(1, ctx.currentTime + 0.4);
    musicGain.connect(musicBus);
    step = 0;
    nextStepTime = ctx.currentTime + 0.08;
    pump();
    timer = setInterval(pump, 60);
  }

  function stopMusic() {
    if (!musicOn) return;
    musicOn = false;
    if (timer) { clearInterval(timer); timer = null; }
    var g = musicGain; musicGain = null;
    if (g && ctx) {
      try {
        var t = ctx.currentTime;
        g.gain.cancelScheduledValues(t);
        g.gain.setValueAtTime(Math.max(g.gain.value, 0.0001), t);
        g.gain.linearRampToValueAtTime(0.0001, t + 0.3);
        // 이미 예약된 음표도 이 게인을 지나므로 0.3초 뒤엔 조용해짐
        setTimeout(function () { try { g.disconnect(); } catch (e) {} }, 800);
      } catch (e) {}
    }
  }

  // ---------- 공개 함수 ----------
  function init() {
    try {
      if (!ctx) {
        var AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        ctx = new AC();
        master = ctx.createGain();
        master.gain.value = muted ? 0 : 1;
        master.connect(ctx.destination);
        sfxBus = ctx.createGain(); sfxBus.gain.value = 0.5; sfxBus.connect(master);
        musicBus = ctx.createGain(); musicBus.gain.value = 0.18; musicBus.connect(master);
        var len = ctx.sampleRate;
        noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
        var d = noiseBuf.getChannelData(0);
        for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      }
      if (ctx.state === 'suspended' && ctx.resume) {
        var p = ctx.resume();
        if (p && p.catch) p.catch(function () {});
      }
      if (wantMusic) startMusic();
    } catch (e) {}
  }

  function play(name) {
    try {
      if (!ctx || muted) return;
      var def = SOUNDS[name];
      if (!def) return;
      var now = Date.now();
      if (lastPlayed[name] && now - lastPlayed[name] < 40) return;
      var t = ctx.currentTime;
      voices = voices.filter(function (e) { return e > t; });
      if (voices.length >= MAX_VOICES) return;
      lastPlayed[name] = now;
      voices.push(t + def[0]);
      def[1](t + 0.005);
    } catch (e) {}
  }

  function music(on) {
    try {
      wantMusic = !!on;
      if (on) startMusic(); else stopMusic();
    } catch (e) {}
  }

  function setMuted(b) {
    try {
      muted = !!b;
      if (master) master.gain.setTargetAtTime(muted ? 0 : 1, ctx.currentTime, 0.02);
    } catch (e) {}
  }

  window.SFX = { init: init, play: play, music: music, setMuted: setMuted };
})();
