import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { AuthStackParamList } from './types';
import LoginScreen from '../screens/auth/LoginScreen';
import CadastroScreen from '../screens/auth/CadastroScreen';
import CadastroPendenteScreen from '../screens/auth/CadastroPendenteScreen';
import RecuperarSenhaScreen from '../screens/auth/RecuperarSenhaScreen';
import VerificarOtpScreen from '../screens/auth/VerificarOtpScreen';
import NovaSenhaScreen from '../screens/auth/NovaSenhaScreen';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export default function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="CadastroStep1" component={CadastroScreen} />
      <Stack.Screen name="CadastroStep2" component={CadastroScreen} />
      <Stack.Screen name="CadastroStep3" component={CadastroScreen} />
      <Stack.Screen name="CadastroPendente" component={CadastroPendenteScreen} />
      <Stack.Screen name="RecuperarSenha" component={RecuperarSenhaScreen} />
      <Stack.Screen name="VerificarOtp" component={VerificarOtpScreen} />
      <Stack.Screen name="NovaSenha" component={NovaSenhaScreen} />
    </Stack.Navigator>
  );
}
