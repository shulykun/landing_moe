# 🧊 AC MVP — Система приёма заявок на кондиционеры + MCP сервер

## Состав проекта

```
ac-mvp/
├── index.html          ← Лендинг с шаговым калькулятором
├── server.js           ← Express сервер (статика + API + Telegram-бот)
├── mcp-server.mjs      ← MCP сервер (Model Context Protocol)
├── package.json        ← зависимости
├── config.json         ← токены
├── .gitignore
└── leads/              ← лиды (JSON)
```

## 🚀 Быстрый старт

```bash
cd ac-mvp
npm install

# 1. Вписать токены
#    vim config.json
#    {
#      "botToken": "7890123456:AAG...",
#      "adminId": "123456789",
#      "siteUrl": "https://your-site.ru"
#    }

# 2. Запустить веб-сервер + бота
npm start
# → http://localhost:3000

# 3. (опционально) MCP сервер для AI
node mcp-server.mjs
```

## 🔌 MCP Сервер

MCP сервер даёт AI-агентам (OpenClaw, Claude Desktop и др.) инструменты для работы с бизнесом.

### Инструменты

| Инструмент | Описание |
|---|---|
| `calc_price` | Рассчитать стоимость установки |
| `list_leads` | Посмотреть заявки |
| `get_lead` | Детали заявки по ID |
| `create_config` | Сохранить токены |

### Подключение к MCP-клиенту

**OpenClaw:**
```json
{
  "mcpServers": {
    "ac-install": {
      "command": "node",
      "args": ["/path/to/ac-mvp/mcp-server.mjs"]
    }
  }
}
```

**Claude Desktop:**
```json
{
  "mcpServers": {
    "ac-install": {
      "command": "node",
      "args": ["/path/to/ac-mvp/mcp-server.mjs"]
    }
  }
}
```

## 📋 Взаимодействие

```
Яндекс.Директ → Лендинг (index.html)
                      ↓
              POST /api/lead
                      ↓
            server.js → Telegram Bot → Админ + Клиент
                      ↓
                  leads/lead-*.json
                      ↓
            MCP Server → AI (список лидов, расчёт цен)
```
