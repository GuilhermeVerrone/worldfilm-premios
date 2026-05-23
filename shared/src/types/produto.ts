export type ProdutoCategoria = 'pelicula' | 'ppf' | 'outro';

export interface Produto {
  id: string;
  nome: string;
  linha: string;
  categoria: ProdutoCategoria;
  espessura?: string;
  largura?: string;
  ativo: boolean;
}

export type CreateProdutoInput = Omit<Produto, 'id'>;
export type UpdateProdutoInput = Partial<CreateProdutoInput>;
