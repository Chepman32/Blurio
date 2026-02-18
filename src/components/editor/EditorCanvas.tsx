import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { BlurioPreviewView } from '../../native';
import type { ID, Project, RenderState, RenderStateTrack } from '../../types';
import { clamp } from '../../utils';
import { useAppTheme } from '../../theme';
import { RegionOverlay } from './RegionOverlay';
import { SnapGuides } from './SnapGuides';

interface EditorCanvasProps {
  project: Project;
  renderState: RenderState;
  selectedTrackId: ID | null;
  showGuides: boolean;
  showSafeAreaOverlay: boolean;
  paused: boolean;
  onSelectTrack: (trackId: ID) => void;
  onStartTrackInteraction: () => void;
  onEndTrackInteraction: () => void;
  onUpdateTrackValues: (partial: Partial<RenderStateTrack['values']>) => void;
  onCanvasTransformChange: (zoom: number, panX: number, panY: number) => void;
  onLongPressTrack: () => void;
}

const HANDLE_MIN_SIZE = 0.08;
const HANDLE_SNAP_THRESHOLD = 0.02;
const STORE_THROTTLE_FRAMES = 4;

export const EditorCanvas: React.FC<EditorCanvasProps> = ({
  project,
  renderState,
  selectedTrackId,
  showGuides,
  showSafeAreaOverlay,
  paused,
  onSelectTrack,
  onStartTrackInteraction,
  onEndTrackInteraction,
  onUpdateTrackValues,
  onCanvasTransformChange,
  onLongPressTrack,
}) => {
  const { colors } = useAppTheme();
  const [layout, setLayout] = useState({ width: 1, height: 1 });
  const [snapVertical, setSnapVertical] = useState(false);
  const [snapHorizontal, setSnapHorizontal] = useState(false);

  const canvasZoom = useSharedValue(renderState.canvasZoom);
  const canvasPanX = useSharedValue(renderState.canvasPanX);
  const canvasPanY = useSharedValue(renderState.canvasPanY);

  const selectedTrack = useMemo(
    () => renderState.tracks.find(track => track.id === selectedTrackId) ?? null,
    [renderState.tracks, selectedTrackId],
  );

  // Layout as shared values for worklet access
  const layoutW = useSharedValue(layout.width);
  const layoutH = useSharedValue(layout.height);
  useEffect(() => {
    layoutW.value = layout.width;
    layoutH.value = layout.height;
  }, [layout.width, layout.height, layoutW, layoutH]);

  // Live overlay values (normalized 0-1) — driven by UI thread during gestures
  const liveX = useSharedValue(selectedTrack?.values.x ?? 0);
  const liveY = useSharedValue(selectedTrack?.values.y ?? 0);
  const liveW = useSharedValue(selectedTrack?.values.width ?? 0);
  const liveH = useSharedValue(selectedTrack?.values.height ?? 0);
  const isGesturing = useSharedValue(0);

  // Sync live values from props when not gesturing
  useEffect(() => {
    if (selectedTrack && !isGesturing.value) {
      liveX.value = selectedTrack.values.x;
      liveY.value = selectedTrack.values.y;
      liveW.value = selectedTrack.values.width;
      liveH.value = selectedTrack.values.height;
    }
  }, [
    selectedTrack?.values.x,
    selectedTrack?.values.y,
    selectedTrack?.values.width,
    selectedTrack?.values.height,
    isGesturing,
    liveX, liveY, liveW, liveH,
    selectedTrack,
  ]);

  // Derived pixel-space values for RegionOverlay
  const liveWidthPx = useDerivedValue(() =>
    Math.max(liveW.value * layoutW.value, 24),
  );
  const liveHeightPx = useDerivedValue(() =>
    Math.max(liveH.value * layoutH.value, 24),
  );

  // Gesture working state
  const moveStartX = useSharedValue(0);
  const moveStartY = useSharedValue(0);
  const startWidth = useSharedValue(0);
  const startHeight = useSharedValue(0);
  const startRotation = useSharedValue(0);
  const startCanvasZoom = useSharedValue(1);
  const startCanvasPanX = useSharedValue(0);
  const startCanvasPanY = useSharedValue(0);
  const activeTrackInteractions = useSharedValue(0);
  const snapVerticalShared = useSharedValue(false);
  const snapHorizontalShared = useSharedValue(false);
  const gestureAxisX = useSharedValue<number>(0);
  const gestureAxisY = useSharedValue<number>(0);
  const frameCount = useSharedValue(0);

  const updateCanvasTransform = (zoom: number, panX: number, panY: number) => {
    onCanvasTransformChange(zoom, panX, panY);
  };

  const beginTrackInteraction = () => {
    onStartTrackInteraction();
  };

  const endTrackInteraction = () => {
    onEndTrackInteraction();
  };

  // JS callback: commit final values and end interaction
  const commitAndEndInteraction = useCallback(
    (x: number, y: number, w: number, h: number) => {
      onUpdateTrackValues({ x, y, width: w, height: h });
      onEndTrackInteraction();
    },
    [onUpdateTrackValues, onEndTrackInteraction],
  );

  // JS callback: commit pan final values and end interaction
  const commitPanAndEnd = useCallback(
    (x: number, y: number) => {
      onUpdateTrackValues({ x, y });
      onEndTrackInteraction();
    },
    [onUpdateTrackValues, onEndTrackInteraction],
  );

  // JS callback: throttled store update during gesture
  const throttledUpdate = useCallback(
    (x: number, y: number, w: number, h: number) => {
      onUpdateTrackValues({ x, y, width: w, height: h });
    },
    [onUpdateTrackValues],
  );

  // JS callback: throttled pan update
  const throttledPanUpdate = useCallback(
    (x: number, y: number) => {
      onUpdateTrackValues({ x, y });
    },
    [onUpdateTrackValues],
  );

  // JS callback: commit pinch final values and end interaction
  const commitPinchAndEnd = useCallback(
    (w: number, h: number) => {
      onUpdateTrackValues({ width: w, height: h });
      onEndTrackInteraction();
    },
    [onUpdateTrackValues, onEndTrackInteraction],
  );

  const beginTrackInteractionWorklet = () => {
    'worklet';
    if (activeTrackInteractions.value === 0) {
      runOnJS(beginTrackInteraction)();
    }
    activeTrackInteractions.value += 1;
  };

  const endTrackInteractionWorklet = () => {
    'worklet';
    if (activeTrackInteractions.value <= 0) {
      activeTrackInteractions.value = 0;
      return;
    }

    activeTrackInteractions.value -= 1;
    if (activeTrackInteractions.value === 0) {
      runOnJS(endTrackInteraction)();
    }
  };

  const handleTapToPosition = (tapX: number, tapY: number) => {
    if (!selectedTrack) {
      return;
    }

    const tappedNonSelectedTrack = [...renderState.tracks]
      .sort((left, right) => right.zIndex - left.zIndex)
      .find(track => {
        if (!track.visible || track.id === selectedTrack.id) {
          return false;
        }

        const width = Math.max(track.values.width * layout.width, 24);
        const height = Math.max(track.values.height * layout.height, 24);
        const left = clamp(
          track.values.x * layout.width,
          0,
          Math.max(0, layout.width - width),
        );
        const top = clamp(
          track.values.y * layout.height,
          0,
          Math.max(0, layout.height - height),
        );

        return (
          tapX >= left &&
          tapX <= left + width &&
          tapY >= top &&
          tapY <= top + height
        );
      });

    if (tappedNonSelectedTrack) {
      onSelectTrack(tappedNonSelectedTrack.id);
      return;
    }

    const normX = tapX / layout.width;
    const normY = tapY / layout.height;

    let x = clamp(
      normX - selectedTrack.values.width / 2,
      0,
      1 - selectedTrack.values.width,
    );
    let y = clamp(
      normY - selectedTrack.values.height / 2,
      0,
      1 - selectedTrack.values.height,
    );

    const centerX = x + selectedTrack.values.width / 2;
    const centerY = y + selectedTrack.values.height / 2;
    const snapX = Math.abs(centerX - 0.5) <= 0.02;
    const snapY = Math.abs(centerY - 0.5) <= 0.02;

    if (snapX) {
      x = 0.5 - selectedTrack.values.width / 2;
    }
    if (snapY) {
      y = 0.5 - selectedTrack.values.height / 2;
    }

    setSnapVertical(snapX);
    setSnapHorizontal(snapY);

    onStartTrackInteraction();
    onUpdateTrackValues({ x, y });
    onEndTrackInteraction();

    // Update live values immediately for smooth visual
    liveX.value = x;
    liveY.value = y;

    if (snapX || snapY) {
      setTimeout(() => {
        setSnapVertical(false);
        setSnapHorizontal(false);
      }, 400);
    }
  };

  // Worklet: resize start — called from ResizeHandle gesture
  const resizeStartWorklet = (axisX: number, axisY: number) => {
    'worklet';
    isGesturing.value = 1;
    gestureAxisX.value = axisX;
    gestureAxisY.value = axisY;
    moveStartX.value = liveX.value;
    moveStartY.value = liveY.value;
    startWidth.value = liveW.value;
    startHeight.value = liveH.value;
    frameCount.value = 0;
    runOnJS(beginTrackInteraction)();
  };

  // Worklet: resize update — runs entirely on UI thread
  const resizeUpdateWorklet = (translationX: number, translationY: number) => {
    'worklet';
    const axX = gestureAxisX.value;
    const axY = gestureAxisY.value;
    const lw = layoutW.value;
    const lh = layoutH.value;
    const deltaX = translationX / Math.max(lw, 1);
    const deltaY = translationY / Math.max(lh, 1);

    const startLeft = clamp(moveStartX.value, 0, 1);
    const startTop = clamp(moveStartY.value, 0, 1);
    const startRight = clamp(moveStartX.value + startWidth.value, 0, 1);
    const startBottom = clamp(moveStartY.value + startHeight.value, 0, 1);
    const spanWidth = Math.max(startRight - startLeft, 0.01);
    const spanHeight = Math.max(startBottom - startTop, 0.01);
    const minWidth = Math.min(
      Math.max(HANDLE_MIN_SIZE, 24 / Math.max(lw, 1)),
      spanWidth,
    );
    const minHeight = Math.min(
      Math.max(HANDLE_MIN_SIZE, 24 / Math.max(lh, 1)),
      spanHeight,
    );

    let left = startLeft;
    let right = startRight;
    let top = startTop;
    let bottom = startBottom;

    if (axX === -1) {
      left = clamp(startLeft + deltaX, 0, startRight - minWidth);
    } else if (axX === 1) {
      right = clamp(startRight + deltaX, startLeft + minWidth, 1);
    }

    if (axY === -1) {
      top = clamp(startTop + deltaY, 0, startBottom - minHeight);
    } else if (axY === 1) {
      bottom = clamp(startBottom + deltaY, startTop + minHeight, 1);
    }

    const width = clamp(right - left, minWidth, 1);
    const height = clamp(bottom - top, minHeight, 1);
    const x = clamp(left, 0, 1 - width);
    const y = clamp(top, 0, 1 - height);

    // Write to live shared values — instant visual update on UI thread
    liveX.value = x;
    liveY.value = y;
    liveW.value = width;
    liveH.value = height;

    // Snap guide detection
    const centerX = x + width / 2;
    const centerY = y + height / 2;
    const snapX = Math.abs(centerX - 0.5) <= HANDLE_SNAP_THRESHOLD;
    const snapY = Math.abs(centerY - 0.5) <= HANDLE_SNAP_THRESHOLD;

    if (snapVerticalShared.value !== snapX) {
      snapVerticalShared.value = snapX;
      runOnJS(setSnapVertical)(snapX);
    }
    if (snapHorizontalShared.value !== snapY) {
      snapHorizontalShared.value = snapY;
      runOnJS(setSnapHorizontal)(snapY);
    }

    // Throttled store update for native preview sync
    frameCount.value += 1;
    if (frameCount.value % STORE_THROTTLE_FRAMES === 0) {
      runOnJS(throttledUpdate)(x, y, width, height);
    }
  };

  // Worklet: resize end — commit final values to store
  const resizeEndWorklet = () => {
    'worklet';
    isGesturing.value = 0;

    if (snapVerticalShared.value) {
      snapVerticalShared.value = false;
      runOnJS(setSnapVertical)(false);
    }
    if (snapHorizontalShared.value) {
      snapHorizontalShared.value = false;
      runOnJS(setSnapHorizontal)(false);
    }

    runOnJS(commitAndEndInteraction)(
      liveX.value,
      liveY.value,
      liveW.value,
      liveH.value,
    );
  };

  // Animated style for the selected track container
  const selectedTrackStyle = useAnimatedStyle(() => {
    const w = Math.max(liveW.value * layoutW.value, 24);
    const h = Math.max(liveH.value * layoutH.value, 24);
    const l = clamp(liveX.value * layoutW.value, 0, Math.max(0, layoutW.value - w));
    const t = clamp(liveY.value * layoutH.value, 0, Math.max(0, layoutH.value - h));
    return {
      left: l,
      top: t,
      width: w,
      height: h,
    };
  });

  const positionTap = Gesture.Tap()
    .onEnd(event => {
      if (!selectedTrack) {
        return;
      }
      runOnJS(handleTapToPosition)(event.x, event.y);
    });

  const regionPan = Gesture.Pan()
    .maxPointers(1)
    .onStart(() => {
      if (!selectedTrack) {
        return;
      }
      isGesturing.value = 1;
      frameCount.value = 0;
      moveStartX.value = liveX.value;
      moveStartY.value = liveY.value;
      beginTrackInteractionWorklet();
    })
    .onUpdate(event => {
      if (!selectedTrack) {
        return;
      }

      const dx = event.translationX / layoutW.value;
      const dy = event.translationY / layoutH.value;

      let x = clamp(moveStartX.value + dx, 0, 1 - liveW.value);
      let y = clamp(moveStartY.value + dy, 0, 1 - liveH.value);

      const centerX = x + liveW.value / 2;
      const centerY = y + liveH.value / 2;
      const snapX = Math.abs(centerX - 0.5) <= HANDLE_SNAP_THRESHOLD;
      const snapY = Math.abs(centerY - 0.5) <= HANDLE_SNAP_THRESHOLD;

      if (snapX) {
        x = 0.5 - liveW.value / 2;
      }
      if (snapY) {
        y = 0.5 - liveH.value / 2;
      }

      // Instant visual update on UI thread
      liveX.value = x;
      liveY.value = y;

      if (snapVerticalShared.value !== snapX) {
        snapVerticalShared.value = snapX;
        runOnJS(setSnapVertical)(snapX);
      }
      if (snapHorizontalShared.value !== snapY) {
        snapHorizontalShared.value = snapY;
        runOnJS(setSnapHorizontal)(snapY);
      }

      // Throttled store update
      frameCount.value += 1;
      if (frameCount.value % STORE_THROTTLE_FRAMES === 0) {
        runOnJS(throttledPanUpdate)(x, y);
      }
    })
    .onFinalize(() => {
      if (!selectedTrack) {
        return;
      }

      isGesturing.value = 0;

      if (snapVerticalShared.value) {
        snapVerticalShared.value = false;
        runOnJS(setSnapVertical)(false);
      }
      if (snapHorizontalShared.value) {
        snapHorizontalShared.value = false;
        runOnJS(setSnapHorizontal)(false);
      }

      runOnJS(commitPanAndEnd)(liveX.value, liveY.value);
    });

  const pinch = Gesture.Pinch()
    .onStart(() => {
      if (!selectedTrack) {
        return;
      }

      isGesturing.value = 1;
      frameCount.value = 0;
      beginTrackInteractionWorklet();
      startWidth.value = liveW.value;
      startHeight.value = liveH.value;
    })
    .onUpdate(event => {
      if (!selectedTrack) {
        return;
      }

      const width = clamp(startWidth.value * event.scale, 0.08, 0.95);
      const height = clamp(startHeight.value * event.scale, 0.08, 0.95);

      // Instant visual update
      liveW.value = width;
      liveH.value = height;

      // Throttled store update
      frameCount.value += 1;
      if (frameCount.value % STORE_THROTTLE_FRAMES === 0) {
        runOnJS(throttledUpdate)(liveX.value, liveY.value, width, height);
      }
    })
    .onFinalize(() => {
      if (!selectedTrack) {
        return;
      }

      isGesturing.value = 0;
      runOnJS(commitPinchAndEnd)(liveW.value, liveH.value);
    });

  const rotate = Gesture.Rotation()
    .onStart(() => {
      if (!selectedTrack) {
        return;
      }
      beginTrackInteractionWorklet();
      startRotation.value = selectedTrack.values.rotation;
    })
    .onUpdate(event => {
      if (!selectedTrack) {
        return;
      }

      const deg = startRotation.value + (event.rotation * 180) / Math.PI;
      runOnJS(onUpdateTrackValues)({ rotation: deg });
    })
    .onFinalize(() => {
      endTrackInteractionWorklet();
    });

  const twoFingerPan = Gesture.Pan()
    .minPointers(2)
    .onStart(() => {
      startCanvasPanX.value = canvasPanX.value;
      startCanvasPanY.value = canvasPanY.value;
    })
    .onUpdate(event => {
      if (canvasZoom.value <= 1) {
        return;
      }

      canvasPanX.value = startCanvasPanX.value + event.translationX;
      canvasPanY.value = startCanvasPanY.value + event.translationY;
      runOnJS(updateCanvasTransform)(
        canvasZoom.value,
        canvasPanX.value,
        canvasPanY.value,
      );
    });

  const canvasPinch = Gesture.Pinch()
    .onStart(() => {
      startCanvasZoom.value = canvasZoom.value;
    })
    .onUpdate(event => {
      const nextZoom = clamp(startCanvasZoom.value * event.scale, 1, 3.2);
      canvasZoom.value = nextZoom;
      runOnJS(updateCanvasTransform)(
        nextZoom,
        canvasPanX.value,
        canvasPanY.value,
      );
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      canvasZoom.value = withSpring(1, { damping: 17, stiffness: 210 });
      canvasPanX.value = withSpring(0, { damping: 17, stiffness: 210 });
      canvasPanY.value = withSpring(0, { damping: 17, stiffness: 210 });
      runOnJS(updateCanvasTransform)(1, 0, 0);
    });

  const longPress = Gesture.LongPress()
    .minDuration(400)
    .onEnd((_, success) => {
      if (success) {
        runOnJS(onLongPressTrack)();
      }
    });

  const composedGesture = Gesture.Simultaneous(
    Gesture.Exclusive(doubleTap, longPress, positionTap),
    regionPan,
    pinch,
    rotate,
    twoFingerPan,
    canvasPinch,
  );

  const animatedCanvasStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: canvasPanX.value },
      { translateY: canvasPanY.value },
      { scale: canvasZoom.value },
    ],
  }));

  const onLayout = (event: LayoutChangeEvent) => {
    const next = event.nativeEvent.layout;
    const width = Math.max(next.width, 1);
    const height = Math.max(next.height, 1);

    setLayout(current =>
      Math.abs(current.width - width) < 0.5 &&
      Math.abs(current.height - height) < 0.5
        ? current
        : { width, height },
    );
  };

  return (
    <GestureDetector gesture={composedGesture}>
      <View style={[styles.container, { borderColor: colors.cardBorder }]} onLayout={onLayout}>
        <Animated.View style={[styles.previewLayer, animatedCanvasStyle]}>
          <BlurioPreviewView
            sourceUri={project.video.localUri}
            paused={paused}
            quality={renderState.previewQuality}
            renderState={renderState}
          />

          <View style={StyleSheet.absoluteFill}>
            {/* Non-selected tracks: static positioning from props */}
            {renderState.tracks.map(track => {
              if (!track.visible || track.id === selectedTrackId) {
                return null;
              }

              const width = Math.max(track.values.width * layout.width, 24);
              const height = Math.max(track.values.height * layout.height, 24);
              const left = clamp(
                track.values.x * layout.width,
                0,
                Math.max(0, layout.width - width),
              );
              const top = clamp(
                track.values.y * layout.height,
                0,
                Math.max(0, layout.height - height),
              );

              return (
                <Pressable
                  key={track.id}
                  accessibilityLabel={`Select ${track.id}`}
                  accessibilityRole="button"
                  onPress={() => onSelectTrack(track.id)}
                  style={{
                    position: 'absolute',
                    left,
                    top,
                    width,
                    height,
                  }}>
                  <RegionOverlay
                    track={track}
                    selected={false}
                    width={width}
                    height={height}
                  />
                </Pressable>
              );
            })}

            {/* Selected track: animated positioning from shared values */}
            {selectedTrack && selectedTrack.visible && (
              <Animated.View
                style={[styles.selectedTrackContainer, selectedTrackStyle]}>
                <RegionOverlay
                  track={selectedTrack}
                  selected
                  width={Math.max(selectedTrack.values.width * layout.width, 24)}
                  height={Math.max(selectedTrack.values.height * layout.height, 24)}
                  liveWidthPx={liveWidthPx}
                  liveHeightPx={liveHeightPx}
                  isGesturing={isGesturing}
                  resizeStartWorklet={resizeStartWorklet}
                  resizeUpdateWorklet={resizeUpdateWorklet}
                  resizeEndWorklet={resizeEndWorklet}
                />
              </Animated.View>
            )}
          </View>

          {showGuides ? (
            <SnapGuides showVertical={snapVertical} showHorizontal={snapHorizontal} />
          ) : null}

          {showSafeAreaOverlay ? (
            <View
              pointerEvents="none"
              style={[styles.safeAreaOverlay, { borderColor: colors.safeArea }]}
            />
          ) : null}
        </Animated.View>
      </View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  previewLayer: {
    flex: 1,
  },
  selectedTrackContainer: {
    position: 'absolute',
  },
  safeAreaOverlay: {
    position: 'absolute',
    left: '8%',
    right: '8%',
    top: '10%',
    bottom: '10%',
    borderWidth: 1,
    borderRadius: 8,
  },
});
