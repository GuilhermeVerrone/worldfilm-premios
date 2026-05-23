import { api } from './api';

export const distribuidorService = {
  list: (params?: { search?: string }) =>
    api.get('/admin/distribuidores', { params }).then((r) => r.data),
};
