import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button, Modal } from '@/components/common';
import { deleteUser } from '../user.api';

export function UserDeleteModal({ isOpen, onClose, user }) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: () => deleteUser(user._id || user.id),
    onSuccess: () => {
      toast.success('User deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      onClose();
    },
    onError: (error) => {
      toast.error(error?.response?.data?.error?.message || 'Failed to delete user');
    },
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete User"
    >
      <div className="space-y-6">
        <div className="flex items-start gap-4 p-4 text-red-700 bg-red-50 border border-red-100 rounded-lg">
          <AlertTriangle className="size-5 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-red-800">Warning: Destructive Action</p>
            <p className="mt-1">
              Are you sure you want to delete <strong>{user?.fullName || user?.name}</strong>? 
              This action cannot be undone. All data associated with this user will be permanently removed.
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <Button disabled={mutation.isPending} onClick={onClose} variant="outline">
            Cancel
          </Button>
          <Button
            className="bg-red-600 hover:bg-red-700 text-white"
            isLoading={mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            Yes, delete user
          </Button>
        </div>
      </div>
    </Modal>
  );
}
