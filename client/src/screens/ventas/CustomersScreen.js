import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import CrudScreen from '../../components/CrudScreen';
import { customersService } from '../../services/resources';
import { formatMoney, toDecimalString, decimalToNumber } from '../../utils/money';
import { Badge } from '../../components/ui/Badge';
import { colors, typography, spacing } from '../../theme';

const fields = [
  { name: 'name', label: 'Nombre / Razón social', type: 'text', required: true },
  { name: 'taxId', label: 'RFC / Tax ID', type: 'text', required: true },
  { name: 'contact', label: 'Contacto (teléfono / email)', type: 'text' },
  { name: 'creditLimit', label: 'Línea de crédito ($) (0 = sin límite)', type: 'text', placeholder: '0.00' },
];

const columns = [
  {
    key: 'name',
    title: 'Cliente',
    sortable: true,
    render: (c) => (
      <View style={styles.nameCol}>
        <Text style={styles.icon}>👥</Text>
        <Text style={styles.nameText}>{c.name}</Text>
      </View>
    ),
  },
  {
    key: 'taxId',
    title: 'RFC / Tax ID',
    sortable: true,
    render: (c) => <Badge label={c.taxId} variant="info" />,
  },
  {
    key: 'contact',
    title: 'Contacto',
    sortable: true,
    render: (c) => <Text style={styles.contactText}>{c.contact || '—'}</Text>,
  },
  {
    key: 'creditLimit',
    title: 'Línea de Crédito',
    sortable: true,
    align: 'right',
    render: (c) => (
      <Text style={styles.creditText}>{formatMoney(c.creditLimit)}</Text>
    ),
  },
];

export default function CustomersScreen({ navigation }) {
  return (
    <CrudScreen
      title="Clientes"
      subtitle="Catálogo de clientes y control de límite de crédito autorizado"
      entityName="cliente"
      service={customersService}
      fields={fields}
      columns={columns}
      onBack={navigation.canGoBack() ? () => navigation.goBack() : undefined}
      readPermission="customers:read"
      writePermission="customers:write"
      mapToForm={(c) => ({
        name: c.name || '',
        taxId: c.taxId || '',
        contact: c.contact || '',
        creditLimit: decimalToNumber(c.creditLimit).toFixed(2),
      })}
      mapFromForm={(form) => ({
        ...form,
        creditLimit: toDecimalString(form.creditLimit || 0),
      })}
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
    color: colors.textSecondary,
  },
  creditText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.greenDark,
  },
});
