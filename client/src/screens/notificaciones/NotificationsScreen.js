import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Screen, Card, AppButton, EmptyState, ErrorBanner } from '../../components/ui';
import { notificationsService } from '../../services/resources';
import { onEvent, connectSocket } from '../../services/sockets';
import { apiErrorMessage } from '../../services/api';

/**
 * Notifications — persisted list + LIVE events over Socket.io.
 * While the screen is open, `stock.low` events arrive in real time and are
 * prepended to the list (and refreshed from the server on reconnect).
 */
export default function NotificationsScreen({ navigation }) {
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [live, setLive] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await notificationsService.list({ limit: 50 });
      setItems(data.items || []);
      setUnread(data.unread || 0);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Live subscription: stock.low + generic notification events
  useEffect(() => {
    const offLow = onEvent('stock.low', (payload) => {
      setItems((prev) => [
        {
          id: `live-${Date.now()}`,
          type: 'alert',
          title: 'Stock bajo',
          message: `${payload.sku} — ${payload.name}: quedan ${payload.stock} (mín. ${payload.minStock})`,
          date: payload.date || new Date().toISOString(),
          read: false,
          live: true,
        },
        ...prev,
      ]);
      setUnread((n) => n + 1);
    });
    const offNote = onEvent('notification', (payload) => {
      setItems((prev) => [{ id: `live-${Date.now()}`, live: true, ...payload }, ...prev]);
      setUnread((n) => n + 1);
    });
    const s = connectSocket();
    setLive(!!s);
    return () => {
      offLow();
      offNote();
    };
  }, []);

  const markRead = async (item) => {
    if (item.read || String(item.id).startsWith('live-')) return;
    try {
      await notificationsService.markRead(item.id || item._id);
      setUnread((n) => Math.max(0, n - 1));
      setItems((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, read: true } : n))
      );
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  };

  const markAll = async () => {
    try {
      await notificationsService.markAllRead();
      setUnread(0);
      setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  };

  return (
    <Screen
      title={`Notificaciones${unread ? ` (${unread} sin leer)` : ''}`}
      subtitle={live ? 'Conectado en tiempo real (Socket.io)' : 'Tiempo real no disponible'}
      onBack={() => navigation.goBack()}
      headerRight={<AppButton title="Leer todas" variant="ghost" onPress={markAll} />}
    >
      <ErrorBanner message={error} />
      <FlatList
        data={items}
        keyExtractor={(n) => String(n.id || n._id)}
        refreshing={loading}
        onRefresh={load}
        ListEmptyComponent={!loading ? <EmptyState text="Sin notificaciones" /> : null}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => markRead(item)}>
            <Card>
              <View style={styles.row}>
                <View
                  style={[
                    styles.dot,
                    {
                      backgroundColor:
                        item.type === 'alert'
                          ? '#dc2626'
                          : item.type === 'success'
                            ? '#16a34a'
                            : '#1d4ed8',
                    },
                  ]}
                />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.title, !item.read && styles.unread]}>
                    {item.title}
                    {item.live ? '  ● en vivo' : ''}
                  </Text>
                  {item.message ? <Text style={styles.message}>{item.message}</Text> : null}
                  <Text style={styles.date}>
                    {item.date ? new Date(item.date).toLocaleString('es-MX') : ''}
                  </Text>
                </View>
                {!item.read && <Text style={styles.badge}>Nuevo</Text>}
              </View>
            </Card>
          </TouchableOpacity>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  dot: { width: 10, height: 10, borderRadius: 5, marginTop: 6 },
  title: { fontSize: 15, color: '#334155' },
  unread: { fontWeight: '800', color: '#0f172a' },
  message: { fontSize: 13, color: '#475569', marginTop: 2 },
  date: { fontSize: 11, color: '#94a3b8', marginTop: 4 },
  badge: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1d4ed8',
    backgroundColor: '#dbeafe',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    overflow: 'hidden',
  },
});
