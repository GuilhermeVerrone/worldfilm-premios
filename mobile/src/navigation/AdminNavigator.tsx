import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { AdminTabParamList } from './types';
import AdminDashboardScreen from '../screens/admin/DashboardScreen';
import AdminVendedoresListScreen from '../screens/admin/VendedoresListScreen';
import AdminVendedorDetalheScreen from '../screens/admin/VendedorDetalheScreen';
import AdminVendasListScreen from '../screens/admin/VendasListScreen';
import AdminVendaDetalheScreen from '../screens/admin/VendaDetalheScreen';
import AdminFinanceiroListScreen from '../screens/admin/FinanceiroListScreen';
import AdminFinanceiroDetalheScreen from '../screens/admin/FinanceiroDetalheScreen';
import AdminMaisScreen from '../screens/admin/MaisScreen';
import AdminCampanhasListScreen from '../screens/admin/CampanhasListScreen';
import AdminCampanhaDetalheScreen from '../screens/admin/CampanhaDetalheScreen';
import AdminDistribuidoresListScreen from '../screens/admin/DistribuidoresListScreen';
import AdminDistribuidorDetalheScreen from '../screens/admin/DistribuidorDetalheScreen';
import AdminNotificacoesScreen from '../screens/admin/NotificacoesScreen';

const Tab = createBottomTabNavigator<AdminTabParamList>();

const BRAND_RED = '#CC0000';
const INACTIVE_COLOR = '#666';

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return (
    <View style={focused ? styles.iconContainerActive : styles.iconContainer}>
      <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.6 }}>{emoji}</Text>
    </View>
  );
}

function VendedoresStack() {
  const S = createNativeStackNavigator();
  return (
    <S.Navigator screenOptions={{ headerShown: false }}>
      <S.Screen name="VendedoresList" component={AdminVendedoresListScreen} />
      <S.Screen name="VendedorDetalhe" component={AdminVendedorDetalheScreen} />
    </S.Navigator>
  );
}

function VendasStack() {
  const S = createNativeStackNavigator();
  return (
    <S.Navigator screenOptions={{ headerShown: false }}>
      <S.Screen name="VendasList" component={AdminVendasListScreen} />
      <S.Screen name="VendaDetalhe" component={AdminVendaDetalheScreen} />
    </S.Navigator>
  );
}

function FinanceiroStack() {
  const S = createNativeStackNavigator();
  return (
    <S.Navigator screenOptions={{ headerShown: false }}>
      <S.Screen name="FinanceiroList" component={AdminFinanceiroListScreen} />
      <S.Screen name="FinanceiroDetalhe" component={AdminFinanceiroDetalheScreen} />
    </S.Navigator>
  );
}

function MaisStack() {
  const S = createNativeStackNavigator();
  return (
    <S.Navigator screenOptions={{ headerShown: false }}>
      <S.Screen name="Mais" component={AdminMaisScreen} />
      <S.Screen name="CampanhasList" component={AdminCampanhasListScreen} />
      <S.Screen name="CampanhaDetalhe" component={AdminCampanhaDetalheScreen} />
      <S.Screen name="DistribuidoresList" component={AdminDistribuidoresListScreen} />
      <S.Screen name="DistribuidorDetalhe" component={AdminDistribuidorDetalheScreen} />
      <S.Screen name="Notificacoes" component={AdminNotificacoesScreen} />
    </S.Navigator>
  );
}

function AdminTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: BRAND_RED,
        tabBarInactiveTintColor: INACTIVE_COLOR,
        tabBarStyle: {
          backgroundColor: '#0A0A0A',
          borderTopColor: '#1A1A1A',
          borderTopWidth: 1,
          height: 65,
          paddingBottom: 8,
          paddingTop: 0,
        },
        tabBarLabelStyle: {
          fontSize: 9,
          fontWeight: '700',
          letterSpacing: 1,
          textTransform: 'uppercase',
          marginTop: -2,
        },
      }}
    >
      <Tab.Screen
        name="AdminDashboard"
        component={AdminDashboardScreen}
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ focused }) => <TabIcon emoji="📊" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="AdminVendedores"
        component={VendedoresStack}
        options={{
          title: 'Vendedores',
          tabBarIcon: ({ focused }) => <TabIcon emoji="👥" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="AdminVendas"
        component={VendasStack}
        options={{
          title: 'Vendas',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🧾" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="AdminFinanceiro"
        component={FinanceiroStack}
        options={{
          title: 'Financeiro',
          tabBarIcon: ({ focused }) => <TabIcon emoji="💰" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="AdminMais"
        component={MaisStack}
        options={{
          title: 'Mais',
          tabBarIcon: ({ focused }) => <TabIcon emoji="☰" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}

export default function AdminNavigator() {
  return <AdminTabs />;
}

const styles = StyleSheet.create({
  iconContainer: {
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainerActive: {
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 2,
    borderTopColor: BRAND_RED,
    paddingTop: 2,
  },
});
