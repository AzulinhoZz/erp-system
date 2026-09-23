import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import CrudScreen from '../../components/CrudScreen';
import { employeesService, branchesService } from '../../services/resources';
import { formatMoney, toDecimalString, decimalToNumber } from '../../utils/money';

const fields = [
  { name: 'name', label: 'Nombre completo', type: 'text', required: true },
  { name: 'position', label: 'Puesto', type: 'text', required: true },
  {
    name: 'branchId',
    label: 'Sucursal',
    type: 'select',
    options: async () => {
      const data = await branchesService.list();
      const list = Array.isArray(data) ? data : data.items;
      return list.map((b) => ({ label: b.name, value: b.id || b._id }));
    },
  },
  { name: 'salary', label: 'Salario base (mensual)', type: 'text', placeholder: '0.00', required: true },
];

export default function EmployeesScreen({ navigation }) {
  return (
    <CrudScreen
      title="Empleados"
      subtitle="El salario alimenta la nómina · Decimal128"
      entityName="empleado"
      service={employeesService}
      fields={fields}
      onBack={() => navigation.goBack()}
      readPermission="employees:read"
      writePermission="employees:write"
      mapToForm={(e) => ({
        name: e.name || '',
        position: e.position || '',
        branchId: e.branchId?.id || e.branchId?._id || e.branchId || '',
        salary: decimalToNumber(e.salary).toFixed(2),
      })}
      mapFromForm={(form) => ({
        ...form,
        salary: toDecimalString(form.salary || 0),
      })}
      renderRow={(e) => (
        <View>
          <View style={styles.row}>
            <Text style={styles.name}>{e.name}</Text>
            <Text style={styles.salary}>{formatMoney(e.salary)}</Text>
          </View>
          <Text style={styles.meta}>
            {e.position} · {e.branchId?.name || 'Sin sucursal'}
            {e.isActive === false ? ' · Inactivo' : ''}
          </Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 16, fontWeight: '700', color: '#0f172a', flex: 1 },
  salary: { fontSize: 14, fontWeight: '800', color: '#16a34a' },
  meta: { fontSize: 13, color: '#64748b', marginTop: 4 },
});
