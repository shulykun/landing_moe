# Лендинг Climate Hall

Продающий лендинг для компании по продаже климатической техники во Владивостоке.

## Цели сайта

1. **Основная цель:** Собирать заявки на расчет стоимости климатической техники
2. **Вспомогательная цель:** Приводить подписчиков в телеграм-канал

## Структура проекта

```
site/
├── index.html      # Основная HTML-страница
├── styles.css      # Стили сайта
├── script.js       # JavaScript функциональность
└── README.md       # Документация
```

## Особенности

- ✅ Адаптивный дизайн (mobile-first)
- ✅ Современный UI/UX
- ✅ Оптимизация для конверсий
- ✅ Формы с валидацией
- ✅ Маска для телефона
- ✅ Плавная прокрутка
- ✅ Анимации при скролле
- ✅ Интеграция с WhatsApp
- ✅ SEO-оптимизация

## Установка и запуск

### Локальный запуск

1. Откройте файл `index.html` в браузере
2. Или используйте локальный сервер:

```bash
# Python 3
python -m http.server 8000

# Node.js (http-server)
npx http-server

# PHP
php -S localhost:8000
```

Затем откройте в браузере: `http://localhost:8000`

### Развертывание

Сайт можно развернуть на любом хостинге:
- GitHub Pages
- Netlify
- Vercel
- Обычный веб-хостинг

Просто загрузите файлы `index.html`, `styles.css` и `script.js` на сервер.

## Настройка

### Контакты

Измените контактную информацию в файле `index.html`:

- Телефон: `+79143350675`
- WhatsApp: `+79143350675`
- Телеграм-канал: `https://t.me/s/climate_hall`

### Обработка форм

По умолчанию формы открывают WhatsApp с предзаполненным сообщением. 

Для интеграции с CRM или email-сервисом, измените функцию `handleFormSubmit` в `script.js`:

```javascript
function handleFormSubmit(formId, formData) {
    const data = {
        area: formData.get('area'),
        phone: formData.get('phone'),
        timestamp: new Date().toISOString()
    };
    
    // Ваш код для отправки данных
    // Например: fetch('/api/submit', { method: 'POST', body: JSON.stringify(data) })
}
```

### Аналитика

Для подключения Google Analytics или Яндекс.Метрики:

1. **Google Analytics:**
```html
<!-- Добавьте в <head> index.html -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

2. **Яндекс.Метрика:**
```html
<!-- Добавьте в <head> index.html -->
<script type="text/javascript">
   (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
   m[i].l=1*new Date();k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
   (window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");

   ym(YANDEX_METRICA_ID, "init", {
        clickmap:true,
        trackLinks:true,
        accurateTrackBounce:true
   });
</script>
```

И обновите `YANDEX_METRICA_ID` в `script.js`.

## Структура страницы

1. **Hero-секция** - Главный экран с формой заявки
2. **Проблемы** - Знакомые проблемы клиентов
3. **Решение** - Как мы решаем проблемы
4. **Преимущества** - Почему выбирают нас
5. **Услуги** - Все направления компании
6. **Об эксперте** - Дмитрий Пичугин
7. **Процесс работы** - Как мы работаем
8. **Социальное доказательство** - Нам доверяют
9. **Финальный CTA** - Форма заявки
10. **Футер** - Контакты и ссылки

## Цветовая схема

- **Основной цвет:** #0066CC (синий)
- **Акцентный цвет:** #FF6B35 (оранжевый)
- **Текст:** #1A1A1A (темно-серый)
- **Фон:** #F8F9FA (светло-серый)

## Браузерная поддержка

- Chrome (последние версии)
- Firefox (последние версии)
- Safari (последние версии)
- Edge (последние версии)
- Мобильные браузеры

## Производительность

- Минимальные зависимости (только Google Fonts)
- Оптимизированные стили
- Ленивая загрузка анимаций
- Быстрая загрузка страницы

## Дальнейшие улучшения

- [ ] Интеграция с CRM системой
- [ ] Email-уведомления о заявках
- [ ] Онлайн-калькулятор стоимости
- [ ] Галерея выполненных работ
- [ ] Блог/статьи о климате
- [ ] Чат-бот для консультаций
- [ ] Мультиязычность

## Поддержка

При возникновении вопросов обращайтесь к разработчику или менеджеру проекта.

---

**Версия:** 1.0  
**Дата создания:** 2024  
**Статус:** Готов к использованию


