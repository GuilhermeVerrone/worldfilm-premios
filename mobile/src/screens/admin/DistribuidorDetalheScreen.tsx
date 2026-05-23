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

function Row({ label, value }: { label: string; value?: string | number }) {
  if (value == null || value === '') return null;
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{String(value)}</Text>
    </View>
  );
}

export default function AdminDistribuidorDetalheScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { distribuidorId } = route.params;
  const qc = useQueryClient();

  const { data: dist, isLoading } = useQuery({
    queryKey: ['admin-distribuidor', distribuidorId],
    queryFn: () => api.get(`/admin/distribuidores/${distribuidorId}`).then((r) => r.data),
  });

  const changeStatus = useMutation({
    mutationFn: (status: string) =>
      api.patch(`/admin/distribuidores/${distribuidorId}/status`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-distribuidor', distribuidorId] });
      qc.invalidateQueries({ queryKey: ['admin-distribuidores'] });
    },
    onError: (e: any) => Alert.alert('Erro', e?.response?.data?.message ?? 'Falha'),
  });

  if (isLoading) {
    return <View style={styles.center}><ActivityIndicator color={colors.red} /></View>;
  }
  if (!dist) return null;

  const isAtivo = dist.status === 'ativo';

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
        <Text style={styles.backText}>← Voltar</Text>
      </TouchableOpacity>

      <View style={styles.headerRow}>
        <Text style={styles.title} numberOfLines={2}>{dist.razao_social}</Text>
        <View style={[styles.badge, { backgroundColor: isAtivo ? colors.success + '22' : colors.danger + '22' }]}>
          <Text style={[styles.badgeText, { color: isAtivo ? colors.success : colors.danger }]}>{dist.status}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Row label="CNPJ" value={dist.cnpj} />
        <Row label="Responsável" value={dist.responsavel} />
        <Row label="Região" value={dist.regiao} />
        <Row label="Telefone" value={dist.telefone} />
        <Row label="E-mail" value={dist.email} />
        <Row label="Endereço" value={dist.endereco} />
        <Row label="Vendedores ativos" value={dist.vendedores_ativos} />
      </View>

      {isAtivo ? (
        <TouchableOpacity
          style={[styles.btn, styles.btnRed]}
          onPress={() =>
            Alert.alert('Inativar', 'Inativar este distribuidor?', [
              { text: 'Cancelar', style: 'cancel' },
              { text: 'Inativar', style: 'destructive', onPress: () => changeStatus.mutate('inativo') },
            ])
          }
          disabled={changeStatus.isPending}
        >
          {changeStatus.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Inativar</Text>}
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={[styles.btn, styles.btnGreen]}
          onPress={() => changeStatus.mutate('ativo')}
          disabled={changeStatus.isPending}
        >
          {changeStatus.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Reativar</Text>}
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
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
  rowLabel: { color: colors.textMuted, fontSize: typography.sm },
  rowValue: { color: colors.textPrimary, fontSize: typography.sm, fontWeight: '500', textAlign: 'right', flex: 1 },
  btn: { paddingVertical: spacing.sm + 2, borderRadius: radius.md, alignItems: 'center' },
  btnRed: { backgroundColor: colors.red },
  btnGreen: { backgroundColor: colors.success },
  btnText: { color: '#fff', fontWeight: '700', fontSize: typography.sm },
});
