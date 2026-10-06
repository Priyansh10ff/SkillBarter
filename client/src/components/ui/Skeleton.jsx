import { cx } from "./cx";

export const Skeleton = ({ className }) => <div aria-hidden="true" className={cx("bg-raised rounded-sm animate-pulse", className)} />;

export const SkeletonRows = ({ rows = 4 }) => (
  <div className="divide-y divide-line border border-line rounded" aria-busy="true" aria-label="Loading">
    {Array.from({ length: rows }, (_, i) => (
      <div key={i} className="flex items-center gap-4 p-4">
        <Skeleton className="h-9 w-9" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-2/3" />
        </div>
        <Skeleton className="h-8 w-20" />
      </div>
    ))}
  </div>
);
