export const INITIAL_REPORT_FILTERS = {
  search: '',
  status: '',
  source: '',
  gender: '',
  qualification: '',
  minExperience: '',
  maxExperience: '',
  minCurrentCTC: '',
  maxCurrentCTC: '',
  minExpectedCTC: '',
  maxExpectedCTC: '',
  dateFrom: '',
  dateTo: '',
};

export const REPORT_SORT_OPTIONS = [
  { label: 'Newest first', value: 'newest' },
  { label: 'Oldest first', value: 'oldest' },
  { label: 'Name', value: 'name' },
  { label: 'Experience: high to low', value: 'experience' },
  { label: 'Current CTC: high to low', value: 'currentCTC' },
  { label: 'Expected CTC: high to low', value: 'expectedCTC' },
];
