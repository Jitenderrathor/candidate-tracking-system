import { useQuery } from '@tanstack/react-query';
import {
  Award,
  ClipboardList,
  Eye,
  ListChecks,
  RefreshCw,
  UserCheck,
  User,
  UserRoundPlus,
  Users,
  XCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button, Card, EmptyState, StatCard, Table } from '@/components/common';
import { ROUTES } from '@/constants/routes';
import { QuickActions } from '@/features/internal-dashboard/components/QuickActions';
import { InternalDashboardSkeleton } from '@/features/internal-dashboard/components/InternalDashboardSkeleton';
import { getPublicDashboardSummary } from '@/features/public-dashboard/publicDashboard.api';
import { STATUS_ORDER } from '@/features/public-dashboard/publicDashboard.constants';
import { ChartCard } from '@/features/public-dashboard/components/ChartCard';
import { MonthlyLineChart } from '@/features/public-dashboard/components/MonthlyLineChart';
import { SourceBarChart } from '@/features/public-dashboard/components/SourceBarChart';
import { StatusBadge } from '@/features/public-dashboard/components/StatusBadge';
import { StatusPieChart } from '@/features/public-dashboard/components/StatusPieChart';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/utils/cn';

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

const toCandidatePath = (candidateId) => ROUTES.CANDIDATE_DETAILS.replace(':id', candidateId);

const recentColumns = [
  { key: 'candidateId', header: 'Candidate ID', cellClassName: 'font-medium text-slate-900' },
  { key: 'name', header: 'Name', cellClassName: 'min-w-40' },
  { key: 'source', header: 'Source' },
  {
    key: 'status',
    header: 'Current Status',
    render: (candidate) => <StatusBadge status={candidate.status} />,
  },
  {
    key: 'createdAt',
    header: 'Created Date',
    cellClassName: 'whitespace-nowrap',
    render: (candidate) => dateFormatter.format(new Date(candidate.createdAt)),
  },
  {
    key: 'action',
    header: 'Action',
    render: (candidate) => (
      <Button asChild size="sm" variant="ghost">
        <Link aria-label={`View ${candidate.name}`} to={toCandidatePath(candidate.candidateId)}>
          <Eye className="size-4" /> View
        </Link>
      </Button>
    ),
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

export function InternalDashboardPage() {
  const { user } = useAuth();
  const query = useQuery({
    queryKey: ['internal-dashboard', 'summary'],
    queryFn: getPublicDashboardSummary,
    refetchInterval: 60000,
  });

  if (query.isPending) return <InternalDashboardSkeleton />;
  if (query.isError)
    return (
      <EmptyState
        action={
          <Button onClick={() => query.refetch()}>
            <RefreshCw className="size-4" /> Try again
          </Button>
        }
        description={query.error.message}
        title="Unable to load dashboard"
      />
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
  const stats = [
    { label: 'Total Candidates', value: summary.totalCandidates || 0, icon: ClipboardList },
    { label: 'Registered', value: statuses.Registered || 0, icon: UserRoundPlus },
    { label: 'Under Consideration', value: statuses['Under Consideration'] || 0, icon: UserCheck },
    { label: 'To Be Shortlisted', value: statuses['To Be Shortlisted'] || 0, icon: ListChecks },
    { label: 'Selected', value: statuses.Selected || 0, icon: Award },
    { label: 'Rejected', value: statuses.Rejected || 0, icon: XCircle },
    { label: 'Male Candidates', value: genders.Male || 0, icon: User },
    { label: 'Female Candidates', value: genders.Female || 0, icon: Users },
  ];

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-950">Recruitment Overview</h2>
          <p className="mt-1 text-sm text-slate-500">
            Live candidate pipeline and registration analytics.
          </p>
        </div>
        <Button disabled={query.isFetching} onClick={() => query.refetch()} variant="outline">
          <RefreshCw className={cn('size-4', query.isFetching && 'animate-spin')} />
          {query.isFetching ? 'Refreshing...' : 'Refresh'}
        </Button>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div className="transition duration-200 hover:-translate-y-0.5" key={stat.label}>
            <StatCard {...stat} value={numberFormatter.format(stat.value)} />
          </div>
        ))}
      </div>

      <QuickActions role={user?.role} />

      <div className="grid gap-6 xl:grid-cols-2">
        <ChartCard
          description="Candidates grouped by registration channel."
          empty={!sourceData.some(({ count }) => count > 0)}
          title="Source Distribution"
        >
          <SourceBarChart data={sourceData} />
        </ChartCard>
        <ChartCard
          description="Current recruitment pipeline distribution."
          empty={!statusData.some(({ count }) => count > 0)}
          title="Status Distribution"
        >
          <StatusPieChart data={statusData.filter(({ count }) => count > 0)} />
        </ChartCard>
      </div>

      <ChartCard
        description="Candidate registrations recorded over the last 12 months."
        empty={!monthlyData.some(({ registrationCount }) => registrationCount > 0)}
        title="Monthly Registration Trend"
      >
        <MonthlyLineChart data={monthlyData} />
      </ChartCard>

      <Card className="p-0">
        <header className="flex items-center justify-between gap-4 p-5">
          <div>
            <h2 className="font-semibold text-slate-950">Recent Candidates</h2>
            <p className="mt-1 text-sm text-slate-500">The latest 10 candidate registrations.</p>
          </div>
          <Button asChild size="sm" variant="outline">
            <Link to={ROUTES.CANDIDATES}>View all</Link>
          </Button>
        </header>
        <Table
          className="rounded-none border-x-0 border-b-0 shadow-none"
          columns={recentColumns}
          data={summary.recentCandidates || []}
          emptyMessage="No candidates have been registered yet."
          getRowKey={(candidate) => candidate.candidateId}
        />
      </Card>
    </div>
  );
}
