import {
  Award,
  ClipboardList,
  ListChecks,
  RefreshCw,
  UserCheck,
  UserRoundPlus,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button, Card, EmptyState, Pagination, Select, StatCard, Table } from '@/components/common';
import { STATUS_ORDER } from '@/features/public-dashboard/publicDashboard.constants';
import { ChartCard } from '@/features/public-dashboard/components/ChartCard';
import { MonthlyLineChart } from '@/features/public-dashboard/components/MonthlyLineChart';
import { SourceBarChart } from '@/features/public-dashboard/components/SourceBarChart';
import { StatusBadge } from '@/features/public-dashboard/components/StatusBadge';
import { StatusPieChart } from '@/features/public-dashboard/components/StatusPieChart';
import { INITIAL_REPORT_FILTERS, REPORT_SORT_OPTIONS } from '@/features/reports/report.constants';
import { ReportFilters } from '@/features/reports/components/ReportFilters';
import { ReportsSkeleton } from '@/features/reports/components/ReportsSkeleton';
import { useReportQueries } from '@/features/reports/useReportQueries';

const numberFormatter = new Intl.NumberFormat();
const moneyFormatter = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 });
const dateFormatter = new Intl.DateTimeFormat(undefined, {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});
const monthFormatter = new Intl.DateTimeFormat(undefined, { month: 'short', timeZone: 'UTC' });
const fullMonthFormatter = new Intl.DateTimeFormat(undefined, {
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

const cleanFilters = (filters) =>
  Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== ''));

export function ReportsPage() {
  const [filters, setFilters] = useState(INITIAL_REPORT_FILTERS);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState('newest');
  const appliedFilters = useMemo(() => cleanFilters(filters), [filters]);
  const reports = useReportQueries(appliedFilters, page, sort);
  const isPending = reports.all.some((query) => query.isPending);
  const failed = reports.all.find((query) => query.isError);
  const applyFilters = (nextFilters) => {
    setFilters({ ...nextFilters });
    setPage(1);
  };
  const retryAll = () => reports.all.forEach((query) => query.refetch());

  if (isPending)
    return (
      <div className="space-y-6">
        <ReportFilters filters={filters} onApply={applyFilters} />
        <ReportsSkeleton />
      </div>
    );
  if (failed)
    return (
      <div className="space-y-6">
        <ReportFilters filters={filters} onApply={applyFilters} />
        <EmptyState
          action={
            <Button onClick={retryAll}>
              <RefreshCw className="size-4" /> Retry reports
            </Button>
          }
          description={failed.error.message}
          title="Unable to load reports"
        />
      </div>
    );

  const summary = reports.summary.data || {};
  const summaryStatuses = summary.statusSummary || {};
  const statusData = STATUS_ORDER.map((name) => ({
    name,
    count: reports.status.data?.statusSummary?.[name] || 0,
  }));
  const sourceData = Object.entries(reports.source.data?.sourceSummary || {}).map(
    ([name, count]) => ({ name, count }),
  );
  const monthlyData = (reports.monthly.data || []).map((item) => {
    const date = new Date(`${item.month}-01T00:00:00.000Z`);
    return {
      ...item,
      registrationCount: item.registrations,
      monthLabel: monthFormatter.format(date),
      fullMonth: fullMonthFormatter.format(date),
    };
  });
  const pipelineData = STATUS_ORDER.map((name) => ({
    name,
    count: reports.pipeline.data?.pipeline?.[name] || 0,
  }));
  const candidateReport = reports.candidates.data;
  const stats = [
    { label: 'Total Candidates', value: summary.totalCandidates || 0, icon: ClipboardList },
    { label: 'Registered', value: summaryStatuses.Registered || 0, icon: UserRoundPlus },
    {
      label: 'Under Consideration',
      value: summaryStatuses['Under Consideration'] || 0,
      icon: UserCheck,
    },
    {
      label: 'To Be Shortlisted',
      value: summaryStatuses['To Be Shortlisted'] || 0,
      icon: ListChecks,
    },
    { label: 'Selected', value: summaryStatuses.Selected || 0, icon: Award },
  ];
  const columns = [
    {
      key: 'candidateId',
      header: 'Candidate ID',
      cellClassName: 'font-medium text-slate-950 whitespace-nowrap',
    },
    {
      key: 'name',
      header: 'Name',
      cellClassName: 'min-w-40',
      render: (candidate) => `${candidate.firstName} ${candidate.lastName}`,
    },
    {
      key: 'status',
      header: 'Status',
      render: (candidate) => <StatusBadge status={candidate.status} />,
    },
    { key: 'source', header: 'Source', cellClassName: 'whitespace-nowrap' },
    { key: 'qualification', header: 'Qualification', cellClassName: 'min-w-36' },
    {
      key: 'experienceYears',
      header: 'Experience',
      render: (candidate) => `${candidate.experienceYears} yrs`,
    },
    {
      key: 'currentCTC',
      header: 'Current CTC',
      render: (candidate) => moneyFormatter.format(candidate.currentCTC || 0),
    },
    {
      key: 'expectedCTC',
      header: 'Expected CTC',
      render: (candidate) => moneyFormatter.format(candidate.expectedCTC || 0),
    },
    {
      key: 'createdAt',
      header: 'Created Date',
      cellClassName: 'whitespace-nowrap',
      render: (candidate) => dateFormatter.format(new Date(candidate.createdAt)),
    },
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold text-slate-950">Recruitment Reports</h1>
        <p className="mt-1 text-sm text-slate-500">
          Analyze recruitment performance with flexible, combined filters.
        </p>
      </header>
      <ReportFilters filters={filters} onApply={applyFilters} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {stats.map((stat) => (
          <StatCard {...stat} key={stat.label} value={numberFormatter.format(stat.value)} />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <ChartCard
          description="Candidates grouped by recruitment stage."
          empty={!statusData.some(({ count }) => count > 0)}
          title="Status Distribution"
        >
          <StatusPieChart data={statusData.filter(({ count }) => count > 0)} />
        </ChartCard>
        <ChartCard
          description="Candidates grouped by registration channel."
          empty={!sourceData.some(({ count }) => count > 0)}
          title="Source Distribution"
        >
          <SourceBarChart data={sourceData} />
        </ChartCard>
        <ChartCard
          description="Filtered candidate registrations by month."
          empty={!monthlyData.length}
          title="Monthly Registrations"
        >
          <MonthlyLineChart data={monthlyData} />
        </ChartCard>
        <ChartCard
          description="Counts across each stage of the recruitment funnel."
          empty={!pipelineData.some(({ count }) => count > 0)}
          title="Recruitment Pipeline"
        >
          <div className="mb-3 flex items-center justify-between rounded-xl bg-brand-50 px-4 py-3">
            <span className="text-sm font-medium text-brand-800">Overall Conversion</span>
            <strong className="text-xl text-brand-700">
              {reports.pipeline.data?.conversionPercentage || 0}%
            </strong>
          </div>
          <SourceBarChart data={pipelineData} />
        </ChartCard>
      </div>
      <Card className="p-0">
        <header className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-slate-950">Candidate Report</h2>
            <p className="mt-1 text-sm text-slate-500">
              {candidateReport.meta.total} matching candidate
              {candidateReport.meta.total === 1 ? '' : 's'}.
            </p>
          </div>
          <Select
            className="sm:w-56"
            label="Sort Results"
            onChange={(event) => {
              setSort(event.target.value);
              setPage(1);
            }}
            options={REPORT_SORT_OPTIONS}
            value={sort}
          />
        </header>
        <Table
          className="rounded-none border-x-0 shadow-none"
          columns={columns}
          data={candidateReport.candidates}
          emptyMessage="No candidates match the selected report filters."
          getRowKey={(candidate) => candidate.candidateId}
        />
        <div className="p-5">
          <Pagination
            currentPage={candidateReport.meta.currentPage}
            onPageChange={setPage}
            totalPages={candidateReport.meta.totalPages}
          />
        </div>
      </Card>
    </div>
  );
}
