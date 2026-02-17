import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Plus, Trash2 } from 'lucide-react-native';
import { PARAMETERS } from '../../../utils';
import {
  RADIUS,
  SPACING,
  STRINGS,
} from '../../../constants';
import type { InterpolationType, KeyframeParameter } from '../../../types';
import { useAppTheme } from '../../../theme';
import { BlurButton } from '../../common/BlurButton';
import { SegmentedControl } from '../../common/SegmentedControl';
import { AppText } from '../../common/AppText';

interface KeyframesPanelProps {
  interpolation: InterpolationType;
  enabledParameters: Record<KeyframeParameter, boolean>;
  onInterpolationChange: (value: InterpolationType) => void;
  onAdd: () => void;
  onDelete: () => void;
  onToggleParameter: (parameter: KeyframeParameter, enabled: boolean) => void;
}

export const KeyframesPanel: React.FC<KeyframesPanelProps> = ({
  interpolation,
  enabledParameters,
  onInterpolationChange,
  onAdd,
  onDelete,
  onToggleParameter,
}) => {
  const { colors } = useAppTheme();

  return (
    <View style={styles.container}>
      <View style={styles.actionsRow}>
        <BlurButton
          label={STRINGS.editor.addKeyframe}
          onPress={onAdd}
          accessibilityLabel={STRINGS.editor.addKeyframe}
          style={styles.actionButton}
        />
        <BlurButton
          label={STRINGS.editor.deleteKeyframe}
          onPress={onDelete}
          accessibilityLabel={STRINGS.editor.deleteKeyframe}
          variant="danger"
          style={styles.actionButton}
        />
      </View>

      <SegmentedControl
        value={interpolation}
        options={[
          { label: STRINGS.keyframes.linear, value: 'linear' },
          { label: STRINGS.keyframes.easeInOut, value: 'easeInOut' },
          { label: STRINGS.keyframes.spring, value: 'spring' },
          { label: STRINGS.keyframes.hold, value: 'hold' },
        ]}
        onChange={onInterpolationChange}
        accessibilityLabel={STRINGS.keyframes.interpolation}
      />

      <View style={styles.paramsWrap}>
        {PARAMETERS.map(parameter => {
          const enabled = enabledParameters[parameter];
          return (
            <Pressable
              key={parameter}
              accessibilityRole="switch"
              accessibilityLabel={`${parameter} keyframe parameter`}
              onPress={() => onToggleParameter(parameter, !enabled)}
              style={[
                styles.parameterChip,
                {
                  borderColor: enabled ? `${colors.accent}66` : colors.cardBorder,
                  backgroundColor: enabled ? `${colors.accent}22` : 'transparent',
                },
              ]}>
              <AppText
                variant="micro"
                color={enabled ? colors.accent : colors.textMuted}>
                {parameter}
              </AppText>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.inlineIcons}>
        <Plus size={14} color={colors.success} />
        <Trash2 size={14} color={colors.destructive} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
    paddingBottom: SPACING.md,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  actionButton: {
    flex: 1,
  },
  paramsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  parameterChip: {
    borderWidth: 1,
    borderRadius: RADIUS.control,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
  },
  inlineIcons: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
});
