import React, { useState } from 'react';
import { Text, Pressable, Alert, Platform, ActivityIndicator, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useAppColors } from '../hooks/useAppColors';
import { spacing } from '../theme';

export function DeleteAccountButton() {
  const { t } = useTranslation();
  const { logout } = useAuth();
  const c = useAppColors();
  const [busy, setBusy] = useState(false);

  const doDelete = async () => {
    setBusy(true);
    try {
      await api.deleteAccount();
      await logout();
    } catch (e: any) {
      console.error('Delete account failed', e);
      const msg = e?.message ?? t('profile.deleteAccountError');
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert(t('profile.deleteAccount'), msg);
    } finally {
      setBusy(false);
    }
  };

  const onPress = () => {
    if (busy) return;
    if (Platform.OS === 'web') {
      if (window.confirm(t('profile.deleteAccountConfirm'))) doDelete();
      return;
    }
    Alert.alert(t('profile.deleteAccount'), t('profile.deleteAccountConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('profile.deleteAccountAction'), style: 'destructive', onPress: doDelete },
    ]);
  };

  return (
    <Pressable
      onPress={onPress}
      style={styles.btn}
      accessibilityRole="button"
      accessibilityLabel={t('profile.deleteAccount')}
      testID="delete-account-button"
    >
      {busy ? (
        <ActivityIndicator size="small" color={c.error} />
      ) : (
        <MaterialCommunityIcons name="account-remove-outline" size={18} color={c.error} />
      )}
      <Text style={[styles.text, { color: c.error }]}>{t('profile.deleteAccount')}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: spacing.md, marginTop: spacing.sm, minHeight: 44, opacity: 0.85 },
  text: { fontSize: 14, fontWeight: '500', marginLeft: spacing.sm, textDecorationLine: 'underline' },
});
