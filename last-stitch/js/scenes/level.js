// 판 장면: 게임 논리 + 그리기 + 누르기 + 정보 띠(HUD)를 잇는다
import { Game, DT } from '../engine/game.js';
import { Renderer, PAD_R, TOWER_W } from '../engine/render.js';
import { IMG } from '../engine/assets.js';
import { audio, vibrate } from '../engine/audio.js';
import { TOWERS, TOWER_ORDER, towerStats, ELEM_NAME, MAX_LEVEL, threadCombo, SHARE_DESC } from '../data/towers.js';
import { SAFE } from '../data/levels.js';

const SHOT_SFX = { archer: ['arrow_shoot', 0.45], cannon: ['cannon_fire', 0.7], ice: ['ice_shot', 0.5], lightning: ['lightning_zap', 0.55] };
const HIT_SFX = { paint: 'hit_paint', wood: 'hit_wood', metal: 'hit_metal' };
const ICON = {
  pause: '<svg viewBox="0 0 24 24"><rect x="6" y="5" width="4.5" height="14" rx="1.5"/><rect x="13.5" y="5" width="4.5" height="14" rx="1.5"/></svg>',
};
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };

export class LevelScene {
  constructor(app, level) {
    this.app = app; this.level = level;
    this.view = app.view;
    this.r = new Renderer(this.view);
    this.speed = 1; this.paused = false; this.acc = 0; this.hitstop = 0;
    this.timers = []; this.alive = true; this.realT = 0;
    this.press = null; this.menu = null;
    this.ori = this.view.resize();
    this.game = new Game(level, this.ori, { seed: (Math.random() * 1e9) | 0 });
    this.buildHud();
    this.applyOrientation(true);
    this.tut = level.tutorial ? { step: 0 } : null;
    this.bindInput();
    audio.playMusic(level.music);
    audio.duck(false);
    this.later(0.5, () => this.showTalk(0));
    // 앱을 숨기면 저절로 잠깐 쉬기
    this.onVis = () => { if (document.hidden && this.alive && !this.paused && !this.game.result && !this.talking) this.openPause(); };
    document.addEventListener('visibilitychange', this.onVis);
  }
  later(sec, fn) { this.timers.push({ at: this.realT + sec, fn }); }

  // ── 정보 띠 ──
  buildHud() {
    const ui = this.ui = document.getElementById('ui');
    ui.innerHTML = '';
    const top = this.hudTop = el('div', 'hud-top');
    this.cLives = el('div', 'chip', `<img src="assets/ui/icon_heart.webp" alt=""><span class="v"></span>`);
    this.cGold = el('div', 'chip', `<img src="assets/ui/icon_coin.webp" alt=""><span class="v"></span>`);
    this.cWave = el('div', 'chip', `<img src="assets/ui/icon_skull.webp" alt=""><span class="v"></span>`);
    this.bSpeed = el('button', 'rbtn', '1×'); this.bSpeed.setAttribute('aria-label', '빠르게 감기');
    this.bPause = el('button', 'rbtn', ICON.pause); this.bPause.setAttribute('aria-label', '일시정지');
    top.append(this.cLives, this.cGold, this.cWave, el('div', 'grow pass'), this.bSpeed, this.bPause);
    const bot = this.hudBot = el('div', 'hud-bot');
    this.spoolBox = el('div', 'spools'); this.spoolBox.title = '실패: 이을 수 있는 실';
    this.bWave = el('button', 'callwave ready', '');
    bot.append(this.spoolBox, el('div', 'grow pass'), this.bWave);
    ui.append(top, bot);
    this.bSpeed.onclick = () => { this.speed = this.speed === 1 ? 2 : 1; this.bSpeed.textContent = this.speed + '×'; this.bSpeed.classList.toggle('on', this.speed === 2); audio.play('button'); };
    this.bPause.onclick = () => { audio.play('button'); this.openPause(); };
    this.bWave.onclick = () => {
      if (!this.game.canCallWave() || this.talking || this.paused) return;
      audio.play('button');
      this.game.callWave();
      this.closeMenu();
      if (this.tut && this.tut.step <= 2) this.tutStep(3);
    };
    this.hud = {};
    this.updateHud(true);
  }
  updateHud(force) {
    const g = this.game, h = this.hud;
    const set = (k, v, node) => { if (h[k] !== v || force) { h[k] = v; node.querySelector('.v').textContent = v; return true; } };
    set('lives', g.lives, this.cLives);
    set('gold', g.gold, this.cGold);
    set('wave', `${Math.max(0, g.wave + 1)}/${g.level.waves.length}`, this.cWave);
    const sp = `${g.spoolsMax}|${g.threads.length}|${g.spoolCool.length}`;
    if (h.sp !== sp) {
      h.sp = sp;
      this.spoolBox.innerHTML = '';
      for (let i = 0; i < g.spoolsMax; i++) {
        const im = el('img'); im.src = 'assets/ui/icon_spool.webp'; im.alt = '';
        if (i >= g.spoolsMax - g.threads.length - g.spoolCool.length) im.className = i >= g.spoolsMax - g.spoolCool.length ? 'cool' : 'used';
        this.spoolBox.append(im);
      }
    }
    let wv;
    if (!g.started) wv = '<span>▶ 시작</span>';
    else if (g.canCallWave()) { const b = g.earlyBonus(); wv = `<span>다음 웨이브</span>${b ? `<span class="bonus">+${b}</span>` : ''}`; }
    else wv = '';
    if (h.wv !== wv) { h.wv = wv; this.bWave.innerHTML = wv; this.bWave.style.visibility = wv ? 'visible' : 'hidden'; this.bWave.classList.toggle('ready', !g.started); }
  }

  // ── 화면 방향 ──
  insets() {
    const tb = this.hudTop.getBoundingClientRect(), bb = this.hudBot.getBoundingClientRect();
    return { t: tb.bottom + 4, b: Math.max(0, this.view.H - bb.top) + 4, l: 0, r: 0 };
  }
  // 안전 구역: 빈자리 위에 서는 탑 머리(약 200)까지 보이게 위쪽을 넓힌다
  safeRect() {
    const g = this.game.geo, s = SAFE[this.ori].slice();
    const top = Math.min(...g.pads.map(p => p[1])) - 330;
    s[1] = Math.min(s[1], top / g.H);   // 맵 위끝보다 위일 수도 있음(그때는 흐린 바탕이 위에 보임)
    return s;
  }
  applyOrientation(first) {
    const ori = this.ori;
    document.body.classList.toggle('land', ori === 'h');
    if (!first) {
      this.game.setOrientation(ori);
      const g = this.game, far = g.threads.filter(th => g.threadLen(th.a, th.b) > g.maxThreadLen());
      if (far.length) { g.threads = g.threads.filter(th => !far.includes(th)); this.later(0.1, () => this.toast(`화면이 바뀌어 닿지 않는 실 ${far.length}개를 풀었어요. 실패는 바로 다시 쓸 수 있어요.`)); }
    }
    const M = this.level.map[ori];
    const img = IMG[`map_${this.level.id}_${ori}`];
    this.r.setMap(img);
    this.view.fit(this.game.geo.W, this.game.geo.H, this.safeRect(), this.insets());
    this.closeMenu();
  }
  resize() {
    const ori = this.view.resize();
    if (ori !== this.ori) { this.ori = ori; this.applyOrientation(false); }
    else this.view.fit(this.game.geo.W, this.game.geo.H, this.safeRect(), this.insets());
    if (this.menu) this.positionMenu();
  }

  // ── 누르기 ──
  bindInput() {
    const cv = this.view.cv;
    this.onDown = e => this.down(e); this.onMove = e => this.move(e); this.onUp = e => this.up(e);
    cv.addEventListener('pointerdown', this.onDown);
    window.addEventListener('pointermove', this.onMove);
    window.addEventListener('pointerup', this.onUp);
    window.addEventListener('pointercancel', this.onUp);
  }
  unbind() {
    const cv = this.view.cv;
    cv.removeEventListener('pointerdown', this.onDown);
    window.removeEventListener('pointermove', this.onMove);
    window.removeEventListener('pointerup', this.onUp);
    window.removeEventListener('pointercancel', this.onUp);
  }
  towerAtScreen(sx, sy) {
    const g = this.game;
    const [wx, wy] = this.view.s2w(sx, sy);
    let best = null, bd = 1e9;
    for (const t of g.towers) {
      const [x, y] = g.padPos(t.pad);
      const w = TOWER_W[t.type] * 0.5, h = TOWERS[t.type].h + 40;
      const inBox = wx > x - w && wx < x + w && wy > y - h && wy < y + PAD_R * 0.7;
      const d = Math.hypot(wx - x, (wy - y) * 1.4);
      if ((inBox || d < PAD_R * 1.15) && d < bd) { bd = d; best = t; }
    }
    return best;
  }
  padAtScreen(sx, sy) {
    const [wx, wy] = this.view.s2w(sx, sy);
    let best = -1, bd = PAD_R * 1.2;
    this.game.geo.pads.forEach(([x, y], i) => { const d = Math.hypot(wx - x, (wy - y) * 1.3); if (d < bd) { bd = d; best = i; } });
    return best;
  }
  threadAtScreen(sx, sy) {
    const [wx, wy] = this.view.s2w(sx, sy);
    let best = null, bd = 34;
    for (const th of this.game.threads) {
      const a = this.game.towerTop(th.a), b = this.game.towerTop(th.b), m = th._mid || [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      for (let i = 0; i <= 20; i++) {
        const u = i / 20, q = 1 - u;
        const x = q * q * a[0] + 2 * q * u * m[0] + u * u * b[0], y = q * q * a[1] + 2 * q * u * m[1] + u * u * b[1];
        const d = Math.hypot(wx - x, wy - y);
        if (d < bd) { bd = d; best = th; }
      }
    }
    return best;
  }
  down(e) {
    if (this.paused || this.game.result || this.talking) return;
    if (this.tutTip) this.tutTip.dataset.until = this.realT;
    e.preventDefault();
    const sx = e.clientX, sy = e.clientY;
    const t = this.towerAtScreen(sx, sy);
    const th = t ? null : this.threadAtScreen(sx, sy);
    const pad = t || th ? -1 : this.padAtScreen(sx, sy);
    this.press = { id: e.pointerId, sx, sy, t, th, pad: pad >= 0 && !this.game.towerAt(pad) ? pad : -1, moved: false, at: performance.now() };
  }
  move(e) {
    const P = this.press;
    if (!P || e.pointerId !== P.id) return;
    const dx = e.clientX - P.sx, dy = e.clientY - P.sy;
    if (!P.moved && Math.hypot(dx, dy) > 16) {
      P.moved = true;
      if (P.t) {
        this.closeMenu();
        this.r.ui.drag = { from: P.t, x: 0, y: 0, gx: 0, gy: 0, over: null };
        this.pullT = 0;
        audio.play('thread_pull', { vol: 0.5 });
      }
    }
    const D = this.r.ui.drag;
    if (D) {
      const [wx, wy] = this.view.s2w(e.clientX, e.clientY);
      D.gx = wx; D.gy = wy; D.x = wx; D.y = wy - 40;
      const o = this.towerAtScreen(e.clientX, e.clientY);
      const over = o && o !== D.from ? o : null;
      if (over !== D.over) { D.over = over; if (over) audio.play('button', { vol: 0.4, rate: 1.4 }); this.dragTip(D); }

      if (performance.now() - (this.lastPull || 0) > 900) { this.lastPull = performance.now(); audio.play('thread_pull', { vol: 0.35, max: 1 }); }
    }
  }
  up(e) {
    const P = this.press;
    if (!P || e.pointerId !== P.id) return;
    this.press = null;
    const D = this.r.ui.drag;
    if (D) {
      this.r.ui.drag = null;
      this.dTip?.remove(); this.dTip = null;
      if (D.over) {
        const why = this.game.linkCheck(D.from, D.over);
        if (why === 'ok') this.game.link(D.from, D.over);
        else this.toast({ far: '실이 닿지 않아요. 더 가까운 탑을 골라 보세요.', dup: '이미 이어진 탑이에요.', nospool: '남은 실패가 없어요. 실을 끊으면 다시 쓸 수 있어요.' }[why] || '');
      }
      return;
    }
    if (P.moved) return;
    audio.play('button', { vol: 0.6 });
    if (P.t) this.openTowerMenu(P.t);
    else if (P.th) this.openThreadMenu(P.th);
    else if (P.pad >= 0) this.openBuildMenu(P.pad);
    else this.closeMenu();
  }

  dragTip(D) {
    this.dTip?.remove(); this.dTip = null;
    if (!D.over) return;
    const g = this.game, why = g.linkCheck(D.from, D.over);
    const b = el('div', 'tip parch pass');
    if (why === 'ok') {
      const c = threadCombo(TOWERS[D.from.type].elem, TOWERS[D.over.type].elem);
      const cross = g.threadCrosses(D.from, D.over);
      b.innerHTML = `<div class="in"><b>${c.name}</b><div class="st">${cross ? c.desc : '길 위를 지나지 않아요. 두 탑이 힘만 나눠요.'}</div><div class="st">나눠 받는 힘: ${this.shareText(D.from, D.over)}</div></div>`;
    } else b.innerHTML = `<div class="in"><div class="st">${{ far: '실이 닿지 않아요', dup: '이미 이어졌어요', nospool: '남은 실패가 없어요' }[why] || ''}</div></div>`;
    b.style.left = '50%'; b.style.top = (this.insets().t + 4) + 'px';
    this.ui.append(b); this.dTip = b;
  }
  shareText(a, b) {
    const ea = TOWERS[a.type].elem, eb = TOWERS[b.type].elem;
    if (ea === eb) return SHARE_DESC.echo;
    return `${TOWERS[a.type].name} ← ${SHARE_DESC[eb]}, ${TOWERS[b.type].name} ← ${SHARE_DESC[ea]}`;
  }
  // ── 탑 고르기·올리기 판 ──
  closeMenu() {
    if (this.menu) { this.menu.node.remove(); this.menu.tip?.remove(); }
    this.menu = null;
    Object.assign(this.r.ui, { pads: false, sel: null, range: null, preview: null, selThread: null });
  }
  positionMenu() {
    const m = this.menu; if (!m) return;
    let [x, y] = this.view.w2s(...m.anchor);
    const R = 86, W = this.view.W, H = this.view.H;
    x = Math.max(R + 8, Math.min(W - R - 8, x)); y = Math.max(R + 60, Math.min(H - R - 70, y));
    m.node.style.left = x + 'px'; m.node.style.top = y + 'px';
    if (m.tip) {
      const above = y > H * 0.45;
      m.tip.style.left = Math.max(140, Math.min(W - 140, x)) + 'px';
      m.tip.style.top = above ? '' : (y + R + 40) + 'px';
      m.tip.style.bottom = above ? (H - y + R + 34) + 'px' : '';
    }
  }
  makeMenu(anchor, opts) {
    this.closeMenu();
    const node = el('div', 'ring');
    const tip = el('div', 'tip parch'); tip.style.display = 'none';
    this.ui.append(node, tip);
    this.menu = { node, tip, anchor, opts, sel: -1, openedAt: performance.now() };
    opts.forEach((o, i) => {
      const b = el('button', 'opt' + (o.cls ? ' ' + o.cls : ''), o.html);
      b.style.left = o.dx + 'px'; b.style.top = o.dy + 'px';
      b.style.animationDelay = (i * 0.03) + 's';
      b.setAttribute('aria-label', o.label);
      b.onpointerdown = ev => ev.stopPropagation();
      b.onclick = ev => { ev.stopPropagation(); if (performance.now() - (this.menu?.openedAt || 0) < 400) return; this.pickOpt(i); };
      o.btn = b;
      node.append(b);
    });
    this.positionMenu();
  }
  pickOpt(i) {
    const m = this.menu, o = m.opts[i];
    if (m.sel === i && !o.disabled?.()) { audio.play('button'); o.act(); return; }
    m.sel = i;
    m.opts.forEach((p, j) => p.btn.classList.toggle('sel', j === i));
    audio.play('button', { vol: 0.7, rate: 1.15 });
    m.tip.innerHTML = `<div class="in">${o.info()}</div>`; m.tip.style.display = '';
    o.focus?.();
    this.positionMenu();
    if (o.disabled?.()) { o.btn.animate([{ transform: 'translateX(-4px)' }, { transform: 'translateX(4px)' }, { transform: 'none' }], { duration: 200 }); }
  }
  refreshMenu() {
    const m = this.menu; if (!m) return;
    const key = this.game.gold;
    if (m.lastGold === key) return;
    m.lastGold = key;
    m.opts.forEach(o => o.btn.classList.toggle('poor', !!o.disabled?.()));
    if (m.sel >= 0) m.tip.innerHTML = `<div class="in">${m.opts[m.sel].info()}</div>`;
    else if (m.baseTip) m.tip.innerHTML = m.baseTip();
  }
  costHtml(c) { return `<span class="cost"><img src="assets/ui/icon_coin.webp" alt="">${c}</span>`; }
  openBuildMenu(pad) {
    const g = this.game;
    const pos = [[-52, -50], [52, -50], [-52, 54], [52, 54]];
    this.r.ui.pads = false;
    const opts = TOWER_ORDER.map((type, i) => {
      const T = TOWERS[type], st = towerStats(type, 1);
      return {
        dx: pos[i][0], dy: pos[i][1], label: T.name,
        html: `<img src="assets/towers/${type}_1.webp" alt="">${this.costHtml(g.cost(type))}`,
        cls: g.gold < g.cost(type) ? 'poor' : '',
        disabled: () => g.gold < g.cost(type),
        info: () => `<b>${T.name}</b> <span class="st">· 실 속성 ${ELEM_NAME[T.elem]}</span><div>${T.desc}</div><div class="st">피해 ${Math.round(st.dmg)} · 사거리 ${Math.round(st.range)} · ${g.gold < g.cost(type) ? '<span style="color:#b3361f">금화가 모자라요</span>' : '한 번 더 누르면 세웁니다'}</div>`,
        focus: () => { this.r.ui.preview = { pad, type }; const p = g.padPos(pad); this.r.ui.range = [p[0], p[1], st.range]; this.r.ui.rangeOk = g.gold >= g.cost(type); },
        act: () => { const t = g.build(pad, type); this.closeMenu(); if (t && this.tut) this.tutAfterBuild(); },
      };
    });
    this.makeMenu(g.padPos(pad), opts);
    this.menu.pad = pad;
    // 가난한 상태 갱신용
    this.menu.refresh = () => this.refreshMenu();
  }
  openTowerMenu(t) {
    const g = this.game;
    const T = TOWERS[t.type], st = towerStats(t.type, t.level);
    const up = g.upgradePrice(t);
    const nx = t.level < MAX_LEVEL ? towerStats(t.type, t.level + 1) : null;
    const links = g.threads.filter(th => th.a === t || th.b === t).map(th => `${th.combo.name}(${th.crosses ? '길 위' : '힘 나눔'})`);
    const opts = [
      {
        dx: 0, dy: -68, label: '올리기',
        html: nx ? `<img src="assets/towers/${t.type}_${t.level + 1}.webp" alt="">${this.costHtml(up)}` : '<span class="sym">★</span>',
        cls: !nx || g.gold < up ? 'poor' : '',
        disabled: () => !nx || g.gold < up,
        info: () => nx ? `<b>${T.name} ${t.level + 1}단계</b><div class="st">피해 ${Math.round(st.dmg)} → ${Math.round(nx.dmg)} · 사거리 ${Math.round(st.range)} → ${Math.round(nx.range)}</div><div class="st">${g.gold < up ? '<span style="color:#b3361f">금화가 모자라요</span>' : '한 번 더 누르면 올립니다'}</div>` : `<b>${T.name} 최고 단계</b><div class="st">갈래 고르기는 다음 왕국에서 열립니다.</div>`,
        focus: () => { const p = g.padPos(t.pad); this.r.ui.range = [p[0], p[1], (nx || st).range]; this.r.ui.rangeOk = true; },
        act: () => { if (g.upgrade(t)) this.closeMenu(); },
      },
      {
        dx: 0, dy: 70, label: '팔기', cls: 'sell',
        html: `<span class="sym" style="font-size:22px">팔기</span>${this.costHtml(g.sellPrice(t))}`,
        info: () => `<b>팔기</b><div class="st">금화 ${g.sellPrice(t)}개를 돌려받습니다.${links.length ? ' 이어진 실도 풀립니다.' : ''} 한 번 더 누르면 팝니다.</div>`,
        focus: () => {},
        act: () => { g.sell(t); this.closeMenu(); },
      },
    ];
    this.makeMenu(g.padPos(t.pad), opts);
    this.menu.refresh = () => this.refreshMenu();
    this.r.ui.sel = t;
    const p = g.padPos(t.pad); this.r.ui.range = [p[0], p[1], st.range]; this.r.ui.rangeOk = true;
    this.menu.tip.innerHTML = `<div class="in"><b>${T.name} ${t.level}단계</b> <span class="st">· 실 속성 ${ELEM_NAME[T.elem]}</span><div class="st">피해 ${Math.round(st.dmg)} · 사거리 ${Math.round(st.range)}${links.length ? ' · ' + links.join(', ') : ''}</div><div class="st">꾹 눌러 다른 탑으로 끌면 실이 이어집니다.</div></div>`;
    this.menu.tip.style.display = '';
    this.positionMenu();
  }
  openThreadMenu(th) {
    const opts = [{
      dx: 0, dy: 0, label: '실 끊기',
      html: '<span class="sym">✂</span>',
      info: () => `<b>${th.combo.name}</b><div class="st">${th.combo.desc}</div><div class="st">한 번 더 누르면 끊습니다. 실패는 4초 뒤 다시 쓸 수 있어요.</div>`,
      focus: () => {},
      act: () => { this.game.cut(th); this.closeMenu(); },
    }];
    this.makeMenu(th._mid || this.game.towerTop(th.a), opts);
    this.r.ui.selThread = th;
    this.pickOpt(0);
  }
  toast(text) {
    if (!text) return;
    this.toastEl?.remove();
    const b = el('div', 'toast parch pass', text);
    b.style.top = (this.insets().t + 8) + 'px';
    this.toastEl = b;
    this.ui.append(b);
    this.later(2.7, () => b.remove());
  }
  banner(main, sub) {
    const b = el('div', 'banner', `${main}${sub ? `<small>${sub}</small>` : ''}`);
    this.ui.append(b);
    this.later(1.9, () => b.remove());
  }

  // ── 말풍선·안내 ──
  showTalk(i) {
    const lines = this.level.talk || [];
    if (i >= lines.length) { this.talking = false; this.bubble?.remove(); this.bubble = null; if (this.tut) this.tutStep(1); return; }
    this.talking = true;
    if (!this.bubble) {
      this.bubble = el('div', 'bubble parch');
      this.ui.append(this.bubble);
      this.bubble.onclick = () => { audio.play('whoosh', { vol: 0.5 }); this.showTalk(this.talkI + 1); };
    }
    this.talkI = i;
    const L = lines[i];
    this.bubble.style.top = this.ori === 'v' ? '30%' : '26%';
    this.bubble.innerHTML = `<div class="in"><div><div class="who">${L.who}</div>${L.text}<div class="next">눌러서 넘기기 ▸</div></div></div>`;
  }
  tutStep(n) {
    const T = this.tut; if (!T || n < T.step) return;
    T.step = n;
    this.hand?.remove(); this.hand = null; this.tutTip?.remove(); this.tutTip = null;
    const g = this.game;
    const tipAt = (text, keep = []) => {
      const b = el('div', 'bubble parch pass'); b.innerHTML = `<div class="in"><div>${text}</div></div>`;
      this.ui.append(b); this.tutTip = b; this.placeTip(b, keep);
      b.dataset.until = this.realT + (n === 4 ? 7 : 6);
    };
    if (n === 1) {
      // 입구에서 가까운 빈자리 하나를 가리킨다
      const pad = 0;
      this.tutPad = pad;
      this.hand = el('div', 'hand tap pass', '👆'); this.ui.append(this.hand);
      tipAt('<b>빈자리</b>를 눌러 탑을 세워 보세요.', [this.tutPad]);
      this.r.ui.pads = true;
    } else if (n === 2) {
      tipAt('좋아요! 탑을 하나 더 세우거나, 준비되면 <b>▶ 시작</b>을 누르세요.', g.towers.map(t => t.pad));
    } else if (n === 4) {
      this.pickTutPair();
      tipAt('<b>탑을 꾹 눌러 다른 탑으로 끌어</b> 보세요. 두 탑이 실로 이어져 서로의 힘을 나누고, 실이 길 위를 지나면 그 밑을 지나는 적에게 섞인 힘이 들어갑니다.', [T.dragA?.pad, T.dragB?.pad]);
      this.hand = el('div', 'hand pass', '👆'); this.ui.append(this.hand);
      
    } else if (n === 9) { this.r.ui.pads = false; }
  }
  pickTutPair() {
    const T = this.tut, g = this.game;
    let best = null, bs = -1;
    for (const a of g.towers) for (const b of g.towers) {
      if (a.id >= b.id || g.linkCheck(a, b) !== 'ok') continue;
      const s = (g.threadCrosses(a, b) ? 10 : 0) - g.threadLen(a, b) / 100;
      if (s > bs) { bs = s; best = [a, b]; }
    }
    T.dragA = best?.[0]; T.dragB = best?.[1];
  }
  // 안내 풍선을 빈자리·탑을 덜 가리는 높이로 옮긴다
  placeTip(b, keep = []) {
    if (!b) return;
    const g = this.game, H = this.view.H;
    const ins = this.insets();
    const h = b.offsetHeight || 90;
    const pads = g.geo.pads.map((p, i) => [...this.view.w2s(...p), keep.includes(i) ? 50 : 1]);
    const cands = [];
    for (let y = ins.t + 6; y + h < H - ins.b - 6; y += 12) cands.push(y);
    let best = cands[0], bc = 1e9;
    for (const y of cands) {
      let c = 0;
      // 빈자리(탑 머리 포함: 위로 110px)와 겹치면 벌점, 안내가 가리키는 자리는 큰 벌점
      for (const [, py, w] of pads) if (py > y - 30 && py - 110 < y + h) c += w;
      c += Math.abs(y - H * 0.4) / H;  // 같으면 가운데쯤
      if (c < bc) { bc = c; best = y; }
    }
    b.style.top = best + 'px';
  }
  tutAfterBuild() {
    if (this.tut.step === 1) { this.r.ui.pads = false; this.tutStep(2); }
  }
  tutUpdate() {
    const T = this.tut; if (!T) return;
    const g = this.game;
    if (this.tutTip && this.realT > +this.tutTip.dataset.until) { const tt = this.tutTip; this.tutTip = null; tt.classList.add('hide'); this.later(0.4, () => tt.remove()); }
    this.r.ui.tutPair = T.step === 4 && T.dragA && T.dragB ? [T.dragA, T.dragB] : null;
    if (T.step === 1 && this.hand) {
      const [x, y] = this.view.w2s(...g.padPos(this.tutPad));
      this.hand.style.left = x + 'px'; this.hand.style.top = y + 'px';
      this.hand.style.display = this.menu ? 'none' : '';
      if (this.tutTip) this.tutTip.style.display = this.menu ? 'none' : '';
    }
    if (T.step === 2 && this.tutTip && this.menu) this.tutTip.style.display = 'none';
    else if (T.step === 2 && this.tutTip) this.tutTip.style.display = '';
    if (T.step === 3) { this.tutTip?.remove(); this.tutTip = null; if (g.wave >= 1 && g.towers.length >= 2 && !g.threads.length && g.spawning.length === 0) this.tutStep(4); }
    if (T.step === 4) {
      if (g.threads.length) { this.hand?.remove(); this.hand = null; this.tutTip?.remove(); this.tutTip = null; T.step = 9; this.toast('실이 이어졌어요! 실을 누르면 끊을 수 있어요.'); return; }
      if (!T.dragB || !g.towers.includes(T.dragB) || !g.towers.includes(T.dragA)) this.pickTutPair();
      if (this.hand && T.dragB) {
        const a = this.view.w2s(...g.padPos(T.dragA.pad)), b = this.view.w2s(...g.padPos(T.dragB.pad));
        const u = (this.realT % 2) / 2, k = u < 0.2 ? 0 : u > 0.8 ? 1 : (u - 0.2) / 0.6;
        this.hand.style.left = (a[0] + (b[0] - a[0]) * k) + 'px'; this.hand.style.top = (a[1] + (b[1] - a[1]) * k) + 'px';
        this.hand.style.opacity = u > 0.9 ? 0 : 1;
      } else if (this.hand) this.hand.style.display = 'none';
      if (this.tutTip) this.tutTip.style.display = this.menu ? 'none' : '';
    }
  }

  // ── 일시정지·결과 ──
  openPause() {
    if (this.game.result) return;
    this.paused = true; this.closeMenu(); audio.duck(true);
    const S = this.app.settings;
    const m = el('div', 'modal');
    m.innerHTML = `<div class="box parch"><h2>잠깐 쉬기</h2>
      <div class="row"><span>음악</span><input type="range" min="0" max="1" step="0.05" value="${S.music}" data-k="music"></div>
      <div class="row"><span>효과음</span><input type="range" min="0" max="1" step="0.05" value="${S.sfx}" data-k="sfx"></div>
      <div class="row"><span>진동</span><button class="toggle ${S.vibe ? 'on' : ''}" aria-label="진동"></button></div>
      <div class="btns"><button class="btn" data-a="go">계속하기</button><button class="btn small" data-a="retry">처음부터</button></div></div>`;
    this.ui.append(m);
    m.querySelectorAll('input[type=range]').forEach(r => r.oninput = () => { S[r.dataset.k] = +r.value; audio.setVolume(r.dataset.k, +r.value); this.app.save(); });
    const tg = m.querySelector('.toggle');
    tg.onclick = () => { S.vibe = !S.vibe; tg.classList.toggle('on', S.vibe); this.app.save(); vibrate(20); };
    m.querySelector('[data-a=go]').onclick = () => { audio.play('button'); m.remove(); this.paused = false; audio.duck(false); };
    m.querySelector('[data-a=retry]').onclick = () => { audio.play('button'); this.app.startLevel(this.level.id); };
  }
  showResult(win) {
    const g = this.game;
    const m = el('div', 'modal');
    const stars = win ? g.stars : 0;
    m.innerHTML = `<div class="box parch"><h2>${win ? '왕국을 지켰다!' : '성문이 뚫렸다…'}</h2>
      ${win ? `<div class="stars">${[1, 2, 3].map(() => '<img src="assets/ui/icon_star.webp" alt="">').join('')}</div>` : ''}
      <p>${win ? `남은 생명 ${g.lives}/${g.maxLives} · 쓰러뜨린 적 ${g.stats.kills}` : `웨이브 ${g.wave + 1}/${g.level.waves.length}에서 멈췄어요. 탑 자리와 실 잇기를 바꿔 보세요.`}</p>
      <div class="btns"><button class="btn" data-a="retry">${win ? '다시 하기' : '다시 도전'}</button></div></div>`;
    this.ui.append(m);
    if (win) m.querySelectorAll('.stars img').forEach((im, i) => { if (i < stars) this.later(0.5 + i * 0.35, () => { im.classList.add('on'); audio.play('star', { rate: 1 + i * 0.12 }); }); });
    m.querySelector('[data-a=retry]').onclick = () => { audio.play('button'); this.app.startLevel(this.level.id); };
  }

  // ── 사건 → 연출·소리 ──
  handleEvents() {
    const g = this.game, R = this.r;
    for (const ev of g.events) {
      switch (ev.t) {
        case 'build': {
          R.dropTower(ev.tower);
          const p = g.padPos(ev.tower.pad);
          this.later(0.24, () => { R.dust(p[0], p[1] + 10, 16); R.shake(5); audio.play('tower_place'); vibrate(15); });
          break;
        }
        case 'upgrade': { const p = g.padPos(ev.tower.pad); R.dropTower(ev.tower); this.later(0.24, () => { R.sparks(p[0], p[1] - 60, '#ffd96a', 18, 220); R.dust(p[0], p[1] + 10, 10); R.shake(4); }); audio.play('tower_upgrade'); vibrate(15); break; }
        case 'sell': { const p = g.padPos(ev.tower.pad); R.dust(p[0], p[1], 14); R.float(p[0], p[1] - 40, '+' + g.sellPrice(ev.tower), '#ffe48a', 'icon_coin'); audio.play('tower_sell'); break; }
        case 'link': {
          R.wobbleThread(ev.thread);
          const a = g.towerTop(ev.thread.a), b = g.towerTop(ev.thread.b);
          for (let i = 0; i <= 8; i++) R.sparks(a[0] + (b[0] - a[0]) * i / 8, a[1] + (b[1] - a[1]) * i / 8 + Math.sin(i / 8 * Math.PI) * 20, ev.thread.combo.glow, 3, 120);
          audio.play('thread_ting'); vibrate(25);
          const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
          R.float(m[0], m[1], ev.thread.combo.name, ev.thread.combo.color);
          break;
        }
        case 'cut': if (!ev.silent) audio.play('thread_cut'); break;
        case 'shoot': { const [n, v] = SHOT_SFX[ev.tower.type]; audio.play(n, { vol: v, gap: 0.06 }); R.shoot(g, ev); break; }
        case 'hit': {
          if (ev.src && ev.src.type !== 'lightning') audio.play(HIT_SFX[ev.mat], { vol: 0.45, gap: 0.05 });
          const e = ev.enemy;
          if (ev.mat === 'paint') R.splat(e.x, e.y, '#d42a2a', 3, 0.5);
          else R.sparks(e.x, e.y - e.def.size * 0.5, ev.mat === 'metal' ? '#fff2c0' : '#e2b27a', 3, 120);
          break;
        }
        case 'kill': {
          const e = ev.enemy;
          R.splat(e.x, e.y, '#d42a2a', 14, e.def.size / 70);
          R.float(e.x, e.y - e.def.size * 0.6, '+' + ev.reward, '#ffe48a', 'icon_coin');
          audio.play('enemy_pop', { vol: 0.8 });
          if (e.def.lives > 1) { this.hitstop = 0.05; R.shake(5); }
          this.bump(this.cGold);
          break;
        }
        case 'leak': {
          audio.play('life_lost'); R.shake(12); vibrate(45);
          this.cLives.classList.remove('hurt'); void this.cLives.offsetWidth; this.cLives.classList.add('hurt');
          this.flashRed();
          break;
        }
        case 'boom': audio.play('cannon_hit', { vol: 0.7, gap: 0.05 }); R.boom(ev.x, ev.y, ev.r); R.shake(3 + ev.n * 1.5); if (ev.n >= 3) this.hitstop = Math.max(this.hitstop, 0.045); break;
        case 'bolt': ev.pts[0] = R.muzzle(g, ev.tower); R.bolt(ev.pts); break;
        case 'thread_fx': {
          if (ev.kind === 'burn') audio.play('fire_burn', { vol: 0.5, gap: 0.2 });
          else if (ev.kind === 'stun') { audio.play('freeze', { vol: 0.6, gap: 0.1 }); R.sparks(ev.x, ev.y - 30, '#bfefff', 10, 160); }
          else if (ev.kind === 'spark') { audio.play('cannon_hit', { vol: 0.5, gap: 0.1 }); R.sparks(ev.x, ev.y - 30, '#ffcf6a', 14, 200); }
          else if (ev.kind === 'rail') { audio.play('zap_chain', { vol: 0.6, gap: 0.2 }); R.rail(ev.thread); }
          break;
        }
        case 'wave': audio.play('wave_start'); this.banner(`웨이브 ${ev.n}`, ev.n === ev.total ? '마지막 웨이브' : ''); break;
        case 'bonus': audio.play('coin'); this.bump(this.cGold); break;
        case 'win': audio.play('victory'); audio.duck(true); this.later(1.4, () => this.showResult(true)); break;
        case 'lose': audio.play('defeat'); audio.duck(true); this.later(1.2, () => this.showResult(false)); break;
      }
    }
    g.events.length = 0;
  }
  bump(node) { node.classList.remove('bump'); void node.offsetWidth; node.classList.add('bump'); }
  flashRed() {
    const f = el('div', 'pass'); f.style.cssText = 'position:absolute;inset:0;box-shadow:inset 0 0 120px 30px rgba(200,30,20,.55);transition:opacity .6s;';
    this.ui.append(f); requestAnimationFrame(() => requestAnimationFrame(() => f.style.opacity = '0'));
    this.later(0.7, () => f.remove());
  }

  // ── 매 장면 ──
  frame(dtReal) {
    this.realT += dtReal;
    for (let i = this.timers.length - 1; i >= 0; i--) if (this.timers[i].at <= this.realT) { const t = this.timers[i]; this.timers.splice(i, 1); if (this.alive) t.fn(); }
    let dt = 0;
    if (!this.paused && !this.talking) {
      dt = dtReal * this.speed;
      this.acc += dt;
      let n = 0;
      while (this.acc >= DT && n < 12) {
        this.acc -= DT; n++;
        if (this.hitstop > 0) { this.hitstop -= DT; continue; }
        this.game.step(DT);
      }
      if (n >= 12) this.acc = 0;
    }
    this.handleEvents();
    if (this.menu?.refresh) this.menu.refresh();
    this.updateHud();
    this.tutUpdate();
    this.r.draw(this.game, this.paused ? 0 : dtReal * (this.talking ? 1 : this.speed));
  }
  destroy() {
    this.alive = false; this.timers = [];
    document.removeEventListener('visibilitychange', this.onVis);
    this.unbind();
    this.ui.innerHTML = '';
  }
}
