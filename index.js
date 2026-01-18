const express = require('express');
const cors = require("cors");
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const TelegramBot = require('node-telegram-bot-api');

const app = express();
app.use(cors());
app.set('trust proxy', true);
const PORT = process.env.PORT || 3000;

// Load reasons from JSON
const reasons = JSON.parse(fs.readFileSync('./reasons.json', 'utf-8'));

// Rate limiter: 120 requests per minute per IP
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 120,
  keyGenerator: (req, res) => {
    return req.headers['cf-connecting-ip'] || req.ip; // Fallback if header missing (or for non-CF)
  },
  message: { error: "Too many requests, please try again later. (120 reqs/min/IP)" }
});

app.use(limiter);

// Random rejection reason endpoint
app.get('/no', (req, res) => {
  const reason = reasons[Math.floor(Math.random() * reasons.length)];
  res.json({ reason });
});

// Start server
app.listen(PORT, () => {
  console.log(`No-as-a-Service is running on port ${PORT}`);
});

// Telegram Bot - Inline mode for @whynoreasonbot
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_NO_AS_A_SERVICE_TOKEN;
if (TELEGRAM_BOT_TOKEN) {
  const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

  bot.on('inline_query', (query) => {
    const reason = reasons[Math.floor(Math.random() * reasons.length)];

    const results = [{
      type: 'article',
      id: Math.random().toString(36).substring(2, 10),
      title: 'No.',
      description: reason,
      input_message_content: {
        message_text: `*No.*\n\n${reason}`,
        parse_mode: 'Markdown'
      }
    }];

    bot.answerInlineQuery(query.id, results, { cache_time: 0 });
  });

  console.log('Telegram bot started in inline mode');
} else {
  console.log('TELEGRAM_BOT_NO_AS_A_SERVICE_TOKEN not set, bot disabled');
}
