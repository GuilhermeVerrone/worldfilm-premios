import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('vendedores', (t) => {
    t.enum('role', ['vendedor', 'admin']).notNullable().defaultTo('vendedor');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('vendedores', (t) => {
    t.dropColumn('role');
  });
}
