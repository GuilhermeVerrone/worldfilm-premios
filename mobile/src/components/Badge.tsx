import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography } from '../theme';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'gray' | 'default';

const variantStyles: Record<BadgeVariant, { bg: string; text: string; border: string }> = {
  success: { bg: colors.successBg, text: colors.success, border: '#4a7a00' },
  warning: { bg: colors.warningBg, text: colors.warning, border: '#7a6000' },
  danger: { bg: colors.dangerBg, text: colors.danger, border: '#7a0000' },
  info: { bg: colors.infoBg, text: colors.info, border: '#006080' },
  gray: { bg: colors.card, text: colors.textMuted, border: colors.border },
  default: { bg: colors.card, text: colors.textSecondary, border: colors.border },
};

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
}

export function Badge({ label, variant = 'default' }: BadgeProps) {
  const s = variantStyles[variant];
  return (
    <View style={[styles.badge, { backgroundColor: s.bg, borderColor: s.border }]}>
      <Text style={[styles.text, { color: s.text }]}>{label}</Text>
    </View>
  );
}

export function statusToBadge(status: string): BadgeVariant {
  const map: Record<string, BadgeVariant> = {
    aprovado: 'success',
    ativa: 'success',
    pago: 'success',
    disponivel: 'success',
    pendente: 'warning',
    solicitado: 'warning',
    bloqueado: 'info',
    em_processamento: 'info',
    reprovado: 'danger',
    inativo: 'danger',
    rascunho: 'gray',
    encerrada: 'gray',
    arquivada: 'gray',
    revisao: 'warning',
  };
  return map[status] ?? 'default';
}

const styles = StyleSheet.create({
  badge: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: typography.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
