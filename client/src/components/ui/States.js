import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { colors, typography, spacing, radius } from '../../theme';
import { Button } from './Button';

/**
 * Loading State indicator.
 */
export function LoadingState({ message = 'Cargando información...' }) {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.loadingText}>{message}</Text>
    </View>
  );
}

/**
 * Empty State indicator.
 */
export function EmptyState({
  title = 'Sin información',
  text = 'No hay registros disponibles en este momento.',
  icon = '📂',
  actionLabel,
  onAction,
}) {
  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>{icon}</Text>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyText}>{text}</Text>
      {onAction && actionLabel ? (
        <View style={styles.actionRow}>
          <Button title={actionLabel} onPress={onAction} variant="primary" size="sm" />
        </View>
      ) : null}
    </View>
  );
}

/**
 * Error Banner for inline forms and modal alerts.
 */
export function ErrorBanner({ message, onRetry }) {
  if (!message) return null;
  return (
    <View style={styles.errorBanner}>
      <View style={styles.errorContent}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorText}>{message}</Text>
      </View>
      {onRetry ? (
        <Button title="Reintentar" variant="danger" size="sm" onPress={onRetry} />
      ) : null}
    </View>
  );
}

/**
 * Full page Error State.
 */
export function ErrorState({
  title = 'Ocurrió un error',
  message = 'No fue posible cargar la información. Inténtalo de nuevo más tarde.',
  onRetry,
}) {
  return (
    <View style={styles.errorStateContainer}>
      <Text style={styles.errorStateIcon}>🚫</Text>
      <Text style={styles.errorStateTitle}>{title}</Text>
      <Text style={styles.errorStateMessage}>{message}</Text>
      {onRetry ? (
        <View style={styles.actionRow}>
          <Button title="Reintentar" onPress={onRetry} variant="primary" />
        </View>
      ) : null}
    </View>
  );
}

/**
 * Simple Skeleton loader line.
 */
export function Skeleton({ width = '100%', height = 20, style }) {
  return (
    <View
      style={[
        styles.skeleton,
        { width, height, borderRadius: radius.sm },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    padding: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    fontWeight: typography.weights.medium,
  },
  emptyContainer: {
    padding: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    fontSize: 36,
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: 4,
  },
  emptyText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 320,
  },
  actionRow: {
    marginTop: spacing.md,
  },
  errorBanner: {
    backgroundColor: colors.dangerSubtle,
    borderColor: colors.dangerBorder,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  errorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.sm,
  },
  errorIcon: {
    fontSize: typography.sizes.md,
    marginRight: spacing.xs,
  },
  errorText: {
    color: colors.dangerDark,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    flex: 1,
  },
  errorStateContainer: {
    padding: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorStateIcon: {
    fontSize: 42,
    marginBottom: spacing.sm,
  },
  errorStateTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: 4,
  },
  errorStateMessage: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 360,
  },
  skeleton: {
    backgroundColor: colors.border,
    opacity: 0.6,
  },
});

export default {
  LoadingState,
  EmptyState,
  ErrorBanner,
  ErrorState,
  Skeleton,
};
