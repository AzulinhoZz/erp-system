import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing, radius, shadows } from '../../theme';

/**
 * Enterprise Card container.
 */
export function Card({ children, style, elevation = 'sm', accentColor }) {
  return (
    <View
      style={[
        styles.card,
        shadows[elevation] || shadows.sm,
        accentColor ? { borderLeftWidth: 4, borderLeftColor: accentColor } : null,
        style,
      ]}
    >
      {children}
    </View>
  );
}

/**
 * Enterprise KPI Card component for executive dashboards.
 */
export function KPICard({
  title,
  value,
  change,
  isPositive = true,
  period = 'vs periodo anterior',
  icon,
  accentColor = colors.primary,
  style,
}) {
  return (
    <Card style={[styles.kpiCard, style]} accentColor={accentColor}>
      <View style={styles.kpiHeader}>
        <Text style={styles.kpiTitle} numberOfLines={1}>
          {title}
        </Text>
        {icon ? <View style={styles.kpiIconWrapper}>{icon}</View> : null}
      </View>
      <Text style={styles.kpiValue}>{value}</Text>
      {change !== undefined ? (
        <View style={styles.kpiFooter}>
          <View
            style={[
              styles.changeBadge,
              isPositive ? styles.changePos : styles.changeNeg,
            ]}
          >
            <Text
              style={[
                styles.changeText,
                isPositive ? styles.changeTextPos : styles.changeTextNeg,
              ]}
            >
              {isPositive ? '▲ ' : '▼ '}
              {change}
            </Text>
          </View>
          <Text style={styles.periodText}>{period}</Text>
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  kpiCard: {
    flex: 1,
    minWidth: 200,
  },
  kpiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  kpiTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  kpiIconWrapper: {
    padding: spacing.xs,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceSelected,
  },
  kpiValue: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.extrabold,
    color: colors.text,
    marginVertical: spacing.xs,
  },
  kpiFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  changeBadge: {
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 2,
    borderRadius: radius.full,
    marginRight: spacing.xs,
  },
  changePos: {
    backgroundColor: colors.greenSubtle,
  },
  changeNeg: {
    backgroundColor: colors.dangerSubtle,
  },
  changeText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
  changeTextPos: {
    color: colors.greenDark,
  },
  changeTextNeg: {
    color: colors.dangerDark,
  },
  periodText: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
  },
});

export default Card;
