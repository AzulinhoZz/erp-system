import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Screen, Card, Button, Badge, EmptyState, ErrorBanner } from '../../components/ui';
import { notificationsService } from '../../services/resources';
import { onEvent, connectSocket } from '../../services/sockets';
import { apiErrorMessage } from '../../services/api';
import { colors, typography, spacing } from '../../theme';

/**
 * Notifications — persisted list + LIVE events over Socket.io.
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
          title: 'Stock Bajo de Producto',
          message: `${payload.sku} — ${payload.name}: quedan ${payload.stock} unidades (mínimo: ${payload.minStock})`,
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
      subtitle={live ? 'Conectado en tiempo real (Socket.io) · SYS ERP Live' : 'Canal en tiempo real no disponible'}
      onBack={navigation.canGoBack() ? () => navigation.goBack() : undefined}
      headerRight={<Button title="Marcar todas como leídas" variant="ghost" size="sm" onPress={markAll} />}
    >
      <ErrorBanner message={error} />
      <FlatList
        data={items}
        keyExtractor={(n) => String(n.id || n._id)}
        refreshing={loading}
        onRefresh={load}
        ListEmptyComponent={!loading ? <EmptyState title="Sin notificaciones" text="No hay alertas ni mensajes pendientes en el sistema." /> : null}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => markRead(item)} activeOpacity={0.8}>
            <Card style={!item.read ? styles.unreadCard : null}>
              <View style={styles.row}>
                <View
                  style={[
                    styles.dot,
                    {
                      backgroundColor:
                        item.type === 'alert'
                          ? colors.danger
                          : item.type === 'success'
                          ? colors.green
                          : colors.primary,
                    },
                  ]}
                />
                <View style={{ flex: 1 }}>
                  <View style={styles.titleRow}>
                    <Text style={[styles.title, !item.read && styles.unreadTitle]}>
                      {item.title}
                    </Text>
                    {item.live ? (
                      <Badge label="● en vivo" variant="danger" size="sm" style={{ marginLeft: spacing.xs }} />
                    ) : null}
                  </View>
                  {item.message ? <Text style={styles.message}>{item.message}</Text> : null}
                  <Text style={styles.date}>
                    {item.date ? new Date(item.date).toLocaleString('es-MX') : ''}
                  </Text>
                </View>
                {!item.read ? <Badge label="Nuevo" variant="info" size="sm" /> : null}
              </View>
            </Card>
          </TouchableOpacity>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  unreadCard: {
    backgroundColor: colors.surfaceSelected,
    borderColor: colors.primary,
  },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  dot: { width: 10, height: 10, borderRadius: 5, marginTop: 6 },
  titleRow: { flexDirection: 'row', alignItems: 'center' },
  title: { fontSize: typography.sizes.sm, color: colors.textSecondary },
  unreadTitle: { fontWeight: typography.weights.bold, color: colors.text },
  message: { fontSize: typography.sizes.xs, color: colors.textSecondary, marginTop: 2 },
  date: { fontSize: typography.sizes.xs - 2, color: colors.textMuted, marginTop: 4 },
});
