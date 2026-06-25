// ac-mvp/server.js — Backend: статика + приём лидов + Telegram-бот
const express = require('express');
const path = require('path');
const { Telegraf } = require('telegraf');
const fs = require('fs');

// ⚙️ Config
const configPath = path.join(__dirname, 'config.json');
const config = fs.existsSync(configPath) ? JSON.parse(fs.readFileSync(configPath, 'utf-8')) : {};

const PORT = process.env.PORT || 3000;
const BOT_TOKEN = process.env.BOT_TOKEN || config.botToken || '';
const ADMIN_ID = process.env.ADMIN_ID || config.adminId || '';  // Твой Telegram ID
const SITE_URL = process.env.SITE_URL || config.siteUrl || `http://localhost:${PORT}`;

// ─── Bot ───
let bot = null;
if (BOT_TOKEN) {
  bot = new Telegraf(BOT_TOKEN);

  bot.start((ctx) => {
    ctx.reply(
      '🧊 *Кондиционеры под ключ*\n\n' +
      'Я — бот для приёма заявок. Вот что я умею:\n' +
      '• 📥 Принимаю расчёты с сайта\n' +
      '• 📋 Отправляю смету\n' +
      '• 🗓️ Помогаю записаться на монтаж\n\n' +
      'Оставьте заявку на сайте, и я пришлю вам расчёт сюда 👇\n' +
      `${SITE_URL}`,
      { parse_mode: 'Markdown' }
    );
  });

  bot.help((ctx) => ctx.reply('Напишите /start чтобы начать'));

  bot.launch().then(() => {
    console.log('🤖 Telegram bot started');
  }).catch(err => {
    console.error('❌ Bot failed:', err.message);
  });
} else {
  console.log('⚠️ BOT_TOKEN not set — bot disabled. Set BOT_TOKEN env or add to config.json');
}

// ─── Express ───
const app = express();

app.use(express.json());

// Static files
app.use(express.static(path.join(__dirname)));

// ─── API: Lead ───
app.post('/api/lead', async (req, res) => {
  const data = req.body;

  if (!data || !data.name || !data.contact) {
    return res.status(400).json({ ok: false, error: 'name and contact required' });
  }

  console.log('📥 New lead:', data.name, data.contact, data.type, `${data.rooms} room(s)`);

  // Format price
  const fmt = (n) => n.toLocaleString('ru-RU') + ' ₽';

  const priceBlock =
    `📋 *Смета для ${data.name}*\n\n` +
    `🏠 *${data.type}* — ${data.rooms} ${data.rooms === 1 ? 'комната' : data.rooms < 5 ? 'комнаты' : 'комнат'}\n\n` +
    `┌ Оборудование (премиум)${' '.repeat(20)}${fmt(data.price.unit)}\n` +
    `├ Монтаж профессиональный${' '.repeat(19)}${fmt(data.price.install)}\n` +
    `├ Материалы качественные${' '.repeat(20)}${fmt(data.price.materials)}\n` +
    (data.extras.length > 0 ? `├ Особые условия${' '.repeat(27)}${fmt(data.price.extras)}\n` : '') +
    `💎 *ИТОГО: ${fmt(data.price.total)}*\n\n` +
    (data.extras.length > 0 ? `📎 Дополнительно: ${data.extras.join(', ')}\n\n` : '') +
    `📞 Контакт: ${data.contact}\n`;

  // Save to JSON log
  const logDir = path.join(__dirname, 'leads');
  if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);
  const logFile = path.join(logDir, `lead-${Date.now()}.json`);
  fs.writeFileSync(logFile, JSON.stringify(data, null, 2));

  // Send to admin
  let tgLink = null;
  if (bot && ADMIN_ID) {
    try {
      await bot.telegram.sendMessage(ADMIN_ID, priceBlock, { parse_mode: 'Markdown' });
      tgLink = `https://t.me/${bot.botInfo?.username || ''}`;
    } catch (err) {
      console.error('❌ Failed to send to admin:', err.message);
    }
  }

  // Try to DM the user if they gave a username
  if (bot && data.contact) {
    const username = data.contact.replace('@', '').replace('https://t.me/', '').trim();
    if (username && !username.startsWith('+') && !username.includes('.')) {
      try {
        await bot.telegram.sendMessage(`@${username}`,
          `✅ *Ваш расчёт!*\n\n` +
          `${priceBlock}\n` +
          `Жмите /start чтобы записаться на удобное время 🗓️`,
          { parse_mode: 'Markdown' }
        );
        console.log(`📨 DM sent to @${username}`);
      } catch (err) {
        console.log(`⚠️ Could not DM @${username}: ${err.message}`);
      }
    }
  }

  res.json({
    ok: true,
    tgLink: tgLink || (data.contact.startsWith('@') ? `https://t.me/${data.contact.replace('@', '')}` : null),
  });
});

// ─── Health ───
app.get('/api/health', (req, res) => {
  res.json({ ok: true, uptime: process.uptime(), bot: !!bot, leads: 'leads/' });
});

// ─── Start ───
app.listen(PORT, () => {
  console.log(`🧊 AC MVP server running at http://localhost:${PORT}`);
  console.log(`   Open: http://localhost:${PORT}`);
});
