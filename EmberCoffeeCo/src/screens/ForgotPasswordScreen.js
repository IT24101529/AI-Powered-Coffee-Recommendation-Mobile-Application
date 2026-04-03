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
  Alert,
} from 'react-native';
import axios from 'axios';
import { BASE_URL } from '../config/api';
import Input from '../components/ui/Input';
import colors from '../theme/colors';
import spacing, { borderRadius } from '../theme/spacing';
import { fonts, fontSizes } from '../theme/typography';

export default function ForgotPasswordScreen({ navigation }) {
  const [step, setStep] = useState(1); // 1 = enter email, 2 = enter OTP + new password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleRequestOtp = async () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) newErrors.email = 'Email is required';
    else if (!emailRegex.test(email.trim())) newErrors.email = 'Enter a valid email address';
    if (Object.keys(newErrors).length) { setErrors(newErrors); return; }

    setLoading(true);
    try {
      await axios.post(`${BASE_URL}/api/auth/forgot-password`, { email: email.trim() });
      setStep(2);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    const newErrors = {};
    if (!otp.trim() || otp.length !== 6) newErrors.otp = 'Enter the 6-digit code';
    if (!newPassword || newPassword.length < 8) newErrors.newPassword = 'At least 8 characters';
    if (newPassword !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    if (Object.keys(newErrors).length) { setErrors(newErrors); return; }

    setLoading(true);
    try {
      await axios.post(`${BASE_URL}/api/auth/reset-password`, {
        email: email.trim(),
        otp: otp.trim(),
        newPassword,
      });
      Alert.alert('Success', 'Your password has been reset. Please sign in.', [
        { text: 'Sign In', onPress: () => navigation.navigate('Login') },
      ]);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.cream} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* Back button */}
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.backIcon}>‹</Text>
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>

          {/* Logo */}
          <View style={styles.logoRow}>
            <Text style={styles.logoEmoji}>☕</Text>
            <Text style={styles.logoTitle}>EMBER COFFEE CO.</Text>
          </View>

          {step === 1 ? (
            <>
              <View style={styles.headingBlock}>
                <Text style={styles.heading}>Forgot Password?</Text>
                <Text style={styles.subtitle}>Enter your email and we'll send you a 6-digit reset code.</Text>
              </View>

              <Input
                label="Email Address"
                placeholder="your@email.com"
                value={email}
                onChangeText={(v) => { setEmail(v); setErrors((e) => ({ ...e, email: null })); }}
                error={errors.email}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />

              <TouchableOpacity
                style={[styles.btn, loading && { opacity: 0.7 }]}
                onPress={handleRequestOtp}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.btnText}>Send Reset Code</Text>
                }
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={styles.headingBlock}>
                <Text style={styles.heading}>Check Your Email</Text>
                <Text style={styles.subtitle}>
                  We sent a 6-digit code to{'\n'}
                  <Text style={styles.emailHighlight}>{email}</Text>
                  {'\n'}Enter it below along with your new password.
                </Text>
              </View>

              <View style={styles.fieldGap}>
                <Input
                  label="6-Digit Code"
                  placeholder="e.g. 482910"
                  value={otp}
                  onChangeText={(v) => { setOtp(v.replace(/\D/g, '').slice(0, 6)); setErrors((e) => ({ ...e, otp: null })); }}
                  error={errors.otp}
                  keyboardType="number-pad"
                  maxLength={6}
                />
              </View>
              <View style={styles.fieldGap}>
                <Input
                  label="New Password"
                  placeholder="Min. 8 characters"
                  value={newPassword}
                  onChangeText={(v) => { setNewPassword(v); setErrors((e) => ({ ...e, newPassword: null })); }}
                  error={errors.newPassword}
                  secureTextEntry={!showPassword}
                  rightElement={
                    <TouchableOpacity onPress={() => setShowPassword((v) => !v)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <Text style={styles.eyeToggle}>{showPassword ? '🙈' : '👁️'}</Text>
                    </TouchableOpacity>
                  }
                />
              </View>
              <View style={styles.fieldGap}>
                <Input
                  label="Confirm New Password"
                  placeholder="Repeat new password"
                  value={confirmPassword}
                  onChangeText={(v) => { setConfirmPassword(v); setErrors((e) => ({ ...e, confirmPassword: null })); }}
                  error={errors.confirmPassword}
                  secureTextEntry={!showPassword}
                />
              </View>

              <TouchableOpacity
                style={[styles.btn, loading && { opacity: 0.7 }]}
                onPress={handleResetPassword}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.btnText}>Reset Password</Text>
                }
              </TouchableOpacity>

              <TouchableOpacity style={styles.resendRow} onPress={handleRequestOtp} disabled={loading}>
                <Text style={styles.resendText}>Didn't receive a code? <Text style={styles.resendLink}>Resend</Text></Text>
              </TouchableOpacity>
            </>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cream },
  flex: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing['2xl'],
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
    gap: 4,
  },
  backIcon: { fontSize: 24, color: colors.primary, lineHeight: 28 },
  backText: { fontFamily: fonts.semiBold, fontSize: fontSizes.base, color: colors.primary },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing['2xl'] },
  logoEmoji: { fontSize: 22 },
  logoTitle: { fontFamily: fonts.extraBold, fontSize: fontSizes.sm, color: colors.dark, letterSpacing: 3 },
  headingBlock: { marginBottom: spacing.xl },
  heading: { fontFamily: fonts.extraBold, fontSize: fontSizes['3xl'], color: colors.dark, marginBottom: spacing.xs },
  subtitle: { fontFamily: fonts.regular, fontSize: fontSizes.base, color: 'rgba(46,21,0,0.6)', lineHeight: 22 },
  emailHighlight: { fontFamily: fonts.semiBold, color: colors.primary },
  fieldGap: { marginBottom: spacing.sm },
  eyeToggle: { fontSize: 16 },
  btn: {
    height: 52,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  btnText: { fontFamily: fonts.semiBold, fontSize: fontSizes.base, color: '#fff' },
  resendRow: { alignItems: 'center', marginTop: spacing.lg },
  resendText: { fontFamily: fonts.regular, fontSize: fontSizes.sm, color: 'rgba(46,21,0,0.6)' },
  resendLink: { fontFamily: fonts.semiBold, color: colors.primary },
});
