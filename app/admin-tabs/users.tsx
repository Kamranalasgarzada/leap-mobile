import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, FlatList, Pressable, Switch, TextInput, StyleSheet, Modal, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from 'expo-router';
import Toast from 'react-native-toast-message';
import { api } from '../../src/services/api';
import { useAppColors } from '../../src/hooks/useAppColors';
import { spacing, borderRadius } from '../../src/theme';
import { Card } from '../../src/components/Card';
import { LoadingScreen } from '../../src/components/LoadingScreen';
import { EmptyState } from '../../src/components/EmptyState';

const ROLES = ['', 'STUDENT', 'TEACHER', 'PARENT', 'ADMIN'];

export default function AdminUsersScreen() {
  const { t } = useTranslation();
  const c = useAppColors();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [groups, setGroups] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [detailUser, setDetailUser] = useState<any>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [filterModal, setFilterModal] = useState<'group' | 'course' | null>(null);

  const loadUsers = useCallback(async (role: string, pg: number, srch?: string, grp?: string | null, crs?: string | null) => {
    setLoading(true);
    try {
      const d = await api.adminGetUsers(role || undefined, pg, 20, srch || undefined, grp || undefined, crs || undefined);
      setUsers(d?.users ?? []);
      setTotalPages(d?.totalPages ?? 1);
    } catch {} finally { setLoading(false); }
  }, []);

  useFocusEffect(useCallback(() => {
    loadUsers(selectedRole, page, search, selectedGroup, selectedCourse);
    // Load groups and courses for filters
    api.adminGetGroups().then(r => setGroups(r?.groups ?? [])).catch(() => {});
    api.adminGetCourses().then(r => setCourses(r?.courses ?? [])).catch(() => {});
  }, [selectedRole, page, search, selectedGroup, selectedCourse]));

  const toggleActive = async (userId: string, current: boolean) => {
    try {
      await api.adminToggleUserStatus(userId, !current);
      setUsers(prev => prev.map(u => u?.id === userId ? { ...u, isActive: !current } : u));
      Toast.show({ type: 'success', text1: !current ? t('admin.active') : t('admin.inactive') });
    } catch (e: any) {
      Toast.show({ type: 'error', text1: e?.message ?? t('common.error') });
    }
  };

  const openDetail = async (userId: string) => {
    try {
      const d = await api.adminGetUserDetail(userId);
      setDetailUser(d?.user ?? null);
      setShowDetail(true);
    } catch {}
  };

  const roleLabel = (r: string) => r || t('admin.allRoles');
  const roleColor = (role: string) => role === 'ADMIN' ? c.error : role === 'TEACHER' ? c.accent : role === 'PARENT' ? '#F59E0B' : c.primary;

  const getUserMeta = (u: any) => {
    if (u?.role === 'TEACHER' && u?.teacherProfile?.subject) return u.teacherProfile.subject;
    if (u?.role === 'STUDENT' && u?.studentProfile?.enrollments?.length > 0) {
      const grpNames = (u.studentProfile.enrollments ?? []).map((e: any) => e?.group?.name).filter(Boolean);
      return grpNames.join(', ');
    }
    return '';
  };

  const selectedGroupName = useMemo(() => groups.find((g: any) => g?.id === selectedGroup)?.name ?? null, [groups, selectedGroup]);
  const selectedCourseName = useMemo(() => courses.find((c2: any) => c2?.id === selectedCourse)?.name ?? null, [courses, selectedCourse]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.background }]} edges={['top']}>
      <Text style={[styles.title, { color: c.textHeading }]}>{t('admin.userManagement')}</Text>

      {/* Search */}
      <View style={[styles.searchBox, { borderColor: c.cardBorder, backgroundColor: c.card }]}>
        <MaterialCommunityIcons name="magnify" size={20} color={c.textMuted} />
        <TextInput
          style={[styles.searchInput, { color: c.textBody }]}
          placeholder={t('common.search')}
          placeholderTextColor={c.textMuted}
          value={search}
          onChangeText={(v) => { setSearch(v); setPage(1); }}
        />
      </View>

      {/* Role filter chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow} style={{ flexGrow: 0 }}>
        {ROLES.map(r => (
          <Pressable
            key={r}
            onPress={() => { setSelectedRole(r); setPage(1); }}
            style={[styles.chip, { backgroundColor: c.card, borderColor: c.cardBorder }, selectedRole === r && { backgroundColor: c.primary, borderColor: c.primary }]}
          >
            <Text style={[styles.chipText, { color: c.textBody }, selectedRole === r && { color: '#FFF', fontWeight: '600' }]}>{roleLabel(r)}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Group/Course filters */}
      <View style={styles.filterRow}>
        <Pressable onPress={() => setFilterModal('group')} style={[styles.filterBtn, { backgroundColor: selectedGroup ? c.primary + '20' : c.card, borderColor: selectedGroup ? c.primary : c.cardBorder }]}>
          <MaterialCommunityIcons name="account-group" size={16} color={selectedGroup ? c.primary : c.textMuted} />
          <Text style={[styles.filterText, { color: selectedGroup ? c.primary : c.textMuted }]} numberOfLines={1}>
            {selectedGroupName ?? t('admin.allGroups')}
          </Text>
          {selectedGroup && (
            <Pressable onPress={() => { setSelectedGroup(null); setPage(1); }} hitSlop={8}>
              <MaterialCommunityIcons name="close-circle" size={16} color={c.primary} />
            </Pressable>
          )}
        </Pressable>
        <Pressable onPress={() => setFilterModal('course')} style={[styles.filterBtn, { backgroundColor: selectedCourse ? c.accent + '20' : c.card, borderColor: selectedCourse ? c.accent : c.cardBorder }]}>
          <MaterialCommunityIcons name="book-open-variant" size={16} color={selectedCourse ? c.accent : c.textMuted} />
          <Text style={[styles.filterText, { color: selectedCourse ? c.accent : c.textMuted }]} numberOfLines={1}>
            {selectedCourseName ?? t('admin.allCourses')}
          </Text>
          {selectedCourse && (
            <Pressable onPress={() => { setSelectedCourse(null); setPage(1); }} hitSlop={8}>
              <MaterialCommunityIcons name="close-circle" size={16} color={c.accent} />
            </Pressable>
          )}
        </Pressable>
      </View>

      {loading ? <LoadingScreen /> : (
        <FlatList
          data={users ?? []}
          keyExtractor={(item) => item?.id ?? Math.random().toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: 32 }}
          ListEmptyComponent={<EmptyState icon="account-group" message={t('common.noData')} />}
          renderItem={({ item: u }) => (
            <Pressable onPress={() => openDetail(u?.id)}>
              <Card style={{ marginBottom: spacing.sm }}>
                <View style={styles.userRow}>
                  <View style={[styles.avatarCircle, { backgroundColor: roleColor(u?.role) + '18' }]}>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: roleColor(u?.role) }}>
                      {(u?.name ?? '?')[0]?.toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.userName, { color: c.textHeading }]}>{u?.name ?? ''}</Text>
                    <Text style={[styles.userEmail, { color: c.textMuted }]}>{u?.email ?? ''}</Text>
                    {getUserMeta(u) ? <Text style={[styles.userMeta, { color: c.textBody }]}>{getUserMeta(u)}</Text> : null}
                    <View style={{ flexDirection: 'row', marginTop: spacing.xs, gap: 6 }}>
                      <View style={[styles.roleBadge, { backgroundColor: roleColor(u?.role) + '22' }]}>
                        <Text style={[styles.roleText, { color: roleColor(u?.role) }]}>{u?.role ?? ''}</Text>
                      </View>
                    </View>
                  </View>
                  <Switch
                    value={u?.isActive ?? false}
                    onValueChange={() => toggleActive(u?.id, u?.isActive ?? false)}
                    trackColor={{ false: c.surfaceLight, true: c.success + '66' }}
                    thumbColor={u?.isActive ? c.success : c.textMuted}
                  />
                </View>
              </Card>
            </Pressable>
          )}
          ListFooterComponent={totalPages > 1 ? (
            <View style={styles.pagination}>
              <Pressable onPress={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>
                <Text style={[styles.pageBtn, { color: c.primary }, page <= 1 && { opacity: 0.3 }]}>{t('exams.previous')}</Text>
              </Pressable>
              <Text style={[styles.pageInfo, { color: c.textBody }]}>{page}/{totalPages}</Text>
              <Pressable onPress={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
                <Text style={[styles.pageBtn, { color: c.primary }, page >= totalPages && { opacity: 0.3 }]}>{t('exams.next')}</Text>
              </Pressable>
            </View>
          ) : null}
        />
      )}

      {/* User Detail Modal */}
      <Modal visible={showDetail} transparent animationType="fade" onRequestClose={() => setShowDetail(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setShowDetail(false)} />
        <View style={styles.modalCenter}>
          <View style={[styles.modalContent, { backgroundColor: c.surface, borderColor: c.cardBorder }]}>
            {detailUser && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={{ alignItems: 'center', marginBottom: spacing.md }}>
                  <View style={[styles.detailAvatar, { backgroundColor: roleColor(detailUser?.role) + '18' }]}>
                    <Text style={{ fontSize: 28, fontWeight: '700', color: roleColor(detailUser?.role) }}>
                      {(detailUser?.name ?? '?')[0]?.toUpperCase()}
                    </Text>
                  </View>
                  <Text style={[styles.detailName, { color: c.textHeading }]}>{detailUser?.name ?? ''}</Text>
                  <Text style={[styles.detailEmail, { color: c.textMuted }]}>{detailUser?.email ?? ''}</Text>
                  {detailUser?.phone ? <Text style={[styles.detailEmail, { color: c.textMuted }]}>{detailUser.phone}</Text> : null}
                  <View style={[styles.roleBadge, { backgroundColor: roleColor(detailUser?.role) + '22', marginTop: 8 }]}>
                    <Text style={[styles.roleText, { color: roleColor(detailUser?.role) }]}>{detailUser?.role ?? ''}</Text>
                  </View>
                </View>

                {/* Teacher info */}
                {detailUser?.teacherProfile && (
                  <View style={[styles.detailSection, { borderTopColor: c.cardBorder }]}>
                    <Text style={[styles.detailSectionTitle, { color: c.textHeading }]}>Müəllim məlumatları</Text>
                    {detailUser.teacherProfile.subject ? <Text style={{ color: c.textBody, fontSize: 14 }}>Fənn: {detailUser.teacherProfile.subject}</Text> : null}
                    {detailUser.teacherProfile.specialization ? <Text style={{ color: c.textBody, fontSize: 14 }}>İxtisas: {detailUser.teacherProfile.specialization}</Text> : null}
                    {detailUser.teacherProfile.education ? <Text style={{ color: c.textBody, fontSize: 14 }}>Təhsil: {detailUser.teacherProfile.education}</Text> : null}
                  </View>
                )}

                {/* Student info */}
                {detailUser?.studentProfile && (
                  <View style={[styles.detailSection, { borderTopColor: c.cardBorder }]}>
                    <Text style={[styles.detailSectionTitle, { color: c.textHeading }]}>Tələbə məlumatları</Text>
                    {(detailUser.studentProfile.enrollments ?? []).map((e: any, i: number) => (
                      <Text key={i} style={{ color: c.textBody, fontSize: 14, marginTop: 2 }}>
                        {e?.group?.name ?? ''} — {e?.group?.course?.name ?? ''}
                      </Text>
                    ))}
                  </View>
                )}

                {/* Parent info */}
                {detailUser?.parentProfile && (
                  <View style={[styles.detailSection, { borderTopColor: c.cardBorder }]}>
                    <Text style={[styles.detailSectionTitle, { color: c.textHeading }]}>Valideyn məlumatları</Text>
                    <Text style={{ color: c.textBody, fontSize: 14 }}>Əlaqə: {detailUser.parentProfile.relation ?? 'Məlumat yoxdur'}</Text>
                  </View>
                )}

                <Text style={[styles.detailMeta, { color: c.textMuted }]}>
                  Qeydiyyat: {new Date(detailUser?.createdAt).toLocaleDateString('az')}
                </Text>
              </ScrollView>
            )}
            <Pressable onPress={() => setShowDetail(false)} style={[styles.closeBtn, { backgroundColor: c.primary }]}>
              <Text style={{ color: '#FFF', fontWeight: '600' }}>{t('common.close')}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Filter Picker Modal */}
      <Modal visible={!!filterModal} transparent animationType="fade" onRequestClose={() => setFilterModal(null)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setFilterModal(null)} />
        <View style={styles.modalCenter}>
          <View style={[styles.modalContent, { backgroundColor: c.surface, borderColor: c.cardBorder, maxHeight: 400 }]}>
            <Text style={[styles.detailSectionTitle, { color: c.textHeading, marginBottom: spacing.sm }]}>
              {filterModal === 'group' ? t('admin.selectGroup') : t('admin.selectCourse')}
            </Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Clear button */}
              <Pressable
                onPress={() => { filterModal === 'group' ? setSelectedGroup(null) : setSelectedCourse(null); setPage(1); setFilterModal(null); }}
                style={[styles.filterOption, { borderBottomColor: c.cardBorder }]}
              >
                <Text style={{ color: c.primary, fontWeight: '600', fontSize: 14 }}>{filterModal === 'group' ? t('admin.allGroups') : t('admin.allCourses')}</Text>
              </Pressable>
              {(filterModal === 'group' ? groups : courses).map((item: any) => (
                <Pressable
                  key={item?.id}
                  onPress={() => {
                    if (filterModal === 'group') { setSelectedGroup(item?.id); setSelectedCourse(null); }
                    else { setSelectedCourse(item?.id); setSelectedGroup(null); }
                    setPage(1); setFilterModal(null);
                  }}
                  style={[styles.filterOption, { borderBottomColor: c.cardBorder }]}
                >
                  <Text style={{ color: c.textBody, fontSize: 14 }}>{item?.name ?? ''}</Text>
                  {filterModal === 'group' && item?.courseName ? <Text style={{ color: c.textMuted, fontSize: 11 }}>{item.courseName}</Text> : null}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontSize: 28, fontWeight: '700', paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.sm },
  searchBox: { flexDirection: 'row', alignItems: 'center', marginHorizontal: spacing.lg, borderRadius: borderRadius.md, borderWidth: 1, paddingHorizontal: spacing.sm, height: 44, marginBottom: spacing.sm },
  searchInput: { flex: 1, fontSize: 15, marginLeft: spacing.xs },
  chipRow: { paddingHorizontal: spacing.lg, marginBottom: spacing.sm, gap: spacing.xs },
  chip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.full, borderWidth: 1 },
  chipText: { fontSize: 13 },
  filterRow: { flexDirection: 'row', paddingHorizontal: spacing.lg, gap: spacing.sm, marginBottom: spacing.sm },
  filterBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 8, borderRadius: borderRadius.md, borderWidth: 1 },
  filterText: { fontSize: 12, flex: 1 },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  avatarCircle: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  userName: { fontSize: 15, fontWeight: '600' },
  userEmail: { fontSize: 12, marginTop: 1 },
  userMeta: { fontSize: 11, marginTop: 2, fontStyle: 'italic' },
  roleBadge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: 4, alignSelf: 'flex-start' },
  roleText: { fontSize: 11, fontWeight: '600' },
  pagination: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: spacing.lg, gap: spacing.lg },
  pageBtn: { fontSize: 14, fontWeight: '600' },
  pageInfo: { fontSize: 14 },
  // Modal
  modalBackdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)' },
  modalCenter: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  modalContent: { width: '100%', maxWidth: 420, borderRadius: borderRadius.lg, padding: spacing.lg, borderWidth: 1, overflow: 'hidden' },
  detailAvatar: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  detailName: { fontSize: 20, fontWeight: '700' },
  detailEmail: { fontSize: 13, marginTop: 2 },
  detailSection: { borderTopWidth: 1, paddingTop: spacing.sm, marginTop: spacing.sm },
  detailSectionTitle: { fontSize: 15, fontWeight: '600', marginBottom: 4 },
  detailMeta: { fontSize: 11, textAlign: 'center', marginTop: spacing.md },
  closeBtn: { alignItems: 'center', paddingVertical: 12, borderRadius: borderRadius.md, marginTop: spacing.md },
  filterOption: { paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
});
