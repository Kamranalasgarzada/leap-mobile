import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, ScrollView, Pressable, Modal, Platform, StyleSheet, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from 'expo-router';
import Toast from 'react-native-toast-message';
import QRCode from 'react-native-qrcode-svg';
import { api } from '../../src/services/api';
import { useAppColors } from '../../src/hooks/useAppColors';
import { spacing, borderRadius } from '../../src/theme';
import { Card } from '../../src/components/Card';
import { LoadingScreen } from '../../src/components/LoadingScreen';
import { EmptyState } from '../../src/components/EmptyState';
import { GradientButton } from '../../src/components/GradientButton';

type AttStatus = 'PRESENT' | 'ABSENT' | 'LATE';
type TabMode = 'manual' | 'qr';

export default function TeacherAttendanceScreen() {
  const { t } = useTranslation();
  const c = useAppColors();
  const [groups, setGroups] = useState<any[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [records, setRecords] = useState<Record<string, AttStatus>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState<TabMode>('qr');

  // QR Session state
  const [activeSession, setActiveSession] = useState<any>(null);
  const [creatingSession, setCreatingSession] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [sessionResults, setSessionResults] = useState<any>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useFocusEffect(useCallback(() => {
    api.teacherGetGroups().then(d => setGroups(d?.groups ?? [])).catch(() => {}).finally(() => setLoading(false));
  }, []));

  // Check for active session when group selected
  useEffect(() => {
    if (!selectedGroup) { setStudents([]); setActiveSession(null); return; }
    api.teacherGetGroupStudents(selectedGroup).then(d => {
      const sts = d?.students ?? [];
      setStudents(sts);
      const initial: Record<string, AttStatus> = {};
      sts.forEach((s: any) => { initial[s?.studentId ?? ''] = 'PRESENT'; });
      setRecords(initial);
    }).catch(() => {});
    // Check for active QR session
    api.teacherGetActiveSession(selectedGroup).then(d => {
      setActiveSession(d?.session ?? null);
    }).catch(() => {});
  }, [selectedGroup]);

  // Pulse animation for active session
  useEffect(() => {
    if (!activeSession) return;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [activeSession]);

  const toggleStatus = (studentId: string) => {
    setRecords(prev => {
      const current = prev[studentId] ?? 'PRESENT';
      const next: AttStatus = current === 'PRESENT' ? 'ABSENT' : current === 'ABSENT' ? 'LATE' : 'PRESENT';
      return { ...prev, [studentId]: next };
    });
  };

  const saveAttendance = async () => {
    if (!selectedGroup) return;
    setSaving(true);
    try {
      const recs = Object.entries(records).map(([studentId, status]) => ({ studentId, status }));
      await api.teacherRecordAttendance({ groupId: selectedGroup, date: new Date().toISOString().split('T')[0], records: recs });
      Toast.show({ type: 'success', text1: t('teacher.attendanceSaved') });
    } catch (e: any) {
      Toast.show({ type: 'error', text1: e?.message ?? t('common.error') });
    } finally { setSaving(false); }
  };

  const createQrSession = async () => {
    if (!selectedGroup) return;
    setCreatingSession(true);
    try {
      const res = await api.teacherCreateAttendanceSession({ groupId: selectedGroup, durationMinutes: 30 });
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
      // Fetch results
      const res = await api.teacherGetSessionResults(activeSession.id);
      setSessionResults(res);
      setActiveSession(null);
      setShowQrModal(false);
      Toast.show({ type: 'success', text1: t('teacher.sessionClosed') });
    } catch (e: any) {
      Toast.show({ type: 'error', text1: e?.message ?? t('common.error') });
    }
  };

  const refreshSessionData = async () => {
    if (!activeSession?.id) return;
    try {
      const res = await api.teacherGetSessionResults(activeSession.id);
      setSessionResults(res);
    } catch {}
  };

  const statusColor = (s: AttStatus) => s === 'PRESENT' ? c.success : s === 'ABSENT' ? c.error : c.warning;
  const statusLabel = (s: AttStatus) => s === 'PRESENT' ? t('teacher.present') : s === 'ABSENT' ? t('teacher.absent') : t('teacher.late');
  const statusIcon = (s: string) => s === 'PRESENT' ? 'check-circle' : s === 'ABSENT' ? 'close-circle' : 'clock-outline';

  const getTimeRemaining = () => {
    if (!activeSession?.expiresAt) return '';
    const diff = new Date(activeSession.expiresAt).getTime() - Date.now();
    if (diff <= 0) return t('teacher.expired');
    const mins = Math.floor(diff / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) return <LoadingScreen />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }} edges={['top']}>
      <Text style={{ fontSize: 28, fontWeight: '700', color: c.textHeading, padding: spacing.lg, paddingBottom: spacing.sm }}>{t('teacher.attendance')}</Text>

      {(groups?.length ?? 0) === 0 ? (
        <EmptyState icon="calendar-check" message={t('teacher.noGroups')} />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: spacing.lg, paddingTop: 0, paddingBottom: 32 }}>
          {/* Group selector */}
          <Text style={{ fontSize: 16, fontWeight: '600', color: c.textHeading, marginBottom: spacing.sm }}>{t('teacher.selectGroup')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.md }}>
            {groups.map((g: any) => (
              <Pressable
                key={g?.id}
                onPress={() => setSelectedGroup(g?.id ?? null)}
                style={[{
                  paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.full,
                  backgroundColor: c.card, marginRight: spacing.sm, borderWidth: 1, borderColor: c.cardBorder,
                }, selectedGroup === g?.id && { backgroundColor: c.primary, borderColor: c.primary }]}
              >
                <Text style={[{ fontSize: 14, color: c.textBody }, selectedGroup === g?.id && { color: '#fff', fontWeight: '600' }]}>{g?.name ?? ''}</Text>
              </Pressable>
            ))}
          </ScrollView>

          {selectedGroup && (
            <>
              {/* Mode toggle */}
              <View style={{ flexDirection: 'row', marginBottom: spacing.md, backgroundColor: c.card, borderRadius: borderRadius.lg, padding: 4 }}>
                <Pressable
                  onPress={() => setMode('qr')}
                  style={[styles.modeTab, mode === 'qr' && { backgroundColor: c.primary }]}
                >
                  <MaterialCommunityIcons name="qrcode" size={18} color={mode === 'qr' ? '#fff' : c.textMuted} />
                  <Text style={[styles.modeTabText, { color: mode === 'qr' ? '#fff' : c.textMuted }]}>{t('teacher.qrMode')}</Text>
                </Pressable>
                <Pressable
                  onPress={() => setMode('manual')}
                  style={[styles.modeTab, mode === 'manual' && { backgroundColor: c.primary }]}
                >
                  <MaterialCommunityIcons name="format-list-checks" size={18} color={mode === 'manual' ? '#fff' : c.textMuted} />
                  <Text style={[styles.modeTabText, { color: mode === 'manual' ? '#fff' : c.textMuted }]}>{t('teacher.manualMode')}</Text>
                </Pressable>
              </View>

              {mode === 'qr' ? (
                /* QR Mode */
                <View>
                  {activeSession ? (
                    /* Active session card */
                    <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                      <Card style={{ borderWidth: 2, borderColor: c.success, padding: spacing.lg }}>
                        <View style={{ alignItems: 'center' }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}>
                            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: c.success, marginRight: spacing.xs }} />
                            <Text style={{ fontSize: 14, fontWeight: '600', color: c.success }}>{t('teacher.sessionActive')}</Text>
                          </View>
                          <Text style={{ fontSize: 20, fontWeight: '700', color: c.textHeading, marginBottom: spacing.xs }}>
                            {activeSession?.groupName ?? ''}
                          </Text>
                          <Text style={{ fontSize: 13, color: c.textMuted, marginBottom: spacing.md }}>
                            {t('teacher.checkedIn')}: {activeSession?.checkedInCount ?? 0}/{activeSession?.totalStudents ?? 0}
                          </Text>

                          <Pressable onPress={() => setShowQrModal(true)} style={styles.qrPreviewBox}>
                            <QRCode value={activeSession?.qrCode ?? 'none'} size={120} backgroundColor="#fff" color="#000" />
                            <Text style={{ fontSize: 12, color: c.textMuted, marginTop: spacing.sm }}>{t('teacher.tapToEnlarge')}</Text>
                          </Pressable>

                          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: spacing.md, backgroundColor: c.background, borderRadius: borderRadius.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm }}>
                            <MaterialCommunityIcons name="lock" size={18} color={c.primary} />
                            <Text style={{ fontSize: 24, fontWeight: '800', color: c.textHeading, letterSpacing: 4, marginLeft: spacing.sm }}>
                              {activeSession?.pinCode ?? ''}
                            </Text>
                          </View>
                          <Text style={{ fontSize: 12, color: c.textMuted, marginTop: 4 }}>{t('teacher.pinCode')}</Text>

                          <View style={{ flexDirection: 'row', marginTop: spacing.lg, gap: spacing.sm }}>
                            <Pressable
                              onPress={() => { setShowQrModal(true); refreshSessionData(); }}
                              style={[styles.actionBtn, { backgroundColor: c.primary + '15' }]}
                            >
                              <MaterialCommunityIcons name="refresh" size={18} color={c.primary} />
                              <Text style={{ color: c.primary, fontWeight: '600', marginLeft: 4 }}>{t('teacher.refresh')}</Text>
                            </Pressable>
                            <Pressable
                              onPress={closeQrSession}
                              style={[styles.actionBtn, { backgroundColor: c.error + '15' }]}
                            >
                              <MaterialCommunityIcons name="stop-circle" size={18} color={c.error} />
                              <Text style={{ color: c.error, fontWeight: '600', marginLeft: 4 }}>{t('teacher.closeSession')}</Text>
                            </Pressable>
                          </View>
                        </View>
                      </Card>
                    </Animated.View>
                  ) : (
                    /* Create session card */
                    <Card style={{ padding: spacing.lg, alignItems: 'center' }}>
                      <MaterialCommunityIcons name="qrcode-scan" size={64} color={c.primary} />
                      <Text style={{ fontSize: 18, fontWeight: '700', color: c.textHeading, marginTop: spacing.md, textAlign: 'center' }}>
                        {t('teacher.createQrSession')}
                      </Text>
                      <Text style={{ fontSize: 14, color: c.textMuted, marginTop: spacing.xs, textAlign: 'center', lineHeight: 20 }}>
                        {t('teacher.qrSessionDesc')}
                      </Text>
                      <GradientButton
                        title={t('teacher.startSession')}
                        onPress={createQrSession}
                        loading={creatingSession}
                        style={{ marginTop: spacing.lg, width: '100%' }}
                      />
                    </Card>
                  )}

                  {/* Session results */}
                  {sessionResults && (
                    <Card style={{ marginTop: spacing.md, padding: spacing.md }}>
                      <Text style={{ fontSize: 16, fontWeight: '700', color: c.textHeading, marginBottom: spacing.sm }}>{t('teacher.sessionResults')}</Text>
                      <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md }}>
                        <View style={[styles.statBadge, { backgroundColor: c.success + '20' }]}>
                          <Text style={{ fontSize: 18, fontWeight: '700', color: c.success }}>{sessionResults?.summary?.present ?? 0}</Text>
                          <Text style={{ fontSize: 11, color: c.success }}>{t('teacher.present')}</Text>
                        </View>
                        <View style={[styles.statBadge, { backgroundColor: c.warning + '20' }]}>
                          <Text style={{ fontSize: 18, fontWeight: '700', color: c.warning }}>{sessionResults?.summary?.late ?? 0}</Text>
                          <Text style={{ fontSize: 11, color: c.warning }}>{t('teacher.late')}</Text>
                        </View>
                        <View style={[styles.statBadge, { backgroundColor: c.error + '20' }]}>
                          <Text style={{ fontSize: 18, fontWeight: '700', color: c.error }}>{sessionResults?.summary?.absent ?? 0}</Text>
                          <Text style={{ fontSize: 11, color: c.error }}>{t('teacher.absent')}</Text>
                        </View>
                      </View>
                      {(sessionResults?.students ?? []).map((s: any, i: number) => (
                        <View key={s?.studentId ?? i} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: c.cardBorder }}>
                          <MaterialCommunityIcons name={statusIcon(s?.status)} size={20} color={statusColor(s?.status ?? 'ABSENT')} />
                          <Text style={{ flex: 1, marginLeft: spacing.sm, fontSize: 14, color: c.textBody }}>{s?.name ?? ''}</Text>
                          <Text style={{ fontSize: 12, fontWeight: '600', color: statusColor(s?.status ?? 'ABSENT') }}>
                            {statusLabel(s?.status ?? 'ABSENT')}
                          </Text>
                        </View>
                      ))}
                    </Card>
                  )}
                </View>
              ) : (
                /* Manual Mode */
                <>
                  {(students?.length ?? 0) > 0 && (
                    <>
                      <Text style={{ fontSize: 16, fontWeight: '600', color: c.textHeading, marginBottom: spacing.sm }}>{t('teacher.students')} ({students.length})</Text>
                      {students.map((s: any) => (
                        <Pressable key={s?.studentId} onPress={() => toggleStatus(s?.studentId ?? '')}>
                          <Card style={{ marginBottom: spacing.sm, borderLeftWidth: 4, borderLeftColor: statusColor(records[s?.studentId ?? ''] ?? 'PRESENT') }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                              <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: 15, fontWeight: '600', color: c.textHeading }}>{s?.name ?? ''}</Text>
                                <Text style={{ fontSize: 12, color: c.textMuted, marginTop: 2 }}>{s?.email ?? ''}</Text>
                              </View>
                              <View style={{ paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: borderRadius.full, backgroundColor: statusColor(records[s?.studentId ?? ''] ?? 'PRESENT') + '22' }}>
                                <Text style={{ fontSize: 12, fontWeight: '600', color: statusColor(records[s?.studentId ?? ''] ?? 'PRESENT') }}>
                                  {statusLabel(records[s?.studentId ?? ''] ?? 'PRESENT')}
                                </Text>
                              </View>
                            </View>
                          </Card>
                        </Pressable>
                      ))}
                      <GradientButton title={t('teacher.saveAttendance')} onPress={saveAttendance} loading={saving} style={{ marginTop: spacing.lg }} />
                    </>
                  )}
                </>
              )}
            </>
          )}
        </ScrollView>
      )}

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
                <Text style={{ fontSize: 18, fontWeight: '600', color: c.textHeading, marginBottom: spacing.xs }}>
                  {activeSession?.groupName ?? ''}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c.success, marginRight: 6 }} />
                  <Text style={{ color: c.success, fontWeight: '600' }}>{t('teacher.sessionActive')}</Text>
                </View>

                <View style={{ backgroundColor: '#fff', padding: 24, borderRadius: borderRadius.xl, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 }}>
                  <QRCode value={activeSession?.qrCode ?? 'none'} size={220} backgroundColor="#fff" color="#000" />
                </View>

                <Text style={{ fontSize: 14, color: c.textMuted, marginTop: spacing.lg }}>{t('teacher.orEnterPin')}</Text>
                <View style={{ flexDirection: 'row', marginTop: spacing.sm, gap: 8 }}>
                  {(activeSession?.pinCode ?? '').split('').map((digit: string, i: number) => (
                    <View key={i} style={{ width: 44, height: 52, borderRadius: borderRadius.md, backgroundColor: c.card, borderWidth: 1, borderColor: c.primary, justifyContent: 'center', alignItems: 'center' }}>
                      <Text style={{ fontSize: 22, fontWeight: '800', color: c.textHeading }}>{digit}</Text>
                    </View>
                  ))}
                </View>

                <Text style={{ fontSize: 14, color: c.textMuted, marginTop: spacing.lg }}>
                  {t('teacher.checkedIn')}: {activeSession?.checkedInCount ?? 0}/{activeSession?.totalStudents ?? 0}
                </Text>

                <View style={{ flexDirection: 'row', marginTop: spacing.xl, gap: spacing.md }}>
                  <Pressable onPress={refreshSessionData} style={[styles.modalBtn, { backgroundColor: c.primary }]}>
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

const styles = StyleSheet.create({
  modeTab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 10, borderRadius: 10, gap: 6,
  },
  modeTabText: { fontSize: 14, fontWeight: '600' },
  qrPreviewBox: { alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 16 },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10,
  },
  statBadge: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 10 },
  modalBtn: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12,
  },
});
