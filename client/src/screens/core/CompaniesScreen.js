import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import CrudScreen from '../../components/CrudScreen';
import { companiesService } from '../../services/resources';

const fields = [
  { name: 'name', label: 'Razón social', type: 'text', required: true },
  { name: 'taxId', label: 'RFC / Tax ID', type: 'text', required: true },
];

export default function CompaniesScreen({ navigation }) {
  return (
    <CrudScreen
      title="Empresas"
      subtitle="Multi-tenant: cada empresa aísla sus datos"
      entityName="empresa"
      service={companiesService}
      fields={fields}
      onBack={() => navigation.goBack()}
      readPermission="companies:read"
      writePermission="companies:write"
      renderRow={(company) => (
        <View>
          <Text style={styles.name}>{company.name}</Text>
          <Text style={styles.tax}>{company.taxId}</Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  name: { fontSize: 16, fontWeight: '600', color: '#0f172a' },
  tax: { fontSize: 13, color: '#64748b', marginTop: 2 },
});
