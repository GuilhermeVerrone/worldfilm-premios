import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.name, message: err.message });
    return;
  }

  if (err instanceof ZodError) {
    const first = err.errors[0];
    res.status(400).json({ error: 'ValidationError', message: first?.message ?? 'Dados inválidos', fields: err.errors });
    return;
  }

  console.error('[500]', err.message, err.stack?.split('\n')[1]?.trim());
  res.status(500).json({ error: 'InternalServerError', message: 'Erro interno do servidor' });
}
