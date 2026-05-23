import type { Knex } from 'knex';

export const PRODUTO_IDS = {
  insuline7090: 'p1000000-0000-0000-0000-000000000001',
  insulineGreen: 'p2000000-0000-0000-0000-000000000002',
  hpLine: 'p3000000-0000-0000-0000-000000000003',
  basicPro: 'p4000000-0000-0000-0000-000000000004',
  ppf152: 'p5000000-0000-0000-0000-000000000005',
};

export async function seed(knex: Knex): Promise<void> {
  await knex('produtos').del();

  await knex('produtos').insert([
    {
      id: PRODUTO_IDS.insuline7090,
      nome: 'Insuline 7090',
      linha: 'Insuline',
      categoria: 'pelicula',
      espessura: '70µm',
      largura: '152cm',
      ativo: true,
    },
    {
      id: PRODUTO_IDS.insulineGreen,
      nome: 'Insuline Green',
      linha: 'Insuline',
      categoria: 'pelicula',
      espessura: '75µm',
      largura: '152cm',
      ativo: true,
    },
    {
      id: PRODUTO_IDS.hpLine,
      nome: 'HP Line',
      linha: 'HP',
      categoria: 'pelicula',
      espessura: '80µm',
      largura: '152cm',
      ativo: true,
    },
    {
      id: PRODUTO_IDS.basicPro,
      nome: 'Basic Pro',
      linha: 'Basic',
      categoria: 'pelicula',
      espessura: '60µm',
      largura: '152cm',
      ativo: true,
    },
    {
      id: PRODUTO_IDS.ppf152,
      nome: 'PPF 1,52',
      linha: 'PPF',
      categoria: 'ppf',
      espessura: '200µm',
      largura: '152cm',
      ativo: true,
    },
  ]);
}
