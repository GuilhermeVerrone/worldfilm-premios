import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Layout } from '../components/layout/Layout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge, statusToBadge } from '../components/ui/Badge';
import { PageLoader } from '../components/ui/Spinner';
import { useToast } from '../contexts/ToastContext';
import { campanhasService } from '../services/campanhas.service';

const STATUS_TRANSITIONS: Record<string, { next: string; label: string; variant: any }[]> = {
  rascunho: [{ next: 'ativa', label: 'Ativar', variant: 'primary' }],
  ativa: [{ next: 'encerrada', label: 'Encerrar', variant: 'danger' }],
  encerrada: [{ next: 'arquivada', label: 'Arquivar', variant: 'secondary' }],
  arquivada: [],
};

function formatBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function CampanhaDetalhe() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const { success, error } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ['campanha', id],
    queryFn: () => campanhasService.getById(id!),
    enabled: !!id,
  });

  const statusMutation = useMutation({
    mutationFn: (status: string) => campanhasService.updateStatus(id!, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['campanha', id] });
      qc.invalidateQueries({ queryKey: ['campanhas'] });
      success('Status atualizado');
    },
    onError: (err: any) => error(err?.response?.data?.message ?? 'Erro'),
  });

  if (isLoading || !data) return <Layout title="Campanha"><PageLoader /></Layout>;

  const c = data.campanha;
  const premios = c.premios ?? [];
  const transitions = STATUS_TRANSITIONS[c.status] ?? [];

  let seg: any = c.segmentacao;
  if (typeof seg === 'string') {
    try { seg = JSON.parse(seg); } catch { seg = { tipo: 'todos' }; }
  }

  return (
    <Layout
      title={c.nome}
      breadcrumbs={[{ label: 'Campanhas', to: '/campanhas' }, { label: c.nome }]}
    >
      <div className="flex flex-wrap gap-2 items-center mb-5">
        <Badge variant={statusToBadge(c.status)} className="text-sm px-3 py-1">{c.status}</Badge>
        {transitions.map((t) => (
          <Button
            key={t.next}
            variant={t.variant}
            size="sm"
            onClick={() => statusMutation.mutate(t.next)}
            loading={statusMutation.isPending}
          >
            {t.label}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6">
        <Card className="xl:col-span-2">
          <h3 className="text-sm font-semibold text-wf-text-primary mb-3">Informações</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-wf-text-muted">Nome:</span> <span className="text-wf-text-primary ml-2">{c.nome}</span></div>
            <div><span className="text-wf-text-muted">Status:</span> <span className="text-wf-text-primary ml-2">{c.status}</span></div>
            <div><span className="text-wf-text-muted">Início:</span> <span className="text-wf-text-primary ml-2">{new Date(c.data_inicio).toLocaleDateString('pt-BR')}</span></div>
            <div><span className="text-wf-text-muted">Fim:</span> <span className="text-wf-text-primary ml-2">{new Date(c.data_fim).toLocaleDateString('pt-BR')}</span></div>
            <div className="col-span-2"><span className="text-wf-text-muted">Segmentação:</span> <span className="text-wf-text-primary ml-2">{seg?.tipo ?? '—'}</span></div>
            {c.descricao && (
              <div className="col-span-2"><span className="text-wf-text-muted">Descrição:</span> <span className="text-wf-text-primary ml-2">{c.descricao}</span></div>
            )}
          </div>
        </Card>
        <Card>
          <h3 className="text-sm font-semibold text-wf-text-primary mb-3">Período</h3>
          <div className="space-y-2 text-sm">
            <div>
              <p className="text-wf-text-muted text-xs">Início</p>
              <p className="text-wf-text-primary font-medium">{new Date(c.data_inicio).toLocaleDateString('pt-BR')}</p>
            </div>
            <div>
              <p className="text-wf-text-muted text-xs">Fim</p>
              <p className="text-wf-text-primary font-medium">{new Date(c.data_fim).toLocaleDateString('pt-BR')}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabela de prêmios */}
      <Card className="p-0 overflow-hidden">
        <div className="px-5 py-3 border-b border-wf-border">
          <h3 className="text-sm font-semibold text-wf-text-primary">Tabela de Prêmios</h3>
        </div>
        {premios.length === 0 ? (
          <p className="text-wf-text-muted text-sm text-center py-8">Nenhum prêmio configurado</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-xs text-wf-text-secondary uppercase">
                <th className="text-left px-4 py-3">Produto</th>
                <th className="text-right px-4 py-3">Metragem Corte</th>
                <th className="text-right px-4 py-3">Prêmio por Corte</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-wf-border">
              {premios.map((p: any) => (
                <tr key={p.produto_id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-wf-text-primary">{p.produto_nome ?? p.produto_id}</td>
                  <td className="px-4 py-3 text-right text-wf-text-secondary">{p.metragem_corte}m</td>
                  <td className="px-4 py-3 text-right text-green-600 font-medium">{formatBRL(p.valor_premio)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </Layout>
  );
}
