import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
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

type BlurModeTab = Exclude<BlendMode, 'normal' | 'frosted'>;

const resolveActiveBlurMode = (blendMode: BlendMode): BlurModeTab | null => {
  if (blendMode === 'normal') {
    return null;
  }
  if (blendMode === 'frosted') {
    return null;
  }
  return blendMode;
};

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

  const activeBlurMode = resolveActiveBlurMode(blendMode);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>
      <AnimatedSlider
        label={STRINGS.params.strength}
        value={values.strength}
        onChange={next => onChangeValues({ strength: next })}
        onChangeStart={onBeginValueChange}
        onChangeEnd={onEndValueChange}
        accessibilityLabel={STRINGS.params.strength}
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
        value={activeBlurMode}
        options={[
          { label: STRINGS.params.gaussian, value: 'gaussian' },
          { label: STRINGS.params.bokeh, value: 'bokeh' },
          { label: STRINGS.params.motionBlur, value: 'motionBlur' },
          { label: STRINGS.params.bilateral, value: 'bilateral' },
          { label: STRINGS.params.smartBlur, value: 'smartBlur' },
          { label: STRINGS.params.radial, value: 'radial' },
        ]}
        accessibilityLabel={STRINGS.params.blendMode}
        wrap
        onChange={nextMode => {
          if (activeBlurMode === nextMode) {
            onChangeBlendMode('normal');
            return;
          }
          onChangeBlendMode(nextMode);
        }}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xl,
    gap: SPACING.sm,
  },
  empty: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.lg,
  },
});
