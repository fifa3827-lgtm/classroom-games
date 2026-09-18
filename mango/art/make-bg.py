#!/usr/bin/env python3
"""
제미나이에서 받은 배경 그림을 게임 규격(가로 2:1)으로 맞춘다.

    python3 art/make-bg.py <받은그림> <나갈이름>

    예) python3 art/make-bg.py ~/Downloads/scene.png scene-01-cafeteria

하는 일
  1) 가운데를 기준으로 2:1 로 자른다. 제미나이는 1408x768(약 1.83:1)을 주므로
     위아래가 조금 잘린다 — 중요한 것을 화면 맨 위나 맨 아래에 두지 않는 이유다.
  2) 1440x720 으로 줄인다 (ART-4 규격, 게임은 720x360 으로 그린다).
     원본이 그보다 작으면 키우지 않는다 — 없는 선명함이 생기지는 않는다.
  3) WebP 로 저장한다. 200KB 이하가 될 때까지 품질을 낮춘다 (PRD 성능 요건).
     배경은 붓자국 회화라 품질을 낮춰도 눈에 잘 띄지 않는다.

확인할 것: 자르고 나서도 단서가 다 보이는지. 잘려 나갔으면 다시 뽑는다.
필요한 것: pillow
"""
import sys, os
from PIL import Image

W, H = 1440, 720
MAX_KB = 200


def main():
    if len(sys.argv) < 3:
        sys.exit(__doc__)
    src, name = sys.argv[1], sys.argv[2]
    im = Image.open(src).convert('RGB')

    # 가운데를 기준으로 2:1 자르기
    want = W / H
    have = im.width / im.height
    if have > want:                      # 너무 넓다 → 좌우를 자른다
        w = round(im.height * want)
        x = (im.width - w) // 2
        box = (x, 0, x + w, im.height)
    else:                                # 너무 높다 → 위아래를 자른다
        h = round(im.width / want)
        y = (im.height - h) // 2
        box = (0, y, im.width, y + h)
    cut = im.crop(box)
    print('원본 %dx%d → 2:1 로 %s 잘라냄 (%dx%d)'
          % (im.width, im.height,
             '좌우' if have > want else '위아래',
             cut.width, cut.height))
    if have <= want:
        print('  위아래에서 각 %dpx 가 잘렸습니다 — 그 자리에 단서가 없었는지 보세요.'
              % ((im.height - cut.height) // 2))

    # 원본보다 키우지 않는다 — 없는 선명함이 생기지는 않고 용량만 커진다.
    w = min(W, cut.width)
    h = round(w / (W / H))
    if w < W:
        print('  원본이 작아 %dx%d 로 둡니다 (게임은 720x360 으로 그립니다).' % (w, h))
    out = cut.resize((w, h), Image.LANCZOS)

    os.makedirs('img', exist_ok=True)
    path = 'img/%s.webp' % name
    for q in (88, 82, 76, 70, 64, 58, 52):
        out.save(path, 'WEBP', quality=q, method=6)
        kb = os.path.getsize(path) // 1024
        if kb <= MAX_KB:
            print('%s · 품질 %d · %dKB' % (path, q, kb))
            break
    else:
        print('%s · 품질 52 · %dKB (목표 %dKB를 넘습니다)' % (path, kb, MAX_KB))
    print('다음: art/spots.html 로 조사 지점 좌표를 이 그림에 맞춰 다시 찍으세요.')


if __name__ == '__main__':
    main()
