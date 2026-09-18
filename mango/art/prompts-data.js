/* 제미나이 프롬프트 대장 — 「탐정 망고의 춤추는 대수사선」 사건 1
   규칙: PRD 0.7 ART-1~ART-10 / 바이블 9장. 파일명은 data/case-01.json 의 선언과 같아야 한다. */

export var STYLE = {
  cel: "hand-drawn 2D animation cel style, thick dark-brown outlines #4a3428 about 2.6px, flat matte colors with exactly one hard-edged shadow tone, big round eyes with a single tiny dot highlight, exaggerated proportions with head about 45% of body height, autumn muted palette (mustard #d6a83c, teal #3f7c86, brick #b34a3a, cream #fbf7ee, olive #7d8f5c), storybook children's book quality, plain flat cream #fbf7ee background, no gradient, no text, no watermark, no border",
  paint: "gouache painting on textured paper, visible brush strokes, no outlines, low saturation, warm late-afternoon light from the left, soft vignette at the corners, three clear depth layers (foreground / middle / far), autumn European-style small town of animals, storybook illustration, no characters, no people, no animals, no text, no watermark",
  icon: "single small object icon, hand-drawn cel style, thick dark-brown outline #4a3428, flat matte fill, one hard shadow tone, centered, isolated on plain flat cream #fbf7ee background, no shadow on the ground, no text, no label, no border, simple and readable at 28 pixels",
  ban: "금지: 실사풍, 3D 렌더, 그라데이션 배경, 글자·말풍선·서명, 사람(인간), 무기, 로고, 기존 애니메이션 작품 언급. 「지브리풍」·「디즈니풍」처럼 특정 작품 이름을 쓰지 않는다(ART-10). 망고의 머리 위 회색은 실제 고양이의 털 무늬다 — 모자로 그려지면 다시 뽑거나 꼭지를 지워야 한다(ART-2)."
};

export var MANGO_ID = "white cat, a dark grey FUR MARKING on top of the head — it is fur, not clothing: flat against the head with soft irregular fur edges, NO hat, NO cap, no brim, no seam, and nothing sticking up on top — shifted to the RIGHT so the LEFT ear stays white, a brown tabby patch beside the RIGHT ear reaching down to the cheek, one white stripe from forehead down to the nose, yellow-green eyes #b9c96a, pink nose and inner ears, chubby pear-shaped body with short legs, teal vest #3f7c86, brick-red bow tie #b34a3a, brown leather satchel, brass magnifying glass, NO hat";

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
  note: "★★ 망고를 두 번 뽑아 보고 정한 순서 — 반드시 두 단계로 갑니다. ① 먼저 기본 표정 한 장만 뽑아 마음에 들 때까지 고칩니다(아래 인물별 프롬프트 사용). ② 그 그림을 제미나이에 첨부하고 「이 캐릭터 그대로, 표정만 바꿔 2x2로」 주문합니다. 왜 두 단계인가: 표정을 낱장으로 따로 주문하면 머리 크기·팔 자세·소품 위치가 칸마다 달라져 게임에서 표정이 바뀔 때 얼굴이 툭 튑니다. 반대로 「모든 칸이 똑같아야 한다」를 글로만 앞세우면 모델이 똑같이 그리기 쉬운 쪽으로 캐릭터를 깎아 버립니다 — 망고의 회색 무늬·코 흰 줄·수염이 사라지고 확대경이 가슴 목걸이가 됐습니다. 기준 그림을 첨부하면 둘 다 막힙니다. 용의자는 반박 성공 시 표정이 바뀌는 게 연출의 핵심이므로 이 순서를 꼭 지킵니다. 받은 시트 한 장은 art/slice-sheet.py 가 칸을 찾아 머리 크기와 윤곽으로 정렬해 파일로 만듭니다. ★ 칸 사이를 반드시 띄워 달라고 하세요 — 인물이 붙어 있으면 자르는 선이 팔·꼬리를 지나가 조각이 테두리에 남고, 초상을 머리·목까지만 잡아야 합니다(콩이에서 실제로 발생). 실루엣 규칙(바이블 9.5): 네 칸을 검은 실루엣으로 바꿔 다른 인물과 구별되는지 확인합니다.",
  items: [
    { file:"(2단계) <이름>-sheet.png", label:"★ 2단계 — 마음에 든 그림을 첨부하고 이 글을 넣으세요", size:"2x2 한 장",
      p:"※ 첨부하는 그림은 반드시 <b>그 인물 자신의 1단계 그림</b>이어야 합니다. 다른 인물(예: 망고)의 그림을 첨부하면 그 인물의 옷과 소품이 따라옵니다 — 콩이에 망고 그림을 첨부했다가 급식 도우미가 탐정 조끼와 확대경을 들고 나왔습니다.\n\nUse the attached image as the exact character reference. Keep this character's design EXACTLY as drawn — same fur markings and their exact placement, same eyes, same clothing and props EXACTLY as in the attached image and nothing else added, same thick dark-brown outline weight, same flat matte colors.\n\nDraw this same character FOUR times in a 2x2 grid, front-facing bust portraits, evenly spaced on one continuous plain flat cream #fbf7ee background with no dividing lines, no borders, no text. Leave a clear empty gap between the panels — the figures must NOT touch or overlap each other.\n\nThe head must be the SAME SIZE and at the SAME HEIGHT in all four (identical eye line), the body and arms in the SAME pose, every prop in the SAME position. ONLY the face changes:\n\nTop-left: the character's calm default expression.\nTop-right: surprised — eyes wide and round, mouth a small open circle, ears perked up.\nBottom-left: [네 번째 칸 — 인물의 본성을 여기에. 콩순이=눈굴림 / 도토=분노 / 모리=당황(눈은 내리깐 채) / 양 아주머니=난처함 / 밤이=신남]\nBottom-right: [필요하면 네 번째 표정을 더. 없으면 이 줄을 지우고 2x2 대신 1x3 으로 주문]\n\nDo not redesign, simplify, or prettify the character. Do not change the fur markings. Match the reference drawing." },
    { file:"(1단계)", label:"★ 1단계 — 먼저 기본 표정 한 장만",
      p:"아래 인물별 프롬프트 중 「기본」 한 장만 먼저 뽑으세요. 무늬 위치·소품·선 굵기가 마음에 들 때까지 이 한 장만 고칩니다. 이 그림이 그 인물의 기준이 되므로, 여기서 타협하면 표정 네 칸이 전부 그 상태로 굳습니다. 마음에 들면 그 파일을 첨부해 위의 2단계 프롬프트를 넣으세요 — 첨부는 반드시 그 인물 자신의 그림입니다. 1단계에서는 아무 그림도 첨부하지 않습니다(다른 인물 그림이 섞이면 옷과 소품이 옮겨 붙습니다). 받은 시트 한 장을 올려 주시면 칸을 잘라 눈 위치를 맞춰 파일로 만들어 드립니다." },
    { file:"kongi-def.png", label:"콩이 · 기본 — 너구리, 앞치마 없음",
      p:"An anthropomorphic raccoon girl as an elementary school lunch helper, front-facing bust portrait from the chest up, single figure, centered. Wide round pot-shaped body, short arms, a bushy ringed tail curving up behind one shoulder, grey-brown fur with the classic dark raccoon eye mask, round black eyes, small dark nose, small rounded ears. CLOTHING — she is a lunch helper, NOT a detective: a simple short-sleeved cream shirt and nothing else. NO vest, NO bow tie, NO bag or strap, NO magnifying glass, NO apron, NO hat, no accessories of any kind. Her hands are empty and rest at her sides. Expression: neutral and slightly stiff, as if being questioned about something she did. "+STYLE.cel },
    { file:"kongi-sp.png", label:"콩이 · 놀람",
      p:"The SAME raccoon lunch helper character, identical design and colors, front-facing bust portrait, no apron. Startled expression: both eyes wide and round, mouth open in a small gasp, tail fur puffed up. "+STYLE.cel },
    { file:"kongi-fl.png", label:"콩이 · 거짓말 눈굴림 (반박당한 순간)",
      p:"The SAME raccoon lunch helper character, identical design and colors, front-facing bust portrait, no apron. Caught-in-a-lie expression: pupils rolled up and to the upper corner avoiding the viewer, a forced stiff smile, three sweat drops on the forehead, shoulders slightly hunched. "+STYLE.cel },

    { file:"kongsun-STEP1.png", label:"콩순이 · 1단계 — 기본 한 장 (★ 콩이 기본 그림을 첨부할 것)",
      note:"쌍둥이라 얼굴·몸이 콩이와 같아야 하므로, 이 인물만은 1단계에서 콩이의 기본 그림을 첨부한다. 얼룩은 반드시 갈색 — 도토리묵이다. 빨간 얼룩(김치)으로 나오면 추리가 무너지므로 다시 뽑는다.",
      p:"Using the attached raccoon as the exact reference, draw her TWIN SISTER: keep the face, head shape, eye mask, fur colors, body shape and tail identical to the attached image. One single front-facing bust portrait, calm innocent expression. Two changes only: (1) she wears a PALE PINK apron with shoulder straps over the same cream shirt, and the apron has TWO soft BROWN blotches on the chest — a larger one and a smaller one beside it, the muddy brown color of acorn jelly, clearly BROWN and absolutely NOT red, NOT orange, NOT pink; (2) a small brick-red ribbon #b34a3a sits on top of her head between the ears. She is NOT a detective — no vest, no bow tie, no bag, no magnifying glass, no hat. Paws resting at her sides so the apron stains stay fully visible. "+STYLE.cel },

    { file:"kongsun-SHEET.png", label:"콩순이 · 2단계 — 표정 3칸 (★ 승인된 콩순이 1단계 그림을 첨부할 것)",
      note:"첨부는 반드시 콩순이 자신의 1단계 그림. 다른 인물 그림을 붙이면 복장이 옮겨 붙는다. 받은 파일은 art/slice-sheet.py <파일> kongsun def,sp,fl 로 자른다.",
      p:"Using the attached character as the exact reference, draw the SAME raccoon girl three times in one image, side by side in a single row, in this order: (1) calm innocent, looking straight ahead; (2) shocked — eyes wide, both paws raised to the cheeks, mouth a small round O, ears flattened sideways; (3) evasive — eyes looking down and to the side, lips pressed into a thin line, two sweat drops on the temple. Keep her face, body, pale pink apron, the TWO BROWN blotches on the apron, and the brick-red head ribbon exactly as in the attached image in all three panels — same size, same colors, same line weight. Leave a clear empty gap between the panels — the figures must NOT touch or overlap each other. Plain flat cream #fbf7ee background, no panel borders, no frames, no text, no labels. "+STYLE.cel },

    { file:"doto-STEP1.png", label:"도토 · 1단계 — 기본 한 장 (★ 콩이 기본 그림을 「스타일 참고용」으로 첨부)",
      note:"★ 새 동물 종은 첨부 없이 뽑으면 스타일이 무너진다 — 도토를 글로만 주문했더니 외곽선이 거의 없고(진한 선 3.6% · 기준 18~20%) 채도가 두 배(0.52 · 기준 0.26~0.32)인 다른 화풍이 나왔고, 인물이 화면을 98% 채워 꼬리가 잘렸다. 그래서 승인된 인물 그림을 붙이되 「베낄 것은 화풍뿐」을 명시한다. 종·얼굴·복장을 베끼지 말라고 못박지 않으면 콩이가 망고 옷을 입고 나왔던 일이 되풀이된다. ★ 꼬리는 또렷한 갈색에 고리 무늬가 없어야 한다 — 도토를 지우는 근거가 「나간 건 회색 꼬리였는데 도토는 갈색이다」 하나뿐이다.",
      p:"The attached picture is a STYLE REFERENCE ONLY. Copy from it: the thick uniform dark-brown outline weight, the flat matte fill with exactly one hard-edged shadow tone, the eye style, the head-to-body proportion, the low-saturation muted palette, the framing and the plain background. Do NOT copy the animal species, the face, the clothing or any props from it. Draw a completely different animal: an anthropomorphic SQUIRREL as a grumpy tree-house landlord — not a raccoon. One single front-facing bust portrait. Tall narrow vertical body, very large fluffy tail curving up behind the head; the tail is the biggest shape in the picture. The tail and body fur are a MUTED, DESATURATED reddish-brown, clearly BROWN and absolutely NOT grey and NOT bright orange; the tail is ONE SOLID BROWN with NO rings, NO stripes and NO bands of any kind. Cream chest FUR — he wears no shirt and no clothing at all. Tufted ear tips, holding ONE acorn in both front paws at chest height. Large eyes with heavy drooping upper lids and a single tiny dot highlight in each, plus a slight frown — grumpy and just woken from a nap. He is NOT a detective: no vest, no bow tie, no bag, no magnifying glass, no hat. Thick dark-brown outlines #4a3428 about 2.6px on every edge including the tail. NO gradients, NO airbrushed or soft shading, NO glossy highlights. Show the WHOLE figure including the entire tail, with a generous empty margin on all four sides — nothing may touch or be cut off by the edge of the picture. "+STYLE.cel },

    { file:"doto-SHEET.png", label:"도토 · 2단계 — 표정 3칸 (★ 승인된 도토 1단계 그림을 첨부할 것)",
      note:"★ 꼬리 큰 인물은 「칸마다 꼬리 필수」와 「칸 사이 띄우기」가 서로 부딪힌다. 1차: 꼬리를 칸마다 요구하지 않아 놀람 칸에만 꼬리가 생겼다(기본 초상에 꼬리가 없으면 「도토는 갈색이야」 소거 근거를 볼 수 없다). 2차: 꼬리를 요구하니 세 칸 모두 꼬리가 생겼지만 꼬리가 옆으로 뻗어 인물이 붙었고, 꼬리가 옆 머리까지 닿아 머리 분리 침식이 통하지 않아 자르기가 실패했다. 해법은 꼬리를 옆이 아니라 몸 뒤로 세우고 인물을 작게 그리게 하는 것이다 — 3차에서 통과(머리 중심 흔들림 1.5px). 이래도 붙어 나오면 표정을 한 장씩 따로(매번 1단계 그림을 첨부) 받아 slice-sheet.py 로 정렬한다 — 첨부가 있으면 낱장도 정렬된다. 첨부는 반드시 도토 자신의 1단계 그림. 분노 칸(doto-ang)은 게임이 쓰는 곳이 없어 만들지 않는다. 받은 파일은 art/slice-sheet.py <파일> doto def,sp,fl 로 자른다.",
      p:"Using the attached character as the exact reference, draw the SAME squirrel three times in one image, side by side in a single row, in this order: (1) sleepy and grumpy, half-lidded eyes, slight frown, looking straight ahead; (2) startled awake — eyes suddenly wide open and round, mouth open in a small gasp; (3) taken aback — eyes blinking wide, mouth a small wavy line, one paw scratching the back of the head. Every panel must show his large bushy tail — one solid muted reddish-brown with NO rings, NO stripes and NO bands. IMPORTANT: in every panel the tail rises straight up BEHIND his head and body, like a plume directly behind him, and does NOT sweep out to the left or right. Keep his face, body, the cream chest and the single acorn exactly as in the attached image in all three panels — same size, same colors, same line weight. Draw the three figures SMALL, each one filling only the middle of its own third of the picture, so that there is a wide band of empty cream background between them: no part of one figure, tail included, may touch, overlap or reach into a neighbouring figure, and the gap between two figures must be at least as wide as one of their heads. Plain flat cream #fbf7ee background, no panel borders, no frames, no text, no labels. "+STYLE.cel },

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
    { file:"scene-01-cafeteria.webp", label:"급식실 (본 배경) — 단서 10곳이 그림 안에 있어야 한다",
      note:"★ 이 그림은 단서 목록이다. 바닥 부스러기는 반드시 갈색이어야 한다 — 「pale crumbs」라고 썼더니 흰 부스러기가 나왔는데, 앞치마 얼룩 단서가 「김치는 빨간데 이건 갈색, 도토리묵 색」으로 추리를 맺으므로 같은 묵이 두 색으로 보이면 안 된다. 조사 지점 10곳이 실제로 그려져 있지 않으면 확대해도 볼 것이 없다. 특히 세 가지는 추리의 근거라 틀리면 게임이 거짓말을 한다 — ① 앞치마 걸이는 정확히 두 개이고 둘 다 비어 있어야 한다(하나라도 걸려 있으면 「사라진 건 크림색」이 무너진다) ② 통은 양쪽에 손잡이가 하나씩이어야 한다(「둘이 들어야 한다」의 유일한 근거) ③ 창턱 바깥 발자국은 붉은 흙, 뒷마당 흙은 검은 흙 — 두 색이 구별되어야 두더지 감정으로 이어진다. 뒷문은 안쪽에만 밀대가 있고 바깥에는 손잡이가 없어야 하며, 끈은 손잡이가 아니라 문 바깥쪽 가장자리에 걸린다. 받은 뒤 art/make-bg.py 로 2:1·WebP 로 맞추고, art/spots.html 로 조사 지점 좌표를 그림에 맞춰 다시 찍는다.",
      p:"Interior of an elementary school cafeteria kitchen in an autumn animal village, completely empty of any characters, horizontal 2:1 composition, viewed straight on from inside the room. LEFT: a tall window with a clearly visible INNER latch fastened shut, a wooden windowsill; on the OUTER ledge of that sill, a few very small footprints in REDDISH-BROWN earth with the toes pointing INWARD toward the room; a plain wooden chair standing below the window. LEFT OF CENTRE: a long stainless steel serving counter running left to right, bare, with one obvious DAMP PATCH on its surface where something round used to stand. UPPER LEFT OF CENTRE: a cork notice board on the wall with one freshly pasted notice, the paste still wet and glossy at the edges. CENTRE: a refrigerator; behind it a stainless sink area where the washing-up is HALF finished — clean dishes stacked and drying on one side, dirty dishes still in the basin on the other; on the wall above, EXACTLY TWO apron hooks, and BOTH hooks are completely EMPTY. FLOOR: a faint trail of crumbs running along the floor from the serving counter toward the back door; the crumbs are the muddy BROWN colour of acorn jelly, the same brown as the stain on the apron, never white and never pale. RIGHT: a heavy back door standing ajar, with a push-bar on the INSIDE face and NO handle at all on the outside; a cream-coloured fabric apron tie is snagged on the outer EDGE of that door, not on any handle. BEYOND THE DOOR, the back yard: soil that is clearly DARK, almost black, in a flower bed; lying on its side in that flower bed an empty round food tub with ONE STURDY HANDLE ON EACH OF ITS TWO SIDES; and further back a large acorn tree. Keep every one of these objects clearly readable and unobstructed, since the player inspects them under a magnifying glass. "+STYLE.paint },

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
