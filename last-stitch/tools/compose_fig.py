# 지붕 없는 받침 + 서 있는 인물(앞모습 0번) → 메뉴용 한 장 그림
# 사용: python compose_fig.py base.webp fig.webp out.webp top비율 키비율 [x비율들 쉼표]
import sys
from PIL import Image
base = Image.open(sys.argv[1]).convert('RGBA'); fig = Image.open(sys.argv[2]).convert('RGBA')
tr, hr = float(sys.argv[4]), float(sys.argv[5])
xs = [float(v) for v in (sys.argv[6] if len(sys.argv) > 6 else '0').split(',')]
bw, bh = base.size
fh = int(bh * hr); fw = int(fig.width * fh / fig.height); fig = fig.resize((fw, fh), Image.LANCZOS)
W, H = bw * 2, bh * 2
can = Image.new('RGBA', (W, H), (0, 0, 0, 0))
ox, oy = (W - bw) // 2, H - bh - 10
can.paste(base, (ox, oy), base)
for x in xs:
    fx = ox + int(bw * (0.5 + x)) - fw // 2; fy = oy + int(bh * (1 - tr)) - fh
    can.alpha_composite(fig, (fx, fy))
can = can.crop(can.getbbox()); can.thumbnail((360, 360), Image.LANCZOS)
can.save(sys.argv[3], quality=90, method=6); print('OK', sys.argv[3], can.size)
