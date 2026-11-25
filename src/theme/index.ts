import { StyleSheet, Platform } from 'react-native';

// Light theme (matches website - white/clean)
export const lightColors = {
  background: '#F5F5F7',
  surface: '#FFFFFF',
  surfaceLight: '#F0EEFF',
  card: '#FFFFFF',
  cardBorder: '#E8E4F0',
  primary: '#7C3AED',
  primaryLight: '#8B5CF6',
  accent: '#EC4899',
  gradientPrimary: ['#7C3AED', '#EC4899'] as const,
  gradientBg: ['#F5F5F7', '#EEEBF5', '#F5F5F7'] as const,
  textHeading: '#1A1035',
  textBody: '#4A4458',
  textMuted: '#8E8A99',
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',
  white: '#FFFFFF',
  black: '#000000',
  tabBar: '#FFFFFF',
  tabBarBorder: '#E8E4F0',
  inputBg: '#F0EEFF',
  inputBorder: '#D4CEE8',
  sectionPurple: '#7C3AED',
  sectionBlue: '#3B82F6',
  sectionGreen: '#10B981',
  sectionPink: '#EC4899',
  sectionOrange: '#F59E0B',
  sectionCyan: '#06B6D4',
  cardShadow: 'rgba(124,58,237,0.08)',
  statusBarStyle: 'dark-content' as const,
  attendancePresent: '#ECFDF5',
  attendanceLate: '#FFFBEB',
  attendanceAbsent: '#FEF2F2',
};

// Dark theme
export const darkColors = {
  background: '#0F0A1E',
  surface: '#1A1035',
  surfaceLight: '#251B45',
  card: 'rgba(255,255,255,0.08)',
  cardBorder: 'rgba(255,255,255,0.12)',
  primary: '#7C3AED',
  primaryLight: '#8B5CF6',
  accent: '#EC4899',
  gradientPrimary: ['#7C3AED', '#EC4899'] as const,
  gradientBg: ['#0F0A1E', '#1A1035', '#251B45'] as const,
  textHeading: '#F1F5F9',
  textBody: '#CBD5E1',
  textMuted: '#94A3B8',
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',
  white: '#FFFFFF',
  black: '#000000',
  tabBar: '#0D0819',
  tabBarBorder: 'rgba(124,58,237,0.15)',
  inputBg: 'rgba(255,255,255,0.06)',
  inputBorder: 'rgba(124,58,237,0.25)',
  sectionPurple: '#7C3AED',
  sectionBlue: '#3B82F6',
  sectionGreen: '#10B981',
  sectionPink: '#EC4899',
  sectionOrange: '#F59E0B',
  sectionCyan: '#06B6D4',
  cardShadow: 'transparent',
  statusBarStyle: 'light-content' as const,
  attendancePresent: 'rgba(16,185,129,0.15)',
  attendanceLate: 'rgba(245,158,11,0.15)',
  attendanceAbsent: 'rgba(239,68,68,0.15)',
};

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceLight: string;
  card: string;
  cardBorder: string;
  primary: string;
  primaryLight: string;
  accent: string;
  gradientPrimary: readonly [string, string];
  gradientBg: readonly [string, string, string];
  textHeading: string;
  textBody: string;
  textMuted: string;
  success: string;
  error: string;
  warning: string;
  info: string;
  white: string;
  black: string;
  tabBar: string;
  tabBarBorder: string;
  inputBg: string;
  inputBorder: string;
  sectionPurple: string;
  sectionBlue: string;
  sectionGreen: string;
  sectionPink: string;
  sectionOrange: string;
  sectionCyan: string;
  cardShadow: string;
  statusBarStyle: 'dark-content' | 'light-content';
  attendancePresent: string;
  attendanceLate: string;
  attendanceAbsent: string;
}

// Default export (light by default - matches website)
export const colors: ThemeColors = lightColors;

export function getColors(mode: 'light' | 'dark'): ThemeColors {
  return mode === 'dark' ? darkColors : lightColors;
}

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const fonts = {
  heading: Platform.select({ ios: 'System', android: 'Roboto', default: 'Arial, sans-serif' }) ?? 'System',
  body: Platform.select({ ios: 'System', android: 'Roboto', default: 'Arial, sans-serif' }) ?? 'System',
};

export const typography = StyleSheet.create({
  display: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: lightColors.textHeading,
  },
  heading: {
    fontSize: 22,
    fontWeight: '600' as const,
    color: lightColors.textHeading,
  },
  subheading: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: lightColors.textHeading,
  },
  body: {
    fontSize: 16,
    color: lightColors.textBody,
  },
  caption: {
    fontSize: 13,
    color: lightColors.textMuted,
  },
});
