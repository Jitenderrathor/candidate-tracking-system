import { z } from 'zod';
import { CANDIDATE_SOURCES, GENDERS } from '@/features/candidates/candidate.constants';

const optionalNumber = z.union([
  z.literal(''),
  z.coerce.number().min(0, 'Value cannot be negative'),
]);

export const candidateSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required').max(100),
  lastName: z.string().trim().min(1, 'Last name is required').max(100),
  gender: z.enum(GENDERS, { errorMap: () => ({ message: 'Select a gender' }) }),
  dateOfBirth: z
    .string()
    .min(1, 'Date of birth is required')
    .refine((value) => new Date(value) < new Date(), 'Date of birth must be in the past'),
  email: z.string().trim().min(1, 'Email is required').email('Enter a valid email address'),
  mobile: z
    .string()
    .trim()
    .regex(/^\+?[1-9]\d{6,14}$/, 'Enter a valid mobile number'),
  address: z.string().trim().min(1, 'Address is required').max(500),
  qualification: z.string().trim().min(1, 'Qualification is required').max(200),
  experienceYears: z.coerce.number().min(0, 'Experience cannot be negative').max(80),
  currentCompany: z.string().trim().max(200).optional(),
  currentCTC: optionalNumber,
  expectedCTC: optionalNumber,
  skills: z
    .string()
    .trim()
    .min(1, 'Add at least one skill')
    .refine(
      (value) => value.split(',').filter((skill) => skill.trim()).length <= 100,
      'A maximum of 100 skills is allowed',
    ),
  resumeUrl: z.union([z.literal(''), z.string().url('Enter a valid resume URL')]),
  source: z.enum(CANDIDATE_SOURCES, { errorMap: () => ({ message: 'Select a source' }) }),
  remarks: z.string().trim().max(2000).optional(),
});

export const candidateDefaults = {
  firstName: '',
  lastName: '',
  gender: '',
  dateOfBirth: '',
  email: '',
  mobile: '',
  address: '',
  qualification: '',
  experienceYears: 0,
  currentCompany: '',
  currentCTC: '',
  expectedCTC: '',
  skills: '',
  resumeUrl: '',
  source: '',
  remarks: '',
};

export const candidateToFormValues = (candidate) => ({
  ...candidateDefaults,
  ...candidate,
  dateOfBirth: candidate?.dateOfBirth?.slice(0, 10) || '',
  skills: candidate?.skills?.join(', ') || '',
  currentCTC: candidate?.currentCTC ?? '',
  expectedCTC: candidate?.expectedCTC ?? '',
});

export const formValuesToCandidate = (values) => ({
  ...values,
  currentCTC: values.currentCTC === '' ? 0 : Number(values.currentCTC),
  expectedCTC: values.expectedCTC === '' ? 0 : Number(values.expectedCTC),
  experienceYears: Number(values.experienceYears),
  skills: values.skills
    .split(',')
    .map((skill) => skill.trim())
    .filter(Boolean),
});
