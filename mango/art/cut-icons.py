#!/usr/bin/env python3
# 아이콘 여러 개가 한 장에 든 그림을 낱장으로 자른다.
# 쓰기: python3 cut-icons.py <그림> <이름1,이름2,...>
# 크림색 배경을 지우고, 남은 덩어리를 왼쪽부터 세어 이름 순서대로 붙인다.
import sys, numpy as np
from PIL import Image
from scipy import ndimage

SPECKLE = 60    # 이보다 작은 조각은 잡티로 보고 버린다 (작은 부스러기는 살려야 한다)
PAD     = 0.10  # 잘라낸 뒤 사방 여백 비율

src, names = sys.argv[1], sys.argv[2].split(',')
im = Image.open(src).convert('RGB')
a = np.array(im).astype(int)

# 배경색 = 가장자리에서 가장 흔한 색
edge = np.concatenate([a[0], a[-1], a[:,0], a[:,1]])
bg = np.median(edge, 0)
dist = np.abs(a - bg).sum(2)
m = dist > 34

lab, n = ndimage.label(m, structure=np.ones((3,3)))
sz = ndimage.sum(m, lab, range(1, n+1))
keep = [i+1 for i in range(n) if sz[i] >= SPECKLE]
boxes = ndimage.find_objects(lab)

# 흩어진 덩어리를 아이콘으로 묶는다. 「얼마나 가까우면 한 아이콘인가」는
# 그림마다 다르므로, 칸 수가 이름 수와 맞아떨어지는 간격을 찾아서 쓴다.
base = []
for i in keep:
    sl = boxes[i-1]
    base.append([sl[1].start, sl[1].stop, sl[0].start, sl[0].stop])
base.sort()

def group(gapw):
    items = [b[:] for b in base]
    merged = True
    while merged:
        merged = False
        for p in range(len(items)-1):
            if items[p+1][0] - items[p][1] < gapw:
                q = items.pop(p+1)
                items[p] = [min(items[p][0],q[0]), max(items[p][1],q[1]),
                            min(items[p][2],q[2]), max(items[p][3],q[3])]
                merged = True
                break
    return items

found = None
for gapw in range(4, int(im.width/len(names)), 2):
    g = group(gapw)
    if len(g) == len(names):
        found = (gapw, g)          # 맞는 것 중 가장 넉넉한 간격을 쓴다
if not found:
    print('이름 %d개에 맞는 묶음을 못 찾았습니다.' % len(names))
    for x0,x1,y0,y1 in group(im.width/(len(names)*4)):
        print('  x %d~%d  y %d~%d' % (x0,x1,y0,y1))
    sys.exit(1)
gapw, items = found
print('간격 기준 %dpx 로 %d칸을 찾았습니다.' % (gapw, len(items)))
items = [it+[None] for it in items]

rgba = np.dstack([a.astype(np.uint8), np.where(m, 255, 0).astype(np.uint8)])
for (x0,x1,y0,y1,ids), name in zip(items, names):
    w, h = x1-x0, y1-y0
    s = int(max(w,h) * (1 + 2*PAD))
    # 정사각형으로 「잘라내면」 옆 아이콘까지 물고 온다. 제 칸만 떼어
    # 빈 정사각형 한가운데에 붙인다.
    out = Image.new('RGBA', (s,s), (0,0,0,0))
    piece = Image.fromarray(rgba[y0:y1, x0:x1])
    out.paste(piece, ((s-w)//2, (s-h)//2))
    out = out.resize((128,128), Image.LANCZOS)
    out.save('img/%s.png' % name)
    print('%-14s %dx%d → 128x128' % (name, w, h))
