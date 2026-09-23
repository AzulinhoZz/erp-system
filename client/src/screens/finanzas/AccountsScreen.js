import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import CrudScreen from '../../components/CrudScreen';
import { accountsService } from '../../services/resources';

const TYPE_OPTIONS = [
  { label: 'Activo', value: 'activo' },
  { label: 'Pasivo', value: 'pasivo' },
  { label: 'Capital', value: 'capital' },
  { label: 'Ingreso', value: 'ingreso' },
  { label: 'Gasto', value: 'gasto' },
];

const fields = [
  { name: 'code', label: 'Código (ej. 1100)', type: 'text', required: true },
  { name: 'name', label: 'Nombre de la cuenta', type: 'text', required: true },
  { name: 'type', label: 'Tipo', type: 'select', options: async () => TYPE_OPTIONS },
];

const TYPE_COLOR = {
  activo: '#1d4ed8',
  pasivo: '#dc2626',
  capital: '#7c3aed',
  ingreso: '#16a34a',
  gasto: '#ea580c',
};

export default function AccountsScreen({ navigation }) {
  return (
    <CrudScreen
      title="Catálogo de cuentas"
      subtitle="Por empresa · código único · seed de 10 cuentas base"
      entityName="cuenta"
      service={accountsService}
      fields={fields}
      onBack={() => navigation.goBack()}
      readPermission="accounts:read"
      writePermission="accounts:write"
      renderRow={(account) => (
        <View style={styles.row}>
          <Text style={styles.code}>{account.code}</Text>
          <Text style={styles.name}>{account.name}</Text>
          <Text style={[styles.type, { color: TYPE_COLOR[account.type] }]}>
            {(account.type || '').toUpperCase()}
          </Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  code: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1d4ed8',
    backgroundColor: '#dbeafe',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    overflow: 'hidden',
    minWidth: 52,
    textAlign: 'center',
    marginRight: 10,
  },
  name: { flex: 1, fontSize: 15, fontWeight: '600', color: '#0f172a' },
  type: { fontSize: 11, fontWeight: '800' },
});
