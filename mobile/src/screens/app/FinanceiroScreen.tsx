import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  RefreshControl, Alert, Modal, TextInput, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { vendedorService } from '../../services/vendedor.service';
import { Card } from '../../components/Card';
import { Badge, statusToBadge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { ScreenHeader } from '../../components/ScreenHeader';
import { colors, spacing, typography, radius } from '../../theme';

function formatBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

type FilterType = 'todos' | 'credito' | 'saque';

export default function FinanceiroScreen() {
  const insets = useSafeAreaInsets();

  const [saldo, setSaldo] = useState<any>(null);
  const [extrato, setExtrato] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterType>('todos');
  const [saqueModal, setSaqueModal] = useState(false);
  const [saqueValor, setSaqueValor] = useState('');
  const [saqueLoading, setSaqueLoading] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [saldoData, extratoData] = await Promise.allSettled([
        vendedorService.getSaldo(),
        vendedorService.getExtrato({ limit: 50 }),
      ]);
      if (saldoData.status === 'fulfilled') setSaldo(saldoData.value);
      if (extratoData.status === 'fulfilled') setExtrato(extratoData.value.data ?? []);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  React.useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  async function handleSolicitar() {
    const valor = Number(saqueValor.replace(',', '.'));
    if (!valor || valor < 20) {
      Alert.alert('Valor mínimo', 'O valor mínimo para saque é R$ 20,00.');
      return;
    }
    if (valor > (saldo?.saldo_disponivel ?? 0)) {
      Alert.alert('Saldo insuficiente', 'O valor solicitado é maior que o saldo disponível.');
      return;
    }
    setSaqueLoading(true);
    try {
      await vendedorService.solicitar(valor);
      setSaqueModal(false);
      setSaqueValor('');
      Alert.alert('Solicitação enviada!', 'Seu pagamento será processado em até 3 dias úteis.');
      fetchData();
    } catch (err: any) {
      Alert.alert('Erro', err?.response?.data?.message ?? 'Não foi possível solicitar o pagamento.');
    } finally {
      setSaqueLoading(false);
    }
  }

  const filteredExtrato = extrato.filter((t) => {
    if (filter === 'todos') return true;
    if (filter === 'credito') return t.tipo !== 'saque';
    return t.tipo === 'saque';
  });

  const filterOptions: { key: FilterType; label: string }[] = [
    { key: 'todos', label: 'Todos' },
    { key: 'credito', label: 'Créditos' },
    { key: 'saque', label: 'Saques' },
  ];

  function renderItem({ item: t }: { item: any }) {
    const isSaque = t.tipo === 'saque';
    return (
      <Card style={styles.extratoItem}>
        <View style={styles.extratoRow}>
          <View style={styles.extratoInfo}>
            <Text style={styles.extratoDesc}>{t.descricao ?? (isSaque ? 'Saque' : 'Prêmio')}</Text>
            <Text style={styles.extratoData}>{new Date(t.created_at).toLocaleDateString('pt-BR')}</Text>
          </View>
          <View style={styles.extratoRight}>
            <Text style={[styles.extratoValor, { color: isSaque ? colors.danger : colors.success }]}>
              {isSaque ? '−' : '+'}{formatBRL(t.valor)}
            </Text>
            <Badge label={t.status} variant={statusToBadge(t.status)} />
          </View>
        </View>
      </Card>
    );
  }

  if (loading) {
    return (
      <View style={[styles.loading, { paddingTop: insets.top }]}>
        <ActivityIndicator color={colors.red} size="large" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScreenHeader title="Financeiro" />

      <FlatList
        data={filteredExtrato}
        keyExtractor={(t) => t.id}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.red} />}
        ListHeaderComponent={
          <>
            {/* Saldo */}
            <View style={styles.saldoCard}>
              <View style={styles.saldoRow}>
                <View>
                  <Text style={styles.saldoLabel}>Disponível</Text>
                  <Text style={styles.saldoValue}>{formatBRL(saldo?.saldo_disponivel ?? 0)}</Text>
                </View>
                <View>
                  <Text style={styles.saldoLabel}>Bloqueado</Text>
                  <Text style={styles.saldoBloq}>{formatBRL(saldo?.saldo_bloqueado ?? 0)}</Text>
                </View>
              </View>
              <Button
                title="Solicitar pagamento"
                onPress={() => setSaqueModal(true)}
                disabled={(saldo?.saldo_disponivel ?? 0) < 20}
                fullWidth
                size="lg"
                style={styles.saqueBtn}
              />
            </View>

            {/* Filtros */}
            <View style={styles.chips}>
              {filterOptions.map((f) => (
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
            <Text style={styles.extratoTitle}>Extrato</Text>
          </>
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>Nenhuma transação</Text>
        }
        contentContainerStyle={styles.list}
      />

      {/* Modal de saque */}
      <Modal visible={saqueModal} transparent animationType="slide" onRequestClose={() => setSaqueModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Solicitar Pagamento</Text>

            <View style={styles.pixInfo}>
              <Text style={styles.pixLabel}>Chave PIX</Text>
              <Text style={styles.pixValue}>{saldo?.chave_pix ?? 'Não cadastrada'}</Text>
            </View>

            <Text style={styles.fieldLabel}>Valor (R$)</Text>
            <TextInput
              style={styles.valorInput}
              value={saqueValor}
              onChangeText={setSaqueValor}
              keyboardType="decimal-pad"
              placeholder="0,00"
              placeholderTextColor={colors.textMuted}
            />
            <Text style={styles.maxText}>Disponível: {formatBRL(saldo?.saldo_disponivel ?? 0)}</Text>

            <View style={styles.modalBtns}>
              <Button title="Cancelar" variant="ghost" onPress={() => setSaqueModal(false)} />
              <Button title="Confirmar" onPress={handleSolicitar} loading={saqueLoading} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.black },
  loading: { flex: 1, backgroundColor: colors.black, alignItems: 'center', justifyContent: 'center' },
  saldoCard: {
    margin: spacing.lg,
    backgroundColor: '#1A0000',
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: '#3D0000',
  },
  saldoRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: spacing.md },
  saldoLabel: { color: colors.textMuted, fontSize: typography.sm, textAlign: 'center' },
  saldoValue: { color: colors.textPrimary, fontSize: typography.xl, fontWeight: '700', textAlign: 'center' },
  saldoBloq: { color: colors.warning, fontSize: typography.lg, fontWeight: '600', textAlign: 'center' },
  saqueBtn: {},
  chips: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  chip: {
    paddingVertical: 6, paddingHorizontal: 14,
    borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card,
  },
  chipActive: { backgroundColor: colors.red, borderColor: colors.red },
  chipText: { color: colors.textSecondary, fontSize: typography.sm, fontWeight: '500' },
  chipTextActive: { color: '#fff' },
  extratoTitle: { color: colors.textPrimary, fontSize: typography.md, fontWeight: '600', marginBottom: spacing.sm, paddingHorizontal: spacing.lg },
  list: { paddingBottom: spacing.xl },
  extratoItem: { marginHorizontal: spacing.lg, marginBottom: spacing.sm },
  extratoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  extratoInfo: { flex: 1 },
  extratoDesc: { color: colors.textPrimary, fontSize: typography.base, fontWeight: '500' },
  extratoData: { color: colors.textMuted, fontSize: typography.xs, marginTop: 2 },
  extratoRight: { alignItems: 'flex-end', gap: 4 },
  extratoValor: { fontSize: typography.base, fontWeight: '700' },
  emptyText: { color: colors.textMuted, textAlign: 'center', padding: spacing.xl },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContainer: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  modalTitle: { color: colors.textPrimary, fontSize: typography.lg, fontWeight: '700', marginBottom: spacing.md },
  pixInfo: {
    backgroundColor: '#111',
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pixLabel: { color: colors.textMuted, fontSize: typography.xs, marginBottom: 2 },
  pixValue: { color: colors.textPrimary, fontSize: typography.base, fontWeight: '500' },
  fieldLabel: { color: colors.textSecondary, fontSize: typography.sm, marginBottom: 6 },
  valorInput: {
    backgroundColor: '#1E1E1E',
    borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md,
    color: colors.textPrimary,
    fontSize: typography.xl,
    fontWeight: '700',
    paddingVertical: 12, paddingHorizontal: 14,
    marginBottom: 4,
  },
  maxText: { color: colors.textMuted, fontSize: typography.xs, marginBottom: spacing.md },
  modalBtns: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm, marginTop: spacing.sm },
});
