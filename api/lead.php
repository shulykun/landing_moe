<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
    exit;
}
$input = json_decode(file_get_contents('php://input'), true);
if (!$input || empty($input['contact'])) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'contact required']);
    exit;
}

$contact = $input['contact'];
$typeName = isset($input['type']) ? $input['type'] : 'Не указан';
$areaStr = !empty($input['area']) ? $input['area'] . ' м²' : 'Не указана';
$extras = !empty($input['extras']) ? 'Особенности: ' . implode(', ', $input['extras']) : '—';

echo json_encode(['ok' => true]);

$logDir = __DIR__ . '/../leads';
if (!is_dir($logDir)) mkdir($logDir, 0755, true);
$logFile = $logDir . '/lead-' . time() . '-' . rand(1000, 9999) . '.json';
file_put_contents($logFile, json_encode($input, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));

$botToken = getenv('BOT_TOKEN') ?: '';
$adminId = getenv('ADMIN_ID') ?: '';

$leadMsg = "📬 *Новая заявка!*\n\n"
    . "📞 Телефон: {$contact}\n"
    . "🏠 Тип: {$typeName}\n"
    . "📏 Площадь: {$areaStr}\n"
    . "🔧 {$extras}\n";

if ($botToken && $adminId) {
    $json = json_encode([
        'chat_id' => $adminId,
        'text' => $leadMsg,
        'parse_mode' => 'Markdown',
    ]);
    $opts = ['http' => [
        'method' => 'POST',
        'header' => "Content-Type: application/json\r\n",
        'content' => $json,
        'timeout' => 10,
    ]];
    $ctx = stream_context_create($opts);
    @file_get_contents("https://api.telegram.org/bot{$botToken}/sendMessage", false, $ctx);
}

$mailTo = 'shulginov@roborumba.com';
$subject = "=?UTF-8?B?" . base64_encode("📬 Новая заявка — {$contact}") . "?=";
$emailBody = "Новая заявка с сайта Climate Hall\n\n"
    . "📞 Телефон: {$contact}\n"
    . "🏠 Тип: {$typeName}\n"
    . "📏 Площадь: {$areaStr}\n"
    . "🔧 {$extras}\n\n"
    . "Дата: " . date('d.m.Y H:i:s') . "\n";
$headers = "From: Climate Hall <shulginov@roborumba.com>\r\n"
    . "Content-Type: text/plain; charset=utf-8\r\n";
mail($mailTo, $subject, $emailBody, $headers);
