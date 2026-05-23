import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors, typography } from '../theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading,
  disabled,
  style,
  textStyle,
  fullWidth,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.75}
      style={[
        styles.base,
        styles[`size_${size}`],
        styles[`variant_${variant}`],
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? '#fff' : colors.red}
          size="small"
        />
      ) : (
        <Text style={[styles.text, styles[`text_${variant}`], styles[`textSize_${size}`], textStyle]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: { width: '100%' },
  disabled: { opacity: 0.45 },

  size_sm: { paddingVertical: 8, paddingHorizontal: 14, minHeight: 36 },
  size_md: { paddingVertical: 12, paddingHorizontal: 20, minHeight: 44 },
  size_lg: { paddingVertical: 15, paddingHorizontal: 24, minHeight: 50 },

  variant_primary: { backgroundColor: colors.red },
  variant_secondary: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  variant_outline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.border },
  variant_ghost: { backgroundColor: 'transparent' },
  variant_danger: { backgroundColor: '#1a0000', borderWidth: 1, borderColor: '#7f1d1d' },

  text: { fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  text_primary: { color: '#fff' },
  text_secondary: { color: colors.textSecondary },
  text_outline: { color: colors.textSecondary },
  text_ghost: { color: colors.textMuted },
  text_danger: { color: '#f87171' },

  textSize_sm: { fontSize: typography.xs },
  textSize_md: { fontSize: typography.sm },
  textSize_lg: { fontSize: typography.sm },
});
