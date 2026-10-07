// 딸깍 공방 — 화면 흐름 · 저장 · 이야기 · 공방 · 엔딩
const App = (() => {
  const $ = id => document.getElementById(id);
  const W = DATA.WORLDS;
  const NAME = { student:'학생', writer:'작가', dev:'프로그래머', cafe:'카페 사장님', gamer:'게이머', librarian:'사서 할머니', composer:'작곡가', cat:'타닥이', grandpa:'할아버지', letter:'할아버지의 편지', me:'' };

  // ---------- 저장 ----------
  const KEY = 'ttalkak.gongbang.v1';
  const DEF = () => ({ intro:false, unlocked:1, stars:{}, parts:{ switch:['brown'], keycap:['pbt'], case:['plastic'] }, artisan:[],
    build:{ switch:'brown', keycap:'pbt', case:'plastic' }, cust:{}, clicks:0, swUse:{}, ended:false, hidden:false,
    daily:{ last:'', streak:0 }, quizBest:0, set:{ vol:80, vib:true, spd:1 }, seen:{}, done:[] });
  let S = DEF();
  try { const v = JSON.parse(localStorage.getItem(KEY)); if (v) S = { ...DEF(), ...v, set:{ ...DEF().set, ...(v.set || {}) } }; } catch(e){}
  let saveT;
  const save = (now) => { clearTimeout(saveT); const f = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch(e){} }; now ? f() : (saveT = setTimeout(f, 400)); };
  Snd.build = S.build; Snd.vol = S.set.vol / 100;
  Snd.onPress = () => { S.clicks++; S.swUse[S.build.switch] = (S.swUse[S.build.switch] || 0) + 1; save(); clicksPill(); };
  const clicksPill = () => { const t = '딸깍 ' + S.clicks.toLocaleString(); $('hub-clicks').textContent = t; $('wb-clicks').textContent = t; };

  // ---------- 공통 ----------
  function buzz(ms){ if (!S.set.vib) return; try { if (navigator.vibrate && (!navigator.userActivation || navigator.userActivation.hasBeenActive)) navigator.vibrate(ms) } catch(e){} }
  function sparks(x, y, n, colors, spread = 42){
    for (let i = 0; i < n; i++){
      const p = document.createElement('div'); p.className = 'spark';
      p.style.background = colors[i % colors.length]; p.style.left = x + 'px'; p.style.top = y + 'px';
      document.body.appendChild(p);
      const a = Math.random() * Math.PI * 2, d = 12 + Math.random() * spread;
      p.animate([{ transform:'translate(-50%,-50%) scale(1)', opacity:1 }, { transform:`translate(calc(-50% + ${Math.cos(a) * d}px),calc(-50% + ${Math.sin(a) * d}px)) scale(.2)`, opacity:0 }],
        { duration:430, easing:'cubic-bezier(.2,.7,.4,1)', fill:'forwards' });
      setTimeout(() => p.remove(), 450);
    }
  }
  let toastT;
  function toast(big, small){ $('toast').innerHTML = big + (small ? `<small>${small}</small>` : ''); $('toast').classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => $('toast').classList.remove('on'), 2200); }
  let cur = 'hub';
  function show(id){ cur = id; document.querySelectorAll('.screen').forEach(s => s.classList.toggle('on', s.id === 's-' + id)); if (id !== 'ending') $('end-exit').style.display = 'none'; }
  function theme(w){
    const t = W[Math.max(0, Math.min(6, w))].theme, r = document.documentElement.style;
    r.setProperty('--bg1', t[0]); r.setProperty('--bg2', t[1]); r.setProperty('--case', t[2]); r.setProperty('--caseEdge', t[3]); r.setProperty('--plate', t[4]);
  }
  function pressable(el, opts = {}){
    let held = false;
    el.addEventListener('pointerdown', () => { held = true; el.classList.add('down'); opts.space ? Snd.space() : Snd.key('press', { step:opts.step || 0, auto:!opts.count }); buzz(5); });
    const up = () => { if (!held) return; held = false; el.classList.remove('down'); if (!opts.space) Snd.key('release', { step:opts.step || 0 }); };
    el.addEventListener('pointerup', up); el.addEventListener('pointerleave', up); el.addEventListener('pointercancel', up);
  }
  const over = (id, on) => $(id).classList.toggle('on', on !== false);
  const pendingW = () => { for (let w = 0; w < 7; w++) if ((S.stars[`${w}-9`] || 0) > 0 && !S.done.includes(w)) return w; return -1; };
  const curWorld = () => { for (let w = 0; w < 7; w++) if (!S.done.includes(w)) return Math.min(w, S.unlocked - 1); return 6; };
  const starsOf = w => Array.from({ length:10 }, (_, i) => S.stars[`${w}-${i}`] || 0).reduce((a, b) => a + b, 0);
  const open = (w, i) => w < S.unlocked && (i === 0 || (S.stars[`${w}-${i - 1}`] || 0) > 0);
  const ALL_SONG = DATA.SONG.flat();
  const songNote = i => ALL_SONG[i % ALL_SONG.length];

  // ---------- 대화 ----------
  let dlgQ = [], dlgDone = null, typing = null;
  function story(lines, done){
    dlgQ = lines.slice(); dlgDone = done; over('dlg'); $('in-skip').style.visibility = 'hidden'; nextLine();
  }
  function nextLine(){
    if (typing){ clearInterval(typing.t); $('dlg-text').textContent = typing.full; typing = null; return; }
    const ln = dlgQ.shift();
    if (!ln){ over('dlg', false); $('in-skip').style.visibility = ''; const d = dlgDone; dlgDone = null; d && d(); return; }
    const [who, mood, text] = ln, box = $('dlg-box');
    box.className = 'paper' + (who === 'letter' ? ' letter' : who === 'me' ? ' me' : '');
    $('dlg-name').textContent = NAME[who] || '';
    const face = $('dlg-face'); face.className = who === 'cat' ? 'cat' : '';
    face.innerHTML = who === 'me' ? '' : who === 'letter' ? Chars.svg('grandpa') : Chars.svg(who, mood || undefined);
    if (who === 'letter') Snd.fx('paper', { gain:.4 });
    if (who === 'cat') Snd.fx('meow', { gain:.55, rate:mood === '놀람' ? 1.15 : 1 });
    const el = $('dlg-text'); el.textContent = '';
    let i = 0; const spd = S.set.spd === 2 ? 14 : 30;
    typing = { full:text, t:setInterval(() => {
      i++; el.textContent = text.slice(0, i);
      const ch = text[i - 1];
      if (ch && ch.trim() && i % 2 === 0) Snd.key('press', { gain:.22, rate:1.15 + Math.random() * .1, auto:true });
      if (i >= text.length){ clearInterval(typing.t); typing = null; if (who === 'letter') Snd.fx('ding', { gain:.35 }); }
    }, spd) };
  }
  $('dlg').addEventListener('click', e => { if (e.target.id === 'dlg-skip') return; nextLine(); });
  $('dlg-skip').addEventListener('click', () => { if (typing){ clearInterval(typing.t); typing = null; } dlgQ = []; nextLine(); });

  // ---------- 공방 장면 ----------
  function scene(w, opts = {}){
    const fit = opts.fit ? 'xMidYMid meet' : 'xMidYMid slice';
    const t = W[w].theme, kc = (DATA.KEYCAP[S.build.keycap] || DATA.KEYCAP.pbt).look;
    const jar = (x, y, cols) => `<g transform="translate(${x} ${y})"><rect x="0" y="6" width="34" height="40" rx="9" fill="#eaf6fb" fill-opacity=".55" stroke="#9fb7c4" stroke-width="2"/><rect x="4" y="0" width="26" height="9" rx="3" fill="#b98a55"/>${cols.map((c, i) => `<rect x="${5 + (i % 3) * 9}" y="${28 - Math.floor(i / 3) * 9}" width="7" height="7" rx="2" fill="${c}"/>`).join('')}</g>`;
    const PAL = ['#ec8f86', '#e3a46a', '#9fd6b9', '#a3c6ee', '#bfaaea', '#f2d064'];
    const keys = Array.from({ length:3 }, (_, r) => Array.from({ length:9 - r }, (_, c) => `<rect x="${92 + c * 15 + r * 6}" y="${214 + r * 11}" width="13" height="9" rx="2.5" fill="${opts.broken && (r * 9 + c) % 3 ? '#8a7353' : kc[0]}" stroke="${kc[3]}" stroke-width="1.2"/>`).join('')).join('');
    return `<svg viewBox="0 0 400 340" preserveAspectRatio="${fit}" xmlns="http://www.w3.org/2000/svg">
      <rect width="400" height="340" fill="${t[1]}"/><rect y="0" width="400" height="190" fill="${t[0]}"/>
      <path d="M0 190 H400" stroke="${t[3]}" stroke-width="4"/><rect y="250" width="400" height="90" fill="#c9a77c"/><path d="M0 250 H400 M0 280 H400 M0 310 H400" stroke="#b58f62" stroke-width="2"/>
      <g transform="translate(26 30)"><rect width="92" height="96" rx="8" fill="#bfe3f2" stroke="#8a6a46" stroke-width="5"/><path d="M46 0 V96 M0 48 H92" stroke="#8a6a46" stroke-width="4"/><circle cx="22" cy="24" r="10" fill="#fff6c9" opacity=".9"/><path d="M8 84 Q24 70 40 84 Q56 72 84 86 V92 H8 Z" fill="#a8cf93" opacity=".8"/></g>
      <rect x="20" y="126" width="104" height="8" rx="3" fill="#8a6a46"/><g transform="translate(36 100)"><rect x="0" y="12" width="24" height="16" rx="4" fill="#c97b5a"/><path d="M12 12 Q4 0 8 -10 M12 12 Q16 -2 22 -6 M12 12 Q12 0 14 -14" stroke="#6aa98a" stroke-width="4" fill="none" stroke-linecap="round"/></g>
      <g transform="translate(150 14)"><rect width="100" height="26" rx="6" fill="#8a6238" stroke="#5e432c" stroke-width="3"/><text x="50" y="18" text-anchor="middle" font-family="Jua,sans-serif" font-size="15" fill="#fff3df">딸깍 공방</text></g>
      <path d="M200 40 V64" stroke="#5a4a40" stroke-width="2"/><path d="M186 76 Q200 58 214 76 Z" fill="#3a2e28"/><ellipse cx="200" cy="80" rx="22" ry="6" fill="#ffe3a6" opacity="${opts.dark ? .1 : .9}"/>
      <rect x="272" y="56" width="112" height="8" rx="3" fill="#8a6a46"/><rect x="272" y="118" width="112" height="8" rx="3" fill="#8a6a46"/>
      ${jar(280, 12, PAL.slice(0, 5))}${jar(318, 12, PAL.slice(2, 6).concat(PAL[0]))}${jar(352, 18, PAL.slice(1, 4))}
      ${jar(284, 74, PAL.slice(3, 6))}${jar(322, 74, PAL.slice(0, 6))}
      <g transform="translate(356 140)"><rect width="34" height="110" rx="4" fill="#a87b52" stroke="#7a5638" stroke-width="3"/><circle cx="8" cy="58" r="3" fill="#e0c07a"/><path d="M17 -6 V4" stroke="#7a5638" stroke-width="2"/><path d="M11 10 Q17 0 23 10 Z" fill="#e0b448"/></g>
      <rect x="40" y="236" width="270" height="14" rx="4" fill="#9a6d43"/><rect x="52" y="250" width="12" height="60" fill="#7a5638"/><rect x="286" y="250" width="12" height="60" fill="#7a5638"/>
      <rect x="84" y="208" width="152" height="38" rx="7" fill="${t[2]}" stroke="${t[3]}" stroke-width="3"/>${keys}
      <g transform="translate(250 204)"><rect width="26" height="30" rx="5" fill="#fff" stroke="#9fb7cf" stroke-width="2.5"/><path d="M26 10 Q36 10 34 18 Q32 24 26 22" fill="none" stroke="#9fb7cf" stroke-width="3"/></g>
    </svg>`;
  }

  // ---------- 공방(허브) ----------
  function hub(arrive){
    if (S.ended && !S.endSeen) return ending();   // 엔딩을 보다가 끊겼으면 이어서
    const w = curWorld(); theme(w); show('hub'); clicksPill();
    $('hub-scene').innerHTML = scene(w) + `<div id="hub-cat">${Chars.svg('cat', '졸림')}</div>` + (S.ended && w === 6 ? '' : `<div id="hub-cust">${Chars.svg(W[w].char, S.done.includes(w) ? '기쁨' : undefined)}</div><div id="hub-bubble">「${W[w].wish}」</div>`);
    if (S.ended && S.done.includes(6)) $('hub-scene').insertAdjacentHTML('beforeend', `<div id="hub-bubble" class="top">모든 손님의 키보드를 완성했어요! 오늘의 의뢰로 공방을 지켜 주세요.</div>`);
    const cat = $('hub-cat');
    cat.addEventListener('pointerdown', () => { cat.innerHTML = Chars.svg('cat', '기쁨'); Snd.fx('meow', { gain:.6 }) || Snd.key('press', { rate:1.4 }); setTimeout(() => cat.innerHTML = Chars.svg('cat', '졸림'), 1200); });
    $('hub-go-sub').textContent = pendingW() === 6 ? '🎼 마지막 이야기를 볼 차례예요' : pendingW() >= 0 ? `🎁 ${W[pendingW()].title}의 키보드를 완성해요` : S.ended && S.done.includes(6) ? '모든 의뢰 완료 · 별 모으기' : `${w + 1}번째 손님 · ${W[w].title}`;
    $('hub-daily-sub').textContent = S.daily.last === today() ? `오늘 완료 ✓ · 연속 ${S.daily.streak}일` : `매일 새 판 · 연속 ${S.daily.streak}일`;
    if (arrive && $('hub-cust')){ $('hub-cust').classList.add('arrive'); Snd.fx('shopbell', { gain:.7 }) || Snd.jingle([12, 16], .12, .08); }
    const after = () => checkHidden();
    if (S.notice){ const n = S.notice; return setTimeout(() => cur === 'hub' && notice(n.title, n.body, n.reward, () => hub()), 300); }
    if (S.midPend !== undefined){              // 5판 대사를 보다가 끊겼으면 이어서
      const mw = S.midPend;
      return setTimeout(() => cur === 'hub' && story(DATA.STORY.w[mw].mid, () => { delete S.midPend; save(true); notice('🎁 새 부품', '', rewardHtml(W[mw].mid), () => hub()); }), 300);
    }
    if (!S.seen['hello' + w] && !(S.ended && w === 6) && !S.done.includes(w)){
      setTimeout(() => { if (cur !== 'hub') return; story(DATA.STORY.w[w].hello, () => { S.seen['hello' + w] = true; save(); after(); }); }, arrive ? 900 : 300);
    } else after();
  }
  $('hub-go').addEventListener('click', () => { if (giving || $('ov-asm').classList.contains('on')) return; const p = pendingW(); if (p >= 0) return p === 6 ? ending() : assemble(p); map(curWorld()); });
  $('hub-wb').addEventListener('click', () => wb());
  $('hub-album').addEventListener('click', () => album());
  $('hub-daily').addEventListener('click', () => daily());
  $('hub-quiz').addEventListener('click', () => quiz());
  $('hub-set').addEventListener('click', () => settings());
  document.querySelectorAll('[data-back]').forEach(b => b.addEventListener('click', () => hub()));
  ['hub-go', 'hub-wb', 'hub-album', 'hub-daily', 'hub-quiz', 'hub-set', 'map-prev', 'map-next', 'pz-pause'].forEach(id => pressable($(id)));
  document.querySelectorAll('[data-back]').forEach(b => pressable(b));

  // ---------- 지도 ----------
  let mapW = 0;
  function map(w){
    mapW = w; theme(w); show('map');
    const Wd = W[w], done = S.done.includes(w);
    $('map-title').textContent = `${w + 1}번째 손님`;
    $('map-stars').textContent = `★ ${starsOf(w)}/30`;
    const gotArt = S.artisan.includes(DATA.ARTISAN[w].id), pend = !done && (S.stars[`${w}-9`] || 0) > 0;
    $('map-cust').innerHTML = `<div class="face">${Chars.svg(Wd.char, done ? '기쁨' : undefined)}</div><div style="flex:1"><b>${Wd.title}</b><small>「${Wd.wish}」<br>${done ? (w === 6 ? '마지막 이야기 완료 ✓' + (gotArt ? ` · 아티산 ${DATA.ARTISAN[w].icon} 받음` : ' · 별 24개를 모으면 아티산 키캡!') : gotArt ? `키보드 완성 ✓ · 아티산 ${DATA.ARTISAN[w].icon} 받음` : '키보드 완성 ✓ · 별 24개를 모으면 아티산 키캡!') : pend ? (w === 6 ? '마지막 판을 깼어요! 「🎼 이야기」를 눌러 마지막 이야기를 보세요.' : '10판을 깼어요! 버튼을 눌러 키보드를 완성해요.') : (w === 6 ? '판을 깨서 부품을 모아요. 5판에서 부품을 받고, 10판을 깨면 마지막 이야기가 열려요.' : '판을 깨서 부품을 모아요. 5판과 10판에서 부품을 받아요.')}</small></div>`
      + (pend ? `<button class="kc btn alt" id="map-finish" style="height:46px;font-size:16px;width:auto;flex:none;padding:0 12px"><span>${w === 6 ? '🎼 이야기' : '🎁 완성'}</span></button>` : '');
    if (pend){ pressable($('map-finish')); $('map-finish').addEventListener('click', () => w === 6 ? ending() : assemble(w)); }
    const path = $('map-path'); path.innerHTML = '';
    let nextSet = false;
    for (let i = 0; i < 10; i++){
      const st = S.stars[`${w}-${i}`] || 0, ok = open(w, i), hard = Wd.levels[i].hard;
      const b = document.createElement('button');
      b.className = 'kc lv' + (i === 9 ? ' boss' : '') + (ok ? '' : ' lock') + (ok && !st && !nextSet ? ' next' : '');
      if (ok && !st) nextSet = true;
      b.innerHTML = `<span>${i === 9 ? '👑' : i + 1}${hard === 2 ? '<i class="fire">🔥</i>' : ''}</span><small>${ok ? '★'.repeat(st) + '☆'.repeat(3 - st) : '🔒'}</small>`;
      pressable(b, { step:i });
      b.addEventListener('click', () => ok ? levelCard(DATA.level(w, i)) : toast('앞 판을 먼저 깨요'));
      path.appendChild(b);
    }
    const rw = r => { const [cat, id] = Object.entries(r)[0]; const P = cat === 'switch' ? DATA.SWITCH[id] : cat === 'keycap' ? DATA.KEYCAP[id] : DATA.CASE[id]; return `${{ switch:'🔊', keycap:'⌨️', case:'🧰' }[cat]} ${P.name}`; };
    $('map-reward').innerHTML = `<div class="sec" style="margin:4px 2px 8px">이 손님에게서 받는 선물</div><div class="paper" style="padding:10px 14px;font-size:14px;line-height:1.9">5판 클리어: <b>${rw(Wd.mid)}</b><br>${Wd.end.length ? '키보드 완성' : '10판 클리어'}: <b>${Wd.end.length ? Wd.end.map(rw).join(', ') : '🎼 마지막 이야기'}</b><br>별 24개: <b>${DATA.ARTISAN[w].icon} 아티산 키캡 「${DATA.ARTISAN[w].name}」</b></div>`;
    $('map-wn').textContent = `${w + 1} / 7`;
    $('map-prev').style.visibility = w > 0 ? '' : 'hidden';
    $('map-next').style.visibility = w < S.unlocked - 1 ? '' : 'hidden';
  }
  $('map-prev').addEventListener('click', () => mapW > 0 && map(mapW - 1));
  $('map-next').addEventListener('click', () => mapW < S.unlocked - 1 && map(mapW + 1));

  // ---------- 판 시작 카드 ----------
  const GLY = ['●', '▲', '■', '◆', '★', '♥'];
  const goalIcon = g => /^c\d$/.test(g) ? `<i class="gi c${g.slice(1)}">${GLY[g.slice(1)]}</i>` : `<i class="gi ob-${g}">${{ crumb:'🍪', stuck:'🔒', coffee:'☕', bug:'🐛' }[g]}</i>`;
  let curL = null, daily_ = false;
  function levelCard(L, isDaily){
    const old = $('lv-extra'); if (old) old.remove();
    curL = L; daily_ = !!isDaily;
    const tmp = Board.create(L, L.seed);
    $('lv-title').textContent = isDaily ? '📅 오늘의 의뢰' : `${L.name}${L.hard === 3 ? ' 👑 마지막 판' : L.hard === 2 ? ' 🔥 어려움' : ''}`;
    $('lv-moves').textContent = `이동 ${L.moves}`;
    $('lv-goals').innerHTML = Object.entries(tmp.goals).map(([g, n]) => `<div>${goalIcon(g)}${n}</div>`).join('');
    const extra = {}; tmp.keys.forEach(k => { if (k.ob && tmp.goals[k.ob.t] === undefined) extra[k.ob.t] = (extra[k.ob.t] || 0) + 1; });
    const ICON = { crumb:'🍪', stuck:'🔒', coffee:'☕', bug:'🐛' };
    if (Object.keys(extra).length) $('lv-goals').insertAdjacentHTML('afterend', `<div class="stat" id="lv-extra">방해물: ${Object.entries(extra).map(([t, n]) => ICON[t] + ' ' + n).join(' · ')}</div>`);
    $('lv-tip').textContent = L.tip || '';
    const sw = DATA.SWITCH[S.build.switch], kc = DATA.KEYCAP[S.build.keycap], sk = DATA.SKILL[kc.skill];
    $('lv-build').innerHTML = `<span class="chip">🔊 ${sw.name}</span><span class="chip">⌨️ ${kc.name}</span><span class="chip">✨ 기술: ${sk.name}</span>`;
    over('ov-level');
  }
  $('lv-start').addEventListener('click', () => { over('ov-level', false); play(curL); });
  $('lv-close').addEventListener('click', () => { over('ov-level', false); if (cur === 'puzzle'){ Game.stop(); daily_ ? hub() : map(curL.w); } });
  ['lv-start', 'lv-close', 'rs-next', 'rs-retry', 'rs-map', 'ps-resume', 'ps-retry', 'ps-map', 'set-close', 'set-intro', 'set-reset', 'asm-try', 'asm-give', 'msg-ok', 'msg-alt', 'qz-play'].forEach(id => pressable($(id)));

  let curFrom;
  function play(L, from){
    curL = L; curFrom = from; if (from === 'intro') daily_ = false;
    theme(L.w); show('puzzle');
    $('pz-hint').textContent = L.tip || '';
    requestAnimationFrame(() => Game.start(L, { song:L.w === 6 && L.i === 9, onEnd:r => result(L, r, from) }));
  }

  // ---------- 결과 ----------
  let nextAct = null;
  function result(L, r, from){
    const key = `${L.w}-${L.i}`, first = !(S.stars[key] > 0);
    $('rs-reward').innerHTML = '';
    nextAct = null;
    if (r.win){
      if (!daily_){ S.stars[key] = Math.max(S.stars[key] || 0, r.star); save(true); }
      $('rs-title').textContent = daily_ ? '오늘의 의뢰 완료!' : `${L.name} 완성!`;
      $('rs-stars').innerHTML = [1, 2, 3].map(i => `<span class="${i <= r.star ? '' : 'off'}">⭐</span>`).join('');
      $('rs-stat').innerHTML = `남은 이동 ${r.left}번` + (r.star < 3 && !daily_ ? `<br><small>이동을 더 아끼면 별이 늘어요</small>` : '');
      const rewards = [];
      if (daily_){ dailyWin(); }
      else {
        if (first && L.i === 4) rewards.push(W[L.w].mid);
        rewards.forEach(give);
        $('rs-reward').innerHTML = rewards.map(rewardHtml).join('');
      }
      $('rs-next').style.display = '';
      const finishW = L.i === 9 && !S.done.includes(L.w);
      $('rs-next').querySelector('span').textContent = daily_ || from === 'intro' ? '공방으로' : finishW ? (L.w === 6 ? '🎼 마지막 이야기로' : '🎁 키보드 완성하러 가기') : L.i < 9 ? '다음 판' : '지도로';
      nextAct = () => {
        if (daily_) return hub();
        if (from === 'intro'){ S.intro = true; save(true); return hub(true); }
        if (L.i === 9 && !S.done.includes(L.w)) return L.w === 6 ? ending() : assemble(L.w);
        if (L.i < 9) return levelCard(DATA.level(L.w, L.i + 1));
        map(L.w);
      };
    } else {
      $('rs-title').textContent = r.reason === 'coffee' ? '커피가 키보드를 덮었어요!' : '이동 횟수를 다 썼어요';
      $('rs-stars').innerHTML = '';
      $('rs-stat').innerHTML = r.reason === 'coffee' ? '커피를 하나도 못 닦은 턴에는 한 칸 번져요. 커피 옆 키캡을 먼저 터뜨려 보세요.' : '길게 잇고, 기능 키와 기술을 써 보세요.';
      $('rs-next').style.display = 'none';
    }
    $('rs-map').querySelector('span').textContent = daily_ || from === 'intro' ? '공방으로' : '지도로';
    $('rs-map').style.display = r.win && $('rs-next').querySelector('span').textContent === $('rs-map').querySelector('span').textContent ? 'none' : '';
    const showRes = () => { over('ov-result'); if (r.win && !daily_) artCheck(L.w, true); };
    if (r.win && !daily_ && first && L.i === 4){ S.midPend = L.w; save(true); story(DATA.STORY.w[L.w].mid, () => { delete S.midPend; save(true); showRes(); }); }
    else showRes();
  }
  $('rs-next').addEventListener('click', () => { over('ov-result', false); Game.stop(); nextAct && nextAct(); });
  $('rs-retry').addEventListener('click', () => { over('ov-result', false); play(curL, curFrom); });
  $('rs-map').addEventListener('click', () => { over('ov-result', false); Game.stop(); if (curFrom === 'intro' || !S.intro){ S.intro = true; save(true); return hub(true); } daily_ ? hub() : map(curL.w); });

  // ---------- 부품 주기 ----------
  function give(r){
    const [cat, id] = Object.entries(r)[0];
    if (!S.parts[cat].includes(id)){ S.parts[cat].push(id); save(true); }
  }
  function rewardHtml(r){
    const [cat, id] = Object.entries(r)[0];
    const P = cat === 'switch' ? DATA.SWITCH[id] : cat === 'keycap' ? DATA.KEYCAP[id] : DATA.CASE[id];
    const label = { switch:'새 스위치', keycap:'새 키캡', case:'새 몸체' }[cat];
    const extra = cat === 'keycap' ? ` · 기술 「${DATA.SKILL[P.skill].name}」` : '';
    return `<div><span class="ico">${{ switch:'🔊', keycap:'⌨️', case:'🧰' }[cat]}</span><span><b>${label}: ${P.name}</b>${P.desc}${extra}</span></div>`;
  }
  const artHtml = a => `<div><span class="ico">${a.icon}</span><span><b>아티산 키캡: ${a.name}</b>이 손님 판에서 별 24개를 모았어요. 「내 키보드」에서 끼울 수 있어요</span></div>`;
  function artCheck(w, quiet, silent){
    const a = DATA.ARTISAN[w];
    if (S.done.includes(w) && starsOf(w) >= 24 && !S.artisan.includes(a.id)){
      S.artisan.push(a.id); save(true);
      if (silent) return a;
      if ($('rs-reward') && $('ov-result').classList.contains('on')) $('rs-reward').insertAdjacentHTML('beforeend', artHtml(a));
      else setTimeout(() => toast(`${a.icon} 아티산 키캡 「${a.name}」!`, `${w + 1}번째 손님 판에서 별 24개를 모았어요`), quiet ? 600 : 0);
      Snd.chime();
      return a;
    }
    return null;
  }

  // ---------- 손님 키보드 완성 ----------
  let asm = null;
  function assemble(w){
    theme(w);
    const tags = W[w].wishTags;
    asm = { w, b:{ ...S.build } };
    // 바라는 부품을 가지고 있으면 미리 골라 둠
    for (const cat of ['switch', 'keycap', 'case']) (tags[cat] || []).forEach(id => { if (S.parts[cat].includes(id)) asm.b[cat] = id; });
    $('asm-title').textContent = `${W[w].title}의 키보드`;
    $('asm-wish').innerHTML = `「${W[w].wish}」<br><small>♥ 표시는 손님이 좋아할 것 같은 부품이에요</small>`;
    drawAsm();
    show('hub'); $('hub-go-sub').textContent = `🎁 ${W[w].title}의 키보드를 완성해요`; $('hub-scene').innerHTML = scene(w) + `<div id="hub-cat">${Chars.svg('cat', '기쁨')}</div><div id="hub-cust">${Chars.svg(W[w].char)}</div>`;
    story([['me', '', '모은 부품으로 손님의 키보드를 조립하자.']], () => over('ov-asm'));
  }
  function drawAsm(){
    const tags = W[asm.w].wishTags;
    $('asm-body').innerHTML = [['switch', '스위치', DATA.SWITCH], ['keycap', '키캡', DATA.KEYCAP], ['case', '몸체', DATA.CASE]].map(([cat, label, T]) =>
      `<div class="sec" style="margin:10px 2px 6px">${label}</div><div style="display:flex;gap:6px;flex-wrap:wrap">` +
      S.parts[cat].map(id => `<button class="part${asm.b[cat] === id ? ' sel' : ''}" data-c="${cat}" data-id="${id}" style="padding:7px 10px"><b style="font-size:14px">${(tags[cat] || []).includes(id) ? '♥ ' : ''}${T[id].name}</b></button>`).join('') + '</div>').join('');
    $('asm-body').querySelectorAll('.part').forEach(b => b.addEventListener('click', () => { asm.b[b.dataset.c] = b.dataset.id; drawAsm(); phrase(asm.b, 4); }));
  }
  function phrase(b, n = 8){
    const notes = [0, 4, 7, 12, 7, 4, 5, 2].slice(0, n);
    notes.forEach((s, i) => { Snd.key('press', { step:s, b, delay:i * .16, auto:true }); Snd.key('release', { step:s, b, delay:i * .16 + .08, gain:.8 }); });
  }
  $('asm-try').addEventListener('click', () => phrase(asm.b));
  pressable($('asm-later'));
  $('asm-later').addEventListener('click', () => { over('ov-asm', false); hub(); });
  let giving = false;
  $('asm-give').addEventListener('click', () => {
    if (giving) return; giving = true;
    over('ov-asm', false); over('ov-block');
    $('hub-go-sub').textContent = '손님이 키보드를 살펴보고 있어요…';
    const w = asm.w, tags = W[w].wishTags;
    S.cust[w] = { ...asm.b };
    const match = Object.entries(tags).some(([cat, ids]) => ids.includes(asm.b[cat]));
    phrase(asm.b);
    setTimeout(() => { over('ov-block', false); story(DATA.STORY.w[w][match ? 'match' : 'nomatch'], () => {
      if (!S.done.includes(w)) S.done.push(w);
      S.unlocked = Math.max(S.unlocked, Math.min(7, w + 2)); save(true);
      W[w].end.forEach(give);
      Snd.win();
      const art = artCheck(w, true, true);
      giving = false;
      notice('🎁 손님이 고마워하며 선물을 줬어요', match ? '손님이 아주 만족했어요!' : '', W[w].end.map(rewardHtml).join('') + (art ? artHtml(art) : ''), () => hub(true));
    }); }, 1500);
  });
  function notice(title, body, reward, after){
    S.notice = { title, body, reward }; save(true);
    msg(title, body, reward, () => { delete S.notice; save(true); after && after(); });
  }
  function msg(title, body, reward, ok, alt){
    $('msg-title').textContent = title; $('msg-body').innerHTML = body || ''; $('msg-reward').innerHTML = reward || '';
    $('msg-ok').onclick = () => { over('ov-msg', false); ok && ok(); };
    $('msg-alt').style.display = alt ? '' : 'none';
    if (alt){ $('msg-alt').querySelector('span').textContent = alt[0]; $('msg-alt').onclick = () => { over('ov-msg', false); alt[1](); }; }
    over('ov-msg');
  }

  // ---------- 일시정지 ----------
  function pause(){
    if (cur !== 'puzzle' || !Game.G || Game.G.over || $('ov-pause').classList.contains('on')) return;
    Game.cancel(); Snd.paused = true; $('ps-map').querySelector('span').textContent = curFrom === 'intro' || daily_ ? '공방으로' : '지도로'; over('ov-pause');
  }
  $('pz-pause').addEventListener('click', pause);
  document.addEventListener('visibilitychange', () => { if (document.hidden){ save(true); pause(); } });
  window.addEventListener('pagehide', () => save(true));
  $('ps-resume').addEventListener('click', () => { over('ov-pause', false); Snd.paused = false; });
  $('ps-retry').addEventListener('click', () => { over('ov-pause', false); over('ov-result', false); Game.stop(); Snd.paused = false; play(curL, curFrom); });
  $('ps-map').addEventListener('click', () => { over('ov-pause', false); over('ov-result', false); Snd.paused = false; Game.stop(); if (curFrom === 'intro'){ S.intro = true; save(true); return hub(true); } daily_ ? hub() : map(curL.w); });

  // ---------- 내 키보드 ----------
  let wbTab = 'switch';
  const WHERE = { switch:{ red:'1번째 손님 5판', typewriter:'2번째 손님 5판', blue:'2번째 손님 완성', laptop:'3번째 손님 5판', thock:'3번째 손님 완성', topre:'4번째 손님 완성', alps:'5번째 손님 완성', oldpc:'6번째 손님 5판', ibm:'6번째 손님 완성', grandpa:'???' },
    keycap:{ wood:'1번째 손님 완성', typekey:'2번째 손님 완성', ceramic:'4번째 손님 5판', metal:'5번째 손님 5판', resin:'6번째 손님 완성', gold:'7번째 손님 5판' }, case:{ wood:'1번째 손님 완성', alu:'3번째 손님 완성' } };
  function wb(){
    show('wb'); clicksPill(); drawKb(); drawTabs(); drawList();
  }
  function drawKb(){
    const kc = DATA.KEYCAP[S.build.keycap].look, art = DATA.ARTISAN.find(a => a.id === S.build.artisan);
    const kb = $('wb-kb'); kb.className = S.build.case === 'plastic' ? '' : S.build.case;
    const rows = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'];
    kb.innerHTML = rows.map((r, ri) => `<div class="wbrow">${(ri === 0 ? [art ? art.icon : 'Esc', ...r.slice(1)] : [...r]).map(ch => `<button class="kc wk"><span${ch.length > 1 && !art ? ' style="font-size:13px"' : ''}>${ch}</span></button>`).join('')}</div>`).join('')
      + `<div class="wbrow"><button class="kc wk wide" data-space="1"><span>space</span></button></div>`;
    kb.querySelectorAll('.wk').forEach(b => {
      b.style.setProperty('--cap', kc[0]); b.style.setProperty('--capDish', kc[1]); b.style.setProperty('--capSkirt', kc[2]); b.style.setProperty('--capEdge', kc[3]);
      if (S.build.keycap === 'typekey') b.style.setProperty('--legend', '#fdfbf5');
      pressable(b, { space:!!b.dataset.space, count:true });
    });
  }
  function drawTabs(){
    $('wb-tabs').innerHTML = [['switch', '스위치'], ['keycap', '키캡'], ['case', '몸체'], ['artisan', '아티산']].map(([id, n]) => `<button class="kc tab${wbTab === id ? ' on' : ''}" data-t="${id}"><span>${n}</span></button>`).join('');
    $('wb-tabs').querySelectorAll('.tab').forEach(b => b.addEventListener('click', () => { wbTab = b.dataset.t; drawTabs(); drawList(); Snd.key('press', { rate:1.1, gain:.6, auto:true }); }));
  }
  function drawList(){
    const L = $('wb-list');
    if (wbTab === 'artisan'){
      L.innerHTML = DATA.ARTISAN.map((a, w) => { const own = S.artisan.includes(a.id);
        return `<button class="part${own ? '' : ' lock'}${S.build.artisan === a.id ? ' sel' : ''}" data-id="${a.id}"><b>${own ? a.icon + ' ' + a.name : '?'}</b>${own ? 'Esc 자리에 끼워요' : `${w + 1}번째 손님 판에서 별 24개`}</button>`; }).join('');
      L.querySelectorAll('.part').forEach(b => b.addEventListener('click', () => { if (!S.artisan.includes(b.dataset.id)) return; S.build.artisan = S.build.artisan === b.dataset.id ? null : b.dataset.id; save(); drawKb(); drawList(); Snd.chime(); }));
      return;
    }
    const T = wbTab === 'switch' ? DATA.SWITCH : wbTab === 'keycap' ? DATA.KEYCAP : DATA.CASE;
    L.innerHTML = Object.entries(T).filter(([id]) => id !== 'grandpa' || S.parts.switch.includes('grandpa')).map(([id, P]) => {
      const own = S.parts[wbTab].includes(id), sel = S.build[wbTab] === id;
      const sw = wbTab === 'keycap' ? `<i class="sw" style="background:${P.look[2]};box-shadow:inset 0 -3px 0 ${P.look[3]}"></i>` : '';
      const extra = wbTab === 'keycap' && own ? `<br>✨ ${DATA.SKILL[P.skill].name}: ${DATA.SKILL[P.skill].desc}` : '';
      return `<button class="part${own ? '' : ' lock'}${sel ? ' sel' : ''}" data-id="${id}"><b>${own ? sw + P.name : '🔒 ?'}</b>${own ? P.desc + extra : '얻는 곳: ' + (WHERE[wbTab][id] || '')}</button>`;
    }).join('');
    L.querySelectorAll('.part').forEach(b => b.addEventListener('click', () => {
      const id = b.dataset.id; if (!S.parts[wbTab].includes(id)){ Snd.key('press', { gain:.4, rate:.9, auto:true }); return; }
      S.build[wbTab] = id; Snd.build = S.build; save(); drawKb(); drawList(); phrase(S.build, 5);
    }));
  }

  // ---------- 도감 ----------
  function album(){
    show('album');
    const nParts = S.parts.switch.length + S.parts.keycap.length + S.parts.case.length, tot = (Object.keys(DATA.SWITCH).length - (S.parts.switch.includes('grandpa') ? 0 : 1)) + Object.keys(DATA.KEYCAP).length + Object.keys(DATA.CASE).length;
    $('al-count').textContent = `부품 ${nParts}/${tot}`;
    const totalStars = Object.values(S.stars).reduce((a, b) => a + b, 0);
    const fav = Object.entries(S.swUse).sort((a, b) => b[1] - a[1])[0];
    $('al-body').innerHTML =
      `<div class="sec">손님 앨범</div><div class="albumGrid">${W.map((Wd, w) => { const met = S.seen['hello' + w], done = S.done.includes(w);
        return `<div class="cell${met ? '' : ' lock'}">${met ? Chars.svg(Wd.char, done ? '기쁨' : undefined) : '<span class="big">?</span>'}<b>${met ? NAME[Wd.char] : '???'}</b>${done ? '완성 ✓' : met ? '의뢰 중' : ''}</div>`; }).join('')}
        <div class="cell"><div>${Chars.svg('cat', '기쁨')}</div><b>타닥이</b>공방 고양이</div></div>
       <div class="sec">아티산 키캡</div><div class="albumGrid">${DATA.ARTISAN.map(a => S.artisan.includes(a.id) ? `<div class="cell"><span class="big">${a.icon}</span><b>${a.name}</b></div>` : `<div class="cell lock"><span class="big">?</span>별 24개</div>`).join('')}</div>
       <div class="sec">기록</div><div class="paper" style="padding:12px 14px;font-size:14px;line-height:1.9">
         딸깍 누른 횟수: <b>${S.clicks.toLocaleString()}</b>번<br>모은 별: <b>${totalStars}</b> / 210<br>가장 많이 쓴 스위치: <b>${fav ? DATA.SWITCH[fav[0]].name : '-'}</b><br>소리 맞히기 최고 연속: <b>${S.quizBest}</b>번<br>오늘의 의뢰 연속: <b>${S.daily.streak}</b>일</div>
       <div class="sec">놀이 방법</div><div class="paper" style="padding:12px 14px;font-size:13.5px;line-height:1.85">• 같은 색 키캡을 손가락으로 이어요(대각선도 돼요). 한 칸 뒤로 가면 취소돼요.<br>• 6개 이상 이은 줄을 그 줄 안의 키캡으로 다시 이어 닫으면 「고리」: 그 색이 모두 터져요.<br>• 6개 이상 이으면 마지막 자리에 반짝 키캡이 생겨요. 터질 때 주변도 터져요.<br>• 글자가 적힌 기능 키(Esc·Tab·⌫·⏎·⇧·space)는 어느 색 줄에나 끼울 수 있어요: 스페이스바(가로줄), 엔터(주변), 시프트(목표 2배), 백스페이스(방해물 3개), 탭(줄 색 밀기), Esc(이동 +3, 그 수는 이동을 쓰지 않음, 한 판에 한 번). 쓰고 나면 3턴 쉬어요.<br>• 🍪 부스러기·☕ 커피는 옆에서 터뜨려 치워요. 커피는 못 닦은 턴에 한 칸 번지고, 판 절반을 덮으면 실패예요. 🔒 뻑뻑한 키는 두 번, 🐛 버그는 두 번 맞혀야 해요(처음엔 도망가요). 버그가 지나간 자리엔 부스러기가 남아요.<br>• 🐈 고양이 타닥이가 가끔 한 줄을 휘젓고 지나가며 색을 바꿔요.<br>• 길게 이을수록 키캡 기술이 충전돼요. 이동 횟수 안에 목표를 채우면 성공이에요.</div>
       <div class="sec">이야기 다시 보기</div><div style="display:grid;gap:10px">
         <button class="kc btn" id="al-intro"><span>📜 할아버지의 편지</span></button>
         ${S.ended ? '<button class="kc btn" id="al-end"><span>🎼 엔딩 합주</span></button>' : ''}
         ${S.hidden ? '<button class="kc btn" id="al-hidden"><span>🐈 할아버지의 서랍</span></button>' : ''}</div>`;
    pressable($('al-intro')); $('al-intro').addEventListener('click', () => story(DATA.STORY.intro, () => {}));
    if ($('al-end')){ pressable($('al-end')); $('al-end').addEventListener('click', () => ending(true)); }
    if ($('al-hidden')){ pressable($('al-hidden')); $('al-hidden').addEventListener('click', () => story(DATA.STORY.hidden, () => {})); }
  }

  // ---------- 소리 맞히기 ----------
  let qz = null;
  function quiz(){
    const own = S.parts.switch.filter(id => id !== 'grandpa');
    if (own.length < 2) return msg('소리 맞히기', '스위치를 2개 이상 모으면 열려요.<br>1번째 손님 5판에서 「적축」을 받을 수 있어요.', '');
    show('quiz'); qz = { streak:0, tok:Math.random() }; $('qz-score').textContent = '연속 0'; ask();
  }
  function ask(){
    const own = S.parts.switch.filter(id => id !== 'grandpa');
    const ans = own[Math.floor(Math.random() * own.length)];
    const opts = [ans, ...own.filter(x => x !== ans).sort(() => Math.random() - .5).slice(0, 2)].sort(() => Math.random() - .5);
    qz.ans = ans; qz.lock = false;
    $('qz-opts').innerHTML = opts.map(id => `<button class="kc btn" data-id="${id}"><span>${DATA.SWITCH[id].name}</span></button>`).join('');
    $('qz-opts').querySelectorAll('.btn').forEach(b => b.addEventListener('click', () => {
      if (qz.lock) return; qz.lock = true;
      const ok = b.dataset.id === qz.ans;
      b.classList.add(ok ? 'right' : 'wrong');
      if (!ok) $('qz-opts').querySelector(`[data-id="${qz.ans}"]`).classList.add('right');
      qz.streak = ok ? qz.streak + 1 : 0; if (qz.streak > S.quizBest){ S.quizBest = qz.streak; save(); }
      $('qz-score').textContent = `연속 ${qz.streak}`;
      ok ? Snd.jingle([0, 7, 12], .07, .08) : Snd.jingle([4, 0], .1, .07);
      const tok = qz.tok; setTimeout(() => cur === 'quiz' && qz.tok === tok && ask(), 1100);
    }));
    setTimeout(() => cur === 'quiz' && hear(), 250);
  }
  function hear(){ const b = { ...S.build, switch:qz.ans, keycap:'pbt', case:'plastic' }; [0, .2, .4].forEach((d, i) => { Snd.key('press', { b, delay:d, auto:true }); Snd.key('release', { b, delay:d + .09 }); }); }
  $('qz-play').addEventListener('click', () => qz && hear());

  // ---------- 오늘의 의뢰 ----------
  function today(){ const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; }
  function daily(){
    const t = today(); let h = 0; for (const ch of t) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    const w = h % Math.max(1, S.unlocked), i = (h >>> 4) % 9;
    const L = DATA.level(w, i); L.seed = h; L.name = '오늘'; L.tip = `오늘의 의뢰 · ${W[w].title}의 판을 바꾼 특별 판`;
    levelCard(L, true);
  }
  function dailyWin(){
    const t = today(); if (S.daily.last === t) return;
    const y = new Date(Date.now() - 864e5), ys = `${y.getFullYear()}-${y.getMonth() + 1}-${y.getDate()}`;
    S.daily.streak = S.daily.last === ys ? S.daily.streak + 1 : 1; S.daily.last = t; save(true);
    $('rs-reward').innerHTML = `<div><span class="ico">📅</span><span><b>연속 ${S.daily.streak}일째!</b>내일 또 새 의뢰가 와요</span></div>`;
  }

  // ---------- 설정 ----------
  function settings(){
    $('set-vol').value = S.set.vol;
    $('set-vib').querySelector('span').textContent = S.set.vib ? '켬' : '끔';
    $('set-spd').querySelector('span').textContent = S.set.spd === 2 ? '빠름' : '보통';
    over('ov-set');
  }
  $('set-vol').addEventListener('input', e => { S.set.vol = +e.target.value; Snd.vol = S.set.vol / 100; save(); });
  $('set-vol').addEventListener('change', () => { Snd.key('press', { auto:true }); Snd.key('release', { delay:.08 }); });
  $('set-vib').addEventListener('click', () => { S.set.vib = !S.set.vib; save(); settings(); buzz(20); });
  $('set-spd').addEventListener('click', () => { S.set.spd = S.set.spd === 2 ? 1 : 2; save(); settings(); });
  pressable($('set-vib')); pressable($('set-spd'));
  $('set-close').addEventListener('click', () => over('ov-set', false));
  $('set-intro').addEventListener('click', () => { over('ov-set', false); intro(true); });
  $('set-reset').addEventListener('click', () => { over('ov-set', false); msg('처음부터 새로 할까요?', '모은 별과 부품, 기록이 모두 지워져요.', '', () => {}, ['네, 지울게요', () => { S = DEF(); save(true); Snd.build = S.build; location.reload(); }]); $('msg-ok').querySelector('span').textContent = '아니요'; });
  const okLabel = () => $('msg-ok').querySelector('span').textContent = '좋아요';
  $('msg-ok').addEventListener('click', okLabel);

  // ---------- 인트로 ----------
  let inStep = 0, inReplay = false, inGen = 0;
  function intro(replay){
    inGen++; inPress = 0; document.querySelectorAll('#s-intro .tmp').forEach(e => e.remove());
    inReplay = !!replay; inStep = 0; show('intro'); theme(0);
    $('in-scene').innerHTML = '';
    $('in-dark').style.opacity = 1;
    $('in-key').style.display = 'none'; $('in-key').classList.remove('glow');
    $('in-msg').innerHTML = '🎧 소리를 켜면 더 좋아요<br>아이폰은 무음 모드를 꺼 주세요<br><br><b style="font-family:Jua;font-size:18px">화면을 눌러 시작</b>';
  }
  $('s-intro').addEventListener('click', e => {
    if (e.target.closest('#in-skip') || e.target.closest('#in-key')) return;
    if (inStep !== 0) return;
    inStep = 1;
    $('in-scene').innerHTML = `<div style="position:absolute;inset:0">${scene(0, { broken:true, dark:true, fit:innerWidth > innerHeight })}</div>`;
    $('in-dark').style.opacity = .94;
    $('in-key').style.display = ''; $('in-key').classList.add('glow');
    $('in-msg').textContent = '어두운 공방. 키보드에 키캡이 딱 하나 남아 있다. 눌러 볼까?';
  });
  let inPress = 0;
  pressable($('in-key'));
  $('in-key').addEventListener('click', () => {
    inPress++;
    const op = [.94, .7, .45, .2, 0][Math.min(4, inPress)];
    $('in-dark').style.opacity = op;
    Snd.tone(1046 + inPress * 100, .15, .05);
    if (inPress === 1) $('in-msg').textContent = '딸깍. 불이 하나 켜졌다. 한 번 더…';
    if (inPress === 3) $('in-msg').textContent = '딸깍, 딸깍. 공방이 깨어나고 있다.';
    if (inPress >= 4){
      $('in-key').style.display = 'none'; $('in-msg').textContent = '';
      const g = inGen; setTimeout(() => g === inGen && cur === 'intro' && story(DATA.STORY.intro, catJump), 500);
    }
  });
  function catJump(){
    const g = inGen;
    const c = document.createElement('div');
    c.className = 'tmp'; c.style.cssText = 'position:absolute;left:30%;bottom:20%;width:34%;z-index:5';
    c.innerHTML = Chars.svg('cat', '놀람'); $('s-intro').appendChild(c);
    c.animate([{ transform:'translate(-120%, 60%) scale(.8)' }, { transform:'translate(0,-40%) scale(1.05)', offset:.6 }, { transform:'none' }], { duration:700, easing:'ease-out' });
    setTimeout(() => {
      for (let i = 0; i < 12; i++){
        const k = document.createElement('div'); k.className = 'kc tmp c' + (i % 6); k.style.cssText = 'position:absolute;left:45%;top:62%;width:30px;height:30px;z-index:6';
        k.innerHTML = `<span style="font-size:12px">${GLY[i % 6]}</span>`; $('s-intro').appendChild(k);
        const a = -Math.PI * (0.1 + Math.random() * .8), d = 90 + Math.random() * 120;
        k.animate([{ transform:'none' }, { transform:`translate(${Math.cos(a) * d}px,${Math.sin(a) * d * .6 + 160}px) rotate(${Math.random() * 720 - 360}deg)` }], { duration:900, easing:'cubic-bezier(.2,.6,.4,1)', fill:'forwards' });
        Snd.key('press', { step:i % 8, delay:i * .045, gain:.8, auto:true });
      }
      buzz([20, 30, 20]);
    }, 450);
    setTimeout(() => g === inGen && story(DATA.STORY.catJump, () => {
      document.querySelectorAll('#s-intro .tmp').forEach(e => e.remove());
      inPress = 0;
      if (inReplay) return hub();
      play(DATA.level(0, 0), 'intro');
    }), 1500);
  }
  $('in-skip').addEventListener('click', () => { inGen++; if ($('dlg').classList.contains('on')){ dlgQ = []; dlgDone = null; over('dlg', false); } inPress = 0; document.querySelectorAll('#s-intro .tmp').forEach(e => e.remove()); if (!inReplay){ S.intro = true; save(true); } hub(!inReplay); });

  // ---------- 숨은 엔딩 ----------
  function checkHidden(){
    if (S.ended && S.endSeen && !S.hidden && S.artisan.length >= 7){
      setTimeout(() => cur === 'hub' && story(DATA.STORY.hidden, () => {
        S.hidden = true; give({ switch:'grandpa' }); save(true);
        notice('🎁 할아버지 스위치', '세상에 하나뿐인 소리를 얻었어요. 「내 키보드」에서 끼워 보세요.', rewardHtml({ switch:'grandpa' }));
      }), 600);
    }
  }

  // ---------- 엔딩 ----------
  let endGen = 0, crTimer = 0;
  function ending(replay){
    endGen++; clearInterval(crTimer);
    $('end-exit').style.display = replay || S.endSeen ? '' : 'none';
    if (!S.ended){ S.ended = true; if (!S.done.includes(6)) S.done.push(6); save(true); }
    artCheck(6, true, true);
    $('end-bg').innerHTML = scene(6, { fit:innerWidth > innerHeight }); $('end-bg').style.opacity = '';
    show('ending'); theme(6);
    $('end-stage').innerHTML = ''; $('end-stage').style.opacity = 1; $('end-title').style.opacity = 0; $('credits').classList.remove('on'); $('end-key').classList.remove('on');
    const go = () => story(DATA.STORY.finale, ensemble);
    story(DATA.STORY.ending, go);
  }
  function ensemble(){
    const eg = endGen;
    const order = ['student', 'writer', 'dev', 'cafe', 'gamer', 'librarian', 'composer'];
    order.forEach((c, i) => setTimeout(() => {
      if (eg !== endGen) return;
      const d = document.createElement('div'); d.className = 'who'; d.innerHTML = Chars.svg(c, c === 'composer' ? '기쁨' : '기쁨');
      $('end-stage').appendChild(d); d.animate([{ transform:'translateY(40px)', opacity:0 }, { transform:'none', opacity:1 }], { duration:400, easing:'ease-out' });
      Snd.fx('shopbell', { gain:.35, rate:1 + i * .05 }) || Snd.tone(1318, .2, .04);
    }, i * 380));
    const start = order.length * 380 + 900, step = 420;
    let t = start;
    DATA.SONG.forEach((ph, p) => {
      const b = p === 6 ? { switch:'typewriter', keycap:'gold', case:'wood' } : (S.cust[p] || { switch:'brown', keycap:'pbt', case:'plastic' });
      ph.forEach((s, n) => {
        setTimeout(() => {
          if (eg !== endGen) return;
          const who = $('end-stage').children[p]; if (!who) return;
          who.classList.add('play'); setTimeout(() => who.classList.remove('play'), 200);
          Snd.note(s, { b, len:.5 });
          const r = who.getBoundingClientRect(); sparks(r.left + r.width / 2, r.top, 5, ['#ffd166', '#fff', '#ff8fab'], 40);
        }, t);
        t += step;
      });
      t += 260;
    });
    setTimeout(() => eg === endGen && story(DATA.STORY.lastKey, () => { $('end-key').classList.add('on'); $('end-key').classList.add('glow'); }), t + 400);
  }
  pressable($('end-key'));
  pressable($('end-exit'));
  $('end-exit').addEventListener('click', () => { endGen++; clearInterval(crTimer); if (typing){ clearInterval(typing.t); typing = null; } dlgQ = []; dlgDone = null; over('dlg', false); over('ov-msg', false); $('in-skip').style.visibility = ''; $('end-key').classList.remove('on'); hub(); });
  $('end-key').addEventListener('click', () => {
    $('end-key').classList.remove('on');
    for (let p = 0; p < 7; p++){ const b = p === 6 ? { switch:'typewriter', keycap:'gold', case:'wood' } : (S.cust[p] || {}); Snd.note(DATA.SONG_LAST + (p % 2 ? 12 : 0), { b, gain:.6, len:1.2 }); }
    Snd.jingle([0, 4, 7, 12, 16, 19, 24], .09, .1);
    [...$('end-stage').children].forEach(w => w.classList.add('play'));
    sparks(innerWidth / 2, innerHeight * .35, 40, ['#ffd166', '#fff', '#ff8fab', '#a3c6ee'], 160);
    $('end-title').textContent = '♪ 딸깍 ♪'; $('end-title').style.opacity = 1;
    const eg = endGen;
    setTimeout(() => { if (eg !== endGen) return; [...$('end-stage').children].forEach(w => w.classList.remove('play')); story(DATA.STORY.letter2, credits); }, 2200);
  });
  function credits(){
    $('end-title').style.opacity = 0; $('end-stage').style.opacity = .18; $('end-bg').style.opacity = 0;
    S.ended = true; S.endSeen = true; if (!S.done.includes(6)) S.done.push(6); save(true); artCheck(6, true);
    $('credits').classList.add('on');
    const lines = ['딸깍 공방', '', '만든 곳 — 달빛 오락실', '', '키보드 소리를 녹음해 나눠 준 분들', ...(window.SOUND_CREDITS || 'StavSounds').split(' · ').reduce((a, n, i) => { if (i % 4 === 0) a.push(n); else a[a.length - 1] += ' · ' + n; return a; }, []), '(모든 소리는 공개 녹음을 썼어요)', '', '공방 고양이 — 타닥이', '', '그리고, 딸깍을 눌러 준 당신에게', '고맙습니다.'];
    const text = lines.join('\n'); let i = 0;
    $('cr-text').textContent = '';
    $('cr-kb').innerHTML = [0, 4, 7, 9, 12].map((s, i) => `<button class="kc c${i}" data-s="${s}"><span>${GLY[i]}</span></button>`).join('');
    $('cr-kb').querySelectorAll('.kc').forEach(b => { b.addEventListener('pointerdown', () => { b.classList.add('down'); Snd.note(+b.dataset.s, { len:.6 }); buzz(5); }); ['pointerup', 'pointerleave'].forEach(ev => b.addEventListener(ev, () => b.classList.remove('down'))); });
    const eg = endGen;
    const tt = crTimer = setInterval(() => {
      if (eg !== endGen){ clearInterval(tt); return; }
      i++; $('cr-text').textContent = text.slice(0, i);
      const ch = text[i - 1]; if (ch && ch.trim() && i % 2) Snd.key('press', { b:{ switch:'typewriter', keycap:'pbt', case:'plastic' }, gain:.3, auto:true });
      if (ch === '\n' && text[i - 2] && text[i - 2] !== '\n') Snd.fx('ding', { gain:.15 });
      if (i >= text.length){ clearInterval(tt); setTimeout(() => eg === endGen && cur === 'ending' && recordCard(), 2500); }
    }, 55);
  }
  function recordCard(){
    const totalStars = Object.values(S.stars).reduce((a, b) => a + b, 0);
    const fav = Object.entries(S.swUse).sort((a, b) => b[1] - a[1])[0];
    const nParts = S.parts.switch.length + S.parts.keycap.length + S.parts.case.length;
    msg('🎉 나의 공방 기록', `당신은 지금까지<br><b style="font-family:Jua;font-size:30px;color:#c8602f">${S.clicks.toLocaleString()}번</b><br>딸깍했어요.`,
      `<div><span class="ico">⭐</span><span><b>별 ${totalStars}개</b>모은 부품 ${nParts}개 · 아티산 ${S.artisan.length}개</span></div><div><span class="ico">🔊</span><span><b>${fav ? DATA.SWITCH[fav[0]].name : '갈축'}</b>가장 많이 쓴 스위치</span></div>`,
      () => hub(), ['📷 기록 카드 저장', () => { saveCard(totalStars, fav, nParts); setTimeout(recordCard, 300); }]);
  }
  function saveCard(stars, fav, parts){
    const c = document.createElement('canvas'); c.width = 720; c.height = 960; const g = c.getContext('2d');
    g.fillStyle = '#f7efe3'; g.fillRect(0, 0, 720, 960);
    g.fillStyle = '#fffaf2'; g.beginPath(); g.roundRect ? g.roundRect(50, 60, 620, 840, 40) : g.rect(50, 60, 620, 840); g.fill();
    g.fillStyle = '#5a4332'; g.textAlign = 'center';
    g.font = '56px Jua, sans-serif'; g.fillText('딸깍 공방', 360, 170);
    g.font = '30px "Gowun Dodum", sans-serif'; g.fillText('나는 지금까지', 360, 290);
    g.fillStyle = '#c8602f'; g.font = '96px Jua, sans-serif'; g.fillText(S.clicks.toLocaleString(), 360, 410);
    g.fillStyle = '#5a4332'; g.font = '30px "Gowun Dodum", sans-serif'; g.fillText('번 딸깍했어요', 360, 470);
    g.font = '32px Jua, sans-serif';
    g.fillText(`⭐ 별 ${stars}개   🧰 부품 ${parts}개`, 360, 600);
    g.fillText(`🔊 최애 스위치: ${fav ? DATA.SWITCH[fav[0]].name : '갈축'}`, 360, 660);
    g.fillText(`🎨 아티산 키캡 ${S.artisan.length}개`, 360, 720);
    const cols = ['#ec8f86', '#e3a46a', '#9fd6b9', '#a3c6ee', '#bfaaea', '#f2d064'];
    cols.forEach((col, i) => { g.fillStyle = col; g.fillRect(150 + i * 72, 790, 56, 46); });
    const a = document.createElement('a'); a.download = '딸깍공방_기록.png'; a.href = c.toDataURL('image/png'); a.click();
  }

  // ---------- 시작 ----------
  Game.bind();
  function boot(){ clicksPill(); if (!S.intro) intro(); else hub(); }
  boot();
  return { buzz, sparks, toast, songNote, get S(){ return S }, hub, map, play, ending, assemble, intro };
})();
