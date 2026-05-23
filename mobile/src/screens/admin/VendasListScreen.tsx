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

const STATUS_OPTS = ['', 'pendente', 'em_analise', 'aprovada', 'reprovada'] as const;

function brl(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('pt-BR');
}

function statusColor(s: string) {
  if (s === 'aprovada') return colors.success;
  if (s === 'reprovada') return colors.danger;
  if (s === 'em_analise') return colors.info;
  return colors.warning;
}

export default function AdminVendasListScreen() {
  const navigation = useNavigation<any>();
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['admin-vendas', statusFilter, page],
    queryFn: () =>
      api.get('/admin/vendas', {
        params: {
          status: statusFilter || undefined,
          page,
          limit: 20,
        },
      }).then((r) => r.data),
  });

  const vendas: any[] = data?.data ?? [];
  const totalPages: number = data?.totalPages ?? 1;

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Vendas</Text>

      <View style={styles.chips}>
        {STATUS_OPTS.map((s) => (
          <TouchableOpacity
            key={s}
            onPress={() => { setStatusFilter(s); setPage(1); }}
            style={[styles.chip, statusFilter === s && styles.chipActive]}
          >
            <Text style={[styles.chipText, statusFilter === s && styles.chipTextActive]}>
              {s || 'Todos'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={vendas}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.red} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          isLoading ? null : (
            <Text style={styles.empty}>Nenhuma venda encontrada</Text>
          )
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.row}
            onPress={() => navigation.navigate('VendaDetalhe', { vendaId: item.id })}
          >
            <View style={styles.rowLeft}>
              <Text style={styles.rowProduto}>{item.produto_nome}</Text>
              <Text style={styles.rowSub}>{item.campanha_nome}</Text>
              <Text style={styles.rowSub}>{item.vendedor_nome} · {fmtDate(item.created_at)}</Text>
            </View>
            <View style={styles.rowRight}>
              <View style={[styles.badge, { backgroundColor: statusColor(item.status) + '22' }]}>
                <Text style={[styles.badgeText, { color: statusColor(item.status) }]}>{item.status}</Text>
              </View>
              <Text style={styles.rowPremio}>{brl(Number(item.premio_calculado ?? 0))}</Text>
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
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginHorizontal: spacing.md, marginBottom: spacing.sm },
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.red, borderColor: colors.red },
  chipText: { color: colors.textSecondary, fontSize: typography.xs },
  chipTextActive: { color: '#fff', fontWeight: '600' },
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
  rowProduto: { color: colors.textPrimary, fontSize: typography.sm, fontWeight: '600' },
  rowSub: { color: colors.textMuted, fontSize: typography.xs, marginTop: 2 },
  rowRight: { alignItems: 'flex-end', gap: 4 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.sm },
  badgeText: { fontSize: typography.xs, fontWeight: '600' },
  rowPremio: { color: colors.success, fontSize: typography.sm, fontWeight: '600' },
  pagination: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: spacing.md, gap: spacing.md },
  pageBtn: { color: colors.textSecondary, fontSize: typography.sm },
  pageBtnDisabled: { opacity: 0.3 },
  pageNum: { color: colors.textMuted, fontSize: typography.xs },
});
