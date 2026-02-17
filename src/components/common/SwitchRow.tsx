import React from 'react';
import { StyleSheet, Switch, View } from 'react-native';
import { SPACING } from '../../constants';
import { useAppTheme } from '../../theme';
import { AppText } from './AppText';

interface SwitchRowProps {
  title: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  accessibilityLabel: string;
}

export const SwitchRow: React.FC<SwitchRowProps> = ({
  title,
  value,
  onValueChange,
  accessibilityLabel,
}) => {
  const { colors } = useAppTheme();

  return (
    <View style={styles.row}>
      <AppText variant="body" color={colors.textPrimary}>
        {title}
      </AppText>
      <Switch
        accessibilityLabel={accessibilityLabel}
        value={value}
        trackColor={{ true: `${colors.accent}88`, false: colors.cardBorder }}
        thumbColor={value ? colors.accent : colors.textMuted}
        onValueChange={onValueChange}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.md,
    minHeight: 42,
  },
});
