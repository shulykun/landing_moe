# База знаний ClimateHall

Собранные материалы из телеграм канала: https://t.me/s/climate_hall

## Собранные данные

- `telegram_messages.json` - все сообщения в JSON формате
- `telegram_products.md` - информация о продукции
- `telegram_advantages.md` - преимущества компании
- `telegram_marketing.md` - маркетинговые материалы

## Обновление данных

Для обновления базы знаний используйте скрипты из папки `../scripts/`:

```bash
cd ../scripts
pip3 install -r requirements.txt
python3 scrape_telegram_web.py
```
