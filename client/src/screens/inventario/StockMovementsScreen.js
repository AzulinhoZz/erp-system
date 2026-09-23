import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import CrudScreen from '../../components/CrudScreen';
import { stockMovementsService, productsService, warehousesService } from '../../services/resources';

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
    label: 'Bodega',
    type: 'select',
    options: async () => {
      const data = await warehousesService.list();
      const list = Array.isArray(data) ? data : data.items;
      return list.map((w) => ({ label: w.name, value: w.id || w._id }));
    },
  },
  {
    name: 'type',
    label: 'Tipo',
    type: 'select',
    options: async () => [
      { label: 'Entrada (in)', value: 'in' },
      { label: 'Salida (out)', value: 'out' },
    ],
  },
  { name: 'quantity', label: 'Cantidad', type: 'text' },
  { name: 'reference', label: 'Referencia (ej. OC-001)', type: 'text' },
];

export default function StockMovementsScreen({ navigation }) {
  return (
    <CrudScreen
      title="Movimientos de stock"
      subtitle="Libro append-only: entrada/salida con transacción ACID"
      entityName="movimiento"
      service={stockMovementsService}
      fields={fields}
      onBack={() => navigation.goBack()}
      readPermission="stock:read"
      writePermission="stock:write"
      mapFromForm={(form) => ({
        ...form,
        quantity: Number(form.quantity),
      })}
      renderRow={(m) => (
        <View>
          <View style={styles.row}>
            <Text style={[styles.type, m.type === 'in' ? styles.in : styles.out]}>
              {m.type === 'in' ? '▲ ENTRADA' : '▼ SALIDA'}
            </Text>
            <Text style={styles.qty}>
              {m.quantity} {m.productId?.unit || ''}
            </Text>
          </View>
          <Text style={styles.product}>
            {m.productId ? `${m.productId.sku} — ${m.productId.name}` : 'Producto'}
          </Text>
          <Text style={styles.meta}>
            {m.warehouseId?.name || ''} {m.reference ? `· ${m.reference}` : ''}{' '}
            {m.date ? `· ${new Date(m.date).toLocaleDateString('es-MX')}` : ''}
          </Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  type: { fontSize: 12, fontWeight: '800' },
  in: { color: '#16a34a' },
  out: { color: '#dc2626' },
  qty: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  product: { fontSize: 15, fontWeight: '600', color: '#0f172a', marginTop: 4 },
  meta: { fontSize: 12, color: '#64748b', marginTop: 2 },
});
