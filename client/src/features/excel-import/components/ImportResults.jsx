import {
  AlertTriangle,
  CheckCircle2,
  CopyX,
  Download,
  FileSpreadsheet,
  MailWarning,
  PhoneCall,
  SkipForward,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button, Card, Pagination, Table } from '@/components/common';
import { cn } from '@/utils/cn';

const PAGE_SIZE = 10;

const getCategory = (err) => {
  if (err.includes('Duplicate')) return 'Duplicate Rows';
  if (err.includes('Email')) return 'Email Errors';
  if (err.includes('Phone') || err.includes('Mobile')) return 'Phone Errors';
  if (err.includes('Missing')) return 'Missing Fields';
  return 'Other Errors';
};

export function ImportResults({ result }) {
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState('All');
  const errors = result.validationErrors || [];

  const availableTabs = useMemo(() => {
    const categories = new Set(['All']);
    errors.forEach(entry => {
      entry.errors.forEach(err => categories.add(getCategory(err)));
    });
    return Array.from(categories);
  }, [errors]);

  const filteredErrors = useMemo(() => {
    if (activeTab === 'All') return errors;
    return errors.filter(entry => entry.errors.some(err => getCategory(err) === activeTab));
  }, [errors, activeTab]);

  const totalPages = Math.max(1, Math.ceil(filteredErrors.length / PAGE_SIZE));
  const pageErrors = filteredErrors.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const downloadCSV = () => {
    const headers = ['Row', 'Errors'];
    const rows = filteredErrors.map(e => [e.row, `"${e.errors.join(', ')}"`]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'validation_report.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
          <header className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 size-5 text-amber-600" />
              <div>
                <h2 className="font-semibold text-slate-950">Validation Report</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Review skipped rows and correct them before importing again.
                </p>
              </div>
            </div>
            <Button onClick={downloadCSV} variant="outline" size="sm">
              <Download className="mr-2 size-4" /> Download Report
            </Button>
          </header>
          
          <div className="border-t border-slate-200 px-5 pt-3 pb-0 overflow-x-auto">
            <nav className="flex space-x-4" aria-label="Tabs">
              {availableTabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => {
                    setActiveTab(tab);
                    setPage(1);
                  }}
                  className={cn(
                    'whitespace-nowrap border-b-2 py-3 px-1 text-sm font-medium',
                    activeTab === tab
                      ? 'border-brand-500 text-brand-600'
                      : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
                  )}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>

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
