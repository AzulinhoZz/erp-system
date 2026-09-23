import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import CrudScreen from '../../components/CrudScreen';
import { warehousesService, branchesService } from '../../services/resources';

const fields = [
  { name: 'name', label: 'Nombre de la bodega', type: 'text', required: true },
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
  { name: 'location', label: 'Ubicación / dirección', type: 'text' },
];

export default function WarehousesScreen({ navigation }) {
  return (
    <CrudScreen
      title="Bodegas"
      subtitle="Cada bodega pertenece a una sucursal"
      entityName="bodega"
      service={warehousesService}
      fields={fields}
      onBack={() => navigation.goBack()}
      readPermission="stock:read"
      writePermission="stock:write"
      renderRow={(w) => (
        <View>
          <Text style={styles.name}>{w.name}</Text>
          <Text style={styles.meta}>
            {w.branchId?.name || 'Sin sucursal'} {w.location ? `· ${w.location}` : ''}
          </Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  name: { fontSize: 16, fontWeight: '600', color: '#0f172a' },
  meta: { fontSize: 13, color: '#64748b', marginTop: 2 },
});
