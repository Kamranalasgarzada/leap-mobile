import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useFocusEffect, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '../../src/services/api';
import { useAppColors } from '../../src/hooks/useAppColors';
import { spacing, borderRadius } from '../../src/theme';
import { Card } from '../../src/components/Card';
import { LoadingScreen } from '../../src/components/LoadingScreen';
import { EmptyState } from '../../src/components/EmptyState';

export default function TeacherStudyGroupsScreen() {
  const { t } = useTranslation();
  const c = useAppColors();
  const router = useRouter();
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchGroups = useCallback(async () => {
    try {
      const d = await api.teacherGetStudyGroups();
      setGroups(d?.groups ?? []);
    } catch {} finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchGroups(); }, [fetchGroups]));

  if (loading) return <LoadingScreen />;

  const groupColors: readonly [string, string][] = [
    [c.sectionBlue, '#60A5FA'],
    [c.sectionGreen, '#34D399'],
    [c.sectionPink, '#F472B6'],
    [c.sectionPurple, '#8B5CF6'],
    [c.sectionOrange, '#FBBF24'],
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.background }]} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: spacing.xxl }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchGroups(); }} tintColor={c.primary} />}
      >
        <View style={styles.headerRow}>
          <Text style={[styles.pageTitle, { color: c.textHeading }]}>{t('teacher.studyGroups')}</Text>
          <View style={[styles.moderatorBadge, { backgroundColor: c.primary + '15' }]}>
            <MaterialCommunityIcons name="shield-check" size={14} color={c.primary} />
            <Text style={[styles.moderatorText, { color: c.primary }]}>{t('teacher.moderator')}</Text>
          </View>
        </View>

        {(groups?.length ?? 0) === 0 ? (
          <EmptyState icon="message-text" message={t('teacher.noGroups')} />
        ) : (
          groups.map((g: any, idx: number) => {
            const gc = groupColors[idx % groupColors.length];
            return (
              <Pressable key={g?.id ?? idx} onPress={() => router.push(`/study-group/${g?.id}`)} style={styles.groupCard}>
                <LinearGradient colors={gc as readonly [string, string]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.groupGradient}>
                  <Text style={styles.groupName} numberOfLines={1}>{g?.name ?? ''}</Text>
                  <View style={styles.groupStatsRow}>
                    <View style={styles.groupStatItem}>
                      <MaterialCommunityIcons name="account-multiple" size={14} color="rgba(255,255,255,0.9)" />
                      <Text style={styles.groupStatText}>{g?.memberCount ?? 0}</Text>
                    </View>
                    <View style={styles.groupStatItem}>
                      <MaterialCommunityIcons name="help-circle" size={14} color="rgba(255,255,255,0.9)" />
                      <Text style={styles.groupStatText}>{g?.questionCount ?? 0}</Text>
                    </View>
                    <View style={styles.groupStatItem}>
                      <MaterialCommunityIcons name="check-circle" size={14} color="rgba(255,255,255,0.9)" />
                      <Text style={styles.groupStatText}>{g?.activeQuestions ?? 0} {t('studyGroup.open')}</Text>
                    </View>
                  </View>
                </LinearGradient>
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, paddingBottom: spacing.md },
  pageTitle: { fontSize: 28, fontWeight: '700' },
  moderatorBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: borderRadius.full },
  moderatorText: { fontSize: 12, fontWeight: '600' },
  groupCard: { marginHorizontal: spacing.md, marginBottom: spacing.md, borderRadius: borderRadius.lg, overflow: 'hidden' },
  groupGradient: { padding: spacing.lg },
  groupName: { fontSize: 18, fontWeight: '700', color: '#FFF', marginBottom: spacing.sm },
  groupStatsRow: { flexDirection: 'row', gap: spacing.lg },
  groupStatItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  groupStatText: { fontSize: 13, color: 'rgba(255,255,255,0.9)', fontWeight: '600' },
});
