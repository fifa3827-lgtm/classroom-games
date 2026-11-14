// 소리 장치: 효과음(AudioBuffer)과 음악(<audio> → 이득 노드). 첫 터치부터 소리가 나도록 여러 입력에서 resume
const MUTE = /[?&]mute\b/.test(location.search);
const canOgg = (() => { try { return !!new Audio().canPlayType('audio/ogg; codecs="vorbis"'); } catch { return false; } })();
const EXT = canOgg ? 'ogg' : 'mp3';

class AudioSys {
  constructor() {
    this.ctx = null; this.buffers = {}; this.playing = {}; this.last = {};
    this.vol = { music: 0.7, sfx: 0.85 };
    this.music = null; this.musicName = null;
    this.unlocked = false;
  }
  init() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain(); this.master.gain.value = MUTE ? 0 : 1; this.master.connect(this.ctx.destination);
    this.sfxBus = this.ctx.createGain(); this.sfxBus.gain.value = this.vol.sfx; this.sfxBus.connect(this.master);
    this.musicBus = this.ctx.createGain(); this.musicBus.gain.value = this.vol.music; this.musicBus.connect(this.master);
    const resume = () => {
      if (this.ctx.state !== 'running') this.ctx.resume().catch(() => {});
      if (this.music && this.music.el.paused && this.music.want) this.music.el.play().catch(() => {});
      this.unlocked = true;
    };
    for (const ev of ['pointerdown', 'pointerup', 'touchend', 'click', 'keydown']) window.addEventListener(ev, resume, { capture: true, passive: true });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { this.ctx.suspend().catch(() => {}); if (this.music) this.music.el.pause(); }
      else { this.ctx.resume().catch(() => {}); if (this.music && this.music.want) this.music.el.play().catch(() => {}); }
    });
  }
  setVolume(kind, v) {
    this.vol[kind] = v;
    if (!this.ctx) return;
    (kind === 'music' ? this.musicBus : this.sfxBus).gain.setTargetAtTime(v, this.ctx.currentTime, 0.05);
  }
  async load(names) {
    if (!this.ctx) return;
    await Promise.all(names.map(async n => {
      try {
        const r = await fetch(`assets/sfx/${n}.${EXT}`);
        const ab = await r.arrayBuffer();
        this.buffers[n] = await new Promise((ok, no) => this.ctx.decodeAudioData(ab, ok, no));
      } catch (e) { console.warn('소리 못 읽음', n); }
    }));
  }
  // 효과음: 높낮이 ±5% 흔들기, 같은 소리 동시에 최대 4개, 너무 잦으면 건너뜀
  play(name, opt = {}) {
    const b = this.buffers[name];
    if (!b || !this.ctx || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;
    const list = (this.playing[name] ||= []).filter(s => s.end > now);
    this.playing[name] = list;
    if (list.length >= (opt.max || 4)) return;
    if (this.last[name] && now - this.last[name] < (opt.gap ?? 0.03)) return;
    this.last[name] = now;
    const src = this.ctx.createBufferSource();
    src.buffer = b;
    const rate = (opt.rate || 1) * (1 + (Math.random() * 2 - 1) * (opt.vary ?? 0.05));
    src.playbackRate.value = rate;
    const g = this.ctx.createGain(); g.gain.value = opt.vol ?? 1;
    src.connect(g);
    if (opt.pan && this.ctx.createStereoPanner) { const p = this.ctx.createStereoPanner(); p.pan.value = Math.max(-1, Math.min(1, opt.pan)); g.connect(p); p.connect(this.sfxBus); }
    else g.connect(this.sfxBus);
    src.start();
    list.push({ end: now + b.duration / rate });
    return src;
  }
  // 음악: 서서히 바꾸기
  playMusic(name, fade = 1.2) {
    if (!this.ctx || this.musicName === name) return;
    const old = this.music;
    this.musicName = name;
    if (old) {
      old.want = false;
      old.g.gain.setTargetAtTime(0, this.ctx.currentTime, fade / 4);
      setTimeout(() => { old.el.pause(); old.el.src = ''; try { old.node.disconnect(); } catch {} }, fade * 1000 + 300);
    }
    if (!name) { this.music = null; return; }
    const el = new Audio(`assets/music/${name}.${EXT}`);
    el.loop = true; el.preload = 'auto'; el.crossOrigin = 'anonymous';
    const node = this.ctx.createMediaElementSource(el);
    const g = this.ctx.createGain(); g.gain.value = 0;
    node.connect(g); g.connect(this.musicBus);
    g.gain.setTargetAtTime(1, this.ctx.currentTime + 0.05, fade / 3);
    this.music = { el, node, g, want: true };
    el.play().catch(() => {});
  }
  duck(on) { if (this.music) this.music.g.gain.setTargetAtTime(on ? 0.35 : 1, this.ctx.currentTime, 0.2); }
}
export const audio = new AudioSys();

export function vibrate(ms) { try { if (window.__settings?.vibe !== false && navigator.vibrate && navigator.userActivation?.hasBeenActive !== false) navigator.vibrate(ms); } catch {} }
