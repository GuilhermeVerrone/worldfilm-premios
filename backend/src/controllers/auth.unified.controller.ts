import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import db from '../database/connection';
import { AppError } from '../middlewares/errorHandler';
import { signAdminToken, signVendedorToken, signRefreshToken } from '../utils/jwt';
import { validateCPF, formatCPF } from '../utils/cpf';
import type { JwtPayloadAdmin, JwtPayloadVendedor } from '@worldfilm/shared';

const loginSchema = z.object({
  identifier: z.string().min(1, 'Informe e-mail ou CPF'),
  senha: z.string().min(1, 'Senha obrigatória'),
});

export async function unifiedLogin(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { identifier, senha } = loginSchema.parse(req.body);

    if (identifier.includes('@')) {
      // Admin login by email
      const admin = await db('admins').where({ email: identifier.toLowerCase().trim(), ativo: true }).first();
      if (!admin || !(await bcrypt.compare(senha, admin.senha))) {
        throw new AppError(401, 'Credenciais inválidas');
      }

      const payload: JwtPayloadAdmin = { id: admin.id, email: admin.email, role: 'admin' };
      const token = signAdminToken(payload);
      const refreshToken = signRefreshToken({ id: admin.id, role: 'admin' });

      await db('refresh_tokens').insert({
        id: db.raw('gen_random_uuid()'),
        token: refreshToken,
        owner_type: 'admin',
        owner_id: admin.id,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });

      res.json({
        token,
        refreshToken,
        role: 'admin' as const,
        user: { id: admin.id, nome: admin.nome, email: admin.email, role: admin.role },
      });
    } else {
      // Vendedor login by CPF
      const rawCpf = identifier.replace(/\D/g, '');
      if (!validateCPF(rawCpf)) {
        throw new AppError(401, 'CPF ou senha inválidos');
      }
      const cpfFormatted = formatCPF(rawCpf);

      const vendedor = await db('vendedores').where({ cpf: cpfFormatted }).first();
      if (!vendedor || !(await bcrypt.compare(senha, vendedor.senha))) {
        throw new AppError(401, 'CPF ou senha inválidos');
      }

      if (vendedor.status === 'bloqueado') {
        res.status(403).json({ status: 'bloqueado' });
        return;
      }
      if (vendedor.status === 'pendente' || vendedor.status === 'em_analise') {
        res.status(403).json({ status: 'pendente' });
        return;
      }
      if (vendedor.status === 'reprovado') {
        res.status(403).json({ status: 'reprovado', motivo: vendedor.motivo_reprovacao });
        return;
      }

      const { senha: _, otp_code: __, otp_expires_at: ___, ...safeVendedor } = vendedor;

      // Vendedores with admin role get an admin JWT so they can access the admin panel
      if (vendedor.role === 'admin') {
        const payload: JwtPayloadAdmin = { id: vendedor.id, email: vendedor.cpf, role: 'admin' };
        const token = signAdminToken(payload);
        const refreshToken = signRefreshToken({ id: vendedor.id, role: 'admin' });

        await db('refresh_tokens').insert({
          id: db.raw('gen_random_uuid()'),
          token: refreshToken,
          owner_type: 'admin',
          owner_id: vendedor.id,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        });

        res.json({ token, refreshToken, role: 'admin' as const, user: safeVendedor });
        return;
      }

      const payload: JwtPayloadVendedor = {
        id: vendedor.id,
        nome: vendedor.nome,
        distribuidor_id: vendedor.distribuidor_id,
        role: 'vendedor',
      };
      const token = signVendedorToken(payload);
      const refreshToken = signRefreshToken({ id: vendedor.id, role: 'vendedor' });

      await db('refresh_tokens').insert({
        id: db.raw('gen_random_uuid()'),
        token: refreshToken,
        owner_type: 'vendedor',
        owner_id: vendedor.id,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });

      res.json({
        token,
        refreshToken,
        role: 'vendedor' as const,
        user: safeVendedor,
      });
    }
  } catch (err) {
    next(err);
  }
}
