import { FileBarChart, FileSpreadsheet, UserPlus, Users, Trash2, ShieldAlert } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Card, Modal } from '@/components/common';
import { ROLES } from '@/constants/auth';
import { ROUTES } from '@/constants/routes';
import { bulkDeleteCandidates } from '@/features/candidates/candidate.api';

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
    roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN],
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
    roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN],
  },
  {
    label: 'Recycle Bin',
    description: 'View deleted records',
    icon: Trash2,
    path: ROUTES.TRASH,
    roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN],
  },
];

export function QuickActions({ role }) {
  const [showWipeModal, setShowWipeModal] = useState(false);
  const queryClient = useQueryClient();
  const visibleActions = actions.filter((action) => !action.roles || action.roles.includes(role));

  const wipeMutation = useMutation({
    mutationFn: bulkDeleteCandidates,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['internal-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['candidates'] });
      setShowWipeModal(false);
    },
  });

  return (
    <section aria-labelledby="quick-actions-title">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-slate-950" id="quick-actions-title">
            Quick Actions
          </h2>
          <p className="mt-1 text-sm text-slate-500">Frequently used recruitment tools.</p>
        </div>
        {(role === ROLES.ADMIN || role === ROLES.SUPER_ADMIN) && (
          <Button onClick={() => setShowWipeModal(true)} variant="danger" size="sm">
            <ShieldAlert className="size-4" /> Wipe Complete Data
          </Button>
        )}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
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

      <Modal
        isOpen={showWipeModal}
        onClose={() => setShowWipeModal(false)}
        title="Wipe Complete Data"
      >
        <div className="space-y-4">
          <div className="rounded-xl bg-red-50 p-4 text-sm text-red-800">
            <strong>Warning:</strong> You are about to move all candidates to the Recycle Bin. They will be temporarily stored there and automatically deleted after 30 days unless restored.
          </div>
          <p className="text-sm text-slate-600">
            Are you absolutely sure you want to clear all candidate records?
          </p>
          <div className="flex justify-end gap-3 pt-4">
            <Button disabled={wipeMutation.isPending} onClick={() => setShowWipeModal(false)} variant="outline">
              Cancel
            </Button>
            <Button
              disabled={wipeMutation.isPending}
              onClick={() => wipeMutation.mutate()}
              variant="danger"
            >
              {wipeMutation.isPending ? 'Wiping Data...' : 'Yes, Wipe Data'}
            </Button>
          </div>
        </div>
      </Modal>
    </section>
  );
}
