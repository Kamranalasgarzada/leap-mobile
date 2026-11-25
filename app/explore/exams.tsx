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
const SUBJECTS = ['Riyaziyyat','Fizika','Kimya','Biologiya','İngilis dili','Azərbaycan dili','Tarix','Coğrafiya','İnformatika','Ədəbiyyat'];

export default function AllExamsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const c = useAppColors();
  const [loading, setLoading] = useState(true);
  const [exams, setExams] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [gradeFilter, setGradeFilter] = useState<string | null>(null);
  const [subjectFilter, setSubjectFilter] = useState<string | null>(null);

  useFocusEffect(useCallback(() => {
    (async () => {
      setLoading(true);
      try { const res = await api.publicGetExams(); setExams(res?.exams ?? []); } catch {} finally { setLoading(false); }
    })();
  }, []));

  const dynamicGrades = useMemo(() => {
    const g = [...new Set((exams ?? []).map(e => e?.grade).filter(Boolean))];
    return g.length > 0 ? g : GRADES;
  }, [exams]);

  const dynamicSubjects = useMemo(() => {
    const cats = [...new Set((exams ?? []).map(e => e?.category).filter(Boolean))];
    return cats.length > 0 ? cats : SUBJECTS;
  }, [exams]);

  const filtered = (exams ?? []).filter(e => {
    const q = search.toLowerCase();
    const matchSearch = !q || (e?.title ?? '').toLowerCase().includes(q) || (e?.courseName ?? '').toLowerCase().includes(q);
    const matchGrade = !gradeFilter || (e?.grade ?? '') === gradeFilter;
    const matchSubject = !subjectFilter || (e?.category ?? '') === subjectFilter || (e?.courseName ?? '').toLowerCase().includes(subjectFilter.toLowerCase());
    return matchSearch && matchGrade && matchSubject;
  });

  if (loading) return <LoadingScreen />;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.background }]} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={c.textHeading} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: c.textHeading }]}>{t('explore.publicExams')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={[styles.searchBox, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
        <MaterialCommunityIcons name="magnify" size={20} color={c.textMuted} />
        <TextInput style={[styles.searchInput, { color: c.textBody }]} placeholder={t('common.search')} placeholderTextColor={c.textMuted} value={search} onChangeText={setSearch} />
      </View>

      <FilterDropdownRow
        dropdowns={[
          { label: 'Fənn seçin', value: subjectFilter, options: dynamicSubjects, allLabel: 'Bütün fənlər', onSelect: setSubjectFilter },
          { label: 'Sinif seçin', value: gradeFilter, options: dynamicGrades, allLabel: 'Bütün siniflər', onSelect: setGradeFilter },
        ]}
        accentColor={c.sectionGreen} cardBg={c.card} cardBorder={c.cardBorder} textColor={c.textBody} mutedColor={c.textMuted} background={c.background}
      />

      <FlatList
        data={filtered}
        keyExtractor={item => item?.id ?? ''}
        contentContainerStyle={{ padding: spacing.md, paddingBottom: 40 }}
        ListEmptyComponent={<EmptyState icon="clipboard-text-outline" message={t('explore.noExams')} />}
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push(`/exam/${item?.id}`)} style={[styles.listCard, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
            <View style={[styles.iconBox, { backgroundColor: c.sectionGreen + '15' }]}>
              <MaterialCommunityIcons name="clipboard-text-outline" size={28} color={c.sectionGreen} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, { color: c.textHeading }]} numberOfLines={2}>{item?.title ?? ''}</Text>
              {item?.courseName ? <Text style={[styles.cardDesc, { color: c.textMuted }]}>{item.courseName}</Text> : null}
              <View style={styles.statsRow}>
                {item?.duration ? (
                  <View style={styles.stat}>
                    <MaterialCommunityIcons name="clock-outline" size={14} color={c.textMuted} />
                    <Text style={[styles.statText, { color: c.textMuted }]}>{item.duration} {t('common.minutes')}</Text>
                  </View>
                ) : null}
                {item?.grade ? (
                  <View style={[styles.badge, { backgroundColor: c.sectionGreen + '20' }]}>
                    <Text style={{ fontSize: 11, fontWeight: '600', color: c.sectionGreen }}>{item.grade}</Text>
                  </View>
                ) : null}
              </View>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={22} color={c.textMuted} />
          </Pressable>
        )}
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
  cardDesc: { fontSize: 12, color: '#888', marginBottom: 4 },
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { fontSize: 12 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
});
