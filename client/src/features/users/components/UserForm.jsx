import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button, Card, Input, Loader, Select } from '@/components/common';
import { PasswordField } from '@/features/auth/components/PasswordField';
import { PasswordStrength } from '@/features/auth/components/PasswordStrength';
import { useAuth } from '@/hooks/useAuth';
import { ROLES } from '@/constants/auth';
import { addUserSchema, editUserSchema, userDefaults } from '@/features/users/user.schema';
import { PERMISSION_FEATURES, DEFAULT_ROLE_PERMISSIONS } from '@/constants/permissions';
import { PermissionSelector } from './PermissionSelector';

const ALL_ROLE_OPTIONS = [
  { label: 'Super Admin', value: ROLES.SUPER_ADMIN },
  { label: 'Admin', value: ROLES.ADMIN },
  { label: 'User', value: ROLES.USER },
];

export function UserForm({ isEdit = false, isSubmitting, onCancel, onSubmit, user }) {
  const { user: currentUser } = useAuth();
  
  let roleOptions = ALL_ROLE_OPTIONS.filter(r => r.value === ROLES.USER);
  if (currentUser?.role === ROLES.SUPER_ADMIN) {
    roleOptions = ALL_ROLE_OPTIONS;
  } else if (currentUser?.permissions?.includes('manage_admins')) {
    roleOptions = ALL_ROLE_OPTIONS.filter(r => r.value !== ROLES.SUPER_ADMIN);
  }
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
    watch,
    setValue,
  } = useForm({
    defaultValues: userDefaults,
    resolver: zodResolver(isEdit ? editUserSchema : addUserSchema),
  });
  
  const [hasInitialized, setHasInitialized] = useState(false);
  const currentRole = watch('role');
  const [previousRole, setPreviousRole] = useState(user?.role || 'User');

  useEffect(() => {
    reset(
      user
        ? {
            ...userDefaults,
            fullName: user.fullName || user.name,
            email: user.email,
            role: user.role,
            permissions: user.permissions || [],
          }
        : userDefaults,
    );
    // Use setTimeout to allow the reset to fully flush to the form state before we start listening for manual changes
    setTimeout(() => setHasInitialized(true), 0);
  }, [reset, user]);

  useEffect(() => {
    if (hasInitialized && currentRole && currentRole !== previousRole) {
      setPreviousRole(currentRole);
      setValue('permissions', DEFAULT_ROLE_PERMISSIONS[currentRole] || [], { shouldDirty: true });
    }
  }, [currentRole, previousRole, setValue, hasInitialized]);

  const password = watch('password');

  const submit = (values) => {
    if (isEdit) onSubmit({ fullName: values.fullName, email: values.email, role: values.role, permissions: values.permissions });
    else
      onSubmit({
        fullName: values.fullName,
        email: values.email,
        role: values.role,
        password: values.password,
        permissions: values.permissions,
      });
  };

  const isSuperAdmin = currentRole === ROLES.SUPER_ADMIN;

  return (
    <form className="space-y-6" noValidate onSubmit={handleSubmit(submit)}>
      <Card>
        <header className="mb-6">
          <h2 className="font-semibold text-slate-950">Account Information</h2>
          <p className="mt-1 text-sm text-slate-500">
            Identity, sign-in address, and system access role.
          </p>
        </header>
        <div className="grid gap-5 md:grid-cols-2">
          <Input
            autoFocus
            error={errors.fullName?.message}
            label="Full Name"
            required
            {...register('fullName')}
          />
          <Input
            autoComplete="email"
            error={errors.email?.message}
            label="Email"
            required
            type="email"
            {...register('email')}
          />
          <Select
            error={errors.role?.message}
            label="Role"
            options={roleOptions}
            required
            {...register('role')}
          />
        </div>
      </Card>
      {!isEdit && (
        <Card>
          <header className="mb-6 flex items-start justify-between">
            <div>
              <h2 className="font-semibold text-slate-950">Initial Password</h2>
              <p className="mt-1 text-sm text-slate-500">
                {currentRole === 'User' ? 'This password will be permanent as standard users cannot change it.' : 'The user can change this password after signing in.'}
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
                let generated = 'aA1!'; // Guarantee required characters
                for (let i = 0; i < 10; i++) {
                  generated += chars.charAt(Math.floor(Math.random() * chars.length));
                }
                generated = generated.split('').sort(() => 0.5 - Math.random()).join('');
                setValue('password', generated, { shouldValidate: true, shouldDirty: true });
                setValue('confirmPassword', generated, { shouldValidate: true, shouldDirty: true });
              }}
            >
              Generate Password
            </Button>
          </header>
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <PasswordField
                autoComplete="new-password"
                error={errors.password?.message}
                label="Password"
                required
                {...register('password')}
              />
              <PasswordStrength password={password} />
            </div>
            <PasswordField
              autoComplete="new-password"
              error={errors.confirmPassword?.message}
              label="Confirm Password"
              required
              {...register('confirmPassword')}
            />
          </div>
        </Card>
      )}

      <Card>
        <header className="mb-6 flex items-start justify-between">
          <div>
            <h2 className="font-semibold text-slate-950">System Permissions</h2>
            <p className="mt-1 text-sm text-slate-500">
              Select the specific features this user can access.
            </p>
          </div>
          {!isSuperAdmin && (() => {
            const allPerms = PERMISSION_FEATURES.flatMap((cat) => cat.features.map((f) => f.id));
            const currentPerms = watch('permissions') || [];
            const isAllSelected = currentPerms.length === allPerms.length;
            
            return (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (isAllSelected) {
                    setValue('permissions', [], { shouldDirty: true });
                  } else {
                    setValue('permissions', allPerms, { shouldDirty: true });
                  }
                }}
                type="button"
              >
                {isAllSelected ? 'Deselect All' : 'Select All'}
              </Button>
            );
          })()}
        </header>
        {isSuperAdmin ? (
          <div className="bg-purple-50 border border-purple-200 text-purple-700 p-4 rounded-lg text-sm mb-4">
            Super Admins implicitly have all permissions. Their access cannot be restricted here.
          </div>
        ) : null}
        <PermissionSelector
          permissions={watch('permissions') || []}
          onChange={(newPerms) => setValue('permissions', newPerms, { shouldDirty: true })}
          disabled={isSuperAdmin}
        />
      </Card>
      <div className="flex justify-end gap-3">
        <Button onClick={onCancel} variant="outline">
          Cancel
        </Button>
        <Button disabled={isSubmitting} type="submit">
          {isSubmitting ? (
            <Loader className="text-white" label="Saving..." size="sm" />
          ) : isEdit ? (
            'Save Changes'
          ) : (
            'Create User'
          )}
        </Button>
      </div>
    </form>
  );
}
