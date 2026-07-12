const TOKEN_KEY = 'crts_access_token';

export const authStorage = {
  getToken: () => window.localStorage.getItem(TOKEN_KEY),
  setToken: (token) => window.localStorage.setItem(TOKEN_KEY, token),
  clear: () => window.localStorage.removeItem(TOKEN_KEY),
};
