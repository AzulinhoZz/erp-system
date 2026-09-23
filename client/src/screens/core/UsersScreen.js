import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import CrudScreen from '../../components/CrudScreen';
import { usersService, rolesService } from '../../services/resources';

const fields = [
  { name: 'name', label: 'Nombre', type: 'text', required: true },
  { name: 'email', label: 'Correo', type: 'email', required: true },
  { name: 'password', label: 'Contraseña (mín. 8)', type: 'password' },
  {
    name: 'roleId',
    label: 'Rol',
    type: 'select',
    options: async () => {
      const roles = await rolesService.list();
      const list = Array.isArray(roles) ? roles : roles.items;
      return list.map((r) => ({ label: r.name, value: r.id || r._id }));
    },
  },
  { name: 'isActive', label: 'Activo', type: 'switch' },
];

export default function UsersScreen({ navigation }) {
  return (
    <CrudScreen
      title="Usuarios"
      subtitle="Users de la empresa · RBAC por rol"
      entityName="usuario"
      service={usersService}
      fields={fields}
      onBack={() => navigation.goBack()}
      readPermission="users:read"
      writePermission="users:write"
      // Al editar sin contraseña nueva, no se envía el campo password
      mapFromForm={(form) => {
        const payload = { ...form };
        if (!payload.password) delete payload.password;
        return payload;
      }}
      renderRow={(user) => (
        <View>
          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.email}>{user.email}</Text>
          <View style={styles.row}>
            <Text style={styles.badge}>{user.roleId?.name || user.role?.name || 'Sin rol'}</Text>
            <Text style={[styles.badge, user.isActive ? styles.ok : styles.off]}>
              {user.isActive ? 'Activo' : 'Inactivo'}
            </Text>
          </View>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  name: { fontSize: 16, fontWeight: '600', color: '#0f172a' },
  email: { fontSize: 13, color: '#64748b', marginTop: 2 },
  row: { flexDirection: 'row', gap: 8, marginTop: 8 },
  badge: {
    fontSize: 12,
    backgroundColor: '#e2e8f0',
    color: '#334155',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    overflow: 'hidden',
  },
  ok: { backgroundColor: '#dcfce7', color: '#166534' },
  off: { backgroundColor: '#fee2e2', color: '#991b1b' },
});
