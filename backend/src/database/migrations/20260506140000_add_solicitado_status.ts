import type { Knex } from 'knex';

// Adds 'solicitado' to transacoes.status for saque requests
export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE transacoes
    MODIFY COLUMN status
      ENUM('pendente','bloqueado','disponivel','solicitado','em_processamento','pago')
      NOT NULL DEFAULT 'pendente'
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE transacoes
    MODIFY COLUMN status
      ENUM('pendente','bloqueado','disponivel','em_processamento','pago')
      NOT NULL DEFAULT 'pendente'
  `);
}
