import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import type { RenderStateTrack } from '../../types';
import { useAppTheme } from '../../theme';

interface RegionOverlayProps {
  track: RenderStateTrack;
  selected: boolean;
  canvasWidth: number;
  canvasHeight: number;
}

const handles = [
  { key: 'tl', x: 0, y: 0 },
  { key: 'tc', x: 0.5, y: 0 },
  { key: 'tr', x: 1, y: 0 },
  { key: 'cl', x: 0, y: 0.5 },
  { key: 'cr', x: 1, y: 0.5 },
  { key: 'bl', x: 0, y: 1 },
  { key: 'bc', x: 0.5, y: 1 },
  { key: 'br', x: 1, y: 1 },
];

const HANDLE_SIZE = 12;

export const RegionOverlay: React.FC<RegionOverlayProps> = ({
  track,
  selected,
  canvasWidth,
  canvasHeight,
}) => {
  const { colors } = useAppTheme();
  const selection = useSharedValue(selected ? 1 : 0);
  const pulse = useSharedValue(0);

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
    borderWidth: interpolate(selection.value, [0, 1], [1.3, 2.8]),
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

  const left = track.values.x * canvasWidth;
  const top = track.values.y * canvasHeight;
  const width = Math.max(track.values.width * canvasWidth, 24);
  const height = Math.max(track.values.height * canvasHeight, 24);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.region,
        outlineStyle,
        {
          left,
          top,
          width,
          height,
          borderColor: selected ? colors.accent : colors.trackStroke,
          borderRadius: track.values.cornerRadius * Math.min(width, height),
          opacity: track.values.opacity,
          transform: [{ rotate: `${track.values.rotation}deg` }],
        },
      ]}>
      <Animated.View style={[StyleSheet.absoluteFill, handlesStyle]}>
        {handles.map(handle => (
          <View
            key={handle.key}
            style={[
              styles.handle,
              {
                left: handle.x * width - HANDLE_SIZE / 2,
                top: handle.y * height - HANDLE_SIZE / 2,
                backgroundColor: colors.accent,
              },
            ]}
          />
        ))}
        <View
          style={[
            styles.rotationHandle,
            {
              left: width / 2 - HANDLE_SIZE / 2,
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
    borderStyle: 'solid',
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
