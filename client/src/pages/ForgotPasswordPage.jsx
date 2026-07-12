import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Button, Input, Loader } from '@/components/common';
import { ROUTES } from '@/constants/routes';
import { forgotPasswordRequest, resetPasswordRequest } from '@/features/auth/auth.api';
import { forgotPasswordSchema, resetPasswordSchema } from '@/features/auth/auth.schemas';
import { AuthCard } from '@/features/auth/components/AuthCard';

export function ForgotPasswordPage() {
  const [step, setStep] = useState(1);
  const navigate = useNavigate();

  const {
    formState: { errors: forgotErrors },
    handleSubmit: handleForgotSubmit,
    register: registerForgot,
  } = useForm({ resolver: zodResolver(forgotPasswordSchema) });

  const {
    formState: { errors: resetErrors },
    handleSubmit: handleResetSubmit,
    register: registerReset,
  } = useForm({ resolver: zodResolver(resetPasswordSchema) });

  const forgotMutation = useMutation({
    mutationFn: forgotPasswordRequest,
    onSuccess: () => setStep(2),
  });

  const resetMutation = useMutation({
    mutationFn: resetPasswordRequest,
    onSuccess: () => navigate(ROUTES.LOGIN, { state: { message: 'Password reset successfully. Please log in.' } }),
  });

  if (step === 2) {
    return (
      <AuthCard
        description="Enter the 6-digit OTP sent to your email along with your new password."
        title="Reset password"
      >
        <form
          className="space-y-5"
          noValidate
          onSubmit={handleResetSubmit((values) => resetMutation.mutate(values))}
        >
          <Input
            autoFocus
            error={resetErrors.token?.message}
            label="6-Digit OTP"
            placeholder="123456"
            required
            type="text"
            {...registerReset('token')}
          />
          <Input
            error={resetErrors.newPassword?.message}
            label="New Password"
            required
            type="password"
            {...registerReset('newPassword')}
          />
          <Input
            error={resetErrors.confirmPassword?.message}
            label="Confirm New Password"
            required
            type="password"
            {...registerReset('confirmPassword')}
          />
          {resetMutation.isError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
              {resetMutation.error.message}
            </p>
          )}
          <Button className="w-full" disabled={resetMutation.isPending} size="lg" type="submit">
            {resetMutation.isPending ? (
              <Loader className="text-white" label="Resetting..." size="sm" />
            ) : (
              'Reset Password'
            )}
          </Button>
          <button
            type="button"
            onClick={() => setStep(1)}
            className="w-full flex items-center justify-center gap-2 text-sm font-medium text-slate-600 hover:text-brand-700"
          >
            <ArrowLeft className="size-4" /> Back
          </button>
        </form>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      description="Enter your account email and we’ll send you a 6-digit OTP."
      title="Forgot password?"
    >
      <form
        className="space-y-5"
        noValidate
        onSubmit={handleForgotSubmit((values) => forgotMutation.mutate(values))}
      >
        <Input
          autoComplete="email"
          autoFocus
          error={forgotErrors.email?.message}
          label="Email"
          placeholder="you@company.com"
          required
          type="email"
          {...registerForgot('email')}
        />
        {forgotMutation.isError && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {forgotMutation.error.message}
          </p>
        )}
        <Button className="w-full" disabled={forgotMutation.isPending} size="lg" type="submit">
          {forgotMutation.isPending ? (
            <Loader className="text-white" label="Submitting..." size="sm" />
          ) : (
            'Send OTP'
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
