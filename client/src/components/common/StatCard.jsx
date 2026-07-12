import { Card } from '@/components/common/Card';
import { cn } from '@/utils/cn';

export function StatCard({ change, icon: Icon, label, value }) {
  return (
    <Card className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
        {change && <p className="mt-1 text-xs text-slate-500">{change}</p>}
      </div>
      {Icon && (
        <span
          className={cn('grid size-11 place-items-center rounded-xl bg-brand-50 text-brand-700')}
        >
          <Icon aria-hidden="true" className="size-5" />
        </span>
      )}
    </Card>
  );
}
