import { apiClient } from '@/api/client';

export const listCandidates = async (params) => {
  const response = await apiClient.get('/candidates', { params });
  return { candidates: response.data.data.candidates, meta: response.data.meta };
};

export const exportCandidates = async (params) => {
  const response = await apiClient.get('/candidates/export', {
    params,
    responseType: 'blob',
  });
  return response.data;
};

export const getCandidate = async (id) => {
  const response = await apiClient.get(`/candidates/${id}`);
  return response.data.data.candidate;
};

export const createCandidate = async (values) => {
  const response = await apiClient.post('/candidates', values);
  return response.data;
};

export const updateCandidate = async ({ id, values }) => {
  const response = await apiClient.put(`/candidates/${id}`, values);
  return response.data;
};

export const deleteCandidate = async (id) => {
  const response = await apiClient.delete(`/candidates/${id}`);
  return response.data;
};

export const updateCandidateStatus = async ({ id, status, remarks }) => {
  const response = await apiClient.patch(`/candidates/${id}/status`, { status, remarks });
  return response.data;
};

export const getCandidateHistory = async (id) => {
  const response = await apiClient.get(`/candidates/${id}/history`);
  return response.data.data.history;
};

export const listTrash = async (params) => {
  const response = await apiClient.get('/candidates/trash/list', { params });
  return { candidates: response.data.data.candidates, meta: response.data.meta };
};

export const restoreCandidate = async (id) => {
  const response = await apiClient.post(`/candidates/trash/${id}/restore`);
  return response.data;
};

export const bulkDeleteCandidates = async (candidateIds = []) => {
  const response = await apiClient.post('/candidates/trash/bulk-delete', { candidateIds });
  return response.data;
};

export const bulkRestoreCandidates = async () => {
  const response = await apiClient.post('/candidates/trash/bulk-restore');
  return response.data;
};
