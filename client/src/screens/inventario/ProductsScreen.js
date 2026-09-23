import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import CrudScreen from '../../components/CrudScreen';
import { productsService } from '../../services/resources';
import { formatMoney, toDecimalString } from '../../utils/money';

const fields = [
  { name: 'sku', label: 'SKU', type: 'text', required: true },
  { name: 'name', label: 'Nombre', type: 'text', required: true },
  { name: 'category', label: 'Categoría', type: 'text' },
  { name: 'unit', label: 'Unidad (pcs, kg…)', type: 'text' },
  { name: 'cost', label: 'Costo', type: 'text', placeholder: '0.00' },
  { name: 'price', label: 'Precio', type: 'text', placeholder: '0.00' },
  { name: 'stock', label: 'Stock inicial (solo al crear)', type: 'text' },
  { name: 'minStock', label: 'Stock mínimo (alerta)', type: 'text' },
];

export default function ProductsScreen({ navigation }) {
  return (
    <CrudScreen
      title="Productos"
      subtitle="Costo/precio en Decimal128 · stock solo vía movimientos"
      entityName="producto"
      service={productsService}
      fields={fields}
      onBack={() => navigation.goBack()}
      readPermission="products:read"
      writePermission="products:write"
      // Dinero siempre como string decimal de 2 lugares
      mapToForm={(p) => ({
        sku: p.sku || '',
        name: p.name || '',
        category: p.category || '',
        unit: p.unit || '',
        cost: String(p.cost?.$numberDecimal ?? p.cost ?? '0'),
        price: String(p.price?.$numberDecimal ?? p.price ?? '0'),
        stock: String(p.stock ?? 0),
        minStock: String(p.minStock ?? 0),
      })}
      mapFromForm={(form) => ({
        ...form,
        cost: toDecimalString(form.cost || 0),
        price: toDecimalString(form.price || 0),
        minStock: Number(form.minStock) || 0,
      })}
      renderRow={(p) => {
        const low = p.minStock > 0 && p.stock <= p.minStock;
        return (
          <View>
            <View style={styles.row}>
              <Text style={styles.sku}>{p.sku}</Text>
              <Text style={[styles.stock, low && styles.stockLow]}>{p.stock} {p.unit}</Text>
            </View>
            <Text style={styles.name}>{p.name}</Text>
            <Text style={styles.prices}>
              {formatMoney(p.cost)} → {formatMoney(p.price)}
              {low ? '  ⚠️ stock bajo' : ''}
            </Text>
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  sku: { fontSize: 12, color: '#1d4ed8', fontWeight: '700' },
  stock: { fontSize: 13, color: '#334155', fontWeight: '600' },
  stockLow: { color: '#dc2626' },
  name: { fontSize: 16, fontWeight: '600', color: '#0f172a', marginTop: 2 },
  prices: { fontSize: 13, color: '#64748b', marginTop: 4 },
});
