import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import CrudScreen from '../../components/CrudScreen';
import { suppliersService } from '../../services/resources';
import { Badge } from '../../components/ui/Badge';
import { colors, typography, spacing } from '../../theme';

const fields = [
  { name: 'name', label: 'Nombre / Razón social', type: 'text', required: true },
  { name: 'taxId', label: 'RFC / Tax ID', type: 'text', required: true },
  { name: 'contact', label: 'Contacto (teléfono / email)', type: 'text' },
];

const columns = [
  {
    key: 'name',
    title: 'Proveedor',
    sortable: true,
    render: (s) => (
      <View style={styles.nameCol}>
        <Text style={styles.icon}>🚚</Text>
        <Text style={styles.nameText}>{s.name}</Text>
      </View>
    ),
  },
  {
    key: 'taxId',
    title: 'RFC / Tax ID',
    sortable: true,
    render: (s) => <Badge label={s.taxId} variant="info" />,
  },
  {
    key: 'contact',
    title: 'Contacto',
    sortable: true,
    render: (s) => (
      <Text style={styles.contactText}>{s.contact || '—'}</Text>
    ),
  },
];

export default function SuppliersScreen({ navigation }) {
  return (
    <CrudScreen
      title="Proveedores"
      subtitle="Catálogo oficial de proveedores autorizados de la empresa"
      entityName="proveedor"
      service={suppliersService}
      fields={fields}
      columns={columns}
      onBack={navigation.canGoBack() ? () => navigation.goBack() : undefined}
      readPermission="suppliers:read"
      writePermission="suppliers:write"
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
  contactText: {
    fontSize: typography.sizes.sm,
    color: colors.primary,
  },
});
