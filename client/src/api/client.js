import axios from 'axios';
import toast from 'react-hot-toast';
import { AUTH_LOGOUT_EVENT } from '@/constants/auth';
import { authStorage } from '@/utils/authStorage';

// const baseURL = 'https://olive-donkey-403862.hostingersite.com/api';
const baseURL =  'http://localhost:5001/api';

export const apiClient = axios.create({
  baseURL,
  headers: { Accept: 'application/json' },
  timeout: 15000,
});

apiClient.interceptors.request.use((config) => {
  const token = authStorage.getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const apiError = error.response?.data?.error;

    if (status === 401) {
      authStorage.clear();
      window.dispatchEvent(new CustomEvent(AUTH_LOGOUT_EVENT));
    }

    const message = apiError?.message || error.message || 'Something went wrong';
    if (status !== 401) toast.error(message);

    return Promise.reject(
      Object.assign(error, {
        code: apiError?.code,
        details: apiError?.details,
        message,
        status,
      }),
    );
  },
);
