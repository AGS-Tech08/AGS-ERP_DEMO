import api from './api';

const report = (path: string, params?: Record<string, unknown>) => api.get(`/reports/${path}`, { params });

export const reportService = {
  employees: (params?: Record<string, unknown>) => report('employees', params),
  attendance: (params?: Record<string, unknown>) => report('attendance', params),
  tasks: (params?: Record<string, unknown>) => report('tasks', params),
  taskCompletion: (params?: Record<string, unknown>) => report('task-completion', params),
  dailyWork: (params?: Record<string, unknown>) => report('daily-work', params),
  workHours: (params?: Record<string, unknown>) => report('work-hours', params),
  productivity: (params?: Record<string, unknown>) => report('productivity', params),
  skillImprovement: (params?: Record<string, unknown>) => report('skill-improvement', params),
  performance: (params?: Record<string, unknown>) => report('performance', params),
  salesSummary: (params?: Record<string, unknown>) => report('sales-summary', params),
  outstanding: (params?: Record<string, unknown>) => report('outstanding', params),
  purchaseSummary: (params?: Record<string, unknown>) => report('purchase-summary', params),
  stockSummary: (params?: Record<string, unknown>) => report('stock-summary', params),
  business: (params?: Record<string, unknown>) => report('business', params),
  rewards: (params?: Record<string, unknown>) => report('rewards', params),
  customers: (params?: Record<string, unknown>) => report('customers', params),
  vendors: (params?: Record<string, unknown>) => report('vendors', params),
  services: (params?: Record<string, unknown>) => report('services', params),
  amcs: (params?: Record<string, unknown>) => report('amcs', params),
  assets: (params?: Record<string, unknown>) => report('assets', params),
  payments: (params?: Record<string, unknown>) => report('payments', params),
  financialSummary: (params?: Record<string, unknown>) => report('financial-summary', params),
  gstTaxInvoices: (params?: Record<string, unknown>) => report('gst/tax-invoices', params),
};