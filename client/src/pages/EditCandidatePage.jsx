import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Button } from '@/components/common';
import { updateCandidate } from '@/features/candidates/candidate.api';
import { CandidateForm } from '@/features/candidates/components/CandidateForm';

export function EditCandidatePage({ candidate }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const detailPath = `/candidates/${candidate.candidateId}`;
  const mutation = useMutation({
    mutationFn: (values) => updateCandidate({ id: candidate.candidateId, values }),
    onSuccess: async (response) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['candidate', candidate.candidateId] }),
        queryClient.invalidateQueries({ queryKey: ['candidates'] }),
      ]);
      toast.success(response.message);
      navigate(detailPath, { replace: true });
    },
  });
  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3">
        <Button
          aria-label="Back to candidate"
          onClick={() => navigate(detailPath)}
          size="icon"
          variant="outline"
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <h1 className="text-xl font-semibold text-slate-950">Edit Candidate</h1>
          <p className="mt-1 text-sm text-slate-500">
            Update candidate information. Status is managed separately.
          </p>
        </div>
      </header>
      <CandidateForm
        candidate={candidate}
        isSubmitting={mutation.isPending}
        onCancel={() => navigate(detailPath)}
        onSubmit={(values) => mutation.mutate(values)}
        submitLabel="Save Changes"
      />
    </div>
  );
}
