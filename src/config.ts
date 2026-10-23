/** Ссылка на репозиторий в подвале. Можно переопределить переменной окружения NEXT_PUBLIC_REPO_URL. */
export const REPO_URL =
  process.env.NEXT_PUBLIC_REPO_URL || "https://github.com/pyatakovich-hash/mediakomi";

/** Откуда данные: объявления о продаже квартир в Инте */
export const DATA_URL = "https://www.avito.ru/inta/kvartiry";

/** Префикс путей, когда сайт лежит в подпапке (GitHub Pages: /mediakomi) */
export const BASE_PATH = process.env.MK_BASE_PATH || "";
export const withBase = (path: string) => `${BASE_PATH}${path}`;

/** Статическая сборка без своих HTTP-заголовков (GitHub Pages) */
export const IS_STATIC_EXPORT = process.env.MK_STATIC_EXPORT === "1";
