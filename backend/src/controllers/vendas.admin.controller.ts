import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import ExcelJS from 'exceljs';
import db from '../database/connection';
import { AppError } from '../middlewares/errorHandler';
import { getPagination, paginatedResponse } from '../utils/paginate';
import { calcularPremio } from '../services/premio.service';
import { enviarPushENotificacao } from '../services/notificacao.service';

function formatDate(date: Date | string | null): string {
  if (!date) return '';
  const d = new Date(date);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatBRL(value: number | null): string {
  if (value === null || value === undefined) return '';
  return `R$ ${Number(value).toFixed(2).replace('.', ',')}`;
}

// ─── listagem ──────────────────────────────────────────────────────────────

export async function adminList(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page, limit, offset } = getPagination(req);
    const { status, campanha_id, distribuidor_id, vendedor_id, data_inicio, data_fim } = req.query;

    let query = db('vendas')
      .join('vendedores', 'vendas.vendedor_id', 'vendedores.id')
      .join('distribuidores', 'vendedores.distribuidor_id', 'distribuidores.id')
      .join('produtos', 'vendas.produto_id', 'produtos.id')
      .join('campanhas', 'vendas.campanha_id', 'campanhas.id');

    if (status) query = query.where('vendas.status', status);
    if (campanha_id) query = query.where('vendas.campanha_id', campanha_id);
    if (distribuidor_id) query = query.where('vendedores.distribuidor_id', distribuidor_id);
    if (vendedor_id) query = query.where('vendas.vendedor_id', vendedor_id);
    if (data_inicio) query = query.where('vendas.created_at', '>=', new Date(String(data_inicio)));
    if (data_fim) query = query.where('vendas.created_at', '<=', new Date(String(data_fim)));

    const [{ total }] = await query.clone().count('vendas.id as total');

    const data = await query
      .select(
        'vendas.id',
        'vendas.metragem',
        'vendas.premio_estimado',
        'vendas.premio_apurado',
        'vendas.status',
        'vendas.created_at',
        'vendas.validado_em',
        'vendedores.nome as vendedor_nome',
        'vendedores.cpf as vendedor_cpf',
        'distribuidores.razao_social as distribuidor_nome',
        'produtos.nome as produto_nome',
        'campanhas.nome as campanha_nome',
      )
      .orderBy('vendas.created_at', 'asc')
      .limit(limit)
      .offset(offset);

    res.json(paginatedResponse(data, Number(total), page, limit));
  } catch (err) {
    next(err);
  }
}

// ─── aprovar ───────────────────────────────────────────────────────────────

export async function aprovar(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { metragem_ajustada } = z
      .object({ metragem_ajustada: z.number().positive().optional() })
      .parse(req.body);

    const venda = await db('vendas').where({ id: req.params.id }).first();
    if (!venda) throw new AppError(404, 'Venda não encontrada');
    if (!['pendente', 'em_analise'].includes(venda.status)) {
      throw new AppError(400, `Venda não pode ser aprovada com status "${venda.status}"`);
    }

    const regra = await db('campanha_premios')
      .where({ campanha_id: venda.campanha_id, produto_id: venda.produto_id })
      .first();
    if (!regra) throw new AppError(400, 'Regra de prêmio não encontrada para esta venda');

    const metragemFinal = metragem_ajustada ?? Number(venda.metragem);
    const premio_apurado = calcularPremio(
      metragemFinal,
      Number(regra.metragem_corte),
      Number(regra.valor_premio),
    );

    const transacaoId = uuidv4();
    const dataLiberacao = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);

    await db.transaction(async (trx) => {
      await trx('vendas').where({ id: req.params.id }).update({
        status: 'aprovada',
        metragem: metragemFinal,
        premio_apurado,
        validado_por: req.admin!.id,
        validado_em: new Date(),
      });

      await trx('transacoes').insert({
        id: transacaoId,
        vendedor_id: venda.vendedor_id,
        venda_id: venda.id,
        tipo: 'credito',
        valor: premio_apurado,
        status: 'bloqueado',
        data_liberacao: dataLiberacao,
      });

      await trx('vendedores')
        .where({ id: venda.vendedor_id })
        .update({ saldo_bloqueado: trx.raw('saldo_bloqueado + ?', [premio_apurado]) });
    });

    await enviarPushENotificacao(
      db,
      venda.vendedor_id,
      'Venda aprovada! 🎉',
      `R$ ${premio_apurado.toFixed(2).replace('.', ',')} será liberado em 5 dias corridos.`,
    );

    res.json({ message: 'Venda aprovada', premio_apurado });
  } catch (err) {
    next(err);
  }
}

// ─── reprovar ──────────────────────────────────────────────────────────────

export async function reprovar(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { motivo } = z.object({ motivo: z.string().min(5) }).parse(req.body);

    const venda = await db('vendas').where({ id: req.params.id }).first();
    if (!venda) throw new AppError(404, 'Venda não encontrada');
    if (!['pendente', 'em_analise'].includes(venda.status)) {
      throw new AppError(400, `Venda não pode ser reprovada com status "${venda.status}"`);
    }

    await db('vendas').where({ id: req.params.id }).update({
      status: 'reprovada',
      motivo_reprovacao: motivo,
      validado_por: req.admin!.id,
      validado_em: new Date(),
    });

    await enviarPushENotificacao(
      db,
      venda.vendedor_id,
      'Venda reprovada',
      `Sua venda foi reprovada. Motivo: ${motivo}`,
    );

    res.json({ message: 'Venda reprovada' });
  } catch (err) {
    next(err);
  }
}

// ─── solicitar revisão ─────────────────────────────────────────────────────

export async function solicitarRevisao(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { motivo } = z.object({ motivo: z.string().min(5) }).parse(req.body);

    const venda = await db('vendas').where({ id: req.params.id }).first();
    if (!venda) throw new AppError(404, 'Venda não encontrada');
    if (venda.status !== 'pendente') {
      throw new AppError(400, `Revisão só pode ser solicitada para vendas pendentes`);
    }

    await db('vendas').where({ id: req.params.id }).update({ status: 'em_analise' });

    await enviarPushENotificacao(
      db,
      venda.vendedor_id,
      'Complemento solicitado',
      `Por favor, revise sua venda: ${motivo}`,
    );

    res.json({ message: 'Revisão solicitada' });
  } catch (err) {
    next(err);
  }
}

// ─── exportar Excel ────────────────────────────────────────────────────────

export async function exportar(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { filtro, id, status, data_inicio, data_fim } = req.query;

    let query = db('vendas')
      .join('vendedores', 'vendas.vendedor_id', 'vendedores.id')
      .join('distribuidores', 'vendedores.distribuidor_id', 'distribuidores.id')
      .join('produtos', 'vendas.produto_id', 'produtos.id')
      .join('campanhas', 'vendas.campanha_id', 'campanhas.id');

    if (filtro === 'vendedor' && id) query = query.where('vendas.vendedor_id', id);
    if (filtro === 'distribuidor' && id) query = query.where('vendedores.distribuidor_id', id);
    if (status) query = query.where('vendas.status', status);
    if (data_inicio) query = query.where('vendas.created_at', '>=', new Date(String(data_inicio)));
    if (data_fim) query = query.where('vendas.created_at', '<=', new Date(String(data_fim)));

    const rows = await query
      .select(
        'vendas.id',
        'vendas.created_at',
        'vendas.metragem',
        'vendas.premio_estimado',
        'vendas.premio_apurado',
        'vendas.status',
        'vendas.validado_em',
        'vendas.motivo_reprovacao',
        'vendedores.nome as vendedor_nome',
        'vendedores.cpf as vendedor_cpf',
        'distribuidores.razao_social as distribuidor_nome',
        'produtos.nome as produto_nome',
        'campanhas.nome as campanha_nome',
      )
      .orderBy('vendas.created_at', 'desc');

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'World Film';
    const sheet = workbook.addWorksheet('Vendas');

    const headers = [
      'ID da Venda',
      'Data de Registro',
      'Distribuidor',
      'Vendedor',
      'CPF do Vendedor',
      'Campanha',
      'Produto',
      'Metragem (m)',
      'Prêmio Estimado (R$)',
      'Prêmio Apurado (R$)',
      'Status',
      'Data de Validação',
      'Motivo de Reprovação',
    ];

    sheet.addRow(headers);
    const headerRow = sheet.getRow(1);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A3C5E' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });
    headerRow.height = 20;
    sheet.columns = headers.map((h, i) => ({
      key: String(i),
      width: i === 0 ? 38 : i <= 2 ? 32 : 18,
    }));

    const STATUS_LABEL: Record<string, string> = {
      pendente: 'Pendente',
      em_analise: 'Em Análise',
      aprovada: 'Aprovada',
      reprovada: 'Reprovada',
      cancelada: 'Cancelada',
    };

    for (const row of rows) {
      sheet.addRow([
        row.id,
        formatDate(row.created_at),
        row.distribuidor_nome,
        row.vendedor_nome,
        row.vendedor_cpf,
        row.campanha_nome,
        row.produto_nome,
        Number(row.metragem),
        formatBRL(row.premio_estimado),
        formatBRL(row.premio_apurado),
        STATUS_LABEL[row.status] ?? row.status,
        formatDate(row.validado_em),
        row.motivo_reprovacao ?? '',
      ]);
    }

    const dataSuffix = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const filename = `worldfilm_vendas_${dataSuffix}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    next(err);
  }
}

// ─── detalhe de venda (admin) ──────────────────────────────────────────────

export async function adminGetById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const venda = await db('vendas')
      .join('vendedores', 'vendas.vendedor_id', 'vendedores.id')
      .join('distribuidores', 'vendedores.distribuidor_id', 'distribuidores.id')
      .join('produtos', 'vendas.produto_id', 'produtos.id')
      .join('campanhas', 'vendas.campanha_id', 'campanhas.id')
      .leftJoin('campanha_premios', (jb) =>
        jb.on('campanha_premios.campanha_id', 'vendas.campanha_id')
          .andOn('campanha_premios.produto_id', 'vendas.produto_id'),
      )
      .select(
        'vendas.*',
        'vendedores.nome as vendedor_nome',
        'vendedores.cpf as vendedor_cpf',
        'distribuidores.razao_social as distribuidor_nome',
        'produtos.nome as produto_nome',
        'campanhas.nome as campanha_nome',
        'campanha_premios.metragem_corte',
        'campanha_premios.valor_premio',
      )
      .where('vendas.id', req.params.id)
      .first();

    if (!venda) throw new AppError(404, 'Venda não encontrada');
    res.json(venda);
  } catch (err) {
    next(err);
  }
}

// ─── liberar transação (admin manual) ─────────────────────────────────────

export async function liberarTransacao(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const transacao = await db('transacoes').where({ id: req.params.id }).first();
    if (!transacao) throw new AppError(404, 'Transação não encontrada');
    if (transacao.status !== 'bloqueado') {
      throw new AppError(400, `Apenas transações bloqueadas podem ser liberadas manualmente`);
    }

    await db.transaction(async (trx) => {
      await trx('transacoes').where({ id: req.params.id }).update({ status: 'disponivel' });
      await trx('vendedores').where({ id: transacao.vendedor_id }).update({
        saldo_bloqueado: trx.raw('GREATEST(0, saldo_bloqueado - ?)', [transacao.valor]),
        saldo_disponivel: trx.raw('saldo_disponivel + ?', [transacao.valor]),
      });
    });

    await enviarPushENotificacao(
      db,
      transacao.vendedor_id,
      'Saldo liberado! 💰',
      `R$ ${Number(transacao.valor).toFixed(2).replace('.', ',')} está disponível para saque.`,
    );

    res.json({ message: 'Saldo liberado com sucesso' });
  } catch (err) {
    next(err);
  }
}
