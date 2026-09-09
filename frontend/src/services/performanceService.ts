import api from './api';

export const performanceService = {
  list: (params?: Record<string, unknown>) => api.get('/performances', { params }),
  get: (id: number | string) => api.get(`/performances/${id}`),
  create: (data: Record<string, unknown>) => api.post('/performances', data),
  update: (id: number | string, data: Record<string, unknown>) => api.put(`/performances/${id}`, data),
  remove: (id: number | string) => api.delete(`/performances/${id}`),
};