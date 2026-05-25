import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { Skeleton } from '../../components/ui/Skeleton';
import { cn } from '../../lib/utils';

function brl(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function daysLeft(dataFim: string): number {
  return Math.max(0, Math.ceil((new Date(dataFim).getTime() - Date.now()) / 86_400_000));
}

type Filter = 'todas' | 'ativas' | 'encerradas';

export default function VendedorCampanhas() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('ativas');

  const { data, isLoading } = useQuery({
    queryKey: ['campanhas-vendedor-list'],
    queryFn: () => api.get('/campanhas').then((r) => r.data.data as any[]),
  });

  const { data: encerradas, isLoading: loadingEnc } = useQuery({
    queryKey: ['campanhas-vendedor-encerradas'],
    enabled: filter === 'encerradas' || filter === 'todas',
    queryFn: () => api.get('/campanhas/encerradas').then((r) => r.data.data as any[]).catch(() => [] as any[]),
  });

  const allCampanhas = [
    ...(data ?? []),
    ...(filter !== 'ativas' ? (encerradas ?? []) : []),
  ];

  const filtered = allCampanhas.filter((c) => {
    const matchSearch = c.nome.toLowerCase().includes(search.toLowerCase());
    const isEncerrada = new Date(c.data_fim) < new Date();
    if (filter === 'ativas') return matchSearch && !isEncerrada;
    if (filter === 'encerradas') return matchSearch && isEncerrada;
    return matchSearch;
  });

  const loading = isLoading || (filter !== 'ativas' && loadingEnc);

  const chips: { key: Filter; label: string }[] = [
    { key: 'ativas', label: 'Ativas' },
    { key: 'encerradas', label: 'Encerradas' },
    { key: 'todas', label: 'Todas' },
  ];

  return (
    <div>
      {/* ── Header ── */}
      <div className="bg-[#111827]">
        <div className="max-w-7xl mx-auto px-4 md:px-8 pt-5 pb-6 min-h-[140px]">
          <h1 className="text-white text-lg font-black uppercase tracking-widest mb-4">Campanhas</h1>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Buscar campanha..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white/10 border border-white/10 pl-9 pr-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-wf-red transition-colors"
              />
            </div>
            <div className="flex gap-2 shrink-0">
              {chips.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={cn(
                    'px-3 py-1 text-[10px] font-black uppercase tracking-widest transition-colors',
                    filter === key ? 'bg-wf-red text-white' : 'bg-white/10 text-white/50 hover:text-white/80',
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Grid ── */}
      <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="overflow-hidden rounded-xl shadow-sm">
                <Skeleton className="h-48 w-full" />
                <div className="p-4 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center border border-dashed border-wf-border">
            <p className="text-wf-text-secondary font-semibold">Nenhuma campanha encontrada</p>
            <p className="text-wf-text-muted text-sm mt-1">Continue registrando suas vendas!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((c: any) => {
              const days = daysLeft(c.data_fim);
              const encerrada = days === 0 && new Date(c.data_fim) < new Date();
              const maxPremio = Math.max(0, ...((c.premios ?? []).map((p: any) => Number(p.valor_premio))));
              const meuPremio = Number(c.desempenho?.total_premio ?? 0);
              const urgent = !encerrada && days <= 3;

              return (
                <button
                  key={c.id}
                  onClick={() => navigate(`/vendedor/campanhas/${c.id}`)}
                  className="w-full text-left overflow-hidden rounded-xl shadow-sm bg-white active:scale-[0.99] transition-transform hover:shadow-md"
                >
                  <div className="relative h-48 bg-[#111827] overflow-hidden">
                    {c.imagem_url ? (
                      <img
                        src={c.imagem_url}
                        alt={c.nome}
                        className={cn('w-full h-full object-cover transition-opacity', encerrada && 'opacity-50 grayscale')}
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-6 gap-3">
                        <div className="w-10 h-0.5 bg-wf-red" />
                        <p className="text-white text-lg font-black uppercase tracking-wide text-center leading-snug">{c.nome}</p>
                        <div className="w-10 h-0.5 bg-wf-red" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />
                    <span className={cn(
                      'absolute top-3 left-3 text-[9px] font-black uppercase tracking-widest px-2 py-1',
                      encerrada ? 'bg-black/60 text-white/60' : urgent ? 'bg-wf-red text-white' : 'bg-green-500 text-white',
                    )}>
                      {encerrada ? 'Encerrada' : urgent ? (days === 0 ? 'Hoje!' : `${days}d`) : 'Ativa'}
                    </span>
                    {maxPremio > 0 && (
                      <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                        <div>
                          <p className="text-white/60 text-[9px] uppercase tracking-widest">Prêmio máximo</p>
                          <p className="text-white text-xl font-black">{brl(maxPremio)}</p>
                        </div>
                        {meuPremio > 0 && (
                          <div className="text-right">
                            <p className="text-white/60 text-[9px] uppercase tracking-widest">Meu prêmio</p>
                            <p className="text-green-400 text-sm font-black">{brl(meuPremio)}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="px-4 py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-wf-text-primary truncate">{c.nome}</p>
                      <p className="text-xs text-wf-text-muted mt-0.5 capitalize">{c.tipo ?? 'Campanha'}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      {!encerrada && (
                        <p className={cn('text-xs font-bold', urgent ? 'text-wf-red' : 'text-wf-text-muted')}>
                          {days === 0 ? 'Encerra hoje' : `${days} dia${days !== 1 ? 's' : ''}`}
                        </p>
                      )}
                      <svg className="w-4 h-4 text-wf-text-muted mt-1 ml-auto" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
