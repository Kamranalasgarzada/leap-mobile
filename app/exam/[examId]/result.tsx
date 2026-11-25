import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { api } from '../../../src/services/api';
import { ScreenContainer } from '../../../src/components/ScreenContainer';
import { Card } from '../../../src/components/Card';
import { GradientButton } from '../../../src/components/GradientButton';
import { LoadingScreen } from '../../../src/components/LoadingScreen';
import { colors, spacing, borderRadius } from '../../../src/theme';

export default function ExamResultScreen() {
  const { examId = '' } = useLocalSearchParams<{ examId: string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchResult = useCallback(async () => {
    if (!examId) return;
    try {
      const res = await api.getExamResult(examId);
      setResult(res?.result ?? null);
    } catch (e) {
      console.error('Result error:', e);
    } finally {
      setLoading(false);
    }
  }, [examId]);

  useFocusEffect(useCallback(() => { fetchResult(); }, [fetchResult]));

  if (loading) return <LoadingScreen />;
  if (!result) return <ScreenContainer><Text style={{ color: colors.textMuted, padding: spacing.lg }}>No result</Text></ScreenContainer>;

  const score = result?.score ?? 0;
  const total = result?.totalMarks ?? 1;
  const passing = result?.passingMarks ?? 0;
  const passed = result?.passed;
  const pct = Math.round((score / Math.max(total, 1)) * 100);

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textHeading} />
        </Pressable>

        {/* Score Circle */}
        <View style={styles.scoreContainer}>
          <View style={[styles.scoreCircle, { borderColor: passed ? colors.success : colors.error }]}>
            <Text style={[styles.scoreText, { color: passed ? colors.success : colors.error }]}>{score}</Text>
            <Text style={styles.scoreDivider}>/ {total}</Text>
          </View>
          <View style={[styles.passBadge, { backgroundColor: passed ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)' }]}>
            <Text style={[styles.passText, { color: passed ? colors.success : colors.error }]}>
              {passed ? t('exams.passed') : t('exams.failed')}
            </Text>
          </View>
          <Text style={styles.pctText}>{pct}%</Text>
        </View>

        <Card style={styles.detailCard}>
          <Text style={styles.examTitle}>{result?.examTitle ?? ''}</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t('exams.passingMarks')}</Text>
            <Text style={styles.detailValue}>{passing}</Text>
          </View>
          {result?.submittedAt && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Submitted</Text>
              <Text style={styles.detailValue}>{new Date(result.submittedAt).toLocaleString()}</Text>
            </View>
          )}
          {result?.isGraded && result?.gradedAt && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Graded</Text>
              <Text style={styles.detailValue}>{new Date(result.gradedAt).toLocaleString()}</Text>
            </View>
          )}
        </Card>

        <GradientButton
          title={t('exams.reviewAnswers')}
          onPress={() => router.push(`/exam/${examId}/review`)}
          style={{ marginTop: spacing.lg }}
        />

        {passed && (
          <GradientButton
            title={t('exams.viewCertificate')}
            onPress={() => router.push(`/exam/${examId}/certificate`)}
            style={{ marginTop: spacing.md }}
          />
        )}

        <Pressable onPress={() => router.dismissTo('/tabs/exams')} style={styles.backExams}>
          <Text style={styles.backExamsText}>{t('common.back')}</Text>
        </Pressable>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.md, paddingBottom: spacing.xxl },
  backBtn: { marginBottom: spacing.md, width: 44, height: 44, justifyContent: 'center' },
  scoreContainer: { alignItems: 'center', marginVertical: spacing.xl },
  scoreCircle: { width: 140, height: 140, borderRadius: 70, borderWidth: 6, alignItems: 'center', justifyContent: 'center' },
  scoreText: { fontSize: 36, fontWeight: '700' },
  scoreDivider: { fontSize: 16, color: colors.textMuted },
  passBadge: { marginTop: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: borderRadius.full },
  passText: { fontSize: 16, fontWeight: '700' },
  pctText: { fontSize: 14, color: colors.textMuted, marginTop: spacing.sm },
  detailCard: { marginTop: spacing.lg },
  examTitle: { fontSize: 18, fontWeight: '600', color: colors.textHeading, marginBottom: spacing.md },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.xs },
  detailLabel: { fontSize: 14, color: colors.textMuted },
  detailValue: { fontSize: 14, color: colors.textHeading, fontWeight: '500' },
  backExams: { alignItems: 'center', marginTop: spacing.lg, padding: spacing.md },
  backExamsText: { color: colors.primary, fontSize: 16, fontWeight: '600' },
});
