import { formatHours } from "../../lib/format";
import { cx } from "./cx";

// Credits rendered as time. Amber is reserved for credits and time.
export const Hours = ({ value, signed, tone = "accent", className }) => (
  <span
    className={cx(
      "font-mono tabular whitespace-nowrap",
      tone === "accent" && "text-accent",
      tone === "ink" && "text-ink",
      tone === "muted" && "text-muted",
      tone === "sign" && (value < 0 ? "text-bad" : "text-ok"),
      className
    )}
  >
    {formatHours(value, { signed })}
  </span>
);
