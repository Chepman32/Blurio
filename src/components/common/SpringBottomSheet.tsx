import React, { useEffect, useMemo } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { RADIUS } from '../../constants';
import { useAppTheme } from '../../theme';
import { AppText } from './AppText';

interface SpringBottomSheetProps {
  title: string;
  collapsedHeight: number;
  midHeight: number;
  expandedHeight: number;
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
}

const { height: windowHeight } = Dimensions.get('window');

export const SpringBottomSheet: React.FC<SpringBottomSheetProps> = ({
  title,
  collapsedHeight,
  midHeight,
  expandedHeight,
  expanded,
  onExpandedChange,
  headerRight,
  children,
}) => {
  const { colors, isDark } = useAppTheme();
  const snapHeights = useMemo(
    () => [collapsedHeight, midHeight, expandedHeight],
    [collapsedHeight, midHeight, expandedHeight],
  );

  const maxHeight = Math.min(expandedHeight, windowHeight * 0.82);
  const minTranslate = Math.max(windowHeight - maxHeight, 56);
  const collapsedTranslate = windowHeight - collapsedHeight;
  const translateY = useSharedValue(collapsedTranslate);
  const contextTranslate = useSharedValue(collapsedTranslate);

  useEffect(() => {
    const target = expanded ? minTranslate : collapsedTranslate;
    translateY.value = withSpring(target, {
      damping: 18,
      stiffness: 190,
    });
  }, [collapsedTranslate, expanded, minTranslate, translateY]);

  const resolveSnap = (position: number, velocityY: number): number => {
    'worklet';
    const projected = position + velocityY * 0.08;

    const points = snapHeights.map(heightValue => windowHeight - heightValue);
    if (points.length === 0) {
      return collapsedTranslate;
    }

    let nearest = points[0] ?? collapsedTranslate;
    let nearestDistance = Math.abs(projected - nearest);

    for (let i = 1; i < points.length; i += 1) {
      const point = points[i] ?? nearest;
      const distance = Math.abs(projected - point);
      if (distance < nearestDistance) {
        nearest = point;
        nearestDistance = distance;
      }
    }

    return Math.max(minTranslate, Math.min(nearest, windowHeight - collapsedHeight));
  };

  const pan = Gesture.Pan()
    .onStart(() => {
      contextTranslate.value = translateY.value;
    })
    .onUpdate(event => {
      const next = contextTranslate.value + event.translationY;
      translateY.value = Math.max(minTranslate, Math.min(next, windowHeight - collapsedHeight));
    })
    .onEnd(event => {
      const snap = resolveSnap(translateY.value, event.velocityY);
      const isExpanded =
        Math.abs(snap - minTranslate) < Math.abs(snap - collapsedTranslate);
      const finalSnap = isExpanded ? minTranslate : collapsedTranslate;

      translateY.value = withSpring(finalSnap, {
        damping: 17,
        stiffness: 180,
        velocity: event.velocityY,
      });

      runOnJS(onExpandedChange)(isExpanded);
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const solidSheetColor = isDark ? '#101219' : '#FFFFFF';

  return (
    <GestureDetector gesture={pan}>
      <Animated.View
        accessibilityLabel={title}
        style={[
          styles.sheet,
          animatedStyle,
          {
            height: maxHeight,
            backgroundColor: solidSheetColor,
            borderColor: colors.cardBorder,
          },
        ]}>
        <View style={styles.handleRow}>
          <View style={[styles.handle, { backgroundColor: colors.textMuted }]} />
          <View style={styles.titleRow}>
            <View style={styles.sideSpacer} />
            <AppText variant="section" color={colors.textSecondary}>
              {title}
            </AppText>
            <View style={styles.rightSlot}>{headerRight}</View>
          </View>
        </View>
        <View style={styles.content}>{children}</View>
      </Animated.View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderTopLeftRadius: RADIUS.sheet,
    borderTopRightRadius: RADIUS.sheet,
    borderWidth: 1,
    overflow: 'hidden',
  },
  handleRow: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 10,
    gap: 8,
  },
  titleRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  sideSpacer: {
    width: 28,
    height: 28,
  },
  rightSlot: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  handle: {
    width: 42,
    height: 4,
    borderRadius: 99,
  },
  content: {
    flex: 1,
  },
});
