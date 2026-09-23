import React from 'react';
import { FlatList, TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { Screen, EmptyState } from './ui';
import { useAuthStore } from '../store/authStore';

/**
 * Module menu — first screen of every module stack.
 * Renders only the entries whose permission the role grants (UI-level RBAC;
 * the API still enforces independently).
 *
 * items: [{ key, title, subtitle, screen, permission }]
 */
export default function ModuleMenu({ title, subtitle, items, navigation, onBack }) {
  const can = useAuthStore((s) => s.can);
  const visible = items.filter((item) => !item.permission || can(item.permission) || can('*'));

  return (
    <Screen title={title} subtitle={subtitle} onBack={onBack}>
      {visible.length === 0 ? (
        <EmptyState text="No tienes permisos en este módulo" />
      ) : (
        <FlatList
          data={visible}
          keyExtractor={(item) => item.key}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.row}
              onPress={() => navigation.navigate(item.screen)}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{item.title}</Text>
                {item.subtitle ? <Text style={styles.rowSubtitle}>{item.subtitle}</Text> : null}
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowTitle: { fontSize: 16, fontWeight: '600', color: '#0f172a' },
  rowSubtitle: { fontSize: 13, color: '#64748b', marginTop: 2 },
  chevron: { fontSize: 22, color: '#94a3b8' },
});
