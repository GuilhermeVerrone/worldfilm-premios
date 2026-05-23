import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, Switch, Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore';
import { vendedorService } from '../../services/vendedor.service';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Badge, statusToBadge } from '../../components/Badge';
import { ScreenHeader } from '../../components/ScreenHeader';
import { colors, spacing, typography, radius } from '../../theme';

const SUPORTE_WHATSAPP = '5500000000000';

const CONQUISTAS = [
  { id: 'primeira_venda', label: 'Primeira Venda', emoji: '🥇', desc: 'Registre sua primeira venda', meta: 1 },
  { id: 'dez_vendas', label: '10 Vendas', emoji: '🏆', desc: 'Registre 10 vendas aprovadas', meta: 10 },
  { id: 'quinhentos', label: 'R$500 em Prêmios', emoji: '💰', desc: 'Acumule R$500 em prêmios', meta: 500 },
];

export default function PerfilScreen() {
  const insets = useSafeAreaInsets();
  const { vendedor, logout } = useAuthStore();

  const [editMode, setEditMode] = useState(false);
  const [nome, setNome] = useState(vendedor?.nome ?? '');
  const [telefone, setTelefone] = useState((vendedor as any)?.telefone ?? '');
  const [chavePix, setChavePix] = useState((vendedor as any)?.chave_pix ?? '');
  const [savingPerfil, setSavingPerfil] = useState(false);

  const [senhaMode, setSenhaMode] = useState(false);
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [savingSenha, setSavingSenha] = useState(false);

  const initials = `${vendedor?.nome?.[0] ?? ''}${(vendedor as any)?.sobrenome?.[0] ?? ''}`.toUpperCase() || 'VV';

  async function handleSavePerfil() {
    setSavingPerfil(true);
    try {
      await vendedorService.updatePerfil({ nome, telefone, chave_pix: chavePix });
      setEditMode(false);
      Alert.alert('Perfil atualizado!');
    } catch (err: any) {
      Alert.alert('Erro', err?.response?.data?.message ?? 'Não foi possível salvar.');
    } finally {
      setSavingPerfil(false);
    }
  }

  async function handleSaveSenha() {
    if (!senhaAtual || !novaSenha) return;
    if (novaSenha.length < 6) {
      Alert.alert('Senha fraca', 'Mínimo de 6 caracteres.');
      return;
    }
    setSavingSenha(true);
    try {
      await vendedorService.updateSenha(senhaAtual, novaSenha);
      setSenhaMode(false);
      setSenhaAtual('');
      setNovaSenha('');
      Alert.alert('Senha alterada com sucesso!');
    } catch (err: any) {
      Alert.alert('Erro', err?.response?.data?.message ?? 'Senha atual incorreta.');
    } finally {
      setSavingSenha(false);
    }
  }

  function handleLogout() {
    Alert.alert('Sair', 'Deseja sair da sua conta?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: logout },
    ]);
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScreenHeader title="Meu Perfil" />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}>
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.nomeCompleto}>{vendedor?.nome} {(vendedor as any)?.sobrenome ?? ''}</Text>
          <Text style={styles.distribuidor}>{(vendedor as any)?.distribuidor_nome ?? '—'}</Text>
          <Badge label={(vendedor as any)?.status ?? 'pendente'} variant={statusToBadge((vendedor as any)?.status ?? '')} />
        </View>

        {/* Conquistas */}
        <Text style={styles.sectionTitle}>Conquistas</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.conquistasRow}>
          {CONQUISTAS.map((c) => (
            <View key={c.id} style={styles.conquistaCard}>
              <Text style={styles.conquistaEmoji}>{c.emoji}</Text>
              <Text style={styles.conquistaLabel}>{c.label}</Text>
              <Text style={styles.conquistaDesc}>{c.desc}</Text>
            </View>
          ))}
        </ScrollView>

        {/* Dados pessoais */}
        <Card style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Dados pessoais</Text>
            {!editMode && (
              <TouchableOpacity onPress={() => setEditMode(true)} activeOpacity={0.7}>
                <Text style={styles.editBtn}>Editar</Text>
              </TouchableOpacity>
            )}
          </View>
          {editMode ? (
            <>
              <Input label="Nome" value={nome} onChangeText={setNome} />
              <Input label="WhatsApp" value={telefone} onChangeText={setTelefone} keyboardType="phone-pad" />
              <Input label="Chave PIX" value={chavePix} onChangeText={setChavePix} />
              <View style={styles.editBtns}>
                <Button title="Cancelar" variant="ghost" onPress={() => setEditMode(false)} size="sm" />
                <Button title="Salvar" onPress={handleSavePerfil} loading={savingPerfil} size="sm" />
              </View>
            </>
          ) : (
            <View style={styles.dataRows}>
              <DataRow label="CPF" value={(vendedor as any)?.cpf ?? '—'} />
              <DataRow label="CNPJ" value={(vendedor as any)?.cnpj ?? '—'} />
              <DataRow label="WhatsApp" value={(vendedor as any)?.telefone ?? '—'} />
              <DataRow label="Chave PIX" value={(vendedor as any)?.chave_pix ?? 'Não cadastrada'} />
            </View>
          )}
        </Card>

        {/* Configurações */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Configurações</Text>
          <TouchableOpacity style={styles.menuItem} onPress={() => setSenhaMode(!senhaMode)} activeOpacity={0.7}>
            <Text style={styles.menuLabel}>Alterar senha</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
          {senhaMode && (
            <View style={styles.senhaForm}>
              <Input label="Senha atual" value={senhaAtual} onChangeText={setSenhaAtual} secureToggle placeholder="••••••••" />
              <Input label="Nova senha" value={novaSenha} onChangeText={setNovaSenha} secureToggle placeholder="Mínimo 6 caracteres" />
              <View style={styles.editBtns}>
                <Button title="Cancelar" variant="ghost" onPress={() => setSenhaMode(false)} size="sm" />
                <Button title="Salvar" onPress={handleSaveSenha} loading={savingSenha} size="sm" />
              </View>
            </View>
          )}
        </Card>

        {/* Suporte */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Suporte</Text>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => Linking.openURL(`https://wa.me/${SUPORTE_WHATSAPP}?text=Oi, preciso de ajuda com o app World Film.`)}
            activeOpacity={0.7}
          >
            <Text style={styles.menuLabel}>Falar com suporte</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        </Card>

        {/* Sair */}
        <Button
          title="Sair da conta"
          variant="danger"
          onPress={handleLogout}
          fullWidth
          size="lg"
          style={styles.logoutBtn}
        />
      </ScrollView>
    </View>
  );
}

function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.dataRow}>
      <Text style={styles.dataLabel}>{label}</Text>
      <Text style={styles.dataValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.black },
  content: { paddingHorizontal: spacing.lg },
  avatarSection: { alignItems: 'center', paddingVertical: spacing.xl },
  avatar: {
    width: 80, height: 80,
    backgroundColor: colors.red,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.md,
  },
  avatarText: { color: '#fff', fontSize: typography.xl, fontWeight: '700' },
  nomeCompleto: { color: colors.textPrimary, fontSize: typography.lg, fontWeight: '700', marginBottom: 4 },
  distribuidor: { color: colors.textMuted, fontSize: typography.sm, marginBottom: spacing.sm },
  sectionTitle: { color: colors.textPrimary, fontSize: typography.base, fontWeight: '600', marginBottom: spacing.sm },
  section: { marginBottom: spacing.md },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  editBtn: { color: colors.red, fontSize: typography.sm, fontWeight: '600' },
  conquistasRow: { gap: spacing.sm, paddingRight: spacing.sm, marginBottom: spacing.md },
  conquistaCard: {
    backgroundColor: colors.card, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border,
    padding: spacing.md, width: 120, alignItems: 'center',
  },
  conquistaEmoji: { fontSize: 32, marginBottom: 6 },
  conquistaLabel: { color: colors.textPrimary, fontSize: typography.xs, fontWeight: '600', textAlign: 'center' },
  conquistaDesc: { color: colors.textMuted, fontSize: 10, textAlign: 'center', marginTop: 2 },
  dataRows: { gap: 8 },
  dataRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dataLabel: { color: colors.textMuted, fontSize: typography.sm },
  dataValue: { color: colors.textPrimary, fontSize: typography.sm, fontWeight: '500', flex: 1, textAlign: 'right' },
  editBtns: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm, marginTop: spacing.sm },
  senhaForm: { marginTop: spacing.sm },
  menuItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  menuLabel: { color: colors.textPrimary, fontSize: typography.base },
  menuArrow: { color: colors.textMuted, fontSize: typography.xl },
  logoutBtn: { marginTop: spacing.sm, borderRadius: radius.lg },
});
