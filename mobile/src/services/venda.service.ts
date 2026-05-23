import { api } from './api';

export const vendaService = {
  list: (params?: { page?: number; limit?: number }) =>
    api.get('/vendas', { params }).then((r) => r.data),

  getById: (id: string) => api.get(`/vendas/${id}`).then((r) => r.data),

  create: (data: {
    campanha_id: string;
    produto_id: string;
    metragem: number;
    nome_cliente?: string;
    cpf_cnpj_cliente?: string;
    placa_veiculo?: string;
    observacao?: string;
  }) => api.post('/vendas', data).then((r) => r.data),
};
