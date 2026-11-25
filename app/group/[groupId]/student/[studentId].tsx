import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, RefreshControl, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import Toast from 'react-native-toast-message';
import { api } from '../../../../src/services/api';
import { useAppColors } from '../../../../src/hooks/useAppColors';
import { spacing, borderRadius } from '../../../../src/theme';
import { Card } from '../../../../src/components/Card';
import { LoadingScreen } from '../../../../src/components/LoadingScreen';

const MONTHS = [
  { label: 'Yanvar', value: '01' }, { label: 'Fevral', value: '02' }, { label: 'Mart', value: '03' },
  { label: 'Aprel', value: '04' }, { label: 'May', value: '05' }, { label: 'İyun', value: '06' },
  { label: 'İyul', value: '07' }, { label: 'Avqust', value: '08' }, { label: 'Sentyabr', value: '09' },
  { label: 'Oktyabr', value: '10' }, { label: 'Noyabr', value: '11' }, { label: 'Dekabr', value: '12' },
];

export default function StudentDetailScreen() {
  const { groupId = '', studentId = '' } = useLocalSearchParams<{ groupId: string; studentId: string }>();
  const { t } = useTranslation();
  const c = useAppColors();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [detail, setDetail] = useState<any>(null);
  const [attendance, setAttendance] = useState<any>(null);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [expandedExam, setExpandedExam] = useState<string | null>(null);

  // Feedback state
  const [feedbackComment, setFeedbackComment] = useState('');
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [sendingFeedback, setSendingFeedback] = useState(false);

  // Attendance filter
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);

  const fetchDetail = useCallback(async () => {
    try {
      const res = await api.teacherGetStudentDetail(groupId, studentId);
      setDetail(res);
    } catch (e) { console.error(e); }
  }, [groupId, studentId]);

  const fetchAttendance = useCallback(async (month?: string) => {
    try {
      const res = await api.teacherGetStudentAttendance(groupId, studentId, month);
      setAttendance(res);
    } catch (e) { console.error(e); }
  }, [groupId, studentId]);

  const fetchAll = useCallback(async () => {
    await Promise.all([fetchDetail(), fetchAttendance(selectedMonth)]);
    setLoading(false);
    setRefreshing(false);
  }, [fetchDetail, fetchAttendance, selectedMonth]);

  useFocusEffect(useCallback(() => { fetchAll(); }, [fetchAll]));

  const handleMonthChange = (val: string) => {
    setSelectedMonth(val);
    fetchAttendance(val);
  };

  const toggleModule = (id: string) => {
    setExpandedModules(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  if (loading) return <LoadingScreen />;

  const student = detail?.student;
  const modules = detail?.modules ?? [];
  const summary = attendance?.summary;
  const records = attendance?.records ?? [];

  const totalVideos = modules.reduce((s: number, m: any) => s + (m?.videosTotal ?? 0), 0);
  const watchedCount = modules.reduce((s: number, m: any) => s + (m?.videosWatched ?? 0), 0);
  const allExams = modules.flatMap((m: any) => m?.exams ?? []).filter((e: any) => e?.taken);
  const avgExamScore = allExams.length > 0
    ? Math.round(allExams.reduce((s: number, e: any) => s + (e?.percentage ?? 0), 0) / allExams.length)
    : 0;

  const statusColor = (s: string) => s === 'PRESENT' ? c.success : s === 'ABSENT' ? c.error : c.warning;
  const statusIcon = (s: string): any => s === 'PRESENT' ? 'check-circle' : s === 'ABSENT' ? 'close-circle' : 'clock-outline';
  const statusLabel = (s: string) => s === 'PRESENT' ? t('teacher.present') : s === 'LATE' ? t('teacher.late') : t('teacher.absent');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={c.textHeading} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: c.textHeading }]}>{t('teacher.studentDetail')}</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: spacing.md, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAll(); }} tintColor={c.primary} />}
      >
        {/* Student info card */}
        <Card style={{ padding: spacing.lg, alignItems: 'center', marginBottom: spacing.md }}>
          <LinearGradient colors={c.gradientPrimary} style={styles.bigAvatar}>
            <Text style={styles.bigAvatarText}>{(student?.name ?? '?')[0]?.toUpperCase()}</Text>
          </LinearGradient>
          <Text style={{ fontSize: 20, fontWeight: '700', color: c.textHeading, marginTop: spacing.sm }}>{student?.name ?? ''}</Text>
          <Text style={{ fontSize: 13, color: c.textMuted, marginTop: 2 }}>{student?.email ?? ''}</Text>
        </Card>

        {/* Stats row */}
        <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md }}>
          <Card style={[styles.statCard, { flex: 1 }]}>
            <Text style={{ fontSize: 22, fontWeight: '800', color: c.success }}>{summary?.percentage ?? 0}%</Text>
            <Text style={{ fontSize: 11, color: c.textMuted, marginTop: 2 }}>{t('teacher.attendance')}</Text>
          </Card>
          <Card style={[styles.statCard, { flex: 1 }]}>
            <Text style={{ fontSize: 22, fontWeight: '800', color: c.primary }}>{watchedCount}/{totalVideos}</Text>
            <Text style={{ fontSize: 11, color: c.textMuted, marginTop: 2 }}>{t('teacher.videosWatched')}</Text>
          </Card>
          <Card style={[styles.statCard, { flex: 1 }]}>
            <Text style={{ fontSize: 22, fontWeight: '800', color: c.accent }}>{avgExamScore}%</Text>
            <Text style={{ fontSize: 11, color: c.textMuted, marginTop: 2 }}>{t('teacher.examAvg')}</Text>
          </Card>
        </View>

        {/* ===== MODULES ===== */}

        {modules.map((mod: any) => {
          const isExpanded = expandedModules.has(mod?.id);
          const vw = mod?.videosWatched ?? 0;
          const vt = mod?.videosTotal ?? 0;
          const modExams = mod?.exams ?? [];
          return (
            <Card key={mod?.id} style={{ marginBottom: spacing.sm, overflow: 'hidden' }}>
              <Pressable
                onPress={() => toggleModule(mod?.id)}
                style={{ flexDirection: 'row', alignItems: 'center', padding: spacing.md }}
              >
                <MaterialCommunityIcons name="book-open-variant" size={20} color={c.primary} />
                <View style={{ flex: 1, marginLeft: spacing.sm }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: c.textHeading }} numberOfLines={2}>{mod?.title ?? ''}</Text>
                  <Text style={{ fontSize: 11, color: c.textMuted, marginTop: 2 }}>
                    {vw}/{vt} video · {modExams.filter((e: any) => e?.taken).length}/{modExams.length} imtahan
                  </Text>
                </View>
                <MaterialCommunityIcons
                  name={isExpanded ? 'chevron-up' : 'chevron-down'}
                  size={22}
                  color={c.textMuted}
                />
              </Pressable>

              {isExpanded && (
                <View style={{ paddingHorizontal: spacing.md, paddingBottom: spacing.md }}>
                  {/* Videos */}
                  {(mod?.videos ?? []).length > 0 && (
                    <>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: c.textMuted, marginBottom: 6, textTransform: 'uppercase' }}>Videolar</Text>
                      {(mod?.videos ?? []).map((v: any, vi: number) => (
                        <View key={v?.id ?? vi} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 5 }}>
                          <MaterialCommunityIcons
                            name={v?.watched ? 'check-circle' : 'circle-outline'}
                            size={16}
                            color={v?.watched ? c.success : c.textMuted}
                          />
                          <Text style={{ flex: 1, marginLeft: 8, fontSize: 13, color: v?.watched ? c.textBody : c.textMuted }}>
                            {v?.title ?? ''}
                          </Text>
                        </View>
                      ))}
                    </>
                  )}

                  {/* Exams */}
                  {modExams.length > 0 && (
                    <>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: c.textMuted, marginTop: spacing.sm, marginBottom: 6, textTransform: 'uppercase' }}>İmtahanlar</Text>
                      {modExams.map((ex: any) => {
                        const isExamExpanded = expandedExam === ex?.id;
                        return (
                          <View key={ex?.id} style={{ marginBottom: 4 }}>
                            <Pressable
                              onPress={() => setExpandedExam(isExamExpanded ? null : ex?.id)}
                              style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 6 }}
                            >
                              <MaterialCommunityIcons
                                name={ex?.taken ? 'file-document-check' : 'file-document-outline'}
                                size={16}
                                color={ex?.taken ? c.primary : c.textMuted}
                              />
                              <Text style={{ flex: 1, marginLeft: 8, fontSize: 13, fontWeight: '600', color: c.textHeading }}>
                                {ex?.title ?? ''}
                              </Text>
                              {ex?.taken && (
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                  <Text style={{ fontSize: 12, fontWeight: '700', color: (ex?.percentage ?? 0) >= 60 ? c.success : c.error }}>
                                    {ex?.score ?? 0}/{ex?.totalMarks ?? 0}
                                  </Text>
                                  <MaterialCommunityIcons
                                    name={isExamExpanded ? 'chevron-up' : 'chevron-down'}
                                    size={18}
                                    color={c.textMuted}
                                  />
                                </View>
                              )}
                              {!ex?.taken && (
                                <Text style={{ fontSize: 11, color: c.textMuted }}>Verilməyib</Text>
                              )}
                            </Pressable>

                            {/* Questions detail */}
                            {isExamExpanded && ex?.taken && (ex?.questions ?? []).length > 0 && (
                              <View style={{ marginLeft: 4, borderLeftWidth: 2, borderLeftColor: c.primary + '30', paddingLeft: spacing.sm }}>
                                {(ex?.questions ?? []).map((q: any, qi: number) => (
                                  <QuestionDetail key={q?.id ?? qi} q={q} idx={qi} c={c} />
                                ))}
                              </View>
                            )}
                          </View>
                        );
                      })}
                    </>
                  )}
                </View>
              )}
            </Card>
          );
        })}

        {/* ===== ATTENDANCE ===== */}
        <Text style={{ fontSize: 17, fontWeight: '700', color: c.textHeading, marginTop: spacing.lg, marginBottom: spacing.sm }}>{t('teacher.attendanceHistory')}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.sm }}>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {MONTHS.map(m => {
              const val = `${now.getFullYear()}-${m.value}`;
              const isSel = val === selectedMonth;
              return (
                <Pressable
                  key={val}
                  onPress={() => handleMonthChange(val)}
                  style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: borderRadius.sm, backgroundColor: isSel ? c.primary : c.surfaceLight }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '600', color: isSel ? '#fff' : c.textBody }}>{m.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        {summary && (
          <Card style={{ padding: spacing.md, marginBottom: spacing.md }}>
            <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md }}>
              <View style={[styles.attBadge, { backgroundColor: c.success + '18' }]}>
                <Text style={{ fontSize: 20, fontWeight: '700', color: c.success }}>{summary?.present ?? 0}</Text>
                <Text style={{ fontSize: 10, color: c.success }}>{t('teacher.present')}</Text>
              </View>
              <View style={[styles.attBadge, { backgroundColor: c.warning + '18' }]}>
                <Text style={{ fontSize: 20, fontWeight: '700', color: c.warning }}>{summary?.late ?? 0}</Text>
                <Text style={{ fontSize: 10, color: c.warning }}>{t('teacher.late')}</Text>
              </View>
              <View style={[styles.attBadge, { backgroundColor: c.error + '18' }]}>
                <Text style={{ fontSize: 20, fontWeight: '700', color: c.error }}>{summary?.absent ?? 0}</Text>
                <Text style={{ fontSize: 10, color: c.error }}>{t('teacher.absent')}</Text>
              </View>
            </View>
            {records.map((r: any, i: number) => (
              <View key={r?.id ?? i} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 6, borderBottomWidth: i < records.length - 1 ? 1 : 0, borderBottomColor: c.cardBorder }}>
                <MaterialCommunityIcons name={statusIcon(r?.status)} size={16} color={statusColor(r?.status ?? 'ABSENT')} />
                <Text style={{ flex: 1, marginLeft: 8, fontSize: 13, color: c.textBody }}>
                  {r?.date ? new Date(r.date).toLocaleDateString('az-AZ', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
                </Text>
                <Text style={{ fontSize: 12, fontWeight: '600', color: statusColor(r?.status ?? 'ABSENT') }}>
                  {statusLabel(r?.status ?? 'ABSENT')}
                </Text>
              </View>
            ))}
            {records.length === 0 && (
              <Text style={{ fontSize: 13, color: c.textMuted, textAlign: 'center', paddingVertical: spacing.md }}>
                Bu ay üçün qeyd yoxdur
              </Text>
            )}
          </Card>
        )}

        {/* ===== FEEDBACK ===== */}
        <Text style={{ fontSize: 17, fontWeight: '700', color: c.textHeading, marginTop: spacing.lg, marginBottom: spacing.sm }}>Rəy göndər</Text>
        <Card style={{ padding: spacing.md, marginBottom: spacing.lg }}>
          <Text style={{ fontSize: 12, color: c.textMuted, marginBottom: 8 }}>Valideynə rəy göndərin</Text>
          {/* Star Rating */}
          <View style={{ flexDirection: 'row', gap: 4, marginBottom: spacing.sm }}>
            {[1, 2, 3, 4, 5].map(star => (
              <Pressable key={star} onPress={() => setFeedbackRating(star)}>
                <MaterialCommunityIcons
                  name={star <= feedbackRating ? 'star' : 'star-outline'}
                  size={28}
                  color={star <= feedbackRating ? '#F59E0B' : c.textMuted}
                />
              </Pressable>
            ))}
          </View>
          {/* Comment */}
          <TextInput
            value={feedbackComment}
            onChangeText={setFeedbackComment}
            placeholder="Rəyinizi yazın..."
            placeholderTextColor={c.textMuted}
            multiline
            style={{ borderWidth: 1, borderColor: c.cardBorder, borderRadius: borderRadius.md, padding: spacing.sm, fontSize: 14, color: c.textBody, backgroundColor: c.surfaceLight, minHeight: 80, textAlignVertical: 'top' }}
          />
          <Pressable
            onPress={async () => {
              if (!feedbackComment.trim()) return;
              setSendingFeedback(true);
              try {
                await api.teacherGiveFeedback({ studentId, comment: feedbackComment.trim(), rating: feedbackRating || undefined });
                Toast.show({ type: 'success', text1: 'Rəy göndərildi' });
                setFeedbackComment('');
                setFeedbackRating(0);
              } catch (e: any) {
                Toast.show({ type: 'error', text1: e?.message ?? 'Xəta baş verdi' });
              } finally {
                setSendingFeedback(false);
              }
            }}
            disabled={sendingFeedback || !feedbackComment.trim()}
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: borderRadius.md, backgroundColor: c.primary, marginTop: spacing.sm, opacity: sendingFeedback || !feedbackComment.trim() ? 0.5 : 1 }}
          >
            <MaterialCommunityIcons name="send" size={16} color="#fff" />
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14, marginLeft: 6 }}>
              {sendingFeedback ? 'Göndərilir...' : 'Göndər'}
            </Text>
          </Pressable>
        </Card>
      </ScrollView>


    </SafeAreaView>
  );
}

/* ===== QuestionDetail component (same as parent view) ===== */
function QuestionDetail({ q, idx, c }: { q: any; idx: number; c: any }) {
  const isCorrect = q?.isCorrect;
  const iconName = isCorrect === true ? 'check-circle' : isCorrect === false ? 'close-circle' : 'help-circle-outline';
  const iconColor = isCorrect === true ? c.success : isCorrect === false ? c.error : c.textMuted;
  const options = q?.options ?? [];

  return (
    <View style={{ paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: c.cardBorder + '30' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
        <MaterialCommunityIcons name={iconName as any} size={18} color={iconColor} />
        <Text style={{ fontSize: 14, fontWeight: '700', color: c.textHeading, marginLeft: 6 }}>Sual {idx + 1}</Text>
        <View style={{ flex: 1 }} />
        <Text style={{ fontSize: 12, fontWeight: '600', color: iconColor }}>{q?.marks ?? 0} bal</Text>
      </View>

      <View style={{ marginLeft: 24, marginBottom: 8, backgroundColor: c.surfaceLight, borderRadius: borderRadius.md, padding: 10, borderLeftWidth: 3, borderLeftColor: c.primary + '60' }}>
        <Text style={{ fontSize: 14, color: c.textHeading, lineHeight: 20 }}>{q?.questionText ?? ''}</Text>
      </View>

      {q?.imageUrl ? (
        <View style={{ marginLeft: 24, marginBottom: 8, borderRadius: borderRadius.md, overflow: 'hidden', backgroundColor: c.surfaceLight }}>
          <Image
            source={{ uri: q.imageUrl }}
            style={{ width: '100%', height: 180, borderRadius: borderRadius.md }}
            contentFit="contain"
            placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
            transition={200}
          />
        </View>
      ) : null}

      {options.length > 0 && (
        <View style={{ marginLeft: 24 }}>
          {options.map((opt: string, oi: number) => {
            const optLetter = String.fromCharCode(65 + oi);
            const studentAns = (q?.studentAnswer ?? '').trim();
            const correctAns = (q?.correctAnswer ?? '').trim();
            const isStudentPick = studentAns.toLowerCase() === opt.trim().toLowerCase() || studentAns.toUpperCase() === optLetter;
            const isCorrectOpt = correctAns.toLowerCase() === opt.trim().toLowerCase() || correctAns.toUpperCase() === optLetter;

            let bgColor = 'transparent';
            let borderColor = c.cardBorder;
            let textColor = c.textBody;
            let rightIcon: string | null = null;
            let rightIconColor = c.textMuted;

            if (isCorrectOpt && isStudentPick) {
              bgColor = c.success + '15'; borderColor = c.success; textColor = c.success;
              rightIcon = 'check-circle'; rightIconColor = c.success;
            } else if (isStudentPick && !isCorrectOpt) {
              bgColor = c.error + '15'; borderColor = c.error; textColor = c.error;
              rightIcon = 'close-circle'; rightIconColor = c.error;
            } else if (isCorrectOpt) {
              bgColor = c.success + '10'; borderColor = c.success + '60'; textColor = c.success;
              rightIcon = 'check'; rightIconColor = c.success;
            }

            return (
              <View key={oi} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 7, paddingHorizontal: 10, marginBottom: 4, borderRadius: borderRadius.sm, backgroundColor: bgColor, borderWidth: 1, borderColor }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: textColor, width: 24 }}>{optLetter}.</Text>
                <Text style={{ fontSize: 13, color: textColor, flex: 1 }}>{opt}</Text>
                {isStudentPick && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 6, gap: 4 }}>
                    <Text style={{ fontSize: 10, fontWeight: '600', color: textColor }}>Şagird</Text>
                    <MaterialCommunityIcons name={(rightIcon ?? 'check') as any} size={16} color={rightIconColor} />
                  </View>
                )}
                {isCorrectOpt && !isStudentPick && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 6, gap: 4 }}>
                    <Text style={{ fontSize: 10, fontWeight: '600', color: c.success }}>Düzgün</Text>
                    <MaterialCommunityIcons name="check" size={16} color={c.success} />
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}

      {options.length === 0 && (
        <View style={{ marginLeft: 24, marginTop: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
            <MaterialCommunityIcons name="account-edit" size={14} color={isCorrect === false ? c.error : c.textBody} />
            <Text style={{ fontSize: 13, color: isCorrect === false ? c.error : c.textBody, marginLeft: 6, flex: 1 }}>
              Cavab: {q?.studentAnswer || '—'}
            </Text>
          </View>
          {isCorrect !== true && (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <MaterialCommunityIcons name="check-circle-outline" size={14} color={c.success} />
              <Text style={{ fontSize: 13, color: c.success, marginLeft: 6, flex: 1 }}>
                Düzgün: {q?.correctAnswer || '—'}
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  backBtn: { padding: 8, marginRight: 4 },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  bigAvatar: { width: 70, height: 70, borderRadius: 35, alignItems: 'center', justifyContent: 'center' },
  bigAvatarText: { color: '#FFF', fontSize: 28, fontWeight: '700' },
  statCard: { padding: spacing.md, alignItems: 'center' },
  attBadge: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 10 },
});
