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
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { colors, spacing, typography, radius } from '../../theme';

function brl(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
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

export default function AdminVendedorDetalheScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { vendedorId } = route.params;
  const qc = useQueryClient();
  const [motivoReprovacao, setMotivoReprovacao] = useState('');
  const [showReprovarInput, setShowReprovarInput] = useState(false);

  const { data: vendedor, isLoading } = useQuery({
    queryKey: ['admin-vendedor', vendedorId],
    queryFn: () => api.get(`/admin/vendedores/${vendedorId}`).then((r) => r.data),
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['admin-vendedor', vendedorId] });
    qc.invalidateQueries({ queryKey: ['admin-vendedores'] });
  };

  const aprovar = useMutation({
    mutationFn: () => api.patch(`/admin/vendedores/${vendedorId}/aprovar`),
    onSuccess: () => { Alert.alert('Sucesso', 'Vendedor aprovado.'); invalidate(); },
    onError: (e: any) => Alert.alert('Erro', e?.response?.data?.message ?? 'Falha'),
  });

  const reprovar = useMutation({
    mutationFn: () => api.patch(`/admin/vendedores/${vendedorId}/reprovar`, { motivo: motivoReprovacao }),
    onSuccess: () => { Alert.alert('Sucesso', 'Vendedor reprovado.'); setShowReprovarInput(false); invalidate(); },
    onError: (e: any) => Alert.alert('Erro', e?.response?.data?.message ?? 'Falha'),
  });

  const bloquear = useMutation({
    mutationFn: () => api.patch(`/admin/vendedores/${vendedorId}/bloquear`),
    onSuccess: () => { Alert.alert('Sucesso', 'Vendedor bloqueado.'); invalidate(); },
    onError: (e: any) => Alert.alert('Erro', e?.response?.data?.message ?? 'Falha'),
  });

  const desbloquear = useMutation({
    mutationFn: () => api.patch(`/admin/vendedores/${vendedorId}/desbloquear`),
    onSuccess: () => { Alert.alert('Sucesso', 'Vendedor desbloqueado.'); invalidate(); },
    onError: (e: any) => Alert.alert('Erro', e?.response?.data?.message ?? 'Falha'),
  });

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.red} />
      </View>
    );
  }

  if (!vendedor) return null;

  const status = vendedor.status;
  const anyLoading = aprovar.isPending || reprovar.isPending || bloquear.isPending || desbloquear.isPending;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
        <Text style={styles.backText}>← Voltar</Text>
      </TouchableOpacity>

      <Text style={styles.name}>{vendedor.nome} {vendedor.sobrenome ?? ''}</Text>

      <View style={styles.section}>
        <Row label="CPF" value={vendedor.cpf} />
        <Row label="CNPJ" value={vendedor.cnpj} />
        <Row label="WhatsApp" value={vendedor.whatsapp} />
        <Row label="E-mail" value={vendedor.email} />
        <Row label="Distribuidor" value={vendedor.distribuidor_nome} />
        <Row label="Região" value={vendedor.distribuidor_regiao} />
        <Row label="Status" value={status} />
        <Row label="Total de vendas" value={vendedor.total_vendas} />
        <Row label="Total de prêmios" value={brl(vendedor.total_premio ?? 0)} />
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        {status === 'pendente' && (
          <>
            <TouchableOpacity
              style={[styles.btn, styles.btnGreen]}
              onPress={() => aprovar.mutate()}
              disabled={anyLoading}
            >
              <Text style={styles.btnText}>Aprovar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, styles.btnRed]}
              onPress={() => setShowReprovarInput(true)}
              disabled={anyLoading}
            >
              <Text style={styles.btnText}>Reprovar</Text>
            </TouchableOpacity>
          </>
        )}

        {status === 'aprovado' && (
          <TouchableOpacity
            style={[styles.btn, styles.btnRed]}
            onPress={() => Alert.alert('Bloquear', 'Bloquear este vendedor?', [
              { text: 'Cancelar', style: 'cancel' },
              { text: 'Bloquear', style: 'destructive', onPress: () => bloquear.mutate() },
            ])}
            disabled={anyLoading}
          >
            <Text style={styles.btnText}>Bloquear</Text>
          </TouchableOpacity>
        )}

        {status === 'bloqueado' && (
          <TouchableOpacity
            style={[styles.btn, styles.btnGreen]}
            onPress={() => desbloquear.mutate()}
            disabled={anyLoading}
          >
            <Text style={styles.btnText}>Desbloquear</Text>
          </TouchableOpacity>
        )}
      </View>

      {showReprovarInput && (
        <View style={styles.reprovarBox}>
          <Text style={styles.reprovarLabel}>Motivo da reprovação</Text>
          <TextInput
            style={styles.reprovarInput}
            value={motivoReprovacao}
            onChangeText={setMotivoReprovacao}
            placeholder="Descreva o motivo..."
            placeholderTextColor={colors.textMuted}
            multiline
          />
          <View style={styles.reprovarBtns}>
            <TouchableOpacity onPress={() => setShowReprovarInput(false)} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => reprovar.mutate()}
              disabled={anyLoading}
              style={[styles.btn, styles.btnRed, { flex: 1 }]}
            >
              <Text style={styles.btnText}>Confirmar</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {anyLoading && (
        <ActivityIndicator color={colors.red} style={{ marginTop: spacing.md }} />
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
  name: { color: colors.textPrimary, fontSize: typography.lg, fontWeight: '700', marginBottom: spacing.md },
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
  actions: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  btn: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  btnGreen: { backgroundColor: colors.success },
  btnRed: { backgroundColor: colors.red },
  btnText: { color: '#fff', fontWeight: '700', fontSize: typography.sm },
  reprovarBox: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  reprovarLabel: { color: colors.textSecondary, fontSize: typography.sm, fontWeight: '600' },
  reprovarInput: {
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.textPrimary,
    padding: spacing.sm,
    minHeight: 80,
    textAlignVertical: 'top',
    fontSize: typography.sm,
  },
  reprovarBtns: { flexDirection: 'row', gap: spacing.sm },
  cancelBtn: {
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  cancelText: { color: colors.textSecondary, fontSize: typography.sm },
});
