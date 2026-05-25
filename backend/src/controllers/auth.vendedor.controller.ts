import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import db from '../database/connection';
import { AppError } from '../middlewares/errorHandler';
import { signVendedorToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { validateCPF, formatCPF } from '../utils/cpf';
import { validateCNPJ, formatCNPJ } from '../utils/cnpj';
import { enviarPushENotificacao, salvarNotificacao } from '../services/notificacao.service';
import type { JwtPayloadVendedor } from '@worldfilm/shared';

const registerSchema = z.object({
  nome: z.string().min(3),
  cpf: z.string().refine(validateCPF, 'CPF inválido'),
  cnpj: z.string().refine(validateCNPJ, 'CNPJ inválido').optional().or(z.literal('')),
  chave_pix: z.string().min(1),
  whatsapp: z.string().min(10),
  distribuidor_id: z.string().uuid(),
  senha: z.string().min(6),
});

const loginSchema = z.object({
  cpf: z.string().refine(validateCPF, 'CPF inválido'),
  senha: z.string().min(1),
});

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = registerSchema.parse(req.body);
    const cpf = formatCPF(body.cpf);

    const existing = await db('vendedores').where({ cpf }).first();
    if (existing) {
      if (existing.tentativas_cadastro >= 3) {
        throw new AppError(403, 'Limite de tentativas de cadastro atingido. Entre em contato com seu distribuidor.');
      }
      throw new AppError(409, 'CPF já cadastrado');
    }

    const distribuidor = await db('distribuidores').where({ id: body.distribuidor_id, status: 'ativo' }).first();
    if (!distribuidor) throw new AppError(404, 'Distribuidor não encontrado');

    const senha = await bcrypt.hash(body.senha, 12);
    const cnpj = body.cnpj ? formatCNPJ(body.cnpj) : null;

    const [id] = await db('vendedores').insert({
      id: db.raw('gen_random_uuid()'),
      distribuidor_id: body.distribuidor_id,
      nome: body.nome,
      cpf,
      cnpj,
      chave_pix: body.chave_pix,
      whatsapp: body.whatsapp,
      senha,
      status: 'pendente',
    });

    const vendedor = await db('vendedores').where({ cpf }).first();

    await salvarNotificacao(db, vendedor.id, 'Cadastro enviado!', 'Seu cadastro foi enviado para análise. Aguarde a aprovação da World Film.');

    res.status(201).json({ message: 'Cadastro enviado com sucesso. Aguarde a aprovação.' });
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { cpf, senha } = loginSchema.parse(req.body);
    const cpfFormatted = formatCPF(cpf);

    const vendedor = await db('vendedores').where({ cpf: cpfFormatted }).first();
    if (!vendedor || !(await bcrypt.compare(senha, vendedor.senha))) {
      throw new AppError(401, 'CPF ou senha inválidos');
    }

    if (vendedor.status === 'bloqueado') {
      throw new AppError(403, 'Sua conta foi bloqueada. Entre em contato com seu distribuidor.');
    }
    if (vendedor.status === 'pendente' || vendedor.status === 'em_analise') {
      throw new AppError(403, 'Seu cadastro ainda está em análise. Aguarde a aprovação da World Film.');
    }
    if (vendedor.status === 'reprovado') {
      throw new AppError(403, `Seu cadastro foi reprovado. Motivo: ${vendedor.motivo_reprovacao ?? 'Entre em contato com seu distribuidor.'}`);
    }

    const payload: JwtPayloadVendedor = {
      id: vendedor.id,
      nome: vendedor.nome,
      distribuidor_id: vendedor.distribuidor_id,
      role: 'vendedor',
    };
    const token = signVendedorToken(payload);
    const refreshToken = signRefreshToken({ id: vendedor.id, role: 'vendedor' });

    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await db('refresh_tokens').insert({
      id: db.raw('gen_random_uuid()'),
      token: refreshToken,
      owner_type: 'vendedor',
      owner_id: vendedor.id,
      expires_at: expiresAt,
    });

    const { senha: _, otp_code: __, otp_expires_at: ___, ...safeVendedor } = vendedor;
    res.json({ token, refreshToken, vendedor: safeVendedor });
  } catch (err) {
    next(err);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { refreshToken } = z.object({ refreshToken: z.string() }).parse(req.body);

    const stored = await db('refresh_tokens')
      .where({ token: refreshToken, owner_type: 'vendedor', revogado: false })
      .where('expires_at', '>', new Date())
      .first();

    if (!stored) throw new AppError(401, 'Refresh token inválido ou expirado');

    verifyRefreshToken(refreshToken);

    const vendedor = await db('vendedores').where({ id: stored.owner_id, status: 'aprovado' }).first();
    if (!vendedor) throw new AppError(401, 'Vendedor não encontrado ou inativo');

    const payload: JwtPayloadVendedor = {
      id: vendedor.id,
      nome: vendedor.nome,
      distribuidor_id: vendedor.distribuidor_id,
      role: 'vendedor',
    };
    const newToken = signVendedorToken(payload);
    const newRefresh = signRefreshToken({ id: vendedor.id, role: 'vendedor' });

    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await db.transaction(async (trx) => {
      await trx('refresh_tokens').where({ id: stored.id }).update({ revogado: true });
      await trx('refresh_tokens').insert({
        id: trx.raw('gen_random_uuid()'),
        token: newRefresh,
        owner_type: 'vendedor',
        owner_id: vendedor.id,
        expires_at: expiresAt,
      });
    });

    res.json({ token: newToken, refreshToken: newRefresh });
  } catch (err) {
    next(err);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { refreshToken } = z.object({ refreshToken: z.string() }).parse(req.body);
    await db('refresh_tokens').where({ token: refreshToken }).update({ revogado: true });
    res.json({ message: 'Logout realizado com sucesso' });
  } catch (err) {
    next(err);
  }
}

export async function recover(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { whatsapp } = z.object({ whatsapp: z.string().min(10) }).parse(req.body);

    const vendedor = await db('vendedores').where({ whatsapp }).first();
    // Always return success to avoid user enumeration
    if (!vendedor) {
      res.json({ message: 'Se o número estiver cadastrado, você receberá um código em breve.' });
      return;
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await db('vendedores').where({ id: vendedor.id }).update({
      otp_code: otp,
      otp_expires_at: expiresAt,
    });

    // In production: send via WhatsApp API
    console.log(`[otp:stub] ${whatsapp} → código: ${otp}`);

    res.json({ message: 'Se o número estiver cadastrado, você receberá um código em breve.' });
  } catch (err) {
    next(err);
  }
}

export async function resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = z.object({
      whatsapp: z.string().min(10),
      otp: z.string().length(6),
      novaSenha: z.string().min(6),
    }).parse(req.body);

    const vendedor = await db('vendedores')
      .where({ whatsapp: body.whatsapp, otp_code: body.otp })
      .where('otp_expires_at', '>', new Date())
      .first();

    if (!vendedor) throw new AppError(400, 'Código inválido ou expirado');

    const senha = await bcrypt.hash(body.novaSenha, 12);
    await db('vendedores').where({ id: vendedor.id }).update({
      senha,
      otp_code: null,
      otp_expires_at: null,
    });

    res.json({ message: 'Senha redefinida com sucesso' });
  } catch (err) {
    next(err);
  }
}
