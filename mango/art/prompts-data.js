/* 제미나이 프롬프트 대장 — 「탐정 망고의 춤추는 대수사선」 사건 1
   규칙: PRD 0.7 ART-1~ART-10 / 바이블 9장. 파일명은 data/case-01.json 의 선언과 같아야 한다. */

export var STYLE = {
  cel: "hand-drawn 2D animation cel style, thick dark-brown outlines #4a3428 about 2.6px, flat matte colors with exactly one hard-edged shadow tone, big round eyes with a single tiny dot highlight, exaggerated proportions with head about 45% of body height, autumn muted palette (mustard #d6a83c, teal #3f7c86, brick #b34a3a, cream #fbf7ee, olive #7d8f5c), storybook children's book quality, plain flat cream #fbf7ee background, no gradient, no text, no watermark, no border",
  paint: "gouache painting on textured paper, visible brush strokes, no outlines, low saturation, warm late-afternoon light from the left, soft vignette at the corners, three clear depth layers (foreground / middle / far), autumn European-style small town of animals, storybook illustration, no characters, no people, no animals, no text, no watermark",
  icon: "single small object icon, hand-drawn cel style, thick dark-brown outline #4a3428, flat matte fill, one hard shadow tone, centered, isolated on plain flat cream #fbf7ee background, no shadow on the ground, no text, no label, no border, simple and readable at 28 pixels",
  ban: "금지: 실사풍, 3D 렌더, 그라데이션 배경, 글자·말풍선·서명, 사람(인간), 무기, 로고, 기존 애니메이션 작품 언급. 「지브리풍」·「디즈니풍」처럼 특정 작품 이름을 쓰지 않는다(ART-10)."
};

export var MANGO_ID = "white cat, dark grey cap-like marking on top of the head shifted to the RIGHT so the LEFT ear stays white, a brown tabby patch beside the RIGHT ear reaching down to the cheek, one white stripe from forehead down to the nose, yellow-green eyes #b9c96a, pink nose and inner ears, chubby pear-shaped body with short legs, teal vest #3f7c86, brick-red bow tie #b34a3a, brown leather satchel, brass magnifying glass, NO hat";

export var GROUPS = [

/* ───────────────────────── 1. 망고 ───────────────────────── */
{
  title: "1. 망고 — 주인공 (가장 먼저 확정할 것)",
  note: "망고는 이후 모든 그림의 기준이 된다. 4장이 다 나온 뒤 나란히 놓고 정체성 6요소가 흔들리지 않는지 확인하고, 흔들리면 그 장만 다시 뽑는다. 제미나이 대화 하나에서 4장을 연달아 뽑는 편이 인물 일관성이 좋다 — 첫 장이 마음에 들면 「같은 캐릭터로, 표정만 …으로 바꿔서」라고 이어서 요청한다.",
  items: [
    { file:"mango-def.png", label:"기본",
      p:"A friendly detective cat character, front-facing bust portrait from the chest up. "+MANGO_ID+", calm confident expression with a slight smile, eyes looking straight at the viewer. "+STYLE.cel },
    { file:"mango-sp.png", label:"놀람",
      p:"The SAME detective cat character, front-facing bust portrait, identical design and colors. "+MANGO_ID+", surprised expression: eyes wide open and round, mouth a small open circle, both ears perked straight up, one small exclamation-shaped tuft of fur standing up. "+STYLE.cel },
    { file:"mango-fl.png", label:"당황 (네 번째 칸 = 본성)",
      p:"The SAME detective cat character, front-facing bust portrait, identical design and colors. "+MANGO_ID+", flustered expression: eyes glancing away to the side, one eyebrow raised, a tiny nervous smile, two small sweat drops near the temple, ears tilted slightly back. "+STYLE.cel },
    { file:"mango-joy.png", label:"기쁨 (해결 화면)",
      p:"The SAME detective cat character, front-facing bust portrait, identical design and colors. "+MANGO_ID+", delighted expression: eyes closed into happy upward arcs, wide open smile, cheeks slightly rounded, holding the magnifying glass up beside the face. "+STYLE.cel },
    { file:"mango-full.png", label:"전신 (표지·홈 화면용)", size:"1024×1536",
      p:"Full body standing pose of the same detective cat character, three-quarter view, feet visible. "+MANGO_ID+", standing upright on two short legs, one paw holding the magnifying glass at chest height, leather satchel hanging at the hip, confident relaxed posture, tail curving up behind. "+STYLE.cel }
  ]
},

/* ───────────────────────── 2. 사건 1 인물 ───────────────────────── */
{
  title: "2. 사건 1 인물 6명",
  note: "실루엣 규칙(바이블 9.5): 기본 도형 + 돌출 요소 하나의 조합이 겹치면 안 된다. 4장을 뽑은 뒤 검은 실루엣만 나란히 놓고 구별되는지 확인한다. 표정은 def·sp·fl 세 장이 필수이고, 도토만 ang(분노)을 하나 더 만든다.",
  items: [
    { file:"kongi-def.png", label:"콩이 · 기본 — 너구리, 앞치마 없음",
      p:"An anthropomorphic raccoon girl as a school lunch helper, front-facing bust portrait. Wide round pot-shaped body, bushy ringed tail visible behind the shoulder, grey-brown fur with the classic dark raccoon eye mask, round black eyes, small dark nose, NOT wearing an apron (bare chest fur showing), neutral slightly stiff expression as if being questioned. "+STYLE.cel },
    { file:"kongi-sp.png", label:"콩이 · 놀람",
      p:"The SAME raccoon lunch helper character, identical design and colors, front-facing bust portrait, no apron. Startled expression: both eyes wide and round, mouth open in a small gasp, tail fur puffed up. "+STYLE.cel },
    { file:"kongi-fl.png", label:"콩이 · 거짓말 눈굴림 (반박당한 순간)",
      p:"The SAME raccoon lunch helper character, identical design and colors, front-facing bust portrait, no apron. Caught-in-a-lie expression: pupils rolled up and to the upper corner avoiding the viewer, a forced stiff smile, three sweat drops on the forehead, shoulders slightly hunched. "+STYLE.cel },

    { file:"kongsun-def.png", label:"콩순이 · 기본 — 같은 너구리 + 연분홍 앞치마 + 머리 리본",
      p:"An anthropomorphic raccoon girl as a school lunch helper, TWIN of the previous raccoon with identical face and body shape, front-facing bust portrait. Wide round pot-shaped body, bushy ringed tail, classic dark raccoon eye mask, wearing a PALE PINK apron with shoulder straps, and a small brick-red ribbon on top of the head between the ears. Calm innocent expression. "+STYLE.cel },
    { file:"kongsun-sp.png", label:"콩순이 · 놀람 (묵 얼룩을 들켰을 때)",
      p:"The SAME twin raccoon character with the pale pink apron and head ribbon, identical design and colors, front-facing bust portrait. Shocked expression: eyes wide, both paws raised to the cheeks, mouth a small round O, ears flattened sideways. "+STYLE.cel },
    { file:"kongsun-fl.png", label:"콩순이 · 눈굴림",
      p:"The SAME twin raccoon character with the pale pink apron and head ribbon, identical design and colors, front-facing bust portrait. Evasive expression: eyes looking down and to the side, lips pressed into a thin line, two sweat drops, one paw fidgeting with the apron strap. "+STYLE.cel },

    { file:"doto-def.png", label:"도토 · 기본 — 다람쥐, 도토리 하나",
      p:"An anthropomorphic squirrel as a grumpy tree-house landlord, front-facing bust portrait. Tall narrow vertical body, very large fluffy tail curving up behind the head (the tail is the biggest shape in the picture), reddish-brown fur, cream chest, tufted ear tips, holding ONE acorn in both front paws at chest height, sleepy half-lidded eyes, slight frown. "+STYLE.cel },
    { file:"doto-sp.png", label:"도토 · 놀람",
      p:"The SAME squirrel landlord character, identical design and colors, front-facing bust portrait, still holding one acorn. Startled awake expression: eyes suddenly wide open and round, tail fur bristling outward, mouth open in a small gasp. "+STYLE.cel },
    { file:"doto-ang.png", label:"도토 · 분노 (네 번째 칸 = 본성)",
      p:"The SAME squirrel landlord character, identical design and colors, front-facing bust portrait, gripping the acorn tightly. Furious expression: eyebrows slammed down into a deep V, eyes narrowed and blazing, mouth wide open shouting showing small front teeth, cheeks flushed red, tail bristled straight up, two small anger puff marks beside the head. "+STYLE.cel },
    { file:"doto-fl.png", label:"도토 · 당황 (선택)",
      p:"The SAME squirrel landlord character, identical design and colors, front-facing bust portrait. Taken-aback expression: eyes blinking wide, mouth a small wavy line, one paw scratching the back of the head, the acorn tucked under the other arm. "+STYLE.cel },

    { file:"mori-def.png", label:"모리 · 기본 — 두더지 사서, 눈은 반드시 내리깐 채",
      p:"An anthropomorphic mole as a shy village librarian, front-facing bust portrait. Small simple round body with NO protruding silhouette feature, dark grey velvet fur, small pink nose, round spectacles, hugging a stack of books against the chest, wearing a mustard cardigan. IMPORTANT: the eyes are cast DOWNWARD behind the glasses, never meeting the viewer, gentle timid expression. Small detail: dried pale earth smudged on the cuff of the sleeve, and a faint reflection of a large tree in one lens. "+STYLE.cel },
    { file:"mori-sp.png", label:"모리 · 놀람 (눈은 여전히 내리깐 채)",
      p:"The SAME mole librarian character, identical design and colors, front-facing bust portrait, hugging books. Startled but still shy: shoulders jumping up, mouth a small open circle, ears tucked back — CRITICAL: the eyes remain cast DOWNWARD behind the glasses, they must NOT look at the viewer. "+STYLE.cel },
    { file:"mori-fl.png", label:"모리 · 당황 (땀 두 방울 · 볼 홍조)",
      p:"The SAME mole librarian character, identical design and colors, front-facing bust portrait, hugging books tighter. Flustered expression: two clear sweat drops on the forehead, both cheeks blushing pink, mouth a small wavy nervous line — CRITICAL: the eyes stay cast DOWNWARD behind the glasses, never looking at the viewer. "+STYLE.cel },

    { file:"sheep-def.png", label:"양 아주머니 · 기본 — 의뢰인, 급식실장",
      p:"An anthropomorphic sheep as a kind middle-aged school cafeteria manager, front-facing bust portrait. Low wide rounded silhouette made of soft cloud-like curly cream wool, gentle dark eyes with horizontal pupils, small tan muzzle, short curved horns, wearing a cream apron over an olive dress and a headscarf pushed back, warm worried-but-composed expression. "+STYLE.cel },
    { file:"sheep-sp.png", label:"양 아주머니 · 놀람",
      p:"The SAME sheep cafeteria manager character, identical design and colors, front-facing bust portrait. Surprised expression: eyes wide, both hooves raised to the mouth, wool slightly puffed. "+STYLE.cel },
    { file:"sheep-fl.png", label:"양 아주머니 · 난처함 (네 번째 칸)",
      p:"The SAME sheep cafeteria manager character, identical design and colors, front-facing bust portrait. Troubled awkward expression: eyes crinkled with worry, a strained apologetic smile, one hoof rubbing the back of the neck, a single sweat drop. "+STYLE.cel },

    { file:"bami-def.png", label:"밤이 · 기본 — 조수 고슴도치 (사건 5 이후, 지금 만들어 둬도 됨)",
      p:"An anthropomorphic young hedgehog as an eager apprentice detective, front-facing bust portrait. Round body covered in short spiky quills forming a spiky circular silhouette, warm brown quills with a cream face, huge sparkling round eyes, tiny black nose, holding a SMALL magnifying glass up beside the face, wearing a tiny teal scarf, bright excited expression with an open smile. "+STYLE.cel },
    { file:"bami-sp.png", label:"밤이 · 놀람",
      p:"The SAME apprentice hedgehog character, identical design and colors, front-facing bust portrait. Amazed expression: eyes enormous and sparkling, mouth wide open in a delighted gasp, quills standing up, small magnifying glass raised higher. "+STYLE.cel },
    { file:"bami-fl.png", label:"밤이 · 신남 (네 번째 칸)",
      p:"The SAME apprentice hedgehog character, identical design and colors, front-facing bust portrait. Over-excited expression: eyes turned into sparkling stars, both arms thrown up, mouth in a huge open grin, quills fanned out, small motion lines around the head. "+STYLE.cel }
  ]
},

/* ───────────────────────── 3. 배경 ───────────────────────── */
{
  title: "3. 사건 1 배경 — 급식실 (가로 2:1)",
  note: "확대경으로 훑는 화면이라 가장 공들일 그림이다. 제미나이가 물건을 정확한 자리에 놓아 주지는 않으므로, 순서를 반대로 한다 — 먼저 마음에 드는 배경을 얻고, 그 다음 art/spots.html 로 조사 지점 좌표를 그림에 맞춰 다시 찍는다. 배경 프롬프트는 「무엇이 화면 어디쯤에 있어야 하는가」까지 적어 두되, 어긋나면 좌표를 고치는 쪽이 빠르다.",
  items: [
    { file:"scene-01-cafeteria.webp", label:"급식실 (본 배경)", size:"1440×720 → WebP 200KB 이하",
      p:"Interior of an elementary school cafeteria kitchen in an autumn animal village, empty of any characters, horizontal 2:1 composition. LEFT THIRD: a tall window with an inner latch, a wooden windowsill, a plain wooden chair below it, pale afternoon light pouring in. CENTER: a long stainless serving counter running left to right with one obviously empty wet patch on its surface, a cork notice board on the wall above with a freshly pasted notice, a stainless sink area behind, a row of apron hooks on the wall with one hook conspicuously EMPTY, a refrigerator beside it. RIGHT THIRD: a heavy back door standing slightly ajar with a push-bar on the inside and no outer handle, and beyond it a glimpse of the back yard — a flower bed, an empty round food tub lying on its side, and a large acorn tree. FLOOR: a faint trail of crumbs running from the serving counter toward the back door. "+STYLE.paint },
    { file:"scene-01-cafeteria-night.webp", label:"같은 급식실 · 해결 장면용 (선택)", size:"1440×720",
      p:"The SAME elementary school cafeteria kitchen interior, identical layout and furniture, empty of characters, horizontal 2:1 composition, but now lit by warm evening light — deep amber light through the window, longer soft shadows, the back door closed. "+STYLE.paint }
  ]
},

/* ───────────────────────── 4. 표지 ───────────────────────── */
{
  title: "4. 표지",
  note: "첫 화면 배경으로 깔린다. 글자는 게임이 얹으므로 그림에 제목을 넣지 않는다. 가운데 위쪽은 카드가 덮으므로, 중요한 것을 화면 정중앙에 두지 않는 편이 좋다.",
  items: [
    { file:"cover-01.webp", label:"표지 (첫 화면 배경)", size:"1440×720 → WebP 250KB 이하",
      p:"Title-screen illustration for a children's detective mystery game, horizontal 2:1 composition, empty middle area left clear for a title card. An autumn animal village square at dusk seen from a low angle: a great old zelkova tree with golden leaves on the right, warm lantern light, cobblestones, a small detective office window glowing on the left, scattered fallen leaves in the foreground, a long thin shadow of a small cat with a magnifying glass stretching across the cobblestones from the bottom edge. Mysterious but gentle and inviting, not scary. "+STYLE.paint },
    { file:"icon-app.png", label:"앱 아이콘 (홈 화면 추가용)", size:"512×512",
      p:"App icon: a brass magnifying glass overlapping a single golden autumn zelkova leaf, centered on a flat cream #fbf7ee circle with a thick dark-brown outline, simple bold shapes readable at 48 pixels. "+STYLE.icon }
  ]
},

/* ───────────────────────── 5. 단서 아이콘 ───────────────────────── */
{
  title: "5. 단서 아이콘 16종 — 수첩·추리 칸에 28px로 들어간다",
  note: "작게 보이므로 물건 하나만, 굵은 선으로. 제미나이에 한 번에 여러 개를 시키면 스타일이 흔들리니 「같은 스타일로 다음 물건」을 이어서 요청한다. 증언 카드(말풍선 5종)는 말풍선 안의 그림만 바뀐다.",
  items: [
    { file:"clue-stand.png", label:"배식대의 젖은 자국",
      p:"A short section of a stainless steel serving counter seen at a slight angle, with one glistening wet ring-shaped patch on top where something round used to sit. "+STYLE.icon },
    { file:"clue-crumbs.png", label:"부스러기 자국",
      p:"A short curved trail of small pale brown crumbs on a floor, about seven crumbs getting smaller toward one end. "+STYLE.icon },
    { file:"clue-door.png", label:"뒷문 밀대",
      p:"A heavy door seen from the inside with a horizontal push-bar across it and a small arrow showing it opens outward, no handle on the far side. "+STYLE.icon },
    { file:"clue-strap.png", label:"뒷문의 크림색 끈",
      p:"A cream-colored fabric apron tie-string caught and dangling on a door handle, the loose end hanging down. "+STYLE.icon },
    { file:"clue-window.png", label:"창문 걸쇠",
      p:"A close view of a window frame corner with a small metal latch hook fastened shut on the inside. "+STYLE.icon },
    { file:"clue-print.png", label:"창턱 바깥의 붉은 발자국",
      p:"One very small five-toed animal footprint pressed in reddish-brown earth on a wooden ledge, the toes pointing toward the viewer. "+STYLE.icon },
    { file:"clue-tub.png", label:"화단의 빈 묵 통",
      p:"An empty round food tub lying tipped on its side, showing TWO handles one on each side, a little soil on the rim. "+STYLE.icon },
    { file:"clue-hook.png", label:"앞치마 걸이",
      p:"A wall-mounted row of three coat hooks, two with folded cloth hanging and the middle one conspicuously empty. "+STYLE.icon },
    { file:"clue-sink.png", label:"설거지실",
      p:"A deep stainless dish sink with a stack of clean plates beside it and a faucet above, small soap bubbles. "+STYLE.icon },
    { file:"clue-stain.png", label:"콩순이 앞치마의 얼룩",
      p:"A folded pale pink apron with one irregular brownish-grey stain on the front. "+STYLE.icon },
    { file:"clue-finger.png", label:"냉장고의 지문",
      p:"A refrigerator door handle with two glowing fingerprint smudges on it, shown with faint concentric ridge lines. "+STYLE.icon },
    { file:"clue-say-lock.png", label:"증언 · 앞문을 잠갔다",
      p:"A rounded speech bubble outline containing a small closed padlock on a door. "+STYLE.icon },
    { file:"clue-say-helpers.png", label:"증언 · 도우미 둘은 설거지실",
      p:"A rounded speech bubble outline containing two tiny identical raccoon silhouettes standing side by side beside a sink. "+STYLE.icon },
    { file:"clue-say-tub.png", label:"증언 · 통은 둘이 든다",
      p:"A rounded speech bubble outline containing a round tub with two hands, one gripping each handle on opposite sides. "+STYLE.icon },
    { file:"clue-say-doto.png", label:"증언 · 회색 꼬리",
      p:"A rounded speech bubble outline containing a single bushy GREY ringed tail disappearing around a corner. "+STYLE.icon },
    { file:"clue-say-wiped.png", label:"증언 · 창턱은 어제 닦았다",
      p:"A rounded speech bubble outline containing a cloth wiping a window ledge with a small shine mark. "+STYLE.icon }
  ]
}
];
