import type { Knex } from 'knex';
import { PRODUTO_IDS } from './03_produtos';

const CAMPANHA_ID = 'c1000000-0000-0000-0000-000000000001';

export async function seed(knex: Knex): Promise<void> {
  await knex('campanha_premios').del();
  await knex('campanhas').del();

  const dataInicio = new Date();
  const dataFim = new Date();
  dataFim.setDate(dataFim.getDate() + 60);

  await knex('campanhas').insert([
    {
      id: CAMPANHA_ID,
      nome: 'Campanha de Lançamento',
      tipo: 'lancamento',
      descricao: 'Campanha inaugural de premiação para vendedores World Film. Ganhe prêmios a cada 30m de película vendida.',
      data_inicio: dataInicio.toISOString(),
      data_fim: dataFim.toISOString(),
      status: 'ativa',
      segmentacao: JSON.stringify({ tipo: 'todos' }),
    },
  ]);

  // Tabela de prêmios conforme spec
  await knex('campanha_premios').insert([
    {
      id: knex.raw('gen_random_uuid()'),
      campanha_id: CAMPANHA_ID,
      produto_id: PRODUTO_IDS.insuline7090,
      metragem_corte: 30,
      valor_premio: 20.00,
    },
    {
      id: knex.raw('gen_random_uuid()'),
      campanha_id: CAMPANHA_ID,
      produto_id: PRODUTO_IDS.insulineGreen,
      metragem_corte: 30,
      valor_premio: 15.00,
    },
    {
      id: knex.raw('gen_random_uuid()'),
      campanha_id: CAMPANHA_ID,
      produto_id: PRODUTO_IDS.hpLine,
      metragem_corte: 30,
      valor_premio: 15.00,
    },
    {
      id: knex.raw('gen_random_uuid()'),
      campanha_id: CAMPANHA_ID,
      produto_id: PRODUTO_IDS.basicPro,
      metragem_corte: 30,
      valor_premio: 5.00,
    },
    {
      id: knex.raw('gen_random_uuid()'),
      campanha_id: CAMPANHA_ID,
      produto_id: PRODUTO_IDS.ppf152,
      metragem_corte: 15,
      valor_premio: 30.00,
    },
  ]);
}
