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
        'vendas.premio_estimado_total',
        'vendas.premio_apurado_total',
        'vendas.status',
        'vendas.created_at',
        'vendas.validado_em',
        'vendedores.nome as vendedor_nome',
        'vendedores.cpf as vendedor_cpf',
        'distribuidores.razao_social as distribuidor_nome',
        'campanhas.nome as campanha_nome',
      )
      .orderBy('vendas.created_at', 'asc')
      .limit(limit)
      .offset(offset);

    // Agregar contagem de itens por venda
    const ids = data.map((v: any) => v.id);
    let countMap: Record<string, number> = {};
    if (ids.length > 0) {
      const counts = await db('venda_itens')
        .whereIn('venda_id', ids)
        .groupBy('venda_id')
        .select('venda_id', db.raw('COUNT(*) as item_count'));
      countMap = Object.fromEntries(counts.map((c: any) => [c.venda_id, Number(c.item_count)]));
    }

    const enriched = data.map((v: any) => ({ ...v, item_count: countMap[v.id] ?? 0 }));
    res.json(paginatedResponse(enriched, Number(total), page, limit));
  } catch (err) {
    next(err);
  }
}

// ─── aprovar ───────────────────────────────────────────────────────────────

export async function aprovar(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const venda = await db('vendas').where({ id: req.params.id }).first();
    if (!venda) throw new AppError(404, 'Venda não encontrada');
    if (!['pendente', 'em_analise'].includes(venda.status)) {
      throw new AppError(400, `Venda não pode ser aprovada com status "${venda.status}"`);
    }

    // Calcular prêmio apurado por item
    const itens = await db('venda_itens').where({ venda_id: req.params.id });
    if (itens.length === 0) throw new AppError(400, 'Venda sem itens');

    type ItemUpdate = { id: string; premio_apurado: number };
    const itemUpdates: ItemUpdate[] = [];
    let premioTotal = 0;

    for (const item of itens) {
      const regra = await db('campanha_premios')
        .where({ campanha_id: venda.campanha_id, produto_id: item.produto_id })
        .first();
      if (!regra) throw new AppError(400, `Regra de prêmio não encontrada para produto ${item.produto_id}`);

      const premio_apurado = calcularPremio(
        Number(item.metragem),
        Number(regra.metragem_corte),
        Number(regra.valor_premio),
      );
      premioTotal += premio_apurado;
      itemUpdates.push({ id: item.id, premio_apurado });
    }

    const transacaoId = uuidv4();
    const dataLiberacao = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);

    await db.transaction(async (trx) => {
      // Atualizar prêmio de cada item
      for (const upd of itemUpdates) {
        await trx('venda_itens').where({ id: upd.id }).update({ premio_apurado: upd.premio_apurado });
      }

      await trx('vendas').where({ id: req.params.id }).update({
        status: 'aprovada',
        premio_apurado_total: premioTotal,
        validado_por: req.admin!.id,
        validado_em: new Date(),
      });

      await trx('transacoes').insert({
        id: transacaoId,
        vendedor_id: venda.vendedor_id,
        venda_id: venda.id,
        tipo: 'credito',
        valor: premioTotal,
        status: 'bloqueado',
        data_liberacao: dataLiberacao,
      });

      await trx('vendedores')
        .where({ id: venda.vendedor_id })
        .update({ saldo_bloqueado: trx.raw('saldo_bloqueado + ?', [premioTotal]) });
    });

    await enviarPushENotificacao(
      db,
      venda.vendedor_id,
      'Venda aprovada! 🎉',
      `R$ ${premioTotal.toFixed(2).replace('.', ',')} será liberado em 5 dias corridos.`,
    );

    res.json({ message: 'Venda aprovada', premio_apurado_total: premioTotal });
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

    let query = db('venda_itens')
      .join('vendas', 'venda_itens.venda_id', 'vendas.id')
      .join('vendedores', 'vendas.vendedor_id', 'vendedores.id')
      .join('distribuidores', 'vendedores.distribuidor_id', 'distribuidores.id')
      .join('produtos', 'venda_itens.produto_id', 'produtos.id')
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
        'venda_itens.metragem',
        'venda_itens.premio_estimado',
        'venda_itens.premio_apurado',
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
      .join('campanhas', 'vendas.campanha_id', 'campanhas.id')
      .select(
        'vendas.*',
        'vendedores.nome as vendedor_nome',
        'vendedores.cpf as vendedor_cpf',
        'distribuidores.razao_social as distribuidor_nome',
        'campanhas.nome as campanha_nome',
      )
      .where('vendas.id', req.params.id)
      .first();

    if (!venda) throw new AppError(404, 'Venda não encontrada');

    const itens = await db('venda_itens')
      .join('produtos', 'venda_itens.produto_id', 'produtos.id')
      .leftJoin('campanha_premios', (jb) =>
        jb.on('campanha_premios.campanha_id', db.raw('?', [venda.campanha_id]))
          .andOn('campanha_premios.produto_id', 'venda_itens.produto_id'),
      )
      .select(
        'venda_itens.*',
        'produtos.nome as produto_nome',
        'campanha_premios.metragem_corte',
        'campanha_premios.valor_premio',
      )
      .where('venda_itens.venda_id', req.params.id);

    res.json({ ...venda, itens });
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
