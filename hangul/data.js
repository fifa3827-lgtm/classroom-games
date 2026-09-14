/* ============================================================
   쵸코와 한글 · 데이터 파일
   선생님이 직접 고쳐 쓸 수 있는 부분입니다. index.html은 건드리지 않아도 됩니다.
   ============================================================ */

window.HANGUL_DATA = {

  /* ---------- 설정 ---------- */
  config: {
    appName: "쵸코와 한글",
    teacherPin: "1234",          // 선생님 모드 비밀번호 (홈에서 쵸코를 5번 톡톡)
    studentCode: "cat01",        // 시트에 기록될 학생 별칭 (실명 금지)
    sheetUrl: "",                // 구글 Apps Script 웹앱 주소. 비우면 기기 안에만 저장
    speechRate: 0.85,            // 소리 속도 (0.5 ~ 1.2)
    englishHint: true,           // 낱말 카드에 영어 뜻 표시
    questionsPerActivity: 6,     // 활동 하나에 문제 수
    unlockedStages: [1]          // 열린 단계. 선생님 모드에서 바꿀 수 있음
  },

  /* ---------- 단계 ---------- */
  stages: [
    { id: 1, name: "소리 마을", sub: "자음과 모음의 소리", color: "mint" },
    { id: 2, name: "글자 공방", sub: "자음 + 모음 = 글자", color: "peach", soon: true },
    { id: 3, name: "받침 숲", sub: "받침이 있는 글자", color: "lavender", soon: true },
    { id: 4, name: "이야기 언덕", sub: "낱말과 문장 읽기", color: "yellow", soon: true }
  ],

  /* ---------- 자모 ----------
     ch: 글자 / say: 소리 낼 때 읽는 말 / name: 글자 이름
     words: 이 소리로 시작하는 그림 낱말 [글자, 그림, 영어]
  */
  jamo: {
    "ㅏ": { say: "아", name: "아", type: "v", words: [["아기", "👶", "baby"], ["아빠", "👨", "dad"]] },
    "ㅓ": { say: "어", name: "어", type: "v", words: [["어머니", "👩", "mother"], ["어항", "🐠", "fish tank"]] },
    "ㅗ": { say: "오", name: "오", type: "v", words: [["오리", "🦆", "duck"], ["오이", "🥒", "cucumber"]] },
    "ㅜ": { say: "우", name: "우", type: "v", words: [["우유", "🥛", "milk"], ["우산", "☂️", "umbrella"]] },
    "ㅡ": { say: "으", name: "으", type: "v", words: [["으앙", "😭", "waah"]] },
    "ㅣ": { say: "이", name: "이", type: "v", words: [["이", "🦷", "tooth"], ["이불", "🛏️", "blanket"]] },
    "ㅑ": { say: "야", name: "야", type: "v", words: [["야구", "⚾", "baseball"], ["야옹", "🐱", "meow"]] },
    "ㅕ": { say: "여", name: "여", type: "v", words: [["여우", "🦊", "fox"], ["여름", "☀️", "summer"]] },
    "ㅛ": { say: "요", name: "요", type: "v", words: [["요리", "🍳", "cooking"], ["요요", "🪀", "yo-yo"]] },
    "ㅠ": { say: "유", name: "유", type: "v", words: [["유리", "🪟", "glass"], ["유자", "🍋", "citron"]] },
    "ㅐ": { say: "애", name: "애", type: "v", words: [["애벌레", "🐛", "caterpillar"]] },
    "ㅔ": { say: "에", name: "에", type: "v", words: [["에어컨", "❄️", "air conditioner"]] },

    "ㄱ": { say: "그", name: "기역", type: "c", words: [["고양이", "🐱", "cat"], ["가방", "🎒", "bag"], ["기차", "🚂", "train"]] },
    "ㄴ": { say: "느", name: "니은", type: "c", words: [["나무", "🌳", "tree"], ["나비", "🦋", "butterfly"], ["눈", "👁️", "eye"]] },
    "ㄷ": { say: "드", name: "디귿", type: "c", words: [["다리", "🌉", "bridge"], ["달", "🌙", "moon"], ["돼지", "🐷", "pig"]] },
    "ㄹ": { say: "르", name: "리을", type: "c", words: [["라면", "🍜", "ramen"], ["로봇", "🤖", "robot"], ["리본", "🎀", "ribbon"]] },
    "ㅁ": { say: "므", name: "미음", type: "c", words: [["모자", "🧢", "hat"], ["문", "🚪", "door"], ["물", "💧", "water"]] },
    "ㅂ": { say: "브", name: "비읍", type: "c", words: [["바다", "🌊", "sea"], ["바나나", "🍌", "banana"], ["별", "⭐", "star"]] },
    "ㅅ": { say: "스", name: "시옷", type: "c", words: [["사과", "🍎", "apple"], ["사자", "🦁", "lion"], ["소", "🐮", "cow"]] },
    "ㅇ": { say: "이응", name: "이응", type: "c", silent: true, words: [["아이", "🧒", "child"], ["오리", "🦆", "duck"], ["우유", "🥛", "milk"]] },
    "ㅈ": { say: "즈", name: "지읒", type: "c", words: [["자동차", "🚗", "car"], ["지구", "🌍", "earth"], ["자", "📏", "ruler"]] },
    "ㅊ": { say: "츠", name: "치읓", type: "c", words: [["치즈", "🧀", "cheese"], ["축구", "⚽", "soccer"], ["침대", "🛏️", "bed"]] },
    "ㅋ": { say: "크", name: "키읔", type: "c", words: [["코", "👃", "nose"], ["코끼리", "🐘", "elephant"], ["키", "📐", "height"]] },
    "ㅌ": { say: "트", name: "티읕", type: "c", words: [["토끼", "🐰", "rabbit"], ["토마토", "🍅", "tomato"], ["튤립", "🌷", "tulip"]] },
    "ㅍ": { say: "프", name: "피읖", type: "c", words: [["포도", "🍇", "grape"], ["피자", "🍕", "pizza"], ["파", "🥬", "green onion"]] },
    "ㅎ": { say: "흐", name: "히읗", type: "c", words: [["하마", "🦛", "hippo"], ["해", "☀️", "sun"], ["호랑이", "🐯", "tiger"]] },

    "ㄲ": { say: "끄", name: "쌍기역", type: "c", words: [["꽃", "🌸", "flower"], ["꿀", "🍯", "honey"], ["까치", "🐦", "magpie"]] },
    "ㄸ": { say: "뜨", name: "쌍디귿", type: "c", words: [["딸기", "🍓", "strawberry"], ["떡", "🍡", "rice cake"]] },
    "ㅃ": { say: "쁘", name: "쌍비읍", type: "c", words: [["빵", "🍞", "bread"], ["뿔", "🦌", "horn"]] },
    "ㅆ": { say: "쓰", name: "쌍시옷", type: "c", words: [["쌀", "🍚", "rice"], ["쓰레기통", "🗑️", "trash can"]] },
    "ㅉ": { say: "쯔", name: "쌍지읒", type: "c", words: [["짝", "👏", "clap"], ["찌개", "🍲", "stew"]] }
  },

  /* ---------- 1단계 활동 ----------
     kind:
       listen  = 소리 듣고 글자 고르기
       picture = 글자 보고 그림 낱말 고르기
       pair    = 헷갈리는 소리 짝 구별 (발음 코너)
  */
  lessons: [
    { id: "v1", stage: 1, title: "모음 첫걸음", icon: "🌱", kind: "listen",  items: ["ㅏ", "ㅓ", "ㅗ", "ㅜ", "ㅡ", "ㅣ"] },
    { id: "v1p", stage: 1, title: "어? 오? 으? 우?", icon: "👂", kind: "pair",  pairs: [["ㅓ", "ㅗ"], ["ㅡ", "ㅜ"], ["ㅏ", "ㅓ"], ["ㅗ", "ㅜ"]] },
    { id: "v2", stage: 1, title: "모음 더하기", icon: "🌿", kind: "listen",  items: ["ㅑ", "ㅕ", "ㅛ", "ㅠ", "ㅐ", "ㅔ"] },
    { id: "c1", stage: 1, title: "자음 첫걸음", icon: "🐾", kind: "listen",  items: ["ㄱ", "ㄴ", "ㄷ", "ㄹ", "ㅁ", "ㅂ", "ㅅ"] },
    { id: "c1w", stage: 1, title: "글자와 그림", icon: "🖼️", kind: "picture", items: ["ㄱ", "ㄴ", "ㄷ", "ㄹ", "ㅁ", "ㅂ", "ㅅ"] },
    { id: "c2", stage: 1, title: "자음 더하기", icon: "🐾", kind: "listen",  items: ["ㅇ", "ㅈ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"] },
    { id: "c2w", stage: 1, title: "글자와 그림 2", icon: "🖼️", kind: "picture", items: ["ㅈ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"] },
    { id: "c3", stage: 1, title: "센 소리 (된소리)", icon: "💪", kind: "listen",  items: ["ㄲ", "ㄸ", "ㅃ", "ㅆ", "ㅉ"] },
    { id: "c3p", stage: 1, title: "그? 크? 끄?", icon: "👂", kind: "pair",  pairs: [["ㄱ", "ㅋ", "ㄲ"], ["ㄷ", "ㅌ", "ㄸ"], ["ㅂ", "ㅍ", "ㅃ"], ["ㅈ", "ㅊ", "ㅉ"], ["ㅅ", "ㅆ"]] }
  ],

  /* ---------- 쵸코가 하는 말 ---------- */
  choco: {
    hello: ["안녕! 나는 쵸코야.", "오늘도 같이 놀자!", "어디부터 해 볼까?"],
    start: ["잘 들어 봐!", "귀를 쫑긋!", "준비됐지?"],
    correct: ["딩동댕!", "맞았어!", "우와, 잘했다!", "바로 그거야!"],
    retry: ["다시 들어 볼까?", "한 번 더!", "괜찮아, 다시!"],
    clear: ["멋지다!", "다 했어!", "별을 받았어!"]
  }
};
