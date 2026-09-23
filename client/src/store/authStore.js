import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'erp.auth';

/**
 * Auth store (Zustand). Tokens are persisted in AsyncStorage so the session
 * survives app restarts on every platform (RN + RNW use the same API).
 */
export const useAuthStore = create((set, get) => ({
  accessToken: null,
  refreshToken: null,
  user: null, // { id, name, email, companyId, role: { name, permissions[] } }
  company: null,
  hydrated: false,

  setSession: ({ accessToken, refreshToken, user, company }) => {
    set({ accessToken, refreshToken, user: user ?? get().user, company: company ?? get().company });
    AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ accessToken, refreshToken, user, company })
    ).catch(() => {});
  },

  /** Rotates tokens without touching the stored user profile. */
  setTokens: ({ accessToken, refreshToken }) => {
    const { user, company } = get();
    set({ accessToken, refreshToken });
    AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ accessToken, refreshToken, user, company })
    ).catch(() => {});
  },

  hydrate: async () => {
    if (get().hydrated) return;
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const session = JSON.parse(raw);
        set({ ...session, hydrated: true });
        return;
      }
    } catch {
      /* corrupted storage → treat as logged out */
    }
    set({ hydrated: true });
  },

  logout: () => {
    set({ accessToken: null, refreshToken: null, user: null, company: null });
    AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
  },

  /** RBAC helper for the UI: has('products:create'). */
  can: (permission) => {
    const perms = get().user?.role?.permissions || [];
    return perms.includes('*') || perms.includes(permission);
  },
}));
