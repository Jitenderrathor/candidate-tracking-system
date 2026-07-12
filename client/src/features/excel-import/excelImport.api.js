import { apiClient } from '@/api/client';

export const importCandidateWorkbook = async ({ file, onProgress }) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await apiClient.post('/excel/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (event) => {
      if (!event.total) return;
      onProgress?.(Math.min(100, Math.round((event.loaded * 100) / event.total)));
    },
    timeout: 120000,
  });
  return response.data;
};
