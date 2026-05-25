import { Request, Response, NextFunction } from 'express';
import db from '../database/connection';

export async function getDashboardResumo(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const now = new Date();
    const inicioMes = new Date(now.getFullYear(), now.getMonth(), 1);
    const fimMes = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const [
      [{ total: vendedores_ativos }],
      [{ total: vendedores_pendentes }],
      [{ total: vendas_mes }],
      [{ total: premios_apurados_mes }],
      [{ total: total_pago_mes }],
      [{ total: solicitacoes_pendentes }],
    ] = await Promise.all([
      db('vendedores').where({ status: 'aprovado' }).count('id as total'),
      db('vendedores').where({ status: 'pendente' }).count('id as total'),
      db('vendas')
        .whereBetween('created_at', [inicioMes, fimMes])
        .count('id as total'),
      db('vendas')
        .where({ status: 'aprovada' })
        .whereBetween('validado_em', [inicioMes, fimMes])
        .sum({ total: db.raw('COALESCE(premio_apurado_total, 0)') }),
      db('transacoes')
        .where({ tipo: 'saque', status: 'pago' })
        .whereBetween('pago_em', [inicioMes, fimMes])
        .sum({ total: db.raw('COALESCE(valor, 0)') }),
      db('transacoes').where({ tipo: 'saque', status: 'solicitado' }).count('id as total'),
    ]);

    res.json({
      vendedores_ativos: Number(vendedores_ativos),
      vendedores_pendentes: Number(vendedores_pendentes),
      vendas_mes: Number(vendas_mes),
      premios_apurados_mes: Number(premios_apurados_mes ?? 0),
      total_pago_mes: Number(total_pago_mes ?? 0),
      solicitacoes_pendentes: Number(solicitacoes_pendentes),
    });
  } catch (err) {
    next(err);
  }
}

export async function getDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const [
      [{ total: totalVendedores }],
      [{ total: pendentes }],
      [{ total: totalVendas }],
      [{ total: vendasPendentes }],
      [{ total: totalCampanhas }],
      [{ total: solicitacoesPendentes }],
      vendasPorCampanha,
      atividadeRecente,
    ] = await Promise.all([
      db('vendedores').where({ status: 'aprovado' }).count('id as total'),
      db('vendedores').where({ status: 'pendente' }).count('id as total'),
      db('vendas').count('id as total'),
      db('vendas').where({ status: 'pendente' }).count('id as total'),
      db('campanhas').where({ status: 'ativa' }).count('id as total'),
      db('transacoes').where({ tipo: 'saque', status: 'solicitado' }).count('id as total'),
      db('vendas')
        .join('campanhas', 'vendas.campanha_id', 'campanhas.id')
        .select('campanhas.nome as campanha')
        .count('vendas.id as total')
        .sum('vendas.premio_estimado_total as total_premios')
        .groupBy('campanhas.id', 'campanhas.nome')
        .orderBy('total', 'desc')
        .limit(6),
      db('vendas')
        .join('vendedores', 'vendas.vendedor_id', 'vendedores.id')
        .join('campanhas', 'vendas.campanha_id', 'campanhas.id')
        .select(
          'vendas.id',
          'vendas.status',
          'vendas.created_at',
          'vendas.premio_estimado_total as premio_estimado',
          'vendedores.nome as vendedor',
          'campanhas.nome as campanha',
        )
        .orderBy('vendas.created_at', 'desc')
        .limit(10),
    ]);

    res.json({
      cards: {
        totalVendedores: Number(totalVendedores),
        pendentes: Number(pendentes),
        totalVendas: Number(totalVendas),
        vendasPendentes: Number(vendasPendentes),
        totalCampanhas: Number(totalCampanhas),
        solicitacoesPendentes: Number(solicitacoesPendentes),
      },
      vendasPorCampanha: vendasPorCampanha.map((r: any) => ({
        campanha: r.campanha,
        total: Number(r.total),
        totalPremios: Number(r.total_premios ?? 0),
      })),
      atividadeRecente: atividadeRecente,
    });
  } catch (err) {
    next(err);
  }
}
