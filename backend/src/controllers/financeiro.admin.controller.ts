import { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import ExcelJS from 'exceljs';
import db from '../database/connection';
import { AppError } from '../middlewares/errorHandler';
import { getPagination, paginatedResponse } from '../utils/paginate';
import { enviarPushENotificacao } from '../services/notificacao.service';
import { env } from '../utils/env';

function formatDate(date: Date | string | null): string {
  if (!date) return '';
  const d = new Date(date);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

// ─── listagem ──────────────────────────────────────────────────────────────

export async function listSolicitacoes(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page, limit, offset } = getPagination(req);
    const { status, distribuidor_id, vendedor_id, data_inicio, data_fim } = req.query;

    let query = db('transacoes')
      .join('vendedores', 'transacoes.vendedor_id', 'vendedores.id')
      .join('distribuidores', 'vendedores.distribuidor_id', 'distribuidores.id')
      .where('transacoes.tipo', 'saque');

    if (status) query = query.where('transacoes.status', status);
    if (distribuidor_id) query = query.where('vendedores.distribuidor_id', distribuidor_id);
    if (vendedor_id) query = query.where('transacoes.vendedor_id', vendedor_id);
    if (data_inicio) query = query.where('transacoes.created_at', '>=', new Date(String(data_inicio)));
    if (data_fim) query = query.where('transacoes.created_at', '<=', new Date(String(data_fim)));

    const [{ total }] = await query.clone().count('transacoes.id as total');

    const data = await query
      .select(
        'transacoes.id',
        'transacoes.valor',
        'transacoes.status',
        'transacoes.chave_pix_destino',
        'transacoes.comprovante_url',
        'transacoes.created_at',
        'transacoes.pago_em',
        'vendedores.nome as vendedor_nome',
        'vendedores.cpf as vendedor_cpf',
        'distribuidores.razao_social as distribuidor_nome',
      )
      .orderBy('transacoes.created_at', 'asc')
      .limit(limit)
      .offset(offset);

    res.json(paginatedResponse(data, Number(total), page, limit));
  } catch (err) {
    next(err);
  }
}

// ─── detalhe ───────────────────────────────────────────────────────────────

export async function getSolicitacaoById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await db('transacoes')
      .join('vendedores', 'transacoes.vendedor_id', 'vendedores.id')
      .join('distribuidores', 'vendedores.distribuidor_id', 'distribuidores.id')
      .where('transacoes.id', req.params.id)
      .where('transacoes.tipo', 'saque')
      .select(
        'transacoes.id',
        'transacoes.valor',
        'transacoes.status',
        'transacoes.chave_pix_destino',
        'transacoes.comprovante_url',
        'transacoes.created_at',
        'transacoes.pago_em',
        'vendedores.nome as vendedor_nome',
        'vendedores.cpf as vendedor_cpf',
        'distribuidores.razao_social as distribuidor_nome',
      )
      .first();
    if (!data) throw new AppError(404, 'Solicitação não encontrada');
    res.json(data);
  } catch (err) {
    next(err);
  }
}

// ─── processar ─────────────────────────────────────────────────────────────

export async function processar(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const transacao = await db('transacoes').where({ id: req.params.id, tipo: 'saque' }).first();
    if (!transacao) throw new AppError(404, 'Solicitação não encontrada');
    if (transacao.status !== 'solicitado') {
      throw new AppError(400, `Status inválido para processamento: "${transacao.status}"`);
    }

    await db('transacoes').where({ id: req.params.id }).update({ status: 'em_processamento' });
    res.json({ message: 'Marcado como em processamento' });
  } catch (err) {
    next(err);
  }
}

// ─── pagar ─────────────────────────────────────────────────────────────────

export async function pagar(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const transacao = await db('transacoes').where({ id: req.params.id, tipo: 'saque' }).first();
    if (!transacao) throw new AppError(404, 'Solicitação não encontrada');
    if (!['solicitado', 'em_processamento'].includes(transacao.status)) {
      throw new AppError(400, `Status inválido para pagamento: "${transacao.status}"`);
    }
    if (!req.file) throw new AppError(400, 'Comprovante obrigatório');

    const comprovante_url = `/uploads/comprovantes/${req.file.filename}`;

    await db('transacoes').where({ id: req.params.id }).update({
      status: 'pago',
      comprovante_url,
      pago_por: req.admin!.id,
      pago_em: new Date(),
    });

    const valor = Number(transacao.valor).toFixed(2).replace('.', ',');
    await enviarPushENotificacao(
      db,
      transacao.vendedor_id,
      'Pagamento realizado! ✅',
      `Seu pagamento de R$ ${valor} foi realizado. Toque para ver o comprovante.`,
      { tela: 'financeiro' },
    );

    res.json({ message: 'Pagamento registrado', comprovante_url });
  } catch (err) {
    next(err);
  }
}

// ─── comprovante ───────────────────────────────────────────────────────────

export async function getComprovante(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const transacao = await db('transacoes')
      .select('comprovante_url')
      .where({ id: req.params.id })
      .first();

    if (!transacao) throw new AppError(404, 'Transação não encontrada');
    if (!transacao.comprovante_url) throw new AppError(404, 'Comprovante não disponível');

    const filePath = path.resolve(env.uploadPath, transacao.comprovante_url.replace('/uploads/', ''));
    if (!fs.existsSync(filePath)) throw new AppError(404, 'Arquivo não encontrado no servidor');

    res.sendFile(filePath);
  } catch (err) {
    next(err);
  }
}

// ─── relatório Excel ───────────────────────────────────────────────────────

export async function relatorio(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { distribuidor_id, vendedor_id, data_inicio, data_fim } = req.query;

    let query = db('transacoes')
      .join('vendedores', 'transacoes.vendedor_id', 'vendedores.id')
      .join('distribuidores', 'vendedores.distribuidor_id', 'distribuidores.id')
      .where('transacoes.tipo', 'saque');

    if (distribuidor_id) query = query.where('vendedores.distribuidor_id', distribuidor_id);
    if (vendedor_id) query = query.where('transacoes.vendedor_id', vendedor_id);
    if (data_inicio) query = query.where('transacoes.created_at', '>=', new Date(String(data_inicio)));
    if (data_fim) query = query.where('transacoes.created_at', '<=', new Date(String(data_fim)));

    const rows = await query
      .select(
        'transacoes.id',
        'transacoes.valor',
        'transacoes.status',
        'transacoes.chave_pix_destino',
        'transacoes.created_at',
        'transacoes.pago_em',
        'vendedores.nome as vendedor_nome',
        'vendedores.cpf as vendedor_cpf',
        'distribuidores.razao_social as distribuidor_nome',
      )
      .orderBy('transacoes.created_at', 'desc');

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'World Film';
    const sheet = workbook.addWorksheet('Pagamentos');

    const headers = [
      'ID da Transação', 'Data da Solicitação', 'Distribuidor', 'Vendedor',
      'CPF do Vendedor', 'Chave PIX', 'Valor (R$)', 'Status', 'Data do Pagamento',
    ];

    sheet.addRow(headers);
    const headerRow = sheet.getRow(1);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A3C5E' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });
    headerRow.height = 20;
    sheet.columns = headers.map((_, i) => ({ key: String(i), width: i === 0 ? 38 : 22 }));

    const STATUS_LABEL: Record<string, string> = {
      solicitado: 'Solicitado', em_processamento: 'Em Processamento', pago: 'Pago',
    };

    for (const r of rows) {
      sheet.addRow([
        r.id,
        formatDate(r.created_at),
        r.distribuidor_nome,
        r.vendedor_nome,
        r.vendedor_cpf,
        r.chave_pix_destino ?? '',
        `R$ ${Number(r.valor).toFixed(2).replace('.', ',')}`,
        STATUS_LABEL[r.status] ?? r.status,
        formatDate(r.pago_em),
      ]);
    }

    const dataSuffix = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="worldfilm_pagamentos_${dataSuffix}.xlsx"`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    next(err);
  }
}
