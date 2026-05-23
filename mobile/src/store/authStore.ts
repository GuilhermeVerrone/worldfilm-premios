import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Vendedor } from '@worldfilm/shared';

export interface AdminUser {
  id: string;
  nome: string;
  email: string;
}

interface AuthState {
  vendedor: Omit<Vendedor, 'senha'> | null;
  admin: AdminUser | null;
  role: 'vendedor' | 'admin' | null;
  token: string | null;
  refreshToken: string | null;
  setAuth: (vendedor: Omit<Vendedor, 'senha'>, token: string, refreshToken: string) => void;
  setAdminAuth: (admin: AdminUser, token: string, refreshToken: string) => void;
  setTokens: (token: string, refreshToken: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      vendedor: null,
      admin: null,
      role: null,
      token: null,
      refreshToken: null,
      setAuth: (vendedor, token, refreshToken) =>
        set({ vendedor, admin: null, role: 'vendedor', token, refreshToken }),
      setAdminAuth: (admin, token, refreshToken) =>
        set({ admin, vendedor: null, role: 'admin', token, refreshToken }),
      setTokens: (token, refreshToken) => set({ token, refreshToken }),
      logout: () => set({ vendedor: null, admin: null, role: null, token: null, refreshToken: null }),
    }),
    {
      name: 'worldfilm-auth',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
