import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, RefreshControl, TextInput, ScrollView, Modal, Platform, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '../../src/services/api';
import { ScreenContainer } from '../../src/components/ScreenContainer';
import { EmptyState } from '../../src/components/EmptyState';
import { LoadingScreen } from '../../src/components/LoadingScreen';
import { useAppColors } from '../../src/hooks/useAppColors';
import { spacing, borderRadius } from '../../src/theme';

const TYPES = [
  { key: 'ANNOUNCEMENT', label: 'Elan', icon: 'bullhorn' },
  { key: 'MESSAGE', label: 'Mesaj', icon: 'message-text' },
  { key: 'REVIEW', label: 'Rəy', icon: 'star' },
  { key: 'SURVEY', label: 'Sorğu', icon: 'poll' },
  { key: 'EVENT', label: 'Tədbir', icon: 'calendar-star' },
  { key: 'TASK', label: 'Tapşırıq', icon: 'clipboard-check' },
  { key: 'REMINDER', label: 'Xatırlatma', icon: 'alarm' },
  { key: 'MATERIAL', label: 'Material', icon: 'file-document' },
  { key: 'SYSTEM', label: 'Sistem', icon: 'cog' },
] as const;

const AUDIENCE_TYPES = [
  { key: 'ALL', label: 'Hamıya' },
  { key: 'ROLE', label: 'Rola görə' },
  { key: 'GROUP', label: 'Qrupa' },
  { key: 'COURSE', label: 'Kursa' },
  { key: 'INDIVIDUAL', label: 'Fərdi' },
] as const;

const PRIORITY_OPTIONS = [
  { key: 'LOW', label: 'Aşağı', color: '#64748B' },
  { key: 'NORMAL', label: 'Normal', color: '#3B82F6' },
  { key: 'HIGH', label: 'Yüksək', color: '#F59E0B' },
  { key: 'URGENT', label: 'Təcili', color: '#EF4444' },
] as const;

const ROLES = ['STUDENT', 'PARENT', 'TEACHER'] as const;

export default function AdminNotificationsScreen() {
  const c = useAppColors();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [detailNotif, setDetailNotif] = useState<any>(null);
  const [showDetail, setShowDetail] = useState(false);

  const fetchList = useCallback(async () => {
    try {
      const res = await api.adminGetNotifications(1, 50);
      setNotifications(res?.notifications ?? []);
    } catch (e) { console.error('AdminNotif list err', e); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useFocusEffect(useCallback(() => { fetchList(); }, [fetchList]));

  const openDetail = async (id: string) => {
    try {
      const res = await api.adminGetNotificationDetail(id);
      setDetailNotif(res);
      setShowDetail(true);
    } catch (e) { console.error('Detail err', e); }
  };

  if (loading) return <LoadingScreen />;

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={[styles.title, { color: c.textHeading }]}>Bildirişlər</Text>
        <Pressable
          onPress={() => setShowCreate(true)}
          style={({ pressed }) => [styles.createBtn, pressed && { opacity: 0.8 }]}
        >
          <LinearGradient colors={[c.primary, c.accent] as const} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.createBtnGrad}>
            <MaterialCommunityIcons name="plus" size={18} color="#FFF" />
            <Text style={styles.createBtnText}>Yeni</Text>
          </LinearGradient>
        </Pressable>
      </View>

      <View style={{ flex: 1 }}>
        <FlashList
          data={notifications}
          keyExtractor={(item: any) => item?.id ?? ''}
          renderItem={({ item }: { item: any }) => {
            const typeInfo = TYPES.find(t => t.key === item?.type) ?? TYPES[0];
            const prioInfo = PRIORITY_OPTIONS.find(p => p.key === item?.priority);
            return (
              <Pressable
                onPress={() => openDetail(item?.id)}
                style={[styles.card, { backgroundColor: c.card, borderColor: c.cardBorder }]}
              >
                <View style={styles.cardRow}>
                  <View style={[styles.iconCircle, { backgroundColor: c.primary + '20' }]}>
                    <MaterialCommunityIcons name={typeInfo.icon as any} size={20} color={c.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.cardTitle, { color: c.textHeading }]} numberOfLines={1}>{item?.titleAz ?? item?.title ?? ''}</Text>
                    <View style={styles.metaRow}>
                      <Text style={[styles.metaText, { color: c.textMuted }]}>{typeInfo.label}</Text>
                      {prioInfo && prioInfo.key !== 'NORMAL' && (
                        <View style={[styles.prioBadge, { backgroundColor: prioInfo.color + '20' }]}>
                          <Text style={[styles.prioText, { color: prioInfo.color }]}>{prioInfo.label}</Text>
                        </View>
                      )}
                      <View style={[styles.statusBadge, { backgroundColor: item?.status === 'SENT' ? '#10B98120' : item?.status === 'DRAFT' ? '#F59E0B20' : '#64748B20' }]}>
                        <Text style={{ fontSize: 10, fontWeight: '600', color: item?.status === 'SENT' ? '#10B981' : item?.status === 'DRAFT' ? '#F59E0B' : '#64748B' }}>
                          {item?.status === 'SENT' ? 'Göndərildi' : item?.status === 'DRAFT' ? 'Qaralama' : item?.status === 'SCHEDULED' ? 'Planlanıb' : item?.status ?? ''}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.statsCol}>
                    <Text style={[styles.statNum, { color: c.textHeading }]}>{item?._count?.recipients ?? 0}</Text>
                    <Text style={[styles.statLabel, { color: c.textMuted }]}>alıcı</Text>
                  </View>
                </View>
              </Pressable>
            );
          }}
          ListEmptyComponent={<EmptyState icon="bell-off-outline" message="Hələ bildiriş yoxdur" />}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchList(); }} tintColor={c.primary} />}
          contentContainerStyle={{ padding: spacing.md }}
        />
      </View>

      {/* Create Modal */}
      <CreateNotificationModal visible={showCreate} onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); fetchList(); }} colors={c} />

      {/* Detail Modal */}
      <NotificationDetailModal visible={showDetail} data={detailNotif} onClose={() => { setShowDetail(false); setDetailNotif(null); }} onAction={() => { setShowDetail(false); fetchList(); }} colors={c} />
    </ScreenContainer>
  );
}

// ── Create Notification Modal ──
function CreateNotificationModal({ visible, onClose, onCreated, colors: c }: { visible: boolean; onClose: () => void; onCreated: () => void; colors: any }) {
  const [step, setStep] = useState(0); // 0=type, 1=form
  const [selectedType, setSelectedType] = useState('ANNOUNCEMENT');
  const [form, setForm] = useState({
    title: '', message: '', priority: 'NORMAL',
    audienceType: 'ALL', audienceRoles: [] as string[], audienceGroupIds: [] as string[], audienceCourseIds: [] as string[], audienceUserIds: [] as string[],
    linkUrl: '', linkLabel: '',
    surveyTitle: '', surveyQuestions: [{ question: '', options: [''] }] as { question: string; options: string[] }[],
    eventTitle: '', eventLocation: '', eventStartsAt: '', eventEndsAt: '',
    isDraft: false,
  });
  const [audiences, setAudiences] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadAudiences = useCallback(async () => {
    try {
      const res = await api.adminGetNotificationAudiences();
      setAudiences(res);
    } catch (e) { console.error('Audiences err', e); }
  }, []);

  React.useEffect(() => { if (visible) { loadAudiences(); setStep(0); resetForm(); } }, [visible]);

  const resetForm = () => setForm({
    title: '', message: '', priority: 'NORMAL',
    audienceType: 'ALL', audienceRoles: [], audienceGroupIds: [], audienceCourseIds: [], audienceUserIds: [],
    linkUrl: '', linkLabel: '',
    surveyTitle: '', surveyQuestions: [{ question: '', options: [''] }],
    eventTitle: '', eventLocation: '', eventStartsAt: '', eventEndsAt: '',
    isDraft: false,
  });

  const handleSubmit = async (draft: boolean) => {
    if (!form.title?.trim()) { alertMsg('Başlıq daxil edin'); return; }
    setSubmitting(true);
    try {
      const payload: any = {
        titleAz: form.title, messageAz: form.message, type: selectedType,
        priority: form.priority, audienceType: form.audienceType,
        isDraft: draft,
      };
      if (form.audienceType === 'ROLE') payload.audienceRoles = form.audienceRoles;
      if (form.audienceType === 'GROUP') payload.audienceGroupIds = form.audienceGroupIds;
      if (form.audienceType === 'COURSE') payload.audienceCourseIds = form.audienceCourseIds;
      if (form.linkUrl) { payload.linkUrl = form.linkUrl; payload.linkLabel = form.linkLabel; }
      if (selectedType === 'SURVEY' && form.surveyTitle) {
        payload.survey = {
          questions: form.surveyQuestions.filter(q => q.question?.trim()).map(q => ({
            questionText: q.question,
            questionType: 'SINGLE_CHOICE',
            options: q.options.filter(o => o?.trim()),
          })),
        };
      }
      if (selectedType === 'EVENT' && form.eventTitle) {
        payload.event = {
          eventDate: form.eventStartsAt || new Date().toISOString(),
          eventTime: form.eventEndsAt || undefined,
          location: form.eventLocation || undefined,
        };
      }
      await api.adminCreateNotification(payload);
      onCreated();
    } catch (e: any) {
      alertMsg(e?.message ?? 'Xəta baş verdi');
    } finally { setSubmitting(false); }
  };

  const alertMsg = (msg: string) => {
    if (Platform.OS === 'web') { window.alert(msg); } else { Alert.alert('', msg); }
  };

  const toggleRole = (role: string) => {
    setForm(f => ({ ...f, audienceRoles: f.audienceRoles.includes(role) ? f.audienceRoles.filter(r => r !== role) : [...f.audienceRoles, role] }));
  };
  const toggleGroup = (id: string) => {
    setForm(f => ({ ...f, audienceGroupIds: f.audienceGroupIds.includes(id) ? f.audienceGroupIds.filter(g => g !== id) : [...f.audienceGroupIds, id] }));
  };
  const toggleCourse = (id: string) => {
    setForm(f => ({ ...f, audienceCourseIds: f.audienceCourseIds.includes(id) ? f.audienceCourseIds.filter(co => co !== id) : [...f.audienceCourseIds, id] }));
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: c.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: c.textHeading }]}>{step === 0 ? 'Bildiriş növü' : 'Bildiriş yarat'}</Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <MaterialCommunityIcons name="close" size={24} color={c.textMuted} />
            </Pressable>
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.md }}>
            {step === 0 ? (
              <View style={styles.typeGrid}>
                {TYPES.map(t => (
                  <Pressable
                    key={t.key}
                    onPress={() => { setSelectedType(t.key); setStep(1); }}
                    style={[styles.typeCard, { backgroundColor: c.card, borderColor: c.cardBorder }]}
                  >
                    <View style={[styles.typeIconCircle, { backgroundColor: c.primary + '20' }]}>
                      <MaterialCommunityIcons name={t.icon as any} size={24} color={c.primary} />
                    </View>
                    <Text style={[styles.typeLabel, { color: c.textHeading }]}>{t.label}</Text>
                  </Pressable>
                ))}
              </View>
            ) : (
              <View style={{ gap: spacing.md }}>
                {/* Type badge */}
                <View style={[styles.selectedTypeBadge, { backgroundColor: c.primary + '15' }]}>
                  <MaterialCommunityIcons name={(TYPES.find(t => t.key === selectedType)?.icon ?? 'bell') as any} size={16} color={c.primary} />
                  <Text style={{ color: c.primary, fontSize: 13, fontWeight: '600' }}>{TYPES.find(t => t.key === selectedType)?.label}</Text>
                  <Pressable onPress={() => setStep(0)}><Text style={{ color: c.textMuted, fontSize: 12 }}>dəyiş</Text></Pressable>
                </View>

                {/* Title */}
                <View>
                  <Text style={[styles.fieldLabel, { color: c.textBody }]}>Başlıq *</Text>
                  <TextInput
                    style={[styles.input, { color: c.textHeading, backgroundColor: c.card, borderColor: c.cardBorder }]}
                    value={form.title}
                    onChangeText={v => setForm(f => ({ ...f, title: v }))}
                    placeholder="Bildiriş başlığı"
                    placeholderTextColor={c.textMuted}
                  />
                </View>

                {/* Message */}
                <View>
                  <Text style={[styles.fieldLabel, { color: c.textBody }]}>Mətn</Text>
                  <TextInput
                    style={[styles.input, styles.textArea, { color: c.textHeading, backgroundColor: c.card, borderColor: c.cardBorder }]}
                    value={form.message}
                    onChangeText={v => setForm(f => ({ ...f, message: v }))}
                    placeholder="Bildiriş mətni"
                    placeholderTextColor={c.textMuted}
                    multiline
                    numberOfLines={4}
                  />
                </View>

                {/* Priority */}
                <View>
                  <Text style={[styles.fieldLabel, { color: c.textBody }]}>Prioritet</Text>
                  <View style={styles.chipRow}>
                    {PRIORITY_OPTIONS.map(p => (
                      <Pressable
                        key={p.key}
                        onPress={() => setForm(f => ({ ...f, priority: p.key }))}
                        style={[styles.chip, { backgroundColor: form.priority === p.key ? p.color + '20' : c.card, borderColor: form.priority === p.key ? p.color : c.cardBorder }]}
                      >
                        <Text style={{ color: form.priority === p.key ? p.color : c.textMuted, fontSize: 12, fontWeight: '600' }}>{p.label}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                {/* Audience */}
                <View>
                  <Text style={[styles.fieldLabel, { color: c.textBody }]}>Hədəf auditoriya</Text>
                  <View style={styles.chipRow}>
                    {AUDIENCE_TYPES.map(a => (
                      <Pressable
                        key={a.key}
                        onPress={() => setForm(f => ({ ...f, audienceType: a.key }))}
                        style={[styles.chip, { backgroundColor: form.audienceType === a.key ? c.primary + '20' : c.card, borderColor: form.audienceType === a.key ? c.primary : c.cardBorder }]}
                      >
                        <Text style={{ color: form.audienceType === a.key ? c.primary : c.textMuted, fontSize: 12, fontWeight: '600' }}>{a.label}</Text>
                      </Pressable>
                    ))}
                  </View>
                  {form.audienceType === 'ROLE' && (
                    <View style={[styles.subSection, { borderColor: c.cardBorder }]}>
                      {ROLES.map(r => (
                        <Pressable key={r} onPress={() => toggleRole(r)} style={styles.checkRow}>
                          <MaterialCommunityIcons name={form.audienceRoles.includes(r) ? 'checkbox-marked' : 'checkbox-blank-outline'} size={20} color={c.primary} />
                          <Text style={{ color: c.textBody, fontSize: 14 }}>{r === 'STUDENT' ? 'Tələbələr' : r === 'PARENT' ? 'Valideynlər' : 'Müəllimlər'}</Text>
                        </Pressable>
                      ))}
                    </View>
                  )}
                  {form.audienceType === 'GROUP' && audiences?.groups && (
                    <View style={[styles.subSection, { borderColor: c.cardBorder }]}>
                      {(audiences.groups ?? []).map((g: any) => (
                        <Pressable key={g.id} onPress={() => toggleGroup(g.id)} style={styles.checkRow}>
                          <MaterialCommunityIcons name={form.audienceGroupIds.includes(g.id) ? 'checkbox-marked' : 'checkbox-blank-outline'} size={20} color={c.primary} />
                          <Text style={{ color: c.textBody, fontSize: 14 }}>{g.name} - {g.course?.name ?? ''}</Text>
                        </Pressable>
                      ))}
                    </View>
                  )}
                  {form.audienceType === 'COURSE' && audiences?.courses && (
                    <View style={[styles.subSection, { borderColor: c.cardBorder }]}>
                      {(audiences.courses ?? []).map((co: any) => (
                        <Pressable key={co.id} onPress={() => toggleCourse(co.id)} style={styles.checkRow}>
                          <MaterialCommunityIcons name={form.audienceCourseIds.includes(co.id) ? 'checkbox-marked' : 'checkbox-blank-outline'} size={20} color={c.primary} />
                          <Text style={{ color: c.textBody, fontSize: 14 }}>{co.name}</Text>
                        </Pressable>
                      ))}
                    </View>
                  )}
                </View>

                {/* Link */}
                <View>
                  <Text style={[styles.fieldLabel, { color: c.textBody }]}>Keçid (isteğe bağlı)</Text>
                  <TextInput
                    style={[styles.input, { color: c.textHeading, backgroundColor: c.card, borderColor: c.cardBorder }]}
                    value={form.linkUrl}
                    onChangeText={v => setForm(f => ({ ...f, linkUrl: v }))}
                    placeholder="https://..."
                    placeholderTextColor={c.textMuted}
                  />
                </View>

                {/* Survey Questions */}
                {selectedType === 'SURVEY' && (
                  <View>
                    <Text style={[styles.fieldLabel, { color: c.textBody }]}>Sorğu başlığı</Text>
                    <TextInput
                      style={[styles.input, { color: c.textHeading, backgroundColor: c.card, borderColor: c.cardBorder }]}
                      value={form.surveyTitle}
                      onChangeText={v => setForm(f => ({ ...f, surveyTitle: v }))}
                      placeholder="Sorğu adı"
                      placeholderTextColor={c.textMuted}
                    />
                    {form.surveyQuestions.map((sq, qi) => (
                      <View key={qi} style={[styles.surveyQBlock, { borderColor: c.cardBorder }]}>
                        <Text style={[styles.fieldLabel, { color: c.textBody }]}>Sual {qi + 1}</Text>
                        <TextInput
                          style={[styles.input, { color: c.textHeading, backgroundColor: c.card, borderColor: c.cardBorder }]}
                          value={sq.question}
                          onChangeText={v => {
                            const qs = [...form.surveyQuestions];
                            qs[qi] = { ...qs[qi], question: v };
                            setForm(f => ({ ...f, surveyQuestions: qs }));
                          }}
                          placeholder="Sualınız"
                          placeholderTextColor={c.textMuted}
                        />
                        {sq.options.map((opt, oi) => (
                          <View key={oi} style={styles.optionRow}>
                            <TextInput
                              style={[styles.input, { flex: 1, color: c.textHeading, backgroundColor: c.card, borderColor: c.cardBorder }]}
                              value={opt}
                              onChangeText={v => {
                                const qs = [...form.surveyQuestions];
                                const opts = [...qs[qi].options];
                                opts[oi] = v;
                                qs[qi] = { ...qs[qi], options: opts };
                                setForm(f => ({ ...f, surveyQuestions: qs }));
                              }}
                              placeholder={`Seçim ${oi + 1}`}
                              placeholderTextColor={c.textMuted}
                            />
                            {sq.options.length > 1 && (
                              <Pressable onPress={() => {
                                const qs = [...form.surveyQuestions];
                                qs[qi] = { ...qs[qi], options: qs[qi].options.filter((_, i) => i !== oi) };
                                setForm(f => ({ ...f, surveyQuestions: qs }));
                              }}>
                                <MaterialCommunityIcons name="close-circle" size={20} color={c.textMuted} />
                              </Pressable>
                            )}
                          </View>
                        ))}
                        <Pressable onPress={() => {
                          const qs = [...form.surveyQuestions];
                          qs[qi] = { ...qs[qi], options: [...qs[qi].options, ''] };
                          setForm(f => ({ ...f, surveyQuestions: qs }));
                        }} style={styles.addOptBtn}>
                          <MaterialCommunityIcons name="plus" size={16} color={c.primary} />
                          <Text style={{ color: c.primary, fontSize: 12 }}>Seçim əlavə et</Text>
                        </Pressable>
                      </View>
                    ))}
                    <Pressable onPress={() => setForm(f => ({ ...f, surveyQuestions: [...f.surveyQuestions, { question: '', options: [''] }] }))} style={[styles.addOptBtn, { marginTop: spacing.sm }]}>
                      <MaterialCommunityIcons name="plus" size={16} color={c.primary} />
                      <Text style={{ color: c.primary, fontSize: 13 }}>Sual əlavə et</Text>
                    </Pressable>
                  </View>
                )}

                {/* Event */}
                {selectedType === 'EVENT' && (
                  <View style={{ gap: spacing.sm }}>
                    <Text style={[styles.fieldLabel, { color: c.textBody }]}>Tədbir məlumatları</Text>
                    <TextInput
                      style={[styles.input, { color: c.textHeading, backgroundColor: c.card, borderColor: c.cardBorder }]}
                      value={form.eventTitle}
                      onChangeText={v => setForm(f => ({ ...f, eventTitle: v }))}
                      placeholder="Tədbir adı"
                      placeholderTextColor={c.textMuted}
                    />
                    <TextInput
                      style={[styles.input, { color: c.textHeading, backgroundColor: c.card, borderColor: c.cardBorder }]}
                      value={form.eventLocation}
                      onChangeText={v => setForm(f => ({ ...f, eventLocation: v }))}
                      placeholder="Məkan"
                      placeholderTextColor={c.textMuted}
                    />
                  </View>
                )}

                {/* Buttons */}
                <View style={styles.btnRow}>
                  <Pressable
                    onPress={() => handleSubmit(true)}
                    disabled={submitting}
                    style={[styles.draftBtn, { borderColor: c.primary }]}
                  >
                    <Text style={{ color: c.primary, fontWeight: '600', fontSize: 14 }}>Qaralama</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => handleSubmit(false)}
                    disabled={submitting}
                    style={{ flex: 1 }}
                  >
                    <LinearGradient colors={[c.primary, c.accent] as const} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.sendBtn}>
                      <MaterialCommunityIcons name="send" size={16} color="#FFF" />
                      <Text style={styles.sendBtnText}>{submitting ? 'Göndərilir...' : 'Göndər'}</Text>
                    </LinearGradient>
                  </Pressable>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ── Notification Detail Modal ──
function NotificationDetailModal({ visible, data, onClose, onAction, colors: c }: { visible: boolean; data: any; onClose: () => void; onAction: () => void; colors: any }) {
  if (!data) return null;
  const n = data;
  const readCount = n?.recipients?.filter((r: any) => r?.isRead)?.length ?? 0;
  const totalRecipients = n?.recipients?.length ?? 0;
  const readPct = totalRecipients > 0 ? Math.round((readCount / totalRecipients) * 100) : 0;

  const handleSend = async () => {
    try {
      await api.adminSendNotification(n.id);
      onAction();
    } catch (e: any) {
      if (Platform.OS === 'web') window.alert(e?.message ?? 'Xəta');
      else Alert.alert('', e?.message ?? 'Xəta');
    }
  };

  const handleCancel = async () => {
    try {
      await api.adminCancelNotification(n.id);
      onAction();
    } catch (e: any) {
      if (Platform.OS === 'web') window.alert(e?.message ?? 'Xəta');
      else Alert.alert('', e?.message ?? 'Xəta');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: c.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: c.textHeading }]} numberOfLines={1}>Bildiriş detalları</Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <MaterialCommunityIcons name="close" size={24} color={c.textMuted} />
            </Pressable>
          </View>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.md, gap: spacing.md }}>
            <Text style={[styles.detailTitle, { color: c.textHeading }]}>{n?.titleAz ?? n?.title ?? ''}</Text>
            <Text style={[styles.detailMsg, { color: c.textBody }]}>{n?.messageAz ?? n?.message ?? ''}</Text>

            {/* Stats */}
            <View style={[styles.statsRow, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
              <View style={styles.statBox}>
                <Text style={[styles.statBigNum, { color: c.primary }]}>{totalRecipients}</Text>
                <Text style={[styles.statSmLabel, { color: c.textMuted }]}>Alıcı</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={[styles.statBigNum, { color: '#10B981' }]}>{readCount}</Text>
                <Text style={[styles.statSmLabel, { color: c.textMuted }]}>Oxuyub</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={[styles.statBigNum, { color: c.accent }]}>{readPct}%</Text>
                <Text style={[styles.statSmLabel, { color: c.textMuted }]}>Oxunma</Text>
              </View>
            </View>

            {/* Survey responses */}
            {n?.survey && (
              <View style={[styles.sectionCard, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
                <Text style={[styles.sectionTitle, { color: c.textHeading }]}>Sorğu nəticələri</Text>
                {(n.survey.questions ?? []).map((q: any) => {
                  const responses = n?.surveyResponses?.filter((r: any) => r?.questionId === q?.id) ?? [];
                  return (
                    <View key={q?.id} style={{ marginTop: spacing.sm }}>
                      <Text style={[{ color: c.textBody, fontSize: 14, fontWeight: '600' }]}>{q?.question}</Text>
                      {(q?.options ?? []).map((opt: string, i: number) => {
                        const count = responses.filter((r: any) => r?.answer === opt)?.length ?? 0;
                        return (
                          <View key={i} style={styles.optStat}>
                            <Text style={{ color: c.textBody, fontSize: 13, flex: 1 }}>{opt}</Text>
                            <Text style={{ color: c.primary, fontSize: 13, fontWeight: '600' }}>{count}</Text>
                          </View>
                        );
                      })}
                    </View>
                  );
                })}
              </View>
            )}

            {/* Event RSVPs */}
            {n?.event && (
              <View style={[styles.sectionCard, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
                <Text style={[styles.sectionTitle, { color: c.textHeading }]}>Tədbir RSVP</Text>
                <View style={styles.rsvpRow}>
                  <View style={[styles.rsvpBox, { backgroundColor: '#10B98115' }]}>
                    <Text style={{ color: '#10B981', fontSize: 18, fontWeight: '700' }}>{n.event.rsvps?.filter((r: any) => r?.attending)?.length ?? 0}</Text>
                    <Text style={{ color: '#10B981', fontSize: 11 }}>Gələcək</Text>
                  </View>
                  <View style={[styles.rsvpBox, { backgroundColor: '#EF444415' }]}>
                    <Text style={{ color: '#EF4444', fontSize: 18, fontWeight: '700' }}>{n.event.rsvps?.filter((r: any) => !r?.attending)?.length ?? 0}</Text>
                    <Text style={{ color: '#EF4444', fontSize: 11 }}>Gəlməyəcək</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Actions */}
            {n?.status === 'DRAFT' && (
              <View style={styles.btnRow}>
                <Pressable onPress={handleCancel} style={[styles.draftBtn, { borderColor: '#EF4444' }]}>
                  <Text style={{ color: '#EF4444', fontWeight: '600' }}>Ləğv et</Text>
                </Pressable>
                <Pressable onPress={handleSend} style={{ flex: 1 }}>
                  <LinearGradient colors={[c.primary, c.accent] as const} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.sendBtn}>
                    <MaterialCommunityIcons name="send" size={16} color="#FFF" />
                    <Text style={styles.sendBtnText}>Göndər</Text>
                  </LinearGradient>
                </Pressable>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.md },
  title: { fontSize: 22, fontWeight: '700' },
  createBtn: { borderRadius: borderRadius.md, overflow: 'hidden' },
  createBtnGrad: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, paddingVertical: 8, borderRadius: borderRadius.md },
  createBtnText: { color: '#FFF', fontWeight: '600', fontSize: 14 },

  card: { borderRadius: borderRadius.lg, borderWidth: 1, padding: spacing.md, marginBottom: spacing.sm },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  iconCircle: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 15, fontWeight: '600' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  metaText: { fontSize: 11 },
  prioBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  prioText: { fontSize: 10, fontWeight: '600' },
  statusBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  statsCol: { alignItems: 'center' },
  statNum: { fontSize: 16, fontWeight: '700' },
  statLabel: { fontSize: 10 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { height: '90%', borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.md, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  modalTitle: { fontSize: 18, fontWeight: '700' },

  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  typeCard: { width: '47%', borderRadius: borderRadius.lg, borderWidth: 1, padding: spacing.md, alignItems: 'center', gap: spacing.sm },
  typeIconCircle: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  typeLabel: { fontSize: 14, fontWeight: '600' },

  selectedTypeBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, alignSelf: 'flex-start' },
  fieldLabel: { fontSize: 13, fontWeight: '600', marginBottom: 4 },
  input: { borderWidth: 1, borderRadius: borderRadius.md, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1 },
  subSection: { marginTop: spacing.sm, paddingTop: spacing.sm, borderTopWidth: 1, gap: 6 },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },

  surveyQBlock: { marginTop: spacing.sm, paddingTop: spacing.sm, borderTopWidth: 1, gap: 6 },
  optionRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  addOptBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },

  btnRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  draftBtn: { borderWidth: 1.5, borderRadius: borderRadius.md, paddingHorizontal: 16, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
  sendBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: borderRadius.md },
  sendBtnText: { color: '#FFF', fontWeight: '600', fontSize: 14 },

  detailTitle: { fontSize: 20, fontWeight: '700' },
  detailMsg: { fontSize: 14, lineHeight: 20 },
  statsRow: { flexDirection: 'row', borderRadius: borderRadius.lg, borderWidth: 1, padding: spacing.md },
  statBox: { flex: 1, alignItems: 'center' },
  statBigNum: { fontSize: 22, fontWeight: '700' },
  statSmLabel: { fontSize: 11, marginTop: 2 },
  sectionCard: { borderRadius: borderRadius.lg, borderWidth: 1, padding: spacing.md },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  optStat: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  rsvpRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  rsvpBox: { flex: 1, alignItems: 'center', paddingVertical: spacing.sm, borderRadius: borderRadius.md },
});
