import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { Button, Loader, Modal, Select } from '@/components/common';
import { ROLES } from '@/constants/auth';
import { updateCandidateStatus } from '@/features/candidates/candidate.api';
import { STATUS_ORDER, CANDIDATE_STATUSES } from '@/features/candidates/candidate.constants';
import { FormTextarea } from '@/features/candidates/components/FormTextarea';
import { hasPermission } from '@/utils/permissions';

const transitionsFor = (status, user) => {
  if (status === 'Rejected') return [];
  const currentOrder = STATUS_ORDER[status] || 0;
  
  const options = CANDIDATE_STATUSES
    .filter((s) => s !== 'Rejected' && s !== status && STATUS_ORDER[s] > currentOrder)
    .map((s) => ({ label: s, value: s }));
    
  if (hasPermission(user, 'candidates:update-backwards')) {
    CANDIDATE_STATUSES
      .filter((s) => s !== 'Rejected' && s !== status && STATUS_ORDER[s] < currentOrder)
      .forEach((s) => options.push({ label: `${s} (Rollback)`, value: s }));
  }
  
  options.push({ label: 'Rejected', value: 'Rejected' });
  return options;
};

export function StatusUpdateModal({ candidate, isOpen, onClose, user }) {
  const displayedStatus = candidate.recruitmentStatus || candidate.status;
  const options = displayedStatus === 'Rejected' ? [] : transitionsFor(candidate.status, user);
  const [status, setStatus] = useState(options[0]?.value || '');
  const [remarks, setRemarks] = useState('');
  const [error, setError] = useState('');
  const queryClient = useQueryClient();
  
  const currentOrder = STATUS_ORDER[candidate.status] || 0;
  const nextOrder = STATUS_ORDER[status] || 0;
  const isBackward = status !== 'Rejected' && nextOrder < currentOrder;
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
