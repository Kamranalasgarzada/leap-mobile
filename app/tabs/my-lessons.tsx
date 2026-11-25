import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { View, Text, ScrollView, RefreshControl, Pressable, StyleSheet, Modal, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '../../src/services/api';
import { ScreenContainer } from '../../src/components/ScreenContainer';
import { Card } from '../../src/components/Card';
import { EmptyState } from '../../src/components/EmptyState';
import { LoadingScreen } from '../../src/components/LoadingScreen';
import { useAppColors } from '../../src/hooks/useAppColors';
import { spacing, borderRadius } from '../../src/theme';

const MONTHS = [
  { label: 'Yanvar', value: '01' }, { label: 'Fevral', value: '02' }, { label: 'Mart', value: '03' },
  { label: 'Aprel', value: '04' }, { label: 'May', value: '05' }, { label: 'İyun', value: '06' },
  { label: 'İyul', value: '07' }, { label: 'Avqust', value: '08' }, { label: 'Sentyabr', value: '09' },
  { label: 'Oktyabr', value: '10' }, { label: 'Noyabr', value: '11' }, { label: 'Dekabr', value: '12' },
];

export default function MyLessonsScreen() {
  const { t } = useTranslation();
  const c = useAppColors();
  const router = useRouter();
  const [tab, setTab] = useState<'lessons' | 'exams' | 'attendance'>('lessons');
  const [courses, setCourses] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Attendance filters
  const [attCourseId, setAttCourseId] = useState<string>('');
  const [attMonth, setAttMonth] = useState<string>('');
  const [attFiltering, setAttFiltering] = useState(false);
  const [showCourseDropdown, setShowCourseDropdown] = useState(false);
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [coursesRes, examsRes, attRes] = await Promise.all([
        api.getCourses().catch(() => ({ courses: [] })),
        api.getExams('all').catch(() => ({ exams: [] })),
        api.getAttendance().catch(() => ({ summary: {}, records: [] })),
      ]);
      setCourses(coursesRes?.courses ?? []);
      setExams((examsRes?.exams ?? []).filter((e: any) => e?.isRegistered === true));
      setAttendance(attRes);
    } catch (e) {
      console.error('MyLessons error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

  // Re-fetch attendance only when filters change (no full-screen loading)
  useEffect(() => {
    if (!attCourseId && !attMonth) return; // initial load handled by fetchData
    let cancelled = false;
    setAttFiltering(true);
    api.getAttendance(attCourseId || undefined, attMonth || undefined)
      .then(res => { if (!cancelled) setAttendance(res); })
      .catch(() => { if (!cancelled) setAttendance({ summary: {}, records: [] }); })
      .finally(() => { if (!cancelled) setAttFiltering(false); });
    return () => { cancelled = true; };
  }, [attCourseId, attMonth]);

  // Get unique courses from enrolled courses for filter (stable, not dependent on filtered results)
  const attCourseOptions = useMemo(() => {
    const seen = new Map<string, string>();
    (courses ?? []).forEach((cr: any) => {
      if (cr?.id && cr?.name && !seen.has(cr.id)) {
        seen.set(cr.id, cr.name);
      }
    });
    return Array.from(seen.entries()).map(([id, name]) => ({ id, name }));
  }, [courses]);

  const currentYear = new Date().getFullYear();

  const selectedCourseName = useMemo(() => {
    if (!attCourseId) return 'Bütün fənlər';
    return attCourseOptions.find(o => o.id === attCourseId)?.name ?? 'Bütün fənlər';
  }, [attCourseId, attCourseOptions]);

  const selectedMonthName = useMemo(() => {
    if (!attMonth) return 'Bütün aylar';
    const mv = attMonth.split('-')[1];
    return MONTHS.find(m => m.value === mv)?.label ?? 'Bütün aylar';
  }, [attMonth]);

  const handleCourseSelect = useCallback((id: string) => {
    setAttCourseId(id);
    setShowCourseDropdown(false);
  }, []);

  const handleMonthSelect = useCallback((monthVal: string) => {
    setAttMonth(monthVal);
    setShowMonthDropdown(false);
  }, []);

  if (loading) return <LoadingScreen />;

  return (
    <ScreenContainer>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xxl }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor={c.primary} />}
      >
        <Text style={[styles.title, { color: c.textHeading }]}>{t('myLessons.title')}</Text>

        {/* Tab Toggle */}
        <View style={[styles.toggle, { backgroundColor: c.surfaceLight }]}>
          <Pressable
            onPress={() => setTab('lessons')}
            style={[styles.toggleBtn, tab === 'lessons' && { backgroundColor: c.primary }]}
          >
            <MaterialCommunityIcons name="book-open-variant" size={14} color={tab === 'lessons' ? c.white : c.textMuted} />
            <Text style={[styles.toggleText, { color: tab === 'lessons' ? c.white : c.textMuted }]} numberOfLines={1}>
              {t('myLessons.lessons')}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setTab('exams')}
            style={[styles.toggleBtn, tab === 'exams' && { backgroundColor: c.primary }]}
          >
            <MaterialCommunityIcons name="clipboard-text" size={14} color={tab === 'exams' ? c.white : c.textMuted} />
            <Text style={[styles.toggleText, { color: tab === 'exams' ? c.white : c.textMuted }]} numberOfLines={1}>
              {t('myLessons.exams')}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setTab('attendance')}
            style={[styles.toggleBtn, tab === 'attendance' && { backgroundColor: c.primary }]}
          >
            <MaterialCommunityIcons name="calendar-check" size={14} color={tab === 'attendance' ? c.white : c.textMuted} />
            <Text style={[styles.toggleText, { color: tab === 'attendance' ? c.white : c.textMuted }]} numberOfLines={1}>
              {t('myLessons.attendance')}
            </Text>
          </Pressable>
        </View>

        {tab === 'lessons' && (
          courses.length === 0 ? (
            <EmptyState icon="book-open-variant" message={t('myLessons.noCourses')} />
          ) : (
            courses.map((course: any) => (
              <Card key={course?.id ?? ''} onPress={() => router.push(`/course/${course?.id}`)} style={styles.courseCard}>
                <View style={styles.courseHeader}>
                  <View style={[styles.courseIcon, { backgroundColor: 'rgba(124,58,237,0.12)' }]}>
                    <MaterialCommunityIcons name="book-open-variant" size={24} color={c.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.courseName, { color: c.textHeading }]} numberOfLines={1}>{course?.name ?? ''}</Text>
                    <Text style={[styles.courseTeacher, { color: c.textMuted }]} numberOfLines={1}>
                      {course?.teacherName ?? course?.groupName ?? ''}
                    </Text>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={24} color={c.textMuted} />
                </View>
                {(course?.totalVideos ?? 0) > 0 && (
                  <View style={styles.progressContainer}>
                    <View style={[styles.progressBar, { backgroundColor: c.surfaceLight }]}>
                      <LinearGradient
                        colors={c.gradientPrimary}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[styles.progressFill, { width: `${Math.min(100, Math.round(((course?.watchedVideos ?? 0) / (course?.totalVideos ?? 1)) * 100))}%` }]}
                      />
                    </View>
                    <Text style={[styles.progressText, { color: c.textMuted }]}>
                      {course?.watchedVideos ?? 0}/{course?.totalVideos ?? 0} {t('myLessons.videos')}
                    </Text>
                  </View>
                )}
              </Card>
            ))
          )
        )}

        {tab === 'exams' && (
          exams.length === 0 ? (
            <EmptyState icon="clipboard-text" message={t('myLessons.noExams')} />
          ) : (
            exams.map((exam: any) => (
              <Card key={exam?.id ?? ''} onPress={() => router.push(`/exam/${exam?.id}`)} style={styles.examCard}>
                <View style={styles.examHeader}>
                  <View style={[styles.courseIcon, { backgroundColor: 'rgba(16,185,129,0.12)' }]}>
                    <MaterialCommunityIcons name="clipboard-text" size={24} color={c.success} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.courseName, { color: c.textHeading }]} numberOfLines={1}>{exam?.title ?? ''}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 }}>
                      {exam?.score != null && (
                        <Text style={[styles.examScore, { color: c.primary }]}>
                          {exam.score}/{exam?.totalMarks ?? 100}
                        </Text>
                      )}
                      <Text style={[styles.courseTeacher, { color: c.textMuted }]}>
                        {exam?.courseName ?? ''}
                      </Text>
                    </View>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={24} color={c.textMuted} />
                </View>
              </Card>
            ))
          )
        )}

        {tab === 'attendance' && (
          <>
            {/* Filter Row — dropdown style */}
            <View style={styles.filterBar}>
              <MaterialCommunityIcons name="filter-variant" size={18} color={c.textMuted} />
              <Pressable onPress={() => setShowCourseDropdown(true)} style={[styles.dropdownBtn, { backgroundColor: c.surfaceLight }]}>
                <Text style={[styles.dropdownBtnText, { color: c.textHeading }]} numberOfLines={1}>{selectedCourseName}</Text>
                <MaterialCommunityIcons name="chevron-down" size={18} color={c.textMuted} />
              </Pressable>
              <Pressable onPress={() => setShowMonthDropdown(true)} style={[styles.dropdownBtn, { backgroundColor: c.surfaceLight }]}>
                <Text style={[styles.dropdownBtnText, { color: c.textHeading }]} numberOfLines={1}>{selectedMonthName}</Text>
                <MaterialCommunityIcons name="chevron-down" size={18} color={c.textMuted} />
              </Pressable>
            </View>

            {/* Course Dropdown Modal */}
            <Modal visible={showCourseDropdown} transparent animationType="fade" onRequestClose={() => setShowCourseDropdown(false)}>
              <Pressable style={styles.modalOverlay} onPress={() => setShowCourseDropdown(false)}>
                <View style={[styles.modalSheet, { backgroundColor: c.surface }]}>
                  <Text style={[styles.modalTitle, { color: c.textHeading }]}>Fənn seçin</Text>
                  <FlatList
                    data={[{ id: '', name: 'Bütün fənlər' }, ...attCourseOptions]}
                    keyExtractor={(item) => item.id || '_all'}
                    renderItem={({ item }) => (
                      <Pressable onPress={() => handleCourseSelect(item.id)} style={[styles.modalItem, attCourseId === item.id && { backgroundColor: c.primary + '18' }]}>
                        <Text style={[styles.modalItemText, { color: attCourseId === item.id ? c.primary : c.textHeading }]}>{item.name}</Text>
                        {attCourseId === item.id && <MaterialCommunityIcons name="check" size={20} color={c.primary} />}
                      </Pressable>
                    )}
                  />
                </View>
              </Pressable>
            </Modal>

            {/* Month Dropdown Modal */}
            <Modal visible={showMonthDropdown} transparent animationType="fade" onRequestClose={() => setShowMonthDropdown(false)}>
              <Pressable style={styles.modalOverlay} onPress={() => setShowMonthDropdown(false)}>
                <View style={[styles.modalSheet, { backgroundColor: c.surface }]}>
                  <Text style={[styles.modalTitle, { color: c.textHeading }]}>Ay seçin</Text>
                  <FlatList
                    data={[{ label: 'Bütün aylar', value: '' }, ...MONTHS.map(m => ({ ...m, value: `${currentYear}-${m.value}` }))]}
                    keyExtractor={(item) => item.value || '_all'}
                    renderItem={({ item }) => (
                      <Pressable onPress={() => handleMonthSelect(item.value)} style={[styles.modalItem, attMonth === item.value && { backgroundColor: c.primary + '18' }]}>
                        <Text style={[styles.modalItemText, { color: attMonth === item.value ? c.primary : c.textHeading }]}>{item.label}</Text>
                        {attMonth === item.value && <MaterialCommunityIcons name="check" size={20} color={c.primary} />}
                      </Pressable>
                    )}
                  />
                </View>
              </Pressable>
            </Modal>

            {(attendance?.records?.length ?? 0) === 0 ? (
              <EmptyState icon="calendar-check" message={t('myLessons.noAttendance')} />
            ) : (
              <>
                {/* Summary */}
                <View style={[styles.attSummary, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
                  <View style={styles.attSummaryItem}>
                    <Text style={[styles.attSummaryValue, { color: c.success }]}>{attendance?.summary?.present ?? 0}</Text>
                    <Text style={[styles.attSummaryLabel, { color: c.textMuted }]}>{t('myLessons.present')}</Text>
                  </View>
                  <View style={[styles.attSummaryDivider, { backgroundColor: c.cardBorder }]} />
                  <View style={styles.attSummaryItem}>
                    <Text style={[styles.attSummaryValue, { color: '#F59E0B' }]}>{attendance?.summary?.late ?? 0}</Text>
                    <Text style={[styles.attSummaryLabel, { color: c.textMuted }]}>{t('myLessons.late')}</Text>
                  </View>
                  <View style={[styles.attSummaryDivider, { backgroundColor: c.cardBorder }]} />
                  <View style={styles.attSummaryItem}>
                    <Text style={[styles.attSummaryValue, { color: c.error }]}>{attendance?.summary?.absent ?? 0}</Text>
                    <Text style={[styles.attSummaryLabel, { color: c.textMuted }]}>{t('myLessons.absent')}</Text>
                  </View>
                  <View style={[styles.attSummaryDivider, { backgroundColor: c.cardBorder }]} />
                  <View style={styles.attSummaryItem}>
                    <Text style={[styles.attSummaryValue, { color: c.primary }]}>{attendance?.summary?.percentage ?? 0}%</Text>
                    <Text style={[styles.attSummaryLabel, { color: c.textMuted }]}>Ümumi</Text>
                  </View>
                </View>

                {/* Records */}
                {(attendance?.records ?? []).map((rec: any, idx: number) => {
                  const statusColor = rec?.status === 'PRESENT' ? c.success : rec?.status === 'LATE' ? '#F59E0B' : c.error;
                  const statusIcon = rec?.status === 'PRESENT' ? 'check-circle' : rec?.status === 'LATE' ? 'clock-alert-outline' : 'close-circle';
                  const statusText = rec?.status === 'PRESENT' ? t('myLessons.present') : rec?.status === 'LATE' ? t('myLessons.late') : t('myLessons.absent');
                  return (
                    <Card key={rec?.id ?? idx} style={styles.attCard}>
                      <View style={styles.attRow}>
                        <View style={[styles.attIconBox, { backgroundColor: statusColor + '15' }]}>
                          <MaterialCommunityIcons name={statusIcon} size={24} color={statusColor} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.courseName, { color: c.textHeading }]} numberOfLines={1}>{rec?.courseName ?? ''}</Text>
                          <Text style={[styles.courseTeacher, { color: c.textMuted }]} numberOfLines={1}>{rec?.groupName ?? ''}</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={[styles.attStatus, { color: statusColor }]}>{statusText}</Text>
                          <Text style={[styles.attDate, { color: c.textMuted }]}>
                            {rec?.date ? new Date(rec.date).toLocaleDateString() : ''}
                          </Text>
                        </View>
                      </View>
                    </Card>
                  );
                })}
              </>
            )}
          </>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: '600', marginBottom: spacing.md },
  toggle: { flexDirection: 'row', borderRadius: borderRadius.md, padding: 3, marginBottom: spacing.lg },
  toggleBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: borderRadius.sm, gap: 6 },
  toggleText: { fontSize: 14, fontWeight: '600' },
  courseCard: { marginBottom: spacing.md },
  courseHeader: { flexDirection: 'row', alignItems: 'center' },
  courseIcon: { width: 48, height: 48, borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  courseName: { fontSize: 16, fontWeight: '600' },
  courseTeacher: { fontSize: 13, marginTop: 2 },
  progressContainer: { marginTop: spacing.sm },
  progressBar: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  progressText: { fontSize: 12, marginTop: 4 },
  examCard: { marginBottom: spacing.md },
  examHeader: { flexDirection: 'row', alignItems: 'center' },
  examScore: { fontSize: 14, fontWeight: '700' },
  filterBar: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.lg },

  dropdownBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 24, gap: 4 },
  dropdownBtnText: { fontSize: 13, fontWeight: '600', flexShrink: 1 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 32 },
  modalSheet: { width: '100%', maxHeight: 400, borderRadius: borderRadius.lg, padding: spacing.md },
  modalTitle: { fontSize: 16, fontWeight: '700', marginBottom: spacing.md },
  modalItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: spacing.md, borderRadius: borderRadius.sm },
  modalItemText: { fontSize: 15, fontWeight: '500' },
  attSummary: { flexDirection: 'row', borderRadius: borderRadius.lg, borderWidth: 1, padding: spacing.md, marginBottom: spacing.lg, alignItems: 'center' },
  attSummaryItem: { flex: 1, alignItems: 'center' },
  attSummaryValue: { fontSize: 22, fontWeight: '800' },
  attSummaryLabel: { fontSize: 11, marginTop: 2 },
  attSummaryDivider: { width: 1, height: 32 },
  attCard: { marginBottom: spacing.sm },
  attRow: { flexDirection: 'row', alignItems: 'center' },
  attIconBox: { width: 44, height: 44, borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  attStatus: { fontSize: 13, fontWeight: '600' },
  attDate: { fontSize: 11, marginTop: 2 },
});
