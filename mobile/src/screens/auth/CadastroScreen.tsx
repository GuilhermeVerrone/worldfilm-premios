import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { authService } from '../../services/auth.service';
import { distribuidorService } from '../../services/distribuidor.service';
import { colors, spacing, typography, radius } from '../../theme';
import type { AuthNavigationProp } from '../../navigation/types';

function formatCpf(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 11);
  return d.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}
function formatPhone(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 10) return d.replace(/(\d{2})(\d{4})(\d)/, '($1) $2-$3');
  return d.replace(/(\d{2})(\d{5})(\d)/, '($1) $2-$3');
}

interface FormData {
  nome: string;
  sobrenome: string;
  cpf: string;
  cnpj: string;
  whatsapp: string;
  email: string;
  senha: string;
  confirmarSenha: string;
  distribuidor_id: string;
  distribuidor_nome: string;
  chave_pix: string;
  termos: boolean;
}

function ProgressBar({ step }: { step: number }) {
  return (
    <View style={styles.progressContainer}>
      {[1, 2, 3].map((s) => (
        <View key={s} style={[styles.progressStep, s <= step ? styles.progressActive : styles.progressInactive]}>
          <Text style={[styles.progressText, s <= step ? styles.progressTextActive : styles.progressTextInactive]}>{s}</Text>
        </View>
      ))}
    </View>
  );
}

export default function CadastroScreen() {
  const navigation = useNavigation<AuthNavigationProp>();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [distribuidores, setDistribuidores] = useState<any[]>([]);
  const [loadingDist, setLoadingDist] = useState(false);

  const [form, setForm] = useState<FormData>({
    nome: '', sobrenome: '', cpf: '', cnpj: '', whatsapp: '',
    email: '', senha: '', confirmarSenha: '',
    distribuidor_id: '', distribuidor_nome: '', chave_pix: '', termos: false,
  });

  function update(field: keyof FormData, val: string | boolean) {
    setForm((f) => ({ ...f, [field]: val }));
  }

  async function loadDistribuidores() {
    setLoadingDist(true);
    try {
      const data = await distribuidorService.list();
      setDistribuidores(data.data ?? []);
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar os distribuidores.');
    } finally {
      setLoadingDist(false);
    }
  }

  function goNext() {
    if (step === 1) {
      if (!form.nome || !form.cpf || !form.whatsapp) {
        Alert.alert('Campos obrigatórios', 'Preencha nome, CPF e WhatsApp.');
        return;
      }
      if (form.cpf.replace(/\D/g, '').length !== 11) {
        Alert.alert('CPF inválido', 'Digite um CPF completo.');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!form.senha) {
        Alert.alert('Campos obrigatórios', 'Defina uma senha.');
        return;
      }
      if (form.senha.length < 6) {
        Alert.alert('Senha fraca', 'A senha deve ter pelo menos 6 caracteres.');
        return;
      }
      if (form.senha !== form.confirmarSenha) {
        Alert.alert('Senhas não conferem', 'As senhas digitadas são diferentes.');
        return;
      }
      loadDistribuidores();
      setStep(3);
    }
  }

  async function handleSubmit() {
    if (!form.distribuidor_id) {
      Alert.alert('Selecione um distribuidor', 'Escolha o seu distribuidor na lista.');
      return;
    }
    if (!form.termos) {
      Alert.alert('Termos de uso', 'Você precisa aceitar os termos para continuar.');
      return;
    }
    setLoading(true);
    try {
      await authService.register({
        nome: form.nome,
        sobrenome: form.sobrenome || undefined,
        cpf: form.cpf.replace(/\D/g, ''),
        cnpj: form.cnpj ? form.cnpj.replace(/\D/g, '') : undefined,
        whatsapp: form.whatsapp.replace(/\D/g, ''),
        email: form.email || undefined,
        senha: form.senha,
        distribuidor_id: form.distribuidor_id,
        chave_pix: form.chave_pix || undefined,
      });
      navigation.navigate('CadastroPendente');
    } catch (err: any) {
      Alert.alert('Erro no cadastro', err?.response?.data?.message ?? 'Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <TouchableOpacity onPress={() => step === 1 ? navigation.goBack() : setStep((s) => s - 1)}>
            <Text style={styles.backText}>← Voltar</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Cadastro</Text>
          <View style={{ width: 60 }} />
        </View>

        <ProgressBar step={step} />

        <View style={styles.form}>
          {step === 1 && (
            <>
              <Text style={styles.stepTitle}>Dados pessoais</Text>
              <Input label="Nome *" value={form.nome} onChangeText={(t) => update('nome', t)} placeholder="Seu nome" />
              <Input label="Sobrenome" value={form.sobrenome} onChangeText={(t) => update('sobrenome', t)} placeholder="Opcional" />
              <Input
                label="CPF *"
                value={form.cpf}
                onChangeText={(t) => update('cpf', formatCpf(t))}
                keyboardType="numeric"
                placeholder="000.000.000-00"
                maxLength={14}
              />
              <Input label="CNPJ (opcional)" value={form.cnpj} onChangeText={(t) => update('cnpj', t)} keyboardType="numeric" placeholder="00.000.000/0000-00" />
              <Input
                label="WhatsApp *"
                value={form.whatsapp}
                onChangeText={(t) => update('whatsapp', formatPhone(t))}
                keyboardType="phone-pad"
                placeholder="(00) 00000-0000"
                maxLength={15}
              />
              <Button title="Próximo →" onPress={goNext} fullWidth size="lg" style={{ marginTop: 8 }} />
            </>
          )}

          {step === 2 && (
            <>
              <Text style={styles.stepTitle}>Dados de acesso</Text>
              <Input label="E-mail (opcional)" value={form.email} onChangeText={(t) => update('email', t)} keyboardType="email-address" placeholder="seu@email.com" autoCapitalize="none" />
              <Input label="Senha *" value={form.senha} onChangeText={(t) => update('senha', t)} secureToggle placeholder="Mínimo 6 caracteres" />
              <Input label="Confirmar senha *" value={form.confirmarSenha} onChangeText={(t) => update('confirmarSenha', t)} secureToggle placeholder="Repita a senha" />
              <Button title="Próximo →" onPress={goNext} fullWidth size="lg" style={{ marginTop: 8 }} />
            </>
          )}

          {step === 3 && (
            <>
              <Text style={styles.stepTitle}>Vinculação</Text>
              {loadingDist ? (
                <Text style={styles.loadingText}>Carregando distribuidores...</Text>
              ) : (
                <>
                  <Text style={styles.fieldLabel}>Distribuidor *</Text>
                  <ScrollView style={styles.distList} nestedScrollEnabled>
                    {distribuidores.map((d) => (
                      <TouchableOpacity
                        key={d.id}
                        style={[styles.distItem, form.distribuidor_id === d.id && styles.distItemSelected]}
                        onPress={() => { update('distribuidor_id', d.id); update('distribuidor_nome', d.nome); }}
                      >
                        <Text style={[styles.distName, form.distribuidor_id === d.id && styles.distNameSelected]}>{d.nome}</Text>
                        <Text style={styles.distRegiao}>{d.regiao}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </>
              )}
              <Input label="Chave PIX (opcional)" value={form.chave_pix} onChangeText={(t) => update('chave_pix', t)} placeholder="CPF, e-mail, telefone ou chave aleatória" />

              <TouchableOpacity style={styles.termsRow} onPress={() => update('termos', !form.termos)} activeOpacity={0.7}>
                <View style={[styles.checkbox, form.termos && styles.checkboxChecked]}>
                  {form.termos && <Text style={styles.checkMark}>✓</Text>}
                </View>
                <Text style={styles.termsText}>Li e aceito os termos de uso e política de privacidade</Text>
              </TouchableOpacity>

              <Button title="Enviar Cadastro" onPress={handleSubmit} loading={loading} fullWidth size="lg" style={{ marginTop: 8 }} />
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.black },
  container: { flexGrow: 1, paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  backText: { color: colors.red, fontSize: typography.base, fontWeight: '600' },
  title: { color: colors.textPrimary, fontSize: typography.md, fontWeight: '700' },
  progressContainer: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginBottom: spacing.lg },
  progressStep: {
    width: 36, height: 36,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2,
  },
  progressActive: { backgroundColor: colors.red, borderColor: colors.red },
  progressInactive: { backgroundColor: 'transparent', borderColor: colors.border },
  progressText: { fontSize: typography.sm, fontWeight: '700' },
  progressTextActive: { color: '#fff' },
  progressTextInactive: { color: colors.textMuted },
  form: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  stepTitle: { color: colors.textPrimary, fontSize: typography.md, fontWeight: '600', marginBottom: 12 },
  loadingText: { color: colors.textMuted, textAlign: 'center', padding: 20 },
  fieldLabel: { color: colors.textSecondary, fontSize: typography.sm, fontWeight: '500', marginBottom: 6 },
  distList: { maxHeight: 200, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.sm },
  distItem: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  distItemSelected: { backgroundColor: '#2A0000' },
  distName: { color: colors.textPrimary, fontSize: typography.base, fontWeight: '500' },
  distNameSelected: { color: colors.red },
  distRegiao: { color: colors.textMuted, fontSize: typography.xs, marginTop: 2 },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginVertical: spacing.sm,
  },
  checkbox: {
    width: 22, height: 22,
    borderWidth: 2, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 1, flexShrink: 0,
  },
  checkboxChecked: { backgroundColor: colors.red, borderColor: colors.red },
  checkMark: { color: '#fff', fontSize: 13, fontWeight: '700' },
  termsText: { flex: 1, color: colors.textSecondary, fontSize: typography.sm, lineHeight: 20 },
});
