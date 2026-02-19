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
  size?: 'default' | 'large';
}

export const SegmentedControl = <T extends string>({
  value,
  options,
  onChange,
  accessibilityLabel,
  size = 'default',
}: SegmentedControlProps<T>) => {
  const { colors } = useAppTheme();
  const large = size === 'large';

  return (
    <View
      accessibilityLabel={accessibilityLabel}
      style={[
        styles.container,
        large && styles.largeContainer,
        { backgroundColor: `${colors.card}DD`, borderColor: colors.cardBorder },
      ]}>
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
              large && styles.largeOption,
              {
                backgroundColor: selected ? `${colors.accent}22` : 'transparent',
                borderColor: selected ? `${colors.accent}55` : 'transparent',
              },
            ]}>
            <AppText
              variant={large ? 'bodyStrong' : 'micro'}
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
  largeContainer: {
    padding: 6,
    gap: SPACING.sm,
  },
  option: {
    flex: 1,
    borderRadius: RADIUS.control,
    borderWidth: 1,
    minHeight: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  largeOption: {
    minHeight: 52,
  },
});
