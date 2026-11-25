import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, RefreshControl, Platform, Alert, Linking } from 'react-native';

const openExternalUrl = (url: string) => {
  if (!url) return;
  if (Platform.OS === 'web') {
    try { window.open(url, '_blank', 'noopener,noreferrer'); } catch { window.location.href = url; }
  } else {
    Linking.openURL(url).catch(() => Alert.alert('Xəta', 'Link açıla bilmədi'));
  }
};
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { FlashList } from '@shopify/flash-list';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '../src/services/api';
import { useAuth } from '../src/contexts/AuthContext';
import { ScreenContainer } from '../src/components/ScreenContainer';
import { EmptyState } from '../src/components/EmptyState';
import { LoadingScreen } from '../src/components/LoadingScreen';
import { useAppColors } from '../src/hooks/useAppColors';
import { spacing, borderRadius } from '../src/theme';
import i18n from '../src/i18n';

const TYPE_STYLES: Record<string, { icon: string; color: string }> = {
  ANNOUNCEMENT: { icon: 'bullhorn', color: '#7C3AED' },
  MESSAGE: { icon: 'message-text', color: '#3B82F6' },
  REVIEW: { icon: 'star', color: '#F59E0B' },
  SURVEY: { icon: 'poll', color: '#06B6D4' },
  EVENT: { icon: 'calendar-star', color: '#EC4899' },
  REGISTRATION: { icon: 'account-plus', color: '#10B981' },
  TASK: { icon: 'clipboard-check', color: '#8B5CF6' },
  REMINDER: { icon: 'alarm', color: '#F97316' },
  MATERIAL: { icon: 'file-document', color: '#14B8A6' },
  SYSTEM: { icon: 'cog', color: '#64748B' },
  GENERAL: { icon: 'bell', color: '#64748B' },
  // Legacy types
  announcement: { icon: 'bullhorn', color: '#7C3AED' },
  badge: { icon: 'shield-star', color: '#10B981' },
  exam: { icon: 'clipboard-text-clock', color: '#3B82F6' },
  lesson: { icon: 'book-open-variant', color: '#F59E0B' },
  group: { icon: 'account-group', color: '#EC4899' },
  review: { icon: 'message-text', color: '#06B6D4' },
  general: { icon: 'bell', color: '#64748B' },
};

const TYPE_LABELS: Record<string, string> = {
  ANNOUNCEMENT: 'Elan', MESSAGE: 'Mesaj', REVIEW: 'Rəy', SURVEY: 'Sorğu',
  EVENT: 'Tədbir', REGISTRATION: 'Qeydiyyat', TASK: 'Tapşırıq', REMINDER: 'Xatırlatma',
  MATERIAL: 'Material', SYSTEM: 'Sistem', GENERAL: 'Ümumi',
};

const PRIO_COLORS: Record<string, string> = {
  URGENT: '#EF4444', HIGH: '#F59E0B', NORMAL: '#3B82F6', LOW: '#64748B',
};

export default function NotificationsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const c = useAppColors();
  const { user } = useAuth();
  const role = user?.role ?? 'STUDENT';
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Role-based API calls
  const fetchApi = useCallback(() => {
    if (role === 'PARENT') return api.parentGetNotifications(1, 50);
    if (role === 'TEACHER') return api.teacherGetNotifications(1, 50);
    return api.getNotifications(1, 50, i18n.language);
  }, [role]);

  const markReadApi = useCallback((id: string) => {
    if (role === 'PARENT') return api.parentMarkNotificationRead(id);
    if (role === 'TEACHER') return api.teacherMarkNotificationRead(id);
    return api.markNotificationRead(id);
  }, [role]);

  const markAllReadApi = useCallback(() => {
    if (role === 'PARENT') return api.parentMarkAllNotificationsRead();
    if (role === 'TEACHER') return api.teacherMarkAllNotificationsRead();
    return api.markAllNotificationsRead();
  }, [role]);

  const surveyRespondApi = useCallback((qId: string, answer: string) => {
    if (role === 'PARENT') return api.parentRespondToSurvey(qId, answer);
    if (role === 'TEACHER') return api.teacherRespondToSurvey(qId, answer);
    return api.studentRespondToSurvey(qId, answer);
  }, [role]);

  const rsvpApi = useCallback((eventId: string, attending: boolean) => {
    if (role === 'PARENT') return api.parentRsvpEvent(eventId, attending);
    if (role === 'TEACHER') return api.teacherRsvpEvent(eventId, attending);
    return api.studentRsvpEvent(eventId, attending);
  }, [role]);

  const fetchNotifs = useCallback(async () => {
    try {
      const res = await fetchApi();
      setNotifications(res?.notifications ?? []);
    } catch (e) {
      console.error('Notifications error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [fetchApi]);

  useFocusEffect(useCallback(() => { fetchNotifs(); }, [fetchNotifs]));

  const markRead = async (id: string) => {
    try {
      await markReadApi(id);
      setNotifications(prev => (prev ?? []).map(n => n?.id === id ? { ...(n ?? {}), isRead: true } : n));
    } catch {}
  };

  const markAllRead = async () => {
    try {
      await markAllReadApi();
      setNotifications(prev => (prev ?? []).map(n => ({ ...(n ?? {}), isRead: true })));
    } catch {}
  };

  const handleSurveyRespond = async (questionId: string, answer: string) => {
    try {
      await surveyRespondApi(questionId, answer);
      if (Platform.OS === 'web') window.alert('Cavab göndərildi');
      else Alert.alert('', 'Cavab göndərildi');
      fetchNotifs();
    } catch (e: any) {
      const msg = e?.message ?? 'Xəta';
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('', msg);
    }
  };

  const handleRsvp = async (eventId: string, attending: boolean) => {
    try {
      await rsvpApi(eventId, attending);
      if (Platform.OS === 'web') window.alert(attending ? 'Qatılacağınız qeyd edildi' : 'Qatılmayacağınız qeyd edildi');
      else Alert.alert('', attending ? 'Qatılacağınız qeyd edildi' : 'Qatılmayacağınız qeyd edildi');
      fetchNotifs();
    } catch (e: any) {
      const msg = e?.message ?? 'Xəta';
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('', msg);
    }
  };

  const timeAgo = (dateStr: string) => {
    try {
      const diff = Date.now() - new Date(dateStr).getTime();
      const mins = Math.floor(diff / 60000);
      if (mins < 1) return 'indi';
      if (mins < 60) return `${mins}d`;
      const hours = Math.floor(mins / 60);
      if (hours < 24) return `${hours}s`;
      const days = Math.floor(hours / 24);
      if (days < 7) return `${days}g`;
      return `${Math.floor(days / 7)}h`;
    } catch { return ''; }
  };

  if (loading) return <LoadingScreen />;

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={c.textHeading} />
        </Pressable>
        <Text style={[styles.title, { color: c.textHeading }]}>{t('notifications.title')}</Text>
        <Pressable onPress={markAllRead} style={styles.markAllBtn}>
          <MaterialCommunityIcons name="check-all" size={18} color={c.primary} />
          <Text style={[styles.markAllText, { color: c.primary }]}>{t('notifications.markAllRead')}</Text>
        </Pressable>
      </View>

      <View style={{ flex: 1 }}>
        <FlashList
          data={notifications}
          keyExtractor={(item: any) => item?.id ?? Math.random().toString()}
          renderItem={({ item }: { item: any }) => {
            const type = item?.type ?? 'GENERAL';
            const ts = TYPE_STYLES[type] ?? TYPE_STYLES.GENERAL;
            const isRead = item?.isRead ?? false;
            const isExpanded = expandedId === item?.id;
            const prio = item?.priority;
            const prioColor = PRIO_COLORS[prio] ?? PRIO_COLORS.NORMAL;

            return (
              <Pressable
                onPress={() => {
                  if (!isRead) markRead(item?.id);
                  setExpandedId(isExpanded ? null : item?.id);
                }}
                style={[styles.notifCard, { backgroundColor: isRead ? c.card : ts.color + '08', borderColor: isRead ? c.cardBorder : ts.color + '30' }]}
              >
                <View style={[styles.notifStripe, { backgroundColor: ts.color }]} />
                <View style={styles.notifBody}>
                  <View style={styles.notifTopRow}>
                    <View style={[styles.notifIconCircle, { backgroundColor: ts.color + '20' }]}>
                      <MaterialCommunityIcons name={ts.icon as any} size={20} color={ts.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={styles.notifLabelRow}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={[styles.notifLabel, { color: ts.color }]}>{TYPE_LABELS[type] ?? type}</Text>
                          {prio && prio !== 'NORMAL' && (
                            <View style={[styles.prioBadge, { backgroundColor: prioColor + '20' }]}>
                              <Text style={{ color: prioColor, fontSize: 9, fontWeight: '700' }}>
                                {prio === 'URGENT' ? 'TƏCİLİ' : prio === 'HIGH' ? 'YÜKSƏK' : 'AŞAĞI'}
                              </Text>
                            </View>
                          )}
                        </View>
                        <Text style={[styles.notifTime, { color: c.textMuted }]}>{timeAgo(item?.createdAt ?? '')}</Text>
                      </View>
                      <Text style={[styles.notifTitle, { color: isRead ? c.textMuted : c.textHeading }]}>{item?.title ?? ''}</Text>
                    </View>
                    {!isRead && <View style={[styles.unreadDot, { backgroundColor: ts.color }]} />}
                  </View>

                  <Text style={[styles.notifMessage, { color: c.textBody }]} numberOfLines={isExpanded ? undefined : 2}>{item?.message ?? ''}</Text>

                  {/* Sender */}
                  {item?.sender?.name && (
                    <Text style={[styles.senderText, { color: c.textMuted }]}>Göndərən: {item.sender.name}</Text>
                  )}

                  {/* Expanded content */}
                  {isExpanded && (
                    <View style={{ marginTop: spacing.sm, gap: spacing.sm }}>
                      {/* Link */}
                      {item?.linkUrl && (
                        <Pressable onPress={() => openExternalUrl(item.linkUrl)} style={[styles.linkBtn, { borderColor: c.primary }]}>
                          <MaterialCommunityIcons name="open-in-new" size={14} color={c.primary} />
                          <Text style={{ color: c.primary, fontSize: 13, fontWeight: '600' }}>{item?.linkLabel || 'Keçid'}</Text>
                        </Pressable>
                      )}

                      {/* Attachments */}
                      {(item?.attachments?.length ?? 0) > 0 && (
                        <View style={{ gap: 4 }}>
                          <Text style={[styles.subLabel, { color: c.textMuted }]}>Əlavələr:</Text>
                          {(item.attachments ?? []).map((att: any) => (
                            <Pressable key={att?.id} onPress={() => att?.fileUrl && openExternalUrl(att.fileUrl)} style={styles.attachRow}>
                              <MaterialCommunityIcons name="paperclip" size={14} color={c.primary} />
                              <Text style={{ color: c.primary, fontSize: 12 }}>{att?.fileName ?? 'Fayl'}</Text>
                            </Pressable>
                          ))}
                        </View>
                      )}

                      {/* Survey */}
                      {item?.survey && (
                        <View style={[styles.surveyBox, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
                          <Text style={[styles.subLabel, { color: c.textHeading }]}>📊 {item.survey.title ?? 'Sorğu'}</Text>
                          {(item.survey.questions ?? []).map((q: any) => (
                            <View key={q?.id} style={{ marginTop: 6 }}>
                              <Text style={[{ color: c.textBody, fontSize: 13, fontWeight: '600' }]}>{q?.questionText ?? q?.question ?? ''}</Text>
                              <View style={{ gap: 4, marginTop: 4 }}>
                                {(q?.options ?? []).map((opt: string, i: number) => (
                                  <Pressable
                                    key={i}
                                    onPress={() => handleSurveyRespond(q.id, opt)}
                                    style={[styles.optionBtn, { borderColor: c.primary + '40' }]}
                                  >
                                    <MaterialCommunityIcons name="radiobox-blank" size={16} color={c.primary} />
                                    <Text style={{ color: c.textBody, fontSize: 13 }}>{opt}</Text>
                                  </Pressable>
                                ))}
                              </View>
                            </View>
                          ))}
                        </View>
                      )}

                      {/* Event */}
                      {item?.event && (
                        <View style={[styles.eventBox, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
                          <Text style={[styles.subLabel, { color: c.textHeading }]}>📅 {item.event.title ?? 'Tədbir'}</Text>
                          {item.event.location && (
                            <View style={styles.eventInfoRow}>
                              <MaterialCommunityIcons name="map-marker" size={14} color={c.textMuted} />
                              <Text style={{ color: c.textBody, fontSize: 12 }}>{item.event.location}</Text>
                            </View>
                          )}
                          {item.event.startsAt && (
                            <View style={styles.eventInfoRow}>
                              <MaterialCommunityIcons name="clock" size={14} color={c.textMuted} />
                              <Text style={{ color: c.textBody, fontSize: 12 }}>{new Date(item.event.startsAt).toLocaleString('az-AZ')}</Text>
                            </View>
                          )}
                          <View style={styles.rsvpBtns}>
                            <Pressable onPress={() => handleRsvp(item.event.id, true)} style={[styles.rsvpBtn, { backgroundColor: '#10B98115', borderColor: '#10B981' }]}>
                              <MaterialCommunityIcons name="check" size={16} color="#10B981" />
                              <Text style={{ color: '#10B981', fontSize: 12, fontWeight: '600' }}>Gələcəyəm</Text>
                            </Pressable>
                            <Pressable onPress={() => handleRsvp(item.event.id, false)} style={[styles.rsvpBtn, { backgroundColor: '#EF444415', borderColor: '#EF4444' }]}>
                              <MaterialCommunityIcons name="close" size={16} color="#EF4444" />
                              <Text style={{ color: '#EF4444', fontSize: 12, fontWeight: '600' }}>Gəlməyəcəyəm</Text>
                            </Pressable>
                          </View>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              </Pressable>
            );
          }}
          ListEmptyComponent={<EmptyState icon="bell-off-outline" message={t('notifications.noNotifications')} />}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchNotifs(); }} tintColor={c.primary} />}
          contentContainerStyle={{ padding: spacing.md }}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, gap: spacing.sm },
  backBtn: { width: 44, height: 44, justifyContent: 'center' },
  title: { flex: 1, fontSize: 22, fontWeight: '700' },
  markAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  markAllText: { fontSize: 12, fontWeight: '600' },

  notifCard: { borderRadius: borderRadius.lg, borderWidth: 1, marginBottom: spacing.sm, overflow: 'hidden', flexDirection: 'row' },
  notifStripe: { width: 4 },
  notifBody: { flex: 1, padding: spacing.md },
  notifTopRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  notifIconCircle: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  notifLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  notifLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  notifTime: { fontSize: 11 },
  notifTitle: { fontSize: 15, fontWeight: '600', marginTop: 2 },
  notifMessage: { fontSize: 13, marginTop: 6, lineHeight: 18 },
  unreadDot: { width: 8, height: 8, borderRadius: 4 },
  prioBadge: { paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4 },
  senderText: { fontSize: 11, marginTop: 4 },
  subLabel: { fontSize: 13, fontWeight: '600' },
  linkBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: borderRadius.sm, paddingHorizontal: 10, paddingVertical: 6, alignSelf: 'flex-start' },
  attachRow: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 2 },

  surveyBox: { borderRadius: borderRadius.md, borderWidth: 1, padding: spacing.sm },
  optionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: borderRadius.sm, paddingHorizontal: 10, paddingVertical: 6 },

  eventBox: { borderRadius: borderRadius.md, borderWidth: 1, padding: spacing.sm },
  eventInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  rsvpBtns: { flexDirection: 'row', gap: 8, marginTop: spacing.sm },
  rsvpBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, borderWidth: 1, borderRadius: borderRadius.sm, paddingVertical: 8 },
});
