import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { api } from '../../src/services/api';
import { ScreenContainer } from '../../src/components/ScreenContainer';
import { GradientButton } from '../../src/components/GradientButton';
import { colors, spacing, borderRadius } from '../../src/theme';

export default function ChangePasswordScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setError('');
    if (!newPassword || newPassword.length < 6) { setError(t('auth.passwordMin')); return; }
    if (newPassword !== confirmPassword) { setError(t('auth.passwordMismatch')); return; }
    setLoading(true);
    try {
      await api.changePassword({ currentPassword, newPassword });
      Toast.show({ type: 'success', text1: t('profile.passwordUpdated') });
      router.back();
    } catch (e: any) {
      setError(e?.message ?? t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textHeading} />
          </Pressable>
          <Text style={styles.title}>{t('profile.changePassword')}</Text>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Text style={styles.label}>{t('profile.currentPassword')}</Text>
          <TextInput style={styles.input} value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry placeholderTextColor={colors.textMuted} />

          <Text style={styles.label}>{t('profile.newPassword')}</Text>
          <TextInput style={styles.input} value={newPassword} onChangeText={setNewPassword} secureTextEntry placeholderTextColor={colors.textMuted} />

          <Text style={styles.label}>{t('profile.confirmNewPassword')}</Text>
          <TextInput style={styles.input} value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry placeholderTextColor={colors.textMuted} />

          <GradientButton title={t('profile.updatePassword')} onPress={handleSubmit} loading={loading} style={{ marginTop: spacing.lg }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.md, paddingBottom: spacing.xxl },
  backBtn: { marginBottom: spacing.md, width: 44, height: 44, justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '600', color: colors.textHeading, marginBottom: spacing.lg },
  error: { color: colors.error, fontSize: 14, textAlign: 'center', marginBottom: spacing.md, backgroundColor: 'rgba(239,68,68,0.1)', padding: spacing.sm, borderRadius: borderRadius.sm },
  label: { fontSize: 14, color: colors.textMuted, marginBottom: spacing.xs, marginTop: spacing.md },
  input: { backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.inputBorder, borderRadius: borderRadius.md, padding: spacing.md, fontSize: 16, color: colors.textHeading, height: 52 },
});
