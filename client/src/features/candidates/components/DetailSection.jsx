import { Card } from '@/components/common';

export function DetailSection({ fields, title }) {
  return (
    <Card>
      <h2 className="mb-5 font-semibold text-slate-950">{title}</h2>
      <dl className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
        {fields.map(({ label, value }) => (
          <div key={label}>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</dt>
            <dd className="mt-1 break-words text-sm text-slate-800">{value || '—'}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}
