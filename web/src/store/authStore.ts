import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Admin } from '@worldfilm/shared';

function parseJwtRole(token: string): 'admin' | 'vendedor' | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.role ?? null;
  } catch {
    return null;
  }
}

export interface VendedorUser {
  id: string;
  nome: string;
  cpf: string;
}

interface AuthState {
  admin: Omit<Admin, 'senha'> | null;
  vendedor: VendedorUser | null;
  role: 'admin' | 'vendedor' | null;
  token: string | null;
  refreshToken: string | null;
  setUnifiedAuth: (role: 'admin' | 'vendedor', user: Record<string, unknown>, token: string, refreshToken: string) => void;
  setAuth: (admin: Omit<Admin, 'senha'>, token: string, refreshToken: string) => void;
  setVendedorAuth: (vendedor: VendedorUser, token: string, refreshToken: string) => void;
  setTokens: (token: string, refreshToken: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      admin: null,
      vendedor: null,
      role: null,
      token: null,
      refreshToken: null,
      setUnifiedAuth: (role, user, token, refreshToken) => {
        if (role === 'admin') {
          set({ admin: user as unknown as Omit<Admin, 'senha'>, vendedor: null, role: 'admin', token, refreshToken });
        } else {
          set({ vendedor: user as unknown as VendedorUser, admin: null, role: 'vendedor', token, refreshToken });
        }
      },
      setAuth: (admin, token, refreshToken) =>
        set({ admin, vendedor: null, role: parseJwtRole(token) ?? 'admin', token, refreshToken }),
      setVendedorAuth: (vendedor, token, refreshToken) =>
        set({ vendedor, admin: null, role: 'vendedor', token, refreshToken }),
      setTokens: (token, refreshToken) => set({ token, refreshToken }),
      logout: () => set({ admin: null, vendedor: null, role: null, token: null, refreshToken: null }),
    }),
    { name: 'worldfilm-auth' },
  ),
);
