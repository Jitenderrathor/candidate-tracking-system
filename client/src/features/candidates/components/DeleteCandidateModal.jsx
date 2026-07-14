import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Button, Loader, Modal } from '@/components/common';
import { deleteCandidate } from '@/features/candidates/candidate.api';

export function DeleteCandidateModal({ candidate, isOpen, onClose, onDeleted }) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: () => deleteCandidate(candidate.candidateId),
    onSuccess: async (response) => {
      await queryClient.invalidateQueries({ queryKey: ['candidates'] });
      toast.success(response.message);
      onClose();
      onDeleted?.();
    },
  });
  return (
    <Modal
      description="This candidate will be removed from active records. This action uses the system's soft-delete workflow."
      footer={
        <>
          <Button disabled={mutation.isPending} onClick={onClose} variant="outline">
            Cancel
          </Button>
          <Button disabled={mutation.isPending} onClick={() => mutation.mutate()} variant="danger">
            {mutation.isPending ? (
              <Loader className="text-white" label="Deleting..." size="sm" />
            ) : (
              'Delete candidate'
            )}
          </Button>
        </>
      }
      isOpen={isOpen}
      onClose={onClose}
      title={`Delete ${candidate?.fullName || 'candidate'}?`}
    >
      <p className="text-sm text-slate-600">
        Candidate <strong>{candidate?.candidateId}</strong> will no longer appear in candidate
        lists.
      </p>
    </Modal>
  );
}
