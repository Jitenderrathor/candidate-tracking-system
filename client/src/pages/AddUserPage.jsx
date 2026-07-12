import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Button } from '@/components/common';
import { ROUTES } from '@/constants/routes';
import { createUser } from '@/features/users/user.api';
import { UserForm } from '@/features/users/components/UserForm';

export function AddUserPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: createUser,
    onSuccess: async (response) => {
      await queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success(response.message);
      navigate(ROUTES.USERS, { replace: true });
    },
  });
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
          <h1 className="text-xl font-semibold text-slate-950">Add User</h1>
          <p className="mt-1 text-sm text-slate-500">Create a new application account.</p>
        </div>
      </header>
      <UserForm
        isSubmitting={mutation.isPending}
        onCancel={() => navigate(ROUTES.USERS)}
        onSubmit={(values) => mutation.mutate(values)}
      />
    </div>
  );
}
