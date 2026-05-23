import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { colors, spacing, typography, radius } from '../../theme';

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

function Row({ label, value }: { label: string; value?: string | number }) {
  if (value == null || value === '') return null;
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{String(value)}</Text>
    </View>
  );
}

type ActionType = 'aprovar' | 'reprovar' | 'revisao' | null;

export default function AdminVendaDetalheScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { vendaId } = route.params;
  const qc = useQueryClient();

  const [action, setAction] = useState<ActionType>(null);
  const [motivo, setMotivo] = useState('');
  const [metragemAjustada, setMetragemAjustada] = useState('');

  const { data: venda, isLoading } = useQuery({
    queryKey: ['admin-venda', vendaId],
    queryFn: () => api.get(`/admin/vendas/${vendaId}`).then((r) => r.data),
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['admin-venda', vendaId] });
    qc.invalidateQueries({ queryKey: ['admin-vendas'] });
  };

  const aprovar = useMutation({
    mutationFn: () =>
      api.patch(`/admin/vendas/${vendaId}/aprovar`, {
        metragem_ajustada: metragemAjustada ? Number(metragemAjustada) : undefined,
      }),
    onSuccess: () => {
      Alert.alert('Sucesso', 'Venda aprovada!');
      setAction(null);
      invalidate();
      navigation.goBack();
    },
    onError: (e: any) => Alert.alert('Erro', e?.response?.data?.message ?? 'Falha'),
  });

  const reprovar = useMutation({
    mutationFn: () => api.patch(`/admin/vendas/${vendaId}/reprovar`, { motivo }),
    onSuccess: () => {
      Alert.alert('Sucesso', 'Venda reprovada.');
      setAction(null);
      invalidate();
      navigation.goBack();
    },
    onError: (e: any) => Alert.alert('Erro', e?.response?.data?.message ?? 'Falha'),
  });

  const revisao = useMutation({
    mutationFn: () => api.patch(`/admin/vendas/${vendaId}/solicitar-revisao`, { motivo }),
    onSuccess: () => {
      Alert.alert('Sucesso', 'Revisão solicitada.');
      setAction(null);
      invalidate();
      navigation.goBack();
    },
    onError: (e: any) => Alert.alert('Erro', e?.response?.data?.message ?? 'Falha'),
  });

  if (isLoading) {
    return <View style={styles.center}><ActivityIndicator color={colors.red} /></View>;
  }
  if (!venda) return null;

  const anyLoading = aprovar.isPending || reprovar.isPending || revisao.isPending;

  // Realtime prize preview
  const metragemCorte = venda.metragem_corte ? Number(venda.metragem_corte) : 0;
  const valorPremio = venda.valor_premio ? Number(venda.valor_premio) : 0;
  const metragemPreview = metragemAjustada ? Number(metragemAjustada) : Number(venda.metragem ?? 0);
  const premioPreview = metragemCorte > 0
    ? Math.floor(metragemPreview / metragemCorte) * valorPremio
    : Number(venda.premio_estimado ?? 0);

  return (
    <View style={{ flex: 1, backgroundColor: colors.black }}>
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Voltar</Text>
        </TouchableOpacity>

        <View style={styles.headerRow}>
          <Text style={styles.title}>Detalhe da venda</Text>
          <View style={[styles.badge, { backgroundColor: statusColor(venda.status) + '22' }]}>
            <Text style={[styles.badgeText, { color: statusColor(venda.status) }]}>{venda.status}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Row label="Produto" value={venda.produto_nome} />
          <Row label="Campanha" value={venda.campanha_nome} />
          <Row label="Vendedor" value={venda.vendedor_nome} />
          <Row label="Distribuidor" value={venda.distribuidor_nome} />
          <Row label="Data" value={venda.created_at ? fmtDate(venda.created_at) : ''} />
          <Row label="Metragem" value={`${venda.metragem}m`} />
          <Row label="Placa" value={venda.placa_veiculo} />
          <Row label="Cliente" value={venda.nome_cliente} />
        </View>

        <View style={styles.premioCard}>
          <Text style={styles.premioLabel}>Prêmio estimado</Text>
          <Text style={styles.premioValue}>{brl(Number(venda.premio_estimado ?? 0))}</Text>
          {venda.premio_apurado != null && (
            <>
              <Text style={styles.premioLabel}>Prêmio apurado</Text>
              <Text style={[styles.premioValue, { fontSize: typography.xl }]}>{brl(Number(venda.premio_apurado))}</Text>
            </>
          )}
        </View>

        {venda.motivo_reprovacao && (
          <View style={styles.motivoBox}>
            <Text style={styles.motivoLabel}>Motivo da reprovação</Text>
            <Text style={styles.motivoText}>{venda.motivo_reprovacao}</Text>
          </View>
        )}
      </ScrollView>

      {/* Action buttons */}
      {['pendente', 'em_analise'].includes(venda.status) && (
        <View style={styles.footer}>
          <TouchableOpacity style={[styles.btn, styles.btnGreen]} onPress={() => { setAction('aprovar'); setMetragemAjustada(''); }} disabled={anyLoading}>
            <Text style={styles.btnText}>Aprovar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, styles.btnGray]} onPress={() => { setAction('revisao'); setMotivo(''); }} disabled={anyLoading}>
            <Text style={styles.btnText}>Revisão</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, styles.btnRed]} onPress={() => { setAction('reprovar'); setMotivo(''); }} disabled={anyLoading}>
            <Text style={styles.btnText}>Reprovar</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Bottom sheet modal */}
      <Modal visible={action !== null} transparent animationType="slide">
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setAction(null)} />
        <View style={styles.sheet}>
          {action === 'aprovar' && (
            <>
              <Text style={styles.sheetTitle}>Aprovar venda</Text>
              <Text style={styles.sheetSub}>Metragem ajustada (opcional)</Text>
              <TextInput
                style={styles.sheetInput}
                value={metragemAjustada}
                onChangeText={setMetragemAjustada}
                keyboardType="numeric"
                placeholder={`Metragem atual: ${venda.metragem}m`}
                placeholderTextColor={colors.textMuted}
              />
              <Text style={styles.premioPreview}>Prêmio calculado: {brl(premioPreview)}</Text>
              <TouchableOpacity
                style={[styles.btn, styles.btnGreen, { marginTop: spacing.sm }]}
                onPress={() => aprovar.mutate()}
                disabled={anyLoading}
              >
                {anyLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Confirmar aprovação</Text>}
              </TouchableOpacity>
            </>
          )}

          {(action === 'reprovar' || action === 'revisao') && (
            <>
              <Text style={styles.sheetTitle}>{action === 'reprovar' ? 'Reprovar venda' : 'Solicitar revisão'}</Text>
              <TextInput
                style={[styles.sheetInput, { minHeight: 80, textAlignVertical: 'top' }]}
                value={motivo}
                onChangeText={setMotivo}
                placeholder="Motivo (obrigatório)..."
                placeholderTextColor={colors.textMuted}
                multiline
              />
              <TouchableOpacity
                style={[styles.btn, action === 'reprovar' ? styles.btnRed : styles.btnGray, { marginTop: spacing.sm }]}
                onPress={() => action === 'reprovar' ? reprovar.mutate() : revisao.mutate()}
                disabled={anyLoading || !motivo.trim()}
              >
                {anyLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Confirmar</Text>}
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity onPress={() => setAction(null)} style={styles.cancelBtn}>
            <Text style={styles.cancelText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.md, paddingTop: spacing.xl + spacing.md, paddingBottom: 100 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.black },
  backBtn: { marginBottom: spacing.sm },
  backText: { color: colors.textMuted, fontSize: typography.sm },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  title: { color: colors.textPrimary, fontSize: typography.lg, fontWeight: '700' },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.sm },
  badgeText: { fontSize: typography.xs, fontWeight: '600' },
  section: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 10,
    marginBottom: spacing.md,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
  rowLabel: { color: colors.textMuted, fontSize: typography.sm },
  rowValue: { color: colors.textPrimary, fontSize: typography.sm, fontWeight: '500', textAlign: 'right', flex: 1 },
  premioCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  premioLabel: { color: colors.textMuted, fontSize: typography.sm },
  premioValue: { color: colors.success, fontSize: typography.lg, fontWeight: '700', marginBottom: 4 },
  motivoBox: {
    backgroundColor: '#2A0A0A',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.danger,
    padding: spacing.md,
  },
  motivoLabel: { color: colors.textMuted, fontSize: typography.xs, marginBottom: 4 },
  motivoText: { color: colors.danger, fontSize: typography.sm },
  footer: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.black,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  btn: { flex: 1, paddingVertical: spacing.sm + 2, borderRadius: radius.md, alignItems: 'center' },
  btnGreen: { backgroundColor: colors.success },
  btnRed: { backgroundColor: colors.red },
  btnGray: { backgroundColor: colors.border },
  btnText: { color: '#fff', fontWeight: '700', fontSize: typography.sm },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderTopWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  sheetTitle: { color: colors.textPrimary, fontSize: typography.md, fontWeight: '700' },
  sheetSub: { color: colors.textSecondary, fontSize: typography.sm },
  sheetInput: {
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.textPrimary,
    padding: spacing.sm,
    fontSize: typography.sm,
  },
  premioPreview: { color: colors.success, fontSize: typography.sm, fontWeight: '600' },
  cancelBtn: { alignItems: 'center', paddingVertical: spacing.sm },
  cancelText: { color: colors.textMuted, fontSize: typography.sm },
});
