import { api } from './api';

export const authService = {
  login: (cpf: string, senha: string) =>
    api.post('/auth/vendedor/login', { cpf, senha }).then((r) => r.data),

  adminLogin: (email: string, senha: string) =>
    api.post('/auth/admin/login', { email, senha }).then((r) => r.data),

  register: (data: {
    nome: string;
    sobrenome?: string;
    cpf: string;
    cnpj?: string;
    whatsapp: string;
    email?: string;
    senha: string;
    distribuidor_id: string;
    chave_pix?: string;
  }) => api.post('/auth/vendedor/register', data).then((r) => r.data),

  logout: (refreshToken: string) =>
    api.post('/auth/vendedor/logout', { refreshToken }).then((r) => r.data),

  recuperar: (whatsapp: string) =>
    api.post('/auth/vendedor/recuperar', { whatsapp }).then((r) => r.data),

  verificarOtp: (whatsapp: string, otp: string) =>
    api.post('/auth/vendedor/verificar-otp', { whatsapp, otp }).then((r) => r.data),

  resetSenha: (whatsapp: string, otp: string, novaSenha: string) =>
    api.post('/auth/vendedor/reset-senha', { whatsapp, otp, nova_senha: novaSenha }).then((r) => r.data),

  updateFcmToken: (fcmToken: string) =>
    api.patch('/vendedor/fcm-token', { fcm_token: fcmToken }).then((r) => r.data),
};
