import axios from 'axios';
import Config from 'react-native-config';
import { useAuthStore } from '../store/authStore';

export const api = axios.create({
  baseURL: Config.API_URL ?? 'http://10.0.2.2:3001',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = useAuthStore.getState().refreshToken;
        const { data } = await axios.post(
          `${Config.API_URL ?? 'http://10.0.2.2:3001'}/auth/vendedor/refresh`,
          { refreshToken },
        );
        useAuthStore.getState().setTokens(data.token, data.refreshToken);
        original.headers.Authorization = `Bearer ${data.token}`;
        return api(original);
      } catch {
        useAuthStore.getState().logout();
      }
    }

    return Promise.reject(error);
  },
);
