import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useFocusEffect, useRouter } from 'expo-router';
import { api } from '../../src/services/api';
import { useAppColors } from '../../src/hooks/useAppColors';
import { spacing, borderRadius } from '../../src/theme';
import { Card } from '../../src/components/Card';
import { LoadingScreen } from '../../src/components/LoadingScreen';
import { EmptyState } from '../../src/components/EmptyState';

export default function TeacherCoursesScreen() {
  const { t } = useTranslation();
  const c = useAppColors();
  const router = useRouter();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    api.teacherGetCourses().then(d => setCourses(d?.courses ?? [])).catch(() => {}).finally(() => setLoading(false));
  }, []));

  if (loading) return <LoadingScreen />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }} edges={['top']}>
      <Text style={{ fontSize: 32, fontWeight: '700', color: c.textHeading, padding: spacing.lg }}>{t('teacher.myCourses')}</Text>
      {(courses?.length ?? 0) === 0 ? (
        <EmptyState icon="book-open-variant" message={t('home.noCourses')} />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: spacing.lg, paddingTop: 0 }}>
          {courses.map((course: any) => (
            <Pressable key={course?.id} onPress={() => router.push(`/course/${course?.id}?role=teacher`)} style={({ pressed }) => [pressed && { opacity: 0.7 }]}>
            <Card style={{ marginBottom: spacing.md }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}>
                <View style={{ width: 44, height: 44, borderRadius: borderRadius.md, backgroundColor: 'rgba(124,58,237,0.12)', alignItems: 'center', justifyContent: 'center', marginRight: spacing.md }}>
                  <MaterialCommunityIcons name="book-open-variant" size={24} color={c.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: c.textHeading }}>{course?.name ?? ''}</Text>
                  <Text style={{ fontSize: 13, color: c.textMuted, marginTop: 2 }}>{course?.code ?? ''}</Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', gap: spacing.md }}>
                <Text style={{ fontSize: 12, color: c.accent }}>{course?.moduleCount ?? 0} {t('courses.modules')}</Text>
                <Text style={{ fontSize: 12, color: c.accent }}>{course?.videoCount ?? 0} Videos</Text>
                <Text style={{ fontSize: 12, color: c.accent }}>{course?.examCount ?? 0} {t('tabs.exams')}</Text>
              </View>
              {(course?.groups?.length ?? 0) > 0 && (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.sm }}>
                  {course.groups.map((g: any) => (
                    <View key={g?.id} style={{ backgroundColor: c.surfaceLight, paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: borderRadius.sm }}>
                      <Text style={{ fontSize: 12, color: c.textBody }}>{g?.name ?? ''} ({g?.studentCount ?? 0})</Text>
                    </View>
                  ))}
                </View>
              )}
            </Card>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
