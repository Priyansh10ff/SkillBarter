import { cx } from "./cx";

// Says what to do next. No icon-in-a-circle.
export const EmptyState = ({ title, children, action, className }) => (
  <div className={cx("border border-dashed border-line rounded px-6 py-12 text-center", className)}>
    <p className="font-medium text-ink">{title}</p>
    {children && <p className="mt-1 text-muted max-w-md mx-auto">{children}</p>}
    {action && <div className="mt-5">{action}</div>}
  </div>
);
