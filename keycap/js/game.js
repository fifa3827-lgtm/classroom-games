// 딸깍 공방 — 퍼즐 화면 (Board 규칙을 그리고 손가락 입력을 받음)
const Game = (() => {
  const $ = id => document.getElementById(id);
  const GLYPH = ['●', '▲', '■', '◆', '★', '♥'];
  const FNL = { esc:'Esc', tab:'Tab', back:'⌫', shift:'⇧', enter:'⏎', space:'space' };
  const FNNAME = { esc:'Esc', tab:'탭', back:'백스페이스', shift:'시프트', enter:'엔터', space:'스페이스바' };
  const josa = w => { const c = w.charCodeAt(w.length - 1) - 0xAC00; return w + (c >= 0 && c % 28 ? '은' : '는'); };
  const OBN = { crumb:'과자 부스러기', stuck:'뻑뻑한 키', coffee:'커피', bug:'버그' };
  let G = null, cw = 48, gen = 0;
  const board = () => $('pz-board');

  // ---------- 시작 ----------
  function start(L, opts){
    gen++;
    const st = Board.create(L, L.seed + Math.floor(Math.random() * 100000));
    const sk = DATA.SKILL[(DATA.KEYCAP[Snd.build.keycap] || DATA.KEYCAP.pbt).skill];
    G = { L, st, opts:opts || {}, chain:[], color:-1, loop:false, busy:true, over:false, el:[], charge:0, skill:sk, aim:null, songIdx:0, best:0, pid:null };
    $('pz-name').textContent = L.name + (L.hard === 3 ? ' 👑' : L.hard === 2 ? ' 🔥' : '');
    const bd = board(); bd.innerHTML = '<svg id="pz-line"></svg>';
    G.st.keys.forEach(k => { const e = document.createElement('div'); bd.appendChild(e); G.el[k.id] = e; });
    layout(); G.st.keys.forEach(k => paint(k.id, true));
    // 키캡이 하나씩 「뿅」 끼워지며 시작
    G.st.keys.forEach((k, i) => { const e = G.el[k.id]; e.classList.add('in'); e.style.animationDelay = (k.r * 50 + k.c * 18) + 'ms'; });
    const g = gen;
    for (let i = 0; i < 6; i++) setTimeout(() => g === gen && Snd.key('press', { step:i * 2, gain:.5, auto:true }), 120 + i * 70);
    setTimeout(() => { if (g !== gen) return; G.st.keys.forEach(k => { G.el[k.id].classList.remove('in'); G.el[k.id].style.animationDelay = ''; }); G.busy = false; }, 700);
    hud(); skillHud();
  }
  function stop(){ gen++; G = null; }

  function layout(){
    if (!G) return;
    const f = $('pz-field').getBoundingClientRect();
    const cols = G.st.cols, rows = G.st.rows;
    cw = Math.floor(Math.max(34, Math.min(110, (f.width - 22) / cols, (f.height - 22) / rows)));   // 휴대폰~컴퓨터 모두 화면에 맞춤
    const bd = board();
    bd.style.width = cw * cols + 'px'; bd.style.height = cw * rows + 'px'; bd.style.setProperty('--cw', cw + 'px');
    G.st.keys.forEach(k => place(k.id));
  }
  window.addEventListener('resize', layout);
  function place(id){
    const k = G.st.keys[id], e = G.el[id], gap = Math.max(2, cw * .05);
    Object.assign(e.style, { left:(k.c * cw + gap) + 'px', top:(k.r * cw + gap) + 'px', width:(k.w * cw - gap * 2) + 'px', height:(cw - gap * 2) + 'px' });
  }
  const theme = () => (DATA.KEYCAP[Snd.build.keycap] || DATA.KEYCAP.pbt).look;
  function paint(id, fresh){
    const k = G.st.keys[id], e = G.el[id];
    let cls = 'kc pk', inner;
    if (k.kind === 'fn'){
      cls += ' fn fn-' + k.fn + (k.cool > 0 ? ' cool' : '');
      inner = `<span>${FNL[k.fn]}</span>` + (k.cool > 0 && k.cool < 999 ? `<i class="cd">${k.cool}</i>` : '');
      const t = theme(); e.style.setProperty('--cap', t[0]); e.style.setProperty('--capDish', t[1]); e.style.setProperty('--capSkirt', t[2]); e.style.setProperty('--capEdge', t[3]);
    } else {
      cls += ' c' + k.color + (k.sp ? ' sp' : '');
      inner = `<span>${GLYPH[k.color]}</span>`;
    }
    if (k.ob){
      cls += ' has-ob';
      inner += obHtml(k.ob);
    }
    e.className = cls; e.innerHTML = inner;
    if (fresh) place(id);
  }
  function obHtml(ob){
    if (ob.t === 'crumb') return '<i class="ob crumb"><b></b><b></b><b></b><b></b></i>';
    if (ob.t === 'stuck') return `<i class="ob stuck${ob.hp < 2 ? ' cracked' : ''}"><em>🔒</em></i>`;
    if (ob.t === 'coffee') return '<i class="ob coffee"><u></u></i>';
    if (ob.t === 'bug') return `<i class="ob bug">${bugSvg()}</i>`;
    return '';
  }
  const bugSvg = () => `<svg viewBox="0 0 60 48"><g stroke="#4a3d36" stroke-width="3" stroke-linecap="round"><line x1="23" y1="14" x2="17" y2="5"/><line x1="37" y1="14" x2="43" y2="5"/><line x1="12" y1="31" x2="5" y2="35"/><line x1="48" y1="31" x2="55" y2="35"/></g><ellipse cx="30" cy="31" rx="20" ry="15" fill="#9fd67a" stroke="#4a3d36" stroke-width="3"/><circle cx="23" cy="29" r="5" fill="#fff"/><circle cx="37" cy="29" r="5" fill="#fff"/><circle cx="24" cy="30" r="2.5" fill="#2b2420"/><circle cx="38" cy="30" r="2.5" fill="#2b2420"/><path d="M26 38 Q30 41 34 38" stroke="#4a3d36" stroke-width="2.4" fill="none"/></svg>`;

  // ---------- 머리줄 ----------
  function goalChips(goals){
    return Object.entries(goals).map(([g, n]) => {
      const icon = /^c\d$/.test(g) ? `<i class="gi c${g.slice(1)}">${GLYPH[g.slice(1)]}</i>` : `<i class="gi ob-${g}">${{ crumb:'🍪', stuck:'🔒', coffee:'☕', bug:'🐛' }[g]}</i>`;
      return `<div class="goal${n <= 0 ? ' done' : ''}" data-g="${g}">${icon}<b>${n <= 0 ? '✓' : n}</b></div>`;
    }).join('');
  }
  function hud(goals){
    const gs = goals || G.st.goals;
    $('pz-goals').innerHTML = goalChips(gs);
    $('pz-goals').classList.toggle('two', Object.keys(gs).length >= 4);   // 목표 4개는 2개씩 두 줄로
    $('pz-moves').querySelector('b').textContent = Math.max(0, G.st.moves);
    $('pz-moves').classList.toggle('low', G.st.moves <= 3);
    const coffee = G.st.keys.filter(k => k.ob && k.ob.t === 'coffee').length;
    $('pz-coffee').style.display = coffee ? '' : 'none';
    $('pz-coffee').innerHTML = `☕ ${Math.min(coffee, G.st.coffeeLimit)} / ${G.st.coffeeLimit}`;
    $('pz-coffee').classList.toggle('danger', coffee >= G.st.coffeeLimit * .7);
  }
  function bumpGoal(g, n){
    const el = $('pz-goals').querySelector(`[data-g="${g}"]`); if (!el) return;
    el.querySelector('b').textContent = n <= 0 ? '✓' : n; el.classList.toggle('done', n <= 0);
    el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump');
  }
  function skillHud(){
    const b = $('pz-skill'), sk = G.skill, ready = G.charge >= sk.need;
    b.classList.toggle('ready', ready); b.classList.toggle('aim', !!G.aim);
    b.querySelector('.sk-name').textContent = G.aim ? '대상을 고르세요' : sk.name;
    b.querySelector('.sk-fill').style.height = Math.min(100, G.charge / sk.need * 100) + '%';
  }

  // ---------- 손가락으로 잇기 ----------
  function keyAt(x, y, strict){
    const r0 = board().getBoundingClientRect();
    const fx = (x - r0.left) / cw, fy = (y - r0.top) / cw;
    for (const k of G.st.keys){
      const m = strict ? .16 : 0;
      if (fx >= k.c + m && fx < k.c + k.w - m && fy >= k.r + m && fy < k.r + 1 - m) return k;
    }
    return null;
  }
  function down(e){
    if (!G || G.busy || G.over || Snd.paused || G.pid !== null) return;
    const k = keyAt(e.clientX, e.clientY, false); if (!k) return;
    if (G.aim){ useSkill(k); return; }
    if (!Board.linkable(G.st, k)){ nope(k); return; }
    G.pid = e.pointerId; try { board().setPointerCapture(e.pointerId) } catch(_){}
    G.chain = [k.id]; G.color = k.kind === 'color' ? k.color : -1; G.loop = false;
    G.el[k.id].classList.add('down'); Snd.key('press', { step:0 }); App.buzz(5);
    line();
  }
  function move(e){
    if (!G || e.pointerId !== G.pid) return;
    const k = keyAt(e.clientX, e.clientY, true); if (!k) return;
    const ch = G.chain, last = ch[ch.length - 1];
    if (k.id === last) return;
    if (ch.length >= 2 && k.id === ch[ch.length - 2]){
      if (G.loop){ G.loop = false; line(); return; }
      G.el[last].classList.remove('down'); ch.pop(); Snd.key('release', { step:scale(ch.length - 1), gain:.6 });
      G.color = Board.chainColor(G.st, ch); line(); return;
    }
    if (G.loop) return;
    if (ch.includes(k.id)){
      if (Board.colorCount(G.st, ch) >= Board.LOOP_MIN && G.st.keys[last].nb.includes(k.id) && k.kind === 'color' && k.color === G.color){
        G.loop = true; G.loopTo = k.id; Snd.jingle([0, 4, 7, 12], .05, .06); Snd.key('press', { step:12 }); App.buzz([8, 30, 8]); line();
      }
      return;
    }
    if (!Board.canAdd(G.st, ch, k, G.color)) return;
    ch.push(k.id); if (G.color < 0 && k.kind === 'color') G.color = k.color;
    G.el[k.id].classList.add('down');
    Snd.key('press', { step:scale(ch.length - 1) });
    Snd.tone(523.25 * Math.pow(2, scale(ch.length - 1) / 12), .22, .03);
    App.buzz(5); line();
  }
  function cancel(){
    if (!G) return;
    G.pid = null; G.chain.forEach(id => G.el[id] && G.el[id].classList.remove('down'));
    G.chain = []; G.loop = false; line(); $('pz-count').textContent = '';
  }
  function up(e){
    if (!G || e.pointerId !== G.pid) return;
    if (Snd.paused || e.type === 'pointercancel'){ cancel(); return; }   // 일시정지·터치 취소 때는 두지 않음
    G.pid = null;
    const ch = G.chain;
    if (!Board.valid(G.st, ch)){
      ch.forEach(id => G.el[id].classList.remove('down')); if (ch.length) Snd.key('release');
      if (ch.length === 1 && G.st.keys[ch[0]].kind === 'fn') hint(`기능 키는 같은 색 키캡 줄 사이에 끼워 이어요`);
      G.chain = []; line(); return;
    }
    turn(ch.slice(), G.loop);
  }
  const SC = [0, 2, 4, 5, 7, 9, 11, 12, 14, 16, 17, 19];
  const scale = n => SC[Math.min(n, SC.length - 1)];
  function nope(k){ const e = G.el[k.id]; e.classList.remove('shake'); void e.offsetWidth; e.classList.add('shake'); Snd.key('press', { gain:.4, rate:.9 });
    if (k.ob) hint(`${josa(OBN[k.ob.t])} 옆 키캡을 터뜨려 없애요`); else if (k.cool) hint(`${josa(FNNAME[k.fn])} ${k.cool < 999 ? k.cool + '턴 뒤에' : '이번 판에 다시'} 쓸 수 ${k.cool < 999 ? '있어요' : '없어요'}`); }
  function line(){
    const ch = G.chain, svg = $('pz-line');
    if (ch.length < 2){ svg.innerHTML = ''; return; }
    const ctr = id => { const k = G.st.keys[id]; return `${(k.c + k.w / 2) * cw},${(k.r + .45) * cw}`; };
    const pts = ch.map(ctr); if (G.loop) pts.push(ctr(G.loopTo));
    const col = G.color >= 0 ? getComputedStyle(G.el[ch.find(id => G.st.keys[id].kind === 'color')]).getPropertyValue('--capEdge') : '#8a7353';
    svg.innerHTML = `<polyline points="${pts.join(' ')}" fill="none" stroke="${col}" stroke-width="${cw * .17}" stroke-linecap="round" stroke-linejoin="round" opacity=".85"/>`
      + (G.loop ? `<polyline points="${pts.join(' ')}" fill="none" stroke="#fff6a8" stroke-width="${cw * .07}" stroke-linecap="round" stroke-linejoin="round"/>` : '');
    const n = Board.colorCount(G.st, ch);
    $('pz-count').textContent = n >= 2 ? (G.loop ? '고리!' : n >= 6 ? `${n} ✨` : n) : '';
  }

  // ---------- 한 수 연출 ----------
  function turn(chain, loop){
    const g = gen;
    G.busy = true;
    const goals0 = { ...G.st.goals };
    const shift = chain.some(id => G.st.keys[id].fn === 'shift');
    const ev = Board.play(G.st, chain, loop);
    G.chain = []; line(); $('pz-count').textContent = '';
    chain.forEach(id => G.el[id].classList.remove('down'));
    G.charge += Board.colorCount(G.st, chain) + (loop ? 4 : 0);
    if (loop) banner('고리!');
    run(ev, goals0, shift, g);
  }
  function run(ev, goals0, shift, g){
    const disp = { ...goals0 };
    const popsEv = ev.find(e => e.t === 'pops');
    const n = popsEv ? popsEv.pops.length : 0;
    const gap = n > 24 ? 26 : n > 12 ? 34 : 44;
    let tl = 0;
    // 기능 키
    ev.filter(e => e.t === 'fn').forEach(e => {
      setTimeout(() => { if (g !== gen) return;
        const el = G.el[e.id]; el.classList.add('fire'); setTimeout(() => el.classList.remove('fire'), 400);
        if (e.fn === 'space') Snd.space(); else if (e.fn === 'enter') Snd.enter(); else { Snd.key('press', { rate:.8, gain:1.3 }); Snd.key('release', { rate:.85, delay:.07 }); }
        banner({ space:'스페이스바!', enter:'엔터!', shift:'시프트 ×2', back:'지우기!', tab:'탭!', esc:'이동 +3' }[e.fn]);
        if (e.fn === 'esc'){ Snd.jingle([0, 7, 12], .08, .09); }
      }, tl);
      tl += 140;
    });
    // 터지기
    if (popsEv) popsEv.pops.forEach((p, i) => setTimeout(() => { if (g !== gen) return;
      const el = G.el[p.id];
      if (G.opts.song){ const s = App.songNote(G.songIdx++); Snd.note(s, { gain:i < 14 ? 1 : .7 }); }
      else Snd.key('release', { step:scale(Math.min(i, 11)), gain:i < 14 ? 1 : .7 });
      if (p.by !== 'chain' && i % 3 === 0) Snd.key('press', { step:scale(i % 8), gain:.5, auto:true });
      if (p.spark){ Snd.chime(); burst(el, 3); }
      if (i % 3 === 0) App.buzz(4);
      el.classList.add('pop'); spark(el, 4);
      const key = 'c' + p.color;
      if (disp[key] !== undefined){ disp[key] -= (shift && p.by === 'chain') ? 2 : 1; bumpGoal(key, disp[key]); }
    }, tl + i * gap));
    tl += n * gap + 120;
    // 방해물 맞음
    ev.filter(e => e.t === 'hit').forEach(e => setTimeout(() => { if (g !== gen) return;
      const el = G.el[e.id];
      obFx(e.ob, e.done);
      if (e.done){ const o = el.querySelector('.ob'); if (o){ o.classList.add('gone'); } disp[e.ob] !== undefined && bumpGoal(e.ob, --disp[e.ob]); }
      else { const o = el.querySelector('.ob'); o && o.classList.add('cracked'); }
    }, tl - 60));
    // 다시 채우기
    const rf = ev.find(e => e.t === 'refill');
    setTimeout(() => { if (g !== gen) return;
      ev.filter(e => e.t === 'hit' && e.done).forEach(e => paint(e.id));
      if (rf){
        rf.list.forEach(([id], i) => { paint(id); const el = G.el[id]; el.classList.add('in'); el.style.animationDelay = (i * 12) + 'ms'; });
        for (let i = 0; i < Math.min(4, Math.ceil(rf.list.length / 5)); i++) Snd.key('release', { rate:1.3, gain:.3, delay:.05 + i * .05 });
        if (rf.spark !== null){ setTimeout(() => { Snd.chime(); banner('반짝 키캡!'); }, 200); }
      }
      G.st.keys.forEach(k => { if (k.kind === 'fn') paint(k.id); });
      hud();
    }, tl);
    tl += 260;
    // 탭으로 색 밀기
    ev.filter(e => e.t === 'recolor').forEach(e => setTimeout(() => { if (g !== gen) return; e.list.forEach(([id]) => { paint(id); G.el[id].classList.add('in'); }); Snd.key('press', { rate:1.2, gain:.6 }); }, tl));
    // 턴 끝 사건들
    for (const e of ev){
      if (e.t === 'coffee'){ setTimeout(() => { if (g !== gen) return; paint(e.to); const o = G.el[e.to].querySelector('.ob'); o && o.classList.add('spread'); Snd.tone(110, .25, .12, 'sine'); hud(); }, tl += 300); }
      if (e.t === 'bug'){ setTimeout(() => { if (g !== gen) return; paint(e.from); paint(e.to); const o = G.el[e.to].querySelector('.ob'); o && o.classList.add('hop'); Snd.key('press', { rate:1.6, gain:.4 }); }, tl += 260); }
      if (e.t === 'cat'){ const t0 = tl; setTimeout(() => g === gen && catWalk(e), t0); tl += 1500; }
      if (e.t === 'shuffle'){ setTimeout(() => { if (g !== gen) return; G.st.keys.forEach(k => paint(k.id)); e.list.forEach(([id], i) => { paint(id); G.el[id].classList.add('in'); if (i % 4 === 0) Snd.key('press', { step:i % 12, gain:.45, delay:i * .012, auto:true }); }); banner('판을 섞어요'); }, tl += 300); }
    }
    const end = ev[ev.length - 1];
    setTimeout(() => { if (g !== gen) return;
      G.st.keys.forEach(k => paint(k.id)); hud(); skillHud();
      if (end.state === 'play'){ G.busy = false; if (G.st.moves === 3) hint('이동이 3번 남았어요!'); return; }
      finish(end.state);
    }, tl + 150);
  }
  function obFx(t, done){
    if (t === 'crumb'){ Snd.fx('paper', { gain:.5, rate:1.4 }) || Snd.key('release', { rate:1.5, gain:.5 }); }
    if (t === 'stuck'){ Snd.fx('ceramic', { gain:.7, rate:done ? 1 : .8 }) || Snd.key('press', { rate:.7, gain:1 }); }
    if (t === 'coffee'){ Snd.tone(300, .12, .1, 'sine'); Snd.tone(420, .12, .08, 'sine', .06); }
    if (t === 'bug'){ Snd.tone(880, .1, .1, 'square'); Snd.jingle([12, 19], .06, .06); }
  }
  function catWalk(e){
    const bd = board(), cat = document.createElement('div');
    cat.className = 'pz-cat'; cat.innerHTML = Chars.svg('cat', '기쁨');
    cat.style.top = (e.row * cw - cw * .55) + 'px'; cat.style.width = cat.style.height = cw * 1.5 + 'px';
    bd.appendChild(cat);
    Snd.fx('meow', { gain:.26 }) || Snd.jingle([7, 12], .1, .07);
    banner('타닥이가 지나가요!');
    const W = G.st.cols * cw;
    cat.animate([{ transform:`translateX(${-cw * 1.6}px)` }, { transform:`translateX(${W + cw * .2}px)` }], { duration:1300, easing:'linear', fill:'forwards' });
    const g = gen;
    e.list.forEach(([id], i) => setTimeout(() => { if (g !== gen) return; paint(id); G.el[id].classList.add('in'); Snd.key('press', { step:i, gain:.5, auto:true }); }, 150 + i * 150));
    setTimeout(() => cat.remove(), 1350);
  }

  // ---------- 판 끝 ----------
  function finish(state){
    G.over = true;
    const g = gen, left = Math.max(0, G.st.moves), max = G.st.maxMoves;
    if (state === 'win'){
      Snd.win(); banner('완성!');
      const free = G.st.keys.filter(k => k.kind === 'color' && !k.ob).sort(() => Math.random() - .5).slice(0, Math.min(left, 14));
      free.forEach((k, i) => setTimeout(() => { if (g !== gen) return;   // 남은 이동만큼 타다다닥
        const el = G.el[k.id]; el.classList.add('down'); Snd.key('press', { step:scale(i % 8), auto:true }); App.buzz(4);
        setTimeout(() => { el.classList.remove('down'); Snd.key('release', { step:scale(i % 8), gain:.8 }); }, 60);
        spark(el, 6, ['#ffd166', '#fff', '#ff8fab']);
      }, 600 + i * 90));
      const star = left >= Math.max(3, Math.ceil(max * .2)) ? 3 : left >= Math.max(1, Math.ceil(max * .08)) ? 2 : 1;
      setTimeout(() => report(g, { win:true, star, left }), 900 + free.length * 90 + 400);
    } else {
      Snd.lose();
      setTimeout(() => report(g, { win:false, reason:state }), 700);
    }
  }

  function report(g, r){              // 일시정지 중이면 풀릴 때까지 결과를 미룸
    if (g !== gen || !G) return;
    if (Snd.paused){ r.late = true; return setTimeout(() => report(g, r), 250); }
    if (r.late) r.win ? Snd.win() : Snd.lose();
    G.opts.onEnd && G.opts.onEnd(r);
  }

  // ---------- 키캡 기술 ----------
  function skillTap(){
    if (!G || G.busy || G.over) return;
    if (G.aim){ G.aim = null; skillHud(); hint(''); return; }
    if (G.charge < G.skill.need){ hint(`${G.skill.name}: ${G.skill.desc} — 길게 이을수록 빨리 차요 (${Math.min(G.charge, G.skill.need)}/${G.skill.need})`); return; }
    if (G.skill.target){ G.aim = G.skill.target; skillHud(); hint(G.skill.target === 'row' ? '터뜨릴 줄의 키캡을 누르세요' : '대상 키캡을 누르세요'); return; }
    useSkill(null);
  }
  function useSkill(k){
    const id = (DATA.KEYCAP[Snd.build.keycap] || DATA.KEYCAP.pbt).skill, st = G.st, K = st.keys;
    if (G.aim && (!k || (k.kind !== 'color' && id !== 'ceramic'))) return;
    if (G.aim && (id === 'magnet' || id === 'rainbow') && k.ob) return;
    const g = gen, before = { ...st.goals }; G.aim = null; G.charge = 0; G.busy = true; skillHud(); hint('');
    banner(G.skill.name + '!'); Snd.chime();
    let ev = null;
    if (id === 'tap') ev = k.ob ? Board.blast(st, [], [k.id]) : Board.blast(st, [k.id]);
    if (id === 'ding'){ Snd.fx('ding', { gain:.9 }); ev = Board.blast(st, K.filter(x => x.r === k.r).map(x => x.id)); }
    if (id === 'rainbow') ev = Board.blast(st, K.filter(x => x.kind === 'color' && x.color === k.color).map(x => x.id));
    if (id === 'ceramic'){ Snd.fx('ceramic', { gain:1 }); const area = K.filter(x => Math.abs(x.r - k.r) <= 1 && x.c + x.w >= k.c && x.c <= k.c + k.w).map(x => x.id); ev = Board.blast(st, [], area.filter(j => K[j].ob)); }
    if (id === 'wood'){ const cs = K.filter(x => x.ob && x.ob.t === 'coffee').slice(0, 3).map(x => x.id); st.noSpread = 3; ev = Board.blast(st, [], cs); }
    if (id === 'magnet'){
      const pool = K.filter(x => x.kind === 'color' && !x.ob && x.color !== k.color).sort((a, b) => (Math.abs(a.r - k.r) + Math.abs(a.c - k.c)) - (Math.abs(b.r - k.r) + Math.abs(b.c - k.c))).slice(0, 6);
      pool.forEach(x => x.color = k.color);
      pool.forEach((x, i) => setTimeout(() => { if (g !== gen) return; paint(x.id); G.el[x.id].classList.add('in'); Snd.fx('metal', { gain:.4, rate:1 + i * .05 }); }, i * 70));
      setTimeout(() => { if (g === gen){ G.busy = false; hud(); } }, 600); return;
    }
    if (id === 'gold'){ st.moves += 4; hud(); Snd.jingle([0, 4, 7, 12, 16], .07, .1); setTimeout(() => { if (g === gen) G.busy = false; }, 500); return; }
    if (ev) run(ev, before, false, g);
  }

  // ---------- 효과 ----------
  function spark(el, n, colors){
    const r = el.getBoundingClientRect();
    colors = colors || [getComputedStyle(el).getPropertyValue('--capSkirt') || '#ffd166', '#fff'];
    App.sparks(r.left + r.width / 2, r.top + r.height / 2, n, colors);
  }
  function burst(el, n){ const r = el.getBoundingClientRect(); App.sparks(r.left + r.width / 2, r.top + r.height / 2, 14, ['#ffe066', '#fff', '#ffb3cd'], 70); }
  let bannerT;
  function banner(t){ const b = $('pz-banner'); b.textContent = t; b.classList.remove('on'); void b.offsetWidth; b.classList.add('on'); clearTimeout(bannerT); bannerT = setTimeout(() => b.classList.remove('on'), 800); }
  let hintT;
  function hint(t){ $('pz-hint').textContent = t; clearTimeout(hintT); if (t) hintT = setTimeout(() => { if (G) $('pz-hint').textContent = G.L.tip || ''; }, 3200); }

  function bind(){
    const bd = board();
    bd.addEventListener('pointerdown', down); bd.addEventListener('pointermove', move);
    bd.addEventListener('pointerup', up); bd.addEventListener('pointercancel', up);
    $('pz-skill').addEventListener('click', skillTap);
  }
  return { start, stop, bind, layout, cancel, get G(){ return G }, hint };
})();
