// 딸깍 공방 — 월드·판·부품·이야기 자료
const DATA = (() => {
  // ---------- 판 모양 (가로 7칸) ----------
  const LAY = {
    plain:   ['.......', '.......', '.......', '.......', '.......', '.......', '.......'],
    space:   ['.......', '.......', '.......', '.......', '.......', '.......', '._____.'],
    enter:   ['.......', '.......', '.......', '.....NN', '.......', '.......', '._____.'],
    escplain:['E......', '.......', '.......', '.......', '.......', '.......', '._____.'],
    type:    [' ..... ', '.......', '.......', 'SS.....', '.......', '.......', ' _____ '],
    type2:   ['E......', '.......', '.....SS', '.......', 'SS.....', '.......', ' _____ '],
    tkl0:    ['E......', '.......', '.......', '.......', 'SS.....', '.......', '._____.'],
    tkl:     ['E....BB', '.......', '.......', '.......', 'SS.....', '.......', '._____.'],
    tkl2:    ['E....BB', '.......', '.....NN', '.......', 'SS.....', '.......', '._____.'],
    cup:     ['E...BB.', '.......', '.......', '.....NN', '.......', ' ..... ', '  ...  '],
    cup2:    ['E.....B', '.......', 'SS.....', '.......', '.....NN', ' ..... ', ' ..... '],
    wasd0:   ['E......', '.......', '.......', 'SS.....', '.......', '.......', '._____.'],
    wasd:    ['E......', 'T......', '.......', 'SS.....', '.......', '.......', '._____.'],
    wasd2:   ['E....BB', 'T......', '.......', '.....NN', 'SS.....', '.......', '._____.'],
    split:   ['...E...', '... ...', '... ...', 'SS. .NN', '... ...', '... ...', '___ ___'],
    split2:  ['T..E..B', '... ...', '... ...', '... ...', 'SS. .NN', '... ...', '___.___'],
    full:    ['E.....B', 'T......', '.......', '.....NN', 'SS.....', '.......', '.......', '._____.'],
  };

  // ---------- 부품 ----------
  // 스위치: 소리의 종류 (set = 녹음 묶음)
  const SWITCH = {
    brown:     { name:'갈축', desc:'톡톡 또각, 기본 손맛', set:'tactile', rate:1, lp:0, gain:1.45, pk:[1300, 5, 1.2] },
    red:       { name:'적축', desc:'부드럽고 조용한 서걱', set:'linear', rate:1, lp:3600, gain:.98, pk:[420, 4, .9], fb:{ set:'tactile', rate:1.08, lp:3200, gain:.7 } },
    blue:      { name:'청축', desc:'경쾌한 찰칵찰칵', set:'clicky', rate:1, lp:0, gain:.7, pk:[5200, 5, 1.3] },
    typewriter:{ name:'타자기', desc:'옛날 타자기의 철컥', set:'typewriter', relSet:'clicky', relRate:.8, relGain:.5, rate:1, lp:0, gain:1.4, fb:{ set:'clicky', rate:.82, lp:2600, gain:1.1 } },
    laptop:    { name:'노트북', desc:'얇고 가벼운 톡', set:'laptop', rate:1, lp:0, gain:1.08, fb:{ set:'tactile', rate:1.3, lp:4000, gain:.6 } },
    thock:     { name:'도각축', desc:'묵직하게 도각도각', set:'linear', rate:.84, lp:1900, gain:1.23, fb:{ set:'tactile', rate:.8, lp:2000, gain:1.25 } },
    topre:     { name:'토프레', desc:'보글보글 둥근 도각', set:'topre', rate:1, lp:0, gain:1.1, fb:{ set:'tactile', rate:.86, lp:1700, gain:1.2 } },
    alps:      { name:'알프스', desc:'옛날 일본 키보드의 딸깍', set:'alps', rate:1, lp:0, gain:1.16, fb:{ set:'clicky', rate:1.1, lp:0, gain:.8 } },
    oldpc:     { name:'옛날 컴퓨터', desc:'학교 컴퓨터실 그 소리', set:'oldpc', rate:1, lp:0, gain:.55, hp:650, pk:[3200, 6, 1.4], fb:{ set:'tactile', rate:1.15, lp:0, gain:.8 } },
    ibm:       { name:'IBM 모델F', desc:'용수철이 철컥 울리는 전설', set:'ibm', rate:1, lp:5200, gain:.9, pk:[850, 5, 1.6], fb:{ set:'clicky', rate:.7, lp:2400, gain:1.2 } },
    grandpa:   { name:'할아버지 스위치', desc:'세상에 하나뿐인 소리', set:'typewriter', relSet:'tactile', relRate:.85, rate:.94, lp:4800, gain:1.5, layer:'wood', layerGain:.25, fb:{ set:'tactile', rate:.9, lp:2600, gain:1.1 } },
  };
  // 키캡: 소리의 색깔 + 기술
  const KEYCAP = {
    pbt:     { name:'우유 PBT', desc:'둔탁하고 포근한 기본 키캡', layer:null, skill:'tap', look:['#fffaf1', '#f4ead9', '#dccbb0', '#c2ad8e'] },
    wood:    { name:'원목', desc:'통, 따뜻한 나무 울림', layer:'wood', layerGain:.4, lp:3000, skill:'wood', look:['#e9c99c', '#d9b07a', '#b98a55', '#8a6238'] },
    typekey: { name:'타자기 키캡', desc:'동그란 쇠테 키캡', layer:'wood', layerGain:.2, layer2:'metal', layer2Gain:.12, skill:'ding', look:['#fdfbf5', '#ece6d8', '#3e3a36', '#24211e'] },
    ceramic: { name:'도자기', desc:'맑고 영롱한 똑', layer:'ceramic', layerGain:.5, layerRate:.86, skill:'ceramic', look:['#ffffff', '#eef3f6', '#c9d6df', '#9fb2c0'] },
    metal:   { name:'금속', desc:'차갑고 쨍한 울림', layer:'metal', layerGain:.4, skill:'magnet', look:['#e9edf2', '#cfd6de', '#9aa6b2', '#6e7b88'] },
    resin:   { name:'투명 레진', desc:'유리알처럼 반짝', layer:'glass', layerGain:.85, layerRate:1.2, skill:'rainbow', look:['#e6f6ff', '#c8e8fb', '#9fd0ef', '#6ea6cc'] },
    gold:    { name:'황금', desc:'공방의 보물', layer:'metal', layerGain:.3, layerRate:.7, layer2:'ceramic', skill:'gold', look:['#fff2c2', '#f6d97a', '#e0b448', '#a8832a'] },
  };
  // 몸체: 울림
  const CASE = {
    plastic: { name:'플라스틱', desc:'가볍고 깔끔한 울림' },
    wood:    { name:'원목 몸체', desc:'따뜻하게 감싸는 울림' },
    alu:     { name:'알루미늄', desc:'단단하고 또렷한 울림' },
  };
  // 키캡 기술 (판 안에서, 길게 이을수록 충전)
  const SKILL = {
    tap:     { name:'톡톡', desc:'고른 키캡 하나를 터뜨려요', need:12, target:'key' },
    wood:    { name:'나무 받침', desc:'커피 3칸을 닦고, 3턴 동안 번지지 않아요', need:18, target:null },
    ding:    { name:'띵!', desc:'고른 줄을 통째로 터뜨려요', need:22, target:'row' },
    ceramic: { name:'쨍그랑', desc:'고른 곳 주변의 방해물을 모두 깨요', need:20, target:'key' },
    magnet:  { name:'자석', desc:'고른 색으로 키캡 6개를 바꿔요', need:18, target:'key' },
    rainbow: { name:'무지개', desc:'고른 키캡과 같은 색을 모두 터뜨려요', need:26, target:'key' },
    gold:    { name:'황금 연주', desc:'이동 횟수 +4', need:24, target:null },
  };
  const ARTISAN = [
    { id:'pencil', icon:'✏️', name:'몽당연필' }, { id:'quill', icon:'🪶', name:'깃펜' }, { id:'duck', icon:'🦆', name:'고무 오리' },
    { id:'tea', icon:'🍵', name:'말차 한 잔' }, { id:'trophy', icon:'🏆', name:'우승컵' }, { id:'book', icon:'📚', name:'그림책' }, { id:'note', icon:'🎵', name:'음표' },
  ];

  // ---------- 월드 ----------
  // 판 표기: [모양, 색 수, 목표, 방해물, 고양이, 난이도(0 쉬움 1 보통 2 어려움 3 보스), 안내]
  const L = (lay, colors, goals, ob, cat, hard, tip) => ({ lay, colors, goals, ob:ob || {}, cat:cat || 0, hard:hard === undefined ? 1 : hard, tip:tip || '' });
  const WORLDS = [
    { char:'student', title:'시험공부 하는 학생', theme:['#f7efe3', '#efe1cc', '#e9dcc7', '#cdb998', '#d6c4a8'],
      wish:'조용한데 기분 좋은 소리', wishTags:{ switch:['red', 'topre'], case:['wood'] }, mid:{ switch:'red' }, end:[{ case:'wood' }, { keycap:'wood' }], art:'pencil',
      levels:[
        L('plain', 4, { c0:10 }, 0, 0, 0, '같은 색 키캡을 손가락으로 쭉 이어 보세요. 대각선도 돼요. 잘못 이었으면 한 칸 뒤로 돌아가면 취소돼요.'),
        L('plain', 4, { c1:14, c2:14 }, 0, 0, 0, '6개 이상 이은 줄을 그 줄 안의 키캡으로 다시 이어 닫으면 「고리」! 그 색이 판에서 모두 터져요.'),
        L('space', 4, { c3:18 }, 0, 0, 0, '줄에 스페이스바를 끼워 이으면, 그 가로줄이 다 터져요.'),
        L('space', 4, { c0:16, c1:16 }),
        L('enter', 4, { c2:22 }, 0, 0, 1, '엔터를 끼워 이으면 주변이 크게 터져요.'),
        L('enter', 4, { c0:16, c3:16 }),
        L('space', 5, { c1:14, c4:14 }, 0, 0, 2, '색이 하나 늘었어요. 6개 이상 이으면 반짝 키캡이 생겨요.'),
        L('enter', 5, { c2:18, c3:18 }),
        L('enter', 5, { c0:20, c1:20 }, 0, 0, 2),
        L('enter', 5, { c0:15, c1:15, c2:15, c3:15 }, 0, 0, 3, '학생의 키보드를 완성할 마지막 판이에요! 네 가지 색을 다 모아야 해요. 「고리」로 한 색을 통째로 터뜨려 보세요.'),
      ] },
    { char:'writer', title:'웹소설 작가', theme:['#fbeef2', '#f3dbe3', '#f2dde5', '#d9b3c2', '#e2c3cf'],
      wish:'옛날 타자기 같은 소리', wishTags:{ switch:['typewriter'] }, mid:{ switch:'typewriter' }, end:[{ keycap:'typekey' }, { switch:'blue' }], art:'quill',
      levels:[
        L('escplain', 4, { crumb:'all' }, { crumb:8 }, 0, 0, '과자 부스러기는 옆에서 터뜨리면 털려요. Esc는 위기 때 이동 +3 (한 번만).'),
        L('escplain', 4, { crumb:'all', c1:15 }, { crumb:10 }),
        L('type', 4, { c0:24 }, 0, 0, 1, '시프트를 끼워 이으면 그 줄이 목표에 2배로 세어져요.'),
        L('type', 4, { crumb:'all', c2:18 }, { crumb:12 }),
        L('type2', 5, { crumb:'all', c3:16 }, { crumb:12 }, 0, 2),
        L('type', 5, { c1:20, c4:20 }),
        L('type2', 5, { crumb:'all', c0:15 }, { crumb:14 }, 0, 2),
        L('type', 5, { c2:24, c3:24 }),
        L('type2', 5, { crumb:'all', c1:18, c4:18 }, { crumb:16 }, 0, 2),
        L('type2', 5, { crumb:'all', c0:20, c2:20 }, { crumb:18 }, 0, 3, '작가의 타자기 키보드를 완성할 마지막 판이에요!'),
      ] },
    { char:'dev', title:'밤샘 프로그래머', theme:['#f3ebe0', '#e6d6c0', '#e3d3bb', '#bfa47e', '#cdb594'],
      wish:'커피를 쏟아도 괜찮은 키보드', wishTags:{ keycap:['wood'], case:['wood'] }, mid:{ switch:'laptop' }, end:[{ switch:'thock' }, { case:'alu' }], art:'duck',
      levels:[
        L('tkl0', 4, { coffee:'all' }, { coffee:4 }, 0, 0, '커피를 못 닦은 턴에는 한 칸 번져요! 옆에서 터뜨려 닦아 주세요. 판의 절반을 덮으면 실패예요.'),
        L('tkl0', 4, { coffee:'all', c1:15 }, { coffee:5 }),
        L('tkl', 4, { coffee:'all' }, { coffee:6 }, 0, 1, '백스페이스를 끼워 이으면 방해물 3개를 지워요.'),
        L('tkl2', 4, { coffee:'all', crumb:'all' }, { coffee:6, crumb:6 }, 0, 2),
        L('tkl2', 5, { coffee:'all', c2:20 }, { coffee:6 }),
        L('tkl', 5, { coffee:'all', c0:18, c3:18 }, { coffee:7 }, 0, 2),
        L('tkl2', 5, { crumb:'all', coffee:'all' }, { crumb:10, coffee:5 }),
        L('tkl', 5, { coffee:'all' }, { coffee:9 }, 0, 2),
        L('tkl2', 5, { coffee:'all', crumb:'all', c4:15 }, { coffee:8, crumb:8 }, 0, 2),
        L('tkl2', 5, { coffee:'all', c1:22, c2:22 }, { coffee:10 }, 0, 3, '프로그래머의 키보드를 완성할 마지막 판이에요!'),
      ] },
    { char:'cafe', title:'카페 사장님', theme:['#eef4e6', '#dfe9d0', '#dfe9d2', '#a9c08c', '#c3d4ac'],
      wish:'도자기 잔처럼 맑은 소리', wishTags:{ keycap:['ceramic'] }, mid:{ keycap:'ceramic' }, end:[{ switch:'topre' }], art:'tea',
      levels:[
        L('cup', 4, { stuck:'all' }, { stuck:6 }, 0, 0, '뻑뻑한 키는 옆에서 두 번 터뜨려야 풀려요.'),
        L('cup', 4, { stuck:'all', c0:15 }, { stuck:8 }),
        L('cup2', 4, { stuck:'all', crumb:'all' }, { stuck:6, crumb:6 }),
        L('cup2', 5, { stuck:'all', c3:18 }, { stuck:8 }, 0, 2),
        L('cup', 5, { stuck:'all', coffee:'all' }, { stuck:6, coffee:4 }),
        L('cup2', 5, { stuck:'all' }, { stuck:11 }, 0, 2),
        L('cup', 5, { stuck:'all', crumb:'all' }, { stuck:8, crumb:8 }),
        L('cup2', 5, { stuck:'all', coffee:'all' }, { stuck:8, coffee:6 }, 0, 2),
        L('cup', 5, { stuck:'all', c1:20 }, { stuck:10 }, 0, 2),
        L('cup2', 5, { stuck:'all', coffee:'all', crumb:'all' }, { stuck:9, coffee:5, crumb:6 }, 0, 3, '카페 사장님의 도자기 키보드를 완성할 마지막 판이에요!'),
      ] },
    { char:'gamer', title:'프로 게이머', theme:['#e8f7f8', '#d2eef0', '#d3eef0', '#86c3c8', '#a9d6da'],
      wish:'빠르고 시원한 소리', wishTags:{ switch:['red', 'blue'], keycap:['metal'], case:['alu'] }, mid:{ keycap:'metal' }, end:[{ switch:'alps' }], art:'trophy',
      levels:[
        L('wasd0', 4, { bug:'all' }, { bug:2 }, 0, 0, '버그는 돌아다니며 키캡을 갉아 먹고, 지나간 자리에 부스러기를 남겨요(부스러기 목표가 늘 수 있어요). 옆에서 터뜨리면 놀라 도망가고, 한 번 더 맞혀야 잡혀요!'),
        L('wasd0', 4, { bug:'all', c2:15 }, { bug:3 }),
        L('wasd', 4, { bug:'all' }, { bug:3 }, 0, 1, '탭을 끼워 이으면 그 줄의 색이 한 칸씩 밀려요.'),
        L('wasd2', 5, { bug:'all', crumb:'all' }, { bug:3, crumb:6 }, 0, 2),
        L('wasd2', 5, { bug:'all', coffee:'all' }, { bug:4, coffee:4 }),
        L('wasd', 5, { bug:'all', stuck:'all' }, { bug:4, stuck:6 }, 0, 2),
        L('wasd2', 5, { bug:'all', c0:20 }, { bug:5 }),
        L('wasd', 5, { bug:'all', coffee:'all' }, { bug:4, coffee:6 }, 0, 2),
        L('wasd2', 5, { bug:'all', stuck:'all', crumb:'all' }, { bug:5, stuck:6, crumb:6 }, 0, 2),
        L('wasd2', 5, { bug:'all', coffee:'all', c3:20 }, { bug:6, coffee:5 }, 0, 3, '게이머의 키보드를 완성할 마지막 판이에요!'),
      ] },
    { char:'librarian', title:'도서관 사서 할머니', theme:['#eceef8', '#d9ddf0', '#d8dcf0', '#97a2cc', '#b6bedf'],
      wish:'손주의 고장 난 키보드를 고쳐 주세요', wishTags:{ switch:['oldpc', 'ibm'] }, mid:{ switch:'oldpc' }, end:[{ switch:'ibm' }, { keycap:'resin' }], art:'book',
      levels:[
        L('split', 4, { c0:18, c1:18 }, 0, 4, 0, '갈라진 키보드예요. 고양이 타닥이가 가끔 한 줄을 휘젓고 지나가요!'),
        L('split', 4, { crumb:'all' }, { crumb:10 }, 4),
        L('split2', 5, { c2:20, c3:20 }, 0, 3, 2),
        L('split', 4, { stuck:'all' }, { stuck:8 }, 4),
        L('split2', 5, { coffee:'all' }, { coffee:5 }, 3, 2),
        L('split', 5, { bug:'all' }, { bug:3 }, 3),
        L('split2', 5, { crumb:'all', stuck:'all' }, { crumb:8, stuck:6 }, 3, 2),
        L('split', 5, { coffee:'all', bug:'all' }, { coffee:6, bug:3 }, 3),
        L('split2', 5, { c0:22, c4:22 }, 0, 2, 2),
        L('split2', 5, { coffee:'all', stuck:'all', bug:'all' }, { coffee:5, stuck:6, bug:3 }, 3, 3, '할머니 손주의 키보드를 고칠 마지막 판이에요!'),
      ] },
    { char:'composer', title:'소리를 잃은 작곡가', theme:['#fbf3dc', '#f3e3b6', '#f4e6bd', '#d6b866', '#e6cf8f'],
      wish:'세상에 하나뿐인 소리', wishTags:{}, mid:{ keycap:'gold' }, end:[], art:'note',
      levels:[
        L('full', 5, { crumb:'all', coffee:'all' }, { crumb:10, coffee:4 }),
        L('full', 5, { stuck:'all', bug:'all' }, { stuck:8, bug:3 }),
        L('full', 6, { c0:16, c5:16 }, 0, 0, 2),
        L('full', 5, { coffee:'all', stuck:'all' }, { coffee:7, stuck:6 }),
        L('full', 6, { bug:'all', crumb:'all' }, { bug:4, crumb:8 }, 0, 2),
        L('full', 5, { coffee:'all', bug:'all' }, { coffee:8, bug:3 }),
        L('full', 6, { stuck:'all' }, { stuck:10 }, 4, 2),
        L('full', 5, { coffee:'all', stuck:'all', bug:'all' }, { coffee:8, stuck:6, bug:3 }, 0, 2),
        L('full', 6, { crumb:'all', coffee:'all', bug:'all' }, { crumb:10, coffee:6, bug:4 }, 4, 2),
        L('full', 5, { c0:22, c1:22, c2:22 }, { coffee:5, stuck:6 }, 0, 3, '마지막 곡이에요. 키캡이 터질 때마다 작곡가의 노래가 한 음씩 울려요.'),
      ] },
  ];

  // 판마다 [목표, 방해물, 이동 횟수] — dev/tune6.html: 실제 게임처럼 「판 씨앗+무작위」 600판씩, 사람에 가까운 중간 봇(다음에 떨어질 색은 모름, Esc +3도 실제와 같이 셈).
  // 같은 월드 안에서 보통 판 ≥ 🔥 최고+5%p, 🔥 최저 ≥ 👑+6%p가 되게 이동 수를 고르고, 👑는 고리를 쓰는 강한 봇 승률도 90% 이하로 맞춤.
  // 1-10은 고리를 쓰면 쉽고 안 쓰면 어려운 판이라, 판 안내에 고리를 알려 주고, 고리를 아직 모르는 사람도 깰 수 있게 이동을 넉넉히 줌(사용자 결정).
  // dev/verify.html 실측(실제 이동 제한·Esc 포함, 중간 봇 600~1500판): 보통 / 🔥 / 👑 (👑의 강한 봇 300판)
  //   월드1 85~94% / 73~74% / 27%(97%)   월드2 82~86% / 68~73% / 28%(90%)   월드3 78~85% / 58~66% / 27%(89%)   월드4 66~76% / 51~59% / 42%(87%)
  //   월드5 62~72% / 52~58% / 44%(78%)   월드6 56~71% / 44~48% / 39%(38%)   월드7 54~63% / 38~47% / 26%(87%)  (표본 오차 약 ±2~3%)
  const TUNE = [
    [[{c0:22},{},15], [{c1:21,c2:21},{},18], [{c3:25},{},17], [{c0:22,c1:22},{},17], [{c2:35},{},20], [{c0:29,c3:29},{},19], [{c1:22,c4:22},{},22], [{c2:25,c3:25},{},22], [{c0:33,c1:33},{},27], [{c0:28,c1:28,c2:28,c3:28},{},21]],
    [[{c1:20,crumb:'all'},{crumb:16},12], [{crumb:'all',c1:21},{crumb:14},12], [{c0:24},{},15], [{crumb:'all',c2:29},{crumb:17},20], [{crumb:'all',c3:18},{crumb:13},12], [{c1:25,c4:25},{},26], [{crumb:'all',c0:20},{crumb:16},15], [{c2:24,c3:24},{},25], [{crumb:'all',c1:25,c4:25},{crumb:16},21], [{crumb:'all',c0:30,c2:30},{crumb:16},19]],
    [[{c2:20,coffee:'all'},{coffee:8},16], [{coffee:'all',c1:23},{coffee:8},16], [{c0:20,coffee:'all'},{coffee:12},9], [{c1:31,coffee:'all',crumb:'all'},{coffee:8,crumb:8},12], [{coffee:'all',c2:20},{coffee:6},11], [{coffee:'all',c0:18,c3:18},{coffee:7},13], [{c3:22,crumb:'all',coffee:'all'},{crumb:8,coffee:8},14], [{c4:34,coffee:'all'},{coffee:12},23], [{coffee:'all',crumb:'all',c4:30},{coffee:8,crumb:8},17], [{coffee:'all',c1:34,c2:34},{coffee:12},19]],
    [[{c3:20,stuck:'all'},{stuck:12},9], [{stuck:'all',c0:19},{stuck:10},8], [{c1:23,stuck:'all',crumb:'all'},{stuck:8,crumb:9},10], [{stuck:'all',c3:22},{stuck:10},12], [{c2:17,stuck:'all',coffee:'all'},{stuck:10,coffee:7},12], [{c3:22,stuck:'all'},{stuck:17},14], [{c4:24,stuck:'all',crumb:'all'},{stuck:8,crumb:9},16], [{c0:22,stuck:'all',coffee:'all'},{stuck:8,coffee:9},13], [{stuck:'all',c1:26},{stuck:13},16], [{c2:37,stuck:'all',coffee:'all',crumb:'all'},{stuck:5,coffee:6,crumb:6},21]],
    [[{c0:26,bug:'all'},{bug:5},14], [{bug:'all',c2:27},{bug:5},14], [{c2:28,bug:'all'},{bug:6},16], [{c2:22,bug:'all',crumb:'all'},{bug:6,crumb:10},12], [{c3:16,bug:'all',coffee:'all'},{bug:6,coffee:6},11], [{c4:14,bug:'all',stuck:'all'},{bug:6,stuck:9},30], [{bug:'all',c0:29},{bug:6},16], [{c1:15,bug:'all',coffee:'all'},{bug:5,coffee:8},23], [{c2:36,bug:'all',stuck:'all',crumb:'all'},{bug:5,stuck:5,crumb:6},21], [{bug:'all',coffee:'all',c3:32},{bug:6,coffee:8},18]],
    [[{c0:27,c1:27},{},15], [{c2:22,crumb:'all'},{crumb:14},11], [{c2:16,c3:16},{},9], [{c0:18,stuck:'all'},{stuck:14},24], [{c4:19,crumb:'all'},{crumb:12},10], [{c0:11,bug:'all'},{bug:3},14], [{c1:26,crumb:'all',stuck:'all'},{crumb:6,stuck:7},16], [{c2:14,bug:'all',crumb:'all'},{bug:2,crumb:8},16], [{c0:22,c4:22},{},13], [{c4:12,stuck:'all',bug:'all',crumb:'all'},{stuck:5,bug:3,crumb:6},8]],
    [[{c1:23,crumb:'all',coffee:'all'},{crumb:10,coffee:9},12], [{c2:15,stuck:'all',bug:'all'},{stuck:12,bug:4},11], [{c0:19,c5:19},{},13], [{c4:27,coffee:'all',stuck:'all'},{coffee:9,stuck:10},15], [{c4:22,bug:'all',crumb:'all'},{bug:6,crumb:13},16], [{c1:22,coffee:'all',bug:'all'},{coffee:12,bug:6},16], [{c0:25,stuck:'all'},{stuck:18},16], [{c3:18,coffee:'all',stuck:'all',bug:'all'},{coffee:7,stuck:7,bug:5},13], [{c2:21,crumb:'all',coffee:'all',bug:'all'},{crumb:6,coffee:7,bug:6},16], [{c0:30,c1:30,coffee:'all',stuck:'all'},{coffee:9,stuck:10},17]],
  ];

  function level(w, i){
    const W = WORLDS[w], S = W.levels[i];
    const T = TUNE[w][i];
    return { w, i, name:`${w + 1}-${i + 1}`, layout:LAY[S.lay], colors:S.colors, goals:T[0], ob:T[1], cat:S.cat, hard:S.hard, tip:S.tip,
      moves:T[2], bugSlow:2, seed:(w + 1) * 1000 + i * 37 + 11 };
  }

  // ---------- 이야기 ----------
  // [말하는 사람, 표정, 대사]  사람: char id 또는 'cat', 'letter'(편지), 'me'(나레이션)
  const STORY = {
    intro:[
      ['letter', '', '사랑하는 손주에게.'],
      ['letter', '', '이 낡은 공방을 너에게 맡긴다.'],
      ['letter', '', '키보드는 그냥 글자를 치는 물건이 아니란다. 누르는 사람의 하루가 담기지.'],
      ['letter', '', '소리에는 마음이 담긴단다. — 할아버지가'],
    ],
    catJump:[['cat', '놀람', '냥!'], ['me', '', '고양이가 키보드 위로 뛰어올라, 남은 키캡이 와르르 흩어졌다.'], ['cat', '졸림', '냐아… (같이 치우자는 얼굴이다)']],
    w:[
      { hello:[['student', '졸림', '저… 여기 키보드 고쳐 주는 곳 맞죠?'], ['student', '걱정', '독서실에서 쓸 건데, 조용하면서도… 치면 기분 좋은 소리였으면 좋겠어요.'], ['student', '기본', '시험이 코앞이라, 키보드라도 저를 응원해 줬으면 해서요.']],
        mid:[['student', '기쁨', '와, 벌써 부품이 모였어요? 이 적축 소리… 사각사각 좋네요!']],
        match:[['student', '기쁨', '이거예요! 조용한데 손끝이 간질간질 기분 좋아요.'], ['student', '기쁨', '이번 시험, 이 키보드랑 같이라면 할 수 있을 것 같아요!']],
        nomatch:[['student', '놀람', '생각보다 소리가 씩씩하네요…! 그래도 마음에 들어요. 고맙습니다!']] },
      { hello:[['writer', '걱정', '마감이… 마감이 사흘 남았는데 한 줄도 못 썼어요.'], ['writer', '기본', '옛날 타자기 소리를 들으면 글이 술술 나올 것 같거든요.'], ['writer', '걱정', '철컥, 철컥, 띵! 그런 키보드, 만들 수 있을까요?']],
        mid:[['writer', '놀람', '방금 그 소리… 타자기 맞죠? 소름 돋았어요.']],
        match:[['writer', '기쁨', '철컥, 철컥… 띵! 머릿속에 다음 장면이 막 떠올라요!'], ['writer', '기쁨', '완성되면 작가의 말에 이 공방 이야기를 꼭 쓸게요.']],
        nomatch:[['writer', '기본', '타자기는 아니지만… 이 소리도 글이 잘 써질 것 같은 소리네요. 고마워요!']] },
      { hello:[['dev', '졸림', '…세 번째예요. 이번 달에만 키보드에 커피를 세 번 쏟았어요.'], ['dev', '걱정', '커피 쏟아도 끄떡없고, 새벽에 쳐도 덜 외로운 소리였으면 해요.']],
        mid:[['dev', '놀람', '노트북 키보드 소리네요. 이것도 나쁘지 않은데요?']],
        match:[['dev', '기쁨', '나무라니! 커피를 쏟아도 왠지 괜찮을 것 같아요.'], ['dev', '기쁨', '오늘은 버그 없이 일찍 퇴근할 수 있을 것 같은 기분이에요.']],
        nomatch:[['dev', '기본', '튼튼해 보이네요. 커피는… 조심할게요. 고마워요!']] },
      { hello:[['cafe', '평온', '어서 오세요. 아니, 제가 손님이죠. 하하.'], ['cafe', '기본', '가게 계산대 키보드를 바꾸고 싶어요. 손님들이 들어도 기분 좋은 소리로요.'], ['cafe', '평온', '제가 빚은 찻잔처럼, 맑고 단정한 소리면 좋겠습니다.']],
        mid:[['cafe', '기쁨', '도자기 키캡이라니… 똑, 똑. 찻잔이 부딪히는 소리 같아요.']],
        match:[['cafe', '기쁨', '똑, 똑… 정말 찻잔 소리 같네요. 손님들이 좋아하겠어요.'], ['cafe', '평온', '다음에 오시면 말차 한 잔 대접할게요.']],
        nomatch:[['cafe', '평온', '단정하고 좋은 소리네요. 가게 분위기와 잘 어울리겠어요.']] },
      { hello:[['gamer', '윙크', '여기가 소문난 공방? 대회 나갈 키보드가 필요해요.'], ['gamer', '기본', '빠르고, 시원하고, 치는 순간 이길 것 같은 소리!'], ['gamer', '윙크', '버그 같은 건 질색이에요. 게임에서도, 키보드에서도요.']],
        mid:[['gamer', '놀람', '금속 키캡? 차가운 이 느낌… 완전 제 스타일이에요!']],
        match:[['gamer', '기쁨', '이거죠! 손가락이 날아다니는 것 같아요.'], ['gamer', '윙크', '우승하면 트로피 들고 다시 올게요.']],
        nomatch:[['gamer', '기본', '음, 생각보다 얌전한 소린데… 그래도 손에 착 붙네요. 땡큐!']] },
      { hello:[['librarian', '평온', '아이고, 젊은 사장님이네. 이거 좀 봐 줄 수 있을까?'], ['librarian', '걱정', '손주 녀석 키보드인데, 고양이가 떨어뜨려서 반으로 쩍 갈라졌지 뭐야.'], ['librarian', '평온', '옛날에 도서관 컴퓨터실에서 듣던 그 소리가 나면 좋겠구먼.']],
        mid:[['librarian', '기쁨', '그래, 이 소리야! 도서관 컴퓨터실 소리. 그립구먼.']],
        match:[['librarian', '기쁨', '이 소리… 손주도 분명 좋아할 거야. 고마워요.'], ['librarian', '평온', '사장님 할아버지도 이렇게 손이 야무지셨지. 꼭 닮았네.']],
        nomatch:[['librarian', '평온', '튼튼하게 잘 고쳤네. 손주가 좋아하겠어. 고마워요.']] },
      { hello:[['composer', '슬픔', '…여기가 그 공방이오?'], ['composer', '슬픔', '어릴 적, 친구가 만들어 준 키보드가 있었소. 그 소리로 나는 곡을 썼지.'], ['composer', '슬픔', '그 키보드를 잃고 나서는… 한 곡도 쓰지 못했소.'], ['composer', '기본', '세상에 하나뿐인 그 소리를, 다시 들을 수 있겠소?']],
        mid:[['composer', '놀람', '황금 키캡… 그 친구도 이런 걸 아꼈지.']],
        match:[], nomatch:[] },
    ],
    ending:[
      ['composer', '놀람', '…이 소리는.'],
      ['composer', '슬픔', '이 키보드, 어디서 났소?'],
      ['me', '', '할아버지의 낡은 키보드. 공방에 처음 왔던 날, 고양이와 함께 고친 그 키보드였다.'],
      ['composer', '기쁨', '그 친구였구먼. 내 곡은 전부… 이 소리에서 나왔소.'],
      ['composer', '기쁨', '이제야 다시 쓸 수 있겠소. 아니, 우리 함께 연주합시다.'],
    ],
    finale:[['me', '', '공방 문이 열리고, 지금까지의 손님들이 하나둘 들어왔다.'], ['me', '', '저마다, 내가 만들어 준 키보드를 품에 안고.']],
    lastKey:[['me', '', '곡의 마지막 한 음이 비어 있다.']],
    letter2:[
      ['letter', '', '네가 만든 소리들이 누군가의 하루가 되었구나.'],
      ['letter', '', '공방을 지켜 줘서 고맙다. 앞으로도 마음을 담아 딸깍.'],
    ],
    hidden:[['cat', '놀람', '냥?'], ['me', '', '타닥이가 공방 구석의 낡은 서랍을 앞발로 긁고 있다.'], ['me', '', '서랍 안에는 이름표가 붙은 작은 스위치 하나. 「손주에게 — 할아버지 스위치」']],
  };

  // 작곡가의 곡 (직접 지은 짧은 멜로디, 도=0 기준 반음)
  const SONG = [[0, 4, 7, 9], [7, 4, 5, 2], [4, 5, 7, 12], [11, 9, 7, 7], [5, 7, 9, 5], [4, 2, 0, 2], [4, 7, 5, 2]];
  const SONG_LAST = 0;

  return { LAY, SWITCH, KEYCAP, CASE, SKILL, ARTISAN, WORLDS, TUNE, level, STORY, SONG, SONG_LAST };
})();

// 엔딩 크레딧에 올리는 녹음가 (모두 CC0, 출처는 sounds/출처.txt)
window.SOUND_CREDITS = 'StavSounds · handygaber · grcekh · nakkivene66 · zrrion · exterminat · unicaegames · unfa · Sadiquecat · Kodack · HunteR4708 · johnnydekk · itinerantmonk108 · MBPL · BenjaminNelan · julietclarke · Mrguff · AidanSounds · kyles · Unicornaphobist · zembacraftworks · Kenney · ryuuzan · 775noise · Mafon2 · Breviceps · ignasd · luckius · keweldog · _stubb · steffcaffrey';
