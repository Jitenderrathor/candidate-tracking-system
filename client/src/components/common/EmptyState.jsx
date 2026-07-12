import { Inbox } from 'lucide-react';

export function EmptyState({
  action,
  description = 'There is nothing to display yet.',
  icon: Icon = Inbox,
  title = 'No data found',
}) {
  return (
    <div className="rounded-xl border border-dashed bg-white px-6 py-12 text-center">
      <span className="mx-auto grid size-12 place-items-center rounded-full bg-slate-100 text-slate-500">
        <Icon aria-hidden="true" className="size-5" />
      </span>
      <h3 className="mt-4 font-semibold text-slate-900">{title}</h3>
      <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
