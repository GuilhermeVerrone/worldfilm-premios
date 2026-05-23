import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button } from '../../components/Button';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, typography, radius } from '../../theme';
import type { AuthNavigationProp } from '../../navigation/types';

export default function CadastroPendenteScreen() {
  const navigation = useNavigation<AuthNavigationProp>();

  return (
    <View style={styles.container}>
      <View style={styles.icon}>
        <Text style={styles.iconText}>⏳</Text>
      </View>
      <Text style={styles.title}>Cadastro enviado!</Text>
      <Text style={styles.message}>
        Seu cadastro foi recebido com sucesso.{'\n'}
        Aguarde a aprovação da equipe World Film.{'\n\n'}
        Você receberá uma notificação assim que for aprovado.
      </Text>
      <Button
        title="Voltar ao Login"
        onPress={() => navigation.navigate('Login')}
        fullWidth
        size="lg"
        style={styles.btn}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  icon: {
    width: 96,
    height: 96,
    borderRadius: 0,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  iconText: { fontSize: 48 },
  title: {
    color: colors.textPrimary,
    fontSize: typography.xl,
    fontWeight: '700',
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  message: {
    color: colors.textSecondary,
    fontSize: typography.base,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xl,
  },
  btn: { borderRadius: radius.lg },
});
