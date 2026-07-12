import {
  AlertTriangle,
  CheckCircle2,
  CopyX,
  FileSpreadsheet,
  MailWarning,
  PhoneCall,
  SkipForward,
} from 'lucide-react';
import { useState } from 'react';
import { Card, Pagination, Table } from '@/components/common';

const PAGE_SIZE = 10;

export function ImportResults({ result }) {
  const [page, setPage] = useState(1);
  const errors = result.validationErrors || [];
  const totalPages = Math.max(1, Math.ceil(errors.length / PAGE_SIZE));
  const pageErrors = errors.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const summary = [
    {
      label: 'Total Rows',
      value: result.totalRows,
      icon: FileSpreadsheet,
      tone: 'bg-blue-50 text-blue-700',
    },
    {
      label: 'Imported',
      value: result.imported,
      icon: CheckCircle2,
      tone: 'bg-emerald-50 text-emerald-700',
    },
    {
      label: 'Skipped',
      value: result.skipped,
      icon: SkipForward,
      tone: 'bg-amber-50 text-amber-700',
    },
    {
      label: 'Duplicate Emails',
      value: result.duplicateEmails,
      icon: MailWarning,
      tone: 'bg-violet-50 text-violet-700',
    },
    {
      label: 'Duplicate Mobiles',
      value: result.duplicateMobiles,
      icon: PhoneCall,
      tone: 'bg-cyan-50 text-cyan-700',
    },
    {
      label: 'Validation Errors',
      value: errors.length,
      icon: CopyX,
      tone: 'bg-red-50 text-red-700',
    },
  ];
  const columns = [
    { key: 'row', header: 'Row', cellClassName: 'font-medium text-slate-950 w-24' },
    {
      key: 'errors',
      header: 'Errors',
      render: (entry) => (
        <ul className="list-inside list-disc space-y-1">
          {entry.errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {summary.map(({ icon: Icon, label, tone, value }) => (
          <Card className="flex items-center justify-between gap-4" key={label}>
            <div>
              <p className="text-sm text-slate-500">{label}</p>
              <p className="mt-1 text-2xl font-semibold text-slate-950">{value}</p>
            </div>
            <span className={`grid size-11 place-items-center rounded-xl ${tone}`}>
              <Icon className="size-5" />
            </span>
          </Card>
        ))}
      </div>
      {errors.length > 0 && (
        <Card className="p-0">
          <header className="flex items-start gap-3 p-5">
            <AlertTriangle className="mt-0.5 size-5 text-amber-600" />
            <div>
              <h2 className="font-semibold text-slate-950">Validation Report</h2>
              <p className="mt-1 text-sm text-slate-500">
                Review skipped rows and correct them before importing again.
              </p>
            </div>
          </header>
          <Table
            className="rounded-none border-x-0 shadow-none"
            columns={columns}
            data={pageErrors}
            getRowKey={(entry) => entry.row}
          />
          <div className="p-5">
            <Pagination currentPage={page} onPageChange={setPage} totalPages={totalPages} />
          </div>
        </Card>
      )}
    </div>
  );
}
