import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore';
import { vendedorService } from '../../services/vendedor.service';
import { campanhaService } from '../../services/campanha.service';
import { vendaService } from '../../services/venda.service';
import { notificacaoService } from '../../services/notificacao.service';
import { Card } from '../../components/Card';
import { Badge, statusToBadge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { colors, spacing, typography, radius } from '../../theme';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AppStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<AppStackParamList>;

function formatBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function diasRestantes(dataFim: string) {
  const diff = new Date(dataFim).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { vendedor } = useAuthStore();

  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    saldo: any;
    campanhas: any[];
    vendas: any[];
    naoLidas: number;
  }>({ saldo: null, campanhas: [], vendas: [], naoLidas: 0 });

  const fetchAll = useCallback(async () => {
    try {
      const [saldo, campanhasData, vendasData, notifData] = await Promise.allSettled([
        vendedorService.getSaldo(),
        campanhaService.list({ limit: 5 }),
        vendaService.list({ limit: 3 }),
        notificacaoService.countNaoLidas(),
      ]);

      setData({
        saldo: saldo.status === 'fulfilled' ? saldo.value : null,
        campanhas: campanhasData.status === 'fulfilled' ? (campanhasData.value.data ?? []) : [],
        vendas: vendasData.status === 'fulfilled' ? (vendasData.value.data ?? []) : [],
        naoLidas: notifData.status === 'fulfilled' ? (notifData.value.count ?? 0) : 0,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  React.useEffect(() => { fetchAll(); }, [fetchAll]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAll();
  }, [fetchAll]);

  const firstName = vendedor?.nome?.split(' ')[0] ?? 'Olá';

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator color={colors.red} size="large" />
      </View>
    );
  }

  const { saldo, campanhas, vendas, naoLidas } = data;
  const vendas30 = vendas.length;
  const premio30 = vendas.reduce((sum: number, v: any) => sum + (v.premio_calculado ?? 0), 0);

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top }]}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.red} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Olá, {firstName} 👋</Text>
          <Text style={styles.subGreeting}>Bem-vindo de volta</Text>
        </View>
        <TouchableOpacity
          style={styles.bellBtn}
          onPress={() => navigation.navigate('Notificacoes')}
          activeOpacity={0.7}
        >
          <Text style={styles.bellIcon}>🔔</Text>
          {naoLidas > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{naoLidas > 9 ? '9+' : naoLidas}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Saldo Card */}
      <View style={styles.saldoCard}>
        <Text style={styles.saldoLabel}>Disponível para saque</Text>
        <Text style={styles.saldoValue}>{formatBRL(saldo?.saldo_disponivel ?? 0)}</Text>
        {saldo?.saldo_bloqueado > 0 && (
          <Text style={styles.saldoBloqueado}>Bloqueado: {formatBRL(saldo.saldo_bloqueado)}</Text>
        )}
        {(saldo?.saldo_disponivel ?? 0) >= 20 && (
          <Button
            title="Solicitar pagamento"
            onPress={() => {}}
            variant="primary"
            size="sm"
            style={styles.saqueBtn}
          />
        )}
      </View>

      {/* Resumo do mês */}
      <View style={styles.statsRow}>
        <Card style={styles.statCard}>
          <Text style={styles.statValue}>{vendas30}</Text>
          <Text style={styles.statLabel}>Vendas{'\n'}registradas</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={styles.statValue}>{formatBRL(premio30)}</Text>
          <Text style={styles.statLabel}>Prêmio{'\n'}acumulado</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={styles.statValue}>—</Text>
          <Text style={styles.statLabel}>Posição{'\n'}ranking</Text>
        </Card>
      </View>

      {/* Campanhas ativas */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Campanhas ativas</Text>
          <TouchableOpacity onPress={() => {}}>
            <Text style={styles.seeAll}>Ver todas →</Text>
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.campanhasScroll}>
          {campanhas.length === 0 && (
            <Text style={styles.emptyText}>Nenhuma campanha ativa</Text>
          )}
          {campanhas.map((c: any) => {
            const dias = diasRestantes(c.data_fim);
            return (
              <TouchableOpacity
                key={c.id}
                style={styles.campanhaCard}
                onPress={() => navigation.navigate('DetalheCampanha', { campanhaId: c.id })}
                activeOpacity={0.8}
              >
                <Text style={styles.campanhaName} numberOfLines={2}>{c.nome}</Text>
                <Text style={styles.campanhaInfo}>
                  {dias === 0 ? 'Encerra hoje' : `Encerra em ${dias} dia${dias !== 1 ? 's' : ''}`}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Últimas vendas */}
      <View style={[styles.section, { marginBottom: insets.bottom + spacing.lg }]}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Últimas vendas</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>Ver todas →</Text>
          </TouchableOpacity>
        </View>
        {vendas.length === 0 && (
          <Text style={styles.emptyText}>Nenhuma venda registrada</Text>
        )}
        {vendas.map((v: any) => (
          <Card key={v.id} style={styles.vendaItem}>
            <View style={styles.vendaRow}>
              <View style={styles.vendaInfo}>
                <Text style={styles.vendaNome}>{v.produto_nome ?? 'Produto'}</Text>
                <Text style={styles.vendaMeta}>
                  {new Date(v.created_at).toLocaleDateString('pt-BR')} · {v.metragem}m
                </Text>
              </View>
              <View style={styles.vendaRight}>
                <Text style={styles.vendaPremio}>{formatBRL(v.premio_calculado)}</Text>
                <Badge label={v.status} variant={statusToBadge(v.status)} />
              </View>
            </View>
          </Card>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.black },
  loadingContainer: { flex: 1, backgroundColor: colors.black, alignItems: 'center', justifyContent: 'center' },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  greeting: { color: colors.textPrimary, fontSize: typography.lg, fontWeight: '700' },
  subGreeting: { color: colors.textMuted, fontSize: typography.sm },
  bellBtn: { position: 'relative', padding: 4 },
  bellIcon: { fontSize: 24 },
  badge: {
    position: 'absolute', top: 0, right: 0,
    backgroundColor: colors.red,
    minWidth: 16, height: 16,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '700' },

  saldoCard: {
    marginHorizontal: spacing.lg,
    backgroundColor: '#1A0000',
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: '#3D0000',
    marginBottom: spacing.md,
  },
  saldoLabel: { color: colors.textSecondary, fontSize: typography.sm, marginBottom: 4 },
  saldoValue: { color: colors.textPrimary, fontSize: typography.xxl, fontWeight: '800' },
  saldoBloqueado: { color: colors.textMuted, fontSize: typography.sm, marginTop: 4 },
  saqueBtn: { marginTop: spacing.md, alignSelf: 'flex-start' },

  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  statCard: { flex: 1, alignItems: 'center', padding: spacing.sm },
  statValue: { color: colors.textPrimary, fontSize: typography.md, fontWeight: '700', textAlign: 'center' },
  statLabel: { color: colors.textMuted, fontSize: typography.xs, textAlign: 'center', marginTop: 4 },

  section: { paddingHorizontal: spacing.lg, marginBottom: spacing.lg },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  sectionTitle: { color: colors.textPrimary, fontSize: typography.md, fontWeight: '600' },
  seeAll: { color: colors.red, fontSize: typography.sm, fontWeight: '500' },

  campanhasScroll: { gap: spacing.sm, paddingRight: spacing.sm },
  campanhaCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    width: 160,
  },
  campanhaName: { color: colors.textPrimary, fontSize: typography.base, fontWeight: '600', marginBottom: 6 },
  campanhaInfo: { color: colors.textMuted, fontSize: typography.xs },

  emptyText: { color: colors.textMuted, fontSize: typography.sm, textAlign: 'center', paddingVertical: spacing.lg },

  vendaItem: { marginBottom: spacing.sm },
  vendaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  vendaInfo: { flex: 1 },
  vendaNome: { color: colors.textPrimary, fontSize: typography.base, fontWeight: '500' },
  vendaMeta: { color: colors.textMuted, fontSize: typography.xs, marginTop: 2 },
  vendaRight: { alignItems: 'flex-end', gap: 4 },
  vendaPremio: { color: colors.success, fontSize: typography.sm, fontWeight: '700' },
});
