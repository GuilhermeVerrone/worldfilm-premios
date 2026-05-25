import type { Knex } from 'knex';

// Adds 'solicitado' to transacoes.status for saque requests
export async function up(knex: Knex): Promise<void> {
  await knex.raw(`ALTER TABLE transacoes DROP CONSTRAINT IF EXISTS transacoes_status_check`);
  await knex.raw(`
    ALTER TABLE transacoes
    ADD CONSTRAINT transacoes_status_check
    CHECK (status IN ('pendente','bloqueado','disponivel','solicitado','em_processamento','pago'))
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`ALTER TABLE transacoes DROP CONSTRAINT IF EXISTS transacoes_status_check`);
  await knex.raw(`
    ALTER TABLE transacoes
    ADD CONSTRAINT transacoes_status_check
    CHECK (status IN ('pendente','bloqueado','disponivel','em_processamento','pago'))
  `);
}
