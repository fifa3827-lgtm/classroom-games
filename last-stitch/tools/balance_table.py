# balance_m5.json → 인계지침용 표(마크다운). 사용: python tools/balance_table.py [json]
import json, sys, os
p = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), 'balance_m5.json')
rows = json.load(open(p, encoding='utf-8'))
ids = []; [ids.append(r['id']) for r in rows if r['id'] not in ids]
print('| 판 | 잘함 승/생명 | 잘 섞기(둘) 최고 | 보통 승/생명/별3 | 실 없이 승/생명 | 분 | 탑 하나 50% 넘게 깨는 탑 |')
print('|---|---|---|---|---|---|---|')
tot = 0
for i in ids:
    g = {r['s']: r for r in rows if r['id'] == i}
    f, c, n = g['full'], g['casual'], g['nothread']
    only = sorted([(r['win'], k[5:]) for k, r in g.items() if k.startswith('only:')], reverse=True)
    mono = ', '.join(f'{t} {w*100:.0f}%' for w, t in only if w > 0.5) or f'없음 (최고 {only[0][1]} {only[0][0]*100:.0f}%)'
    mixes = sorted([(r['win'], k[4:]) for k, r in g.items() if k.startswith('mix:')], reverse=True)
    mx = f'{mixes[0][1]} {mixes[0][0]*100:.0f}%' if mixes else '-'
    tot += f['min']
    print(f"| {i} | {f['win']*100:.0f}% / {f['lives']:.1f} | {mx} | {c['win']*100:.0f}% / {c['lives']:.1f} / {c['star3']*100:.0f}% | {n['win']*100:.0f}% / {n['lives']:.1f} | {f['min']:.1f} | {mono} |")
print(f'\n합 {tot:.1f}분 (잘함 봇이 이긴 판의 평균 걸린 시간 합)')
