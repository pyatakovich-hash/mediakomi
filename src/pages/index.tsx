import Head from "next/head";
import { useCallback, useEffect, useRef, useState } from "react";
import flatsData from "@/data/flats.json";
import { Building } from "@/components/Building";
import { Footer } from "@/components/Footer";
import { Gallery } from "@/components/Gallery";
import { PriceSlider } from "@/components/PriceSlider";
import {
  ROUNDS,
  START_PRICE,
  VERDICTS,
  formatRub,
  makeAnswer,
  pickRound,
  plural,
  pointsWord,
  summarize,
  type Answer,
  type Flat,
} from "@/lib/game";

const FLATS = flatsData as Flat[];

type Phase = "start" | "guess" | "reveal" | "result";

function preload(src?: string) {
  if (src) new Image().src = src;
}

export default function Home() {
  const [phase, setPhase] = useState<Phase>("start");
  const [deck, setDeck] = useState<Flat[]>([]);
  const [round, setRound] = useState(0);
  const [guess, setGuess] = useState(START_PRICE);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [hintDone, setHintDone] = useState(false);
  const rules = useRef<HTMLDialogElement>(null);

  // Колоду выбираем заранее, чтобы первое фото успело загрузиться, пока читают описание.
  useEffect(() => {
    const first = pickRound(FLATS);
    setDeck(first);
    preload(first[0]?.photos[0]);
  }, []);

  useEffect(() => {
    if (phase === "guess") preload(deck[round + 1]?.photos[0]);
  }, [phase, round, deck]);

  const flat = deck[round];
  const answer = answers[round];
  const summary = summarize(answers);
  const inGame = phase !== "start";
  const changeGuess = useCallback((price: number) => setGuess(price), []);

  function startGame(nextDeck: Flat[]) {
    setDeck(nextDeck);
    setRound(0);
    setAnswers([]);
    setGuess(START_PRICE);
    setPhase("guess");
  }

  function submit() {
    if (!flat) return;
    setAnswers((list) => [...list, makeAnswer(flat, guess)]);
    setHintDone(true);
    setPhase("reveal");
  }

  function next() {
    if (round + 1 >= deck.length) {
      setPhase("result");
      return;
    }
    setRound(round + 1);
    setGuess(START_PRICE);
    setPhase("guess");
  }

  return (
    <>
      <Head>
        <title>Медиакоми — угадай цену квартиры</title>
      </Head>

      <div className="mx-auto flex h-dvh max-h-[940px] w-full max-w-md flex-col px-3 pt-3">
        {inGame && (
          <header className="px-1 pb-2 text-white">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-lg font-extrabold tracking-tight">Медиакоми</span>
              <span className="text-sm text-white/80 tabular-nums">
                {phase === "result" ? (
                  "Игра окончена"
                ) : (
                  <>
                    Квартира {round + 1} из {ROUNDS}
                  </>
                )}
              </span>
            </div>
            <Progress answers={answers} total={ROUNDS} current={phase === "result" ? -1 : round} />
          </header>
        )}

        <main className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[28px] bg-white">
          {phase === "start" && (
            <section className="flex min-h-0 flex-1 flex-col">
              <div className="night-sky relative min-h-[150px] flex-1 overflow-hidden">
                <Building />
              </div>
              <div className="px-6 pt-5 pb-6">
                <h1 className="text-[44px] leading-none font-black tracking-tight text-night">
                  Медиакоми
                </h1>
                <p className="mt-3 text-lg leading-snug font-semibold text-ink">
                  Угадайте, сколько стоят квартиры в&nbsp;Инте
                </p>
                <p className="mt-2 text-[15px] leading-snug text-mist">
                  Настоящие объявления о&nbsp;продаже с&nbsp;Авито. Смотрите фото, ставьте цену
                  бегунком&nbsp;— за&nbsp;точность начисляем баллы. После {ROUNDS} квартир узнаете,
                  какой вы инвестор.
                </p>
                <button
                  type="button"
                  className="btn-primary mt-5"
                  disabled={!deck.length}
                  onClick={() => startGame(deck)}
                >
                  Запустить игру
                </button>
              </div>
            </section>
          )}

          {(phase === "guess" || phase === "reveal") && flat && (
            <section className="flex min-h-0 flex-1 flex-col">
              <Gallery key={flat.id} photos={flat.photos} alt={flat.title} />
              <div className="px-5 pt-3 pb-5">
                <h2 className="text-[17px] leading-tight font-bold text-ink">{flat.title}</h2>
                <p className="mt-0.5 text-sm text-mist">
                  {flat.street ? `${flat.street}, ` : ""}
                  {flat.city}
                </p>

                {phase === "guess" ? (
                  <>
                    <p className="mt-3 text-center text-[40px] leading-none font-black tracking-tight text-night tabular-nums">
                      {formatRub(guess)}
                    </p>
                    <PriceSlider value={guess} onChange={changeGuess} hint={!hintDone && round === 0} />
                    <button type="button" className="btn-primary mt-4" onClick={submit}>
                      Оценить
                    </button>
                  </>
                ) : (
                  answer && <Reveal answer={answer} isLast={round + 1 >= deck.length} onNext={next} />
                )}
              </div>
            </section>
          )}

          {phase === "result" && (
            <section className="flex min-h-0 flex-1 flex-col justify-between overflow-y-auto px-6 pt-7 pb-6">
              <div>
                <h1 className="text-[42px] leading-none font-black tracking-tight text-night">
                  {VERDICTS[summary.type].title}
                </h1>
                <p className="mt-3 text-lg leading-snug font-semibold text-ink">
                  {VERDICTS[summary.type].lead}
                </p>
                <p className="mt-6 flex items-baseline gap-2">
                  <span className="text-[56px] leading-none font-black tracking-tight text-night tabular-nums">
                    {summary.score}
                  </span>
                  <span className="text-mist">
                    {pointsWord(summary.score)} из {summary.maxScore}
                  </span>
                </p>

                <dl className="mt-6 space-y-2.5 text-[15px]">
                  <SummaryRow
                    color="bg-over"
                    label={summary.overCount ? `Переплата в ${placesText(summary.overCount)}` : "Переплаты не было"}
                    value={summary.overCount ? `+${formatRub(summary.over)}` : "—"}
                    valueClass="text-over"
                  />
                  <SummaryRow
                    color="bg-under"
                    label={summary.underCount ? `Недоплата в ${placesText(summary.underCount)}` : "Недоплаты не было"}
                    value={summary.underCount ? `−${formatRub(summary.under)}` : "—"}
                    valueClass="text-under"
                  />
                  <div className="flex items-baseline justify-between gap-3 border-t border-line pt-2.5 font-bold">
                    <dt>В сумме</dt>
                    <dd className="text-right tabular-nums">
                      {summary.net === 0
                        ? "ровно по цене"
                        : `${summary.net > 0 ? "переплата" : "недоплата"} ${formatRub(summary.net)}`}
                    </dd>
                  </div>
                </dl>
              </div>
              <button type="button" className="btn-primary mt-6" onClick={() => startGame(pickRound(FLATS))}>
                Сыграть ещё раз
              </button>
            </section>
          )}
        </main>

        <Footer onRules={() => rules.current?.showModal()} />
      </div>

      <dialog
        ref={rules}
        className="m-auto w-[min(92vw,420px)] rounded-[28px] p-0 text-ink backdrop:bg-night-deep/70"
        onClick={(e) => e.target === e.currentTarget && rules.current?.close()}
      >
        <div className="p-6">
          <h2 className="text-xl font-extrabold text-night">Как считаются баллы</h2>
          <p className="mt-3 text-[15px] leading-snug">
            За каждую квартиру&nbsp;— до 100 баллов. Чем ближе ваша цена к реальной, тем больше
            баллов: ошибка на 10% стоит около 15 баллов, ошибка в 2 раза в любую сторону&nbsp;— все
            100. За игру можно набрать до 1000.
          </p>
          <p className="mt-3 text-[15px] leading-snug">
            450 баллов и больше&nbsp;— «Опытный инвестор». Меньше&nbsp;— смотрим, куда вы ошибались в
            сумме: переплатили&nbsp;— «Щедрый инвестор», недоплатили&nbsp;— «Скряга».
          </p>
          <p className="mt-3 text-[15px] leading-snug text-mist">
            Цены и фото взяты из объявлений о продаже квартир в Инте на Авито.
          </p>
          <button type="button" className="btn-primary mt-5" onClick={() => rules.current?.close()}>
            Понятно
          </button>
        </div>
      </dialog>
    </>
  );
}

function placesText(n: number) {
  return `${n} ${plural(n, ["квартире", "квартирах", "квартирах"])} из ${ROUNDS}`;
}

function Progress({ answers, total, current }: { answers: Answer[]; total: number; current: number }) {
  return (
    <div
      className="mt-2 flex gap-1"
      role="progressbar"
      aria-label="Прогресс игры"
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={answers.length}
    >
      {Array.from({ length: total }, (_, i) => {
        const a = answers[i];
        const color = a
          ? a.diff > 0
            ? "bg-over"
            : a.diff < 0
              ? "bg-under"
              : "bg-lamp"
          : i === current
            ? "bg-white"
            : "bg-white/25";
        return <span key={i} className={`h-1.5 flex-1 rounded-full ${color}`} />;
      })}
    </div>
  );
}

function Reveal({ answer, isLast, onNext }: { answer: Answer; isLast: boolean; onNext: () => void }) {
  const { diff, guess, points, flat } = answer;
  const over = diff > 0;
  return (
    <div className="mt-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-sm text-mist">Реальная цена</p>
          <p className="price-tag mt-1 text-[30px] leading-tight tabular-nums">{formatRub(flat.price)}</p>
        </div>
        <p className="text-right leading-tight">
          <span className="block text-[28px] font-black text-night tabular-nums">+{points}</span>
          <span className="text-sm text-mist">{pointsWord(points)}</span>
        </p>
      </div>
      <p className="mt-3 text-[15px] leading-snug text-ink">
        {diff === 0 ? (
          <>Точно в цель: вы назвали реальную цену.</>
        ) : (
          <>
            Ваша цена {formatRub(guess)}&nbsp;— на {formatRub(diff)} {over ? "больше" : "меньше"} реальной.
          </>
        )}
      </p>
      {diff !== 0 && (
        <p className={`mt-1 text-[15px] font-bold tabular-nums ${over ? "text-over" : "text-under"}`}>
          {over ? `Переплата +${formatRub(diff)}` : `Недоплата −${formatRub(diff)}`}
        </p>
      )}
      <button type="button" className="btn-primary mt-4" onClick={onNext} autoFocus>
        {isLast ? "Посмотреть итог" : "Следующая квартира"}
      </button>
    </div>
  );
}

function SummaryRow(props: { color: string; label: string; value: string; valueClass: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="flex items-center gap-2">
        <span className={`size-2.5 shrink-0 rounded-sm ${props.color}`} aria-hidden />
        {props.label}
      </dt>
      <dd className={`text-right font-bold tabular-nums ${props.valueClass}`}>{props.value}</dd>
    </div>
  );
}
