import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Mail, Plus, Pencil, Trash2, Settings } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button, Card, EmptyState, Input, Modal, Table } from '@/components/common';
import { createEmailTemplate, deleteEmailTemplate, listEmailTemplates, updateEmailTemplate } from '@/features/email-templates/emailTemplate.api';

export function EmailTemplatesPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [deletingTemplate, setDeletingTemplate] = useState(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const query = useQuery({
    queryKey: ['email-templates'],
    queryFn: listEmailTemplates,
  });

  const createMutation = useMutation({
    mutationFn: createEmailTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
      handleCloseModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateEmailTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
      handleCloseModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteEmailTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
      setDeletingTemplate(null);
    },
  });

  const onSubmit = (data) => {
    if (editingTemplate) {
      updateMutation.mutate({ id: editingTemplate._id, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (template) => {
    setEditingTemplate(template);
    reset({ name: template.name, subject: template.subject, htmlBody: template.htmlBody });
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setEditingTemplate(null);
    reset({ name: '', subject: '', htmlBody: '' });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTemplate(null);
    reset();
  };

  const columns = [
    { key: 'name', header: 'Template Name', render: (t) => t.name },
    { key: 'subject', header: 'Subject', render: (t) => t.subject },
    { key: 'variables', header: 'Variables', render: (t) => t.variables.join(', ') || 'None' },
    {
      key: 'actions',
      header: 'Actions',
      render: (t) => (
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={() => handleEdit(t)}>
            <Pencil className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setDeletingTemplate(t)}>
            <Trash2 className="size-4 text-red-500" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-950">Email Templates</h1>
          <p className="mt-1 text-sm text-slate-500">Manage email templates used to communicate with candidates.</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="size-4 mr-2" /> Create Template
        </Button>
      </header>

      {query.isPending ? (
        <div className="h-64 animate-pulse rounded-xl bg-slate-200" />
      ) : query.isError ? (
        <EmptyState
          action={<Button onClick={() => query.refetch()}>Try again</Button>}
          description={query.error.message}
          title="Unable to load templates"
        />
          ) : (
            <Card className="p-0 overflow-hidden">
              <Table
                columns={columns}
                data={query.data}
                emptyMessage="No templates found. Create one to get started!"
                getRowKey={(t) => t._id}
              />
            </Card>
          )}

          {isModalOpen && (
            <Modal
              title={editingTemplate ? 'Edit Template' : 'Create Template'}
              isOpen={isModalOpen}
              onClose={handleCloseModal}
              size="lg"
            >
              <form id="template-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input
                  label="Template Name"
                  placeholder="e.g. Interview Invitation"
                  error={errors.name?.message}
                  {...register('name', { required: 'Name is required' })}
                />
                <Input
                  label="Subject"
                  placeholder="e.g. Interview Scheduled - Tech Corp"
                  error={errors.subject?.message}
                  {...register('subject', { required: 'Subject is required' })}
                />
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-slate-700">HTML Body</label>
                  <textarea
                    className="w-full min-h-[200px] rounded-md border border-slate-300 p-2 shadow-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 text-sm font-mono"
                    placeholder="<h1>Hi {{fullName}},</h1><p>You are selected!</p>"
                    {...register('htmlBody', { required: 'HTML body is required' })}
                  />
                  {errors.htmlBody && <p className="text-sm text-red-500">{errors.htmlBody.message}</p>}
                  <p className="text-xs text-slate-500 mt-1">
                    Use variables like <code>{`{{fullName}}`}</code>, <code>{`{{candidateId}}`}</code>, <code>{`{{email}}`}</code> to personalize emails.
                  </p>
                </div>
              </form>
              <div className="mt-6 flex justify-end gap-3">
                <Button variant="outline" onClick={handleCloseModal}>Cancel</Button>
                <Button type="submit" form="template-form" disabled={createMutation.isPending || updateMutation.isPending}>
                  {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save Template'}
                </Button>
              </div>
            </Modal>
          )}

          {deletingTemplate && (
            <Modal
              title="Delete Template"
              isOpen={!!deletingTemplate}
              onClose={() => setDeletingTemplate(null)}
              footer={
                <>
                  <Button variant="outline" onClick={() => setDeletingTemplate(null)}>Cancel</Button>
                  <Button variant="danger" onClick={() => deleteMutation.mutate(deletingTemplate._id)} disabled={deleteMutation.isPending}>
                    {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                  </Button>
                </>
              }
            >
              <p>Are you sure you want to delete the template <strong>{deletingTemplate.name}</strong>? This action cannot be undone.</p>
            </Modal>
          )}
    </div>
  );
}
