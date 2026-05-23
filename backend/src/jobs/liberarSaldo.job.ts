import cron from 'node-cron';
import db from '../database/connection';
import { enviarPushENotificacao } from '../services/notificacao.service';

export async function liberarSaldoBloqueado(): Promise<void> {
  const transacoes = await db('transacoes')
    .where({ status: 'bloqueado', tipo: 'credito' })
    .where('data_liberacao', '<=', new Date());

  if (transacoes.length === 0) return;

  console.log(`[job:liberarSaldo] Processando ${transacoes.length} transação(ões)...`);

  // Processar em lotes para não travar o banco
  const totalPorVendedor = new Map<string, number>();

  for (const t of transacoes) {
    try {
      await db.transaction(async (trx) => {
        await trx('transacoes').where({ id: t.id }).update({ status: 'disponivel' });
        await trx('vendedores').where({ id: t.vendedor_id }).update({
          saldo_bloqueado: trx.raw('GREATEST(0, saldo_bloqueado - ?)', [t.valor]),
          saldo_disponivel: trx.raw('saldo_disponivel + ?', [t.valor]),
        });
      });

      const acumulado = totalPorVendedor.get(t.vendedor_id) ?? 0;
      totalPorVendedor.set(t.vendedor_id, acumulado + Number(t.valor));
    } catch (err) {
      console.error(`[job:liberarSaldo] Erro na transação ${t.id}:`, err);
    }
  }

  // Push para cada vendedor que teve saldo liberado
  for (const [vendedorId, total] of totalPorVendedor) {
    await enviarPushENotificacao(
      db,
      vendedorId,
      'Saldo disponível! 💰',
      `R$ ${total.toFixed(2).replace('.', ',')} está disponível para saque!`,
    );
  }

  console.log(`[job:liberarSaldo] Concluído. ${totalPorVendedor.size} vendedor(es) notificado(s).`);
}

export function startJobs(): void {
  // Roda diariamente às 8h (horário de Brasília)
  cron.schedule('0 8 * * *', () => {
    liberarSaldoBloqueado().catch((err) => console.error('[job:liberarSaldo] Falha:', err));
  }, { timezone: 'America/Sao_Paulo' });

  console.log('[jobs] Job de liberação de saldo agendado para 08:00 diariamente');
}
