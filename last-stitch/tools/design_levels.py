# 판 설계: 세로판 길(꺾이는 점)만 정하면 가로판 길은 돌려서 만들고, 빈자리는 양쪽 다 자동으로 고른다.
# 결과를 layouts.json 에 넣고(1-1은 손대지 않음) 밑그림·확인 그림·한눈 보기 그림을 만든다.
# 사용: python design_levels.py
import json, math, os
from PIL import Image, ImageDraw
from layout import catmull, SAFE, PATH_W, PAD_R, draw
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(os.path.dirname(os.path.dirname(HERE)), '원본그림', '밑그림')
ASP = {'v': 1008 / 1561, 'h': 1585 / 992}   # Codex 결과 그림 비율(실측)

# 세로판 길: 위(또는 옆)에서 들어와 아래 가운데 성문(0.5, 0.865)으로. 갈래 길은 길 두 개.
G = [0.5, 0.865]
L = {
 '1-2': ([[[0.30, -0.03], [0.30, 0.16], [0.70, 0.30], [0.70, 0.46], [0.32, 0.58], [0.40, 0.74], [0.50, 0.80], G]], 8),
 '1-3': ([[[-0.03, 0.20], [0.36, 0.20], [0.70, 0.30], [0.66, 0.50], [0.30, 0.56], [0.32, 0.72], [0.50, 0.80], G]], 9),
 '1-4': ([[[0.72, -0.03], [0.72, 0.14], [0.30, 0.24], [0.30, 0.40], [0.70, 0.50], [0.66, 0.66], [0.40, 0.72], [0.50, 0.80], G]], 9),
 '2-1': ([[[0.50, -0.03], [0.50, 0.12], [0.28, 0.26], [0.34, 0.44], [0.70, 0.52], [0.66, 0.70], [0.50, 0.80], G]], 9),
 '2-2': ([[[1.03, 0.16], [0.62, 0.16], [0.30, 0.26], [0.32, 0.46], [0.70, 0.54], [0.70, 0.70], [0.50, 0.80], G]], 10),
 '2-3': ([[[0.26, -0.03], [0.26, 0.16], [0.60, 0.24], [0.74, 0.40], [0.40, 0.48], [0.28, 0.64], [0.50, 0.80], G]], 10),
 '2-4': ([[[0.70, -0.03], [0.66, 0.18], [0.30, 0.24], [0.28, 0.42], [0.62, 0.48], [0.74, 0.64], [0.50, 0.80], G]], 10),
 '3-1': ([[[-0.03, 0.32], [0.28, 0.32], [0.40, 0.14], [0.68, 0.16], [0.72, 0.38], [0.36, 0.52], [0.34, 0.70], [0.50, 0.80], G]], 10),
 '3-2': ([[[0.40, -0.03], [0.40, 0.12], [0.72, 0.22], [0.68, 0.40], [0.30, 0.46], [0.30, 0.62], [0.66, 0.72], [0.50, 0.80], G]], 11),
 '3-3': ([[[0.70, -0.03], [0.70, 0.10], [0.30, 0.16], [0.26, 0.34], [0.50, 0.44], [0.74, 0.52], [0.72, 0.70], [0.50, 0.80], G]], 11),
 '3-4': ([[[0.30, -0.03], [0.30, 0.12], [0.70, 0.18], [0.72, 0.36], [0.30, 0.42], [0.28, 0.60], [0.70, 0.66], [0.50, 0.80], G]], 11),
 '4-1': ([[[0.50, -0.03], [0.50, 0.12], [0.74, 0.24], [0.70, 0.42], [0.30, 0.50], [0.30, 0.66], [0.50, 0.80], G]], 11),
 '4-2': ([[[0.28, -0.03], [0.28, 0.20], [0.38, 0.40], [0.28, 0.60], [0.50, 0.76], G],
          [[0.72, -0.03], [0.72, 0.20], [0.62, 0.40], [0.72, 0.60], [0.50, 0.76], G]], 9),
 '4-3': ([[[0.50, -0.03], [0.50, 0.12], [0.26, 0.26], [0.26, 0.46], [0.50, 0.62], [0.50, 0.76], G],
          [[0.50, -0.03], [0.50, 0.12], [0.74, 0.26], [0.74, 0.46], [0.50, 0.62], [0.50, 0.76], G]], 10),
 '4-4': ([[[-0.03, 0.20], [0.34, 0.20], [0.44, 0.40], [0.50, 0.56], [0.40, 0.70], [0.50, 0.80], G],
          [[1.03, 0.20], [0.66, 0.20], [0.56, 0.40], [0.50, 0.56], [0.40, 0.70], [0.50, 0.80], G]], 10),
 '5-1': ([[[0.70, -0.03], [0.70, 0.12], [0.30, 0.20], [0.28, 0.38], [0.72, 0.44], [0.72, 0.62], [0.34, 0.68], [0.50, 0.80], G]], 11),
 '5-2': ([[[0.30, -0.03], [0.30, 0.14], [0.70, 0.22], [0.70, 0.40], [0.40, 0.50], [0.40, 0.66], [0.50, 0.80], G],
          [[1.03, 0.58], [0.70, 0.60], [0.40, 0.66], [0.50, 0.80], G]], 11),
 '5-3': ([[[0.50, -0.03], [0.50, 0.10], [0.26, 0.20], [0.28, 0.40], [0.62, 0.46], [0.72, 0.62], [0.50, 0.80], G],
          [[-0.03, 0.58], [0.24, 0.62], [0.40, 0.72], [0.50, 0.80], G]], 12),
}

def to_h(p):
    # 세로판 점 → 가로판 점 (위→아래 흐름을 왼→오른쪽 흐름으로)
    x, y = p
    sv, sh = SAFE['v'], SAFE['h']
    hx = y if -0.1 < y < 1.1 else y
    hy = sh[1] + (x - sv[0]) / (sv[2] - sv[0]) * (sh[3] - sh[1])
    if x <= -0.02: hy = -0.03
    if x >= 1.02: hy = 1.03
    return [round(hx, 3), round(hy, 3)]

def dist_seg(px, py, ax, ay, bx, by):
    dx, dy = bx - ax, by - ay; l2 = dx * dx + dy * dy or 1
    t = max(0, min(1, ((px - ax) * dx + (py - ay) * dy) / l2))
    return math.hypot(px - ax - dx * t, py - ay - dy * t)

def autopads(paths, ori, n, gate):
    a = ASP[ori]
    W, H = (1000, 1000 / a) if ori == 'v' else (1000 * a, 1000)
    pts = []
    for p in paths:
        c = catmull(p, 0.005)
        pts += [(x * W, y * H) for x, y in c]
    segs = list(zip(pts[:-1], pts[1:]))
    x0, y0, x1, y1 = SAFE[ori]
    R = PAD_R * 1000
    gw, gh = (340, 130) if ori == 'v' else (220, 300)
    gx, gy = gate[0] * W, gate[1] * H
    cands = []
    step = 18
    yy = y0 * H + R + 10
    while yy < y1 * H - R - 10:
        xx = x0 * W + R + 6
        while xx < x1 * W - R - 6:
            d = min(dist_seg(xx, yy, *s[0], *s[1]) for s in segs[::2])
            in_gate = abs(xx - gx) < gw / 2 + R + 10 and abs(yy - gy) < gh / 2 + R + 10
            if d > 60 + R + 14 and d < 300 and not in_gate:
                cov = sum(1 for (px, py) in pts[::4] if (px - xx) ** 2 + (py - yy) ** 2 < 230 ** 2)
                cands.append((cov - d * 0.05, xx, yy))
            xx += step
        yy += step
    cands.sort(reverse=True)
    chosen = []
    minD = 2 * R + 22
    for sc, xx, yy in cands:
        if all(math.hypot(xx - cx, yy - cy) > minD for cx, cy in chosen):
            chosen.append((xx, yy))
        if len(chosen) == n: break
    # 길 따라 순서대로(가까운 길 점 순서) 번호를 매긴다
    def order(p):
        best = min(range(0, len(pts), 3), key=lambda i: (pts[i][0] - p[0]) ** 2 + (pts[i][1] - p[1]) ** 2)
        return best
    chosen.sort(key=order)
    return [[round(x / W, 4), round(y / H, 4)] for x, y in chosen]

data = json.load(open(os.path.join(HERE, 'layouts.json'), encoding='utf-8'))
os.makedirs(OUT, exist_ok=True)
thumbs = []
for lid, (vpaths, n) in L.items():
    hpaths = [[to_h(p) for p in path] for path in vpaths]
    hg = to_h(G)
    d = {'v': {'paths': vpaths, 'gate': G}, 'h': {'paths': hpaths, 'gate': [0.86, 0.5]}}
    d['h']['paths'] = [pth[:-1] + [[0.86, 0.5]] if pth[-1] == hg else pth for pth in hpaths]
    for ori in ('v', 'h'):
        d[ori]['pads'] = autopads(d[ori]['paths'], ori, n, d[ori]['gate'])
    m = min(len(d['v']['pads']), len(d['h']['pads']))
    if m < n:
        print('short', lid, len(d['v']['pads']), len(d['h']['pads']), 'want', n)
        for ori in ('v', 'h'): d[ori]['pads'] = autopads(d[ori]['paths'], ori, m, d[ori]['gate'])
    data[lid] = d
    for ori in ('v', 'h'):
        draw(d, ori, out=os.path.join(OUT, f'{lid}_{ori}_밑그림.png'))
        draw(d, ori, out=os.path.join(OUT, f'{lid}_{ori}_확인.png'), overlay=True, base=os.path.join(OUT, f'{lid}_{ori}_밑그림.png'))
    thumbs.append(lid)
json.dump(data, open(os.path.join(HERE, 'layouts.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
# 한눈 보기
for ori, (tw, th) in (('v', (150, 240)), ('h', (240, 150))):
    cols = 9
    sheet = Image.new('RGB', (cols * (tw + 6), ((len(thumbs) + cols - 1) // cols) * (th + 18)), 'white')
    dd = ImageDraw.Draw(sheet)
    for i, lid in enumerate(thumbs):
        im = Image.open(os.path.join(OUT, f'{lid}_{ori}_확인.png')).convert('RGB').resize((tw, th))
        x, y = (i % cols) * (tw + 6), (i // cols) * (th + 18)
        sheet.paste(im, (x, y + 16)); dd.text((x + 2, y + 2), lid, fill='black')
    sheet.save(os.path.join(OUT, f'_한눈보기_{ori}.jpg'), quality=80)
print('done', len(thumbs))
