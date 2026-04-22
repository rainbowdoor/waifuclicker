/**
 * ============================================================
 *  server.js — бэкенд WaifuClicker
 *  Node.js + Express
 *  Запуск: node server.js
 *  Деплой: Render.com (бесплатно)
 * ============================================================
 */

const express = require("express");
const cors    = require("cors");
const crypto  = require("crypto");

const app = express();
app.use(express.json());
app.use(cors());

const BOT_TOKEN = process.env.BOT_TOKEN || "ВСТАВЬ_ТОКЕН_СЮДА";
const TG_API    = `https://api.telegram.org/bot${BOT_TOKEN}`;

/* ── ПРОСТАЯ IN-MEMORY БД (замени на Supabase/PostgreSQL в проде) ── */
const db = {
  players: {},   // { userId: { coins, gems, clicks, level, ownedIds, referredBy, referrals[] } }
  leaderboard: [],
  claimedChannels: {} // { userId_channelId: true }
};

/* ── УТИЛИТЫ ── */

// Верификация Telegram WebApp данных
function verifyTelegramData(initData) {
  try {
    const params = new URLSearchParams(initData);
    const hash = params.get("hash");
    params.delete("hash");
    const keys = [...params.keys()].sort();
    const checkStr = keys.map(k => `${k}=${params.get(k)}`).join("\n");
    const secret = crypto.createHmac("sha256", "WebAppData").update(BOT_TOKEN).digest();
    const expected = crypto.createHmac("sha256", secret).update(checkStr).digest("hex");
    return expected === hash;
  } catch { return false; }
}

function getUserId(req) {
  const initData = req.headers["x-telegram-init-data"];
  if (!initData) return null;
  if (process.env.NODE_ENV !== "production") return req.headers["x-user-id"] || "test_user";
  if (!verifyTelegramData(initData)) return null;
  const params = new URLSearchParams(initData);
  const user = JSON.parse(params.get("user") || "{}");
  return user.id ? String(user.id) : null;
}

function getOrCreatePlayer(userId) {
  if (!db.players[userId]) {
    db.players[userId] = {
      userId,
      coins: 0, gems: 5,
      clicks: 0, level: 1,
      ownedIds: ["sakura"],
      equippedId: "sakura",
      referredBy: null,
      referrals: [],
      claimedReferBonus: false
    };
  }
  return db.players[userId];
}

/* ── МАРШРУТЫ ── */

// Получить/создать игрока
app.get("/api/player", (req, res) => {
  const uid = getUserId(req);
  if (!uid) return res.status(401).json({ error: "Unauthorized" });
  const ref = req.query.ref;
  const player = getOrCreatePlayer(uid);
  // Реферал при первом входе
  if (ref && ref !== uid && !player.referredBy) {
    player.referredBy = ref;
    const refPlayer = db.players[ref];
    if (refPlayer && !refPlayer.referrals.includes(uid)) {
      refPlayer.referrals.push(uid);
      refPlayer.gems += 15; // бонус пригласившему
    }
    player.gems += 10; // бонус пришедшему
  }
  res.json(player);
});

// Сохранить прогресс
app.post("/api/player/save", (req, res) => {
  const uid = getUserId(req);
  if (!uid) return res.status(401).json({ error: "Unauthorized" });
  const player = getOrCreatePlayer(uid);
  const { coins, gems, clicks, level, ownedIds, equippedId } = req.body;
  if (typeof coins   === "number") player.coins    = coins;
  if (typeof gems    === "number") player.gems     = gems;
  if (typeof clicks  === "number") player.clicks   = clicks;
  if (typeof level   === "number") player.level    = level;
  if (Array.isArray(ownedIds))     player.ownedIds = ownedIds;
  if (equippedId)                  player.equippedId = equippedId;
  updateLeaderboard(uid, player.clicks);
  res.json({ ok: true });
});

// Таблица лидеров
function updateLeaderboard(userId, clicks) {
  const existing = db.leaderboard.findIndex(e => e.userId === userId);
  if (existing >= 0) db.leaderboard[existing].clicks = clicks;
  else db.leaderboard.push({ userId, clicks });
  db.leaderboard.sort((a,b) => b.clicks - a.clicks);
  if (db.leaderboard.length > 100) db.leaderboard = db.leaderboard.slice(0, 100);
}

app.get("/api/leaderboard", async (req, res) => {
  const top = db.leaderboard.slice(0, 50);
  // Обогащаем именами из Telegram (в продакшне кешируй)
  const enriched = top.map((e, i) => ({
    rank: i + 1,
    userId: e.userId,
    name: db.players[e.userId]?.name || `Игрок #${e.userId.slice(-4)}`,
    clicks: e.clicks
  }));
  res.json(enriched);
});

// Обновить имя игрока (при старте)
app.post("/api/player/setname", (req, res) => {
  const uid = getUserId(req);
  if (!uid) return res.status(401).json({ error: "Unauthorized" });
  const player = getOrCreatePlayer(uid);
  player.name = req.body.name || "Аноним";
  player.avatar = req.body.avatar || null;
  res.json({ ok: true });
});

/* ── ГАЧА ── */
app.post("/api/gacha/pull", (req, res) => {
  const uid = getUserId(req);
  if (!uid) return res.status(401).json({ error: "Unauthorized" });
  const player = getOrCreatePlayer(uid);
  const { count } = req.body; // 1 или 10
  const pulls = Math.min(count || 1, 10);
  const costPerPull = 10; // gems
  const total = pulls * costPerPull;

  if (player.gems < total) return res.status(400).json({ error: "Недостаточно кристаллов" });
  player.gems -= total;

  // Вероятности
  const RATES = { N: 0.50, R: 0.30, SR: 0.15, SSR: 0.05 };
  const results = [];
  for (let i = 0; i < pulls; i++) {
    const r = Math.random();
    let rarity = "N";
    if (r < RATES.SSR) rarity = "SSR";
    else if (r < RATES.SSR + RATES.SR) rarity = "SR";
    else if (r < RATES.SSR + RATES.SR + RATES.R) rarity = "R";
    results.push({ rarity, roll: r });
  }

  // Добавляем новых персонажей (не дублируем)
  const newChars = [];
  results.forEach(res => {
    // здесь в продакшне выбирай конкретного персонажа по редкости
    // сейчас просто возвращаем редкость, фронт сам выбирает
    newChars.push(res);
  });

  res.json({ results, gems: player.gems });
});

/* ── TELEGRAM STARS ОПЛАТА ── */
app.post("/api/stars/invoice", async (req, res) => {
  const uid = getUserId(req);
  if (!uid) return res.status(401).json({ error: "Unauthorized" });
  const { package: pkg } = req.body;

  const packages = {
    small:  { title: "50 кристаллов",  gems: 50,  stars: 50  },
    medium: { title: "130 кристаллов", gems: 130, stars: 100 },
    large:  { title: "300 кристаллов", gems: 300, stars: 200 },
    mega:   { title: "700 кристаллов", gems: 700, stars: 400 }
  };

  const pack = packages[pkg];
  if (!pack) return res.status(400).json({ error: "Неверный пакет" });

  try {
    const r = await fetch(`${TG_API}/createInvoiceLink`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: pack.title,
        description: `Получи ${pack.gems} кристаллов в WaifuClicker`,
        payload: JSON.stringify({ userId: uid, gems: pack.gems, pkg }),
        currency: "XTR",
        prices: [{ label: pack.title, amount: pack.stars }]
      })
    });
    const data = await r.json();
    if (!data.ok) throw new Error(data.description);
    res.json({ url: data.result });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

// Webhook от Telegram — подтверждение оплаты
app.post("/api/webhook", async (req, res) => {
  const update = req.body;
  res.json({ ok: true }); // отвечаем сразу

  if (update.pre_checkout_query) {
    await fetch(`${TG_API}/answerPreCheckoutQuery`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pre_checkout_query_id: update.pre_checkout_query.id, ok: true })
    });
  }

  if (update.message?.successful_payment) {
    const payload = JSON.parse(update.message.successful_payment.invoice_payload);
    const player = getOrCreatePlayer(payload.userId);
    player.gems += payload.gems;
    console.log(`Начислено ${payload.gems} кристаллов игроку ${payload.userId}`);
  }
});

// Установить webhook
app.get("/api/set-webhook", async (req, res) => {
  const host = req.query.host;
  if (!host) return res.json({ error: "Укажи ?host=https://твой-сервер.render.com" });
  const r = await fetch(`${TG_API}/setWebhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: `${host}/api/webhook` })
  });
  const data = await r.json();
  res.json(data);
});

/* ── ПОДПИСКА НА КАНАЛЫ ── */
app.post("/api/channels/claim", async (req, res) => {
  const uid = getUserId(req);
  if (!uid) return res.status(401).json({ error: "Unauthorized" });
  const { channelId } = req.body;
  const key = `${uid}_${channelId}`;

  if (db.claimedChannels[key]) {
    return res.status(400).json({ error: "Уже получено" });
  }

  // Проверяем подписку через Telegram API
  try {
    const r = await fetch(`${TG_API}/getChatMember`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: channelId, user_id: uid })
    });
    const data = await r.json();
    const status = data.result?.status;
    const isSubscribed = ["member","administrator","creator"].includes(status);

    if (!isSubscribed) {
      return res.status(400).json({ error: "Не подписан на канал" });
    }

    db.claimedChannels[key] = true;
    res.json({ ok: true, subscribed: true });
  } catch(e) {
    // В тестовом режиме — разрешаем
    if (process.env.NODE_ENV !== "production") {
      db.claimedChannels[key] = true;
      return res.json({ ok: true, subscribed: true });
    }
    res.status(500).json({ error: "Ошибка проверки" });
  }
});

// Проверить какие каналы уже получены
app.post("/api/channels/status", (req, res) => {
  const uid = getUserId(req);
  if (!uid) return res.status(401).json({ error: "Unauthorized" });
  const { channelIds } = req.body;
  const result = {};
  (channelIds || []).forEach(id => {
    result[id] = !!db.claimedChannels[`${uid}_${id}`];
  });
  res.json(result);
});

/* ── ЗАПУСК ── */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`WaifuClicker server running on port ${PORT}`));
