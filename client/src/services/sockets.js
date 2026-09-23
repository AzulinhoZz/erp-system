import { io } from 'socket.io-client';
import { API_URL } from './api';
import { useAuthStore } from '../store/authStore';

/**
 * Socket.io client. Connects with the current access token and joins the
 * server-side rooms (user + company). Reconnects with a fresh token when
 * the session changes.
 */
let socket = null;

export function connectSocket() {
  const { accessToken } = useAuthStore.getState();
  if (!accessToken) return null;

  // reuse if the same token is still valid
  if (socket && socket.auth && socket.auth.token === accessToken && socket.connected) {
    return socket;
  }
  if (socket) {
    socket.disconnect();
    socket = null;
  }

  socket = io(API_URL, { auth: { token: accessToken } });
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

/**
 * onEvent — subscribe to a server event ('stock.low', 'notification', …).
 * Returns an unsubscribe function (safe to use as a useEffect cleanup).
 */
export function onEvent(event, handler) {
  const s = connectSocket();
  if (!s) return () => {};
  s.on(event, handler);
  return () => {
    s.off(event, handler);
  };
}
