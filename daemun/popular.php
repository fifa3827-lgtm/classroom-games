<?php
/* 달빛 오락실 인기 게임 순위 — 대문의 「HIT」 코너가 읽어요
   - 최근 30일 동안 게임기를 누른 횟수가 많은 순서로 폴더 이름만 알려 줘요 (숫자는 알려 주지 않아요)
   - counter.php 가 모으는 counter-data/visits.php 를 읽기만 하고, 아무것도 바꾸지 않아요 */
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
date_default_timezone_set('Asia/Seoul');

$file = __DIR__ . '/counter-data/visits.php';
$guard = "<?php exit; ?>\n";
$top = [];

$fp = @fopen($file, 'r');
if ($fp) {
  flock($fp, LOCK_SH);
  $raw = stream_get_contents($fp);
  flock($fp, LOCK_UN);
  fclose($fp);
  if (strpos($raw, $guard) === 0) { $raw = substr($raw, strlen($guard)); }
  $d = json_decode($raw ? $raw : '{}', true);
  if (is_array($d) && isset($d['daily']) && is_array($d['daily'])) {
    $cut = date('Y-m-d', strtotime('-29 days'));
    $sum = [];
    foreach ($d['daily'] as $day => $games) {
      if ($day < $cut || !is_array($games)) { continue; }
      foreach ($games as $g => $n) {
        if (preg_match('/^[a-z0-9_-]{1,40}$/', (string)$g)) { $sum[$g] = ($sum[$g] ?? 0) + (int)$n; }
      }
    }
    arsort($sum);
    foreach ($sum as $g => $n) {
      $g = (string)$g;
      if (is_file(__DIR__ . '/' . $g . '/index.html')) { $top[] = $g; }   // 실제 게임 폴더만
      if (count($top) >= 10) { break; }
    }
  }
}

echo json_encode(['top' => $top]);
