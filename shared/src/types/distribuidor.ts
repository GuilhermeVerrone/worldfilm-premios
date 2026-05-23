export type DistribuidorStatus = 'ativo' | 'inativo';

export interface Distribuidor {
  id: string;
  razao_social: string;
  cnpj: string;
  responsavel: string;
  email: string;
  whatsapp: string;
  regiao: string;
  status: DistribuidorStatus;
  created_at: string;
  updated_at: string;
}

export type CreateDistribuidorInput = Omit<Distribuidor, 'id' | 'created_at' | 'updated_at'>;
export type UpdateDistribuidorInput = Partial<CreateDistribuidorInput>;
