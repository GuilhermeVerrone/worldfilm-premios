import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { Badge, statusToBadge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Pagination } from '../components/ui/Pagination';
import { PageLoader } from '../components/ui/Spinner';
import { useToast } from '../contexts/ToastContext';
import { vendasService } from '../services/vendas.service';

function formatBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Vendas() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const qc = useQueryClient();
  const { success, error } = useToast();

  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') ?? '');
  const [campanhaFilter, setCampanhaFilter] = useState('');

  const [actionItem, setActionItem] = useState<{ id: string; action: 'aprovar' | 'reprovar' | 'revisao' } | null>(null);
  const [motivo, setMotivo] = useState('');
  const [metrajemAjustada, setMetrajemAjustada] = useState('');
  const [exportOpen, setExportOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['vendas', page, statusFilter, campanhaFilter],
    queryFn: () =>
      vendasService.list({
        page,
        limit: 20,
        status: statusFilter || undefined,
        campanha_id: campanhaFilter || undefined,
      }),
  });

  const aprovarMutation = useMutation({
    mutationFn: ({ id, metragem_ajustada }: { id: string; metragem_ajustada?: number }) =>
      vendasService.aprovar(id, metragem_ajustada ? { metragem_ajustada } : undefined),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vendas'] });
      success('Venda aprovada');
      setActionItem(null);
    },
    onError: (err: any) => error(err?.response?.data?.message ?? 'Erro'),
  });

  const reprovarMutation = useMutation({
    mutationFn: ({ id, motivo }: { id: string; motivo: string }) => vendasService.reprovar(id, motivo),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vendas'] });
      success('Venda reprovada');
      setActionItem(null);
    },
    onError: (err: any) => error(err?.response?.data?.message ?? 'Erro'),
  });

  const revisaoMutation = useMutation({
    mutationFn: ({ id, motivo }: { id: string; motivo: string }) => vendasService.solicitarRevisao(id, motivo),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vendas'] });
      success('Revisão solicitada');
      setActionItem(null);
    },
    onError: (err: any) => error(err?.response?.data?.message ?? 'Erro'),
  });

  const exportMutation = useMutation({
    mutationFn: () => vendasService.exportar({ status: statusFilter || undefined, campanha_id: campanhaFilter || undefined }),
    onSuccess: (blob) => {
      downloadBlob(blob, `vendas-${new Date().toISOString().slice(0, 10)}.xlsx`);
      setExportOpen(false);
      success('Exportado com sucesso');
    },
    onError: () => error('Erro ao exportar'),
  });

  function confirmAction() {
    if (!actionItem) return;
    if (actionItem.action === 'aprovar') {
      aprovarMutation.mutate({ id: actionItem.id, metragem_ajustada: metrajemAjustada ? Number(metrajemAjustada) : undefined });
    } else if (actionItem.action === 'reprovar') {
      reprovarMutation.mutate({ id: actionItem.id, motivo });
    } else {
      revisaoMutation.mutate({ id: actionItem.id, motivo });
    }
  }

  const isMutating = aprovarMutation.isPending || reprovarMutation.isPending || revisaoMutation.isPending;

  return (
    <Layout title="Vendas" breadcrumbs={[{ label: 'Vendas' }]}>
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <Select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="w-44">
          <option value="">Todos os status</option>
          <option value="pendente">Pendente</option>
          <option value="aprovado">Aprovado</option>
          <option value="reprovado">Reprovado</option>
          <option value="revisao">Revisão</option>
        </Select>
        <Input
          placeholder="ID da Campanha..."
          value={campanhaFilter}
          onChange={(e) => { setCampanhaFilter(e.target.value); setPage(1); }}
          className="w-48"
        />
        <div className="ml-auto">
          <Button variant="outline" size="sm" onClick={() => setExportOpen(true)}>
            ↓ Exportar Excel
          </Button>
        </div>
      </div>

      <Card className="p-0 overflow-hidden">
        {isLoading ? (
          <PageLoader />
        ) : (
          <>
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-xs text-wf-text-secondary uppercase">
                  <th className="text-left px-4 py-3">Data</th>
                  <th className="text-left px-4 py-3">Vendedor</th>
                  <th className="text-left px-4 py-3">Campanha</th>
                  <th className="text-left px-4 py-3">Produto</th>
                  <th className="text-right px-4 py-3">Metragem</th>
                  <th className="text-right px-4 py-3">Prêmio</th>
                  <th className="text-center px-4 py-3">Status</th>
                  <th className="text-right px-4 py-3">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-wf-border">
                {data?.data.map((v) => (
                  <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-wf-text-secondary">{new Date(v.created_at).toLocaleDateString('pt-BR')}</td>
                    <td className="px-4 py-3 text-wf-text-primary">{v.vendedor_nome ?? '—'}</td>
                    <td className="px-4 py-3 text-wf-text-secondary max-w-[140px] truncate">{v.campanha_nome ?? '—'}</td>
                    <td className="px-4 py-3 text-wf-text-secondary">{v.produto_nome ?? '—'}</td>
                    <td className="px-4 py-3 text-right text-wf-text-secondary">{v.metragem}m</td>
                    <td className="px-4 py-3 text-right text-green-600">{formatBRL(v.premio_calculado)}</td>
                    <td className="px-4 py-3 text-center"><Badge variant={statusToBadge(v.status)}>{v.status}</Badge></td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {v.status === 'pendente' && (
                          <>
                            <Button size="sm" onClick={() => { setActionItem({ id: v.id, action: 'aprovar' }); setMotivo(''); setMetrajemAjustada(''); }}>
                              ✓
                            </Button>
                            <Button size="sm" variant="danger" onClick={() => { setActionItem({ id: v.id, action: 'reprovar' }); setMotivo(''); }}>
                              ✕
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => { setActionItem({ id: v.id, action: 'revisao' }); setMotivo(''); }}>
                              ↩
                            </Button>
                          </>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => navigate(`/admin/vendas/${v.id}`)}>Ver</Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {data?.data.length === 0 && (
                  <tr><td colSpan={8} className="px-4 py-8 text-center text-wf-text-muted">Nenhuma venda encontrada</td></tr>
                )}
              </tbody>
            </table>
            <div className="flex items-center justify-between px-4 py-3 border-t border-wf-border">
              <span className="text-xs text-wf-text-muted">{data?.total ?? 0} registro{(data?.total ?? 0) !== 1 ? 's' : ''}</span>
              <Pagination page={page} totalPages={data?.totalPages ?? 1} onPageChange={setPage} />
            </div>
          </>
        )}
      </Card>

      {/* Action Modal */}
      <Modal
        open={!!actionItem}
        onClose={() => setActionItem(null)}
        title={actionItem?.action === 'aprovar' ? 'Aprovar Venda' : actionItem?.action === 'reprovar' ? 'Reprovar Venda' : 'Solicitar Revisão'}
        size="sm"
      >
        <div className="p-5 space-y-4">
          {actionItem?.action === 'aprovar' && (
            <Input
              label="Metragem ajustada (opcional)"
              type="number"
              placeholder="Deixe em branco para manter original"
              value={metrajemAjustada}
              onChange={(e) => setMetrajemAjustada(e.target.value)}
            />
          )}
          {(actionItem?.action === 'reprovar' || actionItem?.action === 'revisao') && (
            <Input
              label="Motivo *"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Informe o motivo..."
              required
            />
          )}
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setActionItem(null)}>Cancelar</Button>
            <Button
              variant={actionItem?.action === 'aprovar' ? 'primary' : 'danger'}
              loading={isMutating}
              onClick={confirmAction}
              disabled={actionItem?.action !== 'aprovar' && !motivo}
            >
              Confirmar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Export Modal */}
      <Modal open={exportOpen} onClose={() => setExportOpen(false)} title="Exportar Vendas" size="sm">
        <div className="p-5 space-y-3">
          <p className="text-sm text-wf-text-secondary">Exportar com os filtros atuais:</p>
          <ul className="text-xs text-wf-text-muted space-y-1">
            {statusFilter && <li>Status: <span className="text-wf-text-secondary">{statusFilter}</span></li>}
            {campanhaFilter && <li>Campanha: <span className="text-wf-text-secondary">{campanhaFilter}</span></li>}
            {!statusFilter && !campanhaFilter && <li>Todos os registros</li>}
          </ul>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setExportOpen(false)}>Cancelar</Button>
            <Button loading={exportMutation.isPending} onClick={() => exportMutation.mutate()}>Baixar Excel</Button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
}
