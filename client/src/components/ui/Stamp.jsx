import { cx } from "./cx";

// Small text stamp for badges and tags, e.g. TAUGHT ×5
export const Stamp = ({ children, tone = "muted", className }) => (
  <span
    className={cx(
      "inline-flex items-center h-6 px-2 border rounded-sm font-mono text-2xs uppercase tracking-wider whitespace-nowrap",
      tone === "accent" ? "border-accent/40 text-accent" : "border-line text-muted",
      className
    )}
  >
    {children}
  </span>
);
