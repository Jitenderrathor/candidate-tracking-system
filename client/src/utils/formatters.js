export const formatExperience = (years) => {
  if (years == null || years === '') return '—';
  const numYears = Number(years);
  if (isNaN(numYears)) return '—';
  if (numYears === 0) return '0 yrs';

  const wholeYears = Math.floor(numYears);
  const months = Math.round((numYears - wholeYears) * 12 * 10) / 10; 

  let parts = [];
  if (wholeYears > 0) parts.push(`${wholeYears} yr${wholeYears > 1 ? 's' : ''}`);
  if (months > 0) parts.push(`${months} mo${months !== 1 ? 's' : ''}`);

  return parts.length > 0 ? parts.join(' ') : '0 yrs';
};
