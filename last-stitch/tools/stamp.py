# 고친 파일이 브라우저·서버 캐시에 막히지 않게, index.html 에 파일마다 내용 해시를 붙인 import map 을 쓴다.
# 코드를 고칠 때마다(특히 올리기 전) 돌린다. 사용: python tools/stamp.py
import os, re, glob, hashlib, json
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def h(p): return hashlib.md5(open(p, 'rb').read()).hexdigest()[:8]
imports = {}
for f in sorted(glob.glob(os.path.join(ROOT, 'js', '**', '*.js'), recursive=True)):
    rel = os.path.relpath(f, ROOT).replace(os.sep, '/')
    imports['./' + rel] = './' + rel + '?v=' + h(f)
idx = os.path.join(ROOT, 'index.html')
s = open(idx, encoding='utf-8').read()
block = '<script type="importmap">' + json.dumps({'imports': imports}, ensure_ascii=False) + '</script>'
if '<script type="importmap">' in s:
    s = re.sub(r'<script type="importmap">.*?</script>', lambda m: block, s, flags=re.S)
else:
    s = s.replace('<script type="module"', block + '\n<script type="module"')
s = re.sub(r'src="js/main\.js(\?v=\w+)?"', 'src="./js/main.js"', s)
s = re.sub(r'href="css/style\.css(\?v=\w+)?"', f'href="css/style.css?v={h(os.path.join(ROOT, "css", "style.css"))}"', s)
open(idx, 'w', encoding='utf-8').write(s)
print('stamped', len(imports), 'modules')
