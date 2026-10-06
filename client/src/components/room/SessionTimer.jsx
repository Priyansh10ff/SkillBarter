import { useEffect, useState } from "react";
import { cx } from "../ui";

const pad = (n) => String(n).padStart(2, "0");
const hm = (minutes) => `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;

// "00:42 / 01:00" since the scheduled start; amber because it's time
export const SessionTimer = ({ scheduledAt, durationMinutes }) => {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const start = new Date(scheduledAt).getTime();
  if (now < start) {
    const mins = Math.ceil((start - now) / 60000);
    return <span className="font-mono text-sm tabular text-muted">starts in {mins} min</span>;
  }
  const elapsed = Math.floor((now - start) / 60000);
  const over = elapsed > durationMinutes;
  return (
    <span className={cx("font-mono text-sm tabular", over ? "text-warn" : "text-accent")} title="Time since the scheduled start / booked length">
      {hm(elapsed)} / {hm(durationMinutes)}
    </span>
  );
};
