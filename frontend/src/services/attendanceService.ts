import api from './api';

export const attendanceService = {
  list: (params?: Record<string, unknown>) => api.get('/attendances', { params }),
  get: (id: number | string) => api.get(`/attendances/${id}`),
  create: (data: Record<string, unknown>) => api.post('/attendances', data),
  update: (id: number | string, data: Record<string, unknown>) => api.put(`/attendances/${id}`, data),
  remove: (id: number | string) => api.delete(`/attendances/${id}`),
  checkIn: (data?: Record<string, unknown>) => api.post('/attendances/check-in', data ?? {}),
  checkOut: (data?: Record<string, unknown>) => api.post('/attendances/check-out', data ?? {}),
};