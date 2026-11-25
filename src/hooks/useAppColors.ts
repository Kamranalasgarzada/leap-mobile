import { useMemo } from 'react';
import { useThemeMode } from '../contexts/ThemeContext';
import { getColors, type ThemeColors } from '../theme';

export function useAppColors(): ThemeColors {
  const { mode } = useThemeMode();
  return useMemo(() => getColors(mode), [mode]);
}
