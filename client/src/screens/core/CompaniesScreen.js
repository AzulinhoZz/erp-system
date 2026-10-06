import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import CrudScreen from '../../components/CrudScreen';
import { companiesService } from '../../services/resources';
import { Badge } from '../../components/ui/Badge';
import { colors, typography, spacing } from '../../theme';

const fields = [
  { name: 'name', label: 'Razón social', type: 'text', required: true },
  { name: 'taxId', label: 'RFC / Tax ID', type: 'text', required: true },
];

const columns = [
  {
    key: 'name',
    title: 'Razón Social',
    sortable: true,
    render: (comp) => (
      <View style={styles.nameCol}>
        <Text style={styles.companyIcon}>🏢</Text>
        <Text style={styles.nameText}>{comp.name}</Text>
      </View>
    ),
  },
  {
    key: 'taxId',
    title: 'RFC / Tax ID',
    sortable: true,
    render: (comp) => <Badge label={comp.taxId} variant="info" />,
  },
];

export default function CompaniesScreen({ navigation }) {
  return (
    <CrudScreen
      title="Empresas"
      subtitle="Multi-tenant: cada empresa aísla sus datos de forma segura"
      entityName="empresa"
      service={companiesService}
      fields={fields}
      columns={columns}
      onBack={navigation.canGoBack() ? () => navigation.goBack() : undefined}
      readPermission="companies:read"
      writePermission="companies:write"
    />
  );
}

const styles = StyleSheet.create({
  nameCol: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  companyIcon: {
    fontSize: typography.sizes.md,
    marginRight: spacing.xs,
  },
  nameText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
});
