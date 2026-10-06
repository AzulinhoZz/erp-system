import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { authService } from '../../services/authService';
import { apiErrorMessage } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { AppButton, AppInput, ErrorBanner } from '../../components/ui';

export default function LoginScreen() {
  const setSession = useAuthStore((s) => s.setSession);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!email || !password) {
      setError('Correo y contraseña son obligatorios');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const session = await authService.login(email.trim(), password);
      setSession(session);
      // El navigation switch se encarga del resto al cambiar user
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.card}>
        <View style={styles.brandLockup}>
          <View style={styles.logoMark}>
            <View style={[styles.logoBar, styles.logoBarTop]} />
            <View style={[styles.logoBar, styles.logoBarMiddle]} />
            <View style={[styles.logoBar, styles.logoBarBottom]} />
          </View>
          <Text style={styles.brand}>SYS ERP</Text>
          <Text style={styles.tagline}>INTEGRATED BUSINESS SOLUTIONS</Text>
        </View>
        <Text style={styles.subtitle}>Inicia sesión para continuar</Text>

        <ErrorBanner message={error} />

        <AppInput
          label="Correo electrónico"
          value={email}
          onChangeText={setEmail}
          placeholder="usuario@empresa.com"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <AppInput
          label="Contraseña"
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          secureTextEntry
        />

        <AppButton title="Entrar" onPress={submit} loading={loading} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#06192c',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.98)',
    borderRadius: 28,
    padding: 26,
  },
  brandLockup: { alignItems: 'center', marginBottom: 10 },
  logoMark: {
    width: 72, height: 72, borderRadius: 22, backgroundColor: '#0878ff',
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
    shadowColor: '#0878ff', shadowOpacity: 0.32, shadowRadius: 16, shadowOffset: { width: 0, height: 8 },
  },
  logoBar: { position: 'absolute', width: 38, height: 10, borderRadius: 5, backgroundColor: '#fff', transform: [{ rotate: '32deg' }] },
  logoBarTop: { top: 19, left: 17 },
  logoBarMiddle: { top: 31, left: 17, transform: [{ rotate: '-32deg' }] },
  logoBarBottom: { top: 43, left: 17 },
  brand: { fontSize: 30, fontWeight: '900', color: '#071d34', textAlign: 'center', letterSpacing: 0.5 },
  tagline: { fontSize: 9, fontWeight: '700', color: '#64748b', letterSpacing: 2.1, marginTop: 2 },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 20,
    marginTop: 4,
  },
});
