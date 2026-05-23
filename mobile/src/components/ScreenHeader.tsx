import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, typography } from '../theme';

interface ScreenHeaderProps {
  title: string;
  showBack?: boolean;
  rightAction?: { label: string; onPress: () => void };
}

export function ScreenHeader({ title, showBack, rightAction }: ScreenHeaderProps) {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      {showBack ? (
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.placeholder} />
      )}
      <Text style={styles.title} numberOfLines={1}>{title}</Text>
      {rightAction ? (
        <TouchableOpacity onPress={rightAction.onPress} style={styles.rightBtn} activeOpacity={0.7}>
          <Text style={styles.rightText}>{rightAction.label}</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.placeholder} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    backgroundColor: colors.black,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: { padding: 4, width: 44 },
  backIcon: { fontSize: 20, color: colors.textPrimary },
  placeholder: { width: 44 },
  title: {
    flex: 1,
    textAlign: 'center',
    color: colors.textPrimary,
    fontSize: typography.sm,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  rightBtn: { alignItems: 'flex-end', width: 60 },
  rightText: { color: colors.red, fontSize: typography.sm, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
});
