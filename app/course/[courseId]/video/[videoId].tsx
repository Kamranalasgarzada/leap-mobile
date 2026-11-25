import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { api } from '../../../../src/services/api';
import { ScreenContainer } from '../../../../src/components/ScreenContainer';
import { Card } from '../../../../src/components/Card';
import { GradientButton } from '../../../../src/components/GradientButton';
import { LoadingScreen } from '../../../../src/components/LoadingScreen';
import { colors, spacing, borderRadius } from '../../../../src/theme';

function extractYoutubeId(url: string): string {
  try {
    const match = url?.match?.(/(?:youtu\.be\/|v=|embed\/)([a-zA-Z0-9_-]{11})/);
    return match?.[1] ?? '';
  } catch { return ''; }
}

export default function VideoLessonScreen() {
  const { videoId = '' } = useLocalSearchParams<{ videoId: string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const [video, setVideo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);

  const fetchVideo = useCallback(async () => {
    if (!videoId) return;
    try {
      const res = await api.getVideo(videoId);
      setVideo(res?.video ?? null);
    } catch (e) {
      console.error('Video error:', e);
    } finally {
      setLoading(false);
    }
  }, [videoId]);

  useFocusEffect(useCallback(() => { fetchVideo(); }, [fetchVideo]));

  const handleMarkWatched = async () => {
    setMarking(true);
    try {
      await api.markVideoWatched(videoId);
      setVideo((prev: any) => ({ ...(prev ?? {}), isWatched: true }));
      Toast.show({ type: 'success', text1: t('courses.watched') });
    } catch (e: any) {
      Toast.show({ type: 'error', text1: e?.message ?? t('common.error') });
    } finally {
      setMarking(false);
    }
  };

  if (loading) return <LoadingScreen />;
  if (!video) return <ScreenContainer><Text style={{ color: colors.textMuted, padding: spacing.lg }}>Video not found</Text></ScreenContainer>;

  const ytId = extractYoutubeId(video?.youtubeUrl ?? '');

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textHeading} />
        </Pressable>

        {/* YouTube Player */}
        <View style={styles.playerContainer}>
          {Platform.OS === 'web' ? (
            <iframe
              src={`https://www.youtube.com/embed/${ytId}`}
              style={{ width: '100%', height: '100%', border: 'none', borderRadius: 12 } as any}
              allowFullScreen
            />
          ) : (() => {
            const YoutubePlayer = require('react-native-youtube-iframe').default;
            return <YoutubePlayer height={220} videoId={ytId} />;
          })()}
        </View>

        <Text style={styles.videoTitle}>{video?.title ?? ''}</Text>
        <Text style={styles.teacherName}>{video?.teacherName ?? ''}</Text>
        {video?.description ? <Text style={styles.description}>{video.description}</Text> : null}

        {video?.isWatched ? (
          <View style={styles.watchedBadge}>
            <MaterialCommunityIcons name="check-circle" size={20} color={colors.success} />
            <Text style={styles.watchedText}>{t('courses.watched')}</Text>
          </View>
        ) : (
          <GradientButton title={t('courses.markWatched')} onPress={handleMarkWatched} loading={marking} style={{ marginTop: spacing.md }} />
        )}

        {/* Assignments */}
        {(video?.assignments?.length ?? 0) > 0 && (
          <View style={{ marginTop: spacing.lg }}>
            <Text style={styles.sectionTitle}>{t('courses.assignments')}</Text>
            {(video?.assignments ?? []).map((a: any) => (
              <Card key={a?.id} style={styles.assignmentCard}>
                <Text style={styles.assignmentTitle}>{a?.title ?? ''}</Text>
                <View style={styles.assignmentMeta}>
                  {a?.dueDate ? <Text style={styles.assignmentDate}>Due: {new Date(a.dueDate).toLocaleDateString()}</Text> : null}
                  <Text style={styles.assignmentMarks}>{a?.totalMarks ?? 0} marks</Text>
                  {a?.submissionStatus ? (
                    <View style={styles.statusChip}><Text style={styles.statusText}>{a.submissionStatus}</Text></View>
                  ) : null}
                </View>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.md, paddingBottom: spacing.xxl },
  backBtn: { marginBottom: spacing.md, width: 44, height: 44, justifyContent: 'center' },
  playerContainer: { width: '100%', aspectRatio: 16 / 9, backgroundColor: colors.black, borderRadius: borderRadius.lg, overflow: 'hidden', marginBottom: spacing.md },
  videoTitle: { fontSize: 20, fontWeight: '700', color: colors.textHeading },
  teacherName: { fontSize: 14, color: colors.accent, marginTop: 4 },
  description: { fontSize: 14, color: colors.textBody, lineHeight: 22, marginTop: spacing.md },
  watchedBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: spacing.md, padding: spacing.md, backgroundColor: 'rgba(16,185,129,0.1)', borderRadius: borderRadius.md },
  watchedText: { color: colors.success, fontWeight: '600', marginLeft: spacing.sm },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: colors.textHeading, marginBottom: spacing.md },
  assignmentCard: { marginBottom: spacing.sm },
  assignmentTitle: { fontSize: 15, fontWeight: '500', color: colors.textHeading },
  assignmentMeta: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs, gap: spacing.md },
  assignmentDate: { fontSize: 12, color: colors.textMuted },
  assignmentMarks: { fontSize: 12, color: colors.textMuted },
  statusChip: { backgroundColor: 'rgba(37,99,235,0.15)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: borderRadius.full },
  statusText: { fontSize: 11, color: colors.primary, fontWeight: '600' },
});
