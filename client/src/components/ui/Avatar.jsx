import { avatarTone, initials } from "../../lib/format";
import { cx } from "./cx";

const SIZES = { sm: "h-7 w-7 text-2xs", md: "h-9 w-9 text-xs", lg: "h-16 w-16 text-lg" };

export const Avatar = ({ name, size = "md", className }) => (
  <span
    aria-hidden="true"
    className={cx("inline-flex shrink-0 items-center justify-center rounded font-mono font-medium text-ink", SIZES[size], className)}
    style={{ backgroundColor: avatarTone(name) }}
  >
    {initials(name)}
  </span>
);
