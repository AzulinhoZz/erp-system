import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import CrudScreen from '../../components/CrudScreen';
import { employeesService, branchesService } from '../../services/resources';
import { formatMoney, toDecimalString, decimalToNumber } from '../../utils/money';
import { Badge } from '../../components/ui/Badge';
import { colors, typography, spacing } from '../../theme';

const fields = [
  { name: 'name', label: 'Nombre completo', type: 'text', required: true },
  { name: 'position', label: 'Puesto / Cargo', type: 'text', required: true },
  {
    name: 'branchId',
    label: 'Sucursal de adscripción',
    type: 'select',
    options: async () => {
      const data = await branchesService.list();
      const list = Array.isArray(data) ? data : data.items;
      return list.map((b) => ({ label: b.name, value: b.id || b._id }));
    },
  },
  { name: 'salary', label: 'Salario base mensual ($)', type: 'text', placeholder: '0.00', required: true },
];

const columns = [
  {
    key: 'name',
    title: 'Empleado',
    sortable: true,
    render: (e) => (
      <View>
        <Text style={styles.nameText}>{e.name}</Text>
        <Text style={styles.posText}>{e.position}</Text>
      </View>
    ),
  },
  {
    key: 'branchId',
    title: 'Sucursal',
    render: (e) => <Badge label={e.branchId?.name || 'Sin sucursal'} variant="info" />,
  },
  {
    key: 'salary',
    title: 'Salario Base Mensual',
    sortable: true,
    align: 'right',
    render: (e) => <Text style={styles.salaryText}>{formatMoney(e.salary)}</Text>,
  },
  {
    key: 'isActive',
    title: 'Estado',
    render: (e) => (
      <Badge
        label={e.isActive !== false ? 'Activo' : 'Inactivo'}
        variant={e.isActive !== false ? 'success' : 'danger'}
        dot
      />
    ),
  },
];

export default function EmployeesScreen({ navigation }) {
  return (
    <CrudScreen
      title="Empleados"
      subtitle="Padrón de colaboradores y salarios base mensuales"
      entityName="empleado"
      service={employeesService}
      fields={fields}
      columns={columns}
      onBack={navigation.canGoBack() ? () => navigation.goBack() : undefined}
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
    />
  );
}

const styles = StyleSheet.create({
  nameText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  posText: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
  },
  salaryText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.extrabold,
    color: colors.greenDark,
  },
});
