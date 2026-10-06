import React from 'react';
import { FlatList, TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { Screen, EmptyState } from './ui';
import { useAuthStore } from '../store/authStore';
import { colors, typography, spacing, radius, shadows } from '../theme';

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
              style={[styles.row, shadows.sm]}
              onPress={() => navigation.navigate(item.screen)}
              activeOpacity={0.7}
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
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md + 2,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  rowSubtitle: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  chevron: {
    fontSize: typography.sizes.xl,
    color: colors.textMuted,
    fontWeight: typography.weights.bold,
  },
});
