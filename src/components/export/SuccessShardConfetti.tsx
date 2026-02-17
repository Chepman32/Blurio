import React, { useEffect } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Svg, { Polygon } from 'react-native-svg';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { useAppTheme } from '../../theme';

const { width } = Dimensions.get('window');

const SHARDS = Array.from({ length: 36 }, (_, index) => ({
  id: index,
  x: (index % 9) * (width / 9),
  y: Math.floor(index / 9) * 16,
  size: 5 + ((index * 3) % 8),
}));

const AnimatedView = Animated.createAnimatedComponent(View);

export const SuccessShardConfetti: React.FC = () => {
  const { colors } = useAppTheme();
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      60,
      withTiming(1, {
        duration: 1200,
      }),
    );
  }, [progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -progress.value * 160 }],
    opacity: 1 - progress.value,
  }));

  return (
    <AnimatedView pointerEvents="none" style={[styles.container, animatedStyle]}>
      <Svg width={width} height={220}>
        {SHARDS.map(shard => (
          <Polygon
            key={shard.id}
            points={`${shard.x},${shard.y} ${shard.x + shard.size},${shard.y + shard.size / 2} ${shard.x + 1},${shard.y + shard.size}`}
            fill={shard.id % 2 === 0 ? colors.accent : colors.success}
            opacity={0.9}
          />
        ))}
      </Svg>
    </AnimatedView>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
