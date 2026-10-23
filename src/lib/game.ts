export type Flat = {
  id: string;
  url: string;
  city: string;
  street: string;
  title: string;
  rooms: number | null;
  area: number;
  floor: number | null;
  floors: number | null;
  price: number;
  photos: string[];
};

export type Answer = {
  flat: Flat;
  guess: number;
  /** guess − price: больше нуля — переплата, меньше — недоплата */
  diff: number;
  points: number;
};

export type VerdictType = "generous" | "expert" | "miser";

export const ROUNDS = 10;
export const PRICE_MIN = 50_000;
export const PRICE_MAX = 5_000_000;
export const START_PRICE = 500_000;
export const SLIDER_STEPS = 1000;
/** Сколько баллов из 1000 нужно для «Опытного инвестора» */
export const EXPERT_SCORE = 450;

export const VERDICTS: Record<VerdictType, { title: string; lead: string }> = {
  generous: { title: "Щедрый инвестор", lead: "Вы переплачиваете за недвижимость" },
  expert: { title: "Опытный инвестор", lead: "Ваши оценки близки к реальным ценам" },
  miser: { title: "Скряга", lead: "Экономный инвестор: предлагаете меньше, чем просят" },
};

// Шаг цены растёт вместе с ценой, чтобы суммы были «круглыми».
function stepFor(price: number) {
  if (price < 300_000) return 5_000;
  if (price < 1_000_000) return 10_000;
  if (price < 3_000_000) return 50_000;
  return 100_000;
}

export function snapPrice(price: number) {
  const step = stepFor(price);
  return Math.min(PRICE_MAX, Math.max(PRICE_MIN, Math.round(price / step) * step));
}

// Бегунок логарифмический: одинаковая точность и для 150 тысяч, и для 3 миллионов.
export function posToPrice(pos: number) {
  return snapPrice(PRICE_MIN * (PRICE_MAX / PRICE_MIN) ** (pos / SLIDER_STEPS));
}

export function priceToPos(price: number) {
  return Math.round((SLIDER_STEPS * Math.log(price / PRICE_MIN)) / Math.log(PRICE_MAX / PRICE_MIN));
}

export function nudge(price: number, direction: 1 | -1) {
  const step = direction > 0 ? stepFor(price) : stepFor(price - 1);
  return snapPrice(price + direction * step);
}

/**
 * До 100 баллов за квартиру: 100 × (1 − |log₂(оценка / цена)|).
 * Ошибка в 2 раза в любую сторону — 0 баллов, на 10% — около 85.
 */
export function scoreFor(guess: number, price: number) {
  return Math.round(100 * Math.max(0, 1 - Math.abs(Math.log2(guess / price))));
}

export function makeAnswer(flat: Flat, guess: number): Answer {
  return { flat, guess, diff: guess - flat.price, points: scoreFor(guess, flat.price) };
}

export function summarize(answers: Answer[]) {
  let score = 0;
  let over = 0;
  let overCount = 0;
  let under = 0;
  let underCount = 0;
  for (const a of answers) {
    score += a.points;
    if (a.diff > 0) {
      over += a.diff;
      overCount++;
    } else if (a.diff < 0) {
      under -= a.diff;
      underCount++;
    }
  }
  const net = over - under;
  const expertAt = (EXPERT_SCORE * answers.length) / ROUNDS;
  const type: VerdictType = score >= expertAt ? "expert" : net > 0 ? "generous" : "miser";
  return { score, maxScore: answers.length * 100, over, overCount, under, underCount, net, type };
}

export function pickRound(flats: Flat[], count = ROUNDS) {
  const deck = [...flats];
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck.slice(0, count);
}

const NBSP = " ";

export function formatRub(value: number) {
  const digits = Math.round(Math.abs(value)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, NBSP);
  return `${digits}${NBSP}₽`;
}

export function plural(n: number, forms: [string, string, string]) {
  const mod100 = Math.abs(n) % 100;
  const mod10 = mod100 % 10;
  if (mod100 > 10 && mod100 < 20) return forms[2];
  if (mod10 === 1) return forms[0];
  if (mod10 >= 2 && mod10 <= 4) return forms[1];
  return forms[2];
}

export const pointsWord = (n: number) => plural(n, ["балл", "балла", "баллов"]);
