import apiClient from './client';

export const projectsApi = {
  list: (orgId: string) =>
    apiClient.get('/projects', { headers: { 'X-Org-Id': orgId } }),

  getById: (orgId: string, id: string) =>
    apiClient.get(`/projects/${id}`, { headers: { 'X-Org-Id': orgId } }),

  getStats: (orgId: string) =>
    apiClient.get('/projects/stats', { headers: { 'X-Org-Id': orgId } }),

  create: (orgId: string, data: { name: string; description?: string }) =>
    apiClient.post('/projects', data, { headers: { 'X-Org-Id': orgId } }),

  update: (orgId: string, id: string, data: Record<string, any>) =>
    apiClient.put(`/projects/${id}`, data, { headers: { 'X-Org-Id': orgId } }),

  delete: (orgId: string, id: string) =>
    apiClient.delete(`/projects/${id}`, { headers: { 'X-Org-Id': orgId } }),
};
