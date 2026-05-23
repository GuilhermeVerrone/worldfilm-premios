import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Layout } from '../components/layout/Layout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge, statusToBadge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { PageLoader } from '../components/ui/Spinner';
import { useToast } from '../contexts/ToastContext';
import { vendasService } from '../services/vendas.service';

function formatBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function Row({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div>
      <span className="text-wf-text-muted text-sm">{label}:</span>
      <span className="text-wf-text-primary text-sm ml-2">{value ?? '—'}</span>
    </div>
  );
}

export default function VendaDetalhe() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const { success, error } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ['venda', id],
    queryFn: () => vendasService.getById(id!),
    enabled: !!id,
  });

  const [action, setAction] = useState<'aprovar' | 'reprovar' | 'revisao' | null>(null);
  const [motivo, setMotivo] = useState('');
  const [metrajemAjustada, setMetrajemAjustada] = useState('');

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['venda', id] });
    qc.invalidateQueries({ queryKey: ['vendas'] });
  };

  const aprovarMutation = useMutation({
    mutationFn: (ma?: number) => vendasService.aprovar(id!, ma ? { metragem_ajustada: ma } : undefined),
    onSuccess: () => { invalidate(); success('Venda aprovada'); setAction(null); },
    onError: (err: any) => error(err?.response?.data?.message ?? 'Erro'),
  });

  const reprovarMutation = useMutation({
    mutationFn: (m: string) => vendasService.reprovar(id!, m),
    onSuccess: () => { invalidate(); success('Venda reprovada'); setAction(null); },
    onError: (err: any) => error(err?.response?.data?.message ?? 'Erro'),
  });

  const revisaoMutation = useMutation({
    mutationFn: (m: string) => vendasService.solicitarRevisao(id!, m),
    onSuccess: () => { invalidate(); success('Revisão solicitada'); setAction(null); },
    onError: (err: any) => error(err?.response?.data?.message ?? 'Erro'),
  });

  function confirm() {
    if (action === 'aprovar') aprovarMutation.mutate(metrajemAjustada ? Number(metrajemAjustada) : undefined);
    else if (action === 'reprovar') reprovarMutation.mutate(motivo);
    else if (action === 'revisao') revisaoMutation.mutate(motivo);
  }

  const isMutating = aprovarMutation.isPending || reprovarMutation.isPending || revisaoMutation.isPending;

  if (isLoading || !data) return <Layout title="Venda"><PageLoader /></Layout>;

  const v = data.venda;

  return (
    <Layout
      title={`Venda #${v.id.slice(0, 8)}`}
      breadcrumbs={[{ label: 'Vendas', to: '/vendas' }, { label: `#${v.id.slice(0, 8)}` }]}
    >
      {v.status === 'pendente' && (
        <div className="flex gap-2 mb-5">
          <Button size="sm" onClick={() => { setAction('aprovar'); setMotivo(''); setMetrajemAjustada(''); }}>Aprovar</Button>
          <Button size="sm" variant="danger" onClick={() => { setAction('reprovar'); setMotivo(''); }}>Reprovar</Button>
          <Button size="sm" variant="outline" onClick={() => { setAction('revisao'); setMotivo(''); }}>Solicitar Revisão</Button>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card>
          <h3 className="text-sm font-semibold text-wf-text-primary mb-4">Informações da Venda</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-wf-text-muted text-sm">Status:</span>
              <Badge variant={statusToBadge(v.status)}>{v.status}</Badge>
            </div>
            <Row label="Vendedor" value={v.vendedor_nome} />
            <Row label="Distribuidor" value={v.distribuidor_nome} />
            <Row label="Campanha" value={v.campanha_nome} />
            <Row label="Produto" value={v.produto_nome} />
            <Row label="Data" value={new Date(v.created_at).toLocaleDateString('pt-BR')} />
          </div>
        </Card>

        <Card>
          <h3 className="text-sm font-semibold text-wf-text-primary mb-4">Metragem & Prêmio</h3>
          <div className="space-y-3">
            <Row label="Metragem informada" value={`${v.metragem}m`} />
            <Row label="Metragem ajustada" value={v.metragem_ajustada ? `${v.metragem_ajustada}m` : null} />
            <div>
              <span className="text-wf-text-muted text-sm">Prêmio calculado:</span>
              <span className="text-green-600 font-bold text-lg ml-2">{formatBRL(v.premio_calculado)}</span>
            </div>
            {v.observacao && <Row label="Observação" value={v.observacao} />}
            {v.motivo_revisao && <Row label="Motivo revisão" value={v.motivo_revisao} />}
          </div>
        </Card>
      </div>

      <Modal
        open={!!action}
        onClose={() => setAction(null)}
        title={action === 'aprovar' ? 'Aprovar Venda' : action === 'reprovar' ? 'Reprovar Venda' : 'Solicitar Revisão'}
        size="sm"
      >
        <div className="p-5 space-y-4">
          {action === 'aprovar' && (
            <Input
              label="Metragem ajustada (opcional)"
              type="number"
              placeholder="Original: "
              value={metrajemAjustada}
              onChange={(e) => setMetrajemAjustada(e.target.value)}
            />
          )}
          {(action === 'reprovar' || action === 'revisao') && (
            <Input label="Motivo *" value={motivo} onChange={(e) => setMotivo(e.target.value)} required />
          )}
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setAction(null)}>Cancelar</Button>
            <Button
              variant={action === 'aprovar' ? 'primary' : 'danger'}
              loading={isMutating}
              onClick={confirm}
              disabled={action !== 'aprovar' && !motivo}
            >
              Confirmar
            </Button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
}
