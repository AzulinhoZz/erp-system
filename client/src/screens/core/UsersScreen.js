import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import CrudScreen from '../../components/CrudScreen';
import { usersService, rolesService } from '../../services/resources';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { colors, typography, spacing } from '../../theme';

const fields = [
  { name: 'name', label: 'Nombre completo', type: 'text', required: true },
  { name: 'email', label: 'Correo electrónico', type: 'email', required: true },
  { name: 'password', label: 'Contraseña (mín. 8 caracteres)', type: 'password' },
  {
    name: 'roleId',
    label: 'Rol de usuario',
    type: 'select',
    options: async () => {
      const roles = await rolesService.list();
      const list = Array.isArray(roles) ? roles : roles.items;
      return list.map((r) => ({ label: r.name, value: r.id || r._id }));
    },
  },
  { name: 'isActive', label: 'Cuenta Activa', type: 'switch' },
];

const columns = [
  {
    key: 'name',
    title: 'Usuario',
    sortable: true,
    render: (user) => (
      <View style={styles.userCol}>
        <Avatar name={user.name} size={30} style={{ marginRight: spacing.xs + 2 }} />
        <Text style={styles.userName}>{user.name}</Text>
      </View>
    ),
  },
  {
    key: 'email',
    title: 'Correo Electrónico',
    sortable: true,
    render: (user) => <Text style={styles.emailText}>{user.email}</Text>,
  },
  {
    key: 'role',
    title: 'Rol RBAC',
    render: (user) => {
      const roleName = user.roleId?.name || user.role?.name || 'Sin rol';
      return <Badge label={roleName} variant="info" />;
    },
  },
  {
    key: 'isActive',
    title: 'Estado',
    sortable: true,
    render: (user) => (
      <Badge
        label={user.isActive ? 'Activo' : 'Inactivo'}
        variant={user.isActive ? 'success' : 'danger'}
        dot
      />
    ),
  },
];

export default function UsersScreen({ navigation }) {
  return (
    <CrudScreen
      title="Usuarios"
      subtitle="Gestión de cuentas y asignación de roles RBAC por empresa"
      entityName="usuario"
      service={usersService}
      fields={fields}
      columns={columns}
      onBack={navigation.canGoBack() ? () => navigation.goBack() : undefined}
      readPermission="users:read"
      writePermission="users:write"
      mapFromForm={(form) => {
        const payload = { ...form };
        if (!payload.password) delete payload.password;
        return payload;
      }}
    />
  );
}

const styles = StyleSheet.create({
  userCol: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userName: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  emailText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
});
