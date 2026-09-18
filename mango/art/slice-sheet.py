#!/usr/bin/env python3
"""
제미나이에서 받은 「한 장에 여러 표정」 그림을 게임용 파일로 자른다.

    python3 art/slice-sheet.py <받은그림> <인물이름> [표정순서]

    예) python3 art/slice-sheet.py ~/Downloads/mango.png mango def,sp,fl,joy
        python3 art/slice-sheet.py ~/Downloads/kongi.png kongi def,sp,fl,sulk

하는 일
  1) 크림색 배경을 지운다 — 테두리에서 이어진 부분만 따라가므로, 배경과 색이
     거의 같은 몸통 안쪽 흰 털은 지켜진다. 갇힌 배경 주머니도 지운다.
  2) 칸을 스스로 찾는다. 칸이 떨어져 있으면 덩어리로, 서로 붙어 있으면
     머리를 찾아 그 사이를 자른다.
  3) 칸끼리 정렬한다 — 머리 크기로 배율을 맞춘 뒤, 윤곽을 겹쳐 보며 위치를
     다듬는다. 인물마다 눈 색이 다르고 눈을 감은 표정도 있어서, 눈에
     의존하지 않는다. 이게 안 맞으면 게임에서 표정이 바뀔 때 얼굴이 툭 튄다.
  4) img/ 에 <이름>-<표정>.png (초상)과 <이름>-face-<표정>.png (머리만)를 쓴다.
     납작한 셀 채색이라 96색으로 줄여도 눈에는 그대로이고 용량은 절반이 된다.

★ 시트를 주문할 때 칸 사이를 띄워 달라고 하세요. 인물이 붙어 있으면 자르는 선이
  팔·꼬리를 지나가 조각이 테두리에 남고, 초상을 머리·목까지만 잡아야 합니다.
필요한 것: pillow, numpy, scipy
"""
import sys, os, collections
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

BG_TOL      = 18      # 배경색으로 볼 색 차이
POCKET_MAX  = 8000    # 이보다 작은 「갇힌 배경」은 지운다 (몸통 안쪽 흰색은 이보다 크다)
MIN_FIGURE  = 20000   # 칸 하나로 볼 최소 크기
SPECKLE     = 300     # 이보다 작은 조각은 잡티로 보고 버린다
MARK_MIN    = 40      # 땀방울·「!」로 볼 최소 크기 (이하는 계단 자국)
BUST_W      = 300
FACE_W      = 112
COLORS      = 96


def cut_background(im):
    a = np.asarray(im.convert('RGB')).astype(int)
    h, w, _ = a.shape
    bg = np.median(np.concatenate([a[0], a[-1], a[:, 0], a[:, -1]]), axis=0)
    close = np.abs(a - bg).max(axis=2) <= BG_TOL
    lab, n = ndimage.label(close)
    sz = ndimage.sum(close, lab, range(1, n + 1))
    border = set(lab[0].tolist()) | set(lab[-1].tolist()) | set(lab[:, 0].tolist()) | set(lab[:, -1].tolist())
    kill = np.zeros(n + 1, bool)
    for i in range(1, n + 1):
        kill[i] = (i in border) or (sz[i - 1] <= POCKET_MAX)
    kill[0] = False
    alpha = np.where(kill[lab], 0, 255).astype(np.uint8)
    out = im.convert('RGBA')
    out.putalpha(Image.fromarray(alpha).filter(ImageFilter.GaussianBlur(0.6)))
    return out


def head_centers(al, box):
    """머리 중심을 찾는다. 몸이 서로 붙어 있어도 머리는 침식하면 떨어진다."""
    y0, y1, x0, x1 = box
    er = ndimage.binary_erosion(al, np.ones((17, 17)))
    top = er[y0:y0 + int((y1 - y0) * 0.55), x0:x1]
    lab, n = ndimage.label(top)
    if n == 0:
        return []
    sz = ndimage.sum(top, lab, range(1, n + 1))
    keep = [i + 1 for i in range(n) if sz[i] > max(2000, sz.max() * 0.25)]
    cs = [ndimage.center_of_mass(top, lab, i) for i in keep]
    return sorted([(c[1] + x0, c[0] + y0) for c in cs])


TOUCHING = False


def find_cells(im, want=None):
    """칸마다 (x0,y0,x1,y1).

    칸이 서로 떨어져 있으면 덩어리로 나누고, 붙어 있으면 머리 중심 사이를
    잘라 나눈다 — 제미나이가 인물을 붙여 그리는 일이 흔하다."""
    al = np.asarray(im.getchannel('A')) > 120
    lab, n = ndimage.label(al)
    sz = ndimage.sum(al, lab, range(1, n + 1))
    figs, bits = [], []
    for i in range(1, n + 1):
        ys, xs = np.nonzero(lab == i)
        box = [int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1]
        if sz[i - 1] >= MIN_FIGURE:
            figs.append(box)
        elif sz[i - 1] >= SPECKLE:
            bits.append(box)        # 땀방울·「!」처럼 뜻이 있는 조각
        # SPECKLE 미만은 배경 테두리의 잡티다 — 칸에 합치면 칸이 옆으로 부풀어
        # 옆 인물을 끌어들인다. 그냥 버린다.
    if not figs:
        sys.exit('칸을 찾지 못했습니다. 배경이 단색인지, 인물이 잘리지 않았는지 확인하세요.')

    # 덩어리 수가 원하는 칸 수와 맞지 않으면 머리로 나눈다
    if want and len(figs) != want:
        L = min(b[0] for b in figs); T = min(b[1] for b in figs)
        R = max(b[2] for b in figs); B = max(b[3] for b in figs)
        cen = head_centers(al, (T, B, L, R))
        if len(cen) == want:
            rows = 1
            if want > 2 and (max(c[1] for c in cen) - min(c[1] for c in cen)) > (B - T) * 0.25:
                rows = 2
            print('칸이 서로 붙어 있어서 머리 %d개를 찾아 나눴습니다.' % len(cen))
            globals()['TOUCHING'] = True
            if rows == 1:
                xs = [c[0] for c in cen]
                cuts = [L] + [int((xs[i] + xs[i + 1]) / 2) for i in range(len(xs) - 1)] + [R]
                return [[cuts[i], T, cuts[i + 1], B] for i in range(len(xs))]
            mid = (min(c[1] for c in cen) + max(c[1] for c in cen)) / 2
            out = []
            for half, sel in ((0, [c for c in cen if c[1] <= mid]), (1, [c for c in cen if c[1] > mid])):
                sel = sorted(sel)
                xs = [c[0] for c in sel]
                cuts = [L] + [int((xs[i] + xs[i + 1]) / 2) for i in range(len(xs) - 1)] + [R]
                yA, yB = (T, int((T + B) / 2)) if half == 0 else (int((T + B) / 2), B)
                out += [[cuts[i], yA, cuts[i + 1], yB] for i in range(len(xs))]
            return out
        print('⚠ 덩어리 %d개, 머리 %d개 — 원하는 %d칸과 달라 덩어리 그대로 씁니다.'
              % (len(figs), len(cen), want))

    cen = [((b[0] + b[2]) / 2, (b[1] + b[3]) / 2) for b in figs]
    H = im.height
    rows = 2 if (max(c[1] for c in cen) - min(c[1] for c in cen)) > H * 0.25 else 1
    order = sorted(range(len(figs)),
                   key=lambda i: (round(cen[i][1] / (H / rows)) if rows > 1 else 0, cen[i][0]))
    cells = [figs[i] for i in order]
    for b in bits:
        c = ((b[0] + b[2]) / 2, (b[1] + b[3]) / 2)
        j = min(range(len(cells)), key=lambda k: abs((cells[k][0] + cells[k][2]) / 2 - c[0])
                                                 + abs((cells[k][1] + cells[k][3]) / 2 - c[1]) * 0.4)
        cells[j] = [min(cells[j][0], b[0]), min(cells[j][1], b[1]),
                    max(cells[j][2], b[2]), max(cells[j][3], b[3])]
    if bits:
        print('떠 있는 작은 조각 %d개를 가까운 칸에 함께 넣었습니다.' % len(bits))
        print('  「!」나 땀방울이면 그대로 두면 되고, 머리 위 모자 꼭지라면 알려 주세요.')
    return cells


def head_raw(im):
    """수염을 침식으로 걷어내고 머리 크기를 실측한다 (여백 없음)."""
    al = np.asarray(im.getchannel('A')) > 120
    er = ndimage.binary_erosion(al, np.ones((9, 9)))
    half = int(im.height * 0.62)
    top = er[:half]
    lab, n = ndimage.label(top)
    if n == 0:
        return None
    sz = ndimage.sum(top, lab, range(1, n + 1))
    i = int(np.argmax(sz)) + 1
    ys, xs = np.nonzero(lab == i)
    return (int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max()))


def head_box(im):
    """얼굴 그림을 자를 네모 (귀가 잘리지 않게 여백을 둔다)."""
    r = head_raw(im)
    if r is None:
        return None
    return (r[0] - 14, r[1] - 18, r[2] + 14, r[3] + 6)


def eyes(im):
    """두 눈의 (x,y)를 찾는다. 인물마다 눈 색이 다르므로 두 가지로 시도한다.
       ① 연두빛 눈(망고)  ② 흰자가 보이는 눈(너구리·다람쥐 등)
       못 찾으면 None — 부르는 쪽이 머리 윤곽으로 맞춘다."""
    a = np.asarray(im).astype(int)
    r, g, b, al = a[..., 0], a[..., 1], a[..., 2], a[..., 3]
    H = a.shape[0]
    hb = head_raw(im)
    if hb is None:
        return None
    # 머리 안쪽만 본다 — 크림색 셔츠나 배경을 눈으로 오인하지 않도록
    band = np.zeros(al.shape, bool)
    band[max(0, hb[1]):hb[3], max(0, hb[0]):hb[2]] = True
    hw = max(1, hb[2] - hb[0])
    cap = (hw * 0.22) ** 2                            # 눈 하나가 이보다 크면 눈이 아니다
    cands = [
        (al > 200) & (g > 150) & (g < 235) & (g - b > 45) & (r > 140) & (abs(r - g) < 70),
        (al > 200) & (r > 225) & (g > 225) & (b > 215),   # 흰자
    ]
    for m in cands:
        m = m & band
        lab, n = ndimage.label(m)
        if n < 2:
            continue
        sz = ndimage.sum(m, lab, range(1, n + 1))
        idx = [i + 1 for i in np.argsort(sz)[::-1] if 150 < sz[i] < cap][:2]
        if len(idx) < 2:
            continue
        c = [ndimage.center_of_mass(m, lab, i) for i in idx]
        p = sorted([(x[1], x[0]) for x in c])
        if abs(p[0][1] - p[1][1]) > H * 0.08:          # 높이가 크게 다르면 눈이 아니다
            continue
        if abs(p[1][0] - p[0][0]) < a.shape[1] * 0.06:  # 너무 붙어 있으면 한쪽 눈이다
            continue
        return p
    return None


def isolate(im):
    """칸을 나눈 자리에 붙어 온 옆 인물의 조각을 떼어낸다.
       가장 큰 덩어리(이 인물)와, 그에 비해 아주 작은 조각(땀방울·「!」)만 남긴다."""
    a = np.array(im)
    al = a[..., 3] > 120
    lab, n = ndimage.label(al)
    if n <= 1:
        return im
    sz = ndimage.sum(al, lab, range(1, n + 1))
    main = int(np.argmax(sz)) + 1
    keep = np.zeros(n + 1, bool)
    keep[main] = True
    # 머리 아래에서 떨어져 있는 조각은 옆 인물의 팔·꼬리다. 머리 옆·위의 작은 것만 남긴다
    ys, xs = np.nonzero(lab == main)
    head_bottom = ys.min() + (ys.max() - ys.min()) * 0.55
    W = a.shape[1]
    # 옆 칸에서 잘려 온 귀·꼬리는 작고 높이도 비슷해서 땀방울로 오인된다.
    # 가르는 기준은 「잘린 면에 붙어 있는가」다 — 땀방울이나 「!」는 인물 옆에
    # 떠 있을 뿐 칸 테두리에 닿지 않는다. 옆 인물의 조각은 반드시 닿는다.
    boxes = ndimage.find_objects(lab)
    for i in range(1, n + 1):
        if i == main:
            continue
        if sz[i - 1] < MARK_MIN:
            continue                # 1~2픽셀짜리 계단 자국
        sl = boxes[i - 1]
        if sl is None:
            continue
        if sl[1].start <= 2 or sl[1].stop >= W - 2:
            continue                # 잘린 면에 붙어 있다 = 옆 인물
        cy = ndimage.center_of_mass(al, lab, i)[0]
        if cy < head_bottom and sz[i - 1] < sz[main - 1] * 0.06:
            keep[i] = True          # 땀방울·「!」 같은 표시는 남긴다
    dropped = int(n - keep.sum())
    if dropped:
        a[~keep[lab]] = 0
        print('  옆 칸에서 넘어온 조각 %d개를 떼어냈습니다.' % dropped)
    return Image.fromarray(a)


def nudge(ref, m, cy, span=34):
    """머리 띠에서 두 윤곽이 가장 많이 겹치는 이동량을 찾는다.
       인물마다 눈 색이 달라도 되고, 눈을 감고 있어도 된다."""
    band = slice(max(0, int(cy * 0.15)), int(cy * 1.75))
    a = ref[band].astype(np.int8)
    b = m[band].astype(np.int8)
    tot = max(1, a.sum())
    best = (0, 0, np.abs(a - b).sum() / tot)
    for step in (4, 1):
        by, bx = best[0], best[1]
        for dy in range(by - span, by + span + 1, step):
            for dx in range(bx - span, bx + span + 1, step):
                d = np.abs(a - np.roll(np.roll(b, dy, 0), dx, 1)).sum() / tot
                if d < best[2]:
                    best = (dy, dx, d)
        span = step * 2
    return best


def save(im, path, w):
    im = im.resize((w, max(1, round(w * im.height / im.width))), Image.LANCZOS)
    rgb = im.convert('RGB').quantize(colors=COLORS, method=Image.MEDIANCUT,
                                     dither=Image.NONE).convert('RGB')
    out = rgb.convert('RGBA')
    out.putalpha(im.getchannel('A'))
    out.save(path, optimize=True)
    return os.path.getsize(path)


def main():
    if len(sys.argv) < 3:
        sys.exit(__doc__)
    src, name = sys.argv[1], sys.argv[2]
    order = (sys.argv[3] if len(sys.argv) > 3 else 'def,sp,fl,joy').split(',')

    sheet = cut_background(Image.open(src))
    cells = find_cells(sheet, len(order))
    touching = TOUCHING
    print('칸 %d개를 찾았습니다.' % len(cells))
    if len(cells) != len(order):
        print('⚠ 표정 이름은 %d개인데 칸은 %d개입니다. 세 번째 인자로 순서를 맞춰 주세요.'
              % (len(order), len(cells)))
        order = (order + ['x%d' % i for i in range(9)])[:len(cells)]

    padx = 0 if touching else 8      # 붙어 있었으면 자른 선 밖은 옆 인물이므로 여백 없이
    pads = [isolate(sheet.crop((max(0, c[0] - padx), max(0, c[1] - 8),
                               min(sheet.width, c[2] + padx), min(sheet.height, c[3] + 8))))
            for c in cells]

    ref_i = 0
    W = max(p.width for p in pads) + 80
    H = max(p.height for p in pads) + 80
    cx, cy = W / 2, H * 0.42
    print('기준 칸: %s' % order[ref_i])

    def place(p):
        c = Image.new('RGBA', (W, H), (0, 0, 0, 0))
        c.paste(p, ((W - p.width) // 2, (H - p.height) // 2))
        return c

    # 머리는 원본 칸에서 한 번만 잰다 (옮긴 뒤 다시 재면 오차가 생긴다)
    heads = [head_raw(p) for p in pads]
    if heads[ref_i] is None:
        sys.exit('머리를 찾지 못했습니다. 인물이 배경에서 잘 분리됐는지 확인하세요.')
    rh = heads[ref_i]
    rw, rhh = rh[2] - rh[0], rh[3] - rh[1]

    norm = []
    for i, p in enumerate(pads):
        canvas = place(p)
        ox, oy = (W - p.width) // 2, (H - p.height) // 2
        h = heads[i]
        if h is None:
            print('  %-5s 머리를 못 찾아 그대로 둡니다' % order[i]); norm.append(canvas); continue
        sc = ((rw / (h[2] - h[0])) + (rhh / (h[3] - h[1]))) / 2
        mid = ((h[0] + h[2]) / 2 + ox, (h[1] + h[3]) / 2 + oy)
        out = canvas.transform((W, H), Image.AFFINE,
                    (1 / sc, 0, mid[0] - cx / sc, 0, 1 / sc, mid[1] - cy / sc),
                    resample=Image.BICUBIC)
        note = '배율 %.3f' % sc
        if i == ref_i:
            ref_mask = np.asarray(out.getchannel('A')) > 120
        else:
            # 머리 네모 중심은 귀 모양에 따라 흔들린다. 윤곽을 직접 겹쳐 보며 다듬는다.
            dy, dx, best = nudge(ref_mask, np.asarray(out.getchannel('A')) > 120, cy)
            if dx or dy:
                out = out.transform((W, H), Image.AFFINE, (1, 0, -dx, 0, 1, -dy),
                                    resample=Image.BICUBIC)
            note += ' · 윤곽 맞춤 (%+d,%+d) → 어긋남 %.1f%%' % (dx, dy, best * 100)
        print('  %-5s 머리 %dx%d · %s' % (order[i], h[2] - h[0], h[3] - h[1], note))
        norm.append(out)

    os.makedirs('img', exist_ok=True)
    # 버스트: 좌우·위는 합집합, 아래는 가장 얕게 잘린 높이 (잘린 빈칸이 안 보이게)
    L = T = 10 ** 9; R = 0; B = 10 ** 9
    for n_ in norm:
        bb = n_.getchannel('A').point(lambda v: 255 if v > 40 else 0).getbbox()
        L, T, R, B = min(L, bb[0]), min(T, bb[1]), max(R, bb[2]), min(B, bb[3])
    bust = (max(0, L - 12), max(0, T - 12), min(W, R + 12), B)
    hb = head_box(norm[ref_i])
    # 칸이 서로 붙어 있었으면 버스트 테두리에 옆 인물 조각이 남는다.
    # 그럴 때는 머리와 가슴까지만 잡아 깨끗한 초상으로 만든다.
    if touching and hb:
        # 칸이 붙어 있으면 팔·꼬리가 칸 선에 잘려 테두리에 조각으로 남는다.
        # 그럴 때는 머리와 목까지만 잡는다 — 심문 화면에는 얼굴 클로즈업이 더 낫다.
        hh = hb[3] - hb[1]
        bust = (max(0, hb[0]), max(0, hb[1]), min(W, hb[2]), min(H, int(hb[3] + hh * 0.30)))
        print('칸이 붙어 있었으므로 초상을 머리·목까지만 잘랐습니다(테두리 조각 방지).')

    total = 0
    for i, n_ in enumerate(norm):
        total += save(n_.crop(bust), 'img/%s-%s.png' % (name, order[i]), BUST_W)
        if hb:
            total += save(n_.crop(hb), 'img/%s-face-%s.png' % (name, order[i]), FACE_W)
    print('img/ 에 %d개 파일, 합계 %d KB' % (len(norm) * (2 if hb else 1), total // 1024))
    print('확인: 표정이 바뀔 때 얼굴이 튀지 않는지 게임에서 직접 넘겨 보세요.')


if __name__ == '__main__':
    main()
