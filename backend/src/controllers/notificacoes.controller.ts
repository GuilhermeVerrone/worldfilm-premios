import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import db from '../database/connection';
import { AppError } from '../middlewares/errorHandler';
import { getPagination, paginatedResponse } from '../utils/paginate';
import {
  enviarPushParaTodos,
  enviarPushParaDistribuidor,
  enviarPushENotificacao,
  salvarNotificacao,
} from '../services/notificacao.service';

// ─── vendedor ──────────────────────────────────────────────────────────────

export async function listNotificacoes(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page, limit, offset } = getPagination(req);
    const vendedorId = req.vendedor!.id;

    // Notificações do próprio vendedor + broadcasts (vendedor_id IS NULL)
    const query = db('notificacoes').where((q) =>
      q.where({ vendedor_id: vendedorId }).orWhereNull('vendedor_id'),
    );

    const [{ total }] = await query.clone().count('id as total');
    const data = await query
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset);

    res.json(paginatedResponse(data, Number(total), page, limit));
  } catch (err) {
    next(err);
  }
}

export async function marcarLida(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const vendedorId = req.vendedor!.id;

    const notif = await db('notificacoes')
      .where({ id: req.params.id })
      .where((q) => q.where({ vendedor_id: vendedorId }).orWhereNull('vendedor_id'))
      .first();

    if (!notif) throw new AppError(404, 'Notificação não encontrada');

    await db('notificacoes').where({ id: req.params.id }).update({ lida: true });
    res.json({ message: 'Notificação marcada como lida' });
  } catch (err) {
    next(err);
  }
}

export async function marcarTodasLidas(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const vendedorId = req.vendedor!.id;

    await db('notificacoes')
      .where((q) => q.where({ vendedor_id: vendedorId }).orWhereNull('vendedor_id'))
      .update({ lida: true });

    res.json({ message: 'Todas as notificações marcadas como lidas' });
  } catch (err) {
    next(err);
  }
}

export async function countNaoLidas(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const vendedorId = req.vendedor!.id;

    const [{ total }] = await db('notificacoes')
      .where({ lida: false })
      .where((q) => q.where({ vendedor_id: vendedorId }).orWhereNull('vendedor_id'))
      .count('id as total');

    res.json({ count: Number(total) });
  } catch (err) {
    next(err);
  }
}

// ─── admin: histórico de broadcasts ────────────────────────────────────────

export async function historicoNotificacoes(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await db('notificacoes')
      .whereNull('vendedor_id')
      .orderBy('created_at', 'desc')
      .limit(10)
      .select('id', 'titulo', 'corpo', 'created_at');
    res.json(data);
  } catch (err) {
    next(err);
  }
}

// ─── admin: envio manual ───────────────────────────────────────────────────

const enviarSchema = z.object({
  titulo: z.string().min(1),
  corpo: z.string().min(1),
  destinatario: z.enum(['todos', 'distribuidor', 'vendedor']),
  destinatario_id: z.string().uuid().optional(),
});

export async function enviarManual(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = enviarSchema.parse(req.body);

    if (body.destinatario !== 'todos' && !body.destinatario_id) {
      throw new AppError(400, 'destinatario_id obrigatório para este tipo de destinatário');
    }

    if (body.destinatario === 'todos') {
      await Promise.all([
        enviarPushParaTodos(body.titulo, body.corpo),
        salvarNotificacao(db, null, body.titulo, body.corpo), // broadcast
      ]);
    } else if (body.destinatario === 'distribuidor') {
      await Promise.all([
        enviarPushParaDistribuidor(body.destinatario_id!, body.titulo, body.corpo),
        // Salvar para cada vendedor do distribuidor
        db('vendedores')
          .where({ distribuidor_id: body.destinatario_id!, status: 'aprovado' })
          .select('id')
          .then((vendedores) =>
            Promise.all(
              vendedores.map((v) => salvarNotificacao(db, v.id, body.titulo, body.corpo)),
            ),
          ),
      ]);
    } else {
      // vendedor específico
      await enviarPushENotificacao(db, body.destinatario_id!, body.titulo, body.corpo);
    }

    res.json({ message: 'Notificação enviada com sucesso' });
  } catch (err) {
    next(err);
  }
}
