import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { authService } from '../../services/auth.service';
import { colors, spacing, typography, radius } from '../../theme';
import type { AuthNavigationProp } from '../../navigation/types';

function formatPhone(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 10) return d.replace(/(\d{2})(\d{4})(\d)/, '($1) $2-$3');
  return d.replace(/(\d{2})(\d{5})(\d)/, '($1) $2-$3');
}

export default function RecuperarSenhaScreen() {
  const navigation = useNavigation<AuthNavigationProp>();
  const [whatsapp, setWhatsapp] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleEnviar() {
    const num = whatsapp.replace(/\D/g, '');
    if (num.length < 10) {
      Alert.alert('Número inválido', 'Digite o WhatsApp completo com DDD.');
      return;
    }
    setLoading(true);
    try {
      await authService.recuperar(num);
      navigation.navigate('VerificarOtp', { whatsapp: num });
    } catch (err: any) {
      Alert.alert('Erro', err?.response?.data?.message ?? 'Não foi possível enviar o código.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Text style={styles.backText}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Recuperar Senha</Text>
        <Text style={styles.subtitle}>
          Digite seu WhatsApp cadastrado. Vamos enviar um código de verificação.
        </Text>
        <View style={styles.form}>
          <Input
            label="WhatsApp *"
            value={whatsapp}
            onChangeText={(t) => setWhatsapp(formatPhone(t))}
            keyboardType="phone-pad"
            placeholder="(00) 00000-0000"
            maxLength={15}
          />
          <Button title="Enviar código" onPress={handleEnviar} loading={loading} fullWidth size="lg" style={{ marginTop: 8 }} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.black },
  container: { flexGrow: 1, paddingHorizontal: spacing.lg, paddingVertical: spacing.xl },
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
