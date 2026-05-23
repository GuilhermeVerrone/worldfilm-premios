import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQueries } from '@tanstack/react-query';
import { api } from '../../services/api';
import { colors, spacing, typography, radius } from '../../theme';

function brl(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('pt-BR');
}

function horasDesde(d: string) {
  return Math.floor((Date.now() - new Date(d).getTime()) / 3_600_000);
}

function SummaryCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardValue}>{value}</Text>
      <Text style={styles.cardLabel}>{label}</Text>
      {sub ? <Text style={styles.cardSub}>{sub}</Text> : null}
    </View>
  );
}

export default function AdminDashboardScreen() {
  const navigation = useNavigation<any>();

  const [resumoQuery, vendasQuery] = useQueries({
    queries: [
      {
        queryKey: ['admin-dashboard-resumo'],
        queryFn: () => api.get('/admin/dashboard/resumo').then((r) => r.data),
      },
      {
        queryKey: ['admin-vendas-pendentes'],
        queryFn: () =>
          api.get('/admin/vendas', { params: { status: 'pendente', limit: 5 } }).then((r) => r.data.data as any[]),
      },
    ],
  });

  const resumo = resumoQuery.data;
  const vendas: any[] = vendasQuery.data ?? [];
  const isLoading = resumoQuery.isLoading || vendasQuery.isLoading;
  const isRefetching = resumoQuery.isRefetching || vendasQuery.isRefetching;

  function refetch() {
    resumoQuery.refetch();
    vendasQuery.refetch();
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.red} />}
    >
      <Text style={styles.title}>Dashboard</Text>

      {isLoading ? (
        <View style={styles.skeletonGrid}>
          {[0, 1, 2, 3].map((i) => <View key={i} style={styles.skeletonCard} />)}
        </View>
      ) : (
        <View style={styles.grid}>
          <SummaryCard
            label="Vendedores ativos"
            value={resumo?.vendedores_ativos ?? 0}
            sub={`${resumo?.vendedores_pendentes ?? 0} pendentes`}
          />
          <SummaryCard label="Vendas no mês" value={resumo?.vendas_mes ?? 0} />
          <SummaryCard label="Prêmios apurados" value={brl(resumo?.premios_apurados_mes ?? 0)} />
          <SummaryCard
            label="Saques pendentes"
            value={resumo?.solicitacoes_pendentes ?? 0}
            sub={`${brl(resumo?.total_pago_mes ?? 0)} pagos`}
          />
        </View>
      )}

      <Text style={styles.sectionTitle}>Aguardando validação</Text>

      {isLoading ? (
        <ActivityIndicator color={colors.red} style={{ marginVertical: spacing.md }} />
      ) : vendas.length === 0 ? (
        <Text style={styles.empty}>Nenhuma venda pendente</Text>
      ) : (
        <View style={styles.list}>
          {vendas.map((v: any) => {
            const horas = horasDesde(v.created_at);
            const urgente = horas > 48;
            return (
              <TouchableOpacity
                key={v.id}
                style={styles.row}
                onPress={() => navigation.navigate('AdminVendas', { screen: 'VendaDetalhe', params: { vendaId: v.id } })}
              >
                <View style={styles.rowLeft}>
                  <Text style={styles.rowVendedor}>{v.vendedor_nome}</Text>
                  <Text style={styles.rowSub}>{v.produto_nome} · {v.metragem}m</Text>
                  <Text style={styles.rowDate}>{fmtDate(v.created_at)}</Text>
                </View>
                <View style={styles.rowRight}>
                  {urgente && (
                    <View style={styles.urgenteBadge}>
                      <Text style={styles.urgenteText}>há {horas}h</Text>
                    </View>
                  )}
                  <Text style={styles.rowPremio}>{brl(Number(v.premio_estimado ?? 0))}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.black },
  content: { padding: spacing.md, paddingTop: spacing.xl + spacing.md },
  title: { color: colors.textPrimary, fontSize: typography.lg, fontWeight: '700', marginBottom: spacing.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  skeletonGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  skeletonCard: { width: '47%', height: 80, backgroundColor: colors.card, borderRadius: radius.lg },
  card: {
    width: '47%',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  cardValue: { color: colors.textPrimary, fontSize: typography.xl, fontWeight: '700' },
  cardLabel: { color: colors.textSecondary, fontSize: typography.xs, marginTop: 2 },
  cardSub: { color: colors.red, fontSize: typography.xs, marginTop: 2 },
  sectionTitle: { color: colors.textPrimary, fontSize: typography.base, fontWeight: '600', marginBottom: spacing.sm },
  empty: { color: colors.textMuted, fontSize: typography.sm, textAlign: 'center', paddingVertical: spacing.lg },
  list: { gap: spacing.sm },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  rowLeft: { flex: 1 },
  rowVendedor: { color: colors.textPrimary, fontSize: typography.sm, fontWeight: '600' },
  rowSub: { color: colors.textSecondary, fontSize: typography.xs, marginTop: 2 },
  rowDate: { color: colors.textMuted, fontSize: typography.xs, marginTop: 2 },
  rowRight: { alignItems: 'flex-end', gap: 4 },
  urgenteBadge: { backgroundColor: colors.warning + '33', paddingHorizontal: 6, paddingVertical: 2, borderRadius: radius.sm },
  urgenteText: { color: colors.warning, fontSize: typography.xs, fontWeight: '600' },
  rowPremio: { color: colors.success, fontSize: typography.sm, fontWeight: '600' },
});
