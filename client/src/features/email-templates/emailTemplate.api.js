import { apiClient } from '@/api/client';

export const listEmailTemplates = async () => {
  const { data } = await apiClient.get('/email-templates');
  return data.data;
};

export const getEmailTemplate = async (id) => {
  const { data } = await apiClient.get(`/email-templates/${id}`);
  return data.data;
};

export const createEmailTemplate = async (templateData) => {
  const { data } = await apiClient.post('/email-templates', templateData);
  return data.data;
};

export const updateEmailTemplate = async ({ id, ...templateData }) => {
  const { data } = await apiClient.patch(`/email-templates/${id}`, templateData);
  return data.data;
};

export const deleteEmailTemplate = async (id) => {
  await apiClient.delete(`/email-templates/${id}`);
};

export const sendBulkEmail = async ({ candidateIds, statuses, templateId }) => {
  const { data } = await apiClient.post('/candidates/bulk-email', { candidateIds, statuses, templateId });
  return data;
};
