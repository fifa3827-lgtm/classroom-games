// 꼬물이 구구단 화면 도우미(세 놀이 공용) — 게임 스크립트 뒤에 붙인다.
// 1) 첫 터치·첫 키에 전체 화면(휴대폰은 가로로 고정). 아이폰은 브라우저가 막아서 「홈 화면에 추가」로 연다.
// 2) 게임 옆이나 아래 빈 곳에 큰 숫자판. 누르면 숫자 키를 누른 것과 같다(게임의 키보드 처리를 그대로 씀).
(function(){
'use strict';
const cv = document.querySelector('canvas'), box = cv.parentElement, root = document.documentElement;
const coarse = matchMedia('(pointer: coarse)').matches;

// ───── 전체 화면 ─────
const installed = matchMedia('(display-mode: fullscreen), (display-mode: standalone)').matches;
const FS_OK = !navigator.webdriver && !installed && !!(root.requestFullscreen || root.webkitRequestFullscreen);
let entered = false, userLeft = false;   // 아이가 스스로 빠져나오면 이 화면에서는 다시 들어가지 않음
const isFull = () => !!(document.fullscreenElement || document.webkitFullscreenElement);
function goFull(){
  if (!FS_OK || userLeft || isFull()) return;
  entered = true;
  try {
    const p = root.requestFullscreen ? root.requestFullscreen({ navigationUI: 'hide' }) : root.webkitRequestFullscreen();
    Promise.resolve(p).then(() => {
      if (coarse && Math.min(screen.width, screen.height) < 600 && screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(() => {});
    }).catch(() => {});
  } catch (_) {}
}
for (const ev of ['fullscreenchange', 'webkitfullscreenchange']) document.addEventListener(ev, () => { if (!isFull() && entered) userLeft = true; });
addEventListener('pointerup', goFull, true);
addEventListener('keydown', e => { if (e.isTrusted && e.key !== 'Escape') goFull(); }, true);

// ───── 큰 숫자판 ─────
const css = document.createElement('style');
css.textContent = `
#bigpad{position:fixed;display:none;flex-direction:column;align-items:center;justify-content:center;gap:var(--g);box-sizing:border-box;padding:12px;font-family:Jua,"Malgun Gothic",sans-serif;color:#3d3030;touch-action:none;user-select:none;-webkit-user-select:none;-webkit-tap-highlight-color:transparent;z-index:5}
#bigpad .q{background:#fffdf8;border:4px solid #3d3030;border-radius:18px;padding:0 .6em;font-size:calc(var(--k)*.5);line-height:calc(var(--k)*.85);white-space:nowrap}
#bigpad .q b{font-weight:normal;color:#2f6db0}
#bigpad .keys{display:grid;grid-template-columns:repeat(var(--c),var(--k));grid-auto-rows:var(--k);gap:var(--g)}
#bigpad button{font:inherit;font-size:calc(var(--k)*.5);color:#3d3030;background:#fff1a8;border:4px solid #3d3030;border-radius:16px;box-shadow:0 5px 0 #d8c8b4;padding:0;cursor:pointer;touch-action:none}
#bigpad button.del{background:#ffdede;font-size:calc(var(--k)*.3)}
#bigpad button.on{transform:translateY(4px);box-shadow:0 1px 0 #d8c8b4}
#bigpad .keys,#bigpad .q{transition:opacity .25s,filter .25s}
#bigpad.off .keys{opacity:.35;filter:grayscale(.7)}
#bigpad.off button{pointer-events:none}
#bigpad.off .q{opacity:.7;font-size:calc(var(--k)*.3);border-style:dashed}
#gomenu{position:fixed;display:none;flex-direction:column;align-items:center;justify-content:center;gap:.15em;box-sizing:border-box;padding:0;line-height:1;-webkit-appearance:none;appearance:none;font-family:Jua,"Malgun Gothic",sans-serif;color:#3d3030;background:rgba(255,250,240,.92);border:3px solid #3d3030;border-radius:16px;box-shadow:0 4px 0 rgba(61,48,48,.25);cursor:pointer;z-index:6;touch-action:none;-webkit-tap-highlight-color:transparent}
#gomenu b{display:block;font-size:1.6em;font-weight:normal;line-height:1}
#askmenu,#turn{position:fixed;inset:0;display:none;align-items:center;justify-content:center;flex-direction:column;font-family:Jua,"Malgun Gothic",sans-serif;color:#3d3030;z-index:9;touch-action:none}
#askmenu{background:rgba(61,48,48,.45)}
#askmenu .card{background:#fffdf8;border:4px solid #3d3030;border-radius:28px;padding:24px 28px;text-align:center;font-size:28px;max-width:90vw}
#askmenu .row{display:flex;gap:14px;justify-content:center;margin-top:18px}
#askmenu button{font:inherit;font-size:24px;color:#3d3030;border:4px solid #3d3030;border-radius:18px;padding:10px 22px;box-shadow:0 5px 0 rgba(61,48,48,.25);cursor:pointer}
#turn{background:#fdf1e2;font-size:28px;text-align:center;gap:18px}
#turn i{font-style:normal;font-size:96px;animation:turn 2s ease-in-out infinite}
@keyframes turn{0%,25%{transform:rotate(0)}55%,100%{transform:rotate(-90deg)}}`;
document.head.appendChild(css);
const pad = document.createElement('div'); pad.id = 'bigpad';
pad.innerHTML = '<div class="q"></div><div class="keys"></div>';
const qEl = pad.querySelector('.q'), keysEl = pad.querySelector('.keys');
document.body.append(pad);

// ───── 놀이 중 「← 메뉴」(한 번 더 물어봄) ─────
const menuBtn = document.createElement('button'); menuBtn.id = 'gomenu'; menuBtn.type = 'button';
menuBtn.innerHTML = '<b>←</b>메뉴';
const ask = document.createElement('div'); ask.id = 'askmenu';
ask.innerHTML = '<div class="card">그만하고 메뉴로 갈까요?<div class="row"><button type="button" class="no" style="background:#fff1a8">계속하기</button><button type="button" class="yes" style="background:#ffdede">메뉴로</button></div></div>';
document.body.append(menuBtn, ask);
let asking = false;
menuBtn.addEventListener('pointerdown', e => { e.preventDefault(); asking = true; ask.style.display = 'flex'; });
ask.querySelector('.no').addEventListener('pointerdown', e => { e.preventDefault(); asking = false; ask.style.display = 'none'; });
ask.querySelector('.yes').addEventListener('pointerdown', e => { e.preventDefault(); location.href = 'index.html'; });

// ───── 세로로 든 휴대폰: 가로로 돌려 달라고(게임이 가로 화면이라 세로에선 너무 작음) ─────
const phone = coarse && Math.min(screen.width, screen.height) < 600;
const turn = document.createElement('div'); turn.id = 'turn';
turn.innerHTML = '<i>📱</i>휴대폰을 가로로 돌려 주세요';
document.body.append(turn);

function makeKeys(order, wide){
  keysEl.innerHTML = '';
  for (const s of order){
    const b = document.createElement('button'); b.type = 'button';
    b.textContent = s === 'del' ? '지우기' : s;
    if (s === 'del') b.className = 'del';
    if (s === wide) b.style.gridColumn = 'span 2';
    b.addEventListener('pointerdown', e => {
      e.preventDefault();
      b.classList.add('on'); setTimeout(() => b.classList.remove('on'), 120);
      dispatchEvent(new KeyboardEvent('keydown', { key: s === 'del' ? 'Backspace' : s, bubbles: true }));
    });
    keysEl.appendChild(b);
  }
}

// 놀이마다 다른 숫자판 정보를 같은 모양으로(버스: pad, 젤리: keypad, 줄줄이: pad.active)
function padNow(){
  const g = window.__game; if (!g) return null;
  const kp = g.keypad;
  if (kp) return { q: kp.b + '×' + kp.k, typed: kp.input };
  const p = g.pad; if (!p) return null;
  if ('active' in p) return p.active ? { q: p.q.a + '×' + p.q.b, typed: p.input } : null;
  return { q: p.k + '×' + p.n, typed: p.typed };
}

let mode = 'none', shown, lastQ = '';
function layout(){
  const vw = innerWidth, vh = innerHeight, cw = cv.offsetWidth, ch = cv.offsetHeight;
  const lx = vw - cw, ly = vh - ch, g = 10;
  box.style.justifyContent = ''; box.style.alignItems = '';
  pad.style.left = pad.style.right = pad.style.top = pad.style.bottom = pad.style.width = pad.style.height = '';
  let k;
  if (lx >= 240){
    // 옆에 빈 곳: 좁으면 게임을 왼쪽에 붙여 오른쪽을 모두 숫자판에
    mode = 'side';
    const w = lx / 2 < 220 ? lx : lx / 2;
    if (w === lx) box.style.justifyContent = 'flex-start';
    Object.assign(pad.style, { right: '0', top: '64px', width: w + 'px', height: vh - 64 + 'px' });   // 위 64px는 「← 메뉴」 자리
    k = Math.min((w - 24 - 2 * g) / 3, (vh - 64 - 24 - 5 * g) / 4.9, 110);
    makeKeys(['1', '2', '3', '4', '5', '6', '7', '8', '9', 'del', '0'], '0');
    pad.style.setProperty('--c', 3);
  } else if (ly >= 200){
    // 아래에 빈 곳(세로 화면)
    mode = 'bottom';
    const h = ly / 2 < 220 ? ly : ly / 2;
    if (h === ly) box.style.alignItems = 'flex-start';
    Object.assign(pad.style, { left: '0', bottom: '0', width: vw + 'px', height: h + 'px' });
    k = Math.min((vw - 24 - 5 * g) / 6, (h - 24 - 3 * g) / 2.9, 110);
    makeKeys(['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', 'del'], 'del');
    pad.style.setProperty('--c', 6);
  } else mode = 'none';
  if (mode !== 'none'){ pad.style.setProperty('--k', Math.floor(k) + 'px'); pad.style.setProperty('--g', g + 'px'); }
  window.__bigPadOn = mode !== 'none';   // 게임은 이 값을 보고 자기 숫자판을 숨김
  shown = undefined;
  // 「← 메뉴」: 게임 바깥 빈 곳(왼쪽 → 위 → 오른쪽 숫자판 위) 먼저, 없으면 게임 왼쪽 위에 겹쳐
  const r = cv.getBoundingClientRect();
  menuBtn.style.left = menuBtn.style.right = '';
  const s = r.left >= 40 ? Math.min(56, r.left - 6) : 56;   // 왼쪽 빈 곳이 좁으면(태블릿) 단추를 줄여서라도 게임 밖에
  Object.assign(menuBtn.style, { width: s + 'px', height: s + 'px', fontSize: s * 0.27 + 'px' });
  if (r.left >= 40) Object.assign(menuBtn.style, { left: (r.left - s) / 2 + 'px', top: r.top + 8 + 'px' });
  else if (r.top >= 64) Object.assign(menuBtn.style, { left: r.left + 8 + 'px', top: (r.top - 56) / 2 + 'px' });
  else if (mode === 'side') Object.assign(menuBtn.style, { right: '12px', top: '4px' });
  else Object.assign(menuBtn.style, { left: r.left + 6 + 'px', top: r.top + 6 + 'px' });
  turn.style.display = phone && vh > vw ? 'flex' : 'none';
}
addEventListener('resize', layout); layout();

function frame(){
  requestAnimationFrame(frame);
  const g = window.__game, playing = !!g && g.state === 'play';
  menuBtn.style.display = playing && !asking ? 'flex' : 'none';
  if (!playing && asking){ asking = false; ask.style.display = 'none'; }
  // 숫자판은 늘 보이고(빈 곳이 휑하지 않게, 자리도 미리 익히게), 숫자를 쓸 때만 밝게 켜짐
  const p = mode === 'none' ? null : padNow();
  const st = mode === 'none' ? 'hide' : p ? 'on' : 'off';
  if (st !== shown){
    shown = st; pad.style.display = st === 'hide' ? 'none' : 'flex'; pad.classList.toggle('off', st === 'off');
    if (st === 'off'){ qEl.textContent = '🐣 숫자 쓸 때 켜져요'; lastQ = ''; }
  }
  if (p){
    const q = p.q + '|' + p.typed;
    if (q !== lastQ){ lastQ = q; qEl.innerHTML = p.q + ' = <b>' + (p.typed || '?') + '</b>'; }
  }
}
requestAnimationFrame(frame);
})();
