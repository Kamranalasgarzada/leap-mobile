import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useFocusEffect, useRouter } from 'expo-router';
import { api } from '../../src/services/api';
import { useAuth } from '../../src/contexts/AuthContext';
import { useAppColors } from '../../src/hooks/useAppColors';
import { spacing, borderRadius } from '../../src/theme';
import { Card } from '../../src/components/Card';
import { LoadingScreen } from '../../src/components/LoadingScreen';

export default function TeacherDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const c = useAppColors();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    api.teacherGetDashboard().then(setData).catch(() => {}).finally(() => setLoading(false));
  }, []));

  if (loading) return <LoadingScreen />;

  const stats = data?.stats ?? {};
  const statCards = [
    { icon: 'book-open-variant' as const, label: t('teacher.myCourses'), value: stats?.courseCount ?? 0, color: c.primary, borderColor: c.primary },
    { icon: 'account-group' as const, label: t('teacher.totalStudents'), value: stats?.totalStudents ?? 0, color: c.accent, borderColor: c.accent },
    { icon: 'clipboard-text' as const, label: t('teacher.ungradedExams'), value: stats?.ungradedExams ?? 0, color: c.warning, borderColor: c.warning },
    { icon: 'calendar-check' as const, label: t('teacher.myGroups'), value: stats?.groupCount ?? 0, color: c.success, borderColor: c.success },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Header with bell */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingTop: spacing.md }}>
          <View style={{ flex: 1 }} />
          <Pressable onPress={() => router.push('/notifications')} style={{ position: 'relative', padding: spacing.xs }}>
            <MaterialCommunityIcons name="bell-outline" size={26} color={c.textHeading} />
            {(data?.unreadNotificationCount ?? 0) > 0 && (
              <View style={{ position: 'absolute', top: -2, right: -4, borderRadius: 10, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4, backgroundColor: c.error }}>
                <Text style={{ color: '#FFF', fontSize: 10, fontWeight: '700' }}>{data.unreadNotificationCount > 99 ? '99+' : data.unreadNotificationCount}</Text>
              </View>
            )}
          </Pressable>
        </View>

        {/* Welcome banner */}
        <View style={{ margin: spacing.lg, marginTop: spacing.sm, borderRadius: borderRadius.lg, overflow: 'hidden' }}>
          <View style={{ backgroundColor: c.primary, padding: spacing.lg, borderRadius: borderRadius.lg }}>
            <Text style={{ fontSize: 28, fontWeight: '700', color: c.white }}>{t('home.greeting', { name: user?.name ?? '' })}</Text>
            <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>{t('teacher.myCourses')}: {stats?.courseCount ?? 0} | {t('teacher.totalStudents')}: {stats?.totalStudents ?? 0}</Text>
          </View>
        </View>

        {/* Stat cards with colored top borders */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: spacing.md }}>
          {statCards.map((s, i) => (
            <View key={i} style={{ width: '46%', margin: '2%' }}>
              <Card borderTopColor={s.borderColor}>
                <View style={{ alignItems: 'center', paddingVertical: spacing.sm }}>
                  <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: s.color + '18', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xs }}>
                    <MaterialCommunityIcons name={s.icon} size={24} color={s.color} />
                  </View>
                  <Text style={{ fontSize: 28, fontWeight: '700', color: c.textHeading }}>{s.value}</Text>
                  <Text style={{ fontSize: 12, color: c.textMuted, marginTop: 2, textAlign: 'center' }}>{s.label}</Text>
                </View>
              </Card>
            </View>
          ))}
        </View>

        {/* Groups */}
        {(data?.upcomingGroups?.length ?? 0) > 0 && (
          <View style={{ padding: spacing.lg }}>
            <Text style={{ fontSize: 22, fontWeight: '600', color: c.textHeading, marginBottom: spacing.md }}>{t('teacher.myGroups')}</Text>
            {data.upcomingGroups.map((g: any, i: number) => {
              const borderColors = [c.primary, c.sectionCyan, c.sectionOrange, c.accent];
              return (
                <Card key={g?.id} borderTopColor={borderColors[i % borderColors.length]} style={{ marginBottom: spacing.sm }}>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: c.textHeading }}>{g?.name ?? ''}</Text>
                  <Text style={{ fontSize: 13, color: c.accent, marginTop: 2 }}>{g?.courseName ?? ''}</Text>
                  <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm }}>
                    <Text style={{ fontSize: 12, color: c.textMuted }}>
                      <MaterialCommunityIcons name="account-group" size={14} color={c.textMuted} /> {g?.studentCount ?? 0}
                    </Text>
                    {g?.room ? <Text style={{ fontSize: 12, color: c.textMuted }}>{g.room}</Text> : null}
                    {g?.lessonTime ? <Text style={{ fontSize: 12, color: c.textMuted }}>{g.lessonTime}</Text> : null}
                  </View>
                </Card>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
