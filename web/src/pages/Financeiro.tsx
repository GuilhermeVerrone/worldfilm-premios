import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Layout } from '../components/layout/Layout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge, statusToBadge } from '../components/ui/Badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/Tabs';
import { Modal } from '../components/ui/Modal';
import { Pagination } from '../components/ui/Pagination';
import { PageLoader } from '../components/ui/Spinner';
import { useToast } from '../contexts/ToastContext';
import { financeiroService, type Solicitacao } from '../services/financeiro.service';

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

function SolicitacoesTable({ status }: { status: string }) {
  const qc = useQueryClient();
  const { success, error } = useToast();
  const [page, setPage] = useState(1);
  const [pagarItem, setPagarItem] = useState<Solicitacao | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['financeiro', status, page],
    queryFn: () => financeiroService.listSolicitacoes({ page, limit: 15, status }),
  });

  const processarMutation = useMutation({
    mutationFn: financeiroService.processar,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['financeiro'] });
      success('Solicitação em processamento');
    },
    onError: (err: any) => error(err?.response?.data?.message ?? 'Erro'),
  });

  const pagarMutation = useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) => financeiroService.pagar(id, file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['financeiro'] });
      success('Pagamento registrado');
      setPagarItem(null);
      setFile(null);
    },
    onError: (err: any) => error(err?.response?.data?.message ?? 'Erro'),
  });

  return (
    <>
      <Card className="p-0 overflow-hidden">
        {isLoading ? (
          <PageLoader />
        ) : (
          <>
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-xs text-wf-text-secondary uppercase">
                  <th className="text-left px-4 py-3">Vendedor</th>
                  <th className="text-left px-4 py-3">Distribuidor</th>
                  <th className="text-left px-4 py-3">Data</th>
                  <th className="text-right px-4 py-3">Valor</th>
                  <th className="text-center px-4 py-3">Status</th>
                  <th className="text-right px-4 py-3">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-wf-border">
                {data?.data.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-wf-text-primary">{s.vendedor_nome ?? '—'}</td>
                    <td className="px-4 py-3 text-wf-text-secondary">{s.distribuidor_nome ?? '—'}</td>
                    <td className="px-4 py-3 text-wf-text-secondary">{new Date(s.created_at).toLocaleDateString('pt-BR')}</td>
                    <td className="px-4 py-3 text-right font-mono text-wf-text-primary">{formatBRL(s.valor)}</td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={statusToBadge(s.status)}>{s.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {s.status === 'solicitado' && (
                          <Button size="sm" onClick={() => processarMutation.mutate(s.id)} loading={processarMutation.isPending}>
                            Processar
                          </Button>
                        )}
                        {s.status === 'em_processamento' && (
                          <Button size="sm" onClick={() => setPagarItem(s)}>
                            Registrar Pagamento
                          </Button>
                        )}
                        {s.comprovante_url && (
                          <Button variant="ghost" size="sm" onClick={() => window.open(`${import.meta.env.VITE_API_URL ?? 'http://localhost:3001'}${s.comprovante_url}`, '_blank')}>
                            Comprovante
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {data?.data.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-wf-text-muted">Nenhuma solicitação</td></tr>
                )}
              </tbody>
            </table>
            <div className="flex justify-end px-4 py-3 border-t border-wf-border">
              <Pagination page={page} totalPages={data?.totalPages ?? 1} onPageChange={setPage} />
            </div>
          </>
        )}
      </Card>

      <Modal open={!!pagarItem} onClose={() => setPagarItem(null)} title="Registrar Pagamento" size="sm">
        <div className="p-5 space-y-4">
          {pagarItem && (
            <div className="bg-white p-3 text-sm">
              <p className="text-wf-text-secondary">Vendedor: <span className="text-wf-text-primary">{pagarItem.vendedor_nome}</span></p>
              <p className="text-wf-text-secondary mt-1">Valor: <span className="text-green-600 font-bold">{formatBRL(pagarItem.valor)}</span></p>
            </div>
          )}
          <div>
            <p className="text-sm text-wf-text-secondary mb-2">Comprovante de pagamento *</p>
            <input
              ref={fileRef}
              type="file"
              accept=".jpg,.jpeg,.png,.pdf"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
              {file ? file.name : 'Selecionar arquivo...'}
            </Button>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setPagarItem(null)}>Cancelar</Button>
            <Button
              disabled={!file}
              loading={pagarMutation.isPending}
              onClick={() => pagarItem && file && pagarMutation.mutate({ id: pagarItem.id, file })}
            >
              Confirmar Pagamento
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

export default function Financeiro() {
  const { success, error } = useToast();

  const exportMutation = useMutation({
    mutationFn: financeiroService.relatorio,
    onSuccess: (blob) => {
      downloadBlob(blob, `relatorio-financeiro-${new Date().toISOString().slice(0, 10)}.xlsx`);
      success('Relatório exportado');
    },
    onError: () => error('Erro ao exportar relatório'),
  });

  return (
    <Layout title="Financeiro" breadcrumbs={[{ label: 'Financeiro' }]}>
      <div className="flex justify-end mb-5">
        <Button variant="outline" size="sm" onClick={() => exportMutation.mutate()} loading={exportMutation.isPending}>
          ↓ Relatório Excel
        </Button>
      </div>

      <Tabs defaultValue="solicitado">
        <TabsList>
          <TabsTrigger value="solicitado">Pendentes</TabsTrigger>
          <TabsTrigger value="em_processamento">Em Processamento</TabsTrigger>
          <TabsTrigger value="pago">Pagos</TabsTrigger>
        </TabsList>
        <TabsContent value="solicitado"><SolicitacoesTable status="solicitado" /></TabsContent>
        <TabsContent value="em_processamento"><SolicitacoesTable status="em_processamento" /></TabsContent>
        <TabsContent value="pago"><SolicitacoesTable status="pago" /></TabsContent>
      </Tabs>
    </Layout>
  );
}
