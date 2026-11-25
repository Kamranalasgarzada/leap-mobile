import React from 'react';
import { View, Text, Pressable, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppColors } from '../hooks/useAppColors';
import { spacing } from '../theme';

interface Props {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
  title?: string;
  onBack?: () => void;
}

export function ScreenContainer({ children, style, edges, title, onBack }: Props) {
  const c = useAppColors();
  return (
    <SafeAreaView style={[{ flex: 1, backgroundColor: c.background }, style]} edges={edges ?? ['top', 'left', 'right']}>
      {(title || onBack) && (
        <View style={styles.header}>
          {onBack && (
            <Pressable onPress={onBack} style={styles.backBtn}>
              <MaterialCommunityIcons name="arrow-left" size={24} color={c.textHeading} />
            </Pressable>
          )}
          {title ? <Text style={[{ fontSize: 22, fontWeight: '600', color: c.textHeading }, styles.headerTitle]} numberOfLines={1}>{title}</Text> : null}
        </View>
      )}
      <View style={styles.inner}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  headerTitle: {
    flex: 1,
  },
  inner: {
    flex: 1,
  },
});
