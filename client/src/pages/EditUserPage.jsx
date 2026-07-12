import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Button, EmptyState } from '@/components/common';
import { ROUTES } from '@/constants/routes';
import { getUser, updateUser } from '@/features/users/user.api';
import { UserForm } from '@/features/users/components/UserForm';

export function EditUserPage({ userId }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ['user', userId],
    queryFn: () => getUser(userId),
    enabled: Boolean(userId),
  });
  const mutation = useMutation({
    mutationFn: (values) => updateUser({ id: userId, values }),
    onSuccess: async (response) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['users'] }),
        queryClient.invalidateQueries({ queryKey: ['user', userId] }),
      ]);
      toast.success(response.message);
      navigate(ROUTES.USERS, { replace: true });
    },
  });
  if (!userId)
    return (
      <EmptyState
        description="Return to the user list and choose an account to edit."
        title="User ID is missing"
      />
    );
  if (query.isPending)
    return <div className="mx-auto h-96 max-w-4xl animate-pulse rounded-xl bg-slate-200" />;
  if (query.isError)
    return (
      <EmptyState
        action={
          <Button onClick={() => query.refetch()}>
            <RefreshCw className="size-4" /> Try again
          </Button>
        }
        description={query.error.message}
        title="Unable to load user"
      />
    );
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="flex items-center gap-3">
        <Button
          aria-label="Back to users"
          onClick={() => navigate(ROUTES.USERS)}
          size="icon"
          variant="outline"
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <h1 className="text-xl font-semibold text-slate-950">Edit User</h1>
          <p className="mt-1 text-sm text-slate-500">Update account identity and access role.</p>
        </div>
      </header>
      <UserForm
        isEdit
        isSubmitting={mutation.isPending}
        onCancel={() => navigate(ROUTES.USERS)}
        onSubmit={(values) => mutation.mutate(values)}
        user={query.data}
      />
    </div>
  );
}
