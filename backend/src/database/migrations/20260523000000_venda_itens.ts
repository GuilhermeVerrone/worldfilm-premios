import type { Knex } from 'knex';
import { v4 as uuidv4 } from 'uuid';

export async function up(knex: Knex): Promise<void> {
  // 1. Create venda_itens (N products per venda)
  await knex.schema.createTable('venda_itens', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('venda_id').notNullable().references('id').inTable('vendas').onDelete('CASCADE');
    t.uuid('produto_id').notNullable().references('id').inTable('produtos').onDelete('RESTRICT');
    t.decimal('metragem', 8, 2).notNullable();
    t.decimal('premio_estimado', 10, 2).notNullable().defaultTo(0);
    t.decimal('premio_apurado', 10, 2).nullable();
    t.index('venda_id');
    t.index('produto_id');
  });

  // 2. Add totals to vendas
  await knex.schema.table('vendas', (t) => {
    t.decimal('premio_estimado_total', 10, 2).notNullable().defaultTo(0);
    t.decimal('premio_apurado_total', 10, 2).nullable();
  });

  // 3. Migrate existing 1:1 rows into venda_itens
  const existing = await knex('vendas').select(
    'id', 'produto_id', 'metragem', 'premio_estimado', 'premio_apurado',
  );
  for (const v of existing) {
    if (v.produto_id) {
      await knex('venda_itens').insert({
        id: uuidv4(),
        venda_id: v.id,
        produto_id: v.produto_id,
        metragem: v.metragem ?? 0,
        premio_estimado: v.premio_estimado ?? 0,
        premio_apurado: v.premio_apurado ?? null,
      });
    }
    await knex('vendas').where({ id: v.id }).update({
      premio_estimado_total: v.premio_estimado ?? 0,
      premio_apurado_total: v.premio_apurado ?? null,
    });
  }

  // 4. Drop FK, index, and old columns from vendas (MySQL)
  await knex.raw('ALTER TABLE vendas DROP CONSTRAINT IF EXISTS vendas_produto_id_foreign');
  await knex.schema.table('vendas', (t) => {
    t.dropIndex(['produto_id']);
    t.dropColumn('produto_id');
    t.dropColumn('metragem');
    t.dropColumn('premio_estimado');
    t.dropColumn('premio_apurado');
  });
}

export async function down(knex: Knex): Promise<void> {
  // Re-add columns to vendas
  await knex.schema.table('vendas', (t) => {
    t.uuid('produto_id').nullable();
    t.decimal('metragem', 8, 2).nullable();
    t.decimal('premio_estimado', 10, 2).notNullable().defaultTo(0);
    t.decimal('premio_apurado', 10, 2).nullable();
  });

  // Migrate back: restore first item per venda
  const itens = await knex('venda_itens').select('*');
  for (const item of itens) {
    const venda = await knex('vendas').where({ id: item.venda_id }).first();
    if (venda && !venda.produto_id) {
      await knex('vendas').where({ id: item.venda_id }).update({
        produto_id: item.produto_id,
        metragem: item.metragem,
        premio_estimado: item.premio_estimado,
        premio_apurado: item.premio_apurado,
      });
    }
  }

  // Restore FK
  await knex.schema.table('vendas', (t) => {
    t.foreign('produto_id').references('id').inTable('produtos').onDelete('RESTRICT');
  });

  // Drop new table and columns
  await knex.schema.dropTableIfExists('venda_itens');
  await knex.schema.table('vendas', (t) => {
    t.dropColumn('premio_estimado_total');
    t.dropColumn('premio_apurado_total');
  });
}
