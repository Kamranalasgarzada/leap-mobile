import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { api } from '../../src/services/api';
import { ScreenContainer } from '../../src/components/ScreenContainer';
import { LoadingScreen } from '../../src/components/LoadingScreen';
import { useAppColors } from '../../src/hooks/useAppColors';
import { spacing, borderRadius } from '../../src/theme';

export default function ExamResultsListScreen() {
  const { examId = '', role = 'teacher' } = useLocalSearchParams<{ examId: string; role?: string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const c = useAppColors();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchResults = useCallback(async () => {
    if (!examId) return;
    try {
      const res = await api.teacherGetExamResults(examId);
      setData(res ?? null);
    } catch (e) {
      console.error('Exam results error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [examId]);

  useFocusEffect(useCallback(() => { fetchResults(); }, [fetchResults]));

  if (loading) return <LoadingScreen />;

  const exam = data?.exam;
  const results = data?.results ?? [];

  return (
    <ScreenContainer>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchResults(); }} tintColor={c.primary} />}
      >
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={c.textHeading} />
        </Pressable>

        <Text style={[styles.title, { color: c.textHeading }]}>{exam?.title ?? ''}</Text>
        <Text style={[styles.subtitle, { color: c.textMuted }]}>
          {results.length} {t('teacher.totalStudents')} · {exam?.totalMarks ?? 0} {t('exams.totalMarks')}
        </Text>

        {results.length === 0 && (
          <Text style={{ color: c.textMuted, textAlign: 'center', marginTop: spacing.xl }}>{t('exams.noExams')}</Text>
        )}

        {results.map((r: any) => {
          const pct = Math.round(((r?.score ?? 0) / Math.max(exam?.totalMarks ?? 1, 1)) * 100);
          const passed = (r?.score ?? 0) >= (exam?.passingMarks ?? 0);
          return (
            <Pressable
              key={r?.id}
              onPress={() => router.push(`/exam/${examId}/review?role=teacher&studentId=${r?.studentId ?? ''}`)}
              style={({ pressed }) => [styles.studentCard, { backgroundColor: c.card, borderColor: c.cardBorder }, pressed && { opacity: 0.7 }]}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.studentName, { color: c.textHeading }]}>{r?.studentName ?? r?.email ?? ''}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 4 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: passed ? c.success : c.error }}>{r?.score ?? 0} / {exam?.totalMarks ?? 0}</Text>
                  <Text style={{ fontSize: 12, color: c.textMuted }}>{pct}%</Text>
                  <View style={[styles.badge, { backgroundColor: passed ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)' }]}>
                    <Text style={{ fontSize: 11, fontWeight: '600', color: passed ? c.success : c.error }}>
                      {passed ? t('exams.passed') : t('exams.failed')}
                    </Text>
                  </View>
                </View>
                {r?.submittedAt && <Text style={{ fontSize: 11, color: c.textMuted, marginTop: 2 }}>{new Date(r.submittedAt).toLocaleString()}</Text>}
              </View>
              <MaterialCommunityIcons name="chevron-right" size={22} color={c.textMuted} />
            </Pressable>
          );
        })}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.md, paddingBottom: 80 },
  backBtn: { marginBottom: spacing.sm, width: 44, height: 44, justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '700' },
  subtitle: { fontSize: 13, marginBottom: spacing.lg },
  studentCard: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderRadius: borderRadius.lg, borderWidth: 1, marginBottom: spacing.sm },
  studentName: { fontSize: 16, fontWeight: '600' },
  badge: { paddingHorizontal: spacing.sm, paddingVertical: 1, borderRadius: borderRadius.full },
});
