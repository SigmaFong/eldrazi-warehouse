// src/screens/LoginScreen.tsx
// Function 7.1 — professional functional component with typed props
// Function 7.2 — glassmorphism frosted glass login form
// Function 7.3 — real API login with JWT storage

import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ActivityIndicator, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { colors, glass, spacing, font } from '../utils/theme';

export default function LoginScreen() {
  const { login, loading, error, clearError } = useAuth();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [focused,  setFocused]  = useState<'email' | 'password' | null>(null);

  const handleLogin = async () => {
    if (!email || !password) return;
    clearError();
    try { await login(email.trim(), password); } catch {}
  };

  // Quick-fill demo accounts
  const DEMO = [
    { label: 'Viewer',      email: 'kk@tcg.ac.th',      pw: 'Viewer1234!' },
    { label: 'Distributor', email: 'tanaka@tce.jp',      pw: 'Dist1234!'   },
    { label: 'Manager',     email: 'manager@eldrazi.com', pw: 'Manage1234!' },
    { label: 'Admin',       email: 'admin@eldrazi.com',   pw: 'Admin1234!'  },
  ];

  return (
    <LinearGradient
      colors={['#09090b', '#0f0a1a', '#09090b']}
      style={styles.bg}
    >
      {/* Glow orb */}
      <View style={styles.glow} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          {/* Logo area */}
          <View style={styles.logoArea}>
            <LinearGradient
              colors={['rgba(139,92,246,0.3)', 'rgba(139,92,246,0.05)']}
              style={styles.logoOrb}
            >
              <Text style={styles.logoSymbol}>⬡</Text>
            </LinearGradient>
            <Text style={styles.logoTitle}>ELDRAZI VAULT</Text>
            <Text style={styles.logoSub}>Warehouse Management System</Text>
          </View>

          {/* ── Glass login card (Function 7.2) ── */}
          <View style={styles.glassCard}>
            <LinearGradient
              colors={['rgba(63,63,70,0.15)', 'rgba(24,24,27,0.05)']}
              style={styles.glassInner}
            >
              <Text style={styles.formTitle}>Sign In</Text>

              {/* Email input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>EMAIL</Text>
                <View style={[
                  styles.inputWrap,
                  focused === 'email' && styles.inputFocused,
                ]}>
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    onFocus={() => setFocused('email')}
                    onBlur={() => setFocused(null)}
                    placeholder="you@eldrazi.com"
                    placeholderTextColor={colors.textDisabled}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={styles.input}
                  />
                </View>
              </View>

              {/* Password input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>PASSWORD</Text>
                <View style={[
                  styles.inputWrap,
                  focused === 'password' && styles.inputFocused,
                ]}>
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    onFocus={() => setFocused('password')}
                    onBlur={() => setFocused(null)}
                    placeholder="••••••••"
                    placeholderTextColor={colors.textDisabled}
                    secureTextEntry
                    style={styles.input}
                    onSubmitEditing={handleLogin}
                  />
                </View>
              </View>

              {/* Error */}
              {error && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>⚠ {error}</Text>
                </View>
              )}

              {/* Login button */}
              <TouchableOpacity
                onPress={handleLogin}
                disabled={loading || !email || !password}
                activeOpacity={0.8}
                style={styles.btnWrap}
              >
                <LinearGradient
                  colors={loading || !email || !password
                    ? ['#3f3f46', '#27272a']
                    : ['#7c3aed', '#6d28d9']}
                  style={styles.btn}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                >
                  {loading
                    ? <ActivityIndicator color="#fff" />
                    : <Text style={styles.btnText}>Sign In →</Text>
                  }
                </LinearGradient>
              </TouchableOpacity>
            </LinearGradient>
          </View>

          {/* Demo quick-fill */}
          <View style={styles.demoArea}>
            <Text style={styles.demoLabel}>DEMO ACCOUNTS</Text>
            <View style={styles.demoRow}>
              {DEMO.map(d => (
                <TouchableOpacity
                  key={d.label}
                  onPress={() => { setEmail(d.email); setPassword(d.pw); clearError(); }}
                  style={styles.demoBtn}
                  activeOpacity={0.7}
                >
                  <Text style={styles.demoBtnText}>{d.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  bg:          { flex: 1 },
  flex:        { flex: 1 },
  glow:        {
    position: 'absolute', top: -100, alignSelf: 'center',
    width: 300, height: 300, borderRadius: 150,
    backgroundColor: 'rgba(139,92,246,0.12)',
  },
  scroll:      { flexGrow: 1, justifyContent: 'center', padding: spacing.lg },

  // Logo
  logoArea:   { alignItems: 'center', marginBottom: spacing.xl },
  logoOrb:    { width: 72, height: 72, borderRadius: 36, alignItems: 'center',
                 justifyContent: 'center', marginBottom: spacing.md,
                 borderWidth: 1, borderColor: 'rgba(139,92,246,0.4)' },
  logoSymbol: { fontSize: 32, color: colors.violetLight },
  logoTitle:  { fontSize: font.sizes.xl, fontWeight: '900', color: colors.textPrimary,
                 letterSpacing: 4, fontFamily: font.mono },
  logoSub:    { fontSize: font.sizes.xs, color: colors.textMuted, fontFamily: font.mono,
                 letterSpacing: 2, marginTop: 4 },

  // Glass card (Function 7.2)
  glassCard: {
    borderRadius: 20, overflow: 'hidden', marginBottom: spacing.lg,
    backgroundColor: 'rgba(24,24,27,0.75)',
    borderWidth: 1, borderColor: 'rgba(63,63,70,0.5)',
    // Shadow acts as backdrop for frosted glass effect
    shadowColor: colors.violetLight, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2, shadowRadius: 24, elevation: 12,
  },
  glassInner: { padding: spacing.lg },
  formTitle:  { fontSize: font.sizes.lg, fontWeight: '800', color: colors.textPrimary,
                 marginBottom: spacing.lg },

  // Inputs
  inputGroup: { marginBottom: spacing.md },
  inputLabel: { fontSize: font.sizes.xs, color: colors.textMuted, fontFamily: font.mono,
                 textTransform: 'uppercase', letterSpacing: 2, marginBottom: 6 },
  inputWrap:  {
    backgroundColor: 'rgba(9,9,11,0.85)',
    borderWidth: 1, borderColor: colors.border, borderRadius: 12,
  },
  inputFocused: { borderColor: colors.violetLight },
  input:       { color: colors.textPrimary, fontSize: font.sizes.base, padding: 14 },

  // Error
  errorBox:   { backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: 1,
                 borderColor: 'rgba(239,68,68,0.3)', borderRadius: 10,
                 padding: spacing.sm, marginBottom: spacing.md },
  errorText:  { color: '#f87171', fontSize: font.sizes.sm },

  // Button
  btnWrap:    { marginTop: spacing.sm },
  btn:        { borderRadius: 12, padding: 16, alignItems: 'center' },
  btnText:    { color: '#fff', fontWeight: '800', fontSize: font.sizes.md, letterSpacing: 1 },

  // Demo
  demoArea:   { alignItems: 'center' },
  demoLabel:  { fontSize: font.sizes.xs, color: colors.textDisabled, fontFamily: font.mono,
                 letterSpacing: 2, marginBottom: spacing.sm },
  demoRow:    { flexDirection: 'row', gap: spacing.sm },
  demoBtn:    { backgroundColor: 'rgba(63,63,70,0.3)', borderWidth: 1,
                 borderColor: colors.border, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  demoBtnText:{ color: colors.textSecond, fontSize: font.sizes.xs, fontWeight: '600' },
});
