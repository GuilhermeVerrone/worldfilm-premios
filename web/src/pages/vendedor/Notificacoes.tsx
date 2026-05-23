import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { Skeleton } from '../../components/ui/Skeleton';

function fmtDate(d: string) {
  return new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function VendedorNotificacoes() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['notificacoes-lista'],
    queryFn: () => api.get('/notificacoes').then((r) => r.data.data as any[]),
  });

  const marcarLidaMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/notificacoes/${id}/lida`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notificacoes-lista'] });
      qc.invalidateQueries({ queryKey: ['notificacoes-count'] });
    },
  });

  const marcarTodasMutation = useMutation({
    mutationFn: () => api.patch('/notificacoes/todas-lidas'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notificacoes-lista'] });
      qc.invalidateQueries({ queryKey: ['notificacoes-count'] });
    },
  });

  const notificacoes: any[] = data ?? [];
  const temNaoLidas = notificacoes.some((n) => !n.lida);

  return (
    <div className="p-4 pb-8">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-semibold text-wf-text-primary">Notificações</p>
        {temNaoLidas && (
          <button
            onClick={() => marcarTodasMutation.mutate()}
            disabled={marcarTodasMutation.isPending}
            className="text-xs text-red-500 hover:text-red-600"
          >
            Marcar todas como lidas
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">{[0,1,2].map(i => <Skeleton key={i} className="h-16" />)}</div>
      ) : notificacoes.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-4xl mb-3">🔔</p>
          <p className="text-wf-text-secondary font-medium">Nenhuma notificação</p>
          <p className="text-wf-text-muted text-sm mt-1">Você está em dia!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notificacoes.map((n: any) => (
            <div
              key={n.id}
              onClick={() => !n.lida && marcarLidaMutation.mutate(n.id)}
              className={`relative px-4 py-3 cursor-pointer transition-colors ${
                n.lida ? 'bg-white rounded-xl shadow-sm' : 'bg-white rounded-xl shadow-md border-l-4 border-wf-red'
              }`}
            >
              {!n.lida && (
                <span className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-blue-500" />
              )}
              <p className="text-sm font-medium text-wf-text-primary pl-2">{n.titulo}</p>
              <p className="text-xs text-wf-text-secondary mt-0.5 pl-2">{n.corpo}</p>
              <p className="text-xs text-wf-text-muted mt-1 pl-2">{fmtDate(n.created_at)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
