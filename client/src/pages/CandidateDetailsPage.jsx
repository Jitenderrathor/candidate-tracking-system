import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ExternalLink, Pencil, RefreshCw, Trash2, Workflow } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Button, Card, EmptyState } from '@/components/common';
import { ROLES } from '@/constants/auth';
import { ROUTES } from '@/constants/routes';
import { getCandidate, getCandidateHistory } from '@/features/candidates/candidate.api';
import { CandidateDetailsSkeleton } from '@/features/candidates/components/CandidateDetailsSkeleton';
import { DeleteCandidateModal } from '@/features/candidates/components/DeleteCandidateModal';
import { DetailSection } from '@/features/candidates/components/DetailSection';
import { StatusTimeline } from '@/features/candidates/components/StatusTimeline';
import { StatusUpdateModal } from '@/features/candidates/components/StatusUpdateModal';
import { StatusBadge } from '@/features/public-dashboard/components/StatusBadge';
import { useAuth } from '@/hooks/useAuth';
import { EditCandidatePage } from '@/pages/EditCandidatePage';
import { formatExperience } from '@/utils/formatters';

const dateFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' });

export function CandidateDetailsPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const candidateQuery = useQuery({ queryKey: ['candidate', id], queryFn: () => getCandidate(id) });
  const historyQuery = useQuery({
    queryKey: ['candidate-history', id],
    queryFn: () => getCandidateHistory(id),
    enabled: candidateQuery.isSuccess,
  });

  if (candidateQuery.isPending) return <CandidateDetailsSkeleton />;
  if (candidateQuery.isError)
    return (
      <EmptyState
        action={
          <Button onClick={() => candidateQuery.refetch()}>
            <RefreshCw className="size-4" /> Try again
          </Button>
        }
        description={candidateQuery.error.message}
        title="Unable to load candidate"
      />
    );
  const candidate = candidateQuery.data;
  if (searchParams.get('mode') === 'edit') return <EditCandidatePage candidate={candidate} />;

  const fullName = candidate.fullName || `${candidate.firstName} ${candidate.lastName}`;
  const registrationDate = candidate.registrationDate || candidate.createdAt;
  const hasResume = Boolean(candidate.resumeUrl);
  const personalFields = [
    { label: 'Name', value: fullName },
    { label: 'Email', value: candidate.email },
    { label: 'Mobile Number', value: candidate.mobile },
    { label: 'Gender', value: candidate.gender },
  ];

  const professionalFields = [
    { label: 'Experience', value: formatExperience(candidate.experienceYears) },
    {
      label: 'LinkedIn Profile',
      value: candidate.linkedInProfile ? (
        <a
          className="inline-flex items-center gap-2 font-medium text-brand-700 hover:underline"
          href={candidate.linkedInProfile}
          rel="noopener noreferrer"
          target="_blank"
        >
          View LinkedIn <ExternalLink className="size-4" />
        </a>
      ) : null,
    },
  ];

  const recruitmentFields = [
    { label: 'Registration Date', value: dateFormatter.format(new Date(registrationDate)) },
    { label: 'Recruitment Source', value: candidate.source },
    {
      label: 'Current Status',
      value: <StatusBadge status={candidate.recruitmentStatus || candidate.status} />,
    },
  ];

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost">
        <Link to={ROUTES.CANDIDATES}>
          <ArrowLeft className="size-4" /> Back to Candidates
        </Link>
      </Button>
      <Card className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-brand-100 text-lg font-semibold text-brand-700">
            {candidate.firstName[0]}
            {candidate.lastName[0]}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-2xl font-semibold text-slate-950">{fullName}</h1>
              <StatusBadge status={candidate.recruitmentStatus || candidate.status} />
            </div>
            <p className="mt-1 text-sm text-slate-500">
              {candidate.candidateId} · {candidate.email}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setShowStatusModal(true)} variant="outline">
            <Workflow className="size-4" /> Update Status
          </Button>
          {user?.role === ROLES.ADMIN && (
            <>
              <Button asChild variant="outline">
                <Link to={`?mode=edit`}>
                  <Pencil className="size-4" /> Edit
                </Link>
              </Button>
              <Button onClick={() => setShowDeleteModal(true)} variant="danger">
                <Trash2 className="size-4" /> Delete
              </Button>
            </>
          )}
        </div>
      </Card>
      <div className="grid gap-6 lg:grid-cols-2">
        <DetailSection fields={personalFields} title="Personal Information" />
        <DetailSection fields={professionalFields} title="Professional Information" />
        <DetailSection fields={recruitmentFields} title="Recruitment Information" />
        <Card>
          <h2 className="font-semibold text-slate-950">Resume</h2>
          {candidate.resumeFileName || candidate.resumeFileType ? (
            <div className="mt-5 space-y-4">
              <dl className="grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Resume File Name
                  </dt>
                  <dd className="mt-1 break-words text-sm text-slate-800">
                    {candidate.resumeFileName || '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Resume File Type
                  </dt>
                  <dd className="mt-1 break-words text-sm text-slate-800">
                    {candidate.resumeFileType || '—'}
                  </dd>
                </div>
              </dl>
              {hasResume ? (
                <Button asChild variant="outline">
                  <a href={candidate.resumeUrl} rel="noopener noreferrer" target="_blank">
                    Open Resume <ExternalLink className="size-4" />
                  </a>
                </Button>
              ) : (
                <p className="text-sm text-slate-500">No Resume Available</p>
              )}
            </div>
          ) : hasResume ? (
            <div className="mt-5">
              <Button asChild variant="outline">
                <a href={candidate.resumeUrl} rel="noopener noreferrer" target="_blank">
                  Open Resume <ExternalLink className="size-4" />
                </a>
              </Button>
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-500">No Resume Available</p>
          )}
        </Card>
      </div>
      {historyQuery.isPending ? (
        <div className="h-64 animate-pulse rounded-xl bg-slate-200" />
      ) : historyQuery.isError ? (
        <EmptyState
          action={<Button onClick={() => historyQuery.refetch()}>Retry history</Button>}
          description={historyQuery.error.message}
          title="Unable to load status history"
        />
      ) : (
        <StatusTimeline history={historyQuery.data} />
      )}
      {showStatusModal && (
        <StatusUpdateModal
          candidate={candidate}
          isOpen
          onClose={() => setShowStatusModal(false)}
          role={user?.role}
        />
      )}
      {showDeleteModal && (
        <DeleteCandidateModal
          candidate={candidate}
          isOpen
          onClose={() => setShowDeleteModal(false)}
          onDeleted={() => navigate(ROUTES.CANDIDATES, { replace: true })}
        />
      )}
    </div>
  );
}
