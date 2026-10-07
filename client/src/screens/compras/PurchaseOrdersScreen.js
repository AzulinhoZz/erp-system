import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Screen, Button, DataTable, Badge, ErrorBanner } from '../../components/ui';
import OrderEditor from '../../components/OrderEditor';
import { purchaseOrdersService, suppliersService } from '../../services/resources';
import { usePermission } from '../../hooks/usePermission';
import { apiErrorMessage } from '../../services/api';
import { formatMoney } from '../../utils/money';
import { colors, typography, spacing } from '../../theme';

const STATUS_CONFIG = {
  draft: { label: 'Borrador', variant: 'warning' },
  confirmed: { label: 'Confirmada', variant: 'info' },
  received: { label: 'Recibida ✓', variant: 'success' },
  invoiced: { label: 'Facturada', variant: 'neutral' },
  cancelled: { label: 'Cancelada', variant: 'danger' },
};

export default function PurchaseOrdersScreen({ navigation }) {
  const isSuperAdmin = usePermission('*');
  const hasWrite = usePermission('purchaseOrders:write');
  const canWrite = isSuperAdmin || hasWrite;

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editorOpen, setEditorOpen] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await purchaseOrdersService.list({ limit: 100 });
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

  const columns = [
    {
      key: 'status',
      title: 'Estado',
      sortable: true,
      render: (item) => {
        const conf = STATUS_CONFIG[item.status] || { label: item.status, variant: 'neutral' };
        return <Badge label={conf.label} variant={conf.variant} dot />;
      },
    },
    {
      key: 'supplierId',
      title: 'Proveedor',
      sortable: true,
      render: (item) => (
        <Text style={styles.supplierText}>
          {item.supplierId?.name || 'Proveedor'}
        </Text>
      ),
    },
    {
      key: 'date',
      title: 'Fecha / Bodega',
      sortable: true,
      render: (item) => (
        <View>
          <Text style={styles.dateText}>
            {item.date ? new Date(item.date).toLocaleDateString('es-MX') : ''} · {item.items?.length || 0} renglón(es)
          </Text>
          <Text style={styles.warehouseText}>{item.warehouseId?.name || 'Sin bodega'}</Text>
        </View>
      ),
    },
    {
      key: 'total',
      title: 'Total',
      sortable: true,
      align: 'right',
      render: (item) => (
        <Text style={styles.totalText}>{formatMoney(item.total)}</Text>
      ),
    },
  ];

  return (
    <Screen
      title="Órdenes de Compra"
      subtitle="Recepción de inventario con transacción ACID y póliza contable automática"
      onBack={navigation.canGoBack() ? () => navigation.goBack() : undefined}
      headerRight={
        canWrite ? (
          <Button title="+ Nueva OC" onPress={() => setEditorOpen(true)} size="md" />
        ) : null
      }
    >
      <ErrorBanner message={error} />

      <DataTable
        columns={columns}
        data={orders}
        loading={loading}
        searchable={true}
        searchPlaceholder="Buscar orden de compra..."
        emptyText="No hay órdenes de compra registradas"
        actionHeader="Acciones"
        renderActions={(item) => {
          const id = item.id || item._id;
          const isPending = ['draft', 'confirmed'].includes(item.status);
          if (!canWrite || !isPending) return null;

          return (
            <Button
              title={busyId === id ? 'Recibiendo…' : 'Recibir'}
              variant="primary"
              size="sm"
              loading={busyId === id}
              disabled={busyId !== null}
              onPress={() => receive(item)}
            />
          );
        }}
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
  supplierText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  dateText: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
  },
  warehouseText: {
    fontSize: typography.sizes.xs - 1,
    color: colors.textMuted,
  },
  totalText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.extrabold,
    color: colors.primary,
  },
});
