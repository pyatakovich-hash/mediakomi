import { useEffect, useRef, useState, type CSSProperties } from "react";
import {
  SLIDER_STEPS,
  START_PRICE,
  formatRub,
  nudge,
  posToPrice,
  priceToPos,
} from "@/lib/game";

type Props = {
  value: number;
  onChange: (price: number) => void;
  /** Показать подсказку: бегунок сам «покачается» при первом запуске */
  hint: boolean;
};

export function PriceSlider({ value, onChange, hint }: Props) {
  const pos = priceToPos(value);
  const [touched, setTouched] = useState(false);
  const stopRef = useRef<() => void>(() => {});

  useEffect(() => {
    if (!hint || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const base = priceToPos(START_PRICE);
    const keys = [0, -150, 150, 0];
    const duration = 1800;
    let raf = 0;
    let start = 0;
    const tick = (now: number) => {
      start ||= now;
      const t = Math.min(1, (now - start) / duration);
      const seg = Math.min(2, Math.floor(t * 3));
      const k = t * 3 - seg;
      const ease = k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2;
      onChange(posToPrice(base + keys[seg] + (keys[seg + 1] - keys[seg]) * ease));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    const timer = window.setTimeout(() => (raf = requestAnimationFrame(tick)), 500);
    const stop = () => {
      window.clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
    stopRef.current = stop;
    return stop;
  }, [hint, onChange]);

  function interact() {
    stopRef.current();
    setTouched(true);
  }

  const showHint = hint && !touched;

  return (
    <div className="mt-3">
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Уменьшить цену"
          onClick={() => {
            interact();
            onChange(nudge(value, -1));
          }}
          className="step-btn"
        >
          −
        </button>
        <input
          type="range"
          min={0}
          max={SLIDER_STEPS}
          step={1}
          value={pos}
          aria-label="Ваша цена"
          aria-valuetext={formatRub(value)}
          onPointerDown={interact}
          onKeyDown={interact}
          onChange={(e) => onChange(posToPrice(Number(e.target.value)))}
          className={`price-range min-w-0 flex-1 ${showHint ? "is-hinting" : ""}`}
          style={{ "--fill": `${(pos / SLIDER_STEPS) * 100}%` } as CSSProperties}
        />
        <button
          type="button"
          aria-label="Увеличить цену"
          onClick={() => {
            interact();
            onChange(nudge(value, 1));
          }}
          className="step-btn"
        >
          +
        </button>
      </div>
      <div className="mt-1 flex justify-between px-[52px] text-xs text-mist">
        <span>50 тыс.</span>
        {showHint && <span className="font-semibold text-night">Двигайте бегунок</span>}
        <span>5 млн</span>
      </div>
    </div>
  );
}
