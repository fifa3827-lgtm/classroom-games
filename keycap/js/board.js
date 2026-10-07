// 딸깍 공방 — 퍼즐 규칙 (화면과 분리된 계산만)
// 판 = 키보드 배열. '.' 색 키캡, ' ' 빈자리, 같은 글자가 이어지면 넓은 기능 키
// E=Esc T=Tab B=백스페이스 S=시프트 N=엔터 _=스페이스바
const Board = (() => {
  const FN = { E:'esc', T:'tab', B:'back', S:'shift', N:'enter', _:'space' };
  const FN_COOL = 3;
  const LOOP_MIN = 6;              // 고리는 같은 색 6개 이상 이어야 만들 수 있음

  function rand(st){                       // 판 상태 안에 씨앗을 두어 복제·재현 가능
    let s = st.rs >>> 0 || 1;
    s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0;
    st.rs = s; return s / 4294967296;
  }
  const pick = (st, arr) => arr[Math.floor(rand(st) * arr.length)];
  const touch = (a, b) => !(a.c + a.w < b.c || b.c + b.w < a.c || a.r + 1 < b.r || b.r + 1 < a.r);
  // 변을 맞댄 이웃 (방해물은 이 이웃이 터질 때만 맞음)
  const edge = (a, b) => (a.r === b.r && (a.c + a.w === b.c || b.c + b.w === a.c)) || (Math.abs(a.r - b.r) === 1 && a.c < b.c + b.w && b.c < a.c + a.w);

  function parse(rows){
    const keys = [];
    rows.forEach((row, r) => {
      let c = 0;
      while (c < row.length){
        const ch = row[c];
        if (ch === ' '){ c++; continue; }
        if (ch === '.'){ keys.push({ r, c, w:1, kind:'color' }); c++; continue; }
        let w = 1; while (row[c + w] === ch) w++;
        keys.push({ r, c, w, kind:'fn', fn:FN[ch] }); c += w;
      }
    });
    keys.forEach((k, i) => k.id = i);
    keys.forEach(a => { a.nb = keys.filter(b => b !== a && touch(a, b)).map(b => b.id); a.edge = keys.filter(b => b !== a && edge(a, b)).map(b => b.id); });
    return keys;
  }

  // ---------- 판 만들기 ----------
  function create(L, seed){
    const st = { rs:(seed >>> 0) || 7, colors:L.colors, moves:L.moves, maxMoves:L.moves, turn:0, escUsed:false, cat:L.cat || 0, bugSlow:L.bugSlow || 2 };
    st.keys = parse(L.layout).map(k => ({ ...k, color:-1, sp:null, ob:null, cool:0 }));
    st.cols = Math.max(...L.layout.map(r => r.length)); st.rows = L.layout.length;
    const ck = st.keys.filter(k => k.kind === 'color');
    ck.forEach(k => k.color = Math.floor(rand(st) * L.colors));
    // 방해물 놓기
    const free = () => ck.filter(k => !k.ob);
    const ob = L.ob || {};
    if (ob.coffee){                          // 커피는 한쪽 구석에서 시작
      const corner = pick(st, [[0, 0], [0, st.cols - 1], [st.rows - 1, 0], [st.rows - 1, st.cols - 1]]);
      free().sort((a, b) => (Math.abs(a.r - corner[0]) + Math.abs(a.c - corner[1])) - (Math.abs(b.r - corner[0]) + Math.abs(b.c - corner[1])) + (rand(st) - .5) * .5)
        .slice(0, ob.coffee).forEach(k => k.ob = { t:'coffee' });
    }
    const scatter = (t, n, rowMax) => {
      const pool = free().filter(k => rowMax === undefined || k.r <= rowMax);
      for (let i = 0; i < n && pool.length; i++){ const k = pool.splice(Math.floor(rand(st) * pool.length), 1)[0]; k.ob = t === 'stuck' || t === 'bug' ? { t, hp:2 } : { t }; }
    };
    if (ob.crumb) scatter('crumb', ob.crumb);
    if (ob.stuck) scatter('stuck', ob.stuck);
    if (ob.bug) scatter('bug', ob.bug, 2);
    for (let g = 0; g < 80 && trapped(st); g++){   // 처음부터 갇힌 방해물이 없게: 갇힌 덩어리의 것을 빈 칸으로 옮김
      const bad = trappedKeys(st), k = bad[Math.floor(rand(st) * bad.length)];
      const free = ck.filter(x => !x.ob && x.edge.some(j => st.keys[j].kind === 'color' && !st.keys[j].ob));
      if (!free.length) { k.ob = null; continue; }
      free[Math.floor(rand(st) * free.length)].ob = k.ob; k.ob = null;
    }
    // 목표
    st.goals = {};
    for (const [g, n] of Object.entries(L.goals)){
      st.goals[g] = n === 'all' ? st.keys.filter(k => k.ob && k.ob.t === g).length : n;
    }
    st.coffeeLimit = Math.ceil(ck.length * .5);
    if (!hasMove(st)) shuffle(st);
    return st;
  }

  const clone = st => ({ ...st, goals:{ ...st.goals }, keys:st.keys.map(k => ({ ...k, ob:k.ob ? { ...k.ob } : null })) });

  // ---------- 잇기 규칙 ----------
  const linkable = (st, k) => k.kind === 'color' ? !k.ob : (k.cool === 0 && !(k.fn === 'esc' && st.escUsed));
  function canAdd(st, chain, k, color){
    if (!chain.length) return linkable(st, k);
    const last = st.keys[chain[chain.length - 1]];
    if (!last.nb.includes(k.id) || !linkable(st, k) || chain.includes(k.id)) return false;
    return k.kind === 'fn' || color < 0 || k.color === color;
  }
  const chainColor = (st, chain) => { const k = chain.map(i => st.keys[i]).find(k => k.kind === 'color'); return k ? k.color : -1; };
  const colorCount = (st, chain) => chain.filter(i => st.keys[i].kind === 'color').length;
  const valid = (st, chain) => colorCount(st, chain) >= 2;

  function hasMove(st){
    return st.keys.some(a => a.kind === 'color' && !a.ob && a.nb.some(j => { const b = st.keys[j]; return b.kind === 'color' && !b.ob && b.color === a.color; }));
  }
  function shuffle(st){
    const ks = st.keys.filter(k => k.kind === 'color' && !k.ob);
    let tries = 0;
    do {
      const cols = ks.map(k => k.color);
      for (let i = cols.length - 1; i > 0; i--){ const j = Math.floor(rand(st) * (i + 1)); [cols[i], cols[j]] = [cols[j], cols[i]]; }
      ks.forEach((k, i) => k.color = cols[i]);
      if (++tries > 30) ks.forEach(k => k.color = Math.floor(rand(st) * st.colors));
    } while (!hasMove(st) && tries < 60);
    let rescue = 0;
    while (!hasMove(st) && rescue < 40){           // 그래도 막히면 타닥이가 방해물을 하나씩 치움
      const obs = st.keys.filter(k => k.ob && k.ob.t !== 'bug'); if (!obs.length) break;
      const k = obs[Math.floor(rand(st) * obs.length)]; k.ob = null; k.color = Math.floor(rand(st) * st.colors);
      const nb = st.keys.find(x => x.kind === 'color' && !x.ob && k.nb.includes(x.id)); if (nb) nb.color = k.color;
      rescue++;
    }
    syncCoffee(st);
    return st.keys.filter(k => k.kind === 'color').map(k => [k.id, k.color]);
  }

  // ---------- 한 수 두기 ----------
  // 돌려주는 것: 화면이 차례로 보여 줄 사건 목록
  function play(st, chain, loop){
    const ev = [], K = st.keys;
    const color = chainColor(st, chain);
    const ks = chain.map(i => K[i]);
    const shift = ks.some(k => k.fn === 'shift');
    const pops = [], popSet = new Set(), area = new Set();
    const add = (k, by) => { if (k.kind === 'color' && !k.ob && !popSet.has(k.id)){ popSet.add(k.id); pops.push({ id:k.id, by, color:k.color }); } };
    ks.forEach(k => add(k, 'chain'));
    if (loop){
      const last = ks[ks.length - 1];
      K.filter(k => k.kind === 'color' && k.color === color && !k.ob).sort((a, b) => dist(a, last) - dist(b, last)).forEach(k => add(k, 'loop'));
    }
    let backLeft = 0, tabRows = [], escNow = false;
    for (const k of ks){
      if (k.kind !== 'fn') continue;
      ev.push({ t:'fn', id:k.id, fn:k.fn });
      if (k.fn === 'space'){
        const row = K.filter(x => x.r === k.r && x !== k).sort((a, b) => Math.abs(a.c - k.c - k.w / 2) - Math.abs(b.c - k.c - k.w / 2));
        row.forEach(x => { area.add(x.id); add(x, 'space'); });
      }
      if (k.fn === 'enter') K.filter(x => x !== k && Math.abs(x.r - k.r) <= 1 && x.c + x.w >= k.c && x.c <= k.c + k.w).forEach(x => { area.add(x.id); add(x, 'enter'); });
      if (k.fn === 'back') backLeft += 3;
      if (k.fn === 'tab') tabRows.push(k.r);
      if (k.fn === 'esc'){ escNow = true; st.escUsed = true; st.moves += 3; }
      k.cool = k.fn === 'esc' ? 999 : FN_COOL + 1;
    }
    // 반짝 키캡은 터질 때 주변까지
    for (let i = 0; i < pops.length; i++){
      const k = K[pops[i].id];
      if (k.sp === 'spark'){ k.sp = null; pops[i].spark = true; k.nb.map(j => K[j]).forEach(x => { area.add(x.id); add(x, 'spark'); }); }
    }
    // 목표 세기
    let coffeeGone = 0;
    for (const p of pops){
      const g = 'c' + p.color;
      if (st.goals[g] !== undefined) st.goals[g] -= (shift && p.by === 'chain') ? 2 : 1;
    }
    // 방해물 맞히기: 터진 키캡 옆, 기능 키·반짝 범위 안
    const hits = new Set();
    pops.forEach(p => K[p.id].edge.forEach(j => { if (K[j].ob) hits.add(j); }));
    area.forEach(j => { if (K[j].ob) hits.add(j); });
    const order = pops.map(p => p.id);
    const hitEv = [], flee = [];
    for (const j of hits){
      const k = K[j], t = k.ob.t;
      let done = true;
      if (t === 'stuck' || t === 'bug'){ k.ob.hp--; done = k.ob.hp <= 0; }
      if (done){ k.ob = null; if (st.goals[t] !== undefined) st.goals[t]--; if (t === 'coffee') coffeeGone++; }
      hitEv.push({ t:'hit', id:j, ob:t, done, near:nearestIndex(order, K, k) });
      if (t === 'bug' && !done) flee.push(j);
    }
    // 백스페이스: 방해물 지우기 (커피 → 버그 → 뻑뻑 → 부스러기)
    if (backLeft){
      const rank = { coffee:0, bug:1, stuck:2, crumb:3 };
      K.filter(k => k.ob).sort((a, b) => rank[a.ob.t] - rank[b.ob.t]).slice(0, backLeft).forEach(k => {
        const t = k.ob.t; k.ob = null; if (st.goals[t] !== undefined) st.goals[t]--; if (t === 'coffee') coffeeGone++;
        hitEv.push({ t:'hit', id:k.id, ob:t, done:true, near:0, back:true });
      });
    }
    ev.push({ t:'pops', pops }); ev.push(...hitEv);
    // 놀란 버그는 멀리 도망 (다시 한 번 맞혀야 잡힘)
    flee.forEach(j => {
      if (!K[j].ob || K[j].ob.t !== 'bug') return;            // 백스페이스로 이미 지워졌으면 그대로
      const opts = K.filter(x => x.kind === 'color' && !x.ob && !popSet.has(x.id) && dist(x, K[j]) >= 3);
      if (!opts.length) return;
      const to = pick(st, opts); to.ob = { t:'bug', hp:1 }; K[j].ob = null;
      if (trapped(st)){ to.ob = null; K[j].ob = { t:'bug', hp:1 }; return; }
      ev.push({ t:'bug', from:j, to:to.id, flee:true });
    });
    // 다시 채우기
    const refill = [];
    const lastColor = ks.filter(k => k.kind === 'color').pop();
    const makeSpark = !loop && colorCount(st, chain) >= 6 ? lastColor : null;
    pops.forEach(p => {
      const k = K[p.id];
      if (k === makeSpark){ k.color = color; k.sp = 'spark'; }
      else k.color = Math.floor(rand(st) * st.colors);
      refill.push([k.id, k.color, k.sp]);
    });
    ev.push({ t:'refill', list:refill, spark:makeSpark ? makeSpark.id : null });
    // 탭: 그 줄 색을 한 칸씩 밀기
    for (const r of tabRows){
      const row = K.filter(k => k.r === r && k.kind === 'color' && !k.ob).sort((a, b) => a.c - b.c);
      if (row.length > 1){ const cols = row.map(k => k.color); cols.unshift(cols.pop()); row.forEach((k, i) => k.color = cols[i]); ev.push({ t:'recolor', why:'tab', list:row.map(k => [k.id, k.color]) }); }
    }
    // 턴 끝
    st.turn++; if (!escNow) st.moves--;
    K.forEach(k => { if (k.kind === 'fn' && k.cool > 0 && k.cool < 999) k.cool--; });
    // 커피 번지기: 이번 턴에 커피를 하나도 못 닦았으면 한 칸 번짐
    // (방해물 덩어리가 닦을 수 없게 갇히는 칸으로는 번지지 않음)
    if (st.noSpread > 0) st.noSpread--;
    else for (let n = 0; n < (coffeeGone ? 0 : 1); n++){
      const cs = K.filter(k => k.ob && k.ob.t === 'coffee'), opts = [];
      cs.forEach(c => c.edge.forEach(j => { const x = K[j]; if (x.kind === 'color' && !x.ob) opts.push([c.id, x.id]); }));
      while (opts.length){
        const [from, to] = opts.splice(Math.floor(rand(st) * opts.length), 1)[0];
        K[to].ob = { t:'coffee' };
        if (trapped(st)){ K[to].ob = null; continue; }
        ev.push({ t:'coffee', from, to }); break;
      }
    }
    // 버그: 몇 턴마다 옆 키캡으로 옮겨 가며 갉아 먹음(부스러기를 남김)
    if (st.turn % st.bugSlow === 0){
      K.filter(k => k.ob && k.ob.t === 'bug').forEach(b => {
        const opts = b.nb.map(j => K[j]).filter(x => x.kind === 'color' && !x.ob);
        if (!opts.length) return;
        const to = pick(st, opts), was = b.ob;
        to.ob = { t:'bug', hp:was.hp || 2 }; b.ob = { t:'crumb' };
        if (trapped(st)){ to.ob = null; b.ob = was; return; }
        ev.push({ t:'bug', from:b.id, to:to.id });
      });
    }
    // 고양이: 몇 턴마다 한 줄을 휘젓고 지나감
    if (st.cat && st.turn % st.cat === 0){
      const rows = [...new Set(K.map(k => k.r))].filter(r => K.filter(k => k.r === r && k.kind === 'color' && !k.ob).length >= 3);
      if (rows.length){
        const r = pick(st, rows);
        const row = K.filter(k => k.r === r && k.kind === 'color' && !k.ob);
        row.forEach(k => k.color = Math.floor(rand(st) * st.colors));
        ev.push({ t:'cat', row:r, list:row.map(k => [k.id, k.color]) });
      }
    }
    if (!hasMove(st)) ev.push({ t:'shuffle', list:shuffle(st) });
    syncCoffee(st);
    ev.push({ t:'end', state:status(st), escNow });
    return ev;
  }
  // 기술: 이동을 쓰지 않고 키캡을 터뜨림 (ids), 방해물을 직접 깨기 (obIds)
  function blast(st, ids, obIds){
    const K = st.keys, ev = [], pops = [], seen = new Set();
    ids.forEach(id => { const k = K[id]; if (k.kind === 'color' && !k.ob && !seen.has(id)){ seen.add(id); pops.push({ id, by:'skill', color:k.color }); } });
    pops.forEach(p => { const g = 'c' + p.color; if (st.goals[g] !== undefined) st.goals[g]--; });
    const hits = new Set(obIds || []);
    pops.forEach(p => K[p.id].edge.forEach(j => { if (K[j].ob) hits.add(j); }));
    ev.push({ t:'pops', pops });
    for (const j of hits){
      const k = K[j]; if (!k.ob) continue;
      const t = k.ob.t; let done = true;
      if ((t === 'stuck' || t === 'bug') && !(obIds || []).includes(j)){ k.ob.hp--; done = k.ob.hp <= 0; }
      if (done){ k.ob = null; if (st.goals[t] !== undefined) st.goals[t]--; }
      ev.push({ t:'hit', id:j, ob:t, done, near:0 });
    }
    const refill = pops.map(p => { const k = K[p.id]; k.sp = null; k.color = Math.floor(rand(st) * st.colors); return [k.id, k.color, null]; });
    ev.push({ t:'refill', list:refill, spark:null });
    if (!hasMove(st)) ev.push({ t:'shuffle', list:shuffle(st) });
    syncCoffee(st);
    ev.push({ t:'end', state:status(st), skill:true });
    return ev;
  }
  function nearestIndex(order, K, k){
    let best = 0, bd = 1e9;
    order.forEach((id, i) => { const d = dist(K[id], k); if (d < bd){ bd = d; best = i; } });
    return best;
  }
  const dist = (a, b) => Math.abs(a.r - b.r) + Math.abs((a.c + a.w / 2) - (b.c + b.w / 2));

  // 커피 목표 = 지금 판에 남은 커피 수 (번진 커피까지 다 닦아야 함)
  function syncCoffee(st){
    for (const t of ['coffee', 'crumb']) if (st.goals[t] !== undefined) st.goals[t] = st.keys.filter(k => k.ob && k.ob.t === t).length;
    for (const t of ['stuck', 'bug']) if (st.goals[t] > 0) st.goals[t] = Math.min(st.goals[t], st.keys.filter(k => k.ob && k.ob.t === t).length);
  }
  // 방해물 덩어리 가운데 옆에 터뜨릴 키캡이 하나도 없는 것이 있으면 true (영영 못 닦는 상태)
  function trapped(st){ return trappedKeys(st).length > 0; }
  function trappedKeys(st){
    const K = st.keys, seen = new Set(), out = [];
    for (const k of K){
      if (!k.ob || seen.has(k.id)) continue;
      const stack = [k.id], grp = [k]; seen.add(k.id); let open = false;
      while (stack.length){
        const x = K[stack.pop()];
        for (const j of x.edge){
          const y = K[j];
          if (y.ob){ if (!seen.has(j)){ seen.add(j); stack.push(j); grp.push(y); } }
          else if (y.kind === 'color') open = true;
        }
      }
      if (!open) out.push(...grp);
    }
    return out;
  }
  function status(st){
    const won = Object.values(st.goals).every(n => n <= 0);
    const coffee = st.keys.filter(k => k.ob && k.ob.t === 'coffee').length;
    if (won) return 'win';
    if (coffee >= st.coffeeLimit) return 'coffee';
    if (st.moves <= 0) return 'moves';
    return 'play';
  }

  // ---------- 자동 플레이 (난이도 맞추기용) ----------
  function candidates(st, limit = 3000){
    const out = [], K = st.keys;
    let budget = limit;
    const dfs = (chain, color) => {
      if (--budget < 0) return;
      if (valid(st, chain)) out.push({ chain:chain.slice(), loop:false });
      if (chain.length >= 9) return;
      const last = K[chain[chain.length - 1]];
      for (const j of last.nb){
        const k = K[j];
        if (chain.includes(j)){
          if (j !== chain[chain.length - 2] && colorCount(st, chain) >= LOOP_MIN && k.kind === 'color' && k.color === color) out.push({ chain:chain.slice(), loop:true });
          continue;
        }
        if (!canAdd(st, chain, k, color)) continue;
        chain.push(j); dfs(chain, color < 0 && k.kind === 'color' ? k.color : color); chain.pop();
      }
    };
    for (const k of K){ if (k.kind === 'color' && linkable(st, k)) dfs([k.id], k.color); if (budget < 0) break; }
    return out;
  }
  function goalLeft(st){ return Object.values(st.goals).reduce((s, n) => s + Math.max(0, n), 0); }
  function botMove(st, mid){
    let cs = candidates(st);
    if (mid) cs = cs.filter(c => !c.loop && colorCount(st, c.chain) <= 6 && c.chain.length <= 7);
    if (!cs.length) return null;
    // 빠른 점수로 추린 뒤, 상위 몇 개만 실제로 두어 보고 고름
    const quick = c => { const col = chainColor(st, c.chain); return (st.goals['c' + col] > 0 ? 3 : 1) * c.chain.length + (c.loop ? 12 : 0) + c.chain.filter(i => st.keys[i].kind === 'fn').length * 4; };
    cs.sort((a, b) => quick(b) - quick(a));
    let best = null, bs = -1e9;
    const before = goalLeft(st);
    for (const c of cs.slice(0, 14)){
      const t = clone(st); t.rs = (Math.random() * 4294967295) >>> 0; play(t, c.chain, c.loop);   // 봇도 다음에 떨어질 색은 모름
      const coffee = t.keys.filter(k => k.ob && k.ob.t === 'coffee').length;
      const s = (before - goalLeft(t)) * 10 - coffee * 3 + (status(t) === 'win' ? 1000 : 0) + c.chain.length;
      if (s > bs){ bs = s; best = c; }
    }
    return best;
  }

  return { LOOP_MIN, parse, create, clone, play, blast, shuffle, canAdd, chainColor, colorCount, valid, linkable, status, candidates, botMove, goalLeft, hasMove, rand };
})();
if (typeof module !== 'undefined') module.exports = Board;
