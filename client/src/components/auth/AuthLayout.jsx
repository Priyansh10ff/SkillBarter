// Narrow single column for auth screens
export const AuthLayout = ({ title, description, children, footer }) => (
  <div className="mx-auto max-w-sm pt-6 md:pt-12">
    <h1 className="text-3xl tracking-tightest">{title}</h1>
    {description && <p className="mt-2 text-muted">{description}</p>}
    <div className="mt-8">{children}</div>
    {footer && <p className="mt-6 text-sm text-muted">{footer}</p>}
  </div>
);

export const FormError = ({ children }) =>
  children ? (
    <p role="alert" className="border border-bad/40 bg-bad/10 text-bad text-sm rounded px-3 py-2">
      {children}
    </p>
  ) : null;
