#!/usr/bin/env python3
# 아이콘 여러 개가 한 장에 든 그림을 낱장으로 자른다.
# 쓰기: python3 cut-icons.py <그림> <이름1,이름2,...>
# 크림색 배경을 지우고, 남은 덩어리를 줄(위→아래) · 칸(왼→오른) 순서로 세어
# 이름 순서대로 붙인다. 한 줄짜리 그림도 그대로 된다.
import sys, numpy as np
from PIL import Image
from scipy import ndimage

SPECKLE = 60    # 이보다 작은 조각은 잡티로 본다 (제미나이 반짝임 등)
PAD     = 0.10  # 잘라낸 뒤 사방 여백 비율

src, names = sys.argv[1], sys.argv[2].split(',')
im = Image.open(src).convert('RGB')
a = np.array(im).astype(int)

edge = np.concatenate([a[0], a[-1], a[:,0], a[:,1]])
bg = np.median(edge, 0)
m = np.abs(a - bg).sum(2) > 34

lab, n = ndimage.label(m, structure=np.ones((3,3)))
sz = ndimage.sum(m, lab, range(1, n+1))
boxes = ndimage.find_objects(lab)
parts = []
for i in range(n):
    if sz[i] < SPECKLE: continue
    sl = boxes[i]
    parts.append([sl[1].start, sl[1].stop, sl[0].start, sl[0].stop])

def merge(items, axis, gap):
    """axis=0 이면 x 로, 1 이면 y 로 이웃한 것을 합친다."""
    lo, hi = (0,1) if axis==0 else (2,3)
    items = sorted(items, key=lambda b: b[lo])
    out = True
    while out:
        out = False
        for p in range(len(items)-1):
            if items[p+1][lo] - items[p][hi] < gap:
                q = items.pop(p+1)
                items[p] = [min(items[p][0],q[0]), max(items[p][1],q[1]),
                            min(items[p][2],q[2]), max(items[p][3],q[3])]
                out = True
                break
    return items

def layout(rows):
    """줄 수를 정하고, 각 줄 안에서 칸을 나눈다. 칸 수의 합을 돌려준다."""
    cols = len(names) // rows
    if rows * cols != len(names): return None
    # 줄 나누기: y 로 합치다가 줄 수가 맞는 간격을 찾는다
    band = None
    for g in range(4, im.height, 4):
        if len(merge(parts, 1, g)) == rows: band = g
    if band is None: return None
    bands = merge(parts, 1, band)
    result = []
    for bd in sorted(bands, key=lambda b: b[2]):
        mine = [p for p in parts if (p[2]+p[3])/2 >= bd[2] and (p[2]+p[3])/2 <= bd[3]]
        found = None
        for g in range(4, im.width, 4):
            if len(merge(mine, 0, g)) == cols: found = merge(mine, 0, g)
        if found is None: return None
        result += sorted(found, key=lambda b: b[0])
    return result

items = None
for rows in range(1, len(names)+1):
    r = layout(rows)
    if r: items = r; print('%d줄 %d칸으로 %d개를 찾았습니다.' % (rows, len(names)//rows, len(r))); break
if items is None:
    print('이름 %d개에 맞는 배치를 못 찾았습니다.' % len(names)); sys.exit(1)

rgba = np.dstack([a.astype(np.uint8), np.where(m, 255, 0).astype(np.uint8)])
for (x0,x1,y0,y1), name in zip(items, names):
    w, h = x1-x0, y1-y0
    s = int(max(w,h) * (1 + 2*PAD))
    # 정사각형으로 「잘라내면」 옆 아이콘까지 물고 온다. 제 칸만 떼어
    # 빈 정사각형 한가운데에 붙인다.
    out = Image.new('RGBA', (s,s), (0,0,0,0))
    out.paste(Image.fromarray(rgba[y0:y1, x0:x1]), ((s-w)//2, (s-h)//2))
    out.resize((128,128), Image.LANCZOS).save('img/%s.png' % name)
    print('%-16s %dx%d → 128x128' % (name, w, h))
