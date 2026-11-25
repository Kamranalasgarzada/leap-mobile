import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  mode: ThemeMode;
  toggleTheme: () => void;
  setMode: (m: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  mode: 'light',
  toggleTheme: () => {},
  setMode: () => {},
});

const THEME_KEY = 'datagate_theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('light');

  useEffect(() => {
    (async () => {
      try {
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          const stored = localStorage.getItem(THEME_KEY);
          if (stored === 'dark' || stored === 'light') setModeState(stored);
        } else {
          const stored = await AsyncStorage.getItem(THEME_KEY);
          if (stored === 'dark' || stored === 'light') setModeState(stored);
        }
      } catch {}
    })();
  }, []);

  const persist = useCallback(async (m: ThemeMode) => {
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        localStorage.setItem(THEME_KEY, m);
      } else {
        await AsyncStorage.setItem(THEME_KEY, m);
      }
    } catch {}
  }, []);

  const setMode = useCallback((m: ThemeMode) => {
    setModeState(m);
    persist(m);
  }, [persist]);

  const toggleTheme = useCallback(() => {
    setModeState(prev => {
      const next = prev === 'light' ? 'dark' : 'light';
      persist(next);
      return next;
    });
  }, [persist]);

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeMode() {
  return useContext(ThemeContext);
}
