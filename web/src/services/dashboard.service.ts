import api from './api';

export interface DashboardData {
  cards: {
    totalVendedores: number;
    pendentes: number;
    totalVendas: number;
    vendasPendentes: number;
    totalCampanhas: number;
    solicitacoesPendentes: number;
  };
  vendasPorCampanha: { campanha: string; total: number; totalPremios: number }[];
  atividadeRecente: {
    id: string;
    status: string;
    created_at: string;
    premio_estimado: number;
    vendedor: string;
    campanha: string;
  }[];
}

export const dashboardService = {
  get: () => api.get<DashboardData>('/admin/dashboard').then((r) => r.data),
};
