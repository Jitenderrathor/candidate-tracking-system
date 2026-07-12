export function CandidateListSkeleton() {
  return (
    <div aria-label="Loading candidates" className="space-y-4" role="status">
      <span className="sr-only">Loading candidates</span>
      <div className="h-24 animate-pulse rounded-xl bg-slate-200" />
      <div className="h-96 animate-pulse rounded-xl bg-slate-200" />
    </div>
  );
}
