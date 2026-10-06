import { useState } from "react";
import { X } from "lucide-react";
import { controlClass } from "./controlClass";
import { cx } from "./cx";

/**
 * Tag input for skills. Enter or comma adds, Backspace on empty removes the last.
 * value: string[], onChange(next: string[])
 */
export const SkillInput = ({ value = [], onChange, placeholder, invalid, max = 15, id, ...aria }) => {
  const [draft, setDraft] = useState("");

  const add = (raw) => {
    const parts = raw
      .split(",")
      .map((s) => s.trim().toLowerCase().slice(0, 40))
      .filter(Boolean);
    if (parts.length) onChange([...new Set([...value, ...parts])].slice(0, max));
    setDraft("");
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add(draft);
    } else if (e.key === "Backspace" && !draft && value.length) {
      onChange(value.slice(0, -1));
    }
  };

  return (
    <div className={cx(controlClass(invalid), "flex flex-wrap items-center gap-1.5 py-1.5 min-h-10 focus-within:border-accent")}>
      {value.map((skill) => (
        <span key={skill} className="inline-flex items-center gap-1 h-6 pl-2 pr-1 border border-line rounded-sm bg-surface font-mono text-2xs uppercase tracking-wider text-ink">
          {skill}
          <button type="button" onClick={() => onChange(value.filter((s) => s !== skill))} aria-label={`Remove ${skill}`} className="text-muted hover:text-ink">
            <X size={12} />
          </button>
        </span>
      ))}
      <input
        id={id}
        {...aria}
        value={draft}
        disabled={value.length >= max}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => draft && add(draft)}
        placeholder={value.length ? "Add another" : placeholder}
        className="flex-1 min-w-28 h-7 bg-transparent text-[15px] outline-none placeholder:text-faint"
      />
    </div>
  );
};

// One-tap suggestions under a SkillInput
export const SkillSuggestions = ({ suggestions, value, onChange }) => {
  const remaining = suggestions.filter((s) => !value.includes(s));
  if (!remaining.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5" aria-label="Suggestions">
      {remaining.map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange([...value, s])}
          className="h-6 px-2 border border-dashed border-line rounded-sm font-mono text-2xs uppercase tracking-wider text-muted hover:text-ink hover:border-line-strong"
        >
          + {s}
        </button>
      ))}
    </div>
  );
};
