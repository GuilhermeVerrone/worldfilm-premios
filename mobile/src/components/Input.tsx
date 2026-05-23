import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  TextInputProps,
} from 'react-native';
import { colors, typography, spacing } from '../theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  secureToggle?: boolean;
}

export function Input({ label, error, secureToggle, style, ...props }: InputProps) {
  const [hidden, setHidden] = useState(!!props.secureTextEntry);

  return (
    <View style={styles.wrapper}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputContainer, error ? styles.inputError : null]}>
        <TextInput
          style={[styles.input, style as any]}
          placeholderTextColor={colors.textMuted}
          selectionColor={colors.red}
          secureTextEntry={secureToggle ? hidden : props.secureTextEntry}
          {...props}
        />
        {secureToggle && (
          <TouchableOpacity onPress={() => setHidden((h) => !h)} style={styles.eyeBtn}>
            <Text style={styles.eyeText}>{hidden ? '👁' : '🙈'}</Text>
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: spacing.sm },
  label: {
    color: colors.textMuted,
    fontSize: typography.xs,
    marginBottom: 6,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputError: { borderColor: colors.danger },
  input: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: typography.base,
    paddingVertical: 13,
    paddingHorizontal: 14,
  },
  eyeBtn: { paddingHorizontal: 12 },
  eyeText: { fontSize: 16 },
  error: {
    color: colors.danger,
    fontSize: typography.xs,
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
