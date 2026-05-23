import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Alert, KeyboardAvoidingView, Platform, TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { authService } from '../../services/auth.service';
import { colors, spacing, typography, radius } from '../../theme';
import type { AuthNavigationProp } from '../../navigation/types';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'NovaSenha'>;

export default function NovaSenhaScreen({ route }: Props) {
  const navigation = useNavigation<AuthNavigationProp>();
  const { whatsapp, otp } = route.params;

  const [senha, setSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSalvar() {
    if (senha.length < 6) {
      Alert.alert('Senha fraca', 'Mínimo de 6 caracteres.');
      return;
    }
    if (senha !== confirmar) {
      Alert.alert('Senhas não conferem');
      return;
    }
    setLoading(true);
    try {
      await authService.resetSenha(whatsapp, otp, senha);
      Alert.alert('Senha alterada!', 'Agora faça login com a nova senha.', [
        { text: 'OK', onPress: () => navigation.navigate('Login') },
      ]);
    } catch (err: any) {
      Alert.alert('Erro', err?.response?.data?.message ?? 'Não foi possível alterar a senha.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.container}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Text style={styles.backText}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Nova Senha</Text>
        <Text style={styles.subtitle}>Escolha uma nova senha para sua conta.</Text>
        <View style={styles.form}>
          <Input label="Nova senha *" value={senha} onChangeText={setSenha} secureToggle placeholder="Mínimo 6 caracteres" />
          <Input label="Confirmar senha *" value={confirmar} onChangeText={setConfirmar} secureToggle placeholder="Repita a senha" />
          <Button title="Salvar nova senha" onPress={handleSalvar} loading={loading} fullWidth size="lg" style={{ marginTop: 8 }} />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.black },
  container: { flex: 1, paddingHorizontal: spacing.lg, paddingVertical: spacing.xl },
  back: { marginBottom: spacing.lg },
  backText: { color: colors.red, fontSize: typography.base, fontWeight: '600' },
  title: { color: colors.textPrimary, fontSize: typography.xl, fontWeight: '700', marginBottom: spacing.sm },
  subtitle: { color: colors.textSecondary, fontSize: typography.base, lineHeight: 22, marginBottom: spacing.lg },
  form: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
