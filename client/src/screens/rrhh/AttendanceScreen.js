import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import CrudScreen from '../../components/CrudScreen';
import { attendanceService, employeesService } from '../../services/resources';

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
  { name: 'date', label: 'Fecha (YYYY-MM-DD)', type: 'text', required: true },
  { name: 'checkIn', label: 'Entrada (HH:MM)', type: 'text', placeholder: '08:00' },
  { name: 'checkOut', label: 'Salida (HH:MM)', type: 'text', placeholder: '17:00' },
];

export default function AttendanceScreen({ navigation }) {
  return (
    <CrudScreen
      title="Asistencia"
      subtitle="Un registro por empleado/día · re-registrar actualiza las marcas"
      entityName="asistencia"
      service={attendanceService}
      fields={fields}
      onBack={() => navigation.goBack()}
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
      renderRow={(a) => (
        <View>
          <View style={styles.row}>
            <Text style={styles.name}>{a.employeeId?.name || 'Empleado'}</Text>
            <Text style={styles.marks}>
              {a.checkIn || '—'} → {a.checkOut || '—'}
            </Text>
          </View>
          <Text style={styles.meta}>
            {new Date(a.date).toLocaleDateString('es-MX')} ·{' '}
            {a.employeeId?.position || ''}
          </Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 16, fontWeight: '700', color: '#0f172a', flex: 1 },
  marks: { fontSize: 14, fontWeight: '700', color: '#1d4ed8' },
  meta: { fontSize: 13, color: '#64748b', marginTop: 4 },
});
