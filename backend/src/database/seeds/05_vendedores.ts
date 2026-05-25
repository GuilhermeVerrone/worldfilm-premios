import type { Knex } from 'knex';
import bcrypt from 'bcrypt';
import { DISTRIBUIDOR_IDS } from './02_distribuidores';

export async function seed(knex: Knex): Promise<void> {
  await knex('vendedores').del();

  const senha = await bcrypt.hash('Vendedor@123', 12);

  await knex('vendedores').insert([
    {
      id: knex.raw('gen_random_uuid()'),
      distribuidor_id: DISTRIBUIDOR_IDS.sul,
      nome: 'Pedro Almeida Santos',
      cpf: '111.222.333-44',
      cnpj: null,
      chave_pix: '111.222.333-44',
      whatsapp: '+55 51 98888-0001',
      senha,
      status: 'pendente',
      tentativas_cadastro: 0,
      saldo_disponivel: 0,
      saldo_bloqueado: 0,
    },
    {
      id: knex.raw('gen_random_uuid()'),
      distribuidor_id: DISTRIBUIDOR_IDS.sudeste,
      nome: 'Maria Oliveira Lima',
      cpf: '222.333.444-55',
      cnpj: '44.555.666/0001-77',
      chave_pix: 'maria.oliveira@email.com',
      whatsapp: '+55 11 98888-0002',
      senha,
      status: 'aprovado',
      tentativas_cadastro: 0,
      saldo_disponivel: 150.00,
      saldo_bloqueado: 45.00,
    },
    {
      id: knex.raw('gen_random_uuid()'),
      distribuidor_id: DISTRIBUIDOR_IDS.nordeste,
      nome: 'Roberto Costa Neto',
      cpf: '333.444.555-66',
      cnpj: null,
      chave_pix: '+55 81 97777-0003',
      whatsapp: '+55 81 97777-0003',
      senha,
      status: 'reprovado',
      motivo_reprovacao: 'CPF não confere com os dados informados. Por favor, corrija e reenvie.',
      tentativas_cadastro: 1,
      saldo_disponivel: 0,
      saldo_bloqueado: 0,
    },
  ]);
}
