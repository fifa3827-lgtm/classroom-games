# layouts_fit.json → js/data/maps.js, 원본그림/맵/<판>_<v|h>.png → assets/maps/<판>_<v|h>.webp
# 사용: python build_maps.py  (디펜스게임/last-stitch/tools 에서)
import json, os
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SRC = os.path.join(os.path.dirname(ROOT), '원본그림', '맵')
fit = json.load(open(os.path.join(HERE, 'layouts_fit.json'), encoding='utf-8'))
out = {}
for lid, d in sorted(fit.items()):
    out[lid] = {}
    for ori, L in d.items():
        src = os.path.join(SRC, f'{lid}_{ori}.png')
        dst = os.path.join(ROOT, 'assets', 'maps', f'{lid}_{ori}.webp')
        im = Image.open(src).convert('RGB')
        if not os.path.exists(dst) or os.path.getmtime(dst) < os.path.getmtime(src):
            im.save(dst, quality=82, method=6)
        sm = os.path.join(ROOT, 'assets', 'maps', f'{lid}_{ori}_s.webp')
        if not os.path.exists(sm) or os.path.getmtime(sm) < os.path.getmtime(src):
            t = im.copy(); t.thumbnail((96, 96)); t.save(sm, quality=70)
        out[lid][ori] = {'img': f'assets/maps/{lid}_{ori}.webp', 'small': f'assets/maps/{lid}_{ori}_s.webp', 'aspect': im.width / im.height,
                         'paths': L['paths'], 'pads': L['pads'], 'gate': L['gate']}
js = '// 자동 생성: tools/build_maps.py — 손으로 고치지 말 것\nexport const MAPS = ' + json.dumps(out, ensure_ascii=False) + ';\n'
open(os.path.join(ROOT, 'js', 'data', 'maps.js'), 'w', encoding='utf-8').write(js)
print('maps:', ', '.join(f'{k}({"/".join(v)})' for k, v in out.items()))
