import React from 'react';
import { Pressable, Text, StyleSheet, ActivityIndicator, StyleProp, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppColors } from '../hooks/useAppColors';
import { borderRadius } from '../theme';

interface Props {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function GradientButton({ title, onPress, loading, disabled, style }: Props) {
  const c = useAppColors();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [styles.container, pressed && { opacity: 0.9, transform: [{ scale: 0.97 }] }, style]}
    >
      <LinearGradient
        colors={c.gradientPrimary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.gradient, (disabled || loading) && { opacity: 0.6 }]}
      >
        {loading ? (
          <ActivityIndicator color={c.white} />
        ) : (
          <Text style={[styles.text, { color: c.white }]}>{title}</Text>
        )}
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%' },
  gradient: {
    height: 52,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
});
