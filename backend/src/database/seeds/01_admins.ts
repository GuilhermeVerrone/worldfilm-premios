import type { Knex } from 'knex';
import bcrypt from 'bcrypt';

export async function seed(knex: Knex): Promise<void> {
  await knex('admins').del();

  const senha = await bcrypt.hash('Admin@123', 12);

  await knex('admins').insert([
    {
      id: knex.raw('gen_random_uuid()'),
      nome: 'Admin World Film',
      email: 'admin@worldfilm.com.br',
      senha,
      role: 'super_admin',
      ativo: true,
    },
  ]);
}
