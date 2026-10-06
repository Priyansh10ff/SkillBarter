import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { formatHours } from "../../lib/format";
import { Panel, PanelHeader, Skeleton } from "../ui";

const VISIBLE = 5;
const EXAMPLES = [
  { title: "Build your first React component", teacher: { name: "Asha R" }, creditCost: 1 },
  { title: "Guitar: first four chords", teacher: { name: "Arjun M" }, creditCost: 1 },
  { title: "Figma auto layout", teacher: { name: "Mei L" }, creditCost: 0.5 },
  { title: "Spanish conversation", teacher: { name: "Lucía F" }, creditCost: 1.5 },
  { title: "System design mock", teacher: { name: "Kabir S" }, creditCost: 2 },
];

const shortName = (name = "") => {
  const [first, last] = name.split(" ");
  return last ? `${first} ${last[0]}.` : first;
};

const prefersReducedMotion = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

// Departure-board style list of real open sessions, rotating one row at a time
export const ExchangeBoard = ({ listings }) => {
  const live = listings?.length > 0;
  const rows = live ? listings : EXAMPLES;
  const [offset, setOffset] = useState(0);
  const [paused, setPaused] = useState(false);
  const rotates = rows.length > VISIBLE && !prefersReducedMotion();

  useEffect(() => {
    if (!rotates || paused) return;
    const t = setInterval(() => setOffset((o) => o + 1), 3500);
    return () => clearInterval(t);
  }, [rotates, paused]);

  const shown = Array.from({ length: Math.min(VISIBLE, rows.length) }, (_, i) => ({ item: rows[(offset + i) % rows.length], slot: offset + i }));

  return (
    <Panel onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <PanelHeader
        title={live || listings === null ? "Open sessions" : "Example sessions"}
        action={
          <span className="flex items-center gap-1.5 label-mono">
            <span className={`h-1.5 w-1.5 rounded-full ${live ? "bg-ok" : "bg-faint"}`} aria-hidden="true" />
            {live ? "live" : "preview"}
          </span>
        }
      />
      <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] gap-x-4 px-4 pt-3 pb-1 label-mono">
        <span>Session</span>
        <span>Teacher</span>
        <span className="text-right">Cost</span>
      </div>
      {listings === null ? (
        <div className="divide-y divide-line border-t border-line" aria-busy="true">
          {Array.from({ length: VISIBLE }, (_, i) => (
            <div key={i} className="h-10 px-4 flex items-center">
              <Skeleton className="h-3 w-full" />
            </div>
          ))}
        </div>
      ) : (
      <ol className="font-mono text-[13px] tabular" aria-live="off">
        {shown.map(({ item, slot }) => {
          const row = (
            <>
              <span className="truncate uppercase text-ink">{item.title}</span>
              <span className="text-muted whitespace-nowrap">{shortName(item.teacher?.name)}</span>
              <span className="text-accent text-right whitespace-nowrap">{formatHours(item.creditCost)}</span>
            </>
          );
          const cls = "grid grid-cols-[minmax(0,1fr)_auto_auto] gap-x-4 items-center px-4 h-10 border-t border-line animate-row-in";
          return (
            <li key={`${item._id || item.title}-${slot}`}>
              {item._id ? (
                <Link to={`/listings/${item._id}`} className={`${cls} hover:bg-raised`}>
                  {row}
                </Link>
              ) : (
                <div className={cls}>{row}</div>
              )}
            </li>
          );
        })}
      </ol>
      )}
    </Panel>
  );
};
