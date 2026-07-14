import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Check, X, Shield, Users, Mail, Settings, LayoutDashboard, UserSearch, BarChart3, FileSpreadsheet, Trash2 } from 'lucide-react';
import { Card, Select, Loader } from '@/components/common';
import { listUsers } from '@/features/users/user.api';
import { ROLES } from '@/constants/auth';

const PERMISSION_FEATURES = [
  {
    id: 'dashboard',
    label: 'Dashboard Overview',
    description: 'View overall system metrics and recent activity',
    icon: LayoutDashboard,
    roles: [ROLES.USER, ROLES.ADMIN, ROLES.SUPER_ADMIN],
  },
  {
    id: 'candidates',
    label: 'Candidate Management',
    description: 'View, add, and manage candidate profiles',
    icon: UserSearch,
    roles: [ROLES.USER, ROLES.ADMIN, ROLES.SUPER_ADMIN],
  },
  {
    id: 'reports',
    label: 'View Reports',
    description: 'Access detailed analytical reports',
    icon: BarChart3,
    roles: [ROLES.USER, ROLES.ADMIN, ROLES.SUPER_ADMIN],
  },
  {
    id: 'excel_import',
    label: 'Bulk Excel Import',
    description: 'Import multiple candidates via Excel',
    icon: FileSpreadsheet,
    roles: [ROLES.ADMIN, ROLES.SUPER_ADMIN],
  },
  {
    id: 'manage_users',
    label: 'Manage Standard Users',
    description: 'Create and manage standard User accounts',
    icon: Users,
    roles: [ROLES.ADMIN, ROLES.SUPER_ADMIN],
  },
  {
    id: 'recycle_bin',
    label: 'Recycle Bin Access',
    description: 'View and restore deleted records',
    icon: Trash2,
    roles: [ROLES.ADMIN, ROLES.SUPER_ADMIN],
  },
  {
    id: 'email_templates',
    label: 'Email Templates',
    description: 'Manage system email templates',
    icon: Mail,
    roles: [ROLES.ADMIN, ROLES.SUPER_ADMIN],
  },
  {
    id: 'system_settings',
    label: 'System Settings',
    description: 'Access configuration for SMTP, Accounts, etc.',
    icon: Settings,
    roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN],
  },
  {
    id: 'manage_admins',
    label: 'Full Admin Management',
    description: 'Create and manage other Admins',
    icon: Shield,
    roles: [ROLES.SUPER_ADMIN],
  },
];

export function UserPermissionsForm() {
  const [selectedUserId, setSelectedUserId] = useState('');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['users', { limit: 500 }],
    queryFn: () => listUsers({ limit: 500 }),
  });

  const users = data?.users || [];

  const userOptions = useMemo(() => {
    return [
      { label: 'Select a user...', value: '' },
      ...users.map(u => ({ label: `${u.name || u.fullName} (${u.email})`, value: u.id || u._id }))
    ];
  }, [users]);

  const selectedUser = useMemo(() => {
    return users.find(u => (u.id || u._id) === selectedUserId);
  }, [selectedUserId, users]);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader size="lg" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-red-500">Failed to load users.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header>
        <h2 className="text-lg font-semibold text-slate-950">User Permissions Viewer</h2>
        <p className="mt-1 text-sm text-slate-500">
          Select a user to audit their system access and feature permissions. Permissions are strictly tied to their role.
        </p>
      </header>

      <div className="max-w-md">
        <Select
          label="Select User"
          options={userOptions}
          value={selectedUserId}
          onChange={(e) => setSelectedUserId(e.target.value)}
        />
      </div>

      {selectedUser && (
        <div className="space-y-6 pt-4 border-t border-slate-200">
          <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div>
              <p className="text-sm font-medium text-slate-500">Current Role</p>
              <p className="text-lg font-bold text-slate-900 mt-1">{selectedUser.role}</p>
            </div>
            <Shield className={`size-8 ${selectedUser.role === ROLES.SUPER_ADMIN ? 'text-purple-600' : selectedUser.role === ROLES.ADMIN ? 'text-blue-600' : 'text-slate-400'}`} />
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-4 uppercase tracking-wider">Feature Access Matrix</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {PERMISSION_FEATURES.map((feature) => {
                const Icon = feature.icon;
                const hasAccess = feature.roles.includes(selectedUser.role);
                
                return (
                  <Card key={feature.id} className={`p-4 transition-all duration-200 ${hasAccess ? 'border-green-200 bg-green-50/30' : 'border-slate-200 bg-slate-50/50 opacity-60'}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${hasAccess ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-500'}`}>
                          <Icon className="size-4" />
                        </div>
                        <h4 className={`text-sm font-semibold ${hasAccess ? 'text-slate-900' : 'text-slate-500'}`}>
                          {feature.label}
                        </h4>
                      </div>
                      {hasAccess ? (
                        <Check className="size-5 text-green-600 shrink-0" />
                      ) : (
                        <X className="size-5 text-slate-400 shrink-0" />
                      )}
                    </div>
                    <p className="mt-3 text-xs text-slate-500 leading-relaxed ml-[44px]">
                      {feature.description}
                    </p>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
