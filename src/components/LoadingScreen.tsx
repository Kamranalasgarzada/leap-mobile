import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAppColors } from '../hooks/useAppColors';

export function LoadingScreen() {
  const c = useAppColors();
  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <ActivityIndicator size="large" color={c.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
