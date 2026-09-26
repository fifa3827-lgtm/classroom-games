#!/usr/bin/env python3
"""달빛 오락실 게임 소개 화면 만들기.

games.py 의 내용을 읽어 out/intro/<게임>/index.html 을 만든다.
검색에 잘 걸리도록 모든 글을 HTML 안에 그대로 넣는다 (자바스크립트로 그리지 않는다).
"""
import hashlib, html, json, os, shutil
from PIL import Image
from games import GAMES, ALL, CATS, SITE

OUT = "out/intro"
# intro.css 주소 끝에 붙이는 버전 번호 = 파일 내용의 지문. css를 고치면 번호가 저절로 바뀌어
# 서버(AWS) · 브라우저 캐시가 옛 css를 붙잡지 않는다 (관리자 안내: 「js · css는 버저닝」)
with open("intro.css", "rb") as _f:
    CSSV = hashlib.md5(_f.read()).hexdigest()[:8]
E = html.escape
BADGE = {"ok": ("가장 좋아요", "ok"), "good": ("좋아요", "good"), "soso": ("괜찮아요", "soso")}
NUM = "①②③④⑤⑥⑦⑧⑨"


def similar(slug, cat):
    same = [g for g in ALL if g[3] == cat and g[0] != slug]
    other = [g for g in ALL if g[3] != cat and g[0] != slug]
    pick = (same + other)[:3]
    out = []
    for s, emo, name, c, line in pick:
        href = f"../{s}/" if s in GAMES else f"/{s}/"
        out.append(
            f'<a class="sim" href="{href}"><span class="sim-emo" aria-hidden="true">{emo}</span>'
            f'<span class="sim-txt"><b>{E(name)}</b><small>{E(line)}</small></span></a>')
    return "\n".join(out)


def page(slug, g):
    cat_emo, cat_name = CATS[g["cat"]]
    url = f"{SITE}/intro/{slug}/"
    play = f"/{slug}/"
    # 행사 진행용 게임: 여럿이 모여 큰 화면으로 중계하며 하는 게임에 붙이는 표시
    ev = g.get("event")
    EVENT_TAG = ('<p class="event-tag"><span aria-hidden="true">🎪</span> 행사 진행용 · '
                 + E(ev if isinstance(ev, str) else "여럿이 모여 큰 화면으로 중계") + '</p>') if ev else ""
    EVENT_RIB = '<span class="event-rib">🎪 행사 진행용</span>' if ev else ""
    facts = "".join(f'<li><span aria-hidden="true">{a}</span>{E(b)}</li>' for a, b in g["facts"])
    story = "".join(f"<p>{E(p)}</p>" for p in g["story"])
    steps = "".join(
        f'<li class="step"><div class="step-no">STEP {i+1}</div><div class="step-ico" aria-hidden="true">{ico}</div>'
        f'<h3>{E(t)}</h3><p>{E(d)}</p></li>' for i, (ico, t, d) in enumerate(g["steps"]))
    def wh(f):
        w, h = Image.open(f"{OUT}/{slug}/{f}").size
        return f'width="{w}" height="{h}"'
    shots = "".join(
        f'<figure class="shot"><img src="{f}" {wh(f)} alt="{E(alt)}" loading="lazy" decoding="async"><figcaption>{E(alt)}</figcaption></figure>'
        for f, alt in g["shots"][1:])
    extra = ""
    if g["extra"]:
        cls = "nums" if g["extra"][0][0] in NUM else "dots"
        note = f'<p class="note">{E(g["extra_note"])}</p>' if g.get("extra_note") else ""
        extra = (f'<section class="card half"><h2>{E(g["extra_title"])}</h2><ul class="{cls}">'
                 + "".join(f"<li>{E(x)}</li>" for x in g["extra"]) + f"</ul>{note}</section>")
    who = "".join(f"<li>{E(x)}</li>" for x in g["for_who"])
    dev = "".join(
        f'<li class="dev"><span class="badge {BADGE[k][1]}">{BADGE[k][0]}</span>'
        f'<div><b>{E(n)}</b> <small>{E(sub)}</small><p>{E(d)}</p></div></li>' for k, n, sub, d in g["devices"])
    ios = "".join(f'<li><b>{NUM[i]} {E(t)}</b><p>{E(d)}</p></li>' for i, (t, d) in enumerate(g["ios"]))
    ld = {
        "@context": "https://schema.org", "@type": "VideoGame", "name": g["name"],
        "description": g["desc"], "url": url, "image": f"{url}og.jpg",
        "genre": cat_name, "gamePlatform": ["웹 브라우저", "휴대폰", "태블릿", "컴퓨터"],
        "applicationCategory": "Game", "operatingSystem": "Any", "inLanguage": "ko",
        "isAccessibleForFree": True,
        "offers": {"@type": "Offer", "price": "0", "priceCurrency": "KRW"},
        "isPartOf": {"@type": "WebSite", "name": "달빛 오락실", "url": SITE + "/"},
    }
    return f"""<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{E(g["title_seo"])}</title>
<meta name="description" content="{E(g["desc"])}">
<meta name="keywords" content="{E(g["keywords"])}, 달빛 오락실">
<link rel="canonical" href="{url}">
<meta name="theme-color" content="#17153a">
<meta property="og:type" content="website">
<meta property="og:site_name" content="달빛 오락실">
<meta property="og:title" content="{E(g["name"])} · 달빛 오락실">
<meta property="og:description" content="{E(g["desc"])}">
<meta property="og:url" content="{url}">
<meta property="og:image" content="{url}og.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:locale" content="ko_KR">
<meta name="twitter:card" content="summary_large_image">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Jua&family=Gowun+Dodum&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../intro.css?v={CSSV}">
<script type="application/ld+json">{json.dumps(ld, ensure_ascii=False)}</script>
</head>
<body class="{g["orient"]}">
<div class="sky" aria-hidden="true"></div>
<header class="top">
  <a class="home" href="/"><span class="moon" aria-hidden="true"></span>달빛 오락실</a>
  <span class="crumb">{cat_emo} {E(cat_name)}</span>
</header>

<main>
  <section class="hero">
    <div class="hero-img">{EVENT_RIB}<img src="shot0.webp" {wh("shot0.webp")} alt="{E(g["name"])} 첫 화면" fetchpriority="high"></div>
    <div class="hero-txt">
      {EVENT_TAG}<p class="eyebrow">{cat_emo} {E(cat_name)} · 무료 · 설치 없음</p>
      <h1>{E(g["name"])}</h1>
      <p class="lead">“{E(g["lead"])}”</p>
      <ul class="facts">{facts}</ul>
      <a class="start" href="{play}"><span aria-hidden="true">▶</span> 게임 시작</a>
      <p class="free">회원가입 없이 누르면 바로 시작돼요</p>
    </div>
  </section>

  <section class="card">
    <h2>어떤 게임인가요?</h2>
    {story}
  </section>

  <section class="card">
    <h2>이렇게 해요</h2>
    <ol class="steps">{steps}</ol>
    <div class="shots">{shots}</div>
  </section>

  {extra}

  <section class="card {"half" if g["extra"] else "full"}">
    <h2>이런 분께 추천해요</h2>
    <ul class="dots">{who}</ul>
    <p class="tip"><span aria-hidden="true">💡</span> {E(g["tip"])}</p>
  </section>

  <section class="card half" id="device">
    <h2>📱 어떤 기기에서 하면 좋을까요?</h2>
    <ul class="devs">{dev}</ul>
    <div class="warn">
      <b>⚠️ 카카오톡·네이버 앱 안에서 열었다면</b>
      <p>오른쪽 위 메뉴(⋮ 또는 ···)에서 「다른 브라우저로 열기」를 눌러 크롬이나 사파리로 열어 주세요. 앱 안에서는 전체 화면이 안 되고 저장이 풀릴 수 있어요.</p>
    </div>
  </section>

  <section class="card half">
    <h2>🍎 아이폰·아이패드에서는</h2>
    <ul class="ios">{ios}</ul>
    <h2 class="h2-sub">🤖 갤럭시 등 안드로이드에서는</h2>
    <p>{E(g["android"])}</p>
  </section>

  <section class="card go">
    <h2>▶ 바로 해 보기</h2>
    <p>설치도, 회원가입도 필요 없어요.</p>
    <a class="start big" href="{play}"><span aria-hidden="true">▶</span> {E(g["short"])} 시작하기</a>
    <p class="url">{SITE.replace("https://", "")}/{slug}/</p>
  </section>

  <section class="more">
    <h2>🌙 이런 게임은 어때요?</h2>
    <div class="sims">{similar(slug, g["cat"])}</div>
    <a class="back" href="/">← 달빛 오락실 입구로</a>
  </section>
</main>

<a class="dock" href="{play}"><span aria-hidden="true">▶</span> 게임 시작</a>
<footer>달빛 오락실 · 설치 없이 바로 하는 무료 웹게임</footer>
</body>
</html>
"""


def main():
    os.makedirs(OUT, exist_ok=True)
    shutil.copy("intro.css", f"{OUT}/intro.css")
    for slug, g in GAMES.items():
        os.makedirs(f"{OUT}/{slug}", exist_ok=True)
        with open(f"{OUT}/{slug}/index.html", "w", encoding="utf-8") as f:
            f.write(page(slug, g))
        print("만듦", slug)


if __name__ == "__main__":
    main()
