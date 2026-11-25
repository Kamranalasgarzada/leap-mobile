import React, { useState, useCallback, useRef } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Linking, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { Video, ResizeMode } from 'expo-av';
import { api } from '../../../src/services/api';
import { spacing, borderRadius } from '../../../src/theme';
import { useAppColors } from '../../../src/hooks/useAppColors';
import { LoadingScreen } from '../../../src/components/LoadingScreen';
import { Image } from 'expo-image';

export default function TeacherProfileScreen() {
  const { teacherId = '' } = useLocalSearchParams<{ teacherId: string }>();
  const router = useRouter();
  const c = useAppColors();
  const [loading, setLoading] = useState(true);
  const [teacher, setTeacher] = useState<any>(null);
  const [error, setError] = useState(false);

  useFocusEffect(useCallback(() => {
    if (!teacherId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(false);
      try {
        const res = await api.publicGetTeacherProfile(teacherId);
        if (!cancelled) setTeacher(res?.teacher ?? null);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [teacherId]));

  if (loading) return <LoadingScreen />;

  if (error || !teacher) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: c.background }]} edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={c.textHeading} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: c.textHeading }]}>Müəllim</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl }}>
          <MaterialCommunityIcons name="account-alert" size={64} color={c.textMuted} />
          <Text style={{ fontSize: 16, color: c.textMuted, marginTop: spacing.md, textAlign: 'center' }}>Müəllim profili tapılmadı</Text>
        </View>
      </SafeAreaView>
    );
  }

  const socialLinks = parseSocialLinks(teacher?.socialLinks);
  const teachingAreas = parseJsonArray(teacher?.teachingAreas);
  const studentResults = parseJsonArray(teacher?.studentResults);
  const courses = teacher?.courses ?? [];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.background }]} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={c.textHeading} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: c.textHeading }]} numberOfLines={1}>Müəllim profili</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.md, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        {/* Hero Card */}
        <View style={[styles.heroCard, { backgroundColor: c.card, borderColor: c.cardBorder }]}> 
          <View style={[styles.avatarLg, { backgroundColor: c.sectionPink + '18' }]}>
            {teacher?.photoUrl ? (
              <Image source={{ uri: teacher.photoUrl }} style={{ width: 80, height: 80, borderRadius: 40 }} contentFit="cover" />
            ) : (
              <MaterialCommunityIcons name="account" size={48} color={c.sectionPink} />
            )}
          </View>
          <Text style={[styles.nameText, { color: c.textHeading }]}>{teacher?.name ?? ''}</Text>
          {teacher?.subject ? <Text style={[styles.subjectText, { color: c.sectionPink }]}>{teacher.subject}</Text> : null}
          {teacher?.specialization ? <Text style={[styles.specText, { color: c.textMuted }]}>{teacher.specialization}</Text> : null}

          {/* Quick stats */}
          <View style={styles.quickStats}>
            {teacher?.experienceYears ? (
              <View style={[styles.statBadge, { backgroundColor: c.primary + '15' }]}>
                <MaterialCommunityIcons name="briefcase-outline" size={16} color={c.primary} />
                <Text style={[styles.statBadgeText, { color: c.primary }]}>{teacher.experienceYears} il təcrübə</Text>
              </View>
            ) : null}
            {teacher?.education ? (
              <View style={[styles.statBadge, { backgroundColor: c.sectionPink + '15' }]}>
                <MaterialCommunityIcons name="school" size={16} color={c.sectionPink} />
                <Text style={[styles.statBadgeText, { color: c.sectionPink }]}>{teacher.education}</Text>
              </View>
            ) : null}
            {courses?.length > 0 ? (
              <View style={[styles.statBadge, { backgroundColor: c.success + '15' }]}>
                <MaterialCommunityIcons name="book-open-variant" size={16} color={c.success} />
                <Text style={[styles.statBadgeText, { color: c.success }]}>{courses.length} kurs</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Bio */}
        {teacher?.bio ? (
          <View style={[styles.section, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
            <Text style={[styles.sectionTitle, { color: c.textHeading }]}>Haqqında</Text>
            <Text style={[styles.bioText, { color: c.textBody }]}>{teacher.bio}</Text>
          </View>
        ) : null}

        {/* Video */}
        {teacher?.videoUrl ? (
          <View style={[styles.section, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
            <Text style={[styles.sectionTitle, { color: c.textHeading }]}>Video təqdimat</Text>
            {Platform.OS === 'web' ? (
              <video
                src={teacher.videoUrl}
                controls
                style={{ width: '100%', borderRadius: 12, maxHeight: 240, backgroundColor: '#000' } as any}
              />
            ) : (
              <Video
                source={{ uri: teacher.videoUrl }}
                useNativeControls
                resizeMode={ResizeMode.CONTAIN}
                style={{ width: '100%', height: 200, borderRadius: 12, backgroundColor: '#000' }}
              />
            )}
          </View>
        ) : null}

        {/* Teaching Areas */}
        {teachingAreas?.length > 0 ? (
          <View style={[styles.section, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
            <Text style={[styles.sectionTitle, { color: c.textHeading }]}>Tədris sahələri</Text>
            <View style={styles.chipRow}>
              {teachingAreas.map((area: string, i: number) => (
                <View key={i} style={[styles.chip, { backgroundColor: c.primary + '12', borderColor: c.primary + '30' }]}>
                  <Text style={[styles.chipText, { color: c.primary }]}>{area}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* Achievements */}
        {teacher?.achievements ? (
          <View style={[styles.section, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
            <Text style={[styles.sectionTitle, { color: c.textHeading }]}>Nailiyyətlər</Text>
            <Text style={[styles.bioText, { color: c.textBody }]}>{teacher.achievements}</Text>
          </View>
        ) : null}

        {/* Student Results */}
        {studentResults?.length > 0 ? (
          <View style={[styles.section, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
            <Text style={[styles.sectionTitle, { color: c.textHeading }]}>Şagird nəticələri</Text>
            {studentResults.map((result: any, i: number) => {
              const rName = result?.name ?? '';
              const rResult = result?.result ?? '';
              const rPhoto = result?.photoUrl ?? null;
              return (
                <View key={i} style={styles.studentResultCard}>
                  {rPhoto ? (
                    <Image source={{ uri: rPhoto }} style={styles.studentPhoto} contentFit="cover" />
                  ) : (
                    <View style={[styles.studentPhotoPlaceholder, { backgroundColor: c.sectionPink + '15' }]}>
                      <MaterialCommunityIcons name="account" size={24} color={c.sectionPink} />
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    {rName ? <Text style={[styles.studentName, { color: c.textHeading }]}>{rName}</Text> : null}
                    {rResult ? <Text style={[styles.studentResult, { color: c.sectionPink }]}>{rResult}</Text> : null}
                  </View>
                  <MaterialCommunityIcons name="trophy" size={20} color={c.sectionPink} />
                </View>
              );
            })}
          </View>
        ) : null}

        {/* Courses */}
        {courses?.length > 0 ? (
          <View style={[styles.section, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
            <Text style={[styles.sectionTitle, { color: c.textHeading }]}>Kurslar</Text>
            {courses.map((course: any) => (
              <View key={course?.id ?? Math.random()} style={[styles.courseRow, { borderColor: c.cardBorder }]}>
                {course?.imageUrl ? (
                  <Image source={{ uri: course.imageUrl }} style={styles.courseImg} contentFit="cover" />
                ) : (
                  <View style={[styles.courseIcon, { backgroundColor: c.primary + '12' }]}>
                    <MaterialCommunityIcons name="book-open-variant" size={22} color={c.primary} />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={[styles.courseName, { color: c.textHeading }]}>{course?.name ?? ''}</Text>
                  {course?.description ? <Text style={{ fontSize: 12, color: c.textMuted }} numberOfLines={2}>{course.description}</Text> : null}
                </View>
              </View>
            ))}
          </View>
        ) : null}

        {/* Social Links */}
        {socialLinks?.length > 0 ? (
          <View style={[styles.section, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
            <Text style={[styles.sectionTitle, { color: c.textHeading }]}>Sosial şəbəkələr</Text>
            <View style={styles.socialRow}>
              {socialLinks.map((link: { type: string; url: string }, i: number) => {
                const url = normalizeUrl(link?.url);
                return (
                  <Pressable
                    key={i}
                    onPress={() => { if (url) { Linking.openURL(url).catch(() => {}); } }}
                    style={[styles.socialBtn, { backgroundColor: getSocialColor(link?.type) + '15' }]}
                  >
                    <MaterialCommunityIcons name={getSocialIcon(link?.type)} size={22} color={getSocialColor(link?.type)} />
                    <Text style={{ fontSize: 11, color: getSocialColor(link?.type), fontWeight: '600', marginTop: 4 }}>{capitalize(link?.type)}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function parseSocialLinks(data: any): Array<{ type: string; url: string }> {
  if (!data) return [];
  try {
    const parsed = typeof data === 'string' ? JSON.parse(data) : data;
    if (Array.isArray(parsed)) return parsed.filter((l: any) => l?.url);
    if (typeof parsed === 'object') {
      return Object.entries(parsed).filter(([, v]) => !!v).map(([k, v]) => ({ type: k, url: String(v) }));
    }
  } catch {}
  return [];
}

function parseJsonArray(data: any): any[] {
  if (!data) return [];
  try {
    const parsed = typeof data === 'string' ? JSON.parse(data) : data;
    return Array.isArray(parsed) ? parsed : [];
  } catch {}
  return [];
}

function normalizeUrl(url?: string): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  if (trimmed.startsWith('+') || /^\d/.test(trimmed)) return `https://wa.me/${trimmed.replace(/\s/g, '')}`;
  return `https://${trimmed}`;
}

function capitalize(s?: string): string {
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

function getSocialIcon(type?: string): any {
  const t = (type ?? '').toLowerCase();
  if (t.includes('facebook') || t === 'fb') return 'facebook';
  if (t.includes('instagram') || t === 'ig') return 'instagram';
  if (t.includes('youtube') || t === 'yt') return 'youtube';
  if (t.includes('linkedin')) return 'linkedin';
  if (t.includes('twitter') || t === 'x') return 'twitter';
  if (t.includes('telegram') || t === 'tg') return 'send';
  if (t.includes('tiktok')) return 'music-note';
  if (t.includes('whatsapp') || t === 'wa') return 'whatsapp';
  return 'link-variant';
}

function getSocialColor(type?: string): string {
  const t = (type ?? '').toLowerCase();
  if (t.includes('facebook') || t === 'fb') return '#1877F2';
  if (t.includes('instagram') || t === 'ig') return '#E4405F';
  if (t.includes('youtube') || t === 'yt') return '#FF0000';
  if (t.includes('linkedin')) return '#0A66C2';
  if (t.includes('twitter') || t === 'x') return '#1DA1F2';
  if (t.includes('telegram') || t === 'tg') return '#26A5E4';
  if (t.includes('tiktok')) return '#000000';
  if (t.includes('whatsapp') || t === 'wa') return '#25D366';
  return '#7C3AED';
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700', flex: 1, textAlign: 'center' },
  heroCard: { alignItems: 'center', padding: spacing.lg, borderRadius: borderRadius.lg, borderWidth: 1, marginBottom: spacing.md },
  avatarLg: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm, overflow: 'hidden' as const },
  nameText: { fontSize: 22, fontWeight: '700', textAlign: 'center' },
  subjectText: { fontSize: 15, fontWeight: '600', marginTop: 4, textAlign: 'center' },
  specText: { fontSize: 13, marginTop: 2, textAlign: 'center' },
  quickStats: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: spacing.md },
  statBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  statBadgeText: { fontSize: 12, fontWeight: '600' },
  section: { padding: spacing.md, borderRadius: borderRadius.lg, borderWidth: 1, marginBottom: spacing.md },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: spacing.sm },
  bioText: { fontSize: 14, lineHeight: 22, color: '#999' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1 },
  chipText: { fontSize: 12, fontWeight: '600' },
  studentResultCard: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12, paddingBottom: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255,255,255,0.08)' },
  studentPhoto: { width: 48, height: 48, borderRadius: 24, overflow: 'hidden' as const },
  studentPhotoPlaceholder: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  studentName: { fontSize: 14, fontWeight: '600' },
  studentResult: { fontSize: 13, fontWeight: '600', marginTop: 2 },
  courseRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm, borderBottomWidth: 1 },
  courseImg: { width: 44, height: 44, borderRadius: 10, overflow: 'hidden' as const },
  courseIcon: { width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  courseName: { fontSize: 14, fontWeight: '600' },
  socialRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  socialBtn: { width: 60, height: 60, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
});
