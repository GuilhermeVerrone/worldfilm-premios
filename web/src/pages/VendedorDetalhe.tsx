import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Layout } from '../components/layout/Layout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge, statusToBadge } from '../components/ui/Badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/Tabs';
import { Modal } from '../components/ui/Modal';
import { PageLoader } from '../components/ui/Spinner';
import { useToast } from '../contexts/ToastContext';
import { vendedoresService } from '../services/vendedores.service';

function formatBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

const ROLE_LABELS: Record<string, string> = {
  vendedor: 'Vendedor',
  admin: 'Administrador',
};

export default function VendedorDetalhe() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { success, error } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ['vendedor', id],
    queryFn: () => vendedoresService.getById(id!),
    enabled: !!id,
  });

  const [reprovarOpen, setReprovarOpen] = useState(false);
  const [bloquearOpen, setBloquearOpen] = useState(false);
  const [motivo, setMotivo] = useState('');

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['vendedor', id] });
    qc.invalidateQueries({ queryKey: ['vendedores'] });
  };

  const aprovarMutation = useMutation({
    mutationFn: () => vendedoresService.aprovar(id!),
    onSuccess: () => { invalidate(); success('Aprovado'); },
    onError: (err: any) => error(err?.response?.data?.message ?? 'Erro'),
  });

  const reprovarMutation = useMutation({
    mutationFn: (m: string) => vendedoresService.reprovar(id!, m),
    onSuccess: () => { invalidate(); success('Reprovado'); setReprovarOpen(false); },
    onError: (err: any) => error(err?.response?.data?.message ?? 'Erro'),
  });

  const bloquearMutation = useMutation({
    mutationFn: (m: string) => vendedoresService.bloquear(id!, m),
    onSuccess: () => { invalidate(); success('Bloqueado'); setBloquearOpen(false); setMotivo(''); },
    onError: (err: any) => error(err?.response?.data?.message ?? 'Erro'),
  });

  const desbloquearMutation = useMutation({
    mutationFn: () => vendedoresService.desbloquear(id!),
    onSuccess: () => { invalidate(); success('Desbloqueado'); },
    onError: (err: any) => error(err?.response?.data?.message ?? 'Erro'),
  });

  const changeRoleMutation = useMutation({
    mutationFn: (role: 'vendedor' | 'admin') => vendedoresService.changeRole(id!, role),
    onSuccess: (_data, role) => { invalidate(); success(`Role alterada para ${ROLE_LABELS[role]}`); },
    onError: (err: any) => error(err?.response?.data?.message ?? 'Erro'),
  });

  if (isLoading || !data) return <Layout title="Usuário"><PageLoader /></Layout>;

  const v = data.vendedor;
  const vendas = data.vendas ?? [];
  const transacoes = data.transacoes ?? [];
  const currentRole: 'vendedor' | 'admin' = (v as any).role ?? 'vendedor';

  return (
    <Layout
      title={v.nome}
      breadcrumbs={[{ label: 'Usuários', to: '/admin/usuarios' }, { label: v.nome }]}
    >
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        <Badge variant={statusToBadge(v.status)} className="text-sm px-3 py-1">{v.status}</Badge>
        <Badge variant={currentRole === 'admin' ? 'warning' : 'default'} className="text-sm px-3 py-1">
          {ROLE_LABELS[currentRole]}
        </Badge>
        {(v.status === 'pendente' || v.status === 'reprovado') && (
          <Button size="sm" onClick={() => aprovarMutation.mutate()} loading={aprovarMutation.isPending}>Aprovar</Button>
        )}
        {(v.status === 'pendente' || v.status === 'aprovado') && (
          <Button size="sm" variant="danger" onClick={() => { setMotivo(''); setReprovarOpen(true); }}>Reprovar</Button>
        )}
        {v.status === 'aprovado' && (
          <Button size="sm" variant="danger" onClick={() => { setMotivo(''); setBloquearOpen(true); }} loading={bloquearMutation.isPending}>Bloquear</Button>
        )}
        {v.status === 'bloqueado' && (
          <Button size="sm" onClick={() => desbloquearMutation.mutate()} loading={desbloquearMutation.isPending}>Desbloquear</Button>
        )}
      </div>

      <Tabs defaultValue="info">
        <TabsList>
          <TabsTrigger value="info">Perfil</TabsTrigger>
          <TabsTrigger value="saldo">Saldo</TabsTrigger>
          <TabsTrigger value="vendas">Vendas ({vendas.length})</TabsTrigger>
          <TabsTrigger value="extrato">Extrato ({transacoes.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <Card>
            <div className="grid grid-cols-2 gap-4 text-sm mb-6">
              <div><span className="text-wf-text-muted">Nome:</span> <span className="text-wf-text-primary ml-2">{v.nome}</span></div>
              <div><span className="text-wf-text-muted">CPF:</span> <span className="text-wf-text-primary ml-2 font-mono">{v.cpf}</span></div>
              <div><span className="text-wf-text-muted">WhatsApp:</span> <span className="text-wf-text-primary ml-2">{(v as any).whatsapp ?? '—'}</span></div>
              <div><span className="text-wf-text-muted">Chave PIX:</span> <span className="text-wf-text-primary ml-2">{(v as any).chave_pix ?? '—'}</span></div>
              <div><span className="text-wf-text-muted">Distribuidor:</span> <span className="text-wf-text-primary ml-2">{v.distribuidor_nome ?? '—'}</span></div>
              <div><span className="text-wf-text-muted">Cadastro:</span> <span className="text-wf-text-primary ml-2">{new Date(v.created_at).toLocaleDateString('pt-BR')}</span></div>
            </div>

            <div className="border-t border-wf-border pt-5">
              <p className="text-xs text-wf-text-muted uppercase tracking-wide mb-3">Acesso ao portal</p>
              <div className="flex items-center gap-3">
                <div className="flex overflow-hidden border border-wf-border">
                  {(['vendedor', 'admin'] as const).map((role) => (
                    <button
                      key={role}
                      onClick={() => { if (role !== currentRole) changeRoleMutation.mutate(role); }}
                      disabled={changeRoleMutation.isPending}
                      className={`px-4 py-2 text-sm font-medium transition-colors ${
                        currentRole === role
                          ? role === 'admin'
                            ? 'bg-yellow-600 text-white'
                            : 'bg-wf-red text-white'
                          : 'bg-white text-wf-text-secondary hover:text-wf-text-primary'
                      }`}
                    >
                      {ROLE_LABELS[role]}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-wf-text-muted">
                  {currentRole === 'admin'
                    ? 'Este usuário tem acesso ao painel administrativo'
                    : 'Este usuário acessa apenas o painel de vendedor'}
                </p>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="saldo">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <p className="text-xs text-wf-text-muted uppercase tracking-wide mb-1">Saldo Disponível</p>
              <p className="text-3xl font-bold text-green-600">{formatBRL(Number(v.saldo_disponivel))}</p>
            </Card>
            <Card>
              <p className="text-xs text-wf-text-muted uppercase tracking-wide mb-1">Saldo Bloqueado</p>
              <p className="text-3xl font-bold text-yellow-700">{formatBRL(Number(v.saldo_bloqueado))}</p>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="vendas">
          <Card className="p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-xs text-wf-text-secondary uppercase">
                  <th className="text-left px-4 py-3">Data</th>
                  <th className="text-left px-4 py-3">Campanha</th>
                  <th className="text-left px-4 py-3">Produto</th>
                  <th className="text-right px-4 py-3">Metragem</th>
                  <th className="text-right px-4 py-3">Prêmio</th>
                  <th className="text-center px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-wf-border">
                {vendas.map((vd: any) => (
                  <tr key={vd.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/admin/vendas/${vd.id}`)}>
                    <td className="px-4 py-3 text-wf-text-secondary">{new Date(vd.created_at).toLocaleDateString('pt-BR')}</td>
                    <td className="px-4 py-3 text-wf-text-secondary">{vd.campanha_nome ?? '—'}</td>
                    <td className="px-4 py-3 text-wf-text-secondary">{vd.produto_nome ?? '—'}</td>
                    <td className="px-4 py-3 text-right text-wf-text-secondary">{vd.metragem}m</td>
                    <td className="px-4 py-3 text-right text-green-600">{formatBRL(Number(vd.premio_estimado ?? vd.premio_apurado ?? 0))}</td>
                    <td className="px-4 py-3 text-center"><Badge variant={statusToBadge(vd.status)}>{vd.status}</Badge></td>
                  </tr>
                ))}
                {vendas.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-wf-text-muted">Nenhuma venda</td></tr>}
              </tbody>
            </table>
          </Card>
        </TabsContent>

        <TabsContent value="extrato">
          <Card className="p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-xs text-wf-text-secondary uppercase">
                  <th className="text-left px-4 py-3">Data</th>
                  <th className="text-left px-4 py-3">Tipo</th>
                  <th className="text-right px-4 py-3">Valor</th>
                  <th className="text-center px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-wf-border">
                {transacoes.map((t: any) => (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-wf-text-secondary">{new Date(t.created_at).toLocaleDateString('pt-BR')}</td>
                    <td className="px-4 py-3 text-wf-text-secondary">{t.tipo}</td>
                    <td className={`px-4 py-3 text-right font-mono ${t.tipo === 'saque' ? 'text-red-600' : 'text-green-600'}`}>
                      {t.tipo === 'saque' ? '−' : '+'}{formatBRL(t.valor)}
                    </td>
                    <td className="px-4 py-3 text-center"><Badge variant={statusToBadge(t.status)}>{t.status}</Badge></td>
                  </tr>
                ))}
                {transacoes.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-wf-text-muted">Sem transações</td></tr>}
              </tbody>
            </table>
          </Card>
        </TabsContent>
      </Tabs>

      <Modal open={reprovarOpen} onClose={() => setReprovarOpen(false)} title="Reprovar Usuário" size="sm">
        <div className="p-5 space-y-4">
          <Input label="Motivo *" value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Ex: documentação inválida" />
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setReprovarOpen(false)}>Cancelar</Button>
            <Button variant="danger" loading={reprovarMutation.isPending} disabled={motivo.trim().length < 5} onClick={() => reprovarMutation.mutate(motivo)}>Reprovar</Button>
          </div>
        </div>
      </Modal>

      <Modal open={bloquearOpen} onClose={() => setBloquearOpen(false)} title="Bloquear Usuário" size="sm">
        <div className="p-5 space-y-4">
          <Input label="Motivo *" value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Ex: violação dos termos de uso" />
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setBloquearOpen(false)}>Cancelar</Button>
            <Button variant="danger" loading={bloquearMutation.isPending} disabled={motivo.trim().length < 5} onClick={() => bloquearMutation.mutate(motivo)}>Bloquear</Button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
}
