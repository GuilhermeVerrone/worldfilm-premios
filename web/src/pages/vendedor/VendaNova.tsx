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

function maskPlaca(v: string): string {
  const d = v.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7);
  if (d.length <= 3) return d;
  return `${d.slice(0, 3)}-${d.slice(3)}`;
}

const STEP_LABELS = ['Campanha', 'Produto e metragem', 'Dados do cliente', 'Confirmação'];

export default function VendaNova() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<{ premio: number } | null>(null);
  const [error, setError] = useState('');

  const [campanhaId, setCampanhaId] = useState(searchParams.get('campanha_id') ?? '');
  const [produtoId, setProdutoId] = useState('');
  const [metragem, setMetragem] = useState('');
  const [nomeCliente, setNomeCliente] = useState('');
  const [cpfCliente, setCpfCliente] = useState('');
  const [placa, setPlaca] = useState('');

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
  const produtoSelecionado = premios.find((p) => p.produto_id === produtoId);

  const regra = produtoSelecionado;
  const premioEstimado = regra && metragem
    ? calcularPremio(Number(metragem), Number(regra.metragem_corte), Number(regra.valor_premio))
    : 0;

  useEffect(() => {
    if (searchParams.get('campanha_id') && campanhaId) {
      setStep(2);
    }
  }, []);

  const categoriaPelicula = produtoSelecionado?.categoria === 'pelicula' || produtoSelecionado?.produto_categoria === 'pelicula';

  async function handleSubmit() {
    if (categoriaPelicula && !placa) {
      setError('Placa do veículo obrigatória para película');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const body: any = {
        campanha_id: campanhaId,
        produto_id: produtoId,
        metragem: Number(metragem),
      };
      if (nomeCliente) body.nome_cliente = nomeCliente;
      if (cpfCliente) body.cpf_cliente = cpfCliente.replace(/\D/g, '');
      if (placa) body.placa_veiculo = placa.replace('-', '');

      await api.post('/vendas', body);
      setDone({ premio: premioEstimado });
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
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] text-center">
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
            onClick={() => { setDone(null); setStep(1); setCampanhaId(''); setProdutoId(''); setMetragem(''); setNomeCliente(''); setCpfCliente(''); setPlaca(''); }}
            className="w-full py-3 bg-wf-red hover:bg-wf-red-dark text-white font-bold uppercase tracking-widest text-sm transition-colors"
          >
            Registrar outra venda
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 pb-8">
      <button
        onClick={() => step > 1 ? setStep(s => s - 1) : navigate(-1)}
        className="text-xs text-wf-text-muted hover:text-wf-text-primary mb-3 flex items-center gap-1 uppercase tracking-wider"
      >
        ← {step > 1 ? 'Voltar' : 'Cancelar'}
      </button>

      <p className="text-[10px] text-wf-text-muted uppercase tracking-widest mb-1">Passo {step} de 4 — {STEP_LABELS[step - 1]}</p>
      <div className="flex gap-1 mb-5">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className={cn('h-1 flex-1 transition-colors', s <= step ? 'bg-wf-red' : 'bg-wf-border')} />
        ))}
      </div>

      {/* Step 1: Campanha */}
      {step === 1 && (
        <div className="space-y-3">
          {loadingCampanhas ? (
            <>{[0,1,2].map(i => <Skeleton key={i} className="h-20" />)}</>
          ) : campanhas.length === 0 ? (
            <p className="text-center text-wf-text-muted py-8 text-sm">Nenhuma campanha ativa</p>
          ) : (
            campanhas.map((c: any) => (
              <button
                key={c.id}
                onClick={() => { setCampanhaId(c.id); setStep(2); }}
                className={cn(
                  'w-full text-left bg-white border p-4 transition-colors',
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

      {/* Step 2: Produto e metragem */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="space-y-3">
            {premios.length === 0 ? (
              <p className="text-wf-text-muted text-sm text-center py-4">Carregando produtos...</p>
            ) : (
              premios.map((p: any) => (
                <button
                  key={p.produto_id}
                  onClick={() => setProdutoId(p.produto_id)}
                  className={cn(
                    'w-full text-left bg-white border p-4 transition-colors',
                    produtoId === p.produto_id ? 'border-wf-red bg-red-50' : 'border-wf-border hover:border-wf-text-muted',
                  )}
                >
                  <p className="text-sm font-bold text-wf-text-primary uppercase tracking-wide">{p.produto_nome ?? 'Produto'}</p>
                  <p className="text-xs text-wf-text-muted mt-0.5">
                    A cada {p.metragem_corte}m = {brl(Number(p.valor_premio))}
                  </p>
                </button>
              ))
            )}
          </div>

          {produtoId && (
            <div>
              <label className="text-[11px] font-bold uppercase tracking-widest text-wf-text-muted block mb-1">Metragem (m)</label>
              <input
                type="number"
                inputMode="numeric"
                min={1}
                placeholder="Ex: 150"
                value={metragem}
                onChange={(e) => setMetragem(e.target.value)}
                className="w-full bg-white border border-wf-border px-3 py-3 text-wf-text-primary text-lg font-bold focus:outline-none focus:border-wf-red"
              />
              {regra && metragem && (
                <div className="mt-3 bg-green-50 border border-green-200 px-4 py-3">
                  <p className="text-[10px] text-wf-text-muted uppercase tracking-widest">Prêmio estimado</p>
                  <p className="text-2xl font-bold text-green-600">{brl(premioEstimado)}</p>
                  <p className="text-xs text-wf-text-muted mt-0.5">
                    A cada {regra.metragem_corte}m de {regra.produto_nome ?? 'produto'} = {brl(Number(regra.valor_premio))}
                  </p>
                </div>
              )}
            </div>
          )}

          <button
            disabled={!produtoId || !metragem || Number(metragem) < 1}
            onClick={() => setStep(3)}
            className="w-full py-3 bg-wf-red hover:bg-wf-red-dark disabled:opacity-40 disabled:cursor-not-allowed text-wf-text-primary font-bold uppercase tracking-widest text-sm transition-colors"
          >
            Próximo
          </button>
        </div>
      )}

      {/* Step 3: Dados do cliente */}
      {step === 3 && (
        <div className="space-y-4">
          <div>
            <label className="text-[11px] font-bold uppercase tracking-widest text-wf-text-muted block mb-1">Nome do cliente</label>
            <input
              type="text"
              placeholder="Opcional"
              value={nomeCliente}
              onChange={(e) => setNomeCliente(e.target.value)}
              className="w-full bg-white border border-wf-border px-3 py-2.5 text-sm text-wf-text-primary placeholder-wf-text-disabled focus:outline-none focus:border-wf-red"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold uppercase tracking-widest text-wf-text-muted block mb-1">CPF/CNPJ do cliente</label>
            <input
              type="text"
              inputMode="numeric"
              placeholder="Opcional"
              value={cpfCliente}
              onChange={(e) => setCpfCliente(e.target.value)}
              className="w-full bg-white border border-wf-border px-3 py-2.5 text-sm text-wf-text-primary placeholder-wf-text-disabled focus:outline-none focus:border-wf-red"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold uppercase tracking-widest text-wf-text-muted block mb-1">
              Placa do veículo {categoriaPelicula ? '*' : '(opcional)'}
            </label>
            <input
              type="text"
              placeholder="AAA-0000"
              value={placa}
              onChange={(e) => setPlaca(maskPlaca(e.target.value))}
              maxLength={8}
              className="w-full bg-white border border-wf-border px-3 py-2.5 text-sm text-wf-text-primary placeholder-wf-text-disabled uppercase focus:outline-none focus:border-wf-red"
            />
          </div>
          <button
            onClick={() => setStep(4)}
            disabled={categoriaPelicula && !placa}
            className="w-full py-3 bg-wf-red hover:bg-wf-red-dark disabled:opacity-40 disabled:cursor-not-allowed text-wf-text-primary font-bold uppercase tracking-widest text-sm transition-colors"
          >
            Próximo
          </button>
        </div>
      )}

      {/* Step 4: Confirmação */}
      {step === 4 && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm p-4 space-y-3 text-sm">
            <Row label="Campanha" value={campanhaSelecionada?.nome ?? campanhaId} />
            <Row label="Produto" value={produtoSelecionado?.produto_nome ?? produtoId} />
            <Row label="Metragem" value={`${metragem}m`} />
            {nomeCliente && <Row label="Cliente" value={nomeCliente} />}
            {placa && <Row label="Placa" value={placa} />}
          </div>

          <div className="bg-green-50 border border-green-200 px-4 py-4 text-center">
            <p className="text-[10px] text-wf-text-muted uppercase tracking-widest mb-1">Prêmio estimado</p>
            <p className="text-3xl font-bold text-green-600">{brl(premioEstimado)}</p>
            <p className="text-xs text-wf-text-muted mt-2">Será confirmado em até 3 dias úteis</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full py-3 bg-wf-red hover:bg-wf-red-dark disabled:opacity-60 text-wf-text-primary font-bold uppercase tracking-widest text-sm transition-colors"
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
