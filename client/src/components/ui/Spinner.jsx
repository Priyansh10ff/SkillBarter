import { cx } from "./cx";

export const Spinner = ({ className }) => (
  <span
    role="status"
    aria-label="Loading"
    className={cx("inline-block h-3.5 w-3.5 animate-spin border-2 border-current border-r-transparent", className)}
  />
);
