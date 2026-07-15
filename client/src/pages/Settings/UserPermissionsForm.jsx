import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Shield } from 'lucide-react';
import { Card, Select, Loader, Button } from '@/components/common';
import { listUsers, updateUser } from '@/features/users/user.api';
import { ROLES } from '@/constants/auth';
import { PERMISSION_FEATURES } from '@/constants/permissions';
import { PermissionSelector } from '@/features/users/components/PermissionSelector';
import toast from 'react-hot-toast';

export function UserPermissionsForm() {
  const queryClient = useQueryClient();
  const [selectedUserId, setSelectedUserId] = useState('');
  const [localPermissions, setLocalPermissions] = useState([]);
  const [expandedCategories, setExpandedCategories] = useState(
    PERMISSION_FEATURES.reduce((acc, cat) => ({ ...acc, [cat.category]: true }), {})
  );

  const { data, isLoading, isError } = useQuery({
    queryKey: ['users', { limit: 500 }],
    queryFn: () => listUsers({ limit: 500 }),
  });

  const users = data?.users || [];

  const updateMutation = useMutation({
    mutationFn: ({ id, permissions }) => updateUser({ id, values: { permissions } }),
    onSuccess: () => {
      toast.success('Permissions updated successfully');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error) => {
      toast.error(error?.response?.data?.error?.message || 'Failed to update permissions');
    },
  });

  const userOptions = useMemo(() => {
    return [
      { label: 'Select a user...', value: '' },
      ...users.map(u => ({ label: `${u.name || u.fullName} (${u.email})`, value: u.id || u._id }))
    ];
  }, [users]);

  const selectedUser = useMemo(() => {
    return users.find(u => (u.id || u._id) === selectedUserId);
  }, [selectedUserId, users]);

  useEffect(() => {
    if (selectedUser) {
      setLocalPermissions(selectedUser.permissions || []);
    } else {
      setLocalPermissions([]);
    }
  }, [selectedUser]);

  const handleSave = () => {
    if (!selectedUserId) return;
    updateMutation.mutate({ id: selectedUserId, permissions: localPermissions });
  };

  const isSuperAdmin = selectedUser?.role === ROLES.SUPER_ADMIN;
  const hasChanges = selectedUser && JSON.stringify([...localPermissions].sort()) !== JSON.stringify([...(selectedUser.permissions || [])].sort());

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
      <header className="flex justify-between items-start">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">User Permissions Viewer</h2>
          <p className="mt-1 text-sm text-slate-500">
            Select a user to audit and modify their system access permissions.
          </p>
        </div>
        {selectedUser && !isSuperAdmin && (
          <Button 
            onClick={handleSave} 
            disabled={!hasChanges || updateMutation.isPending}
            isLoading={updateMutation.isPending}
          >
            Save Permissions
          </Button>
        )}
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

          {isSuperAdmin && (
            <div className="bg-purple-50 border border-purple-200 text-purple-700 p-4 rounded-lg text-sm">
              Super Admins implicitly have all permissions. Their access cannot be restricted here.
            </div>
          )}

          <Card>
            <header className="mb-6 flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-slate-950">System Permissions</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Select the specific features this user can access.
                </p>
              </div>
              {!isSuperAdmin && (() => {
                const allPerms = PERMISSION_FEATURES.flatMap((cat) => cat.features.map((f) => f.id));
                const isAllSelected = localPermissions.length === allPerms.length;
                
                return (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (isAllSelected) {
                        setLocalPermissions([]);
                      } else {
                        setLocalPermissions(allPerms);
                      }
                    }}
                    type="button"
                  >
                    {isAllSelected ? 'Deselect All' : 'Select All'}
                  </Button>
                );
              })()}
            </header>
            <PermissionSelector
              permissions={localPermissions}
              onChange={setLocalPermissions}
              disabled={isSuperAdmin}
            />
          </Card>
        </div>
      )}
    </div>
  );
}
