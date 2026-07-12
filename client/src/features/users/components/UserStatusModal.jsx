import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Button, Loader, Modal } from '@/components/common';
import { setUserActive } from '@/features/users/user.api';

export function UserStatusModal({ isOpen, onClose, user }) {
  const queryClient = useQueryClient();
  const nextActive = !user.isActive;
  const action = nextActive ? 'activate' : 'deactivate';
  const mutation = useMutation({
    mutationFn: () => setUserActive({ id: user._id, isActive: nextActive }),
    onSuccess: async (response) => {
      await queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success(response.message);
      onClose();
    },
  });
  return (
    <Modal
      description={`${user.fullName || user.name} will ${nextActive ? 'regain access to' : 'lose access to'} the application.`}
      footer={
        <>
          <Button disabled={mutation.isPending} onClick={onClose} variant="outline">
            Cancel
          </Button>
          <Button
            disabled={mutation.isPending}
            onClick={() => mutation.mutate()}
            variant={nextActive ? 'primary' : 'danger'}
          >
            {mutation.isPending ? (
              <Loader
                className="text-white"
                label={`${nextActive ? 'Activating' : 'Deactivating'}...`}
                size="sm"
              />
            ) : (
              `${nextActive ? 'Activate' : 'Deactivate'} User`
            )}
          </Button>
        </>
      }
      isOpen={isOpen}
      onClose={onClose}
      title={`${nextActive ? 'Activate' : 'Deactivate'} user?`}
    >
      <p className="text-sm text-slate-600">
        Confirm that you want to {action} <strong>{user.email}</strong>.
      </p>
    </Modal>
  );
}
