import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { Badge, statusToBadge } from '../components/ui/Badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/Tabs';
import { Modal } from '../components/ui/Modal';
import { Pagination } from '../components/ui/Pagination';
import { PageLoader } from '../components/ui/Spinner';
import { useToast } from '../contexts/ToastContext';
import { vendedoresService } from '../services/vendedores.service';
import { maskCPF } from '../lib/utils';

function formatBRL(val: number) {
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function Vendedores() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const qc = useQueryClient();
  const { success, error } = useToast();

  const defaultTab = searchParams.get('status') === 'pendente' ? 'pendentes' : 'todos';
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [reprovarId, setReprovarId] = useState<string | null>(null);
  const [motivo, setMotivo] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['vendedores', page, search, statusFilter],
    queryFn: () => vendedoresService.list({ page, limit: 15, search, status: statusFilter || undefined }),
  });

  const pendentesQuery = useQuery({
    queryKey: ['vendedores', 1, '', 'pendente'],
    queryFn: () => vendedoresService.list({ page: 1, limit: 50, status: 'pendente' }),
  });

  const aprovarMutation = useMutation({
    mutationFn: vendedoresService.aprovar,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vendedores'] });
      success('Vendedor aprovado com sucesso');
    },
    onError: (err: any) => error(err?.response?.data?.message ?? 'Erro'),
  });

  const reprovarMutation = useMutation({
    mutationFn: ({ id, motivo }: { id: string; motivo: string }) => vendedoresService.reprovar(id, motivo),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vendedores'] });
      success('Vendedor reprovado');
      setReprovarId(null);
      setMotivo('');
    },
    onError: (err: any) => error(err?.response?.data?.message ?? 'Erro'),
  });

  return (
    <Layout title="Usuários" breadcrumbs={[{ label: 'Usuários' }]}>
      <Tabs defaultValue={defaultTab}>
        <TabsList>
          <TabsTrigger value="todos">Todos</TabsTrigger>
          <TabsTrigger value="pendentes">
            Pendentes {pendentesQuery.data?.total ? `(${pendentesQuery.data.total})` : ''}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="todos">
          <div className="flex items-center gap-3 mb-5">
            <Input
              className="max-w-xs"
              placeholder="Buscar por nome ou CPF..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
            <Select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="w-44">
              <option value="">Todos os status</option>
              <option value="pendente">Pendente</option>
              <option value="aprovado">Aprovado</option>
              <option value="reprovado">Reprovado</option>
              <option value="bloqueado">Bloqueado</option>
            </Select>
          </div>

          <Card className="p-0 overflow-hidden">
            {isLoading ? (
              <PageLoader />
            ) : (
              <>
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr className="text-xs text-wf-text-secondary uppercase">
                      <th className="text-left px-4 py-3">Nome</th>
                      <th className="text-left px-4 py-3">CPF</th>
                      <th className="text-left px-4 py-3">Distribuidor</th>
                      <th className="text-right px-4 py-3">Saldo disp.</th>
                      <th className="text-center px-4 py-3">Status</th>
                      <th className="text-right px-4 py-3">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-wf-border">
                    {data?.data.map((v) => (
                      <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-wf-text-primary font-medium">{v.nome} {v.sobrenome ?? ''}</td>
                        <td className="px-4 py-3 text-wf-text-secondary font-mono text-xs">{maskCPF(v.cpf)}</td>
                        <td className="px-4 py-3 text-wf-text-secondary">{v.distribuidor_nome ?? '—'}</td>
                        <td className="px-4 py-3 text-right text-green-600">{formatBRL(v.saldo_disponivel)}</td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant={statusToBadge(v.status)}>{v.status}</Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button variant="ghost" size="sm" onClick={() => navigate(`/admin/usuarios/${v.id}`)}>Ver</Button>
                        </td>
                      </tr>
                    ))}
                    {data?.data.length === 0 && (
                      <tr><td colSpan={6} className="px-4 py-8 text-center text-wf-text-muted">Nenhum vendedor</td></tr>
                    )}
                  </tbody>
                </table>
                <div className="flex justify-end px-4 py-3 border-t border-wf-border">
                  <Pagination page={page} totalPages={data?.totalPages ?? 1} onPageChange={setPage} />
                </div>
              </>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="pendentes">
          <Card className="p-0 overflow-hidden">
            {pendentesQuery.isLoading ? (
              <PageLoader />
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr className="text-xs text-wf-text-secondary uppercase">
                    <th className="text-left px-4 py-3">Nome</th>
                    <th className="text-left px-4 py-3">CPF</th>
                    <th className="text-left px-4 py-3">E-mail</th>
                    <th className="text-left px-4 py-3">Distribuidor</th>
                    <th className="text-left px-4 py-3">Cadastro</th>
                    <th className="text-right px-4 py-3">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-wf-border">
                  {pendentesQuery.data?.data.map((v) => (
                    <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-wf-text-primary">{v.nome} {v.sobrenome ?? ''}</td>
                      <td className="px-4 py-3 text-wf-text-secondary font-mono text-xs">{maskCPF(v.cpf)}</td>
                      <td className="px-4 py-3 text-wf-text-secondary">{v.email ?? '—'}</td>
                      <td className="px-4 py-3 text-wf-text-secondary">{v.distribuidor_nome ?? '—'}</td>
                      <td className="px-4 py-3 text-wf-text-secondary">{new Date(v.created_at).toLocaleDateString('pt-BR')}</td>
                      <td className="px-4 py-3 text-right flex items-center justify-end gap-2">
                        <Button size="sm" onClick={() => aprovarMutation.mutate(v.id)} loading={aprovarMutation.isPending}>
                          Aprovar
                        </Button>
                        <Button variant="danger" size="sm" onClick={() => setReprovarId(v.id)}>
                          Reprovar
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => navigate(`/admin/usuarios/${v.id}`)}>Ver</Button>
                      </td>
                    </tr>
                  ))}
                  {pendentesQuery.data?.data.length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-wf-text-muted">Nenhum vendedor pendente</td></tr>
                  )}
                </tbody>
              </table>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      <Modal open={!!reprovarId} onClose={() => setReprovarId(null)} title="Reprovar Usuário" size="sm">
        <div className="p-5 space-y-4">
          <p className="text-sm text-wf-text-secondary">Informe o motivo da reprovação (opcional):</p>
          <Input
            placeholder="Motivo..."
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
          />
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setReprovarId(null)}>Cancelar</Button>
            <Button
              variant="danger"
              loading={reprovarMutation.isPending}
              onClick={() => reprovarMutation.mutate({ id: reprovarId!, motivo })}
            >
              Reprovar
            </Button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
}
