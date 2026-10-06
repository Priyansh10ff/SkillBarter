import { cx } from "./cx";

const TONES = {
  PENDING: "text-warn",
  SCHEDULED: "text-ink",
  COMPLETED: "text-ok",
  CANCELLED: "text-faint",
  DISPUTED: "text-bad",
};

export const StatusTag = ({ status, className }) => (
  <span className={cx("font-mono text-2xs uppercase tracking-wider whitespace-nowrap", TONES[status] || "text-muted", className)}>
    [ {status} ]
  </span>
);
