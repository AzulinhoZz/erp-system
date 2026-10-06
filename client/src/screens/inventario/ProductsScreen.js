import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import CrudScreen from '../../components/CrudScreen';
import { productsService } from '../../services/resources';
import { formatMoney, toDecimalString } from '../../utils/money';
import { Badge } from '../../components/ui/Badge';
import { colors, typography, spacing } from '../../theme';

const fields = [
  { name: 'sku', label: 'SKU (Código único)', type: 'text', required: true },
  { name: 'name', label: 'Nombre del producto', type: 'text', required: true },
  { name: 'category', label: 'Categoría', type: 'text' },
  { name: 'unit', label: 'Unidad de medida (pcs, kg, m...)', type: 'text' },
  { name: 'cost', label: 'Costo unitario ($)', type: 'text', placeholder: '0.00' },
  { name: 'price', label: 'Precio de venta ($)', type: 'text', placeholder: '0.00' },
  { name: 'stock', label: 'Stock inicial (solo al crear)', type: 'text' },
  { name: 'minStock', label: 'Stock mínimo para alerta', type: 'text' },
];

const columns = [
  {
    key: 'sku',
    title: 'SKU',
    sortable: true,
    render: (p) => <Badge label={p.sku} variant="info" />,
  },
  {
    key: 'name',
    title: 'Producto',
    sortable: true,
    render: (p) => (
      <View>
        <Text style={styles.nameText}>{p.name}</Text>
        {p.category ? <Text style={styles.categoryText}>{p.category}</Text> : null}
      </View>
    ),
  },
  {
    key: 'cost',
    title: 'Costo',
    sortable: true,
    align: 'right',
    render: (p) => <Text style={styles.costText}>{formatMoney(p.cost)}</Text>,
  },
  {
    key: 'price',
    title: 'Precio',
    sortable: true,
    align: 'right',
    render: (p) => <Text style={styles.priceText}>{formatMoney(p.price)}</Text>,
  },
  {
    key: 'stock',
    title: 'Stock',
    sortable: true,
    align: 'center',
    render: (p) => {
      const low = p.minStock > 0 && p.stock <= p.minStock;
      return (
        <View style={styles.stockCol}>
          <Text style={[styles.stockText, low && styles.stockLowText]}>
            {p.stock} {p.unit || ''}
          </Text>
          {low ? <Badge label="⚠️ Bajo" variant="danger" size="sm" style={{ marginTop: 2 }} /> : null}
        </View>
      );
    },
  },
];

export default function ProductsScreen({ navigation }) {
  return (
    <CrudScreen
      title="Productos"
      subtitle="Catálogo, costos, precios y control de existencias en almacén"
      entityName="producto"
      service={productsService}
      fields={fields}
      columns={columns}
      onBack={navigation.canGoBack() ? () => navigation.goBack() : undefined}
      readPermission="products:read"
      writePermission="products:write"
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
    />
  );
}

const styles = StyleSheet.create({
  nameText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  categoryText: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
  },
  costText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  priceText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.primary,
  },
  stockCol: {
    alignItems: 'center',
  },
  stockText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  stockLowText: {
    color: colors.danger,
  },
});
