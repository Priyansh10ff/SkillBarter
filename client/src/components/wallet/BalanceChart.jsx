import { useMemo, useRef, useState } from "react";
import { useElementWidth } from "../../hooks/useElementWidth";
import { formatDateTime, formatHours } from "../../lib/format";

const HEIGHT = 200;
const PAD = { top: 16, right: 64, bottom: 28, left: 40 };

/**
 * Balance over time as a step line (balances change in jumps, not slopes).
 * points: [{ createdAt, balanceAfter, amount }] oldest first. now: ms timestamp for the right edge.
 * One series, so no legend; the panel title names it. Crosshair + tooltip on hover.
 */
export const BalanceChart = ({ points, current, now }) => {
  const wrapRef = useRef(null);
  const width = useElementWidth(wrapRef);
  const [hover, setHover] = useState(null);

  const model = useMemo(() => {
    if (!width || points.length === 0) return null;
    const data = points.map((p) => ({ t: new Date(p.createdAt).getTime(), v: p.balanceAfter, amount: p.amount }));
    const t0 = data[0].t;
    const t1 = Math.max(now, t0 + 1);
    const maxV = Math.max(1, ...data.map((d) => d.v), current);
    const top = Math.ceil(maxV * 1.15);
    const step = top <= 4 ? 1 : top <= 10 ? 2 : Math.ceil(top / 5);
    const ticks = Array.from({ length: Math.floor(top / step) + 1 }, (_, i) => i * step);

    const innerW = width - PAD.left - PAD.right;
    const innerH = HEIGHT - PAD.top - PAD.bottom;
    const x = (t) => PAD.left + ((t - t0) / (t1 - t0)) * innerW;
    const y = (v) => PAD.top + innerH - (v / ticks[ticks.length - 1]) * innerH;

    // step-after path, extended to "now" at the current balance
    let d = `M ${x(data[0].t)} ${y(data[0].v)}`;
    for (let i = 1; i < data.length; i += 1) d += ` H ${x(data[i].t)} V ${y(data[i].v)}`;
    d += ` H ${x(t1)}`;
    const area = `${d} V ${y(0)} H ${x(data[0].t)} Z`;

    return { data, x, y, ticks, d, area, t0, t1, innerW, endX: x(t1), endY: y(data[data.length - 1].v) };
  }, [points, current, width, now]);

  const onMove = (e) => {
    if (!model) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    // snap to the last movement at or before the pointer
    let idx = 0;
    for (let i = 0; i < model.data.length; i += 1) if (model.x(model.data[i].t) <= px) idx = i;
    setHover(idx);
  };

  const h = model && hover !== null ? model.data[hover] : null;
  const hx = h ? model.x(h.t) : 0;

  return (
    <div ref={wrapRef} className="relative">
      {model && (
        <svg
          width={width}
          height={HEIGHT}
          role="img"
          aria-label={`Balance over time, currently ${formatHours(current)}. Full history in the statement below.`}
          onPointerMove={onMove}
          onPointerLeave={() => setHover(null)}
          className="block touch-none"
        >
          {model.ticks.map((t) => (
            <g key={t}>
              <line x1={PAD.left} x2={width - PAD.right} y1={model.y(t)} y2={model.y(t)} stroke="rgb(var(--line))" strokeWidth="1" />
              <text x={PAD.left - 8} y={model.y(t)} dy="0.32em" textAnchor="end" className="fill-faint font-mono text-[10px]">
                {t} h
              </text>
            </g>
          ))}
          <path d={model.area} fill="rgb(var(--accent) / 0.1)" />
          <path d={model.d} fill="none" stroke="rgb(var(--accent))" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
          <circle cx={model.endX} cy={model.endY} r="4" fill="rgb(var(--accent))" stroke="rgb(var(--surface))" strokeWidth="2" />
          <text x={model.endX + 10} y={model.endY} dy="0.32em" className="fill-ink font-mono text-xs">
            {formatHours(current)}
          </text>
          {h && (
            <g pointerEvents="none">
              <line x1={hx} x2={hx} y1={PAD.top} y2={HEIGHT - PAD.bottom} stroke="rgb(var(--line-strong))" strokeWidth="1" />
              <circle cx={hx} cy={model.y(h.v)} r="4" fill="rgb(var(--accent))" stroke="rgb(var(--surface))" strokeWidth="2" />
            </g>
          )}
          {/* full-height hit area so the pointer never has to land on the line */}
          <rect x={PAD.left} y={PAD.top} width={model.innerW} height={HEIGHT - PAD.top - PAD.bottom} fill="transparent" />
        </svg>
      )}
      {h && (
        <div
          className="pointer-events-none absolute top-2 z-10 bg-bg border border-line rounded px-2.5 py-2 font-mono text-xs tabular shadow-none"
          style={{ left: Math.min(Math.max(hx + 12, 0), width - 170) }}
        >
          <p className="text-faint">{formatDateTime(h.t)}</p>
          <p className="mt-1 flex items-center gap-2 text-ink">
            <span className="inline-block h-0.5 w-3 bg-accent" aria-hidden="true" />
            {formatHours(h.v)}
            <span className={h.amount < 0 ? "text-bad" : "text-ok"}>({formatHours(h.amount, { signed: true })})</span>
          </p>
        </div>
      )}
    </div>
  );
};
