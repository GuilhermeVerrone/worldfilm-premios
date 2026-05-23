import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Layout } from '../components/layout/Layout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Pagination } from '../components/ui/Pagination';
import { PageLoader } from '../components/ui/Spinner';
import { useToast } from '../contexts/ToastContext';
import { produtosService, type Produto } from '../services/produtos.service';

export default function Produtos() {
  const qc = useQueryClient();
  const { success, error } = useToast();

  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<Produto | null>(null);
  const [form, setForm] = useState<Partial<Produto>>({ unidade: 'm', ativo: true });

  const { data, isLoading } = useQuery({
    queryKey: ['produtos', page],
    queryFn: () => produtosService.list({ page, limit: 15 }),
  });

  const createMutation = useMutation({
    mutationFn: produtosService.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['produtos'] });
      success('Produto criado');
      closeModal();
    },
    onError: (err: any) => error(err?.response?.data?.message ?? 'Erro'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Produto> }) => produtosService.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['produtos'] });
      success('Produto atualizado');
      closeModal();
    },
    onError: (err: any) => error(err?.response?.data?.message ?? 'Erro'),
  });

  const removeMutation = useMutation({
    mutationFn: produtosService.remove,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['produtos'] });
      success('Produto removido');
    },
    onError: (err: any) => error(err?.response?.data?.message ?? 'Erro'),
  });

  function openCreate() {
    setEditItem(null);
    setForm({ unidade: 'm', ativo: true });
    setModalOpen(true);
  }

  function openEdit(p: Produto) {
    setEditItem(p);
    setForm({ nome: p.nome, descricao: p.descricao ?? '', unidade: p.unidade, ativo: p.ativo });
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditItem(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editItem) {
      updateMutation.mutate({ id: editItem.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  }

  const isMutating = createMutation.isPending || updateMutation.isPending;

  return (
    <Layout title="Produtos" breadcrumbs={[{ label: 'Produtos' }]}>
      <div className="flex justify-end mb-5">
        <Button onClick={openCreate}>+ Novo Produto</Button>
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
                  <th className="text-left px-4 py-3">Descrição</th>
                  <th className="text-center px-4 py-3">Unidade</th>
                  <th className="text-center px-4 py-3">Status</th>
                  <th className="text-right px-4 py-3">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-wf-border">
                {data?.data.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-wf-text-primary font-medium">{p.nome}</td>
                    <td className="px-4 py-3 text-wf-text-secondary max-w-xs truncate">{p.descricao ?? '—'}</td>
                    <td className="px-4 py-3 text-center text-wf-text-secondary">{p.unidade}</td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={p.ativo ? 'success' : 'gray'}>{p.ativo ? 'ativo' : 'inativo'}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(p)}>Editar</Button>
                      <Button variant="danger" size="sm" onClick={() => removeMutation.mutate(p.id)} loading={removeMutation.isPending}>Remover</Button>
                    </td>
                  </tr>
                ))}
                {data?.data.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-wf-text-muted">Nenhum produto</td></tr>
                )}
              </tbody>
            </table>
            <div className="flex justify-end px-4 py-3 border-t border-wf-border">
              <Pagination page={page} totalPages={data?.totalPages ?? 1} onPageChange={setPage} />
            </div>
          </>
        )}
      </Card>

      <Modal open={modalOpen} onClose={closeModal} title={editItem ? 'Editar Produto' : 'Novo Produto'} size="sm">
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <Input label="Nome *" value={form.nome ?? ''} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} required />
          <Input label="Descrição" value={form.descricao ?? ''} onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))} />
          <Select label="Unidade" value={form.unidade ?? 'm'} onChange={(e) => setForm((f) => ({ ...f, unidade: e.target.value }))}>
            <option value="m">Metro (m)</option>
            <option value="m²">Metro quadrado (m²)</option>
            <option value="un">Unidade (un)</option>
          </Select>
          <Select label="Status" value={form.ativo ? 'true' : 'false'} onChange={(e) => setForm((f) => ({ ...f, ativo: e.target.value === 'true' }))}>
            <option value="true">Ativo</option>
            <option value="false">Inativo</option>
          </Select>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" type="button" onClick={closeModal}>Cancelar</Button>
            <Button type="submit" loading={isMutating}>{editItem ? 'Salvar' : 'Criar'}</Button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
}
