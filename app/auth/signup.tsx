import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { Link } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../src/contexts/AuthContext';
import { GradientButton } from '../../src/components/GradientButton';
import { ScreenContainer } from '../../src/components/ScreenContainer';
import { useAppColors } from '../../src/hooks/useAppColors';
import { spacing, borderRadius } from '../../src/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function SignupScreen() {
  const { t } = useTranslation();
  const { signup, googleLogin } = useAuth();
  const c = useAppColors();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignup = async () => {
    setError('');
    if (!name?.trim()) { setError(t('auth.nameRequired')); return; }
    if (!email?.trim()) { setError(t('auth.invalidEmail')); return; }
    if (!password || password.length < 6) { setError(t('auth.passwordMin')); return; }
    if (password !== confirmPassword) { setError(t('auth.passwordMismatch')); return; }
    setLoading(true);
    try {
      await signup({ email: email.trim().toLowerCase(), password, name: name.trim(), phone: phone?.trim() || undefined });
    } catch (e: any) {
      setError(e?.message ?? t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = { backgroundColor: c.inputBg, borderWidth: 1, borderColor: c.inputBorder, borderRadius: borderRadius.md, padding: spacing.md, fontSize: 16, color: c.textHeading, height: 52 };

  return (
    <ScreenContainer>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: spacing.lg }} keyboardShouldPersistTaps="handled">
          <Text style={{ fontSize: 24, fontWeight: '600', color: c.textHeading, textAlign: 'center', marginBottom: spacing.lg }}>{t('auth.signupTitle')}</Text>

          {error ? <Text style={{ color: c.error, fontSize: 14, textAlign: 'center', marginBottom: spacing.md, backgroundColor: 'rgba(239,68,68,0.1)', padding: spacing.sm, borderRadius: borderRadius.sm }}>{error}</Text> : null}

          <View style={{ marginBottom: spacing.md }}>
            <TextInput style={inputStyle} placeholder={t('auth.name')} placeholderTextColor={c.textMuted} value={name} onChangeText={setName} />
          </View>
          <View style={{ marginBottom: spacing.md }}>
            <TextInput style={inputStyle} placeholder={t('auth.email')} placeholderTextColor={c.textMuted} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          </View>
          <View style={{ marginBottom: spacing.md }}>
            <TextInput style={inputStyle} placeholder={t('auth.phone')} placeholderTextColor={c.textMuted} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          </View>
          <View style={{ marginBottom: spacing.md, position: 'relative' as const }}>
            <TextInput style={[inputStyle, { paddingRight: 48 }]} placeholder={t('auth.password')} placeholderTextColor={c.textMuted} value={password} onChangeText={setPassword} secureTextEntry={!showPassword} />
            <Pressable style={{ position: 'absolute' as const, right: 14, top: 15 }} onPress={() => setShowPassword(!showPassword)}>
              <MaterialCommunityIcons name={showPassword ? 'eye-off' : 'eye'} size={22} color={c.textMuted} />
            </Pressable>
          </View>
          <View style={{ marginBottom: spacing.md }}>
            <TextInput style={inputStyle} placeholder={t('auth.confirmPassword')} placeholderTextColor={c.textMuted} value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry={!showPassword} />
          </View>

          <GradientButton title={t('auth.signup')} onPress={handleSignup} loading={loading} style={{ marginTop: spacing.md }} />

          <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: spacing.lg }}>
            <View style={{ flex: 1, height: 1, backgroundColor: c.inputBorder }} />
            <Text style={{ color: c.textMuted, fontSize: 13, marginHorizontal: spacing.md }}>{t('auth.or') ?? 'OR'}</Text>
            <View style={{ flex: 1, height: 1, backgroundColor: c.inputBorder }} />
          </View>

          <Pressable style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: c.inputBg, borderWidth: 1, borderColor: c.inputBorder, borderRadius: borderRadius.md, height: 52, gap: spacing.sm }} onPress={googleLogin}>
            <MaterialCommunityIcons name="google" size={22} color="#EA4335" />
            <Text style={{ color: c.textHeading, fontSize: 16, fontWeight: '600' }}>{t('auth.googleLogin') ?? 'Continue with Google'}</Text>
          </Pressable>

          <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: spacing.lg }}>
            <Text style={{ color: c.textMuted, fontSize: 14 }}>{t('auth.hasAccount')} </Text>
            <Link href="/auth/login" asChild>
              <Pressable><Text style={{ color: c.primary, fontSize: 14, fontWeight: '600' }}>{t('auth.login')}</Text></Pressable>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
