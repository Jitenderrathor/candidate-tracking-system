import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Clock, FileSpreadsheet } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, EmptyState } from '@/components/common';
import { ROUTES } from '@/constants/routes';
import { listImportHistory } from '@/features/excel-import/excelImport.api';
import { ImportResults } from '@/features/excel-import/components/ImportResults';

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: '2-digit',
  year: 'numeric',
});

const timeFormatter = new Intl.DateTimeFormat(undefined, {
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
});

export function ImportHistoryPage() {
  const [selectedHistory, setSelectedHistory] = useState(null);

  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ['importHistory'],
    queryFn: () => listImportHistory({ limit: 100 }),
  });

  if (isPending) {
    return <div className="h-64 animate-pulse rounded-xl bg-slate-200" />;
  }

  if (isError) {
    return (
      <EmptyState
        action={<Button onClick={() => refetch()}>Try again</Button>}
        description={error.message}
        title="Unable to load import history"
      />
    );
  }

  const historyItems = data?.data?.history || [];

  // Group by Date
  const groupedHistory = historyItems.reduce((acc, item) => {
    const date = dateFormatter.format(new Date(item.createdAt));
    if (!acc[date]) acc[date] = [];
    acc[date].push(item);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost">
        <Link to={ROUTES.DASHBOARD}>
          <ArrowLeft className="size-4" /> Back to Dashboard
        </Link>
      </Button>

      <header>
        <h1 className="text-xl font-semibold text-slate-950">Import History</h1>
        <p className="mt-1 text-sm text-slate-500">
          Track and review the results of your past Excel candidate imports.
        </p>
      </header>

      {Object.keys(groupedHistory).length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 text-center">
          <Clock className="size-12 text-slate-300 mb-4" />
          <h3 className="text-lg font-medium text-slate-900">No Import History</h3>
          <p className="text-slate-500">You haven't imported any Excel files yet.</p>
        </Card>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedHistory).map(([date, items]) => (
            <section key={date}>
              <h2 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wider">{date}</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {items.map((item) => (
                  <Card key={item._id} className="p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedHistory(item)}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-indigo-50 rounded-lg">
                        <FileSpreadsheet className="size-5 text-indigo-600" />
                      </div>
                      <div className="flex-1 truncate">
                        <p className="font-medium text-slate-900 truncate" title={item.fileName}>
                          {item.fileName}
                        </p>
                        <p className="text-xs text-slate-500">
                          {timeFormatter.format(new Date(item.createdAt))} • By {item.importedBy?.name || 'Unknown'}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-4 text-sm mt-4 pt-4 border-t border-slate-100">
                      <div className="flex flex-col">
                        <span className="text-slate-500 text-xs">Imported</span>
                        <span className="font-medium text-emerald-600">{item.importedCount}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-slate-500 text-xs">Skipped</span>
                        <span className="font-medium text-rose-600">{item.skippedCount}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-slate-500 text-xs">Total</span>
                        <span className="font-medium text-slate-900">{item.totalRows}</span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {selectedHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-xl shadow-2xl p-6 relative">
            <Button
              className="absolute top-4 right-4"
              variant="ghost"
              size="sm"
              onClick={() => setSelectedHistory(null)}
            >
              Close
            </Button>
            <h2 className="text-xl font-bold mb-4">Import Report: {selectedHistory.fileName}</h2>
            <ImportResults results={selectedHistory} />
          </div>
        </div>
      )}
    </div>
  );
}
