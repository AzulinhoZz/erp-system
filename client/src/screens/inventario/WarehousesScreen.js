import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import CrudScreen from '../../components/CrudScreen';
import { warehousesService, branchesService } from '../../services/resources';
import { Badge } from '../../components/ui/Badge';
import { colors, typography, spacing } from '../../theme';

const fields = [
  { name: 'name', label: 'Nombre de la bodega', type: 'text', required: true },
  {
    name: 'branchId',
    label: 'Sucursal perteneciente',
    type: 'select',
    options: async () => {
      const data = await branchesService.list();
      const list = Array.isArray(data) ? data : data.items;
      return list.map((b) => ({ label: b.name, value: b.id || b._id }));
    },
  },
  { name: 'location', label: 'Ubicación / referencia interna', type: 'text' },
];

const columns = [
  {
    key: 'name',
    title: 'Bodega',
    sortable: true,
    render: (w) => (
      <View style={styles.nameCol}>
        <Text style={styles.icon}>🏭</Text>
        <Text style={styles.nameText}>{w.name}</Text>
      </View>
    ),
  },
  {
    key: 'branchId',
    title: 'Sucursal',
    render: (w) => (
      <Badge label={w.branchId?.name || 'Sin sucursal'} variant="info" />
    ),
  },
  {
    key: 'location',
    title: 'Ubicación',
    sortable: true,
    render: (w) => (
      <Text style={styles.locationText}>{w.location || '—'}</Text>
    ),
  },
];

export default function WarehousesScreen({ navigation }) {
  return (
    <CrudScreen
      title="Bodegas"
      subtitle="Almacenes físicos vinculados a cada sucursal de la empresa"
      entityName="bodega"
      service={warehousesService}
      fields={fields}
      columns={columns}
      onBack={navigation.canGoBack() ? () => navigation.goBack() : undefined}
      readPermission="stock:read"
      writePermission="stock:write"
    />
  );
}

const styles = StyleSheet.create({
  nameCol: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    fontSize: typography.sizes.md,
    marginRight: spacing.xs,
  },
  nameText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  locationText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
});
