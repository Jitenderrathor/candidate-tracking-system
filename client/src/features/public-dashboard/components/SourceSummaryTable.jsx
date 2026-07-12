import { Card } from '@/components/common';

const numberFormatter = new Intl.NumberFormat();
const updatedFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
});

const percentage = (count, total) => (total ? (count / total) * 100 : 0);

export function SourceSummaryTable({ sources, updatedAt }) {
  const rows = Object.entries(sources || {})
    .map(([source, count]) => ({ source, count }))
    .filter(({ count }) => count > 0)
    .sort((left, right) => right.count - left.count || left.source.localeCompare(right.source));
  const total = rows.reduce((sum, row) => sum + row.count, 0);

  return (
    <Card className="overflow-hidden p-0">
      <header className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4">
        <h2 className="font-semibold uppercase tracking-wide text-slate-900">
          Registration Source Summary Table
        </h2>
        <span className="whitespace-nowrap text-xs font-medium text-slate-400">Real-Time Sync</span>
      </header>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
            <tr>
              <th className="px-5 py-4 font-semibold">Registration Source</th>
              <th className="px-5 py-4 font-semibold">Total Registrations</th>
              <th className="px-5 py-4 font-semibold">Percentage</th>
              <th className="px-5 py-4 font-semibold">Last Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map(({ source, count }) => {
              const share = percentage(count, total);
              return (
                <tr className="text-slate-700" key={source}>
                  <td className="px-5 py-4 font-semibold text-slate-900">
                    {source === 'Other' ? 'Others' : source}
                  </td>
                  <td className="px-5 py-4 font-medium">{numberFormatter.format(count)}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <span className="w-16 font-semibold">{share.toFixed(2)}%</span>
                      <span className="h-2 w-28 overflow-hidden rounded-full bg-slate-100">
                        <span
                          className="block h-full rounded-full bg-brand-600"
                          style={{ width: `${Math.max(1, share)}%` }}
                        />
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-xs text-slate-400">
                    {updatedFormatter.format(new Date(updatedAt))}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {!rows.length && (
        <p className="px-5 py-8 text-center text-sm text-slate-500">
          No registration-source data is available.
        </p>
      )}
    </Card>
  );
}
