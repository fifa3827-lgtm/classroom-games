# 받침+위에서 본 무기 → 메뉴용 한 장 그림(<type>_<lv>.webp). 무기는 오른쪽 위(-35도)로 돌려 얹는다.
# 사용: python compose_icons.py base.webp top.webp out.webp [top비율=0.62] [무기폭비율=0.95] [축x비율=0.15]
import sys
from PIL import Image
base = Image.open(sys.argv[1]).convert('RGBA'); top = Image.open(sys.argv[2]).convert('RGBA')
tr = float(sys.argv[4]) if len(sys.argv) > 4 else 0.62
wr = float(sys.argv[5]) if len(sys.argv) > 5 else 0.95
px = float(sys.argv[6]) if len(sys.argv) > 6 else 0.15
bw, bh = base.size
tw = int(bw * wr); th = int(top.height * tw / top.width)
top = top.resize((tw, th), Image.LANCZOS)
# 축이 가운데 오게 캔버스를 넓힌 뒤 돌림
pad = Image.new('RGBA', (tw * 2, th * 2), (0, 0, 0, 0))
ax, ay = int(px * tw), th // 2
pad.paste(top, (tw - ax, th - ay), top)
pad = pad.resize((pad.width, int(pad.height * 0.9)))   # 3/4 시점으로 살짝 눌림
rot = pad.rotate(35, resample=Image.BICUBIC, expand=False)
W, H = bw * 2, bh * 2
can = Image.new('RGBA', (W, H), (0, 0, 0, 0))
ox, oy = (W - bw) // 2, H - bh - 10
can.paste(base, (ox, oy), base)
cx, cy = ox + bw // 2, oy + int(bh * (1 - tr))
can.alpha_composite(rot, (cx - rot.width // 2, cy - rot.height // 2))
can = can.crop(can.getbbox())
can.thumbnail((360, 360), Image.LANCZOS)
can.save(sys.argv[3], quality=90, method=6)
print('OK', sys.argv[3], can.size)
