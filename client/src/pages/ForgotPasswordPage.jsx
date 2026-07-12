import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { ArrowLeft, MailCheck } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { Button, Input, Loader } from '@/components/common';
import { ROUTES } from '@/constants/routes';
import { forgotPasswordRequest } from '@/features/auth/auth.api';
import { forgotPasswordSchema } from '@/features/auth/auth.schemas';
import { AuthCard } from '@/features/auth/components/AuthCard';

export function ForgotPasswordPage() {
  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm({ resolver: zodResolver(forgotPasswordSchema) });
  const mutation = useMutation({ mutationFn: forgotPasswordRequest });

  if (mutation.isSuccess) {
    return (
      <AuthCard
        description="If an active account matches that address, password reset instructions have been initiated."
        title="Check your email"
      >
        <div className="rounded-xl bg-emerald-50 p-5 text-center">
          <MailCheck aria-hidden="true" className="mx-auto size-9 text-emerald-600" />
          <p className="mt-3 text-sm text-emerald-800" role="status">
            {mutation.data.message}
          </p>
        </div>
        <Link
          className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-brand-700 hover:underline"
          to={ROUTES.LOGIN}
        >
          <ArrowLeft className="size-4" /> Back to sign in
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      description="Enter your account email and we’ll start the password reset process."
      title="Forgot password?"
    >
      <form
        className="space-y-5"
        noValidate
        onSubmit={handleSubmit((values) => mutation.mutate(values))}
      >
        <Input
          autoComplete="email"
          autoFocus
          error={errors.email?.message}
          label="Email"
          placeholder="you@company.com"
          required
          type="email"
          {...register('email')}
        />
        {mutation.isError && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {mutation.error.message}
          </p>
        )}
        <Button className="w-full" disabled={mutation.isPending} size="lg" type="submit">
          {mutation.isPending ? (
            <Loader className="text-white" label="Submitting..." size="sm" />
          ) : (
            'Send reset instructions'
          )}
        </Button>
        <Link
          className="flex items-center justify-center gap-2 text-sm font-medium text-slate-600 hover:text-brand-700"
          to={ROUTES.LOGIN}
        >
          <ArrowLeft className="size-4" /> Back to sign in
        </Link>
      </form>
    </AuthCard>
  );
}
