import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import db from '../database/connection';
import { AppError } from '../middlewares/errorHandler';
import { getPagination, paginatedResponse } from '../utils/paginate';
import { calcularPremio } from '../services/premio.service';
import { enviarPushENotificacao } from '../services/notificacao.service';

const createVendaSchema = z.object({
  campanha_id: z.string().uuid(),
  produto_id: z.string().uuid(),
  metragem: z.number().positive(),
  placa_veiculo: z.string().optional(),
  nome_cliente: z.string().optional(),
  cpf_cliente: z.string().optional(),
});

function formatBRL(value: number): string {
  return value.toFixed(2).replace('.', ',');
}

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

    // 2. Produto participa da campanha
    const regra = await db('campanha_premios')
      .where({ campanha_id: body.campanha_id, produto_id: body.produto_id })
      .first();
    if (!regra) throw new AppError(400, 'Produto não participa desta campanha');

    // 3. Duplicidade por placa no mesmo dia
    if (body.placa_veiculo) {
      const inicioDia = new Date(agora); inicioDia.setHours(0, 0, 0, 0);
      const fimDia = new Date(agora); fimDia.setHours(23, 59, 59, 999);

      const dupPlaca = await db('vendas')
        .where({
          vendedor_id: vendedorId,
          produto_id: body.produto_id,
          placa_veiculo: body.placa_veiculo,
        })
        .whereBetween('created_at', [inicioDia, fimDia])
        .first();

      if (dupPlaca) throw new AppError(409, 'Venda com esta placa e produto já registrada hoje');
    }

    // 4. Duplicidade por tempo (60 min)
    const sessenta = new Date(agora.getTime() - 60 * 60 * 1000);
    const dupTempo = await db('vendas')
      .where({ vendedor_id: vendedorId, produto_id: body.produto_id, metragem: body.metragem })
      .where('created_at', '>=', sessenta)
      .first();
    if (dupTempo) throw new AppError(409, 'Venda idêntica registrada nos últimos 60 minutos');

    // 5. Calcular prêmio estimado
    const premio_estimado = calcularPremio(
      body.metragem,
      Number(regra.metragem_corte),
      Number(regra.valor_premio),
    );

    // 6. Criar venda
    const vendaId = uuidv4();
    await db('vendas').insert({
      id: vendaId,
      vendedor_id: vendedorId,
      campanha_id: body.campanha_id,
      produto_id: body.produto_id,
      metragem: body.metragem,
      placa_veiculo: body.placa_veiculo ?? null,
      nome_cliente: body.nome_cliente ?? null,
      cpf_cliente: body.cpf_cliente ?? null,
      premio_estimado,
      status: 'pendente',
    });

    // 7. Push
    await enviarPushENotificacao(
      db,
      vendedorId,
      'Venda registrada! ✅',
      `Seu prêmio estimado é R$ ${formatBRL(premio_estimado)}. Aguarde a validação em até 3 dias úteis.`,
    );

    const venda = await db('vendas').where({ id: vendaId }).first();
    res.status(201).json(venda);
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
      .join('produtos', 'vendas.produto_id', 'produtos.id')
      .where('vendas.vendedor_id', vendedorId);

    if (status) query = query.where('vendas.status', status);
    if (campanha_id) query = query.where('vendas.campanha_id', campanha_id);
    if (data_inicio) query = query.where('vendas.created_at', '>=', new Date(String(data_inicio)));
    if (data_fim) query = query.where('vendas.created_at', '<=', new Date(String(data_fim)));

    const [{ total }] = await query.clone().count('vendas.id as total');

    const data = await query
      .select(
        'vendas.*',
        'campanhas.nome as campanha_nome',
        'produtos.nome as produto_nome',
      )
      .orderBy('vendas.created_at', 'desc')
      .limit(limit)
      .offset(offset);

    res.json(paginatedResponse(data, Number(total), page, limit));
  } catch (err) {
    next(err);
  }
}

export async function getVendaById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const venda = await db('vendas')
      .join('campanhas', 'vendas.campanha_id', 'campanhas.id')
      .join('produtos', 'vendas.produto_id', 'produtos.id')
      .select('vendas.*', 'campanhas.nome as campanha_nome', 'produtos.nome as produto_nome')
      .where('vendas.id', req.params.id)
      .where('vendas.vendedor_id', req.vendedor!.id)
      .first();

    if (!venda) throw new AppError(404, 'Venda não encontrada');
    res.json(venda);
  } catch (err) {
    next(err);
  }
}
