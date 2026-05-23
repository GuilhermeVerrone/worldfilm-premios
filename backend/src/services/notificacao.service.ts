import * as admin from 'firebase-admin';
import type { Knex } from 'knex';
import db from '../database/connection';
import { env } from '../utils/env';

// ─── Firebase init (lazy, one-time) ────────────────────────────────────────

let messagingInstance: admin.messaging.Messaging | null = null;

function getMessaging(): admin.messaging.Messaging | null {
  if (messagingInstance) return messagingInstance;
  if (!env.firebaseServiceAccountPath) {
    // Development without Firebase: stub mode
    return null;
  }
  try {
    if (!admin.apps.length) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      admin.initializeApp({ credential: admin.credential.cert(require(env.firebaseServiceAccountPath)) });
    }
    messagingInstance = admin.messaging();
    return messagingInstance;
  } catch (err) {
    console.error('[firebase] Falha ao inicializar:', err);
    return null;
  }
}

const INVALID_TOKEN_CODES = new Set([
  'messaging/invalid-registration-token',
  'messaging/registration-token-not-registered',
]);

function chunk<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
  return chunks;
}

// ─── salvarNotificacao ──────────────────────────────────────────────────────

export async function salvarNotificacao(
  dbConn: Knex,
  vendedorId: string | null,
  titulo: string,
  corpo: string,
): Promise<void> {
  await dbConn('notificacoes').insert({
    id: dbConn.raw('(UUID())'),
    vendedor_id: vendedorId,
    titulo,
    corpo,
    tipo: 'in_app',
    lida: false,
  });
}

// ─── enviarPush (single) ────────────────────────────────────────────────────

export async function enviarPush(
  vendedorId: string,
  titulo: string,
  corpo: string,
  data?: Record<string, string>,
): Promise<void> {
  const messaging = getMessaging();

  const vendedor = await db('vendedores').select('fcm_token').where({ id: vendedorId }).first();
  const token: string | null = vendedor?.fcm_token ?? null;

  if (!token) {
    console.log(`[push:skip] vendedor=${vendedorId} sem fcm_token`);
    return;
  }

  if (!messaging) {
    console.log(`[push:stub] vendedor=${vendedorId} | ${titulo}: ${corpo}`);
    return;
  }

  try {
    await messaging.send({ token, notification: { title: titulo, body: corpo }, data });
  } catch (err: unknown) {
    const code = (err as { code?: string }).code ?? '';
    if (INVALID_TOKEN_CODES.has(code)) {
      await db('vendedores').where({ id: vendedorId }).update({ fcm_token: null });
      console.warn(`[push] Token inválido removido: vendedor=${vendedorId}`);
    } else {
      console.error(`[push] Erro ao enviar para ${vendedorId}:`, err);
    }
  }
}

// ─── enviarPushENotificacao ─────────────────────────────────────────────────

export async function enviarPushENotificacao(
  dbConn: Knex,
  vendedorId: string,
  titulo: string,
  corpo: string,
  data?: Record<string, string>,
): Promise<void> {
  await Promise.all([
    enviarPush(vendedorId, titulo, corpo, data),
    salvarNotificacao(dbConn, vendedorId, titulo, corpo),
  ]);
}

// ─── enviarPushParaDistribuidor ─────────────────────────────────────────────

export async function enviarPushParaDistribuidor(
  distribuidorId: string,
  titulo: string,
  corpo: string,
): Promise<void> {
  const vendedores = await db('vendedores')
    .where({ distribuidor_id: distribuidorId, status: 'aprovado' })
    .whereNotNull('fcm_token')
    .select('fcm_token');

  await enviarBatch(vendedores.map((v) => v.fcm_token), titulo, corpo);
}

// ─── enviarPushParaTodos ─────────────────────────────────────────────────────

export async function enviarPushParaTodos(titulo: string, corpo: string): Promise<void> {
  const vendedores = await db('vendedores')
    .where({ status: 'aprovado' })
    .whereNotNull('fcm_token')
    .select('fcm_token');

  await enviarBatch(vendedores.map((v) => v.fcm_token), titulo, corpo);
}

// ─── enviarBatch (internal) ─────────────────────────────────────────────────

async function enviarBatch(tokens: string[], titulo: string, corpo: string): Promise<void> {
  if (tokens.length === 0) return;

  const messaging = getMessaging();
  if (!messaging) {
    console.log(`[push:stub:batch] ${tokens.length} token(s) | ${titulo}`);
    return;
  }

  const invalidos: string[] = [];

  for (const lote of chunk(tokens, 500)) {
    const response = await messaging.sendEachForMulticast({
      tokens: lote,
      notification: { title: titulo, body: corpo },
    });

    response.responses.forEach((r, i) => {
      if (!r.success) {
        const code = r.error?.code ?? '';
        if (INVALID_TOKEN_CODES.has(code)) invalidos.push(lote[i]);
      }
    });
  }

  if (invalidos.length > 0) {
    await db('vendedores').whereIn('fcm_token', invalidos).update({ fcm_token: null });
    console.warn(`[push:batch] ${invalidos.length} token(s) inválido(s) removidos`);
  }
}
