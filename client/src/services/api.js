import axios from 'axios';
import { useAuthStore } from '../store/authStore';

export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';

/**
 * Axios instance with automatic token injection and silent refresh.
 * On a 401 it calls /auth/refresh once and retries the original request;
 * concurrent 401s share the same refresh promise (queue).
 */
const api = axios.create({ baseURL: `${API_URL}/api/v1` });

let refreshPromise = null;

async function refreshTokens() {
  const { refreshToken, setTokens, logout } = useAuthStore.getState();
  if (!refreshToken) throw new Error('No refresh token');

  const { data } = await axios.post(`${API_URL}/api/v1/auth/refresh`, { refreshToken });
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

    if (error.response?.status === 401 && !original._retried && !isAuthRoute) {
      original._retried = true;
      try {
        refreshPromise = refreshPromise || refreshTokens();
        const token = await refreshPromise;
        refreshPromise = null;
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

/** Extracts the API error message from the standard {error:{message,details}} shape. */
export function apiErrorMessage(err) {
  return err?.response?.data?.error?.message || err?.message || 'Error inesperado';
}

export default api;
