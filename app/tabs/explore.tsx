import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useFocusEffect, useRouter } from 'expo-router';
import { api } from '../../src/services/api';
import { spacing, borderRadius } from '../../src/theme';
import { useAppColors } from '../../src/hooks/useAppColors';
import { LoadingScreen } from '../../src/components/LoadingScreen';
import { EmptyState } from '../../src/components/EmptyState';

const CARD_WIDTH = 220;
const CARD_GAP = 12;
const AUTO_SCROLL_INTERVAL = 3500;

/* ─── Auto-scroll hook ─── */
function useAutoScroll(dataLength: number) {
  const scrollRef = useRef<FlatList>(null);
  const idxRef = useRef(0);
  useEffect(() => {
    if (dataLength <= 1) return;
    const timer = setInterval(() => {
      idxRef.current = (idxRef.current + 1) % dataLength;
      scrollRef.current?.scrollToIndex?.({ index: idxRef.current, animated: true });
    }, AUTO_SCROLL_INTERVAL);
    return () => clearInterval(timer);
  }, [dataLength]);
  return scrollRef;
}

function AutoScrollCards({ data, renderItem, keyExtractor }: {
  data: any[];
  renderItem: (item: any) => React.ReactElement;
  keyExtractor: (item: any) => string;
}) {
  const scrollRef = useAutoScroll(data?.length ?? 0);
  if ((data?.length ?? 0) === 0) return null;
  return (
    <FlatList
      ref={scrollRef}
      data={data ?? []}
      horizontal
      showsHorizontalScrollIndicator={false}
      keyExtractor={keyExtractor}
      contentContainerStyle={{ paddingHorizontal: spacing.md }}
      renderItem={({ item }) => renderItem(item)}
      getItemLayout={(_, index) => ({ length: CARD_WIDTH + CARD_GAP, offset: (CARD_WIDTH + CARD_GAP) * index, index })}
      onScrollToIndexFailed={() => {}}
    />
  );
}

export default function ExploreScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const c = useAppColors();
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<any[]>([]);
  const [blogs, setBlogs] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [stories, setStories] = useState<any[]>([]);
  const [publicExams, setPublicExams] = useState<any[]>([]);
  const [studyGroups, setStudyGroups] = useState<any[]>([]);

  useFocusEffect(
    useCallback(() => { loadData(); }, [])
  );

  const loadData = async () => {
    setLoading(true);
    try {
      const [cr, bl, te, st, ex, sg] = await Promise.all([
        api.publicGetCourses().catch(() => ({ courses: [] })),
        api.publicGetBlogs().catch(() => ({ posts: [] })),
        api.publicGetTeachers().catch(() => ({ teachers: [] })),
        api.publicGetSuccessStories().catch(() => ({ stories: [] })),
        api.publicGetExams().catch(() => ({ exams: [] })),
        api.getStudyGroups().catch(() => ({ groups: [] })),
      ]);
      setCourses(cr?.courses ?? []);
      setBlogs(bl?.posts ?? []);
      setTeachers(te?.teachers ?? []);
      setStories(st?.stories ?? []);
      setPublicExams(ex?.exams ?? []);
      setStudyGroups(sg?.groups ?? []);
    } catch {} finally { setLoading(false); }
  };

  if (loading) return <LoadingScreen />;

  /* ─── Section Header ─── */
  const SectionHeader = ({ icon, title, subtitle, color, onSeeAll }: {
    icon: string; title: string; subtitle?: string; color: string; onSeeAll?: () => void;
  }) => (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionHeaderLeft}>
        <View style={[styles.sectionIcon, { backgroundColor: color + '20' }]}>
          <MaterialCommunityIcons name={icon as any} size={22} color={color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.sectionTitle, { color: c.textHeading }]}>{title}</Text>
          {subtitle ? <Text style={[styles.sectionSubtitle, { color: c.textMuted }]}>{subtitle}</Text> : null}
        </View>
      </View>
      {onSeeAll && (
        <Pressable onPress={onSeeAll} style={styles.seeAllBtn}>
          <Text style={[styles.seeAllText, { color }]}>{t('common.seeAll')}</Text>
          <MaterialCommunityIcons name="arrow-right" size={16} color={color} />
        </Pressable>
      )}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.background }]} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40, paddingTop: spacing.md }}>

        {/* ═══ 1. KURSLAR ═══ */}
        {(courses?.length ?? 0) > 0 && (
          <View style={styles.section}>
            <SectionHeader icon="book-open-variant" title={t('explore.featuredCourses')} subtitle={t('explore.coursesSubtitle')} color={c.sectionPurple} onSeeAll={() => router.push('/explore/courses')} />
            <AutoScrollCards
              data={courses}
              keyExtractor={(item: any) => item?.id ?? ''}
              renderItem={(item: any) => {
                const hasDiscount = (item?.discountPrice ?? 0) > 0 && (item?.price ?? 0) > 0;
                return (
                  <Pressable style={[styles.card, { backgroundColor: c.card, borderColor: c.cardBorder }]} onPress={() => router.push(`/explore/course/${item?.id}`)}>
                    {/* Top color stripe */}
                    <LinearGradient colors={[c.sectionPurple, c.sectionPurple + '80'] as const} style={styles.cardStripe} />
                    {/* Discount badge */}
                    {hasDiscount && (
                      <View style={[styles.discountBadge, { backgroundColor: c.error }]}>
                        <Text style={styles.discountBadgeText}>
                          -{Math.round(100 - ((item.discountPrice / item.price) * 100))}%
                        </Text>
                      </View>
                    )}
                    <View style={styles.cardBody}>
                      <View style={[styles.cardIconBox, { backgroundColor: c.sectionPurple + '15' }]}>
                        <MaterialCommunityIcons name="book-open-variant" size={24} color={c.sectionPurple} />
                      </View>
                      {/* Price */}
                      {hasDiscount ? (
                        <View style={styles.priceRow}>
                          <Text style={[styles.oldPrice, { color: c.textMuted }]}>{item.price} AZN</Text>
                          <Text style={[styles.price, { color: c.sectionPurple }]}>{item.discountPrice} AZN</Text>
                        </View>
                      ) : (item?.price ?? 0) > 0 ? (
                        <Text style={[styles.price, { color: c.sectionPurple }]}>{item.price} AZN</Text>
                      ) : (
                        <Text style={[styles.price, { color: c.success }]}>{t('explore.free')}</Text>
                      )}
                      {/* Title */}
                      <Text style={[styles.cardTitle, { color: c.textHeading }]} numberOfLines={2}>{item?.name ?? ''}</Text>
                      {/* Description */}
                      {item?.description ? (
                        <Text style={[styles.cardDesc, { color: c.textMuted }]} numberOfLines={2}>{item.description}</Text>
                      ) : null}
                      {/* Stats row */}
                      <View style={styles.statsGrid}>
                        <View style={styles.statItem}>
                          <MaterialCommunityIcons name="play-circle-outline" size={13} color={c.textMuted} />
                          <Text style={[styles.statText, { color: c.textMuted }]}>{item?.videoCount ?? 0} video</Text>
                        </View>
                        {(item?.groupCount ?? 0) > 0 && (
                          <View style={styles.statItem}>
                            <MaterialCommunityIcons name="account-group-outline" size={13} color={c.textMuted} />
                            <Text style={[styles.statText, { color: c.textMuted }]}>{item.groupCount} qrup</Text>
                          </View>
                        )}
                        {item?.duration ? (
                          <View style={styles.statItem}>
                            <MaterialCommunityIcons name="clock-outline" size={13} color={c.textMuted} />
                            <Text style={[styles.statText, { color: c.textMuted }]}>{item.duration}</Text>
                          </View>
                        ) : null}
                      </View>
                    </View>
                  </Pressable>
                );
              }}
            />
          </View>
        )}

        {/* ═══ 2. İMTAHANLAR ═══ */}
        {(publicExams?.length ?? 0) > 0 && (
          <View style={styles.section}>
            <SectionHeader icon="clipboard-text-outline" title={t('explore.publicExams')} subtitle={t('explore.examsSubtitle')} color={c.sectionGreen} onSeeAll={() => router.push('/explore/exams')} />
            <AutoScrollCards
              data={publicExams}
              keyExtractor={(item: any) => item?.id ?? ''}
              renderItem={(item: any) => (
                <Pressable style={[styles.card, { backgroundColor: c.card, borderColor: c.cardBorder }]} onPress={() => router.push(`/exam/${item?.id}`)}>
                  {/* Top color stripe */}
                  <LinearGradient colors={[c.sectionGreen, c.sectionGreen + '80'] as const} style={styles.cardStripe} />
                  <View style={styles.cardBody}>
                    <View style={[styles.cardIconBox, { backgroundColor: c.sectionGreen + '15' }]}>
                      <MaterialCommunityIcons name="clipboard-text-outline" size={24} color={c.sectionGreen} />
                    </View>
                    {/* Title */}
                    <Text style={[styles.cardTitle, { color: c.textHeading }]} numberOfLines={2}>{item?.title ?? ''}</Text>
                    {/* Subject badge */}
                    {item?.courseName ? (
                      <Text style={[styles.cardDesc, { color: c.textMuted }]} numberOfLines={1}>{item.courseName}</Text>
                    ) : null}
                    {/* Stats row */}
                    <View style={styles.statsGrid}>
                      <View style={styles.statItem}>
                        <MaterialCommunityIcons name="help-circle-outline" size={13} color={c.textMuted} />
                        <Text style={[styles.statText, { color: c.textMuted }]}>{item?.questionCount ?? 0} sual</Text>
                      </View>
                      <View style={styles.statItem}>
                        <MaterialCommunityIcons name="clock-outline" size={13} color={c.textMuted} />
                        <Text style={[styles.statText, { color: c.textMuted }]}>{item?.duration ?? 0} dəq</Text>
                      </View>
                      {(item?.participantCount ?? 0) > 0 && (
                        <View style={styles.statItem}>
                          <MaterialCommunityIcons name="account-multiple" size={13} color={c.textMuted} />
                          <Text style={[styles.statText, { color: c.textMuted }]}>{item.participantCount}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </Pressable>
              )}
            />
          </View>
        )}

        {/* ═══ 3. DƏRS QRUPLARI ═══ */}
        {(studyGroups?.length ?? 0) > 0 && (
          <View style={styles.section}>
            <SectionHeader icon="account-group" title={t('explore.studyGroups')} subtitle={t('explore.studyGroupsSubtitle')} color={c.sectionBlue} onSeeAll={() => router.push('/explore/study-groups')} />
            <AutoScrollCards
              data={studyGroups}
              keyExtractor={(item: any) => item?.id ?? ''}
              renderItem={(item: any) => (
                <Pressable style={[styles.card, { backgroundColor: c.card, borderColor: c.cardBorder }]} onPress={() => router.push(`/study-group/${item?.id}`)}>
                  {/* Top stripe */}
                  <LinearGradient colors={[c.sectionBlue, c.sectionBlue + '80'] as const} style={styles.cardStripe} />
                  <View style={styles.cardBody}>
                    <View style={[styles.cardIconBox, { backgroundColor: c.sectionBlue + '15' }]}>
                      <MaterialCommunityIcons name="account-group" size={24} color={c.sectionBlue} />
                    </View>
                    <Text style={[styles.cardTitle, { color: c.textHeading }]} numberOfLines={2}>{item?.name ?? ''}</Text>
                    {item?.category ? (
                      <View style={[styles.tagBadge, { backgroundColor: c.sectionBlue + '20', alignSelf: 'flex-start', marginBottom: 6 }]}>
                        <Text style={[styles.tagText, { color: c.sectionBlue }]}>{item.category}</Text>
                      </View>
                    ) : null}
                    {item?.moderator ? (
                      <View style={[styles.statItem, { marginBottom: 4 }]}>
                        <MaterialCommunityIcons name="shield-account" size={13} color={c.textMuted} />
                        <Text style={[styles.statText, { color: c.textMuted }]}>{item.moderator}</Text>
                      </View>
                    ) : null}
                    <View style={styles.statsGrid}>
                      <View style={styles.statItem}>
                        <MaterialCommunityIcons name="account-multiple" size={13} color={c.textMuted} />
                        <Text style={[styles.statText, { color: c.textMuted }]}>{item?.memberCount ?? 0} üzv</Text>
                      </View>
                      <View style={styles.statItem}>
                        <MaterialCommunityIcons name="help-circle" size={13} color={c.textMuted} />
                        <Text style={[styles.statText, { color: c.textMuted }]}>{item?.questionCount ?? 0} sual</Text>
                      </View>
                    </View>
                  </View>
                </Pressable>
              )}
            />
          </View>
        )}

        {/* ═══ 4. MÜƏLLİMLƏR ═══ */}
        {(teachers?.length ?? 0) > 0 && (
          <View style={styles.section}>
            <SectionHeader icon="account-tie" title={t('explore.ourTeachers')} subtitle={t('explore.teachersSubtitle')} color={c.sectionPink} onSeeAll={() => router.push('/explore/teachers')} />
            <AutoScrollCards
              data={teachers}
              keyExtractor={(item: any) => item?.id ?? ''}
              renderItem={(item: any) => (
                <View style={[styles.card, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
                  {/* Gradient top with avatar */}
                  <LinearGradient colors={[c.sectionPink + '40', c.sectionPink + '10'] as const} style={styles.teacherGradientTop}>
                    <View style={[styles.teacherAvatarCircle, { borderColor: c.sectionPink + '50', backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                      <MaterialCommunityIcons name="account" size={32} color={c.sectionPink} />
                    </View>
                  </LinearGradient>
                  <View style={styles.teacherInfo}>
                    <Text style={[styles.teacherName, { color: c.textHeading }]} numberOfLines={1}>{item?.name ?? ''}</Text>
                    <Text style={[styles.teacherSubject, { color: c.sectionPink }]}>{item?.subject ?? ''}</Text>
                    {/* Bio */}
                    {item?.bio ? (
                      <Text style={[styles.cardDesc, { color: c.textMuted, textAlign: 'center' }]} numberOfLines={2}>{item.bio}</Text>
                    ) : null}
                    {/* Stats */}
                    <View style={[styles.statsGrid, { justifyContent: 'center', marginTop: 6 }]}>
                      {item?.experienceYears ? (
                        <View style={styles.statItem}>
                          <MaterialCommunityIcons name="briefcase-outline" size={12} color={c.textMuted} />
                          <Text style={[styles.statText, { color: c.textMuted }]}>{item.experienceYears} il</Text>
                        </View>
                      ) : null}
                      {item?.education ? (
                        <View style={styles.statItem}>
                          <MaterialCommunityIcons name="school" size={12} color={c.textMuted} />
                          <Text style={[styles.statText, { color: c.textMuted }]}>{item.education}</Text>
                        </View>
                      ) : null}
                      {(item?.courseCount ?? 0) > 0 && (
                        <View style={styles.statItem}>
                          <MaterialCommunityIcons name="book-open-variant" size={12} color={c.textMuted} />
                          <Text style={[styles.statText, { color: c.textMuted }]}>{item.courseCount} kurs</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              )}
            />
          </View>
        )}

        {/* ═══ 5. UĞURLARIMIZ ═══ */}
        {(stories?.length ?? 0) > 0 && (
          <View style={styles.section}>
            <SectionHeader icon="star-circle" title={t('explore.successStories')} subtitle={t('explore.storiesSubtitle')} color={c.sectionOrange} onSeeAll={() => router.push('/explore/stories')} />
            <AutoScrollCards
              data={stories}
              keyExtractor={(item: any) => item?.id ?? ''}
              renderItem={(item: any) => (
                <View style={[styles.card, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
                  {/* Top stripe */}
                  <LinearGradient colors={[c.sectionOrange, c.sectionOrange + '80'] as const} style={styles.cardStripe} />
                  <View style={styles.cardBody}>
                    {/* Year + exam type badge */}
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: spacing.sm }}>
                      {item?.year ? (
                        <View style={[styles.tagBadge, { backgroundColor: c.sectionOrange + '20' }]}>
                          <Text style={[styles.tagText, { color: c.sectionOrange }]}>{item.year}</Text>
                        </View>
                      ) : null}
                      {item?.examType ? (
                        <View style={[styles.tagBadge, { backgroundColor: c.sectionOrange + '20' }]}>
                          <Text style={[styles.tagText, { color: c.sectionOrange }]}>{item.examType}</Text>
                        </View>
                      ) : null}
                      {item?.achievement ? (
                        <View style={[styles.achieveBadge, { backgroundColor: c.sectionOrange }]}>
                          <MaterialCommunityIcons name="star" size={10} color="#FFF" />
                          <Text style={styles.achieveBadgeText}>{item.achievement}</Text>
                        </View>
                      ) : null}
                    </View>
                    {/* Avatar + Name */}
                    <View style={styles.storyAvatarRow}>
                      <View style={[styles.storyAvatar, { backgroundColor: c.sectionOrange + '20' }]}>
                        <Text style={[styles.storyAvatarText, { color: c.sectionOrange }]}>
                          {(item?.studentName ?? 'U')[0]?.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.storyStudentName, { color: c.textHeading }]}>{item?.studentName ?? ''}</Text>
                    {/* Score */}
                    {item?.score ? (
                      <View style={[styles.scoreBadge, { backgroundColor: c.sectionOrange + '15' }]}>
                        <Text style={[styles.scoreText, { color: c.sectionOrange }]}>⭐ {item.score}</Text>
                      </View>
                    ) : null}
                    {/* Description */}
                    <Text style={[styles.storyDesc, { color: c.textMuted }]} numberOfLines={3}>{item?.description ?? ''}</Text>
                  </View>
                </View>
              )}
            />
          </View>
        )}

        {/* ═══ 6. BLOQ ═══ */}
        {(blogs?.length ?? 0) > 0 && (
          <View style={styles.section}>
            <SectionHeader icon="post-outline" title={t('explore.latestBlogs')} subtitle={t('explore.blogsSubtitle')} color={c.sectionCyan} onSeeAll={() => router.push('/explore/blogs')} />
            {(blogs ?? []).slice(0, 5).map((b: any) => (
              <Pressable key={b?.id} onPress={() => router.push(`/explore/blog/${b?.slug}`)} style={[styles.blogCard, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
                {/* Category badges */}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: spacing.sm }}>
                  {b?.category ? (
                    <View style={[styles.tagBadge, { backgroundColor: c.sectionCyan + '20' }]}>
                      <Text style={[styles.tagText, { color: c.sectionCyan }]}>{b.category}</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={[styles.blogTitle, { color: c.textHeading }]}>{b?.title ?? ''}</Text>
                <Text style={[styles.blogExcerpt, { color: c.textBody }]} numberOfLines={2}>{b?.excerpt ?? ''}</Text>
                <View style={styles.blogFooter}>
                  <View style={styles.statItem}>
                    <MaterialCommunityIcons name="calendar" size={12} color={c.textMuted} />
                    <Text style={[styles.statText, { color: c.textMuted }]}>{b?.date ?? ''}</Text>
                  </View>
                  <View style={styles.statItem}>
                    <MaterialCommunityIcons name="clock-outline" size={12} color={c.textMuted} />
                    <Text style={[styles.statText, { color: c.textMuted }]}>{b?.readMinutes ?? 0} dəq</Text>
                  </View>
                  {(b?.viewCount ?? 0) > 0 && (
                    <View style={styles.statItem}>
                      <MaterialCommunityIcons name="eye-outline" size={12} color={c.textMuted} />
                      <Text style={[styles.statText, { color: c.textMuted }]}>{b.viewCount}</Text>
                    </View>
                  )}
                  <Text style={[styles.blogReadLink, { color: c.sectionCyan }]}>Oxu →</Text>
                </View>
              </Pressable>
            ))}
          </View>
        )}

        {(courses?.length ?? 0) === 0 && (blogs?.length ?? 0) === 0 && (teachers?.length ?? 0) === 0 && (
          <EmptyState icon="compass-outline" message={t('common.noData')} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },


  section: { marginTop: spacing.lg },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  sectionHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
  sectionIcon: { width: 40, height: 40, borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { fontSize: 18, fontWeight: '700' },
  sectionSubtitle: { fontSize: 12, marginTop: 1 },
  seeAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  seeAllText: { fontSize: 13, fontWeight: '600' },

  /* ─── Universal card ─── */
  card: { width: CARD_WIDTH, marginRight: CARD_GAP, borderRadius: borderRadius.lg, borderWidth: 1, overflow: 'hidden' },
  cardStripe: { height: 5, borderTopLeftRadius: borderRadius.lg, borderTopRightRadius: borderRadius.lg },
  cardBody: { padding: spacing.md },
  cardIconBox: { width: 44, height: 44, borderRadius: borderRadius.sm, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  cardTitle: { fontSize: 15, fontWeight: '600', marginBottom: 4 },
  cardDesc: { fontSize: 12, lineHeight: 16, marginBottom: 6 },

  /* Price */
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  oldPrice: { fontSize: 12, textDecorationLine: 'line-through' },
  price: { fontSize: 16, fontWeight: '700', marginBottom: 4 },

  /* Discount badge */
  discountBadge: { position: 'absolute', top: 12, right: 8, paddingHorizontal: 8, paddingVertical: 3, borderRadius: borderRadius.full, zIndex: 10 },
  discountBadgeText: { color: '#FFF', fontSize: 11, fontWeight: '700' },

  /* Tags */
  tagBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: borderRadius.full },
  tagText: { fontSize: 11, fontWeight: '600' },

  /* Stats */
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  statText: { fontSize: 11 },



  /* Teacher */
  teacherGradientTop: { height: 70, alignItems: 'center', justifyContent: 'flex-end' },
  teacherAvatarCircle: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', borderWidth: 2, marginBottom: -28 },
  teacherInfo: { alignItems: 'center', paddingTop: 32, paddingBottom: spacing.md, paddingHorizontal: spacing.sm },
  teacherName: { fontSize: 14, fontWeight: '600', textAlign: 'center' },
  teacherSubject: { fontSize: 12, fontWeight: '500', textAlign: 'center', marginTop: 2 },

  /* Success stories */
  achieveBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3, borderRadius: borderRadius.full, gap: 3 },
  achieveBadgeText: { fontSize: 10, fontWeight: '700', color: '#FFF' },
  storyAvatarRow: { alignItems: 'center', marginVertical: spacing.xs },
  storyAvatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  storyAvatarText: { fontSize: 20, fontWeight: '700' },
  storyStudentName: { fontSize: 14, fontWeight: '600', textAlign: 'center' },
  scoreBadge: { alignSelf: 'center', paddingHorizontal: 12, paddingVertical: 3, borderRadius: borderRadius.full, marginTop: 4 },
  scoreText: { fontSize: 13, fontWeight: '700' },
  storyDesc: { fontSize: 12, textAlign: 'center', marginTop: 4, lineHeight: 16 },

  /* Blog */
  blogCard: { marginHorizontal: spacing.lg, marginBottom: spacing.md, borderRadius: borderRadius.lg, padding: spacing.md, borderWidth: 1 },
  blogTitle: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  blogExcerpt: { fontSize: 13, marginBottom: spacing.sm, lineHeight: 18 },
  blogFooter: { flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
  blogReadLink: { fontSize: 12, fontWeight: '600', marginLeft: 'auto' },
});
