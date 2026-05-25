import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge, statusToBadge } from '../components/ui/Badge';
import { PageLoader } from '../components/ui/Spinner';
import { dashboardService } from '../services/dashboard.service';
import { cn } from '../lib/utils';

function formatBRL(val: number) {
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// SVG icons for stat cards
const IconPeople = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const IconClock = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const IconChart = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const IconPause = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const IconMegaphone = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
  </svg>
);

const IconWallet = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
  </svg>
);

interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  iconBg: string;
  alert?: boolean;
}

function StatCard({ label, value, icon, iconBg, alert }: StatCardProps) {
  const isAlert = alert && Number(value) > 0;
  return (
    <div
      className={cn(
        'bg-white rounded-xl p-5 shadow-sm',
        isAlert ? 'border-l-4 border-amber-400' : 'border border-wf-border/60',
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] font-semibold text-wf-text-muted uppercase tracking-wide">{label}</p>
        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', iconBg)}>
          {icon}
        </div>
      </div>
      <p className={cn('text-3xl font-bold', isAlert ? 'text-amber-600' : 'text-wf-text-primary')}>
        {value}
      </p>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: dashboardService.get,
    refetchInterval: 60_000,
  });

  if (isLoading || !data) return <Layout title="Dashboard"><PageLoader /></Layout>;

  const { cards, vendasPorCampanha, atividadeRecente } = data;

  const maxVendas = Math.max(...vendasPorCampanha.map((v) => v.total), 1);

  return (
    <Layout title="Dashboard">
      {/* Alert banners */}
      {(cards.pendentes > 0 || cards.vendasPendentes > 0 || cards.solicitacoesPendentes > 0) && (
        <div className="mb-5 flex flex-wrap gap-3">
          {cards.pendentes > 0 && (
            <button
              onClick={() => navigate('/admin/usuarios?status=pendente')}
              className="flex items-center gap-2 bg-amber-50 border border-amber-300 rounded-lg px-3 py-2 text-sm text-amber-700 hover:bg-amber-100 transition-colors font-medium"
            >
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{cards.pendentes} vendedor{cards.pendentes > 1 ? 'es' : ''} aguardando aprovação</span>
            </button>
          )}
          {cards.vendasPendentes > 0 && (
            <button
              onClick={() => navigate('/admin/vendas?status=pendente')}
              className="flex items-center gap-2 bg-amber-50 border border-amber-300 rounded-lg px-3 py-2 text-sm text-amber-700 hover:bg-amber-100 transition-colors font-medium"
            >
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{cards.vendasPendentes} venda{cards.vendasPendentes > 1 ? 's' : ''} pendente{cards.vendasPendentes > 1 ? 's' : ''}</span>
            </button>
          )}
          {cards.solicitacoesPendentes > 0 && (
            <button
              onClick={() => navigate('/admin/financeiro')}
              className="flex items-center gap-2 bg-amber-50 border border-amber-300 rounded-lg px-3 py-2 text-sm text-amber-700 hover:bg-amber-100 transition-colors font-medium"
            >
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{cards.solicitacoesPendentes} saque{cards.solicitacoesPendentes > 1 ? 's' : ''} solicitado{cards.solicitacoesPendentes > 1 ? 's' : ''}</span>
            </button>
          )}
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <StatCard
          label="Vendedores ativos"
          value={cards.totalVendedores}
          icon={<IconPeople />}
          iconBg="bg-blue-100 text-blue-600"
        />
        <StatCard
          label="Aguardando aprovação"
          value={cards.pendentes}
          icon={<IconClock />}
          iconBg="bg-amber-100 text-amber-600"
          alert
        />
        <StatCard
          label="Total de vendas"
          value={cards.totalVendas}
          icon={<IconChart />}
          iconBg="bg-green-100 text-green-600"
        />
        <StatCard
          label="Vendas pendentes"
          value={cards.vendasPendentes}
          icon={<IconPause />}
          iconBg="bg-amber-100 text-amber-600"
          alert
        />
        <StatCard
          label="Campanhas ativas"
          value={cards.totalCampanhas}
          icon={<IconMegaphone />}
          iconBg="bg-purple-100 text-purple-600"
        />
        <StatCard
          label="Saques solicitados"
          value={cards.solicitacoesPendentes}
          icon={<IconWallet />}
          iconBg="bg-amber-100 text-amber-600"
          alert
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Bar chart — vendas por campanha */}
        <Card>
          <CardHeader>
            <CardTitle>Vendas por Campanha</CardTitle>
          </CardHeader>
          {vendasPorCampanha.length === 0 ? (
            <p className="text-wf-text-muted text-sm text-center py-8">Nenhuma venda registrada</p>
          ) : (
            <div className="space-y-3">
              {vendasPorCampanha.map((item) => (
                <div key={item.campanha}>
                  <div className="flex justify-between text-xs text-wf-text-secondary mb-1.5">
                    <span className="truncate max-w-[55%] font-medium">{item.campanha}</span>
                    <span className="text-wf-text-muted">{item.total} vendas · {formatBRL(item.totalPremios)}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-wf-red rounded-full transition-all"
                      style={{ width: `${(item.total / maxVendas) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Recent activity */}
        <Card>
          <CardHeader>
            <CardTitle>Atividade Recente</CardTitle>
          </CardHeader>
          {atividadeRecente.length === 0 ? (
            <p className="text-wf-text-muted text-sm text-center py-8">Nenhuma atividade</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[11px] text-wf-text-muted uppercase tracking-wide border-b border-wf-border/60">
                    <th className="text-left pb-2 font-semibold">Vendedor</th>
                    <th className="text-left pb-2 font-semibold">Campanha</th>
                    <th className="text-right pb-2 font-semibold">Prêmio</th>
                    <th className="text-right pb-2 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-wf-border/40">
                  {atividadeRecente.map((v) => (
                    <tr
                      key={v.id}
                      onClick={() => navigate(`/admin/vendas/${v.id}`)}
                      className="cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-2.5 text-wf-text-secondary font-medium truncate max-w-[120px]">{v.vendedor}</td>
                      <td className="py-2.5 text-wf-text-muted truncate max-w-[100px]">{v.campanha}</td>
                      <td className="py-2.5 text-right text-green-600 font-semibold">{formatBRL(Number(v.premio_estimado ?? 0))}</td>
                      <td className="py-2.5 text-right">
                        <Badge variant={statusToBadge(v.status)}>{v.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </Layout>
  );
}
