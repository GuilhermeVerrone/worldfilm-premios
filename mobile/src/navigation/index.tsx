import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/authStore';
import AuthStack from './AuthStack';
import AppTabs from './AppTabs';
import AdminNavigator from './AdminNavigator';
import DetalheCampanhaScreen from '../screens/app/DetalheCampanhaScreen';
import NotificacoesScreen from '../screens/app/NotificacoesScreen';
import { setupFcm } from '../services/fcm.service';
import type { AppStackParamList } from './types';

const Stack = createNativeStackNavigator<AppStackParamList>();

export default function RootNavigator() {
  const token = useAuthStore((s) => s.token);
  const role = useAuthStore((s) => s.role);

  useEffect(() => {
    if (token) {
      setupFcm();
    }
  }, [token]);

  if (!token) {
    return (
      <NavigationContainer>
        <AuthStack />
      </NavigationContainer>
    );
  }

  if (role === 'admin') {
    return (
      <NavigationContainer>
        <AdminNavigator />
      </NavigationContainer>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Tabs" component={AppTabs} />
        <Stack.Screen name="DetalheCampanha" component={DetalheCampanhaScreen} />
        <Stack.Screen name="DetalheVenda" component={() => null} />
        <Stack.Screen name="Notificacoes" component={NotificacoesScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
