import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { useAuth } from '../../src/contexts/AuthContext';
import { ScreenContainer } from '../../src/components/ScreenContainer';
import { colors, spacing } from '../../src/theme';

export default function AuthCallbackScreen() {
  const { handleGoogleCallback } = useAuth();
  const [error, setError] = useState('');

  useEffect(() => {
    let token = '';

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      token = params.get('token') ?? '';
    }

    if (!token) {
      setError('No authentication token received');
      return;
    }

    handleGoogleCallback(token, null).catch((e: any) => {
      setError(e?.message ?? 'Authentication failed');
    });
  }, []);

  return (
    <ScreenContainer>
      <View style={styles.container}>
        {error ? (
          <Text style={styles.error}>{error}</Text>
        ) : (
          <>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.text}>Giriş edilir...</Text>
          </>
        )}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  text: {
    color: colors.textHeading,
    fontSize: 16,
    marginTop: spacing.md,
  },
  error: {
    color: colors.error,
    fontSize: 16,
    textAlign: 'center',
  },
});
