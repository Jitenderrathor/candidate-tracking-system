export function CandidateDetailsSkeleton() {
  return (
    <div aria-label="Loading candidate details" className="space-y-6" role="status">
      <span className="sr-only">Loading candidate details</span>
      <div className="h-40 animate-pulse rounded-xl bg-slate-200" />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-72 animate-pulse rounded-xl bg-slate-200" />
        <div className="h-72 animate-pulse rounded-xl bg-slate-200" />
      </div>
      <div className="h-64 animate-pulse rounded-xl bg-slate-200" />
    </div>
  );
}
