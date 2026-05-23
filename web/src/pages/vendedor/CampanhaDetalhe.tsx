import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { Skeleton } from '../../components/ui/Skeleton';
import { Badge, statusToBadge } from '../../components/ui/Badge';
import { cn } from '../../lib/utils';

function brl(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('pt-BR');
}

function daysLeft(dataFim: string): number {
  return Math.max(0, Math.ceil((new Date(dataFim).getTime() - Date.now()) / 86_400_000));
}

export default function VendedorCampanhaDetalhe() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [imageExpanded, setImageExpanded] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['campanha-vendedor', id],
    queryFn: () => api.get(`/campanhas/${id}`).then((r) => r.data),
  });

  if (isLoading) {
    return (
      <div>
        <Skeleton className="h-52 w-full" />
        <div className="p-4 space-y-3">
          <Skeleton className="h-7 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <div className="space-y-2 mt-4">
            {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-16" />)}
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const campanha = data?.data?.[0] ?? data?.campanha;
  if (!campanha) return null;

  const premios: any[] = campanha.premios ?? data?.premios ?? [];
  const desempenho = data?.desempenho ?? null;
  const days = daysLeft(campanha.data_fim);
  const encerrada = campanha.status !== 'ativa';
  const urgent = !encerrada && days <= 3;

  // Sort prizes by valor_premio descending
  const premiosOrdenados = [...premios].sort((a, b) => Number(b.valor_premio) - Number(a.valor_premio));

  return (
    <div className="pb-24">

      {/* ── Hero image ── */}
      <div className="relative bg-[#0A0A0A] overflow-hidden" style={{ height: campanha.imagem_url ? 220 : 160 }}>
        {campanha.imagem_url ? (
          <>
            <img
              src={campanha.imagem_url}
              alt={campanha.nome}
              className={cn(
                'w-full h-full object-cover transition-opacity',
                encerrada && 'grayscale opacity-50',
              )}
            />
            {/* Tap to expand hint */}
            <button
              onClick={() => setImageExpanded(true)}
              className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-black/60 px-2.5 py-1.5 text-white/80 text-[10px] font-bold uppercase tracking-widest"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-5h-4m4 0v4m0-4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
              Ampliar
            </button>
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-3 p-8">
            <div className="w-12 h-0.5 bg-wf-red" />
            <p className="text-white text-xl font-black uppercase tracking-wide text-center leading-snug">
              {campanha.nome}
            </p>
            <div className="w-12 h-0.5 bg-wf-red" />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent pointer-events-none" />

        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 w-8 h-8 bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Bottom: name + status + countdown */}
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-3 flex items-end justify-between gap-2">
          <div className="min-w-0">
            {campanha.imagem_url && (
              <p className="text-white font-black text-base leading-tight line-clamp-1">{campanha.nome}</p>
            )}
            <div className="mt-1">
              <Badge variant={statusToBadge(campanha.status)}>{campanha.status}</Badge>
            </div>
          </div>
          {!encerrada && (
            <div className={cn('shrink-0 px-3 py-2 text-center', urgent ? 'bg-wf-red' : 'bg-black/60')}>
              <p className="text-white/70 text-[8px] uppercase tracking-widest leading-none">Encerra em</p>
              <p className="text-white font-black text-xl leading-tight">
                {days === 0 ? 'Hoje' : `${days}d`}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 space-y-5">

        {/* ── Vigência ── */}
        <div className="flex gap-3">
          <div className="flex-1 bg-white rounded-xl shadow-sm p-3">
            <p className="text-[9px] text-wf-text-muted uppercase tracking-widest mb-1">Início</p>
            <p className="text-sm font-bold text-wf-text-primary">{fmtDate(campanha.data_inicio)}</p>
          </div>
          <div className="flex-1 bg-white rounded-xl shadow-sm p-3">
            <p className="text-[9px] text-wf-text-muted uppercase tracking-widest mb-1">Fim</p>
            <p className="text-sm font-bold text-wf-text-primary">{fmtDate(campanha.data_fim)}</p>
          </div>
        </div>

        {/* ── Meu desempenho ── */}
        <div className="bg-[#0A0A0A] relative overflow-hidden">
          <div className="absolute left-0 top-0 w-1 h-full bg-wf-red" />
          <div className="absolute top-0 right-0 w-20 h-20 bg-wf-red/10 blur-2xl pointer-events-none" />
          <div className="px-5 py-4 pl-6">
            <p className="text-white/40 text-[9px] uppercase tracking-widest mb-3">Meu desempenho</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-white/40 text-[9px] uppercase tracking-widest mb-1">Vendas registradas</p>
                <p className="text-4xl font-black text-white">{desempenho?.total_vendas ?? 0}</p>
              </div>
              <div>
                <p className="text-white/40 text-[9px] uppercase tracking-widest mb-1">Prêmio acumulado</p>
                <p className="text-2xl font-black text-green-400">{brl(Number(desempenho?.total_premio ?? 0))}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Tabela de prêmios ── */}
        {premiosOrdenados.length > 0 && (
          <div>
            {/* Header */}
            <div className="flex items-baseline justify-between mb-3">
              <p className="text-xs font-black text-wf-text-primary uppercase tracking-widest">Premiação</p>
              {premiosOrdenados[0]?.metragem_corte && (
                <p className="text-[10px] text-wf-text-muted uppercase tracking-widest">
                  A cada {premiosOrdenados[0].metragem_corte}m cortados
                </p>
              )}
            </div>

            {/* Prize cards — big and scannable */}
            <div className="space-y-2">
              {premiosOrdenados.map((p: any, i) => {
                const isTop = i === 0;
                return (
                  <div
                    key={p.produto_id}
                    className={cn(
                      'flex items-center justify-between px-4 py-3 border',
                      isTop
                        ? 'bg-[#0A0A0A] border-transparent'
                        : 'bg-white border-wf-border',
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      {isTop && (
                        <p className="text-wf-red text-[9px] font-black uppercase tracking-widest mb-0.5">
                          Maior prêmio
                        </p>
                      )}
                      <p className={cn(
                        'font-bold truncate',
                        isTop ? 'text-white text-base' : 'text-wf-text-primary text-sm',
                      )}>
                        {p.produto_nome ?? p.produto_id}
                      </p>
                      {/* Show metragem only if varies between prizes */}
                      {premiosOrdenados.some((x: any) => x.metragem_corte !== p.metragem_corte) && (
                        <p className={cn('text-xs mt-0.5', isTop ? 'text-white/40' : 'text-wf-text-muted')}>
                          A cada {p.metragem_corte}m
                        </p>
                      )}
                    </div>
                    <p className={cn(
                      'font-black shrink-0 ml-4',
                      isTop ? 'text-green-400 text-2xl' : 'text-green-600 text-xl',
                    )}>
                      {brl(Number(p.valor_premio))}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Metragem note (when all prizes share same metragem) */}
            {premiosOrdenados.length > 0 &&
              premiosOrdenados.every((p: any) => p.metragem_corte === premiosOrdenados[0].metragem_corte) && (
              <p className="text-[10px] text-wf-text-muted mt-2 text-center">
                Prêmio por corte de {premiosOrdenados[0].metragem_corte}m
              </p>
            )}
          </div>
        )}

        {campanha.descricao && (
          <p className="text-sm text-wf-text-secondary leading-relaxed border-l-2 border-wf-border pl-3">
            {campanha.descricao}
          </p>
        )}
      </div>

      {/* ── Sticky CTA ── */}
      {!encerrada && (
        <div className="fixed bottom-16 left-0 right-0 p-3 bg-white border-t border-wf-border z-20">
          <div className="max-w-[480px] mx-auto">
            <button
              onClick={() => navigate(`/vendedor/venda/nova?campanha_id=${id}`)}
              className="w-full py-4 bg-wf-red hover:bg-wf-red-dark text-white text-xs font-black uppercase tracking-widest transition-colors"
            >
              Registrar venda nesta campanha
            </button>
          </div>
        </div>
      )}

      {/* ── Lightbox ── */}
      {imageExpanded && campanha.imagem_url && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
          onClick={() => setImageExpanded(false)}
        >
          <button
            className="absolute top-5 right-5 w-9 h-9 bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            onClick={() => setImageExpanded(false)}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <img
            src={campanha.imagem_url}
            alt={campanha.nome}
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
