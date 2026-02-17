import React, { useEffect, useMemo } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  ZoomIn,
  ZoomOut,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import type { ID, Track } from '../../types';
import {
  SPACING,
  STRINGS,
  TIMELINE_MAX_ZOOM,
  TIMELINE_MIN_ZOOM,
} from '../../constants';
import { clamp } from '../../utils';
import { useAppTheme } from '../../theme';
import { AppText } from '../common/AppText';

interface TimelineProps {
  durationMs: number;
  playheadMs: number;
  zoom: number;
  expanded: boolean;
  precisionMode: boolean;
  selectedTrackId: ID | null;
  tracks: Track[];
  thumbnailUris: string[];
  showThumbnails: boolean;
  onPlayheadChange: (nextMs: number, withSnap: boolean) => void;
  onZoomChange: (nextZoom: number) => void;
  onExpandedChange: (expanded: boolean) => void;
  onPrecisionModeChange: (enabled: boolean) => void;
  onMarkerLongPress: (trackId: ID, keyframeId: ID) => void;
}

const widthBase = 340;

export const Timeline: React.FC<TimelineProps> = ({
  durationMs,
  playheadMs,
  zoom,
  expanded,
  precisionMode,
  selectedTrackId,
  tracks,
  thumbnailUris,
  showThumbnails,
  onPlayheadChange,
  onZoomChange,
  onExpandedChange,
  onPrecisionModeChange,
  onMarkerLongPress,
}) => {
  const { colors } = useAppTheme();
  const contentWidth = Math.max(widthBase * zoom, widthBase);
  const pixelsPerMs = contentWidth / Math.max(durationMs, 1);

  const panStartPlayhead = useSharedValue(0);
  const zoomStart = useSharedValue(zoom);
  const snapPulse = useSharedValue(0);

  const markerTimes = useMemo(
    () => tracks.flatMap(track => track.keyframes.map(keyframe => keyframe.timeMs)),
    [tracks],
  );

  const nearestMarker = useMemo(() => {
    if (markerTimes.length === 0) {
      return null;
    }

    let nearest = markerTimes[0] ?? 0;
    let distance = Math.abs(playheadMs - nearest);

    for (let i = 1; i < markerTimes.length; i += 1) {
      const markerTime = markerTimes[i] ?? nearest;
      const delta = Math.abs(playheadMs - markerTime);
      if (delta < distance) {
        distance = delta;
        nearest = markerTime;
      }
    }

    if (distance > 120) {
      return null;
    }

    return nearest;
  }, [markerTimes, playheadMs]);

  const scrubPan = Gesture.Pan()
    .onStart(() => {
      panStartPlayhead.value = playheadMs;
    })
    .onUpdate(event => {
      const deltaMs = event.translationX / pixelsPerMs;
      const next = clamp(panStartPlayhead.value + deltaMs, 0, durationMs);
      runOnJS(onPlayheadChange)(next, true);
    })
    .onEnd(event => {
      if (Math.abs(event.velocityX) < 500) {
        return;
      }

      const inertialDeltaMs = (event.velocityX / pixelsPerMs) * 0.16;
      const target = clamp(playheadMs + inertialDeltaMs, 0, durationMs);
      runOnJS(onPlayheadChange)(target, true);
    });

  const pinch = Gesture.Pinch()
    .onStart(() => {
      zoomStart.value = zoom;
    })
    .onUpdate(event => {
      const nextZoom = clamp(
        zoomStart.value * event.scale,
        TIMELINE_MIN_ZOOM,
        TIMELINE_MAX_ZOOM,
      );
      runOnJS(onZoomChange)(nextZoom);
    });

  const verticalSwipe = Gesture.Pan()
    .minPointers(1)
    .maxPointers(1)
    .onEnd(event => {
      if (event.translationY < -38) {
        runOnJS(onExpandedChange)(true);
        runOnJS(onPrecisionModeChange)(true);
      }

      if (event.translationY > 38) {
        runOnJS(onExpandedChange)(false);
        runOnJS(onPrecisionModeChange)(false);
      }
    });

  const composed = Gesture.Simultaneous(scrubPan, pinch, verticalSwipe);

  const playheadStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scaleX: withSpring(snapPulse.value ? 1.8 : 1, {
          damping: 12,
          stiffness: 230,
        }),
      },
    ],
  }));

  useEffect(() => {
    snapPulse.value = nearestMarker !== null ? 1 : 0;
  }, [nearestMarker, snapPulse]);

  return (
    <GestureDetector gesture={composed}>
      <View
        accessibilityLabel={STRINGS.accessibility.timeline}
        style={[
          styles.container,
          {
            borderColor: colors.cardBorder,
            backgroundColor: `${colors.sheet}DD`,
            height: expanded ? 220 : 140,
          },
        ]}>
        {showThumbnails ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[styles.thumbnailRow, { width: contentWidth }]}
            scrollEnabled={false}>
            {thumbnailUris.map(uri => (
              <Image key={uri} source={{ uri }} style={styles.thumbnail} resizeMode="cover" />
            ))}
          </ScrollView>
        ) : null}

        <View style={styles.lanesWrap}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ width: contentWidth }}
            scrollEnabled={false}>
            <View style={styles.lanesInner}>
              {tracks.map(track => {
                const selected = selectedTrackId === track.id;

                return (
                  <View
                    key={track.id}
                    style={[
                      styles.trackLane,
                      {
                        backgroundColor: selected
                          ? `${colors.accent}1D`
                          : 'transparent',
                        borderColor: `${track.color}55`,
                      },
                    ]}>
                    <AppText
                      variant="micro"
                      color={selected ? colors.accent : colors.textMuted}
                      numberOfLines={1}
                      style={styles.trackLabel}>
                      {track.name}
                    </AppText>
                    {track.keyframes.map(keyframe => {
                      const left = (keyframe.timeMs / Math.max(durationMs, 1)) * contentWidth;
                      return (
                        <Pressable
                          key={keyframe.id}
                          accessibilityRole="button"
                          accessibilityLabel={`Keyframe ${keyframe.timeMs}`}
                          onPress={() => onPlayheadChange(keyframe.timeMs, false)}
                          onLongPress={() =>
                            onMarkerLongPress(track.id, keyframe.id)
                          }
                          style={[styles.markerTapArea, { left: left - 14 }]}>
                          <Animated.View
                            entering={ZoomIn.springify()}
                            exiting={ZoomOut}
                            style={[
                              styles.marker,
                              {
                                backgroundColor:
                                  selected && nearestMarker === keyframe.timeMs
                                    ? colors.accent
                                    : colors.textSecondary,
                              },
                            ]}
                          />
                        </Pressable>
                      );
                    })}
                  </View>
                );
              })}

              <Animated.View
                pointerEvents="none"
                style={[
                  styles.playhead,
                  playheadStyle,
                  {
                    left: (playheadMs / Math.max(durationMs, 1)) * contentWidth,
                    backgroundColor: colors.accent,
                  },
                ]}
              />
            </View>
          </ScrollView>
        </View>

        <View style={styles.footer}>
          <AppText variant="micro" color={colors.textMuted}>
            {precisionMode
              ? STRINGS.accessibility.timelineModePrecision
              : STRINGS.accessibility.timelineModeStandard}
          </AppText>
          <AppText variant="micro" color={colors.textMuted}>
            {Math.round(zoom * 100)}%
          </AppText>
        </View>
      </View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  thumbnailRow: {
    flexDirection: 'row',
    height: 44,
  },
  thumbnail: {
    width: 48,
    height: 44,
  },
  lanesWrap: {
    flex: 1,
  },
  lanesInner: {
    flex: 1,
    gap: 6,
    paddingVertical: SPACING.xs,
  },
  trackLane: {
    minHeight: 28,
    borderRadius: 8,
    borderWidth: 1,
    marginHorizontal: SPACING.xs,
    justifyContent: 'center',
  },
  trackLabel: {
    marginLeft: 6,
  },
  markerTapArea: {
    position: 'absolute',
    width: 28,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  marker: {
    width: 9,
    height: 9,
    borderRadius: 6,
  },
  playhead: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
  },
  footer: {
    paddingHorizontal: SPACING.sm,
    paddingBottom: SPACING.xs,
    paddingTop: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
