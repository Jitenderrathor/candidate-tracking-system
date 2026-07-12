import { cn } from '@/utils/cn';

export function Table({
  ariaLabel = 'Data table',
  columns = [],
  data = [],
  emptyMessage = 'No records found',
  getRowKey,
  className,
}) {
  return (
    <div className={cn('overflow-hidden rounded-xl border bg-white shadow-card', className)}>
      <div aria-label={ariaLabel} className="overflow-x-auto" role="region" tabIndex={0}>
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              {columns.map((column) => (
                <th
                  className={cn('whitespace-nowrap px-4 py-3', column.headerClassName)}
                  key={column.key}
                  scope="col"
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {data.map((row, rowIndex) => (
              <tr
                className="transition hover:bg-slate-50/70"
                key={getRowKey?.(row) ?? row.id ?? rowIndex}
              >
                {columns.map((column) => (
                  <td
                    className={cn('px-4 py-3 text-slate-700', column.cellClassName)}
                    key={column.key}
                  >
                    {column.render ? column.render(row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!data.length && (
        <div className="p-10 text-center text-sm text-slate-500">{emptyMessage}</div>
      )}
    </div>
  );
}
