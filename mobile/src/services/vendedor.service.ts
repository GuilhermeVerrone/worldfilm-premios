import { api } from './api';

export const vendedorService = {
  getPerfil: () => api.get('/vendedor/perfil').then((r) => r.data),

  updatePerfil: (data: { nome?: string; sobrenome?: string; telefone?: string; chave_pix?: string }) =>
    api.patch('/vendedor/perfil', data).then((r) => r.data),

  updateSenha: (senhaAtual: string, novaSenha: string) =>
    api.patch('/vendedor/senha', { senha_atual: senhaAtual, nova_senha: novaSenha }).then((r) => r.data),

  getSaldo: () => api.get('/financeiro/saldo').then((r) => r.data),

  solicitar: (valor: number) =>
    api.post('/financeiro/solicitar', { valor }).then((r) => r.data),

  getExtrato: (params?: { page?: number; limit?: number }) =>
    api.get('/financeiro/extrato', { params }).then((r) => r.data),
};
