/** Ссылка на репозиторий в подвале. Можно переопределить переменной окружения NEXT_PUBLIC_REPO_URL. */
export const REPO_URL =
  process.env.NEXT_PUBLIC_REPO_URL || "https://github.com/pyatakovich-hash/mediakomi";

/** Откуда данные: объявления о продаже квартир в Инте */
export const DATA_URL = "https://www.avito.ru/inta/kvartiry";
