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

const STATUS_OPTS = ['', 'rascunho', 'ativa', 'encerrada', 'arquivada'] as const;

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('pt-BR');
}

function statusColor(s: string) {
  if (s === 'ativa') return colors.success;
  if (s === 'rascunho') return colors.info;
  if (s === 'encerrada') return colors.warning;
  return colors.textMuted;
}

export default function AdminCampanhasListScreen() {
  const navigation = useNavigation<any>();
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['admin-campanhas', statusFilter, page],
    queryFn: () =>
      api.get('/admin/campanhas', {
        params: { status: statusFilter || undefined, page, limit: 20 },
      }).then((r) => r.data),
  });

  const campanhas: any[] = data?.data ?? [];
  const totalPages: number = data?.totalPages ?? 1;

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Campanhas</Text>

      <View style={styles.chips}>
        {STATUS_OPTS.map((s) => (
          <TouchableOpacity
            key={s}
            onPress={() => { setStatusFilter(s); setPage(1); }}
            style={[styles.chip, statusFilter === s && styles.chipActive]}
          >
            <Text style={[styles.chipText, statusFilter === s && styles.chipTextActive]}>
              {s || 'Todas'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={campanhas}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.red} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          isLoading ? null : <Text style={styles.empty}>Nenhuma campanha encontrada</Text>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.row}
            onPress={() => navigation.navigate('CampanhaDetalhe', { campanhaId: item.id })}
          >
            <View style={styles.rowLeft}>
              <Text style={styles.rowNome}>{item.nome}</Text>
              <Text style={styles.rowSub}>{item.tipo}</Text>
              {item.data_inicio && (
                <Text style={styles.rowDate}>
                  {fmtDate(item.data_inicio)} – {item.data_fim ? fmtDate(item.data_fim) : '?'}
                </Text>
              )}
            </View>
            <View style={[styles.badge, { backgroundColor: statusColor(item.status) + '22' }]}>
              <Text style={[styles.badgeText, { color: statusColor(item.status) }]}>{item.status}</Text>
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
    paddingHorizontal: spacing.sm, paddingVertical: 4,
    borderRadius: radius.sm, backgroundColor: colors.card,
    borderWidth: 1, borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.red, borderColor: colors.red },
  chipText: { color: colors.textSecondary, fontSize: typography.xs },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  list: { paddingHorizontal: spacing.md, paddingBottom: spacing.xl, gap: 8 },
  empty: { color: colors.textMuted, fontSize: typography.sm, textAlign: 'center', paddingVertical: spacing.lg },
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: colors.card, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border, padding: spacing.md,
  },
  rowLeft: { flex: 1 },
  rowNome: { color: colors.textPrimary, fontSize: typography.sm, fontWeight: '600' },
  rowSub: { color: colors.textMuted, fontSize: typography.xs, marginTop: 2 },
  rowDate: { color: colors.textMuted, fontSize: typography.xs, marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.sm },
  badgeText: { fontSize: typography.xs, fontWeight: '600' },
  pagination: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: spacing.md, gap: spacing.md },
  pageBtn: { color: colors.textSecondary, fontSize: typography.sm },
  pageBtnDisabled: { opacity: 0.3 },
  pageNum: { color: colors.textMuted, fontSize: typography.xs },
});
