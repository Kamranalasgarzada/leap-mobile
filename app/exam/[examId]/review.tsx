import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { api } from '../../../src/services/api';
import { ScreenContainer } from '../../../src/components/ScreenContainer';
import { LoadingScreen } from '../../../src/components/LoadingScreen';
import { useAppColors } from '../../../src/hooks/useAppColors';
import { spacing, borderRadius } from '../../../src/theme';

export default function ExamReviewScreen() {
  const { examId = '', role = 'student', studentId = '', childId = '' } = useLocalSearchParams<{
    examId: string; role?: string; studentId?: string; childId?: string;
  }>();
  const { t } = useTranslation();
  const router = useRouter();
  const c = useAppColors();
  const [review, setReview] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchReview = useCallback(async () => {
    if (!examId) return;
    try {
      let res: any;
      if (role === 'teacher' && studentId) {
        res = await api.teacherGetStudentExamReview(examId, studentId);
      } else if (role === 'parent' && childId) {
        res = await api.parentGetChildExamReview(childId, examId);
      } else {
        res = await api.getExamReview(examId);
      }
      setReview(res?.review ?? null);
    } catch (e) {
      console.error('Review error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [examId, role, studentId, childId]);

  useFocusEffect(useCallback(() => { fetchReview(); }, [fetchReview]));

  if (loading) return <LoadingScreen />;
  if (!review) return (
    <ScreenContainer>
      <Pressable onPress={() => router.back()} style={styles.backBtn}>
        <MaterialCommunityIcons name="arrow-left" size={24} color={c.textHeading} />
      </Pressable>
      <Text style={{ color: c.textMuted, padding: spacing.lg }}>{t('exams.noExams')}</Text>
    </ScreenContainer>
  );

  const pct = Math.round(((review?.score ?? 0) / Math.max(review?.totalMarks ?? 1, 1)) * 100);

  return (
    <ScreenContainer>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchReview(); }} tintColor={c.primary} />}
      >
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={c.textHeading} />
        </Pressable>

        {/* Header */}
        <Text style={[styles.title, { color: c.textHeading }]}>{review?.examTitle ?? ''}</Text>
        {review?.studentName ? <Text style={[styles.studentName, { color: c.accent }]}>{review.studentName}</Text> : null}

        {/* Summary */}
        <View style={[styles.summaryCard, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
          <View style={styles.summaryRow}>
            <View style={[styles.scoreCircleMini, { borderColor: review?.passed ? c.success : c.error }]}>
              <Text style={[styles.scoreNum, { color: review?.passed ? c.success : c.error }]}>{pct}%</Text>
            </View>
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Text style={[styles.scoreLabel, { color: c.textHeading }]}>{review?.score ?? 0} / {review?.totalMarks ?? 0}</Text>
              <View style={[styles.passBadge, { backgroundColor: review?.passed ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)' }]}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: review?.passed ? c.success : c.error }}>
                  {review?.passed ? t('exams.passed') : t('exams.failed')}
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.statsRow}>
            <StatBadge icon="check-circle" color={c.success} label={t('exams.correctCount')} value={review?.correctCount ?? 0} />
            <StatBadge icon="close-circle" color={c.error} label={t('exams.wrongCount')} value={review?.wrongCount ?? 0} />
            <StatBadge icon="minus-circle" color={c.textMuted} label={t('exams.unansweredCount')} value={review?.unanswered ?? 0} />
          </View>
        </View>

        {/* Questions */}
        {(review?.questions ?? []).map((q: any) => (
          <QuestionCard key={q?.id} q={q} c={c} t={t} />
        ))}
      </ScrollView>
    </ScreenContainer>
  );
}

function StatBadge({ icon, color, label, value }: { icon: string; color: string; label: string; value: number }) {
  return (
    <View style={styles.statBadge}>
      <MaterialCommunityIcons name={icon as any} size={16} color={color} />
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={[styles.statLabel, { color }]}>{label}</Text>
    </View>
  );
}

function QuestionCard({ q, c, t }: { q: any; c: any; t: any }) {
  const isCorrect = q?.isCorrect === true;
  const isWrong = q?.isCorrect === false;
  const notAnswered = !q?.studentAnswer;
  const borderColor = isCorrect ? c.success : isWrong ? c.error : c.cardBorder;
  const bgColor = isCorrect ? 'rgba(16,185,129,0.05)' : isWrong ? 'rgba(239,68,68,0.05)' : c.card;

  return (
    <View style={[styles.questionCard, { backgroundColor: bgColor, borderColor, borderWidth: 1.5 }]}>
      {/* Header */}
      <View style={styles.qHeader}>
        <View style={[styles.qIndexBadge, { backgroundColor: borderColor + '25' }]}>
          <Text style={[styles.qIndex, { color: borderColor }]}>{q?.index ?? 0}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.qMarks, { color: c.textMuted }]}>{q?.marks ?? 0} {t('exams.totalMarks')}</Text>
        </View>
        {isCorrect && <MaterialCommunityIcons name="check-circle" size={22} color={c.success} />}
        {isWrong && <MaterialCommunityIcons name="close-circle" size={22} color={c.error} />}
        {notAnswered && <MaterialCommunityIcons name="minus-circle" size={22} color={c.textMuted} />}
      </View>

      {/* Question text */}
      <Text style={[styles.qText, { color: c.textHeading }]}>{q?.questionText ?? ''}</Text>

      {/* Options (for MULTIPLE_CHOICE / TRUE_FALSE) */}
      {(q?.options?.length ?? 0) > 0 && (
        <View style={styles.optionsContainer}>
          {(q.options ?? []).map((opt: string, idx: number) => {
            const optLetter = String.fromCharCode(65 + idx);
            const isStudentChoice = q?.studentAnswer === optLetter || q?.studentAnswer === opt;
            const isCorrectOption = q?.correctAnswer === optLetter || q?.correctAnswer === opt;
            let optBg = 'transparent';
            let optBorderColor = c.cardBorder;
            let optTextColor = c.textBody;
            if (isCorrectOption) {
              optBg = 'rgba(16,185,129,0.12)';
              optBorderColor = c.success;
              optTextColor = c.success;
            }
            if (isStudentChoice && !isCorrectOption) {
              optBg = 'rgba(239,68,68,0.12)';
              optBorderColor = c.error;
              optTextColor = c.error;
            }
            return (
              <View key={idx} style={[styles.optionRow, { backgroundColor: optBg, borderColor: optBorderColor }]}>
                <Text style={[styles.optLetter, { color: optTextColor }]}>{optLetter}</Text>
                <Text style={[styles.optText, { color: optTextColor }]}>{opt ?? ''}</Text>
                {isCorrectOption && <MaterialCommunityIcons name="check" size={16} color={c.success} />}
                {isStudentChoice && !isCorrectOption && <MaterialCommunityIcons name="close" size={16} color={c.error} />}
              </View>
            );
          })}
        </View>
      )}

      {/* Short answer / open-ended */}
      {(q?.questionType === 'SHORT_ANSWER' || q?.questionType === 'OPEN_ENDED') && (
        <View style={styles.answerBlock}>
          <View style={[styles.answerRow, { borderColor: isWrong ? c.error : isCorrect ? c.success : c.cardBorder }]}>
            <Text style={[styles.answerLabel, { color: c.textMuted }]}>{t('exams.yourAnswer')}:</Text>
            <Text style={[styles.answerValue, { color: notAnswered ? c.textMuted : isCorrect ? c.success : c.error }]}>
              {notAnswered ? t('exams.notAnswered') : q?.studentAnswer ?? ''}
            </Text>
          </View>
          {q?.questionType === 'SHORT_ANSWER' && (
            <View style={[styles.answerRow, { borderColor: c.success }]}>
              <Text style={[styles.answerLabel, { color: c.textMuted }]}>{t('exams.correctAnswer')}:</Text>
              <Text style={[styles.answerValue, { color: c.success }]}>{q?.correctAnswer ?? ''}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.md, paddingBottom: 100 },
  backBtn: { marginBottom: spacing.sm, width: 44, height: 44, justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 4 },
  studentName: { fontSize: 14, marginBottom: spacing.md },
  summaryCard: { borderRadius: borderRadius.lg, borderWidth: 1, padding: spacing.md, marginBottom: spacing.lg },
  summaryRow: { flexDirection: 'row', alignItems: 'center' },
  scoreCircleMini: { width: 64, height: 64, borderRadius: 32, borderWidth: 4, alignItems: 'center', justifyContent: 'center' },
  scoreNum: { fontSize: 18, fontWeight: '700' },
  scoreLabel: { fontSize: 18, fontWeight: '600', marginBottom: 4 },
  passBadge: { alignSelf: 'flex-start', paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.full },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: 'rgba(128,128,128,0.15)' },
  statBadge: { alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '700', marginTop: 2 },
  statLabel: { fontSize: 11 },
  questionCard: { borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.md },
  qHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  qIndexBadge: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  qIndex: { fontSize: 14, fontWeight: '700' },
  qMarks: { fontSize: 11 },
  qText: { fontSize: 15, lineHeight: 22, marginBottom: spacing.sm },
  optionsContainer: { gap: 6 },
  optionRow: { flexDirection: 'row', alignItems: 'center', padding: spacing.sm, borderRadius: borderRadius.md, borderWidth: 1 },
  optLetter: { fontSize: 14, fontWeight: '700', width: 24 },
  optText: { fontSize: 14, flex: 1 },
  answerBlock: { gap: 6, marginTop: 4 },
  answerRow: { padding: spacing.sm, borderRadius: borderRadius.md, borderWidth: 1 },
  answerLabel: { fontSize: 11, marginBottom: 2 },
  answerValue: { fontSize: 14, fontWeight: '500' },
});
