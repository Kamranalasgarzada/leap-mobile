import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useFocusEffect, useRouter } from 'expo-router';
import { api } from '../../src/services/api';
import { useAuth } from '../../src/contexts/AuthContext';
import { useAppColors } from '../../src/hooks/useAppColors';
import { spacing, borderRadius } from '../../src/theme';
import { Card } from '../../src/components/Card';
import { LoadingScreen } from '../../src/components/LoadingScreen';

export default function AdminDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const router = useRouter();
  const c = useAppColors();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    api.adminGetDashboard().then(setData).catch(() => {}).finally(() => setLoading(false));
  }, []));

  if (loading) return <LoadingScreen />;

  const stats = data?.stats ?? {};
  const finance = data?.finance ?? {};
  const formatMoney = (v: number | undefined) => `${(v ?? 0).toFixed(0)} ₼`;

  // All cards are clickable navigation cards
  const allCards = [
    { icon: 'school' as const, label: t('admin.totalStudents'), value: stats?.totalStudents ?? 0, color: c.accent, onPress: () => router.push('/admin-tabs/users' as any) },
    { icon: 'cash' as const, label: t('finance.monthlyIncome'), value: formatMoney(finance?.monthlyIncome), color: '#10B981', onPress: () => router.push('/admin-tabs/finance' as any) },
    { icon: 'account-search' as const, label: t('admin.activeLeads'), value: data?.recentLeads?.length ?? 0, color: '#8B5CF6', onPress: () => router.push('/admin-tabs/users' as any) },
    { icon: 'clock-alert-outline' as const, label: t('admin.pendingPayments'), value: formatMoney(finance?.pendingPayments), color: '#F59E0B', onPress: () => router.push('/admin-tabs/finance' as any) },
    { icon: 'book-open-variant' as const, label: t('admin.totalCourses'), value: stats?.totalCourses ?? 0, color: '#8B5CF6', onPress: undefined },
    { icon: 'account-group' as const, label: t('admin.totalGroups'), value: stats?.totalGroups ?? 0, color: '#06B6D4', onPress: () => router.push('/admin-tabs/users' as any) },
    { icon: 'human-male-board' as const, label: t('admin.totalTeachers'), value: stats?.totalTeachers ?? 0, color: c.success, onPress: () => router.push('/admin-tabs/users' as any) },
    { icon: 'cash-minus' as const, label: t('finance.monthlyExpense'), value: formatMoney(finance?.monthlyExpense), color: '#EF4444', onPress: () => router.push('/admin-tabs/finance' as any) },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.background }]} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        <Text style={[styles.title, { color: c.textHeading }]}>{t('admin.dashboard')}</Text>

        {/* All cards grid */}
        <View style={styles.grid}>
          {allCards.map((s, i) => (
            <View key={i} style={styles.gridItem}>
              <Card borderTopColor={s.color} onPress={s.onPress}>
                <View style={styles.cardInner}>
                  <MaterialCommunityIcons name={s.icon} size={24} color={s.color} />
                  <Text style={[styles.cardValue, { color: c.textHeading }]}>{s.value}</Text>
                  <View style={styles.cardLabelRow}>
                    <Text style={[styles.cardLabel, { color: c.textMuted, flex: 1 }]}>{s.label}</Text>
                    <MaterialCommunityIcons name="arrow-right" size={14} color={s.color} />
                  </View>
                </View>
              </Card>
            </View>
          ))}
        </View>

        {/* Recent payments */}
        {(data?.recentPayments?.length ?? 0) > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: c.textHeading }]}>{t('admin.recentPayments')}</Text>
            {(data?.recentPayments ?? []).map((p: any) => (
              <Card key={p?.id} style={{ marginBottom: spacing.xs }}>
                <View style={styles.listRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.listName, { color: c.textHeading }]}>{p?.studentName ?? ''}</Text>
                    <Text style={[styles.listMeta, { color: c.textMuted }]}>{new Date(p?.date).toLocaleDateString('az')}</Text>
                  </View>
                  <Text style={[styles.listAmount, { color: p?.status === 'PAID' ? '#10B981' : '#F59E0B' }]}>{formatMoney(p?.amount)}</Text>
                </View>
              </Card>
            ))}
          </View>
        )}

        {/* Recent leads */}
        {(data?.recentLeads?.length ?? 0) > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: c.textHeading }]}>{t('admin.recentLeads')}</Text>
            {(data?.recentLeads ?? []).map((l: any) => (
              <Card key={l?.id} style={{ marginBottom: spacing.xs }}>
                <View style={styles.listRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.listName, { color: c.textHeading }]}>{l?.fullName ?? ''}</Text>
                    <Text style={[styles.listMeta, { color: c.textMuted }]}>{l?.source ?? ''}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: l?.status === 'YENI' ? '#10B981' + '22' : l?.status === 'MARAQLI' ? '#F59E0B' + '22' : c.primary + '22' }]}>
                    <Text style={[styles.statusText, { color: l?.status === 'YENI' ? '#10B981' : l?.status === 'MARAQLI' ? '#F59E0B' : c.primary }]}>{l?.status ?? ''}</Text>
                  </View>
                </View>
              </Card>
            ))}
          </View>
        )}

        {/* Recent users */}
        {(data?.recentUsers?.length ?? 0) > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: c.textHeading }]}>{t('admin.recentUsers')}</Text>
            {(data?.recentUsers ?? []).slice(0, 5).map((u: any) => (
              <Card key={u?.id} style={{ marginBottom: spacing.xs }}>
                <View style={styles.listRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.listName, { color: c.textHeading }]}>{u?.name ?? ''}</Text>
                    <Text style={[styles.listMeta, { color: c.textMuted }]}>{u?.email ?? ''}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: (u?.role === 'ADMIN' ? c.error : u?.role === 'TEACHER' ? c.accent : u?.role === 'PARENT' ? c.warning : c.primary) + '22' }]}>
                    <Text style={[styles.statusText, { color: u?.role === 'ADMIN' ? c.error : u?.role === 'TEACHER' ? c.accent : u?.role === 'PARENT' ? c.warning : c.primary }]}>{u?.role ?? ''}</Text>
                  </View>
                </View>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontSize: 28, fontWeight: '700', padding: spacing.lg, paddingBottom: spacing.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: spacing.md },
  gridItem: { width: '46%', margin: '2%' },
  cardInner: { alignItems: 'center', paddingVertical: spacing.xs },
  cardValue: { fontSize: 20, fontWeight: '700', marginTop: 4 },
  cardLabel: { fontSize: 10, marginTop: 2, textAlign: 'center' },
  cardLabelRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2, gap: 4 },
  section: { paddingHorizontal: spacing.lg, marginTop: spacing.lg },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: spacing.sm },
  listRow: { flexDirection: 'row', alignItems: 'center' },
  listName: { fontSize: 14, fontWeight: '600' },
  listMeta: { fontSize: 11, marginTop: 1 },
  listAmount: { fontSize: 15, fontWeight: '700' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: borderRadius.full },
  statusText: { fontSize: 10, fontWeight: '600' },
});
