export const PageHeader = ({ eyebrow, title, description, actions }) => (
  <header className="flex flex-col gap-4 border-b border-line pb-6 mb-8 md:flex-row md:items-end md:justify-between">
    <div className="space-y-2">
      {eyebrow && <p className="label-mono">{eyebrow}</p>}
      <h1 className="text-3xl md:text-[32px] leading-tight tracking-tightest">{title}</h1>
      {description && <p className="text-muted max-w-xl">{description}</p>}
    </div>
    {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
  </header>
);
