import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import db from '../database/connection';
import { AppError } from '../middlewares/errorHandler';
import { validateCPF, formatCPF } from '../utils/cpf';
import { getPagination, paginatedResponse } from '../utils/paginate';
import { enviarPushENotificacao } from '../services/notificacao.service';

// ───────── helpers ─────────

function stripSensitive(v: Record<string, unknown>) {
  const { senha, otp_code, otp_expires_at, ...safe } = v;
  return safe;
}

async function getVendedorOr404(id: string) {
  const v = await db('vendedores').where({ id }).first();
  if (!v) throw new AppError(404, 'Vendedor não encontrado');
  return v;
}

// ───────── admin routes ─────────

export async function adminList(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page, limit, offset } = getPagination(req);
    const { status, distribuidor_id, search } = req.query;

    const base = db('vendedores')
      .join('distribuidores', 'vendedores.distribuidor_id', 'distribuidores.id')
      .modify((q) => {
        if (status) q.where('vendedores.status', status);
        if (distribuidor_id) q.where('vendedores.distribuidor_id', distribuidor_id);
        if (search) {
          const like = `%${search}%`;
          q.where((inner) =>
            inner.where('vendedores.nome', 'like', like).orWhere('vendedores.cpf', 'like', like),
          );
        }
      });

    const [{ total }] = await base.clone().count('vendedores.id as total');

    const data = await base
      .select(
        'vendedores.id',
        'vendedores.nome',
        'vendedores.cpf',
        'vendedores.whatsapp',
        'vendedores.status',
        'vendedores.saldo_disponivel',
        'vendedores.saldo_bloqueado',
        'vendedores.created_at',
        'distribuidores.razao_social as distribuidor_nome',
      )
      .orderBy('vendedores.created_at', 'desc')
      .limit(limit)
      .offset(offset);

    res.json(paginatedResponse(data, Number(total), page, limit));
  } catch (err) {
    next(err);
  }
}

export async function adminGetById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const vendedor = await db('vendedores')
      .join('distribuidores', 'vendedores.distribuidor_id', 'distribuidores.id')
      .select(
        'vendedores.*',
        'distribuidores.razao_social as distribuidor_nome',
        'distribuidores.regiao as distribuidor_regiao',
      )
      .where('vendedores.id', req.params.id)
      .first();

    if (!vendedor) throw new AppError(404, 'Vendedor não encontrado');

    const [vendasResumo] = await db('vendas')
      .where({ vendedor_id: req.params.id })
      .count('id as total_vendas')
      .sum({ total_premio: db.raw('COALESCE(premio_apurado_total, 0)') });

    const vendas = await db('vendas')
      .leftJoin('campanhas', 'vendas.campanha_id', 'campanhas.id')
      .select(
        'vendas.id',
        'vendas.status',
        'vendas.premio_estimado_total',
        'vendas.premio_apurado_total',
        'vendas.created_at',
        'vendas.campanha_id',
        'campanhas.nome as campanha_nome',
      )
      .where('vendas.vendedor_id', req.params.id)
      .orderBy('vendas.created_at', 'desc');

    const transacoes = await db('transacoes')
      .where({ vendedor_id: req.params.id })
      .orderBy('created_at', 'desc');

    res.json({
      vendedor: {
        ...stripSensitive(vendedor),
        total_vendas: Number(vendasResumo.total_vendas),
        total_premio: Number(vendasResumo.total_premio ?? 0),
      },
      vendas,
      transacoes,
    });
  } catch (err) {
    next(err);
  }
}

export async function aprovar(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const vendedor = await getVendedorOr404(req.params.id);
    if (!['pendente', 'em_analise', 'reprovado'].includes(vendedor.status)) {
      throw new AppError(400, 'Vendedor não pode ser aprovado neste status');
    }

    await db('vendedores').where({ id: req.params.id }).update({ status: 'aprovado', motivo_reprovacao: null });

    await enviarPushENotificacao(
      db,
      req.params.id,
      'Cadastro aprovado! 🎉',
      'Seu cadastro foi aprovado. Bem-vindo à World Film! Acesse o app e comece a registrar suas vendas.',
    );

    res.json({ message: 'Vendedor aprovado com sucesso' });
  } catch (err) {
    next(err);
  }
}

export async function reprovar(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { motivo } = z.object({ motivo: z.string().min(5) }).parse(req.body);

    const vendedor = await getVendedorOr404(req.params.id);

    await db('vendedores').where({ id: req.params.id }).update({
      status: 'reprovado',
      motivo_reprovacao: motivo,
      tentativas_cadastro: (vendedor.tentativas_cadastro ?? 0) + 1,
    });

    await enviarPushENotificacao(
      db,
      req.params.id,
      'Cadastro reprovado',
      `Seu cadastro foi reprovado. Motivo: ${motivo}`,
    );

    res.json({ message: 'Vendedor reprovado' });
  } catch (err) {
    next(err);
  }
}

export async function bloquear(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { motivo } = z.object({ motivo: z.string().min(5) }).parse(req.body);

    await getVendedorOr404(req.params.id);
    await db('vendedores').where({ id: req.params.id }).update({ status: 'bloqueado', motivo_reprovacao: motivo });

    await enviarPushENotificacao(db, req.params.id, 'Conta bloqueada', `Sua conta foi bloqueada. Motivo: ${motivo}`);

    res.json({ message: 'Vendedor bloqueado' });
  } catch (err) {
    next(err);
  }
}

export async function desbloquear(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const vendedor = await getVendedorOr404(req.params.id);
    if (vendedor.status !== 'bloqueado') throw new AppError(400, 'Vendedor não está bloqueado');

    await db('vendedores').where({ id: req.params.id }).update({ status: 'aprovado', motivo_reprovacao: null });

    await enviarPushENotificacao(db, req.params.id, 'Conta desbloqueada', 'Sua conta foi desbloqueada. Você já pode acessar o app.');

    res.json({ message: 'Vendedor desbloqueado' });
  } catch (err) {
    next(err);
  }
}

export async function changeRole(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { role } = z.object({ role: z.enum(['vendedor', 'admin']) }).parse(req.body);
    await getVendedorOr404(req.params.id);
    await db('vendedores').where({ id: req.params.id }).update({ role });
    res.json({ message: `Role alterada para ${role}` });
  } catch (err) {
    next(err);
  }
}

// ───────── vendedor routes ─────────

export async function getPerfil(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const vendedor = await db('vendedores')
      .join('distribuidores', 'vendedores.distribuidor_id', 'distribuidores.id')
      .select('vendedores.*', 'distribuidores.razao_social as distribuidor_nome')
      .where('vendedores.id', req.vendedor!.id)
      .first();

    if (!vendedor) throw new AppError(404, 'Vendedor não encontrado');
    res.json(stripSensitive(vendedor));
  } catch (err) {
    next(err);
  }
}

export async function updatePerfil(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = z.object({
      nome: z.string().min(3).optional(),
      whatsapp: z.string().min(10).optional(),
      chave_pix: z.string().min(1).optional(),
    }).parse(req.body);

    await db('vendedores').where({ id: req.vendedor!.id }).update(body);
    const updated = await db('vendedores').where({ id: req.vendedor!.id }).first();
    res.json(stripSensitive(updated));
  } catch (err) {
    next(err);
  }
}

export async function updateSenha(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { senhaAtual, novaSenha } = z.object({
      senhaAtual: z.string().min(1),
      novaSenha: z.string().min(6),
    }).parse(req.body);

    const vendedor = await db('vendedores').where({ id: req.vendedor!.id }).first();
    if (!(await bcrypt.compare(senhaAtual, vendedor.senha))) {
      throw new AppError(400, 'Senha atual incorreta');
    }

    const hashed = await bcrypt.hash(novaSenha, 12);
    await db('vendedores').where({ id: req.vendedor!.id }).update({ senha: hashed });
    res.json({ message: 'Senha alterada com sucesso' });
  } catch (err) {
    next(err);
  }
}

export async function resumoMes(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const vendedorId = req.vendedor!.id;
    const distribuidorId = req.vendedor!.distribuidor_id;

    const now = new Date();
    const inicioMes = new Date(now.getFullYear(), now.getMonth(), 1);
    const fimMes = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const [resumo] = await db('vendas')
      .where({ vendedor_id: vendedorId })
      .whereBetween('created_at', [inicioMes, fimMes])
      .count('id as vendas_mes')
      .sum({ premio_acumulado_mes: db.raw('COALESCE(premio_estimado_total, 0)') });

    type RankingRow = {
      vendedor_id: string;
      total_premio?: string | number;
    };

    const rankingRows = (await db('vendas')
      .join('vendedores', 'vendas.vendedor_id', 'vendedores.id')
      .where('vendedores.distribuidor_id', distribuidorId)
      .where('vendedores.status', 'aprovado')
      .whereBetween('vendas.created_at', [inicioMes, fimMes])
      .groupBy('vendas.vendedor_id')
      .select('vendas.vendedor_id')
      .sum({ total_premio: db.raw('COALESCE(vendas.premio_estimado_total, 0)') })
      .orderBy('total_premio', 'desc')) as RankingRow[];

    const pos = rankingRows.findIndex((r) => r.vendedor_id === vendedorId);
    const ranking_distribuidor = pos >= 0 ? pos + 1 : rankingRows.length + 1;

    res.json({
      vendas_mes: Number(resumo.vendas_mes ?? 0),
      premio_acumulado_mes: Number(resumo.premio_acumulado_mes ?? 0),
      ranking_distribuidor,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateFcmToken(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { token } = z.object({ token: z.string().min(1) }).parse(req.body);
    await db('vendedores').where({ id: req.vendedor!.id }).update({ fcm_token: token });
    res.json({ message: 'Token FCM atualizado' });
  } catch (err) {
    next(err);
  }
}
