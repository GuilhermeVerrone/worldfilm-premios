import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { Button } from '../components/ui/Button';
import { Input, Select, Textarea } from '../components/ui/Input';
import { Badge, statusToBadge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Pagination } from '../components/ui/Pagination';
import { PageLoader } from '../components/ui/Spinner';
import { useToast } from '../contexts/ToastContext';
import { campanhasService, type Premio } from '../services/campanhas.service';
import { produtosService } from '../services/produtos.service';

interface PremioRow extends Premio {
  produto_nome?: string;
}

export default function Campanhas() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { success, error } = useToast();

  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [form, setForm] = useState<any>({ segmentacao: { tipo: 'todos' }, premios: [] as PremioRow[] });

  const { data, isLoading } = useQuery({
    queryKey: ['campanhas', page, statusFilter],
    queryFn: () => campanhasService.list({ page, limit: 12, status: statusFilter || undefined }),
  });

  const produtosQuery = useQuery({
    queryKey: ['produtos-all'],
    queryFn: () => produtosService.list({ ativo: true, limit: 100 }),
  });

  const createMutation = useMutation({
    mutationFn: campanhasService.create,
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['campanhas'] });
      success('Campanha criada');
      setWizardOpen(false);
      setWizardStep(1);
      setForm({ segmentacao: { tipo: 'todos' }, premios: [] });
      navigate(`/admin/campanhas/${res.campanha.id}`);
    },
    onError: (err: any) => error(err?.response?.data?.message ?? 'Erro ao criar campanha'),
  });

  function addPremioRow() {
    setForm((f: any) => ({ ...f, premios: [...f.premios, { produto_id: '', metragem_corte: 30, valor_premio: 15 }] }));
  }

  function updatePremio(i: number, field: string, val: any) {
    setForm((f: any) => {
      const premios = [...f.premios];
      premios[i] = { ...premios[i], [field]: val };
      return { ...f, premios };
    });
  }

  function removePremio(i: number) {
    setForm((f: any) => ({ ...f, premios: f.premios.filter((_: any, idx: number) => idx !== i) }));
  }

  function handleCreate() {
    const payload = {
      ...form,
      data_inicio: new Date(form.data_inicio).toISOString(),
      data_fim: new Date(form.data_fim).toISOString(),
    };
    createMutation.mutate(payload);
  }

  const statusColors: Record<string, string> = {
    rascunho: 'border-wf-border',
    ativa: 'border-green-700',
    encerrada: 'border-wf-border',
    arquivada: 'border-wf-border',
  };

  return (
    <Layout title="Campanhas" breadcrumbs={[{ label: 'Campanhas' }]}>
      <div className="flex items-center justify-between mb-5">
        <Select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="w-44">
          <option value="">Todos os status</option>
          <option value="rascunho">Rascunho</option>
          <option value="ativa">Ativa</option>
          <option value="encerrada">Encerrada</option>
          <option value="arquivada">Arquivada</option>
        </Select>
        <Button onClick={() => setWizardOpen(true)}>+ Nova Campanha</Button>
      </div>

      {isLoading ? (
        <PageLoader />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
            {data?.data.map((c) => (
              <div
                key={c.id}
                onClick={() => navigate(`/admin/campanhas/${c.id}`)}
                className={`bg-white border p-5 cursor-pointer hover:bg-gray-50 transition-colors ${statusColors[c.status] ?? 'border-wf-border'}`}
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-semibold text-wf-text-primary text-sm flex-1 mr-2">{c.nome}</h3>
                  <Badge variant={statusToBadge(c.status)}>{c.status}</Badge>
                </div>
                {c.descricao && <p className="text-xs text-wf-text-secondary mb-3 line-clamp-2">{c.descricao}</p>}
                <div className="flex justify-between text-xs text-wf-text-muted">
                  <span>Início: {new Date(c.data_inicio).toLocaleDateString('pt-BR')}</span>
                  <span>Fim: {new Date(c.data_fim).toLocaleDateString('pt-BR')}</span>
                </div>
              </div>
            ))}
            {data?.data.length === 0 && (
              <p className="col-span-3 text-center py-12 text-wf-text-muted">Nenhuma campanha encontrada</p>
            )}
          </div>
          <div className="flex justify-end">
            <Pagination page={page} totalPages={data?.totalPages ?? 1} onPageChange={setPage} />
          </div>
        </>
      )}

      {/* Wizard */}
      <Modal open={wizardOpen} onClose={() => setWizardOpen(false)} title={`Nova Campanha — Passo ${wizardStep}/3`} size="lg">
        <div className="p-6">
          {wizardStep === 1 && (
            <div className="space-y-4">
              <Input label="Nome da Campanha *" value={form.nome ?? ''} onChange={(e) => setForm((f: any) => ({ ...f, nome: e.target.value }))} required />
              <Select label="Tipo *" value={form.tipo ?? ''} onChange={(e) => setForm((f: any) => ({ ...f, tipo: e.target.value }))} required>
                <option value="">Selecione...</option>
                <option value="lancamento">Lançamento</option>
                <option value="vendas">Vendas</option>
                <option value="especial">Especial</option>
              </Select>
              <Textarea label="Descrição" rows={3} value={form.descricao ?? ''} onChange={(e) => setForm((f: any) => ({ ...f, descricao: e.target.value }))} />
              <div className="grid grid-cols-2 gap-4">
                <Input label="Data Início *" type="date" value={form.data_inicio ?? ''} onChange={(e) => setForm((f: any) => ({ ...f, data_inicio: e.target.value }))} required />
                <Input label="Data Fim *" type="date" value={form.data_fim ?? ''} onChange={(e) => setForm((f: any) => ({ ...f, data_fim: e.target.value }))} required />
              </div>
              <div className="flex justify-end">
                <Button onClick={() => setWizardStep(2)} disabled={!form.nome || !form.tipo || !form.data_inicio || !form.data_fim}>
                  Próximo →
                </Button>
              </div>
            </div>
          )}

          {wizardStep === 2 && (
            <div className="space-y-4">
              <Select
                label="Segmentação"
                value={form.segmentacao?.tipo ?? 'todos'}
                onChange={(e) => setForm((f: any) => ({ ...f, segmentacao: { tipo: e.target.value } }))}
              >
                <option value="todos">Todos os vendedores</option>
                <option value="distribuidores">Distribuidores específicos</option>
              </Select>
              <div className="flex gap-3">
                <Button variant="ghost" onClick={() => setWizardStep(1)}>← Voltar</Button>
                <Button onClick={() => setWizardStep(3)}>Próximo →</Button>
              </div>
            </div>
          )}

          {wizardStep === 3 && (
            <div className="space-y-4">
              <p className="text-sm text-wf-text-secondary">Configure os prêmios por produto:</p>
              {form.premios.map((p: PremioRow, i: number) => (
                <div key={i} className="flex gap-2 items-end">
                  <Select
                    label={i === 0 ? 'Produto' : undefined}
                    value={p.produto_id}
                    onChange={(e) => updatePremio(i, 'produto_id', e.target.value)}
                    className="flex-1"
                  >
                    <option value="">Selecione...</option>
                    {produtosQuery.data?.data.map((pr) => (
                      <option key={pr.id} value={pr.id}>{pr.nome}</option>
                    ))}
                  </Select>
                  <Input
                    label={i === 0 ? 'Corte (m)' : undefined}
                    type="number"
                    value={p.metragem_corte}
                    onChange={(e) => updatePremio(i, 'metragem_corte', Number(e.target.value))}
                    className="w-24"
                  />
                  <Input
                    label={i === 0 ? 'Prêmio (R$)' : undefined}
                    type="number"
                    value={p.valor_premio}
                    onChange={(e) => updatePremio(i, 'valor_premio', Number(e.target.value))}
                    className="w-28"
                  />
                  <Button variant="danger" size="sm" onClick={() => removePremio(i)} className="mb-0.5">✕</Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addPremioRow}>+ Adicionar produto</Button>
              <div className="flex gap-3 pt-2">
                <Button variant="ghost" onClick={() => setWizardStep(2)}>← Voltar</Button>
                <Button onClick={handleCreate} loading={createMutation.isPending}>Criar Campanha</Button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </Layout>
  );
}
