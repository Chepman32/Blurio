import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  onTrackRangeChange: (trackId: ID, startMs: number, endMs: number) => void;
}

const widthBase = 340;
const MIN_TRACK_DURATION_MS = 80;
const HANDLE_TOUCH_WIDTH = 18;
const SCRUB_SYNC_EVERY_N_UPDATES = 2;

interface TrackRange {
  startMs: number;
  endMs: number;
}

const getTrackRange = (track: Track, durationMs: number): TrackRange => {
  const safeDuration = Math.max(0, durationMs);
  const rawStart = Number.isFinite(track.startMs) ? (track.startMs as number) : 0;
  const rawEnd = Number.isFinite(track.endMs) ? (track.endMs as number) : safeDuration;
  const startMs = clamp(rawStart, 0, safeDuration);
  const endMs = clamp(Math.max(rawEnd, startMs), startMs, safeDuration);
  return {
    startMs,
    endMs,
  };
};

interface TimelineTrackLaneProps {
  track: Track;
  selected: boolean;
  durationMs: number;
  contentWidth: number;
  nearestMarker: number | null;
  onPlayheadChange: (nextMs: number, withSnap: boolean) => void;
  onMarkerLongPress: (trackId: ID, keyframeId: ID) => void;
  onTrackRangeChange: (trackId: ID, startMs: number, endMs: number) => void;
}

const TimelineTrackLane: React.FC<TimelineTrackLaneProps> = ({
  track,
  selected,
  durationMs,
  contentWidth,
  nearestMarker,
  onPlayheadChange,
  onMarkerLongPress,
  onTrackRangeChange,
}) => {
  const { colors } = useAppTheme();
  const safeDuration = Math.max(durationMs, 1);
  const persistedRange = getTrackRange(track, safeDuration);

  const [draftRange, setDraftRange] = useState<TrackRange | null>(null);
  const dragStartRef = useRef<TrackRange>(persistedRange);
  const latestDraftRef = useRef<TrackRange>(persistedRange);

  useEffect(() => {
    if (!draftRange) {
      latestDraftRef.current = persistedRange;
    }
  }, [draftRange, persistedRange]);

  const beginDrag = useCallback(() => {
    const base = draftRange ?? persistedRange;
    dragStartRef.current = base;
    latestDraftRef.current = base;
    setDraftRange(base);
  }, [draftRange, persistedRange]);

  const updateDraft = useCallback((next: TrackRange) => {
    latestDraftRef.current = next;
    setDraftRange(next);
  }, []);

  const updateLeftHandle = useCallback(
    (translationX: number) => {
      const base = dragStartRef.current;
      const deltaMs = (translationX / Math.max(contentWidth, 1)) * safeDuration;
      const maxStart = Math.max(0, base.endMs - MIN_TRACK_DURATION_MS);
      const startMs = clamp(base.startMs + deltaMs, 0, maxStart);
      updateDraft({ startMs, endMs: base.endMs });
    },
    [contentWidth, safeDuration, updateDraft],
  );

  const updateRightHandle = useCallback(
    (translationX: number) => {
      const base = dragStartRef.current;
      const deltaMs = (translationX / Math.max(contentWidth, 1)) * safeDuration;
      const minEnd = Math.min(safeDuration, base.startMs + MIN_TRACK_DURATION_MS);
      const endMs = clamp(base.endMs + deltaMs, minEnd, safeDuration);
      updateDraft({ startMs: base.startMs, endMs });
    },
    [contentWidth, safeDuration, updateDraft],
  );

  const commitDrag = useCallback(() => {
    const next = latestDraftRef.current;
    setDraftRange(null);
    onTrackRangeChange(track.id, next.startMs, next.endMs);
  }, [onTrackRangeChange, track.id]);

  const leftHandlePan = useMemo(
    () =>
      Gesture.Pan()
        .minDistance(1)
        .onStart(() => {
          runOnJS(beginDrag)();
        })
        .onUpdate(event => {
          runOnJS(updateLeftHandle)(event.translationX);
        })
        .onFinalize(() => {
          runOnJS(commitDrag)();
        }),
    [beginDrag, commitDrag, updateLeftHandle],
  );

  const rightHandlePan = useMemo(
    () =>
      Gesture.Pan()
        .minDistance(1)
        .onStart(() => {
          runOnJS(beginDrag)();
        })
        .onUpdate(event => {
          runOnJS(updateRightHandle)(event.translationX);
        })
        .onFinalize(() => {
          runOnJS(commitDrag)();
        }),
    [beginDrag, commitDrag, updateRightHandle],
  );

  const range = draftRange ?? persistedRange;
  const left = (range.startMs / safeDuration) * contentWidth;
  const right = (range.endMs / safeDuration) * contentWidth;
  const width = Math.max(right - left, 2);

  return (
    <View
      style={[
        styles.trackLane,
        {
          backgroundColor: selected ? `${colors.accent}14` : 'transparent',
          borderColor: `${track.color}55`,
        },
      ]}>
      <View
        pointerEvents="none"
        style={[
          styles.rangeBlock,
          {
            left,
            width,
            borderColor: selected ? `${colors.accent}88` : `${track.color}66`,
            backgroundColor: selected ? `${colors.accent}22` : `${track.color}22`,
          },
        ]}>
        <AppText
          variant="micro"
          color={selected ? colors.accent : colors.textSecondary}
          numberOfLines={1}
          style={styles.trackLabel}>
          {track.name}
        </AppText>
      </View>

      <GestureDetector gesture={leftHandlePan}>
        <View
          accessibilityRole="adjustable"
          accessibilityLabel={`Adjust start of ${track.name}`}
          style={[styles.rangeHandleTouch, { left: left - HANDLE_TOUCH_WIDTH / 2 }]}>
          <View style={[styles.rangeHandleBar, { backgroundColor: colors.accent }]} />
        </View>
      </GestureDetector>

      <GestureDetector gesture={rightHandlePan}>
        <View
          accessibilityRole="adjustable"
          accessibilityLabel={`Adjust end of ${track.name}`}
          style={[styles.rangeHandleTouch, { left: right - HANDLE_TOUCH_WIDTH / 2 }]}>
          <View style={[styles.rangeHandleBar, { backgroundColor: colors.accent }]} />
        </View>
      </GestureDetector>

      {track.keyframes.map(keyframe => {
        const markerLeft = (keyframe.timeMs / safeDuration) * contentWidth;
        return (
          <Pressable
            key={keyframe.id}
            accessibilityRole="button"
            accessibilityLabel={`Keyframe ${keyframe.timeMs}`}
            onPress={() => onPlayheadChange(keyframe.timeMs, false)}
            onLongPress={() => onMarkerLongPress(track.id, keyframe.id)}
            style={[styles.markerTapArea, { left: markerLeft - 14 }]}>
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
};

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
  onTrackRangeChange,
}) => {
  const { colors } = useAppTheme();
  const contentWidth = Math.max(widthBase * zoom, widthBase);
  const safeDuration = Math.max(durationMs, 1);
  const pixelsPerMs = contentWidth / safeDuration;

  const panStartPlayhead = useSharedValue(0);
  const zoomStart = useSharedValue(zoom);
  const snapPulse = useSharedValue(0);
  const playheadVisualMs = useSharedValue(playheadMs);
  const scrubFrameCount = useSharedValue(0);
  const [isScrubbing, setIsScrubbing] = useState(false);

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

  useEffect(() => {
    if (!isScrubbing) {
      playheadVisualMs.value = playheadMs;
    }
  }, [isScrubbing, playheadMs, playheadVisualMs]);

  const scrubPan = Gesture.Pan()
    .onStart(() => {
      panStartPlayhead.value = playheadVisualMs.value;
      scrubFrameCount.value = 0;
      runOnJS(setIsScrubbing)(true);
    })
    .onUpdate(event => {
      const deltaMs = event.translationX / pixelsPerMs;
      const next = clamp(panStartPlayhead.value + deltaMs, 0, safeDuration);
      playheadVisualMs.value = next;
      scrubFrameCount.value += 1;
      if (scrubFrameCount.value % SCRUB_SYNC_EVERY_N_UPDATES === 0) {
        runOnJS(onPlayheadChange)(next, false);
      }
    })
    .onEnd(event => {
      let target = playheadVisualMs.value;
      if (Math.abs(event.velocityX) >= 500) {
        const inertialDeltaMs = (event.velocityX / pixelsPerMs) * 0.08;
        target = clamp(target + inertialDeltaMs, 0, safeDuration);
      }

      playheadVisualMs.value = target;
      runOnJS(onPlayheadChange)(target, false);
    })
    .onFinalize(() => {
      runOnJS(setIsScrubbing)(false);
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

  const playheadStyle = useAnimatedStyle(() => {
    const progress = clamp(playheadVisualMs.value / safeDuration, 0, 1);
    return {
      left: progress * contentWidth,
      transform: [
        {
          scaleX: withSpring(snapPulse.value ? 1.8 : 1, {
            damping: 12,
            stiffness: 230,
          }),
        },
      ],
    };
  });

  const thumbnailPlaybackFillStyle = useAnimatedStyle(() => {
    const progress = clamp(playheadVisualMs.value / safeDuration, 0, 1);
    return {
      width: progress * contentWidth,
    };
  });

  const thumbnailPlaybackHeadStyle = useAnimatedStyle(() => {
    const progress = clamp(playheadVisualMs.value / safeDuration, 0, 1);
    return {
      left: Math.max(0, progress * contentWidth - 4),
    };
  });

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
          <View style={styles.thumbnailWrap}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={[styles.thumbnailRow, { width: contentWidth }]}
              scrollEnabled={false}>
              {thumbnailUris.map(uri => (
                <Image key={uri} source={{ uri }} style={styles.thumbnail} resizeMode="cover" />
              ))}
            </ScrollView>
            <View
              pointerEvents="none"
              style={[styles.thumbnailPlaybackOverlay, { width: contentWidth }]}>
              <View
                style={[
                  styles.thumbnailPlaybackRail,
                  { backgroundColor: `${colors.cardBorder}BB` },
                ]}
              />
              <Animated.View
                style={[
                  styles.thumbnailPlaybackFill,
                  { backgroundColor: colors.accent },
                  thumbnailPlaybackFillStyle,
                ]}
              />
              <Animated.View
                style={[
                  styles.thumbnailPlaybackHead,
                  thumbnailPlaybackHeadStyle,
                  {
                    backgroundColor: colors.accent,
                    borderColor: colors.sheet,
                  },
                ]}
              />
            </View>
          </View>
        ) : null}

        <View style={styles.lanesWrap}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ width: contentWidth }}
            scrollEnabled={false}>
            <View style={styles.lanesInner}>
              {tracks.map(track => (
                <TimelineTrackLane
                  key={track.id}
                  track={track}
                  selected={selectedTrackId === track.id}
                  durationMs={safeDuration}
                  contentWidth={contentWidth}
                  nearestMarker={nearestMarker}
                  onPlayheadChange={onPlayheadChange}
                  onMarkerLongPress={onMarkerLongPress}
                  onTrackRangeChange={onTrackRangeChange}
                />
              ))}

              <Animated.View
                pointerEvents="none"
                style={[
                  styles.playhead,
                  playheadStyle,
                  {
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
  thumbnailWrap: {
    height: 44,
  },
  thumbnailRow: {
    flexDirection: 'row',
    height: 44,
  },
  thumbnail: {
    width: 48,
    height: 44,
  },
  thumbnailPlaybackOverlay: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    height: 10,
    justifyContent: 'flex-end',
  },
  thumbnailPlaybackRail: {
    height: 2,
    width: '100%',
  },
  thumbnailPlaybackFill: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    height: 2,
  },
  thumbnailPlaybackHead: {
    position: 'absolute',
    bottom: -3,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
  },
  lanesWrap: {
    flex: 1,
  },
  lanesInner: {
    flex: 1,
    gap: 8,
    paddingVertical: SPACING.xs,
  },
  trackLane: {
    minHeight: 48,
    borderRadius: 8,
    borderWidth: 1,
    marginHorizontal: SPACING.xs,
    justifyContent: 'center',
    overflow: 'visible',
  },
  rangeBlock: {
    position: 'absolute',
    top: 6,
    bottom: 6,
    borderRadius: 7,
    borderWidth: 1,
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  trackLabel: {
    fontWeight: '600',
  },
  rangeHandleTouch: {
    position: 'absolute',
    top: -3,
    bottom: -3,
    width: HANDLE_TOUCH_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  rangeHandleBar: {
    width: 3,
    height: '76%',
    borderRadius: 3,
  },
  markerTapArea: {
    position: 'absolute',
    width: 28,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 6,
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
