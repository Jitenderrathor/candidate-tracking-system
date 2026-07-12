import { apiClient } from '@/api/client';

export const loginRequest = async (credentials) => {
  const response = await apiClient.post('/auth/login', credentials);
  return response.data;
};

export const forgotPasswordRequest = async (values) => {
  const response = await apiClient.post('/auth/forgot-password', values);
  return response.data;
};

export const changePasswordRequest = async (values) => {
  const response = await apiClient.post('/auth/change-password', values);
  return response.data;
};
