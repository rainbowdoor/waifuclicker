/**
 * ============================================================
 *  КАНАЛЫ ДЛЯ ПОДПИСКИ — настраивается из админки
 *  Редактируй вручную или через admin/index.html
 * ============================================================
 *
 *  Структура канала:
 *  {
 *    id:          уникальный ID записи
 *    channelId:   @username канала или числовой ID (например "@MyChannel" или "-1001234567890")
 *    title:       название, показывается игроку
 *    description: описание (необязательно)
 *    url:         ссылка для подписки (https://t.me/...)
 *    rewardType:  "coins" | "gems" | "clicks_percent"
 *    rewardValue: число:
 *                   coins/gems → фиксированная сумма
 *                   clicks_percent → % от текущих кликов игрока (минимум minReward)
 *    minReward:   минимальная награда для clicks_percent (чтобы новые игроки тоже получали)
 *    active:      true/false — показывать ли задание
 *    icon:        эмодзи иконка
 *  }
 * ============================================================
 */

const CHANNELS = [
  {
    id: "ch1",
    channelId: "@your_tiktok_channel",
    title: "Подпишись на TikTok канал",
    description: "Наш основной аниме-канал",
    url: "https://t.me/your_tiktok_channel",
    rewardType: "clicks_percent",
    rewardValue: 20,
    minReward: 500,
    active: true,
    icon: "🎬"
  },
  {
    id: "ch2",
    channelId: "@your_game_channel",
    title: "Основной канал игры",
    description: "Новости, обновления и ивенты",
    url: "https://t.me/your_game_channel",
    rewardType: "gems",
    rewardValue: 25,
    minReward: 25,
    active: true,
    icon: "🎮"
  },
  {
    id: "ch3",
    channelId: "@your_news_channel",
    title: "Канал с аниме новостями",
    description: "Ежедневные новости из мира аниме",
    url: "https://t.me/your_news_channel",
    rewardType: "clicks_percent",
    rewardValue: 15,
    minReward: 300,
    active: true,
    icon: "📰"
  }

  /*
   * ШАБЛОН:
   * ,{
   *   id: "ch4",
   *   channelId: "@channel_username",
   *   title: "Название задания",
   *   description: "Подробнее...",
   *   url: "https://t.me/channel_username",
   *   rewardType: "clicks_percent",  // или "coins" или "gems"
   *   rewardValue: 20,               // 20% от кликов
   *   minReward: 500,                // минимум 500 кликов даже новичкам
   *   active: true,
   *   icon: "⭐"
   * }
   */
];
