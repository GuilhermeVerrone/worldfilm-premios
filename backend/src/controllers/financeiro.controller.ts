import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import db from '../database/connection';
import { AppError } from '../middlewares/errorHandler';
import { getPagination, paginatedResponse } from '../utils/paginate';
import { enviarPushENotificacao } from '../services/notificacao.service';

const SALDO_MINIMO = 20;

export async function getSaldo(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const vendedor = await db('vendedores')
      .select('saldo_disponivel', 'saldo_bloqueado')
      .where({ id: req.vendedor!.id })
      .first();

    if (!vendedor) throw new AppError(404, 'Vendedor não encontrado');

    res.json({
      saldo_disponivel: Number(vendedor.saldo_disponivel),
      saldo_bloqueado: Number(vendedor.saldo_bloqueado),
      total: Number(vendedor.saldo_disponivel) + Number(vendedor.saldo_bloqueado),
    });
  } catch (err) {
    next(err);
  }
}

export async function solicitar(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { valor, chave_pix } = z.object({
      valor: z.number().min(SALDO_MINIMO, `Valor mínimo de R$ ${SALDO_MINIMO.toFixed(2)}`),
      chave_pix: z.string().min(1),
    }).parse(req.body);

    const vendedor = await db('vendedores').where({ id: req.vendedor!.id, status: 'aprovado' }).first();
    if (!vendedor) throw new AppError(403, 'Vendedor não autorizado');

    const disponivel = Number(vendedor.saldo_disponivel);
    if (disponivel < SALDO_MINIMO) {
      throw new AppError(400, `Saldo disponível insuficiente (mínimo R$ ${SALDO_MINIMO.toFixed(2)})`);
    }
    if (valor > disponivel) {
      throw new AppError(400, `Valor solicitado maior que o saldo disponível (R$ ${disponivel.toFixed(2)})`);
    }

    const transacaoId = uuidv4();

    await db.transaction(async (trx) => {
      await trx('transacoes').insert({
        id: transacaoId,
        vendedor_id: req.vendedor!.id,
        tipo: 'saque',
        valor,
        status: 'solicitado',
        chave_pix_destino: chave_pix,
      });

      await trx('vendedores')
        .where({ id: req.vendedor!.id })
        .update({ saldo_disponivel: trx.raw('saldo_disponivel - ?', [valor]) });
    });

    await enviarPushENotificacao(
      db,
      req.vendedor!.id,
      'Solicitação recebida! 💳',
      `Seu pagamento de R$ ${valor.toFixed(2).replace('.', ',')} foi solicitado. Prazo: até 3 dias úteis.`,
    );

    const transacao = await db('transacoes').where({ id: transacaoId }).first();
    res.status(201).json(transacao);
  } catch (err) {
    next(err);
  }
}

export async function getExtrato(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page, limit, offset } = getPagination(req);
    const { tipo, data_inicio, data_fim } = req.query;

    let query = db('transacoes')
      .leftJoin('vendas', 'transacoes.venda_id', 'vendas.id')
      .leftJoin('produtos', 'vendas.produto_id', 'produtos.id')
      .leftJoin('campanhas', 'vendas.campanha_id', 'campanhas.id')
      .where('transacoes.vendedor_id', req.vendedor!.id);

    if (tipo) query = query.where('transacoes.tipo', tipo);
    if (data_inicio) query = query.where('transacoes.created_at', '>=', new Date(String(data_inicio)));
    if (data_fim) query = query.where('transacoes.created_at', '<=', new Date(String(data_fim)));

    const [{ total }] = await query.clone().count('transacoes.id as total');

    const rows = await query
      .select(
        'transacoes.id',
        'transacoes.tipo',
        'transacoes.valor',
        'transacoes.status',
        'transacoes.chave_pix_destino',
        'transacoes.comprovante_url',
        'transacoes.created_at',
        'transacoes.pago_em',
        'produtos.nome as produto_nome',
        'campanhas.nome as campanha_nome',
      )
      .orderBy('transacoes.created_at', 'desc')
      .limit(limit)
      .offset(offset);

    const data = rows.map((r) => ({
      ...r,
      descricao: r.tipo === 'credito' && r.produto_nome
        ? `${r.produto_nome} — ${r.campanha_nome}`
        : r.tipo === 'saque'
          ? `Saque via PIX${r.chave_pix_destino ? ` (${r.chave_pix_destino})` : ''}`
          : r.tipo,
    }));

    res.json(paginatedResponse(data, Number(total), page, limit));
  } catch (err) {
    next(err);
  }
}
