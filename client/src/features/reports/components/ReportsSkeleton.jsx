const Skeleton = ({ className }) => (
  <div className={`animate-pulse rounded-xl bg-slate-200 ${className}`} />
);

export function ReportsSkeleton() {
  return (
    <div aria-label="Loading reports" className="space-y-6" role="status">
      <span className="sr-only">Loading reports</span>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }, (_, index) => (
          <Skeleton className="h-32" key={index} />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <Skeleton className="h-96" />
        <Skeleton className="h-96" />
        <Skeleton className="h-96" />
        <Skeleton className="h-96" />
      </div>
      <Skeleton className="h-96" />
    </div>
  );
}
