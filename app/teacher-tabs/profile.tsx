import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, Alert, Platform, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useFocusEffect, useRouter } from 'expo-router';
import { api } from '../../src/services/api';
import { useAuth } from '../../src/contexts/AuthContext';
import { useThemeMode } from '../../src/contexts/ThemeContext';
import { useAppColors } from '../../src/hooks/useAppColors';
import { spacing, borderRadius } from '../../src/theme';
import { Card } from '../../src/components/Card';
import { DeleteAccountButton } from '../../src/components/DeleteAccountButton';
import { LoadingScreen } from '../../src/components/LoadingScreen';

export default function TeacherProfileScreen() {
  const { t } = useTranslation();
  const { logout, user } = useAuth();
  const { mode, toggleTheme } = useThemeMode();
  const c = useAppColors();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    api.teacherGetProfile().then(d => setProfile(d?.profile)).catch(() => {}).finally(() => setLoading(false));
  }, []));

  const handleLogout = () => {
    const doLogout = async () => { await logout(); };
    if (Platform.OS === 'web') { doLogout(); return; }
    Alert.alert(t('profile.logout'), t('profile.logoutConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('profile.logout'), style: 'destructive', onPress: doLogout },
    ]);
  };

  if (loading) return <LoadingScreen />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: spacing.lg }}>
        <View style={{ alignItems: 'center', marginBottom: spacing.xl }}>
          <View style={{ width: 88, height: 88, borderRadius: 44, backgroundColor: c.surfaceLight, alignItems: 'center', justifyContent: 'center' }}>
            <MaterialCommunityIcons name="account" size={48} color={c.textMuted} />
          </View>
          <Text style={{ fontSize: 22, fontWeight: '600', color: c.textHeading, marginTop: spacing.md }}>{profile?.name ?? user?.name ?? ''}</Text>
          <Text style={{ fontSize: 13, color: c.textMuted }}>{profile?.email ?? user?.email ?? ''}</Text>
          {profile?.subject ? <Text style={{ fontSize: 16, color: c.accent, marginTop: 4 }}>{profile.subject}</Text> : null}
        </View>

        {profile?.bio ? (
          <Card style={{ marginBottom: spacing.md }}>
            <Text style={{ fontSize: 12, color: c.textMuted, marginBottom: 4 }}>Bio</Text>
            <Text style={{ fontSize: 15, color: c.textBody }}>{profile.bio}</Text>
          </Card>
        ) : null}

        {/* Theme toggle */}
        <View style={{
          flexDirection: 'row', alignItems: 'center', backgroundColor: c.card,
          borderWidth: 1, borderColor: c.cardBorder, borderRadius: borderRadius.lg,
          padding: spacing.md, marginBottom: spacing.sm,
        }}>
          <MaterialCommunityIcons name={mode === 'dark' ? 'weather-night' : 'weather-sunny'} size={22} color={c.primary} />
          <Text style={{ flex: 1, marginLeft: spacing.md, fontSize: 15, color: c.textHeading, fontWeight: '500' }}>{t('profile.darkMode')}</Text>
          <Switch
            value={mode === 'dark'}
            onValueChange={toggleTheme}
            trackColor={{ false: c.inputBorder, true: c.primary + '66' }}
            thumbColor={mode === 'dark' ? c.primary : c.textMuted}
          />
        </View>

        <Pressable onPress={() => router.push('/profile/language')}>
          <Card style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}>
            <MaterialCommunityIcons name="translate" size={22} color={c.primary} />
            <Text style={{ flex: 1, marginLeft: spacing.md, fontSize: 15, color: c.textHeading, fontWeight: '500' }}>{t('profile.language')}</Text>
            <MaterialCommunityIcons name="chevron-right" size={22} color={c.textMuted} />
          </Card>
        </Pressable>

        <Pressable onPress={() => router.push('/profile/change-password')}>
          <Card style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}>
            <MaterialCommunityIcons name="lock-outline" size={22} color={c.primary} />
            <Text style={{ flex: 1, marginLeft: spacing.md, fontSize: 15, color: c.textHeading, fontWeight: '500' }}>{t('profile.changePassword')}</Text>
            <MaterialCommunityIcons name="chevron-right" size={22} color={c.textMuted} />
          </Card>
        </Pressable>

        <Pressable onPress={handleLogout}>
          <Card style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm, borderColor: 'rgba(239,68,68,0.2)' }}>
            <MaterialCommunityIcons name="logout" size={22} color={c.error} />
            <Text style={{ flex: 1, marginLeft: spacing.md, fontSize: 15, color: c.error, fontWeight: '500' }}>{t('profile.logout')}</Text>
            <MaterialCommunityIcons name="chevron-right" size={22} color={c.error} />
          </Card>
        </Pressable>
        <DeleteAccountButton />
      </ScrollView>
    </SafeAreaView>
  );
}
