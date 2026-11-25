import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { api } from '../../src/services/api';
import { GradientButton } from '../../src/components/GradientButton';
import { ScreenContainer } from '../../src/components/ScreenContainer';
import { useAppColors } from '../../src/hooks/useAppColors';
import { spacing, borderRadius } from '../../src/theme';

export default function ResetPasswordScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const c = useAppColors();
  const { token = '' } = useLocalSearchParams<{ token: string }>();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleReset = async () => {
    setError('');
    if (!newPassword || newPassword.length < 6) {
      setError(t('auth.passwordMin'));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t('auth.passwordsNotMatch'));
      return;
    }
    setLoading(true);
    try {
      await api.resetPassword(token as string, newPassword);
      setSuccess(true);
      Toast.show({ type: 'success', text1: t('auth.passwordResetSuccess') });
    } catch (e: any) {
      setError(e?.message ?? t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <ScreenContainer>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg }}>
          <MaterialCommunityIcons name="alert-circle" size={48} color={c.error} />
          <Text style={{ fontSize: 16, color: c.error, marginTop: spacing.md, textAlign: 'center' }}>{t('auth.invalidResetLink')}</Text>
          <Pressable onPress={() => router.replace('/auth/login')} style={{ marginTop: spacing.lg }}>
            <Text style={{ color: c.primary, fontSize: 16, fontWeight: '600' }}>{t('auth.backToLogin')}</Text>
          </Pressable>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: spacing.lg }} keyboardShouldPersistTaps="handled">
          {!success ? (
            <>
              <View style={{ alignItems: 'center', marginBottom: spacing.xl }}>
                <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: c.primary + '18', alignItems: 'center', justifyContent: 'center' }}>
                  <MaterialCommunityIcons name="lock-open" size={40} color={c.primary} />
                </View>
                <Text style={{ fontSize: 24, fontWeight: '700', color: c.textHeading, marginTop: spacing.md }}>{t('auth.setNewPassword')}</Text>
                <Text style={{ fontSize: 14, color: c.textMuted, marginTop: spacing.sm, textAlign: 'center' }}>
                  {t('auth.newPasswordDesc')}
                </Text>
              </View>

              {error ? (
                <Text style={{ color: c.error, fontSize: 14, textAlign: 'center', marginBottom: spacing.md, backgroundColor: 'rgba(239,68,68,0.1)', padding: spacing.sm, borderRadius: borderRadius.sm }}>{error}</Text>
              ) : null}

              <View style={{ marginBottom: spacing.md, position: 'relative' as const }}>
                <TextInput
                  style={{ backgroundColor: c.inputBg, borderWidth: 1, borderColor: c.inputBorder, borderRadius: borderRadius.md, padding: spacing.md, fontSize: 16, color: c.textHeading, height: 52, paddingRight: 48 }}
                  placeholder={t('auth.newPassword')}
                  placeholderTextColor={c.textMuted}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry={!showPassword}
                />
                <Pressable style={{ position: 'absolute' as const, right: 14, top: 15 }} onPress={() => setShowPassword(!showPassword)}>
                  <MaterialCommunityIcons name={showPassword ? 'eye-off' : 'eye'} size={22} color={c.textMuted} />
                </Pressable>
              </View>

              <TextInput
                style={{ backgroundColor: c.inputBg, borderWidth: 1, borderColor: c.inputBorder, borderRadius: borderRadius.md, padding: spacing.md, fontSize: 16, color: c.textHeading, height: 52, marginBottom: spacing.md }}
                placeholder={t('auth.confirmPassword')}
                placeholderTextColor={c.textMuted}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showPassword}
              />

              <GradientButton title={t('auth.resetPassword')} onPress={handleReset} loading={loading} />
            </>
          ) : (
            <View style={{ alignItems: 'center' }}>
              <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: c.success + '18', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md }}>
                <MaterialCommunityIcons name="check-circle" size={48} color={c.success} />
              </View>
              <Text style={{ fontSize: 20, fontWeight: '700', color: c.textHeading, marginBottom: spacing.sm }}>{t('auth.passwordResetSuccess')}</Text>
              <Text style={{ fontSize: 14, color: c.textMuted, textAlign: 'center', marginBottom: spacing.lg }}>{t('auth.canLoginNow')}</Text>
              <GradientButton title={t('auth.backToLogin')} onPress={() => router.replace('/auth/login')} />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
