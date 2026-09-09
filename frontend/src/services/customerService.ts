import api from "./api";

export const getCustomers = () => api.get("/customers");

export const getCustomer = (id: number) =>
  api.get(`/customers/${id}`);

export const createCustomer = (data: any) =>
  api.post("/customers", data);

export const updateCustomer = (id: number, data: any) =>
  api.put(`/customers/${id}`, data);

export const deleteCustomer = (id: number) =>
  api.delete(`/customers/${id}`);