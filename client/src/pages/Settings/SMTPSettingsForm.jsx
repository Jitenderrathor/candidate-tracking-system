import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect } from 'react';

import { Button, Card, Input, Loader } from '@/components/common';
import { getSettings, updateSettings } from '@/features/settings/settings.api';

const smtpSettingsSchema = z.object({
  smtpHost: z.string().trim().min(1, 'SMTP Host is required'),
  smtpPort: z.coerce.number().min(1).max(65535),
  smtpUser: z.string().trim().min(1, 'SMTP User is required'),
  smtpPass: z.string().optional(),
});

export function SMTPSettingsForm() {
  const queryClient = useQueryClient();
  const settingsQuery = useQuery({ queryKey: ['settings'], queryFn: getSettings });
  
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = useForm({
    resolver: zodResolver(smtpSettingsSchema),
    defaultValues: {
      smtpHost: '',
      smtpPort: 587,
      smtpUser: '',
      smtpPass: '',
    },
  });

  useEffect(() => {
    if (settingsQuery.data) {
      reset({
        smtpHost: settingsQuery.data.smtpHost || '',
        smtpPort: settingsQuery.data.smtpPort || 587,
        smtpUser: settingsQuery.data.smtpUser || '',
        smtpPass: '', // Always empty, handled via hasSmtpPass placeholder visually
      });
    }
  }, [settingsQuery.data, reset]);

  const mutation = useMutation({
    mutationFn: updateSettings,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success(response.message || 'SMTP settings updated successfully');
      reset({ ...response.data, smtpPass: '' });
    },
    onError: () => {
      toast.error('Failed to update SMTP settings');
    }
  });

  const onSubmit = (values) => {
    mutation.mutate(values);
  };

  if (settingsQuery.isPending) {
    return <Loader className="mx-auto mt-12 text-brand-600" size="lg" />;
  }

  return (
    <div className="space-y-10">
      <div className="space-y-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
          <div className="space-y-4">
            <h2 className="text-lg font-medium text-slate-900">SMTP Server Configuration</h2>
            <p className="text-sm text-slate-500">
              Configure the actual mail server credentials used to dispatch emails.
            </p>
            
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                error={errors.smtpUser?.message}
                label="SMTP Username (Email) *"
                placeholder="e.g. you@gmail.com"
                required
                {...register('smtpUser')}
              />
              <Input
                error={errors.smtpPass?.message}
                label="App Password"
                placeholder={settingsQuery.data?.hasSmtpPass ? '•••••••• (Leave blank to keep)' : 'Enter App Password'}
                type="password"
                {...register('smtpPass')}
              />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button disabled={mutation.isPending} type="submit">
              {mutation.isPending ? <Loader className="text-white" label="Saving..." size="sm" /> : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>

      <div className="h-px bg-slate-200" />

      {/* History Section */}
      <div className="space-y-6">
        <div className="space-y-4">
          <h2 className="text-lg font-medium text-slate-900">Configuration History</h2>
          <p className="text-sm text-slate-500">Log of when SMTP credentials were updated.</p>
          
          {!settingsQuery.data?.history || settingsQuery.data.history.length === 0 ? (
            <div className="py-8 text-center text-slate-500 bg-slate-50 rounded-lg border border-dashed border-slate-300">
              No configuration history available yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="pb-3 font-medium text-slate-900">Date</th>
                    <th className="pb-3 font-medium text-slate-900">Action</th>
                    <th className="pb-3 font-medium text-slate-900">SMTP User</th>
                    <th className="pb-3 font-medium text-slate-900">Updated By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {settingsQuery.data.history.map((record, i) => (
                    <tr key={i}>
                      <td className="py-3 text-slate-600">
                        {new Date(record.updatedAt).toLocaleString()}
                      </td>
                      <td className="py-3 text-slate-600">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          {record.action}
                        </span>
                      </td>
                      <td className="py-3 text-slate-600">{record.smtpUser}</td>
                      <td className="py-3 text-slate-600">{record.updatedBy?.name || 'Unknown'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
