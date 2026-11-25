import React, { useState, useRef } from 'react';
import { View, Text, Pressable, Modal, FlatList, StyleSheet, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { spacing, borderRadius } from '../theme';

type DropdownDef = {
  label: string;
  value: string | null;
  options: string[];
  allLabel: string;
  onSelect: (v: string | null) => void;
};

type Props = {
  dropdowns: DropdownDef[];
  accentColor: string;
  cardBg: string;
  cardBorder: string;
  textColor: string;
  mutedColor: string;
  background: string;
};

export function FilterDropdownRow({ dropdowns, accentColor, cardBg, cardBorder, textColor, mutedColor, background }: Props) {
  if ((dropdowns?.length ?? 0) === 0) return null;
  return (
    <View style={styles.row}>
      <View style={styles.labelBox}>
        <MaterialCommunityIcons name="filter-variant" size={13} color={mutedColor} />
        <Text style={[styles.label, { color: mutedColor }]}>Filtr:</Text>
      </View>
      {(dropdowns ?? []).map((d, i) => (
        <DropdownPicker
          key={i}
          label={d.label}
          value={d.value}
          options={d.options}
          allLabel={d.allLabel}
          onSelect={d.onSelect}
          accentColor={accentColor}
          cardBg={cardBg}
          cardBorder={cardBorder}
          textColor={textColor}
          mutedColor={mutedColor}
          background={background}
        />
      ))}
    </View>
  );
}

function DropdownPicker({ label, value, options, allLabel, onSelect, accentColor, cardBg, cardBorder, textColor, mutedColor, background }: DropdownDef & { accentColor: string; cardBg: string; cardBorder: string; textColor: string; mutedColor: string; background: string }) {
  const [open, setOpen] = useState(false);
  const allOptions = [null, ...options];

  const displayText = value ?? allLabel;

  return (
    <>
      <Pressable onPress={() => setOpen(true)} style={[styles.dropdown, { backgroundColor: cardBg, borderColor: value ? accentColor : cardBorder }]}>
        <Text style={[styles.dropdownText, { color: value ? accentColor : textColor }]} numberOfLines={1}>{displayText}</Text>
        <MaterialCommunityIcons name="chevron-down" size={18} color={value ? accentColor : mutedColor} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
          <View style={[styles.modal, { backgroundColor: background, borderColor: cardBorder }]}>
            <Text style={[styles.modalTitle, { color: textColor }]}>{label}</Text>
            <FlatList
              data={allOptions}
              keyExtractor={(item, idx) => item ?? `all-${idx}`}
              style={{ maxHeight: 350 }}
              renderItem={({ item }) => {
                const isSelected = item === value || (item === null && value === null);
                return (
                  <Pressable
                    onPress={() => { onSelect(item); setOpen(false); }}
                    style={[styles.option, isSelected && { backgroundColor: accentColor + '15' }]}
                  >
                    <Text style={[styles.optionText, { color: isSelected ? accentColor : textColor }]}>
                      {item ?? allLabel}
                    </Text>
                    {isSelected ? <MaterialCommunityIcons name="check" size={18} color={accentColor} /> : null}
                  </Pressable>
                );
              }}
            />
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, gap: 6, marginBottom: spacing.sm },
  labelBox: { flexDirection: 'row', alignItems: 'center', gap: 2, marginRight: 2 },
  label: { fontSize: 11, fontWeight: '600' },
  dropdown: { flexDirection: 'row', alignItems: 'center', flex: 1, paddingHorizontal: 10, paddingVertical: 7, borderRadius: borderRadius.md, borderWidth: 1, gap: 3 },
  dropdownText: { fontSize: 12, fontWeight: '500', flex: 1 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: 32 },
  modal: { width: '100%', maxWidth: 340, borderRadius: borderRadius.lg, borderWidth: 1, paddingVertical: spacing.md, ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12 }, android: { elevation: 8 }, default: {} }) },
  modalTitle: { fontSize: 16, fontWeight: '700', paddingHorizontal: spacing.md, marginBottom: spacing.sm },
  option: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingVertical: 12 },
  optionText: { fontSize: 15, fontWeight: '500' },
});
