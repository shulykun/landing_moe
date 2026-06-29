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

// ─── Email ───
let transporter = null;
try {
  const nodemailer = require('nodemailer');
  const ec = config.email || {};
  if (ec.user && ec.pass) {
    transporter = nodemailer.createTransport({
      host: ec.host || 'smtp.yandex.ru',
      port: ec.port || 465,
      secure: ec.secure !== false,
      auth: { user: ec.user, pass: ec.pass },
    });
    console.log('📧 Email transport ready');
  } else {
    console.log('📧 Email not configured (set email.user/pass in config.json)');
  }
} catch (e) {
  console.log('📧 nodemailer not available:', e.message);
}

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

  // 📧 Send emails
  const emailTo = (config.email && config.email.to) || ['shulginov@roborumba.com', 'pichuginda@bk.ru'];
  if (transporter && emailTo.length > 0) {
    const emailBody =
      `Новая заявка с сайта Climate Hall\n\n` +
      `📞 Телефон: ${data.contact}\n` +
      `🏠 Тип помещения: ${typeName}\n` +
      `📏 Площадь: ${areaStr}\n` +
      `🔧 Особые условия: ${extrasStr}\n\n` +
      `—\nОтправлено с ${config.siteUrl || 'climate.roborumba.com'}`;

    for (const addr of emailTo) {
      try {
        await transporter.sendMail({
          from: config.email.from || config.email.user,
          to: addr,
          subject: `📬 Новая заявка — ${data.contact}`,
          text: emailBody,
        });
        console.log(`📧 Email sent to ${addr}`);
      } catch (err) {
        console.error(`❌ Email to ${addr} failed:`, err.message);
      }
    }
  } else {
    console.log('📧 Email not sent — transporter not configured');
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
