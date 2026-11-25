import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { api } from '../../../src/services/api';
import { colors, spacing, borderRadius, typography } from '../../../src/theme';
import { Card } from '../../../src/components/Card';
import { LoadingScreen } from '../../../src/components/LoadingScreen';
import { ScreenContainer } from '../../../src/components/ScreenContainer';

export default function PublicCourseDetailScreen() {
  const { courseId = '' } = useLocalSearchParams();
  const { t } = useTranslation();
  const router = useRouter();
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!courseId) return;
    api.publicGetCourseDetail(courseId as string).then(d => setCourse(d?.course)).catch(() => {}).finally(() => setLoading(false));
  }, [courseId]);

  if (loading) return <LoadingScreen />;
  if (!course) return <ScreenContainer title={t('common.error')} onBack={() => router.back()}><Text style={{ color: colors.textBody }}>{t('common.noData')}</Text></ScreenContainer>;

  return (
    <ScreenContainer title={course?.name ?? ''} onBack={() => router.back()}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: spacing.lg }}>
        <Text style={[typography.heading, { marginBottom: spacing.sm }]}>{course?.name ?? ''}</Text>
        <Text style={[typography.body, { marginBottom: spacing.lg }]}>{course?.description ?? ''}</Text>
        {(course?.teachers?.length ?? 0) > 0 && (
          <View style={styles.teacherRow}>
            <MaterialCommunityIcons name="account-group" size={18} color={colors.accent} />
            <Text style={styles.teacherText}>{course.teachers.map((te: any) => te?.name ?? '').join(', ')}</Text>
          </View>
        )}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNum}>{course?.videoCount ?? 0}</Text>
            <Text style={styles.statLabel}>Videos</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNum}>{course?.examCount ?? 0}</Text>
            <Text style={styles.statLabel}>{t('tabs.exams')}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNum}>{course?.modules?.length ?? 0}</Text>
            <Text style={styles.statLabel}>{t('courses.modules')}</Text>
          </View>
        </View>
        {(course?.modules ?? []).map((m: any) => (
          <Card key={m?.id} style={styles.moduleCard}>
            <Text style={styles.moduleTitle}>{m?.title ?? ''}</Text>
            {m?.description ? <Text style={styles.moduleDesc}>{m.description}</Text> : null}
            <Text style={styles.moduleVideos}>{m?.videoCount ?? 0} videos</Text>
          </Card>
        ))}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  teacherRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg },
  teacherText: { marginLeft: 8, fontSize: 14, color: colors.textBody },
  statsRow: { flexDirection: 'row', marginBottom: spacing.xl },
  statItem: { flex: 1, alignItems: 'center', padding: spacing.md, backgroundColor: colors.card, borderRadius: borderRadius.md, marginHorizontal: 4, borderWidth: 1, borderColor: colors.cardBorder },
  statNum: { fontSize: 22, fontWeight: '700', color: colors.textHeading },
  statLabel: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  moduleCard: { marginBottom: spacing.sm },
  moduleTitle: { fontSize: 16, fontWeight: '600', color: colors.textHeading },
  moduleDesc: { fontSize: 13, color: colors.textBody, marginTop: 4 },
  moduleVideos: { fontSize: 12, color: colors.accent, marginTop: 4 },
});
