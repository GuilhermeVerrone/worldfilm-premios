import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '../../services/api';
import { colors, spacing, typography, radius } from '../../theme';

type Destinatario = 'todos' | 'distribuidor' | 'vendedor';

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export default function AdminNotificacoesScreen() {
  const [titulo, setTitulo] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [destinatario, setDestinatario] = useState<Destinatario>('todos');
  const [distribuidorId, setDistribuidorId] = useState('');
  const [vendedorSearch, setVendedorSearch] = useState('');
  const [vendedorId, setVendedorId] = useState('');
  const [vendedorNome, setVendedorNome] = useState('');

  const { data: distribuidores } = useQuery({
    queryKey: ['admin-distribuidores-select'],
    queryFn: () =>
      api.get('/admin/distribuidores', { params: { status: 'ativo', limit: 100 } }).then((r) => r.data.data as any[]),
  });

  const { data: vendedoresData } = useQuery({
    queryKey: ['admin-vendedores-search', vendedorSearch],
    queryFn: () =>
      api.get('/admin/vendedores', { params: { busca: vendedorSearch, limit: 10 } }).then((r) => r.data.data as any[]),
    enabled: destinatario === 'vendedor' && vendedorSearch.length >= 2,
  });

  const { data: historico, refetch: refetchHistorico } = useQuery({
    queryKey: ['admin-notificacoes-historico'],
    queryFn: () => api.get('/admin/notificacoes/historico').then((r) => r.data as any[]),
  });

  const enviar = useMutation({
    mutationFn: () => {
      const payload: any = {
        titulo,
        corpo: mensagem,
        destinatario,
        destinatario_id:
          destinatario === 'distribuidor' ? distribuidorId
          : destinatario === 'vendedor' ? vendedorId
          : undefined,
      };
      return api.post('/admin/notificacoes/enviar', payload);
    },
    onSuccess: () => {
      Alert.alert('Sucesso', 'Notificação enviada!');
      setTitulo('');
      setMensagem('');
      setDestinatario('todos');
      setDistribuidorId('');
      setVendedorId('');
      setVendedorNome('');
      setVendedorSearch('');
      refetchHistorico();
    },
    onError: (e: any) => Alert.alert('Erro', e?.response?.data?.message ?? 'Falha ao enviar'),
  });

  function handleEnviar() {
    if (!titulo.trim()) { Alert.alert('Atenção', 'Preencha o título.'); return; }
    if (!mensagem.trim()) { Alert.alert('Atenção', 'Preencha a mensagem.'); return; }
    if (destinatario === 'distribuidor' && !distribuidorId) { Alert.alert('Atenção', 'Selecione um distribuidor.'); return; }
    if (destinatario === 'vendedor' && !vendedorId) { Alert.alert('Atenção', 'Selecione um vendedor.'); return; }

    const para = destinatario === 'todos'
      ? 'Todos os vendedores'
      : destinatario === 'distribuidor'
      ? `Distribuidor selecionado`
      : `${vendedorNome}`;

    Alert.alert('Confirmar envio', `Enviar para: ${para}?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Enviar', onPress: () => enviar.mutate() },
    ]);
  }

  const DEST_OPTIONS: { key: Destinatario; label: string }[] = [
    { key: 'todos', label: 'Todos os vendedores' },
    { key: 'distribuidor', label: 'Por distribuidor' },
    { key: 'vendedor', label: 'Vendedor específico' },
  ];

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Enviar notificações</Text>

      {/* Preview */}
      {(titulo || mensagem) ? (
        <View style={styles.preview}>
          <Text style={styles.previewApp}>World Film · Prêmios</Text>
          <Text style={styles.previewTitulo}>{titulo || 'Título da notificação'}</Text>
          <Text style={styles.previewMensagem}>{mensagem || 'Mensagem da notificação...'}</Text>
        </View>
      ) : null}

      {/* Form */}
      <View style={styles.form}>
        <Text style={styles.label}>Título</Text>
        <TextInput
          style={styles.input}
          value={titulo}
          onChangeText={(t) => setTitulo(t.slice(0, 100))}
          placeholder="Título da notificação"
          placeholderTextColor={colors.textMuted}
          maxLength={100}
        />
        <Text style={styles.counter}>{titulo.length}/100</Text>

        <Text style={styles.label}>Mensagem</Text>
        <TextInput
          style={[styles.input, { minHeight: 80, textAlignVertical: 'top' }]}
          value={mensagem}
          onChangeText={(t) => setMensagem(t.slice(0, 500))}
          placeholder="Corpo da notificação..."
          placeholderTextColor={colors.textMuted}
          multiline
          maxLength={500}
        />
        <Text style={styles.counter}>{mensagem.length}/500</Text>

        {/* Destinatário */}
        <Text style={styles.label}>Destinatário</Text>
        {DEST_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.key}
            style={styles.radioRow}
            onPress={() => { setDestinatario(opt.key); setDistribuidorId(''); setVendedorId(''); setVendedorNome(''); }}
          >
            <View style={[styles.radio, destinatario === opt.key && styles.radioSelected]} />
            <Text style={styles.radioLabel}>{opt.label}</Text>
          </TouchableOpacity>
        ))}

        {/* Distribuidor picker */}
        {destinatario === 'distribuidor' && (
          <View style={styles.subPicker}>
            <Text style={styles.label}>Selecionar distribuidor</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxHeight: 36 }}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {(distribuidores ?? []).map((d: any) => (
                  <TouchableOpacity
                    key={d.id}
                    onPress={() => setDistribuidorId(d.id)}
                    style={[styles.chip, distribuidorId === d.id && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, distribuidorId === d.id && styles.chipTextActive]}>{d.razao_social}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* Vendedor search */}
        {destinatario === 'vendedor' && (
          <View style={styles.subPicker}>
            <Text style={styles.label}>Buscar vendedor</Text>
            <TextInput
              style={styles.input}
              value={vendedorSearch}
              onChangeText={(t) => { setVendedorSearch(t); setVendedorId(''); setVendedorNome(''); }}
              placeholder="Nome ou CPF..."
              placeholderTextColor={colors.textMuted}
            />
            {vendedorId ? (
              <Text style={styles.selectedVendedor}>✓ {vendedorNome}</Text>
            ) : (
              (vendedoresData ?? []).map((v: any) => (
                <TouchableOpacity
                  key={v.id}
                  style={styles.vendedorOption}
                  onPress={() => { setVendedorId(v.id); setVendedorNome(`${v.nome} ${v.sobrenome ?? ''}`); setVendedorSearch(''); }}
                >
                  <Text style={styles.vendedorOptionText}>{v.nome} {v.sobrenome ?? ''} — {v.cpf}</Text>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        <TouchableOpacity
          style={[styles.enviarBtn, enviar.isPending && { opacity: 0.6 }]}
          onPress={handleEnviar}
          disabled={enviar.isPending}
        >
          {enviar.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.enviarBtnText}>Enviar notificação</Text>}
        </TouchableOpacity>
      </View>

      {/* Histórico */}
      <View style={styles.divider} />
      <Text style={styles.sectionTitle}>Histórico de envios</Text>
      {(historico ?? []).slice(0, 10).map((n: any) => (
        <View key={n.id} style={styles.historicoItem}>
          <Text style={styles.historicoTitulo}>{n.titulo}</Text>
          <Text style={styles.historicoCorpo}>{n.corpo}</Text>
          <Text style={styles.historicoData}>{n.created_at ? fmtDate(n.created_at) : ''}</Text>
        </View>
      ))}
      {!historico || historico.length === 0 ? (
        <Text style={styles.empty}>Nenhum envio registrado</Text>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.black },
  content: { padding: spacing.md, paddingTop: spacing.xl + spacing.md, paddingBottom: spacing.xl },
  title: { color: colors.textPrimary, fontSize: typography.lg, fontWeight: '700', marginBottom: spacing.md },
  preview: {
    backgroundColor: '#1C1C1E',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  previewApp: { color: colors.textMuted, fontSize: typography.xs, marginBottom: 4 },
  previewTitulo: { color: colors.textPrimary, fontSize: typography.sm, fontWeight: '700' },
  previewMensagem: { color: colors.textSecondary, fontSize: typography.xs, marginTop: 2 },
  form: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 4,
    marginBottom: spacing.md,
  },
  label: { color: colors.textSecondary, fontSize: typography.xs, fontWeight: '600', marginTop: spacing.sm, marginBottom: 2 },
  input: {
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.textPrimary,
    padding: spacing.sm,
    fontSize: typography.sm,
  },
  counter: { color: colors.textMuted, fontSize: typography.xs, textAlign: 'right' },
  radioRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  radio: {
    width: 18,
    height: 18,
    borderWidth: 2,
    borderColor: colors.border,
  },
  radioSelected: { borderColor: colors.red, backgroundColor: colors.red },
  radioLabel: { color: colors.textPrimary, fontSize: typography.sm },
  subPicker: { gap: 6, marginTop: 4 },
  chip: {
    paddingHorizontal: spacing.sm, paddingVertical: 4,
    borderRadius: radius.sm, backgroundColor: colors.bg,
    borderWidth: 1, borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.red, borderColor: colors.red },
  chipText: { color: colors.textSecondary, fontSize: typography.xs, whiteSpace: 'nowrap' } as any,
  chipTextActive: { color: '#fff' },
  vendedorOption: {
    backgroundColor: colors.bg, borderRadius: radius.sm,
    borderWidth: 1, borderColor: colors.border,
    padding: spacing.sm, marginTop: 4,
  },
  vendedorOptionText: { color: colors.textPrimary, fontSize: typography.xs },
  selectedVendedor: { color: colors.success, fontSize: typography.sm, fontWeight: '600' },
  enviarBtn: {
    backgroundColor: colors.red, borderRadius: radius.md,
    paddingVertical: spacing.sm + 2, alignItems: 'center',
    marginTop: spacing.sm,
  },
  enviarBtnText: { color: '#fff', fontWeight: '700', fontSize: typography.sm },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.md },
  sectionTitle: { color: colors.textSecondary, fontSize: typography.sm, fontWeight: '600', marginBottom: spacing.sm },
  historicoItem: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: 8,
  },
  historicoTitulo: { color: colors.textPrimary, fontSize: typography.sm, fontWeight: '600' },
  historicoCorpo: { color: colors.textMuted, fontSize: typography.xs, marginTop: 2 },
  historicoData: { color: colors.textMuted, fontSize: typography.xs, marginTop: 4 },
  empty: { color: colors.textMuted, fontSize: typography.sm, textAlign: 'center', paddingVertical: spacing.md },
});
