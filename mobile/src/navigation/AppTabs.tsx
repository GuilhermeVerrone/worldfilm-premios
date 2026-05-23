import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { AppTabParamList } from './types';
import HomeScreen from '../screens/app/HomeScreen';
import CampanhasScreen from '../screens/app/CampanhasScreen';
import RegistrarVendaScreen from '../screens/app/RegistrarVendaScreen';
import FinanceiroScreen from '../screens/app/FinanceiroScreen';
import PerfilScreen from '../screens/app/PerfilScreen';

const Tab = createBottomTabNavigator<AppTabParamList>();

const BRAND_RED = '#CC0000';
const INACTIVE_COLOR = '#666';

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return (
    <View style={focused ? styles.iconContainerActive : styles.iconContainer}>
      <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.6 }}>{emoji}</Text>
    </View>
  );
}

function RegisterIcon() {
  return (
    <View style={styles.registerIcon}>
      <Text style={{ color: '#fff', fontSize: 22, fontWeight: '300', lineHeight: 28 }}>+</Text>
    </View>
  );
}

export default function AppTabs() {
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
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Início',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Campanhas"
        component={CampanhasScreen}
        options={{
          title: 'Campanhas',
          tabBarIcon: ({ focused }) => <TabIcon emoji="📢" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="RegistrarVenda"
        component={RegistrarVendaScreen}
        options={{
          title: '',
          tabBarIcon: () => <RegisterIcon />,
          tabBarLabel: () => null,
        }}
      />
      <Tab.Screen
        name="Financeiro"
        component={FinanceiroScreen}
        options={{
          title: 'Financeiro',
          tabBarIcon: ({ focused }) => <TabIcon emoji="💳" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Perfil"
        component={PerfilScreen}
        options={{
          title: 'Perfil',
          tabBarIcon: ({ focused }) => <TabIcon emoji="👤" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
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
    paddingTop: 2, // Compensate for border
  },
  registerIcon: {
    width: 48,
    height: 48,
    backgroundColor: BRAND_RED,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24, // Round border for floating button
    marginBottom: 20, // Lift it up more
    shadowColor: BRAND_RED,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
});
