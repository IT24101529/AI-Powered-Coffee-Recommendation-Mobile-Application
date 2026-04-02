import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { BASE_URL } from '../config/api';
import Input from '../components/ui/Input';
import Divider from '../components/ui/Divider';
import colors from '../theme/colors';
import spacing, { borderRadius } from '../theme/spacing';
import { fonts, fontSizes } from '../theme/typography';

// ─── Validation ───────────────────────────────────────────────────────────────

export function validateRegisterForm({ name, email, password }) {
  const errors = {};
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!name || !name.trim()) {
    errors.name = 'Name is required';
  }
  if (!email || !email.trim()) {
    errors.email = 'Email is required';
  } else if (!emailRegex.test(email.trim())) {
    errors.email = 'Enter a valid email address';
  }
  if (!password || password.length < 8) {
    errors.password = 'Password must be at least 8 characters';
  }
  return Object.keys(errors).length ? errors : null;
}

// ─── Inline icon components (text-based, no extra deps) ──────────────────────

function FieldIcon({ children }) {
  return <Text style={iconStyles.icon}>{children}</Text>;
}

const iconStyles = StyleSheet.create({
  icon: { fontSize: 16, color: 'rgba(98,55,30,0.55)' },
});

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function RegisterScreen({ navigation }) {
  const { login } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setApiError('');
    const validationErrors = validateRegisterForm({ name, email, password });
    if (validationErrors) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      await axios.post(`${BASE_URL}/api/auth/register`, {
        name: name.trim(),
        email: email.trim(),
        password,
      });
      // Auto-login after successful registration
      const { data } = await axios.post(`${BASE_URL}/api/auth/login`, {
        email: email.trim(),
        password,
      });
      const profileRes = await axios.get(`${BASE_URL}/api/auth/profile`, {
        headers: { Authorization: `Bearer ${data.token}` },
      });
      await login(data.token, profileRes.data);
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed. Please try again.';
      setApiError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.cream} />

      {/* Decorative coffee bean — bottom-right corner */}
      <View style={styles.beanDecor} pointerEvents="none">
        <View style={styles.beanOuter}>
          <View style={styles.beanInner} />
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo — horizontal layout */}
          <View style={styles.logoRow}>
            <Text style={styles.logoEmoji}>☕</Text>
            <Text style={styles.logoTitle}>EMBER COFFEE CO.</Text>
          </View>

          {/* Heading */}
          <View style={styles.headingBlock}>
            <Text style={styles.heading}>Create your account</Text>
            <Text style={styles.subtitle}>
              Join the Ember community and start your brew journey
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Name field */}
            <Input
              placeholder="Full name"
              value={name}
              onChangeText={(v) => { setName(v); setErrors((e) => ({ ...e, name: null })); }}
              error={errors.name}
              autoCapitalize="words"
              icon={<FieldIcon>👤</FieldIcon>}
            />

            <View style={styles.gap} />

            {/* Email field */}
            <Input
              placeholder="Email address"
              value={email}
              onChangeText={(v) => { setEmail(v); setErrors((e) => ({ ...e, email: null })); }}
              error={errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              icon={<FieldIcon>✉️</FieldIcon>}
            />

            <View style={styles.gap} />

            {/* Password field */}
            <Input
              placeholder="Password (min. 8 characters)"
              value={password}
              onChangeText={(v) => { setPassword(v); setErrors((e) => ({ ...e, password: null })); }}
              error={errors.password}
              secureTextEntry={!showPassword}
              icon={<FieldIcon>🔒</FieldIcon>}
              rightElement={
                <TouchableOpacity
                  onPress={() => setShowPassword((v) => !v)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.eyeToggle}>{showPassword ? '🙈' : '👁️'}</Text>
                </TouchableOpacity>
              }
            />

            {/* Terms checkbox */}
            <TouchableOpacity
              style={styles.termsRow}
              onPress={() => setTermsAccepted((v) => !v)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, termsAccepted && styles.checkboxChecked]}>
                {termsAccepted && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.termsText}>
                I agree to the{' '}
                <Text style={styles.termsLink}>Terms & Conditions</Text>
              </Text>
            </TouchableOpacity>

            {/* API error */}
            {apiError ? <Text style={styles.apiError}>{apiError}</Text> : null}

            {/* Create Account button */}
            <View style={styles.buttonGap}>
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator color={colors.primary} />
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.createButton}
                  onPress={handleSubmit}
                  activeOpacity={0.82}
                  disabled={loading}
                >
                  <Text style={styles.createButtonText}>Create Account</Text>
                  <Text style={styles.arrowIcon}>→</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* "or" divider */}
            <Divider label="or" style={styles.divider} />

            {/* Social buttons */}
            <View style={styles.socialRow}>
              <TouchableOpacity style={styles.socialButton} activeOpacity={0.7}>
                <Text style={styles.socialText}>🇬 Google</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialButton} activeOpacity={0.7}>
                <Text style={styles.socialText}> Apple</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Footer */}
          <TouchableOpacity
            style={styles.footer}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.footerText}>
              Already have an account?{' '}
              <Text style={styles.footerLink}>Log in</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  flex: {
    flex: 1,
  },
  // Decorative bean: two overlapping circles in the bottom-right
  beanDecor: {
    position: 'absolute',
    bottom: -40,
    right: -40,
    zIndex: 0,
  },
  beanOuter: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(98,55,30,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  beanInner: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(98,55,30,0.06)',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing['3xl'],
    paddingBottom: spacing['2xl'],
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing['2xl'],
  },
  logoEmoji: {
    fontSize: 22,
  },
  logoTitle: {
    fontFamily: fonts.extraBold,
    fontSize: fontSizes.sm,
    color: colors.dark,
    letterSpacing: 3,
  },
  headingBlock: {
    marginBottom: spacing.xl,
  },
  heading: {
    fontFamily: fonts.extraBold,
    fontSize: fontSizes['3xl'],
    color: colors.dark,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.base,
    color: colors.primary,
    lineHeight: 22,
  },
  form: {
    flex: 1,
  },
  gap: {
    height: spacing.md,
  },
  eyeToggle: {
    fontSize: 16,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: colors.primary,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: fonts.bold,
    lineHeight: 14,
  },
  termsText: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    color: colors.dark,
    flex: 1,
  },
  termsLink: {
    fontFamily: fonts.semiBold,
    color: colors.primary,
    textDecorationLine: 'underline',
  },
  apiError: {
    marginTop: spacing.sm,
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    color: '#E53E3E',
    textAlign: 'center',
  },
  buttonGap: {
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  createButton: {
    height: 52,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    gap: 10,
  },
  createButtonText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.base,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  arrowIcon: {
    fontSize: 18,
    color: '#FFFFFF',
    fontFamily: fonts.bold,
  },
  loadingContainer: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    marginBottom: spacing.md,
  },
  socialRow: {
    flexDirection: 'row',
    gap: 12,
  },
  socialButton: {
    flex: 1,
    height: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.pill,
    borderWidth: 1,
    borderColor: 'rgba(98,55,30,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.sm,
    color: colors.dark,
  },
  footer: {
    marginTop: spacing.xl,
    alignItems: 'center',
  },
  footerText: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.base,
    color: colors.dark,
  },
  footerLink: {
    fontFamily: fonts.semiBold,
    color: colors.primary,
  },
});
