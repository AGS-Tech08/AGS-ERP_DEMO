import api from './api';

export const dailyWorkService = {
  list: (params?: Record<string, unknown>) => api.get('/daily-works', { params }),
  get: (id: number | string) => api.get(`/daily-works/${id}`),
  create: (data: Record<string, unknown>) => api.post('/daily-works', data),
  update: (id: number | string, data: Record<string, unknown>) => api.put(`/daily-works/${id}`, data),
  remove: (id: number | string) => api.delete(`/daily-works/${id}`),
};