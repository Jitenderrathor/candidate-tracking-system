import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Button } from '@/components/common';
import { ROUTES } from '@/constants/routes';
import { createCandidate } from '@/features/candidates/candidate.api';
import { CandidateForm } from '@/features/candidates/components/CandidateForm';

export function AddCandidatePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: createCandidate,
    onSuccess: async (response) => {
      await queryClient.invalidateQueries({ queryKey: ['candidates'] });
      toast.success(response.message);
      navigate(ROUTES.CANDIDATE_DETAILS.replace(':id', response.data.candidate.candidateId));
    },
  });
  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3">
        <Button
          aria-label="Back to candidates"
          onClick={() => navigate(ROUTES.CANDIDATES)}
          size="icon"
          variant="outline"
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <h1 className="text-xl font-semibold text-slate-950">Add Candidate</h1>
          <p className="mt-1 text-sm text-slate-500">Create a complete candidate record.</p>
        </div>
      </header>
      <CandidateForm
        isSubmitting={mutation.isPending}
        onCancel={() => navigate(ROUTES.CANDIDATES)}
        onSubmit={(values) => mutation.mutate(values)}
        submitLabel="Create Candidate"
      />
    </div>
  );
}
