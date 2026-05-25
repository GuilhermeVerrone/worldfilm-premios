import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import db from '../database/connection';
import { AppError } from '../middlewares/errorHandler';
import { getPagination, paginatedResponse } from '../utils/paginate';
import type { CampanhaSegmentacao } from '@worldfilm/shared';

// ─── schemas ───────────────────────────────────────────────────────────────

const segmentacaoSchema = z.union([
  z.object({ tipo: z.literal('todos') }),
  z.object({ tipo: z.literal('distribuidores'), distribuidores: z.array(z.string().uuid()).min(1) }),
  z.object({ tipo: z.literal('regioes'), regioes: z.array(z.string()).min(1) }),
]);

const premioSchema = z.object({
  produto_id: z.string().uuid(),
  metragem_corte: z.number().positive(),
  valor_premio: z.number().positive(),
});

const campanhaSchema = z.object({
  nome: z.string().min(2),
  tipo: z.enum(['lancamento', 'vendas', 'especial']),
  descricao: z.string().optional(),
  data_inicio: z.string().datetime(),
  data_fim: z.string().datetime(),
  status: z.enum(['rascunho', 'ativa', 'encerrada', 'arquivada']).optional(),
  segmentacao: segmentacaoSchema,
  premios: z.array(premioSchema).min(1),
}).refine((d) => new Date(d.data_fim) > new Date(d.data_inicio), {
  message: 'data_fim deve ser maior que data_inicio',
  path: ['data_fim'],
});

// ─── helpers ───────────────────────────────────────────────────────────────

function parseSeg(raw: unknown): CampanhaSegmentacao {
  return typeof raw === 'string' ? JSON.parse(raw) : (raw as CampanhaSegmentacao);
}

async function getPremios(campanhaId: string) {
  return db('campanha_premios')
    .join('produtos', 'campanha_premios.produto_id', 'produtos.id')
    .select('campanha_premios.*', 'produtos.nome as produto_nome', 'produtos.categoria')
    .where('campanha_premios.campanha_id', campanhaId);
}

async function getStats(campanhaId: string) {
  const [row] = await db('vendas')
    .where({ campanha_id: campanhaId })
    .count('id as total_vendas')
    .sum({ total_premios: db.raw('COALESCE(premio_apurado, 0)') });
  return { total_vendas: Number(row.total_vendas), total_premios: Number(row.total_premios ?? 0) };
}

// ─── admin routes ──────────────────────────────────────────────────────────

export async function adminList(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page, limit, offset } = getPagination(req);
    const { status, tipo, data_inicio, data_fim } = req.query;

    let query = db('campanhas');
    if (status) query = query.where({ status });
    if (tipo) query = query.where({ tipo });
    if (data_inicio) query = query.where('data_inicio', '>=', new Date(String(data_inicio)));
    if (data_fim) query = query.where('data_fim', '<=', new Date(String(data_fim)));

    const [{ total }] = await query.clone().count('id as total');
    const campanhas = await query.orderBy('created_at', 'desc').limit(limit).offset(offset);

    const data = await Promise.all(
      campanhas.map(async (c) => ({ ...c, segmentacao: parseSeg(c.segmentacao), ...(await getStats(c.id)) })),
    );

    res.json(paginatedResponse(data, Number(total), page, limit));
  } catch (err) {
    next(err);
  }
}

export async function adminGetById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const campanha = await db('campanhas').where({ id: req.params.id }).first();
    if (!campanha) throw new AppError(404, 'Campanha não encontrada');

    const [premios, stats] = await Promise.all([getPremios(req.params.id), getStats(req.params.id)]);
    res.json({ campanha: { ...campanha, segmentacao: parseSeg(campanha.segmentacao), premios, ...stats } });
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { premios, ...body } = campanhaSchema.parse(req.body);
    const campanhaId = uuidv4();

    await db.transaction(async (trx) => {
      await trx('campanhas').insert({
        id: campanhaId,
        ...body,
        status: body.status ?? 'rascunho',
        segmentacao: JSON.stringify(body.segmentacao),
      });

      await trx('campanha_premios').insert(
        premios.map((p) => ({
          id: uuidv4(),
          campanha_id: campanhaId,
          produto_id: p.produto_id,
          metragem_corte: p.metragem_corte,
          valor_premio: p.valor_premio,
        })),
      );
    });

    const created = await db('campanhas').where({ id: campanhaId }).first();
    res.status(201).json({
      campanha: {
        ...created,
        segmentacao: parseSeg(created.segmentacao),
        premios: await getPremios(campanhaId),
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const campanha = await db('campanhas').where({ id: req.params.id }).first();
    if (!campanha) throw new AppError(404, 'Campanha não encontrada');
    if (campanha.status === 'encerrada') throw new AppError(400, 'Não é possível editar uma campanha encerrada');

    const { premios, ...body } = campanhaSchema.partial().omit({ premios: true }).and(
      z.object({ premios: z.array(premioSchema).min(1).optional() }),
    ).parse(req.body);

    await db.transaction(async (trx) => {
      const updateData: Record<string, unknown> = { ...body };
      if (body.segmentacao) updateData.segmentacao = JSON.stringify(body.segmentacao);
      await trx('campanhas').where({ id: req.params.id }).update(updateData);

      if (premios) {
        await trx('campanha_premios').where({ campanha_id: req.params.id }).delete();
        await trx('campanha_premios').insert(
          premios.map((p) => ({
            id: uuidv4(),
            campanha_id: req.params.id,
            produto_id: p.produto_id,
            metragem_corte: p.metragem_corte,
            valor_premio: p.valor_premio,
          })),
        );
      }
    });

    const updated = await db('campanhas').where({ id: req.params.id }).first();
    res.json({ campanha: { ...updated, segmentacao: parseSeg(updated.segmentacao), premios: await getPremios(req.params.id) } });
  } catch (err) {
    next(err);
  }
}

const STATUS_TRANSITIONS: Record<string, string[]> = {
  rascunho: ['ativa'],
  ativa: ['encerrada'],
  encerrada: ['arquivada'],
  arquivada: [],
};

export async function updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { status } = z.object({ status: z.enum(['rascunho', 'ativa', 'encerrada', 'arquivada']) }).parse(req.body);

    const campanha = await db('campanhas').where({ id: req.params.id }).first();
    if (!campanha) throw new AppError(404, 'Campanha não encontrada');

    if (!STATUS_TRANSITIONS[campanha.status]?.includes(status)) {
      throw new AppError(400, `Transição inválida: ${campanha.status} → ${status}`);
    }

    await db('campanhas').where({ id: req.params.id }).update({ status });
    res.json({ message: `Status atualizado para "${status}"` });
  } catch (err) {
    next(err);
  }
}

// ─── vendedor routes ───────────────────────────────────────────────────────

function isVisivel(segmentacao: CampanhaSegmentacao, distribuidorId: string, regiao: string): boolean {
  if (segmentacao.tipo === 'todos') return true;
  if (segmentacao.tipo === 'distribuidores') return segmentacao.distribuidores.includes(distribuidorId);
  if (segmentacao.tipo === 'regioes') return segmentacao.regioes.includes(regiao);
  return false;
}

export async function vendedorList(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const vendedor = req.vendedor!;
    const distribuidor = await db('distribuidores').where({ id: vendedor.distribuidor_id }).first();

    const agora = new Date();
    const campanhas = await db('campanhas')
      .where({ status: 'ativa' })
      .where('data_inicio', '<=', agora)
      .where('data_fim', '>=', agora);

    const visiveis = campanhas.filter((c) => isVisivel(parseSeg(c.segmentacao), vendedor.distribuidor_id, distribuidor?.regiao ?? ''));

    const data = await Promise.all(
      visiveis.map(async (c) => {
        const premios = await getPremios(c.id);
        return { ...c, segmentacao: parseSeg(c.segmentacao), premios };
      }),
    );

    res.json({ data });
  } catch (err) {
    next(err);
  }
}

export async function vendedorGetById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const campanha = await db('campanhas').where({ id: req.params.id, status: 'ativa' }).first();
    if (!campanha) throw new AppError(404, 'Campanha não encontrada');

    const vendedorId = req.vendedor!.id;
    const [premios, desempenho, metragemPorProduto] = await Promise.all([
      getPremios(req.params.id),
      db('vendas')
        .where({ campanha_id: req.params.id, vendedor_id: vendedorId })
        .count('id as total_vendas')
        .sum({ total_premio: db.raw('COALESCE(premio_apurado_total, premio_estimado_total, 0)') })
        .first(),
      db('venda_itens')
        .join('vendas', 'venda_itens.venda_id', 'vendas.id')
        .where('vendas.vendedor_id', vendedorId)
        .where('vendas.campanha_id', req.params.id)
        .whereNot('vendas.status', 'reprovada')
        .groupBy('venda_itens.produto_id')
        .select('venda_itens.produto_id')
        .sum('venda_itens.metragem as total_metragem'),
    ]);

    const metragemAcumulada: Record<string, number> = Object.fromEntries(
      metragemPorProduto.map((r: any) => [r.produto_id, Number(r.total_metragem)]),
    );

    res.json({
      ...campanha,
      segmentacao: parseSeg(campanha.segmentacao),
      premios,
      meu_desempenho: {
        total_vendas: Number(desempenho?.total_vendas ?? 0),
        total_premio: Number(desempenho?.total_premio ?? 0),
      },
      metragem_acumulada: metragemAcumulada,
    });
  } catch (err) {
    next(err);
  }
}
