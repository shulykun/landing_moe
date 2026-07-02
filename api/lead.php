<?php
/**
 * API: приём лидов для лендинга кондиционеров (PHP)
 *
 * Заменяет server.js на PHP-хостинге.
 * Принимает POST с JSON: { contact, type, area, extras }
 */

header('Content-Type: application/json; charset=utf-8');

// CORS
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

// Читаем JSON
$input = json_decode(file_get_contents('php://input'), true);

if (!$input || empty($input['contact'])) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'contact required']);
    exit;
}

$contact = $input['contact'];
$typeName = $input['type'] ?? 'Не указан';
$areaStr = $input['area'] ? $input['area'] . ' м²' : 'Не указана';
$extras = !empty($input['extras']) ? 'Особенности: ' . implode(', ', $input['extras']) : '—';

echo json_encode(['ok' => true]);

// ─── Сохраняем в файл ───
$logDir = __DIR__ . '/../leads';
if (!is_dir($logDir)) mkdir($logDir, 0755, true);
$logFile = $logDir . '/lead-' . time() . '-' . rand(1000, 9999) . '.json';
file_put_contents($logFile, json_encode($input, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));

// ─── Отправляем в Telegram ───
$botToken = getenv('BOT_TOKEN') ?: '';
$adminId = getenv('ADMIN_ID') ?: '';

$leadMsg = "📬 *Новая заявка!*\n\n"
    . "📞 Телефон: {$contact}\n"
    . "🏠 Тип: {$typeName}\n"
    . "📏 Площадь: {$areaStr}\n"
    . "🔧 {$extras}\n";

if ($botToken && $adminId) {
    $telegramUrl = "https://api.telegram.org/bot{$botToken}/sendMessage";
    $payload = [
        'chat_id' => $adminId,
        'text' => $leadMsg,
        'parse_mode' => 'Markdown',
    ];

    $json = json_encode($payload);
    $opts = array('http' => array(
        'method'  => 'POST',
        'header'  => "Content-Type: application/json\r\n",
        'content' => $json,
        'timeout' => 10,
    ));
    $ctx = stream_context_create($opts);
    @file_get_contents($telegramUrl, false, $ctx);
    error_log("Telegram notify sent");
}

// ─── Отправляем email ───
$mailTo = 'shulginov@roborumba.com';
$subject = "=?UTF-8?B?" . base64_encode("📬 Новая заявка — {$contact}") . "?=";
$emailBody = "Новая заявка с сайта Climate Hall — установка кондиционеров\n"
    . "========================================================\n\n"
    . "📞 Телефон: {$contact}\n"
    . "🏠 Тип:      {$typeName}\n"
    . "📏 Площадь:  {$areaStr}\n"
    . "🔧 Условия:  {$extras}\n\n"
    . "Дата: " . date('d.m.Y H:i:s') . "\n";

$headers = "From: Climate Hall <shulginov@roborumba.com>\r\n"
    . "Content-Type: text/plain; charset=utf-8\r\n";

mail($mailTo, $subject, $emailBody, $headers);
error_log("Email sent to {$mailTo}");
