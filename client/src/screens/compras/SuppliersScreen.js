import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import CrudScreen from '../../components/CrudScreen';
import { suppliersService } from '../../services/resources';

const fields = [
  { name: 'name', label: 'Nombre / Razón social', type: 'text', required: true },
  { name: 'taxId', label: 'RFC / Tax ID', type: 'text', required: true },
  { name: 'contact', label: 'Contacto (tel/email)', type: 'text' },
];

export default function SuppliersScreen({ navigation }) {
  return (
    <CrudScreen
      title="Proveedores"
      subtitle="Catálogo de proveedores de la empresa"
      entityName="proveedor"
      service={suppliersService}
      fields={fields}
      onBack={() => navigation.goBack()}
      readPermission="suppliers:read"
      writePermission="suppliers:write"
      renderRow={(s) => (
        <View>
          <Text style={styles.name}>{s.name}</Text>
          <Text style={styles.tax}>{s.taxId}</Text>
          {s.contact ? <Text style={styles.contact}>{s.contact}</Text> : null}
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  name: { fontSize: 16, fontWeight: '600', color: '#0f172a' },
  tax: { fontSize: 13, color: '#64748b', marginTop: 2 },
  contact: { fontSize: 13, color: '#1d4ed8', marginTop: 4 },
});
