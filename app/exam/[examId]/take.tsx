import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { api } from '../../../src/services/api';
import { ScreenContainer } from '../../../src/components/ScreenContainer';
import { GradientButton } from '../../../src/components/GradientButton';
import { LoadingScreen } from '../../../src/components/LoadingScreen';
import { colors, spacing, borderRadius } from '../../../src/theme';

export default function ExamTakingScreen() {
  const { examId = '' } = useLocalSearchParams<{ examId: string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentIdx, setCurrentIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const examDuration = useRef<number | null>(null);

  const fetchSession = useCallback(async () => {
    if (!examId) return;
    try {
      const res = await api.getExamSession(examId);
      const s = res?.session;
      if (s) {
        setSession(s);
        setAnswers(s?.answers ?? {});
        setCurrentIdx(s?.currentIdx ?? 0);
        // Compute time left
        const detail = await api.getExamDetail(examId);
        const dur = detail?.exam?.duration;
        if (dur && s?.startedAt) {
          examDuration.current = dur;
          const elapsed = Math.floor((Date.now() - new Date(s.startedAt).getTime()) / 1000);
          const remaining = Math.max(0, dur * 60 - elapsed);
          setTimeLeft(remaining);
        }
      }
    } catch (e: any) {
      Alert.alert(t('common.error'), e?.message ?? '');
      router.back();
    } finally {
      setLoading(false);
    }
  }, [examId]);

  useEffect(() => { fetchSession(); }, [fetchSession]);

  // Timer
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev === null) return null;
        if (prev <= 1) {
          clearInterval(interval);
          handleSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft !== null]);

  const saveProgress = useCallback(async (ans: Record<string, string>, idx: number) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        await api.saveExamSession(examId, { answers: ans, currentIdx: idx });
      } catch {}
    }, 1000);
  }, [examId]);

  const setAnswer = (questionId: string, value: string) => {
    const updated = { ...answers, [questionId]: value };
    setAnswers(updated);
    saveProgress(updated, currentIdx);
  };

  const goTo = (idx: number) => {
    setCurrentIdx(idx);
    saveProgress(answers, idx);
  };

  const handleSubmit = async (autoSubmit = false) => {
    if (!autoSubmit) {
      Alert.alert(t('exams.submitExam'), t('exams.confirmSubmit'), [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('common.confirm'), onPress: () => doSubmit() },
      ]);
    } else {
      Alert.alert(t('exams.timeUp'));
      doSubmit();
    }
  };

  const doSubmit = async () => {
    setSubmitting(true);
    try {
      await api.saveExamSession(examId, { answers, currentIdx });
      await api.submitExam(examId);
      router.replace(`/exam/${examId}/result`);
    } catch (e: any) {
      Alert.alert(t('common.error'), e?.message ?? '');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingScreen />;
  if (!session) return <ScreenContainer><Text style={{ color: colors.textMuted, padding: spacing.lg }}>No session</Text></ScreenContainer>;

  const questions = session?.questions ?? [];
  const question = questions[currentIdx];
  const totalQuestions = questions.length;
  const answeredCount = Object.keys(answers).filter(k => (answers[k] ?? '').trim().length > 0).length;

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec < 10 ? '0' : ''}${sec}`;
  };

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle} numberOfLines={1}>Q {currentIdx + 1}/{totalQuestions}</Text>
        {timeLeft !== null && (
          <View style={[styles.timerBadge, timeLeft < 60 && { backgroundColor: 'rgba(239,68,68,0.2)' }]}>
            <MaterialCommunityIcons name="clock-outline" size={16} color={timeLeft < 60 ? colors.error : colors.accent} />
            <Text style={[styles.timerText, timeLeft < 60 && { color: colors.error }]}>{formatTime(timeLeft)}</Text>
          </View>
        )}
      </View>

      {/* Progress bar */}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${(answeredCount / Math.max(totalQuestions, 1)) * 100}%` }]} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {question && (
          <View>
            <Text style={styles.questionText}>{question?.questionText ?? ''}</Text>

            {question?.questionType === 'MULTIPLE_CHOICE' && (
              <View style={styles.optionsContainer}>
                {(question?.options ?? []).map((opt: string, idx: number) => (
                  <Pressable
                    key={idx}
                    onPress={() => setAnswer(question?.id, opt)}
                    style={[styles.optionBtn, answers[question?.id] === opt && styles.optionSelected]}
                  >
                    <View style={[styles.radio, answers[question?.id] === opt && styles.radioSelected]} />
                    <Text style={[styles.optionText, answers[question?.id] === opt && { color: colors.textHeading }]}>{opt}</Text>
                  </Pressable>
                ))}
              </View>
            )}

            {question?.questionType === 'TRUE_FALSE' && (
              <View style={styles.tfContainer}>
                {['True', 'False'].map(val => (
                  <Pressable
                    key={val}
                    onPress={() => setAnswer(question?.id, val)}
                    style={[styles.tfBtn, answers[question?.id] === val && styles.tfBtnSelected]}
                  >
                    <Text style={[styles.tfText, answers[question?.id] === val && { color: colors.white }]}>{val}</Text>
                  </Pressable>
                ))}
              </View>
            )}

            {question?.questionType === 'SHORT_ANSWER' && (
              <TextInput
                style={styles.textInput}
                placeholder="Your answer..."
                placeholderTextColor={colors.textMuted}
                value={answers[question?.id] ?? ''}
                onChangeText={v => setAnswer(question?.id, v)}
              />
            )}

            {question?.questionType === 'OPEN_ENDED' && (
              <TextInput
                style={[styles.textInput, { height: 120, textAlignVertical: 'top' }]}
                placeholder="Your answer..."
                placeholderTextColor={colors.textMuted}
                value={answers[question?.id] ?? ''}
                onChangeText={v => setAnswer(question?.id, v)}
                multiline
              />
            )}
          </View>
        )}
      </ScrollView>

      {/* Navigation */}
      <View style={styles.navRow}>
        <Pressable onPress={() => goTo(Math.max(0, currentIdx - 1))} disabled={currentIdx === 0} style={[styles.navBtn, currentIdx === 0 && { opacity: 0.4 }]}>
          <Text style={styles.navBtnText}>{t('exams.previous')}</Text>
        </Pressable>
        {currentIdx < totalQuestions - 1 ? (
          <Pressable onPress={() => goTo(currentIdx + 1)} style={styles.navBtn}>
            <Text style={styles.navBtnText}>{t('exams.next')}</Text>
          </Pressable>
        ) : (
          <GradientButton title={t('exams.submitExam')} onPress={() => handleSubmit(false)} loading={submitting} style={{ flex: 1, marginLeft: spacing.sm }} />
        )}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md },
  headerTitle: { fontSize: 18, fontWeight: '600', color: colors.textHeading },
  timerBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(6,182,212,0.1)', paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.full },
  timerText: { fontSize: 16, fontWeight: '700', color: colors.accent, marginLeft: 4 },
  progressBar: { height: 4, backgroundColor: colors.surfaceLight, marginHorizontal: spacing.md },
  progressFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 2 },
  scroll: { padding: spacing.md, paddingBottom: spacing.xxl },
  questionText: { fontSize: 18, fontWeight: '500', color: colors.textHeading, lineHeight: 26, marginBottom: spacing.lg },
  optionsContainer: { gap: spacing.sm },
  optionBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: borderRadius.md, padding: spacing.md },
  optionSelected: { borderColor: colors.primary, backgroundColor: 'rgba(37,99,235,0.1)' },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.textMuted, marginRight: spacing.md },
  radioSelected: { borderColor: colors.primary, backgroundColor: colors.primary },
  optionText: { fontSize: 15, color: colors.textBody, flex: 1 },
  tfContainer: { flexDirection: 'row', gap: spacing.md },
  tfBtn: { flex: 1, height: 56, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: borderRadius.md },
  tfBtnSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  tfText: { fontSize: 16, fontWeight: '600', color: colors.textBody },
  textInput: { backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.inputBorder, borderRadius: borderRadius.md, padding: spacing.md, fontSize: 16, color: colors.textHeading, minHeight: 52 },
  navRow: { flexDirection: 'row', padding: spacing.md, gap: spacing.sm },
  navBtn: { flex: 1, height: 52, borderRadius: borderRadius.md, backgroundColor: colors.surfaceLight, alignItems: 'center', justifyContent: 'center' },
  navBtnText: { fontSize: 16, fontWeight: '600', color: colors.textHeading },
});
