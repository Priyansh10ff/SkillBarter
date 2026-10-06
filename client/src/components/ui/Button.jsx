import { Link } from "react-router-dom";
import { cx } from "./cx";
import { Spinner } from "./Spinner";

const VARIANTS = {
  primary: "bg-accent text-accent-ink hover:bg-accent/90 border border-accent",
  secondary: "bg-surface text-ink border border-line hover:border-line-strong hover:bg-raised",
  ghost: "text-muted hover:text-ink hover:bg-raised border border-transparent",
  danger: "text-bad border border-bad/40 hover:bg-bad/10",
};

const SIZES = {
  sm: "h-8 px-3 text-sm gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-5 text-base gap-2",
};

/**
 * <Button variant="primary|secondary|ghost|danger" size="sm|md|lg" loading to="/path">
 * Renders a router Link when `to` is set, otherwise a <button>.
 */
export const Button = ({ variant = "secondary", size = "md", loading = false, to, className, children, disabled, ...props }) => {
  const classes = cx(
    "inline-flex items-center justify-center rounded font-medium whitespace-nowrap transition-colors",
    "disabled:opacity-50 disabled:pointer-events-none",
    VARIANTS[variant],
    SIZES[size],
    className
  );

  if (to) {
    return (
      <Link to={to} className={classes} {...props}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" className={classes} disabled={disabled || loading} aria-busy={loading || undefined} {...props}>
      {loading && <Spinner />}
      {children}
    </button>
  );
};
