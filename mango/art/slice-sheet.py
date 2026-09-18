#!/usr/bin/env python3
"""
제미나이에서 받은 「한 장에 여러 표정」 그림을 게임용 파일로 자른다.

    python3 art/slice-sheet.py <받은그림> <인물이름> [표정순서]

    예) python3 art/slice-sheet.py ~/Downloads/mango.png mango def,sp,fl,joy
        python3 art/slice-sheet.py ~/Downloads/kongi.png kongi def,sp,fl,sulk

하는 일
  1) 크림색 배경을 지운다 — 테두리에서 이어진 부분만 따라가므로, 배경과 색이
     거의 같은 몸통 안쪽 흰 털은 지켜진다. 갇힌 배경 주머니도 지운다.
  2) 칸을 스스로 찾는다 (2x2 / 1x4 / 4x1 자동 판별).
  3) 두 눈의 위치와 간격으로 칸끼리 정렬한다 — 이게 안 맞으면 게임에서
     표정이 바뀔 때 얼굴이 툭 튄다.
  4) img/ 에 <이름>-<표정>.png (버스트)와 <이름>-face-<표정>.png (머리만)를 쓴다.
     납작한 셀 채색이라 96색으로 줄여도 눈에는 그대로이고 용량은 절반이 된다.

눈을 감은 표정(기쁨 등)은 눈을 못 찾으므로 기준 칸의 위치를 그대로 쓴다.
필요한 것: pillow, numpy, scipy
"""
import sys, os, collections
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

BG_TOL      = 18      # 배경색으로 볼 색 차이
POCKET_MAX  = 8000    # 이보다 작은 「갇힌 배경」은 지운다 (몸통 안쪽 흰색은 이보다 크다)
MIN_FIGURE  = 20000   # 칸 하나로 볼 최소 크기
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


def find_cells(im):
    """칸마다 (x0,y0,x1,y1). 떠 있는 「!」 같은 조각도 가까운 칸에 붙인다."""
    al = np.asarray(im.getchannel('A')) > 120
    lab, n = ndimage.label(al)
    sz = ndimage.sum(al, lab, range(1, n + 1))
    figs, bits = [], []
    for i in range(1, n + 1):
        ys, xs = np.nonzero(lab == i)
        box = [int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1]
        (figs if sz[i - 1] >= MIN_FIGURE else bits).append(box)
    if not figs:
        sys.exit('칸을 찾지 못했습니다. 배경이 단색인지, 인물이 잘리지 않았는지 확인하세요.')
    # 중심으로 행·열을 나눈다
    cen = [((b[0] + b[2]) / 2, (b[1] + b[3]) / 2) for b in figs]
    H = im.height
    rows = 2 if (max(c[1] for c in cen) - min(c[1] for c in cen)) > H * 0.25 else 1
    order = sorted(range(len(figs)),
                   key=lambda i: (round(cen[i][1] / (H / rows)) if rows > 1 else 0, cen[i][0]))
    cells = [figs[i] for i in order]
    # 작은 조각을 중심이 가장 가까운 칸에 합친다
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


def eyes(im):
    a = np.asarray(im).astype(int)
    r, g, b, al = a[..., 0], a[..., 1], a[..., 2], a[..., 3]
    m = (al > 200) & (g > 150) & (g < 235) & (g - b > 45) & (r > 140) & (abs(r - g) < 70)
    lab, n = ndimage.label(m)
    if n == 0:
        return None
    sz = ndimage.sum(m, lab, range(1, n + 1))
    idx = [i + 1 for i in np.argsort(sz)[::-1] if sz[i] > 200][:2]
    if len(idx) < 2:
        return None
    c = [ndimage.center_of_mass(m, lab, i) for i in idx]
    p = sorted([(x[1], x[0]) for x in c])
    if abs(p[0][1] - p[1][1]) > im.height * 0.08:   # 두 눈 높이가 크게 다르면 눈이 아니다
        return None
    return p


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
    cells = find_cells(sheet)
    print('칸 %d개를 찾았습니다.' % len(cells))
    if len(cells) != len(order):
        print('⚠ 표정 이름은 %d개인데 칸은 %d개입니다. 세 번째 인자로 순서를 맞춰 주세요.'
              % (len(order), len(cells)))
        order = (order + ['x%d' % i for i in range(9)])[:len(cells)]

    pads = [sheet.crop((max(0, c[0] - 8), max(0, c[1] - 8),
                        min(sheet.width, c[2] + 8), min(sheet.height, c[3] + 8))) for c in cells]

    # 기준 칸: 눈이 보이는 첫 칸
    ref_i = next((i for i, p in enumerate(pads) if eyes(p)), None)
    if ref_i is None:
        sys.exit('눈을 찾을 수 없습니다. 눈을 뜬 표정이 한 칸은 있어야 정렬할 수 있습니다.')
    W = max(p.width for p in pads) + 80
    H = max(p.height for p in pads) + 80
    re = eyes(pads[ref_i])
    D = re[1][0] - re[0][0]
    cx, cy = W / 2, H * 0.42
    print('기준 칸: %s (눈 간격 %.0f)' % (order[ref_i], D))

    def place(p):
        c = Image.new('RGBA', (W, H), (0, 0, 0, 0))
        c.paste(p, ((W - p.width) // 2, (H - p.height) // 2))
        return c

    # 기준 칸을 먼저 정렬해 둔다 (눈 감은 칸이 이걸 보고 머리를 맞춘다)
    rc = place(pads[ref_i])
    e0 = eyes(rc)
    mid0 = ((e0[0][0] + e0[1][0]) / 2, (e0[0][1] + e0[1][1]) / 2)
    ref_canvas = rc.transform((W, H), Image.AFFINE,
                              (1, 0, mid0[0] - cx, 0, 1, mid0[1] - cy), resample=Image.BICUBIC)

    norm = []
    for i, p in enumerate(pads):
        canvas = place(p)
        e = eyes(canvas)
        if e:
            d = e[1][0] - e[0][0]
            s = D / d
            mid = ((e[0][0] + e[1][0]) / 2, (e[0][1] + e[1][1]) / 2)
            print('  %-5s 배율 %.3f  이동 (%+.0f,%+.0f)' % (order[i], s, cx - mid[0], cy - mid[1]))
        else:
            # 눈을 감은 표정(기쁨 등)은 머리 윤곽으로 맞춘다
            hr, rr = head_raw(canvas), head_raw(ref_canvas)
            if hr and rr:
                s = ((rr[2] - rr[0]) / (hr[2] - hr[0]) + (rr[3] - rr[1]) / (hr[3] - hr[1])) / 2
                mid = ((hr[0] + hr[2]) / 2, (hr[1] + hr[3]) / 2)
                rmid = ((rr[0] + rr[2]) / 2, (rr[1] + rr[3]) / 2)
                print('  %-5s 눈 감김 — 머리 윤곽으로 맞춤 (배율 %.3f)' % (order[i], s))
                norm.append(canvas.transform((W, H), Image.AFFINE,
                            (1 / s, 0, mid[0] - rmid[0] / s, 0, 1 / s, mid[1] - rmid[1] / s),
                            resample=Image.BICUBIC))
                continue
            s, mid = 1.0, (cx, cy)
            print('  %-5s 눈 감김 — 머리도 못 찾아 기준 위치를 그대로 씁니다' % order[i])
        norm.append(canvas.transform((W, H), Image.AFFINE,
                                     (1 / s, 0, mid[0] - cx / s, 0, 1 / s, mid[1] - cy / s),
                                     resample=Image.BICUBIC))

    os.makedirs('img', exist_ok=True)
    # 버스트: 좌우·위는 합집합, 아래는 가장 얕게 잘린 높이 (잘린 빈칸이 안 보이게)
    L = T = 10 ** 9; R = 0; B = 10 ** 9
    for n_ in norm:
        bb = n_.getchannel('A').point(lambda v: 255 if v > 40 else 0).getbbox()
        L, T, R, B = min(L, bb[0]), min(T, bb[1]), max(R, bb[2]), min(B, bb[3])
    bust = (max(0, L - 12), max(0, T - 12), min(W, R + 12), B)
    hb = head_box(norm[ref_i])

    total = 0
    for i, n_ in enumerate(norm):
        total += save(n_.crop(bust), 'img/%s-%s.png' % (name, order[i]), BUST_W)
        if hb:
            total += save(n_.crop(hb), 'img/%s-face-%s.png' % (name, order[i]), FACE_W)
    print('img/ 에 %d개 파일, 합계 %d KB' % (len(norm) * (2 if hb else 1), total // 1024))
    print('확인: 표정이 바뀔 때 얼굴이 튀지 않는지 게임에서 직접 넘겨 보세요.')


if __name__ == '__main__':
    main()
