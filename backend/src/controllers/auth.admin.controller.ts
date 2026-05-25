import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import db from '../database/connection';
import { AppError } from '../middlewares/errorHandler';
import { signAdminToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';
import type { JwtPayloadAdmin } from '@worldfilm/shared';

const loginSchema = z.object({
  email: z.string().email(),
  senha: z.string().min(1),
});

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, senha } = loginSchema.parse(req.body);

    const admin = await db('admins').where({ email, ativo: true }).first();
    if (!admin || !(await bcrypt.compare(senha, admin.senha))) {
      throw new AppError(401, 'Credenciais inválidas');
    }

    const payload: JwtPayloadAdmin = { id: admin.id, email: admin.email, role: 'admin' };
    const token = signAdminToken(payload);
    const refreshToken = signRefreshToken({ id: admin.id, role: 'admin' });

    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await db('refresh_tokens').insert({
      id: db.raw('gen_random_uuid()'),
      token: refreshToken,
      owner_type: 'admin',
      owner_id: admin.id,
      expires_at: expiresAt,
    });

    res.json({
      token,
      refreshToken,
      admin: { id: admin.id, nome: admin.nome, email: admin.email, role: admin.role },
    });
  } catch (err) {
    next(err);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { refreshToken } = z.object({ refreshToken: z.string() }).parse(req.body);

    const stored = await db('refresh_tokens')
      .where({ token: refreshToken, owner_type: 'admin', revogado: false })
      .where('expires_at', '>', new Date())
      .first();

    if (!stored) throw new AppError(401, 'Refresh token inválido ou expirado');

    verifyRefreshToken(refreshToken); // validates signature

    const admin = await db('admins').where({ id: stored.owner_id, ativo: true }).first();
    if (!admin) throw new AppError(401, 'Admin não encontrado');

    const payload: JwtPayloadAdmin = { id: admin.id, email: admin.email, role: 'admin' };
    const newToken = signAdminToken(payload);
    const newRefresh = signRefreshToken({ id: admin.id, role: 'admin' });

    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await db.transaction(async (trx) => {
      await trx('refresh_tokens').where({ id: stored.id }).update({ revogado: true });
      await trx('refresh_tokens').insert({
        id: trx.raw('gen_random_uuid()'),
        token: newRefresh,
        owner_type: 'admin',
        owner_id: admin.id,
        expires_at: expiresAt,
      });
    });

    res.json({ token: newToken, refreshToken: newRefresh });
  } catch (err) {
    next(err);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { refreshToken } = z.object({ refreshToken: z.string() }).parse(req.body);
    await db('refresh_tokens').where({ token: refreshToken }).update({ revogado: true });
    res.json({ message: 'Logout realizado com sucesso' });
  } catch (err) {
    next(err);
  }
}
