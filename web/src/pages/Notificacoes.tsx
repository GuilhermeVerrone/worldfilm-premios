import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Layout } from '../components/layout/Layout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input, Select, Textarea } from '../components/ui/Input';
import { Pagination } from '../components/ui/Pagination';
import { PageLoader } from '../components/ui/Spinner';
import { useToast } from '../contexts/ToastContext';
import { notificacoesService } from '../services/notificacoes.service';

export default function Notificacoes() {
  const qc = useQueryClient();
  const { success, error } = useToast();

  const [page, setPage] = useState(1);
  const [form, setForm] = useState({
    titulo: '',
    corpo: '',
    destinatario: 'todos' as 'todos' | 'distribuidor' | 'vendedor',
    destinatario_id: '',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['notificacoes-admin', page],
    queryFn: () => notificacoesService.list({ page, limit: 20 }),
  });

  const enviarMutation = useMutation({
    mutationFn: notificacoesService.enviarManual,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notificacoes-admin'] });
      success('Notificação enviada com sucesso');
      setForm({ titulo: '', corpo: '', destinatario: 'todos', destinatario_id: '' });
    },
    onError: (err: any) => error(err?.response?.data?.message ?? 'Erro ao enviar notificação'),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload: any = {
      titulo: form.titulo,
      corpo: form.corpo,
      destinatario: form.destinatario,
    };
    if (form.destinatario !== 'todos' && form.destinatario_id) {
      payload.destinatario_id = form.destinatario_id;
    }
    enviarMutation.mutate(payload);
  }

  const preview = form.titulo || form.corpo ? (
    <div className="bg-white p-4 rounded-xl shadow-sm">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 bg-wf-red flex items-center justify-center text-white text-sm font-bold flex-shrink-0">W</div>
        <div className="flex-1 min-w-0">
          <p className="text-wf-text-primary text-sm font-semibold truncate">{form.titulo || 'Título da notificação'}</p>
          <p className="text-wf-text-secondary text-xs mt-0.5 line-clamp-2">{form.corpo || 'Corpo da mensagem...'}</p>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <Layout title="Notificações" breadcrumbs={[{ label: 'Notificações' }]}>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Formulário de envio */}
        <div>
          <Card>
            <h3 className="text-sm font-semibold text-wf-text-primary mb-4">Enviar Notificação</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Título *"
                value={form.titulo}
                onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))}
                placeholder="Título da notificação"
                maxLength={100}
                required
              />
              <Textarea
                label="Mensagem *"
                value={form.corpo}
                onChange={(e) => setForm((f) => ({ ...f, corpo: e.target.value }))}
                placeholder="Conteúdo da notificação..."
                rows={4}
                maxLength={500}
                required
              />
              <Select
                label="Destinatário"
                value={form.destinatario}
                onChange={(e) => setForm((f) => ({ ...f, destinatario: e.target.value as any, destinatario_id: '' }))}
              >
                <option value="todos">Todos os vendedores</option>
                <option value="distribuidor">Distribuidor específico</option>
                <option value="vendedor">Vendedor específico</option>
              </Select>
              {form.destinatario !== 'todos' && (
                <Input
                  label={`ID do ${form.destinatario === 'distribuidor' ? 'Distribuidor' : 'Vendedor'} *`}
                  value={form.destinatario_id}
                  onChange={(e) => setForm((f) => ({ ...f, destinatario_id: e.target.value }))}
                  placeholder="UUID..."
                  required
                />
              )}

              {preview && (
                <div>
                  <p className="text-xs text-wf-text-muted mb-2">Pré-visualização:</p>
                  {preview}
                </div>
              )}

              <Button type="submit" className="w-full" loading={enviarMutation.isPending}>
                Enviar Notificação
              </Button>
            </form>
          </Card>
        </div>

        {/* Histórico */}
        <div>
          <Card className="p-0 overflow-hidden">
            <div className="px-5 py-3 border-b border-wf-border">
              <h3 className="text-sm font-semibold text-wf-text-primary">Histórico</h3>
            </div>
            {isLoading ? (
              <PageLoader />
            ) : (
              <>
                <div className="divide-y divide-wf-border">
                  {data?.data.map((n) => (
                    <div key={n.id} className="px-5 py-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-wf-text-primary text-sm font-medium truncate">{n.titulo}</p>
                          <p className="text-wf-text-secondary text-xs mt-0.5 line-clamp-2">{n.corpo}</p>
                          <p className="text-wf-text-muted text-xs mt-1">
                            {n.vendedor_id ? `Para: vendedor #${n.vendedor_id.slice(0, 8)}` : 'Broadcast — todos'}
                            {' · '}
                            {new Date(n.created_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {data?.data.length === 0 && (
                    <p className="text-center py-8 text-wf-text-muted text-sm">Nenhuma notificação enviada</p>
                  )}
                </div>
                <div className="flex justify-end px-4 py-3 border-t border-wf-border">
                  <Pagination page={page} totalPages={data?.totalPages ?? 1} onPageChange={setPage} />
                </div>
              </>
            )}
          </Card>
        </div>
      </div>
    </Layout>
  );
}
