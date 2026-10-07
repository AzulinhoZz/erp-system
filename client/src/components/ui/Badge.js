import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing, radius } from '../../theme';

/**
 * Enterprise Status Badge.
 *
 * Variants: 'success' | 'warning' | 'danger' | 'info' | 'neutral'
 */
export function Badge({
  label,
  variant = 'neutral',
  dot = false,
  size = 'md',
  style,
  textStyle,
}) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return {
          bg: colors.greenSubtle,
          border: colors.greenLight,
          text: colors.greenDark,
          dot: colors.green,
        };
      case 'warning':
        return {
          bg: colors.warningSubtle,
          border: colors.warningBorder,
          text: colors.warningDark,
          dot: colors.warning,
        };
      case 'danger':
        return {
          bg: colors.dangerSubtle,
          border: colors.dangerBorder,
          text: colors.dangerDark,
          dot: colors.danger,
        };
      case 'info':
        return {
          bg: colors.infoSubtle,
          border: colors.infoBorder,
          text: colors.info,
          dot: colors.info,
        };
      default:
        return {
          bg: colors.surfaceSelected,
          border: colors.border,
          text: colors.textSecondary,
          dot: colors.textMuted,
        };
    }
  };

  const current = getVariantStyles();

  return (
    <View
      style={[
        styles.badge,
        styles[`size_${size}`],
        { backgroundColor: current.bg, borderColor: current.border },
        style,
      ]}
    >
      {dot ? (
        <View style={[styles.dot, { backgroundColor: current.dot }]} />
      ) : null}
      <Text
        style={[
          styles.text,
          styles[`text_${size}`],
          { color: current.text },
          textStyle,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: radius.full,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: spacing.xs,
  },
  size_sm: {
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 2,
  },
  size_md: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  text: {
    fontWeight: typography.weights.semibold,
  },
  text_sm: {
    fontSize: typography.sizes.xs - 1,
  },
  text_md: {
    fontSize: typography.sizes.xs,
  },
});

export default Badge;
