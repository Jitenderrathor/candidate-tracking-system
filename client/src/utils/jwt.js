const decodeBase64Url = (value) => {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const decoded = window.atob(normalized);
  return decodeURIComponent(
    Array.from(
      decoded,
      (character) => `%${character.charCodeAt(0).toString(16).padStart(2, '0')}`,
    ).join(''),
  );
};

export const decodeJwt = (token) => {
  try {
    const [, payload] = token.split('.');
    if (!payload) return null;
    return JSON.parse(decodeBase64Url(payload));
  } catch {
    return null;
  }
};

export const isTokenExpired = (payload) => !payload?.exp || payload.exp * 1000 <= Date.now();
