import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { Badge, statusToBadge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Pagination } from '../components/ui/Pagination';
import { PageLoader } from '../components/ui/Spinner';
import { useToast } from '../contexts/ToastContext';
import { distribuidoresService, type Distribuidor } from '../services/distribuidores.service';
import { maskCNPJ } from '../lib/utils';

const REGIOES = ['Sul', 'Sudeste', 'Nordeste', 'Norte', 'Centro-Oeste'];

export default function Distribuidores() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { success, error } = useToast();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<Partial<Distribuidor>>({ status: 'ativo' });

  const { data, isLoading } = useQuery({
    queryKey: ['distribuidores', page, search],
    queryFn: () => distribuidoresService.list({ page, limit: 15, search }),
  });

  const createMutation = useMutation({
    mutationFn: distribuidoresService.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['distribuidores'] });
      success('Distribuidor criado com sucesso');
      setModalOpen(false);
      setForm({ status: 'ativo' });
    },
    onError: (err: any) => error(err?.response?.data?.message ?? 'Erro ao criar distribuidor'),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    createMutation.mutate(form);
  }

  return (
    <Layout title="Distribuidores" breadcrumbs={[{ label: 'Distribuidores' }]}>
      <div className="flex items-center justify-between mb-5">
        <div className="flex gap-3 flex-1 max-w-sm">
          <Input
            placeholder="Buscar por nome ou CNPJ..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <Button onClick={() => setModalOpen(true)}>+ Novo Distribuidor</Button>
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
                  <th className="text-left px-4 py-3">CNPJ</th>
                  <th className="text-left px-4 py-3">Região</th>
                  <th className="text-center px-4 py-3">Vendedores</th>
                  <th className="text-center px-4 py-3">Status</th>
                  <th className="text-right px-4 py-3">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-wf-border">
                {data?.data.map((d) => (
                  <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-wf-text-primary font-medium">{d.nome}</td>
                    <td className="px-4 py-3 text-wf-text-secondary font-mono text-xs">{maskCNPJ(d.cnpj)}</td>
                    <td className="px-4 py-3 text-wf-text-secondary">{d.regiao}</td>
                    <td className="px-4 py-3 text-center text-wf-text-secondary">{d.vendedores_ativos ?? 0}</td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={statusToBadge(d.status)}>{d.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/admin/distribuidores/${d.id}`)}>
                        Ver detalhes
                      </Button>
                    </td>
                  </tr>
                ))}
                {data?.data.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-wf-text-muted">Nenhum distribuidor encontrado</td>
                  </tr>
                )}
              </tbody>
            </table>
            <div className="flex justify-end px-4 py-3 border-t border-wf-border">
              <Pagination page={page} totalPages={data?.totalPages ?? 1} onPageChange={setPage} />
            </div>
          </>
        )}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Novo Distribuidor" size="md">
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <Input label="Nome *" value={form.nome ?? ''} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} required />
          <Input label="CNPJ *" placeholder="00.000.000/0000-00" inputMode="numeric" value={form.cnpj ?? ''} onChange={(e) => setForm((f) => ({ ...f, cnpj: maskCNPJ(e.target.value) }))} required />
          <Select label="Região *" value={form.regiao ?? ''} onChange={(e) => setForm((f) => ({ ...f, regiao: e.target.value }))} required>
            <option value="">Selecione...</option>
            {REGIOES.map((r) => <option key={r} value={r}>{r}</option>)}
          </Select>
          <Input label="E-mail" type="email" value={form.email ?? ''} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
          <Input label="Telefone" value={form.telefone ?? ''} onChange={(e) => setForm((f) => ({ ...f, telefone: e.target.value }))} />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" type="button" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit" loading={createMutation.isPending}>Criar</Button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
}
