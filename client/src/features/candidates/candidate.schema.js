import { z } from 'zod';
import { CANDIDATE_SOURCES, GENDERS } from '@/features/candidates/candidate.constants';

const optionalNumber = z.union([
  z.literal(''),
  z.coerce.number().min(0, 'Value cannot be negative'),
]);

export const candidateSchema = z.object({
  fullName: z.string().trim().min(1, 'Full name is required').max(200),
  gender: z.enum(GENDERS, { errorMap: () => ({ message: 'Select a gender' }) }),
  email: z.string().trim().min(1, 'Email is required').email('Enter a valid email address'),
  mobile: z
    .string()
    .trim()
    .refine((val) => val === '' || /^\+?[0-9]{7,15}$/.test(val), {
      message: 'Enter a valid mobile number',
    })
    .optional(),
  experienceYears: z.coerce.number().min(0, 'Experience cannot be negative').max(80),
  resumeUrl: z.union([z.literal(''), z.string().url('Enter a valid resume URL')]),
  linkedInProfile: z.union([z.literal(''), z.string().url('Enter a valid LinkedIn URL')]),
  source: z.string().trim().min(1, 'Source is required'),
  remarks: z.string().trim().max(2000).optional(),
});

export const candidateDefaults = {
  fullName: '',
  gender: '',
  email: '',
  mobile: '',
  experienceYears: 0,
  resumeUrl: '',
  linkedInProfile: '',
  source: '',
  remarks: '',
};

export const candidateToFormValues = (candidate) => ({
  ...candidateDefaults,
  ...candidate,
});

export const formValuesToCandidate = (values) => ({
  fullName: values.fullName,
  gender: values.gender,
  email: values.email,
  mobile: values.mobile || '',
  experienceYears: Number(values.experienceYears),
  resumeUrl: values.resumeUrl || '',
  linkedInProfile: values.linkedInProfile || '',
  source: values.source,
  remarks: values.remarks || '',
});
