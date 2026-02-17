import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { RADIUS, SPACING } from '../../constants';
import { useAppTheme } from '../../theme';
import { AppText } from './AppText';

interface SegmentedOption<T extends string> {
  label: string;
  value: T;
}

interface SegmentedControlProps<T extends string> {
  value: T;
  options: SegmentedOption<T>[];
  onChange: (value: T) => void;
  accessibilityLabel: string;
}

export const SegmentedControl = <T extends string>({
  value,
  options,
  onChange,
  accessibilityLabel,
}: SegmentedControlProps<T>) => {
  const { colors } = useAppTheme();

  return (
    <View
      accessibilityLabel={accessibilityLabel}
      style={[styles.container, { backgroundColor: `${colors.card}DD`, borderColor: colors.cardBorder }]}>
      {options.map(option => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityLabel={`${accessibilityLabel} ${option.label}`}
            onPress={() => onChange(option.value)}
            style={[
              styles.option,
              {
                backgroundColor: selected ? `${colors.accent}22` : 'transparent',
                borderColor: selected ? `${colors.accent}55` : 'transparent',
              },
            ]}>
            <AppText
              variant="micro"
              color={selected ? colors.accent : colors.textSecondary}>
              {option.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: RADIUS.control,
    padding: 4,
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  option: {
    flex: 1,
    borderRadius: RADIUS.control,
    borderWidth: 1,
    minHeight: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
