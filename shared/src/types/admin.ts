export type AdminRole = 'super_admin' | 'financeiro' | 'operacional' | 'leitura';

export interface Admin {
  id: string;
  nome: string;
  email: string;
  role: AdminRole;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}
