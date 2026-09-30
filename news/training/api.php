<?php
/*
 * 연수 진행 — 선생님들이 만든 게임(html) 올리기·목록 API
 * - GET  api.php?list=1        → 올라온 게임 목록
 * - POST api.php (multipart)   → 게임 파일 하나 올리기 (file, author, title, pin)
 * - POST api.php (JSON {delete, adminPin}) → 하나 지우기 (config.php의 $ADMIN_PIN 필요)
 * 저장 위치: uploads/<id>.html, 목록: uploads/list.json
 * uploads 폴더는 웹서버가 쓸 수 있어야 합니다. (chmod 775 또는 777)
 */
date_default_timezone_set('Asia/Seoul');
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Robots-Tag: noindex');

// 올리기 비밀번호는 config.php 에서 정합니다 (config.sample.php 를 복사해서 이름을 바꾸세요).
// config.php 가 없거나 $PIN 이 비어 있으면 주소를 아는 누구나 올릴 수 있습니다.
$PIN = ''; $ADMIN_PIN = '';
if (is_file(__DIR__ . '/config.php')) include __DIR__ . '/config.php';
$PIN = (string) $PIN; $ADMIN_PIN = (string) $ADMIN_PIN;

$DIR  = __DIR__ . '/uploads';
$LIST = $DIR . '/list.json';
$MAX  = 3 * 1024 * 1024;

function out($code, $body) { http_response_code($code); echo json_encode($body, JSON_UNESCAPED_UNICODE); exit; }
function load_list($f) { if (!is_file($f)) return []; $j = json_decode(file_get_contents($f), true); return is_array($j) ? $j : []; }
function save_list($f, $list) { file_put_contents($f, json_encode($list, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT), LOCK_EX); }
function clean($s, $n) { $s = trim(preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', (string) $s)); return mb_substr($s, 0, $n); }

// 너무 자주 보내는 요청 막기 (IP마다 10분에 올리기 20번, 비밀번호 틀림 10번)
function rate_hit($dir, $kind, $limit) {
  if (!is_dir($dir)) return true;
  $f = $dir . '/rate.json';
  $fp = @fopen($f, 'c+'); if (!$fp) return true;
  flock($fp, LOCK_EX);
  $raw = stream_get_contents($fp); $all = json_decode($raw ?: '{}', true); if (!is_array($all)) $all = [];
  $now = time(); $key = $kind . ':' . ($_SERVER['REMOTE_ADDR'] ?? '?');
  foreach ($all as $k => $v) { $all[$k] = array_values(array_filter((array) $v, fn($t) => $t > $now - 600)); if (!$all[$k]) unset($all[$k]); }
  $list = $all[$key] ?? [];
  $ok = count($list) < $limit;
  if ($ok) { $list[] = $now; $all[$key] = $list; }
  ftruncate($fp, 0); rewind($fp); fwrite($fp, json_encode($all)); flock($fp, LOCK_UN); fclose($fp);
  return $ok;
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'GET') {
  $list = load_list($LIST);
  usort($list, fn($a, $b) => strcmp($b['time'] ?? '', $a['time'] ?? ''));
  $canWrite = is_dir($DIR) ? is_writable($DIR) : is_writable(__DIR__);
  out(200, ['ok' => true, 'pinRequired' => $PIN !== '', 'canWrite' => $canWrite, 'games' => array_values($list)]);
}
if ($method !== 'POST') out(405, ['ok' => false, 'error' => '허용되지 않은 요청입니다.']);

if (!is_dir($DIR) && !@mkdir($DIR, 0775, true)) out(500, ['ok' => false, 'error' => '서버에 저장 폴더를 만들 수 없어요.']);
if (!is_writable($DIR)) out(500, ['ok' => false, 'error' => '서버 저장 폴더에 쓸 수 없어요. (uploads 폴더 권한)']);

// ── 지우기 (관리자)
$ct = $_SERVER['CONTENT_TYPE'] ?? '';
if (stripos($ct, 'application/json') !== false) {
  $in = json_decode(file_get_contents('php://input'), true);
  if (!is_array($in) || empty($in['delete'])) out(400, ['ok' => false, 'error' => '요청 형식이 올바르지 않습니다.']);
  if ($ADMIN_PIN === '' || !hash_equals($ADMIN_PIN, (string) ($in['adminPin'] ?? ''))) out(403, ['ok' => false, 'error' => '관리자 비밀번호가 맞지 않아요.']);
  $id = preg_replace('/[^a-z0-9]/', '', (string) $in['delete']);
  $list = array_values(array_filter(load_list($LIST), fn($g) => ($g['id'] ?? '') !== $id));
  @unlink($DIR . '/' . $id . '.html');
  save_list($LIST, $list);
  out(200, ['ok' => true]);
}

// ── 올리기
if (!rate_hit($DIR, 'up', 20)) out(429, ['ok' => false, 'error' => '너무 자주 올렸어요. 몇 분 뒤에 다시 해 주세요.']);
if ($PIN !== '' && !hash_equals($PIN, (string) ($_POST['pin'] ?? ''))) {
  if (!rate_hit($DIR, 'pin', 10)) out(429, ['ok' => false, 'error' => '비밀번호를 여러 번 틀렸어요. 10분 뒤에 다시 해 주세요.']);
  out(403, ['ok' => false, 'error' => '비밀번호가 맞지 않아요. 교무부에 물어봐 주세요.']);
}
$author = clean($_POST['author'] ?? '', 20);
$title  = clean($_POST['title'] ?? '', 40);
if ($author === '') out(400, ['ok' => false, 'error' => '선생님 이름을 적어 주세요.']);
if ($title === '')  out(400, ['ok' => false, 'error' => '게임 이름을 적어 주세요.']);

$f = $_FILES['file'] ?? null;
if (!$f || ($f['error'] ?? 1) !== UPLOAD_ERR_OK) out(400, ['ok' => false, 'error' => '파일이 올라오지 않았어요.']);
if ($f['size'] > $MAX) out(413, ['ok' => false, 'error' => '파일이 3MB를 넘어요.']);
if (!preg_match('/\.html?$/i', (string) $f['name'])) out(400, ['ok' => false, 'error' => '.html 파일만 올릴 수 있어요.']);
$head = file_get_contents($f['tmp_name'], false, null, 0, 4000);
if (stripos($head, '<html') === false && stripos($head, '<!doctype') === false && stripos($head, '<body') === false && stripos($head, '<script') === false)
  out(400, ['ok' => false, 'error' => 'html 파일이 아닌 것 같아요. 클로드에서 다운로드한 파일을 올려 주세요.']);

$id = date('ymdHis') . substr(bin2hex(random_bytes(3)), 0, 5);
if (!move_uploaded_file($f['tmp_name'], $DIR . '/' . $id . '.html')) out(500, ['ok' => false, 'error' => '서버에 저장하지 못했어요.']);
@chmod($DIR . '/' . $id . '.html', 0644);

$list = load_list($LIST);
$list[] = ['id' => $id, 'file' => $id . '.html', 'author' => $author, 'title' => $title, 'size' => (int) $f['size'], 'time' => date('m/d H:i')];
if (count($list) > 300) $list = array_slice($list, -300);
save_list($LIST, $list);
out(200, ['ok' => true, 'id' => $id]);
