const Skeleton = ({ className }) => (
  <div className={`animate-pulse rounded-xl bg-slate-200/80 ${className}`} />
);

export function PublicDashboardSkeleton() {
  return (
    <div
      aria-label="Loading dashboard analytics"
      aria-live="polite"
      className="space-y-6"
      role="status"
    >
      <span className="sr-only">Loading public dashboard</span>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, index) => (
          <Skeleton className="h-32" key={index} />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <Skeleton className="h-96" />
        <Skeleton className="h-96" />
      </div>
      <Skeleton className="h-96" />
      <Skeleton className="h-80" />
    </div>
  );
}
