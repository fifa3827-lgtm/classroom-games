# 맵 그림에서 실제 길 중심선과 빈자리 위치를 따내 좌표를 그림에 맞춘다 (제작지시서 3-2의 4·5단계).
# 사용: python mapfit.py 판번호 방향(v|h) 그림.png 확인용.png
# 결과: layouts_fit.json 에 판/방향별로 저장 + 어긋남 보고(설계 대비 평균 % , 빈자리 찾음 여부, 길 색 겹침 %)
import sys, json, math, os
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from layout import catmull, PATH_W, PAD_R, SAFE
HERE = os.path.dirname(os.path.abspath(__file__))

def hsv(im):
    a = np.asarray(im.convert('HSV')).astype(np.float32)
    return a[..., 0] * 360 / 255, a[..., 1] / 255, a[..., 2] / 255

def path_mask(h, s, v, chapter):
    # 장마다 길 색이 다를 수 있다 → 기본은 모래색
    m = (h > 18) & (h < 45) & (s > 0.36) & (s < 0.78) & (v > 0.62)
    if chapter == 2:  # 눈길: 밝고 채도 낮을 수 있다
        m |= (v > 0.86) & (s < 0.25) & (h > 15) & (h < 50)
    im = Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.MedianFilter(5))
    return np.asarray(im) > 0

def fit(lid, ori, src, chk, chapter=1):
    data = json.load(open(os.path.join(HERE, 'layouts.json'), encoding='utf-8'))
    L = data[lid][ori]
    im = Image.open(src).convert('RGB')
    W, H = im.size
    S = min(W, H)
    h, s, v = hsv(im)
    pm = path_mask(h, s, v, chapter)
    report = {}
    fitted_paths = []
    devs = []
    for path in L['paths']:
        pts = catmull(path, step=0.004)
        P = np.array([(x * W, y * H) for x, y in pts])
        offs = []; norms = []
        search = 0.10 * S
        for i in range(len(P)):
            a = P[max(i - 2, 0)]; b = P[min(i + 2, len(P) - 1)]
            t = b - a; t /= (np.linalg.norm(t) + 1e-9)
            n = np.array([-t[1], t[0]])
            ks = np.arange(-search, search + 1, 2)
            q = P[i][None, :] + ks[:, None] * n[None, :]
            ok = (q[:, 0] >= 0) & (q[:, 0] < W) & (q[:, 1] >= 0) & (q[:, 1] < H)
            vals = np.zeros(len(ks), bool)
            qi = q[ok].astype(int)
            vals[ok] = pm[qi[:, 1], qi[:, 0]]
            # 설계점에 가장 가까운 연속 구간의 가운데
            runs = []; st = None
            for j, vv in enumerate(vals):
                if vv and st is None: st = j
                if (not vv or j == len(vals) - 1) and st is not None:
                    en = j if vv else j - 1
                    if en - st >= 6: runs.append((st, en))
                    st = None
            if runs:
                mid = min(runs, key=lambda r: abs((ks[r[0]] + ks[r[1]]) / 2))
                offs.append((ks[mid[0]] + ks[mid[1]]) / 2)
            else:
                offs.append(np.nan)
            norms.append(n)
        offs = np.array(offs)
        # 튀는 값 빼기: 넓은 창 중앙값으로 부드럽게 (성문 불빛 등 잘못 잡힌 곳 방지)
        good = ~np.isnan(offs)
        if good.any():
            offs = np.interp(np.arange(len(offs)), np.nonzero(good)[0], offs[good])
        wnd = 21
        med = np.array([np.median(offs[max(0, i - wnd):i + wnd + 1]) for i in range(len(offs))])
        devs += list(np.abs(med) / S)
        out = P + med[:, None] * np.array(norms)
        # 바깥(화면 밖) 점은 그대로 둔다. 부드럽게
        sm = out.copy()
        for _ in range(3):
            sm[1:-1] = (sm[:-2] + sm[1:-1] * 2 + sm[2:]) / 4
        # 성기게 다시 뽑기 (짧은 변 2% 간격)
        dense = [sm[0]]; acc = 0
        for i in range(1, len(sm)):
            acc += np.linalg.norm(sm[i] - sm[i - 1])
            if acc >= 0.02 * S: dense.append(sm[i]); acc = 0
        if np.linalg.norm(dense[-1] - sm[-1]) > 1: dense.append(sm[-1])
        fitted_paths.append([[round(x / W, 4), round(y / H, 4)] for x, y in dense])
    report['path_dev_pct'] = round(100 * float(np.mean(devs)) if devs else 99, 2)
    # 길 색 겹침: 설계 길 띠 안에서 길 색 비율
    band = Image.new('L', (W, H), 0); bd = ImageDraw.Draw(band)
    for fp in fitted_paths:
        bd.line([(x * W, y * H) for x, y in fp], fill=255, width=int(PATH_W * S * 0.6))
    band = np.asarray(band) > 0
    report['path_color_overlap_pct'] = round(100 * float(pm[band].mean()), 1)
    # 빈자리: 설계 위치 둘레에서 돌 색(낮은 채도·밝음) 덩어리의 가운데
    stone = (s < 0.42) & (v > 0.55) & (h < 60) & ~pm
    pads = []; missing = 0
    R = PAD_R * S
    for (x, y) in L['pads']:
        cx, cy = x * W, y * H
        r = int(R * 1.9)
        x0, x1 = int(max(0, cx - r)), int(min(W, cx + r)); y0, y1 = int(max(0, cy - r)), int(min(H, cy + r))
        sub = stone[y0:y1, x0:x1]
        yy, xx = np.nonzero(sub)
        if len(xx) < 0.6 * math.pi * R * R * 0.5:
            pads.append([x, y]); missing += 1; continue
        # 둘레 가중: 설계점 가까운 쪽 무게
        mx, my = xx.mean() + x0, yy.mean() + y0
        for _ in range(3):
            d = np.hypot(xx + x0 - mx, yy + y0 - my)
            k = d < R * 1.1
            if k.sum() < 50: break
            mx, my = xx[k].mean() + x0, yy[k].mean() + y0
        pads.append([round(mx / W, 4), round(my / H, 4)])
    report['pads_missing'] = missing
    report['pad_shift_pct'] = round(100 * float(np.mean([math.hypot((a[0] - b[0]) * W, (a[1] - b[1]) * H) / S for a, b in zip(pads, L['pads'])])), 2)
    # 성문: 설계값 그대로(그림 속 성문 아치 위치에 길 끝이 닿는지 눈으로 확인)
    gate = L['gate']
    res = {'paths': fitted_paths, 'pads': pads, 'gate': gate, 'aspect': round(W / H, 4), 'img': [W, H]}
    fp = os.path.join(HERE, 'layouts_fit.json')
    allf = json.load(open(fp, encoding='utf-8')) if os.path.exists(fp) else {}
    allf.setdefault(lid, {})[ori] = res
    json.dump(allf, open(fp, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    # 확인용 그림
    d = ImageDraw.Draw(im, 'RGBA')
    for fpth in fitted_paths:
        d.line([(x * W, y * H) for x, y in fpth], fill=(255, 0, 0, 200), width=5)
    for i, (x, y) in enumerate(pads):
        d.ellipse((x * W - R, y * H - R, x * W + R, y * H + R), outline=(0, 140, 255, 255), width=5)
        d.text((x * W - 3, y * H - 5), str(i), fill=(255, 255, 255))
    x0, y0, x1, y1 = SAFE[ori]
    d.rectangle((x0 * W, y0 * H, x1 * W, y1 * H), outline=(255, 255, 0, 200), width=3)
    im.thumbnail((900, 900)); im.save(chk, quality=80)
    print(lid, ori, json.dumps(report, ensure_ascii=False))
    return report

if __name__ == '__main__':
    lid, ori, src, chk = sys.argv[1:5]
    ch = int(lid.split('-')[0])
    fit(lid, ori, src, chk, ch)
