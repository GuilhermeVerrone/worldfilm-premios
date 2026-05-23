import messaging from '@react-native-firebase/messaging';
import { Platform, Alert } from 'react-native';
import { authService } from './auth.service';
import { useAuthStore } from '../store/authStore';

async function requestPermission(): Promise<boolean> {
  if (Platform.OS === 'ios') {
    const authStatus = await messaging().requestPermission();
    return (
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL
    );
  }
  return true;
}

async function registerToken() {
  try {
    const token = await messaging().getToken();
    if (token) {
      await authService.updateFcmToken(token);
    }
  } catch {
    // Silently fail — FCM registration is non-critical
  }
}

export async function setupFcm() {
  const granted = await requestPermission();
  if (!granted) return;

  await registerToken();

  // Refresh token when it changes
  messaging().onTokenRefresh(async (token) => {
    await authService.updateFcmToken(token).catch(() => {});
  });

  // Foreground notifications — show as alert
  messaging().onMessage(async (remoteMessage) => {
    const title = remoteMessage.notification?.title ?? 'World Film';
    const body = remoteMessage.notification?.body ?? '';
    Alert.alert(title, body);
  });

  // Background/quit — handle deep links on notification tap
  messaging().onNotificationOpenedApp((remoteMessage) => {
    handleDeepLink(remoteMessage.data);
  });

  // App opened from quit state by notification
  messaging()
    .getInitialNotification()
    .then((remoteMessage) => {
      if (remoteMessage) {
        handleDeepLink(remoteMessage.data);
      }
    });
}

function handleDeepLink(data?: Record<string, string>) {
  if (!data) return;
  // Navigation happens after mount — store the pending route in state if needed
  // For now: venda_aprovada and pagamento_realizado both go to Financeiro
  // Full deep-link routing can be wired through a global navigation ref
}
