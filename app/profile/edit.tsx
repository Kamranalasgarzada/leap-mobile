import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { api } from '../../src/services/api';
import { ScreenContainer } from '../../src/components/ScreenContainer';
import { GradientButton } from '../../src/components/GradientButton';
import { LoadingScreen } from '../../src/components/LoadingScreen';
import { colors, spacing, borderRadius } from '../../src/theme';
import { useAuth } from '../../src/contexts/AuthContext';

export default function EditProfileScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [address, setAddress] = useState('');
  const [grade, setGrade] = useState('');

  const fetchProfile = useCallback(async () => {
    try {
      const res = await api.getProfile();
      const p = res?.profile;
      if (p) {
        setName(p.name ?? '');
        setPhone(p.phone ?? '');
        setDateOfBirth(p.dateOfBirth ? p.dateOfBirth.split('T')[0] : '');
        setAddress(p.address ?? '');
        setGrade(p.grade ?? '');
      }
    } catch {}
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { fetchProfile(); }, [fetchProfile]));

  const handleSave = async () => {
    setSaving(true);
    try {
      const data: any = {};
      if (name) data.name = name;
      if (phone !== undefined) data.phone = phone;
      if (dateOfBirth) data.dateOfBirth = new Date(dateOfBirth).toISOString();
      if (address !== undefined) data.address = address;
      if (grade !== undefined) data.grade = grade;
      await api.updateProfile(data);
      await refreshUser();
      Toast.show({ type: 'success', text1: t('profile.profileUpdated') });
      router.back();
    } catch (e: any) {
      Toast.show({ type: 'error', text1: e?.message ?? t('common.error') });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingScreen />;

  return (
    <ScreenContainer>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textHeading} />
          </Pressable>
          <Text style={styles.title}>{t('profile.editProfile')}</Text>

          <Text style={styles.label}>{t('auth.name')}</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} placeholderTextColor={colors.textMuted} />

          <Text style={styles.label}>{t('auth.phone')}</Text>
          <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholderTextColor={colors.textMuted} />

          <Text style={styles.label}>{t('profile.dateOfBirth')} (YYYY-MM-DD)</Text>
          <TextInput style={styles.input} value={dateOfBirth} onChangeText={setDateOfBirth} placeholder="1990-01-01" placeholderTextColor={colors.textMuted} />

          <Text style={styles.label}>{t('profile.address')}</Text>
          <TextInput style={styles.input} value={address} onChangeText={setAddress} placeholderTextColor={colors.textMuted} />

          <Text style={styles.label}>{t('profile.grade')}</Text>
          <TextInput style={styles.input} value={grade} onChangeText={setGrade} placeholderTextColor={colors.textMuted} />

          <GradientButton title={t('common.save')} onPress={handleSave} loading={saving} style={{ marginTop: spacing.lg }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.md, paddingBottom: spacing.xxl },
  backBtn: { marginBottom: spacing.md, width: 44, height: 44, justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '600', color: colors.textHeading, marginBottom: spacing.lg },
  label: { fontSize: 14, color: colors.textMuted, marginBottom: spacing.xs, marginTop: spacing.md },
  input: { backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.inputBorder, borderRadius: borderRadius.md, padding: spacing.md, fontSize: 16, color: colors.textHeading, height: 52 },
});
