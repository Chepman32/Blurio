import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import type { RenderStateTrack } from '../../types';
import { useAppTheme } from '../../theme';

interface RegionOverlayProps {
  track: RenderStateTrack;
  selected: boolean;
  width: number;
  height: number;
  // Worklet-driven resize (selected track only)
  liveWidthPx?: SharedValue<number>;
  liveHeightPx?: SharedValue<number>;
  isGesturing?: SharedValue<number>;
  resizeStartWorklet?: (axisX: number, axisY: number) => void;
  resizeUpdateWorklet?: (translationX: number, translationY: number) => void;
  resizeEndWorklet?: () => void;
}

const handles = [
  { key: 'tl', x: 0, y: 0, axisX: -1, axisY: -1 },
  { key: 'tc', x: 0.5, y: 0, axisX: 0, axisY: -1 },
  { key: 'tr', x: 1, y: 0, axisX: 1, axisY: -1 },
  { key: 'cl', x: 0, y: 0.5, axisX: -1, axisY: 0 },
  { key: 'cr', x: 1, y: 0.5, axisX: 1, axisY: 0 },
  { key: 'bl', x: 0, y: 1, axisX: -1, axisY: 1 },
  { key: 'bc', x: 0.5, y: 1, axisX: 0, axisY: 1 },
  { key: 'br', x: 1, y: 1, axisX: 1, axisY: 1 },
] as const;

export type RegionResizeHandleKey = (typeof handles)[number]['key'];

const HANDLE_SIZE = 12;

interface ResizeHandleProps {
  handle: {
    key: RegionResizeHandleKey;
    x: number;
    y: number;
    axisX: number;
    axisY: number;
  };
  color: string;
  resizeStartWorklet: (axisX: number, axisY: number) => void;
  resizeUpdateWorklet: (translationX: number, translationY: number) => void;
  resizeEndWorklet: () => void;
}

const ResizeHandle: React.FC<ResizeHandleProps> = ({
  handle,
  color,
  resizeStartWorklet,
  resizeUpdateWorklet,
  resizeEndWorklet,
}) => {
  const pan = useMemo(
    () =>
      Gesture.Pan()
        .hitSlop(14)
        .minDistance(0)
        .onStart(() => {
          'worklet';
          resizeStartWorklet(handle.axisX, handle.axisY);
        })
        .onUpdate(event => {
          'worklet';
          resizeUpdateWorklet(event.translationX, event.translationY);
        })
        .onFinalize(() => {
          'worklet';
          resizeEndWorklet();
        }),
    [handle.axisX, handle.axisY, resizeStartWorklet, resizeUpdateWorklet, resizeEndWorklet],
  );

  return (
    <GestureDetector gesture={pan}>
      <View
        style={[
          styles.handle,
          {
            left: `${handle.x * 100}%`,
            top: `${handle.y * 100}%`,
            marginLeft: -HANDLE_SIZE / 2,
            marginTop: -HANDLE_SIZE / 2,
            backgroundColor: color,
          },
        ]}
      />
    </GestureDetector>
  );
};

export const RegionOverlay: React.FC<RegionOverlayProps> = ({
  track,
  selected,
  width,
  height,
  liveWidthPx,
  liveHeightPx,
  isGesturing,
  resizeStartWorklet,
  resizeUpdateWorklet,
  resizeEndWorklet,
}) => {
  const { colors } = useAppTheme();
  const selection = useSharedValue(selected ? 1 : 0);
  const pulse = useSharedValue(0);
  const interactiveHandles =
    selected &&
    Boolean(resizeStartWorklet) &&
    Boolean(resizeUpdateWorklet) &&
    Boolean(resizeEndWorklet);

  useEffect(() => {
    selection.value = withTiming(selected ? 1 : 0, {
      duration: 180,
    });

    if (selected) {
      pulse.value = withRepeat(
        withTiming(1, {
          duration: 1200,
        }),
        -1,
        true,
      );
    } else {
      pulse.value = 0;
    }
  }, [pulse, selected, selection]);

  const outlineStyle = useAnimatedStyle(() => ({
    borderWidth: interpolate(selection.value, [0, 1], [0, 2.8]),
    shadowOpacity: interpolate(pulse.value, [0, 1], [0.12, 0.36]),
    shadowRadius: interpolate(pulse.value, [0, 1], [4, 12]),
  }));

  const handlesStyle = useAnimatedStyle(() => ({
    opacity: selection.value,
    transform: [
      {
        scale: withSpring(selection.value, {
          damping: 14,
          stiffness: 220,
        }),
      },
    ],
  }));

  // Animated border radius that responds to live size changes during gestures
  const animatedRegionStyle = useAnimatedStyle(() => {
    const w = liveWidthPx ? liveWidthPx.value : width;
    const h = liveHeightPx ? liveHeightPx.value : height;
    const minSize = Math.min(w, h);
    const isEllipse = track.type === 'ellipse' || track.type === 'face';
    const isSharp = track.type === 'rectangle' || track.type === 'path';
    const baseCornerRadius = track.values.cornerRadius * minSize;
    const borderRadius = isEllipse ? 9999 : isSharp ? 2 : baseCornerRadius;
    return { borderRadius };
  });

  const borderStyle = track.type === 'path' ? 'dashed' : 'solid';

  // Animated rotation handle position from live width
  const rotationHandleStyle = useAnimatedStyle(() => {
    const w = liveWidthPx ? liveWidthPx.value : width;
    return {
      left: w / 2 - HANDLE_SIZE / 2,
    };
  });

  return (
    <Animated.View
      pointerEvents={interactiveHandles ? 'box-none' : 'none'}
      style={[
        styles.region,
        outlineStyle,
        animatedRegionStyle,
        {
          left: 0,
          top: 0,
          width: '100%',
          height: '100%',
          borderColor: colors.accent,
          borderStyle,
          opacity: track.values.opacity,
          transform: [{ rotate: `${track.values.rotation}deg` }],
        },
      ]}>
      <Animated.View
        pointerEvents={interactiveHandles ? 'box-none' : 'none'}
        style={[StyleSheet.absoluteFill, handlesStyle]}>
        {handles.map(handle => (
          interactiveHandles && resizeStartWorklet && resizeUpdateWorklet && resizeEndWorklet ? (
            <ResizeHandle
              key={handle.key}
              handle={handle}
              color={colors.accent}
              resizeStartWorklet={resizeStartWorklet}
              resizeUpdateWorklet={resizeUpdateWorklet}
              resizeEndWorklet={resizeEndWorklet}
            />
          ) : (
            <View
              key={handle.key}
              style={[
                styles.handle,
                {
                  left: `${handle.x * 100}%`,
                  top: `${handle.y * 100}%`,
                  marginLeft: -HANDLE_SIZE / 2,
                  marginTop: -HANDLE_SIZE / 2,
                  backgroundColor: colors.accent,
                },
              ]}
            />
          )
        ))}
        <Animated.View
          style={[
            styles.rotationHandle,
            rotationHandleStyle,
            {
              backgroundColor: colors.accent,
            },
          ]}
        />
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  region: {
    position: 'absolute',
    shadowColor: '#00AEEF',
  },
  handle: {
    position: 'absolute',
    width: HANDLE_SIZE,
    height: HANDLE_SIZE,
    borderRadius: 8,
  },
  rotationHandle: {
    position: 'absolute',
    top: -28,
    width: HANDLE_SIZE,
    height: HANDLE_SIZE,
    borderRadius: 999,
  },
});
