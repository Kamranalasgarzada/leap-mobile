import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppColors } from '../hooks/useAppColors';
import { spacing } from '../theme';

interface Props {
  icon?: string;
  message: string;
}

export function EmptyState({ icon = 'inbox-outline', message }: Props) {
  const c = useAppColors();
  return (
    <View style={styles.container}>
      <MaterialCommunityIcons name={icon as any} size={64} color={c.textMuted} />
      <Text style={[styles.text, { color: c.textMuted }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
  },
  text: {
    fontSize: 16,
    marginTop: spacing.md,
    textAlign: 'center',
  },
});
