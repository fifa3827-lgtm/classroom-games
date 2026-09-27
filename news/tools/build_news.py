#!/usr/bin/env python3
"""달빛 오락실 소식 페이지 만들기: posts.py → out/news/"""
import html, json, os, shutil, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from posts import POSTS, CATS

SITE = "https://game.edoori.co.kr"
OUT = sys.argv[1] if len(sys.argv) > 1 else "out/news"
E = html.escape
HERE = os.path.dirname(os.path.abspath(__file__))


def dot(d):
    return d.replace("-", ".")


def head(title, desc, url, image, extra=""):
    return f"""<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{E(title)}</title>
<meta name="description" content="{E(desc)}">
<link rel="canonical" href="{url}">
<meta name="theme-color" content="#17153a">
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🌙</text></svg>">
<meta property="og:type" content="article">
<meta property="og:site_name" content="달빛 오락실">
<meta property="og:title" content="{E(title)}">
<meta property="og:description" content="{E(desc)}">
<meta property="og:url" content="{url}">
<meta property="og:image" content="{SITE}{image}">
<meta name="twitter:card" content="summary_large_image">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Jua&family=Gowun+Dodum&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/intro/intro.css">
<link rel="stylesheet" href="/news/news.css">
{extra}
</head>
<body class="landscape">
<div class="sky" aria-hidden="true"></div>
<header class="top">
  <a class="home" href="/"><span class="moon" aria-hidden="true"></span>달빛 오락실</a>
  <a class="crumb" href="/news/" style="text-decoration:none">📰 소식</a>
</header>
"""


FOOT = """<footer>달빛 오락실 · 설치 없이 바로 하는 무료 웹게임</footer>
</body>
</html>
"""


def block(b):
    k = b[0]
    if k == "p":
        return f"<p>{E(b[1])}</p>"
    if k == "h":
        return f"<h2>{E(b[1])}</h2>"
    if k == "list":
        return "<ul>" + "".join(f"<li>{E(x)}</li>" for x in b[1]) + "</ul>"
    if k == "steps":
        return "<ol>" + "".join(f"<li>{E(x)}</li>" for x in b[1]) + "</ol>"
    if k == "img":
        return f'<figure><img src="{E(b[1])}" alt="{E(b[2])}" loading="lazy"><figcaption>{E(b[2])}</figcaption></figure>'
    if k == "btn":
        return f'<p class="btnrow"><a class="start" href="{E(b[2])}">{E(b[1])}</a></p>'
    if k == "game":
        _, emo, name, desc, href, img = b
        return (f'<div class="gcard"><img src="{E(img)}" alt="{E(name)} 경기 장면" loading="lazy">'
                f'<div><h3>{emo} {E(name)}</h3><p>{E(desc)}</p>'
                f'<a class="start" href="{E(href)}"><span aria-hidden="true">▶</span> {E(name)} 하러 가기</a></div></div>')
    raise ValueError(k)


def article(i, p):
    url = f"{SITE}/news/{p['slug']}/"
    ld = {"@context": "https://schema.org", "@type": "BlogPosting", "headline": p["title"],
          "description": p["summary"], "datePublished": p["date"], "image": SITE + p["cover"], "url": url,
          "publisher": {"@type": "Organization", "name": "달빛 오락실", "url": SITE + "/"}}
    newer = POSTS[i - 1] if i > 0 else None
    older = POSTS[i + 1] if i + 1 < len(POSTS) else None
    nav = '<nav class="nav2">'
    nav += f'<a href="/news/{older["slug"]}/">← {E(older["title"])}</a>' if older else "<span></span>"
    nav += f'<a href="/news/{newer["slug"]}/">{E(newer["title"])} →</a>' if newer else '<span></span>'  # 맨 위 글: 아래 「← 소식 목록으로」와 겹치지 않게 비워 둔다
    nav += "</nav>"
    return (head(f"{p['title']} · 달빛 오락실 소식", p["summary"], url, p["cover"],
                 f'<script type="application/ld+json">{json.dumps(ld, ensure_ascii=False)}</script>')
            + f"""<main><article class="article">
<div class="meta"><span class="chip {p['cat']}">{CATS[p['cat']]}</span>{dot(p['date'])}</div>
<h1>{E(p['title'])}</h1>
<p class="lead">{E(p['summary'])}</p>
{'' if any(x[0] in ('game','img') and p['cover'] in x for x in p['body']) else f'<img class="cover" src="{E(p["cover"])}" alt="">'}
{''.join(block(b) for b in p['body'])}
{nav}
<p style="margin-top:18px"><a class="back" href="/news/">← 소식 목록으로</a></p>
</article></main>
""" + FOOT)


def index():
    cards = []
    for k, p in enumerate(POSTS):
        cards.append(f"""<a class="post{' big' if k == 0 else ''}" href="/news/{p['slug']}/" data-cat="{p['cat']}">
<img src="{E(p['cover'])}" alt="" loading="{'eager' if k == 0 else 'lazy'}">
<div class="b"><div class="meta"><span class="chip {p['cat']}">{CATS[p['cat']]}</span>{dot(p['date'])}</div>
<h2>{E(p['title'])}</h2><p>{E(p['summary'])}</p></div></a>""")
    tabs = '<button type="button" data-f="all" aria-pressed="true">전체</button>' + "".join(
        f'<button type="button" data-f="{k}" aria-pressed="false">{v}</button>' for k, v in CATS.items())
    script = """<script>
(function(){var bs=document.querySelectorAll('.tabs button'),ps=document.querySelectorAll('.post');
bs.forEach(function(b){b.addEventListener('click',function(){var f=b.dataset.f;
bs.forEach(function(x){x.setAttribute('aria-pressed',x===b?'true':'false')});
ps.forEach(function(p){p.hidden=!(f==='all'||p.dataset.cat===f)});});});})();
</script>"""
    return (head("오락실 소식 · 달빛 오락실", "달빛 오락실에 새로 들어온 게임, 바뀐 것, 만드는 이야기를 모아 두는 곳이에요.",
                 f"{SITE}/news/", POSTS[0]["cover"])
            + f"""<main>
<section class="head"><h1>📰 오락실 소식</h1><p>새로 들어온 게임, 바뀐 것, 만드는 이야기를 모아 두는 곳이에요.</p>
<div class="tabs" role="group" aria-label="분류">{tabs}</div></section>
<div class="list">{''.join(cards)}</div>
<a class="back" href="/">← 달빛 오락실 입구로</a>
</main>
{script}
""" + FOOT)


def main():
    os.makedirs(OUT, exist_ok=True)
    for f in ("news.css", "banner.js"):
        shutil.copy(os.path.join(HERE, f), os.path.join(OUT, f))
    with open(f"{OUT}/index.html", "w", encoding="utf-8") as fh:
        fh.write(index())
    for i, p in enumerate(POSTS):
        os.makedirs(f"{OUT}/{p['slug']}", exist_ok=True)
        with open(f"{OUT}/{p['slug']}/index.html", "w", encoding="utf-8") as fh:
            fh.write(article(i, p))
    with open(f"{OUT}/news.json", "w", encoding="utf-8") as fh:
        json.dump([{k: p[k] for k in ("slug", "date", "cat", "title")} for p in POSTS], fh, ensure_ascii=False, indent=1)
    print("만듦", len(POSTS), "편 →", OUT)


if __name__ == "__main__":
    main()
