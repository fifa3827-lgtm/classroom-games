/* 달빛 오락실 대문의 「새 소식」 알림 띠
   대문 index.html 의 </body> 바로 앞에 <script src="news/banner.js" defer></script> 한 줄만 넣으면 된다.
   news/news.json 의 맨 위 소식을 게임기 줄 위에 한 줄로 보여 준다.
   ✕ 를 누르면 사라지고, 새 소식이 올라오면 다시 뜬다.
   소식은 게임처럼 새 창으로 열려서, 창을 닫으면 대문으로 돌아온다. */
(function () {
  var KEY = 'moonlit-news-closed';
  function place(bar) {
    var slot = document.getElementById('newsslot');
    if (slot) { slot.appendChild(bar); return true; }
    var cab = document.querySelector('.cab');
    var row = cab && cab.parentElement;
    if (row && row.parentElement) { row.parentElement.insertBefore(bar, row); return true; }
    return false;
  }
  function css() {
    var s = document.createElement('style');
    s.textContent =
      '#newsbar{display:flex;align-items:center;gap:8px;max-width:560px;margin:-6px auto 38px;padding:4px 4px 4px 12px;' +
      'border-radius:999px;background:rgba(23,21,58,.45);border:1px solid rgba(244,196,106,.28);' +
      'font:14px/1.4 "Gowun Dodum",system-ui,sans-serif;color:#e8e4f5;box-sizing:border-box;width:calc(100% - 32px)}' +
      '#newsbar:hover{border-color:rgba(244,196,106,.6)}' +
      '#newsbar a{flex:1;min-width:0;display:flex;gap:8px;align-items:center;color:inherit;text-decoration:none}' +
      '#newsbar .tag{flex:none;color:#f4c46a;font-weight:700;font-size:13px}' +
      '#newsbar .tt{overflow:hidden;white-space:nowrap;text-overflow:ellipsis}' +
      '#newsbar .go{flex:none;color:#f4c46a}' +
      '#newsbar button{flex:none;width:28px;height:28px;border-radius:50%;border:0;background:transparent;color:#8f88b8;font-size:15px;cursor:pointer}' +
      '#newsbar button:hover{background:rgba(255,255,255,.08);color:#fff}' +
      '#newsbar a:focus-visible,#newsbar button:focus-visible{outline:2px solid #fff;outline-offset:2px;border-radius:999px}';
    document.head.appendChild(s);
  }
  function show(n) {
    try { if (localStorage.getItem(KEY) === n.slug) return; } catch (e) {}
    css();
    var bar = document.createElement('div');
    bar.id = 'newsbar'; bar.setAttribute('role', 'region'); bar.setAttribute('aria-label', '새 소식');
    var a = document.createElement('a'); a.href = 'news/' + n.slug + '/'; a.target = '_blank'; a.rel = 'noopener';
    a.innerHTML = '<span class="tag">새 소식</span><span class="tt"></span><span class="go">›</span>';
    a.querySelector('.tt').textContent = n.title;
    var x = document.createElement('button'); x.type = 'button'; x.setAttribute('aria-label', '새 소식 닫기'); x.textContent = '✕';
    x.addEventListener('click', function () { try { localStorage.setItem(KEY, n.slug); } catch (e) {} bar.remove(); });
    bar.appendChild(a); bar.appendChild(x);
    var tries = 0;
    (function wait() { if (!place(bar) && tries++ < 40) setTimeout(wait, 100); })();
  }
  fetch('news/news.json', { cache: 'no-store' })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (list) { if (list && list[0]) show(list[0]); })
    .catch(function () {});
})();
