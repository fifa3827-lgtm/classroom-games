# 게임에 쓰인 글자만 남겨 글꼴을 작게 만든다 (woff2). 글을 고친 뒤 다시 돌린다.
# 사용: python fonts.py  (last-stitch/tools 에서)
import os, glob, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SRC = os.path.join(os.path.dirname(ROOT), '원본그림', '글꼴')
chars = set()
for f in glob.glob(os.path.join(ROOT, 'js', '**', '*.js'), recursive=True) + [os.path.join(ROOT, 'index.html')]:
    chars |= set(open(f, encoding='utf-8').read())
chars |= set(''.join(chr(c) for c in range(0x20, 0x7f)))
chars |= set('…·→←↑↓▶▸★☆✓✂×%“”‘’「」『』')
text = ''.join(sorted(c for c in chars if ord(c) >= 0x20))
tf = os.path.join(HERE, '_chars.txt'); open(tf, 'w', encoding='utf-8').write(text)
jobs = [('GowunDodum-Regular.ttf', 'GowunDodum.woff2', True), ('GowunBatang-Bold.ttf', 'GowunBatang-Bold.woff2', True),
        ('GowunBatang-Regular.ttf', 'GowunBatang-Regular.woff2', True), ('CinzelDecorative-Bold.ttf', 'CinzelDecorative-Bold.woff2', False),
        ('Cinzel[wght].ttf', 'Cinzel.woff2', False)]
for src, dst, sub in jobs:
    args = [sys.executable, '-m', 'fontTools.subset', os.path.join(SRC, src), f'--output-file={os.path.join(ROOT, "assets", "fonts", dst)}', '--flavor=woff2', '--layout-features=*']
    args.append(f'--text-file={tf}' if sub else '--unicodes=U+0020-007E,U+2018-201D,U+2026')
    subprocess.run(args, check=True)
    print(dst, os.path.getsize(os.path.join(ROOT, 'assets', 'fonts', dst)) // 1024, 'KB')
os.remove(tf)
