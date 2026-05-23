import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('vendedores', (t) => {
    t.string('otp_code', 6).nullable();
    t.timestamp('otp_expires_at').nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('vendedores', (t) => {
    t.dropColumn('otp_code');
    t.dropColumn('otp_expires_at');
  });
}
