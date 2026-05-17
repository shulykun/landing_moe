#!/usr/bin/env python3
"""
Скрипт для извлечения данных из публичного Telegram канала через веб-интерфейс
Использует requests и BeautifulSoup для парсинга
"""

import requests
from bs4 import BeautifulSoup
import json
import re
from datetime import datetime
import time

CHANNEL_URL = 'https://t.me/s/climate_hall'

def scrape_telegram_channel():
    """Извлекает сообщения из публичного Telegram канала"""
    
    print(f"Попытка получить данные из {CHANNEL_URL}...")
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    
    try:
        response = requests.get(CHANNEL_URL, headers=headers, timeout=10)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Telegram веб-интерфейс использует определенную структуру
        # Ищем сообщения в div с классом tgme_widget_message
        messages = soup.find_all('div', class_='tgme_widget_message')
        
        if not messages:
            # Попробуем альтернативный селектор
            messages = soup.find_all('div', {'data-post': True})
        
        print(f"Найдено сообщений: {len(messages)}")
        
        messages_data = []
        
        for msg in messages:
            try:
                # Извлекаем текст сообщения
                text_elem = msg.find('div', class_='tgme_widget_message_text')
                if not text_elem:
                    text_elem = msg.find('div', class_='message')
                
                text = text_elem.get_text(strip=True) if text_elem else ""
                
                # Извлекаем дату
                date_elem = msg.find('time', class_='time')
                if not date_elem:
                    date_elem = msg.find('a', class_='tgme_widget_message_date')
                
                date = date_elem.get('datetime', '') if date_elem else ""
                
                # Извлекаем ID поста
                post_id = msg.get('data-post', '')
                if not post_id:
                    link_elem = msg.find('a', class_='tgme_widget_message_date')
                    if link_elem:
                        href = link_elem.get('href', '')
                        post_id = href.split('/')[-1] if href else ""
                
                if text:
                    messages_data.append({
                        'id': post_id or len(messages_data) + 1,
                        'date': date,
                        'text': text,
                        'source': 'web_scrape'
                    })
            except Exception as e:
                print(f"Ошибка при обработке сообщения: {e}")
                continue
        
        print(f"Успешно извлечено сообщений: {len(messages_data)}")
        
        if messages_data:
            # Сохраняем в JSON
            output_file = 'telegram_messages.json'
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump({
                    'channel': 'climate_hall',
                    'channel_url': CHANNEL_URL,
                    'total_messages': len(messages_data),
                    'collected_at': datetime.now().isoformat(),
                    'messages': messages_data
                }, f, ensure_ascii=False, indent=2)
            
            print(f"Данные сохранены в {output_file}")
            
            # Категоризируем сообщения
            categorize_messages(messages_data)
        else:
            print("⚠️  Не удалось извлечь сообщения. Возможные причины:")
            print("   - Канал приватный (нужен доступ через API)")
            print("   - Изменилась структура HTML Telegram")
            print("   - Требуется авторизация")
            print("\nПопробуйте использовать collect_telegram_data.py с Telethon API")
        
    except requests.exceptions.RequestException as e:
        print(f"Ошибка при запросе: {e}")
        print("\nПопробуйте использовать другой метод сбора данных")
    except Exception as e:
        print(f"Неожиданная ошибка: {e}")

def categorize_messages(messages):
    """Категоризирует сообщения по типам"""
    
    categories = {
        'products': [],
        'advantages': [],
        'faq': [],
        'testimonials': [],
        'pricing': [],
        'technical': [],
        'marketing': []
    }
    
    keywords = {
        'products': ['кондиционер', 'вентиляция', 'отопление', 'очистка', 'продукт', 'модель', 'бренд', 'оборудование', 'система'],
        'advantages': ['преимуществ', 'почему', 'выбирают', 'гарантия', 'опыт', 'лучш', 'качеств', 'профессионал'],
        'faq': ['вопрос', 'как', 'сколько', 'что такое', 'зачем', 'почему', 'можно ли'],
        'testimonials': ['отзыв', 'рекомендую', 'спасибо', 'доволен', 'клиент', 'заказчик', 'установил'],
        'pricing': ['цена', 'стоимость', 'рублей', 'руб', 'скидка', 'акция', 'специальное предложение', 'стоит'],
        'technical': ['техническ', 'характеристик', 'мощность', 'установка', 'монтаж', 'настройка', 'параметр'],
    }
    
    for msg in messages:
        text_lower = msg['text'].lower()
        categorized = False
        
        for category, words in keywords.items():
            if any(word in text_lower for word in words):
                categories[category].append(msg)
                categorized = True
                break
        
        if not categorized:
            categories['marketing'].append(msg)
    
    # Сохраняем по категориям
    for category_name, category_messages in categories.items():
        if category_messages:
            save_category(category_name, category_messages)
    
    print("\nКатегоризация завершена:")
    for category_name, category_messages in categories.items():
        print(f"  {category_name}: {len(category_messages)}")

def save_category(category_name, messages):
    """Сохраняет сообщения категории в файл"""
    filename = f'telegram_{category_name}.md'
    
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(f"# {category_name.upper()}\n\n")
        f.write(f"Собрано сообщений: {len(messages)}\n\n")
        f.write(f"Источник: {CHANNEL_URL}\n\n")
        f.write("---\n\n")
        
        for msg in messages:
            f.write(f"## Сообщение #{msg['id']}\n\n")
            if msg['date']:
                f.write(f"**Дата:** {msg['date']}\n\n")
            f.write(f"{msg['text']}\n\n")
            f.write("---\n\n")

if __name__ == '__main__':
    print("=" * 60)
    print("Сбор данных из Telegram канала climate_hall")
    print("=" * 60)
    print()
    
    # Проверка зависимостей
    try:
        import requests
        import bs4
        print("✓ Зависимости установлены")
    except ImportError:
        print("⚠️  Установите зависимости:")
        print("   pip3 install requests beautifulsoup4")
        exit(1)
    
    print("Начинаю сбор данных...\n")
    
    try:
        scrape_telegram_channel()
        print("\n✓ Готово! Данные сохранены.")
    except Exception as e:
        print(f"\n❌ Ошибка: {e}")
        print("\nПроверьте:")
        print("- Подключение к интернету")
        print("- Доступность канала: https://t.me/s/climate_hall")

