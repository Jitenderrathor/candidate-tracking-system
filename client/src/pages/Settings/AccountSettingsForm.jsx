import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect } from 'react';

import { Button, Card, Input, Loader } from '@/components/common';
import { apiClient } from '@/api/client';

const getProfile = async () => {
  const { data } = await apiClient.get('/auth/profile');
  return data.data.user;
};

const updateProfile = async (values) => {
  const { data } = await apiClient.put('/auth/profile', values);
  return data;
};

const changePassword = async (values) => {
  const { data } = await apiClient.post('/auth/change-password', values);
  return data;
};

const profileSchema = z.object({
  name: z.string().trim().min(2, 'Name is required').max(100),
});

const passwordSchema = z.object({
  oldPassword: z.string().min(1, 'Old password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

export function AccountSettingsForm() {
  const queryClient = useQueryClient();
  const profileQuery = useQuery({ queryKey: ['profile'], queryFn: getProfile });

  const profileForm = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: '' },
  });

  const passwordForm = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: { oldPassword: '', newPassword: '' },
  });

  useEffect(() => {
    if (profileQuery.data) {
      profileForm.reset({ name: profileQuery.data.name || '' });
    }
  }, [profileQuery.data, profileForm]);

  const profileMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success(response.message || 'Profile updated successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update profile');
    }
  });

  const passwordMutation = useMutation({
    mutationFn: changePassword,
    onSuccess: (response) => {
      toast.success(response.message || 'Password changed successfully');
      passwordForm.reset();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to change password');
    }
  });

  if (profileQuery.isPending) return <Loader className="mx-auto mt-12 text-brand-600" size="lg" />;

  return (
    <div className="space-y-10">
      <div className="space-y-6">
        <form onSubmit={profileForm.handleSubmit((values) => profileMutation.mutate(values))} className="space-y-6" noValidate>
          <div className="space-y-4">
            <h2 className="text-lg font-medium text-slate-900">Profile Information</h2>
            <p className="text-sm text-slate-500">Update your account's profile information.</p>
            
            <div className="max-w-md">
              <Input
                error={profileForm.formState.errors.name?.message}
                label="Full Name"
                placeholder="e.g. John Doe"
                required
                {...profileForm.register('name')}
              />
            </div>
          </div>
          
          <div className="flex justify-start">
            <Button disabled={profileMutation.isPending} type="submit">
              {profileMutation.isPending ? 'Saving...' : 'Save Profile'}
            </Button>
          </div>
        </form>
      </div>

      <div className="h-px bg-slate-200" />

      <div className="space-y-6">
        <form onSubmit={passwordForm.handleSubmit((values) => passwordMutation.mutate(values))} className="space-y-6" noValidate>
          <div className="space-y-4">
            <h2 className="text-lg font-medium text-slate-900">Change Password</h2>
            <p className="text-sm text-slate-500">Ensure your account is using a long, random password to stay secure.</p>
            
            <div className="max-w-md space-y-4">
              <Input
                error={passwordForm.formState.errors.oldPassword?.message}
                label="Current Password"
                type="password"
                required
                {...passwordForm.register('oldPassword')}
              />
              <Input
                error={passwordForm.formState.errors.newPassword?.message}
                label="New Password"
                type="password"
                required
                {...passwordForm.register('newPassword')}
              />
            </div>
          </div>
          
          <div className="flex justify-start">
            <Button disabled={passwordMutation.isPending} type="submit">
              {passwordMutation.isPending ? 'Saving...' : 'Change Password'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
