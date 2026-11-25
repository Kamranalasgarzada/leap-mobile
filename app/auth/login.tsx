import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, KeyboardAvoidingView, Platform, Pressable, Image } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../src/contexts/AuthContext';
import { GradientButton } from '../../src/components/GradientButton';
import { ScreenContainer } from '../../src/components/ScreenContainer';
import { useAppColors } from '../../src/hooks/useAppColors';
import { spacing, borderRadius } from '../../src/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import i18n from '../../src/i18n';
import { setStoredLanguage } from '../../src/i18n';

export default function LoginScreen() {
  const { t } = useTranslation();
  const { login, googleLogin } = useAuth();
  const router = useRouter();
  const c = useAppColors();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentLang, setCurrentLang] = useState(i18n.language);

  const changeLang = async (lang: string) => {
    await i18n.changeLanguage(lang);
    await setStoredLanguage(lang);
    setCurrentLang(lang);
  };

  const handleLogin = async () => {
    setError('');
    if (!email?.trim()) { setError(t('auth.invalidEmail')); return; }
    if (!password || password.length < 6) { setError(t('auth.passwordMin')); return; }
    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
    } catch (e: any) {
      setError(e?.message ?? t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: spacing.lg }} keyboardShouldPersistTaps="handled">
          <View style={{ alignItems: 'center', marginBottom: spacing.xl }}>
            <Image source={require('../../assets/icon.png')} style={{ width: 120, height: 120, borderRadius: 24 }} resizeMode="contain" />
          </View>

          <Text style={{ fontSize: 24, fontWeight: '600', color: c.textHeading, textAlign: 'center', marginBottom: spacing.lg }}>{t('auth.loginTitle')}</Text>

          {error ? <Text style={{ color: c.error, fontSize: 14, textAlign: 'center', marginBottom: spacing.md, backgroundColor: 'rgba(239,68,68,0.1)', padding: spacing.sm, borderRadius: borderRadius.sm }}>{error}</Text> : null}

          <View style={{ marginBottom: spacing.md, position: 'relative' as const }}>
            <TextInput
              style={{ backgroundColor: c.inputBg, borderWidth: 1, borderColor: c.inputBorder, borderRadius: borderRadius.md, padding: spacing.md, fontSize: 16, color: c.textHeading, height: 52 }}
              placeholder={t('auth.email')}
              placeholderTextColor={c.textMuted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={{ marginBottom: spacing.md, position: 'relative' as const }}>
            <TextInput
              style={{ backgroundColor: c.inputBg, borderWidth: 1, borderColor: c.inputBorder, borderRadius: borderRadius.md, padding: spacing.md, fontSize: 16, color: c.textHeading, height: 52, paddingRight: 48 }}
              placeholder={t('auth.password')}
              placeholderTextColor={c.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <Pressable style={{ position: 'absolute' as const, right: 14, top: 15 }} onPress={() => setShowPassword(!showPassword)}>
              <MaterialCommunityIcons name={showPassword ? 'eye-off' : 'eye'} size={22} color={c.textMuted} />
            </Pressable>
          </View>

          <Pressable onPress={() => router.push('/auth/forgot-password')} style={{ alignSelf: 'flex-end', marginBottom: spacing.sm }}>
            <Text style={{ color: c.primary, fontSize: 14, fontWeight: '500' }}>{t('auth.forgotPassword')}</Text>
          </Pressable>

          <GradientButton title={t('auth.login')} onPress={handleLogin} loading={loading} style={{ marginTop: spacing.sm }} />

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
            <Text style={{ color: c.textMuted, fontSize: 14 }}>{t('auth.noAccount')} </Text>
            <Link href="/auth/signup" asChild>
              <Pressable><Text style={{ color: c.primary, fontSize: 14, fontWeight: '600' }}>{t('auth.signup')}</Text></Pressable>
            </Link>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: spacing.xxl, gap: spacing.sm }}>
            {(['az', 'ru', 'en'] as const).map(lang => (
              <Pressable
                key={lang}
                onPress={() => changeLang(lang)}
                style={[{
                  paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.full,
                  borderWidth: 1, borderColor: c.inputBorder,
                }, currentLang === lang && { backgroundColor: c.primary, borderColor: c.primary }]}
              >
                <Text style={[{ color: c.textMuted, fontSize: 14, fontWeight: '600' }, currentLang === lang && { color: c.white }]}>
                  {lang.toUpperCase()}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
