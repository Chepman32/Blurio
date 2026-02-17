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
  accessibilityLabel: string;
}

export const AnimatedSlider: React.FC<AnimatedSliderProps> = ({
  label,
  value,
  min = 0,
  max = 1,
  onChange,
  accessibilityLabel,
}) => {
  const { colors } = useAppTheme();
  const [trackWidth, setTrackWidth] = useState(0);
  const progress = useSharedValue(0);
  const context = useSharedValue(0);
  const active = useSharedValue(0);

  useEffect(() => {
    const normalized = clamp((value - min) / (max - min), 0, 1);
    progress.value = withSpring(normalized, {
      damping: 15,
      stiffness: 190,
    });
  }, [max, min, progress, value]);

  const onLayout = (event: LayoutChangeEvent) => {
    const width = event.nativeEvent.layout.width;
    setTrackWidth(current => (Math.abs(current - width) < 0.5 ? current : width));
  };

  const pan = Gesture.Pan()
    .onStart(() => {
      context.value = progress.value;
      active.value = 1;
    })
    .onUpdate(event => {
      if (trackWidth <= 0) {
        return;
      }

      const delta = event.translationX / trackWidth;
      const next = clamp(context.value + delta, 0, 1);
      progress.value = next;
      runOnJS(onChange)(min + (max - min) * next);
    })
    .onEnd(() => {
      active.value = 0;
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
          {Math.round(value * 100)}
        </AppText>
      </View>
      <GestureDetector gesture={pan}>
        <View style={[styles.track, { backgroundColor: colors.cardBorder }]} onLayout={onLayout}>
          <Animated.View style={[styles.fill, { backgroundColor: colors.accent }, fillStyle]} />
          <Animated.View style={[styles.knob, { backgroundColor: colors.accent }, knobStyle]} />
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
  },
});
