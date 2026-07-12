import { useQuery } from '@tanstack/react-query';
import {
  Award,
  ClipboardList,
  ListChecks,
  RefreshCw,
  User,
  UserCheck,
  UserRoundPlus,
  Users,
  XCircle,
} from 'lucide-react';
import { Button, Card, EmptyState, StatCard, Table } from '@/components/common';
import { getPublicDashboardSummary } from '@/features/public-dashboard/publicDashboard.api';
import { STATUS_ORDER } from '@/features/public-dashboard/publicDashboard.constants';
import { ChartCard } from '@/features/public-dashboard/components/ChartCard';
import { MonthlyLineChart } from '@/features/public-dashboard/components/MonthlyLineChart';
import { PublicDashboardSkeleton } from '@/features/public-dashboard/components/PublicDashboardSkeleton';
import { SourceBarChart } from '@/features/public-dashboard/components/SourceBarChart';
import { SourceSummaryTable } from '@/features/public-dashboard/components/SourceSummaryTable';
import { StatusBadge } from '@/features/public-dashboard/components/StatusBadge';
import { StatusPieChart } from '@/features/public-dashboard/components/StatusPieChart';

const numberFormatter = new Intl.NumberFormat();
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

const recentColumns = [
  { key: 'candidateId', header: 'Candidate ID', cellClassName: 'font-medium text-slate-900' },
  { key: 'name', header: 'Name', cellClassName: 'min-w-40' },
  { key: 'source', header: 'Source' },
  {
    key: 'status',
    header: 'Status',
    render: (candidate) => <StatusBadge status={candidate.status} />,
  },
  {
    key: 'createdAt',
    header: 'Registration Date',
    cellClassName: 'whitespace-nowrap',
    render: (candidate) => dateFormatter.format(new Date(candidate.createdAt)),
  },
];

const toMonthlyData = (items = []) =>
  items.map((item) => {
    const date = new Date(`${item.month}-01T00:00:00.000Z`);
    return {
      ...item,
      monthLabel: monthFormatter.format(date),
      fullMonth: fullMonthFormatter.format(date),
    };
  });

export function PublicDashboardPage() {
  const query = useQuery({
    queryKey: ['public-dashboard', 'summary'],
    queryFn: getPublicDashboardSummary,
  });

  if (query.isPending)
    return (
      <DashboardPageFrame>
        <PublicDashboardSkeleton />
      </DashboardPageFrame>
    );
  if (query.isError)
    return (
      <DashboardPageFrame>
        <EmptyState
          action={
            <Button onClick={() => query.refetch()}>
              <RefreshCw className="size-4" /> Try again
            </Button>
          }
          description={query.error.message}
          title="Unable to load dashboard"
        />
      </DashboardPageFrame>
    );

  const summary = query.data;
  const statuses = summary.statusSummary || {};
  const genders = summary.genderSummary || {};
  const statusData = STATUS_ORDER.map((name) => ({ name, count: statuses[name] || 0 }));
  const sourceData = Object.entries(summary.sourceSummary || {}).map(([name, count]) => ({
    name,
    count,
  }));
  const monthlyData = toMonthlyData(summary.monthlyTrend);
  const hasStatuses = statusData.some(({ count }) => count > 0);
  const hasSources = sourceData.some(({ count }) => count > 0);

  const stats = [
    { label: 'Total Registrations', value: summary.totalCandidates || 0, icon: ClipboardList },
    { label: 'Registered', value: statuses.Registered || 0, icon: UserRoundPlus },
    { label: 'Under Consideration', value: statuses['Under Consideration'] || 0, icon: UserCheck },
    { label: 'To Be Shortlisted', value: statuses['To Be Shortlisted'] || 0, icon: ListChecks },
    { label: 'Selected', value: statuses.Selected || 0, icon: Award },
    { label: 'Rejected', value: statuses.Rejected || 0, icon: XCircle },
    { label: 'Male Candidates', value: genders.Male || 0, icon: User },
    { label: 'Female Candidates', value: genders.Female || 0, icon: Users },
  ];

  return (
    <DashboardPageFrame>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            className="transition duration-300 hover:-translate-y-1 hover:drop-shadow-lg"
            key={stat.label}
          >
            <StatCard {...stat} value={numberFormatter.format(stat.value)} />
          </div>
        ))}
      </div>
      <div className="mt-6">
        <SourceSummaryTable sources={summary.sourceSummary} updatedAt={query.dataUpdatedAt} />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <ChartCard
          description="Candidates grouped by their registration channel."
          empty={!hasSources}
          title="Registration Sources"
        >
          <SourceBarChart data={sourceData} />
        </ChartCard>
        <ChartCard
          description="Current distribution across recruitment stages."
          empty={!hasStatuses}
          title="Candidate Status"
        >
          <StatusPieChart data={statusData.filter(({ count }) => count > 0)} />
        </ChartCard>
      </div>
      <div className="mt-6">
        <ChartCard
          description="Candidate registrations recorded over the last 12 months."
          empty={!monthlyData.some(({ registrationCount }) => registrationCount > 0)}
          title="Monthly Registration Trend"
        >
          <MonthlyLineChart data={monthlyData} />
        </ChartCard>
      </div>
      <Card className="mt-6 border-white/70 bg-white/80 p-0 shadow-lg shadow-slate-200/50 backdrop-blur-xl">
        <header className="p-5">
          <h2 className="font-semibold text-slate-950">Recently Registered Candidates</h2>
          <p className="mt-1 text-sm text-slate-500">The latest candidate registrations.</p>
        </header>
        <Table
          className="rounded-none border-x-0 border-b-0 shadow-none"
          columns={recentColumns}
          data={summary.recentCandidates || []}
          emptyMessage="No candidates have been registered yet."
          getRowKey={(candidate) => candidate.candidateId}
        />
      </Card>
    </DashboardPageFrame>
  );
}

function DashboardPageFrame({ children }) {
  return (
    <section className="relative isolate overflow-hidden bg-slate-50 px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-80 bg-gradient-to-br from-brand-100/70 via-white to-violet-100/60" />
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">
            Recruitment overview
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            Public Dashboard
          </h1>
          <p className="mt-3 text-base leading-7 text-slate-600">
            A live view of candidate registrations and recruitment progress.
          </p>
        </header>
        {children}
      </div>
    </section>
  );
}
