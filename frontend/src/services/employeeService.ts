import api from './api';

export const employeeService = {
  list: (params?: Record<string, unknown>) => api.get('/employees', { params }),
  get: (id: number | string) => api.get(`/employees/${id}`),
  create: (data: Record<string, unknown>) => api.post('/employees', data),
  update: (id: number | string, data: Record<string, unknown>) => api.put(`/employees/${id}`, data),
  remove: (id: number | string) => api.delete(`/employees/${id}`),
  departments: (params?: Record<string, unknown>) => api.get('/departments', { params }),
  createDepartment: (data: Record<string, unknown>) => api.post('/departments', data),
  updateDepartment: (id: number | string, data: Record<string, unknown>) => api.put(`/departments/${id}`, data),
  removeDepartment: (id: number | string) => api.delete(`/departments/${id}`),
};