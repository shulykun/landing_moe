<?php
/*
 * Climate Hall — обработчик формы заявок
 * Отправляет письмо с вложением на shulginov@roborumba.com
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');

// Настройки
$to      = 'shulginov@roborumba.com';
$subject = 'Обращение с сайта Climate Hall';

// Проверяем метод
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

// Получаем данные
$phone   = isset($_POST['phone'])   ? trim($_POST['phone'])   : '';
$message = isset($_POST['message']) ? trim($_POST['message']) : '';
$page    = isset($_POST['page'])    ? trim($_POST['page'])    : '';

// Honeypot — скрытое поле, боты его заполняют
$honeypot = isset($_POST['website']) ? trim($_POST['website']) : '';
if (!empty($honeypot)) {
    // Молча «успешно» — бот думает, что прошло
    echo json_encode(['success' => true]);
    exit;
}

if (empty($phone)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Телефон обязателен']);
    exit;
}

// Формируем тело письма
$body  = "Новая заявка с сайта Climate Hall\n";
$body .= "================================\n\n";
$body .= "Телефон:    {$phone}\n";
$body .= "Сообщение:  {$message}\n";
$body .= "Страница:   {$page}\n";
$body .= "Дата:       " . date('d.m.Y H:i:s') . "\n";

// Заголовки
$boundary = md5(uniqid(time()));
$headers  = "From: Climate Hall <noreply@" . $_SERVER['SERVER_NAME'] . ">\r\n";
$headers .= "Reply-To: noreply@" . $_SERVER['SERVER_NAME'] . "\r\n";
$headers .= "MIME-Version: 1.0\r\n";
$headers .= "Content-Type: multipart/mixed; boundary=\"{$boundary}\"\r\n";

// Текстовая часть
$mailBody  = "--{$boundary}\r\n";
$mailBody .= "Content-Type: text/plain; charset=utf-8\r\n";
$mailBody .= "Content-Transfer-Encoding: 8bit\r\n\r\n";
$mailBody .= $body . "\r\n";

// Обработка вложения
if (isset($_FILES['file']) && $_FILES['file']['error'] === UPLOAD_ERR_OK) {
    $tmpName  = $_FILES['file']['tmp_name'];
    $fileName = $_FILES['file']['name'];
    $fileSize = $_FILES['file']['size'];
    $fileType = $_FILES['file']['type'];

    // Максимальный размер файла — 10 МБ
    if ($fileSize <= 10 * 1024 * 1024) {
        $fileContent = file_get_contents($tmpName);
        $fileContent = chunk_split(base64_encode($fileContent));

        $mailBody .= "--{$boundary}\r\n";
        $mailBody .= "Content-Type: {$fileType}; name=\"{$fileName}\"\r\n";
        $mailBody .= "Content-Transfer-Encoding: base64\r\n";
        $mailBody .= "Content-Disposition: attachment; filename=\"{$fileName}\"\r\n\r\n";
        $mailBody .= $fileContent . "\r\n";
    }
}

$mailBody .= "--{$boundary}--\r\n";

// Отправка
$sent = mail($to, $subject, $mailBody, $headers);

if ($sent) {
    echo json_encode(['success' => true]);
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Mail send failed']);
}
