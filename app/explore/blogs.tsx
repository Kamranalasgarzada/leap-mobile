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

const TOPICS = ['Təhsil','Texnologiya','IELTS','SAT','Elm','Məsləhət','Karyera','Motivasiya','Universitetlər','DİM'];

export default function AllBlogsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const c = useAppColors();
  const [loading, setLoading] = useState(true);
  const [blogs, setBlogs] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [topicFilter, setTopicFilter] = useState<string | null>(null);

  useFocusEffect(useCallback(() => {
    (async () => {
      setLoading(true);
      try { const res = await api.publicGetBlogs(1, 100); setBlogs(res?.posts ?? []); } catch {} finally { setLoading(false); }
    })();
  }, []));

  const dynamicTopics = useMemo(() => {
    const fromData = [...new Set((blogs ?? []).map(b => b?.category).filter(Boolean))];
    return [...new Set([...fromData, ...TOPICS])];
  }, [blogs]);

  const filtered = (blogs ?? []).filter(b => {
    const q = search.toLowerCase();
    const matchSearch = !q || (b?.title ?? '').toLowerCase().includes(q) || (b?.excerpt ?? '').toLowerCase().includes(q);
    const matchTopic = !topicFilter || (b?.category ?? '') === topicFilter || (b?.title ?? '').toLowerCase().includes(topicFilter.toLowerCase());
    return matchSearch && matchTopic;
  });

  if (loading) return <LoadingScreen />;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.background }]} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={c.textHeading} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: c.textHeading }]}>{t('explore.latestBlogs')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={[styles.searchBox, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
        <MaterialCommunityIcons name="magnify" size={20} color={c.textMuted} />
        <TextInput style={[styles.searchInput, { color: c.textBody }]} placeholder={t('common.search')} placeholderTextColor={c.textMuted} value={search} onChangeText={setSearch} />
      </View>

      <FilterDropdownRow
        dropdowns={[
          { label: 'Mövzu seçin', value: topicFilter, options: dynamicTopics, allLabel: 'Bütün mövzular', onSelect: setTopicFilter },
        ]}
        accentColor={c.sectionCyan} cardBg={c.card} cardBorder={c.cardBorder} textColor={c.textBody} mutedColor={c.textMuted} background={c.background}
      />

      <FlatList
        data={filtered}
        keyExtractor={item => item?.id ?? ''}
        contentContainerStyle={{ padding: spacing.md, paddingBottom: 40 }}
        ListEmptyComponent={<EmptyState icon="post-outline" message={t('explore.noBlogs')} />}
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push(`/explore/blog/${item?.slug}`)} style={[styles.listCard, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
            <View style={{ flex: 1 }}>
              {item?.category ? (
                <View style={[styles.badge, { backgroundColor: c.sectionCyan + '20', alignSelf: 'flex-start', marginBottom: 6 }]}>
                  <Text style={{ fontSize: 11, fontWeight: '600', color: c.sectionCyan }}>{item.category}</Text>
                </View>
              ) : null}
              <Text style={[styles.cardTitle, { color: c.textHeading }]}>{item?.title ?? ''}</Text>
              {item?.excerpt ? <Text style={[styles.cardDesc, { color: c.textMuted }]} numberOfLines={2}>{item.excerpt}</Text> : null}
              <View style={styles.statsRow}>
                {item?.publishedAt ? (
                  <View style={styles.stat}>
                    <MaterialCommunityIcons name="calendar" size={13} color={c.textMuted} />
                    <Text style={[styles.statText, { color: c.textMuted }]}>{new Date(item.publishedAt).toLocaleDateString()}</Text>
                  </View>
                ) : null}
                {item?.readMinutes ? (
                  <View style={styles.stat}>
                    <MaterialCommunityIcons name="clock-outline" size={13} color={c.textMuted} />
                    <Text style={[styles.statText, { color: c.textMuted }]}>{item.readMinutes} {t('common.minutes')}</Text>
                  </View>
                ) : null}
                <Text style={{ fontSize: 12, fontWeight: '600', color: c.sectionCyan, marginLeft: 'auto' }}>Oxu →</Text>
              </View>
            </View>
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
  listCard: { padding: spacing.md, borderRadius: borderRadius.lg, borderWidth: 1, marginBottom: spacing.sm },
  cardTitle: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  cardDesc: { fontSize: 13, lineHeight: 18, marginBottom: 6 },
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { fontSize: 12 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
});
