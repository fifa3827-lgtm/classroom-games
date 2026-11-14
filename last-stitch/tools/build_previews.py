# 지도 화면용 중간 미리보기: assets/maps/<판>_<v|h>.webp → <판>_<v|h>_m.webp (긴 변 360)
import glob, os
from PIL import Image
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
n = 0
for f in sorted(glob.glob(os.path.join(ROOT, 'assets', 'maps', '*_[vh].webp'))):
    im = Image.open(f).convert('RGB'); im.thumbnail((360, 360), Image.LANCZOS)
    im.save(f[:-5] + '_m.webp', quality=80, method=6); n += 1
print('previews', n)
