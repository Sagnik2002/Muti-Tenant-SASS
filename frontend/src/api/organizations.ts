import apiClient from './client';

export const organizationsApi = {
  list: () => apiClient.get('/organizations'),

  getById: (orgId: string) => apiClient.get(`/organizations/${orgId}`),

  create: (data: { name: string; slug: string }) =>
    apiClient.post('/organizations', data),

  getMembers: (orgId: string) =>
    apiClient.get(`/organizations/${orgId}/members`),

  addMember: (orgId: string, data: { email: string; role: string }) =>
    apiClient.post(`/organizations/${orgId}/members`, data),

  removeMember: (orgId: string, membershipId: string) =>
    apiClient.delete(`/organizations/${orgId}/members/${membershipId}`),
};
