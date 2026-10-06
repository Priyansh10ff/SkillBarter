import { useId } from "react";
import { cx } from "./cx";
import { controlClass } from "./controlClass";

/**
 * Label + control + hint/error. The control is given via render prop so it
 * receives the right id and aria attributes:
 *   <Field label="Email" error={errors.email}>{(p) => <Input {...p} />}</Field>
 */
export const Field = ({ label, hint, error, counter, children, className }) => {
  const id = useId();
  const describedBy = `${id}-desc`;
  return (
    <div className={cx("space-y-1.5", className)}>
      {label && (
        <div className="flex items-baseline justify-between">
          <label htmlFor={id} className="text-sm font-medium text-ink">
            {label}
          </label>
          {counter && <span className="font-mono text-2xs text-faint tabular">{counter}</span>}
        </div>
      )}
      {children({ id, invalid: Boolean(error), "aria-invalid": error ? true : undefined, "aria-describedby": describedBy })}
      {(error || hint) && (
        <p id={describedBy} className={cx("text-sm", error ? "text-bad" : "text-muted")}>
          {error || hint}
        </p>
      )}
    </div>
  );
};

export const Input = ({ invalid, className, ...props }) => (
  <input className={cx(controlClass(invalid), "h-10", className)} {...props} />
);

export const Textarea = ({ invalid, className, ...props }) => (
  <textarea className={cx(controlClass(invalid), "py-2 min-h-28 leading-relaxed", className)} {...props} />
);

export const Select = ({ invalid, className, children, ...props }) => (
  <select className={cx(controlClass(invalid), "h-10 pr-8", className)} {...props}>
    {children}
  </select>
);
