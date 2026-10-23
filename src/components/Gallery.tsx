import { useRef, useState } from "react";

type Props = { photos: string[]; alt: string };

// Листается свайпом (CSS scroll-snap), без библиотек.
// Грузим только текущее фото и следующее — меньше трафика.
export function Gallery({ photos, alt }: Props) {
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [reach, setReach] = useState(1);
  const [broken, setBroken] = useState<Record<number, boolean>>({});

  function onScroll() {
    const el = track.current;
    if (!el) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    if (i !== index) {
      setIndex(i);
      setReach((r) => Math.max(r, i + 1));
    }
  }

  function go(i: number) {
    const el = track.current;
    if (!el) return;
    const target = Math.max(0, Math.min(photos.length - 1, i));
    el.scrollTo({ left: target * el.clientWidth, behavior: "smooth" });
  }

  return (
    <div className="relative min-h-[150px] flex-1 overflow-hidden bg-haze">
      <div
        ref={track}
        onScroll={onScroll}
        className="no-scrollbar flex h-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain"
      >
        {photos.map((src, i) => (
          <div key={src} className="h-full w-full shrink-0 snap-center">
            {broken[i] ? (
              <div className="grid h-full place-items-center text-sm text-mist">
                Фото не загрузилось
              </div>
            ) : (
              i <= reach && (
                <img
                  src={src}
                  alt={`${alt}, фото ${i + 1} из ${photos.length}`}
                  className="h-full w-full object-cover"
                  draggable={false}
                  decoding="async"
                  fetchPriority={i === 0 ? "high" : "auto"}
                  onError={() => setBroken((b) => ({ ...b, [i]: true }))}
                />
              )
            )}
          </div>
        ))}
      </div>

      {photos.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Предыдущее фото"
            onClick={() => go(index - 1)}
            disabled={index === 0}
            className="gallery-arrow left-2"
          >
            ‹
          </button>
          <button
            type="button"
            aria-label="Следующее фото"
            onClick={() => go(index + 1)}
            disabled={index === photos.length - 1}
            className="gallery-arrow right-2"
          >
            ›
          </button>
          <div className="absolute inset-x-0 bottom-2 flex justify-center gap-1.5">
            {photos.map((src, i) => (
              <button
                key={src}
                type="button"
                aria-label={`Фото ${i + 1}`}
                onClick={() => go(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === index ? "w-5 bg-white" : "w-1.5 bg-white/60"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
