export type VendedorStatus = 'pendente' | 'em_analise' | 'aprovado' | 'reprovado' | 'bloqueado';

export interface Vendedor {
  id: string;
  distribuidor_id: string;
  nome: string;
  cpf: string;
  cnpj?: string;
  chave_pix: string;
  whatsapp: string;
  status: VendedorStatus;
  motivo_reprovacao?: string;
  tentativas_cadastro: number;
  saldo_disponivel: number;
  saldo_bloqueado: number;
  fcm_token?: string;
  created_at: string;
  updated_at: string;
}

export type CreateVendedorInput = {
  distribuidor_id: string;
  nome: string;
  cpf: string;
  cnpj?: string;
  chave_pix: string;
  whatsapp: string;
  senha: string;
};

export type UpdateVendedorInput = Partial<Pick<Vendedor, 'nome' | 'whatsapp' | 'chave_pix'>>;
