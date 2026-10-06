import { cx } from "./cx";

// Shared look for inputs, textareas and selects
export const controlClass = (invalid) =>
  cx(
    "w-full rounded bg-raised border px-3 text-ink text-[15px] transition-colors",
    "focus:outline-none focus:border-accent focus-visible:outline-none",
    invalid ? "border-bad" : "border-line hover:border-line-strong"
  );
