/**
 * ============================================================
 *  БАЗА ПЕРСОНАЖЕЙ — редактируй здесь!
 * ============================================================
 *
 *  Структура персонажа:
 *  {
 *    id:        уникальный строковый ID (не менять после запуска)
 *    name:      имя персонажа
 *    category:  "anime" | "game"
 *    rarity:    "N" | "R" | "SR" | "SSR"
 *    image:     путь к картинке, например "images/anime/sakura.png"
 *              (используй любой формат: jpg, png, webp, svg, gif)
 *              или внешняя ссылка: "https://example.com/char.png"
 *    desc:      описание персонажа (показывается в модалке)
 *    clickBonus:  бонус к монетам за клик
 *    cpsBonus:    бонус монет в секунду (пассивный)
 *    price:     цена в монетах (если 0 — стартовый бесплатный)
 *    gemPrice:  цена в кристаллах (замените price на 0 если только за гемы)
 *    isDefault: true — персонаж открыт сразу, без покупки
 *  }
 *
 *  КАК ДОБАВИТЬ ПЕРСОНАЖА:
 *  1. Добавь картинку в папку images/anime/ или images/game/
 *  2. Скопируй блок ниже и заполни поля
 *  3. Сохрани файл — персонаж появится в магазине автоматически
 * ============================================================
 */

const CHARACTERS = [

  /* ─── АНИМЕ ─────────────────────────────────────── */

  {
    id: "sakura",
    name: "Сакура",
    category: "anime",
    rarity: "SR",
    image: "images/anime/sakura.svg",
    desc: "Хранительница звёздного света. Её улыбка заряжает силой на весь день.",
    clickBonus: 1,
    cpsBonus: 0,
    price: 0,
    gemPrice: 0,
    isDefault: true
  },
  {
    id: "luna",
    name: "Луна",
    category: "anime",
    rarity: "SR",
    image: "images/anime/luna.svg",
    desc: "Лунная воительница с серебристыми волосами. Её стрелы никогда не промахиваются.",
    clickBonus: 2,
    cpsBonus: 1,
    price: 500,
    gemPrice: 0,
    isDefault: false
  },
  {
    id: "yuki",
    name: "Юки",
    category: "anime",
    rarity: "SSR",
    image: "images/anime/yuki.svg",
    desc: "Снежная богиня. Один её взгляд замораживает время.",
    clickBonus: 4,
    cpsBonus: 3,
    price: 0,
    gemPrice: 50,
    isDefault: false
  },
  {
    id: "hana",
    name: "Хана",
    category: "anime",
    rarity: "R",
    image: "images/anime/hana.svg",
    desc: "Цветочная принцесса с добрым сердцем. Всегда приносит удачу.",
    clickBonus: 1,
    cpsBonus: 2,
    price: 200,
    gemPrice: 0,
    isDefault: false
  },
  {
    id: "rin",
    name: "Рин",
    category: "anime",
    rarity: "SSR",
    image: "images/anime/rin.svg",
    desc: "Демоница с хвостом и острыми клыками. Редкий лимитированный персонаж.",
    clickBonus: 6,
    cpsBonus: 5,
    price: 0,
    gemPrice: 120,
    isDefault: false
  },

  /* ─── ИГРОВЫЕ ────────────────────────────────────── */

  {
    id: "elara",
    name: "Элара",
    category: "game",
    rarity: "SR",
    image: "images/game/elara.svg",
    desc: "Эльфийский лучник из Темного леса. Меткий стрелок и верный союзник.",
    clickBonus: 2,
    cpsBonus: 2,
    price: 600,
    gemPrice: 0,
    isDefault: false
  },
  {
    id: "nyx",
    name: "Никс",
    category: "game",
    rarity: "SSR",
    image: "images/game/nyx.svg",
    desc: "Теневой маг из мира Fantasy Realms. Повелитель тьмы и звёзд.",
    clickBonus: 5,
    cpsBonus: 4,
    price: 0,
    gemPrice: 80,
    isDefault: false
  },
  {
    id: "aria",
    name: "Ария",
    category: "game",
    rarity: "R",
    image: "images/game/aria.svg",
    desc: "Паладин Света. Защищает слабых и карает злых.",
    clickBonus: 1,
    cpsBonus: 3,
    price: 250,
    gemPrice: 0,
    isDefault: false
  }

  /*
   *  ── ШАБЛОН ДЛЯ НОВОГО ПЕРСОНАЖА ──
   *  Скопируй блок ниже и заполни:
   *
   *  ,{
   *    id: "unique_id",
   *    name: "Имя",
   *    category: "anime",       // anime | game
   *    rarity: "SSR",           // N | R | SR | SSR
   *    image: "images/anime/filename.png",
   *    desc: "Описание...",
   *    clickBonus: 3,
   *    cpsBonus: 2,
   *    price: 0,
   *    gemPrice: 60,
   *    isDefault: false
   *  }
   */
];

/* Вспомогательные данные редкостей */
const RARITY_STARS = { N: "★ N", R: "★★ R", SR: "★★★ SR", SSR: "★★★★ SSR" };
const RARITY_ORDER = { N: 0, R: 1, SR: 2, SSR: 3 };
