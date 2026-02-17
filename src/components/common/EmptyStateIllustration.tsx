import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Rect } from 'react-native-svg';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useAppTheme } from '../../theme';

const AnimatedView = Animated.createAnimatedComponent(View);

export const EmptyStateIllustration: React.FC = () => {
  const { colors } = useAppTheme();
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, {
        duration: 2200,
        easing: Easing.inOut(Easing.quad),
      }),
      -1,
      true,
    );
  }, [progress]);

  const bubbleStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: progress.value * -8 }],
    opacity: 0.5 + progress.value * 0.4,
  }));

  return (
    <View style={styles.container}>
      <Svg width={180} height={140}>
        <Rect
          x={24}
          y={24}
          width={132}
          height={92}
          rx={18}
          fill={`${colors.accent}22`}
          stroke={`${colors.accent}66`}
          strokeWidth={2}
        />
        <Rect
          x={58}
          y={44}
          width={64}
          height={20}
          rx={8}
          fill={`${colors.accent}55`}
        />
        <Rect
          x={52}
          y={72}
          width={78}
          height={10}
          rx={4}
          fill={colors.cardBorder}
        />
      </Svg>
      <AnimatedView style={[styles.bubble, bubbleStyle]}>
        <Svg width={52} height={52}>
          <Circle cx={26} cy={26} r={22} fill={`${colors.accent}33`} />
          <Circle cx={26} cy={26} r={12} fill={`${colors.accent}77`} />
        </Svg>
      </AnimatedView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  bubble: {
    position: 'absolute',
    right: 20,
    top: 6,
  },
});
