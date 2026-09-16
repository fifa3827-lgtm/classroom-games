// ─────────────────────────────────────────────
// 쵸코와 한글 · 진도 기록 (구글 시트 Apps Script)
//
// 게임(index.html)이 활동 하나를 끝낼 때마다 이 웹앱으로 기록 한 줄을 보낸다.
// 처음 붙일 때: 구글 시트 → 확장 프로그램 → Apps Script → 이 파일을 통째로 붙여넣기
//   → 배포 → 새 배포 → 웹 앱 · 실행 주체: 나 · 액세스: 모든 사용자
//   → 나온 /exec 주소를 data.js의 config.sheetUrl에 넣는다.
// 「진도」 탭은 buildDashboard()를 골라 ▶ 실행하면 만들어진다 (기록이 없어도 된다).
// doPost를 고쳤을 때만 다시 배포하면 된다. 배포 → 배포 관리 → ✎ → 「새 버전」 → 배포 (주소 유지)
// ─────────────────────────────────────────────

var HEADER = ["학생", "일시", "단계", "활동", "별", "첫시도정답", "문제수", "틀린것", "범위"];

var BROWN = "#8B5A3C", CREAM = "#FBF7F0", SAND = "#F4E6D6", LINE = "#E3DACB",
    INK = "#3A3130", MUTE = "#8A8177", MINT = "#A8DFC9", PINK = "#F4A9A9",
    FONT = "Nanum Gothic";

// 집중 글자 — 읽기 확인표에서 ×였던 글자. data.js의 config.focus와 같게 맞춘다.
var FOCUS = ["수", "더", "미", "머", "노", "서", "두", "디", "다", "시", "모", "거"];

function doPost(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("기록") || ss.insertSheet("기록");
  if (sheet.getLastRow() === 0) sheet.appendRow(HEADER);
  var body = JSON.parse(e.postData.contents);
  var recs = body.records || [];
  recs.forEach(function (r) {
    var when = r.at ? new Date(r.at) : new Date();
    if (isNaN(when.getTime())) when = new Date();
    sheet.appendRow([
      r.code, when, r.stage, r.lesson, r.stars, r.firstTry, r.total,
      Array.isArray(r.misses) ? r.misses.join(" ") : (r.misses || ""), r.set
    ]);
    sheet.getRange(sheet.getLastRow(), 2).setNumberFormat("yyyy-mm-dd hh:mm");
  });
  return ContentService.createTextOutput("ok " + recs.length)
    .setMimeType(ContentService.MimeType.TEXT);
}

// 주소를 브라우저로 열어 보면 연결이 살아 있는지 확인할 수 있다.
function doGet() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("기록");
  var n = sheet ? Math.max(0, sheet.getLastRow() - 1) : 0;
  return ContentService.createTextOutput("쵸코와 한글 진도 기록 · 지금까지 " + n + "건")
    .setMimeType(ContentService.MimeType.TEXT);
}

// 예전에 글자로 들어간 「일시」를 날짜로 바꾼다 (한 번만 실행하면 된다)
function fixDates() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("기록");
  if (!sheet || sheet.getLastRow() < 2) return;
  var rng = sheet.getRange(2, 2, sheet.getLastRow() - 1, 1);
  rng.setValues(rng.getValues().map(function (row) {
    var x = row[0];
    if (typeof x === "string" && x) { var d = new Date(x); return [isNaN(d.getTime()) ? x : d]; }
    return [x];
  }));
  rng.setNumberFormat("yyyy-mm-dd hh:mm");
}

// ───────── 「진도」 탭 만들기 (이 함수를 골라 ▶ 실행)
function buildDashboard() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  ss.setSpreadsheetTimeZone("Asia/Seoul");
  var blank = ss.getSheetByName("시트1");
  if (blank && blank.getLastRow() === 0 && ss.getSheets().length > 1) ss.deleteSheet(blank);

  var s = ss.getSheetByName("진도");
  if (s) {
    s.getCharts().forEach(function (c) { s.removeChart(c); });
    s.getBandings().forEach(function (b) { b.remove(); });
    s.setConditionalFormatRules([]);
    try { s.getRange(1, 1, s.getMaxRows(), s.getMaxColumns()).breakApart(); } catch (err) {}
    s.clear();
  } else {
    s = ss.insertSheet("진도", 0);
  }

  // 별칭·시작일로 거르는 조건 (SUMPRODUCT용)
  var W = '(기록!$A$2:$A=$C$5)*(기록!$B$2:$B>=IF($E$5="",0,$E$5))*(기록!$B$2:$B<>"")';
  // 같은 조건의 QUERY용 문자열 — 숨긴 T1에서 만들어 여러 수식이 나눠 쓴다
  s.getRange("T1").setFormula("=\"where A = '\"&$C$5&\"' \"&IF($E$5=\"\",\"\",\"and B >= date '\"&TEXT($E$5,\"yyyy-mm-dd\")&\"' \")");

  // 머리말
  s.getRange("B2:G2").merge().setValue("쵸코와 한글 · 진도");
  s.getRange("B3:G3").merge().setValue("아래 노란 두 칸만 바꾸면 나머지는 저절로 계산됩니다.");
  s.getRange("B5").setValue("학생 별칭");
  s.getRange("C5").setValue("cat01");
  s.getRange("D5").setValue("집계 시작일");
  s.getRange("F5:G5").merge().setValue("비우면 전체");

  // 한눈에
  s.getRange("B7:G7").merge().setValue("한눈에");
  s.getRange("B8:G8").setValues([["활동 횟수", "별 합계", "첫 시도 정답률", "이번 주 활동", "이번 주 별", "마지막 활동"]]);
  s.getRange("B9:G9").setFormulas([[
    "=SUMPRODUCT(" + W + ")",
    "=SUMPRODUCT(" + W + "*기록!$E$2:$E)",
    '=IFERROR(SUMPRODUCT(' + W + '*기록!$F$2:$F)/SUMPRODUCT(' + W + '*기록!$G$2:$G),"-")',
    "=SUMPRODUCT(" + W + "*(기록!$B$2:$B>=TODAY()-WEEKDAY(TODAY(),2)+1))",
    "=SUMPRODUCT(" + W + "*(기록!$B$2:$B>=TODAY()-WEEKDAY(TODAY(),2)+1)*기록!$E$2:$E)",
    '=IFERROR(MAX(FILTER(기록!$B$2:$B,' + W + ')),"-")'
  ]]);

  // 활동별
  s.getRange("B12:G12").merge().setValue("활동별");
  s.getRange("B13").setFormula("=IFERROR(QUERY(기록!$A$2:$I,\"select D, count(D), max(E), avg(E), sum(F), sum(G) \"&$T$1&\"group by D order by count(D) desc label D '활동', count(D) '횟수', max(E) '최고 별', avg(E) '평균 별', sum(F) '첫시도 정답', sum(G) '문제 수'\",0),\"아직 기록이 없어요\")");

  // 집중 글자 — 낱말 안에 들어 있어도 세도록 글자를 그대로 찾는다
  s.getRange("I12:K12").merge().setValue("집중 글자 · 읽기 확인에서 ×였던 12자");
  s.getRange("I13:K13").setValues([["글자", "틀린 횟수", "마지막으로 틀린 날"]]);
  FOCUS.forEach(function (ch, i) {
    var r = 14 + i;
    s.getRange(r, 9).setValue(ch);
    s.getRange(r, 10).setFormula('=SUMPRODUCT(' + W + '*ISNUMBER(SEARCH(I' + r + ',기록!$H$2:$H)))');
    s.getRange(r, 11).setFormula('=IFERROR(MAX(FILTER(기록!$B$2:$B,' + W + '*ISNUMBER(SEARCH(I' + r + ',기록!$H$2:$H)))),"-")');
  });
  s.getRange("I26:K26").merge().setValue("틀린 횟수가 0에 가까워지면 그 글자는 익힌 것입니다.");

  // 날짜별
  s.getRange("B28:D28").merge().setValue("날짜별");
  s.getRange("B29").setFormula("=IFERROR(QUERY(기록!$A$2:$I,\"select toDate(B), count(D), sum(E) \"&$T$1&\"group by toDate(B) order by toDate(B) desc limit 30 label toDate(B) '날짜', count(D) '활동 수', sum(E) '별'\",0),\"아직 기록이 없어요\")");

  // 자주 틀린 글자 — 「구두」처럼 낱말로 틀린 것도 한 글자씩 쪼개 센다
  s.getRange("I28:J28").merge().setValue("자주 틀린 글자");
  s.getRange("I29").setFormula("=IFERROR(QUERY(FLATTEN(ARRAYFORMULA(SPLIT(REGEXREPLACE(FILTER(기록!$H$2:$H," + W + "*(기록!$H$2:$H<>\"\"))&\"\",\"(.)\",\"$1 \"),\" \"))),\"select Col1, count(Col1) where Col1 <> '' group by Col1 order by count(Col1) desc limit 15 label Col1 '글자', count(Col1) '틀린 횟수'\",0),\"아직 없어요\")");

  SpreadsheetApp.flush();
  var size = {
    act:  lastFilled(s, 2, 13, 26),
    date: lastFilled(s, 2, 29, 75),
    miss: lastFilled(s, 9, 29, 55)
  };
  styleDashboard(s, size);
  styleLog(ss);
  ss.setActiveSheet(s);
}

// 그 칸 아래로 내용이 들어찬 마지막 줄
function lastFilled(s, col, from, to) {
  var v = s.getRange(from, col, to - from + 1, 1).getValues(), n = from;
  for (var i = 0; i < v.length; i++) if (v[i][0] !== "" && v[i][0] !== null) n = from + i;
  return n;
}

// ───────── 「진도」 탭 꾸미기
function styleDashboard(s, size) {
  s.setHiddenGridlines(true);
  s.getRange(1, 1, s.getMaxRows(), s.getMaxColumns())
   .setBackground("#FFFFFF").setFontFamily(FONT).setFontColor(INK)
   .setFontSize(10).setVerticalAlignment("middle");

  var w = { 1: 24, 2: 150, 3: 85, 4: 85, 5: 85, 6: 90, 7: 90, 8: 28, 9: 66, 10: 95, 11: 135, 12: 24 };
  Object.keys(w).forEach(function (c) { s.setColumnWidth(Number(c), w[c]); });
  s.setRowHeights(1, 60, 23);
  s.setRowHeight(1, 12); s.setRowHeight(2, 36); s.setRowHeight(4, 10);
  s.setRowHeight(6, 14); s.setRowHeight(9, 40); s.setRowHeight(10, 14);
  s.setRowHeight(11, 14); s.setRowHeight(27, 14);
  s.hideColumns(20);

  s.getRange("B2").setFontSize(17).setFontWeight("bold").setFontColor(BROWN);
  s.getRange("B3").setFontSize(9.5).setFontColor(MUTE);

  // 입력 칸
  s.getRange("B5").setFontWeight("bold").setFontColor(BROWN).setHorizontalAlignment("right");
  s.getRange("D5").setFontWeight("bold").setFontColor(BROWN).setHorizontalAlignment("right");
  ["C5", "E5"].forEach(function (a) {
    s.getRange(a).setBackground("#FFF6E0").setFontWeight("bold").setHorizontalAlignment("center")
     .setBorder(true, true, true, true, false, false, "#E4C795", SpreadsheetApp.BorderStyle.SOLID);
  });
  s.getRange("C5").setNumberFormat("@");
  s.getRange("E5").setNumberFormat("yyyy-mm-dd");
  s.getRange("F5").setFontSize(9.5).setFontColor(MUTE);

  // 구역 제목
  [["B7:G7"], ["B12:G12"], ["I12:K12"], ["B28:D28"], ["I28:J28"]].forEach(function (r) {
    s.getRange(r[0]).setFontSize(12).setFontWeight("bold").setFontColor(BROWN)
     .setBorder(null, null, true, null, null, null, BROWN, SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
  });

  // 한눈에 카드
  s.getRange("B8:G8").setFontSize(9.5).setFontColor(MUTE).setHorizontalAlignment("center");
  s.getRange("B9:G9").setFontSize(16).setFontWeight("bold").setHorizontalAlignment("center")
   .setBackground(CREAM).setFontColor(BROWN)
   .setBorder(true, true, true, true, true, false, LINE, SpreadsheetApp.BorderStyle.SOLID);
  s.getRange("D9").setNumberFormat("0%");
  s.getRange("G9").setNumberFormat("mm/dd");

  // 표 — 내용이 있는 줄까지만 줄무늬와 테두리를 그린다
  function band(a1, head) {
    var b = s.getRange(a1).applyRowBanding(SpreadsheetApp.BandingTheme.LIGHT_GREY, head, false);
    b.setHeaderRowColor(head ? SAND : null).setFirstRowColor("#FFFFFF").setSecondRowColor(CREAM).setFooterRowColor(null);
    s.getRange(a1).setBorder(true, true, true, true, true, true, LINE, SpreadsheetApp.BorderStyle.SOLID)
     .setHorizontalAlignment("center");
  }
  band("B13:G" + size.act, true);
  band("I13:K25", true);
  band("B29:D" + size.date, true);
  band("I29:J" + size.miss, true);
  ["B13:G13", "I13:K13", "B29:D29", "I29:J29"].forEach(function (a) {
    s.getRange(a).setFontWeight("bold").setFontColor(BROWN);
  });
  s.getRange("B14:B" + size.act).setHorizontalAlignment("left");
  s.getRange("E14:E" + size.act).setNumberFormat("0.0");
  s.getRange("I14:I25").setFontSize(15).setFontWeight("bold");
  s.getRange("K14:K25").setNumberFormat("mm-dd");
  s.getRange("B30:B" + size.date).setNumberFormat("mm-dd (ddd)");
  s.getRange("I26").setFontSize(9).setFontColor(MUTE).setFontStyle("italic").setHorizontalAlignment("left");

  // 색 규칙 — 별은 초록, 틀린 횟수는 붉은빛
  function grad(a1, color, lo, hi) {
    return SpreadsheetApp.newConditionalFormatRule().setRanges([s.getRange(a1)])
      .setGradientMinpointWithValue("#FFFFFF", SpreadsheetApp.InterpolationType.NUMBER, lo)
      .setGradientMaxpointWithValue(color, SpreadsheetApp.InterpolationType.NUMBER, hi).build();
  }
  s.setConditionalFormatRules([
    grad("D14:E" + size.act, MINT, "1", "3"),
    grad("D30:D" + size.date, MINT, "1", "9"),
    grad("J14:J25", PINK, "0", "5"),
    grad("J30:J" + size.miss, PINK, "1", "6")
  ]);

  // 날짜별 그래프
  if (size.date > 29) s.insertChart(s.newChart().asColumnChart()
    .addRange(s.getRange("B29:B" + size.date)).addRange(s.getRange("D29:D" + size.date))
    .setNumHeaders(1)
    .setOption("title", "날짜별 별")
    .setOption("titleTextStyle", { color: BROWN, fontSize: 13, bold: true })
    .setOption("legend", { position: "none" })
    .setOption("colors", [MINT])
    .setOption("backgroundColor", "#FFFFFF")
    .setOption("hAxis", { format: "M/d", textStyle: { color: MUTE, fontSize: 10 } })
    .setOption("vAxis", { textStyle: { color: MUTE, fontSize: 10 }, gridlines: { color: LINE } })
    .setOption("chartArea", { left: 45, top: 45, width: "82%", height: "70%" })
    .setPosition(size.miss + 2, 9, 0, 0).setOption("width", 470).setOption("height", 290)
    .build());
}

// ───────── 「기록」 탭 꾸미기
function styleLog(ss) {
  var s = ss.getSheetByName("기록");
  if (!s) return;
  if (s.getLastRow() === 0) s.appendRow(HEADER);
  s.setHiddenGridlines(true);
  s.setFrozenRows(1);
  s.getBandings().forEach(function (b) { b.remove(); });
  s.setConditionalFormatRules([]);

  var last = 400;
  var all = s.getRange(1, 1, last, 9);
  all.setFontFamily(FONT).setFontColor(INK).setFontSize(10)
     .setVerticalAlignment("middle").setHorizontalAlignment("center");
  var b = all.applyRowBanding(SpreadsheetApp.BandingTheme.LIGHT_GREY, true, false);
  b.setHeaderRowColor(BROWN).setFirstRowColor("#FFFFFF").setSecondRowColor(CREAM).setFooterRowColor(null);
  all.setBorder(true, true, true, true, true, true, LINE, SpreadsheetApp.BorderStyle.SOLID);
  s.getRange(1, 1, 1, 9).setFontColor("#FFFFFF").setFontWeight("bold");
  s.getRange(2, 4, last - 1, 1).setHorizontalAlignment("left");
  s.getRange(2, 8, last - 1, 1).setHorizontalAlignment("left");
  s.getRange(2, 2, last - 1, 1).setNumberFormat("yyyy-mm-dd hh:mm");
  [95, 140, 55, 130, 50, 95, 70, 220, 55].forEach(function (x, i) { s.setColumnWidth(i + 1, x); });
  s.setRowHeights(1, last, 23);
  s.setConditionalFormatRules([
    SpreadsheetApp.newConditionalFormatRule().setRanges([s.getRange(2, 5, last - 1, 1)])
      .setGradientMinpointWithValue("#FFFFFF", SpreadsheetApp.InterpolationType.NUMBER, "1")
      .setGradientMaxpointWithValue(MINT, SpreadsheetApp.InterpolationType.NUMBER, "3").build()
  ]);
}
