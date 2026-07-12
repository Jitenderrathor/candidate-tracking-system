import { Clock3 } from 'lucide-react';
import { Card, EmptyState } from '@/components/common';
import { StatusBadge } from '@/features/public-dashboard/components/StatusBadge';

const formatter = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' });

export function StatusTimeline({ history = [] }) {
  return (
    <Card>
      <h2 className="mb-5 font-semibold text-slate-950">Status History</h2>
      {!history.length ? (
        <EmptyState
          description="Status changes will appear here."
          icon={Clock3}
          title="No status history"
        />
      ) : (
        <ol className="space-y-0">
          {history.map((entry, index) => (
            <li className="relative flex gap-4 pb-7 last:pb-0" key={entry._id}>
              <div className="relative z-10 mt-1 size-3 shrink-0 rounded-full bg-brand-600 ring-4 ring-brand-50" />
              {index < history.length - 1 && (
                <span className="absolute left-[5px] top-4 h-full w-px bg-slate-200" />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={entry.oldStatus} />
                  <span className="text-slate-400">→</span>
                  <StatusBadge status={entry.newStatus} />
                </div>
                <p className="mt-2 text-sm text-slate-600">
                  {entry.remarks || 'No remarks provided.'}
                </p>
                <p className="mt-2 text-xs text-slate-400">
                  Changed by {entry.changedBy?.name || entry.changedBy?.email || 'System user'} ·{' '}
                  {formatter.format(new Date(entry.changedAt))}
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}
