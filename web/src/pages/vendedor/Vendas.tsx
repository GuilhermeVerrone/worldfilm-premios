import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
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
          limit: 10,
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

  return (
    <div className="p-4 pb-8 space-y-4">
      <p className="text-sm font-semibold text-wf-text-primary">Minhas vendas</p>

      {/* Filtros */}
      <div className="space-y-2">
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="w-full bg-white border border-wf-border px-3 py-2.5 text-sm text-wf-text-primary focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        {campanhas.length > 0 && (
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
        )}

        <div className="grid grid-cols-2 gap-2">
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

        {(status || campanhaId || dataInicio || dataFim) && (
          <button onClick={resetFilters} className="text-xs text-wf-text-muted hover:text-wf-text-primary">
            Limpar filtros
          </button>
        )}
      </div>

      {/* Lista */}
      {isLoading ? (
        <div className="space-y-2">{[0,1,2].map(i => <Skeleton key={i} className="h-20" />)}</div>
      ) : vendas.length === 0 ? (
        <p className="text-center text-wf-text-secondary text-sm py-8">Nenhuma venda encontrada</p>
      ) : (
        <div className="space-y-2">
          {vendas.map((v: any) => (
            <div
              key={v.id}
              onClick={() => navigate(`/vendedor/vendas/${v.id}`)}
              className="bg-white border border-wf-border px-4 py-3 cursor-pointer hover:border-wf-border transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-wf-text-primary truncate">{v.produto_nome}</p>
                  <p className="text-xs text-wf-text-secondary">{v.campanha_nome}</p>
                  <p className="text-xs text-wf-text-muted mt-0.5">{fmtDate(v.created_at)} · {v.metragem}m</p>
                </div>
                <div className="shrink-0 text-right">
                  <Badge variant={statusToBadge(v.status)}>{v.status}</Badge>
                  <p className="text-xs text-green-600 mt-1">{brl(Number(v.premio_estimado ?? 0))}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Paginação */}
      {data && data.totalPages > 1 && (
        <div className="flex justify-center items-center gap-4">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="text-xs text-wf-text-secondary disabled:opacity-30">← Anterior</button>
          <span className="text-xs text-wf-text-muted">{page} / {data.totalPages}</span>
          <button disabled={page >= data.totalPages} onClick={() => setPage(p => p + 1)} className="text-xs text-wf-text-secondary disabled:opacity-30">Próxima →</button>
        </div>
      )}
    </div>
  );
}
