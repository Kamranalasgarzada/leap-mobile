import React, { useState, useCallback } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, Pressable, Share, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '../../../src/services/api';
import { ScreenContainer } from '../../../src/components/ScreenContainer';
import { LoadingScreen } from '../../../src/components/LoadingScreen';
import { useAppColors } from '../../../src/hooks/useAppColors';
import { spacing, borderRadius } from '../../../src/theme';

const leapLogo = require('../../../assets/leap-logo.png');

/** Format serialNo to 9-digit display */
function formatSerial(serial: string | undefined | null): string {
  if (!serial) return '000000000';
  // Extract digits, pad to 9
  const digits = serial.replace(/\D/g, '');
  if (digits.length >= 9) return digits.slice(0, 9);
  // If no digits, hash the string to get 9 digits
  let hash = 0;
  for (let i = 0; i < serial.length; i++) {
    hash = ((hash << 5) - hash + serial.charCodeAt(i)) | 0;
  }
  return String(Math.abs(hash)).padStart(9, '0').slice(0, 9);
}

export default function CertificateScreen() {
  const { examId = '' } = useLocalSearchParams<{ examId: string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const c = useAppColors();
  const [cert, setCert] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchCert = useCallback(async () => {
    if (!examId) return;
    try {
      const res = await api.getCertificate(examId);
      setCert(res?.certificate ?? null);
    } catch (e) {
      console.error('Certificate error:', e);
    } finally {
      setLoading(false);
    }
  }, [examId]);

  useFocusEffect(useCallback(() => { fetchCert(); }, [fetchCert]));

  const serialDisplay = formatSerial(cert?.serialNo);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${t('certificate.title')}\n${cert?.examTitle ?? ''}\n${cert?.studentName ?? ''}\nScore: ${cert?.score ?? 0}\n${t('certificate.serial')}: ${serialDisplay}`,
      });
    } catch {}
  };

  if (loading) return <LoadingScreen />;
  if (!cert) return <ScreenContainer><Text style={{ color: c.textMuted, padding: spacing.lg }}>No certificate</Text></ScreenContainer>;

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={c.textHeading} />
        </Pressable>

        <View style={styles.certContainer}>
          <LinearGradient colors={['#0F1B2D', '#162544'] as const} style={styles.certCard}>
            <View style={styles.certBorder}>
              <View style={styles.goldLine} />

              {/* LEAP Logo */}
              <Image source={leapLogo} style={styles.logo} resizeMode="contain" />

              <Text style={styles.certTitle}>{t('certificate.title')}</Text>
              <Text style={styles.certSubtitle}>OF ACHIEVEMENT</Text>
              <View style={styles.divider} />
              <Text style={styles.certName}>{cert?.studentName ?? ''}</Text>
              <Text style={styles.certExam}>{cert?.examTitle ?? ''}</Text>
              <View style={styles.scoreRow}>
                <Text style={styles.certScore}>Score: {cert?.score ?? 0}</Text>
              </View>
              <View style={styles.divider} />
              <Text style={styles.certSerial}>{t('certificate.serial')}: {serialDisplay}</Text>
              <Text style={styles.certDate}>{t('certificate.date')}: {cert?.passedAt ? new Date(cert.passedAt).toLocaleDateString() : ''}</Text>
              <View style={styles.goldLine} />
            </View>
          </LinearGradient>
        </View>

        <Pressable onPress={handleShare} style={[styles.shareBtn, { backgroundColor: c.primary + '15' }]}>
          <MaterialCommunityIcons name="share-variant" size={20} color={c.primary} />
          <Text style={[styles.shareText, { color: c.primary }]}>{t('certificate.share')}</Text>
        </Pressable>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.md, paddingBottom: spacing.xxl },
  backBtn: { marginBottom: spacing.md, width: 44, height: 44, justifyContent: 'center' },
  certContainer: { alignItems: 'center', marginTop: spacing.md },
  certCard: { width: '100%', borderRadius: borderRadius.lg, overflow: 'hidden' },
  certBorder: { borderWidth: 2, borderColor: '#F59E0B', borderRadius: borderRadius.lg, margin: 3, padding: spacing.xl, alignItems: 'center' },
  goldLine: { width: '60%', height: 2, backgroundColor: '#F59E0B', marginVertical: spacing.md },
  logo: { width: 80, height: 80, marginBottom: spacing.sm, borderRadius: 12 },
  certTitle: { fontSize: 24, fontWeight: '700', color: '#F59E0B', textAlign: 'center' },
  certSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.6)', letterSpacing: 4, marginTop: 4 },
  divider: { width: '40%', height: 1, backgroundColor: 'rgba(245,158,11,0.3)', marginVertical: spacing.lg },
  certName: { fontSize: 22, fontWeight: '700', color: '#FFFFFF', textAlign: 'center' },
  certExam: { fontSize: 16, color: 'rgba(255,255,255,0.85)', marginTop: spacing.sm, textAlign: 'center' },
  scoreRow: { marginTop: spacing.md },
  certScore: { fontSize: 18, fontWeight: '600', color: '#34D399' },
  certSerial: { fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: '500' },
  certDate: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 4, fontWeight: '500' },
  shareBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: spacing.lg, padding: spacing.md, borderRadius: borderRadius.md },
  shareText: { fontWeight: '600', marginLeft: spacing.sm, fontSize: 16 },
});
