import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useFocusEffect, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '../../src/services/api';
import { useAuth } from '../../src/contexts/AuthContext';
import { useAppColors } from '../../src/hooks/useAppColors';
import { spacing, borderRadius } from '../../src/theme';
import { Card } from '../../src/components/Card';
import { LoadingScreen } from '../../src/components/LoadingScreen';
import { EmptyState } from '../../src/components/EmptyState';

export default function ParentDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const c = useAppColors();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await api.parentGetDashboard();
      setData(res);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  }, []);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

  if (loading && !data) return <LoadingScreen />;

  const children = data?.children ?? [];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor={c.primary} />}
      >
        {/* Header with bell */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingTop: spacing.sm }}>
          <Text style={[styles.greeting, { color: c.textHeading, margin: 0 }]}>
            {t('home.greeting', { name: user?.name?.split(' ')?.[0] ?? '' })}
          </Text>
          <Pressable onPress={() => router.push('/notifications')} style={{ position: 'relative', padding: spacing.xs }}>
            <MaterialCommunityIcons name="bell-outline" size={26} color={c.textHeading} />
            {(data?.unreadNotificationCount ?? 0) > 0 && (
              <View style={{ position: 'absolute', top: -2, right: -4, borderRadius: 10, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4, backgroundColor: c.error }}>
                <Text style={{ color: '#FFF', fontSize: 10, fontWeight: '700' }}>{data.unreadNotificationCount > 99 ? '99+' : data.unreadNotificationCount}</Text>
              </View>
            )}
          </Pressable>
        </View>

        {children.length === 0 ? (
          <EmptyState icon="account-child" message={t('parent.noChildren')} />
        ) : (
          children.map((child: any) => {
            const attPct = child?.attendancePercentage ?? 0;
            const attColor = attPct >= 80 ? c.success : attPct >= 50 ? '#F59E0B' : c.error;
            return (
              <Pressable key={child?.studentId} onPress={() => router.push('/parent-tabs/my-child')}>
                <Card style={styles.childCard}>
                  {/* Top row: avatar + name + attendance circle */}
                  <View style={styles.childTop}>
                    <LinearGradient colors={c.gradientPrimary} style={styles.avatar}>
                      <Text style={styles.avatarText}>{(child?.name ?? '?')[0]?.toUpperCase()}</Text>
                    </LinearGradient>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.childName, { color: c.textHeading }]}>{child?.name ?? ''}</Text>
                      <Text style={[styles.childCourseCount, { color: c.textMuted }]}>
                        {child?.courseCount ?? 0} {t('common.courses')}
                      </Text>
                    </View>
                    <View style={[styles.attCircle, { borderColor: attColor }]}>
                      <Text style={[styles.attCircleText, { color: attColor }]}>{attPct}%</Text>
                    </View>
                  </View>

                  {/* Stats row */}
                  <View style={styles.statsRow}>
                    {/* Courses */}
                    <View style={[styles.statBox, { backgroundColor: c.primary + '10' }]}>
                      <MaterialCommunityIcons name="book-open-variant" size={18} color={c.primary} />
                      <Text style={[styles.statValue, { color: c.textHeading }]}>{child?.courseCount ?? 0}</Text>
                      <Text style={[styles.statLabel, { color: c.textMuted }]}>{t('common.courses')}</Text>
                    </View>
                    {/* Videos */}
                    <View style={[styles.statBox, { backgroundColor: c.accent + '10' }]}>
                      <MaterialCommunityIcons name="play-circle" size={18} color={c.accent} />
                      <Text style={[styles.statValue, { color: c.textHeading }]}>{child?.videosWatched ?? 0}</Text>
                      <Text style={[styles.statLabel, { color: c.textMuted }]}>{t('parent.videosWatched')}</Text>
                    </View>
                    {/* Last exam */}
                    <View style={[styles.statBox, { backgroundColor: c.sectionGreen + '10' }]}>
                      <MaterialCommunityIcons name="trophy" size={18} color={c.sectionGreen} />
                      {child?.lastExamResult ? (
                        <>
                          <Text style={[styles.statValue, { color: c.textHeading }]}>
                            {child.lastExamResult.score ?? 0}/{child.lastExamResult.totalMarks ?? 0}
                          </Text>
                          <Text style={[styles.statLabel, { color: c.textMuted }]} numberOfLines={1}>{t('parent.lastExam')}</Text>
                        </>
                      ) : (
                        <>
                          <Text style={[styles.statValue, { color: c.textMuted }]}>—</Text>
                          <Text style={[styles.statLabel, { color: c.textMuted }]}>{t('parent.noExamYet')}</Text>
                        </>
                      )}
                    </View>
                  </View>

                  {/* Courses list */}
                  {(child?.courses?.length ?? 0) > 0 && (
                    <View style={[styles.coursesList, { borderTopColor: c.cardBorder }]}>
                      {(child?.courses ?? []).slice(0, 3).map((cr: any, i: number) => (
                        <View key={i} style={[styles.courseChip, { backgroundColor: c.surfaceLight }]}>
                          <Text style={[styles.courseChipText, { color: c.textBody }]} numberOfLines={1}>{cr?.courseName ?? ''}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </Card>
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  greeting: { fontSize: 24, fontWeight: '700', padding: spacing.lg, paddingBottom: spacing.md },
  childCard: { marginHorizontal: spacing.lg, marginBottom: spacing.md },
  childTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#FFF', fontSize: 20, fontWeight: '700' },
  childName: { fontSize: 17, fontWeight: '700' },
  childCourseCount: { fontSize: 12, marginTop: 2 },
  attCircle: { width: 50, height: 50, borderRadius: 25, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  attCircleText: { fontSize: 14, fontWeight: '800' },
  statsRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  statBox: { flex: 1, borderRadius: borderRadius.md, padding: spacing.sm, alignItems: 'center', gap: 2 },
  statValue: { fontSize: 16, fontWeight: '700' },
  statLabel: { fontSize: 10 },
  coursesList: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: spacing.md, paddingTop: spacing.sm, borderTopWidth: 1 },
  courseChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  courseChipText: { fontSize: 12, fontWeight: '500' },
});