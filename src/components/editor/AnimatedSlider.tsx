import React, { useEffect, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { clamp } from '../../utils';
import { useAppTheme } from '../../theme';
import { AppText } from '../common/AppText';

interface AnimatedSliderProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
  onChangeStart?: () => void;
  onChangeEnd?: () => void;
  accessibilityLabel: string;
}

export const AnimatedSlider: React.FC<AnimatedSliderProps> = ({
  label,
  value,
  min = 0,
  max = 1,
  onChange,
  onChangeStart,
  onChangeEnd,
  accessibilityLabel,
}) => {
  const { colors } = useAppTheme();
  const [trackWidth, setTrackWidth] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const progress = useSharedValue(0);
  const context = useSharedValue(0);
  const active = useSharedValue(0);
  const safeValue = Number.isFinite(value) ? clamp(value, min, max) : min;
  const range = max - min;
  const safeRange = range === 0 ? 1 : range;

  useEffect(() => {
    if (isDragging) {
      return;
    }

    const normalized = clamp((safeValue - min) / safeRange, 0, 1);
    progress.value = withSpring(normalized, {
      damping: 15,
      stiffness: 190,
    });
  }, [isDragging, min, progress, safeRange, safeValue]);

  const onLayout = (event: LayoutChangeEvent) => {
    const width = event.nativeEvent.layout.width;
    setTrackWidth(current => (Math.abs(current - width) < 0.5 ? current : width));
  };

  const pan = Gesture.Pan()
    .onStart(() => {
      context.value = progress.value;
      active.value = 1;
      runOnJS(setIsDragging)(true);
      if (onChangeStart) {
        runOnJS(onChangeStart)();
      }
    })
    .onUpdate(event => {
      if (trackWidth <= 0) {
        return;
      }

      const delta = event.translationX / trackWidth;
      const next = clamp(context.value + delta, 0, 1);
      progress.value = next;
      const nextValue = min + range * next;
      if (Number.isFinite(nextValue)) {
        runOnJS(onChange)(nextValue);
      }
    })
    .onFinalize(() => {
      active.value = 0;
      runOnJS(setIsDragging)(false);
      if (onChangeEnd) {
        runOnJS(onChangeEnd)();
      }
    });

  const fillStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  const knobStyle = useAnimatedStyle(() => ({
    left: progress.value * Math.max(trackWidth - 22, 0),
    transform: [
      {
        scale: withSpring(active.value ? 1.14 : 1, {
          damping: 13,
          stiffness: 220,
        }),
      },
    ],
  }));

  return (
    <View style={styles.container} accessibilityLabel={accessibilityLabel}>
      <View style={styles.labelRow}>
        <AppText variant="micro" color={colors.textSecondary}>
          {label}
        </AppText>
        <AppText variant="micro" color={colors.textMuted}>
          {Math.round(safeValue * 100)}
        </AppText>
      </View>
      <GestureDetector gesture={pan}>
        <View style={[styles.track, { backgroundColor: colors.cardBorder }]} onLayout={onLayout}>
          <Animated.View style={[styles.fill, { backgroundColor: colors.accent }, fillStyle]} />
          <Animated.View
            style={[
              styles.knob,
              { backgroundColor: colors.sheet, borderColor: colors.accent },
              knobStyle,
            ]}
          />
        </View>
      </GestureDetector>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  track: {
    height: 22,
    borderRadius: 12,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 12,
  },
  knob: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderRadius: 12,
    borderWidth: 2,
  },
});
