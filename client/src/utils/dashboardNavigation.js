const labels = {
  dashboard: 'Dashboard',
  candidates: 'Candidates',
  reports: 'Reports',
  users: 'Users',
  'excel-import': 'Excel Import',
  'import-history': 'Import History',
  'email-templates': 'Email Templates',
  'change-password': 'Change Password',
  settings: 'Settings',
  trash: 'Recycle Bin',
};

export const formatRouteSegment = (segment) => labels[segment] || 'Details';

export const getPageTitle = (pathname) => {
  const segments = pathname.split('/').filter(Boolean);
  if (segments[0] === 'candidates' && segments.length > 1) return 'Candidate Details';
  return formatRouteSegment(segments.at(-1) || 'dashboard');
};
