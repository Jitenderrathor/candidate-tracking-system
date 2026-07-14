import { apiClient } from '@/api/client';

export const getSettings = async () => {
  const { data } = await apiClient.get('/settings');
  return data.data;
};

export const updateSettings = async (values) => {
  const { data } = await apiClient.put('/settings', values);
  return data;
};
