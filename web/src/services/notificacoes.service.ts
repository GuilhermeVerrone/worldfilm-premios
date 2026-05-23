import api from './api';
import type { PaginatedResponse } from './distribuidores.service';

export interface Notificacao {
  id: string;
  titulo: string;
  corpo: string;
  lida: boolean;
  vendedor_id: string | null;
  created_at: string;
}

export const notificacoesService = {
  list: (params?: { page?: number; limit?: number }) =>
    api.get<PaginatedResponse<Notificacao>>('/notificacoes', { params }).then((r) => r.data),

  enviarManual: (data: {
    titulo: string;
    corpo: string;
    destinatario: 'todos' | 'distribuidor' | 'vendedor';
    destinatario_id?: string;
  }) => api.post('/admin/notificacoes/enviar', data).then((r) => r.data),
};
