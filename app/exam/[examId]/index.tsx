import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { api } from '../../../src/services/api';
import { ScreenContainer } from '../../../src/components/ScreenContainer';
import { Card } from '../../../src/components/Card';
import { GradientButton } from '../../../src/components/GradientButton';
import { LoadingScreen } from '../../../src/components/LoadingScreen';
import { colors, spacing, borderRadius } from '../../../src/theme';

export default function ExamDetailScreen() {
  const { examId = '' } = useLocalSearchParams<{ examId: string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const [exam, setExam] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);

  const fetchExam = useCallback(async () => {
    if (!examId) return;
    try {
      const res = await api.getExamDetail(examId);
      setExam(res?.exam ?? null);
    } catch (e) {
      console.error('Exam detail error:', e);
    } finally {
      setLoading(false);
    }
  }, [examId]);

  useFocusEffect(useCallback(() => { fetchExam(); }, [fetchExam]));

  const handleRegister = async () => {
    setRegistering(true);
    try {
      await api.registerForExam(examId);
      Toast.show({ type: 'success', text1: t('exams.registered') });
      fetchExam();
    } catch (e: any) {
      Toast.show({ type: 'error', text1: e?.message ?? t('common.error') });
    } finally {
      setRegistering(false);
    }
  };

  if (loading) return <LoadingScreen />;
  if (!exam) return <ScreenContainer><Text style={{ color: colors.textMuted, padding: spacing.lg }}>Exam not found</Text></ScreenContainer>;

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textHeading} />
        </Pressable>

        <Text style={styles.title}>{exam?.title ?? ''}</Text>
        {exam?.courseName ? <Text style={styles.course}>{exam.courseName}</Text> : null}
        {exam?.description ? <Text style={styles.description}>{exam.description}</Text> : null}

        <View style={styles.infoGrid}>
          <InfoItem icon="clock-outline" label={t('exams.duration')} value={exam?.duration ? `${exam.duration} ${t('exams.minutes')}` : '-'} />
          <InfoItem icon="star" label={t('exams.totalMarks')} value={String(exam?.totalMarks ?? 0)} />
          <InfoItem icon="check-circle" label={t('exams.passingMarks')} value={String(exam?.passingMarks ?? 0)} />
          <InfoItem icon="reload" label={t('exams.maxAttempts')} value={String(exam?.maxAttempts ?? 1)} />
          <InfoItem icon="help-circle" label={t('exams.questions')} value={String(exam?.questionCount ?? 0)} />
          {exam?.startDate ? <InfoItem icon="calendar-start" label="Start" value={new Date(exam.startDate).toLocaleString()} /> : null}
          {exam?.endDate ? <InfoItem icon="calendar-end" label="End" value={new Date(exam.endDate).toLocaleString()} /> : null}
        </View>

        {/* Action buttons */}
        {!exam?.isRegistered && exam?.selfRegister && !exam?.hasResult && (
          <GradientButton title={t('exams.register')} onPress={handleRegister} loading={registering} style={{ marginTop: spacing.lg }} />
        )}
        {exam?.isRegistered && !exam?.hasResult && (
          <GradientButton
            title={exam?.hasActiveSession ? t('exams.continueExam') : t('exams.startExam')}
            onPress={() => router.push(`/exam/${examId}/take`)}
            style={{ marginTop: spacing.lg }}
          />
        )}
        {exam?.hasResult && (
          <GradientButton
            title={t('exams.viewResults')}
            onPress={() => router.push(`/exam/${examId}/result`)}
            style={{ marginTop: spacing.lg }}
          />
        )}
        {exam?.hasCertificate && (
          <Pressable onPress={() => router.push(`/exam/${examId}/certificate`)} style={styles.certBtn}>
            <MaterialCommunityIcons name="certificate" size={20} color={colors.accent} />
            <Text style={styles.certText}>{t('exams.viewCertificate')}</Text>
          </Pressable>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

function InfoItem({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.infoItem}>
      <MaterialCommunityIcons name={icon as any} size={20} color={colors.primary} />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.md, paddingBottom: spacing.xxl },
  backBtn: { marginBottom: spacing.md, width: 44, height: 44, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '700', color: colors.textHeading },
  course: { fontSize: 14, color: colors.accent, marginTop: 4 },
  description: { fontSize: 14, color: colors.textBody, lineHeight: 22, marginTop: spacing.md },
  infoGrid: { marginTop: spacing.lg, backgroundColor: colors.card, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.cardBorder, padding: spacing.md },
  infoItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm },
  infoLabel: { fontSize: 14, color: colors.textMuted, marginLeft: spacing.sm, flex: 1 },
  infoValue: { fontSize: 14, color: colors.textHeading, fontWeight: '600' },
  certBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: spacing.md, padding: spacing.md },
  certText: { color: colors.accent, fontWeight: '600', marginLeft: spacing.sm },
});
