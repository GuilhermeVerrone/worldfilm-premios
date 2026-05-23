export type TransacaoTipo = 'credito' | 'saque' | 'estorno';
export type TransacaoStatus =
  | 'pendente'
  | 'bloqueado'
  | 'disponivel'
  | 'em_processamento'
  | 'pago';

export interface Transacao {
  id: string;
  vendedor_id: string;
  venda_id?: string;
  tipo: TransacaoTipo;
  valor: number;
  status: TransacaoStatus;
  chave_pix_destino?: string;
  comprovante_url?: string;
  data_liberacao?: string;
  pago_por?: string;
  pago_em?: string;
  created_at: string;
  updated_at: string;
}
