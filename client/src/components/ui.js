import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { colors, typography, spacing, radius, shadows } from '../theme';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Card as CustomCard } from './ui/Card';
import { EmptyState as CustomEmptyState, ErrorBanner as CustomErrorBanner } from './ui/States';

// Re-export all new design system primitives
export * from './ui/index';
export * from '../theme';

/** Screen container with title, optional subtitle and optional back button. */
export function Screen({ title, subtitle, children, headerRight, onBack, style }) {
  return (
    <View style={[styles.screen, style]}>
      <View style={styles.header}>
        {onBack ? (
          <TouchableOpacity onPress={onBack} style={styles.back} activeOpacity={0.7}>
            <Text style={styles.backText}>‹ Atrás</Text>
          </TouchableOpacity>
        ) : null}
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {headerRight}
      </View>
      {children}
    </View>
  );
}

export function Card({ children, style, accentColor }) {
  return <CustomCard style={style} accentColor={accentColor}>{children}</CustomCard>;
}

export function AppButton({ title, onPress, variant = 'primary', disabled, loading, size = 'md', style }) {
  return (
    <Button
      title={title}
      onPress={onPress}
      variant={variant}
      disabled={disabled}
      loading={loading}
      size={size}
      style={style}
    />
  );
}

export function AppInput({ label, ...props }) {
  return <Input label={label} {...props} />;
}

/** Renders a field config: text | password | switch | select-as-picker-text. */
export function Field({ field, value, onChangeText, onToggle }) {
  if (field.type === 'switch') {
    return (
      <View style={[styles.inputGroup, styles.switchRow]}>
        <Text style={styles.label}>{field.label}</Text>
        <TouchableOpacity
          onPress={onToggle}
          style={[styles.switch, value && styles.switchOn]}
          activeOpacity={0.8}
        >
          <Text style={styles.switchText}>{value ? 'Sí' : 'No'}</Text>
        </TouchableOpacity>
      </View>
    );
  }
  return (
    <AppInput
      label={field.label}
      value={value}
      onChangeText={onChangeText}
      secureTextEntry={field.type === 'password'}
      placeholder={field.placeholder || field.label}
      autoCapitalize={field.type === 'email' || field.type === 'password' ? 'none' : 'sentences'}
      keyboardType={field.type === 'email' ? 'email-address' : 'default'}
    />
  );
}

export function EmptyState({ text, title, actionLabel, onAction }) {
  return <CustomEmptyState text={text} title={title} actionLabel={actionLabel} onAction={onAction} />;
}

export function ErrorBanner({ message, onRetry }) {
  return <CustomErrorBanner message={message} onRetry={onRetry} />;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background, padding: spacing.lg },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg },
  back: { marginRight: spacing.md, alignSelf: 'center' },
  backText: { fontSize: typography.sizes.md, color: colors.primary, fontWeight: typography.weights.semibold },
  title: { fontSize: typography.sizes.xl, fontWeight: typography.weights.bold, color: colors.text },
  subtitle: { fontSize: typography.sizes.xs, color: colors.textSecondary, marginTop: 2 },
  inputGroup: { marginBottom: spacing.md },
  label: { fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold, color: colors.text, marginBottom: spacing.xs },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  switch: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
    backgroundColor: colors.borderDark,
  },
  switchOn: { backgroundColor: colors.green },
  switchText: { color: colors.surface, fontWeight: typography.weights.bold, fontSize: typography.sizes.xs },
});
