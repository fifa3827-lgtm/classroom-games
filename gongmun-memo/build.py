#!/usr/bin/env python3
"""src.html + vendor/*.js → index.html (인터넷 없이 열리는 한 장짜리 파일)

고칠 때는 src.html을 고친 다음 이 파일을 돌린다:  python3 gongmun-memo/build.py
"""
import pathlib

here = pathlib.Path(__file__).resolve().parent
src = (here / 'src.html').read_text(encoding='utf-8')
MARK = '<!--@LIBS-->'
assert src.count(MARK) == 1, 'src.html에 <!--@LIBS--> 표시가 하나 있어야 한다'

libs = {'jszip': 'jszip.min.js', 'pako': 'pako.min.js', 'xlsx': 'xlsx.full.min.js'}
parts = []
for key, name in libs.items():
    js = (here / 'vendor' / name).read_text(encoding='utf-8')
    # <script> 안에 넣어도 HTML이 깨지지 않게 한다 (자바스크립트 뜻은 그대로)
    js = js.replace('</script', '<\\/script').replace('<!--', '<\\!--')
    assert '</script' not in js.lower()
    parts.append(f'<script type="text/plain" id="lib-{key}">{js}</script>')

out = src.replace(MARK, '\n'.join(parts))
(here / 'index.html').write_text(out, encoding='utf-8')
print(f'index.html {len(out.encode("utf-8")) / 1024:.0f} KB')
