import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { colors, spacing, typography, radius } from '../../theme';

const TABS = [
  { label: 'Pendentes', status: 'solicitado' },
  { label: 'Processando', status: 'em_processamento' },
  { label: 'Pagas', status: 'pago' },
];

function brl(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('pt-BR');
}

function statusColor(s: string) {
  if (s === 'pago') return colors.success;
  if (s === 'em_processamento') return colors.info;
  return colors.warning;
}

export default function AdminFinanceiroListScreen() {
  const navigation = useNavigation<any>();
  const [tabIndex, setTabIndex] = useState(0);
  const [page, setPage] = useState(1);

  const currentStatus = TABS[tabIndex].status;

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['admin-financeiro', currentStatus, page],
    queryFn: () =>
      api.get('/admin/financeiro/solicitacoes', {
        params: { status: currentStatus, page, limit: 20 },
      }).then((r) => r.data),
  });

  const solicitacoes: any[] = data?.data ?? [];
  const totalPages: number = data?.totalPages ?? 1;

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Financeiro</Text>

      {/* Tabs */}
      <View style={styles.tabs}>
        {TABS.map((tab, i) => (
          <TouchableOpacity
            key={tab.status}
            style={[styles.tab, tabIndex === i && styles.tabActive]}
            onPress={() => { setTabIndex(i); setPage(1); }}
          >
            <Text style={[styles.tabText, tabIndex === i && styles.tabTextActive]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={solicitacoes}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.red} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          isLoading ? null : (
            <Text style={styles.empty}>Nenhuma solicitação</Text>
          )
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.row}
            onPress={() => navigation.navigate('FinanceiroDetalhe', { pagamentoId: item.id })}
          >
            <View style={styles.rowLeft}>
              <Text style={styles.rowName}>{item.vendedor_nome}</Text>
              <Text style={styles.rowSub}>Chave PIX: {item.chave_pix ?? '—'}</Text>
              <Text style={styles.rowDate}>{fmtDate(item.created_at)}</Text>
            </View>
            <View style={styles.rowRight}>
              <Text style={styles.rowValor}>{brl(Number(item.valor))}</Text>
              <View style={[styles.badge, { backgroundColor: statusColor(item.status) + '22' }]}>
                <Text style={[styles.badgeText, { color: statusColor(item.status) }]}>{item.status}</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />

      {totalPages > 1 && (
        <View style={styles.pagination}>
          <TouchableOpacity disabled={page === 1} onPress={() => setPage((p) => p - 1)}>
            <Text style={[styles.pageBtn, page === 1 && styles.pageBtnDisabled]}>← Anterior</Text>
          </TouchableOpacity>
          <Text style={styles.pageNum}>{page} / {totalPages}</Text>
          <TouchableOpacity disabled={page >= totalPages} onPress={() => setPage((p) => p + 1)}>
            <Text style={[styles.pageBtn, page >= totalPages && styles.pageBtnDisabled]}>Próxima →</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.black, paddingTop: spacing.xl + spacing.md },
  title: { color: colors.textPrimary, fontSize: typography.lg, fontWeight: '700', marginHorizontal: spacing.md, marginBottom: spacing.sm },
  tabs: { flexDirection: 'row', marginHorizontal: spacing.md, marginBottom: spacing.sm, backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
  tab: { flex: 1, paddingVertical: spacing.sm, alignItems: 'center', borderRadius: radius.md },
  tabActive: { backgroundColor: colors.red },
  tabText: { color: colors.textMuted, fontSize: typography.xs, fontWeight: '600' },
  tabTextActive: { color: '#fff' },
  list: { paddingHorizontal: spacing.md, paddingBottom: spacing.xl, gap: 8 },
  empty: { color: colors.textMuted, fontSize: typography.sm, textAlign: 'center', paddingVertical: spacing.lg },
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
  rowName: { color: colors.textPrimary, fontSize: typography.sm, fontWeight: '600' },
  rowSub: { color: colors.textMuted, fontSize: typography.xs, marginTop: 2 },
  rowDate: { color: colors.textMuted, fontSize: typography.xs, marginTop: 2 },
  rowRight: { alignItems: 'flex-end', gap: 4 },
  rowValor: { color: colors.success, fontSize: typography.base, fontWeight: '700' },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.sm },
  badgeText: { fontSize: typography.xs, fontWeight: '600' },
  pagination: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: spacing.md, gap: spacing.md },
  pageBtn: { color: colors.textSecondary, fontSize: typography.sm },
  pageBtnDisabled: { opacity: 0.3 },
  pageNum: { color: colors.textMuted, fontSize: typography.xs },
});
