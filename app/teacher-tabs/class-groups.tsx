import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useFocusEffect, useRouter } from 'expo-router';
import { api } from '../../src/services/api';
import { useAppColors } from '../../src/hooks/useAppColors';
import { spacing, borderRadius } from '../../src/theme';
import { Card } from '../../src/components/Card';
import { LoadingScreen } from '../../src/components/LoadingScreen';
import { EmptyState } from '../../src/components/EmptyState';

export default function TeacherClassGroupsScreen() {
  const { t } = useTranslation();
  const c = useAppColors();
  const router = useRouter();
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchGroups = useCallback(async () => {
    try {
      const d = await api.teacherGetGroups();
      setGroups(d?.groups ?? []);
    } catch {} finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchGroups(); }, [fetchGroups]));

  if (loading) return <LoadingScreen />;

  const groupColors = [c.primary, c.sectionBlue, c.sectionGreen, c.accent, c.sectionOrange, c.sectionCyan];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.background }]} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: spacing.xxl }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchGroups(); }} tintColor={c.primary} />}
      >
        <Text style={[styles.pageTitle, { color: c.textHeading }]}>{t('teacher.classGroups')}</Text>

        {(groups?.length ?? 0) === 0 ? (
          <EmptyState icon="school" message={t('teacher.noGroups')} />
        ) : (
          <View style={{ paddingHorizontal: spacing.md }}>
            {groups.map((g: any, idx: number) => {
              const gc = groupColors[idx % groupColors.length];
              return (
                <Pressable key={g?.id} onPress={() => router.push(`/group/${g?.id}`)}>
                  <Card style={{ marginBottom: spacing.sm }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View style={[styles.groupDot, { backgroundColor: gc, width: 12, height: 12, borderRadius: 6 }]} />
                      <View style={{ flex: 1, marginLeft: spacing.md }}>
                        <Text style={[styles.groupChipName, { color: c.textHeading }]} numberOfLines={1}>{g?.name ?? ''}</Text>
                        <Text style={[styles.groupChipMeta, { color: c.textMuted }]}>
                          {g?.courseName ?? ''} · {g?.studentCount ?? 0} {t('common.students')}
                        </Text>
                      </View>
                      <MaterialCommunityIcons name="chevron-right" size={22} color={c.textMuted} />
                    </View>
                  </Card>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  pageTitle: { fontSize: 28, fontWeight: '700', padding: spacing.lg, paddingBottom: spacing.md },
  groupChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.lg, borderWidth: 1, marginRight: spacing.sm, gap: spacing.sm, minWidth: 140 },
  groupDot: { width: 10, height: 10, borderRadius: 5 },
  groupChipName: { fontSize: 14, fontWeight: '600' },
  groupChipMeta: { fontSize: 11, marginTop: 1 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: spacing.md },
  studentCard: { marginBottom: spacing.sm },
  studentRow: { flexDirection: 'row', alignItems: 'center' },
  studentAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  studentAvatarText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  studentName: { fontSize: 15, fontWeight: '600' },
  studentEmail: { fontSize: 12, marginTop: 1 },
});
