import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, RefreshCw, RotateCcw } from 'lucide-react';
import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button, Card, EmptyState, Pagination, SearchBox, Table } from '@/components/common';
import { ROUTES } from '@/constants/routes';
import { listTrash, restoreCandidate, bulkRestoreCandidates } from '@/features/candidates/candidate.api';
import { StatusBadge } from '@/features/public-dashboard/components/StatusBadge';

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});
const filterDefaults = {
  search: '',
  page: 1,
  sort: '-deletedAt',
};

export function TrashPage() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const page = Number(searchParams.get('page') || filterDefaults.page);
  const search = searchParams.get('search') || filterDefaults.search;
  
  const apiParams = useMemo(() => {
    const values = { search, page, limit: 50, sort: filterDefaults.sort };
    return Object.fromEntries(Object.entries(values).filter(([, value]) => value !== ''));
  }, [page, search]);
  
  const query = useQuery({
    queryKey: ['trash', apiParams],
    queryFn: () => listTrash(apiParams),
    placeholderData: keepPreviousData,
  });

  const restoreMutation = useMutation({
    mutationFn: restoreCandidate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trash'] });
      queryClient.invalidateQueries({ queryKey: ['candidates'] });
      queryClient.invalidateQueries({ queryKey: ['internal-dashboard'] });
    },
  });

  const bulkRestoreMutation = useMutation({
    mutationFn: bulkRestoreCandidates,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trash'] });
      queryClient.invalidateQueries({ queryKey: ['candidates'] });
      queryClient.invalidateQueries({ queryKey: ['internal-dashboard'] });
    },
  });

  const updateParams = (changes) =>
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      Object.entries(changes).forEach(([key, value]) =>
        value ? next.set(key, value) : next.delete(key),
      );
      return next;
    });

  const columns = [
    {
      key: 'deletedAt',
      header: 'Deleted On',
      cellClassName: 'whitespace-nowrap',
      render: (candidate) => dateFormatter.format(
        new Date(candidate.deletedAt || new Date()),
      ),
    },
    {
      key: 'name',
      header: 'Full Name',
      cellClassName: 'min-w-40',
      render: (candidate) => candidate.fullName || `${candidate.firstName} ${candidate.lastName}`,
    },
    { key: 'email', header: 'Email', cellClassName: 'min-w-48' },
    { key: 'mobile', header: 'Mobile', cellClassName: 'whitespace-nowrap' },
    {
      key: 'status',
      header: 'Last Status',
      render: (candidate) => (
        <StatusBadge status={candidate.recruitmentStatus || candidate.status} />
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (candidate) => (
        <div className="flex items-center gap-1">
          <Button
            aria-label={`Restore ${candidate.firstName}`}
            size="sm"
            variant="outline"
            disabled={restoreMutation.isPending}
            onClick={() => restoreMutation.mutate(candidate.candidateId)}
          >
            <RotateCcw className="size-4 mr-1" /> Restore
          </Button>
        </div>
      ),
    },
  ];

  // Group by Date
  const groupedTrash = useMemo(() => {
    if (!query.data?.candidates) return {};
    return query.data.candidates.reduce((acc, candidate) => {
      const date = (candidate.deletedAt || candidate.updatedAt) ? new Date(candidate.deletedAt || candidate.updatedAt).toLocaleDateString(undefined, {
        day: '2-digit', month: 'short', year: 'numeric'
      }) : 'Unknown Date';
      if (!acc[date]) acc[date] = [];
      acc[date].push(candidate);
      return acc;
    }, {});
  }, [query.data?.candidates]);

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost">
        <Link to={ROUTES.DASHBOARD}>
          <ArrowLeft className="size-4" /> Back to Dashboard
        </Link>
      </Button>
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-950">Recycle Bin</h1>
          <p className="mt-1 text-sm text-slate-500">
            Deleted candidates will be permanently removed after 30 days.
          </p>
        </div>
        <Button
          variant="outline"
          disabled={bulkRestoreMutation.isPending || !query.data?.candidates?.length}
          onClick={() => {
            if (window.confirm('Are you sure you want to restore all candidates?')) {
              bulkRestoreMutation.mutate();
            }
          }}
        >
          <RotateCcw className="size-4 mr-1" /> Restore All
        </Button>
      </header>
      <Card className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <SearchBox
            className="max-w-none md:max-w-md"
            onChange={(event) => updateParams({ search: event.target.value, page: '' })}
            onClear={() => updateParams({ search: '', page: '' })}
            placeholder="Search ID, name, email, or mobile"
            value={search}
          />
          <Button
            aria-label="Refresh trash"
            disabled={query.isFetching}
            onClick={() => query.refetch()}
            variant="ghost"
          >
            <RefreshCw className={query.isFetching ? 'size-4 animate-spin' : 'size-4'} /> Refresh
          </Button>
        </div>
      </Card>
      {query.isPending ? (
        <div className="h-64 animate-pulse rounded-xl bg-slate-200" />
      ) : query.isError ? (
        <EmptyState
          action={<Button onClick={() => query.refetch()}>Try again</Button>}
          description={query.error.message}
          title="Unable to load recycle bin"
        />
      ) : !query.data.candidates?.length ? (
        <Card className="flex flex-col items-center justify-center py-16 text-center">
          <h3 className="text-lg font-medium text-slate-900">Recycle bin empty</h3>
          <p className="text-slate-500">The recycle bin is currently empty.</p>
        </Card>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedTrash).map(([date, candidates]) => (
            <div key={date} className="space-y-3">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">{date}</h2>
              <Table
                columns={columns}
                data={candidates}
                emptyMessage="No items for this date."
                getRowKey={(candidate) => candidate.candidateId}
              />
            </div>
          ))}
          <Pagination
            currentPage={query.data.meta.currentPage}
            onPageChange={(nextPage) => updateParams({ page: String(nextPage) })}
            totalPages={query.data.meta.totalPages}
          />
          <p className="text-sm text-slate-500">
            {query.data.meta.total} candidate{query.data.meta.total === 1 ? '' : 's'} in recycle bin
          </p>
        </div>
      )}
    </div>
  );
}
