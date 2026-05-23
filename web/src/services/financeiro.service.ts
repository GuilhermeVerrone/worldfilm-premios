import api from './api';
import type { PaginatedResponse } from './distribuidores.service';

export interface Solicitacao {
  id: string;
  tipo: string;
  status: string;
  valor: number;
  comprovante_url: string | null;
  created_at: string;
  updated_at: string;
  vendedor_id: string;
  vendedor_nome?: string;
  distribuidor_nome?: string;
}

export const financeiroService = {
  listSolicitacoes: (params?: { page?: number; limit?: number; status?: string }) =>
    api.get<PaginatedResponse<Solicitacao>>('/admin/financeiro/solicitacoes', { params }).then((r) => r.data),

  processar: (id: string) => api.patch(`/admin/financeiro/solicitacoes/${id}/processar`).then((r) => r.data),

  pagar: (id: string, file: File) => {
    const form = new FormData();
    form.append('comprovante', file);
    return api.patch(`/admin/financeiro/solicitacoes/${id}/pagar`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data);
  },

  relatorio: () =>
    api.get('/admin/financeiro/relatorio', { responseType: 'blob' }).then((r) => r.data),
};
