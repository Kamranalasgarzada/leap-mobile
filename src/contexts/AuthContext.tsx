import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import { api, saveToken, clearToken, loadToken, setOnUnauthorized } from '../services/api';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  phone?: string | null;
  avatar?: string | null;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: { email: string; password: string; name: string; phone?: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  googleLogin: () => Promise<void>;
  handleGoogleCallback: (token: string, user: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  signup: async () => {},
  logout: async () => {},
  refreshUser: async () => {},
  googleLogin: async () => {},
  handleGoogleCallback: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const handleUnauthorized = useCallback(() => {
    setUser(null);
  }, []);

  useEffect(() => {
    setOnUnauthorized(handleUnauthorized);
  }, [handleUnauthorized]);

  useEffect(() => {
    (async () => {
      try {
        // Check for SSO token in localStorage (set by backend callback page)
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          const ssoToken = localStorage.getItem('datagate_token');
          const ssoUser = localStorage.getItem('datagate_sso_user');
          if (ssoToken && ssoUser) {
            localStorage.removeItem('datagate_sso_user');
            await saveToken(ssoToken);
            try {
              const parsed = JSON.parse(ssoUser);
              setUser(parsed);
              setIsLoading(false);
              return;
            } catch {}
          }
        }

        const token = await loadToken();
        if (token) {
          const data = await api.getMe();
          setUser(data?.user ?? null);
        }
      } catch {
        await clearToken();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await api.login({ email, password });
    await saveToken(data.token);
    setUser(data.user);
  }, []);

  const signup = useCallback(async (signupData: { email: string; password: string; name: string; phone?: string }) => {
    const data = await api.signup(signupData);
    await saveToken(data.token);
    setUser(data.user);
  }, []);

  const logout = useCallback(async () => {
    await clearToken();
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const data = await api.getMe();
      setUser(data?.user ?? null);
    } catch {}
  }, []);

  const googleLogin = useCallback(async () => {
    const BASE_URL = (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/+$/, '');
    const googleUrl = new URL('/api/auth/google', BASE_URL + '/').toString();

    if (Platform.OS === 'web') {
      try {
        const callbackUrl = `${window.location.origin}/auth/callback`;
        const url = `${googleUrl}?platform=mobile&mobile_redirect=${encodeURIComponent(callbackUrl)}`;
        window.location.href = url;
      } catch (err: any) {
        console.warn('Google SSO web:', err?.message ?? err);
      }
    } else {
      try {
        const AuthSession = await import('expo-auth-session');
        const WebBrowser = await import('expo-web-browser');
        WebBrowser.maybeCompleteAuthSession();

        const redirectUri = AuthSession.makeRedirectUri();
        console.log('Google SSO: redirectUri =', redirectUri);
        const url = `${googleUrl}?platform=mobile&mobile_redirect=${encodeURIComponent(redirectUri)}`;

        const result = await WebBrowser.openAuthSessionAsync(url, redirectUri);
        console.log('Google SSO: result type =', result?.type);

        if (result?.type === 'success' && result?.url) {
          const parsed = new URL(result.url);
          const token = parsed.searchParams.get('token');
          console.log('Google SSO: token received =', !!token);
          if (token) {
            await handleGoogleCallback(token, null);
          }
        } else if (result?.type === 'cancel' || result?.type === 'dismiss') {
          console.log('Google SSO: User cancelled or dismissed');
        }
      } catch (err: any) {
        console.warn('Google SSO error:', err?.message ?? err);
      }
    }
  }, []);

  const handleGoogleCallback = useCallback(async (token: string, userData: any) => {
    await saveToken(token);
    if (userData) {
      setUser(userData);
    } else {
      const data = await api.getMe();
      setUser(data?.user ?? null);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        signup,
        logout,
        refreshUser,
        googleLogin,
        handleGoogleCallback,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
