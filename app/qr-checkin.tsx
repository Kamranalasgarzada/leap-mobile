import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, TextInput, StyleSheet, Platform, KeyboardAvoidingView, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';
import { api } from '../src/services/api';
import { useAppColors } from '../src/hooks/useAppColors';
import { spacing, borderRadius } from '../src/theme';
import { GradientButton } from '../src/components/GradientButton';
import { Card } from '../src/components/Card';

type CheckinMode = 'choose' | 'scan' | 'pin';

export default function QrCheckinScreen() {
  const { t } = useTranslation();
  const c = useAppColors();
  const router = useRouter();
  const [mode, setMode] = useState<CheckinMode>('choose');
  const [pinDigits, setPinDigits] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [scanned, setScanned] = useState(false);
  const pinRefs = useRef<Array<TextInput | null>>([]);

  // Dynamic import for camera (not available on web)
  const [CameraView, setCameraView] = useState<any>(null);

  useEffect(() => {
    if (mode === 'scan' && Platform.OS !== 'web') {
      import('expo-camera').then(mod => {
        setCameraView(() => mod.CameraView);
        setCameraReady(true);
      }).catch(() => {
        Toast.show({ type: 'error', text1: t('student.cameraNotAvailable') });
        setMode('pin');
      });
    }
  }, [mode]);

  const handleQrScanned = async (data: string) => {
    if (scanned || loading) return;
    setScanned(true);
    setLoading(true);
    try {
      const res = await api.studentAttendanceCheckin({ qrCode: data });
      setResult(res);
      if (res?.alreadyCheckedIn) {
        Toast.show({ type: 'info', text1: t('student.alreadyCheckedIn'), text2: res?.groupName ?? '' });
      } else {
        Toast.show({ type: 'success', text1: t('student.checkinSuccess'), text2: res?.groupName ?? '' });
      }
    } catch (e: any) {
      Toast.show({ type: 'error', text1: e?.message ?? t('common.error') });
      setScanned(false);
    } finally { setLoading(false); }
  };

  const handlePinSubmit = async () => {
    const pin = pinDigits.join('');
    if (pin.length !== 6) {
      Toast.show({ type: 'error', text1: t('student.enterFullPin') });
      return;
    }
    setLoading(true);
    try {
      const res = await api.studentAttendanceCheckin({ pinCode: pin });
      setResult(res);
      if (res?.alreadyCheckedIn) {
        Toast.show({ type: 'info', text1: t('student.alreadyCheckedIn'), text2: res?.groupName ?? '' });
      } else {
        Toast.show({ type: 'success', text1: t('student.checkinSuccess'), text2: res?.groupName ?? '' });
      }
    } catch (e: any) {
      Toast.show({ type: 'error', text1: e?.message ?? t('common.error') });
    } finally { setLoading(false); }
  };

  const handlePinChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1);
    const newDigits = [...pinDigits];
    newDigits[index] = value;
    setPinDigits(newDigits);
    if (value && index < 5) {
      pinRefs.current[index + 1]?.focus();
    }
  };

  const handlePinKeyPress = (index: number, key: string) => {
    if (key === 'Backspace' && !pinDigits[index] && index > 0) {
      pinRefs.current[index - 1]?.focus();
    }
  };

  const resetState = () => {
    setMode('choose');
    setResult(null);
    setScanned(false);
    setPinDigits(['', '', '', '', '', '']);
  };

  // Success result screen
  if (result) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: c.background }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl }}>
          <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: c.success + '20', justifyContent: 'center', alignItems: 'center', marginBottom: spacing.lg }}>
            <MaterialCommunityIcons name="check-circle" size={64} color={c.success} />
          </View>
          <Text style={{ fontSize: 24, fontWeight: '700', color: c.textHeading, textAlign: 'center' }}>
            {result?.alreadyCheckedIn ? t('student.alreadyCheckedIn') : t('student.checkinSuccess')}
          </Text>
          <Text style={{ fontSize: 16, color: c.textMuted, marginTop: spacing.sm, textAlign: 'center' }}>
            {result?.groupName ?? ''}
          </Text>
          <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl }}>
            <GradientButton title={t('common.back')} onPress={() => router.back()} style={{ flex: 1 }} />
            <Pressable
              onPress={resetState}
              style={{ flex: 1, paddingVertical: 14, borderRadius: borderRadius.md, borderWidth: 1, borderColor: c.primary, alignItems: 'center' }}
            >
              <Text style={{ color: c.primary, fontWeight: '600' }}>{t('student.scanAgain')}</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: spacing.lg }}>
        <Pressable onPress={() => router.back()} style={{ marginRight: spacing.md }}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={c.textHeading} />
        </Pressable>
        <Text style={{ fontSize: 20, fontWeight: '700', color: c.textHeading }}>{t('student.qrCheckin')}</Text>
      </View>

      {mode === 'choose' && (
        <View style={{ flex: 1, justifyContent: 'center', padding: spacing.xl }}>
          <Text style={{ fontSize: 22, fontWeight: '700', color: c.textHeading, textAlign: 'center', marginBottom: spacing.xs }}>
            {t('student.attendanceCheckin')}
          </Text>
          <Text style={{ fontSize: 14, color: c.textMuted, textAlign: 'center', marginBottom: spacing.xl }}>
            {t('student.chooseCheckinMethod')}
          </Text>

          {Platform.OS !== 'web' && (
            <Pressable onPress={() => setMode('scan')} style={[styles.methodCard, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
              <View style={[styles.methodIcon, { backgroundColor: c.primary + '15' }]}>
                <MaterialCommunityIcons name="qrcode-scan" size={32} color={c.primary} />
              </View>
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: c.textHeading }}>{t('student.scanQrCode')}</Text>
                <Text style={{ fontSize: 13, color: c.textMuted, marginTop: 2 }}>{t('student.scanQrDesc')}</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={24} color={c.textMuted} />
            </Pressable>
          )}

          <Pressable onPress={() => setMode('pin')} style={[styles.methodCard, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
            <View style={[styles.methodIcon, { backgroundColor: c.warning + '15' }]}>
              <MaterialCommunityIcons name="lock" size={32} color={c.warning} />
            </View>
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: c.textHeading }}>{t('student.enterPin')}</Text>
              <Text style={{ fontSize: 13, color: c.textMuted, marginTop: 2 }}>{t('student.enterPinDesc')}</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={c.textMuted} />
          </Pressable>
        </View>
      )}

      {mode === 'scan' && Platform.OS !== 'web' && CameraView && (
        <View style={{ flex: 1 }}>
          <CameraView
            style={{ flex: 1 }}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={scanned ? undefined : (e: any) => handleQrScanned(e?.data ?? '')}
          />
          {/* Overlay */}
          <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center' }]} pointerEvents="none">
            <View style={{ width: 250, height: 250, borderWidth: 3, borderColor: c.primary, borderRadius: 20 }} />
            <Text style={{ color: '#fff', fontSize: 14, marginTop: spacing.md, textShadowColor: '#000', textShadowRadius: 4 }}>
              {t('student.pointCameraAtQr')}
            </Text>
          </View>
          <Pressable
            onPress={() => setMode('choose')}
            style={{ position: 'absolute', bottom: 40, alignSelf: 'center', paddingHorizontal: 24, paddingVertical: 12, backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: borderRadius.full }}
          >
            <Text style={{ color: '#fff', fontWeight: '600' }}>{t('common.cancel')}</Text>
          </Pressable>
        </View>
      )}

      {mode === 'pin' && (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flex: 1, justifyContent: 'center', padding: spacing.xl }}>
            <View style={{ alignItems: 'center' }}>
              <MaterialCommunityIcons name="lock-open" size={48} color={c.primary} />
              <Text style={{ fontSize: 20, fontWeight: '700', color: c.textHeading, marginTop: spacing.md }}>
                {t('student.enterPinCode')}
              </Text>
              <Text style={{ fontSize: 14, color: c.textMuted, marginTop: spacing.xs, textAlign: 'center' }}>
                {t('student.enterPinFromTeacher')}
              </Text>

              <View style={{ flexDirection: 'row', gap: 10, marginTop: spacing.xl }}>
                {pinDigits.map((digit, i) => (
                  <TextInput
                    key={i}
                    ref={ref => { pinRefs.current[i] = ref; }}
                    value={digit}
                    onChangeText={v => handlePinChange(i, v)}
                    onKeyPress={({ nativeEvent }) => handlePinKeyPress(i, nativeEvent.key)}
                    keyboardType="number-pad"
                    maxLength={1}
                    style={[
                      styles.pinInput,
                      { backgroundColor: c.card, borderColor: digit ? c.primary : c.cardBorder, color: c.textHeading },
                    ]}
                    textAlign="center"
                    selectTextOnFocus
                  />
                ))}
              </View>

              <GradientButton
                title={t('student.confirmCheckin')}
                onPress={handlePinSubmit}
                loading={loading}
                style={{ marginTop: spacing.xl, width: '100%' }}
              />

              <Pressable onPress={() => setMode('choose')} style={{ marginTop: spacing.lg }}>
                <Text style={{ color: c.primary, fontWeight: '600' }}>{t('common.back')}</Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      )}

      {mode === 'scan' && Platform.OS === 'web' && (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl }}>
          <MaterialCommunityIcons name="camera-off" size={48} color={c.textMuted} />
          <Text style={{ fontSize: 16, color: c.textMuted, marginTop: spacing.md, textAlign: 'center' }}>
            {t('student.cameraNotAvailable')}
          </Text>
          <GradientButton title={t('student.enterPin')} onPress={() => setMode('pin')} style={{ marginTop: spacing.lg }} />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  methodCard: {
    flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 12,
  },
  methodIcon: {
    width: 56, height: 56, borderRadius: 14, justifyContent: 'center', alignItems: 'center',
  },
  pinInput: {
    width: 48, height: 56, borderRadius: 12, borderWidth: 2, fontSize: 22, fontWeight: '800',
  },
});
