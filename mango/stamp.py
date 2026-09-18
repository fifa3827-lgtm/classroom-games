#!/usr/bin/env python3
# 올리기 전에 한 번 돈다. 코드·스타일 파일 주소 뒤의 판 번호를 지금 시각으로 바꿔서
# 브라우저와 깃허브 페이지가 옛 파일을 내주지 않게 한다.
# 쓰기: python3 stamp.py   → index.html 과 js/game.js 의 ?v= 를 갱신
import re, datetime, pathlib
v = datetime.datetime.now().strftime('%y%m%d%H%M')
root = pathlib.Path(__file__).parent

def stamp(path, pattern, repl):
    p = root / path; s = p.read_text(encoding='utf-8')
    n, cnt = re.subn(pattern, repl, s)
    p.write_text(n, encoding='utf-8'); print('%-14s %d곳 → v=%s' % (path, cnt, v))

stamp('index.html', r'(href="css/style\.css)(\?v=[^"]*)?"', r'\1?v=%s"' % v)
stamp('index.html', r'(src="js/game\.js)(\?v=[^"]*)?"', r'\1?v=%s"' % v)
stamp('js/game.js', r"(from '\./(?:audio|save)\.js)(\?v=[^']*)?'", r"\1?v=%s'" % v)
