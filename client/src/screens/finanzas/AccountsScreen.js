import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import CrudScreen from '../../components/CrudScreen';
import { accountsService } from '../../services/resources';
import { Badge } from '../../components/ui/Badge';
import { colors, typography, spacing } from '../../theme';

const TYPE_OPTIONS = [
  { label: 'Activo', value: 'activo' },
  { label: 'Pasivo', value: 'pasivo' },
  { label: 'Capital', value: 'capital' },
  { label: 'Ingreso', value: 'ingreso' },
  { label: 'Gasto', value: 'gasto' },
];

const fields = [
  { name: 'code', label: 'Código contable (ej. 1000, 1100)', type: 'text', required: true },
  { name: 'name', label: 'Nombre de la cuenta', type: 'text', required: true },
  { name: 'type', label: 'Tipo de cuenta', type: 'select', options: async () => TYPE_OPTIONS },
];

const TYPE_BADGE_VARIANT = {
  activo: 'info',
  pasivo: 'danger',
  capital: 'neutral',
  ingreso: 'success',
  gasto: 'warning',
};

const columns = [
  {
    key: 'code',
    title: 'Código',
    sortable: true,
    render: (account) => <Badge label={account.code} variant="info" />,
  },
  {
    key: 'name',
    title: 'Nombre de la Cuenta',
    sortable: true,
    render: (account) => (
      <Text style={styles.nameText}>{account.name}</Text>
    ),
  },
  {
    key: 'type',
    title: 'Tipo Contable',
    sortable: true,
    render: (account) => {
      const variant = TYPE_BADGE_VARIANT[account.type] || 'neutral';
      return (
        <Badge
          label={(account.type || '').toUpperCase()}
          variant={variant}
          dot
        />
      );
    },
  },
];

export default function AccountsScreen({ navigation }) {
  return (
    <CrudScreen
      title="Catálogo de Cuentas"
      subtitle="Catálogo de cuentas contables por empresa para registro de partida doble"
      entityName="cuenta"
      service={accountsService}
      fields={fields}
      columns={columns}
      onBack={navigation.canGoBack() ? () => navigation.goBack() : undefined}
      readPermission="accounts:read"
      writePermission="accounts:write"
    />
  );
}

const styles = StyleSheet.create({
  nameText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
});
