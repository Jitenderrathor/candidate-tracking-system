const labels = {
  dashboard: 'Dashboard',
  candidates: 'Candidates',
  reports: 'Reports',
  users: 'Users',
  'excel-import': 'Excel Import',
  'change-password': 'Change Password',
};

export const formatRouteSegment = (segment) => labels[segment] || 'Details';

export const getPageTitle = (pathname) => {
  const segments = pathname.split('/').filter(Boolean);
  if (segments[0] === 'candidates' && segments.length > 1) return 'Candidate Details';
  return formatRouteSegment(segments.at(-1) || 'dashboard');
};
