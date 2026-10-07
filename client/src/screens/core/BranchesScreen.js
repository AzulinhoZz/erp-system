import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import CrudScreen from '../../components/CrudScreen';
import { branchesService } from '../../services/resources';
import { Badge } from '../../components/ui/Badge';
import { colors, typography, spacing } from '../../theme';

const fields = [
  { name: 'name', label: 'Nombre de la sucursal', type: 'text', required: true },
  { name: 'address', label: 'Dirección', type: 'text' },
];

const columns = [
  {
    key: 'name',
    title: 'Sucursal',
    sortable: true,
    render: (branch) => (
      <View style={styles.nameCol}>
        <Text style={styles.icon}>📍</Text>
        <Text style={styles.nameText}>{branch.name}</Text>
      </View>
    ),
  },
  {
    key: 'address',
    title: 'Dirección',
    sortable: true,
    render: (branch) => (
      <Text style={styles.addressText}>{branch.address || 'Sin dirección'}</Text>
    ),
  },
  {
    key: 'companyId',
    title: 'Empresa',
    render: (branch) => (
      <Badge label={branch.companyId?.name || 'Empresa Activa'} variant="neutral" />
    ),
  },
];

export default function BranchesScreen({ navigation }) {
  return (
    <CrudScreen
      title="Sucursales"
      subtitle="Las bodegas de almacén se vinculan a una sucursal"
      entityName="sucursal"
      service={branchesService}
      fields={fields}
      columns={columns}
      onBack={navigation.canGoBack() ? () => navigation.goBack() : undefined}
      readPermission="branches:read"
      writePermission="branches:write"
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
  addressText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
});
