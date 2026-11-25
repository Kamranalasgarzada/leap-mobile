import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import i18n from '../../src/i18n';
import { setStoredLanguage } from '../../src/i18n';
import { api } from '../../src/services/api';
import { ScreenContainer } from '../../src/components/ScreenContainer';
import { colors, spacing, borderRadius } from '../../src/theme';

const languages = [
  { code: 'az', name: 'Az\u0259rbaycan dili', flag: '\ud83c\udde6\ud83c\uddff' },
  { code: 'ru', name: '\u0420\u0443\u0441\u0441\u043a\u0438\u0439', flag: '\ud83c\uddf7\ud83c\uddfa' },
  { code: 'en', name: 'English', flag: '\ud83c\uddec\ud83c\udde7' },
];

export default function LanguageScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [currentLang, setCurrentLang] = useState(i18n.language);

  const selectLang = async (code: string) => {
    await i18n.changeLanguage(code);
    await setStoredLanguage(code);
    setCurrentLang(code);
    try {
      await api.updateProfile({ preferredLanguage: code });
    } catch {}
  };

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textHeading} />
        </Pressable>
        <Text style={styles.title}>{t('profile.language')}</Text>
      </View>

      <View style={styles.list}>
        {languages.map(lang => (
          <Pressable
            key={lang.code}
            onPress={() => selectLang(lang.code)}
            style={[styles.langItem, currentLang === lang.code && styles.langItemActive]}
          >
            <Text style={styles.flag}>{lang.flag}</Text>
            <Text style={[styles.langName, currentLang === lang.code && { color: colors.textHeading }]}>{lang.name}</Text>
            {currentLang === lang.code && <MaterialCommunityIcons name="check" size={22} color={colors.primary} />}
          </Pressable>
        ))}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', padding: spacing.md },
  backBtn: { width: 44, height: 44, justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '600', color: colors.textHeading, marginLeft: spacing.sm },
  list: { padding: spacing.md },
  langItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.sm },
  langItemActive: { borderColor: colors.primary, backgroundColor: 'rgba(37,99,235,0.1)' },
  flag: { fontSize: 24, marginRight: spacing.md },
  langName: { flex: 1, fontSize: 16, color: colors.textMuted, fontWeight: '500' },
});
