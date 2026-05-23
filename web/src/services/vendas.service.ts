import api from './api';
import type { PaginatedResponse } from './distribuidores.service';

export interface Venda {
  id: string;
  status: string;
  metragem: number;
  metragem_ajustada: number | null;
  premio_calculado: number;
  observacao: string | null;
  motivo_revisao: string | null;
  created_at: string;
  vendedor_id: string;
  vendedor_nome?: string;
  campanha_id: string;
  campanha_nome?: string;
  produto_id: string;
  produto_nome?: string;
  distribuidor_nome?: string;
}

export const vendasService = {
  list: (params?: { page?: number; limit?: number; status?: string; campanha_id?: string }) =>
    api.get<PaginatedResponse<Venda>>('/admin/vendas', { params }).then((r) => r.data),

  getById: (id: string) => api.get<{ venda: Venda }>(`/admin/vendas/${id}`).then((r) => r.data),

  aprovar: (id: string, data?: { metragem_ajustada?: number }) =>
    api.patch(`/admin/vendas/${id}/aprovar`, data ?? {}).then((r) => r.data),

  reprovar: (id: string, motivo: string) =>
    api.patch(`/admin/vendas/${id}/reprovar`, { motivo }).then((r) => r.data),

  solicitarRevisao: (id: string, motivo: string) =>
    api.patch(`/admin/vendas/${id}/revisao`, { motivo }).then((r) => r.data),

  exportar: (params?: { campanha_id?: string; status?: string }) =>
    api.get('/admin/vendas/exportar', {
      params,
      responseType: 'blob',
    }).then((r) => r.data),
};
