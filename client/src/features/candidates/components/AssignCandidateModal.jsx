import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { Button, Modal, Select } from '@/components/common';
import { bulkAssignCandidates } from '../candidate.api';
import { listUsers } from '@/features/users/user.api';

export function AssignCandidateModal({ isOpen, onClose, candidateIds, onSuccess }) {
  const queryClient = useQueryClient();
  const [selectedUserId, setSelectedUserId] = useState('');

  const usersQuery = useQuery({
    queryKey: ['users', { limit: 500 }],
    queryFn: () => listUsers({ limit: 500 }),
    enabled: isOpen,
  });

  const assignMutation = useMutation({
    mutationFn: (assignedTo) => bulkAssignCandidates({ candidateIds, assignedTo }),
    onSuccess: (data) => {
      toast.success(data.message || 'Candidates assigned successfully');
      queryClient.invalidateQueries({ queryKey: ['candidates'] });
      onSuccess?.();
      onClose();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to assign candidates');
    },
  });

  const handleAssign = () => {
    if (!selectedUserId) {
      toast.error('Please select a user to assign');
      return;
    }
    assignMutation.mutate(selectedUserId);
  };

  const userOptions = usersQuery.data?.users?.map((user) => ({
    label: user.fullName || user.name,
    value: user._id,
  })) || [];

  return (
    <Modal
      title={`Assign ${candidateIds.length} Candidate${candidateIds.length === 1 ? '' : 's'}`}
      isOpen={isOpen}
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={assignMutation.isPending || !selectedUserId}
            onClick={handleAssign}
          >
            {assignMutation.isPending ? 'Assigning...' : 'Assign'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-slate-600 text-sm">
          Select a user to assign these candidates to. The assigned user will be able to view and manage these candidates.
        </p>
        
        {usersQuery.isLoading ? (
          <p className="text-sm text-slate-500 animate-pulse">Loading users...</p>
        ) : usersQuery.isError ? (
          <p className="text-sm text-red-500">Failed to load users.</p>
        ) : (
          <Select
            label="Assign To"
            options={[{ label: 'Select a user...', value: '' }, ...userOptions]}
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            required
          />
        )}
      </div>
    </Modal>
  );
}
