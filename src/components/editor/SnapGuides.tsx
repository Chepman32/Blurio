import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useAppTheme } from '../../theme';

interface SnapGuidesProps {
  showVertical: boolean;
  showHorizontal: boolean;
}

export const SnapGuides: React.FC<SnapGuidesProps> = ({
  showVertical,
  showHorizontal,
}) => {
  const { colors } = useAppTheme();
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(showHorizontal || showVertical ? 1 : 0, {
      duration: 120,
    });
  }, [showHorizontal, showVertical, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  if (!showHorizontal && !showVertical) {
    return null;
  }

  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, animatedStyle]}>
      {showVertical ? (
        <View style={[styles.vertical, { backgroundColor: `${colors.accent}AA` }]} />
      ) : null}
      {showHorizontal ? (
        <View style={[styles.horizontal, { backgroundColor: `${colors.accent}AA` }]} />
      ) : null}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  vertical: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '50%',
    width: 1,
  },
  horizontal: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '50%',
    height: 1,
  },
});
