import api from './api';

export interface Distribuidor {
  id: string;
  razao_social: string;
  cnpj: string;
  responsavel: string;
  email: string;
  whatsapp: string;
  regiao: string;
  status: string;
  created_at: string;
  vendedores_ativos?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const distribuidoresService = {
  list: (params?: { page?: number; limit?: number; search?: string }) =>
    api.get<PaginatedResponse<Distribuidor>>('/admin/distribuidores', { params }).then((r) => r.data),

  getById: (id: string) =>
    api.get<{ distribuidor: Distribuidor; vendedores: any[] }>(`/admin/distribuidores/${id}`).then((r) => r.data),

  create: (data: Partial<Distribuidor>) =>
    api.post<{ distribuidor: Distribuidor }>('/admin/distribuidores', data).then((r) => r.data),

  update: (id: string, data: Partial<Distribuidor>) =>
    api.put<{ distribuidor: Distribuidor }>(`/admin/distribuidores/${id}`, data).then((r) => r.data),

  updateStatus: (id: string, status: string) =>
    api.patch(`/admin/distribuidores/${id}/status`, { status }).then((r) => r.data),
};
