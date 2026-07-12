import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { KeyRound } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Button, Loader } from '@/components/common';
import { changePasswordRequest } from '@/features/auth/auth.api';
import { changePasswordSchema } from '@/features/auth/auth.schemas';
import { PasswordField } from '@/features/auth/components/PasswordField';
import { PasswordStrength } from '@/features/auth/components/PasswordStrength';

export function ChangePasswordPage() {
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
    setError,
    watch,
  } = useForm({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { oldPassword: '', newPassword: '', confirmPassword: '' },
  });
  const newPassword = watch('newPassword');
  const mutation = useMutation({
    mutationFn: ({ oldPassword, newPassword }) =>
      changePasswordRequest({ oldPassword, newPassword }),
    onSuccess: (response) => {
      reset();
      toast.success(response.message);
    },
    onError: (error) => setError('root', { message: error.message }),
  });

  return (
    <section className="mx-auto max-w-xl" aria-labelledby="change-password-title">
      <div className="rounded-xl border bg-white p-6 shadow-card sm:p-8">
        <header className="mb-7 flex items-start gap-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
            <KeyRound aria-hidden="true" className="size-5" />
          </span>
          <div>
            <h1 className="text-xl font-semibold text-slate-950" id="change-password-title">
              Change password
            </h1>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              Choose a strong password you haven’t used before.
            </p>
          </div>
        </header>
        <form
          className="space-y-5"
          noValidate
          onSubmit={handleSubmit((values) => mutation.mutate(values))}
        >
          <PasswordField
            autoComplete="current-password"
            autoFocus
            error={errors.oldPassword?.message}
            label="Current password"
            required
            {...register('oldPassword')}
          />
          <div>
            <PasswordField
              autoComplete="new-password"
              error={errors.newPassword?.message}
              label="New password"
              required
              {...register('newPassword')}
            />
            <PasswordStrength password={newPassword} />
          </div>
          <PasswordField
            autoComplete="new-password"
            error={errors.confirmPassword?.message}
            label="Confirm password"
            required
            {...register('confirmPassword')}
          />
          {errors.root && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
              {errors.root.message}
            </p>
          )}
          <Button
            className="w-full sm:w-auto"
            disabled={mutation.isPending}
            size="lg"
            type="submit"
          >
            {mutation.isPending ? (
              <Loader className="text-white" label="Updating..." size="sm" />
            ) : (
              'Update password'
            )}
          </Button>
        </form>
      </div>
    </section>
  );
}
