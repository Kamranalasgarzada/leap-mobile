import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, Pressable, StyleSheet, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../src/contexts/AuthContext';
import { api } from '../../src/services/api';
import { ScreenContainer } from '../../src/components/ScreenContainer';
import { Card } from '../../src/components/Card';
import { EmptyState } from '../../src/components/EmptyState';
import { LoadingScreen } from '../../src/components/LoadingScreen';
import { useAppColors } from '../../src/hooks/useAppColors';
import { spacing, borderRadius } from '../../src/theme';
import i18n from '../../src/i18n';

const { width: SCREEN_W } = Dimensions.get('window');

export default function HomeScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const c = useAppColors();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [announcementDismissed, setAnnouncementDismissed] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await api.getDashboard(i18n.language);
      setData(res);
    } catch (e) {
      console.error('Dashboard error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

  if (loading && !data) return <LoadingScreen />;

  const upcomingExams = data?.upcomingExams ?? [];
  const recentCourses = data?.recentCourses ?? [];
  const unreadCount = data?.unreadNotificationCount ?? 0;
  const announcement = data?.announcement;
  const studyGroups = data?.studyGroups ?? [];
  const lastVideo = data?.lastVideo;
  const weeklyStats = data?.weeklyStats ?? {};
  const streak = weeklyStats?.streak ?? 0;
  const thisWeek = weeklyStats?.thisWeek ?? 0;
  const lastWeek = weeklyStats?.lastWeek ?? 0;
  const improvement = lastWeek > 0 ? Math.round(((thisWeek - lastWeek) / lastWeek) * 100) : 0;
  const badges = data?.badges ?? [];
  const todaySchedule = data?.todaySchedule ?? [];
  const attendanceSummary = data?.attendanceSummary;
  const lastExamResult = data?.lastExamResult;

  return (
    <ScreenContainer>
      <ScrollView
        contentContainerStyle={{ paddingBottom: spacing.xxl }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor={c.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header: Greeting + Bell + Badges */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <LinearGradient colors={c.gradientPrimary} style={styles.avatar}>
              <Text style={styles.avatarText}>{(user?.name ?? '?')[0]?.toUpperCase()}</Text>
            </LinearGradient>
            <View>
              <Text style={[styles.greeting, { color: c.textHeading }]}>
                {t('home.greeting', { name: user?.name?.split(' ')?.[0] ?? '' })}
              </Text>
              {(badges?.length ?? 0) > 0 && (
                <View style={styles.badgesRow}>
                  {(badges ?? []).slice(0, 3).map((b: any, i: number) => (
                    <View key={i} style={[styles.badge, { backgroundColor: c.sectionOrange + '20' }]}>
                      <Text style={{ fontSize: 10 }}>{b?.icon ?? '🏆'}</Text>
                      <Text style={[styles.badgeText, { color: c.sectionOrange }]} numberOfLines={1}>{b?.name ?? ''}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Pressable onPress={() => router.push('/qr-checkin')} style={styles.bellBtn}>
              <MaterialCommunityIcons name="qrcode-scan" size={24} color={c.primary} />
            </Pressable>
            <Pressable onPress={() => router.push('/notifications')} style={styles.bellBtn}>
              <MaterialCommunityIcons name="bell-outline" size={26} color={c.textHeading} />
              {unreadCount > 0 && (
                <View style={[styles.bellBadge, { backgroundColor: c.error }]}>
                  <Text style={styles.bellBadgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
                </View>
              )}
            </Pressable>
          </View>
        </View>

        {/* Teacher Announcement (dismissible) */}
        {announcement && !announcementDismissed && (
          <View style={[styles.announcementCard, { backgroundColor: c.sectionPurple + '15', borderColor: c.sectionPurple + '30' }]}>
            <View style={styles.announcementHeader}>
              <View style={[styles.announcementDot, { backgroundColor: c.sectionPurple }]} />
              <Text style={[styles.announcementLabel, { color: c.sectionPurple }]}>{t('home.announcement')}</Text>
              <Pressable onPress={() => setAnnouncementDismissed(true)} style={styles.announcementClose}>
                <MaterialCommunityIcons name="close" size={18} color={c.textMuted} />
              </Pressable>
            </View>
            <Text style={[styles.announcementText, { color: c.textBody }]}>{announcement?.message ?? ''}</Text>
            {announcement?.teacherName && (
              <Text style={[styles.announcementTeacher, { color: c.textMuted }]}>— {announcement.teacherName}</Text>
            )}
          </View>
        )}

        {/* Motivation Card */}
        <LinearGradient
          colors={['#7C3AED', '#EC4899'] as const}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.motivationCard}
        >
          <View style={styles.motivationTop}>
            <View>
              <Text style={styles.motivationTitle}>{t('home.weeklyProgress')}</Text>
              <Text style={styles.motivationSubtext}>{t('home.keepGoing')}</Text>
            </View>
            <View style={styles.streakBubble}>
              <Text style={styles.streakEmoji}>🔥</Text>
              <Text style={styles.streakNum}>{streak}</Text>
              <Text style={styles.streakLabel}>{t('home.streak')}</Text>
            </View>
          </View>
          <View style={styles.motivationStats}>
            <View style={styles.motivationStatItem}>
              <Text style={styles.motivationStatValue}>{thisWeek}</Text>
              <Text style={styles.motivationStatLabel}>{t('home.thisWeek')}</Text>
            </View>
            <View style={[styles.motivationDivider, { backgroundColor: 'rgba(255,255,255,0.2)' }]} />
            <View style={styles.motivationStatItem}>
              <Text style={styles.motivationStatValue}>{lastWeek}</Text>
              <Text style={styles.motivationStatLabel}>{t('home.lastWeek')}</Text>
            </View>
            <View style={[styles.motivationDivider, { backgroundColor: 'rgba(255,255,255,0.2)' }]} />
            <View style={styles.motivationStatItem}>
              <Text style={[styles.motivationStatValue, { color: improvement >= 0 ? '#A7F3D0' : '#FCA5A5' }]}>
                {improvement >= 0 ? `+${improvement}%` : `${improvement}%`}
              </Text>
              <Text style={styles.motivationStatLabel}>{improvement >= 0 ? '📈' : '📉'}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Today's Schedule */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: c.textHeading }]}>{t('home.todaySchedule')}</Text>
          </View>
          {todaySchedule.length === 0 ? (
            <Card style={{ marginHorizontal: spacing.md }}>
              <View style={styles.emptyRow}>
                <MaterialCommunityIcons name="calendar-check" size={28} color={c.textMuted} />
                <Text style={[styles.emptyText, { color: c.textMuted }]}>{t('home.noScheduleToday')}</Text>
              </View>
            </Card>
          ) : (
            <View style={{ paddingHorizontal: spacing.md, gap: spacing.sm }}>
              {todaySchedule.map((item: any, idx: number) => (
                <Card key={item?.groupId ?? idx}>
                  <View style={styles.scheduleRow}>
                    <View style={[styles.scheduleTimeBox, { backgroundColor: c.primary + '15' }]}>
                      <MaterialCommunityIcons name="clock-outline" size={16} color={c.primary} />
                      <Text style={[styles.scheduleTime, { color: c.primary }]}>{item?.lessonTime ?? '--:--'}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.scheduleCourseName, { color: c.textHeading }]} numberOfLines={1}>{item?.courseName ?? ''}</Text>
                      <Text style={[styles.scheduleGroupName, { color: c.textMuted }]} numberOfLines={1}>
                        {item?.groupName ?? ''}{item?.room ? ` · ${t('home.room')}: ${item.room}` : ''}{item?.durationMin ? ` · ${item.durationMin} ${t('home.min')}` : ''}
                      </Text>
                    </View>
                  </View>
                </Card>
              ))}
            </View>
          )}
        </View>

        {/* Attendance Summary */}
        {attendanceSummary && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: c.textHeading }]}>{t('home.attendanceSummary')}</Text>
              <Pressable onPress={() => router.push('/tabs/my-lessons')}>
                <Text style={[styles.seeAll, { color: c.primary }]}>{t('common.seeAll')} →</Text>
              </Pressable>
            </View>
            <Card style={{ marginHorizontal: spacing.md }}>
              <View style={styles.attSummaryRow}>
                <View style={styles.attSummaryItem}>
                  <View style={[styles.attDot, { backgroundColor: c.success }]} />
                  <Text style={[styles.attNum, { color: c.textHeading }]}>{attendanceSummary?.present ?? 0}</Text>
                  <Text style={[styles.attLabel, { color: c.textMuted }]}>{t('home.present')}</Text>
                </View>
                <View style={styles.attSummaryItem}>
                  <View style={[styles.attDot, { backgroundColor: '#F59E0B' }]} />
                  <Text style={[styles.attNum, { color: c.textHeading }]}>{attendanceSummary?.late ?? 0}</Text>
                  <Text style={[styles.attLabel, { color: c.textMuted }]}>{t('home.late')}</Text>
                </View>
                <View style={styles.attSummaryItem}>
                  <View style={[styles.attDot, { backgroundColor: c.error }]} />
                  <Text style={[styles.attNum, { color: c.textHeading }]}>{attendanceSummary?.absent ?? 0}</Text>
                  <Text style={[styles.attLabel, { color: c.textMuted }]}>{t('home.absent')}</Text>
                </View>
                <View style={styles.attSummaryItem}>
                  <LinearGradient colors={c.gradientPrimary} style={styles.attPercentCircle}>
                    <Text style={styles.attPercentText}>{attendanceSummary?.percentage ?? 0}%</Text>
                  </LinearGradient>
                </View>
              </View>
            </Card>
          </View>
        )}

        {/* Last Exam Result */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: c.textHeading }]}>{t('home.lastExamResult')}</Text>
          </View>
          {lastExamResult ? (
            <Card onPress={() => router.push(`/exam-results/${lastExamResult?.examId}`)} style={{ marginHorizontal: spacing.md }}>
              <View style={styles.examResultRow}>
                <View style={[styles.examResultIcon, { backgroundColor: c.sectionGreen + '15' }]}>
                  <MaterialCommunityIcons name="trophy" size={28} color={c.sectionGreen} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.examResultTitle, { color: c.textHeading }]} numberOfLines={1}>{lastExamResult?.examTitle ?? ''}</Text>
                  <Text style={[styles.examResultSub, { color: c.textMuted }]} numberOfLines={1}>{lastExamResult?.courseName ?? ''}</Text>
                </View>
                <View style={styles.examResultScoreBox}>
                  <Text style={[styles.examResultScore, { color: c.primary }]}>
                    {lastExamResult?.score ?? 0}/{lastExamResult?.totalMarks ?? 0}
                  </Text>
                  <Text style={[styles.examResultScoreLabel, { color: c.textMuted }]}>{t('home.score')}</Text>
                </View>
              </View>
            </Card>
          ) : (
            <Card style={{ marginHorizontal: spacing.md }}>
              <View style={styles.emptyRow}>
                <MaterialCommunityIcons name="clipboard-text-outline" size={28} color={c.textMuted} />
                <Text style={[styles.emptyText, { color: c.textMuted }]}>{t('home.noExamResults')}</Text>
              </View>
            </Card>
          )}
        </View>

        {/* My Groups Preview */}
        {(studyGroups?.length ?? 0) > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: c.textHeading }]}>{t('home.myGroups')}</Text>
              <Pressable onPress={() => router.push('/tabs/groups')}>
                <Text style={[styles.seeAll, { color: c.primary }]}>{t('common.seeAll')} →</Text>
              </Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: spacing.md }}>
              {(studyGroups ?? []).slice(0, 5).map((g: any, idx: number) => {
                const groupColors: readonly [string, string] = [
                  ['#7C3AED', '#8B5CF6'],
                  ['#3B82F6', '#60A5FA'],
                  ['#10B981', '#34D399'],
                  ['#EC4899', '#F472B6'],
                  ['#F59E0B', '#FBBF24'],
                ][idx % 5] as unknown as readonly [string, string];
                return (
                  <Pressable key={g?.id ?? idx} onPress={() => router.push(`/study-group/${g?.id}`)} style={styles.groupCard}>
                    <LinearGradient colors={groupColors} style={styles.groupGradient}>
                      <Text style={styles.groupName} numberOfLines={1}>{g?.name ?? ''}</Text>
                      <View style={styles.groupMeta}>
                        <Text style={styles.groupMetaText}>#{g?.rank ?? '-'}</Text>
                        <Text style={styles.groupMetaText}>🔥{g?.streak ?? 0}</Text>
                      </View>
                    </LinearGradient>
                    <View style={[styles.groupBottom, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
                      <Text style={[styles.groupStat, { color: c.textMuted }]}>{g?.memberCount ?? 0} {t('groups.members')}</Text>
                      {g?.isLive && (
                        <View style={[styles.liveDot, { backgroundColor: c.success }]}>
                          <Text style={styles.liveText}>{t('home.liveNow')}</Text>
                        </View>
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        )}



        {/* Next Exam + Next Video stacked */}
        <View style={styles.section}>
          {upcomingExams.length > 0 && (
            <Card onPress={() => router.push(`/exam/${upcomingExams[0]?.id}`)} style={{ marginHorizontal: spacing.md, marginBottom: spacing.sm }}>
              <View style={styles.examRow}>
                <View style={[styles.examIcon, { backgroundColor: c.sectionGreen + '15' }]}>
                  <MaterialCommunityIcons name="clipboard-text-clock" size={36} color={c.sectionGreen} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.nextLabel, { color: c.sectionGreen }]}>{t('home.nextExam')}</Text>
                  <Text style={[styles.examTitle, { color: c.textHeading }]} numberOfLines={1}>{upcomingExams[0]?.title ?? ''}</Text>
                  <Text style={[styles.examSub, { color: c.textMuted }]} numberOfLines={1}>
                    {upcomingExams[0]?.courseName ?? ''}{upcomingExams[0]?.moduleTitle ? ` · ${upcomingExams[0].moduleTitle}` : ''}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  {upcomingExams[0]?.examDate ? <Text style={[styles.examDate, { color: c.accent }]}>{new Date(upcomingExams[0].examDate).toLocaleDateString()}</Text> : null}
                  {upcomingExams[0]?.duration ? <Text style={[styles.examDuration, { color: c.textMuted }]}>{upcomingExams[0].duration} {t('exams.minutes')}</Text> : null}
                </View>
              </View>
            </Card>
          )}
          {lastVideo ? (
            <Card onPress={() => router.push(`/course/${lastVideo?.courseId}/video/${lastVideo?.id}`)} style={{ marginHorizontal: spacing.md }}>
              <View style={styles.videoRow}>
                <View style={[styles.videoThumb, { backgroundColor: c.primary + '15' }]}>
                  <MaterialCommunityIcons name="play-circle" size={44} color={c.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.nextLabel, { color: c.primary }]}>{t('home.nextVideo')}</Text>
                  <Text style={[styles.videoTitle, { color: c.textHeading }]} numberOfLines={1}>{lastVideo?.title ?? ''}</Text>
                  <Text style={[styles.videoSub, { color: c.textMuted }]} numberOfLines={1}>
                    {lastVideo?.courseName ?? ''}{lastVideo?.moduleTitle ? ` · ${lastVideo.moduleTitle}` : ''}
                  </Text>
                  <View style={[styles.videoProgress, { backgroundColor: c.surfaceLight }]}>
                    <LinearGradient colors={c.gradientPrimary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.videoProgressFill, { width: `${Math.min(100, lastVideo?.progress ?? 0)}%` }]} />
                  </View>
                </View>
              </View>
            </Card>
          ) : (
            <Card onPress={() => router.push('/tabs/my-lessons')} style={{ marginHorizontal: spacing.md }}>
              <View style={styles.videoRow}>
                <View style={[styles.videoThumb, { backgroundColor: c.primary + '10' }]}>
                  <MaterialCommunityIcons name="play-circle-outline" size={44} color={c.primary + '60'} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.nextLabel, { color: c.primary }]}>{t('home.nextVideo')}</Text>
                  <Text style={[styles.videoTitle, { color: c.textHeading }]}>{t('home.startWatching')}</Text>
                  <Text style={[styles.videoSub, { color: c.textMuted }]}>{t('home.startWatchingDesc')}</Text>
                </View>
              </View>
            </Card>
          )}
        </View>

        {/* Recent Courses */}
        {recentCourses.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: c.textHeading }]}>{t('home.recentCourses')}</Text>
              <Pressable onPress={() => router.push('/tabs/my-lessons')}>
                <Text style={[styles.seeAll, { color: c.primary }]}>{t('common.seeAll')} →</Text>
              </Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: spacing.md }}>
              {recentCourses.map((course: any) => (
                <Card key={course?.id} onPress={() => router.push(`/course/${course?.id}`)} style={styles.courseCard}>
                  <View style={[styles.courseIcon, { backgroundColor: c.primary + '12' }]}>
                    <MaterialCommunityIcons name="book-open-page-variant" size={28} color={c.primary} />
                  </View>
                  <Text style={[styles.courseName, { color: c.textHeading }]} numberOfLines={2}>{course?.name ?? ''}</Text>
                  <View style={[styles.courseProgress, { backgroundColor: c.surfaceLight }]}>
                    <LinearGradient colors={c.gradientPrimary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.courseProgressFill, { width: `${Math.min(100, ((course?.completedModules ?? 0) / Math.max(course?.totalModules ?? 1, 1)) * 100)}%` }]} />
                  </View>
                  <Text style={[styles.courseProgressText, { color: c.textMuted }]}>{course?.completedModules ?? 0}/{course?.totalModules ?? 0}</Text>
                </Card>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Empty state if nothing */}
        {(studyGroups?.length ?? 0) === 0 && upcomingExams.length === 0 && recentCourses.length === 0 && !lastVideo && (
          <View style={{ marginTop: spacing.xl }}>
            <EmptyState icon="school-outline" message={t('common.noData')} />
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md, paddingTop: spacing.sm },
  headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  avatarText: { color: '#FFF', fontSize: 20, fontWeight: '700' },
  greeting: { fontSize: 20, fontWeight: '700' },
  badgesRow: { flexDirection: 'row', gap: 6, marginTop: 4, flexWrap: 'wrap' },
  badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, gap: 3 },
  badgeText: { fontSize: 10, fontWeight: '600' },
  bellBtn: { position: 'relative', padding: spacing.xs },
  bellBadge: { position: 'absolute', top: -2, right: -4, borderRadius: 10, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  bellBadgeText: { color: '#FFF', fontSize: 10, fontWeight: '700' },

  announcementCard: { marginHorizontal: spacing.md, marginBottom: spacing.md, padding: spacing.md, borderRadius: borderRadius.lg, borderWidth: 1 },
  announcementHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs },
  announcementDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  announcementLabel: { fontSize: 13, fontWeight: '700', flex: 1 },
  announcementClose: { padding: 4 },
  announcementText: { fontSize: 14, lineHeight: 20 },
  announcementTeacher: { fontSize: 12, marginTop: 4, fontStyle: 'italic' },

  motivationCard: { marginHorizontal: spacing.md, borderRadius: borderRadius.xl, padding: spacing.lg, marginBottom: spacing.md },
  motivationTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  motivationTitle: { fontSize: 18, fontWeight: '700', color: '#FFF' },
  motivationSubtext: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  streakBubble: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: borderRadius.lg, padding: spacing.sm, minWidth: 64 },
  streakEmoji: { fontSize: 20 },
  streakNum: { fontSize: 24, fontWeight: '800', color: '#FFF' },
  streakLabel: { fontSize: 10, color: 'rgba(255,255,255,0.8)', fontWeight: '600' },
  motivationStats: { flexDirection: 'row', marginTop: spacing.md, justifyContent: 'space-around', alignItems: 'center' },
  motivationStatItem: { alignItems: 'center' },
  motivationStatValue: { fontSize: 22, fontWeight: '800', color: '#FFF' },
  motivationStatLabel: { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  motivationDivider: { width: 1, height: 36 },

  section: { marginTop: spacing.lg },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.md, marginBottom: spacing.sm },
  sectionTitle: { fontSize: 18, fontWeight: '700' },
  seeAll: { fontSize: 13, fontWeight: '600' },

  groupCard: { width: 160, marginRight: spacing.md, borderRadius: borderRadius.lg, overflow: 'hidden' },
  groupGradient: { padding: spacing.md, paddingBottom: spacing.sm },
  groupName: { fontSize: 14, fontWeight: '700', color: '#FFF', marginBottom: 6 },
  groupMeta: { flexDirection: 'row', gap: 10 },
  groupMetaText: { fontSize: 12, color: 'rgba(255,255,255,0.9)', fontWeight: '600' },
  groupBottom: { padding: spacing.sm, borderWidth: 1, borderTopWidth: 0 },
  groupStat: { fontSize: 11 },
  liveDot: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10, marginTop: 4 },
  liveText: { fontSize: 10, color: '#FFF', fontWeight: '700', marginLeft: 2 },

  videoRow: { flexDirection: 'row', alignItems: 'center' },
  videoThumb: { width: 80, height: 80, borderRadius: borderRadius.lg, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  nextLabel: { fontSize: 11, fontWeight: '700', marginBottom: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  videoTitle: { fontSize: 15, fontWeight: '600' },
  videoSub: { fontSize: 12, marginTop: 2 },
  videoProgress: { height: 4, borderRadius: 2, marginTop: 8, overflow: 'hidden' },
  videoProgressFill: { height: '100%', borderRadius: 2 },

  examRow: { flexDirection: 'row', alignItems: 'center' },
  examIcon: { width: 64, height: 64, borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  examTitle: { fontSize: 15, fontWeight: '600' },
  examSub: { fontSize: 12, marginTop: 2 },
  examDate: { fontSize: 12, fontWeight: '600' },
  examDuration: { fontSize: 11, marginTop: 2 },

  // Schedule styles
  scheduleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  scheduleTimeBox: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: borderRadius.md },
  scheduleTime: { fontSize: 14, fontWeight: '700' },
  scheduleCourseName: { fontSize: 14, fontWeight: '600' },
  scheduleGroupName: { fontSize: 12, marginTop: 2 },
  emptyRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  emptyText: { fontSize: 14 },

  // Attendance summary styles
  attSummaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  attSummaryItem: { alignItems: 'center', flex: 1 },
  attDot: { width: 10, height: 10, borderRadius: 5, marginBottom: 4 },
  attNum: { fontSize: 20, fontWeight: '800' },
  attLabel: { fontSize: 11, marginTop: 2 },
  attPercentCircle: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  attPercentText: { color: '#FFF', fontSize: 13, fontWeight: '800' },

  // Exam result styles
  examResultRow: { flexDirection: 'row', alignItems: 'center' },
  examResultIcon: { width: 52, height: 52, borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  examResultTitle: { fontSize: 14, fontWeight: '600' },
  examResultSub: { fontSize: 12, marginTop: 2 },
  examResultScoreBox: { alignItems: 'flex-end' },
  examResultScore: { fontSize: 18, fontWeight: '800' },
  examResultScoreLabel: { fontSize: 11, marginTop: 2 },

  courseCard: { width: 160, marginRight: spacing.md },
  courseIcon: { width: 52, height: 52, borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  courseName: { fontSize: 14, fontWeight: '600', marginBottom: spacing.sm, minHeight: 36 },
  courseProgress: { height: 4, borderRadius: 2, overflow: 'hidden' },
  courseProgressFill: { height: '100%', borderRadius: 2 },
  courseProgressText: { fontSize: 11, marginTop: 4 },
});
