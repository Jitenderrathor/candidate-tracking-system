import { apiClient } from '@/api/client';

export const listUsers = async (params) => {
  const response = await apiClient.get('/users', { params });
  return { users: response.data.data.users, meta: response.data.meta };
};

export const getUser = async (id) => {
  const response = await apiClient.get(`/users/${id}`);
  return response.data.data.user;
};

export const createUser = async (values) => {
  const response = await apiClient.post('/users', values);
  return response.data;
};

export const updateUser = async ({ id, values }) => {
  const response = await apiClient.put(`/users/${id}`, values);
  return response.data;
};

export const setUserActive = async ({ id, isActive }) => {
  const action = isActive ? 'activate' : 'deactivate';
  const response = await apiClient.patch(`/users/${id}/${action}`);
  return response.data;
};

export const resetUserPassword = async (id) => {
  const response = await apiClient.post(`/users/${id}/reset-password`);
  return response.data;
};
