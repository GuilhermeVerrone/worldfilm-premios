import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { authService } from '../../services/auth.service';
import { useAuthStore } from '../../store/authStore';
import { colors, spacing, typography, radius } from '../../theme';
import type { AuthNavigationProp } from '../../navigation/types';

function formatCpf(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

export default function LoginScreen() {
  const navigation = useNavigation<AuthNavigationProp>();
  const { setAuth, setAdminAuth } = useAuthStore();

  const [isAdmin, setIsAdmin] = useState(false);
  const [cpf, setCpf] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setLoading(true);
    try {
      if (isAdmin) {
        if (!email.trim() || !senha) {
          Alert.alert('Campos obrigatórios', 'Preencha e-mail e senha.');
          return;
        }
        const data = await authService.adminLogin(email.trim(), senha);
        setAdminAuth(data.admin, data.token, data.refreshToken);
      } else {
        const cpfClean = cpf.replace(/\D/g, '');
        if (cpfClean.length !== 11) {
          Alert.alert('CPF inválido', 'Digite um CPF completo.');
          return;
        }
        const data = await authService.login(cpfClean, senha);
        setAuth(data.vendedor, data.token, data.refreshToken);
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Verifique suas credenciais e tente novamente.';
      Alert.alert('Erro ao entrar', msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>W</Text>
          </View>
          <Text style={styles.brand}>World Film</Text>
          <Text style={styles.tagline}>Programa de Prêmios</Text>
        </View>

        {/* Admin toggle */}
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Acesso admin</Text>
          <Switch
            value={isAdmin}
            onValueChange={(v) => { setIsAdmin(v); setSenha(''); }}
            trackColor={{ false: colors.border, true: colors.red }}
            thumbColor={colors.textPrimary}
          />
        </View>

        {/* Form */}
        <View style={styles.form}>
          {isAdmin ? (
            <Input
              label="E-mail"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="admin@worldfilm.com"
              returnKeyType="next"
            />
          ) : (
            <Input
              label="CPF"
              value={cpf}
              onChangeText={(t) => setCpf(formatCpf(t))}
              keyboardType="numeric"
              placeholder="000.000.000-00"
              maxLength={14}
              returnKeyType="next"
            />
          )}

          <Input
            label="Senha"
            value={senha}
            onChangeText={setSenha}
            secureToggle
            placeholder="••••••••"
            returnKeyType="done"
            onSubmitEditing={handleLogin}
          />

          <Button
            title="Entrar"
            onPress={handleLogin}
            loading={loading}
            fullWidth
            size="lg"
            style={styles.loginBtn}
          />

          {!isAdmin && (
            <Button
              title="Esqueci minha senha"
              variant="ghost"
              onPress={() => navigation.navigate('RecuperarSenha')}
              fullWidth
            />
          )}
        </View>

        {/* Register — only for vendedor */}
        {!isAdmin && (
          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>Ainda não tem conta? </Text>
            <Button
              title="Cadastrar-se"
              variant="outline"
              onPress={() => navigation.navigate('CadastroStep1')}
              size="sm"
            />
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.black },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  logoContainer: { alignItems: 'center', marginBottom: spacing.xl },
  logo: {
    width: 72,
    height: 72,
    backgroundColor: colors.red,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  logoText: { color: '#fff', fontSize: 32, fontWeight: '800' },
  brand: { color: colors.textPrimary, fontSize: typography.xl, fontWeight: '700' },
  tagline: { color: colors.textMuted, fontSize: typography.sm, marginTop: 4 },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: spacing.sm,
    gap: 8,
  },
  toggleLabel: { color: colors.textSecondary, fontSize: typography.sm },
  form: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  loginBtn: { marginTop: 8 },
  registerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
    gap: 8,
  },
  registerText: { color: colors.textSecondary, fontSize: typography.sm },
});
