# 단색 배경(자홍 #FF00FF 또는 초록 #00FF00) 지우기 + 가장자리 색 번짐 빼기 + 여백 자르기 + 크기 줄이기
# 사용: python chroma.py 입력.png 출력.webp [--key magenta|green] [--max 360] [--check 확인.png]
# 끝에 검사 결과를 한 줄로 찍는다: 가장자리닿음, 남은자홍픽셀
import sys, argparse
import numpy as np
from PIL import Image, ImageFilter

def key_out(rgb, key):
    r, g, b = [rgb[..., i].astype(np.float32) for i in range(3)]
    if key == 'magenta':
        # 자홍다움: R,B는 높고 G는 낮다
        spill = np.minimum(r, b) - g
        dist = np.sqrt((255 - r) ** 2 + g ** 2 + (255 - b) ** 2)
    else:
        spill = g - np.maximum(r, b)
        dist = np.sqrt(r ** 2 + (255 - g) ** 2 + b ** 2)
    # 거리로 투명도: 가까우면 0, 멀면 1
    a = np.clip((dist - 70) / 90, 0, 1)
    # 배경과 붙은 덩어리만 지운다(물체 안의 비슷한 색 보호): 가장자리에서 퍼지는 채우기
    bg = a < 0.5
    from collections import deque
    h, w = bg.shape
    seen = np.zeros_like(bg)
    dq = deque()
    for x in range(w):
        for y in (0, h - 1):
            if bg[y, x] and not seen[y, x]:
                seen[y, x] = True; dq.append((y, x))
    for y in range(h):
        for x in (0, w - 1):
            if bg[y, x] and not seen[y, x]:
                seen[y, x] = True; dq.append((y, x))
    while dq:
        y, x = dq.popleft()
        for ny, nx in ((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)):
            if 0 <= ny < h and 0 <= nx < w and bg[ny, nx] and not seen[ny, nx]:
                seen[ny, nx] = True; dq.append((ny, nx))
    # 바깥과 이어진 배경 + 그 둘레(반투명 띠)만 투명 처리. 물체 속 구멍(기둥 사이)도 배경색이면 지운다
    holes = bg & ~seen
    hole_big = holes.sum() > 0
    outside = seen | holes  # 틈(구멍)도 배경색이면 투명이어야 한다
    near = np.array(Image.fromarray((outside * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(7))) > 0
    alpha = np.where(near, a, 1.0)
    alpha[outside] = 0
    # 색 번짐 빼기: 반투명·경계 근처에서 배경색 기운 제거
    out = rgb.astype(np.float32).copy()
    sp = np.clip(spill, 0, None) * near
    if key == 'magenta':
        out[..., 0] -= sp; out[..., 2] -= sp
    else:
        out[..., 1] -= sp
    out = np.clip(out, 0, 255)
    return out.astype(np.uint8), (alpha * 255).astype(np.uint8)

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('src'); ap.add_argument('dst')
    ap.add_argument('--key', default='magenta')
    ap.add_argument('--max', type=int, default=360)
    ap.add_argument('--check')
    o = ap.parse_args()
    im = Image.open(o.src).convert('RGB')
    rgb = np.array(im)
    col, al = key_out(rgb, o.key)
    h, w = al.shape
    edge = int((al[0, :] > 20).sum() + (al[-1, :] > 20).sum() + (al[:, 0] > 20).sum() + (al[:, -1] > 20).sum())
    ys, xs = np.where(al > 10)
    y0, y1, x0, x1 = ys.min(), ys.max(), xs.min(), xs.max()
    m = int(0.03 * max(y1 - y0, x1 - x0))
    y0 = max(0, y0 - m); x0 = max(0, x0 - m); y1 = min(h - 1, y1 + m); x1 = min(w - 1, x1 + m)
    rgba = np.dstack([col, al])[y0:y1 + 1, x0:x1 + 1]
    out = Image.fromarray(rgba, 'RGBA')
    out.thumbnail((o.max, o.max), Image.LANCZOS)
    if o.dst.lower().endswith('.webp'):
        out.save(o.dst, quality=90, method=6)
    else:
        out.save(o.dst)
    # 남은 자홍(또는 초록) 기운: 불투명 픽셀 중 배경색 쪽으로 치우친 것
    a = np.array(out)
    r, g, b, aa = [a[..., i].astype(int) for i in range(4)]
    if o.key == 'magenta':
        left = int(((aa > 40) & (r > 180) & (b > 180) & (g < 90)).sum())
    else:
        left = int(((aa > 40) & (g > 180) & (r < 90) & (b < 90)).sum())
    if o.check:
        W, H = out.size
        sheet = Image.new('RGB', (W * 2 + 10, H), (255, 255, 255))
        dark = Image.new('RGB', (W, H), (30, 30, 40)); dark.paste(out, (0, 0), out)
        light = Image.new('RGB', (W, H), (235, 235, 225)); light.paste(out, (0, 0), out)
        sheet.paste(dark, (0, 0)); sheet.paste(light, (W + 10, 0))
        sheet.save(o.check)
    print(f'{o.dst}: size={out.size} edge_touch={edge} key_left={left}')

if __name__ == '__main__':
    main()
