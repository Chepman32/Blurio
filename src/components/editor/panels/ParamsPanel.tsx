import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SPACING, STRINGS } from '../../../constants';
import type { BlendMode, KeyframeValues } from '../../../types';
import { AnimatedSlider } from '../AnimatedSlider';
import { SegmentedControl } from '../../common/SegmentedControl';
import { AppText } from '../../common/AppText';

interface ParamsPanelProps {
  values: KeyframeValues | null;
  blendMode: BlendMode | null;
  onChangeValues: (partial: Partial<KeyframeValues>) => void;
  onBeginValueChange?: () => void;
  onEndValueChange?: () => void;
  onChangeBlendMode: (blendMode: BlendMode) => void;
}

export const ParamsPanel: React.FC<ParamsPanelProps> = ({
  values,
  blendMode,
  onChangeValues,
  onBeginValueChange,
  onEndValueChange,
  onChangeBlendMode,
}) => {
  if (!values || !blendMode) {
    return (
      <View style={styles.empty}>
        <AppText variant="micro" muted>
          {STRINGS.editor.noTrackBody}
        </AppText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AnimatedSlider
        label={STRINGS.params.strength}
        value={values.strength}
        onChange={next => onChangeValues({ strength: next })}
        onChangeStart={onBeginValueChange}
        onChangeEnd={onEndValueChange}
        accessibilityLabel={STRINGS.params.strength}
      />
      <AnimatedSlider
        label={STRINGS.params.feather}
        value={values.feather}
        onChange={next => onChangeValues({ feather: next })}
        onChangeStart={onBeginValueChange}
        onChangeEnd={onEndValueChange}
        accessibilityLabel={STRINGS.params.feather}
      />
      <AnimatedSlider
        label={STRINGS.params.opacity}
        value={values.opacity}
        onChange={next => onChangeValues({ opacity: next })}
        onChangeStart={onBeginValueChange}
        onChangeEnd={onEndValueChange}
        accessibilityLabel={STRINGS.params.opacity}
      />
      <AnimatedSlider
        label={STRINGS.params.cornerRadius}
        value={values.cornerRadius}
        onChange={next => onChangeValues({ cornerRadius: next })}
        onChangeStart={onBeginValueChange}
        onChangeEnd={onEndValueChange}
        accessibilityLabel={STRINGS.params.cornerRadius}
      />
      <SegmentedControl
        value={blendMode}
        options={[
          { label: STRINGS.params.normal, value: 'normal' },
          { label: STRINGS.params.frosted, value: 'frosted' },
        ]}
        accessibilityLabel={STRINGS.params.blendMode}
        onChange={onChangeBlendMode}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
    gap: SPACING.sm,
  },
  empty: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.lg,
  },
});
