import apiClient from './client';

export const tasksApi = {
  list: (orgId: string, projectId: string) =>
    apiClient.get('/tasks', {
      params: { projectId },
      headers: { 'X-Org-Id': orgId },
    }),

  getById: (orgId: string, id: string) =>
    apiClient.get(`/tasks/${id}`, { headers: { 'X-Org-Id': orgId } }),

  getStats: (orgId: string) =>
    apiClient.get('/tasks/stats', { headers: { 'X-Org-Id': orgId } }),

  create: (orgId: string, data: Record<string, any>) =>
    apiClient.post('/tasks', data, { headers: { 'X-Org-Id': orgId } }),

  update: (orgId: string, id: string, data: Record<string, any>) =>
    apiClient.put(`/tasks/${id}`, data, { headers: { 'X-Org-Id': orgId } }),

  delete: (orgId: string, id: string) =>
    apiClient.delete(`/tasks/${id}`, { headers: { 'X-Org-Id': orgId } }),
};
