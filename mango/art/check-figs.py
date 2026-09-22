#!/usr/bin/env python3
"""재현 컷의 인물이 「잘린 선」을 드러내는지 검사한다.

인물 PNG는 대부분 아래가 잘린 흉상이다(제미나이 원본이 가슴께에서 끝난다).
컷 안에 그 그림을 통째로 넣으면 배경 위에 **직선으로 끊긴 면**이 그대로 보인다.
그래서 잘린 그림은 바닥이 컷 밖(세로 100% 아래)으로 나가야 한다.

    바닥 = y + s/2  ≥ 101   (엔진이 top:y%, height:s%, 가운데 정렬로 그린다)

아래가 안 잘린 그림(도토·모리·부엉이·밤이)은 이 규칙을 안 쓴다 — 오히려 발끝까지
보이는 게 낫다. 잘렸는지 아닌지는 PNG 마지막 줄이 채워졌는지로 가른다.

    python3 art/check-figs.py            # 모든 사건
    python3 art/check-figs.py 05         # 한 사건
"""
import sys, os, json, glob
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FLOOR = 101          # 바닥이 이보다 위면 잘린 선이 보인다
CUT_ROW = 0.15       # 마지막 줄이 이만큼 차 있으면 「아래가 잘린 그림」


def is_cut(img):
    p = os.path.join(ROOT, 'img', img)
    if not os.path.exists(p):
        return None                      # 아직 없는 그림 — 엔진이 건너뛴다
    a = np.asarray(Image.open(p).convert('RGBA'))[:, :, 3] > 120
    return bool(a[-1].mean() > CUT_ROW)


def check(path):
    d = json.load(open(path, encoding='utf8'))
    name = os.path.basename(path)
    bad = []
    for c in d.get('replay', {}).get('cuts', []):
        for g in c.get('figs', []):
            cut = is_cut(g['img'])
            if cut is None:
                continue
            bottom = g['y'] + g['s'] / 2
            if cut and bottom < FLOOR:
                bad.append('  %s  %s  y=%d s=%d → 바닥 %.0f%%  (y를 %d 으로)'
                           % (c['id'], g['img'], g['y'], g['s'], bottom,
                              round(101.5 - g['s'] / 2)))
    if bad:
        print('%s — 잘린 선이 보입니다' % name)
        print('\n'.join(bad))
    else:
        print('%s — 좋습니다' % name)
    return len(bad)


if __name__ == '__main__':
    args = sys.argv[1:]
    files = ([os.path.join(ROOT, 'data', 'case-%s.json' % a) for a in args]
             if args else sorted(glob.glob(os.path.join(ROOT, 'data', 'case-0*.json'))))
    n = sum(check(f) for f in files)
    print('\n%s' % ('모두 통과' if n == 0 else '%d곳을 고치세요' % n))
    sys.exit(1 if n else 0)
