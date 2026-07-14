import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect } from 'react';

import { Button, Card, Input, Loader } from '@/components/common';
import { getSettings, updateSettings } from '@/features/settings/settings.api';

const emailSettingsSchema = z.object({
  smtpFromName: z.string().trim().min(1, 'Sender Name is required').max(100),
  defaultCc: z.string().trim().optional(),
  defaultBcc: z.string().trim().optional(),
});

export function EmailSettingsForm() {
  const queryClient = useQueryClient();
  const settingsQuery = useQuery({ queryKey: ['settings'], queryFn: getSettings });
  
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = useForm({
    resolver: zodResolver(emailSettingsSchema),
    defaultValues: {
      smtpFromName: '',
      defaultCc: '',
      defaultBcc: '',
    },
  });

  useEffect(() => {
    if (settingsQuery.data) {
      reset({
        smtpFromName: settingsQuery.data.smtpFromName || '',
        defaultCc: settingsQuery.data.defaultCc || '',
        defaultBcc: settingsQuery.data.defaultBcc || '',
      });
    }
  }, [settingsQuery.data, reset]);

  const mutation = useMutation({
    mutationFn: updateSettings,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success(response.message || 'Email settings updated successfully');
    },
    onError: () => {
      toast.error('Failed to update email settings');
    }
  });

  const onSubmit = (values) => {
    mutation.mutate(values);
  };

  if (settingsQuery.isPending) {
    return <Loader className="mx-auto mt-12 text-brand-600" size="lg" />;
  }

  return (
    <div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
        <div className="space-y-4">
          <h2 className="text-lg font-medium text-slate-900">Email Configuration</h2>
          <p className="text-sm text-slate-500">
            Customize the "From" name and email address used when sending out bulk emails or system notifications.
          </p>
          
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              error={errors.smtpFromName?.message}
              label="Sender Name"
              placeholder="e.g. HR Team"
              required
              {...register('smtpFromName')}
            />
          </div>
        </div>
        
        <div className="space-y-4 pt-4 border-t border-slate-200">
          <h2 className="text-lg font-medium text-slate-900">Default Recipients</h2>
          <p className="text-sm text-slate-500">
            Automatically CC or BCC these addresses when sending bulk emails.
          </p>
          
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              error={errors.defaultCc?.message}
              label="Default CC"
              placeholder="e.g. manager@company.com"
              {...register('defaultCc')}
            />
            <Input
              error={errors.defaultBcc?.message}
              label="Default BCC"
              placeholder="e.g. archive@company.com"
              {...register('defaultBcc')}
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
  );
}
