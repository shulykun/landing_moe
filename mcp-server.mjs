#!/usr/bin/env node
// ac-mvp/mcp-server.mjs — MCP сервер для системы кондиционеров
// Model Context Protocol — даёт AI инструменты для работы с бизнесом

import { spawn } from 'child_process';
import { createInterface } from 'readline';
import { readFileSync, readdirSync, existsSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const LEADS_DIR = join(__dirname, 'leads');
const CONFIG_PATH = join(__dirname, 'config.json');

// ─── Config ───
let config = {};
if (existsSync(CONFIG_PATH)) {
  try { config = JSON.parse(readFileSync(CONFIG_PATH, 'utf-8')); } catch {}
}

// ─── MCP Protocol ───
// stdio-based: stdin читает JSON-RPC, stdout пишет ответы

const rl = createInterface({ input: process.stdin });

// Инструменты, которые мы предоставляем
const TOOLS = [
  {
    name: 'calc_price',
    description: 'Рассчитать стоимость установки кондиционера под ключ',
    inputSchema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['house', 'apartment', 'office', 'studio'],
          description: 'Тип помещения'
        },
        rooms: {
          type: 'integer',
          minimum: 1,
          maximum: 10,
          description: 'Количество комнат для охлаждения'
        },
        extras: {
          type: 'array',
          items: { type: 'string' },
          description: 'Доп. работы: highFloor, cage, longRoute, brick, drain'
        }
      },
      required: ['type', 'rooms']
    }
  },
  {
    name: 'list_leads',
    description: 'Посмотреть последние заявки (лиды)',
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'integer',
          description: 'Сколько последних показать (по умолч. 10)',
          default: 10
        }
      }
    }
  },
  {
    name: 'get_lead',
    description: 'Получить детали конкретной заявки по ID',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'Имя файла лида (например lead-1719000000000.json)'
        }
      },
      required: ['id']
    }
  },
  {
    name: 'create_config',
    description: 'Сохранить конфигурацию (токен бота, adminId, siteUrl)',
    inputSchema: {
      type: 'object',
      properties: {
        botToken: { type: 'string', description: 'Telegram Bot Token' },
        adminId: { type: 'string', description: 'Telegram Admin ID' },
        siteUrl: { type: 'string', description: 'URL сайта' }
      }
    }
  }
];

// ─── Price Engine ───
const PRICES = {
  baseUnit: 28900,
  install: 7500,
  materials: 3500,
  seasonDiscount: 3000,
  roomMultiplier: [0, 1, 1.8, 2.5, 3.2, 3.8, 4.5],
  extrasPrices: {
    highFloor: 1500,
    cage: 2500,
    longRoute: 2000,
    brick: 3000,
    drain: 1500
  }
};

const TYPE_LABELS = {
  house: 'Частный дом',
  apartment: 'Квартира',
  office: 'Магазин/Офис',
  studio: 'Студия/Апартаменты'
};

function calcPrice(type, rooms, extras = []) {
  const mult = PRICES.roomMultiplier[Math.min(rooms, 6)] || 4.5;
  const unitPrice = Math.round(PRICES.baseUnit * mult);
  const installPrice = Math.round(PRICES.install * mult);

  let extrasPrice = 0;
  for (const ex of extras) {
    if (PRICES.extrasPrices[ex]) extrasPrice += PRICES.extrasPrices[ex];
  }

  const total = unitPrice + installPrice + PRICES.materials + extrasPrice;

  return {
    type: TYPE_LABELS[type] || type,
    rooms,
    extras: extras.map(e => ({ key: e, price: PRICES.extrasPrices[e] || 0 })),
    price: {
      unit: unitPrice,
      install: installPrice,
      materials: PRICES.materials,
      extras: extrasPrice,
      total
    },
    breakdown: [
      { item: 'Оборудование (премиум)', amount: unitPrice },
      { item: 'Монтаж профессиональный', amount: installPrice },
      { item: 'Материалы качественные', amount: PRICES.materials },
      ...(extrasPrice > 0 ? [{ item: 'Особые условия', amount: extrasPrice }] : []),
    ],
    summary: `${TYPE_LABELS[type] || type}, ${rooms} ${rooms === 1 ? 'комната' : rooms < 5 ? 'комнаты' : 'комнат'} — ${formatPrice(total)}`
  };
}

function formatPrice(n) {
  return n.toLocaleString('ru-RU') + ' ₽';
}

// ─── Tool Handlers ───
async function handleToolCall(name, args) {
  switch (name) {
    case 'calc_price': {
      const result = calcPrice(args.type, args.rooms, args.extras || []);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
      };
    }

    case 'list_leads': {
      if (!existsSync(LEADS_DIR)) {
        return { content: [{ type: 'text', text: 'Лидов пока нет' }] };
      }
      const files = readdirSync(LEADS_DIR)
        .filter(f => f.endsWith('.json'))
        .sort()
        .reverse()
        .slice(0, args.limit || 10);

      const leads = files.map(f => {
        try {
          const data = JSON.parse(readFileSync(join(LEADS_DIR, f), 'utf-8'));
          return { id: f, name: data.name, contact: data.contact, type: data.type, rooms: data.rooms, total: data.price?.total, timestamp: f.replace('lead-', '').replace('.json', '') };
        } catch { return { id: f, error: 'parse error' }; }
      });

      return {
        content: [{ type: 'text', text: JSON.stringify(leads, null, 2) }]
      };
    }

    case 'get_lead': {
      const filePath = join(LEADS_DIR, args.id);
      if (!existsSync(filePath)) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Lead ${args.id} not found` }]
        };
      }
      const data = JSON.parse(readFileSync(filePath, 'utf-8'));
      return {
        content: [{ type: 'text', text: JSON.stringify(data, null, 2) }]
      };
    }

    case 'create_config': {
      const updated = { ...config, ...args };
      writeFileSync(CONFIG_PATH, JSON.stringify(updated, null, 2));
      config = updated;
      return {
        content: [{ type: 'text', text: '✅ Конфигурация сохранена' }]
      };
    }

    default:
      return {
        isError: true,
        content: [{ type: 'text', text: `Unknown tool: ${name}` }]
      };
  }
}

// ─── Явная инициализация (заглушка для MCP Inspector) ───
// Отвечаем «готов» на stdin до первого JSON-RPC
process.stdout.write('MCP AC Server ready\n');

// ─── JSON-RPC обработчик ───
let buffer = '';
rl.on('line', async (line) => {
  buffer += line;
  let msg;
  try {
    msg = JSON.parse(buffer);
    buffer = '';
  } catch {
    // Неполный JSON — ждём ещё
    return;
  }

  // JSON-RPC 2.0
  if (msg.jsonrpc !== '2.0') return;

  const { id, method, params } = msg;

  try {
    switch (method) {
      case 'initialize': {
        sendResponse(id, {
          protocolVersion: '0.1.0',
          capabilities: {
            tools: {}
          },
          serverInfo: {
            name: 'ac-mcp-server',
            version: '1.0.0'
          }
        });
        break;
      }

      case 'tools/list': {
        sendResponse(id, { tools: TOOLS });
        break;
      }

      case 'tools/call': {
        const result = await handleToolCall(params.name, params.arguments || {});
        sendResponse(id, result);
        break;
      }

      case 'resources/list': {
        sendResponse(id, { resources: [] });
        break;
      }

      default:
        sendResponse(id, {
          isError: true,
          content: [{ type: 'text', text: `Unknown method: ${method}` }]
        });
    }
  } catch (err) {
    sendResponse(id, {
      isError: true,
      content: [{ type: 'text', text: `Error: ${err.message}` }]
    });
  }
});

function sendResponse(id, result) {
  const msg = JSON.stringify({ jsonrpc: '2.0', id, result }) + '\n';
  process.stdout.write(msg);
}
