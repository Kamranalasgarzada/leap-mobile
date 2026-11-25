import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import az from './locales/az.json';
import ru from './locales/ru.json';
import en from './locales/en.json';

const LANG_KEY = 'datagate_language';

export async function getStoredLanguage(): Promise<string> {
  try {
    const lang = await AsyncStorage.getItem(LANG_KEY);
    if (lang && ['az', 'ru', 'en'].includes(lang)) return lang;
  } catch {}
  const locale = Localization.getLocales()?.[0]?.languageCode ?? 'az';
  if (['az', 'ru', 'en'].includes(locale)) return locale;
  return 'az';
}

export async function setStoredLanguage(lang: string) {
  try {
    await AsyncStorage.setItem(LANG_KEY, lang);
  } catch {}
}

i18n.use(initReactI18next).init({
  resources: { az: { translation: az }, ru: { translation: ru }, en: { translation: en } },
  lng: 'az',
  fallbackLng: 'az',
  interpolation: { escapeValue: false },
  compatibilityJSON: 'v4',
});

export default i18n;
