import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { Skeleton } from '../../components/ui/Skeleton';
import { Badge, statusToBadge } from '../../components/ui/Badge';

function brl(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('pt-BR');
}

export default function VendedorVendaDetalhe() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: venda, isLoading } = useQuery({
    queryKey: ['venda-vendedor', id],
    queryFn: () => api.get(`/vendas/${id}`).then((r) => r.data),
  });

  if (isLoading) {
    return <div className="p-4 space-y-3"><Skeleton className="h-8 w-1/2" /><Skeleton className="h-48" /></div>;
  }
  if (!venda) return null;

  return (
    <div className="p-4 space-y-4 pb-8">
      <button onClick={() => navigate(-1)} className="text-xs text-wf-text-muted hover:text-wf-text-primary flex items-center gap-1">
        ← Voltar
      </button>

      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-wf-text-primary">Detalhe da venda</h1>
        <Badge variant={statusToBadge(venda.status)}>{venda.status}</Badge>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 space-y-3 text-sm">
        <Row label="Produto" value={venda.produto_nome} />
        <Row label="Campanha" value={venda.campanha_nome} />
        <Row label="Data" value={fmtDate(venda.created_at)} />
        <Row label="Metragem" value={`${venda.metragem}m`} />
        {venda.placa_veiculo && <Row label="Placa" value={venda.placa_veiculo} />}
        {venda.nome_cliente && <Row label="Cliente" value={venda.nome_cliente} />}
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-wf-text-muted">Prêmio estimado</span>
          <span className="text-green-600 font-semibold">{brl(Number(venda.premio_estimado ?? 0))}</span>
        </div>
        {venda.premio_apurado != null && (
          <div className="flex justify-between">
            <span className="text-wf-text-muted">Prêmio apurado</span>
            <span className="text-green-600 font-bold text-base">{brl(Number(venda.premio_apurado))}</span>
          </div>
        )}
      </div>

      {venda.status === 'reprovada' && venda.motivo_reprovacao && (
        <div className="bg-red-50 border border-red-800 p-4 text-sm">
          <p className="text-xs text-wf-text-muted mb-1">Motivo da reprovação</p>
          <p className="text-red-300">{venda.motivo_reprovacao}</p>
          {venda.reprovado_em && (
            <p className="text-xs text-wf-text-muted mt-1">{fmtDate(venda.reprovado_em)}</p>
          )}
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-wf-text-muted">{label}</span>
      <span className="text-wf-text-primary text-right">{value}</span>
    </div>
  );
}
