import { api } from './api';

export const campanhaService = {
  list: (params?: { page?: number; limit?: number }) =>
    api.get('/campanhas', { params }).then((r) => r.data),

  getById: (id: string) => api.get(`/campanhas/${id}`).then((r) => r.data),
};
