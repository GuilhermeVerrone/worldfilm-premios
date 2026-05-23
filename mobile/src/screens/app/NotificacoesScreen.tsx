import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { notificacaoService } from '../../services/notificacao.service';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { ScreenHeader } from '../../components/ScreenHeader';
import { colors, spacing, typography } from '../../theme';

export default function NotificacoesScreen() {
  const insets = useSafeAreaInsets();

  const [notificacoes, setNotificacoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotificacoes = useCallback(async () => {
    try {
      const data = await notificacaoService.list({ limit: 50 });
      setNotificacoes(data.data ?? []);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  React.useEffect(() => { fetchNotificacoes(); }, [fetchNotificacoes]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotificacoes();
  };

  async function handleMarcarLida(id: string) {
    setNotificacoes((prev) => prev.map((n) => n.id === id ? { ...n, lida: true } : n));
    await notificacaoService.marcarLida(id).catch(() => {});
  }

  async function handleMarcarTodas() {
    setNotificacoes((prev) => prev.map((n) => ({ ...n, lida: true })));
    await notificacaoService.marcarTodasLidas().catch(() => {});
  }

  const naoLidas = notificacoes.filter((n) => !n.lida).length;

  function renderItem({ item: n }: { item: any }) {
    return (
      <TouchableOpacity onPress={() => !n.lida && handleMarcarLida(n.id)} activeOpacity={0.8}>
        <Card style={[styles.item, !n.lida && styles.itemUnread]}>
          <View style={styles.itemHeader}>
            <View style={styles.titleRow}>
              {!n.lida && <View style={styles.unreadDot} />}
              <Text style={[styles.titulo, !n.lida && styles.tituloUnread]} numberOfLines={1}>
                {n.titulo}
              </Text>
            </View>
            <Text style={styles.data}>{new Date(n.created_at).toLocaleDateString('pt-BR')}</Text>
          </View>
          <Text style={styles.corpo} numberOfLines={3}>{n.corpo}</Text>
        </Card>
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScreenHeader
        title="Notificações"
        showBack
        rightAction={naoLidas > 0 ? { label: 'Marcar todas', onPress: handleMarcarTodas } : undefined}
      />
      <FlatList
        data={notificacoes}
        keyExtractor={(n) => n.id}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.red} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🔔</Text>
            <Text style={styles.emptyText}>{loading ? 'Carregando...' : 'Nenhuma notificação'}</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.black },
  list: { padding: spacing.lg, paddingBottom: spacing.xl },
  item: { marginBottom: spacing.sm },
  itemUnread: { borderColor: '#3D0000', backgroundColor: '#1A0000' },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  titleRow: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 8 },
  unreadDot: { width: 8, height: 8, backgroundColor: colors.red, flexShrink: 0 },
  titulo: { color: colors.textSecondary, fontSize: typography.base, fontWeight: '500', flex: 1 },
  tituloUnread: { color: colors.textPrimary, fontWeight: '700' },
  data: { color: colors.textMuted, fontSize: typography.xs, marginLeft: 8 },
  corpo: { color: colors.textMuted, fontSize: typography.sm, lineHeight: 20 },
  empty: { alignItems: 'center', paddingVertical: spacing.xl },
  emptyIcon: { fontSize: 48, marginBottom: spacing.md },
  emptyText: { color: colors.textMuted, fontSize: typography.base },
});
