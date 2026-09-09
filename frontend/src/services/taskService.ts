import api from './api';

export const taskService = {
  list: (params?: Record<string, unknown>) => api.get('/tasks', { params }),
  get: (id: number | string) => api.get(`/tasks/${id}`),
  create: (data: Record<string, unknown>) => api.post('/tasks', data),
  update: (id: number | string, data: Record<string, unknown>) => api.put(`/tasks/${id}`, data),
  remove: (id: number | string) => api.delete(`/tasks/${id}`),
  assign: (id: number | string, data: Record<string, unknown>) => api.post(`/tasks/${id}/assign`, data),
  updateAssignment: (taskId: number | string, assignmentId: number | string, data: Record<string, unknown>) => api.put(`/tasks/${taskId}/assignments/${assignmentId}`, data),
};