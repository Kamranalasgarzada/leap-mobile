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

export default function AllStudyGroupsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const c = useAppColors();
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState<string | null>(null);
  const [gradeFilter, setGradeFilter] = useState<string | null>(null);

  useFocusEffect(useCallback(() => {
    (async () => {
      setLoading(true);
      try { const res = await api.getStudyGroups(); setGroups(res?.groups ?? []); } catch {} finally { setLoading(false); }
    })();
  }, []));

  const dynamicSubjects = useMemo(() => {
    return [...new Set((groups ?? []).map(g => g?.category).filter(Boolean))];
  }, [groups]);

  const filtered = (groups ?? []).filter(g => {
    const q = search.toLowerCase();
    const text = ((g?.name ?? '') + ' ' + (g?.category ?? '')).toLowerCase();
    return (!q || text.includes(q)) && (!subjectFilter || (g?.category ?? '') === subjectFilter) && (!gradeFilter || (g?.name ?? '').toLowerCase().includes(gradeFilter.toLowerCase()));
  });

  if (loading) return <LoadingScreen />;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.background }]} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={c.textHeading} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: c.textHeading }]}>{t('explore.studyGroups')}</Text>
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
        accentColor={c.sectionBlue} cardBg={c.card} cardBorder={c.cardBorder} textColor={c.textBody} mutedColor={c.textMuted} background={c.background}
      />

      <FlatList
        data={filtered}
        keyExtractor={item => item?.id ?? ''}
        contentContainerStyle={{ padding: spacing.md, paddingBottom: 40 }}
        ListEmptyComponent={<EmptyState icon="account-group" message={t('explore.noGroups')} />}
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push(`/study-group/${item?.id}`)} style={[styles.listCard, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
            <View style={[styles.iconBox, { backgroundColor: c.sectionBlue + '15' }]}>
              <MaterialCommunityIcons name="account-group" size={28} color={c.sectionBlue} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, { color: c.textHeading }]} numberOfLines={2}>{item?.name ?? ''}</Text>
              {item?.category ? (
                <View style={[styles.badge, { backgroundColor: c.sectionBlue + '20', alignSelf: 'flex-start', marginBottom: 4 }]}>
                  <Text style={{ fontSize: 11, fontWeight: '600', color: c.sectionBlue }}>{item.category}</Text>
                </View>
              ) : null}
              <View style={styles.statsRow}>
                <View style={styles.stat}>
                  <MaterialCommunityIcons name="account-multiple" size={14} color={c.textMuted} />
                  <Text style={[styles.statText, { color: c.textMuted }]}>{item?.memberCount ?? 0} üzv</Text>
                </View>
                {item?.moderator ? (
                  <View style={styles.stat}>
                    <MaterialCommunityIcons name="shield-account" size={14} color={c.textMuted} />
                    <Text style={[styles.statText, { color: c.textMuted }]}>{item.moderator}</Text>
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
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4 },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { fontSize: 12 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
});
