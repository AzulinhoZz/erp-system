import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import CrudScreen from '../../components/CrudScreen';
import { rolesService } from '../../services/resources';

const fields = [
  { name: 'name', label: 'Nombre del rol', type: 'text', required: true },
  {
    name: 'permissions',
    label: 'Permisos (separados por coma)',
    type: 'text',
    placeholder: 'products:read, products:write',
  },
];

export default function RolesScreen({ navigation }) {
  return (
    <CrudScreen
      title="Roles"
      subtitle="Permisos validados por el backend en cada request"
      entityName="rol"
      service={rolesService}
      fields={fields}
      onBack={() => navigation.goBack()}
      readPermission="roles:read"
      writePermission="roles:write"
      // El formulario envía permissions como texto: lo convertimos a array
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
      renderRow={(role) => (
        <View>
          <Text style={styles.name}>{role.name}</Text>
          <Text style={styles.perms}>
            {(role.permissions || []).includes('*')
              ? '* (acceso total)'
              : (role.permissions || []).join(' · ')}
          </Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  name: { fontSize: 16, fontWeight: '600', color: '#0f172a' },
  perms: { fontSize: 12, color: '#64748b', marginTop: 6, lineHeight: 18 },
});
