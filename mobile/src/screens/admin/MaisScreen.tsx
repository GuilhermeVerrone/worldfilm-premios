import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../store/authStore';
import { colors, spacing, typography, radius } from '../../theme';

function MenuItem({ label, emoji, onPress }: { label: string; emoji: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <Text style={styles.menuEmoji}>{emoji}</Text>
      <Text style={styles.menuLabel}>{label}</Text>
      <Text style={styles.menuArrow}>›</Text>
    </TouchableOpacity>
  );
}

export default function AdminMaisScreen() {
  const navigation = useNavigation<any>();
  const { logout, admin } = useAuthStore();

  function handleLogout() {
    Alert.alert('Sair', 'Deseja sair do painel admin?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: logout },
    ]);
  }

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Mais</Text>

      {admin?.nome && (
        <View style={styles.adminCard}>
          <Text style={styles.adminLabel}>Logado como</Text>
          <Text style={styles.adminNome}>{admin.nome}</Text>
          <Text style={styles.adminEmail}>{admin.email}</Text>
        </View>
      )}

      <View style={styles.menu}>
        <MenuItem
          label="Campanhas"
          emoji="📢"
          onPress={() => navigation.navigate('CampanhasList')}
        />
        <MenuItem
          label="Distribuidores"
          emoji="🏢"
          onPress={() => navigation.navigate('DistribuidoresList')}
        />
        <MenuItem
          label="Enviar notificações"
          emoji="🔔"
          onPress={() => navigation.navigate('Notificacoes')}
        />
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Sair</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.black, paddingTop: spacing.xl + spacing.md, padding: spacing.md },
  title: { color: colors.textPrimary, fontSize: typography.lg, fontWeight: '700', marginBottom: spacing.md },
  adminCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  adminLabel: { color: colors.textMuted, fontSize: typography.xs, marginBottom: 2 },
  adminNome: { color: colors.textPrimary, fontSize: typography.base, fontWeight: '700' },
  adminEmail: { color: colors.textSecondary, fontSize: typography.sm, marginTop: 2 },
  menu: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.md,
  },
  menuEmoji: { fontSize: 20 },
  menuLabel: { flex: 1, color: colors.textPrimary, fontSize: typography.base },
  menuArrow: { color: colors.textMuted, fontSize: typography.lg },
  logoutBtn: {
    borderWidth: 1,
    borderColor: colors.red,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: 'center',
  },
  logoutText: { color: colors.red, fontSize: typography.base, fontWeight: '700' },
});
