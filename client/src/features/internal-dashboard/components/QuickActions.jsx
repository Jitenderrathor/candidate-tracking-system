import { FileBarChart, FileSpreadsheet, UserPlus, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button, Card } from '@/components/common';
import { ROLES } from '@/constants/auth';
import { ROUTES } from '@/constants/routes';

const actions = [
  {
    label: 'Add Candidate',
    description: 'Register a new candidate',
    icon: UserPlus,
    path: ROUTES.CANDIDATES,
    state: { openCreate: true },
  },
  {
    label: 'Import Excel',
    description: 'Upload candidate records',
    icon: FileSpreadsheet,
    path: ROUTES.EXCEL_IMPORT,
    roles: [ROLES.ADMIN],
  },
  {
    label: 'View Reports',
    description: 'Review recruitment reports',
    icon: FileBarChart,
    path: ROUTES.REPORTS,
  },
  {
    label: 'Manage Users',
    description: 'Manage system access',
    icon: Users,
    path: ROUTES.USERS,
    roles: [ROLES.ADMIN],
  },
];

export function QuickActions({ role }) {
  const visibleActions = actions.filter((action) => !action.roles || action.roles.includes(role));

  return (
    <section aria-labelledby="quick-actions-title">
      <div className="mb-4">
        <h2 className="font-semibold text-slate-950" id="quick-actions-title">
          Quick Actions
        </h2>
        <p className="mt-1 text-sm text-slate-500">Frequently used recruitment tools.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {visibleActions.map(({ description, icon: Icon, label, path, state }) => (
          <Card
            className="group p-4 transition duration-200 hover:-translate-y-0.5 hover:shadow-lg"
            key={label}
          >
            <span className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-700 transition group-hover:bg-brand-100">
              <Icon aria-hidden="true" className="size-5" />
            </span>
            <h3 className="mt-3 text-sm font-semibold text-slate-900">{label}</h3>
            <p className="mt-1 text-xs text-slate-500">{description}</p>
            <Button asChild className="mt-4 w-full" size="sm" variant="outline">
              <Link state={state} to={path}>
                Open
              </Link>
            </Button>
          </Card>
        ))}
      </div>
    </section>
  );
}
