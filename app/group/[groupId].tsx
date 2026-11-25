import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, ScrollView, Pressable, Modal, StyleSheet, Animated, RefreshControl, Linking, Platform, Alert } from 'react-native';

const openExternalUrl = (url: string) => {
  if (!url) return;
  if (Platform.OS === 'web') {
    try { window.open(url, '_blank', 'noopener,noreferrer'); } catch { window.location.href = url; }
  } else {
    Linking.openURL(url).catch(() => Alert.alert('Xəta', 'Link açıla bilmədi'));
  }
};
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import Toast from 'react-native-toast-message';
import QRCode from 'react-native-qrcode-svg';
import { api } from '../../src/services/api';
import { useAppColors } from '../../src/hooks/useAppColors';
import { spacing, borderRadius } from '../../src/theme';
import { Card } from '../../src/components/Card';
import { LoadingScreen } from '../../src/components/LoadingScreen';
import { EmptyState } from '../../src/components/EmptyState';
import { GradientButton } from '../../src/components/GradientButton';

type SubTab = 'students' | 'attendance' | 'info';
type AttMode = 'qr' | 'manual';
type AttStatus = 'PRESENT' | 'ABSENT' | 'LATE';

export default function GroupDetailScreen() {
  const { groupId = '' } = useLocalSearchParams<{ groupId: string }>();
  const { t } = useTranslation();
  const c = useAppColors();
  const router = useRouter();

  const [subTab, setSubTab] = useState<SubTab>('students');
  const [group, setGroup] = useState<any>(null);
  const [groups, setGroups] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Attendance state
  const [attMode, setAttMode] = useState<AttMode>('qr');
  const [records, setRecords] = useState<Record<string, AttStatus>>({});
  const [saving, setSaving] = useState(false);
  const [activeSession, setActiveSession] = useState<any>(null);
  const [creatingSession, setCreatingSession] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [sessionResults, setSessionResults] = useState<any>(null);

  // Attendance history
  const [attHistory, setAttHistory] = useState<any[]>([]);

  const pulseAnim = useRef(new Animated.Value(1)).current;

  const fetchData = useCallback(async () => {
    try {
      const [groupsRes, studentsRes] = await Promise.all([
        api.teacherGetGroups(),
        api.teacherGetGroupStudents(groupId),
      ]);
      const allGroups = groupsRes?.groups ?? [];
      setGroups(allGroups);
      const g = allGroups.find((x: any) => x?.id === groupId);
      setGroup(g ?? null);
      const sts = studentsRes?.students ?? [];
      setStudents(sts);
      const initial: Record<string, AttStatus> = {};
      sts.forEach((s: any) => { initial[s?.studentId ?? ''] = 'PRESENT'; });
      setRecords(initial);

      // Check active QR session
      const sessionRes = await api.teacherGetActiveSession(groupId);
      setActiveSession(sessionRes?.session ?? null);

      // Get attendance history
      const histRes = await api.teacherGetAttendanceHistory(groupId);
      setAttHistory(histRes?.records ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [groupId]);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

  // Pulse animation
  useEffect(() => {
    if (!activeSession) return;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.03, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [activeSession]);

  // --- Attendance actions ---
  const toggleStatus = (studentId: string) => {
    setRecords(prev => {
      const cur = prev[studentId] ?? 'PRESENT';
      const next: AttStatus = cur === 'PRESENT' ? 'ABSENT' : cur === 'ABSENT' ? 'LATE' : 'PRESENT';
      return { ...prev, [studentId]: next };
    });
  };

  const saveManualAttendance = async () => {
    setSaving(true);
    try {
      const recs = Object.entries(records).map(([studentId, status]) => ({ studentId, status }));
      await api.teacherRecordAttendance({ groupId, date: new Date().toISOString().split('T')[0], records: recs });
      Toast.show({ type: 'success', text1: t('teacher.attendanceSaved') });
      fetchData();
    } catch (e: any) {
      Toast.show({ type: 'error', text1: e?.message ?? t('common.error') });
    } finally { setSaving(false); }
  };

  const createQrSession = async () => {
    setCreatingSession(true);
    try {
      const res = await api.teacherCreateAttendanceSession({ groupId, durationMinutes: 30 });
      setActiveSession(res?.session ?? null);
      setShowQrModal(true);
      Toast.show({ type: 'success', text1: t('teacher.qrSessionCreated') });
    } catch (e: any) {
      Toast.show({ type: 'error', text1: e?.message ?? t('common.error') });
    } finally { setCreatingSession(false); }
  };

  const closeQrSession = async () => {
    if (!activeSession?.id) return;
    try {
      await api.teacherCloseSession(activeSession.id);
      const res = await api.teacherGetSessionResults(activeSession.id);
      setSessionResults(res);
      setActiveSession(null);
      setShowQrModal(false);
      Toast.show({ type: 'success', text1: t('teacher.sessionClosed') });
      fetchData();
    } catch (e: any) {
      Toast.show({ type: 'error', text1: e?.message ?? t('common.error') });
    }
  };

  const refreshSession = async () => {
    if (!activeSession?.id) return;
    try {
      const res = await api.teacherGetSessionResults(activeSession.id);
      setSessionResults(res);
      // Also refresh active session count
      const sess = await api.teacherGetActiveSession(groupId);
      setActiveSession(sess?.session ?? null);
    } catch {}
  };

  const statusColor = (s: string) => s === 'PRESENT' ? c.success : s === 'ABSENT' ? c.error : c.warning;
  const statusLabel = (s: string) => s === 'PRESENT' ? t('teacher.present') : s === 'ABSENT' ? t('teacher.absent') : t('teacher.late');
  const statusIcon = (s: string): any => s === 'PRESENT' ? 'check-circle' : s === 'ABSENT' ? 'close-circle' : 'clock-outline';

  if (loading) return <LoadingScreen />;
  if (!group) return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }}>
      <EmptyState icon="alert-circle" message={t('common.noData')} />
    </SafeAreaView>
  );

  const tabItems: { key: SubTab; label: string; icon: any }[] = [
    { key: 'students', label: t('teacher.students'), icon: 'account-group' },
    { key: 'attendance', label: t('teacher.attendance'), icon: 'calendar-check' },
    { key: 'info', label: t('teacher.groupInfo'), icon: 'information' },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={c.textHeading} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: c.textHeading }]} numberOfLines={1}>{group?.name ?? ''}</Text>
          <Text style={[styles.headerSub, { color: c.textMuted }]}>{group?.courseName ?? ''} · {students?.length ?? 0} {t('common.students')}</Text>
        </View>
      </View>

      {/* Sub-tabs */}
      <View style={[styles.tabRow, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
        {tabItems.map(tab => (
          <Pressable
            key={tab.key}
            onPress={() => setSubTab(tab.key)}
            style={[styles.tabItem, subTab === tab.key && { borderBottomColor: c.primary, borderBottomWidth: 2 }]}
          >
            <MaterialCommunityIcons name={tab.icon} size={18} color={subTab === tab.key ? c.primary : c.textMuted} />
            <Text style={[styles.tabLabel, { color: subTab === tab.key ? c.primary : c.textMuted }]}>{tab.label}</Text>
          </Pressable>
        ))}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: spacing.md, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor={c.primary} />}
      >
        {/* ============ STUDENTS TAB ============ */}
        {subTab === 'students' && (
          <>
            {(students?.length ?? 0) === 0 ? (
              <EmptyState icon="account-off" message={t('common.noData')} />
            ) : (
              students.map((s: any) => (
                <Pressable key={s?.studentId} onPress={() => router.push(`/group/${groupId}/student/${s?.studentId}`)}>
                  <Card style={styles.studentCard}>
                    <View style={styles.studentRow}>
                      <LinearGradient colors={c.gradientPrimary} style={styles.avatar}>
                        <Text style={styles.avatarText}>{(s?.name ?? '?')[0]?.toUpperCase()}</Text>
                      </LinearGradient>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.studentName, { color: c.textHeading }]}>{s?.name ?? ''}</Text>
                        <Text style={{ fontSize: 12, color: c.textMuted, marginTop: 1 }}>{s?.email ?? ''}</Text>
                      </View>
                      <MaterialCommunityIcons name="chevron-right" size={22} color={c.textMuted} />
                    </View>
                  </Card>
                </Pressable>
              ))
            )}
          </>
        )}

        {/* ============ ATTENDANCE TAB ============ */}
        {subTab === 'attendance' && (
          <>
            {/* Mode toggle */}
            <View style={[styles.modeRow, { backgroundColor: c.card }]}>
              <Pressable onPress={() => setAttMode('qr')} style={[styles.modeBtn, attMode === 'qr' && { backgroundColor: c.primary }]}>
                <MaterialCommunityIcons name="qrcode" size={18} color={attMode === 'qr' ? '#fff' : c.textMuted} />
                <Text style={[styles.modeBtnText, { color: attMode === 'qr' ? '#fff' : c.textMuted }]}>{t('teacher.qrMode')}</Text>
              </Pressable>
              <Pressable onPress={() => setAttMode('manual')} style={[styles.modeBtn, attMode === 'manual' && { backgroundColor: c.primary }]}>
                <MaterialCommunityIcons name="format-list-checks" size={18} color={attMode === 'manual' ? '#fff' : c.textMuted} />
                <Text style={[styles.modeBtnText, { color: attMode === 'manual' ? '#fff' : c.textMuted }]}>{t('teacher.manualMode')}</Text>
              </Pressable>
            </View>

            {attMode === 'qr' ? (
              <>
                {activeSession ? (
                  <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                    <Card style={{ borderWidth: 2, borderColor: c.success, padding: spacing.lg, alignItems: 'center' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}>
                        <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: c.success, marginRight: 6 }} />
                        <Text style={{ fontSize: 14, fontWeight: '600', color: c.success }}>{t('teacher.sessionActive')}</Text>
                      </View>
                      <Text style={{ fontSize: 13, color: c.textMuted, marginBottom: spacing.md }}>
                        {t('teacher.checkedIn')}: {activeSession?.checkedInCount ?? 0}/{activeSession?.totalStudents ?? 0}
                      </Text>
                      <Pressable onPress={() => setShowQrModal(true)} style={{ backgroundColor: '#fff', padding: 16, borderRadius: 16 }}>
                        <QRCode value={activeSession?.qrCode ?? 'x'} size={140} backgroundColor="#fff" color="#000" />
                        <Text style={{ fontSize: 11, color: c.textMuted, marginTop: 8, textAlign: 'center' }}>{t('teacher.tapToEnlarge')}</Text>
                      </Pressable>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: spacing.md, backgroundColor: c.background, borderRadius: borderRadius.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm }}>
                        <MaterialCommunityIcons name="lock" size={16} color={c.primary} />
                        <Text style={{ fontSize: 22, fontWeight: '800', color: c.textHeading, letterSpacing: 4, marginLeft: 8 }}>{activeSession?.pinCode ?? ''}</Text>
                      </View>
                      <Text style={{ fontSize: 11, color: c.textMuted, marginTop: 2 }}>{t('teacher.pinCode')}</Text>
                      <View style={{ flexDirection: 'row', marginTop: spacing.lg, gap: spacing.sm }}>
                        <Pressable onPress={refreshSession} style={[styles.actionBtn, { backgroundColor: c.primary + '15' }]}>
                          <MaterialCommunityIcons name="refresh" size={16} color={c.primary} />
                          <Text style={{ color: c.primary, fontWeight: '600', marginLeft: 4, fontSize: 13 }}>{t('teacher.refresh')}</Text>
                        </Pressable>
                        <Pressable onPress={closeQrSession} style={[styles.actionBtn, { backgroundColor: c.error + '15' }]}>
                          <MaterialCommunityIcons name="stop-circle" size={16} color={c.error} />
                          <Text style={{ color: c.error, fontWeight: '600', marginLeft: 4, fontSize: 13 }}>{t('teacher.closeSession')}</Text>
                        </Pressable>
                      </View>
                    </Card>
                  </Animated.View>
                ) : (
                  <Card style={{ padding: spacing.lg, alignItems: 'center' }}>
                    <MaterialCommunityIcons name="qrcode-scan" size={56} color={c.primary} />
                    <Text style={{ fontSize: 17, fontWeight: '700', color: c.textHeading, marginTop: spacing.md, textAlign: 'center' }}>{t('teacher.createQrSession')}</Text>
                    <Text style={{ fontSize: 13, color: c.textMuted, marginTop: spacing.xs, textAlign: 'center', lineHeight: 20 }}>{t('teacher.qrSessionDesc')}</Text>
                    <GradientButton title={t('teacher.startSession')} onPress={createQrSession} loading={creatingSession} style={{ marginTop: spacing.lg, width: '100%' }} />
                  </Card>
                )}

                {/* Session results */}
                {sessionResults && (
                  <Card style={{ marginTop: spacing.md, padding: spacing.md }}>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: c.textHeading, marginBottom: spacing.sm }}>{t('teacher.sessionResults')}</Text>
                    <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md }}>
                      {(['present', 'late', 'absent'] as const).map(key => {
                        const colors = { present: c.success, late: c.warning, absent: c.error };
                        return (
                          <View key={key} style={[styles.statBadge, { backgroundColor: colors[key] + '20' }]}>
                            <Text style={{ fontSize: 18, fontWeight: '700', color: colors[key] }}>{sessionResults?.summary?.[key] ?? 0}</Text>
                            <Text style={{ fontSize: 11, color: colors[key] }}>{t(`teacher.${key}`)}</Text>
                          </View>
                        );
                      })}
                    </View>
                    {(sessionResults?.students ?? []).map((s: any, i: number) => (
                      <View key={s?.studentId ?? i} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: c.cardBorder }}>
                        <MaterialCommunityIcons name={statusIcon(s?.status)} size={18} color={statusColor(s?.status ?? 'ABSENT')} />
                        <Text style={{ flex: 1, marginLeft: 8, fontSize: 13, color: c.textBody }}>{s?.name ?? ''}</Text>
                        <Text style={{ fontSize: 12, fontWeight: '600', color: statusColor(s?.status ?? 'ABSENT') }}>{statusLabel(s?.status ?? 'ABSENT')}</Text>
                      </View>
                    ))}
                  </Card>
                )}
              </>
            ) : (
              /* Manual mode */
              <>
                {(students?.length ?? 0) === 0 ? (
                  <EmptyState icon="account-off" message={t('common.noData')} />
                ) : (
                  <>
                    {students.map((s: any) => (
                      <Pressable key={s?.studentId} onPress={() => toggleStatus(s?.studentId ?? '')}>
                        <Card style={{ marginBottom: spacing.xs, borderLeftWidth: 4, borderLeftColor: statusColor(records[s?.studentId ?? ''] ?? 'PRESENT') }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <View style={{ flex: 1 }}>
                              <Text style={{ fontSize: 14, fontWeight: '600', color: c.textHeading }}>{s?.name ?? ''}</Text>
                            </View>
                            <View style={{ paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, backgroundColor: statusColor(records[s?.studentId ?? ''] ?? 'PRESENT') + '22' }}>
                              <Text style={{ fontSize: 12, fontWeight: '600', color: statusColor(records[s?.studentId ?? ''] ?? 'PRESENT') }}>
                                {statusLabel(records[s?.studentId ?? ''] ?? 'PRESENT')}
                              </Text>
                            </View>
                          </View>
                        </Card>
                      </Pressable>
                    ))}
                    <GradientButton title={t('teacher.saveAttendance')} onPress={saveManualAttendance} loading={saving} style={{ marginTop: spacing.md }} />
                  </>
                )}
              </>
            )}

            {/* Attendance history */}
            {(attHistory?.length ?? 0) > 0 && (
              <Card style={{ marginTop: spacing.lg, padding: spacing.md }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: c.textHeading, marginBottom: spacing.sm }}>{t('teacher.attendanceHistory')}</Text>
                {attHistory.slice(0, 20).map((r: any, i: number) => (
                  <View key={r?.id ?? i} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 6, borderBottomWidth: i < Math.min(attHistory.length, 20) - 1 ? 1 : 0, borderBottomColor: c.cardBorder }}>
                    <MaterialCommunityIcons name={statusIcon(r?.status)} size={16} color={statusColor(r?.status ?? 'ABSENT')} />
                    <Text style={{ flex: 1, marginLeft: 8, fontSize: 13, color: c.textBody }}>{r?.studentName ?? ''}</Text>
                    <Text style={{ fontSize: 11, color: c.textMuted }}>{r?.date ? new Date(r.date).toLocaleDateString() : ''}</Text>
                  </View>
                ))}
              </Card>
            )}
          </>
        )}

        {/* ============ INFO TAB ============ */}
        {subTab === 'info' && (
          <Card style={{ padding: spacing.lg }}>
            <InfoRow icon="book-open-variant" label={t('teacher.course')} value={group?.courseName ?? '-'} c={c} />
            <InfoRow icon="clock-outline" label={t('teacher.schedule')} value={(group?.lessonDays ?? '-').replace(/["']/g, '')} c={c} />
            <InfoRow icon="clock" label={t('teacher.lessonTime')} value={group?.lessonTime ?? '-'} c={c} />
            <InfoRow icon="door" label={t('teacher.room')} value={group?.room ?? '-'} c={c} />
            <InfoRow icon="account-group" label={t('common.students')} value={String(students?.length ?? 0)} c={c} />
            {group?.liveLink && (
              <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: c.cardBorder }}>
                <MaterialCommunityIcons name="video" size={20} color={c.primary} />
                <Text style={{ flex: 1, marginLeft: 10, fontSize: 14, color: c.textMuted }}>{t('teacher.liveLink')}</Text>
                <Pressable
                  onPress={() => openExternalUrl(group.liveLink)}
                  style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: c.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, gap: 4 }}
                >
                  <MaterialCommunityIcons name="video-outline" size={16} color="#fff" />
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#fff' }}>Zoom</Text>
                </Pressable>
              </View>
            )}
          </Card>
        )}
      </ScrollView>

      {/* QR Full-screen Modal */}
      <Modal visible={showQrModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowQrModal(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: c.background }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg }}>
            <Text style={{ fontSize: 20, fontWeight: '700', color: c.textHeading }}>{t('teacher.qrAttendance')}</Text>
            <Pressable onPress={() => setShowQrModal(false)}>
              <MaterialCommunityIcons name="close" size={24} color={c.textMuted} />
            </Pressable>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ alignItems: 'center', padding: spacing.lg }}>
            {activeSession && (
              <>
                <Text style={{ fontSize: 18, fontWeight: '600', color: c.textHeading, marginBottom: spacing.xs }}>{group?.name ?? ''}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c.success, marginRight: 6 }} />
                  <Text style={{ color: c.success, fontWeight: '600' }}>{t('teacher.sessionActive')}</Text>
                </View>
                <View style={{ backgroundColor: '#fff', padding: 24, borderRadius: 20, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 }}>
                  <QRCode value={activeSession?.qrCode ?? 'x'} size={220} backgroundColor="#fff" color="#000" />
                </View>
                <Text style={{ fontSize: 14, color: c.textMuted, marginTop: spacing.lg }}>{t('teacher.orEnterPin')}</Text>
                <View style={{ flexDirection: 'row', marginTop: spacing.sm, gap: 8 }}>
                  {(activeSession?.pinCode ?? '').split('').map((d: string, i: number) => (
                    <View key={i} style={{ width: 44, height: 52, borderRadius: 10, backgroundColor: c.card, borderWidth: 1, borderColor: c.primary, justifyContent: 'center', alignItems: 'center' }}>
                      <Text style={{ fontSize: 22, fontWeight: '800', color: c.textHeading }}>{d}</Text>
                    </View>
                  ))}
                </View>
                <Text style={{ fontSize: 14, color: c.textMuted, marginTop: spacing.lg }}>
                  {t('teacher.checkedIn')}: {activeSession?.checkedInCount ?? 0}/{activeSession?.totalStudents ?? 0}
                </Text>
                <View style={{ flexDirection: 'row', marginTop: spacing.xl, gap: spacing.md }}>
                  <Pressable onPress={refreshSession} style={[styles.modalBtn, { backgroundColor: c.primary }]}>
                    <MaterialCommunityIcons name="refresh" size={20} color="#fff" />
                    <Text style={{ color: '#fff', fontWeight: '600', marginLeft: 6 }}>{t('teacher.refresh')}</Text>
                  </Pressable>
                  <Pressable onPress={closeQrSession} style={[styles.modalBtn, { backgroundColor: c.error }]}>
                    <MaterialCommunityIcons name="stop-circle" size={20} color="#fff" />
                    <Text style={{ color: '#fff', fontWeight: '600', marginLeft: 6 }}>{t('teacher.closeSession')}</Text>
                  </Pressable>
                </View>
              </>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

function InfoRow({ icon, label, value, c }: { icon: any; label: string; value: string; c: any }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: c.cardBorder }}>
      <MaterialCommunityIcons name={icon} size={20} color={c.primary} />
      <Text style={{ flex: 1, marginLeft: 10, fontSize: 14, color: c.textMuted }}>{label}</Text>
      <Text style={{ fontSize: 14, fontWeight: '600', color: c.textHeading, maxWidth: '50%' }} numberOfLines={2}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  backBtn: { padding: 8, marginRight: 4 },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  headerSub: { fontSize: 12, marginTop: 1 },
  tabRow: { flexDirection: 'row', borderBottomWidth: 1, marginHorizontal: spacing.md, borderRadius: borderRadius.md },
  tabItem: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, gap: 4 },
  tabLabel: { fontSize: 13, fontWeight: '600' },
  modeRow: { flexDirection: 'row', borderRadius: 10, padding: 4, marginBottom: spacing.md },
  modeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 8, gap: 6 },
  modeBtnText: { fontSize: 13, fontWeight: '600' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  statBadge: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 10 },
  modalBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
  studentCard: { marginBottom: spacing.sm },
  studentRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  avatarText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  studentName: { fontSize: 15, fontWeight: '600' },
});
