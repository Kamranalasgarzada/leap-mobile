import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet, Modal, FlatList,
  ActivityIndicator, Image as RNImage,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '../../src/services/api';
import { useAppColors } from '../../src/hooks/useAppColors';
import { spacing, borderRadius } from '../../src/theme';
import { Card } from '../../src/components/Card';
import { LoadingScreen } from '../../src/components/LoadingScreen';
import { EmptyState } from '../../src/components/EmptyState';

type SubTab = 'lessons' | 'exams' | 'attendance' | 'reviews';

const SUB_TABS: { key: SubTab; icon: string }[] = [
  { key: 'lessons', icon: 'book-open-variant' },
  { key: 'exams', icon: 'clipboard-text-outline' },
  { key: 'attendance', icon: 'calendar-check' },
  { key: 'reviews', icon: 'comment-text-outline' },
];

const MONTHS = [
  { label: 'Yanvar', value: '01' }, { label: 'Fevral', value: '02' }, { label: 'Mart', value: '03' },
  { label: 'Aprel', value: '04' }, { label: 'May', value: '05' }, { label: 'İyun', value: '06' },
  { label: 'İyul', value: '07' }, { label: 'Avqust', value: '08' }, { label: 'Sentyabr', value: '09' },
  { label: 'Oktyabr', value: '10' }, { label: 'Noyabr', value: '11' }, { label: 'Dekabr', value: '12' },
];

export default function MyChildScreen() {
  const { t } = useTranslation();
  const c = useAppColors();
  const [children, setChildren] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChild, setSelectedChild] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<string>(''); // '' = all
  const [tab, setTab] = useState<SubTab>('lessons');
  const [childData, setChildData] = useState<any>(null);
  const [tabLoading, setTabLoading] = useState(false);

  const [showChildDropdown, setShowChildDropdown] = useState(false);
  const [showCourseDropdown, setShowCourseDropdown] = useState(false);

  useFocusEffect(
    useCallback(() => {
      api
        .parentGetChildren()
        .then((d) => {
          const kids = d?.children ?? [];
          setChildren(kids);
          if (kids.length > 0 && !selectedChild) {
            selectChild(kids[0]?.studentId);
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }, [])
  );

  const selectChild = async (childId: string) => {
    if (!childId) return;
    setSelectedChild(childId);
    setSelectedCourse('');
    setTabLoading(true);
    try {
      const [detail, att, grades, fb] = await Promise.all([
        api.parentGetChildDetail(childId).catch(() => null),
        api.parentGetChildAttendance(childId).catch(() => null),
        api.parentGetChildGrades(childId).catch(() => null),
        api.parentGetChildFeedback(childId).catch(() => null),
      ]);
      setChildData({ detail, attendance: att, grades, feedback: fb });
    } catch {}
    setTabLoading(false);
  };

  // Extract course options from child detail
  const courseOptions = useMemo(() => {
    const courses = childData?.detail?.child?.courses ?? [];
    const seen = new Map<string, string>();
    courses.forEach((cr: any) => {
      if (cr?.courseId && cr?.courseName && !seen.has(cr.courseId)) {
        seen.set(cr.courseId, cr.courseName);
      }
    });
    return Array.from(seen.entries()).map(([id, name]) => ({ id, name }));
  }, [childData]);

  const selectedChildName = children?.find((ch: any) => ch?.studentId === selectedChild)?.name ?? t('parent.myChild');
  const selectedCourseName = selectedCourse
    ? courseOptions?.find((co) => co.id === selectedCourse)?.name ?? t('parent.allCourses')
    : t('parent.allCourses');

  if (loading) return <LoadingScreen />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }} edges={['top']}>
      {/* Header */}
      <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.sm }}>
        <Text style={{ fontSize: 26, fontWeight: '700', color: c.textHeading }}>
          {t('parent.myChild')}
        </Text>
      </View>

      {(children?.length ?? 0) === 0 ? (
        <EmptyState icon="account-child" message={t('parent.noChildren')} />
      ) : (
        <>
          {/* Filter row: child + course dropdowns */}
          <View style={styles.filterBar}>
            {/* Child selector */}
            <Pressable
              onPress={() => setShowChildDropdown(true)}
              style={[styles.dropdownBtn, { backgroundColor: c.primary + '12', borderColor: c.primary + '30', borderWidth: 1 }]}
            >
              <MaterialCommunityIcons name="account" size={16} color={c.primary} />
              <Text style={[styles.dropdownBtnText, { color: c.primary }]} numberOfLines={1}>
                {selectedChildName}
              </Text>
              <MaterialCommunityIcons name="chevron-down" size={18} color={c.primary} />
            </Pressable>

            {/* Course selector */}
            <Pressable
              onPress={() => setShowCourseDropdown(true)}
              style={[styles.dropdownBtn, { backgroundColor: c.surfaceLight }]}
            >
              <MaterialCommunityIcons name="book-open-variant" size={16} color={c.textMuted} />
              <Text style={[styles.dropdownBtnText, { color: c.textHeading }]} numberOfLines={1}>
                {selectedCourseName}
              </Text>
              <MaterialCommunityIcons name="chevron-down" size={18} color={c.textMuted} />
            </Pressable>
          </View>

          {/* Child Dropdown Modal */}
          <Modal visible={showChildDropdown} transparent animationType="fade" onRequestClose={() => setShowChildDropdown(false)}>
            <Pressable style={styles.modalOverlay} onPress={() => setShowChildDropdown(false)}>
              <View style={[styles.modalSheet, { backgroundColor: c.surface }]}>
                <Text style={[styles.modalTitle, { color: c.textHeading }]}>{t('parent.myChild')}</Text>
                <FlatList
                  data={children}
                  keyExtractor={(item: any) => item?.studentId || '_'}
                  renderItem={({ item }: { item: any }) => (
                    <Pressable
                      onPress={() => { selectChild(item?.studentId); setShowChildDropdown(false); }}
                      style={[styles.modalItem, selectedChild === item?.studentId && { backgroundColor: c.primary + '18' }]}
                    >
                      <Text style={[styles.modalItemText, { color: selectedChild === item?.studentId ? c.primary : c.textHeading }]}>
                        {item?.name ?? ''}
                      </Text>
                      {selectedChild === item?.studentId && <MaterialCommunityIcons name="check" size={20} color={c.primary} />}
                    </Pressable>
                  )}
                />
              </View>
            </Pressable>
          </Modal>

          {/* Course Dropdown Modal */}
          <Modal visible={showCourseDropdown} transparent animationType="fade" onRequestClose={() => setShowCourseDropdown(false)}>
            <Pressable style={styles.modalOverlay} onPress={() => setShowCourseDropdown(false)}>
              <View style={[styles.modalSheet, { backgroundColor: c.surface }]}>
                <Text style={[styles.modalTitle, { color: c.textHeading }]}>{t('parent.allCourses')}</Text>
                <FlatList
                  data={[{ id: '', name: t('parent.allCourses') }, ...courseOptions]}
                  keyExtractor={(item: any) => item?.id || '_all'}
                  renderItem={({ item }: { item: any }) => (
                    <Pressable
                      onPress={() => { setSelectedCourse(item?.id ?? ''); setShowCourseDropdown(false); }}
                      style={[styles.modalItem, selectedCourse === (item?.id ?? '') && { backgroundColor: c.primary + '18' }]}
                    >
                      <Text style={[styles.modalItemText, { color: selectedCourse === (item?.id ?? '') ? c.primary : c.textHeading }]}>
                        {item?.name ?? ''}
                      </Text>
                      {selectedCourse === (item?.id ?? '') && <MaterialCommunityIcons name="check" size={20} color={c.primary} />}
                    </Pressable>
                  )}
                />
              </View>
            </Pressable>
          </Modal>

          {/* Sub-tab bar */}
          <View
            style={{
              flexDirection: 'row',
              marginHorizontal: spacing.lg,
              marginBottom: spacing.md,
              backgroundColor: c.card,
              borderRadius: borderRadius.lg,
              borderWidth: 1,
              borderColor: c.cardBorder,
              padding: 3,
            }}
          >
            {SUB_TABS.map((st) => {
              const active = tab === st.key;
              return (
                <Pressable
                  key={st.key}
                  onPress={() => setTab(st.key)}
                  style={[
                    styles.subTab,
                    active && { backgroundColor: c.primary, borderRadius: borderRadius.md },
                  ]}
                >
                  <MaterialCommunityIcons name={st.icon as any} size={16} color={active ? '#fff' : c.textMuted} />
                  <Text style={[styles.subTabText, { color: active ? '#fff' : c.textMuted }]} numberOfLines={1}>
                    {t(`parent.${st.key === 'reviews' ? 'reviews' : st.key === 'attendance' ? 'childAttendance' : st.key}`)}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Tab content */}
          {tabLoading ? (
            <LoadingScreen />
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: 40 }}>
              {tab === 'lessons' && <LessonsTab data={childData} c={c} t={t} courseFilter={selectedCourse} />}
              {tab === 'exams' && <ExamsTab data={childData} c={c} t={t} courseFilter={selectedCourse} />}
              {tab === 'attendance' && <AttendanceTab data={childData} c={c} t={t} childId={selectedChild ?? ''} courseFilter={selectedCourse} />}
              {tab === 'reviews' && <ReviewsTab data={childData} c={c} t={t} />}
            </ScrollView>
          )}
        </>
      )}
    </SafeAreaView>
  );
}

/* ─── Question Detail Component (shared between Lessons & Exams) ─── */
function QuestionDetail({ q, idx, c, t }: { q: any; idx: number; c: any; t: any }) {
  const isCorrect = q?.isCorrect;
  const iconName = isCorrect === true ? 'check-circle' : isCorrect === false ? 'close-circle' : 'help-circle-outline';
  const iconColor = isCorrect === true ? c.success : isCorrect === false ? c.error : c.textMuted;
  const options = q?.options ?? [];

  return (
    <View style={{ paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: c.cardBorder + '30' }}>
      {/* Question number + result badge */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
        <MaterialCommunityIcons name={iconName as any} size={18} color={iconColor} />
        <Text style={{ fontSize: 14, fontWeight: '700', color: c.textHeading, marginLeft: 6 }}>
          Sual {idx + 1}
        </Text>
        <View style={{ flex: 1 }} />
        <Text style={{ fontSize: 12, fontWeight: '600', color: iconColor }}>
          {q?.marks ?? 0} bal
        </Text>
      </View>

      {/* Question text — ALWAYS visible, full text, no line limit */}
      <View style={{
        marginLeft: 24, marginBottom: 8, backgroundColor: c.surfaceLight,
        borderRadius: borderRadius.md, padding: 10, borderLeftWidth: 3, borderLeftColor: c.primary + '60',
      }}>
        <Text style={{ fontSize: 14, color: c.textHeading, lineHeight: 20 }}>
          {q?.questionText ?? ''}
        </Text>
      </View>

      {/* Question image — shown below question text */}
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

      {/* Options (for multiple choice) — show which student picked and which is correct */}
      {options.length > 0 && (
        <View style={{ marginLeft: 24 }}>
          {options.map((opt: string, oi: number) => {
            const optLetter = String.fromCharCode(65 + oi); // A, B, C, D
            const studentAns = (q?.studentAnswer ?? '').trim();
            const correctAns = (q?.correctAnswer ?? '').trim();

            // Match by option text or by letter
            const isStudentPick = studentAns.toLowerCase() === opt.trim().toLowerCase()
              || studentAns.toUpperCase() === optLetter;
            const isCorrectOpt = correctAns.toLowerCase() === opt.trim().toLowerCase()
              || correctAns.toUpperCase() === optLetter;

            let bgColor = 'transparent';
            let borderColor = c.cardBorder;
            let textColor = c.textBody;
            let rightIcon: string | null = null;
            let rightIconColor = c.textMuted;

            if (isCorrectOpt && isStudentPick) {
              // Student picked the correct answer
              bgColor = c.success + '15';
              borderColor = c.success;
              textColor = c.success;
              rightIcon = 'check-circle';
              rightIconColor = c.success;
            } else if (isStudentPick && !isCorrectOpt) {
              // Student picked the wrong answer
              bgColor = c.error + '15';
              borderColor = c.error;
              textColor = c.error;
              rightIcon = 'close-circle';
              rightIconColor = c.error;
            } else if (isCorrectOpt) {
              // Correct answer (student didn't pick)
              bgColor = c.success + '10';
              borderColor = c.success + '60';
              textColor = c.success;
              rightIcon = 'check';
              rightIconColor = c.success;
            }

            return (
              <View
                key={oi}
                style={{
                  flexDirection: 'row', alignItems: 'center',
                  paddingVertical: 7, paddingHorizontal: 10,
                  marginBottom: 4, borderRadius: borderRadius.sm,
                  backgroundColor: bgColor, borderWidth: 1, borderColor,
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: '700', color: textColor, width: 24 }}>
                  {optLetter}.
                </Text>
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

      {/* For non-MCQ or when options not available: show text answers */}
      {options.length === 0 && (
        <View style={{ marginLeft: 24, marginTop: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
            <MaterialCommunityIcons name="account-edit" size={14} color={isCorrect === false ? c.error : c.textBody} />
            <Text style={{ fontSize: 13, color: isCorrect === false ? c.error : c.textBody, marginLeft: 6, flex: 1 }}>
              {t('parent.yourAnswer')}: {q?.studentAnswer || '—'}
            </Text>
          </View>
          {isCorrect !== true && (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <MaterialCommunityIcons name="check-circle-outline" size={14} color={c.success} />
              <Text style={{ fontSize: 13, color: c.success, marginLeft: 6, flex: 1 }}>
                {t('parent.correctAnswer')}: {q?.correctAnswer || '—'}
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

/* ─── Lessons Sub-tab (module accordion) ─── */
function LessonsTab({ data, c, t, courseFilter }: { data: any; c: any; t: any; courseFilter: string }) {
  const allModules = data?.detail?.child?.modules ?? [];
  const modules = courseFilter ? allModules.filter((m: any) => m?.courseId === courseFilter) : allModules;
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [expandedExam, setExpandedExam] = useState<Record<string, boolean>>({});

  const toggle = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));
  const toggleExam = (id: string) => setExpandedExam((p) => ({ ...p, [id]: !p[id] }));

  if (modules.length === 0)
    return <EmptyState icon="book-open-variant" message={t('common.noData')} />;

  /* Group modules by courseName */
  const courseMap: Record<string, any[]> = {};
  modules.forEach((m: any) => {
    const key = m?.courseName ?? t('common.noData');
    if (!courseMap[key]) courseMap[key] = [];
    courseMap[key].push(m);
  });

  return (
    <>
      {Object.entries(courseMap).map(([courseName, mods]) => (
        <View key={courseName} style={{ marginBottom: spacing.lg }}>
          {/* Course header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}>
            <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: c.primary + '20', alignItems: 'center', justifyContent: 'center', marginRight: 8 }}>
              <MaterialCommunityIcons name="book-education" size={15} color={c.primary} />
            </View>
            <Text style={{ fontSize: 16, fontWeight: '700', color: c.textHeading, flex: 1 }} numberOfLines={1}>
              {courseName}
            </Text>
          </View>

          {mods.map((mod: any) => {
            const mId = mod?.id ?? '';
            const isOpen = !!expanded[mId];
            const videos = mod?.videos ?? [];
            const exams = mod?.exams ?? [];
            const vWatched = mod?.videosWatched ?? 0;
            const vTotal = mod?.videosTotal ?? 0;
            const examsPassed = exams.filter((ex: any) => ex?.passed === true).length;
            const examsTotal = exams.length;
            const totalItems = vTotal + examsTotal;
            const completedItems = vWatched + examsPassed;
            const progressPct = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
            const allDone = totalItems > 0 && completedItems === totalItems;

            return (
              <Card key={mId} style={{ marginBottom: spacing.sm }}>
                {/* Module header */}
                <Pressable onPress={() => toggle(mId)} style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: '600', color: c.textHeading }} numberOfLines={2}>
                      {mod?.title ?? ''}
                    </Text>
                    <Text style={{ fontSize: 12, color: c.textMuted, marginTop: 2 }}>
                      {vWatched}/{vTotal} video • {examsPassed}/{examsTotal} {t('parent.exams').toLowerCase()}
                    </Text>
                  </View>
                  <View style={{ width: 38, height: 38, borderRadius: 19, borderWidth: 3, borderColor: allDone ? c.success : c.primary + '40', alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: allDone ? c.success : c.textHeading }}>
                      {progressPct}%
                    </Text>
                  </View>
                  <MaterialCommunityIcons name={isOpen ? 'chevron-up' : 'chevron-down'} size={22} color={c.textMuted} style={{ marginLeft: 4 }} />
                </Pressable>

                {isOpen && (
                  <View style={{ marginTop: spacing.md, borderTopWidth: 1, borderTopColor: c.cardBorder, paddingTop: spacing.sm }}>
                    {/* Videos */}
                    {videos.length > 0 && (
                      <View style={{ marginBottom: spacing.sm }}>
                        <Text style={{ fontSize: 13, fontWeight: '600', color: c.textMuted, marginBottom: 6 }}>Videolar</Text>
                        {videos.map((v: any, vi: number) => (
                          <View key={v?.id ?? vi} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 7, borderBottomWidth: vi < videos.length - 1 ? 1 : 0, borderBottomColor: c.cardBorder + '60' }}>
                            <MaterialCommunityIcons name={v?.watched ? 'check-circle' : 'play-circle-outline'} size={20} color={v?.watched ? c.success : c.textMuted} />
                            <Text style={{ flex: 1, fontSize: 14, color: v?.watched ? c.textBody : c.textMuted, marginLeft: 10 }} numberOfLines={1}>
                              {v?.title ?? ''}
                            </Text>
                            {v?.watched ? (
                              <Text style={{ fontSize: 11, color: c.success, fontWeight: '600' }}>✓</Text>
                            ) : (
                              <Text style={{ fontSize: 11, color: c.textMuted }}>—</Text>
                            )}
                          </View>
                        ))}
                      </View>
                    )}

                    {/* Module exams */}
                    {exams.length > 0 && (
                      <View>
                        <Text style={{ fontSize: 13, fontWeight: '600', color: c.textMuted, marginBottom: 6 }}>
                          {t('parent.exams')}
                        </Text>
                        {exams.map((ex: any, ei: number) => {
                          const exId = ex?.id ?? `ex-${ei}`;
                          const exOpen = !!expandedExam[exId];
                          const taken = ex?.taken ?? false;
                          const score = ex?.score ?? 0;
                          const total = ex?.totalMarks ?? 0;
                          const pct = total > 0 ? Math.round((score / total) * 100) : 0;
                          const questions = ex?.questions ?? [];

                          return (
                            <View key={exId} style={{ marginBottom: spacing.sm }}>
                              <Pressable
                                onPress={() => taken && toggleExam(exId)}
                                style={{
                                  flexDirection: 'row', alignItems: 'center', paddingVertical: 8,
                                  backgroundColor: taken ? (pct >= 50 ? c.success + '10' : c.error + '10') : c.surfaceLight,
                                  borderRadius: borderRadius.md, paddingHorizontal: 10,
                                }}
                              >
                                <MaterialCommunityIcons
                                  name={taken ? 'clipboard-check' : 'clipboard-clock-outline'}
                                  size={18}
                                  color={taken ? (pct >= 50 ? c.success : c.error) : c.textMuted}
                                />
                                <Text style={{ flex: 1, fontSize: 14, fontWeight: '500', color: c.textHeading, marginLeft: 8 }} numberOfLines={1}>
                                  {ex?.title ?? ''}
                                </Text>
                                {taken ? (
                                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                    <Text style={{ fontSize: 13, fontWeight: '700', color: pct >= 50 ? c.success : c.error }}>
                                      {score}/{total}
                                    </Text>
                                    <MaterialCommunityIcons name={exOpen ? 'chevron-up' : 'chevron-down'} size={18} color={c.textMuted} />
                                  </View>
                                ) : (
                                  <Text style={{ fontSize: 12, color: c.textMuted, fontStyle: 'italic' }}>{t('parent.notTaken')}</Text>
                                )}
                              </Pressable>

                              {/* Question-by-question detail */}
                              {exOpen && taken && questions.length > 0 && (
                                <View style={{ marginTop: 6, marginLeft: 8, paddingLeft: 10, borderLeftWidth: 2, borderLeftColor: c.cardBorder }}>
                                  {questions.map((q: any, qi: number) => (
                                    <QuestionDetail key={q?.id ?? qi} q={q} idx={qi} c={c} t={t} />
                                  ))}
                                </View>
                              )}
                            </View>
                          );
                        })}
                      </View>
                    )}
                  </View>
                )}
              </Card>
            );
          })}
        </View>
      ))}
    </>
  );
}

/* ─── Exams Sub-tab (specific exams, tap to expand questions) ─── */
function ExamsTab({ data, c, t, courseFilter }: { data: any; c: any; t: any; courseFilter: string }) {
  const allGrades = data?.grades?.grades ?? [];
  const grades = courseFilter ? allGrades.filter((g: any) => g?.courseId === courseFilter) : allGrades;
  const [expandedExam, setExpandedExam] = useState<Record<string, boolean>>({});
  const toggleExam = (id: string) => setExpandedExam((p) => ({ ...p, [id]: !p[id] }));

  if (grades.length === 0)
    return <EmptyState icon="clipboard-text-outline" message={t('parent.noSpecificExams')} />;

  return (
    <>
      <Text style={{ fontSize: 13, color: c.textMuted, marginBottom: spacing.md }}>
        {t('parent.specificExams')}
      </Text>
      {grades.map((g: any, idx: number) => {
        const gId = g?.id ?? `g-${idx}`;
        const isOpen = !!expandedExam[gId];
        const score = g?.score ?? 0;
        const total = g?.totalMarks ?? g?.total ?? 100;
        const pct = total > 0 ? Math.round((score / total) * 100) : 0;
        const passed = g?.passed ?? pct >= 50;
        const questions = g?.questions ?? [];

        return (
          <View key={gId}>
            <Pressable onPress={() => toggleExam(gId)}>
              <Card style={{ marginBottom: isOpen ? 0 : spacing.sm }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: passed ? c.success + '20' : c.error + '20', alignItems: 'center', justifyContent: 'center', marginRight: spacing.md }}>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: passed ? c.success : c.error }}>{pct}%</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: '600', color: c.textHeading }} numberOfLines={1}>
                      {g?.examTitle ?? g?.title ?? ''}
                    </Text>
                    <Text style={{ fontSize: 12, color: c.textMuted, marginTop: 2 }}>
                      {g?.courseName ?? ''} • {score}/{total}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: borderRadius.full, backgroundColor: passed ? c.success + '20' : c.error + '20' }}>
                      <Text style={{ fontSize: 11, fontWeight: '600', color: passed ? c.success : c.error }}>
                        {passed ? t('exams.passed') : t('exams.failed')}
                      </Text>
                    </View>
                    <MaterialCommunityIcons name={isOpen ? 'chevron-up' : 'chevron-down'} size={20} color={c.textMuted} />
                  </View>
                </View>
              </Card>
            </Pressable>

            {/* Expanded questions */}
            {isOpen && questions.length > 0 && (
              <Card style={{ marginBottom: spacing.sm, marginTop: -1 }}>
                {questions.map((q: any, qi: number) => (
                  <QuestionDetail key={q?.id ?? qi} q={q} idx={qi} c={c} t={t} />
                ))}
              </Card>
            )}
            {isOpen && questions.length === 0 && (
              <Card style={{ marginBottom: spacing.sm, marginTop: -1 }}>
                <Text style={{ fontSize: 13, color: c.textMuted, textAlign: 'center' }}>{t('common.noData')}</Text>
              </Card>
            )}
          </View>
        );
      })}
    </>
  );
}

/* ─── Attendance Sub-tab (with month filter; course from parent filter) ─── */
function AttendanceTab({ data, c, t, childId, courseFilter }: { data: any; c: any; t: any; childId: string; courseFilter: string }) {
  const [attMonth, setAttMonth] = useState('');
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const [localAtt, setLocalAtt] = useState<any>(data?.attendance ?? null);
  const [filtering, setFiltering] = useState(false);

  const currentYear = new Date().getFullYear();

  useEffect(() => {
    setLocalAtt(data?.attendance ?? null);
    setAttMonth('');
  }, [childId, data?.attendance]);

  /* Re-fetch when course or month changes */
  useEffect(() => {
    if (!courseFilter && !attMonth) {
      setLocalAtt(data?.attendance ?? null);
      return;
    }
    let cancelled = false;
    setFiltering(true);
    api.parentGetChildAttendance(childId, courseFilter || undefined, attMonth || undefined)
      .then((res) => { if (!cancelled) setLocalAtt(res); })
      .catch(() => { if (!cancelled) setLocalAtt({ summary: {}, records: [] }); })
      .finally(() => { if (!cancelled) setFiltering(false); });
    return () => { cancelled = true; };
  }, [courseFilter, attMonth, childId]);

  const records = localAtt?.records ?? [];
  const summary = localAtt?.summary ?? null;

  const selectedMonthName = attMonth
    ? MONTHS.find((m) => attMonth.endsWith(m.value))?.label ?? t('parent.allMonths')
    : t('parent.allMonths');

  const handleMonthSelect = (val: string) => { setAttMonth(val); setShowMonthDropdown(false); };

  return (
    <>
      {/* Month filter */}
      <View style={[styles.filterBar, { marginBottom: spacing.md }]}>
        <MaterialCommunityIcons name="calendar-month" size={18} color={c.textMuted} />
        <Pressable onPress={() => setShowMonthDropdown(true)} style={[styles.dropdownBtn, { backgroundColor: c.surfaceLight }]}>
          <Text style={[styles.dropdownBtnText, { color: c.textHeading }]} numberOfLines={1}>{selectedMonthName}</Text>
          <MaterialCommunityIcons name="chevron-down" size={18} color={c.textMuted} />
        </Pressable>
      </View>

      {/* Month Dropdown Modal */}
      <Modal visible={showMonthDropdown} transparent animationType="fade" onRequestClose={() => setShowMonthDropdown(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowMonthDropdown(false)}>
          <View style={[styles.modalSheet, { backgroundColor: c.surface }]}>
            <Text style={[styles.modalTitle, { color: c.textHeading }]}>{t('parent.allMonths')}</Text>
            <FlatList
              data={[{ label: t('parent.allMonths'), value: '' }, ...MONTHS.map((m) => ({ ...m, value: `${currentYear}-${m.value}` }))]}
              keyExtractor={(item: any) => item?.value || '_all'}
              renderItem={({ item }: { item: any }) => (
                <Pressable
                  onPress={() => handleMonthSelect(item?.value ?? '')}
                  style={[styles.modalItem, attMonth === (item?.value ?? '') && { backgroundColor: c.primary + '18' }]}
                >
                  <Text style={[styles.modalItemText, { color: attMonth === (item?.value ?? '') ? c.primary : c.textHeading }]}>
                    {item?.label ?? ''}
                  </Text>
                  {attMonth === (item?.value ?? '') && <MaterialCommunityIcons name="check" size={20} color={c.primary} />}
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>

      {filtering && (
        <View style={{ alignItems: 'center', paddingVertical: spacing.md }}>
          <ActivityIndicator size="small" color={c.primary} />
        </View>
      )}

      {/* Summary */}
      {summary && !filtering && (
        <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg }}>
          {[
            { key: 'present', value: summary?.present ?? 0, color: c.success, icon: 'check-circle' as const },
            { key: 'absent', value: summary?.absent ?? 0, color: c.error, icon: 'close-circle' as const },
            { key: 'late', value: summary?.late ?? 0, color: c.warning, icon: 'clock-alert' as const },
          ].map((item) => (
            <View key={item.key} style={{ flex: 1, backgroundColor: c.card, borderRadius: borderRadius.lg, padding: spacing.md, borderLeftWidth: 3, borderLeftColor: item.color, borderWidth: 1, borderColor: c.cardBorder, alignItems: 'center' }}>
              <MaterialCommunityIcons name={item.icon} size={22} color={item.color} />
              <Text style={{ fontSize: 22, fontWeight: '700', color: c.textHeading, marginTop: 4 }}>{item.value}</Text>
              <Text style={{ fontSize: 11, color: c.textMuted, marginTop: 2 }}>{t(`teacher.${item.key}`)}</Text>
            </View>
          ))}
        </View>
      )}

      {!filtering && records.length === 0 ? (
        <EmptyState icon="calendar-check" message={t('common.noData')} />
      ) : !filtering ? (
        records.map((r: any, idx: number) => {
          const statusColor = r?.status === 'PRESENT' ? c.success : r?.status === 'LATE' ? c.warning : c.error;
          const statusIcon = r?.status === 'PRESENT' ? 'check-circle' : r?.status === 'LATE' ? 'clock-alert-outline' : 'close-circle';
          const statusText = r?.status === 'PRESENT' ? t('teacher.present') : r?.status === 'LATE' ? t('teacher.late') : t('teacher.absent');
          return (
            <Card key={r?.id ?? idx} style={{ marginBottom: spacing.sm }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: 40, height: 40, borderRadius: borderRadius.md, backgroundColor: statusColor + '15', alignItems: 'center', justifyContent: 'center', marginRight: spacing.md }}>
                  <MaterialCommunityIcons name={statusIcon as any} size={22} color={statusColor} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, color: c.textBody }} numberOfLines={1}>{r?.courseName ?? r?.groupName ?? ''}</Text>
                  <Text style={{ fontSize: 12, color: c.textMuted, marginTop: 2 }}>
                    {r?.date ? (() => {
                      const d = new Date(r.date);
                      const mNames = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'İyn', 'İyl', 'Avq', 'Sen', 'Okt', 'Noy', 'Dek'];
                      return `${d.getDate()} ${mNames[d.getMonth()] ?? ''} ${d.getFullYear()}`;
                    })() : ''}
                  </Text>
                </View>
                <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: borderRadius.full, backgroundColor: statusColor + '20' }}>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: statusColor }}>{statusText}</Text>
                </View>
              </View>
            </Card>
          );
        })
      ) : null}
    </>
  );
}

/* ─── Reviews Sub-tab (unchanged) ─── */
function ReviewsTab({ data, c, t }: { data: any; c: any; t: any }) {
  const feedbacks = data?.feedback?.feedbacks ?? data?.feedback?.reviews ?? [];

  if (feedbacks.length === 0)
    return <EmptyState icon="comment-text-outline" message={t('parent.noFeedback')} />;

  return (
    <>
      {feedbacks.map((f: any, idx: number) => (
        <Card key={f?.id ?? idx} style={{ marginBottom: spacing.sm }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}>
            <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: c.accent + '20', alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm }}>
              <MaterialCommunityIcons name="account" size={20} color={c.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: c.accent }}>{f?.teacherName ?? ''}</Text>
              {f?.date && <Text style={{ fontSize: 11, color: c.textMuted }}>{new Date(f.date).toLocaleDateString()}</Text>}
            </View>
            {f?.rating ? (
              <View style={{ flexDirection: 'row' }}>
                {Array.from({ length: f.rating }).map((_, i) => (
                  <Text key={i} style={{ fontSize: 14 }}>⭐</Text>
                ))}
              </View>
            ) : null}
          </View>
          <Text style={{ fontSize: 14, color: c.textBody, lineHeight: 20 }}>{f?.comment ?? ''}</Text>
          {f?.category ? (
            <View style={{ marginTop: spacing.sm, backgroundColor: c.surfaceLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: borderRadius.full, alignSelf: 'flex-start' }}>
              <Text style={{ fontSize: 11, color: c.textMuted, fontWeight: '500' }}>{f.category}</Text>
            </View>
          ) : null}
        </Card>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  filterBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: spacing.lg, marginBottom: spacing.sm,
  },
  dropdownBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12, paddingVertical: 10,
    borderRadius: 24, gap: 4,
  },
  dropdownBtnText: { fontSize: 13, fontWeight: '600', flexShrink: 1 },
  subTab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 8, gap: 4,
  },
  subTabText: { fontSize: 11, fontWeight: '600' },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center', padding: 32,
  },
  modalSheet: {
    width: '100%', maxHeight: 400,
    borderRadius: borderRadius.lg, padding: spacing.md,
  },
  modalTitle: { fontSize: 16, fontWeight: '700', marginBottom: spacing.md },
  modalItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 12, paddingHorizontal: spacing.md, borderRadius: borderRadius.sm,
  },
  modalItemText: { fontSize: 15, fontWeight: '500' },
});
