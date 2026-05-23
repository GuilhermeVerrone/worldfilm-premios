import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, Alert, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Button } from '../../components/Button';
import { authService } from '../../services/auth.service';
import { colors, spacing, typography, radius } from '../../theme';
import type { AuthNavigationProp } from '../../navigation/types';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'VerificarOtp'>;

export default function VerificarOtpScreen({ route }: Props) {
  const navigation = useNavigation<AuthNavigationProp>();
  const { whatsapp } = route.params;

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const inputs = useRef<(TextInput | null)[]>([]);

  function handleDigit(val: string, index: number) {
    const digit = val.replace(/\D/g, '').slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    if (digit && index < 5) inputs.current[index + 1]?.focus();
  }

  function handleKeyPress(e: any, index: number) {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  }

  async function handleVerificar() {
    const code = otp.join('');
    if (code.length !== 6) {
      Alert.alert('Código incompleto', 'Digite os 6 dígitos.');
      return;
    }
    setLoading(true);
    try {
      await authService.verificarOtp(whatsapp, code);
      navigation.navigate('NovaSenha', { whatsapp, otp: code });
    } catch (err: any) {
      Alert.alert('Código inválido', err?.response?.data?.message ?? 'Verifique o código e tente novamente.');
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
        <Text style={styles.title}>Verificar código</Text>
        <Text style={styles.subtitle}>
          Digite o código de 6 dígitos enviado para {'\n'}
          <Text style={styles.phone}>{whatsapp}</Text>
        </Text>

        <View style={styles.otpContainer}>
          {otp.map((digit, i) => (
            <TextInput
              key={i}
              ref={(r) => { inputs.current[i] = r; }}
              style={[styles.otpInput, digit ? styles.otpFilled : null]}
              value={digit}
              onChangeText={(v) => handleDigit(v, i)}
              onKeyPress={(e) => handleKeyPress(e, i)}
              keyboardType="numeric"
              maxLength={1}
              selectTextOnFocus
            />
          ))}
        </View>

        <Button title="Verificar" onPress={handleVerificar} loading={loading} fullWidth size="lg" style={styles.btn} />
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
  subtitle: { color: colors.textSecondary, fontSize: typography.base, lineHeight: 22, marginBottom: spacing.xl, textAlign: 'center' },
  phone: { color: colors.textPrimary, fontWeight: '600' },
  otpContainer: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: spacing.xl },
  otpInput: {
    width: 48, height: 56,
    borderRadius: radius.md,
    borderWidth: 2, borderColor: colors.border,
    backgroundColor: colors.card,
    textAlign: 'center',
    fontSize: typography.lg,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  otpFilled: { borderColor: colors.red },
  btn: {},
});
