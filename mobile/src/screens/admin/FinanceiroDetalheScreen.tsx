import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  Linking,
  Modal,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { launchImageLibrary } from 'react-native-image-picker';
import { api } from '../../services/api';
import { colors, spacing, typography, radius } from '../../theme';

function brl(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('pt-BR');
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

export default function AdminFinanceiroDetalheScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { pagamentoId } = route.params;
  const qc = useQueryClient();

  const [comprovante, setComprovante] = useState<{ uri: string; name: string; type: string } | null>(null);
  const [imageModal, setImageModal] = useState(false);

  const { data: sol, isLoading } = useQuery({
    queryKey: ['admin-financeiro-detalhe', pagamentoId],
    queryFn: () => api.get(`/admin/financeiro/solicitacoes/${pagamentoId}`).then((r) => r.data),
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['admin-financeiro-detalhe', pagamentoId] });
    qc.invalidateQueries({ queryKey: ['admin-financeiro'] });
  };

  const processar = useMutation({
    mutationFn: () => api.patch(`/admin/financeiro/solicitacoes/${pagamentoId}/processar`),
    onSuccess: () => { Alert.alert('Sucesso', 'Marcado como em processamento.'); invalidate(); },
    onError: (e: any) => Alert.alert('Erro', e?.response?.data?.message ?? 'Falha'),
  });

  const pagar = useMutation({
    mutationFn: async () => {
      if (!comprovante) throw new Error('Selecione um comprovante.');
      const form = new FormData();
      form.append('comprovante', { uri: comprovante.uri, name: comprovante.name, type: comprovante.type } as any);
      return api.patch(`/admin/financeiro/solicitacoes/${pagamentoId}/pagar`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    onSuccess: () => { Alert.alert('Sucesso', 'Pagamento registrado!'); setComprovante(null); invalidate(); navigation.goBack(); },
    onError: (e: any) => Alert.alert('Erro', e?.response?.data?.message ?? 'Falha'),
  });

  async function pickComprovante() {
    const result = await launchImageLibrary({ mediaType: 'mixed', quality: 0.8 });
    if (result.assets?.[0]) {
      const asset = result.assets[0];
      setComprovante({
        uri: asset.uri!,
        name: asset.fileName ?? 'comprovante.jpg',
        type: asset.type ?? 'image/jpeg',
      });
    }
  }

  if (isLoading) {
    return <View style={styles.center}><ActivityIndicator color={colors.red} /></View>;
  }
  if (!sol) return null;

  const isImage = sol.comprovante_url && /\.(jpg|jpeg|png|webp)$/i.test(sol.comprovante_url);
  const isPdf = sol.comprovante_url && /\.pdf$/i.test(sol.comprovante_url);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
        <Text style={styles.backText}>← Voltar</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Solicitação de pagamento</Text>
      <Text style={styles.valor}>{brl(Number(sol.valor))}</Text>

      <View style={styles.section}>
        <Row label="Vendedor" value={sol.vendedor_nome} />
        <Row label="Distribuidor" value={sol.distribuidor_nome} />
        <Row label="CPF" value={sol.vendedor_cpf} />
        <Row label="Chave PIX" value={sol.chave_pix_destino} />
        <Row label="Data da solicitação" value={sol.created_at ? fmtDate(sol.created_at) : ''} />
        <Row label="Status" value={sol.status} />
        {sol.pago_em && <Row label="Pago em" value={fmtDate(sol.pago_em)} />}
      </View>

      {/* Actions by status */}
      {sol.status === 'solicitado' && (
        <TouchableOpacity
          style={[styles.btn, styles.btnBlue]}
          onPress={() => Alert.alert('Confirmar', 'Marcar como em processamento?', [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Confirmar', onPress: () => processar.mutate() },
          ])}
          disabled={processar.isPending}
        >
          {processar.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Marcar como processando</Text>}
        </TouchableOpacity>
      )}

      {sol.status === 'em_processamento' && (
        <View style={styles.pagamentoBox}>
          <Text style={styles.pagamentoLabel}>Registrar pagamento</Text>
          <TouchableOpacity style={styles.pickBtn} onPress={pickComprovante}>
            <Text style={styles.pickBtnText}>{comprovante ? '✓ Comprovante selecionado' : 'Selecionar comprovante'}</Text>
          </TouchableOpacity>
          {comprovante && (
            <Image source={{ uri: comprovante.uri }} style={styles.preview} resizeMode="cover" />
          )}
          <TouchableOpacity
            style={[styles.btn, styles.btnGreen, { opacity: comprovante ? 1 : 0.5 }]}
            onPress={() => pagar.mutate()}
            disabled={!comprovante || pagar.isPending}
          >
            {pagar.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Confirmar pagamento</Text>}
          </TouchableOpacity>
        </View>
      )}

      {sol.status === 'pago' && sol.comprovante_url && (
        <View style={styles.comprovanteBox}>
          <Text style={styles.pagamentoLabel}>Comprovante</Text>
          {isImage ? (
            <>
              <TouchableOpacity onPress={() => setImageModal(true)}>
                <Image source={{ uri: sol.comprovante_url }} style={styles.comprovanteImg} resizeMode="cover" />
                <Text style={styles.verTexto}>Toque para ampliar</Text>
              </TouchableOpacity>
              <Modal visible={imageModal} transparent onRequestClose={() => setImageModal(false)}>
                <TouchableOpacity style={styles.modalOverlay} onPress={() => setImageModal(false)}>
                  <Image source={{ uri: sol.comprovante_url }} style={styles.modalImg} resizeMode="contain" />
                </TouchableOpacity>
              </Modal>
            </>
          ) : isPdf ? (
            <TouchableOpacity
              style={[styles.btn, styles.btnBlue]}
              onPress={() => Linking.openURL(sol.comprovante_url)}
            >
              <Text style={styles.btnText}>Abrir PDF</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.rowValue}>{sol.comprovante_url}</Text>
          )}
        </View>
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
  title: { color: colors.textPrimary, fontSize: typography.lg, fontWeight: '700' },
  valor: { color: colors.success, fontSize: typography.xxl, fontWeight: '800', marginBottom: spacing.md },
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
  btn: { paddingVertical: spacing.sm + 2, borderRadius: radius.md, alignItems: 'center', marginBottom: spacing.sm },
  btnGreen: { backgroundColor: colors.success },
  btnBlue: { backgroundColor: colors.info },
  btnText: { color: '#fff', fontWeight: '700', fontSize: typography.sm },
  pagamentoBox: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  pagamentoLabel: { color: colors.textSecondary, fontSize: typography.sm, fontWeight: '600' },
  pickBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.sm,
    alignItems: 'center',
  },
  pickBtnText: { color: colors.textSecondary, fontSize: typography.sm },
  preview: { width: '100%', height: 120, borderRadius: radius.md },
  comprovanteBox: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  comprovanteImg: { width: '100%', height: 180, borderRadius: radius.md },
  verTexto: { color: colors.textMuted, fontSize: typography.xs, textAlign: 'center', marginTop: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center' },
  modalImg: { width: '100%', height: '80%' },
});
