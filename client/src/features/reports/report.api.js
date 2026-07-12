import { apiClient } from '@/api/client';

const getReport = async (path, params) => {
  const response = await apiClient.get(`/reports/${path}`, { params });
  return response.data;
};

export const getReportSummary = async (params) => (await getReport('summary', params)).data;
export const getStatusReport = async (params) => (await getReport('status', params)).data;
export const getSourceReport = async (params) => (await getReport('source', params)).data;
export const getMonthlyReport = async (params) => (await getReport('monthly', params)).data.monthly;
export const getPipelineReport = async (params) => (await getReport('pipeline', params)).data;
export const getCandidateReport = async (params) => {
  const response = await getReport('candidates', params);
  return { candidates: response.data.candidates, meta: response.meta };
};
