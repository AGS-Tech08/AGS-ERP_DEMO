import api from './api';

export const skillService = {
  list: (params?: Record<string, unknown>) => api.get('/skills', { params }),
  get: (id: number | string) => api.get(`/skills/${id}`),
  create: (data: Record<string, unknown>) => api.post('/skills', data),
  update: (id: number | string, data: Record<string, unknown>) => api.put(`/skills/${id}`, data),
  remove: (id: number | string) => api.delete(`/skills/${id}`),
  employeeSkills: (employeeId: number | string) => api.get(`/employees/${employeeId}/skills`),
  assign: (employeeId: number | string, data: Record<string, unknown>) => api.post(`/employees/${employeeId}/skills`, data),
  updateEmployeeSkill: (employeeId: number | string, skillId: number | string, data: Record<string, unknown>) => api.put(`/employees/${employeeId}/skills/${skillId}`, data),
  removeEmployeeSkill: (employeeId: number | string, skillId: number | string) => api.delete(`/employees/${employeeId}/skills/${skillId}`),
};