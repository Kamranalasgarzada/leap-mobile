import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, TextInput, FlatList, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useFocusEffect, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { api } from '../../src/services/api';
import { spacing, borderRadius } from '../../src/theme';
import { useAppColors } from '../../src/hooks/useAppColors';
import { LoadingScreen } from '../../src/components/LoadingScreen';
import { EmptyState } from '../../src/components/EmptyState';
import { FilterDropdownRow } from '../../src/components/FilterDropdownRow';

export default function AllTeachersScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const c = useAppColors();
  const [loading, setLoading] = useState(true);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState<string | null>(null);

  useFocusEffect(useCallback(() => {
    (async () => {
      setLoading(true);
      try { const res = await api.publicGetTeachers(); setTeachers(res?.teachers ?? []); } catch {} finally { setLoading(false); }
    })();
  }, []));

  const dynamicSubjects = useMemo(() => {
    return [...new Set((teachers ?? []).map(t2 => t2?.subject).filter(Boolean))];
  }, [teachers]);

  const filtered = (teachers ?? []).filter(t2 => {
    const q = search.toLowerCase();
    const matchSearch = !q || (t2?.name ?? '').toLowerCase().includes(q) || (t2?.subject ?? '').toLowerCase().includes(q) || (t2?.specialization ?? '').toLowerCase().includes(q);
    return matchSearch && (!subjectFilter || (t2?.subject ?? '') === subjectFilter);
  });

  if (loading) return <LoadingScreen />;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.background }]} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={c.textHeading} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: c.textHeading }]}>{t('explore.ourTeachers')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={[styles.searchBox, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
        <MaterialCommunityIcons name="magnify" size={20} color={c.textMuted} />
        <TextInput style={[styles.searchInput, { color: c.textBody }]} placeholder={t('common.search')} placeholderTextColor={c.textMuted} value={search} onChangeText={setSearch} />
      </View>

      <FilterDropdownRow
        dropdowns={[
          { label: 'Fənn seçin', value: subjectFilter, options: dynamicSubjects, allLabel: 'Bütün fənlər', onSelect: setSubjectFilter },
        ]}
        accentColor={c.sectionPink} cardBg={c.card} cardBorder={c.cardBorder} textColor={c.textBody} mutedColor={c.textMuted} background={c.background}
      />

      <FlatList
        data={filtered}
        keyExtractor={item => item?.id ?? ''}
        contentContainerStyle={{ padding: spacing.md, paddingBottom: 40 }}
        ListEmptyComponent={<EmptyState icon="account-tie" message={t('explore.noTeachers')} />}
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push(`/explore/teacher/${item?.id}`)} style={[styles.listCard, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
            <View style={[styles.avatarBox, { backgroundColor: c.sectionPink + '15' }]}>
              {item?.photoUrl ? (
                <Image source={{ uri: item.photoUrl }} style={{ width: 56, height: 56, borderRadius: 28 }} contentFit="cover" />
              ) : (
                <MaterialCommunityIcons name="account" size={32} color={c.sectionPink} />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, { color: c.textHeading }]}>{item?.name ?? ''}</Text>
              {item?.subject ? <Text style={{ fontSize: 13, fontWeight: '500', color: c.sectionPink, marginBottom: 2 }}>{item.subject}</Text> : null}
              {item?.bio ? <Text style={[styles.cardDesc, { color: c.textMuted }]} numberOfLines={2}>{item.bio}</Text> : null}
              <View style={styles.statsRow}>
                {item?.experienceYears ? (
                  <View style={styles.stat}>
                    <MaterialCommunityIcons name="briefcase-outline" size={13} color={c.textMuted} />
                    <Text style={[styles.statText, { color: c.textMuted }]}>{item.experienceYears} il</Text>
                  </View>
                ) : null}
                {item?.education ? (
                  <View style={styles.stat}>
                    <MaterialCommunityIcons name="school" size={13} color={c.textMuted} />
                    <Text style={[styles.statText, { color: c.textMuted }]}>{item.education}</Text>
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
  avatarBox: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' as const },
  cardTitle: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  cardDesc: { fontSize: 12, lineHeight: 16, marginBottom: 4 },
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4 },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { fontSize: 12 },
});
