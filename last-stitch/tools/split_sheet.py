# 한 줄로 늘어선 자세 그림(스프라이트 시트)을 낱장으로 자른다. 배경 지우기 → 덩어리 찾기 → 왼쪽부터 번호
# 사용: python split_sheet.py 시트.png 출력이름앞 개수 [--key magenta] [--max 200]
#  → 출력이름앞_0.webp ... 같은 크기 캔버스, 발끝(바닥)을 맞춰 저장
import sys, argparse
import numpy as np
from PIL import Image, ImageFilter
from chroma import key_out

ap = argparse.ArgumentParser()
ap.add_argument('src'); ap.add_argument('prefix'); ap.add_argument('n', type=int)
ap.add_argument('--key', default='magenta'); ap.add_argument('--max', type=int, default=200)
o = ap.parse_args()
rgb = np.array(Image.open(o.src).convert('RGB'))
col, al = key_out(rgb, o.key)
mask = np.array(Image.fromarray((al > 40).astype(np.uint8) * 255).filter(ImageFilter.MaxFilter(9))) > 0
# 열 투영으로 덩어리 나누기 (가로 한 줄 배치)
cols = mask.any(axis=0)
runs = []; st = None
for x, v in enumerate(cols):
    if v and st is None: st = x
    if (not v or x == len(cols) - 1) and st is not None:
        runs.append((st, x)); st = None
runs = sorted(runs, key=lambda r: r[1] - r[0], reverse=True)[:o.n]
runs.sort()
if len(runs) != o.n:
    print('FAIL: 덩어리', len(runs), '개'); sys.exit(1)
boxes = []
for x0, x1 in runs:
    ys = np.where(mask[:, x0:x1].any(axis=1))[0]
    boxes.append((x0, ys.min(), x1, ys.max()))
W = max(b[2] - b[0] for b in boxes) + 8
H = max(b[3] - b[1] for b in boxes) + 8
for i, (x0, y0, x1, y1) in enumerate(boxes):
    rgba = np.dstack([col, al])[y0:y1 + 1, x0:x1 + 1]
    piece = Image.fromarray(rgba, 'RGBA')
    can = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    can.paste(piece, ((W - piece.width) // 2, H - piece.height - 4))
    can.thumbnail((o.max, o.max), Image.LANCZOS)
    can.save(f'{o.prefix}_{i}.webp', quality=90, method=6)
print('OK', o.n, 'pieces', W, H)
