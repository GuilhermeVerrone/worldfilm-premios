import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { Skeleton } from '../../components/ui/Skeleton';
import { cn } from '../../lib/utils';

function brl(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function calcularPremio(metragem: number, corte: number, valor: number): number {
  if (!corte || !valor) return 0;
  return Math.floor(metragem / corte) * valor;
}

const STEP_LABELS = ['Campanha', 'Produtos e metragens', 'Confirmação'];

export default function VendaNova() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<{ premio: number } | null>(null);
  const [error, setError] = useState('');

  const [campanhaId, setCampanhaId] = useState(searchParams.get('campanha_id') ?? '');
  const [metragensMap, setMetragensMap] = useState<Record<string, string>>({});

  const { data: campanhasData, isLoading: loadingCampanhas } = useQuery({
    queryKey: ['campanhas-vendedor-wizard'],
    queryFn: () => api.get('/campanhas').then((r) => r.data.data as any[]),
  });

  const campanhas: any[] = campanhasData ?? [];

  const { data: campanhaDetalhe } = useQuery({
    queryKey: ['campanha-detalhe-wizard', campanhaId],
    enabled: !!campanhaId,
    queryFn: () => api.get(`/campanhas/${campanhaId}`).then((r) => r.data),
  });

  const premios: any[] = campanhaDetalhe?.data?.[0]?.premios ?? campanhaDetalhe?.premios ?? [];
  const campanhaSelecionada = campanhas.find((c) => c.id === campanhaId) ?? campanhaDetalhe?.data?.[0] ?? campanhaDetalhe;
  const metragemAcumulada: Record<string, number> = campanhaDetalhe?.metragem_acumulada ?? {};

  const itensVenda = premios.filter((p) => Number(metragensMap[p.produto_id]) > 0);
  const premioTotal = itensVenda.reduce((acc, p) => {
    const anterior = metragemAcumulada[p.produto_id] ?? 0;
    const nova = Number(metragensMap[p.produto_id]);
    const corte = Number(p.metragem_corte);
    const valor = Number(p.valor_premio);
    return acc + calcularPremio(anterior + nova, corte, valor) - calcularPremio(anterior, corte, valor);
  }, 0);

  useEffect(() => {
    if (searchParams.get('campanha_id') && campanhaId) setStep(2);
  }, []);

  function setMetragem(produtoId: string, value: string) {
    setMetragensMap((prev) => ({ ...prev, [produtoId]: value }));
  }

  function resetForm() {
    setDone(null); setStep(1); setCampanhaId(''); setMetragensMap({});
  }

  async function handleSubmit() {
    setError('');
    setSubmitting(true);
    try {
      await api.post('/vendas/lote', {
        campanha_id: campanhaId,
        itens: itensVenda.map((p) => ({
          produto_id: p.produto_id,
          metragem: Number(metragensMap[p.produto_id]),
        })),
      });
      setDone({ premio: premioTotal });
    } catch (err: any) {
      if (err?.response?.status === 409) {
        setError(err.response.data?.message ?? 'Venda duplicada detectada.');
      } else {
        setError(err?.response?.data?.message ?? 'Erro ao registrar venda');
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="max-w-lg mx-auto p-6 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-16 h-16 bg-green-600 flex items-center justify-center mb-4">
          <span className="text-2xl text-white font-bold">✓</span>
        </div>
        <h2 className="text-xl font-bold text-wf-text-primary uppercase tracking-wide mb-1">Venda registrada!</h2>
        <p className="text-sm text-wf-text-muted mb-1">Prêmio estimado:</p>
        <p className="text-3xl font-bold text-green-600 mb-2">{brl(done.premio)}</p>
        <p className="text-xs text-wf-text-muted mb-8">Será confirmado em até 3 dias úteis</p>
        <div className="flex flex-col gap-2 w-full">
          <button
            onClick={() => navigate('/vendedor/vendas')}
            className="w-full py-3 bg-gray-50 border border-wf-border hover:bg-wf-border text-wf-text-primary font-bold uppercase tracking-widest text-sm transition-colors"
          >
            Ver minhas vendas
          </button>
          <button
            onClick={resetForm}
            className="w-full py-3 bg-wf-red hover:bg-wf-red-dark text-white font-bold uppercase tracking-widest text-sm transition-colors"
          >
            Registrar outra venda
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 lg:p-8 pb-8">
      <button
        onClick={() => step > 1 ? setStep(s => s - 1) : navigate(-1)}
        className="text-xs text-wf-text-muted hover:text-wf-text-primary mb-3 flex items-center gap-1 uppercase tracking-wider"
      >
        ← {step > 1 ? 'Voltar' : 'Cancelar'}
      </button>

      <p className="text-[10px] text-wf-text-muted uppercase tracking-widest mb-1">
        Passo {step} de 3 — {STEP_LABELS[step - 1]}
      </p>
      <div className="flex gap-1 mb-6">
        {[1, 2, 3].map((s) => (
          <div key={s} className={cn('h-1 flex-1 transition-colors', s <= step ? 'bg-wf-red' : 'bg-wf-border')} />
        ))}
      </div>

      {/* Step 1: Campanha */}
      {step === 1 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {loadingCampanhas ? (
            <>{[0,1,2].map(i => <Skeleton key={i} className="h-20" />)}</>
          ) : campanhas.length === 0 ? (
            <p className="col-span-full text-center text-wf-text-muted py-8 text-sm">Nenhuma campanha ativa</p>
          ) : (
            campanhas.map((c: any) => (
              <button
                key={c.id}
                onClick={() => { setCampanhaId(c.id); setStep(2); }}
                className={cn(
                  'w-full text-left bg-white border p-4 transition-colors hover:shadow-sm',
                  campanhaId === c.id ? 'border-wf-red bg-red-50' : 'border-wf-border hover:border-wf-text-muted',
                )}
              >
                <p className="text-sm font-bold text-wf-text-primary uppercase tracking-wide">{c.nome}</p>
                <p className="text-xs text-wf-text-muted mt-1">
                  Até {new Date(c.data_fim).toLocaleDateString('pt-BR')}
                </p>
              </button>
            ))
          )}
        </div>
      )}

      {/* Step 2: Produtos e metragens */}
      {step === 2 && (
        <div className="space-y-5">
          {premios.length === 0 ? (
            <p className="text-wf-text-muted text-sm text-center py-4">Carregando produtos...</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {premios.map((p: any) => {
                const met = metragensMap[p.produto_id] ?? '';
                const anterior = metragemAcumulada[p.produto_id] ?? 0;
                const nova = Number(met);
                const corte = Number(p.metragem_corte);
                const valor = Number(p.valor_premio);
                const premio = met && nova > 0
                  ? calcularPremio(anterior + nova, corte, valor) - calcularPremio(anterior, corte, valor)
                  : null;
                return (
                  <div
                    key={p.produto_id}
                    className={cn(
                      'bg-white border p-4 transition-colors',
                      met && Number(met) > 0 ? 'border-wf-red' : 'border-wf-border',
                    )}
                  >
                    <p className="text-sm font-bold text-wf-text-primary uppercase tracking-wide">{p.produto_nome ?? 'Produto'}</p>
                    <p className="text-xs text-wf-text-muted mt-0.5">
                      A cada {p.metragem_corte}m = {brl(Number(p.valor_premio))}
                    </p>
                    {anterior > 0 && (
                      <p className="text-[10px] text-wf-text-muted mb-3 mt-0.5">
                        Acumulado: {anterior.toLocaleString('pt-BR')}m · próximo prêmio em {corte - (anterior % corte)}m
                      </p>
                    )}
                    {anterior === 0 && <div className="mb-3" />}
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        placeholder="Metragem (m)"
                        value={met}
                        onChange={(e) => setMetragem(p.produto_id, e.target.value)}
                        className="flex-1 bg-white border border-wf-border px-3 py-2 text-wf-text-primary text-sm font-bold focus:outline-none focus:border-wf-red"
                      />
                      <span className="text-xs text-wf-text-muted shrink-0">m</span>
                    </div>
                    {premio !== null && (
                      <div className="mt-2 flex items-center justify-between bg-green-50 px-3 py-2">
                        <p className="text-[10px] text-wf-text-muted uppercase tracking-widest">Prêmio estimado</p>
                        <p className="text-sm font-bold text-green-600">{brl(premio)}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {itensVenda.length > 0 && (
            <div className="bg-[#111827] px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-white/40 text-[9px] uppercase tracking-widest">
                  {itensVenda.length} produto{itensVenda.length > 1 ? 's' : ''} selecionado{itensVenda.length > 1 ? 's' : ''}
                </p>
                <p className="text-white/40 text-[9px] uppercase tracking-widest mt-0.5">Total estimado</p>
              </div>
              <p className="text-green-400 text-xl font-black">{brl(premioTotal)}</p>
            </div>
          )}

          <button
            disabled={itensVenda.length === 0}
            onClick={() => setStep(3)}
            className="w-full py-3 bg-wf-red hover:bg-wf-red-dark disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold uppercase tracking-widest text-sm transition-colors"
          >
            Próximo
          </button>
        </div>
      )}

      {/* Step 3: Confirmação */}
      {step === 3 && (
        <div className="space-y-4 max-w-lg">
          <div className="bg-white rounded-xl shadow-sm p-4 space-y-3 text-sm">
            <Row label="Campanha" value={campanhaSelecionada?.nome ?? campanhaId} />
            {itensVenda.map((p) => (
              <Row key={p.produto_id} label={p.produto_nome ?? 'Produto'} value={`${metragensMap[p.produto_id]}m`} />
            ))}
          </div>

          <div className="bg-green-50 border border-green-200 px-4 py-4 text-center">
            <p className="text-[10px] text-wf-text-muted uppercase tracking-widest mb-1">Prêmio estimado</p>
            <p className="text-3xl font-bold text-green-600">{brl(premioTotal)}</p>
            <p className="text-xs text-wf-text-muted mt-2">Será confirmado em até 3 dias úteis</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full py-3 bg-wf-red hover:bg-wf-red-dark disabled:opacity-60 text-white font-bold uppercase tracking-widest text-sm transition-colors"
          >
            {submitting ? 'Registrando...' : 'Confirmar e registrar'}
          </button>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2 border-b border-wf-border pb-2 last:border-0 last:pb-0">
      <span className="text-wf-text-muted">{label}</span>
      <span className="text-wf-text-primary font-medium text-right">{value}</span>
    </div>
  );
}
