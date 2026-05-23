export type VendaStatus = 'pendente' | 'em_analise' | 'aprovada' | 'reprovada' | 'cancelada';

export interface Venda {
  id: string;
  vendedor_id: string;
  campanha_id: string;
  produto_id: string;
  metragem: number;
  placa_veiculo?: string;
  nome_cliente?: string;
  cpf_cliente?: string;
  premio_estimado: number;
  premio_apurado?: number;
  status: VendaStatus;
  motivo_reprovacao?: string;
  validado_por?: string;
  validado_em?: string;
  created_at: string;
  updated_at: string;
}

export type CreateVendaInput = {
  campanha_id: string;
  produto_id: string;
  metragem: number;
  placa_veiculo?: string;
  nome_cliente?: string;
  cpf_cliente?: string;
};
