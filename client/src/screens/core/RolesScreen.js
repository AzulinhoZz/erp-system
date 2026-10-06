import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import CrudScreen from '../../components/CrudScreen';
import { rolesService } from '../../services/resources';
import { Badge } from '../../components/ui/Badge';
import { colors, typography, spacing } from '../../theme';

const fields = [
  { name: 'name', label: 'Nombre del rol', type: 'text', required: true },
  {
    name: 'permissions',
    label: 'Permisos (separados por coma)',
    type: 'text',
    placeholder: 'products:read, products:write, salesOrders:read',
  },
];

const columns = [
  {
    key: 'name',
    title: 'Rol',
    sortable: true,
    render: (role) => (
      <View style={styles.roleCol}>
        <Text style={styles.icon}>🛡️</Text>
        <Text style={styles.roleName}>{role.name}</Text>
      </View>
    ),
  },
  {
    key: 'permissions',
    title: 'Permisos Asignados',
    render: (role) => {
      const perms = role.permissions || [];
      if (perms.includes('*')) {
        return <Badge label="* (Acceso Total / Super Admin)" variant="success" dot />;
      }
      return (
        <View style={styles.badgeRow}>
          {perms.slice(0, 4).map((p) => (
            <Badge key={p} label={p} variant="neutral" size="sm" />
          ))}
          {perms.length > 4 ? (
            <Badge label={`+${perms.length - 4} más`} variant="info" size="sm" />
          ) : null}
        </View>
      );
    },
  },
];

export default function RolesScreen({ navigation }) {
  return (
    <CrudScreen
      title="Roles y Permisos"
      subtitle="Definición de roles y matrices de permisos validados en el backend"
      entityName="rol"
      service={rolesService}
      fields={fields}
      columns={columns}
      onBack={navigation.canGoBack() ? () => navigation.goBack() : undefined}
      readPermission="roles:read"
      writePermission="roles:write"
      mapToForm={(role) => ({
        name: role.name,
        permissions: (role.permissions || []).join(', '),
      })}
      mapFromForm={(form) => ({
        name: form.name,
        permissions: String(form.permissions || '')
          .split(',')
          .map((p) => p.trim())
          .filter(Boolean),
      })}
    />
  );
}

const styles = StyleSheet.create({
  roleCol: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    fontSize: typography.sizes.md,
    marginRight: spacing.xs,
  },
  roleName: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
});
