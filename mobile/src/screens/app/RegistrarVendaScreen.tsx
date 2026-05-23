import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { campanhaService } from '../../services/campanha.service';
import { vendaService } from '../../services/venda.service';
import { Card } from '../../components/Card';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { ScreenHeader } from '../../components/ScreenHeader';
import { colors, spacing, typography, radius } from '../../theme';

function formatBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function calcPremio(metragem: number, corte: number, valor: number): number {
  return Math.floor(metragem / corte) * valor;
}

function ProgressBar({ step }: { step: number }) {
  return (
    <View style={styles.progressBar}>
      {[1, 2, 3, 4].map((s) => (
        <View key={s} style={styles.progressRow}>
          <View style={[styles.progressDot, s <= step ? styles.progressDotActive : null]}>
            <Text style={[styles.progressNum, s <= step ? styles.progressNumActive : null]}>{s}</Text>
          </View>
          {s < 4 && <View style={[styles.progressLine, s < step ? styles.progressLineActive : null]} />}
        </View>
      ))}
    </View>
  );
}

export default function RegistrarVendaScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState(1);
  const [campanhas, setCampanhas] = useState<any[]>([]);
  const [loadingCampanhas, setLoadingCampanhas] = useState(true);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [campanhaId, setCampanhaId] = useState('');
  const [produtoId, setProdutoId] = useState('');
  const [metragem, setMetragem] = useState('');
  const [nomeCliente, setNomeCliente] = useState('');
  const [cpfCliente, setCpfCliente] = useState('');
  const [placa, setPlaca] = useState('');
  const [observacao, setObservacao] = useState('');

  useEffect(() => {
    campanhaService.list({ limit: 50 })
      .then((data) => setCampanhas((data.data ?? []).filter((c: any) => c.status === 'ativa')))
      .finally(() => setLoadingCampanhas(false));
  }, []);

  const campanhaSelecionada = campanhas.find((c) => c.id === campanhaId);
  const produtoSelecionado = (campanhaSelecionada?.premios ?? []).find((p: any) => p.produto_id === produtoId);
  const premioEstimado = produtoSelecionado && metragem
    ? calcPremio(Number(metragem), produtoSelecionado.metragem_corte, produtoSelecionado.valor_premio)
    : 0;

  async function handleSubmit() {
    setLoading(true);
    try {
      await vendaService.create({
        campanha_id: campanhaId,
        produto_id: produtoId,
        metragem: Number(metragem),
        nome_cliente: nomeCliente || undefined,
        cpf_cnpj_cliente: cpfCliente || undefined,
        placa_veiculo: placa || undefined,
        observacao: observacao || undefined,
      });
      setSuccess(true);
    } catch (err: any) {
      Alert.alert('Erro', err?.response?.data?.message ?? 'Não foi possível registrar a venda.');
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setStep(1);
    setCampanhaId('');
    setProdutoId('');
    setMetragem('');
    setNomeCliente('');
    setCpfCliente('');
    setPlaca('');
    setObservacao('');
    setSuccess(false);
  }

  if (success) {
    return (
      <View style={[styles.successContainer, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <Text style={styles.successIcon}>🎉</Text>
        <Text style={styles.successTitle}>Venda registrada!</Text>
        <Text style={styles.successMsg}>
          Sua venda foi enviada para validação.{'\n'}
          Prêmio estimado: <Text style={{ color: colors.success, fontWeight: '700' }}>{formatBRL(premioEstimado)}</Text>{'\n\n'}
          Será confirmado em até 3 dias úteis.
        </Text>
        <Button title="Registrar outra venda" onPress={reset} fullWidth size="lg" style={styles.successBtn} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ScreenHeader
          title="Registrar Venda"
          showBack={step > 1}
        />
        <ProgressBar step={step} />

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {/* Etapa 1 — Campanha */}
          {step === 1 && (
            <>
              <Text style={styles.stepTitle}>Selecione a campanha</Text>
              {loadingCampanhas ? (
                <ActivityIndicator color={colors.red} style={{ marginTop: 40 }} />
              ) : campanhas.length === 0 ? (
                <Text style={styles.emptyText}>Nenhuma campanha ativa no momento.</Text>
              ) : (
                campanhas.map((c) => (
                  <TouchableOpacity
                    key={c.id}
                    onPress={() => { setCampanhaId(c.id); setStep(2); }}
                    activeOpacity={0.8}
                  >
                    <Card style={[styles.optionCard, campanhaId === c.id && styles.optionCardSelected]}>
                      <Text style={styles.optionTitle}>{c.nome}</Text>
                      <Text style={styles.optionMeta}>
                        Até {new Date(c.data_fim).toLocaleDateString('pt-BR')}
                      </Text>
                    </Card>
                  </TouchableOpacity>
                ))
              )}
            </>
          )}

          {/* Etapa 2 — Produto e metragem */}
          {step === 2 && (
            <>
              <Text style={styles.stepTitle}>Produto e metragem</Text>
              {(campanhaSelecionada?.premios ?? []).map((p: any) => (
                <TouchableOpacity
                  key={p.produto_id}
                  onPress={() => setProdutoId(p.produto_id)}
                  activeOpacity={0.8}
                >
                  <Card style={[styles.optionCard, produtoId === p.produto_id && styles.optionCardSelected]}>
                    <Text style={styles.optionTitle}>{p.produto_nome ?? 'Produto'}</Text>
                    <Text style={styles.optionMeta}>
                      A cada {p.metragem_corte}m → {formatBRL(p.valor_premio)}
                    </Text>
                  </Card>
                </TouchableOpacity>
              ))}
              {produtoId && (
                <View style={styles.metragensec}>
                  <Input
                    label="Metragem *"
                    value={metragem}
                    onChangeText={setMetragem}
                    keyboardType="numeric"
                    placeholder="Ex: 120"
                  />
                  {Number(metragem) > 0 && (
                    <View style={styles.premioPreview}>
                      <Text style={styles.premioPreviewLabel}>Prêmio estimado</Text>
                      <Text style={styles.premioPreviewValue}>{formatBRL(premioEstimado)}</Text>
                    </View>
                  )}
                </View>
              )}
              <Button
                title="Próximo →"
                onPress={() => {
                  if (!produtoId) return Alert.alert('Selecione um produto');
                  if (!metragem || Number(metragem) <= 0) return Alert.alert('Informe a metragem');
                  setStep(3);
                }}
                fullWidth
                size="lg"
                style={{ marginTop: spacing.lg }}
              />
            </>
          )}

          {/* Etapa 3 — Dados do cliente */}
          {step === 3 && (
            <>
              <Text style={styles.stepTitle}>Dados do cliente</Text>
              <Text style={styles.stepSub}>Todos os campos são opcionais</Text>
              <Input label="Nome do cliente" value={nomeCliente} onChangeText={setNomeCliente} placeholder="Nome completo" />
              <Input label="CPF/CNPJ" value={cpfCliente} onChangeText={setCpfCliente} keyboardType="numeric" placeholder="000.000.000-00" />
              <Input label="Placa do veículo" value={placa} onChangeText={setPlaca} placeholder="ABC-1234 ou ABC1D23" autoCapitalize="characters" maxLength={8} />
              <Input label="Observação" value={observacao} onChangeText={setObservacao} placeholder="Observações adicionais..." />
              <Button title="Próximo →" onPress={() => setStep(4)} fullWidth size="lg" style={{ marginTop: spacing.sm }} />
            </>
          )}

          {/* Etapa 4 — Confirmação */}
          {step === 4 && (
            <>
              <Text style={styles.stepTitle}>Confirme a venda</Text>
              <Card style={styles.summaryCard}>
                <Row label="Campanha" value={campanhaSelecionada?.nome} />
                <Row label="Produto" value={produtoSelecionado?.produto_nome ?? '—'} />
                <Row label="Metragem" value={`${metragem}m`} />
                {nomeCliente ? <Row label="Cliente" value={nomeCliente} /> : null}
                {placa ? <Row label="Placa" value={placa} /> : null}
                <View style={styles.premioFinal}>
                  <Text style={styles.premioFinalLabel}>Prêmio estimado</Text>
                  <Text style={styles.premioFinalValue}>{formatBRL(premioEstimado)}</Text>
                </View>
              </Card>
              <Text style={styles.aviso}>* O prêmio será confirmado em até 3 dias úteis.</Text>
              <Button title="Confirmar venda" onPress={handleSubmit} loading={loading} fullWidth size="lg" style={{ marginTop: spacing.sm }} />
            </>
          )}
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value ?? '—'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.black },
  container: { flex: 1, backgroundColor: colors.black },
  progressBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  progressRow: { flexDirection: 'row', alignItems: 'center' },
  progressDot: {
    width: 30, height: 30,
    borderWidth: 2, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.card,
  },
  progressDotActive: { backgroundColor: colors.red, borderColor: colors.red },
  progressNum: { color: colors.textMuted, fontSize: typography.sm, fontWeight: '700' },
  progressNumActive: { color: '#fff' },
  progressLine: { width: 36, height: 2, backgroundColor: colors.border, marginHorizontal: 2 },
  progressLineActive: { backgroundColor: colors.red },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  stepTitle: { color: colors.textPrimary, fontSize: typography.lg, fontWeight: '700', marginBottom: 6 },
  stepSub: { color: colors.textMuted, fontSize: typography.sm, marginBottom: spacing.md },
  optionCard: { marginBottom: spacing.sm },
  optionCardSelected: { borderColor: colors.red, backgroundColor: '#1A0000' },
  optionTitle: { color: colors.textPrimary, fontSize: typography.base, fontWeight: '600' },
  optionMeta: { color: colors.textMuted, fontSize: typography.sm, marginTop: 2 },
  metragensec: { marginTop: spacing.sm },
  premioPreview: {
    backgroundColor: '#052e16',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#166534',
    padding: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  premioPreviewLabel: { color: colors.textSecondary, fontSize: typography.sm },
  premioPreviewValue: { color: colors.success, fontSize: typography.lg, fontWeight: '700' },
  summaryCard: { marginBottom: spacing.sm },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  summaryLabel: { color: colors.textMuted, fontSize: typography.sm },
  summaryValue: { color: colors.textPrimary, fontSize: typography.sm, fontWeight: '500' },
  premioFinal: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: spacing.sm, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border,
  },
  premioFinalLabel: { color: colors.textSecondary, fontSize: typography.base },
  premioFinalValue: { color: colors.success, fontSize: typography.xl, fontWeight: '700' },
  aviso: { color: colors.textMuted, fontSize: typography.xs, textAlign: 'center', marginBottom: spacing.sm },
  emptyText: { color: colors.textMuted, textAlign: 'center', padding: spacing.xl },
  successContainer: {
    flex: 1, backgroundColor: colors.black, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl,
  },
  successIcon: { fontSize: 72, marginBottom: spacing.lg },
  successTitle: { color: colors.textPrimary, fontSize: typography.xl, fontWeight: '700', marginBottom: spacing.md },
  successMsg: { color: colors.textSecondary, fontSize: typography.base, textAlign: 'center', lineHeight: 24, marginBottom: spacing.xl },
  successBtn: {},
});
