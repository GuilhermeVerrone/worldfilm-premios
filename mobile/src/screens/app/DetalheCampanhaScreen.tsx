import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { campanhaService } from '../../services/campanha.service';
import { Card } from '../../components/Card';
import { Badge, statusToBadge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { ScreenHeader } from '../../components/ScreenHeader';
import { colors, spacing, typography } from '../../theme';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AppStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AppStackParamList, 'DetalheCampanha'>;

function formatBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function DetalheCampanhaScreen({ route, navigation }: Props) {
  const { campanhaId } = route.params;
  const insets = useSafeAreaInsets();

  const [campanha, setCampanha] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    campanhaService.getById(campanhaId)
      .then((data) => setCampanha(data.campanha))
      .finally(() => setLoading(false));
  }, [campanhaId]);

  if (loading) {
    return (
      <View style={[styles.loading, { paddingTop: insets.top }]}>
        <ActivityIndicator color={colors.red} size="large" />
      </View>
    );
  }

  if (!campanha) return null;

  const premios = campanha.premios ?? [];
  const meu = campanha.meu_desempenho;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScreenHeader title={campanha.nome} showBack />
      <ScrollView contentContainerStyle={styles.content}>
        {/* Status e período */}
        <Card style={styles.infoCard}>
          <View style={styles.rowBetween}>
            <Text style={styles.label}>Status</Text>
            <Badge label={campanha.status} variant={statusToBadge(campanha.status)} />
          </View>
          <View style={styles.rowBetween}>
            <Text style={styles.label}>Início</Text>
            <Text style={styles.value}>{new Date(campanha.data_inicio).toLocaleDateString('pt-BR')}</Text>
          </View>
          <View style={styles.rowBetween}>
            <Text style={styles.label}>Fim</Text>
            <Text style={styles.value}>{new Date(campanha.data_fim).toLocaleDateString('pt-BR')}</Text>
          </View>
          {campanha.descricao && (
            <Text style={styles.descricao}>{campanha.descricao}</Text>
          )}
        </Card>

        {/* Meu desempenho */}
        {meu && (
          <Card style={styles.desempenhoCard}>
            <Text style={styles.sectionTitle}>Meu desempenho</Text>
            <View style={styles.desempenhoRow}>
              <View style={styles.desempenhoItem}>
                <Text style={styles.desempenhoNum}>{meu.total_vendas ?? 0}</Text>
                <Text style={styles.desempenhoLabel}>Vendas</Text>
              </View>
              <View style={styles.desempenhoItem}>
                <Text style={[styles.desempenhoNum, { color: colors.success }]}>
                  {formatBRL(meu.total_premios ?? 0)}
                </Text>
                <Text style={styles.desempenhoLabel}>Prêmios</Text>
              </View>
            </View>
          </Card>
        )}

        {/* Tabela de prêmios */}
        <Text style={styles.sectionTitle}>Tabela de Prêmios</Text>
        {premios.length === 0 ? (
          <Text style={styles.emptyText}>Nenhum prêmio configurado</Text>
        ) : (
          premios.map((p: any) => (
            <Card key={p.produto_id} style={styles.premioRow}>
              <Text style={styles.premioNome}>{p.produto_nome ?? 'Produto'}</Text>
              <Text style={styles.premioDetalhe}>
                A cada <Text style={styles.bold}>{p.metragem_corte}m</Text> →{' '}
                <Text style={[styles.bold, { color: colors.success }]}>{formatBRL(p.valor_premio)}</Text>
              </Text>
            </Card>
          ))
        )}

        {campanha.status === 'ativa' && (
          <Button
            title="Registrar venda nessa campanha"
            onPress={() => navigation.navigate('Tabs')}
            fullWidth
            size="lg"
            style={styles.ctaBtn}
          />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.black },
  loading: { flex: 1, backgroundColor: colors.black, alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, paddingBottom: spacing.xl },
  infoCard: { marginBottom: spacing.md, gap: spacing.sm },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { color: colors.textMuted, fontSize: typography.sm },
  value: { color: colors.textPrimary, fontSize: typography.sm, fontWeight: '500' },
  descricao: { color: colors.textSecondary, fontSize: typography.sm, lineHeight: 20, marginTop: spacing.sm },
  desempenhoCard: { marginBottom: spacing.md },
  desempenhoRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: spacing.sm },
  desempenhoItem: { alignItems: 'center' },
  desempenhoNum: { color: colors.textPrimary, fontSize: typography.xl, fontWeight: '700' },
  desempenhoLabel: { color: colors.textMuted, fontSize: typography.xs, marginTop: 2 },
  sectionTitle: { color: colors.textPrimary, fontSize: typography.md, fontWeight: '600', marginBottom: spacing.sm },
  emptyText: { color: colors.textMuted, fontSize: typography.sm, textAlign: 'center', padding: spacing.lg },
  premioRow: { marginBottom: spacing.sm },
  premioNome: { color: colors.textPrimary, fontSize: typography.base, fontWeight: '600', marginBottom: 4 },
  premioDetalhe: { color: colors.textSecondary, fontSize: typography.sm },
  bold: { fontWeight: '700', color: colors.textPrimary },
  ctaBtn: { marginTop: spacing.lg },
});
