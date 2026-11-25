import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { api } from '../../src/services/api';
import { GradientButton } from '../../src/components/GradientButton';
import { ScreenContainer } from '../../src/components/ScreenContainer';
import { useAppColors } from '../../src/hooks/useAppColors';
import { spacing, borderRadius } from '../../src/theme';

export default function ForgotPasswordScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const c = useAppColors();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [smtpIssue, setSmtpIssue] = useState(false);

  const handleSend = async () => {
    setError('');
    setSmtpIssue(false);
    const trimmed = email?.trim()?.toLowerCase();
    if (!trimmed || !trimmed.includes('@')) {
      setError(t('auth.invalidEmail'));
      return;
    }
    setLoading(true);
    try {
      const res = await api.forgotPassword(trimmed);
      if (res?.smtpError || res?.smtpNotConfigured) {
        setSmtpIssue(true);
        setError(res?.message ?? t('common.error'));
      } else {
        setSent(true);
        Toast.show({ type: 'success', text1: t('auth.resetEmailSent') });
      }
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
          <Pressable onPress={() => router.back()} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xl }}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={c.textHeading} />
            <Text style={{ fontSize: 16, color: c.textHeading, marginLeft: spacing.sm }}>{t('common.back')}</Text>
          </Pressable>

          <View style={{ alignItems: 'center', marginBottom: spacing.xl }}>
            <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: c.primary + '18', alignItems: 'center', justifyContent: 'center' }}>
              <MaterialCommunityIcons name="lock-reset" size={40} color={c.primary} />
            </View>
            <Text style={{ fontSize: 24, fontWeight: '700', color: c.textHeading, marginTop: spacing.md }}>{t('auth.forgotPassword')}</Text>
            <Text style={{ fontSize: 14, color: c.textMuted, marginTop: spacing.sm, textAlign: 'center', paddingHorizontal: spacing.lg }}>
              {t('auth.forgotPasswordDesc')}
            </Text>
          </View>

          {error ? (
            <Text style={{ color: c.error, fontSize: 14, textAlign: 'center', marginBottom: spacing.md, backgroundColor: 'rgba(239,68,68,0.1)', padding: spacing.sm, borderRadius: borderRadius.sm }}>{error}</Text>
          ) : null}

          {!sent ? (
            <>
              <TextInput
                style={{ backgroundColor: c.inputBg, borderWidth: 1, borderColor: c.inputBorder, borderRadius: borderRadius.md, padding: spacing.md, fontSize: 16, color: c.textHeading, height: 52, marginBottom: spacing.md }}
                placeholder={t('auth.email')}
                placeholderTextColor={c.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <GradientButton title={t('auth.sendResetLink')} onPress={handleSend} loading={loading} />
            </>
          ) : (
            <View style={{ alignItems: 'center' }}>
              <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: c.success + '18', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md }}>
                <MaterialCommunityIcons name="email-check" size={36} color={c.success} />
              </View>
              <Text style={{ fontSize: 16, color: c.textHeading, textAlign: 'center', fontWeight: '600', marginBottom: spacing.sm }}>
                {t('auth.resetEmailSent')}
              </Text>
              <Text style={{ fontSize: 14, color: c.textMuted, textAlign: 'center', marginBottom: spacing.lg, lineHeight: 20 }}>
                {t('auth.checkEmail')}
              </Text>
              <Pressable onPress={() => { setSent(false); setError(''); }}>
                <Text style={{ color: c.primary, fontSize: 14, fontWeight: '600' }}>{t('auth.tryAgain')}</Text>
              </Pressable>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
