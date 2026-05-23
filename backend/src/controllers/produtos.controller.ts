import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import db from '../database/connection';
import { AppError } from '../middlewares/errorHandler';
import { getPagination, paginatedResponse } from '../utils/paginate';

const produtoSchema = z.object({
  nome: z.string().min(2),
  linha: z.string().min(1),
  categoria: z.enum(['pelicula', 'ppf', 'outro']),
  espessura: z.string().optional(),
  largura: z.string().optional(),
  ativo: z.boolean().optional(),
});

export async function adminList(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page, limit, offset } = getPagination(req);
    const { categoria, ativo } = req.query;

    let query = db('produtos');
    if (categoria) query = query.where({ categoria });
    if (ativo !== undefined) query = query.where({ ativo: ativo === 'true' });

    const [{ total }] = await query.clone().count('id as total');
    const data = await query.orderBy('nome').limit(limit).offset(offset);

    res.json(paginatedResponse(data, Number(total), page, limit));
  } catch (err) {
    next(err);
  }
}

export async function adminGetById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const produto = await db('produtos').where({ id: req.params.id }).first();
    if (!produto) throw new AppError(404, 'Produto não encontrado');
    res.json(produto);
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = produtoSchema.parse(req.body);
    await db('produtos').insert({ id: db.raw('(UUID())'), ...body, ativo: body.ativo ?? true });
    const created = await db('produtos').orderBy('created_at', 'desc').first();
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const produto = await db('produtos').where({ id: req.params.id }).first();
    if (!produto) throw new AppError(404, 'Produto não encontrado');

    const body = produtoSchema.partial().parse(req.body);
    await db('produtos').where({ id: req.params.id }).update(body);
    res.json(await db('produtos').where({ id: req.params.id }).first());
  } catch (err) {
    next(err);
  }
}

export async function updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { ativo } = z.object({ ativo: z.boolean() }).parse(req.body);
    const produto = await db('produtos').where({ id: req.params.id }).first();
    if (!produto) throw new AppError(404, 'Produto não encontrado');
    await db('produtos').where({ id: req.params.id }).update({ ativo });
    res.json({ message: `Produto ${ativo ? 'ativado' : 'inativado'} com sucesso` });
  } catch (err) {
    next(err);
  }
}

// Vendedor: only active products
export async function vendedorList(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { categoria } = req.query;
    let query = db('produtos').where({ ativo: true });
    if (categoria) query = query.where({ categoria });
    const data = await query.orderBy('nome');
    res.json({ data });
  } catch (err) {
    next(err);
  }
}
