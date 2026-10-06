import { Spinner } from "../ui";

export const PageLoader = () => (
  <div className="flex min-h-[40vh] items-center justify-center gap-2 text-muted">
    <Spinner /> <span className="font-mono text-2xs uppercase tracking-wider">Loading</span>
  </div>
);
