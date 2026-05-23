import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { colors, spacing, typography, radius } from '../../theme';

const STATUS_OPTS = ['', 'pendente', 'aprovado', 'reprovado', 'bloqueado'] as const;

function statusColor(s: string) {
  if (s === 'aprovado') return colors.success;
  if (s === 'reprovado' || s === 'bloqueado') return colors.danger;
  return colors.warning;
}

export default function AdminVendedoresListScreen() {
  const navigation = useNavigation<any>();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['admin-vendedores', search, statusFilter, page],
    queryFn: () =>
      api.get('/admin/vendedores', {
        params: {
          busca: search || undefined,
          status: statusFilter || undefined,
          page,
          limit: 20,
        },
      }).then((r) => r.data),
  });

  const vendedores: any[] = data?.data ?? [];
  const totalPages: number = data?.totalPages ?? 1;

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Vendedores</Text>

      <TextInput
        style={styles.search}
        placeholder="Buscar por nome ou CPF..."
        placeholderTextColor={colors.textMuted}
        value={search}
        onChangeText={(t) => { setSearch(t); setPage(1); }}
      />

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
        data={vendedores}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.red} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          isLoading ? null : (
            <Text style={styles.empty}>Nenhum vendedor encontrado</Text>
          )
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.row}
            onPress={() => navigation.navigate('VendedorDetalhe', { vendedorId: item.id })}
          >
            <View style={styles.rowLeft}>
              <Text style={styles.rowName}>{item.nome} {item.sobrenome ?? ''}</Text>
              <Text style={styles.rowSub}>{item.cpf} · {item.distribuidor_nome ?? ''}</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: statusColor(item.status) + '22' }]}>
              <Text style={[styles.badgeText, { color: statusColor(item.status) }]}>{item.status}</Text>
            </View>
          </TouchableOpacity>
        )}
      />

      {totalPages > 1 && (
        <View style={styles.pagination}>
          <TouchableOpacity disabled={page === 1} onPress={() => setPage((p) => p - 1)} style={styles.pageBtn}>
            <Text style={[styles.pageBtnText, page === 1 && styles.pageBtnDisabled]}>← Anterior</Text>
          </TouchableOpacity>
          <Text style={styles.pageNum}>{page} / {totalPages}</Text>
          <TouchableOpacity disabled={page >= totalPages} onPress={() => setPage((p) => p + 1)} style={styles.pageBtn}>
            <Text style={[styles.pageBtnText, page >= totalPages && styles.pageBtnDisabled]}>Próxima →</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.black, paddingTop: spacing.xl + spacing.md },
  title: { color: colors.textPrimary, fontSize: typography.lg, fontWeight: '700', marginHorizontal: spacing.md, marginBottom: spacing.sm },
  search: {
    marginHorizontal: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.textPrimary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.sm,
    marginBottom: spacing.sm,
  },
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
  rowName: { color: colors.textPrimary, fontSize: typography.sm, fontWeight: '600' },
  rowSub: { color: colors.textMuted, fontSize: typography.xs, marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.sm },
  badgeText: { fontSize: typography.xs, fontWeight: '600' },
  pagination: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: spacing.md, gap: spacing.md },
  pageBtn: {},
  pageBtnText: { color: colors.textSecondary, fontSize: typography.sm },
  pageBtnDisabled: { opacity: 0.3 },
  pageNum: { color: colors.textMuted, fontSize: typography.xs },
});
