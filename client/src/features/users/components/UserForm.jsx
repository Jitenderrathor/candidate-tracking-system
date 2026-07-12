import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button, Card, Input, Loader, Select } from '@/components/common';
import { PasswordField } from '@/features/auth/components/PasswordField';
import { PasswordStrength } from '@/features/auth/components/PasswordStrength';
import { addUserSchema, editUserSchema, userDefaults } from '@/features/users/user.schema';

const roleOptions = [
  { label: 'Admin', value: 'Admin' },
  { label: 'User', value: 'User' },
];

export function UserForm({ isEdit = false, isSubmitting, onCancel, onSubmit, user }) {
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
    watch,
  } = useForm({
    defaultValues: userDefaults,
    resolver: zodResolver(isEdit ? editUserSchema : addUserSchema),
  });
  useEffect(() => {
    reset(
      user
        ? {
            ...userDefaults,
            fullName: user.fullName || user.name,
            email: user.email,
            role: user.role,
          }
        : userDefaults,
    );
  }, [reset, user]);
  const password = watch('password');

  const submit = (values) => {
    if (isEdit) onSubmit({ fullName: values.fullName, email: values.email, role: values.role });
    else
      onSubmit({
        fullName: values.fullName,
        email: values.email,
        role: values.role,
        password: values.password,
      });
  };

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
          <header className="mb-6">
            <h2 className="font-semibold text-slate-950">Initial Password</h2>
            <p className="mt-1 text-sm text-slate-500">
              The user can change this password after signing in.
            </p>
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
