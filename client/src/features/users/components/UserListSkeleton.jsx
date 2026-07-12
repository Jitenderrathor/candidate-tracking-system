export function UserListSkeleton() {
  return (
    <div aria-label="Loading users" className="space-y-4" role="status">
      <span className="sr-only">Loading users</span>
      <div className="h-20 animate-pulse rounded-xl bg-slate-200" />
      <div className="h-96 animate-pulse rounded-xl bg-slate-200" />
    </div>
  );
}
