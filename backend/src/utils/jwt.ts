import jwt from 'jsonwebtoken';
import { env } from './env';
import type { JwtPayloadAdmin, JwtPayloadVendedor } from '@worldfilm/shared';

export function signAdminToken(payload: JwtPayloadAdmin): string {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: '7d' });
}

export function signVendedorToken(payload: JwtPayloadVendedor): string {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: '7d' });
}

export function signRefreshToken(payload: Record<string, unknown>): string {
  return jwt.sign(payload, env.jwtRefreshSecret, { expiresIn: '30d' });
}

export function verifyToken<T>(token: string): T {
  return jwt.verify(token, env.jwtSecret) as T;
}

export function verifyRefreshToken<T>(token: string): T {
  return jwt.verify(token, env.jwtRefreshSecret) as T;
}
