import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  View,
} from 'react-native';
import { colors, typography, spacing, radius, shadows } from '../../theme';

/**
 * Enterprise SYS ERP Button component.
 *
 * Variants: 'primary' | 'secondary' | 'success' | 'danger' | 'ghost' | 'outline'
 * Sizes: 'sm' | 'md' | 'lg'
 */
export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  leftIcon = null,
  rightIcon = null,
  style,
  textStyle,
}) {
  const getContainerStyle = () => {
    const base = [styles.button, styles[`size_${size}`]];

    switch (variant) {
      case 'primary':
        base.push(styles.btnPrimary);
        break;
      case 'success':
        base.push(styles.btnSuccess);
        break;
      case 'danger':
        base.push(styles.btnDanger);
        break;
      case 'secondary':
        base.push(styles.btnSecondary);
        break;
      case 'outline':
        base.push(styles.btnOutline);
        break;
      case 'ghost':
        base.push(styles.btnGhost);
        break;
      default:
        base.push(styles.btnPrimary);
    }

    if (disabled) base.push(styles.disabled);
    return base;
  };

  const getTextStyle = () => {
    const base = [styles.text, styles[`text_${size}`]];

    switch (variant) {
      case 'primary':
      case 'success':
      case 'danger':
        base.push(styles.textLight);
        break;
      case 'secondary':
        base.push(styles.textSecondary);
        break;
      case 'outline':
        base.push(styles.textOutline);
        break;
      case 'ghost':
        base.push(styles.textGhost);
        break;
      default:
        base.push(styles.textLight);
    }

    return base;
  };

  const loaderColor =
    variant === 'primary' || variant === 'success' || variant === 'danger'
      ? colors.surface
      : colors.primary;

  return (
    <TouchableOpacity
      style={[getContainerStyle(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator size="small" color={loaderColor} />
      ) : (
        <View style={styles.contentRow}>
          {leftIcon ? <View style={styles.iconLeft}>{leftIcon}</View> : null}
          <Text style={[getTextStyle(), textStyle]}>{title}</Text>
          {rightIcon ? <View style={styles.iconRight}>{rightIcon}</View> : null}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLeft: { marginRight: spacing.xs },
  iconRight: { marginLeft: spacing.xs },

  // Sizes
  size_sm: {
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
  },
  size_md: {
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.lg,
  },
  size_lg: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
  },

  // Variants
  btnPrimary: {
    backgroundColor: colors.primary,
    ...shadows.sm,
  },
  btnSuccess: {
    backgroundColor: colors.green,
    ...shadows.sm,
  },
  btnDanger: {
    backgroundColor: colors.danger,
    ...shadows.sm,
  },
  btnSecondary: {
    backgroundColor: colors.surfaceSelected,
    borderWidth: 1,
    borderColor: colors.borderDark,
  },
  btnOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  btnGhost: {
    backgroundColor: 'transparent',
  },

  disabled: {
    opacity: 0.5,
  },

  // Typography
  text: {
    fontWeight: typography.weights.semibold,
    textAlign: 'center',
  },
  text_sm: { fontSize: typography.sizes.sm },
  text_md: { fontSize: typography.sizes.md },
  text_lg: { fontSize: typography.sizes.lg },

  textLight: { color: colors.surface },
  textSecondary: { color: colors.text },
  textOutline: { color: colors.primary },
  textGhost: { color: colors.textSecondary },
});

export default Button;
