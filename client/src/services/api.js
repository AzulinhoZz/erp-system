import axios from 'axios';
import { Platform } from 'react-native';
import { useAuthStore } from '../store/authStore';

function defaultApiUrl() {
  // Android Emulator reaches the host machine through 10.0.2.2.
  // iOS Simulator and web can reach the Mac through localhost.
  // Physical devices MUST set EXPO_PUBLIC_API_URL to a LAN or HTTPS URL.
  return Platform.OS === 'android' ? 'http://10.0.2.2:4000' : 'http://localhost:4000';
}

export const API_URL = (process.env.EXPO_PUBLIC_API_URL || defaultApiUrl()).replace(/\/$/, '');

/**
 * Axios instance with automatic token injection and silent refresh.
 * On a 401 it calls /auth/refresh once and retries the original request;
 * concurrent 401s share the same refresh promise (queue).
 */
const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
  timeout: 15_000,
});

let refreshPromise = null;

async function refreshTokens() {
  const { refreshToken, setTokens } = useAuthStore.getState();
  if (!refreshToken) throw new Error('No refresh token');

  const { data } = await axios.post(
    `${API_URL}/api/v1/auth/refresh`,
    { refreshToken },
    { timeout: 15_000 }
  );
  setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
  return data.accessToken;
}

api.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState();
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const isAuthRoute = original?.url?.includes('/auth/login') || original?.url?.includes('/auth/refresh');

    if (error.response?.status === 401 && !original?._retried && !isAuthRoute) {
      original._retried = true;
      try {
        refreshPromise = refreshPromise || refreshTokens();
        const token = await refreshPromise;
        refreshPromise = null;
        original.headers = original.headers || {};
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      } catch (refreshError) {
        refreshPromise = null;
        useAuthStore.getState().logout();
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

/** Extracts a useful user-facing message without leaking server internals. */
export function apiErrorMessage(err) {
  if (!err?.response && (err?.code === 'ECONNABORTED' || err?.message === 'Network Error')) {
    return `No se pudo conectar con la API (${API_URL}). Verifica que el backend esté encendido y que EXPO_PUBLIC_API_URL sea correcto.`;
  }
  return err?.response?.data?.error?.message || err?.message || 'Error inesperado';
}

export default api;
