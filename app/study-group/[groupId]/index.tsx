import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, Pressable, TextInput, StyleSheet, Modal, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Toast from 'react-native-toast-message';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { api } from '../../../src/services/api';
import { ScreenContainer } from '../../../src/components/ScreenContainer';
import { Card } from '../../../src/components/Card';
import { EmptyState } from '../../../src/components/EmptyState';
import { LoadingScreen } from '../../../src/components/LoadingScreen';
import { useAppColors } from '../../../src/hooks/useAppColors';
import { spacing, borderRadius } from '../../../src/theme';
import i18n from '../../../src/i18n';
import { useRouter } from 'expo-router';

type TabType = 'questions' | 'leaderboard' | 'badges';

export default function StudyGroupDetailScreen() {
  const { groupId = '' } = useLocalSearchParams<{ groupId: string }>();
  const { t } = useTranslation();
  const c = useAppColors();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('questions');
  const [group, setGroup] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [badges, setBadges] = useState<any[]>([]);
  const [leaderboardPeriod, setLeaderboardPeriod] = useState<'weekly' | 'alltime'>('weekly');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUserRank, setCurrentUserRank] = useState(0);
  const [badgeStats, setBadgeStats] = useState({ totalEarned: 0, totalAvailable: 0 });

  // Create question state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newQ, setNewQ] = useState({ questionText: '', options: ['', '', '', ''], correctIndex: 0, difficulty: 'MEDIUM' });
  const [creating, setCreating] = useState(false);
  const [questionImage, setQuestionImage] = useState<{ uri: string; publicUrl?: string } | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const fetchData = useCallback(async () => {
    if (!groupId) return;
    try {
      const [detailRes, questionsRes] = await Promise.all([
        api.getStudyGroupDetail(groupId, i18n.language),
        api.getStudyGroupQuestions(groupId),
      ]);
      setGroup(detailRes?.group ?? null);
      setStats(detailRes?.stats ?? null);
      setQuestions(questionsRes?.questions ?? []);
    } catch (e) {
      console.error('StudyGroup error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [groupId]);

  const fetchLeaderboard = useCallback(async () => {
    if (!groupId) return;
    try {
      const res = await api.getStudyLeaderboard(groupId, leaderboardPeriod);
      setLeaderboard(res?.leaderboard ?? []);
      setCurrentUserRank(res?.currentUserRank ?? 0);
    } catch (e) { console.error(e); }
  }, [groupId, leaderboardPeriod]);

  const fetchBadges = useCallback(async () => {
    if (!groupId) return;
    try {
      const res = await api.getStudyBadges(groupId, i18n.language);
      setBadges(res?.badges ?? []);
      setBadgeStats({ totalEarned: res?.totalEarned ?? 0, totalAvailable: res?.totalAvailable ?? 0 });
    } catch (e) { console.error(e); }
  }, [groupId]);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

  React.useEffect(() => {
    if (activeTab === 'leaderboard') fetchLeaderboard();
    else if (activeTab === 'badges') fetchBadges();
  }, [activeTab, fetchLeaderboard, fetchBadges]);

  const handleAnswer = async (questionId: string, selectedIndex: number) => {
    try {
      const res = await api.answerStudyQuestion(groupId, questionId, selectedIndex);
      // Update question in state
      setQuestions(prev => (prev ?? []).map(q =>
        q?.id === questionId
          ? { ...q, hasAnswered: true, userAnswer: { selectedIndex, isCorrect: res?.isCorrect }, correctIndex: res?.isCorrect ? selectedIndex : res?.correctIndex }
          : q
      ));
      // Refresh stats
      fetchData();
    } catch (e: any) {
      console.error('Answer error:', e?.message);
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        allowsEditing: true,
      });
      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];
      setUploadingImage(true);
      setQuestionImage({ uri: asset.uri });
      const ext = asset.uri.split('.').pop()?.toLowerCase() ?? 'jpg';
      const contentType = ext === 'png' ? 'image/png' : 'image/jpeg';
      const fileName = `study_q_${Date.now()}.${ext}`;
      const { uploadUrl, publicUrl } = await api.teacherGetUploadUrl({ fileName, contentType });
      const fileResp = await fetch(asset.uri);
      const blob = await fileResp.blob();
      await fetch(uploadUrl, { method: 'PUT', body: blob, headers: { 'Content-Type': contentType } });
      setQuestionImage({ uri: asset.uri, publicUrl });
    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'Şəkil yüklənmədi' });
      setQuestionImage(null);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleCreateQuestion = async () => {
    if (!newQ.questionText.trim()) return;
    setCreating(true);
    try {
      const validOptions = newQ.options.filter(o => o.trim());
      await api.teacherPostStudyQuestion(groupId, {
        questionText: newQ.questionText.trim(),
        options: validOptions.length >= 2 ? validOptions : undefined,
        correctIndex: validOptions.length >= 2 ? newQ.correctIndex : undefined,
        difficulty: newQ.difficulty,
        imageUrl: questionImage?.publicUrl,
      });
      setShowCreateModal(false);
      setNewQ({ questionText: '', options: ['', '', '', ''], correctIndex: 0, difficulty: 'MEDIUM' });
      setQuestionImage(null);
      Toast.show({ type: 'success', text1: 'Sual əlavə edildi' });
      fetchData();
    } catch (e: any) {
      Toast.show({ type: 'error', text1: e?.message ?? 'Xəta baş verdi' });
    } finally {
      setCreating(false);
    }
  };

  if (loading) return <LoadingScreen />;
  if (!group) return <EmptyState icon="alert-circle" message={t('common.error')} />;

  const statCards = [
    { label: t('studyGroup.level'), value: stats?.levelName ?? '', icon: 'star', color: '#F59E0B' },
    { label: t('studyGroup.points'), value: String(stats?.totalPoints ?? 0), icon: 'trophy', color: '#7C3AED' },
    { label: t('studyGroup.streak'), value: String(stats?.streak ?? 0), subtext: stats?.bestStreak ? `${t('studyGroup.record')} ${stats.bestStreak}` : '', icon: 'fire', color: '#EF4444' },
    { label: t('studyGroup.weekly'), value: String(stats?.weeklyPoints ?? 0), icon: 'calendar-week', color: '#3B82F6' },
  ];

  const tabs: { key: TabType; icon: string; label: string }[] = [
    { key: 'questions', icon: 'message-text', label: t('studyGroup.questions') },
    { key: 'leaderboard', icon: 'trophy', label: t('studyGroup.leaderboard') },
    { key: 'badges', icon: 'star', label: t('studyGroup.badges') },
  ];

  return (
    <ScreenContainer title={group?.name ?? ''} onBack={() => router.back()}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xxl }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor={c.primary} />}
      >
        {/* Group Info */}
        <View style={styles.groupInfo}>
          <View style={styles.groupInfoRow}>
            <View style={styles.groupInfoItem}>
              <MaterialCommunityIcons name="account-multiple" size={16} color={c.textMuted} />
              <Text style={[styles.groupSubtitle, { color: c.textMuted }]}>
                {group?.memberCount ?? 0} {t('groups.members')}
              </Text>
            </View>
            {group?.moderatorName ? (
              <View style={styles.groupInfoItem}>
                <MaterialCommunityIcons name="account-star" size={16} color={c.textMuted} />
                <Text style={[styles.groupSubtitle, { color: c.textMuted }]}>
                  {group.moderatorName}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Stats Cards */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.lg }}>
          {statCards.map((s, idx) => (
            <View key={idx} style={[styles.statCard, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
              <MaterialCommunityIcons name={s.icon as any} size={20} color={s.color} />
              <Text style={[styles.statValue, { color: c.textHeading }]}>{s.value}</Text>
              {s.subtext ? <Text style={[styles.statSubtext, { color: c.textMuted }]}>{s.subtext}</Text> : null}
              <Text style={[styles.statLabel, { color: c.textMuted }]}>{s.label}</Text>
            </View>
          ))}
        </ScrollView>

        {/* Tab Bar */}
        <View style={[styles.tabBar, { backgroundColor: c.surfaceLight }]}>
          {tabs.map(tab => (
            <Pressable
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={[styles.tabItem, activeTab === tab.key && { backgroundColor: c.primary }]}
            >
              <MaterialCommunityIcons name={tab.icon as any} size={16} color={activeTab === tab.key ? c.white : c.textMuted} />
              <Text style={[styles.tabText, { color: activeTab === tab.key ? c.white : c.textMuted }]}>{tab.label}</Text>
            </Pressable>
          ))}
        </View>

        {/* Tab Content */}
        {activeTab === 'questions' && (
          <QuestionsTab questions={questions} onAnswer={handleAnswer} c={c} t={t} />
        )}
        {activeTab === 'leaderboard' && (
          <LeaderboardTab
            leaderboard={leaderboard}
            period={leaderboardPeriod}
            onPeriodChange={setLeaderboardPeriod}
            currentUserRank={currentUserRank}
            c={c}
            t={t}
          />
        )}
        {activeTab === 'badges' && (
          <BadgesTab badges={badges} stats={badgeStats} c={c} t={t} />
        )}
      </ScrollView>

      {/* FAB for moderator */}
      {group?.isModerator && (
        <Pressable
          onPress={() => setShowCreateModal(true)}
          style={[styles.fab, { backgroundColor: c.primary }]}
        >
          <MaterialCommunityIcons name="plus" size={26} color="#fff" />
        </Pressable>
      )}

      {/* Create Question Modal */}
      <Modal visible={showCreateModal} transparent animationType="slide" onRequestClose={() => setShowCreateModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <Pressable style={styles.modalOverlay} onPress={() => setShowCreateModal(false)}>
            <Pressable style={[styles.modalContent, { backgroundColor: c.surface }]} onPress={() => {}}>
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={{ fontSize: 18, fontWeight: '700', color: c.textHeading, marginBottom: spacing.md }}>Sual əlavə et</Text>

                {/* Question text */}
                <Text style={[styles.fieldLabel, { color: c.textMuted }]}>Sual mətni</Text>
                <TextInput
                  value={newQ.questionText}
                  onChangeText={v => setNewQ(p => ({ ...p, questionText: v }))}
                  placeholder="Sualı daxil edin..."
                  placeholderTextColor={c.textMuted}
                  multiline
                  style={[styles.textInput, { backgroundColor: c.surfaceLight, color: c.textBody, borderColor: c.cardBorder, minHeight: 80 }]}
                />

                {/* Options */}
                <Text style={[styles.fieldLabel, { color: c.textMuted, marginTop: spacing.md }]}>Cavab variantları</Text>
                {newQ.options.map((opt, i) => (
                  <View key={i} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                    <Pressable
                      onPress={() => setNewQ(p => ({ ...p, correctIndex: i }))}
                      style={{ width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: newQ.correctIndex === i ? c.success : c.cardBorder, backgroundColor: newQ.correctIndex === i ? c.success + '20' : 'transparent', alignItems: 'center', justifyContent: 'center', marginRight: 8 }}
                    >
                      {newQ.correctIndex === i && <MaterialCommunityIcons name="check" size={16} color={c.success} />}
                    </Pressable>
                    <TextInput
                      value={opt}
                      onChangeText={v => setNewQ(p => { const opts = [...p.options]; opts[i] = v; return { ...p, options: opts }; })}
                      placeholder={`Variant ${String.fromCharCode(65 + i)}`}
                      placeholderTextColor={c.textMuted}
                      style={[styles.optInput, { backgroundColor: c.surfaceLight, color: c.textBody, borderColor: c.cardBorder }]}
                    />
                  </View>
                ))}
                <Text style={{ fontSize: 10, color: c.textMuted, marginBottom: spacing.sm }}>Düzgün cavabı seçmək üçün dairəyə basın</Text>

                {/* Image */}
                <Text style={[styles.fieldLabel, { color: c.textMuted, marginTop: spacing.md }]}>Şəkil (istəyə bağlı)</Text>
                {questionImage?.uri ? (
                  <View style={{ marginBottom: spacing.sm }}>
                    <Image source={{ uri: questionImage.uri }} style={{ width: '100%', height: 160, borderRadius: borderRadius.md }} contentFit="cover" transition={200} />
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
                      {uploadingImage ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <ActivityIndicator size="small" color={c.primary} />
                          <Text style={{ fontSize: 12, color: c.primary }}>Yüklənir...</Text>
                        </View>
                      ) : questionImage.publicUrl ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <MaterialCommunityIcons name="check-circle" size={14} color={c.success} />
                          <Text style={{ fontSize: 12, color: c.success }}>Yükləndi</Text>
                        </View>
                      ) : null}
                      <Pressable onPress={() => setQuestionImage(null)}>
                        <MaterialCommunityIcons name="close-circle" size={22} color={c.error} />
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  <Pressable
                    onPress={pickImage}
                    style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: borderRadius.md, borderWidth: 1, borderColor: c.cardBorder, borderStyle: 'dashed', backgroundColor: c.surfaceLight, marginBottom: spacing.sm, gap: 8 }}
                  >
                    <MaterialCommunityIcons name="image-plus" size={22} color={c.primary} />
                    <Text style={{ fontSize: 13, color: c.primary, fontWeight: '600' }}>Şəkil əlavə et</Text>
                  </Pressable>
                )}

                {/* Difficulty */}
                <Text style={[styles.fieldLabel, { color: c.textMuted }]}>Çətinlik</Text>
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: spacing.md }}>
                  {(['EASY', 'MEDIUM', 'HARD'] as const).map(d => {
                    const sel = newQ.difficulty === d;
                    const dColor = d === 'EASY' ? '#10B981' : d === 'MEDIUM' ? '#F59E0B' : '#EF4444';
                    const dLabel = d === 'EASY' ? 'Asan' : d === 'MEDIUM' ? 'Orta' : 'Çətin';
                    return (
                      <Pressable
                        key={d}
                        onPress={() => setNewQ(p => ({ ...p, difficulty: d }))}
                        style={{ flex: 1, paddingVertical: 8, borderRadius: borderRadius.sm, backgroundColor: sel ? dColor + '20' : c.surfaceLight, borderWidth: 1, borderColor: sel ? dColor : c.cardBorder, alignItems: 'center' }}
                      >
                        <Text style={{ fontSize: 12, fontWeight: '600', color: sel ? dColor : c.textBody }}>{dLabel}</Text>
                      </Pressable>
                    );
                  })}
                </View>

                {/* Submit */}
                <Pressable
                  onPress={handleCreateQuestion}
                  disabled={creating || !newQ.questionText.trim()}
                  style={[styles.submitBtn, { backgroundColor: c.primary, opacity: creating || !newQ.questionText.trim() ? 0.5 : 1 }]}
                >
                  <MaterialCommunityIcons name="send" size={18} color="#fff" />
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14, marginLeft: 6 }}>
                    {creating ? 'Göndərilir...' : 'Paylaş'}
                  </Text>
                </Pressable>
              </ScrollView>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </ScreenContainer>
  );
}

// Questions Tab Component
function QuestionsTab({ questions, onAnswer, c, t }: any) {
  const active = (questions ?? []).filter((q: any) => !q?.isClosed);
  const closed = (questions ?? []).filter((q: any) => q?.isClosed);

  return (
    <View>
      {active.map((q: any) => (
        <QuestionCard key={q?.id} question={q} onAnswer={onAnswer} c={c} t={t} />
      ))}
      {closed.map((q: any) => (
        <QuestionCard key={q?.id} question={q} onAnswer={onAnswer} c={c} t={t} />
      ))}
      {active.length === 0 && closed.length === 0 && (
        <EmptyState icon="message-text" message={t('studyGroup.noQuestions')} />
      )}
    </View>
  );
}

function QuestionCard({ question, onAnswer, c, t }: any) {
  const q = question ?? {};
  const options = q.options ?? [];
  const diffColors: Record<string, string> = { EASY: '#10B981', MEDIUM: '#F59E0B', HARD: '#EF4444' };
  const diffLabels: Record<string, string> = { EASY: t('studyGroup.easy'), MEDIUM: t('studyGroup.medium'), HARD: t('studyGroup.hard') };

  return (
    <View style={[styles.questionCard, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
      <View style={styles.questionHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
            {q.isModerator && <MaterialCommunityIcons name="crown" size={14} color="#F59E0B" />}
            <Text style={[styles.authorName, { color: c.primary }]}>
              {q.authorName ?? ''}
            </Text>
          </View>
          <View style={[styles.diffBadge, { backgroundColor: (diffColors[q.difficulty] ?? '#F59E0B') + '20' }]}>
            <Text style={{ fontSize: 10, fontWeight: '600', color: diffColors[q.difficulty] ?? '#F59E0B' }}>
              {diffLabels[q.difficulty] ?? q.difficulty}
            </Text>
          </View>
        </View>
        {q.isClosed && (
          <View style={[styles.diffBadge, { backgroundColor: c.textMuted + '20' }]}>
            <Text style={{ fontSize: 10, color: c.textMuted }}>{t('studyGroup.finished')}</Text>
          </View>
        )}
      </View>

      <Text style={[styles.questionText, { color: c.textHeading }]}>{q.questionText ?? ''}</Text>

      {q.imageUrl ? (
        <View style={{ marginBottom: spacing.sm, borderRadius: borderRadius.md, overflow: 'hidden', backgroundColor: c.surfaceLight }}>
          <Image source={{ uri: q.imageUrl }} style={{ width: '100%', height: 180 }} contentFit="contain" transition={200} />
        </View>
      ) : null}

      {/* Options */}
      {options.map((opt: string, idx: number) => {
        const isSelected = q.userAnswer?.selectedIndex === idx;
        const isCorrect = q.correctIndex === idx;
        const showResult = q.hasAnswered || q.isClosed;

        let bgColor = 'transparent';
        let borderColor = c.cardBorder;
        if (showResult && isCorrect) { bgColor = '#10B98120'; borderColor = '#10B981'; }
        else if (showResult && isSelected && !q.userAnswer?.isCorrect) { bgColor = '#EF444420'; borderColor = '#EF4444'; }
        else if (isSelected) { bgColor = c.primary + '20'; borderColor = c.primary; }

        return (
          <Pressable
            key={idx}
            onPress={() => !q.hasAnswered && !q.isClosed ? onAnswer(q.id, idx) : null}
            disabled={q.hasAnswered || q.isClosed}
            style={[styles.optionBtn, { backgroundColor: bgColor, borderColor }]}
          >
            <View style={[styles.optionLetter, { backgroundColor: isSelected ? c.primary : c.surfaceLight }]}>
              <Text style={{ fontSize: 12, fontWeight: '600', color: isSelected ? c.white : c.textMuted }}>
                {String.fromCharCode(97 + idx)}
              </Text>
            </View>
            <Text style={[styles.optionText, { color: c.textBody }]}>{opt}</Text>
            {showResult && isCorrect && <MaterialCommunityIcons name="check-circle" size={18} color="#10B981" />}
            {showResult && isSelected && !q.userAnswer?.isCorrect && <MaterialCommunityIcons name="close-circle" size={18} color="#EF4444" />}
          </Pressable>
        );
      })}

      <View style={styles.questionFooter}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <MaterialCommunityIcons name="comment-text-outline" size={14} color={c.textMuted} />
          <Text style={[styles.footerText, { color: c.textMuted }]}>
            {q.commentCount ?? 0} {t('studyGroup.discussion')}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <MaterialCommunityIcons name="account-multiple-outline" size={14} color={c.textMuted} />
          <Text style={[styles.footerText, { color: c.textMuted }]}>
            {q.answerCount ?? 0} {t('studyGroup.answered')}
          </Text>
        </View>
      </View>
    </View>
  );
}

// Leaderboard Tab
function LeaderboardTab({ leaderboard, period, onPeriodChange, currentUserRank, c, t }: any) {
  const medalColors = ['', '#FFD700', '#C0C0C0', '#CD7F32'];
  return (
    <View>
      <View style={[styles.periodToggle, { backgroundColor: c.surfaceLight }]}>
        <Pressable
          onPress={() => onPeriodChange('weekly')}
          style={[styles.periodBtn, period === 'weekly' && { backgroundColor: c.primary }]}
        >
          <Text style={{ color: period === 'weekly' ? c.white : c.textMuted, fontWeight: '600', fontSize: 13 }}>
            {t('studyGroup.weekly')}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => onPeriodChange('alltime')}
          style={[styles.periodBtn, period === 'alltime' && { backgroundColor: c.primary }]}
        >
          <Text style={{ color: period === 'alltime' ? c.white : c.textMuted, fontWeight: '600', fontSize: 13 }}>
            {t('studyGroup.allTime')}
          </Text>
        </Pressable>
      </View>

      {(leaderboard ?? []).length === 0 ? (
        <EmptyState icon="trophy" message={t('studyGroup.noLeaderboard')} />
      ) : (
        (leaderboard ?? []).map((entry: any) => (
          <View
            key={entry?.userId ?? ''}
            style={[styles.leaderRow, { backgroundColor: entry?.isCurrentUser ? c.primary + '10' : c.card, borderColor: entry?.isCurrentUser ? c.primary : c.cardBorder }]}
          >
            <View style={[styles.rankContainer]}>
              {(entry?.rank ?? 99) <= 3 ? (
                <MaterialCommunityIcons name="medal" size={22} color={medalColors[entry?.rank] ?? '#CD7F32'} />
              ) : (
                <Text style={[styles.rank, { color: c.textMuted }]}>#{entry?.rank}</Text>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.leaderName, { color: c.textHeading }]}>
                {entry?.name ?? ''}
              </Text>
              <Text style={[styles.leaderSub, { color: c.textMuted }]}>
                {entry?.levelName ?? ''} · {entry?.streak ?? 0}
              </Text>
            </View>
            <Text style={[styles.leaderPoints, { color: c.primary }]}>{entry?.points ?? 0} {t('studyGroup.pts')}</Text>
          </View>
        ))
      )}
    </View>
  );
}

// Badges Tab
function BadgesTab({ badges, stats, c, t }: any) {
  return (
    <View>
      <Text style={[styles.badgeCount, { color: c.textMuted }]}>
        {stats?.totalEarned ?? 0}/{stats?.totalAvailable ?? 0} {t('studyGroup.earned')}
      </Text>
      <View style={styles.badgeGrid}>
        {(badges ?? []).map((badge: any) => (
          <View
            key={badge?.id ?? ''}
            style={[styles.badgeCard, { backgroundColor: c.card, borderColor: c.cardBorder, opacity: badge?.earned ? 1 : 0.4 }]}
          >
            <Text style={{ fontSize: 28 }}>{badge?.icon ?? '\u2b50'}</Text>
            <Text style={[styles.badgeName, { color: c.textHeading }]} numberOfLines={1}>{badge?.name ?? ''}</Text>
            <Text style={[styles.badgeDesc, { color: c.textMuted }]} numberOfLines={2}>{badge?.description ?? ''}</Text>
            {badge?.earned && badge?.earnedAt && (
              <Text style={[styles.badgeDate, { color: c.success }]}>
                {new Date(badge.earnedAt).toLocaleDateString()}
              </Text>
            )}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  groupInfo: { marginBottom: spacing.md },
  groupInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  groupInfoItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  groupSubtitle: { fontSize: 14 },
  statCard: { width: 100, padding: spacing.sm, borderRadius: borderRadius.md, borderWidth: 1, marginRight: spacing.sm, alignItems: 'center' },
  statValue: { fontSize: 16, fontWeight: '700', marginTop: 4 },
  statSubtext: { fontSize: 10, marginTop: 1 },
  statLabel: { fontSize: 11, marginTop: 2 },
  tabBar: { flexDirection: 'row', borderRadius: borderRadius.md, padding: 3, marginBottom: spacing.lg },
  tabItem: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: borderRadius.sm, gap: 4 },
  tabText: { fontSize: 12, fontWeight: '600' },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: spacing.sm },
  questionCard: { borderRadius: borderRadius.md, borderWidth: 1, padding: spacing.md, marginBottom: spacing.md },
  questionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  authorName: { fontSize: 13, fontWeight: '600' },
  diffBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  questionText: { fontSize: 15, fontWeight: '500', marginBottom: spacing.md, lineHeight: 22 },
  optionBtn: { flexDirection: 'row', alignItems: 'center', padding: spacing.sm, borderRadius: borderRadius.sm, borderWidth: 1, marginBottom: 6 },
  optionLetter: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm },
  optionText: { flex: 1, fontSize: 14 },
  questionFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm },
  footerText: { fontSize: 12 },
  periodToggle: { flexDirection: 'row', borderRadius: borderRadius.md, padding: 3, marginBottom: spacing.md },
  periodBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: borderRadius.sm },
  leaderRow: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderRadius: borderRadius.md, borderWidth: 1, marginBottom: spacing.sm },
  rankContainer: { width: 40, alignItems: 'center', justifyContent: 'center' },
  rank: { fontSize: 16, fontWeight: '700', textAlign: 'center' },
  leaderName: { fontSize: 15, fontWeight: '600' },
  leaderSub: { fontSize: 12, marginTop: 2 },
  leaderPoints: { fontSize: 16, fontWeight: '700' },
  badgeCount: { fontSize: 14, marginBottom: spacing.md },
  badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  badgeCard: { width: '47%', padding: spacing.md, borderRadius: borderRadius.md, borderWidth: 1, alignItems: 'center' },
  badgeName: { fontSize: 13, fontWeight: '600', marginTop: 4 },
  badgeDesc: { fontSize: 11, textAlign: 'center', marginTop: 2 },
  badgeDate: { fontSize: 10, marginTop: 4 },
  fab: { position: 'absolute', bottom: 24, right: 20, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 6 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: spacing.lg, maxHeight: '85%' },
  fieldLabel: { fontSize: 12, fontWeight: '600', marginBottom: 6, textTransform: 'uppercase' },
  textInput: { borderWidth: 1, borderRadius: borderRadius.md, padding: spacing.sm, fontSize: 14, textAlignVertical: 'top' },
  optInput: { flex: 1, borderWidth: 1, borderRadius: borderRadius.sm, paddingHorizontal: 10, paddingVertical: 8, fontSize: 14 },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: borderRadius.md, marginTop: spacing.sm },
});
