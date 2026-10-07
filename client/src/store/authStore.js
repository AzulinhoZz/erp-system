import { create } from 'zustand';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'erp.auth';
const storage = Platform.OS === 'web' ? AsyncStorage : SecureStore;

function readSession() {
  return Platform.OS === 'web'
    ? storage.getItem(STORAGE_KEY)
    : storage.getItemAsync(STORAGE_KEY);
}

function writeSession(session) {
  const value = JSON.stringify(session);
  return Platform.OS === 'web'
    ? storage.setItem(STORAGE_KEY, value)
    : storage.setItemAsync(STORAGE_KEY, value, {
      keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
    });
}

function removeSession() {
  return Platform.OS === 'web'
    ? storage.removeItem(STORAGE_KEY)
    : storage.deleteItemAsync(STORAGE_KEY);
}

/**
 * Native sessions use Keychain/Keystore-backed SecureStore. Web retains
 * AsyncStorage because Expo SecureStore is not available in browsers.
 */
export const useAuthStore = create((set, get) => ({
  accessToken: null,
  refreshToken: null,
  user: null, // { id, name, email, companyId, role: { name, permissions[] } }
  company: null,
  hydrated: false,
  persistenceError: null,

  setSession: async ({ accessToken, refreshToken, user, company }) => {
    const session = {
      accessToken,
      refreshToken,
      user: user ?? get().user,
      company: company ?? get().company,
    };
    try {
      await writeSession(session);
      set({ ...session, persistenceError: null });
    } catch {
      set({ persistenceError: 'No se pudo guardar la sesión de forma segura.' });
      throw new Error('No se pudo guardar la sesión de forma segura.');
    }
  },

  /** Rotates tokens without touching the stored user profile. */
  setTokens: async ({ accessToken, refreshToken }) => {
    const { user, company } = get();
    const session = { accessToken, refreshToken, user, company };
    try {
      await writeSession(session);
      set({ ...session, persistenceError: null });
    } catch {
      set({ persistenceError: 'No se pudo guardar la sesión renovada de forma segura.' });
      throw new Error('No se pudo guardar la sesión renovada de forma segura.');
    }
  },

  /** Switch active company context for multi-company authorized users */
  switchCompany: async (newCompany) => {
    const { accessToken, refreshToken, user } = get();
    const updatedUser = user
      ? { ...user, companyId: newCompany._id || newCompany.id }
      : null;
    const session = {
      accessToken,
      refreshToken,
      user: updatedUser,
      company: newCompany,
    };
    try {
      await writeSession(session);
      set({ ...session, persistenceError: null });
    } catch {
      set({ persistenceError: 'No se pudo guardar el cambio de empresa de forma segura.' });
      throw new Error('No se pudo guardar el cambio de empresa de forma segura.');
    }
  },

  hydrate: async () => {
    if (get().hydrated) return;
    try {
      const raw = await readSession();
      if (raw) {
        const session = JSON.parse(raw);
        if (!session || typeof session !== 'object') throw new Error('Invalid session data');
        set({ ...session, hydrated: true, persistenceError: null });
        return;
      }
      set({ hydrated: true, persistenceError: null });
    } catch {
      set({
        accessToken: null,
        refreshToken: null,
        user: null,
        company: null,
        hydrated: true,
        persistenceError: 'No se pudo recuperar la sesión almacenada.',
      });
    }
  },

  logout: async () => {
    set({ accessToken: null, refreshToken: null, user: null, company: null });
    try {
      await removeSession();
      set({ persistenceError: null });
    } catch (err) {
      set({ persistenceError: 'No se pudo eliminar la sesión almacenada en este dispositivo.' });
      throw new Error('No se pudo eliminar la sesión almacenada en este dispositivo.');
    }
  },

  /** RBAC helper for the UI: has('products:create'). */
  can: (permission) => {
    const perms = get().user?.role?.permissions || [];
    return perms.includes('*') || perms.includes(permission);
  },
}));
