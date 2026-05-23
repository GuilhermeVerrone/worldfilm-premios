import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import db from '../database/connection';
import { AppError } from '../middlewares/errorHandler';
import { validateCNPJ, formatCNPJ } from '../utils/cnpj';
import { getPagination, paginatedResponse } from '../utils/paginate';

const distribuidorSchema = z.object({
  razao_social: z.string().min(2),
  cnpj: z.string().refine(validateCNPJ, 'CNPJ inválido'),
  responsavel: z.string().min(2),
  email: z.string().email(),
  whatsapp: z.string().min(10),
  regiao: z.string().min(1),
  status: z.enum(['ativo', 'inativo']).optional(),
});

export async function listPublic(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await db('distribuidores')
      .where({ status: 'ativo' })
      .select('id', 'razao_social')
      .orderBy('razao_social');
    res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page, limit, offset } = getPagination(req);
    const { status, regiao, search } = req.query;

    const applyFilters = (q: any) => {
      if (status) q.where({ status });
      if (regiao) q.where({ regiao });
      if (search) {
        const like = `%${search}%`;
        q.where((inner: any) => inner.where('razao_social', 'like', like).orWhere('cnpj', 'like', like));
      }
    };

    const [{ total }] = await db('distribuidores').count('id as total').modify(applyFilters);

    const data = await db('distribuidores')
      .modify(applyFilters)
      .select(
        'distribuidores.*',
        db.raw('(SELECT COUNT(*) FROM vendedores WHERE distribuidor_id = distribuidores.id AND status = "aprovado") as vendedores_ativos'),
      )
      .orderBy('razao_social')
      .limit(limit)
      .offset(offset);

    res.json(paginatedResponse(data, Number(total), page, limit));
  } catch (err) {
    next(err);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const distribuidor = await db('distribuidores').where({ id: req.params.id }).first();
    if (!distribuidor) throw new AppError(404, 'Distribuidor não encontrado');

    const vendedoresAtivos = await db('vendedores')
      .where({ distribuidor_id: req.params.id, status: 'aprovado' })
      .count('id as total')
      .first();

    res.json({ ...distribuidor, vendedores_ativos: Number(vendedoresAtivos?.total ?? 0) });
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = distribuidorSchema.parse(req.body);
    const cnpj = formatCNPJ(body.cnpj);

    const existing = await db('distribuidores').where({ cnpj }).first();
    if (existing) throw new AppError(409, 'CNPJ já cadastrado');

    await db('distribuidores').insert({
      id: db.raw('(UUID())'),
      ...body,
      cnpj,
      status: body.status ?? 'ativo',
    });

    const created = await db('distribuidores').where({ cnpj }).first();
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const distribuidor = await db('distribuidores').where({ id: req.params.id }).first();
    if (!distribuidor) throw new AppError(404, 'Distribuidor não encontrado');

    const body = distribuidorSchema.partial().parse(req.body);
    if (body.cnpj) {
      body.cnpj = formatCNPJ(body.cnpj);
      const dup = await db('distribuidores').where({ cnpj: body.cnpj }).whereNot({ id: req.params.id }).first();
      if (dup) throw new AppError(409, 'CNPJ já cadastrado em outro distribuidor');
    }

    await db('distribuidores').where({ id: req.params.id }).update(body);
    const updated = await db('distribuidores').where({ id: req.params.id }).first();
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

export async function updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { status } = z.object({ status: z.enum(['ativo', 'inativo']) }).parse(req.body);

    const distribuidor = await db('distribuidores').where({ id: req.params.id }).first();
    if (!distribuidor) throw new AppError(404, 'Distribuidor não encontrado');

    await db.transaction(async (trx) => {
      await trx('distribuidores').where({ id: req.params.id }).update({ status });

      if (status === 'inativo') {
        await trx('vendedores')
          .where({ distribuidor_id: req.params.id })
          .whereNotIn('status', ['reprovado', 'bloqueado'])
          .update({ status: 'bloqueado', motivo_reprovacao: 'Distribuidor inativado' });
      }
    });

    res.json({ message: `Distribuidor ${status === 'ativo' ? 'ativado' : 'inativado'} com sucesso` });
  } catch (err) {
    next(err);
  }
}
