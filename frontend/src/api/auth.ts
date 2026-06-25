import apiClient from './client';

export const authApi = {
  register: (data: { email: string; password: string; firstName: string; lastName: string }) =>
    apiClient.post('/auth/register', data),

  login: (data: { email: string; password: string }) =>
    apiClient.post('/auth/login', data),

  refresh: (refreshToken: string) =>
    apiClient.post('/auth/refresh', { refreshToken }),

  logout: () => apiClient.post('/auth/logout'),
};
