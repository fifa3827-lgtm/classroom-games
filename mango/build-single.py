#!/usr/bin/env python3
"""나뉜 파일들을 단일 HTML 하나로 합친다.
링크 없이 파일 하나만 주고받아야 할 때 쓴다(메일 첨부, 오프라인 시연).
  python3 build-single.py        ->  dist/mango-single.html      (사건 1)
  python3 build-single.py 02     ->  dist/mango-single-02.html   (사건 2)
"""
import json, os, re, pathlib, sys
CASE = (sys.argv[1] if len(sys.argv)>1 else '01').zfill(2)
root = pathlib.Path(__file__).parent
read = lambda p: (root/p).read_text(encoding='utf-8')

html = read('index.html')
css  = read('css/style.css')
case = json.loads(read('data/case-%s.json' % CASE))
audio= read('js/audio.js')
save = read('js/save.js')
game = read('js/game.js')

# 모듈 문법을 걷어내고 하나의 스코프로 합친다
def strip(s):
    s = re.sub(r'^\s*export\s*\{[^}]*\};?\s*$', '', s, flags=re.M)   # export 목록 줄부터 없앤다
    return re.sub(r'^\s*export\s+', '', s, flags=re.M)                  # 그 뒤에 남은 export 키워드
game  = re.sub(r'^\s*import[\s\S]*?from\s*[\'"][^\'"]+[\'"];\s*$', '', game, flags=re.M)
game  = game.replace('Save.', 'SaveMod_')
save  = strip(save)
save  = re.sub(r'\bfunction (save|saveNow|load|clear|has|loadPrefs|savePrefs|makeCode|applyCode|agoText)\b',
               lambda m: 'function SaveMod_'+m.group(1), save)
# save.js 내부의 자기 호출도 같이 바꾼다
for fn in ['save','saveNow','load','clear','has','loadPrefs','savePrefs','makeCode','applyCode','agoText']:
    save = re.sub(r'(?<![\w.])'+fn+r'\(', 'SaveMod_'+fn+'(', save)
    save = save.replace('function SaveMod_SaveMod_','function SaveMod_')
save = save.replace('SaveMod_SaveMod_','SaveMod_')

# 사건 데이터는 fetch 대신 그대로 박아 넣는다
# 사건 데이터를 그대로 박는다. fetch(...) 한 덩어리를 통째로 갈아 끼운다.
i = game.index("fetch('data/case-'")
j = game.index('  });', i) + len('  });')
game = game[:i] + "C=__CASE__;document.title='탐정 망고 · '+(C.title||'첫 사건');\nprobeCaseArt().then(boot,boot);" + game[j:]
bundle = "(function(){\n'use strict';\nvar __CASE__=" + json.dumps(case, ensure_ascii=False) + ";\n" \
       + strip(audio) + "\n" + save + "\n" + game + "\n})();"

# 주소 뒤의 판 번호(?v=…)가 붙어 있어도 잡히게 정규식으로
out = re.sub(r'<link rel="stylesheet" href="css/style\.css[^"]*">', lambda m: '<style>\n'+css+'\n</style>', html)
out = re.sub(r'<script type="module" src="js/game\.js[^"]*"></script>', lambda m: '<script>\n'+bundle+'\n</script>', out)
(root/'dist').mkdir(exist_ok=True)
name = 'dist/mango-single%s.html' % ('' if CASE=='01' else '-'+CASE)
(root/name).write_text(out, encoding='utf-8')
print(name, len(out), '바이트')
