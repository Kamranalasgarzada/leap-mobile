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

const SPECIALIZATIONS = ['IELTS','SAT','DİM','TOEFL','Olimpiada','MİQ','Magistratura','Buraxılış'];

export default function AllStoriesScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const c = useAppColors();
  const [loading, setLoading] = useState(true);
  const [stories, setStories] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [specFilter, setSpecFilter] = useState<string | null>(null);

  useFocusEffect(useCallback(() => {
    (async () => {
      setLoading(true);
      try { const res = await api.publicGetSuccessStories(); setStories(res?.stories ?? []); } catch {} finally { setLoading(false); }
    })();
  }, []));

  const dynamicSpecs = useMemo(() => {
    const fromData = [...new Set((stories ?? []).map(s => s?.category).filter(Boolean))];
    const fromAchievements = [...new Set((stories ?? []).map(s => s?.achievement).filter(Boolean))];
    return [...new Set([...SPECIALIZATIONS, ...fromData, ...fromAchievements])];
  }, [stories]);

  const filtered = (stories ?? []).filter(s => {
    const q = search.toLowerCase();
    const text = ((s?.studentName ?? '') + ' ' + (s?.achievement ?? '') + ' ' + (s?.description ?? '') + ' ' + (s?.category ?? '')).toLowerCase();
    const matchSearch = !q || text.includes(q);
    const matchSpec = !specFilter || (s?.category ?? '').toLowerCase() === specFilter.toLowerCase() || (s?.achievement ?? '').toLowerCase().includes(specFilter.toLowerCase());
    return matchSearch && matchSpec;
  });

  if (loading) return <LoadingScreen />;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.background }]} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={c.textHeading} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: c.textHeading }]}>{t('explore.successStories')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={[styles.searchBox, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
        <MaterialCommunityIcons name="magnify" size={20} color={c.textMuted} />
        <TextInput style={[styles.searchInput, { color: c.textBody }]} placeholder={t('common.search')} placeholderTextColor={c.textMuted} value={search} onChangeText={setSearch} />
      </View>

      <FilterDropdownRow
        dropdowns={[
          { label: 'İxtisas seçin', value: specFilter, options: dynamicSpecs, allLabel: 'Bütün ixtisaslar', onSelect: setSpecFilter },
        ]}
        accentColor={c.sectionOrange} cardBg={c.card} cardBorder={c.cardBorder} textColor={c.textBody} mutedColor={c.textMuted} background={c.background}
      />

      <FlatList
        data={filtered}
        keyExtractor={item => item?.id ?? ''}
        contentContainerStyle={{ padding: spacing.md, paddingBottom: 40 }}
        ListEmptyComponent={<EmptyState icon="star-circle" message={t('explore.noStories')} />}
        renderItem={({ item }) => (
          <View style={[styles.listCard, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
            <View style={[styles.avatarBox, { backgroundColor: c.sectionOrange + '20' }]}>
              <Text style={{ fontSize: 22, fontWeight: '700', color: c.sectionOrange }}>{(item?.studentName ?? 'U')[0]?.toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, { color: c.textHeading }]}>{item?.studentName ?? ''}</Text>
              <View style={styles.tagsRow}>
                {item?.year ? (
                  <View style={[styles.badge, { backgroundColor: c.sectionOrange + '20' }]}>
                    <Text style={{ fontSize: 11, fontWeight: '600', color: c.sectionOrange }}>{item.year}</Text>
                  </View>
                ) : null}
                {item?.achievement ? (
                  <View style={[styles.badge, { backgroundColor: c.sectionOrange }]}>
                    <MaterialCommunityIcons name="star" size={10} color="#FFF" />
                    <Text style={{ fontSize: 10, fontWeight: '700', color: '#FFF', marginLeft: 2 }}>{item.achievement}</Text>
                  </View>
                ) : null}
                {item?.score ? (
                  <View style={[styles.badge, { backgroundColor: c.sectionOrange + '15' }]}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: c.sectionOrange }}>⭐ {item.score}</Text>
                  </View>
                ) : null}
              </View>
              {item?.description ? <Text style={[styles.cardDesc, { color: c.textMuted }]} numberOfLines={3}>{item.description}</Text> : null}
            </View>
          </View>
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
  listCard: { flexDirection: 'row', alignItems: 'flex-start', padding: spacing.md, borderRadius: borderRadius.lg, borderWidth: 1, marginBottom: spacing.sm, gap: spacing.md },
  avatarBox: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 15, fontWeight: '600', marginBottom: 4 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 4 },
  badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  cardDesc: { fontSize: 12, lineHeight: 16 },
});
