import type { Knex } from 'knex';

export const DISTRIBUIDOR_IDS = {
  sul: 'd1000000-0000-0000-0000-000000000001',
  sudeste: 'd2000000-0000-0000-0000-000000000002',
  nordeste: 'd3000000-0000-0000-0000-000000000003',
};

export async function seed(knex: Knex): Promise<void> {
  await knex('distribuidores').del();

  await knex('distribuidores').insert([
    {
      id: DISTRIBUIDOR_IDS.sul,
      razao_social: 'Distribuidora Sul Ltda',
      cnpj: '11.222.333/0001-44',
      responsavel: 'Carlos Silva',
      email: 'contato@distribuidorasul.com.br',
      whatsapp: '+55 51 99999-0001',
      regiao: 'Sul',
      status: 'ativo',
    },
    {
      id: DISTRIBUIDOR_IDS.sudeste,
      razao_social: 'Distribuidora Sudeste Ltda',
      cnpj: '22.333.444/0001-55',
      responsavel: 'Ana Souza',
      email: 'contato@distribuidorasudeste.com.br',
      whatsapp: '+55 11 99999-0002',
      regiao: 'Sudeste',
      status: 'ativo',
    },
    {
      id: DISTRIBUIDOR_IDS.nordeste,
      razao_social: 'Distribuidora Nordeste Ltda',
      cnpj: '33.444.555/0001-66',
      responsavel: 'João Ferreira',
      email: 'contato@distribuidoranordeste.com.br',
      whatsapp: '+55 81 99999-0003',
      regiao: 'Nordeste',
      status: 'ativo',
    },
  ]);
}
