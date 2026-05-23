import api from './api';

export interface UnifiedLoginPayload {
  identifier: string;
  senha: string;
}

export interface UnifiedLoginResponse {
  token: string;
  refreshToken: string;
  role: 'admin' | 'vendedor';
  user: Record<string, unknown>;
}

export interface LoginPayload {
  email: string;
  senha: string;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  admin: { id: string; nome: string; email: string };
}

export interface VendedorLoginPayload {
  cpf: string;
  senha: string;
}

export interface VendedorLoginResponse {
  token: string;
  refreshToken: string;
  vendedor: { id: string; nome: string; cpf: string };
}

export const authService = {
  unifiedLogin: (data: UnifiedLoginPayload) =>
    api.post<UnifiedLoginResponse>('/auth/login', data).then((r) => r.data),

  login: (data: LoginPayload) =>
    api.post<LoginResponse>('/auth/admin/login', data).then((r) => r.data),
  logout: (refreshToken: string) =>
    api.post('/auth/admin/logout', { refreshToken }),

  vendedorLogin: (data: VendedorLoginPayload) =>
    api.post<VendedorLoginResponse>('/auth/vendedor/login', data).then((r) => r.data),
  vendedorRecover: (cpf: string) =>
    api.post('/auth/vendedor/recover', { cpf }).then((r) => r.data),

  vendedorRegister: (data: {
    nome: string;
    cpf: string;
    cnpj?: string;
    whatsapp: string;
    senha: string;
    email?: string;
    distribuidor_id: string;
    chave_pix: string;
  }) => api.post('/auth/vendedor/register', data).then((r) => r.data),
};
