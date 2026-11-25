import React from 'react';
import { View, Pressable, StyleSheet, StyleProp, ViewStyle, Platform } from 'react-native';
import { useAppColors } from '../hooks/useAppColors';
import { borderRadius, spacing } from '../theme';

interface Props {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  borderTopColor?: string;
}

export function Card({ children, onPress, style, borderTopColor }: Props) {
  const c = useAppColors();
  const cardStyle: ViewStyle = {
    backgroundColor: c.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: c.cardBorder,
    padding: spacing.md,
    ...(Platform.OS === 'ios' ? {
      shadowColor: c.cardShadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 1,
      shadowRadius: 8,
    } : {
      elevation: c.cardShadow === 'transparent' ? 0 : 3,
    }),
  };
  const topBorder: ViewStyle | undefined = borderTopColor ? {
    borderTopWidth: 3,
    borderTopColor,
  } : undefined;

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          cardStyle,
          topBorder,
          pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
          style,
        ]}
      >
        {children}
      </Pressable>
    );
  }
  return <View style={[cardStyle, topBorder, style]}>{children}</View>;
}
