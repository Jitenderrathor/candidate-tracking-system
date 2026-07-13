import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Download, Eye, Filter, Pencil, Plus, RefreshCw, Workflow, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { Button, Card, EmptyState, Pagination, SearchBox, Table } from '@/components/common';
import { ROLES } from '@/constants/auth';
import { ROUTES } from '@/constants/routes';
import { listCandidates, bulkDeleteCandidates } from '@/features/candidates/candidate.api';
import { CandidateFilters } from '@/features/candidates/components/CandidateFilters';
import { CandidateListSkeleton } from '@/features/candidates/components/CandidateListSkeleton';
import { StatusUpdateModal } from '@/features/candidates/components/StatusUpdateModal';
import { StatusBadge } from '@/features/public-dashboard/components/StatusBadge';
import { useAuth } from '@/hooks/useAuth';
import { AddCandidatePage } from '@/pages/AddCandidatePage';

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});
const filterDefaults = {
  status: '',
  source: '',
  qualification: '',
  minExperience: '',
  maxExperience: '',
  createdFrom: '',
  createdTo: '',
  sort: '-createdAt',
};
const detailPath = (id) => ROUTES.CANDIDATE_DETAILS.replace(':id', id);

export function CandidateListPage() {
  const { user } = useAuth();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);
  const [candidateForStatus, setCandidateForStatus] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const mode = searchParams.get('mode');

  useEffect(() => {
    if (location.state?.openCreate && mode !== 'add')
      setSearchParams({ mode: 'add' }, { replace: true });
  }, [location.state, mode, setSearchParams]);

  const filters = useMemo(
    () =>
      Object.fromEntries(
        Object.keys(filterDefaults).map((key) => [
          key,
          searchParams.get(key) || filterDefaults[key],
        ]),
      ),
    [searchParams],
  );
  const page = Number(searchParams.get('page') || 1);
  const search = searchParams.get('search') || '';
  
  // Clear selection when search/filters/page changes
  useEffect(() => {
    setSelectedIds(new Set());
  }, [page, search, filters]);

  const apiParams = useMemo(() => {
    const values = { search, ...filters, page, limit: 50 };
    return Object.fromEntries(Object.entries(values).filter(([, value]) => value !== ''));
  }, [filters, page, search]);
  
  const query = useQuery({
    queryKey: ['candidates', apiParams],
    queryFn: () => listCandidates(apiParams),
    placeholderData: keepPreviousData,
  });

  const deleteSelectedMutation = useMutation({
    mutationFn: (ids) => bulkDeleteCandidates(ids),
    onSuccess: () => {
      setSelectedIds(new Set());
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

  if (mode === 'add') return <AddCandidatePage />;

  const candidatesData = query.data?.candidates || [];
  const allCurrentPageIds = candidatesData.map((c) => c.candidateId);
  const isAllSelected = allCurrentPageIds.length > 0 && allCurrentPageIds.every((id) => selectedIds.has(id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(allCurrentPageIds));
    }
  };

  const toggleSelectRow = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const columns = [
    {
      key: 'select',
      header: (
        <input
          type="checkbox"
          checked={isAllSelected}
          onChange={toggleSelectAll}
          className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
          aria-label="Select all"
        />
      ),
      cellClassName: 'w-10 text-center',
      render: (candidate) => (
        <input
          type="checkbox"
          checked={selectedIds.has(candidate.candidateId)}
          onChange={() => toggleSelectRow(candidate.candidateId)}
          className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
          aria-label={`Select ${candidate.firstName}`}
        />
      ),
    },
    {
      key: 'registrationDate',
      header: 'Registration Date',
      cellClassName: 'whitespace-nowrap',
      render: (candidate) => dateFormatter.format(
        new Date(candidate.registrationDate || candidate.createdAt),
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
    { key: 'source', header: 'Source', cellClassName: 'whitespace-nowrap' },
    {
      key: 'status',
      header: 'Status',
      render: (candidate) => (
        <StatusBadge status={candidate.recruitmentStatus || candidate.status} />
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (candidate) => {
        const hasResume = Boolean(candidate.resumeUrl);
        return (
          <div className="flex items-center gap-1">
          <Button asChild aria-label={`View ${candidate.firstName}`} size="icon" variant="ghost">
            <Link to={detailPath(candidate.candidateId)}>
              <Eye className="size-4" />
            </Link>
          </Button>
          {hasResume && (
            <Button
              asChild
              aria-label={`Download resume for ${candidate.fullName || candidate.firstName}`}
              size="icon"
              variant="ghost"
            >
              <a
                href={candidate.resumeUrl}
                rel="noopener noreferrer"
                target="_blank"
                title="Open resume"
              >
                <Download className="size-4" />
              </a>
            </Button>
          )}
          {user?.role === ROLES.ADMIN && (
            <Button asChild aria-label={`Edit ${candidate.firstName}`} size="icon" variant="ghost">
              <Link to={`${detailPath(candidate.candidateId)}?mode=edit`}>
                <Pencil className="size-4" />
              </Link>
            </Button>
          )}
          <Button
            aria-label={`Update status for ${candidate.firstName}`}
            onClick={() => setCandidateForStatus(candidate)}
            size="icon"
            variant="ghost"
          >
            <Workflow className="size-4" />
          </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-950">Candidates</h1>
          <p className="mt-1 text-sm text-slate-500">
            Search, filter, and manage candidate records.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedIds.size > 0 && user?.role === ROLES.ADMIN && (
            <Button
              variant="danger"
              disabled={deleteSelectedMutation.isPending}
              onClick={() => {
                if (window.confirm(`Are you sure you want to delete ${selectedIds.size} candidates?`)) {
                  deleteSelectedMutation.mutate(Array.from(selectedIds));
                }
              }}
            >
              <Trash2 className="size-4 mr-1" /> Delete Selected ({selectedIds.size})
            </Button>
          )}
          <Button onClick={() => setSearchParams({ mode: 'add' })}>
            <Plus className="size-4" /> Add Candidate
          </Button>
        </div>
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
          <Button onClick={() => setShowFilters((current) => !current)} variant="outline">
            <Filter className="size-4" /> Filters
          </Button>
          <Button
            aria-label="Refresh candidates"
            disabled={query.isFetching}
            onClick={() => query.refetch()}
            variant="ghost"
          >
            <RefreshCw className={query.isFetching ? 'size-4 animate-spin' : 'size-4'} /> Refresh
          </Button>
        </div>
        {showFilters && (
          <CandidateFilters
            filters={filters}
            onApply={(values) => updateParams({ ...values, page: '' })}
            onReset={() => {
              setSearchParams(search ? { search } : {});
            }}
          />
        )}
      </Card>
      {query.isPending ? (
        <CandidateListSkeleton />
      ) : query.isError ? (
        <EmptyState
          action={<Button onClick={() => query.refetch()}>Try again</Button>}
          description={query.error.message}
          title="Unable to load candidates"
        />
      ) : (
        <>
          <Table
            columns={columns}
            data={candidatesData}
            emptyMessage="No candidates match your search and filters."
            getRowKey={(candidate) => candidate.candidateId}
          />
          <Pagination
            currentPage={query.data.meta.currentPage}
            onPageChange={(nextPage) => updateParams({ page: String(nextPage) })}
            totalPages={query.data.meta.totalPages}
          />
          <p className="text-sm text-slate-500">
            {query.data.meta.total} candidate{query.data.meta.total === 1 ? '' : 's'} found
          </p>
        </>
      )}
      {candidateForStatus && (
        <StatusUpdateModal
          candidate={candidateForStatus}
          isOpen
          onClose={() => setCandidateForStatus(null)}
          role={user?.role}
        />
      )}
    </div>
  );
}
