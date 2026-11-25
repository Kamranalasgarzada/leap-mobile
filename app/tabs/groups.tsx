import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, RefreshControl, Pressable, TextInput, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '../../src/services/api';
import { ScreenContainer } from '../../src/components/ScreenContainer';
import { Card } from '../../src/components/Card';
import { EmptyState } from '../../src/components/EmptyState';
import { LoadingScreen } from '../../src/components/LoadingScreen';
import { FilterDropdownRow } from '../../src/components/FilterDropdownRow';
import { useAppColors } from '../../src/hooks/useAppColors';
import { spacing, borderRadius } from '../../src/theme';
import i18n from '../../src/i18n';

const groupColors: Record<string, string[]> = {
  violet: ['#7C3AED', '#8B5CF6'],
  blue: ['#3B82F6', '#60A5FA'],
  green: ['#10B981', '#34D399'],
  pink: ['#EC4899', '#F472B6'],
  orange: ['#F59E0B', '#FBBF24'],
  cyan: ['#06B6D4', '#22D3EE'],
};

export default function GroupsScreen() {
  const { t } = useTranslation();
  const c = useAppColors();
  const router = useRouter();
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState<string | null>(null);

  const fetchGroups = useCallback(async () => {
    try {
      const res = await api.getStudyGroups(subjectFilter ?? undefined, i18n.language);
      setGroups(res?.groups ?? []);
    } catch (e) {
      console.error('Groups error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [subjectFilter]);

  useFocusEffect(useCallback(() => { fetchGroups(); }, [fetchGroups]));

  const categories = useMemo(() => [...new Set((groups ?? []).map((g: any) => g?.category).filter(Boolean))], [groups]);
  const filtered = useMemo(() => (groups ?? []).filter((g: any) =>
    !search || (g?.name ?? '').toLowerCase().includes(search.toLowerCase())
  ), [groups, search]);

  if (loading) return <LoadingScreen />;

  return (
    <ScreenContainer>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xxl }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchGroups(); }} tintColor={c.primary} />}
      >
        {/* Search */}
        <View style={[styles.searchContainer, { backgroundColor: c.surfaceLight, borderColor: c.inputBorder }]}>
          <MaterialCommunityIcons name="magnify" size={20} color={c.textMuted} />
          <TextInput
            placeholder={t('groups.search')}
            placeholderTextColor={c.textMuted}
            value={search}
            onChangeText={setSearch}
            style={[styles.searchInput, { color: c.textHeading }]}
          />
        </View>

        {/* Dropdown Filters */}
        {categories.length > 0 && (
          <FilterDropdownRow
            dropdowns={[
              {
                label: t('explore.subject'),
                value: subjectFilter,
                options: categories as string[],
                allLabel: t('common.all'),
                onSelect: setSubjectFilter,
              },
            ]}
            accentColor={c.primary}
            cardBg={c.card}
            cardBorder={c.cardBorder}
            textColor={c.textHeading}
            mutedColor={c.textMuted}
            background={c.background}
          />
        )}

        {/* Groups list */}
        {filtered.length === 0 ? (
          <EmptyState icon="account-group" message={t('groups.noGroups')} />
        ) : (
          filtered.map((group: any) => {
            const colors = groupColors[group?.color ?? 'violet'] ?? groupColors.violet;
            return (
              <Pressable
                key={group?.id ?? ''}
                onPress={() => router.push(`/study-group/${group?.id}`)}
                style={({ pressed }) => [styles.groupCard, { backgroundColor: c.card, borderColor: c.cardBorder, opacity: pressed ? 0.95 : 1 }]}
              >
                <LinearGradient
                  colors={colors as [string, string]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.groupColorStrip}
                />
                <View style={styles.groupContent}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.groupName, { color: c.textHeading }]} numberOfLines={1}>
                      {group?.name ?? ''}
                    </Text>
                    {group?.category && (
                      <View style={[styles.categoryBadge, { backgroundColor: colors[0] + '20' }]}>
                        <Text style={[styles.categoryText, { color: colors[0] }]}>{group.category}</Text>
                      </View>
                    )}
                    <View style={styles.groupStats}>
                      <View style={styles.statItem}>
                        <MaterialCommunityIcons name="account-multiple" size={14} color={c.textMuted} />
                        <Text style={[styles.statText, { color: c.textMuted }]}>{group?.memberCount ?? 0} {t('groups.members')}</Text>
                      </View>
                      <View style={styles.statItem}>
                        <MaterialCommunityIcons name="message-text" size={14} color={c.textMuted} />
                        <Text style={[styles.statText, { color: c.textMuted }]}>{group?.questionCount ?? 0} {t('groups.questions')}</Text>
                      </View>
                    </View>
                    {group?.moderatorName ? (
                      <View style={styles.statItem}>
                        <MaterialCommunityIcons name="account-star" size={14} color={c.textMuted} />
                        <Text style={[styles.moderator, { color: c.textMuted }]}>{group.moderatorName}</Text>
                      </View>
                    ) : null}
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={24} color={c.textMuted} />
                </View>
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  searchContainer: { flexDirection: 'row', alignItems: 'center', borderRadius: borderRadius.md, borderWidth: 1, paddingHorizontal: spacing.md, marginBottom: spacing.md },
  searchInput: { flex: 1, paddingVertical: 12, marginLeft: 8, fontSize: 15 },
  groupCard: { borderRadius: borderRadius.lg, borderWidth: 1, marginBottom: spacing.md, overflow: 'hidden' },
  groupColorStrip: { height: 4 },
  groupContent: { padding: spacing.md, flexDirection: 'row', alignItems: 'center' },
  groupName: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  categoryBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12, marginBottom: 8 },
  categoryText: { fontSize: 12, fontWeight: '500' },
  groupStats: { flexDirection: 'row', gap: 16, marginBottom: 4 },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { fontSize: 12 },
  moderator: { fontSize: 12, marginTop: 2 },
});
