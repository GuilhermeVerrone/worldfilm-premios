export type CampanhaTipo = 'lancamento' | 'vendas' | 'especial';
export type CampanhaStatus = 'rascunho' | 'ativa' | 'encerrada' | 'arquivada';

export type CampanhaSegmentacao =
  | { tipo: 'todos' }
  | { tipo: 'distribuidores'; distribuidores: string[] }
  | { tipo: 'regioes'; regioes: string[] };

export interface CampanhaPremio {
  id: string;
  campanha_id: string;
  produto_id: string;
  metragem_corte: number;
  valor_premio: number;
}

export interface Campanha {
  id: string;
  nome: string;
  tipo: CampanhaTipo;
  descricao?: string;
  data_inicio: string;
  data_fim: string;
  regulamento_url?: string;
  status: CampanhaStatus;
  segmentacao: CampanhaSegmentacao;
  created_at: string;
}

export type CreateCampanhaInput = Omit<Campanha, 'id' | 'created_at'> & {
  premios: Array<Omit<CampanhaPremio, 'id' | 'campanha_id'>>;
};

export type UpdateCampanhaInput = Partial<Omit<CreateCampanhaInput, 'premios'>>;
