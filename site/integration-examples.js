/**
 * Примеры интеграции форм с различными сервисами
 * 
 * Скопируйте нужный код в функцию handleFormSubmit в script.js
 */

// ============================================
// 1. Интеграция с Telegram Bot
// ============================================
async function sendToTelegram(data) {
    const BOT_TOKEN = 'YOUR_BOT_TOKEN';
    const CHAT_ID = 'YOUR_CHAT_ID';
    
    const message = `
🆕 Новая заявка с сайта

📐 Площадь: ${data.area} м²
📞 Телефон: ${data.phone}
🕐 Время: ${new Date().toLocaleString('ru-RU')}
    `;
    
    try {
        const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: CHAT_ID,
                text: message,
                parse_mode: 'HTML'
            })
        });
        
        if (response.ok) {
            console.log('Сообщение отправлено в Telegram');
        }
    } catch (error) {
        console.error('Ошибка отправки в Telegram:', error);
    }
}

// ============================================
// 2. Интеграция с Email (через EmailJS)
// ============================================
async function sendEmailViaEmailJS(data) {
    // Зарегистрируйтесь на https://www.emailjs.com/
    const SERVICE_ID = 'YOUR_SERVICE_ID';
    const TEMPLATE_ID = 'YOUR_TEMPLATE_ID';
    const PUBLIC_KEY = 'YOUR_PUBLIC_KEY';
    
    try {
        const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                service_id: SERVICE_ID,
                template_id: TEMPLATE_ID,
                user_id: PUBLIC_KEY,
                template_params: {
                    area: data.area,
                    phone: data.phone,
                    date: new Date().toLocaleString('ru-RU')
                }
            })
        });
        
        if (response.ok) {
            console.log('Email отправлен');
        }
    } catch (error) {
        console.error('Ошибка отправки email:', error);
    }
}

// ============================================
// 3. Интеграция с Google Sheets (через Google Apps Script)
// ============================================
async function sendToGoogleSheets(data) {
    // Создайте Google Apps Script и получите URL
    const SCRIPT_URL = 'YOUR_GOOGLE_APPS_SCRIPT_URL';
    
    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        
        console.log('Данные отправлены в Google Sheets');
    } catch (error) {
        console.error('Ошибка отправки в Google Sheets:', error);
    }
}

// Пример Google Apps Script кода:
/*
function doPost(e) {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const data = JSON.parse(e.postData.contents);
    
    sheet.appendRow([
        new Date(),
        data.area,
        data.phone,
        data.source
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({success: true}))
        .setMimeType(ContentService.MimeType.JSON);
}
*/

// ============================================
// 4. Интеграция с CRM (AmoCRM, Битрикс24 и т.д.)
// ============================================
async function sendToAmoCRM(data) {
    const DOMAIN = 'YOUR_DOMAIN';
    const CLIENT_ID = 'YOUR_CLIENT_ID';
    const CLIENT_SECRET = 'YOUR_CLIENT_SECRET';
    const ACCESS_TOKEN = 'YOUR_ACCESS_TOKEN';
    
    try {
        const response = await fetch(`https://${DOMAIN}.amocrm.ru/api/v4/leads`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${ACCESS_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify([{
                name: `Заявка с сайта - ${data.area} м²`,
                custom_fields_values: [
                    {
                        field_id: 123456, // ID поля "Телефон"
                        values: [{
                            value: data.phone
                        }]
                    },
                    {
                        field_id: 123457, // ID поля "Площадь"
                        values: [{
                            value: data.area
                        }]
                    }
                ]
            }])
        });
        
        if (response.ok) {
            console.log('Сделка создана в AmoCRM');
        }
    } catch (error) {
        console.error('Ошибка отправки в AmoCRM:', error);
    }
}

// ============================================
// 5. Интеграция с собственным API
// ============================================
async function sendToCustomAPI(data) {
    const API_URL = 'https://your-api.com/api/leads';
    const API_KEY = 'YOUR_API_KEY';
    
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            const result = await response.json();
            console.log('Данные отправлены:', result);
        }
    } catch (error) {
        console.error('Ошибка отправки данных:', error);
    }
}

// ============================================
// 6. Интеграция с Битрикс24
// ============================================
async function sendToBitrix24(data) {
    const PORTAL = 'YOUR_PORTAL';
    const WEBHOOK = 'YOUR_WEBHOOK';
    
    try {
        const response = await fetch(`https://${PORTAL}.bitrix24.ru/rest/1/${WEBHOOK}/crm.lead.add`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                fields: {
                    TITLE: `Заявка с сайта - ${data.area} м²`,
                    PHONE: [{
                        VALUE: data.phone,
                        VALUE_TYPE: 'WORK'
                    }],
                    COMMENTS: `Площадь помещения: ${data.area} м²\nИсточник: ${data.source}`
                }
            })
        });
        
        if (response.ok) {
            console.log('Лид создан в Битрикс24');
        }
    } catch (error) {
        console.error('Ошибка отправки в Битрикс24:', error);
    }
}

// ============================================
// 7. Множественная отправка (несколько сервисов)
// ============================================
async function sendToMultipleServices(data) {
    const promises = [
        sendToTelegram(data),
        sendToGoogleSheets(data),
        sendToCustomAPI(data)
    ];
    
    try {
        await Promise.allSettled(promises);
        console.log('Данные отправлены во все сервисы');
    } catch (error) {
        console.error('Ошибка при отправке:', error);
    }
}

// ============================================
// Пример использования в handleFormSubmit
// ============================================
/*
function handleFormSubmit(formId, formData) {
    const data = {
        area: formData.get('area'),
        phone: formData.get('phone'),
        timestamp: new Date().toISOString(),
        source: 'landing_page'
    };
    
    // Выберите нужный метод отправки:
    // sendToTelegram(data);
    // sendToEmailJS(data);
    // sendToGoogleSheets(data);
    // sendToAmoCRM(data);
    // sendToBitrix24(data);
    // sendToMultipleServices(data);
    
    // Или оставьте WhatsApp (по умолчанию)
    const message = `Здравствуйте! Хочу получить расчет стоимости кондиционера.\nПлощадь помещения: ${data.area} м²\nТелефон: ${data.phone}`;
    const whatsappUrl = `https://wa.me/79143350675?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    
    showSuccessMessage(formId);
    document.getElementById(formId).reset();
}
*/

