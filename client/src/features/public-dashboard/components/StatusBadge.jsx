import { cn } from '@/utils/cn';

const styles = {
  Registered: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  'Under Consideration': 'bg-amber-50 text-amber-700 ring-amber-600/20',
  'To Be Shortlisted': 'bg-violet-50 text-violet-700 ring-violet-600/20',
  Selected: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  Rejected: 'bg-red-50 text-red-700 ring-red-600/20',
};

export function StatusBadge({ status }) {
  return (
    <span
      className={cn(
        'inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset',
        styles[status] || 'bg-slate-50 text-slate-700 ring-slate-600/20',
      )}
    >
      {status}
    </span>
  );
}
