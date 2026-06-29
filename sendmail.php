<?php
/*
 * Climate Hall — обработчик формы заявок (AC site)
 * Отправляет письмо на shulginov@roborumba.com и pichuginda@bk.ru
 */

header('Content-Type: application/json; charset=utf-8');

// Получаем данные из stdin (JSON)
$input = json_decode(file_get_contents('php://stdin'), true);

if (!$input || empty($input['contact'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'contact required']);
    exit;
}

$phone   = $input['contact'];
$type    = $input['type'] ?? 'Не указан';
$area    = isset($input['area']) ? $input['area'] . ' м²' : 'Не указана';
$extras  = !empty($input['extras']) ? implode(', ', $input['extras']) : '—';

// Формируем тело письма
$body  = "Новая заявка с сайта Climate Hall — установка кондиционеров\n";
$body .= "========================================================\n\n";
$body .= "📞 Телефон: {$phone}\n";
$body .= "🏠 Тип:      {$type}\n";
$body .= "📏 Площадь:  {$area}\n";
$body .= "🔧 Условия:  {$extras}\n\n";
$body .= "Дата: " . date('d.m.Y H:i:s') . "\n";

// Заголовки
$headers  = "From: Climate Hall <shulginov@roborumba.com>\r\n";
$headers .= "MIME-Version: 1.0\r\n";
$headers .= "Content-Type: text/plain; charset=utf-8\r\n";
$headers .= "Content-Transfer-Encoding: 8bit\r\n";

// Получатели
$to = ['shulginov@roborumba.com', 'pichuginda@bk.ru'];
$subject = '📬 Новая заявка — ' . $phone;

// Отправка на все адреса
$allSent = true;
foreach ($to as $addr) {
    $sent = mail($addr, $subject, $body, $headers);
    if (!$sent) $allSent = false;
}

if ($allSent) {
    echo json_encode(['success' => true]);
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Mail send failed']);
}
