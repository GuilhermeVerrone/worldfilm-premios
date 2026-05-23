import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  RefreshControl, TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { campanhaService } from '../../services/campanha.service';
import { Card } from '../../components/Card';
import { Badge, statusToBadge } from '../../components/Badge';
import { ScreenHeader } from '../../components/ScreenHeader';
import { colors, spacing, typography, radius } from '../../theme';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AppStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<AppStackParamList>;

function formatBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function diasRestantes(dataFim: string) {
  const diff = new Date(dataFim).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

type Filter = 'todas' | 'ativa' | 'encerrada';

export default function CampanhasScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();

  const [campanhas, setCampanhas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('ativa');

  const fetchCampanhas = useCallback(async () => {
    try {
      const data = await campanhaService.list({ limit: 50 });
      setCampanhas(data.data ?? []);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  React.useEffect(() => { fetchCampanhas(); }, [fetchCampanhas]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCampanhas();
  };

  const filtered = campanhas.filter((c) => {
    const matchSearch = c.nome.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'todas' || c.status === filter;
    return matchSearch && matchFilter;
  });

  const filters: { key: Filter; label: string }[] = [
    { key: 'todas', label: 'Todas' },
    { key: 'ativa', label: 'Ativas' },
    { key: 'encerrada', label: 'Encerradas' },
  ];

  function renderCampanha({ item: c }: { item: any }) {
    const dias = diasRestantes(c.data_fim);
    const premios = c.premios ?? [];
    const maxPremio = premios.reduce((mx: number, p: any) => Math.max(mx, p.valor_premio ?? 0), 0);
    const meuDesempenho = c.meu_desempenho;

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => navigation.navigate('DetalheCampanha', { campanhaId: c.id })}
      >
        <Card style={styles.campCard}>
          <View style={styles.campHeader}>
            <Text style={styles.campNome} numberOfLines={2}>{c.nome}</Text>
            <Badge label={c.status} variant={statusToBadge(c.status)} />
          </View>

          <View style={styles.campInfo}>
            <Text style={styles.campMeta}>
              {c.status === 'ativa'
                ? dias === 0 ? 'Encerra hoje' : `Encerra em ${dias} dia${dias !== 1 ? 's' : ''}`
                : `Encerrou em ${new Date(c.data_fim).toLocaleDateString('pt-BR')}`}
            </Text>
            {maxPremio > 0 && (
              <Text style={styles.campPremio}>Até {formatBRL(maxPremio)} por corte</Text>
            )}
          </View>

          {meuDesempenho && (
            <View style={styles.desempenho}>
              <Text style={styles.desempenhoText}>
                Você já ganhou: <Text style={styles.desempenhoValor}>{formatBRL(meuDesempenho.total_premios ?? 0)}</Text>
              </Text>
            </View>
          )}
        </Card>
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScreenHeader title="Campanhas" />

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar campanha..."
          placeholderTextColor={colors.textMuted}
        />
      </View>

      <View style={styles.chips}>
        {filters.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.chip, filter === f.key && styles.chipActive]}
            onPress={() => setFilter(f.key)}
            activeOpacity={0.7}
          >
            <Text style={[styles.chipText, filter === f.key && styles.chipTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(c) => c.id}
        renderItem={renderCampanha}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.red} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📢</Text>
            <Text style={styles.emptyText}>{loading ? 'Carregando...' : 'Nenhuma campanha encontrada'}</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.black },
  searchContainer: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  searchInput: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.textPrimary,
    fontSize: typography.base,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  chips: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  chipActive: { backgroundColor: colors.red, borderColor: colors.red },
  chipText: { color: colors.textSecondary, fontSize: typography.sm, fontWeight: '500' },
  chipTextActive: { color: '#fff' },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  campCard: { marginBottom: spacing.sm },
  campHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.sm },
  campNome: { color: colors.textPrimary, fontSize: typography.base, fontWeight: '600', flex: 1, marginRight: 8 },
  campInfo: { gap: 4 },
  campMeta: { color: colors.textMuted, fontSize: typography.sm },
  campPremio: { color: colors.success, fontSize: typography.sm, fontWeight: '600' },
  desempenho: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  desempenhoText: { color: colors.textSecondary, fontSize: typography.sm },
  desempenhoValor: { color: colors.success, fontWeight: '700' },
  empty: { alignItems: 'center', paddingVertical: spacing.xl },
  emptyIcon: { fontSize: 48, marginBottom: spacing.md },
  emptyText: { color: colors.textMuted, fontSize: typography.base },
});
