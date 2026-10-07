// 딸깍 공방 등장인물 — 모두 같은 규칙으로 그리는 「키캡 사람」
// Chars.svg(id, mood) → SVG 문자열 (viewBox 0 0 200 240)
const Chars = (() => {
  const INK = '#3b2a20';

  // ---------- 눈 · 입 · 볼 (표정) ----------
  const EYE = {
    normal: (x, y) => `<ellipse cx="${x}" cy="${y}" rx="4.6" ry="6" fill="${INK}"/><circle cx="${x + 1.6}" cy="${y - 2.2}" r="1.7" fill="#fff"/>`,
    happy: (x, y) => `<path d="M${x - 6} ${y + 2} Q${x} ${y - 7} ${x + 6} ${y + 2}" fill="none" stroke="${INK}" stroke-width="3.2" stroke-linecap="round"/>`,
    calm: (x, y) => `<path d="M${x - 6} ${y - 1} Q${x} ${y + 5} ${x + 6} ${y - 1}" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`,
    sleepy: (x, y) => `<path d="M${x - 6} ${y} L${x + 6} ${y}" stroke="${INK}" stroke-width="3.2" stroke-linecap="round"/><path d="M${x - 5} ${y + 6} Q${x} ${y + 9} ${x + 5} ${y + 6}" fill="none" stroke="#a99cc4" stroke-width="2" stroke-linecap="round"/>`,
    sad: (x, y) => `<ellipse cx="${x}" cy="${y + 2}" rx="3.8" ry="4.2" fill="${INK}"/><path d="M${x - 6} ${y - 1} Q${x} ${y - 3} ${x + 6} ${y - 1}" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/><path d="M${x - 7} ${y - 7} L${x + 6} ${y - 12}" stroke="${INK}" stroke-width="2.6" stroke-linecap="round" transform="${x < 100 ? '' : `scale(-1 1) translate(${-2 * x} 0)`}"/>${x < 100 ? `<path d="M${x - 3} ${y + 9} Q${x - 6} ${y + 15} ${x - 3} ${y + 17} Q${x} ${y + 15} ${x - 3} ${y + 9}Z" fill="#8fc8f0"/>` : ''}`,
    wow: (x, y) => `<circle cx="${x}" cy="${y}" r="6.5" fill="#fff" stroke="${INK}" stroke-width="2.4"/><circle cx="${x}" cy="${y + .5}" r="3.2" fill="${INK}"/>`,
    worry: (x, y) => `<ellipse cx="${x}" cy="${y + 1}" rx="4.2" ry="5.4" fill="${INK}"/><circle cx="${x + 1.5}" cy="${y - 1}" r="1.5" fill="#fff"/><path d="M${x - 7} ${y - 8} L${x + 6} ${y - 12}" stroke="${INK}" stroke-width="2.6" stroke-linecap="round" transform="${x < 100 ? '' : `scale(-1 1) translate(${-2 * x} 0)`}"/>`,
  };
  const MOUTH = {
    smile: `<path d="M93 132 Q100 138 107 132" fill="none" stroke="${INK}" stroke-width="2.8" stroke-linecap="round"/>`,
    open: `<path d="M91 130 Q100 131 109 130 Q108 142 100 142 Q92 142 91 130 Z" fill="#c45a52" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/><path d="M95 138 Q100 135 105 138 Q103 141 100 141 Q97 141 95 138Z" fill="#f08f8a"/>`,
    flat: `<path d="M95 134 L105 134" stroke="${INK}" stroke-width="2.8" stroke-linecap="round"/>`,
    wobble: `<path d="M92 135 Q96 131 100 135 Q104 139 108 135" fill="none" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/>`,
    o: `<ellipse cx="100" cy="135" rx="4.5" ry="5.5" fill="#c45a52" stroke="${INK}" stroke-width="2.4"/>`,
    smirk: `<path d="M93 133 Q102 138 108 129" fill="none" stroke="${INK}" stroke-width="2.8" stroke-linecap="round"/>`,
    down: `<path d="M93 137 Q100 131 107 137" fill="none" stroke="${INK}" stroke-width="2.8" stroke-linecap="round"/>`,
  };
  const MOODS = {
    기본: ['normal', 'normal', 'smile'],
    기쁨: ['happy', 'happy', 'open'],
    걱정: ['worry', 'worry', 'wobble'],
    놀람: ['wow', 'wow', 'o'],
    졸림: ['sleepy', 'sleepy', 'flat'],
    평온: ['calm', 'calm', 'smile'],
    슬픔: ['sad', 'sad', 'down'],
    윙크: ['happy', 'normal', 'smirk'],
  };
  const face = (mood, blush = true, noMouth = false, glasses = false) => {
    const [l, r, m0] = MOODS[mood] || MOODS.기본, m = noMouth ? null : m0;
    const brows = glasses && (l === 'worry' || l === 'sad') ? `<path d="M74 97 L92 91 M126 97 L108 91" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>` : '';
    return (blush ? '<ellipse cx="72" cy="128" rx="8" ry="4.5" fill="#f4978e" opacity=".55"/><ellipse cx="128" cy="128" rx="8" ry="4.5" fill="#f4978e" opacity=".55"/>' : '')
      + EYE[l](84, 114) + EYE[r](116, 114) + (m ? MOUTH[m] : '') + brows;
  };

  // ---------- 키캡 몸통 ----------
  // 실루엣(치마) 안에 윗면(접시)이 살짝 위로 올라앉은 모양
  const SKIRT = 'M58 60 Q50 60 49 70 L36 192 Q34 208 50 208 L150 208 Q166 208 164 192 L151 70 Q150 60 142 60 Z';
  function body(c){
    return `<ellipse cx="100" cy="226" rx="66" ry="8" fill="#6b4a2a" opacity=".14"/>
      <ellipse cx="74" cy="214" rx="15" ry="9" fill="${c.foot || c.line}"/><ellipse cx="126" cy="214" rx="15" ry="9" fill="${c.foot || c.line}"/>
      <path d="${SKIRT}" fill="${c.skirt}" stroke="${c.line}" stroke-width="3.2" stroke-linejoin="round"/>
      <path d="M40 166 L160 166 L164 192 Q166 208 150 208 L50 208 Q34 208 36 192 Z" fill="${c.side}" opacity=".9"/>
      <path d="${SKIRT}" fill="none" stroke="${c.line}" stroke-width="3.2" stroke-linejoin="round"/>
      <rect x="58" y="66" width="84" height="94" rx="20" fill="${c.dish}" stroke="${c.line}" stroke-width="2.6"/>
      <path d="M70 76 Q100 69 130 76" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".75"/>
      <path d="M66 148 Q100 160 134 148" fill="none" stroke="${c.side}" stroke-width="3.5" stroke-linecap="round" opacity=".55"/>
      <path d="M42 176 Q100 182 158 176" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" opacity=".35"/>`;
  }
  const arm = (c, x1, y1, x2, y2) => `<path d="M${x1} ${y1} Q${(x1 + x2) / 2 + (x2 < 100 ? -8 : 8)} ${(y1 + y2) / 2 - 6} ${x2} ${y2}" fill="none" stroke="${c.line}" stroke-width="15" stroke-linecap="round"/><path d="M${x1} ${y1} Q${(x1 + x2) / 2 + (x2 < 100 ? -8 : 8)} ${(y1 + y2) / 2 - 6} ${x2} ${y2}" fill="none" stroke="${c.skirt}" stroke-width="9" stroke-linecap="round"/>`;
  const armsDown = c => arm(c, 46, 150, 30, 178) + arm(c, 154, 150, 170, 178);
  const steam = (x, y, k = 1) => `<path d="M${x} ${y} Q${x - 5} ${y - 7 * k} ${x} ${y - 14 * k} Q${x + 5} ${y - 21 * k} ${x} ${y - 28 * k}" fill="none" stroke="#c8b8a6" stroke-width="2.6" stroke-linecap="round" opacity=".8"/>`;
  const sparkle = (x, y, s = 1, col = '#ffd166') => `<path d="M${x} ${y - 9 * s} Q${x + 1.5 * s} ${y - 1.5 * s} ${x + 9 * s} ${y} Q${x + 1.5 * s} ${y + 1.5 * s} ${x} ${y + 9 * s} Q${x - 1.5 * s} ${y + 1.5 * s} ${x - 9 * s} ${y} Q${x - 1.5 * s} ${y - 1.5 * s} ${x} ${y - 9 * s}Z" fill="${col}"/>`;

  // ---------- 인물 ----------
  const P = {};

  P.grandpa = {
    name:'할아버지', note:'공방을 남겨 주신 분. 편지와 사진으로만 등장', mood:'평온', glasses:true,
    c:{ skirt:'#dccdb0', side:'#c9b48f', dish:'#f3ead8', line:'#8a7353', foot:'#6e5a44' },
    back: () => `<ellipse cx="56" cy="104" rx="11" ry="17" fill="#f6f3ee" stroke="#b9b0a2" stroke-width="2.4"/><ellipse cx="144" cy="104" rx="11" ry="17" fill="#f6f3ee" stroke="#b9b0a2" stroke-width="2.4"/>`,
    front: () => `<path d="M74 98 Q84 93 94 98 M106 98 Q116 93 126 98" fill="none" stroke="#e9e4dc" stroke-width="5" stroke-linecap="round"/>
      <circle cx="84" cy="114" r="12.5" fill="#fff" fill-opacity=".25" stroke="#c99a2e" stroke-width="3"/><circle cx="116" cy="114" r="12.5" fill="#fff" fill-opacity=".25" stroke="#c99a2e" stroke-width="3"/><path d="M96 113 Q100 110 104 113" fill="none" stroke="#c99a2e" stroke-width="3"/>
      <path d="M80 133 Q88 124 100 130 Q112 124 120 133 Q112 140 100 135 Q88 140 80 133 Z" fill="#f6f3ee" stroke="#b9b0a2" stroke-width="2.2"/>
      <path d="M66 166 L134 166 L138 204 L62 204 Z" fill="#7c5a3c" stroke="#5e432c" stroke-width="2.4" stroke-linejoin="round"/>
      <rect x="104" y="176" width="22" height="16" rx="3" fill="#6a4c32" stroke="#5e432c" stroke-width="2"/>
      <path d="M110 178 L110 162 Q115 154 120 162 L120 178" fill="none" stroke="#c0c4cc" stroke-width="2.6" stroke-linecap="round"/>`,
    props: c => armsDown(c),
    faceNoMouth:true, mouthTop:true, mouthY:12,
  };

  P.student = {
    name:'시험공부 학생', note:'월드 1 · 「조용한데 기분 좋은 소리」', mood:'졸림',
    c:{ skirt:'#a3c6ee', side:'#8bb2df', dish:'#dbeafb', line:'#5a7fa8', foot:'#4b6a8f' },
    back: () => `<path d="M44 86 Q44 40 100 40 Q156 40 156 86 L150 70 Q140 52 100 52 Q60 52 50 70 Z" fill="#8bb2df" stroke="#5a7fa8" stroke-width="3" stroke-linejoin="round"/>`,
    front: () => `<path d="M60 92 Q62 64 100 62 Q138 64 140 92 Q132 82 124 90 Q118 78 108 88 Q100 76 92 88 Q82 78 76 90 Q68 82 60 92 Z" fill="#4a3a30"/>
      <path d="M58 160 Q100 178 142 160" fill="none" stroke="#4d4d5c" stroke-width="6" stroke-linecap="round"/>
      <rect x="44" y="150" width="20" height="24" rx="9" fill="#6c6c80" stroke="#3f3f4c" stroke-width="2.4"/><rect x="136" y="150" width="20" height="24" rx="9" fill="#6c6c80" stroke="#3f3f4c" stroke-width="2.4"/>
      <ellipse cx="54" cy="162" rx="4" ry="6" fill="#a3c6ee"/><ellipse cx="146" cy="162" rx="4" ry="6" fill="#a3c6ee"/>`,
    props: c => arm(c, 46, 150, 30, 178) + arm(c, 154, 146, 172, 160)
      + `<g transform="rotate(14 178 168)"><rect x="166" y="146" width="28" height="36" rx="3" fill="#fff" stroke="#8a7353" stroke-width="2.2"/><rect x="163" y="142" width="28" height="36" rx="3" fill="#fff6d8" stroke="#8a7353" stroke-width="2.2"/><circle cx="168" cy="146" r="4" fill="none" stroke="#b58a1e" stroke-width="2.2"/><path d="M170 158 L186 158 M170 165 L184 165 M170 172 L180 172" stroke="#c9b48e" stroke-width="2.2" stroke-linecap="round"/></g>`,
  };

  P.writer = {
    name:'웹소설 작가', note:'월드 2 · 「옛날 타자기 같은 소리」', mood:'걱정', glasses:true,
    c:{ skirt:'#f2b6c6', side:'#e59db1', dish:'#fcdfe7', line:'#b56a80', foot:'#8f4f62' },
    back: () => ``,
    front: () => `<path d="M60 90 Q56 66 74 64 Q76 48 94 54 Q104 40 118 54 Q136 48 134 66 Q146 70 140 90 Q134 80 126 86 Q120 74 110 84 Q100 72 90 84 Q80 74 72 86 Q66 80 60 90 Z" fill="#6b4a3a"/>
      <g transform="rotate(-28 128 54)"><rect x="122" y="22" width="10" height="44" rx="2" fill="#ffd166" stroke="#8a6a1e" stroke-width="2"/><rect x="122" y="18" width="10" height="8" rx="2" fill="#f4978e" stroke="#8a6a1e" stroke-width="2"/><path d="M122 66 L127 76 L132 66 Z" fill="#f3d9b0" stroke="#8a6a1e" stroke-width="2" stroke-linejoin="round"/></g>
      <rect x="70" y="104" width="27" height="21" rx="8" fill="#fff" fill-opacity=".3" stroke="#4a2e22" stroke-width="3.6"/><rect x="103" y="104" width="27" height="21" rx="8" fill="#fff" fill-opacity=".3" stroke="#4a2e22" stroke-width="3.6"/><path d="M97 112 L103 112" stroke="#4a2e22" stroke-width="3"/>`,
    props: c => arm(c, 46, 150, 30, 178) + arm(c, 154, 148, 170, 166)
      + `<path d="M188 166 Q200 166 200 176 Q200 186 188 186" fill="none" stroke="#6f97c4" stroke-width="4"/><rect x="160" y="156" width="30" height="36" rx="5" fill="#fff" stroke="#6f97c4" stroke-width="2.6"/><text x="175" y="179" text-anchor="middle" font-family="Jua,sans-serif" font-size="11" fill="#d4512a">마감</text>` + steam(170, 150) + steam(180, 148),
  };

  P.dev = {
    name:'밤샘 프로그래머', note:'월드 3 · 「커피를 쏟아도 괜찮은 키보드」', mood:'졸림',
    c:{ skirt:'#d8c19c', side:'#c5a97f', dish:'#f2e5cd', line:'#957853', foot:'#6e5a44' },
    back: () => `<circle cx="100" cy="44" r="17" fill="#3f3029"/><path d="M90 40 Q96 34 104 38 M94 50 Q102 44 110 48" fill="none" stroke="#5a463c" stroke-width="2.2" stroke-linecap="round"/><ellipse cx="100" cy="60" rx="15" ry="5" fill="#e0574f" stroke="#a83a33" stroke-width="2"/>`,
    front: () => `<path d="M60 90 Q62 62 100 60 Q138 62 140 90 Q130 76 116 82 Q104 70 92 82 Q76 74 60 90 Z" fill="#3f3029"/>
      <rect x="70" y="72" width="26" height="15" rx="7" fill="#9fd0f0" fill-opacity=".85" stroke="#2c2c3a" stroke-width="3"/><rect x="104" y="72" width="26" height="15" rx="7" fill="#9fd0f0" fill-opacity=".85" stroke="#2c2c3a" stroke-width="3"/><path d="M96 79 L104 79" stroke="#2c2c3a" stroke-width="3"/>
      <path d="M50 178 Q56 168 66 174 Q74 170 74 182 Q72 194 60 192 Q48 192 50 178 Z" fill="#8a5a36" opacity=".8"/><circle cx="80" cy="190" r="3.5" fill="#8a5a36" opacity=".8"/>`,
    props: c => arm(c, 46, 150, 34, 176) + arm(c, 154, 146, 168, 158)
      + `<rect x="160" y="134" width="28" height="54" rx="8" fill="#6aa98a" stroke="#3f6e57" stroke-width="2.6"/><rect x="157" y="128" width="34" height="10" rx="4" fill="#3f6e57"/><rect x="166" y="150" width="16" height="16" rx="3" fill="#dcefe5"/><path d="M170 158 L178 158" stroke="#3f6e57" stroke-width="2.4" stroke-linecap="round"/>`
      + `<ellipse cx="24" cy="208" rx="17" ry="12" fill="#ffd166" stroke="#b58a1e" stroke-width="2.4"/><circle cx="32" cy="193" r="10" fill="#ffd166" stroke="#b58a1e" stroke-width="2.4"/><path d="M40 194 L50 197 L40 200 Z" fill="#f08a3c" stroke="#b5641e" stroke-width="1.5"/><circle cx="34" cy="191" r="1.8" fill="${INK}"/>`,
  };

  P.cafe = {
    name:'카페 사장님', note:'월드 4 · 「도자기 잔처럼 맑은 소리」', mood:'평온',
    c:{ skirt:'#aacb8c', side:'#93b874', dish:'#dfedcc', line:'#5f8a48', foot:'#4e7139' },
    back: () => `<path d="M146 66 Q164 70 168 86 Q156 84 150 78 Z" fill="#5f8a48" stroke="#466b33" stroke-width="2.4" stroke-linejoin="round"/><path d="M146 66 Q160 56 172 62 Q160 70 152 74 Z" fill="#6f9a52" stroke="#466b33" stroke-width="2.4" stroke-linejoin="round"/>`,
    front: () => `<path d="M56 92 Q58 56 100 54 Q142 56 144 92 Q122 84 100 84 Q78 84 56 92 Z" fill="#6f9a52" stroke="#466b33" stroke-width="2.6" stroke-linejoin="round"/>
      <circle cx="78" cy="72" r="2.6" fill="#f3f7ec"/><circle cx="96" cy="64" r="2.6" fill="#f3f7ec"/><circle cx="116" cy="68" r="2.6" fill="#f3f7ec"/><circle cx="132" cy="78" r="2.6" fill="#f3f7ec"/><circle cx="88" cy="78" r="2.6" fill="#f3f7ec"/><circle cx="108" cy="76" r="2.6" fill="#f3f7ec"/>
      <path d="M62 166 L138 166 L142 206 L58 206 Z" fill="#fbf7ef" stroke="#c9bfae" stroke-width="2.4" stroke-linejoin="round"/><path d="M70 166 Q100 150 130 166" fill="none" stroke="#c9bfae" stroke-width="2.4"/>`,
    props: c => arm(c, 46, 150, 62, 176) + arm(c, 154, 150, 138, 176)
      + `<ellipse cx="100" cy="190" rx="30" ry="6" fill="#fff" stroke="#9fb7cf" stroke-width="2.4"/><path d="M80 166 L120 166 Q120 188 100 188 Q80 188 80 166 Z" fill="#fff" stroke="#9fb7cf" stroke-width="2.6" stroke-linejoin="round"/><path d="M82 174 L118 174" stroke="#6f97c4" stroke-width="2.6"/><path d="M120 170 Q130 170 128 178 Q126 184 118 182" fill="none" stroke="#9fb7cf" stroke-width="3"/>` + steam(88, 162, .55) + steam(112, 160, .55),
  };

  P.gamer = {
    name:'프로 게이머', note:'월드 5 · 「빠르고 시원한 소리」', mood:'윙크',
    c:{ skirt:'#86d3d9', side:'#64bec6', dish:'#d0f2f4', line:'#3e8f97', foot:'#2f6f76' },
    back: () => `<path d="M48 100 Q46 44 100 42 Q154 44 152 100" fill="none" stroke="#3c3c4e" stroke-width="9" stroke-linecap="round"/>
      <path d="M60 58 L56 30 L80 46 Z" fill="#3c3c4e" stroke="#2a2a38" stroke-width="2"/><path d="M62 54 L60 38 L74 47 Z" fill="#ff8fab"/>
      <path d="M140 58 L144 30 L120 46 Z" fill="#3c3c4e" stroke="#2a2a38" stroke-width="2"/><path d="M138 54 L140 38 L126 47 Z" fill="#ff8fab"/>`,
    front: () => `<rect x="38" y="98" width="20" height="32" rx="9" fill="#3c3c4e" stroke="#2a2a38" stroke-width="2.4"/><rect x="142" y="98" width="20" height="32" rx="9" fill="#3c3c4e" stroke="#2a2a38" stroke-width="2.4"/>
      <ellipse cx="48" cy="114" rx="5" ry="9" fill="#ff8fab"/><ellipse cx="152" cy="114" rx="5" ry="9" fill="#7ad7ff"/>
      <path d="M50 128 Q58 146 82 140" fill="none" stroke="#3c3c4e" stroke-width="3.2" stroke-linecap="round"/><circle cx="84" cy="140" r="4" fill="#2a2a38"/>
      <path d="M68 92 Q78 84 92 90" fill="none" stroke="#2f6f76" stroke-width="3" stroke-linecap="round"/>
      <path d="M66 168 L134 168 L136 182 L64 182 Z" fill="#2f6f76"/><path d="M90 168 L96 182 M104 168 L110 182" stroke="#ffd166" stroke-width="3"/>`,
    props: c => arm(c, 46, 150, 30, 178) + arm(c, 154, 148, 172, 130)
      + `<circle cx="174" cy="126" r="9" fill="${c.skirt}" stroke="${c.line}" stroke-width="3"/><path d="M168 120 L180 122 M167 126 L180 128" stroke="#fff" stroke-width="2.6"/>`
      + sparkle(182, 92, 1.1) + sparkle(24, 140, .8, '#ff8fab') + sparkle(192, 156, .6, '#7ad7ff'),
  };

  P.librarian = {
    name:'사서 할머니', note:'월드 6 · 「손주 키보드를 고쳐 주세요」', mood:'평온',
    c:{ skirt:'#7d8cc4', side:'#6878b0', dish:'#cdd5f2', line:'#44518a', foot:'#353f70' },
    back: () => `<circle cx="100" cy="44" r="18" fill="#d6d4d0" stroke="#a9a59e" stroke-width="2.6"/><path d="M84 36 L118 30" stroke="#b07a3a" stroke-width="3.4" stroke-linecap="round"/><circle cx="118" cy="30" r="3.4" fill="#e3a46a"/>`,
    front: () => `<path d="M60 92 Q62 62 100 60 Q138 62 140 92 Q132 78 100 76 Q68 78 60 92 Z" fill="#d6d4d0" stroke="#a9a59e" stroke-width="2.4" stroke-linejoin="round"/><path d="M76 74 Q86 68 96 72 M104 72 Q116 68 126 74" fill="none" stroke="#bdb9b2" stroke-width="2"/>
      <path d="M71 123 Q84 133 97 123 L97 121 L71 121 Z M103 121 L129 121 L129 123 Q116 133 103 123 Z" fill="#fff" fill-opacity=".35" stroke="#7a5a2e" stroke-width="2.6" stroke-linejoin="round"/><path d="M97 122 L103 122" stroke="#7a5a2e" stroke-width="2.4"/>
      <path d="M71 123 Q62 144 66 164 M129 123 Q138 144 134 164" fill="none" stroke="#c99a2e" stroke-width="2" stroke-dasharray="2 3"/>
      <path d="M40 162 Q70 176 100 168 Q130 176 160 162 L163 186 Q130 198 100 190 Q70 198 37 186 Z" fill="#d9776a" stroke="#a9524a" stroke-width="2.4" stroke-linejoin="round"/>
      <path d="M52 176 l4 4 l4 -4 M66 179 l4 4 l4 -4 M80 180 l4 4 l4 -4 M112 180 l4 4 l4 -4 M126 179 l4 4 l4 -4 M140 176 l4 4 l4 -4" fill="none" stroke="#f3c2b9" stroke-width="2"/>`,
    props: c => arm(c, 46, 150, 26, 168) + arm(c, 154, 150, 174, 168)
      + `<g transform="rotate(-14 18 176)"><rect x="2" y="166" width="30" height="20" rx="4" fill="#efe6d6" stroke="#8a7353" stroke-width="2.2"/><path d="M7 172 h5 m3 0 h5 m3 0 h5 M7 179 h5 m3 0 h5 m3 0 h5" stroke="#b9a582" stroke-width="2.4"/></g>
         <g transform="rotate(14 182 176)"><rect x="168" y="166" width="30" height="20" rx="4" fill="#efe6d6" stroke="#8a7353" stroke-width="2.2"/><path d="M173 172 h5 m3 0 h5 m3 0 h5 M173 179 h5 m3 0 h5 m3 0 h5" stroke="#b9a582" stroke-width="2.4"/></g>`,
  };

  P.composer = {
    name:'소리를 잃은 작곡가', note:'월드 7 · 「세상에 하나뿐인 소리」', mood:'슬픔',
    c:{ skirt:'#e8c56e', side:'#d4ac52', dish:'#f8e6ad', line:'#a8832a', foot:'#7c6020' },
    back: () => `<path d="M58 70 Q40 120 46 196 L62 196 Q56 130 66 80 Z" fill="#f4f1ea" stroke="#bdb5a6" stroke-width="2.4" stroke-linejoin="round"/><path d="M142 70 Q160 120 154 196 L138 196 Q144 130 134 80 Z" fill="#f4f1ea" stroke="#bdb5a6" stroke-width="2.4" stroke-linejoin="round"/>`,
    front: () => `<path d="M62 84 Q64 60 100 58 Q136 60 138 84 Q120 74 100 76 Q80 74 62 84 Z" fill="#f4f1ea" stroke="#bdb5a6" stroke-width="2.4" stroke-linejoin="round"/>
      <path d="M72 101 Q84 99 96 94 M104 94 Q116 99 128 101" fill="none" stroke="#f4f1ea" stroke-width="6" stroke-linecap="round"/><path d="M72 101 Q84 99 96 94 M104 94 Q116 99 128 101" fill="none" stroke="#bdb5a6" stroke-width="1.4" stroke-linecap="round"/>
      <path d="M76 140 Q86 128 100 134 Q114 128 124 140 Q128 168 100 182 Q72 168 76 140 Z" fill="#f4f1ea" stroke="#bdb5a6" stroke-width="2.4" stroke-linejoin="round"/>
      <path d="M90 150 Q92 162 98 170 M110 150 Q108 162 102 170" fill="none" stroke="#d8d1c3" stroke-width="2" stroke-linecap="round"/>`,
    props: c => arm(c, 46, 150, 30, 172) + arm(c, 154, 150, 170, 178)
      + `<g transform="rotate(-12 22 176)"><rect x="4" y="150" width="36" height="46" rx="2" fill="#f1e2bc" stroke="#9a8460" stroke-width="2.2"/><path d="M9 162 h26 M9 168 h26 M9 174 h26 M9 184 h26 M9 190 h26" stroke="#b9a582" stroke-width="1.2"/><circle cx="15" cy="171" r="2.6" fill="#5a4332"/><path d="M17.5 171 v-9" stroke="#5a4332" stroke-width="1.4"/><circle cx="27" cy="187" r="2.6" fill="#5a4332"/><path d="M29.5 187 v-9" stroke="#5a4332" stroke-width="1.4"/></g>`,
    faceNoMouth:true, mouthTop:true,
  };

  // ---------- 고양이 타닥이 (같은 선·눈 규칙) ----------
  function cat(mood){
    const L = '#b0814f', F = '#f8dfb4', S = '#e9a865';
    const eyes = mood === '놀람' ? EYE.wow(84, 112) + EYE.wow(116, 112)
      : mood === '기쁨' ? EYE.happy(84, 112) + EYE.happy(116, 112)
      : mood === '윙크' ? EYE.happy(84, 112) + EYE.normal(116, 112)
      : mood === '기본' ? EYE.normal(84, 112) + EYE.normal(116, 112)
      : mood === '걱정' ? EYE.worry(84, 112) + EYE.worry(116, 112)
      : mood === '슬픔' ? EYE.sad(84, 112) + EYE.sad(116, 112)
      : mood === '평온' ? EYE.calm(84, 112) + EYE.calm(116, 112)
      : `<path d="M77 113 L91 113 M109 113 L123 113" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/><text x="140" y="80" font-family="Jua,sans-serif" font-size="16" fill="#8a7353">z</text><text x="150" y="66" font-family="Jua,sans-serif" font-size="12" fill="#8a7353">z</text>`;
    return `<ellipse cx="100" cy="226" rx="60" ry="8" fill="#6b4a2a" opacity=".14"/>
      <path d="M140 204 Q182 200 176 160 Q172 136 156 146" fill="none" stroke="${L}" stroke-width="15" stroke-linecap="round"/><path d="M140 204 Q182 200 176 160 Q172 136 156 146" fill="none" stroke="${F}" stroke-width="9" stroke-linecap="round"/>
      <path d="M170 168 Q178 166 180 172 M172 184 Q180 184 180 190" fill="none" stroke="${S}" stroke-width="4" stroke-linecap="round"/>
      <path d="M62 210 Q52 160 74 140 L126 140 Q148 160 138 210 Z" fill="${F}" stroke="${L}" stroke-width="3.2" stroke-linejoin="round"/>
      <path d="M66 170 Q76 166 80 174 M134 170 Q124 166 120 174" fill="none" stroke="${S}" stroke-width="4" stroke-linecap="round"/>
      <ellipse cx="82" cy="210" rx="14" ry="9" fill="#fff" stroke="${L}" stroke-width="2.6"/><ellipse cx="118" cy="210" rx="14" ry="9" fill="#fff" stroke="${L}" stroke-width="2.6"/>
      <path d="M78 213 v4 M84 213 v4 M114 213 v4 M120 213 v4" stroke="${L}" stroke-width="1.6"/>
      <path d="M58 92 L62 44 L94 74 Z" fill="${F}" stroke="${L}" stroke-width="3.2" stroke-linejoin="round"/><path d="M64 80 L66 56 L84 72 Z" fill="#f6b3ab"/>
      <path d="M142 92 L138 44 L106 74 Z" fill="${F}" stroke="${L}" stroke-width="3.2" stroke-linejoin="round"/><path d="M136 80 L134 56 L116 72 Z" fill="#f6b3ab"/>
      <ellipse cx="100" cy="112" rx="50" ry="42" fill="${F}" stroke="${L}" stroke-width="3.2"/>
      <path d="M86 74 Q90 82 86 90 M100 70 Q104 80 100 90 M114 74 Q110 82 114 90" fill="none" stroke="${S}" stroke-width="4" stroke-linecap="round"/>
      <ellipse cx="74" cy="126" rx="8" ry="4.5" fill="#f4978e" opacity=".55"/><ellipse cx="126" cy="126" rx="8" ry="4.5" fill="#f4978e" opacity=".55"/>
      ${eyes}
      <path d="M96 124 L104 124 L100 129 Z" fill="#e8847b" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>
      ${mood === '슬픔' || mood === '걱정' ? `<path d="M93 137 Q100 131 107 137" fill="none" stroke="${INK}" stroke-width="2.2" stroke-linecap="round"/>` : mood === '놀람' ? `<ellipse cx="100" cy="135" rx="3.5" ry="4.5" fill="#c45a52" stroke="${INK}" stroke-width="2"/>` : mood === '평온' ? `<path d="M92 132 Q100 139 108 132" fill="none" stroke="${INK}" stroke-width="2.2" stroke-linecap="round"/>` : `<path d="M100 129 Q100 135 94 135 M100 129 Q100 135 106 135" fill="none" stroke="${INK}" stroke-width="2.2" stroke-linecap="round"/>`}
      <path d="M62 120 L40 116 M62 127 L40 130 M138 120 L160 116 M138 127 L160 130" stroke="${L}" stroke-width="1.8" stroke-linecap="round"/>
      <path d="M72 150 Q100 162 128 150" fill="none" stroke="#e0574f" stroke-width="6" stroke-linecap="round"/>
      <rect x="88" y="154" width="24" height="22" rx="5" fill="#dccbb0" stroke="#8a7353" stroke-width="2.2"/><rect x="91" y="156" width="18" height="14" rx="3" fill="#fffaf1"/>
      <text x="100" y="167" text-anchor="middle" font-family="Jua,sans-serif" font-size="9" fill="#6e523d">Esc</text>`;
  }

  function svg(id, mood){
    let inner;
    if (id === 'cat') inner = cat(mood || '졸림');
    else {
      const p = P[id], m = mood || p.mood;
      inner = (p.back ? p.back(p.c) : '') + body(p.c)
        + face(m, true, !!p.faceNoMouth, !!p.glasses)
        + p.front(p.c) + p.props(p.c)
        + (p.mouthTop ? `<g transform="translate(0 ${p.mouthY || 14})">${MOUTH[(MOODS[m] || MOODS.기본)[2]]}</g>` : '');
    }
    return `<svg viewBox="-6 -2 212 244" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;
  }
  const LIST = [{ id:'cat', name:'타닥이', note:'공방 고양이 · 목에 Esc 키캡 방울' }, ...Object.entries(P).map(([id, p]) => ({ id, name:p.name, note:p.note }))];
  return { svg, LIST, MOODS:Object.keys(MOODS) };
})();
