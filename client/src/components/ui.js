import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';

/** Screen container with title, optional subtitle and optional back button. */
export function Screen({ title, subtitle, children, headerRight, onBack }) {
  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        {onBack ? (
          <TouchableOpacity onPress={onBack} style={styles.back}>
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

export function Card({ children, style }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function AppButton({ title, onPress, variant = 'primary', disabled, loading }) {
  return (
    <TouchableOpacity
      style={[styles.button, styles[variant], disabled && styles.buttonDisabled]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text style={[styles.buttonText, variant === 'ghost' && styles.buttonGhostText]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

export function AppInput({ label, ...props }) {
  return (
    <View style={styles.inputGroup}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput style={styles.input} placeholderTextColor="#94a3b8" {...props} />
    </View>
  );
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

export function EmptyState({ text }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

export function ErrorBanner({ message }) {
  if (!message) return null;
  return (
    <View style={styles.error}>
      <Text style={styles.errorText}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f1f5f9', padding: 16 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  back: { marginRight: 10, alignSelf: 'center' },
  backText: { fontSize: 16, color: '#1d4ed8', fontWeight: '600' },
  title: { fontSize: 22, fontWeight: '700', color: '#0f172a' },
  subtitle: { fontSize: 13, color: '#64748b', marginTop: 2 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  button: {
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: { backgroundColor: '#1d4ed8' },
  ghost: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#cbd5e1' },
  danger: { backgroundColor: '#dc2626' },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  buttonGhostText: { color: '#334155' },
  inputGroup: { marginBottom: 12 },
  label: { fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#0f172a',
    backgroundColor: '#fff',
  },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  switch: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#cbd5e1',
  },
  switchOn: { backgroundColor: '#16a34a' },
  switchText: { color: '#fff', fontWeight: '600' },
  empty: { padding: 32, alignItems: 'center' },
  emptyText: { color: '#64748b', fontSize: 15 },
  error: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  errorText: { color: '#b91c1c', fontSize: 14 },
});
