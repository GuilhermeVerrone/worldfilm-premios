import { api } from './api';

export const notificacaoService = {
  list: (params?: { page?: number; limit?: number }) =>
    api.get('/notificacoes', { params }).then((r) => r.data),

  countNaoLidas: () => api.get('/notificacoes/nao-lidas/count').then((r) => r.data),

  marcarLida: (id: string) => api.patch(`/notificacoes/${id}/lida`).then((r) => r.data),

  marcarTodasLidas: () => api.patch('/notificacoes/todas-lidas').then((r) => r.data),
};
