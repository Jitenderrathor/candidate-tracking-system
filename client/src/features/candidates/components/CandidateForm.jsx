import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button, Card, Input, Loader, Select } from '@/components/common';
import { GENDER_OPTIONS, SOURCE_OPTIONS } from '@/features/candidates/candidate.constants';
import {
  candidateDefaults,
  candidateSchema,
  candidateToFormValues,
  formValuesToCandidate,
} from '@/features/candidates/candidate.schema';
import { FormTextarea } from '@/features/candidates/components/FormTextarea';

function FormSection({ children, description, title }) {
  return (
    <Card>
      <header className="mb-5">
        <h2 className="font-semibold text-slate-950">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </header>
      <div className="grid gap-5 md:grid-cols-2">{children}</div>
    </Card>
  );
}

export function CandidateForm({ candidate, isSubmitting, onCancel, onSubmit, submitLabel }) {
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = useForm({ defaultValues: candidateDefaults, resolver: zodResolver(candidateSchema) });
  useEffect(() => {
    reset(candidateToFormValues(candidate));
  }, [candidate, reset]);

  return (
    <form
      className="space-y-6"
      noValidate
      onSubmit={handleSubmit((values) => onSubmit(formValuesToCandidate(values)))}
    >
      {candidate?.candidateId && (
        <Input disabled label="Candidate ID" value={candidate.candidateId} />
      )}
      <FormSection
        description="Basic identity and demographic information."
        title="Personal Information"
      >
        <Input
          error={errors.firstName?.message}
          label="First Name"
          required
          {...register('firstName')}
        />
        <Input
          error={errors.lastName?.message}
          label="Last Name"
          required
          {...register('lastName')}
        />
        <Select
          error={errors.gender?.message}
          label="Gender"
          options={GENDER_OPTIONS}
          required
          {...register('gender')}
        />
        <Input
          error={errors.dateOfBirth?.message}
          label="Date of Birth"
          max={new Date().toISOString().slice(0, 10)}
          required
          type="date"
          {...register('dateOfBirth')}
        />
      </FormSection>
      <FormSection description="How the candidate can be contacted." title="Contact Information">
        <Input
          autoComplete="email"
          error={errors.email?.message}
          label="Email"
          required
          type="email"
          {...register('email')}
        />
        <Input
          autoComplete="tel"
          error={errors.mobile?.message}
          label="Mobile"
          placeholder="+919876543210"
          required
          type="tel"
          {...register('mobile')}
        />
        <div className="md:col-span-2">
          <FormTextarea
            error={errors.address?.message}
            label="Address"
            required
            {...register('address')}
          />
        </div>
      </FormSection>
      <FormSection
        description="Experience, compensation, and capabilities."
        title="Professional Information"
      >
        <Input
          error={errors.qualification?.message}
          label="Qualification"
          required
          {...register('qualification')}
        />
        <Input
          error={errors.experienceYears?.message}
          label="Experience (years)"
          min="0"
          max="80"
          required
          step="0.1"
          type="number"
          {...register('experienceYears')}
        />
        <Input
          error={errors.currentCompany?.message}
          label="Current Company"
          {...register('currentCompany')}
        />
        <Input
          error={errors.skills?.message}
          helpText="Separate multiple skills with commas."
          label="Skills"
          placeholder="React, Node.js, MongoDB"
          required
          {...register('skills')}
        />
        <Input
          error={errors.currentCTC?.message}
          label="Current CTC"
          min="0"
          step="0.01"
          type="number"
          {...register('currentCTC')}
        />
        <Input
          error={errors.expectedCTC?.message}
          label="Expected CTC"
          min="0"
          step="0.01"
          type="number"
          {...register('expectedCTC')}
        />
        <div className="md:col-span-2">
          <Input
            error={errors.resumeUrl?.message}
            label="Resume URL"
            placeholder="https://example.com/resume.pdf"
            type="url"
            {...register('resumeUrl')}
          />
        </div>
      </FormSection>
      <FormSection
        description="Candidate source and recruiter notes."
        title="Recruitment Information"
      >
        <div>
          <Input
            error={errors.source?.message}
            label="Source"
            list="source-options"
            required
            {...register('source')}
          />
          <datalist id="source-options">
            {SOURCE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value} />
            ))}
          </datalist>
        </div>
        <div className="md:col-span-2">
          <FormTextarea error={errors.remarks?.message} label="Remarks" {...register('remarks')} />
        </div>
      </FormSection>
      {errors.root && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">
          {errors.root.message}
        </p>
      )}
      <div className="sticky bottom-4 flex justify-end gap-3 rounded-xl border bg-white/95 p-4 shadow-lg backdrop-blur">
        <Button onClick={onCancel} variant="outline">
          Cancel
        </Button>
        <Button disabled={isSubmitting} type="submit">
          {isSubmitting ? (
            <Loader className="text-white" label="Saving..." size="sm" />
          ) : (
            submitLabel
          )}
        </Button>
      </div>
    </form>
  );
}
