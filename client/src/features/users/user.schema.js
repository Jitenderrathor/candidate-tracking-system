import { z } from 'zod';
import { DEFAULT_ROLE_PERMISSIONS } from '@/constants/permissions';

const profileSchema = z.object({
  fullName: z.string().trim().min(1, 'Full name is required').max(100),
  email: z.string().trim().min(1, 'Email is required').email('Enter a valid email address'),
  role: z.enum(['Super Admin', 'Admin', 'User'], { errorMap: () => ({ message: 'Select a role' }) }),
  permissions: z.array(z.string()).optional(),
});

const strongPassword = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72)
  .regex(/[a-z]/, 'Include a lowercase letter')
  .regex(/[A-Z]/, 'Include an uppercase letter')
  .regex(/\d/, 'Include a number')
  .regex(/[^A-Za-z0-9]/, 'Include a special character');

export const addUserSchema = profileSchema
  .extend({
    password: strongPassword,
    confirmPassword: z.string().min(1, 'Confirm the password'),
  })
  .refine(({ confirmPassword, password }) => confirmPassword === password, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const editUserSchema = profileSchema;

export const userDefaults = {
  fullName: '',
  email: '',
  role: 'User',
  password: '',
  confirmPassword: '',
  permissions: DEFAULT_ROLE_PERMISSIONS['User'],
};
