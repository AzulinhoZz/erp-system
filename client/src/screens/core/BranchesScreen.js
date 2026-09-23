import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import CrudScreen from '../../components/CrudScreen';
import { branchesService } from '../../services/resources';

const fields = [
  { name: 'name', label: 'Nombre de la sucursal', type: 'text', required: true },
  { name: 'address', label: 'Dirección', type: 'text' },
];

export default function BranchesScreen({ navigation }) {
  return (
    <CrudScreen
      title="Sucursales"
      subtitle="Las bodegas se vinculan a una sucursal"
      entityName="sucursal"
      service={branchesService}
      fields={fields}
      onBack={() => navigation.goBack()}
      readPermission="branches:read"
      writePermission="branches:write"
      renderRow={(branch) => (
        <View>
          <Text style={styles.name}>{branch.name}</Text>
          <Text style={styles.address}>{branch.address || 'Sin dirección'}</Text>
          <Text style={styles.company}>{branch.companyId?.name || ''}</Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  name: { fontSize: 16, fontWeight: '600', color: '#0f172a' },
  address: { fontSize: 13, color: '#64748b', marginTop: 2 },
  company: { fontSize: 12, color: '#1d4ed8', marginTop: 4 },
});
