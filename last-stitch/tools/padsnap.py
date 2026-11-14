# 빈자리 좌표를 그림 속 돌 받침 가운데로 붙이기 (모래·펠트처럼 mapfit 의 돌 색 기준이 안 맞는 판용)
# 채도 기준을 조여 가며, 설계 자리 둘레에서 받침만 한 크기의 낮은 채도 덩어리를 찾아 그 가운데로 옮긴다.
# 사용: python padsnap.py 3-1 v [3-2 v ...]   → layouts_fit.json 고침 + 원본그림/맵/확인_<판>_<o>.jpg 다시 그림
import sys, json, os, math
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage
HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(os.path.dirname(os.path.dirname(HERE)), '원본그림', '맵')
PAD_R = 0.062   # 맵 짧은 변 대비 받침 반지름 (render.js PAD_R 62/1000)
SAFE = {'v': [0.14, 0.09, 0.86, 0.91], 'h': [0.09, 0.17, 0.91, 0.83]}
fp = os.path.join(HERE, 'layouts_fit.json')
allf = json.load(open(fp, encoding='utf-8'))
args = sys.argv[1:]
for k in range(0, len(args), 2):
    lid, ori = args[k], args[k + 1]
    L = allf[lid][ori]
    im = Image.open(os.path.join(SRC, f'{lid}_{ori}.png')).convert('RGB')
    W, H = im.size; S = min(W, H); R = PAD_R * S
    hsv = np.asarray(im.convert('HSV')).astype(float) / 255
    s, v = hsv[..., 1], hsv[..., 2]
    out = []; moved = []
    for (x, y) in L['pads']:
        cx, cy = x * W, y * H
        r = int(R * 1.8)
        x0, x1 = int(max(0, cx - r)), int(min(W, cx + r)); y0, y1 = int(max(0, cy - r)), int(min(H, cy + r))
        best = None
        for t in (0.14, 0.17, 0.2, 0.24, 0.28, 0.32):
            m = (s[y0:y1, x0:x1] < t) & (v[y0:y1, x0:x1] > 0.4)
            m = ndimage.binary_opening(m, iterations=2)
            lab, n = ndimage.label(m)
            if not n: continue
            for i in range(1, n + 1):
                yy, xx = np.nonzero(lab == i)
                area = len(xx)
                if not (0.45 * math.pi * R * R * 0.65 < area < 1.5 * math.pi * R * R): continue
                mx, my = xx.mean() + x0, yy.mean() + y0
                d = math.hypot(mx - cx, my - cy)
                if d > R * 1.2: continue
                # 너비가 받침만 한가(가로로 긴 타원)
                wpx = xx.max() - xx.min()
                if not (1.2 * R < wpx < 2.6 * R): continue
                if best is None or d < best[2]: best = (mx, my, d, t)
            if best: break
        if best:
            out.append([round(best[0] / W, 4), round(best[1] / H, 4)]); moved.append(round(best[2] / S * 100, 1))
        else:
            out.append([x, y]); moved.append(None)
    L['pads'] = out
    # 확인 그림
    d = ImageDraw.Draw(im, 'RGBA')
    for fpth in L['paths']: d.line([(a * W, b * H) for a, b in fpth], fill=(255, 0, 0, 200), width=5)
    for i, (a, b) in enumerate(out):
        d.ellipse((a * W - R, b * H - R * 0.66, a * W + R, b * H + R * 0.66), outline=(0, 140, 255, 255) if moved[i] is not None else (255, 60, 200, 255), width=5)
        d.text((a * W - 3, b * H - 5), str(i), fill=(255, 255, 255))
    x0, y0, x1, y1 = SAFE[ori]
    d.rectangle((x0 * W, y0 * H, x1 * W, y1 * H), outline=(255, 255, 0, 200), width=3)
    im.thumbnail((900, 900)); im.save(os.path.join(SRC, f'확인_{lid}_{ori}.jpg'), quality=80)
    print(lid, ori, '옮긴 거리(%):', moved)
json.dump(allf, open(fp, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
