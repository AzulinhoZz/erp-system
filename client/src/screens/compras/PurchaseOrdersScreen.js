import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Screen, Card, AppButton, EmptyState, ErrorBanner } from '../../components/ui';
import OrderEditor from '../../components/OrderEditor';
import { purchaseOrdersService, suppliersService } from '../../services/resources';
import { usePermission } from '../../hooks/usePermission';
import { apiErrorMessage } from '../../services/api';
import { formatMoney } from '../../utils/money';

const STATUS_LABEL = {
  draft: 'Borrador',
  confirmed: 'Confirmada',
  received: 'Recibida',
  invoiced: 'Facturada',
  cancelled: 'Cancelada',
};

export default function PurchaseOrdersScreen({ navigation }) {
  // Hooks run unconditionally — no short-circuit before a hook call
  const isSuperAdmin = usePermission('*');
  const hasWrite = usePermission('purchaseOrders:write');
  const canWrite = isSuperAdmin || hasWrite;
  const canReceive = canWrite;

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editorOpen, setEditorOpen] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await purchaseOrdersService.list({ limit: 50 });
      setOrders(data.items || []);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const receive = async (order) => {
    setBusyId(order.id || order._id);
    setError('');
    try {
      await purchaseOrdersService.receive(order.id || order._id, {
        warehouseId: order.warehouseId?._id || order.warehouseId || undefined,
      });
      await load();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Screen
      title="Órdenes de compra"
      subtitle="Recibir = transacción: movimientos de entrada + stock"
      onBack={() => navigation.goBack()}
      headerRight={
        canWrite ? <AppButton title="+ Nueva OC" onPress={() => setEditorOpen(true)} /> : null
      }
    >
      <ErrorBanner message={error} />
      <FlatList
        data={orders}
        keyExtractor={(o) => o.id || o._id}
        refreshing={loading}
        onRefresh={load}
        ListEmptyComponent={!loading ? <EmptyState text="No hay órdenes de compra" /> : null}
        renderItem={({ item }) => (
          <Card>
            <View style={styles.row}>
              <Text style={styles.supplier}>{item.supplierId?.name || 'Proveedor'}</Text>
              <Text style={styles.total}>{formatMoney(item.total)}</Text>
            </View>
            <Text style={styles.meta}>
              {new Date(item.date).toLocaleDateString('es-MX')} ·{' '}
              {item.items?.length || 0} renglón(es) ·{' '}
              {item.warehouseId?.name || 'sin bodega'}
            </Text>
            <View style={styles.footer}>
              <Text style={[styles.status, item.status === 'received' && styles.statusOk]}>
                {STATUS_LABEL[item.status] || item.status}
              </Text>
              {canReceive && ['draft', 'confirmed'].includes(item.status) && (
                <AppButton
                  title={busyId === (item.id || item._id) ? 'Recibiendo…' : 'Recibir'}
                  variant="primary"
                  disabled={busyId !== null}
                  onPress={() => receive(item)}
                />
              )}
            </View>
          </Card>
        )}
      />

      <OrderEditor
        visible={editorOpen}
        onClose={() => setEditorOpen(false)}
        onSaved={load}
        createOrder={purchaseOrdersService.create}
        partnerLabel="Proveedor"
        partnerService={suppliersService}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  supplier: { fontSize: 16, fontWeight: '700', color: '#0f172a', flex: 1 },
  total: { fontSize: 15, fontWeight: '800', color: '#1d4ed8' },
  meta: { fontSize: 12, color: '#64748b', marginTop: 4 },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  status: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400e',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    overflow: 'hidden',
  },
  statusOk: { color: '#166534', backgroundColor: '#dcfce7' },
});
