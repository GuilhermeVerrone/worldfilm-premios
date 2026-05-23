import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { colors, spacing, typography, radius } from '../../theme';

function fmtDate(d?: string) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('pt-BR');
}

function brl(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function statusColor(s: string) {
  if (s === 'ativa') return colors.success;
  if (s === 'rascunho') return colors.info;
  if (s === 'encerrada') return colors.warning;
  return colors.textMuted;
}

function Row({ label, value }: { label: string; value?: string | number }) {
  if (value == null || value === '') return null;
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{String(value)}</Text>
    </View>
  );
}

const STATUS_TRANSITIONS: Record<string, { label: string; next: string; color: string }> = {
  rascunho: { label: 'Ativar campanha', next: 'ativa', color: colors.success },
  ativa: { label: 'Encerrar campanha', next: 'encerrada', color: colors.warning },
  encerrada: { label: 'Arquivar', next: 'arquivada', color: colors.textMuted },
};

export default function AdminCampanhaDetalheScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { campanhaId } = route.params;
  const qc = useQueryClient();

  const { data: campanha, isLoading } = useQuery({
    queryKey: ['admin-campanha', campanhaId],
    queryFn: () => api.get(`/admin/campanhas/${campanhaId}`).then((r) => r.data),
  });

  const changeStatus = useMutation({
    mutationFn: (novoStatus: string) =>
      api.patch(`/admin/campanhas/${campanhaId}/status`, { status: novoStatus }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-campanha', campanhaId] });
      qc.invalidateQueries({ queryKey: ['admin-campanhas'] });
    },
    onError: (e: any) => Alert.alert('Erro', e?.response?.data?.message ?? 'Falha'),
  });

  if (isLoading) {
    return <View style={styles.center}><ActivityIndicator color={colors.red} /></View>;
  }
  if (!campanha) return null;

  const transition = STATUS_TRANSITIONS[campanha.status];
  const premios: any[] = campanha.premios ?? [];

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
        <Text style={styles.backText}>← Voltar</Text>
      </TouchableOpacity>

      <View style={styles.headerRow}>
        <Text style={styles.title} numberOfLines={2}>{campanha.nome}</Text>
        <View style={[styles.badge, { backgroundColor: statusColor(campanha.status) + '22' }]}>
          <Text style={[styles.badgeText, { color: statusColor(campanha.status) }]}>{campanha.status}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Row label="Tipo" value={campanha.tipo} />
        <Row label="Descrição" value={campanha.descricao} />
        <Row label="Início" value={fmtDate(campanha.data_inicio)} />
        <Row label="Fim" value={fmtDate(campanha.data_fim)} />
        <Row label="Total de vendas" value={campanha.total_vendas} />
        <Row label="Total de prêmios" value={campanha.total_premios ? brl(Number(campanha.total_premios)) : undefined} />
      </View>

      {premios.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tabela de prêmios</Text>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableCell, styles.tableHead]}>Produto</Text>
            <Text style={[styles.tableCell, styles.tableHead, styles.tableRight]}>Corte (m)</Text>
            <Text style={[styles.tableCell, styles.tableHead, styles.tableRight]}>Prêmio</Text>
          </View>
          {premios.map((p: any, i: number) => (
            <View key={i} style={[styles.tableHeader, i % 2 === 0 && styles.tableRowEven]}>
              <Text style={styles.tableCell}>{p.produto_nome}</Text>
              <Text style={[styles.tableCell, styles.tableRight]}>{p.metragem_corte}</Text>
              <Text style={[styles.tableCell, styles.tableRight]}>{brl(Number(p.valor_premio))}</Text>
            </View>
          ))}
        </View>
      )}

      {transition && (
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: transition.color }]}
          onPress={() =>
            Alert.alert(
              transition.label,
              `Confirmar: ${transition.label}?`,
              [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Confirmar', onPress: () => changeStatus.mutate(transition.next) },
              ],
            )
          }
          disabled={changeStatus.isPending}
        >
          {changeStatus.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>{transition.label}</Text>
          )}
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.black },
  content: { padding: spacing.md, paddingTop: spacing.xl + spacing.md, paddingBottom: spacing.xl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.black },
  backBtn: { marginBottom: spacing.sm },
  backText: { color: colors.textMuted, fontSize: typography.sm },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.md, gap: spacing.sm },
  title: { color: colors.textPrimary, fontSize: typography.lg, fontWeight: '700', flex: 1 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.sm },
  badgeText: { fontSize: typography.xs, fontWeight: '600' },
  section: {
    backgroundColor: colors.card, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border,
    padding: spacing.md, gap: 10, marginBottom: spacing.md,
  },
  sectionTitle: { color: colors.textSecondary, fontSize: typography.sm, fontWeight: '600', marginBottom: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
  rowLabel: { color: colors.textMuted, fontSize: typography.sm },
  rowValue: { color: colors.textPrimary, fontSize: typography.sm, fontWeight: '500', textAlign: 'right', flex: 1 },
  tableHeader: { flexDirection: 'row', paddingVertical: 4 },
  tableRowEven: { backgroundColor: colors.bg },
  tableCell: { flex: 1, color: colors.textPrimary, fontSize: typography.xs },
  tableHead: { color: colors.textMuted, fontWeight: '600' },
  tableRight: { textAlign: 'right' },
  btn: { paddingVertical: spacing.sm + 2, borderRadius: radius.md, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700', fontSize: typography.sm },
});
