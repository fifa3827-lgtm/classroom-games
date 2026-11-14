# 판 배치(길·빈자리·성문) 설계 도구: 밑그림 PNG와 확인용 겹침 그림을 만든다.
# 좌표는 0~1 정규 좌표. 세로판 그림 992x1586, 가로판 1586x992 기준.
import json, sys, math, os
from PIL import Image, ImageDraw
HERE = os.path.dirname(os.path.abspath(__file__))
LAYOUT = os.path.join(HERE, 'layouts.json')
SIZE = {'v': (992, 1586), 'h': (1586, 992)}
PATH_W = 0.12   # 길 폭 (짧은 변 비율)
PAD_R = 0.062   # 빈자리 반지름 (짧은 변 비율)
# 화면비 9:19.5 ~ 21:9 에서도 보이는 안전 구역
SAFE = {'v': (0.14, 0.09, 0.86, 0.91), 'h': (0.09, 0.17, 0.91, 0.83)}

def catmull(pts, step=0.01):
    """꺾이는 점 목록을 부드러운 곡선 점 목록으로 (JS와 같은 방식)."""
    out = []
    n = len(pts)
    for i in range(n - 1):
        p0 = pts[max(i - 1, 0)]; p1 = pts[i]; p2 = pts[i + 1]; p3 = pts[min(i + 2, n - 1)]
        seg = math.dist(p1, p2)
        k = max(2, int(seg / step))
        for j in range(k):
            t = j / k; t2 = t * t; t3 = t2 * t
            out.append(tuple(0.5 * ((2 * p1[d]) + (-p0[d] + p2[d]) * t + (2 * p0[d] - 5 * p1[d] + 4 * p2[d] - p3[d]) * t2 + (-p0[d] + 3 * p1[d] - 3 * p2[d] + p3[d]) * t3) for d in range(2)))
    out.append(tuple(pts[-1]))
    return out

def draw(level, ori, base=None, out=None, overlay=False):
    W, H = SIZE[ori]
    S = min(W, H)
    L = level[ori]
    if base:
        im = Image.open(base).convert('RGB').resize((W, H))
        d = ImageDraw.Draw(im, 'RGBA')
    else:
        im = Image.new('RGB', (W, H), (122, 178, 84))
        d = ImageDraw.Draw(im, 'RGBA')
    pw = int(PATH_W * S)
    for path in L['paths']:
        pts = [(x * W, y * H) for x, y in catmull(path)]
        col = (255, 0, 0, 110) if overlay else (222, 190, 132, 255)
        d.line(pts, fill=col, width=(6 if overlay else pw), joint='curve')
        if not overlay:
            r = pw / 2
            for x, y in pts[::3]:
                d.ellipse((x - r, y - r, x + r, y + r), fill=col)
    r = PAD_R * S
    for i, (x, y) in enumerate(L['pads']):
        x *= W; y *= H
        if overlay:
            d.ellipse((x - r, y - r, x + r, y + r), outline=(0, 120, 255, 255), width=5)
            d.text((x - 4, y - 6), str(i), fill=(255, 255, 255, 255))
        else:
            d.ellipse((x - r, y - r, x + r, y + r), fill=(150, 150, 150), outline=(95, 95, 95), width=6)
    gx, gy = L['gate']
    gx *= W; gy *= H
    gw, gh = (0.34 * S, 0.13 * S) if ori == 'v' else (0.22 * S, 0.30 * S)
    d.rectangle((gx - gw / 2, gy - gh / 2, gx + gw / 2, gy + gh / 2), outline=(40, 70, 200, 255) if overlay else None, fill=None if overlay else (80, 110, 200), width=5 if overlay else 0)
    if overlay:
        x0, y0, x1, y1 = SAFE[ori]
        d.rectangle((x0 * W, y0 * H, x1 * W, y1 * H), outline=(255, 255, 0, 200), width=3)
    im.save(out)

if __name__ == '__main__':
    data = json.load(open(LAYOUT, encoding='utf-8'))
    lid = sys.argv[1]
    outdir = sys.argv[2]
    os.makedirs(outdir, exist_ok=True)
    for ori in ('v', 'h'):
        if ori in data[lid]:
            draw(data[lid], ori, out=os.path.join(outdir, f'{lid}_{ori}_밑그림.png'))
            draw(data[lid], ori, out=os.path.join(outdir, f'{lid}_{ori}_확인.png'), overlay=True, base=os.path.join(outdir, f'{lid}_{ori}_밑그림.png'))
