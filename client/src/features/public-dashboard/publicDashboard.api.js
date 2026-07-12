import { apiClient } from '@/api/client';

export const getPublicDashboardSummary = async () => {
  const response = await apiClient.get('/dashboard/summary');
  return response.data.data;
};
