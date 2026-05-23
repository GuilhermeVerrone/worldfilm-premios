import api from './api';
import type { PaginatedResponse } from './distribuidores.service';

export interface Produto {
  id: string;
  nome: string;
  descricao: string | null;
  unidade: string;
  ativo: boolean;
  created_at: string;
}

export const produtosService = {
  list: (params?: { page?: number; limit?: number; ativo?: boolean }) =>
    api.get<PaginatedResponse<Produto>>('/admin/produtos', { params }).then((r) => r.data),

  create: (data: Partial<Produto>) => api.post<{ produto: Produto }>('/admin/produtos', data).then((r) => r.data),

  update: (id: string, data: Partial<Produto>) =>
    api.put<{ produto: Produto }>(`/admin/produtos/${id}`, data).then((r) => r.data),

  remove: (id: string) => api.delete(`/admin/produtos/${id}`).then((r) => r.data),
};
