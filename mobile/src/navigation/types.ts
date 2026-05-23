import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

export type AuthStackParamList = {
  Login: undefined;
  CadastroStep1: undefined;
  CadastroStep2: undefined;
  CadastroStep3: undefined;
  CadastroPendente: undefined;
  RecuperarSenha: undefined;
  VerificarOtp: { whatsapp: string };
  NovaSenha: { whatsapp: string; otp: string };
};

export type AppTabParamList = {
  Home: undefined;
  Campanhas: undefined;
  RegistrarVenda: undefined;
  Financeiro: undefined;
  Perfil: undefined;
};

export type AppStackParamList = {
  Tabs: undefined;
  DetalheCampanha: { campanhaId: string };
  DetalheVenda: { vendaId: string };
  Notificacoes: undefined;
};

export type AdminTabParamList = {
  AdminDashboard: undefined;
  AdminVendedores: undefined;
  AdminVendas: undefined;
  AdminFinanceiro: undefined;
  AdminMais: undefined;
};

export type AdminStackParamList = {
  AdminTabs: undefined;
  AdminVendedorDetalhe: { vendedorId: string };
  AdminVendaDetalhe: { vendaId: string };
  AdminFinanceiroDetalhe: { pagamentoId: string };
  AdminCampanhaDetalhe: { campanhaId: string };
  AdminDistribuidorDetalhe: { distribuidorId: string };
  AdminCampanhas: undefined;
  AdminDistribuidores: undefined;
  AdminNotificacoes: undefined;
};

export type AuthNavigationProp = NativeStackNavigationProp<AuthStackParamList>;
export type AppTabNavigationProp = BottomTabNavigationProp<AppTabParamList>;
export type AdminStackNavigationProp = NativeStackNavigationProp<AdminStackParamList>;
export type AdminTabNavigationProp = BottomTabNavigationProp<AdminTabParamList>;
