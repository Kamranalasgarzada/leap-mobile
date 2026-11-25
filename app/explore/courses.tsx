import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, TextInput, FlatList, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useFocusEffect, useRouter } from 'expo-router';
import { api } from '../../src/services/api';
import { spacing, borderRadius } from '../../src/theme';
import { useAppColors } from '../../src/hooks/useAppColors';
import { LoadingScreen } from '../../src/components/LoadingScreen';
import { EmptyState } from '../../src/components/EmptyState';
import { FilterDropdownRow } from '../../src/components/FilterDropdownRow';

const GRADES = ['1-ci sinif','2-ci sinif','3-cü sinif','4-cü sinif','5-ci sinif','6-cı sinif','7-ci sinif','8-ci sinif','9-cu sinif','10-cu sinif','11-ci sinif'];
const SUBJECTS = ['Riyaziyyat','Fizika','Kimya','Biologiya','İngilis dili','Azərbaycan dili','Tarix','Coğrafiya','İnformatika','Ədəbiyyat','Alman dili','Rus dili','Fransız dili'];

export default function AllCoursesScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const c = useAppColors();
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [gradeFilter, setGradeFilter] = useState<string | null>(null);
  const [subjectFilter, setSubjectFilter] = useState<string | null>(null);

  useFocusEffect(useCallback(() => {
    (async () => {
      setLoading(true);
      try { const res = await api.publicGetCourses(); setCourses(res?.courses ?? []); } catch {} finally { setLoading(false); }
    })();
  }, []));

  const dynamicSubjects = useMemo(() => {
    const names = (courses ?? []).map(c2 => ((c2?.name ?? '') + ' ' + (c2?.description ?? '')).toLowerCase());
    const found = SUBJECTS.filter(s => names.some(n => n.includes(s.toLowerCase())));
    return found.length > 0 ? found : SUBJECTS.slice(0, 8);
  }, [courses]);

  const filtered = (courses ?? []).filter(c2 => {
    const q = search.toLowerCase();
    const text = ((c2?.name ?? '') + ' ' + (c2?.description ?? '')).toLowerCase();
    return (!q || text.includes(q)) && (!gradeFilter || text.includes(gradeFilter.toLowerCase())) && (!subjectFilter || text.includes(subjectFilter.toLowerCase()));
  });

  if (loading) return <LoadingScreen />;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.background }]} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={c.textHeading} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: c.textHeading }]}>{t('explore.featuredCourses')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={[styles.searchBox, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
        <MaterialCommunityIcons name="magnify" size={20} color={c.textMuted} />
        <TextInput style={[styles.searchInput, { color: c.textBody }]} placeholder={t('common.search')} placeholderTextColor={c.textMuted} value={search} onChangeText={setSearch} />
      </View>

      <FilterDropdownRow
        dropdowns={[
          { label: 'Fənn seçin', value: subjectFilter, options: dynamicSubjects, allLabel: 'Bütün fənlər', onSelect: setSubjectFilter },
          { label: 'Sinif seçin', value: gradeFilter, options: GRADES, allLabel: 'Bütün siniflər', onSelect: setGradeFilter },
        ]}
        accentColor={c.sectionPurple} cardBg={c.card} cardBorder={c.cardBorder} textColor={c.textBody} mutedColor={c.textMuted} background={c.background}
      />

      <FlatList
        data={filtered}
        keyExtractor={item => item?.id ?? ''}
        contentContainerStyle={{ padding: spacing.md, paddingBottom: 40 }}
        ListEmptyComponent={<EmptyState icon="book-open-variant" message={t('explore.noCourses')} />}
        renderItem={({ item }) => {
          const hasDiscount = (item?.discountPrice ?? 0) > 0 && (item?.price ?? 0) > 0;
          return (
            <Pressable onPress={() => router.push(`/explore/course/${item?.id}`)} style={[styles.listCard, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
              <View style={[styles.iconBox, { backgroundColor: c.sectionPurple + '15' }]}>
                <MaterialCommunityIcons name="book-open-variant" size={28} color={c.sectionPurple} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: c.textHeading }]} numberOfLines={2}>{item?.name ?? ''}</Text>
                {item?.description ? <Text style={[styles.cardDesc, { color: c.textMuted }]} numberOfLines={2}>{item.description}</Text> : null}
                <View style={styles.statsRow}>
                  <View style={styles.stat}>
                    <MaterialCommunityIcons name="play-circle-outline" size={14} color={c.textMuted} />
                    <Text style={[styles.statText, { color: c.textMuted }]}>{item?.videoCount ?? 0} video</Text>
                  </View>
                  {hasDiscount ? (
                    <View style={styles.stat}>
                      <Text style={{ fontSize: 12, color: c.textMuted, textDecorationLine: 'line-through' }}>{item.price} AZN</Text>
                      <Text style={{ fontSize: 14, fontWeight: '700', color: c.sectionPurple }}>{item.discountPrice} AZN</Text>
                    </View>
                  ) : (item?.price ?? 0) > 0 ? (
                    <Text style={{ fontSize: 14, fontWeight: '700', color: c.sectionPurple }}>{item.price} AZN</Text>
                  ) : (
                    <Text style={{ fontSize: 13, fontWeight: '600', color: c.success }}>{t('explore.free')}</Text>
                  )}
                </View>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={22} color={c.textMuted} />
            </Pressable>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  searchBox: { flexDirection: 'row', alignItems: 'center', marginHorizontal: spacing.md, borderRadius: borderRadius.md, borderWidth: 1, paddingHorizontal: spacing.sm, height: 44, marginBottom: spacing.sm },
  searchInput: { flex: 1, fontSize: 15, marginLeft: spacing.xs },
  listCard: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderRadius: borderRadius.lg, borderWidth: 1, marginBottom: spacing.sm, gap: spacing.md },
  iconBox: { width: 52, height: 52, borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  cardDesc: { fontSize: 12, lineHeight: 16, marginBottom: 4 },
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4 },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { fontSize: 12 },
});
