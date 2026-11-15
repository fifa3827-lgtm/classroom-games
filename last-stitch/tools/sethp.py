# autotune 결과(JSON)를 levels.js hpMul 에 넣기. 사용: python tools/sethp.py '{"1-2":1.3,...}'  (1-1은 건너뜀)
import re, json, sys, os
v = json.loads(sys.argv[1]); p = os.path.join(os.path.dirname(__file__), '..', 'js', 'data', 'levels.js')
s = open(p, encoding='utf-8').read()
for k, x in v.items():
    if k == '1-1': continue
    s, n = re.subn(r"('%s': \{ (?:countMul: [\d.]+, )?gold: \d+, hpMul: )[\d.]+" % k, lambda m: m.group(1) + str(x), s); assert n == 1, k
open(p, 'w', encoding='utf-8').write(s); print('ok', len(v))
