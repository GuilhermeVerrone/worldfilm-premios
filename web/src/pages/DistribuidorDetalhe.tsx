import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Layout } from '../components/layout/Layout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { Badge, statusToBadge } from '../components/ui/Badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/Tabs';
import { PageLoader } from '../components/ui/Spinner';
import { useToast } from '../contexts/ToastContext';
import { distribuidoresService } from '../services/distribuidores.service';
import { maskCNPJ } from '../lib/utils';

const REGIOES = ['Sul', 'Sudeste', 'Nordeste', 'Norte', 'Centro-Oeste'];

export default function DistribuidorDetalhe() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { success, error } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ['distribuidor', id],
    queryFn: () => distribuidoresService.getById(id!),
    enabled: !!id,
  });

  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState<any>(null);

  const updateMutation = useMutation({
    mutationFn: (d: any) => distribuidoresService.update(id!, d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['distribuidor', id] });
      qc.invalidateQueries({ queryKey: ['distribuidores'] });
      success('Distribuidor atualizado');
      setEditMode(false);
    },
    onError: (err: any) => error(err?.response?.data?.message ?? 'Erro ao atualizar'),
  });

  const statusMutation = useMutation({
    mutationFn: (status: string) => distribuidoresService.updateStatus(id!, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['distribuidor', id] });
      success('Status atualizado');
    },
    onError: (err: any) => error(err?.response?.data?.message ?? 'Erro'),
  });

  if (isLoading || !data) return <Layout title="Distribuidor"><PageLoader /></Layout>;

  const d = data.distribuidor;
  const vendedores = data.vendedores ?? [];

  function startEdit() {
    setForm({ razao_social: d.razao_social, cnpj: d.cnpj, responsavel: d.responsavel, email: d.email, whatsapp: d.whatsapp, regiao: d.regiao });
    setEditMode(true);
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    updateMutation.mutate(form);
  }

  return (
    <Layout
      title={d.razao_social}
      breadcrumbs={[{ label: 'Distribuidores', to: '/distribuidores' }, { label: d.razao_social }]}
    >
      <Tabs defaultValue="info">
        <TabsList>
          <TabsTrigger value="info">Informações</TabsTrigger>
          <TabsTrigger value="vendedores">Vendedores ({vendedores.length})</TabsTrigger>
          <TabsTrigger value="acoes">Ações</TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <Card>
            {editMode ? (
              <form onSubmit={handleSave} className="space-y-4">
                <Input label="Razão Social *" value={form.razao_social} onChange={(e) => setForm((f: any) => ({ ...f, razao_social: e.target.value }))} required />
                <Input label="CNPJ *" placeholder="00.000.000/0000-00" inputMode="numeric" value={form.cnpj} onChange={(e) => setForm((f: any) => ({ ...f, cnpj: maskCNPJ(e.target.value) }))} required />
                <Input label="Responsável *" value={form.responsavel} onChange={(e) => setForm((f: any) => ({ ...f, responsavel: e.target.value }))} required />
                <Input label="E-mail *" type="email" value={form.email} onChange={(e) => setForm((f: any) => ({ ...f, email: e.target.value }))} required />
                <Input label="WhatsApp *" placeholder="(00) 00000-0000" value={form.whatsapp} onChange={(e) => setForm((f: any) => ({ ...f, whatsapp: e.target.value }))} required />
                <Select label="Região *" value={form.regiao} onChange={(e) => setForm((f: any) => ({ ...f, regiao: e.target.value }))} required>
                  <option value="">Selecione...</option>
                  {REGIOES.map((r) => <option key={r} value={r}>{r}</option>)}
                </Select>
                <div className="flex gap-3">
                  <Button type="submit" loading={updateMutation.isPending}>Salvar</Button>
                  <Button variant="ghost" type="button" onClick={() => setEditMode(false)}>Cancelar</Button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-wf-text-primary">{d.razao_social}</h2>
                    <p className="text-wf-text-secondary text-sm mt-1">{d.regiao}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={statusToBadge(d.status)}>{d.status}</Badge>
                    <Button variant="outline" size="sm" onClick={startEdit}>Editar</Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm pt-2 border-t border-wf-border">
                  <div><span className="text-wf-text-muted">CNPJ:</span> <span className="text-wf-text-primary ml-2 font-mono">{maskCNPJ(d.cnpj)}</span></div>
                  <div><span className="text-wf-text-muted">Responsável:</span> <span className="text-wf-text-primary ml-2">{d.responsavel}</span></div>
                  <div><span className="text-wf-text-muted">E-mail:</span> <span className="text-wf-text-primary ml-2">{d.email}</span></div>
                  <div><span className="text-wf-text-muted">WhatsApp:</span> <span className="text-wf-text-primary ml-2">{d.whatsapp}</span></div>
                  <div><span className="text-wf-text-muted">Cadastro:</span> <span className="text-wf-text-primary ml-2">{new Date(d.created_at).toLocaleDateString('pt-BR')}</span></div>
                </div>
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="vendedores">
          <Card className="p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-xs text-wf-text-secondary uppercase">
                  <th className="text-left px-4 py-3">Nome</th>
                  <th className="text-left px-4 py-3">CPF</th>
                  <th className="text-left px-4 py-3">E-mail</th>
                  <th className="text-center px-4 py-3">Status</th>
                  <th className="text-right px-4 py-3">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-wf-border">
                {vendedores.map((v: any) => (
                  <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-wf-text-primary">{v.nome} {v.sobrenome ?? ''}</td>
                    <td className="px-4 py-3 text-wf-text-secondary font-mono text-xs">{v.cpf}</td>
                    <td className="px-4 py-3 text-wf-text-secondary">{v.email ?? '—'}</td>
                    <td className="px-4 py-3 text-center"><Badge variant={statusToBadge(v.status)}>{v.status}</Badge></td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/admin/usuarios/${v.id}`)}>Ver</Button>
                    </td>
                  </tr>
                ))}
                {vendedores.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-wf-text-muted">Nenhum vendedor</td></tr>
                )}
              </tbody>
            </table>
          </Card>
        </TabsContent>

        <TabsContent value="acoes">
          <Card>
            <h3 className="text-sm font-semibold text-wf-text-primary mb-4">Alterar Status</h3>
            <div className="flex gap-3 flex-wrap">
              {d.status !== 'ativo' && (
                <Button onClick={() => statusMutation.mutate('ativo')} loading={statusMutation.isPending} size="sm">
                  Ativar
                </Button>
              )}
              {d.status !== 'inativo' && (
                <Button variant="danger" onClick={() => statusMutation.mutate('inativo')} loading={statusMutation.isPending} size="sm">
                  Inativar
                </Button>
              )}
            </div>
            {d.status === 'inativo' && (
              <p className="text-xs text-yellow-700 mt-3">
                Inativar um distribuidor bloqueia todos os seus vendedores ativos.
              </p>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </Layout>
  );
}
