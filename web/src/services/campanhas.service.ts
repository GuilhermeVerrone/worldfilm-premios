import api from './api';
import type { PaginatedResponse } from './distribuidores.service';

export interface Premio {
  produto_id: string;
  metragem_corte: number;
  valor_premio: number;
}

export interface Campanha {
  id: string;
  nome: string;
  descricao: string | null;
  data_inicio: string;
  data_fim: string;
  status: string;
  segmentacao: string | object;
  imagem_url?: string | null;
  premios?: Premio[];
  created_at: string;
}

export const campanhasService = {
  list: (params?: { page?: number; limit?: number; status?: string }) =>
    api.get<PaginatedResponse<Campanha>>('/admin/campanhas', { params }).then((r) => r.data),

  getById: (id: string) => api.get<{ campanha: Campanha }>(`/admin/campanhas/${id}`).then((r) => r.data),

  create: (data: Partial<Campanha> & { premios?: Premio[] }) =>
    api.post<{ campanha: Campanha }>('/admin/campanhas', data).then((r) => r.data),

  update: (id: string, data: Partial<Campanha> & { premios?: Premio[] }) =>
    api.put<{ campanha: Campanha }>(`/admin/campanhas/${id}`, data).then((r) => r.data),

  updateStatus: (id: string, status: string) =>
    api.patch(`/admin/campanhas/${id}/status`, { status }).then((r) => r.data),
};
