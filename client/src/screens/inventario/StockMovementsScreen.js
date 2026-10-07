import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import CrudScreen from '../../components/CrudScreen';
import { stockMovementsService, productsService, warehousesService } from '../../services/resources';
import { Badge } from '../../components/ui/Badge';
import { colors, typography, spacing } from '../../theme';

const fields = [
  {
    name: 'productId',
    label: 'Producto',
    type: 'select',
    options: async () => {
      const data = await productsService.list({ limit: 100 });
      return (data.items || []).map((p) => ({
        label: `${p.sku} — ${p.name}`,
        value: p.id || p._id,
      }));
    },
  },
  {
    name: 'warehouseId',
    label: 'Bodega destino/origen',
    type: 'select',
    options: async () => {
      const data = await warehousesService.list();
      const list = Array.isArray(data) ? data : data.items;
      return list.map((w) => ({ label: w.name, value: w.id || w._id }));
    },
  },
  {
    name: 'type',
    label: 'Tipo de movimiento',
    type: 'select',
    options: async () => [
      { label: 'Entrada (in)', value: 'in' },
      { label: 'Salida (out)', value: 'out' },
      { label: 'Ajuste (+/-)', value: 'adjustment' },
    ],
  },
  { name: 'quantity', label: 'Cantidad', type: 'text' },
  { name: 'reference', label: 'Referencia / Documento (ej. OC-001, OV-002)', type: 'text' },
];

const columns = [
  {
    key: 'type',
    title: 'Tipo',
    sortable: true,
    render: (m) => (
      <Badge
        label={
          m.type === 'adjustment'
            ? `AJUSTE ${Number(m.quantity) > 0 ? '+' : '-'}`
            : m.type === 'in' ? '▲ ENTRADA' : '▼ SALIDA'
        }
        variant={m.type === 'in' || (m.type === 'adjustment' && Number(m.quantity) > 0) ? 'success' : 'danger'}
        dot
      />
    ),
  },
  {
    key: 'productId',
    title: 'Producto',
    render: (m) => (
      <View>
        <Text style={styles.productText}>
          {m.productId ? `${m.productId.sku} — ${m.productId.name}` : 'Producto'}
        </Text>
      </View>
    ),
  },
  {
    key: 'quantity',
    title: 'Cantidad',
    sortable: true,
    align: 'right',
    render: (m) => (
      <View>
        <Text style={[styles.qtyText, (m.type === 'in' || (m.type === 'adjustment' && Number(m.quantity) > 0)) ? styles.qtyIn : styles.qtyOut]}>
          {m.type === 'out' ? '-' : Number(m.quantity) > 0 ? '+' : ''}{m.quantity} {m.productId?.unit || ''}
        </Text>
        {Number.isFinite(m.previousStock) && Number.isFinite(m.newStock) ? (
          <Text style={styles.metaText}>Existencia: {m.previousStock} → {m.newStock}</Text>
        ) : null}
      </View>
    ),
  },
  {
    key: 'warehouseId',
    title: 'Bodega',
    render: (m) => <Text style={styles.metaText}>{m.warehouseId?.name || '—'}</Text>,
  },
  {
    key: 'userId',
    title: 'Usuario',
    render: (m) => <Text style={styles.metaText}>{m.userId?.name || '—'}</Text>,
  },
  {
    key: 'reference',
    title: 'Referencia / Fecha',
    sortable: true,
    render: (m) => (
      <View>
        <Text style={styles.refText}>{m.reference || 'Ajuste manual'}</Text>
        <Text style={styles.dateText}>
          {m.date ? new Date(m.date).toLocaleDateString('es-MX') : ''}
        </Text>
      </View>
    ),
  },
];

export default function StockMovementsScreen({ navigation }) {
  return (
    <CrudScreen
      title="Movimientos de Stock"
      subtitle="Kardex e historial inmutable de entradas y salidas con transacciones ACID"
      entityName="movimiento"
      service={stockMovementsService}
      fields={fields}
      columns={columns}
      onBack={navigation.canGoBack() ? () => navigation.goBack() : undefined}
      readPermission="stock:read"
      writePermission="stock:write"
      editable={false}
      rowActions={(movement) => [{
        label: 'Revertir',
        variant: 'danger',
        visible: !movement.reversalOf && !movement.isReversed,
        confirmTitle: 'Revertir movimiento',
        confirmMessage: 'Se registrará un movimiento compensatorio y se actualizará la existencia. El historial original no se eliminará.',
        confirmLabel: 'Revertir',
        successMessage: 'Reversión registrada correctamente.',
        run: (item) => stockMovementsService.reverse(item.id || item._id),
      }]}
      mapFromForm={(form) => ({
        ...form,
        quantity: Number(form.quantity),
      })}
    />
  );
}

const styles = StyleSheet.create({
  productText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  qtyText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.extrabold,
  },
  qtyIn: {
    color: colors.greenDark,
  },
  qtyOut: {
    color: colors.dangerDark,
  },
  metaText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  refText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.primary,
  },
  dateText: {
    fontSize: typography.sizes.xs - 1,
    color: colors.textMuted,
  },
});
