# -*- coding: utf-8 -*-
"""「쵸코와 한글」 가정 학습 과제 — 주 1회 A4 1장, 1~3단계 12주분.
   한 장에 이번 주 글자·낱말, 하루 3분씩 닷새, 게임 QR, 부모님께 세 줄."""
import io, os, segno

HERE = os.path.dirname(os.path.abspath(__file__))
import json
CH = json.load(open(os.path.join(HERE, 'choco.json'), encoding='utf-8'))

GAME = 'https://fifa3827-lgtm.github.io/classroom-games/hangul/'

CHO = ["ㄱ","ㄲ","ㄴ","ㄷ","ㄸ","ㄹ","ㅁ","ㅂ","ㅃ","ㅅ","ㅆ","ㅇ","ㅈ","ㅉ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ"]
JUNG = ["ㅏ","ㅐ","ㅑ","ㅒ","ㅓ","ㅔ","ㅕ","ㅖ","ㅗ","ㅘ","ㅙ","ㅚ","ㅛ","ㅜ","ㅝ","ㅞ","ㅟ","ㅠ","ㅡ","ㅢ","ㅣ"]
comp = lambda c, v: chr(0xAC00 + (CHO.index(c)*21 + JUNG.index(v))*28)

def qr_svg(url, scale=1):
    buf = io.BytesIO()
    segno.make(url, error='m').save(buf, kind='svg', scale=scale,
                                    xmldecl=False, svgns=True, omitsize=True, border=2)
    return buf.getvalue().decode('utf-8')

QR = qr_svg(GAME)

WEEKS = [
 dict(no=1, title='모음 다섯과 ㄱ 줄',
      letters=['ㅏ','ㅓ','ㅗ','ㅜ','ㅣ'],
      syll=[comp('ㄱ', v) for v in ['ㅏ','ㅓ','ㅗ','ㅜ','ㅣ']],
      words=[('고기','🥩','meat')],
      game='글자판 · 모음 여섯',
      parent='이번 주는 모음 다섯과 ㄱ 줄입니다. 아이에게 글자를 가르치실 필요는 없습니다. '
             '하루 3분, 아이가 소리 내어 읽는 것을 들어 주시고 한 번 따라 읽어 주시면 됩니다.'),
 dict(no=2, title='ㄴ 줄과 ㄷ 줄',
      letters=['ㄱ','ㄴ','ㄷ'],
      syll=[comp('ㄴ', v) for v in ['ㅏ','ㅓ','ㅗ','ㅜ','ㅣ']] +
           [comp('ㄷ', v) for v in ['ㅏ','ㅗ','ㅜ']],
      words=[('나무','🌳','tree'), ('구두','👞','shoes')],
      game='글자판 · 글자 만들기',
      parent='글자가 두 조각(자음+모음)으로 만들어진다는 것을 아이가 알아 가는 중입니다. '
             '「나」가 왜 ㄴ과 ㅏ인지 아이에게 물어봐 주세요. 아이가 설명하면 그 주는 성공입니다.'),
 dict(no=3, title='ㅁ 줄과 ㅅ 줄',
      letters=['ㅁ','ㅅ'],
      syll=[comp('ㅁ', v) for v in ['ㅏ','ㅓ','ㅗ','ㅜ','ㅣ']] +
           [comp('ㅅ', v) for v in ['ㅏ','ㅗ','ㅣ']],
      words=[('모자','🧢','hat'), ('고구마','🍠','sweet potato')],
      game='낱말 채우기 · 읽어 보기',
      parent='이번 주에 스물다섯 글자가 모두 나옵니다. 다 못 읽어도 괜찮습니다. '
             '읽은 글자에 아이가 직접 색칠하게 해 주세요. 칠한 칸이 늘어나는 것이 목표입니다.'),
 dict(no=4, title='ㅂ ㅈ ㅎ 과 모음 ㅡ',
      letters=['ㅂ','ㅈ','ㅎ','ㅡ'],
      syll=[comp('ㅂ','ㅏ'), comp('ㅂ','ㅜ'), comp('ㅈ','ㅏ'), comp('ㅈ','ㅣ'),
            comp('ㅎ','ㅏ'), comp('ㅎ','ㅗ'), comp('ㄱ','ㅡ'), comp('ㄴ','ㅡ')],
      words=[('바다','🌊','sea'), ('하마','🦛','hippo')],
      game='글자 만들기 · 읽어 보기',
      parent='「ㅡ」 소리는 영어에 없어 아이가 가장 어려워합니다. 「그」와 「구」를 번갈아 읽어 주시고 '
             '아이가 따라 하게 해 주세요. 정확하지 않아도 넘어갑니다.'),
 dict(no=5, title='ㄹ ㅇ ㅊ ㅋ ㅌ ㅍ',
      letters=['ㄹ','ㅇ','ㅊ','ㅋ','ㅌ','ㅍ'],
      syll=[comp('ㄹ','ㅏ'), comp('ㄹ','ㅣ'), comp('ㅇ','ㅏ'), comp('ㅇ','ㅗ'),
            comp('ㅊ','ㅏ'), comp('ㅋ','ㅗ'), comp('ㅌ','ㅗ'), comp('ㅍ','ㅗ')],
      words=[('오리','🦆','duck'), ('기차','🚂','train')],
      game='글자판(범위 3) · 낱말 채우기',
      parent='ㄹ은 영어의 l 소리와 비슷해서 아이가 오히려 쉬워합니다. '
             'ㅇ은 소리가 나지 않고 자리만 지킨다는 것을 「아·오」로 보여 주세요.'),
 dict(no=6, title='남은 모음 ㅑ ㅕ ㅛ ㅠ ㅐ ㅔ',
      letters=['ㅑ','ㅕ','ㅛ','ㅠ','ㅐ','ㅔ'],
      syll=[comp('ㄱ','ㅑ'), comp('ㄴ','ㅕ'), comp('ㄷ','ㅛ'), comp('ㅁ','ㅠ'),
            comp('ㅅ','ㅐ'), comp('ㅈ','ㅔ')],
      words=[('어머니','👩','mother'), ('아버지','👨','father')],
      game='모든 활동 · 별 모으기',
      parent='1단계 마지막 주입니다. 받침 없는 글자는 이제 대체로 읽습니다. '
             '다음 주부터 받침(산·달·밤)으로 들어갑니다. 이번 주말에 한 번 칭찬해 주세요.'),
 # ── 2단계 받침 (7~9주차)
 dict(no=7, title='받침 ㄱ ㄴ ㅇ — 글자 아래에 하나 더',
      letters=['ㄱ','ㄴ','ㅇ'],
      syll=['산','눈','손','강','방','공','약','책'],
      words=[('산','⛰️','mountain'), ('눈','👁️','eye'), ('공','⚽','ball')],
      game='받침판 · 받침 붙이기',
      parent='이번 주부터 받침입니다. 「가」 밑에 ㄱ을 붙이면 「각」이 됩니다. '
             '받침은 소리가 살짝 막히는 느낌이라 아이가 처음엔 「사-안」처럼 두 번 읽습니다. '
             '천천히 한 번에 읽을 때까지 기다려 주세요.'),
 dict(no=8, title='받침 ㄹ ㅁ',
      letters=['ㄹ','ㅁ'],
      syll=['달','물','발','길','밤','감','곰'],
      words=[('달','🌙','moon'), ('물','💧','water'), ('곰','🐻','bear')],
      game='받침판 · 받침 읽어 보기',
      parent='받침 ㄹ은 영어 l과 비슷하고, ㅁ은 입을 다물면 납니다. '
             '「다-달」「무-물」처럼 받침 없는 글자와 있는 글자를 짝지어 읽어 주세요. '
             '아이가 둘의 차이를 소리로 구별하면 성공입니다.'),
 dict(no=9, title='받침 ㅂ ㅅ 과 두 글자 낱말',
      letters=['ㅂ','ㅅ'],
      syll=['밥','컵','입','옷','집','손님','시간','빈집'],
      words=[('밥','🍚','rice'), ('옷','👕','clothes'), ('집','🏠','house')],
      game='받침 낱말 · 받침 읽어 보기',
      parent='받침 ㅅ은 「옷」처럼 ㄷ 소리로 납니다. 아이가 「오스」라고 읽으면 '
             '「옷」이라고 한 번만 들려 주세요. 2단계 마지막 주입니다. '
             '다음 주부터는 국어 교과서에 나오는 낱말로 넘어갑니다.'),
 # ── 3단계 이야기 언덕 (10~12주차)
 dict(no=10, title='교과서 낱말 ① 친구 · 마음 · 생각',
      ltitle='이번 주 글자', letters=['친','구','마','음','생','각','서','로'],
      syll=['친구','마음','생각','서로','사과','글자'],
      words=[('친구','🧒','friend'), ('마음','❤️','heart'), ('사과','🍎','apple / sorry')],
      game='교과서 낱말 · 낱말 읽어 보기',
      parent='국어 교과서에 자주 나오는 낱말입니다. 교과서를 펴고 이 낱말을 함께 찾아보세요. '
             '한 쪽에서 하나만 찾아도 충분합니다. 찾은 낱말은 아이가 손가락으로 짚고 읽게 해 주세요.'),
 dict(no=11, title='교과서 낱말 ② 학교 · 선생님 · 연필',
      letters=[],
      syll=['할머니','택배','우리','학교','선생님','연필','가방'],
      words=[('학교','🏫','school'), ('연필','✏️','pencil')],
      sent=[('친구가 왔어요.','🧒'), ('할머니가 웃어요.','👵')],
      game='문장 따라 읽기 · 교과서 낱말',
      parent='이번 주부터 짧은 문장이 나옵니다. 아이가 읽기 전에 부모님이 먼저 한 번 읽어 주시고, '
             '그다음 아이가 따라 읽습니다. 「누가 왔어요?」처럼 문장 내용을 한 가지만 물어봐 주세요.'),
 dict(no=12, title='문장 읽기 — 나도 작가예요',
      letters=[],
      syll=['작가','이야기','장면','내용','교실'],
      words=[('이야기','📖','story')],
      sent=[('책을 읽어요.','📕'), ('우리 서로 도와요.','🤝'), ('나도 작가예요.','✍️')],
      game='문장 만들기 · 별 모으기',
      parent='12주 과제의 마지막 주입니다. 문장을 읽은 뒤 아이가 자기 이야기를 한 문장 말하게 해 주세요. '
             '쓰는 것은 부모님이 대신 써 주셔도 됩니다. 아이가 말한 문장을 아래 칸에 적어 학교로 보내 주세요.'),
]

CSS = '''
@page { size: A4; margin: 12mm 12mm 10mm; }
*{ box-sizing:border-box; }
body{ margin:0; font-family:"Noto Sans CJK KR",sans-serif; color:#242424; font-size:10pt;
  -webkit-print-color-adjust:exact; print-color-adjust:exact; }
.sheet{ page-break-after:always; height:265mm; display:flex; flex-direction:column; }
.sheet:last-child{ page-break-after:auto; }

.top{ display:flex; align-items:center; gap:4mm; border-bottom:2.4pt solid #8B5A3C;
  padding-bottom:2.6mm; margin-bottom:4mm; }
.top .cat{ width:18mm; height:18mm; flex:none; }
.top .cat svg{ width:100%; height:100%; display:block; }
.top h1{ font-size:16pt; margin:0; }
.top .sub{ font-size:9.6pt; color:#6b6b6b; margin-top:1mm; }
.top .wk{ margin-left:auto; text-align:right; font-size:9pt; color:#8B5A3C; white-space:nowrap; }
.top .wk b{ display:block; font-size:13pt; }

h2{ font-size:11pt; margin:0 0 2.4mm; color:#8B5A3C; }
h2 span{ font-weight:400; color:#999; font-size:8.8pt; }
h2.mt{ margin-top:3.6mm; }

.grid-row{ display:flex; gap:2.4mm; margin-bottom:2.4mm; flex-wrap:wrap; }
.cell{ width:19.5mm; height:19.5mm; flex:none; border:1pt solid #c9c2b6; border-radius:1.5mm; position:relative;
  background-image:
    repeating-linear-gradient(to bottom, #ddd5c7 0 1.6mm, transparent 1.6mm 3.2mm),
    repeating-linear-gradient(to right, #ddd5c7 0 1.6mm, transparent 1.6mm 3.2mm);
  background-size: .45mm 100%, 100% .45mm;
  background-position:center center, center center; background-repeat:no-repeat, no-repeat; }
.cell .ch{ position:absolute; inset:0; display:flex; align-items:center; justify-content:center;
  font-size:33pt; font-weight:700; line-height:1; }
.cell .ch.light{ color:#ddd6ca; }
.grid-row .gap{ width:3mm; flex:none; }
.sents{ display:flex; gap:3mm; flex-wrap:wrap; }
.sent{ border:1pt solid #c9c2b6; border-radius:2mm; padding:2.4mm 4mm; display:flex; align-items:center; gap:2.6mm; }
.sent .pic{ font-size:16pt; }
.sent .s{ font-size:17pt; font-weight:700; letter-spacing:.04em; }
.mysent{ display:flex; align-items:flex-end; gap:3mm; margin-top:2.6mm; font-size:9pt; color:#8B5A3C; }
.mysent .line{ flex:1; border-bottom:1pt solid #999; height:9mm; }

.readbar{ display:flex; gap:2.2mm; flex-wrap:wrap; }
.readbar .c{ min-width:17mm; height:15mm; padding:0 2mm; border:1pt solid #c9c2b6; border-radius:1.6mm;
  display:flex; align-items:center; justify-content:center; font-size:19pt; font-weight:700; color:#8a8378; }

.words{ display:flex; gap:5mm; flex-wrap:wrap; }
.wordbox{ border:1pt solid #c9c2b6; border-radius:2mm; padding:3mm 4mm; display:flex; align-items:center; gap:3mm; }
.wordbox .pic{ font-size:24pt; }
.wordbox .w{ font-size:21pt; font-weight:700; }
.wordbox .en{ font-size:8pt; color:#999; }

.days{ display:flex; gap:2.4mm; }
.day{ flex:1; border:1pt solid #c9c2b6; border-radius:2mm; padding:2.6mm 2mm; text-align:center; }
.day .d{ font-size:9pt; color:#8B5A3C; font-weight:700; }
.day .t{ font-size:8.2pt; color:#777; line-height:1.4; margin-top:1mm; min-height:9mm; }
.day .box{ width:9mm; height:9mm; border:1.4pt solid #c9c2b6; border-radius:1.4mm; margin:1.6mm auto 0; }

.qrrow{ display:flex; gap:5mm; align-items:center; border:1pt solid #d8cdbe; background:#FFFBF4;
  border-radius:2.5mm; padding:4mm 5mm; }
.qrrow .qr{ width:27mm; height:27mm; flex:none; }
.qrrow .qr svg{ width:100%; height:100%; display:block; shape-rendering:crispEdges; }
.qrrow .txt{ font-size:9.4pt; line-height:1.65; }
.qrrow .txt b{ color:#8B5A3C; }
.qrrow .txt .url{ font-size:8.4pt; color:#888; word-break:break-all; }

.parent{ margin-top:auto; border-top:1.2pt solid #8B5A3C; padding-top:3mm; font-size:9.2pt; line-height:1.7; }
.parent .h{ color:#8B5A3C; font-weight:700; margin-bottom:1.2mm; }
.sign{ display:flex; gap:6mm; margin-top:3mm; font-size:9pt; color:#666; }
.sign span{ border-bottom:.8pt solid #bbb; min-width:34mm; display:inline-block; }
'''

sheets = []
for w in WEEKS:
    letters = "".join(
        f'<div class="cell"><div class="ch light">{c}</div></div>' for c in w['letters']) + \
        "".join('<div class="cell"><div class="ch"></div></div>'
                for _ in range(max(0, 8 - len(w['letters']))))
    read = "".join(f'<div class="c">{s}</div>' for s in w['syll'])
    words = "".join(f'<div class="wordbox"><span class="pic">{p}</span>'
                    f'<span><span class="w">{x}</span><br><span class="en">{e}</span></span></div>'
                    for x, p, e in w['words'])
    def wcells(x):
        return ("".join(f'<div class="cell"><div class="ch light">{ch}</div></div>' for ch in x) +
                "".join('<div class="cell"><div class="ch"></div></div>' for _ in x))
    if all(len(x) == 1 for x, _, _ in w['words']):   # 받침 한 글자 낱말은 한 줄에
        wordwrite = '<div class="grid-row">' + \
            '<div class="gap"></div>'.join(wcells(x) for x, _, _ in w['words']) + '</div>'
    else:                                              # 한 줄에 8칸까지 묶어서
        rows, cur, n = [], [], 0
        for x, _, _ in w['words']:
            if cur and n + 2*len(x) > 8:
                rows.append(cur); cur, n = [], 0
            cur.append(x); n += 2*len(x)
        if cur: rows.append(cur)
        wordwrite = "".join('<div class="grid-row">' + '<div class="gap"></div>'.join(wcells(x) for x in r) + '</div>'
                            for r in rows)
    lettersec = (f'<h2>{w.get("ltitle","이번 주 낱자")} <span>흐린 글자를 덧쓰고 빈칸에 혼자 써요</span></h2>'
                 f'<div class="grid-row">{letters}</div>') if w['letters'] else ''
    sent = ""
    if w.get('sent'):
        sent = ('<h2 class="mt">문장 읽기 <span>먼저 들려 주고, 아이가 따라 읽어요</span></h2>'
                '<div class="sents">' +
                "".join(f'<div class="sent"><span class="pic">{p}</span><span class="s">{s}</span></div>'
                        for s, p in w['sent']) + '</div>')
        if w['no'] == 12:
            sent += ('<div class="mysent"><span class="lbl">내가 말한 문장</span><span class="line"></span></div>')
    dayplan = [('월', '쵸코와 3분<br>글자판 누르기'),
               ('화', '이번 주 글자<br>소리 내어 읽기'),
               ('수', '쓰기 칸 채우기'),
               ('목', '낱말 읽고 쓰기'),
               ('금', '쵸코와 3분<br>별 모으기')]
    days = "".join(f'<div class="day"><div class="d">{d}</div><div class="t">{t}</div>'
                   f'<div class="box"></div></div>' for d, t in dayplan)
    sheets.append(f'''<div class="sheet">
  <div class="top">
    <div class="cat">{CH['idle']}</div>
    <div><h1>쵸코와 한글 · 집에서 하는 3분</h1>
      <div class="sub">{w['title']}</div></div>
    <div class="wk">{w['no']}주차<b>이름 ______</b></div>
  </div>

  {lettersec}
  <h2 class="{'mt' if w['letters'] else ''}">소리 내어 읽기 <span>읽은 글자에 색칠해요</span></h2>
  <div class="readbar">{read}</div>

  <h2 class="mt">이번 주 낱말</h2>
  <div class="words">{words}</div>
  <div style="height:2.5mm"></div>
  {wordwrite}
  {sent}

  <h2 class="mt">하루 3분 <span>한 칸씩 색칠하거나 스티커를 붙여요</span></h2>
  <div class="days">{days}</div>

  <div style="height:4mm"></div>
  <div class="qrrow">
    <div class="qr">{QR}</div>
    <div class="txt">
      <b>휴대폰으로 찍으면 쵸코가 나와요.</b><br>
      이번 주에 할 것 — {w['game']}<br>
      <span class="url">{GAME}</span>
    </div>
  </div>

  <div class="parent">
    <div class="h">부모님께</div>
    {w['parent']}
    <div class="sign">확인 <span></span> &nbsp; 날짜 <span></span></div>
  </div>
</div>''')

html_doc = ('<!DOCTYPE html><html lang="ko"><head><meta charset="utf-8">'
            '<meta name="viewport" content="width=device-width, initial-scale=1">'
            '<title>쵸코와 한글 · 가정 과제</title>'
            f'<style>{CSS}\n.banner{{max-width:186mm;margin:6mm auto 10mm;border:1.4pt solid #8B5A3C;'
            'border-radius:3mm;background:#FFFBF4;padding:6mm 7mm;font-size:10.5pt;line-height:1.8}'
            '.banner b{color:#8B5A3C}.banner ol{margin:2mm 0 0;padding-left:6mm}'
            '@media print{.banner{display:none !important}}</style></head><body>'
            '<div class="banner"><b>가정 학습 과제 · 주 1회 A4 1장 · 12주분 (1단계 1~6 · 2단계 7~9 · 3단계 10~12)</b><br>'
            '이 페이지를 그대로 인쇄하면 과제지가 됩니다. 이 안내는 인쇄되지 않습니다.'
            '<ol><li>Ctrl + P (맥은 ⌘ + P)</li>'
            '<li>용지 <b>A4</b>, 배율 <b>100%</b> — 「용지에 맞춤」은 끕니다.</li>'
            '<li>머리글·바닥글 <b>끄기</b>, 배경 그래픽 <b>켜기</b></li>'
            '<li>한 주에 한 장씩, 금요일에 보냅니다.</li></ol></div>'
            + "".join(sheets) + '</body></html>')
open(os.path.join(HERE, 'homework.html'), 'w', encoding='utf-8').write(html_doc)
print('주차:', len(sheets))
