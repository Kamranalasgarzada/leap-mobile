import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl, Linking, Platform, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { api } from '../../../src/services/api';
import { ScreenContainer } from '../../../src/components/ScreenContainer';
import { LoadingScreen } from '../../../src/components/LoadingScreen';
import { useAppColors } from '../../../src/hooks/useAppColors';
import { spacing, borderRadius } from '../../../src/theme';

const FILE_ICONS: Record<string, string> = {
  pdf: 'file-pdf-box',
  doc: 'file-word-box',
  docx: 'file-word-box',
  ppt: 'file-powerpoint-box',
  pptx: 'file-powerpoint-box',
  xls: 'file-excel-box',
  xlsx: 'file-excel-box',
  png: 'file-image',
  jpg: 'file-image',
  jpeg: 'file-image',
  gif: 'file-image',
  webp: 'file-image',
  mp4: 'file-video',
  mp3: 'file-music',
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function CourseDetailScreen() {
  const { courseId = '', role = '' } = useLocalSearchParams<{ courseId: string; role?: string }>();
  const isTeacher = role === 'teacher';
  const { t } = useTranslation();
  const router = useRouter();
  const c = useAppColors();
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const fetchCourse = useCallback(async () => {
    if (!courseId) return;
    try {
      const res = isTeacher ? await api.teacherGetCourseDetail(courseId) : await api.getCourseDetail(courseId);
      setCourse(res?.course ?? null);
    } catch (e) {
      console.error('Course detail error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [courseId, isTeacher]);

  useFocusEffect(useCallback(() => { fetchCourse(); }, [fetchCourse]));

  const toggleModule = (id: string) => {
    setExpandedModules(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const openMaterial = async (materialId: string) => {
    try {
      setDownloadingId(materialId);
      const res = await api.getMaterialUrl(materialId);
      if (res?.url) {
        if (Platform.OS === 'web') {
          window.open(res.url, '_blank');
        } else {
          await Linking.openURL(res.url);
        }
      }
    } catch (e) {
      console.error('Open material error:', e);
    } finally {
      setDownloadingId(null);
    }
  };

  if (loading) return <LoadingScreen />;
  if (!course) return <ScreenContainer><Text style={{ color: c.textMuted, padding: spacing.lg }}>Course not found</Text></ScreenContainer>;

  return (
    <ScreenContainer>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchCourse(); }} tintColor={c.primary} />}
      >
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={c.textHeading} />
        </Pressable>

        {/* Hero */}
        <View style={styles.hero}>
          <View style={[styles.heroIcon, { backgroundColor: c.primary + '20' }]}>
            <MaterialCommunityIcons name="book-open-page-variant" size={48} color={c.primary} />
          </View>
          <Text style={[styles.courseName, { color: c.textHeading }]}>{course?.name ?? ''}</Text>
        </View>

        {/* Join online lesson button */}
        {course?.liveLink ? (
          <Pressable
            onPress={() => {
              if (Platform.OS === 'web') {
                window.open(course.liveLink, '_blank');
              } else {
                Linking.openURL(course.liveLink).catch(() => {});
              }
            }}
            style={({ pressed }) => [styles.liveLinkBtn, pressed && { opacity: 0.8 }]}
          >
            <MaterialCommunityIcons name="video-outline" size={20} color="#FFF" />
            <Text style={styles.liveLinkText}>{t('courses.joinOnline')}</Text>
            <MaterialCommunityIcons name="open-in-new" size={16} color="#FFF" />
          </Pressable>
        ) : null}

        {course?.description ? <Text style={[styles.description, { color: c.textBody }]}>{course.description}</Text> : null}

        {/* Modules */}
        <Text style={[styles.sectionTitle, { color: c.textHeading }]}>{t('courses.modules')}</Text>
        {(course?.modules ?? []).map((mod: any) => {
          const isExpanded = expandedModules.has(mod?.id);
          const hasVideos = (mod?.videoLessons?.length ?? 0) > 0;
          const hasMaterials = (mod?.materials?.length ?? 0) > 0;
          const hasExams = (mod?.exams?.length ?? 0) > 0;
          const hasContent = hasVideos || hasMaterials || hasExams;
          return (
            <View key={mod?.id} style={[styles.moduleContainer, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
              <Pressable onPress={() => toggleModule(mod?.id)} style={styles.moduleHeader}>
                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                  {mod?.isCompleted ? (
                    <MaterialCommunityIcons name="check-circle" size={20} color={c.success} />
                  ) : (
                    <MaterialCommunityIcons name="circle-outline" size={20} color={c.textMuted} />
                  )}
                  <Text style={[styles.moduleTitle, { color: c.textHeading }]} numberOfLines={1}>{mod?.title ?? ''}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  {hasVideos && <Text style={{ fontSize: 11, color: c.textMuted }}>{mod.videoLessons.length} 🎬</Text>}
                  {hasMaterials && <Text style={{ fontSize: 11, color: c.textMuted }}>{mod.materials.length} 📄</Text>}
                  {hasExams && <Text style={{ fontSize: 11, color: c.textMuted }}>{mod.exams.length} 📝</Text>}
                  <MaterialCommunityIcons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={22} color={c.textMuted} />
                </View>
              </Pressable>
              {isExpanded && (
                <View style={styles.contentList}>
                  {/* Video Lessons */}
                  {(mod?.videoLessons ?? []).map((video: any) => (
                    <Pressable
                      key={video?.id}
                      onPress={() => router.push(`/course/${courseId}/video/${video?.id}`)}
                      style={({ pressed }) => [styles.contentItem, { borderTopColor: c.cardBorder }, pressed && { opacity: 0.7 }]}
                    >
                      <MaterialCommunityIcons name="play-circle-outline" size={20} color={c.primary} />
                      <Text style={[styles.contentTitle, { color: c.textBody }]} numberOfLines={1}>{video?.title ?? ''}</Text>
                      {video?.isWatched && <MaterialCommunityIcons name="check" size={18} color={c.success} />}
                    </Pressable>
                  ))}
                  {/* Materials */}
                  {(mod?.materials ?? []).map((mat: any) => {
                    const iconName = FILE_ICONS[mat?.fileType?.toLowerCase()] ?? 'file-document-outline';
                    const isDownloading = downloadingId === mat?.id;
                    return (
                      <Pressable
                        key={mat?.id}
                        onPress={() => openMaterial(mat?.id)}
                        disabled={isDownloading}
                        style={({ pressed }) => [styles.contentItem, { borderTopColor: c.cardBorder }, pressed && { opacity: 0.7 }]}
                      >
                        <MaterialCommunityIcons name={iconName as any} size={20} color={c.sectionOrange ?? c.accent} />
                        <View style={{ flex: 1, marginLeft: spacing.sm }}>
                          <Text style={[styles.contentTitle, { color: c.textBody, marginLeft: 0 }]} numberOfLines={1}>{mat?.title || mat?.fileName || ''}</Text>
                          <Text style={{ fontSize: 11, color: c.textMuted }}>{mat?.fileType?.toUpperCase()} · {formatFileSize(mat?.fileSize ?? 0)}</Text>
                        </View>
                        {isDownloading ? (
                          <ActivityIndicator size="small" color={c.primary} />
                        ) : (
                          <MaterialCommunityIcons name="download" size={18} color={c.primary} />
                        )}
                      </Pressable>
                    );
                  })}
                  {/* Exams */}
                  {(mod?.exams ?? []).map((exam: any) => (
                    <Pressable
                      key={exam?.id}
                      onPress={() => router.push(isTeacher ? `/exam-results/${exam?.id}` : `/exam/${exam?.id}`)}
                      style={({ pressed }) => [styles.contentItem, { borderTopColor: c.cardBorder }, pressed && { opacity: 0.7 }]}
                    >
                      <MaterialCommunityIcons name="clipboard-text-outline" size={20} color={c.sectionPurple ?? '#7C3AED'} />
                      <View style={{ flex: 1, marginLeft: spacing.sm }}>
                        <Text style={[styles.contentTitle, { color: c.textBody, marginLeft: 0 }]} numberOfLines={1}>{exam?.title ?? ''}</Text>
                        <Text style={{ fontSize: 11, color: c.textMuted }}>
                          {exam?.duration ? `${exam.duration} ${t('exams.minutes')}` : ''}{exam?.duration && exam?.totalMarks ? ' · ' : ''}{exam?.totalMarks ? `${exam.totalMarks} ${t('exams.totalMarks')}` : ''}
                          {isTeacher && exam?._count?.results != null ? ` · ${exam._count.results} ${t('exams.results')}` : ''}
                        </Text>
                      </View>
                      <MaterialCommunityIcons name="chevron-right" size={18} color={c.textMuted} />
                    </Pressable>
                  ))}
                  {/* Empty */}
                  {!hasContent && (
                    <Text style={[styles.noContent, { color: c.textMuted }]}>{t('courses.noContent')}</Text>
                  )}
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.md, paddingBottom: 80 },
  backBtn: { marginBottom: spacing.md, width: 44, height: 44, justifyContent: 'center' },
  hero: { alignItems: 'center', marginBottom: spacing.lg },
  heroIcon: { width: 80, height: 80, borderRadius: borderRadius.xl, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  courseName: { fontSize: 22, fontWeight: '700', textAlign: 'center' },
  liveLinkBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#10B981', paddingVertical: 12, paddingHorizontal: spacing.lg, borderRadius: borderRadius.lg, marginHorizontal: spacing.md, marginBottom: spacing.lg, gap: 8 },
  liveLinkText: { color: '#FFF', fontSize: 15, fontWeight: '600' },
  description: { fontSize: 14, lineHeight: 22, marginBottom: spacing.lg },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: spacing.md },
  moduleContainer: { borderWidth: 1, borderRadius: borderRadius.lg, marginBottom: spacing.sm, overflow: 'hidden' },
  moduleHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.md },
  moduleTitle: { fontSize: 15, fontWeight: '500', marginLeft: spacing.sm, flex: 1 },
  contentList: { paddingHorizontal: spacing.md, paddingBottom: spacing.md },
  contentItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, borderTopWidth: 1, minHeight: 44 },
  contentTitle: { fontSize: 14, marginLeft: spacing.sm, flex: 1 },
  noContent: { fontSize: 13, fontStyle: 'italic', paddingVertical: spacing.sm },
});
