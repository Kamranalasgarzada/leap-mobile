import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { spacing, borderRadius } from '../theme';

type Props = {
  label: string;
  icon?: string;
  items: string[];
  selected: string | null;
  onSelect: (item: string | null) => void;
  accentColor: string;
  allLabel?: string;
  cardBg: string;
  cardBorder: string;
  textColor: string;
  mutedColor: string;
};

export function FilterChipRow({ label, icon, items, selected, onSelect, accentColor, allLabel = 'Hamısı', cardBg, cardBorder, textColor, mutedColor }: Props) {
  if ((items?.length ?? 0) === 0) return null;
  return (
    <View style={styles.wrapper}>
      <View style={styles.labelRow}>
        {icon ? <MaterialCommunityIcons name={icon as any} size={14} color={mutedColor} /> : null}
        <Text style={[styles.label, { color: mutedColor }]}>{label}</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
        <Pressable
          onPress={() => onSelect(null)}
          style={[styles.chip, { backgroundColor: selected === null ? accentColor : cardBg, borderColor: selected === null ? accentColor : cardBorder }]}
        >
          <Text style={[styles.chipText, { color: selected === null ? '#FFF' : textColor }]}>{allLabel}</Text>
        </Pressable>
        {(items ?? []).map(item => (
          <Pressable
            key={item}
            onPress={() => onSelect(selected === item ? null : item)}
            style={[styles.chip, { backgroundColor: selected === item ? accentColor : cardBg, borderColor: selected === item ? accentColor : cardBorder }]}
          >
            <Text style={[styles.chipText, { color: selected === item ? '#FFF' : textColor }]} numberOfLines={1}>{item}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: spacing.xs },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.md, marginBottom: 6 },
  label: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  chipScroll: { paddingHorizontal: spacing.md, gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: borderRadius.full, borderWidth: 1 },
  chipText: { fontSize: 13, fontWeight: '600' },
});
