import { cx } from "./cx";

// Single-choice filter: options = [{ value, label }]
export const Segmented = ({ options, value, onChange, label, className }) => (
  <div role="radiogroup" aria-label={label} className={cx("inline-flex border border-line rounded p-0.5 bg-surface", className)}>
    {options.map((option) => {
      const active = option.value === value;
      return (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={active}
          onClick={() => onChange(option.value)}
          className={cx("h-8 px-3 rounded-sm text-sm transition-colors", active ? "bg-raised text-ink" : "text-muted hover:text-ink")}
        >
          {option.label}
        </button>
      );
    })}
  </div>
);
