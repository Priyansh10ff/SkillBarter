import { cx } from "./cx";

export const Panel = ({ as = "div", className, children, ...props }) => {
  const Tag = as;
  return (
    <Tag className={cx("bg-surface border border-line rounded", className)} {...props}>
      {children}
    </Tag>
  );
};

export const PanelHeader = ({ title, action, className }) => (
  <div className={cx("flex items-center justify-between gap-4 border-b border-line px-4 h-11", className)}>
    <h2 className="label-mono">{title}</h2>
    {action}
  </div>
);
