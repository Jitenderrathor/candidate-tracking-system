export const CANDIDATE_STATUSES = [
  'Registered',
  'Under Consideration',
  'To Be Shortlisted',
  'Selected',
  'DNP',
  'Rejected',
];
export const CANDIDATE_SOURCES = [
  'Website',
  'Referral',
  'Job Portal',
  'Walk-in',
  'LinkedIn',
  'Facebook',
  'Instagram',
  'Other',
];
export const GENDERS = ['Male', 'Female', 'Other', 'Prefer not to say'];

export const asOptions = (items) => items.map((item) => ({ label: item, value: item }));

export const STATUS_OPTIONS = asOptions(CANDIDATE_STATUSES);
export const SOURCE_OPTIONS = asOptions(CANDIDATE_SOURCES);
export const GENDER_OPTIONS = asOptions(GENDERS);

export const SORT_OPTIONS = [
  { label: 'Newest first', value: '-createdAt' },
  { label: 'Oldest first', value: 'createdAt' },
  { label: 'Name A–Z', value: 'firstName,lastName' },
  { label: 'Name Z–A', value: '-firstName,-lastName' },
  { label: 'Experience: high to low', value: '-experienceYears' },
  { label: 'Experience: low to high', value: 'experienceYears' },
];

export const STATUS_ORDER = {
  Registered: 1,
  'Under Consideration': 2,
  'To Be Shortlisted': 3,
  Selected: 4,
};
