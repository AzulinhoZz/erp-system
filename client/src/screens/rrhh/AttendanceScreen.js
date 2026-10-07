import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import CrudScreen from '../../components/CrudScreen';
import { attendanceService, employeesService } from '../../services/resources';
import { Badge } from '../../components/ui/Badge';
import { colors, typography, spacing } from '../../theme';

const today = () => new Date().toISOString().slice(0, 10);

const fields = [
  {
    name: 'employeeId',
    label: 'Empleado',
    type: 'select',
    options: async () => {
      const data = await employeesService.list({ limit: 100 });
      return (data.items || []).map((e) => ({
        label: `${e.name} — ${e.position}`,
        value: e.id || e._id,
      }));
    },
  },
  { name: 'date', label: 'Fecha (AAAA-MM-DD)', type: 'text', required: true },
  { name: 'checkIn', label: 'Hora Entrada (HH:MM)', type: 'text', placeholder: '08:00' },
  { name: 'checkOut', label: 'Hora Salida (HH:MM)', type: 'text', placeholder: '17:00' },
];

const columns = [
  {
    key: 'date',
    title: 'Fecha',
    sortable: true,
    render: (a) => (
      <Badge
        label={a.date ? new Date(a.date).toLocaleDateString('es-MX') : ''}
        variant="info"
      />
    ),
  },
  {
    key: 'employeeId',
    title: 'Empleado',
    sortable: true,
    render: (a) => (
      <View>
        <Text style={styles.nameText}>{a.employeeId?.name || 'Empleado'}</Text>
        <Text style={styles.posText}>{a.employeeId?.position || ''}</Text>
      </View>
    ),
  },
  {
    key: 'checkIn',
    title: 'Entrada / Salida',
    align: 'center',
    render: (a) => (
      <Badge
        label={`${a.checkIn || '—'} → ${a.checkOut || '—'}`}
        variant={a.checkIn && a.checkOut ? 'success' : 'warning'}
        dot
      />
    ),
  },
];

export default function AttendanceScreen({ navigation }) {
  return (
    <CrudScreen
      title="Asistencia"
      subtitle="Registro diario de entradas y salidas por colaborador"
      entityName="asistencia"
      service={attendanceService}
      fields={fields}
      columns={columns}
      onBack={navigation.canGoBack() ? () => navigation.goBack() : undefined}
      readPermission="attendance:read"
      writePermission="attendance:write"
      mapToForm={(a) => ({
        employeeId: a.employeeId?.id || a.employeeId?._id || a.employeeId || '',
        date: a.date ? new Date(a.date).toISOString().slice(0, 10) : today(),
        checkIn: a.checkIn || '',
        checkOut: a.checkOut || '',
      })}
      mapFromForm={(form) => ({
        ...form,
        date: new Date(`${form.date}T00:00:00`).toISOString(),
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
});
