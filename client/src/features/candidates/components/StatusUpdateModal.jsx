import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { Button, Loader, Modal, Select } from '@/components/common';
import { ROLES } from '@/constants/auth';
import { updateCandidateStatus } from '@/features/candidates/candidate.api';
import { FORWARD_TRANSITIONS } from '@/features/candidates/candidate.constants';
import { FormTextarea } from '@/features/candidates/components/FormTextarea';

const transitionsFor = (status, role) => {
  const next = FORWARD_TRANSITIONS[status];
  if (next) return [{ label: next, value: next }];
  if (status === 'Selected' && role === ROLES.ADMIN)
    return [{ label: 'Under Consideration', value: 'Under Consideration' }];
  return [];
};

export function StatusUpdateModal({ candidate, isOpen, onClose, role }) {
  const displayedStatus = candidate.recruitmentStatus || candidate.status;
  const options = displayedStatus === 'Rejected' ? [] : transitionsFor(candidate.status, role);
  const [status, setStatus] = useState(options[0]?.value || '');
  const [remarks, setRemarks] = useState('');
  const [error, setError] = useState('');
  const queryClient = useQueryClient();
  const isBackward = candidate.status === 'Selected' && status === 'Under Consideration';
  const mutation = useMutation({
    mutationFn: () => updateCandidateStatus({ id: candidate.candidateId, status, remarks }),
    onSuccess: async (response) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['candidate', candidate.candidateId] }),
        queryClient.invalidateQueries({ queryKey: ['candidate-history', candidate.candidateId] }),
        queryClient.invalidateQueries({ queryKey: ['candidates'] }),
      ]);
      toast.success(response.message);
      onClose();
    },
  });
  const submit = () => {
    if (!status) return setError('Select a status');
    if (isBackward && !remarks.trim())
      return setError('Remarks are required when moving backwards');
    setError('');
    mutation.mutate();
  };
  return (
    <Modal
      className="max-w-xl"
      description={`Current status: ${displayedStatus}. Confirm the permitted transition below.`}
      footer={
        <>
          <Button disabled={mutation.isPending} onClick={onClose} variant="outline">
            Cancel
          </Button>
          <Button disabled={mutation.isPending || !options.length} onClick={submit}>
            {mutation.isPending ? (
              <Loader className="text-white" label="Updating..." size="sm" />
            ) : (
              'Confirm status update'
            )}
          </Button>
        </>
      }
      isOpen={isOpen}
      onClose={onClose}
      title="Update Candidate Status"
    >
      <div className="space-y-4">
        <Select
          error={error && !status ? error : undefined}
          label="New Status"
          onChange={(event) => setStatus(event.target.value)}
          options={options}
          required
          value={status}
        />
        <FormTextarea
          error={error && isBackward ? error : undefined}
          label="Remarks"
          onChange={(event) => setRemarks(event.target.value)}
          required={isBackward}
          value={remarks}
        />
        {!options.length && (
          <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
            No further transitions are available for your role.
          </p>
        )}
      </div>
    </Modal>
  );
}
