// Пятиэтажка полярной ночью: окна зажигаются одно за другим при загрузке.
const LIT = [3, 9, 12, 14, 20, 25, 27, 30, 33, 36, 6, 17];

export function Building() {
  return (
    <div aria-hidden className="absolute inset-x-0 bottom-0 flex justify-center">
      <div className="building grid grid-cols-8 grid-rows-5 gap-[5px] rounded-t-[6px] bg-[#5f22a0] p-[9px] pb-[14px]">
        {Array.from({ length: 40 }, (_, i) => {
          const order = LIT.indexOf(i);
          return (
            <span
              key={i}
              className={`rounded-[2px] ${order >= 0 ? "lamp" : "bg-night-deep"}`}
              style={order >= 0 ? ({ "--d": `${0.15 + order * 0.09}s` } as React.CSSProperties) : undefined}
            />
          );
        })}
      </div>
    </div>
  );
}
