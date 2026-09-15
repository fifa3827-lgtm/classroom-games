# -*- coding: utf-8 -*-
"""「쵸코와 한글」 익힘책 — A4 44쪽.
   1부 소리와 글자(낱자 → 받침 없는 글자 → 낱말), 2부 받침.
   쪽마다 쵸코가 안내한다."""
import json, random, os
from strokes2 import svg

HERE = os.path.dirname(os.path.abspath(__file__))
CH = json.load(open(os.path.join(HERE, 'choco.json'), encoding='utf-8'))
random.seed(915)

CHO = ["ㄱ","ㄲ","ㄴ","ㄷ","ㄸ","ㄹ","ㅁ","ㅂ","ㅃ","ㅅ","ㅆ","ㅇ","ㅈ","ㅉ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ"]
JUNG = ["ㅏ","ㅐ","ㅑ","ㅒ","ㅓ","ㅔ","ㅕ","ㅖ","ㅗ","ㅘ","ㅙ","ㅚ","ㅛ","ㅜ","ㅝ","ㅞ","ㅟ","ㅠ","ㅡ","ㅢ","ㅣ"]
JONG = ["","ㄱ","ㄲ","ㄳ","ㄴ","ㄵ","ㄶ","ㄷ","ㄹ","ㄺ","ㄻ","ㄼ","ㄽ","ㄾ","ㄿ","ㅀ","ㅁ","ㅂ","ㅄ","ㅅ","ㅆ","ㅇ","ㅈ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ"]
def comp(c, v, j=""):
    return chr(0xAC00 + (CHO.index(c)*21 + JUNG.index(v))*28 + JONG.index(j))

VSAY = {"ㅏ":"아","ㅓ":"어","ㅗ":"오","ㅜ":"우","ㅡ":"으","ㅣ":"이",
        "ㅑ":"야","ㅕ":"여","ㅛ":"요","ㅠ":"유","ㅐ":"애","ㅔ":"에"}
CNAME = {"ㄱ":"기역","ㄴ":"니은","ㄷ":"디귿","ㄹ":"리을","ㅁ":"미음","ㅂ":"비읍","ㅅ":"시옷",
         "ㅇ":"이응","ㅈ":"지읒","ㅊ":"치읓","ㅋ":"키읔","ㅌ":"티읕","ㅍ":"피읖","ㅎ":"히읗"}
CSAY = {"ㄱ":"그","ㄴ":"느","ㄷ":"드","ㄹ":"르","ㅁ":"므","ㅂ":"브","ㅅ":"스",
        "ㅇ":"으","ㅈ":"즈","ㅊ":"츠","ㅋ":"크","ㅌ":"트","ㅍ":"프","ㅎ":"흐"}
V5 = ["ㅏ","ㅓ","ㅗ","ㅜ","ㅣ"]

CSS = '''
@page { size: A4; margin: 13mm 13mm 11mm; }
*{ box-sizing:border-box; }
body{ margin:0; font-family:"Noto Sans CJK KR",sans-serif; color:#242424; font-size:10pt;
  -webkit-print-color-adjust:exact; print-color-adjust:exact; }
.sheet{ page-break-after:always; height:263mm; display:flex; flex-direction:column; }
.sheet:last-child{ page-break-after:auto; }
.top{ display:flex; align-items:flex-start; gap:4mm; border-bottom:2.2pt solid #8B5A3C;
  padding-bottom:2.4mm; margin-bottom:4mm; }
.top .cat{ width:16mm; height:16mm; flex:none; }
.top .cat svg{ width:100%; height:100%; display:block; }
.top .ttl{ flex:1; }
.top h1{ font-size:15pt; margin:0; letter-spacing:-.3px; }
.top .say{ font-size:9.6pt; color:#6b6b6b; margin-top:.8mm; }
.top .no{ font-size:8.6pt; color:#8B5A3C; border:1pt solid #d8cdbe; border-radius:10mm;
  padding:1mm 3mm; white-space:nowrap; align-self:center; }
.name{ margin-left:auto; font-size:9pt; color:#555; align-self:center; white-space:nowrap; }
.body{ flex:1; }
h2{ font-size:11pt; margin:0 0 2mm; color:#8B5A3C; }
h2.mt{ margin-top:4mm; }
.foot{ margin-top:auto; padding-top:2.5mm; border-top:.8pt solid #ddd; font-size:8.2pt;
  color:#777; line-height:1.45; }
.foot b{ color:#8B5A3C; }

/* 쓰기 격자 */
.grid-row{ display:flex; gap:2.6mm; margin-bottom:2.6mm; align-items:center; }
.cell{ width:23mm; height:23mm; flex:none; border:1pt solid #c9c2b6; border-radius:1.5mm; position:relative;
  background-image:
    repeating-linear-gradient(to bottom, #ddd5c7 0 1.6mm, transparent 1.6mm 3.2mm),
    repeating-linear-gradient(to right, #ddd5c7 0 1.6mm, transparent 1.6mm 3.2mm);
  background-size: .45mm 100%, 100% .45mm;
  background-position: center center, center center;
  background-repeat: no-repeat, no-repeat; }
.cell .ch{ position:absolute; inset:0; display:flex; align-items:center; justify-content:center;
  font-size:40pt; font-weight:700; line-height:1; }
.cell .ch.light{ color:#ddd6ca; }
.cell .idx{ position:absolute; top:1mm; left:1.6mm; font-size:8pt; color:#b9b2a5; }
.cell.sm{ width:18mm; height:18mm; }
.cell.sm .ch{ font-size:31pt; }
.cell.xs{ width:15mm; height:15mm; }
.cell.xs .ch{ font-size:25pt; }
.lead{ width:23mm; flex:none; text-align:center; }
.lead .big{ font-size:26pt; font-weight:700; line-height:1.1; }
.lead .sm{ font-size:8.6pt; color:#777; }

/* 획순 */
.stroke-row{ display:flex; gap:3mm; margin-bottom:3.5mm; align-items:center; }
.st{ width:21mm; height:21mm; flex:none; border:1pt solid #c9c2b6; border-radius:1.5mm; padding:1.6mm; }
.st.demo{ background:#FFFDF8; }
.stlab{ width:26mm; flex:none; }
.stlab .b{ font-size:20pt; font-weight:700; line-height:1; }
.stlab .s{ font-size:8.6pt; color:#777; margin-top:.6mm; }

/* 표 */
table.make{ border-collapse:collapse; width:100%; table-layout:fixed; }
table.make th, table.make td{ border:1pt solid #c9c2b6; height:19mm; text-align:center; vertical-align:middle; }
table.make th{ background:#F6EFE4; font-size:20pt; font-weight:700; }
table.make th.corner{ background:#fff; border:none; }
table.make td{ font-size:26pt; font-weight:700; }
table.make td.hint{ color:#ddd6ca; }
table.make.color th, table.make.color td{ height:16.5mm; }
table.make.tall th, table.make.tall td{ height:27mm; }
table.make.color td{ font-size:19pt; color:#bdb5a7; }
table.make.color th{ font-size:15pt; }

/* 찾기 */
.find-row{ display:flex; align-items:center; gap:3mm; margin-bottom:3.2mm; }
.find-row .q{ width:20mm; height:20mm; flex:none; border:1.6pt solid #8B5A3C; border-radius:2mm;
  display:flex; align-items:center; justify-content:center; font-size:26pt; font-weight:700; background:#FFF8EF; }
.find-row .arrow{ color:#aaa; font-size:12pt; }
.find-row .opts{ display:flex; gap:3.4mm; }
.find-row .opts span{ width:18mm; height:18mm; border:1pt dashed #c9c2b6; border-radius:2mm;
  display:flex; align-items:center; justify-content:center; font-size:24pt; font-weight:700; }

/* 잇기 */
.match{ display:flex; justify-content:space-between; gap:10mm; }
.match .col{ flex:1; display:flex; flex-direction:column; gap:4mm; }
.match .it{ border:1pt solid #c9c2b6; border-radius:2mm; height:19mm; display:flex; align-items:center;
  gap:3mm; padding:0 4mm; }
.match .it .pic{ font-size:22pt; }
.match .it .w{ font-size:19pt; font-weight:700; }
.match .it .en{ font-size:8pt; color:#999; margin-left:auto; }
.dot{ width:3mm; height:3mm; border-radius:50%; background:#8B5A3C; flex:none; }

/* 낱말 채우기 */
.wordfill{ display:flex; gap:4mm; align-items:center; margin-bottom:3.4mm; }
.wordfill .pic{ width:20mm; text-align:center; font-size:26pt; }
.wordfill .blanks{ display:flex; gap:2mm; }
.wordfill .b{ width:19mm; height:19mm; border:1pt solid #c9c2b6; border-radius:1.5mm;
  display:flex; align-items:center; justify-content:center; font-size:26pt; font-weight:700;
  background-image:
    repeating-linear-gradient(to bottom, #ddd5c7 0 1.6mm, transparent 1.6mm 3.2mm),
    repeating-linear-gradient(to right, #ddd5c7 0 1.6mm, transparent 1.6mm 3.2mm);
  background-size: .45mm 100%, 100% .45mm;
  background-position: center center, center center;
  background-repeat: no-repeat, no-repeat; }
.wordfill .b.empty{ border:1.6pt solid #8B5A3C; background-color:#FFF8EF; }
.wordfill .en{ font-size:8.6pt; color:#999; }

/* 조립 식 */
.eq{ display:flex; align-items:center; justify-content:center; gap:4mm; margin:3mm 0 5mm; }
.eq .p{ width:22mm; height:22mm; border:1pt solid #c9c2b6; border-radius:2mm; background:#FFFDF8;
  display:flex; align-items:center; justify-content:center; font-size:30pt; font-weight:700; }
.eq .op{ font-size:18pt; color:#8B5A3C; }
.eq .r{ width:26mm; height:26mm; border:1.8pt solid #8B5A3C; border-radius:2mm; background:#FFF8EF;
  display:flex; align-items:center; justify-content:center; font-size:36pt; font-weight:700; }

/* 표지 */
.cover{ height:263mm; display:flex; flex-direction:column; align-items:center; justify-content:center;
  gap:6mm; text-align:center; border:2.4pt solid #8B5A3C; border-radius:6mm; padding:16mm 12mm; }
.cover .cat{ width:62mm; height:62mm; }
.cover .cat svg{ width:100%; height:100%; }
.cover h1{ font-size:34pt; margin:0; letter-spacing:-1px; }
.cover .sub{ font-size:12.5pt; color:#6b6b6b; }
.cover .who{ margin-top:10mm; border-top:1pt solid #d8cdbe; padding-top:8mm; width:78mm;
  font-size:12pt; color:#444; line-height:2.4; }
.cover .who i{ font-style:normal; color:#999; }

/* 안내·차례 */
.plain{ font-size:10.4pt; line-height:1.75; }
.plain p{ margin:0 0 3.4mm; }
.plain ul{ margin:0 0 3.4mm; padding-left:5mm; }
.plain li{ margin-bottom:1.6mm; }
.box{ border:1pt solid #d8cdbe; background:#FFFBF4; border-radius:2.5mm; padding:4mm 5mm; margin-bottom:4mm; }
.toccols{ column-count:2; column-gap:10mm; }
table.toc{ width:100%; border-collapse:collapse; font-size:9.2pt; }
table.toc td{ padding:1.9mm 1mm; border-bottom:.7pt dotted #ccc; }
table.toc td.p{ text-align:right; color:#8B5A3C; width:14mm; white-space:nowrap; }
table.toc td.part{ padding-top:5mm; font-weight:700; color:#8B5A3C; font-size:10.6pt; border-bottom:1pt solid #d8cdbe; }

/* 진도판 */
.prog{ display:grid; gap:2.4mm; }
.prog .c{ border:1pt solid #c9c2b6; border-radius:1.6mm; height:19mm; display:flex;
  align-items:center; justify-content:center; font-size:21pt; font-weight:700; color:#cfc7ba; }
.legend{ font-size:9pt; color:#777; margin-bottom:3mm; }

/* 상장 */
.award{ border:3pt double #8B5A3C; border-radius:4mm; height:100%; display:flex; flex-direction:column;
  align-items:center; justify-content:center; gap:5mm; text-align:center; padding:14mm 10mm; }
.award h1{ font-size:28pt; margin:0; letter-spacing:6px; }
.award .line{ font-size:12pt; line-height:2.2; }
.award .cat{ width:44mm; height:44mm; }
.award .cat svg{ width:100%; height:100%; }
.award .blank{ border-bottom:1pt solid #999; display:inline-block; min-width:38mm; }
.colorbox{ border:1.2pt dashed #c9c2b6; border-radius:2.5mm; padding:4mm; text-align:center; }
.colorbox .cat{ width:58mm; height:58mm; margin:0 auto; }
.colorbox .cat svg{ width:100%; height:100%; }

/* 화면에서만 보이는 인쇄 안내 */
.banner{ max-width:186mm; margin:6mm auto 10mm; border:1.4pt solid #8B5A3C; border-radius:3mm;
  background:#FFFBF4; padding:6mm 7mm; font-size:10.5pt; line-height:1.8; }
.banner b{ color:#8B5A3C; }
.banner ol{ margin:2mm 0 0; padding-left:6mm; }
@media print { .banner{ display:none !important; } }
'''

sheets = []
def head(no, title, say, mood='idle'):
    return (f'<div class="top"><div class="cat">{CH[mood]}</div>'
            f'<div class="ttl"><h1>{title}</h1><div class="say">{say}</div></div>'
            f'<div class="no">{no}</div><div class="name">이름 ________</div></div>')
def foot(t):
    return f'<div class="foot"><b>선생님께</b> &nbsp;{t}</div>'
def page(no, title, say, body, note, mood='idle'):
    sheets.append(f'<div class="sheet">{head(no,title,say,mood)}'
                  f'<div class="body">{body}</div>{foot(note)}</div>')

# ─────────────────────────────── 앞부분
sheets.append(f'''<div class="sheet"><div class="cover">
  <div class="cat">{CH['cheer']}</div>
  <h1>쵸코와 한글</h1>
  <div class="sub">자음과 모음을 붙여 글자를 만드는 익힘책</div>
  <div class="who">이름 <i>________________</i><br>시작한 날 <i>______ 년 ____ 월 ____ 일</i></div>
</div></div>''')

page('안내', '이 책을 쓰는 법', '어른이 먼저 읽어 주세요', '''
<div class="plain">
<div class="box"><b>이 책은 순서대로 푸는 문제집이 아닙니다.</b> 화면 놀이 「쵸코와 한글」에서 들은
소리를 손으로 다시 만나게 하려고 만든 짝꿍 책입니다.</div>
<p><b>하루 한 장이면 넉넉합니다.</b> 한 장은 5~10분 분량입니다. 화면으로 한 활동을 하고 나서
같은 내용을 담은 한 장을 주면 가장 좋습니다. 여러 장을 몰아서 하면 손이 지쳐 글씨가 무너집니다.</p>
<p><b>소리부터, 그다음 글자입니다.</b> 쓰기 전에 먼저 소리 내어 읽게 해 주세요.
읽지 못하는 글자를 베껴 쓰는 것은 그림 그리기일 뿐입니다. 어른이 먼저 읽어 주고
아이가 따라 읽은 뒤에 쓰게 합니다.</p>
<p><b>틀린 곳에 표시하지 않습니다.</b> 이 책에는 채점 칸이 없습니다.
잘못 쓴 글자는 지우게 하는 대신 옆 칸에 한 번 더 쓰게 해 주세요.</p>
<p><b>쪽 아래의 「선생님께」를 보고 무엇을 볼지 정합니다.</b> 그 한 줄이 그 장의 목적입니다.</p>
<h2 class="mt">이 책의 차례가 왜 이런가</h2>
<ul>
<li>자음 이름(기역·니은)을 외우게 하지 않습니다. 이름보다 <b>소리</b>가 먼저입니다.</li>
<li>모음을 여섯 개(ㅏㅓㅗㅜㅡㅣ)만 먼저 다룹니다. 이 여섯으로 쓸 수 있는 글자가 이미 아주 많습니다.</li>
<li>낱자를 다 배우고 나서 글자를 만드는 것이 아니라, 다섯 자음·다섯 모음만으로 곧바로
스물다섯 글자를 만들어 봅니다. 규칙을 먼저 잡아야 나머지가 빨라집니다.</li>
<li>받침은 맨 뒤입니다. 받침 없는 글자를 자유롭게 읽기 전에는 받침을 넣지 않습니다.</li>
</ul>
</div>''', '이 쪽만 어른이 읽습니다. 아이에게는 넘겨도 됩니다.', 'happy')

TOC = [
 ('part', '1부 · 소리와 글자', ''),
 ('', '모음 ㅏ ㅓ 쓰기', 5), ('', '모음 ㅗ ㅜ 쓰기', 6), ('', '모음 ㅡ ㅣ 쓰기', 7),
 ('', '모음 여섯 모아 익히기', 8),
 ('', '자음 ㄱ ㄴ 쓰기', 9), ('', '자음 ㄷ ㄹ 쓰기', 10), ('', '자음 ㅁ ㅂ 쓰기', 11),
 ('', '자음 ㅅ ㅇ 쓰기', 12), ('', '자음 ㅈ ㅎ 쓰기', 13), ('', '자음 ㅊ ㅋ 쓰기', 14),
 ('', '자음 ㅌ ㅍ 쓰기', 15), ('', '자음 열넷 모아 익히기', 16),
 ('', '모음 ㅑ ㅕ ㅛ ㅠ 쓰기', 17), ('', '모음 ㅐ ㅔ 쓰기', 18),
 ('', '자음 + 모음 = 글자', 19),
 ('', 'ㄱ 줄 쓰기', 20), ('', 'ㄴ 줄 쓰기', 21), ('', 'ㄷ 줄 쓰기', 22),
 ('', 'ㅁ 줄 쓰기', 23), ('', 'ㅅ 줄 쓰기', 24), ('', '스물다섯 글자 표 채우기', 25),
 ('', 'ㅂ 줄 · ㅈ 줄', 26), ('', 'ㅎ 줄 · ㄹ 줄', 27), ('', 'ㅇ 줄 · ㅊ 줄', 28),
 ('', '낱말 ① 나무 · 고기 · 구두', 29), ('', '낱말 ② 모자 · 고구마 · 바지', 30),
 ('', '그림과 낱말 잇기', 31), ('', '1부 마무리 — 읽을 수 있는 글자 칠하기', 32),
 ('part', '2부 · 받침', ''),
 ('', '받침이 무엇일까', 33), ('', 'ㅇ 받침', 34), ('', 'ㄴ 받침', 35), ('', 'ㄹ 받침', 36),
 ('', 'ㅁ 받침', 37), ('', 'ㄱ 받침', 38), ('', 'ㅂ 받침', 39), ('', 'ㅅ · ㄷ 받침', 40),
 ('', '받침 낱말 모으기', 41), ('', '2부 마무리 — 받침 진도판', 42),
 ('part', '끝내고 나서', ''),
 ('', '내가 읽을 수 있는 글자', 43), ('', '다 했어요 — 쵸코의 상장', 44),
]
rows = []
for kind, t, p in TOC:
    if kind == 'part':
        rows.append(f'<tr><td class="part" colspan="2">{t}</td></tr>')
    else:
        rows.append(f'<tr><td>{t}</td><td class="p">{p}쪽</td></tr>')
page('차례', '차례', '쵸코와 함께 가는 길', f'<div class="toccols"><table class="toc">{"".join(rows)}</table></div>',
     '한 번에 다 하지 않습니다. 화면 활동을 한 뒤 한 장씩 줍니다.')

page('길잡이', '쵸코와 가는 길', '이 책은 다섯 걸음으로 되어 있어요',
  """<div class="plain">
  <div class="box"><b>첫째 걸음 · 모음 여섯</b><br>ㅏ ㅓ ㅗ ㅜ ㅡ ㅣ — 입만 벌리면 나는 소리예요. (5~8쪽)</div>
  <div class="box"><b>둘째 걸음 · 자음 열넷</b><br>ㄱ부터 ㅎ까지 — 혼자서는 소리가 나지 않아요. (9~16쪽)</div>
  <div class="box"><b>셋째 걸음 · 자음 + 모음 = 글자</b><br>ㄴ에 ㅗ를 붙이면 노. 이 규칙 하나면 글자를 만들 수 있어요. (19~28쪽)</div>
  <div class="box"><b>넷째 걸음 · 낱말</b><br>글자를 이어 붙이면 뜻이 생겨요. 나무, 고기, 구두… (29~32쪽)</div>
  <div class="box"><b>다섯째 걸음 · 받침</b><br>글자 아래에 하나 더. 사 + ㄴ = 산. (33~42쪽)</div>
  <p style="text-align:center;margin-top:6mm;color:#8B5A3C">한 걸음씩, 쵸코와 같이 가요.</p>
  </div>""",
  '아이와 함께 한 번 읽고 시작합니다. 지금 어디쯤 왔는지 아는 것만으로 아이가 덜 지칩니다.', 'happy')

# ─────────────────────────────── 낱자 쓰기 장
def letter_sheet(no, letters, title, say, note, kind, compact=False):
    rows = []
    for ch in letters:
        if kind == 'v':
            lab = f'<div class="b">{ch}</div><div class="s">[{VSAY[ch]}] 소리</div>'
        else:
            lab = f'<div class="b">{ch}</div><div class="s">{CNAME[ch]} · [{CSAY[ch]}] 소리</div>'
        cells = "".join('<div class="cell sm"><div class="ch"></div></div>' for _ in range(4))
        rows.append(f'''<div class="stroke-row">
          <div class="stlab">{lab}</div>
          <div class="st demo">{svg(ch)}</div>
          <div class="st">{svg(ch, show_numbers=False, light=True)}</div>
          <div class="st">{svg(ch, show_numbers=False, light=True)}</div>
          {cells}</div>''')
        if compact:
            big = "".join(f'<div class="cell sm"><div class="ch light">{ch}</div></div>' for _ in range(3)) \
                + "".join('<div class="cell sm"><div class="ch"></div></div>' for _ in range(5))
            rows.append(f'<div class="grid-row" style="margin-bottom:4mm">{big}</div>')
        else:
            big = "".join(f'<div class="cell"><div class="ch light">{ch}</div></div>' for _ in range(2)) \
                + "".join('<div class="cell"><div class="ch"></div></div>' for _ in range(3))
            more = "".join('<div class="cell"><div class="ch"></div></div>' for _ in range(5))
            rows.append(f'<div class="grid-row">{big}</div><div class="grid-row">{more}</div>')
    page(no, title, say, "".join(rows), note)

letter_sheet('5쪽', ['ㅏ','ㅓ'], '모음 ㅏ ㅓ 쓰기', '번호 순서대로, 화살표 방향으로 써 보세요',
  '세로획을 먼저 긋는지 봅니다. ㅏ와 ㅓ는 가로획이 붙는 쪽만 다릅니다. 헷갈리면 두 글자를 나란히 놓고 비교하게 합니다.', 'v')
letter_sheet('6쪽', ['ㅗ','ㅜ'], '모음 ㅗ ㅜ 쓰기', '위아래가 뒤집힌 짝꿍이에요',
  'ㅗ와 ㅜ를 뒤집어 쓰는 실수가 가장 흔합니다. 입 모양을 함께 보여 주면 빨리 잡힙니다.', 'v')
letter_sheet('7쪽', ['ㅡ','ㅣ'], '모음 ㅡ ㅣ 쓰기', '한 획이면 끝나는 글자예요',
  '가장 쉬운 두 글자입니다. 긋는 방향(왼→오른, 위→아래)만 봐 주세요.', 'v')

# 8쪽 모음 여섯 모아 익히기
V6 = ["ㅏ","ㅓ","ㅗ","ㅜ","ㅡ","ㅣ"]
find_rows = []
for v in V6[:4]:
    opts = [v] + random.sample([x for x in V6 if x != v], 2)
    random.shuffle(opts)
    find_rows.append(f'<div class="find-row"><div class="q">{v}</div><div class="arrow">▶</div>'
        f'<div class="opts">{"".join(f"<span>{o}</span>" for o in opts)}</div></div>')
say_rows = "".join(f'<div class="grid-row"><div class="lead"><div class="big">{v}</div>'
                   f'<div class="sm">[{VSAY[v]}]</div></div>'
                   + "".join('<div class="cell sm"><div class="ch"></div></div>' for _ in range(6))
                   + '</div>' for v in V6[:3])
say_rows += "".join(f'<div class="grid-row"><div class="lead"><div class="big">{v}</div>'
                   f'<div class="sm">[{VSAY[v]}]</div></div>'
                   + "".join('<div class="cell sm"><div class="ch"></div></div>' for _ in range(6))
                   + '</div>' for v in V6[3:])
page('8쪽', '모음 여섯 모아 익히기', '같은 글자를 찾아 동그라미 치고, 한 번씩 더 써요',
  f'<h2>같은 글자에 동그라미</h2>{"".join(find_rows)}'
  f'<h2 class="mt">한 번씩 더 쓰기</h2>{say_rows}',
  '여섯 모음을 소리로 구별하는지가 1부의 첫 갈림길입니다. 어른이 소리만 내고 아이가 짚게 해도 좋습니다.', 'happy')

CPAIRS = [('ㄱ','ㄴ','9쪽'), ('ㄷ','ㄹ','10쪽'), ('ㅁ','ㅂ','11쪽'), ('ㅅ','ㅇ','12쪽'),
          ('ㅈ','ㅎ','13쪽'), ('ㅊ','ㅋ','14쪽'), ('ㅌ','ㅍ','15쪽')]
CNOTE = {
 'ㄱ':'ㄱ은 한 번에 꺾어 씁니다. 두 획으로 나눠 쓰면 글자가 벌어집니다.',
 'ㄷ':'ㄷ과 ㄹ은 생김새가 이어집니다. ㄹ은 ㄷ 위에 ㄱ을 얹은 모양이라고 일러 주면 쉽습니다.',
 'ㅁ':'ㅁ과 ㅂ 모두 왼쪽 세로획부터 시작합니다. ㅂ은 위가 뚫려 있다는 점을 짚어 줍니다.',
 'ㅅ':'ㅇ은 소리가 나지 않는 자리지킴이입니다. 「아·오」를 쓸 때 왜 ㅇ이 붙는지 물어보면 좋습니다.',
 'ㅈ':'ㅈ은 ㅅ 위에 가로획을 얹은 모양, ㅎ은 ㅇ 위에 두 획을 얹은 모양입니다.',
 'ㅊ':'ㅊ은 ㅈ에 점 하나, ㅋ은 ㄱ에 획 하나. 「하나 더 붙이면 소리가 세진다」로 묶어 줍니다.',
 'ㅌ':'ㅌ은 ㄷ에 획 하나, ㅍ은 ㅁ이 옆으로 누운 모양입니다.',
}
for a, b, no in CPAIRS:
    letter_sheet(no, [a, b], f'자음 {a} {b} 쓰기', f'{CNAME[a]}, {CNAME[b]}',
                 CNOTE.get(a, '소리를 먼저 내고 나서 쓰게 합니다.'), 'c')

# 16쪽 자음 모아 익히기
C14 = ["ㄱ","ㄴ","ㄷ","ㄹ","ㅁ","ㅂ","ㅅ","ㅇ","ㅈ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ"]
cgrid = "".join(f'<div class="c">{c}</div>' for c in C14)
crows = []
for i in range(0, 14, 7):
    crows.append('<div class="grid-row">'
        + "".join(f'<div class="cell xs"><div class="ch light">{c}</div></div>' for c in C14[i:i+7])
        + '</div>')
    crows.append('<div class="grid-row">'
        + "".join('<div class="cell xs"><div class="ch"></div></div>' for _ in range(7))
        + '</div>')
page('16쪽', '자음 열넷 모아 익히기', '흐린 글자를 덧쓰고, 아래 칸에 혼자 써요',
  "".join(crows) +
  '<h2 class="mt">소리 내어 읽으며 칠하기</h2>'
  '<div class="legend">읽을 수 있는 자음에 색칠해요</div>'
  f'<div class="prog" style="grid-template-columns:repeat(7,1fr)">{cgrid}</div>',
  '열넷을 다 못 외워도 괜찮습니다. 2부 전까지 ㄱㄴㄷㅁㅅ 다섯만 확실하면 충분합니다.')

letter_sheet('17쪽', ['ㅑ','ㅕ'], '모음 ㅑ ㅕ 쓰기', 'ㅏ ㅓ에 획을 하나씩 더 그어요',
  '획이 하나 늘면 소리도 [야][여]로 길어진다는 것을 소리로 들려주세요.', 'v')
letter_sheet('18쪽', ['ㅛ','ㅠ','ㅐ','ㅔ'], '모음 ㅛ ㅠ ㅐ ㅔ 쓰기', '남은 모음이에요',
  'ㅐ와 ㅔ는 요즘 소리로는 거의 같습니다. 구별하지 못해도 넘어갑니다. 생김새만 익히면 됩니다.', 'v', compact=True)

# ─────────────────────────────── 글자 만들기
page('19쪽', '자음 + 모음 = 글자', '한글은 이렇게 만들어져요',
  f'''<div class="box plain"><p style="margin:0">한글은 자음 하나와 모음 하나를 붙여 글자 한 개를 만듭니다.
  붙이는 자리는 정해져 있어요. 모음이 <b>세로로 선 모양</b>이면 오른쪽에,
  <b>가로로 누운 모양</b>이면 아래에 붙습니다.</p></div>
  <div class="eq"><div class="p">ㄴ</div><div class="op">+</div><div class="p">ㅏ</div>
    <div class="op">=</div><div class="r">나</div></div>
  <div class="eq"><div class="p">ㄴ</div><div class="op">+</div><div class="p">ㅗ</div>
    <div class="op">=</div><div class="r">노</div></div>
  <h2 class="mt">직접 만들어 보기</h2>
  <div class="eq"><div class="p">ㄱ</div><div class="op">+</div><div class="p">ㅏ</div>
    <div class="op">=</div><div class="r"></div></div>
  <div class="eq"><div class="p">ㅁ</div><div class="op">+</div><div class="p">ㅜ</div>
    <div class="op">=</div><div class="r"></div></div>
  <div class="eq"><div class="p">ㅅ</div><div class="op">+</div><div class="p">ㅣ</div>
    <div class="op">=</div><div class="r"></div></div>''',
  '이 장이 이 책의 중심입니다. 여기서 규칙을 스스로 말하게 하면 나머지가 빨라집니다. '
  '화면의 「글자판」을 먼저 여러 번 눌러 보게 한 뒤에 주세요.', 'cheer')

def row_sheet(no, cons, title, say, note):
    body = []
    for c in cons:
        body.append(f'<h2>{c} 줄 &nbsp;<span style="font-weight:400;color:#999;font-size:9pt">'
                    f'{CNAME[c]} · [{CSAY[c]}] 소리</span></h2>')
        line1 = '<div class="grid-row">' + "".join(
            f'<div class="cell"><div class="ch light">{comp(c,v)}</div></div>' for v in V5) + '</div>'
        line2 = '<div class="grid-row">' + "".join(
            '<div class="cell"><div class="ch"></div></div>' for _ in V5) + '</div>'
        body.append(line1 + line2)
        body.append('<div class="grid-row">' + "".join(
            '<div class="cell"><div class="ch"></div></div>' for _ in V5) + '</div>')
    if len(cons) == 1:
        c = cons[0]
        mixed = random.sample(V5, len(V5))
        body.append('<h2 class="mt">섞어 읽기 — 소리 내어 읽고, 읽은 글자에 색칠해요</h2>')
        body.append('<div class="prog" style="grid-template-columns:repeat(5,1fr)">'
            + "".join(f'<div class="c">{comp(c,v)}</div>' for v in mixed) + '</div>')
        body.append('<h2 class="mt">불러 주는 글자 쓰기 — 어른이 한 글자씩 불러 주세요</h2>')
        body.append('<div class="grid-row">' + "".join(
            f'<div class="cell"><span class="idx">{i}</span><div class="ch"></div></div>'
            for i in range(1, 6)) + '</div>')
    page(no, title, say, "".join(body), note)

for c, no in [('ㄱ','20쪽'), ('ㄴ','21쪽'), ('ㄷ','22쪽'), ('ㅁ','23쪽'), ('ㅅ','24쪽')]:
    row_sheet(no, [c], f'{c} 줄 쓰기', '흐린 글자를 덧쓰고 아래 칸에 혼자 써요',
      f'{c} 하나에 모음만 바뀝니다. 한 칸씩 소리 내어 읽으며 쓰게 하세요. '
      f'「{comp(c,"ㅏ")}, {comp(c,"ㅓ")}…」처럼 이어 읽으면 규칙이 귀에 들어옵니다.')

# 25쪽 5×5 표
CONS5 = ["ㄱ","ㄴ","ㄷ","ㅁ","ㅅ"]
thead = '<tr><th class="corner"></th>' + "".join(f'<th>{v}</th>' for v in V5) + '</tr>'
trows = []
for i, c in enumerate(CONS5):
    tds = "".join((f'<td class="hint">{comp(c,v)}</td>' if (i == 0 or j == 0)
                   else '<td></td>') for j, v in enumerate(V5))
    trows.append(f'<tr><th>{c}</th>{tds}</tr>')
page('25쪽', '스물다섯 글자 표 채우기', '가로줄 자음과 세로줄 모음을 붙여 빈칸을 채워요',
  f'<table class="make tall">{thead}{"".join(trows)}</table>',
  '화면 「글자판」과 같은 표입니다. 첫 줄과 첫 칸은 보기로 채워 두었습니다. '
  '막히면 화면에서 그 칸을 눌러 소리를 듣고 오게 하세요.', 'happy')

row_sheet('26쪽', ['ㅂ','ㅈ'], 'ㅂ 줄 · ㅈ 줄', '새 자음으로도 똑같이 만들어져요',
  '자음이 바뀌어도 규칙은 그대로라는 것을 확인하는 장입니다.')
row_sheet('27쪽', ['ㅎ','ㄹ'], 'ㅎ 줄 · ㄹ 줄', '조금 어려운 자음이에요',
  'ㄹ은 획이 많아 칸을 넘기 쉽습니다. 십자 안내선 안에 들어오는지 봐 주세요.')
row_sheet('28쪽', ['ㅇ','ㅊ'], 'ㅇ 줄 · ㅊ 줄', 'ㅇ은 소리가 나지 않아요',
  '「아·어·오·우·이」는 모음 소리 그대로입니다. ㅇ이 자리만 지킨다는 것을 여기서 확인합니다.')

WORDS1 = [("나무","🌳","tree"), ("고기","🥩","meat"), ("구두","👞","shoes")]
WORDS2 = [("모자","🧢","hat"), ("고구마","🍠","sweet potato"), ("바지","👖","trousers")]
def word_sheet(no, words, title, note):
    body = []
    for w, pic, en in words:
        body.append(f'<h2>{pic} &nbsp;{w} <span style="font-weight:400;color:#999;font-size:9pt">{en}</span></h2>')
        light = "".join(f'<div class="cell"><div class="ch light">{ch}</div></div>' for ch in w)
        blank = "".join('<div class="cell"><div class="ch"></div></div>' for _ in w)
        body.append(f'<div class="grid-row">{light}{blank}</div>')
    page(no, title, '그림을 보고 소리 내어 읽은 뒤에 써요', "".join(body), note)

word_sheet('29쪽', WORDS1, '낱말 ① 나무 · 고기 · 구두',
  '낱자를 이어 붙이면 뜻이 생긴다는 것을 처음 겪는 장입니다. 반드시 먼저 읽고 나서 쓰게 합니다.')
word_sheet('30쪽', WORDS2, '낱말 ② 모자 · 고구마 · 바지',
  '세 글자 낱말이 처음 나옵니다. 「고-구-마」로 끊어 읽게 한 뒤 이어 읽게 하세요.')

# 31쪽 잇기 + 빠진 글자
ALLW = WORDS1 + WORDS2
left = ALLW[:]
right = ALLW[:]
random.shuffle(right)
lcol = "".join(f'<div class="it"><span class="pic">{p}</span><span class="dot"></span></div>' for _, p, _ in left)
rcol = "".join(f'<div class="it"><span class="dot"></span><span class="w">{w}</span>'
               f'<span class="en">{e}</span></div>' for w, _, e in right)
fills = []
for w, p, e in ALLW[:3]:
    i = random.randrange(len(w))
    bs = "".join(f'<div class="b{" empty" if k==i else ""}">{"" if k==i else ch}</div>'
                 for k, ch in enumerate(w))
    fills.append(f'<div class="wordfill"><div class="pic">{p}</div>'
                 f'<div class="blanks">{bs}</div><div class="en">{e}</div></div>')
page('31쪽', '그림과 낱말 잇기', '같은 것끼리 선으로 이어요',
  f'<div class="match"><div class="col">{lcol}</div><div class="col">{rcol}</div></div>'
  f'<h2 class="mt">빠진 글자 채우기</h2>{"".join(fills)}',
  '그림 없이 낱말만 보고도 읽는지가 여기서 드러납니다. 못 읽으면 29·30쪽으로 돌아갑니다.')

# 32쪽 1부 마무리 진도판
thead2 = '<tr><th class="corner"></th>' + "".join(f'<th>{v}</th>' for v in V5) + '</tr>'
trows2 = []
for c in CONS5:
    trows2.append(f'<tr><th>{c}</th>' + "".join(f'<td>{comp(c,v)}</td>' for v in V5) + '</tr>')
page('32쪽', '1부 마무리', '읽을 수 있는 글자에 색칠해요',
  '<div class="legend">혼자 읽은 글자만 칠합니다. 한 번에 다 칠하지 않아도 됩니다. '
  '2~3주에 한 번씩 다시 보며 늘려 갑니다.</div>'
  f'<table class="make color">{thead2}{"".join(trows2)}</table>'
  '<div style="margin-top:6mm" class="plain"><b>칠한 날</b> &nbsp;'
  '1회 ______  ·  2회 ______  ·  3회 ______</div>',
  '스물다섯 칸 가운데 스무 칸 넘게 칠해지면 2부(받침)로 넘어갈 때입니다.', 'cheer')

# ─────────────────────────────── 2부 받침
page('33쪽', '받침이 무엇일까', '글자 아래에 하나 더 붙는 자리예요',
  f'''<div class="box plain"><p style="margin:0">지금까지 만든 글자는 자음 하나 + 모음 하나였습니다.
  글자 <b>아래</b>에 자음을 하나 더 붙일 수 있어요. 그 자리를 <b>받침</b>이라고 합니다.</p></div>
  <div class="eq"><div class="p">사</div><div class="op">+</div><div class="p">ㄴ</div>
    <div class="op">=</div><div class="r">산</div></div>
  <div class="eq"><div class="p">다</div><div class="op">+</div><div class="p">ㄹ</div>
    <div class="op">=</div><div class="r">달</div></div>
  <h2 class="mt">직접 붙여 보기</h2>
  <div class="eq"><div class="p">고</div><div class="op">+</div><div class="p">ㅇ</div>
    <div class="op">=</div><div class="r"></div></div>
  <div class="eq"><div class="p">바</div><div class="op">+</div><div class="p">ㅁ</div>
    <div class="op">=</div><div class="r"></div></div>
  <div class="eq"><div class="p">무</div><div class="op">+</div><div class="p">ㄴ</div>
    <div class="op">=</div><div class="r"></div></div>''',
  '받침은 소리가 「끝에서 닫히는 느낌」입니다. 「사—」와 「산」을 길게 견주어 들려주세요.', 'happy')

BATCHIM = [
 ('ㅇ','34쪽', [("강","🏞","river"),("방","🚪","room"),("공","⚽","ball")],
  '받침 ㅇ은 앞의 ㅇ과 달리 소리가 납니다. 코로 나오는 소리라는 것을 손으로 코를 짚어 보게 하면 압니다.'),
 ('ㄴ','35쪽', [("산","⛰","mountain"),("눈","👁","eye"),("손","✋","hand")],
  '혀끝이 윗잇몸에 붙는지 봅니다. ㅇ 받침과 가장 많이 헷갈립니다.'),
 ('ㄹ','36쪽', [("달","🌙","moon"),("물","💧","water"),("발","🦶","foot")],
  '영어의 l과 비슷해 이 아이에게는 오히려 쉬운 받침입니다. 자신감을 얻는 장으로 쓰세요.'),
 ('ㅁ','37쪽', [("밤","🌰","chestnut"),("감","🍊","persimmon"),("곰","🐻","bear")],
  '입술이 닫히는지 봅니다. 거울을 함께 보면 확실합니다.'),
 ('ㄱ','38쪽', [("book","","")],  # 자리표시 — 아래에서 교체
  ''),
]
BATCHIM[4] = ('ㄱ','38쪽', [("약","💊","medicine"),("book","",""),("목","🧣","neck")], '')
BATCHIM[4] = ('ㄱ','38쪽', [("약","💊","medicine"),("책","📕","book"),("목","🧣","neck")],
  '소리가 뚝 끊깁니다. 「악!」 하고 놀라는 소리로 흉내 내게 하면 빨리 잡힙니다.')
BATCHIM += [
 ('ㅂ','39쪽', [("밥","🍚","rice"),("컵","🥤","cup"),("입","👄","mouth")],
  'ㅁ 받침과 입 모양이 같지만 소리가 끊깁니다. 「밤」과 「밥」을 번갈아 들려주세요.'),
]

def batchim_sheet(j, no, words, note):
    body = [f'<h2>받침 {j} — 소리 내어 읽고 써요</h2>']
    for w, pic, en in words:
        light = "".join(f'<div class="cell"><div class="ch light">{ch}</div></div>' for ch in w)
        blank = "".join('<div class="cell"><div class="ch"></div></div>' for _ in w)
        body.append(f'<div class="grid-row"><div class="lead"><div class="big">{pic}</div>'
                    f'<div class="sm">{en}</div></div>{light}{blank}</div>')
    body.append(f'<h2 class="mt">받침을 붙여 보기</h2>')
    base = [w[:-1] if len(w) == 1 else w[0] for w, _, _ in words]
    for (w, pic, en) in words:
        first = w[0]
        no_j = chr(0xAC00 + ((ord(first)-0xAC00)//28)*28)
        body.append(f'<div class="eq"><div class="p">{no_j}</div><div class="op">+</div>'
                    f'<div class="p">{j}</div><div class="op">=</div><div class="r"></div></div>')
    page(no, f'{j} 받침', f'아래에 {j}이 붙으면 소리가 이렇게 바뀌어요', "".join(body), note)

for j, no, words, note in BATCHIM:
    batchim_sheet(j, no, words, note)

# 40쪽 ㅅ·ㄷ 받침
body40 = ['<h2>받침 ㅅ 과 ㄷ — 소리가 같아요</h2>',
  '<div class="box plain" style="margin-bottom:4mm"><p style="margin:0">받침 ㅅ과 ㄷ은 소리가 '
  '똑같이 [ㄷ]으로 납니다. 「옷」과 「곧」의 끝소리를 들어 보세요. 모양만 다릅니다.</p></div>']
for w, pic, en in [("옷","👕","clothes"), ("곧","⏱","soon"), ("낫","🌾","sickle")]:
    light = "".join(f'<div class="cell"><div class="ch light">{ch}</div></div>' for ch in w)
    blank = "".join('<div class="cell"><div class="ch"></div></div>' for _ in w)
    body40.append(f'<div class="grid-row"><div class="lead"><div class="big">{pic}</div>'
                  f'<div class="sm">{en}</div></div>{light}{blank}</div>')
body40.append('<h2 class="mt">받침을 붙여 보기</h2>')
for base, j in [('오','ㅅ'), ('고','ㄷ'), ('나','ㅅ')]:
    body40.append(f'<div class="eq"><div class="p">{base}</div><div class="op">+</div>'
                  f'<div class="p">{j}</div><div class="op">=</div><div class="r"></div></div>')
page('40쪽', 'ㅅ · ㄷ 받침', '모양은 달라도 소리는 하나예요', "".join(body40),
  '여기서부터는 소리만으로 받침을 고를 수 없습니다. 낱말을 통째로 익히는 수밖에 없다고 '
  '아이에게 솔직히 말해 주세요. 아이가 답답해하지 않습니다.')

# 41쪽 받침 낱말 모으기
allb = [("산","⛰"),("달","🌙"),("밤","🌰"),("강","🏞"),("밥","🍚"),("눈","👁"),
        ("공","⚽"),("물","💧"),("곰","🐻"),("책","📕"),("입","👄"),("옷","👕")]
cells41 = "".join(f'<div class="it"><span class="pic">{p}</span>'
                  f'<span class="w" style="color:#ddd6ca">{w}</span></div>' for w, p in allb[:6])
cells41b = "".join(f'<div class="it"><span class="pic">{p}</span>'
                   f'<span class="w"></span></div>' for w, p in allb[6:])
page('41쪽', '받침 낱말 모으기', '흐린 낱말은 덧쓰고, 빈칸은 그림을 보고 써요',
  f'<div class="match"><div class="col">{cells41}</div><div class="col">{cells41b}</div></div>',
  '오른쪽 여섯 개를 그림만 보고 쓸 수 있으면 2부를 뗀 것입니다.')

# 42쪽 2부 마무리
J7 = ["ㄱ","ㄴ","ㄷ","ㄹ","ㅁ","ㅂ","ㅇ"]
grid42 = "".join(f'<div class="c">{comp("ㄱ","ㅏ",j) if False else j}</div>' for j in J7)
sample = "".join(f'<div class="c">{w}</div>' for w, _ in allb)
page('42쪽', '2부 마무리', '읽을 수 있는 받침과 낱말에 색칠해요',
  '<div class="legend">받침 일곱 소리</div>'
  f'<div class="prog" style="grid-template-columns:repeat(7,1fr)">{grid42}</div>'
  '<h2 class="mt">받침 낱말</h2>'
  f'<div class="prog" style="grid-template-columns:repeat(6,1fr)">{sample}</div>'
  '<h2 class="mt">받침 낱말 골라 쓰기</h2>'
  '<div class="grid-row">' + "".join('<div class="cell"><div class="ch"></div></div>' for _ in range(6)) + '</div>'
  '<div style="margin-top:4mm" class="plain"><b>칠한 날</b> &nbsp;'
  '1회 ______  ·  2회 ______  ·  3회 ______</div>',
  '받침 일곱 소리를 모두 칠했다면 교과서 낱말을 읽을 준비가 된 것입니다.', 'cheer')

# ─────────────────────────────── 끝
CONS9 = ["ㄱ","ㄴ","ㄷ","ㄹ","ㅁ","ㅂ","ㅅ","ㅈ","ㅎ"]
V6b = ["ㅏ","ㅓ","ㅗ","ㅜ","ㅡ","ㅣ"]
th43 = '<tr><th class="corner"></th>' + "".join(f'<th>{v}</th>' for v in V6b) + '</tr>'
tr43 = "".join(f'<tr><th>{c}</th>' + "".join(f'<td>{comp(c,v)}</td>' for v in V6b) + '</tr>'
               for c in CONS9)
page('43쪽', '내가 읽을 수 있는 글자', '이 책을 끝낸 날, 읽을 수 있는 글자를 모두 칠해요',
  '<div class="legend">쉰네 글자입니다. 다 칠하지 못해도 괜찮아요. 칠한 칸이 늘어난 것이 중요합니다.</div>'
  f'<table class="make color">{th43}{tr43}</table>',
  '처음 읽기 확인표를 쟀던 날짜와 견주어 보세요. 늘어난 칸 수가 이 책의 성과입니다.')

sheets.append(f'''<div class="sheet"><div class="award">
  <h1>참 잘했어요</h1>
  <div class="cat">{CH['cheer']}</div>
  <div class="line"><span class="blank"></span> 어린이는<br>
  쵸코와 함께 한글을 익혔습니다.<br>
  이제 혼자서 글자를 읽고 쓸 수 있습니다.</div>
  <div class="line" style="margin-top:4mm">______ 년 ____ 월 ____ 일<br>
  창신초등학교 &nbsp; <span class="blank"></span></div>
</div></div>''')

BANNER = '''<div class="banner">
<b>「쵸코와 한글」 익힘책 · A4 44쪽</b><br>
이 페이지를 그대로 인쇄하면 익힘책이 됩니다. 이 안내는 인쇄되지 않습니다.
<ol>
<li>Ctrl + P (맥은 ⌘ + P)</li>
<li>용지 <b>A4</b>, 배율 <b>100%</b> — 「용지에 맞춤」은 끕니다. 쓰기 칸이 작아집니다.</li>
<li>여백 <b>기본</b>, 머리글·바닥글 <b>끄기</b></li>
<li>배경 그래픽 <b>켜기</b> — 끄면 쓰기 칸의 십자 안내선이 사라집니다.</li>
</ol>
왼쪽을 스프링이나 집게로 묶으면 한 권이 됩니다.
</div>'''
html_doc = ('<!DOCTYPE html><html lang="ko"><head><meta charset="utf-8">'
            '<meta name="viewport" content="width=device-width, initial-scale=1">'
            f'<title>쵸코와 한글 익힘책</title><style>{CSS}</style></head><body>'
            + BANNER + "".join(sheets) + '</body></html>')
open(os.path.join(HERE, 'book.html'), 'w', encoding='utf-8').write(html_doc)
print('쪽수:', len(sheets))

# ─────────────────────────────── 2단계 학습지 낱장 (익힘책 2부 33~42쪽을 따로 뽑은 것)
S2 = sheets[32:42]
BANNER2 = '''<div class="banner">
<b>「쵸코와 한글」 2단계 학습지 · A4 10장</b><br>
익힘책 2부(33~42쪽)와 같은 내용을 낱장으로 뽑았습니다. 화면에서 받침판 활동을 한 뒤 한 장씩 줍니다. 이 안내는 인쇄되지 않습니다.
<ol>
<li>Ctrl + P (맥은 ⌘ + P)</li>
<li>용지 <b>A4</b>, 배율 <b>100%</b> — 「용지에 맞춤」은 끕니다.</li>
<li>머리글·바닥글 <b>끄기</b>, 배경 그래픽 <b>켜기</b></li>
<li>필요한 쪽만 인쇄하려면 인쇄 대화상자에서 쪽 번호를 고릅니다 (1장 = 33쪽).</li>
</ol></div>'''
open(os.path.join(HERE, 'stage2.html'), 'w', encoding='utf-8').write(
    '<!DOCTYPE html><html lang="ko"><head><meta charset="utf-8">'
    '<meta name="viewport" content="width=device-width, initial-scale=1">'
    f'<title>쵸코와 한글 · 2단계 학습지</title><style>{CSS}</style></head><body>'
    + BANNER2 + "".join(S2) + '</body></html>')
print('2단계 학습지:', len(S2), '장')
