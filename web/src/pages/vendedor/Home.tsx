import { useNavigate } from 'react-router-dom';
import { useQueries, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { Skeleton } from '../../components/ui/Skeleton';
import { Badge, statusToBadge } from '../../components/ui/Badge';
import { useAuthStore } from '../../store/authStore';
import { cn } from '../../lib/utils';

function brl(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function daysLeft(dataFim: string): number {
  return Math.max(0, Math.ceil((new Date(dataFim).getTime() - Date.now()) / 86_400_000));
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('pt-BR');
}


export default function VendedorHome() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { vendedor } = useAuthStore();

  const [saldoQ, resumoQ, campanhasQ, vendasQ] = useQueries({
    queries: [
      { queryKey: ['financeiro-saldo'], queryFn: () => api.get('/financeiro/saldo').then((r) => r.data) },
      { queryKey: ['vendedor-resumo-mes'], queryFn: () => api.get('/vendedor/resumo-mes').then((r) => r.data) },
      { queryKey: ['campanhas-vendedor'], queryFn: () => api.get('/campanhas').then((r) => r.data) },
      { queryKey: ['vendas-recentes'], queryFn: () => api.get('/vendas', { params: { limit: 20 } }).then((r) => r.data) },
    ],
  });

  const loading = saldoQ.isLoading || resumoQ.isLoading || campanhasQ.isLoading || vendasQ.isLoading;

  function refresh() {
    qc.invalidateQueries({ queryKey: ['financeiro-saldo'] });
    qc.invalidateQueries({ queryKey: ['vendedor-resumo-mes'] });
    qc.invalidateQueries({ queryKey: ['campanhas-vendedor'] });
    qc.invalidateQueries({ queryKey: ['vendas-recentes'] });
  }

  const saldo = saldoQ.data;
  const resumo = resumoQ.data;
  const campanhas: any[] = campanhasQ.data?.data ?? [];
  const vendas: any[] = vendasQ.data?.data ?? [];
  const vendasRecentes = vendas.slice(0, 3);

  const firstName = vendedor?.nome?.trim().split(/\s+/)[0] ?? 'Olá';

  return (
    <div className="pb-6">

      {/* ── Hero banner ── */}
      <div className="bg-[#111827]">
        <div className="max-w-7xl mx-auto px-5 md:px-8 pt-6 pb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-white/50 text-[11px] uppercase tracking-widest font-medium">Bem-vindo de volta</p>
              <p className="text-white text-lg font-bold mt-0.5">Olá, {firstName}</p>
            </div>
            <button
              onClick={refresh}
              className="p-2 text-white/30 hover:text-white/70 transition-colors rounded-lg hover:bg-white/10"
              aria-label="Atualizar"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>

          {loading ? (
            <div className="h-36 bg-white/5 rounded-xl animate-pulse" />
          ) : (
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[#1f2937] to-[#111827] border-l-4 border-wf-red p-5 md:p-6">
              <div className="absolute top-0 right-0 w-32 h-32 bg-wf-red/8 blur-3xl pointer-events-none" />
              <p className="text-white/50 text-[11px] uppercase tracking-widest font-medium mb-1">Disponível para saque</p>
              <p className="text-4xl md:text-5xl font-black text-white mb-0.5">
                {brl(saldo?.saldo_disponivel ?? 0)}
              </p>
              {(saldo?.saldo_bloqueado ?? 0) > 0 ? (
                <p className="text-white/40 text-xs mb-4">+ {brl(saldo.saldo_bloqueado)} bloqueado</p>
              ) : (
                <div className="mb-4" />
              )}
              <button
                disabled={(saldo?.saldo_disponivel ?? 0) < 20}
                onClick={() => navigate('/vendedor/financeiro')}
                className="px-4 py-2 bg-wf-red hover:bg-wf-red-dark text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Solicitar pagamento
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Metrics strip ── */}
      <div className="bg-white border-b border-wf-border/60">
        <div className="max-w-7xl mx-auto grid grid-cols-3 divide-x divide-gray-100">
          {loading ? (
            [0, 1, 2].map((i) => (
              <div key={i} className="p-4 flex flex-col items-center gap-1">
                <Skeleton className="h-7 w-10" />
                <Skeleton className="h-3 w-12" />
              </div>
            ))
          ) : (
            [
              { label: 'Vendas no mês', value: resumo?.vendas_mes ?? 0 },
              { label: 'Prêmio acum.', value: brl(resumo?.premio_acumulado_mes ?? 0) },
              { label: 'Ranking', value: resumo?.ranking_distribuidor ? `#${resumo.ranking_distribuidor}` : '—' },
            ].map(({ label, value }) => (
              <div key={label} className="p-4 md:p-5 flex flex-col items-center text-center">
                <p className="text-xl md:text-2xl font-bold text-wf-text-primary">{value}</p>
                <p className="text-[10px] text-wf-text-muted font-medium uppercase tracking-wide mt-0.5">{label}</p>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8 space-y-8">

        {/* ── Campanhas ── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-bold text-wf-text-primary uppercase tracking-wide">Campanhas ativas</h2>
            <button
              onClick={() => navigate('/vendedor/campanhas')}
              className="text-[11px] font-semibold text-wf-red hover:text-wf-red-dark transition-colors"
            >
              Ver todas →
            </button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[0, 1, 2].map((i) => <Skeleton key={i} className="h-52 rounded-xl" />)}
            </div>
          ) : campanhas.length === 0 ? (
            <div className="py-8 text-center rounded-xl border border-dashed border-wf-border">
              <p className="text-wf-text-muted text-sm">Nenhuma campanha ativa</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {campanhas.map((c: any) => {
                const days = daysLeft(c.data_fim);
                const maxPremio = Math.max(0, ...((c.premios ?? []).map((p: any) => Number(p.valor_premio))));
                const urgent = days <= 3;
                return (
                  <button
                    key={c.id}
                    onClick={() => navigate(`/vendedor/campanhas/${c.id}`)}
                    className="text-left overflow-hidden rounded-xl bg-white shadow-sm active:scale-[0.97] transition-transform hover:shadow-md"
                  >
                    <div className="relative h-40 bg-[#111827] overflow-hidden rounded-t-xl">
                      {c.imagem_url ? (
                        <img src={c.imagem_url} alt={c.nome} className="w-full h-full object-cover opacity-90" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center p-4">
                          <p className="text-white/70 text-sm font-bold text-center leading-snug line-clamp-3">{c.nome}</p>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                      {urgent && (
                        <span className="absolute top-2 right-2 bg-wf-red text-white text-[9px] font-bold rounded-full px-2 py-0.5 uppercase tracking-wide">
                          {days === 0 ? 'Hoje!' : `${days}d`}
                        </span>
                      )}
                      {maxPremio > 0 && (
                        <span className="absolute bottom-2 left-2 text-white text-xs font-black">{brl(maxPremio)}</span>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="text-sm font-bold text-wf-text-primary line-clamp-2 leading-snug">{c.nome}</p>
                      <p className={cn('text-[11px] font-medium mt-1', urgent ? 'text-wf-red' : 'text-wf-text-muted')}>
                        {days === 0 ? 'Encerra hoje' : `${days} dias restantes`}
                      </p>
                    </div>
                  </button>
                );
              })}
              <button
                onClick={() => navigate('/vendedor/campanhas')}
                className="rounded-xl border border-dashed border-wf-border flex flex-col items-center justify-center gap-2 text-wf-text-muted hover:text-wf-text-secondary hover:border-gray-400 transition-colors active:scale-[0.97] min-h-[184px]"
              >
                <span className="text-xl font-bold">→</span>
                <span className="text-[9px] uppercase tracking-wide font-bold text-center px-2">Ver todas</span>
              </button>
            </div>
          )}
        </section>

        {/* ── Últimas vendas ── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-bold text-wf-text-primary uppercase tracking-wide">Últimas vendas</h2>
            <button
              onClick={() => navigate('/vendedor/vendas')}
              className="text-[11px] font-semibold text-wf-red hover:text-wf-red-dark transition-colors"
            >
              Ver todas →
            </button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {[0, 1, 2].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
            </div>
          ) : vendas.length === 0 ? (
            <div className="py-8 text-center rounded-xl border border-dashed border-wf-border">
              <p className="text-wf-text-muted text-sm mb-1">Nenhuma venda registrada</p>
              <button
                onClick={() => navigate('/vendedor/venda/nova')}
                className="text-xs text-wf-red font-bold uppercase tracking-wide"
              >
                + Registrar primeira venda
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {vendasRecentes.map((v: any) => {
                const premioVenda = v.itens.reduce((s: number, i: any) => s + Number(i.premio_estimado ?? 0), 0);
                return (
                  <div key={v.id} className="bg-white border border-wf-border overflow-hidden">
                    <div className="px-4 pt-3 pb-2.5 flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-wf-text-primary uppercase tracking-wide truncate">{v.campanha_nome}</p>
                        <p className="text-[11px] text-wf-text-muted mt-0.5">{fmtDate(v.created_at)}</p>
                      </div>
                      <Badge variant={statusToBadge(v.status)} className="shrink-0">{v.status}</Badge>
                    </div>
                    <div className="px-4 pb-2.5 space-y-1 border-t border-wf-border/60 pt-2">
                      {v.itens.map((item: any) => (
                        <p key={item.id} className="flex items-center gap-1 text-[11px]">
                          <span className="text-wf-text-secondary truncate flex-1">{item.produto_nome}</span>
                          <span className="text-wf-text-muted shrink-0 tabular-nums">{Number(item.metragem).toLocaleString('pt-BR')}m</span>
                        </p>
                      ))}
                    </div>
                    <div className="bg-[#111827] px-4 py-2 flex items-center justify-between">
                      <p className="text-white/40 text-[9px] uppercase tracking-widest">{v.itens.length} produto{v.itens.length !== 1 ? 's' : ''}</p>
                      <p className="text-green-400 font-black text-sm">{brl(premioVenda)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ── CTA nova venda ── */}
        <button
          onClick={() => navigate('/vendedor/venda/nova')}
          className="w-full py-3.5 bg-[#111827] hover:bg-[#1f2937] text-white text-xs font-bold rounded-xl transition-colors active:scale-[0.99] tracking-wide"
        >
          + Registrar nova venda
        </button>
      </div>
    </div>
  );
}
