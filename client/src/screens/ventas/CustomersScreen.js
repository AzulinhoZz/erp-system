import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import CrudScreen from '../../components/CrudScreen';
import { customersService } from '../../services/resources';
import { formatMoney, toDecimalString, decimalToNumber } from '../../utils/money';

const fields = [
  { name: 'name', label: 'Nombre / Razón social', type: 'text', required: true },
  { name: 'taxId', label: 'RFC / Tax ID', type: 'text', required: true },
  { name: 'contact', label: 'Contacto (tel/email)', type: 'text' },
  { name: 'creditLimit', label: 'Línea de crédito (0 = sin límite)', type: 'text', placeholder: '0.00' },
];

export default function CustomersScreen({ navigation }) {
  return (
    <CrudScreen
      title="Clientes"
      subtitle="La línea de crédito se valida al confirmar una orden"
      entityName="cliente"
      service={customersService}
      fields={fields}
      onBack={() => navigation.goBack()}
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
      renderRow={(c) => (
        <View>
          <View style={styles.row}>
            <Text style={styles.name}>{c.name}</Text>
            <Text style={styles.credit}>{formatMoney(c.creditLimit)}</Text>
          </View>
          <Text style={styles.tax}>{c.taxId}</Text>
          {c.contact ? <Text style={styles.contact}>{c.contact}</Text> : null}
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 16, fontWeight: '600', color: '#0f172a', flex: 1 },
  credit: { fontSize: 13, fontWeight: '700', color: '#16a34a' },
  tax: { fontSize: 13, color: '#64748b', marginTop: 2 },
  contact: { fontSize: 13, color: '#1d4ed8', marginTop: 4 },
});
