import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // admins
  await knex.schema.createTable('admins', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('(UUID())'));
    t.string('nome', 100).notNullable();
    t.string('email', 150).notNullable().unique();
    t.string('senha', 255).notNullable();
    t.enum('role', ['super_admin', 'financeiro', 'operacional', 'leitura']).notNullable().defaultTo('operacional');
    t.boolean('ativo').notNullable().defaultTo(true);
    t.timestamps(true, true);
  });

  // distribuidores
  await knex.schema.createTable('distribuidores', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('(UUID())'));
    t.string('razao_social', 200).notNullable();
    t.string('cnpj', 18).notNullable().unique();
    t.string('responsavel', 100).notNullable();
    t.string('email', 150).notNullable();
    t.string('whatsapp', 20).notNullable();
    t.string('regiao', 50).notNullable();
    t.enum('status', ['ativo', 'inativo']).notNullable().defaultTo('ativo');
    t.timestamps(true, true);

    t.index('status');
    t.index('regiao');
  });

  // vendedores
  await knex.schema.createTable('vendedores', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('(UUID())'));
    t.uuid('distribuidor_id').notNullable().references('id').inTable('distribuidores').onDelete('RESTRICT');
    t.string('nome', 200).notNullable();
    t.string('cpf', 14).notNullable().unique();
    t.string('cnpj', 18).nullable();
    t.string('chave_pix', 150).notNullable();
    t.string('whatsapp', 20).notNullable();
    t.string('senha', 255).notNullable();
    t.enum('status', ['pendente', 'em_analise', 'aprovado', 'reprovado', 'bloqueado']).notNullable().defaultTo('pendente');
    t.text('motivo_reprovacao').nullable();
    t.integer('tentativas_cadastro').notNullable().defaultTo(0);
    t.decimal('saldo_disponivel', 10, 2).notNullable().defaultTo(0);
    t.decimal('saldo_bloqueado', 10, 2).notNullable().defaultTo(0);
    t.string('fcm_token', 500).nullable();
    t.timestamps(true, true);

    t.index('distribuidor_id');
    t.index('cpf');
    t.index('status');
  });

  // produtos
  await knex.schema.createTable('produtos', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('(UUID())'));
    t.string('nome', 200).notNullable();
    t.string('linha', 100).notNullable();
    t.enum('categoria', ['pelicula', 'ppf', 'outro']).notNullable();
    t.string('espessura', 20).nullable();
    t.string('largura', 20).nullable();
    t.boolean('ativo').notNullable().defaultTo(true);

    t.index('categoria');
    t.index('ativo');
  });

  // campanhas
  await knex.schema.createTable('campanhas', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('(UUID())'));
    t.string('nome', 200).notNullable();
    t.enum('tipo', ['lancamento', 'vendas', 'especial']).notNullable();
    t.text('descricao').nullable();
    t.timestamp('data_inicio').notNullable();
    t.timestamp('data_fim').notNullable();
    t.string('regulamento_url', 500).nullable();
    t.enum('status', ['rascunho', 'ativa', 'encerrada', 'arquivada']).notNullable().defaultTo('rascunho');
    t.json('segmentacao').notNullable();
    t.timestamp('created_at').defaultTo(knex.fn.now());

    t.index('status');
    t.index('data_inicio');
    t.index('data_fim');
  });

  // campanha_premios
  await knex.schema.createTable('campanha_premios', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('(UUID())'));
    t.uuid('campanha_id').notNullable().references('id').inTable('campanhas').onDelete('CASCADE');
    t.uuid('produto_id').notNullable().references('id').inTable('produtos').onDelete('RESTRICT');
    t.decimal('metragem_corte', 8, 2).notNullable();
    t.decimal('valor_premio', 10, 2).notNullable();

    t.index('campanha_id');
    t.index('produto_id');
    t.unique(['campanha_id', 'produto_id']);
  });

  // vendas
  await knex.schema.createTable('vendas', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('(UUID())'));
    t.uuid('vendedor_id').notNullable().references('id').inTable('vendedores').onDelete('RESTRICT');
    t.uuid('campanha_id').notNullable().references('id').inTable('campanhas').onDelete('RESTRICT');
    t.uuid('produto_id').notNullable().references('id').inTable('produtos').onDelete('RESTRICT');
    t.decimal('metragem', 8, 2).notNullable();
    t.string('placa_veiculo', 10).nullable();
    t.string('nome_cliente', 200).nullable();
    t.string('cpf_cliente', 14).nullable();
    t.decimal('premio_estimado', 10, 2).notNullable().defaultTo(0);
    t.decimal('premio_apurado', 10, 2).nullable();
    t.enum('status', ['pendente', 'em_analise', 'aprovada', 'reprovada', 'cancelada']).notNullable().defaultTo('pendente');
    t.text('motivo_reprovacao').nullable();
    t.uuid('validado_por').nullable().references('id').inTable('admins').onDelete('SET NULL');
    t.timestamp('validado_em').nullable();
    t.timestamps(true, true);

    t.index('vendedor_id');
    t.index('campanha_id');
    t.index('produto_id');
    t.index('status');
    t.index('created_at');
  });

  // transacoes
  await knex.schema.createTable('transacoes', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('(UUID())'));
    t.uuid('vendedor_id').notNullable().references('id').inTable('vendedores').onDelete('RESTRICT');
    t.uuid('venda_id').nullable().references('id').inTable('vendas').onDelete('SET NULL');
    t.enum('tipo', ['credito', 'saque', 'estorno']).notNullable();
    t.decimal('valor', 10, 2).notNullable();
    t.enum('status', ['pendente', 'bloqueado', 'disponivel', 'em_processamento', 'pago']).notNullable().defaultTo('pendente');
    t.string('chave_pix_destino', 150).nullable();
    t.string('comprovante_url', 500).nullable();
    t.timestamp('data_liberacao').nullable();
    t.uuid('pago_por').nullable().references('id').inTable('admins').onDelete('SET NULL');
    t.timestamp('pago_em').nullable();
    t.timestamps(true, true);

    t.index('vendedor_id');
    t.index('venda_id');
    t.index('status');
    t.index('data_liberacao');
  });

  // notificacoes
  await knex.schema.createTable('notificacoes', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('(UUID())'));
    t.uuid('vendedor_id').nullable().references('id').inTable('vendedores').onDelete('CASCADE');
    t.string('titulo', 200).notNullable();
    t.text('corpo').notNullable();
    t.enum('tipo', ['push', 'in_app']).notNullable().defaultTo('in_app');
    t.boolean('lida').notNullable().defaultTo(false);
    t.timestamp('created_at').defaultTo(knex.fn.now());

    t.index('vendedor_id');
    t.index('lida');
    t.index('created_at');
  });

  // refresh_tokens
  await knex.schema.createTable('refresh_tokens', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('(UUID())'));
    t.string('token', 500).notNullable().unique();
    t.enum('owner_type', ['admin', 'vendedor']).notNullable();
    t.uuid('owner_id').notNullable();
    t.timestamp('expires_at').notNullable();
    t.boolean('revogado').notNullable().defaultTo(false);
    t.timestamp('created_at').defaultTo(knex.fn.now());

    t.index('token');
    t.index(['owner_type', 'owner_id']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('refresh_tokens');
  await knex.schema.dropTableIfExists('notificacoes');
  await knex.schema.dropTableIfExists('transacoes');
  await knex.schema.dropTableIfExists('vendas');
  await knex.schema.dropTableIfExists('campanha_premios');
  await knex.schema.dropTableIfExists('campanhas');
  await knex.schema.dropTableIfExists('produtos');
  await knex.schema.dropTableIfExists('vendedores');
  await knex.schema.dropTableIfExists('distribuidores');
  await knex.schema.dropTableIfExists('admins');
}
