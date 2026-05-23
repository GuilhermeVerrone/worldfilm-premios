import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { AppError } from './errorHandler';
import type { JwtPayloadAdmin, JwtPayloadVendedor } from '@worldfilm/shared';

export function authenticateAdmin(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next(new AppError(401, 'Token não fornecido'));
  }

  try {
    const payload = verifyToken<JwtPayloadAdmin>(header.slice(7));
    if (payload.role !== 'admin') return next(new AppError(403, 'Acesso negado'));
    req.admin = payload;
    next();
  } catch {
    next(new AppError(401, 'Token inválido ou expirado'));
  }
}

export function authenticateVendedor(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next(new AppError(401, 'Token não fornecido'));
  }

  try {
    const payload = verifyToken<JwtPayloadVendedor>(header.slice(7));
    if (payload.role !== 'vendedor') return next(new AppError(403, 'Acesso negado'));
    req.vendedor = payload;
    next();
  } catch {
    next(new AppError(401, 'Token inválido ou expirado'));
  }
}
