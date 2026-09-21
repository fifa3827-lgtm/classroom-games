#!/usr/bin/env python3
"""사건의 물음과 선택지를 한 줄씩 늘어놓고 읽는다.

사람이 눈으로 읽어야만 잡히는 것들이 있다 — 소거 오답이 「지울 이유」가 아니라
오히려 「그 후보라는 이유」로 쓰여 있는 경우 같은 것. 기계는 못 잡는다.
JSON을 쓰거나 고칠 때마다 이걸 돌려서 **소리 내어 한 번 읽는다.**

  python3 art/read-options.py 03
"""
import json, io, re, sys, os
case = sys.argv[1] if len(sys.argv) > 1 else '01'
here = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
D = json.load(io.open(os.path.join(here, 'data', 'case-%s.json' % case), encoding='utf-8'))
strip = lambda s: re.sub('<[^>]+>', '', s or '')

print('=== 사건 %s 「%s」 ===' % (case, D['title']))
print('''
[읽으면서 물을 것]
 · 소거: 오답이 「왜 이 후보가 아닌가」의 이유로 읽히는가?
        「~하는 게 자연스러우니까 아니다」처럼 이유와 결론이 거꾸로면 고친다.
 · 추리(빈칸): 답 낱말은 카드에서 나온 말인가? 오답 낱말은 그럴듯한가? 문장이 소리 내어 읽어 자연스러운가?
 · 추리(판): 카드를 놓을 수 있는 자리가 정말 하나뿐인가? 조건이 없는 카드는 없는가?
 · 둘 다: 「왜 아닌가」가 그 오답을 정말로 반박하는가, 딴말을 하는가?
 · 정답: 근거 단서만으로 정말 거기까지 갈 수 있는가? 비약이 없는가?
''')
print('■ 추리')
for k, st in enumerate(D.get('steps', [])):
    print('\n[%d단계 %s]  %s' % (k + 1, st['t'], strip(st['q'])))
    print('   근거로 넣을 단서: ' + ', '.join(D['clues'][i]['n'] for i in st['need']))
    if st.get('fill'):
        F = st['fill']; t = F['t']
        for k, b in enumerate(F['blanks']):
            t = t.replace('[%d]' % k, '[' + b['ok'] + ('' if not b.get('infer') else '*') + ']')
        print('   빈칸 문장: ' + t + '   (* = 추론으로 나오는 말)')
        for x in F.get('extra', []):
            print('   ✗ ' + x['w'] + '  → ' + strip(x['why']))
    elif st.get('board'):
        B = st['board']
        print('   판: %s %s~%s  일출 %s' % (B['kind'], B['from'], B['to'], B.get('sunrise', '-')))
        for e in B['events']:
            print('   · %s %s' % (e['t'], ('고정 ' + e['fix']) if e.get('fix') else ('조건 ' + ('after ' + e['after'] if e.get('after') else '') + ('before ' + e['before'] if e.get('before') else ''))))
            if e.get('why'):
                print('      → ' + strip(e['why']))
        print('   안내: ' + strip(B.get('ask', '')))
    for i, o in enumerate(st.get('opts', [])):
        print('  %d) %s%s' % (i + 1, strip(o['t']), '   ← 정답' if o.get('ok') else ''))
        if o.get('why'):
            print('      → ' + strip(o['why']))

print('\n\n■ 소거 (지울 이유를 고르는 자리다)')
for e in D.get('elim', []):
    print('\n[%s]  %s' % (e['name'], strip(e['q'])))
    for i, o in enumerate(e['opts']):
        print('  %d) %s%s' % (i + 1, strip(o['t']), '   ← 정답' if o.get('ok') else ''))
        if o.get('why'):
            print('      → ' + strip(o['why']))

print('\n\n■ 지목')
for a in D.get('accuse', []):
    print('  · %s%s' % (strip(a['t']), '   ← 정답' if a.get('ok') else ''))
