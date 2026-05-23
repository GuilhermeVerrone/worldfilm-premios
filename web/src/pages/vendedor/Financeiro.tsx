import { useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { Skeleton } from '../../components/ui/Skeleton';
import { Badge, statusToBadge } from '../../components/ui/Badge';
import { useToast } from '../../contexts/ToastContext';
import { cn } from '../../lib/utils';

function brl(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('pt-BR');
}

type TabFilter = 'todos' | 'creditos' | 'saques';

export default function VendedorFinanceiro() {
  const { vendedor } = useAuthStore();
  const qc = useQueryClient();
  const { success, error: toastError } = useToast();

  const [tab, setTab] = useState<TabFilter>('todos');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [valor, setValor] = useState('');
  const [comprovante, setComprovante] = useState<any>(null);

  const { data: saldo, isLoading: loadingSaldo } = useQuery({
    queryKey: ['financeiro-saldo'],
    queryFn: () => api.get('/financeiro/saldo').then((r) => r.data),
  });

  const { data: extrato, isLoading: loadingExtrato } = useQuery({
    queryKey: ['financeiro-extrato', tab, page],
    queryFn: () =>
      api
        .get('/financeiro/extrato', {
          params: {
            tipo: tab === 'todos' ? undefined : tab === 'creditos' ? 'credito' : 'saque',
            page,
            limit: 10,
          },
        })
        .then((r) => r.data),
  });

  const solicitarMutation = useMutation({
    mutationFn: () =>
      api.post('/financeiro/solicitar', {
        valor: Number(valor),
        chave_pix: vendedor?.cpf ?? '',
      }),
    onSuccess: () => {
      success('Solicitação enviada com sucesso!');
      setModalOpen(false);
      setValor('');
      qc.invalidateQueries({ queryKey: ['financeiro-saldo'] });
      qc.invalidateQueries({ queryKey: ['financeiro-extrato'] });
    },
    onError: (err: any) => toastError(err?.response?.data?.message ?? 'Erro ao solicitar pagamento'),
  });

  const disponivel = saldo?.saldo_disponivel ?? 0;
  const extratoDados: any[] = extrato?.data ?? [];

  const tabs: { key: TabFilter; label: string }[] = [
    { key: 'todos', label: 'Todos' },
    { key: 'creditos', label: 'Créditos' },
    { key: 'saques', label: 'Saques' },
  ];

  return (
    <div className="pb-8">

      {/* ── Wallet hero ── */}
      <div className="bg-[#0A0A0A] px-5 pt-5 pb-8">
        <h1 className="text-white/40 text-[10px] uppercase tracking-widest mb-5">Carteira</h1>

        {loadingSaldo ? (
          <div className="h-44 bg-white/5 animate-pulse" />
        ) : (
          <div className="relative overflow-hidden border border-white/10 bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] p-5">
            <div className="absolute top-0 right-0 w-32 h-32 bg-wf-red/8 blur-3xl pointer-events-none" />
            <div className="absolute left-0 top-0 w-1 h-full bg-wf-red" />

            <div className="pl-4">
              <p className="text-white/40 text-[10px] uppercase tracking-widest mb-1">Disponível</p>
              <p className="text-5xl font-black text-white mb-4">{brl(disponivel)}</p>

              <div className="flex gap-6 mb-5 text-xs">
                <div>
                  <p className="text-white/30 text-[9px] uppercase tracking-widest">Bloqueado</p>
                  <p className="text-white/60 font-semibold mt-0.5">{brl(saldo?.saldo_bloqueado ?? 0)}</p>
                </div>
                <div>
                  <p className="text-white/30 text-[9px] uppercase tracking-widest">Total acumulado</p>
                  <p className="text-white/60 font-semibold mt-0.5">{brl(saldo?.total ?? 0)}</p>
                </div>
              </div>

              <button
                disabled={disponivel < 20}
                onClick={() => setModalOpen(true)}
                className="px-5 py-2.5 bg-wf-red hover:bg-wf-red-dark disabled:opacity-30 disabled:cursor-not-allowed text-white text-xs font-black uppercase tracking-widest transition-colors"
              >
                Solicitar pagamento
              </button>
              {disponivel < 20 && (
                <p className="text-white/30 text-[10px] mt-2">Mínimo R$ 20,00 para saque</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Extrato ── */}
      <div className="p-4">
        {/* Tab selector */}
        <div className="flex mb-4 border-b border-wf-border">
          {tabs.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => { setTab(key); setPage(1); }}
              className={cn(
                'flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest transition-colors border-b-2 -mb-px',
                tab === key
                  ? 'border-wf-red text-wf-red'
                  : 'border-transparent text-wf-text-muted hover:text-wf-text-secondary',
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {loadingExtrato ? (
          <div className="space-y-2">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-16" />)}</div>
        ) : extratoDados.length === 0 ? (
          <div className="py-12 text-center border border-dashed border-wf-border">
            <p className="text-wf-text-muted text-sm">Nenhuma transação</p>
          </div>
        ) : (
          <div className="space-y-2">
            {extratoDados.map((t: any) => (
              <button
                key={t.id}
                onClick={() => t.tipo === 'saque' && t.status === 'pago' && t.comprovante_url && setComprovante(t)}
                className={cn(
                  'w-full text-left bg-white rounded-xl shadow-sm px-4 py-3 flex items-center gap-3 transition-colors',
                  t.tipo === 'saque' && t.status === 'pago' && t.comprovante_url
                    ? 'hover:border-wf-text-muted active:scale-[0.99] cursor-pointer'
                    : 'cursor-default',
                )}
              >
                {/* Icon */}
                <div className={cn(
                  'w-8 h-8 shrink-0 flex items-center justify-center text-white text-xs font-black',
                  t.tipo === 'credito' ? 'bg-green-500' : 'bg-wf-text-muted',
                )}>
                  {t.tipo === 'credito' ? '+' : '−'}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm text-wf-text-primary font-medium truncate">{t.descricao}</p>
                  <p className="text-xs text-wf-text-muted">{fmtDate(t.created_at)}</p>
                </div>

                <div className="shrink-0 text-right">
                  <p className={cn('text-sm font-bold', t.tipo === 'credito' ? 'text-green-600' : 'text-wf-text-secondary')}>
                    {t.tipo === 'credito' ? '+' : '−'}{brl(Number(t.valor))}
                  </p>
                  <Badge variant={statusToBadge(t.status)} className="mt-0.5">{t.status}</Badge>
                </div>
              </button>
            ))}
          </div>
        )}

        {extrato && extrato.totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-5">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="text-xs font-bold text-wf-text-secondary disabled:opacity-30 uppercase tracking-widest"
            >
              ← Anterior
            </button>
            <span className="text-xs text-wf-text-muted">{page} / {extrato.totalPages}</span>
            <button
              disabled={page >= extrato.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="text-xs font-bold text-wf-text-secondary disabled:opacity-30 uppercase tracking-widest"
            >
              Próxima →
            </button>
          </div>
        )}
      </div>

      {/* ── Modal solicitação ── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-[#0A0A0A] px-5 py-4">
              <h3 className="text-white font-black uppercase tracking-widest text-sm">Solicitar pagamento</h3>
              <p className="text-white/40 text-xs mt-0.5">Chave PIX: {vendedor?.cpf ?? '—'}</p>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="text-[10px] font-bold text-wf-text-muted uppercase tracking-widest block mb-1.5">
                  Valor a sacar
                </label>
                <input
                  type="number"
                  min={20}
                  max={disponivel}
                  step={0.01}
                  placeholder="0,00"
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                  className="w-full bg-white border border-wf-border px-3 py-3 text-lg font-bold text-wf-text-primary focus:outline-none focus:border-wf-red transition-colors"
                />
                <div className="flex justify-between mt-1.5 text-xs text-wf-text-muted">
                  <span>Mínimo: R$ 20,00</span>
                  <button
                    onClick={() => setValor(String(disponivel))}
                    className="text-wf-red font-bold"
                  >
                    Usar tudo ({brl(disponivel)})
                  </button>
                </div>
              </div>

              <p className="text-xs text-wf-text-muted border-l-2 border-wf-border pl-3">
                Prazo de até 3 dias úteis para processamento.
              </p>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-3 border border-wf-border text-wf-text-secondary text-xs font-bold uppercase tracking-widest hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  disabled={!valor || Number(valor) < 20 || Number(valor) > disponivel || solicitarMutation.isPending}
                  onClick={() => solicitarMutation.mutate()}
                  className="flex-1 py-3 bg-wf-red hover:bg-wf-red-dark disabled:opacity-40 text-white text-xs font-black uppercase tracking-widest transition-colors"
                >
                  {solicitarMutation.isPending ? 'Enviando...' : 'Confirmar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal comprovante ── */}
      {comprovante && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setComprovante(null)}
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="bg-[#0A0A0A] px-5 py-4">
              <h3 className="text-white font-black uppercase tracking-widest text-sm">Comprovante</h3>
            </div>
            <div className="p-4">
              {comprovante.comprovante_url?.match(/\.(jpg|jpeg|png|webp)$/i) ? (
                <img src={comprovante.comprovante_url} alt="Comprovante" className="w-full" />
              ) : (
                <a
                  href={comprovante.comprovante_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-center text-wf-red text-sm py-6 font-bold uppercase tracking-widest"
                >
                  Abrir PDF →
                </a>
              )}
              <button
                onClick={() => setComprovante(null)}
                className="mt-3 w-full py-2.5 border border-wf-border text-wf-text-secondary text-xs font-bold uppercase tracking-widest hover:bg-gray-50 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
