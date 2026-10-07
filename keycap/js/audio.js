// 딸깍 공방 — 소리 (모두 실제 녹음: sounddata.js)
const Snd = (() => {
  const AC = window.AudioContext || window.webkitAudioContext;
  const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  const SR = 44100;
  const BUF = { sets:{}, fx:{} };
  let ctx = null, master = null, cases = {}, paused = false, vol = 1, onPress = null;

  // ---------- 녹음 풀기 (페이지를 열자마자 미리) ----------
  const dec = new OAC(1, 1, SR);
  const ab = s => { const bin = atob(s), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u.buffer; };
  function trim(b){                         // mp3 앞의 빈 소리를 잘라 누르는 순간 바로 나게
    const d = b.getChannelData(0); let pk = 0;
    for (let i = 0; i < d.length; i++) pk = Math.max(pk, Math.abs(d[i]));
    let on = 0; const th = pk * .04;
    while (on < d.length && Math.abs(d[on]) < th) on++;
    on = Math.max(0, on - Math.round(SR * .002));
    const len = Math.max(1, d.length - on);
    let nb;
    try { nb = new AudioBuffer({ length:len, sampleRate:b.sampleRate, numberOfChannels:1 }); } catch(e){ nb = dec.createBuffer(1, len, b.sampleRate); }
    nb.getChannelData(0).set(d.subarray(on));
    return nb;
  }
  const decode = s => new Promise(res => { try { dec.decodeAudioData(ab(s), b => res(trim(b)), () => res(null)); } catch(e){ res(null); } });
  const jobs = [];
  const SD = window.SOUND_DATA || { sets:{}, fx:{} };
  for (const [k, v] of Object.entries(SD.sets || {})){
    BUF.sets[k] = { press:[], release:[] };
    for (const t of ['press', 'release']) (v[t] || []).forEach(s => jobs.push(decode(s).then(b => { if (b) BUF.sets[k][t].push(b); })));
  }
  for (const [k, v] of Object.entries(SD.fx || {})){
    if (Array.isArray(v)){ BUF.fx[k] = []; v.forEach(s => jobs.push(decode(s).then(b => { if (b) BUF.fx[k].push(b); }))); }
    else { BUF.fx[k] = { press:[], release:[] }; for (const t of ['press', 'release']) (v[t] || []).forEach(s => jobs.push(decode(s).then(b => { if (b) BUF.fx[k][t].push(b); }))); }
  }
  const ready = Promise.all(jobs);
  const hasSet = id => !!(BUF.sets[id] && BUF.sets[id].press.length);

  // ---------- 소리 장치 ----------
  function init(){
    if (!ctx){
      ctx = new AC();
      const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 6; comp.attack.value = .001; comp.release.value = .12;
      const lim1 = ctx.createDynamicsCompressor(); lim1.threshold.value = -4; lim1.knee.value = 0; lim1.ratio.value = 20; lim1.attack.value = .0005; lim1.release.value = .08;
      master = ctx.createGain(); master.gain.value = vol * .8;
      // 마지막에 부드러운 제한기: 아무리 겹쳐도 최대 크기를 넘지 않게 (소리 깨짐 방지)
      const lim = ctx.createWaveShaper(), N = 2048, curve = new Float32Array(N);
      for (let i = 0; i < N; i++){ const x = i / (N - 1) * 2 - 1; curve[i] = Math.tanh(x * 2) * .97; }   // 입력 ±1 = 원래 크기 ±2
      lim.curve = curve;
      const half = ctx.createGain(); half.gain.value = .5;
      master.connect(comp); comp.connect(lim1); lim1.connect(half); half.connect(lim); lim.connect(ctx.destination);
      // 몸체 울림 세 가지
      const plain = ctx.createGain(); plain.connect(master); cases.plastic = plain;
      const wIn = ctx.createGain(), wLow = ctx.createBiquadFilter(), wPk = ctx.createBiquadFilter();
      wLow.type = 'lowpass'; wLow.frequency.value = 4200; wPk.type = 'peaking'; wPk.frequency.value = 230; wPk.gain.value = 6; wPk.Q.value = 1.2;
      wIn.connect(wPk); wPk.connect(wLow); wLow.connect(master); cases.wood = wIn;
      const aIn = ctx.createGain(), aHi = ctx.createBiquadFilter(), dl = ctx.createDelay(), fb = ctx.createGain(), wet = ctx.createGain();
      aHi.type = 'highshelf'; aHi.frequency.value = 3000; aHi.gain.value = 5;
      dl.delayTime.value = .017; fb.gain.value = .35; wet.gain.value = .42;
      aIn.connect(aHi); aHi.connect(master); aHi.connect(dl); dl.connect(fb); fb.connect(dl); dl.connect(wet); wet.connect(master); cases.alu = aIn;
    }
    if (ctx.state === 'suspended' && !paused) ctx.resume();
  }
  ['pointerdown', 'pointerup', 'touchend', 'click', 'keydown'].forEach(ev => window.addEventListener(ev, init, true));

  // ---------- 재생 ----------
  let lastI = {};
  function pickBuf(list, key){
    if (!list || !list.length) return null;
    let i = Math.floor(Math.random() * list.length);
    if (list.length > 1 && i === lastI[key]) i = (i + 1) % list.length;
    lastI[key] = i; return list[i];
  }
  function out(build){ return cases[(build && build.case) || 'plastic'] || master; }
  function src(buf, { rate = 1, gain = 1, lp = 0, hp = 0, pk = null, delay = 0, dest } = {}){
    if (!ctx || paused || !buf) return;
    const s = ctx.createBufferSource(); s.buffer = buf;
    s.playbackRate.value = rate * (0.985 + Math.random() * .03);
    let n = s;
    if (lp){ const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = lp; n.connect(f); n = f; }
    if (hp){ const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = hp; n.connect(f); n = f; }
    if (pk){ const f = ctx.createBiquadFilter(); f.type = 'peaking'; f.frequency.value = pk[0]; f.gain.value = pk[1]; f.Q.value = pk[2]; n.connect(f); n = f; }
    const g = ctx.createGain(); g.gain.value = gain; n.connect(g); g.connect(dest || master);
    s.start(ctx.currentTime + delay);
  }
  let build = { switch:'brown', keycap:'pbt', case:'plastic' };
  function swCfg(b){
    const sw = DATA.SWITCH[b.switch] || DATA.SWITCH.brown;
    return hasSet(sw.set) ? sw : (sw.fb && hasSet(sw.fb.set) ? { ...sw, ...sw.fb } : DATA.SWITCH.brown);
  }
  // kind: press | release, step: 반음
  function key(kind, { step = 0, gain = 1, rate = 1, delay = 0, b, auto } = {}){
    b = b || build;
    const sw = swCfg(b), kc = DATA.KEYCAP[b.keycap] || DATA.KEYCAP.pbt;
    const r = sw.rate * rate * Math.pow(2, step / 12);
    const lp = Math.min(sw.lp || 99999, kc.lp || 99999);
    const dest = out(b);
    const own = BUF.sets[sw.set][kind] && BUF.sets[sw.set][kind].length;
    if (kind === 'release' && !own && sw.relSet && hasSet(sw.relSet) && BUF.sets[sw.relSet].release.length){
      // 뗌 녹음이 없는 스위치는 비슷한 묶음의 뗌 소리를 빌려 씀
      src(pickBuf(BUF.sets[sw.relSet].release, sw.relSet + 'rel'), { rate:(sw.relRate || 1) * rate * Math.pow(2, step / 12), gain:gain * (sw.relGain || .9), lp:lp < 99999 ? lp : 0, delay, dest });
    } else
    src(pickBuf(own ? BUF.sets[sw.set][kind] : BUF.sets[sw.set].press, sw.set + kind), { rate:kind === 'release' && !own ? r * 1.25 : r, gain:sw.gain * gain * (kind === 'release' && !own ? .45 : 1), lp:lp < 99999 ? lp : 0, hp:sw.hp || 0, pk:sw.pk || null, delay, dest });
    if (kind === 'press'){
      for (const [layer, lg, lr] of [[kc.layer, kc.layerGain, kc.layerRate], [kc.layer2, kc.layer2Gain || .15, 1], [sw.layer, sw.layerGain, 1]]){
        if (layer && BUF.fx[layer] && BUF.fx[layer].length) src(pickBuf(BUF.fx[layer], layer), { rate:Math.pow(2, step / 12) * 1.05 * (lr || 1), gain:(lg || .3) * gain, delay, dest });
      }
      if (onPress && !delay && !auto) onPress();
    }
  }
  function fx(name, { gain = 1, rate = 1, delay = 0, part } = {}){
    const f = BUF.fx[name];
    if (!f) return false;
    const list = Array.isArray(f) ? f : f[part || 'press'];
    if (!list || !list.length) return false;
    src(pickBuf(list, name + (part || '')), { gain, rate, delay });
    return true;
  }
  function tone(freq, dur, gain, type = 'triangle', delay = 0){
    if (!ctx || paused) return;
    const t = ctx.currentTime + delay, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + .006); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + .03);
  }
  const C5 = 523.25;
  // 멜로디 음 하나: 실제 키 소리를 그 음 높이로 + 옅은 음색
  function note(semi, { b, gain = 1, delay = 0, len = .5 } = {}){
    key('press', { step:semi, gain, delay, b, auto:true });
    tone(C5 * Math.pow(2, semi / 12), len, .05 * gain, 'triangle', delay);
    tone(C5 * 2 * Math.pow(2, semi / 12), len * .5, .015 * gain, 'sine', delay);
  }
  const jingle = (list, gap = .11, g = .12) => list.forEach((s, i) => tone(C5 * Math.pow(2, s / 12), .45, g, 'triangle', i * gap));

  return {
    init, ready, hasSet, key, fx, tone, note, jingle,
    get ctx(){ return ctx },
    get build(){ return build }, set build(b){ build = { ...build, ...b } },
    set paused(v){ paused = v; if (ctx){ v ? ctx.suspend() : ctx.resume(); } }, get paused(){ return paused },
    set vol(v){ vol = v; if (master) master.gain.value = v * .8; },
    set onPress(f){ onPress = f; },
    space(){ key('press', { rate:.62, gain:1.1 }); if (!fx('spacebar', { gain:1.2, rate:.9 })) tone(85, .18, .2, 'sine'); if (!fx('spacebar', { part:'release', gain:1, rate:.95, delay:.08 })) key('release', { rate:.66, gain:1, delay:.07 }); },
    enter(){ key('press', { rate:.9, gain:1.1 }); key('release', { rate:.9, gain:.9, delay:.06 }); tone(196, .14, .1); },
    win(){ jingle([0, 4, 7, 12, 16]); },
    lose(){ jingle([7, 4, 0, -5], .15, .1); },
    chime(){ if (!fx('chime', { gain:.3 })) jingle([12, 16, 19], .07, .08); },
  };
})();
