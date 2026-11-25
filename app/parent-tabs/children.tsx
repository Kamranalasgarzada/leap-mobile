import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from 'expo-router';
import { api } from '../../src/services/api';
import { useAppColors } from '../../src/hooks/useAppColors';
import { spacing, borderRadius } from '../../src/theme';
import { Card } from '../../src/components/Card';
import { LoadingScreen } from '../../src/components/LoadingScreen';
import { EmptyState } from '../../src/components/EmptyState';

export default function ParentChildrenScreen() {
  const { t } = useTranslation();
  const c = useAppColors();
  const [children, setChildren] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChild, setSelectedChild] = useState<string | null>(null);
  const [childData, setChildData] = useState<{ attendance?: any; grades?: any; feedback?: any }>({});
  const [tab, setTab] = useState<'attendance' | 'grades' | 'feedback'>('attendance');

  useFocusEffect(useCallback(() => {
    api.parentGetChildren().then(d => setChildren(d?.children ?? [])).catch(() => {}).finally(() => setLoading(false));
  }, []));

  const selectChild = async (childId: string) => {
    setSelectedChild(childId);
    try {
      const [att, grades, fb] = await Promise.all([
        api.parentGetChildAttendance(childId).catch(() => null),
        api.parentGetChildGrades(childId).catch(() => null),
        api.parentGetChildFeedback(childId).catch(() => null),
      ]);
      setChildData({ attendance: att, grades: grades, feedback: fb });
    } catch {}
  };

  if (loading) return <LoadingScreen />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }} edges={['top']}>
      <Text style={{ fontSize: 32, fontWeight: '700', color: c.textHeading, padding: spacing.lg }}>{t('parent.myChildren')}</Text>
      {(children?.length ?? 0) === 0 ? (
        <EmptyState icon="account-child" message={t('parent.noChildren')} />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
          <ScrollView showsVerticalScrollIndicator={false} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: spacing.lg, marginBottom: spacing.lg }}>
            {children.map((ch: any) => (
              <Pressable
                key={ch?.studentId}
                onPress={() => selectChild(ch?.studentId)}
                style={[{
                  flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
                  borderRadius: borderRadius.full, backgroundColor: c.card, marginRight: spacing.sm, borderWidth: 1, borderColor: c.cardBorder, gap: 6,
                }, selectedChild === ch?.studentId && { backgroundColor: c.primary, borderColor: c.primary }]}
              >
                <MaterialCommunityIcons name="account" size={18} color={selectedChild === ch?.studentId ? c.white : c.textBody} />
                <Text style={[{ fontSize: 14, color: c.textBody }, selectedChild === ch?.studentId && { color: c.white, fontWeight: '600' }]}>{ch?.name ?? ''}</Text>
              </Pressable>
            ))}
          </ScrollView>

          {selectedChild && (
            <View style={{ paddingHorizontal: spacing.lg }}>
              <View style={{ flexDirection: 'row', marginBottom: spacing.lg, gap: spacing.xs }}>
                {(['attendance', 'grades', 'feedback'] as const).map(tb => (
                  <Pressable
                    key={tb}
                    onPress={() => setTab(tb)}
                    style={[{
                      flex: 1, paddingVertical: spacing.sm, borderRadius: borderRadius.md,
                      backgroundColor: c.card, alignItems: 'center', borderWidth: 1, borderColor: c.cardBorder,
                    }, tab === tb && { backgroundColor: c.primary, borderColor: c.primary }]}
                  >
                    <Text style={[{ fontSize: 12, color: c.textBody, fontWeight: '500' }, tab === tb && { color: c.white, fontWeight: '600' }]}>
                      {tb === 'attendance' ? t('parent.childAttendance') : tb === 'grades' ? t('parent.childGrades') : t('parent.childFeedback')}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {tab === 'attendance' && (
                <>
                  {childData.attendance?.summary && (
                    <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg }}>
                      <View style={{ flex: 1, backgroundColor: c.card, borderRadius: borderRadius.md, padding: spacing.md, borderLeftWidth: 3, borderLeftColor: c.success, borderWidth: 1, borderColor: c.cardBorder, alignItems: 'center' }}>
                        <Text style={{ fontSize: 22, fontWeight: '700', color: c.textHeading }}>{childData.attendance.summary.present ?? 0}</Text>
                        <Text style={{ fontSize: 11, color: c.textMuted, marginTop: 2 }}>{t('teacher.present')}</Text>
                      </View>
                      <View style={{ flex: 1, backgroundColor: c.card, borderRadius: borderRadius.md, padding: spacing.md, borderLeftWidth: 3, borderLeftColor: c.error, borderWidth: 1, borderColor: c.cardBorder, alignItems: 'center' }}>
                        <Text style={{ fontSize: 22, fontWeight: '700', color: c.textHeading }}>{childData.attendance.summary.absent ?? 0}</Text>
                        <Text style={{ fontSize: 11, color: c.textMuted, marginTop: 2 }}>{t('teacher.absent')}</Text>
                      </View>
                      <View style={{ flex: 1, backgroundColor: c.card, borderRadius: borderRadius.md, padding: spacing.md, borderLeftWidth: 3, borderLeftColor: c.warning, borderWidth: 1, borderColor: c.cardBorder, alignItems: 'center' }}>
                        <Text style={{ fontSize: 22, fontWeight: '700', color: c.textHeading }}>{childData.attendance.summary.late ?? 0}</Text>
                        <Text style={{ fontSize: 11, color: c.textMuted, marginTop: 2 }}>{t('teacher.late')}</Text>
                      </View>
                    </View>
                  )}
                  {(childData.attendance?.records ?? []).map((r: any) => (
                    <Card key={r?.id} style={{ marginBottom: spacing.sm }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={{ fontSize: 14, color: c.textBody }}>{r?.date ? new Date(r.date).toLocaleDateString() : ''}</Text>
                        <Text style={{ fontSize: 13, fontWeight: '600', color: r?.status === 'PRESENT' ? c.success : r?.status === 'ABSENT' ? c.error : c.warning }}>{r?.status ?? ''}</Text>
                      </View>
                      <Text style={{ fontSize: 12, color: c.textMuted, marginTop: 2 }}>{r?.groupName ?? ''}</Text>
                    </Card>
                  ))}
                </>
              )}

              {tab === 'grades' && (
                (childData.grades?.grades ?? []).length === 0 ? <EmptyState icon="school-outline" message={t('parent.noGrades')} /> :
                (childData.grades?.grades ?? []).map((g: any) => (
                  <Card key={g?.id} style={{ marginBottom: spacing.sm }}>
                    <Text style={{ fontSize: 15, fontWeight: '600', color: c.textHeading }}>{g?.examTitle ?? ''}</Text>
                    <Text style={{ fontSize: 12, color: c.textMuted, marginTop: 2 }}>{g?.courseName ?? ''}</Text>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm }}>
                      <Text style={{ fontSize: 18, fontWeight: '700', color: g?.passed ? c.success : c.error }}>{g?.score ?? 0}/{g?.totalMarks ?? 100}</Text>
                      <Text style={{ fontSize: 13, fontWeight: '600', color: g?.passed ? c.success : c.error }}>{g?.passed ? t('exams.passed') : t('exams.failed')}</Text>
                    </View>
                  </Card>
                ))
              )}

              {tab === 'feedback' && (
                (childData.feedback?.feedbacks ?? []).length === 0 ? <EmptyState icon="comment-outline" message={t('parent.noFeedback')} /> :
                (childData.feedback?.feedbacks ?? []).map((f: any) => (
                  <Card key={f?.id} style={{ marginBottom: spacing.sm }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: c.accent }}>{f?.teacherName ?? ''}</Text>
                    <Text style={{ fontSize: 14, color: c.textBody, marginTop: 4 }}>{f?.comment ?? ''}</Text>
                    <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm }}>
                      {f?.category ? <Text style={{ fontSize: 12, color: c.textMuted, backgroundColor: c.surfaceLight, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 }}>{f.category}</Text> : null}
                      {f?.rating ? <Text style={{ fontSize: 12 }}>{'\u2B50'.repeat(f.rating)}</Text> : null}
                    </View>
                  </Card>
                ))
              )}
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
