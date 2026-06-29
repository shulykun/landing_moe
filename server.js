// ac-mvp/server.js — Backend: статика + приём лидов + Telegram-бот
const express = require('express');
const path = require('path');
const { Telegraf } = require('telegraf');
const fs = require('fs');
const { exec } = require('child_process');

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

  if (!data || !data.contact) {
    return res.status(400).json({ ok: false, error: 'contact required' });
  }

  const typeName = data.type || 'Не указан';
  const areaStr = data.area ? `${data.area} м²` : 'Не указана';
  const extrasStr = data.extras && data.extras.length > 0 ? `Особенности: ${data.extras.join(', ')}` : '—';

  console.log('📥 New lead:', data.contact, typeName, areaStr);

  // Save to JSON log
  const logDir = path.join(__dirname, 'leads');
  if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);
  const logFile = path.join(logDir, `lead-${Date.now()}.json`);
  fs.writeFileSync(logFile, JSON.stringify(data, null, 2));

  // Format message
  const leadMsg =
    `📬 *Новая заявка!*\n\n` +
    `📞 Телефон: ${data.contact}\n` +
    `🏠 Тип: ${typeName}\n` +
    `📏 Площадь: ${areaStr}\n` +
    `🔧 ${extrasStr}\n`;

  // Send to admin via Telegram
  if (bot && ADMIN_ID) {
    try {
      await bot.telegram.sendMessage(ADMIN_ID, leadMsg, { parse_mode: 'Markdown' });
      console.log('📨 Telegram notification sent');
    } catch (err) {
      console.error('❌ Telegram notify failed:', err.message);
    }
  }

  // 📧 Send emails via msmtp (без PHP!)
  const emailBody =
    `From: Climate Hall <shulginov@roborumba.com>\n` +
    `Subject: 📬 Новая заявка — ${data.contact}\n` +
    `MIME-Version: 1.0\n` +
    `Content-Type: text/plain; charset=utf-8\n` +
    `Content-Transfer-Encoding: 8bit\n\n` +
    `Новая заявка с сайта Climate Hall — установка кондиционеров\n` +
    `========================================================\n\n` +
    `📞 Телефон: ${data.contact}\n` +
    `🏠 Тип:      ${typeName}\n` +
    `📏 Площадь:  ${areaStr}\n` +
    `🔧 Условия:  ${extrasStr}\n\n` +
    `Дата: ${new Date().toLocaleString('ru-RU')}\n`;

  const mailTo = ['shulginov@roborumba.com', 'pichuginda@bk.ru'];
  for (const addr of mailTo) {
    exec(`echo ${JSON.stringify(emailBody)} | msmtp -a yandex ${addr}`, (err) => {
      if (err) console.error(`❌ Email to ${addr}:`, err.message);
      else console.log(`📧 Email sent to ${addr}`);
    });
  }

  res.json({ ok: true });
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

// Graceful shutdown
process.once('SIGINT', () => { bot?.stop('SIGINT'); });
process.once('SIGTERM', () => { bot?.stop('SIGTERM'); });
