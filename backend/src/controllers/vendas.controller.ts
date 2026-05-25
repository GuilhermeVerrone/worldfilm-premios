import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import db from '../database/connection';
import { AppError } from '../middlewares/errorHandler';
import { getPagination, paginatedResponse } from '../utils/paginate';
import { calcularPremio } from '../services/premio.service';
import { enviarPushENotificacao } from '../services/notificacao.service';

function formatBRL(value: number): string {
  return value.toFixed(2).replace('.', ',');
}

// Schema unificado: 1 venda com N itens
const createVendaSchema = z.object({
  campanha_id: z.string().uuid(),
  placa_veiculo: z.string().optional(),
  nome_cliente: z.string().optional(),
  cpf_cliente: z.string().optional(),
  itens: z.array(z.object({
    produto_id: z.string().min(1),
    metragem: z.number().positive(),
  })).min(1),
});

// Rota legada /vendas/lote — mesmo handler
export { createVenda as createVendaLote };

export async function createVenda(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = createVendaSchema.parse(req.body);
    const vendedorId = req.vendedor!.id;
    const agora = new Date();

    // 1. Campanha ativa e no período
    const campanha = await db('campanhas')
      .where({ id: body.campanha_id, status: 'ativa' })
      .where('data_inicio', '<=', agora)
      .where('data_fim', '>=', agora)
      .first();
    if (!campanha) throw new AppError(400, 'Campanha não encontrada ou fora do período de vigência');

    // 2. Validar cada item e calcular prêmios
    type ItemProcessado = { produto_id: string; metragem: number; premio_estimado: number };
    const itensProcessados: ItemProcessado[] = [];
    let premioTotal = 0;

    for (const item of body.itens) {
      const regra = await db('campanha_premios')
        .where({ campanha_id: body.campanha_id, produto_id: item.produto_id })
        .first();
      if (!regra) throw new AppError(400, `Produto ${item.produto_id} não participa desta campanha`);

      // Duplicidade por tempo (60 min) na tabela de itens
      const sessenta = new Date(agora.getTime() - 60 * 60 * 1000);
      const dupTempo = await db('venda_itens')
        .join('vendas', 'venda_itens.venda_id', 'vendas.id')
        .where('vendas.vendedor_id', vendedorId)
        .where('venda_itens.produto_id', item.produto_id)
        .where('venda_itens.metragem', item.metragem)
        .where('vendas.created_at', '>=', sessenta)
        .first();
      if (dupTempo) throw new AppError(409, `Venda idêntica para este produto registrada nos últimos 60 minutos`);

      // Metragem acumulada anterior (exclui reprovadas) para calcular prêmio incremental
      const { total_anterior } = await db('venda_itens')
        .join('vendas', 'venda_itens.venda_id', 'vendas.id')
        .where('vendas.vendedor_id', vendedorId)
        .where('vendas.campanha_id', body.campanha_id)
        .where('venda_itens.produto_id', item.produto_id)
        .whereNot('vendas.status', 'reprovada')
        .sum('venda_itens.metragem as total_anterior')
        .first() as any;

      const metragemAnterior = Number(total_anterior ?? 0);
      const corte = Number(regra.metragem_corte);
      const valor = Number(regra.valor_premio);
      const premio_estimado = calcularPremio(metragemAnterior + item.metragem, corte, valor)
        - calcularPremio(metragemAnterior, corte, valor);

      premioTotal += premio_estimado;
      itensProcessados.push({ produto_id: item.produto_id, metragem: item.metragem, premio_estimado });
    }

    // 3. Criar 1 venda + N itens em transação
    const vendaId = uuidv4();
    await db.transaction(async (trx) => {
      await trx('vendas').insert({
        id: vendaId,
        vendedor_id: vendedorId,
        campanha_id: body.campanha_id,
        placa_veiculo: body.placa_veiculo ?? null,
        nome_cliente: body.nome_cliente ?? null,
        cpf_cliente: body.cpf_cliente ?? null,
        premio_estimado_total: premioTotal,
        status: 'pendente',
      });

      for (const item of itensProcessados) {
        await trx('venda_itens').insert({
          id: uuidv4(),
          venda_id: vendaId,
          produto_id: item.produto_id,
          metragem: item.metragem,
          premio_estimado: item.premio_estimado,
        });
      }
    });

    // 4. Push
    await enviarPushENotificacao(
      db,
      vendedorId,
      'Venda registrada! ✅',
      `Prêmio estimado: R$ ${formatBRL(premioTotal)}. Aguarde a validação em até 3 dias úteis.`,
    );

    const venda = await db('vendas').where({ id: vendaId }).first();
    const itens = await db('venda_itens')
      .join('produtos', 'venda_itens.produto_id', 'produtos.id')
      .select('venda_itens.*', 'produtos.nome as produto_nome')
      .where('venda_itens.venda_id', vendaId);

    res.status(201).json({ ...venda, itens });
  } catch (err) {
    next(err);
  }
}

export async function listVendas(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page, limit, offset } = getPagination(req);
    const { status, campanha_id, data_inicio, data_fim } = req.query;
    const vendedorId = req.vendedor!.id;

    let query = db('vendas')
      .join('campanhas', 'vendas.campanha_id', 'campanhas.id')
      .where('vendas.vendedor_id', vendedorId);

    if (status) query = query.where('vendas.status', status);
    if (campanha_id) query = query.where('vendas.campanha_id', campanha_id);
    if (data_inicio) query = query.where('vendas.created_at', '>=', new Date(String(data_inicio)));
    if (data_fim) query = query.where('vendas.created_at', '<=', new Date(String(data_fim)));

    const [{ total }] = await query.clone().count('vendas.id as total');

    const vendas = await query
      .select(
        'vendas.id as venda_id',
        'vendas.status',
        'vendas.created_at',
        'vendas.campanha_id',
        'campanhas.nome as campanha_nome',
      )
      .orderBy('vendas.created_at', 'desc')
      .limit(limit)
      .offset(offset);

    const vendaIds = vendas.map((v: any) => v.venda_id);
    const itens = vendaIds.length > 0
      ? await db('venda_itens')
          .join('produtos', 'venda_itens.produto_id', 'produtos.id')
          .whereIn('venda_itens.venda_id', vendaIds)
          .select(
            'venda_itens.id',
            'venda_itens.venda_id',
            'venda_itens.metragem',
            'venda_itens.premio_estimado',
            'produtos.nome as produto_nome',
          )
      : [];

    // Group itens by venda_id and nest inside each venda
    const itensPorVenda: Record<string, any[]> = {};
    for (const item of itens as any[]) {
      if (!itensPorVenda[item.venda_id]) itensPorVenda[item.venda_id] = [];
      itensPorVenda[item.venda_id].push(item);
    }

    const enriched = vendas.map((v: any) => ({
      id: v.venda_id,
      status: v.status,
      created_at: v.created_at,
      campanha_id: v.campanha_id,
      campanha_nome: v.campanha_nome,
      itens: itensPorVenda[v.venda_id] ?? [],
    }));

    res.json(paginatedResponse(enriched, Number(total), page, limit));
  } catch (err) {
    next(err);
  }
}

export async function getVendaById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const venda = await db('vendas')
      .join('campanhas', 'vendas.campanha_id', 'campanhas.id')
      .select('vendas.*', 'campanhas.nome as campanha_nome')
      .where('vendas.id', req.params.id)
      .where('vendas.vendedor_id', req.vendedor!.id)
      .first();

    if (!venda) throw new AppError(404, 'Venda não encontrada');

    const itens = await db('venda_itens')
      .join('produtos', 'venda_itens.produto_id', 'produtos.id')
      .select('venda_itens.*', 'produtos.nome as produto_nome')
      .where('venda_itens.venda_id', req.params.id);

    res.json({ ...venda, itens });
  } catch (err) {
    next(err);
  }
}
