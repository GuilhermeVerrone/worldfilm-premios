import api from './api';
import type { PaginatedResponse } from './distribuidores.service';

export interface Vendedor {
  id: string;
  nome: string;
  sobrenome: string | null;
  cpf: string;
  email: string | null;
  telefone: string | null;
  status: string;
  distribuidor_id: string;
  distribuidor_nome?: string;
  saldo_disponivel: number;
  saldo_bloqueado: number;
  created_at: string;
}

export const vendedoresService = {
  list: (params?: { page?: number; limit?: number; search?: string; status?: string; distribuidor_id?: string }) =>
    api.get<PaginatedResponse<Vendedor>>('/admin/vendedores', { params }).then((r) => r.data),

  getById: (id: string) =>
    api.get<{ vendedor: Vendedor; vendas: any[]; transacoes: any[] }>(`/admin/vendedores/${id}`).then((r) => r.data),

  aprovar: (id: string) => api.patch(`/admin/vendedores/${id}/aprovar`).then((r) => r.data),
  reprovar: (id: string, motivo: string) =>
    api.patch(`/admin/vendedores/${id}/reprovar`, { motivo }).then((r) => r.data),
  bloquear: (id: string) => api.patch(`/admin/vendedores/${id}/bloquear`).then((r) => r.data),
  desbloquear: (id: string) => api.patch(`/admin/vendedores/${id}/desbloquear`).then((r) => r.data),
  changeRole: (id: string, role: 'vendedor' | 'admin') =>
    api.patch(`/admin/vendedores/${id}/role`, { role }).then((r) => r.data),
};
