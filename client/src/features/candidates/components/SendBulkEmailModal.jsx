import { useQuery, useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { Button, Modal, Select, Input } from '@/components/common';
import { listEmailTemplates, sendBulkEmail } from '@/features/email-templates/emailTemplate.api';
import { CANDIDATE_STATUSES } from '@/features/candidates/candidate.constants';

export function SendBulkEmailModal({ isOpen, onClose, candidateIds, onSuccess }) {
  const [targetType, setTargetType] = useState(candidateIds && candidateIds.length > 0 ? 'selected' : 'status');
  const [selectedStatuses, setSelectedStatuses] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [cc, setCc] = useState('');
  const [bcc, setBcc] = useState('');

  const query = useQuery({
    queryKey: ['email-templates'],
    queryFn: listEmailTemplates,
    enabled: isOpen,
  });

  const sendMutation = useMutation({
    mutationFn: sendBulkEmail,
    onSuccess: (data) => {
      toast.success(data.message || 'Emails are being sent');
      onSuccess?.();
      onClose();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to send emails');
    }
  });

  const handleSend = () => {
    if (!selectedTemplateId) return;
    if (targetType === 'status' && selectedStatuses.length === 0) return;
    
    sendMutation.mutate({ 
      candidateIds: targetType === 'selected' ? candidateIds : undefined, 
      statuses: targetType === 'status' ? selectedStatuses : undefined,
      templateId: selectedTemplateId, 
      cc, 
      bcc 
    });
  };

  const toggleStatus = (status) => {
    setSelectedStatuses(prev => 
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    );
  };

  const options = query.data
    ? query.data.map((t) => ({ label: t.name, value: t._id }))
    : [];

  const hasSelectedCandidates = candidateIds && candidateIds.length > 0;

  return (
    <Modal
      title="Send Bulk Email"
      isOpen={isOpen}
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button 
            disabled={
              !selectedTemplateId || 
              sendMutation.isPending || 
              (targetType === 'selected' && !hasSelectedCandidates) ||
              (targetType === 'status' && selectedStatuses.length === 0)
            }
            onClick={handleSend}
          >
            {sendMutation.isPending ? 'Sending...' : 'Send Email'}
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Target Group</label>
          <div className="flex gap-4">
            <label className={`flex items-center gap-2 ${!hasSelectedCandidates ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
              <input 
                type="radio" 
                name="targetType" 
                value="selected" 
                checked={targetType === 'selected'} 
                onChange={() => hasSelectedCandidates && setTargetType('selected')}
                disabled={!hasSelectedCandidates}
                className="text-brand-600 focus:ring-brand-500"
              />
              <span className="text-sm">Selected Candidates ({candidateIds?.length || 0})</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="radio" 
                name="targetType" 
                value="status" 
                checked={targetType === 'status'} 
                onChange={() => setTargetType('status')}
                className="text-brand-600 focus:ring-brand-500"
              />
              <span className="text-sm">All Candidates by Status</span>
            </label>
          </div>
        </div>

        {targetType === 'status' && (
          <div className="space-y-2 rounded-lg bg-slate-50 p-4 border border-slate-200">
            <label className="block text-sm font-medium text-slate-700">Select Statuses</label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {CANDIDATE_STATUSES.map((status) => (
                <label key={status} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedStatuses.includes(status)}
                    onChange={() => toggleStatus(status)}
                    className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                  />
                  <span className="text-sm text-slate-700">{status}</span>
                </label>
              ))}
            </div>
            {selectedStatuses.length === 0 && (
              <p className="text-xs text-amber-600 mt-2">Please select at least one status.</p>
            )}
          </div>
        )}
        
        {query.isLoading ? (
          <div className="h-10 animate-pulse rounded bg-slate-200" />
        ) : query.isError ? (
          <p className="text-sm text-red-500">Failed to load templates.</p>
        ) : options.length === 0 ? (
          <p className="text-sm text-amber-600">No email templates found. Please create one first.</p>
        ) : (
          <Select
            label="Email Template"
            value={selectedTemplateId}
            onChange={(e) => setSelectedTemplateId(e.target.value)}
            options={[
              { label: 'Select a template...', value: '' },
              ...options
            ]}
          />
        )}
        <Input
          label="CC (Optional)"
          placeholder="comma separated emails"
          value={cc}
          onChange={(e) => setCc(e.target.value)}
        />
        <Input
          label="BCC (Optional)"
          placeholder="comma separated emails"
          value={bcc}
          onChange={(e) => setBcc(e.target.value)}
        />
      </div>
    </Modal>
  );
}
