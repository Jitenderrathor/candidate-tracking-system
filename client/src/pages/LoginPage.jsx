import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { LogIn } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Input, Loader } from '@/components/common';
import { ROUTES } from '@/constants/routes';
import { loginRequest } from '@/features/auth/auth.api';
import { loginSchema } from '@/features/auth/auth.schemas';
import { AuthCard } from '@/features/auth/components/AuthCard';
import { PasswordField } from '@/features/auth/components/PasswordField';
import { useAuth } from '@/hooks/useAuth';

const REMEMBERED_EMAIL_KEY = 'crts_remembered_email';

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const rememberedEmail = localStorage.getItem(REMEMBERED_EMAIL_KEY) || '';
  const {
    formState: { errors },
    handleSubmit,
    register,
    setError,
  } = useForm({
    defaultValues: { email: rememberedEmail, password: '', rememberMe: Boolean(rememberedEmail) },
    resolver: zodResolver(loginSchema),
  });

  const mutation = useMutation({
    mutationFn: ({ email, password }) => loginRequest({ email, password }),
    onSuccess: (response, values) => {
      if (values.rememberMe) localStorage.setItem(REMEMBERED_EMAIL_KEY, values.email);
      else localStorage.removeItem(REMEMBERED_EMAIL_KEY);
      login(response.data.token);
      navigate(ROUTES.DASHBOARD, { replace: true });
    },
    onError: (error) => setError('root', { message: error.message }),
  });

  return (
    <AuthCard
      description="Sign in with your organization account to continue."
      title="Welcome back"
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
        <PasswordField
          autoComplete="current-password"
          error={errors.password?.message}
          label="Password"
          required
          {...register('password')}
        />
        <div className="flex items-center justify-between gap-4">
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-slate-600">
            <input
              className="size-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              type="checkbox"
              {...register('rememberMe')}
            />
            Remember me
          </label>
          <Link
            className="text-sm font-medium text-brand-700 hover:text-brand-800 hover:underline"
            to={ROUTES.FORGOT_PASSWORD}
          >
            Forgot password?
          </Link>
        </div>
        {errors.root && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {errors.root.message}
          </p>
        )}
        <Button className="w-full" disabled={mutation.isPending} size="lg" type="submit">
          {mutation.isPending ? (
            <Loader className="text-white" label="Signing in..." size="sm" />
          ) : (
            <>
              <LogIn aria-hidden="true" className="size-4" /> Sign in
            </>
          )}
        </Button>
      </form>
    </AuthCard>
  );
}
