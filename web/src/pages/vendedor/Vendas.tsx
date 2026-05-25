import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { Skeleton } from '../../components/ui/Skeleton';
import { Badge, statusToBadge } from '../../components/ui/Badge';

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('pt-BR');
}

function brl(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

const STATUS_OPTIONS = [
  { value: '', label: 'Todos os status' },
  { value: 'pendente', label: 'Pendente' },
  { value: 'aprovada', label: 'Aprovada' },
  { value: 'reprovada', label: 'Reprovada' },
  { value: 'em_analise', label: 'Em análise' },
];

export default function VendedorVendas() {
  const [status, setStatus] = useState('');
  const [campanhaId, setCampanhaId] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['vendas-lista', status, campanhaId, dataInicio, dataFim, page],
    queryFn: () =>
      api.get('/vendas', {
        params: {
          status: status || undefined,
          campanha_id: campanhaId || undefined,
          data_inicio: dataInicio || undefined,
          data_fim: dataFim || undefined,
          page,
          limit: 50,
        },
      }).then((r) => r.data),
  });

  const { data: campanhasData } = useQuery({
    queryKey: ['campanhas-vendedor-select'],
    queryFn: () => api.get('/campanhas').then((r) => r.data.data as any[]),
  });

  const vendas: any[] = data?.data ?? [];
  const campanhas: any[] = campanhasData ?? [];

  function resetFilters() {
    setStatus(''); setCampanhaId(''); setDataInicio(''); setDataFim(''); setPage(1);
  }

  const hasFilters = status || campanhaId || dataInicio || dataFim;
  const totalVendas = data?.total ?? 0;
  const totalPremio = vendas.reduce(
    (s: number, v: any) => s + v.itens.reduce((si: number, i: any) => si + Number(i.premio_estimado ?? 0), 0),
    0,
  );

  return (
    <div>

      {/* ── Header ── */}
      <div className="bg-[#111827] min-h-[140px]">
        <div className="max-w-5xl mx-auto px-5 md:px-8 pt-6 pb-8">
          <p className="text-white/50 text-[11px] uppercase tracking-widest font-medium mb-4">Vendas</p>
          <div className="flex items-end gap-6">
            <div>
              <p className="text-white/40 text-[11px] uppercase tracking-widest font-medium mb-1">Total de vendas</p>
              <p className="text-4xl md:text-5xl font-black text-white">{isLoading ? '—' : totalVendas}</p>
            </div>
            {totalPremio > 0 && (
              <div className="mb-1">
                <p className="text-white/40 text-[11px] uppercase tracking-widest font-medium mb-1">Prêmio estimado</p>
                <p className="text-2xl font-black text-green-400">{brl(totalPremio)}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-4 md:p-6 lg:p-8 space-y-5">

        {/* ── Filtros ── */}
        <div className="bg-white border border-wf-border p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              className="w-full bg-white border border-wf-border px-3 py-2.5 text-sm text-wf-text-primary focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>

            <select
              value={campanhaId}
              onChange={(e) => { setCampanhaId(e.target.value); setPage(1); }}
              className="w-full bg-white border border-wf-border px-3 py-2.5 text-sm text-wf-text-primary focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="">Todas as campanhas</option>
              {campanhas.map((c: any) => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>

            <div>
              <label className="text-xs text-wf-text-muted block mb-1">Data início</label>
              <input
                type="date"
                value={dataInicio}
                onChange={(e) => { setDataInicio(e.target.value); setPage(1); }}
                className="w-full bg-white border border-wf-border px-3 py-2 text-sm text-wf-text-primary focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div>
              <label className="text-xs text-wf-text-muted block mb-1">Data fim</label>
              <input
                type="date"
                value={dataFim}
                onChange={(e) => { setDataFim(e.target.value); setPage(1); }}
                className="w-full bg-white border border-wf-border px-3 py-2 text-sm text-wf-text-primary focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>

          {hasFilters && (
            <button onClick={resetFilters} className="text-xs text-wf-text-muted hover:text-wf-text-primary">
              Limpar filtros
            </button>
          )}
        </div>

        {/* ── Lista ── */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-24" />)}
          </div>
        ) : vendas.length === 0 ? (
          <p className="text-center text-wf-text-secondary text-sm py-8">Nenhuma venda encontrada</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {vendas.map((v: any) => {
              const premioVenda = v.itens.reduce((s: number, i: any) => s + Number(i.premio_estimado ?? 0), 0);
              return (
                <div key={v.id} className="bg-white border border-wf-border overflow-hidden">
                  {/* Header */}
                  <div className="px-4 pt-4 pb-3 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-black text-wf-text-primary uppercase tracking-wide truncate">{v.campanha_nome}</p>
                      <p className="text-[11px] text-wf-text-muted mt-0.5">{fmtDate(v.created_at)}</p>
                    </div>
                    <Badge variant={statusToBadge(v.status)} className="shrink-0 mt-0.5">{v.status}</Badge>
                  </div>

                  {/* Itens */}
                  <div className="px-4 pb-3 space-y-2 border-t border-wf-border/60 pt-3">
                    {v.itens.map((item: any) => (
                      <div key={item.id} className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-1 h-1 rounded-full bg-wf-red shrink-0" />
                          <p className="text-xs text-wf-text-secondary font-medium truncate">{item.produto_nome}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[11px] text-wf-text-muted tabular-nums">{Number(item.metragem).toLocaleString('pt-BR')}m</span>
                          <span className="text-[11px] font-bold text-green-600 tabular-nums">{brl(Number(item.premio_estimado ?? 0))}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Footer */}
                  <div className="bg-[#111827] px-4 py-2.5 flex items-center justify-between">
                    <p className="text-white/40 text-[9px] uppercase tracking-widest">
                      {v.itens.length} produto{v.itens.length !== 1 ? 's' : ''} · Total estimado
                    </p>
                    <p className="text-green-400 font-black">{brl(premioVenda)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Paginação ── */}
        {data && data.totalPages > 1 && (
          <div className="flex justify-center items-center gap-4">
            <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="text-xs text-wf-text-secondary disabled:opacity-30">← Anterior</button>
            <span className="text-xs text-wf-text-muted">{page} / {data.totalPages}</span>
            <button disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)} className="text-xs text-wf-text-secondary disabled:opacity-30">Próxima →</button>
          </div>
        )}
      </div>
    </div>
  );
}
