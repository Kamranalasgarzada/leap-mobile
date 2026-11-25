import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, Alert, RefreshControl, Switch, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../src/contexts/AuthContext';
import { useThemeMode } from '../../src/contexts/ThemeContext';
import { useAppColors } from '../../src/hooks/useAppColors';
import { api } from '../../src/services/api';
import { ScreenContainer } from '../../src/components/ScreenContainer';
import { Card } from '../../src/components/Card';
import { DeleteAccountButton } from '../../src/components/DeleteAccountButton';
import { LoadingScreen } from '../../src/components/LoadingScreen';
import { spacing, borderRadius } from '../../src/theme';
import i18n from '../../src/i18n';

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const { mode, toggleTheme } = useThemeMode();
  const c = useAppColors();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await api.getProfile();
      setProfile(res?.profile ?? null);
    } catch (e) {
      console.error('Profile error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchProfile(); }, [fetchProfile]));

  const handleLogout = () => {
    const doLogout = async () => { await logout(); };
    if (Platform.OS === 'web') { 
      if (window.confirm(t('profile.logoutConfirm'))) doLogout();
      return;
    }
    Alert.alert(t('profile.logout'), t('profile.logoutConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('profile.logout'), style: 'destructive', onPress: doLogout },
    ]);
  };

  if (loading && !profile) return <LoadingScreen />;

  const langMap: Record<string, string> = { az: 'Az\u0259rbaycan dili', ru: '\u0420\u0443\u0441\u0441\u043a\u0438\u0439', en: 'English' };

  return (
    <ScreenContainer>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xxl }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchProfile(); }} tintColor={c.primary} />}
      >
        {/* Avatar + Info */}
        <View style={{ alignItems: 'center', marginBottom: spacing.lg, marginTop: spacing.md }}>
          <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md }}>
            <Text style={{ color: c.white, fontSize: 32, fontWeight: '700' }}>{(profile?.name ?? user?.name ?? '?')[0]?.toUpperCase()}</Text>
          </View>
          <Text style={{ fontSize: 22, fontWeight: '600', color: c.textHeading }}>{profile?.name ?? user?.name ?? ''}</Text>
          <Text style={{ fontSize: 14, color: c.textMuted, marginTop: 4 }}>{profile?.email ?? user?.email ?? ''}</Text>
        </View>

        {/* Info card */}
        <Card style={{ marginBottom: spacing.lg }}>
          <InfoRow icon="phone" label={t('auth.phone')} value={profile?.phone ?? '-'} c={c} />
          <InfoRow icon="calendar" label={t('profile.dateOfBirth')} value={profile?.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString() : '-'} c={c} />
          <InfoRow icon="school" label={t('profile.grade')} value={profile?.grade ?? '-'} c={c} />
        </Card>

        {/* Theme toggle */}
        <View style={{
          flexDirection: 'row', alignItems: 'center', backgroundColor: c.card,
          borderWidth: 1, borderColor: c.cardBorder, borderRadius: borderRadius.lg,
          padding: spacing.md, marginBottom: spacing.sm,
        }}>
          <MaterialCommunityIcons name={mode === 'dark' ? 'weather-night' : 'weather-sunny'} size={22} color={c.primary} />
          <Text style={{ flex: 1, fontSize: 16, color: c.textBody, marginLeft: spacing.md }}>{t('profile.darkMode')}</Text>
          <Switch
            value={mode === 'dark'}
            onValueChange={toggleTheme}
            trackColor={{ false: c.inputBorder, true: c.primary + '66' }}
            thumbColor={mode === 'dark' ? c.primary : c.textMuted}
          />
        </View>

        {/* Menu items */}
        <MenuItem icon="account-edit" label={t('profile.editProfile')} onPress={() => router.push('/profile/edit')} c={c} />
        <MenuItem icon="lock-reset" label={t('profile.changePassword')} onPress={() => router.push('/profile/change-password')} c={c} />
        <MenuItem icon="translate" label={`${t('profile.language')}: ${langMap[i18n.language] ?? i18n.language}`} onPress={() => router.push('/profile/language')} c={c} />

        <Pressable onPress={handleLogout} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: spacing.lg, padding: spacing.md }}>
          <MaterialCommunityIcons name="logout" size={20} color={c.error} />
          <Text style={{ color: c.error, fontSize: 16, fontWeight: '600', marginLeft: spacing.sm }}>{t('profile.logout')}</Text>
        </Pressable>
        <DeleteAccountButton />

        <Text style={{ textAlign: 'center', color: c.textMuted, fontSize: 12, marginTop: spacing.lg }}>{t('profile.version')} 1.0.0</Text>
      </ScrollView>
    </ScreenContainer>
  );
}

function InfoRow({ icon, label, value, c }: { icon: string; label: string; value: string; c: any }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm }}>
      <MaterialCommunityIcons name={icon as any} size={20} color={c.textMuted} />
      <Text style={{ fontSize: 14, color: c.textMuted, marginLeft: spacing.sm, flex: 1 }}>{label}</Text>
      <Text style={{ fontSize: 14, color: c.textHeading, fontWeight: '500' }}>{value}</Text>
    </View>
  );
}

function MenuItem({ icon, label, onPress, c }: { icon: string; label: string; onPress: () => void; c: any }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [{
      flexDirection: 'row' as const, alignItems: 'center' as const, backgroundColor: c.card,
      borderWidth: 1, borderColor: c.cardBorder, borderRadius: borderRadius.lg,
      padding: spacing.md, marginBottom: spacing.sm,
    }, pressed && { opacity: 0.7 }]}>
      <MaterialCommunityIcons name={icon as any} size={22} color={c.textBody} />
      <Text style={{ flex: 1, fontSize: 16, color: c.textBody, marginLeft: spacing.md }}>{label}</Text>
      <MaterialCommunityIcons name="chevron-right" size={22} color={c.textMuted} />
    </Pressable>
  );
}
