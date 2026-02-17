import React, { useMemo, useState } from 'react';
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

  const updateCanvasTransform = (zoom: number, panX: number, panY: number) => {
    onCanvasTransformChange(zoom, panX, panY);
  };

  const beginTrackInteraction = () => {
    onStartTrackInteraction();
  };

  const endTrackInteraction = () => {
    onEndTrackInteraction();
  };

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

  const regionPan = Gesture.Pan()
    .maxPointers(1)
    .onStart(() => {
      if (!selectedTrack) {
        return;
      }
      beginTrackInteractionWorklet();
      moveStartX.value = selectedTrack.values.x;
      moveStartY.value = selectedTrack.values.y;
    })
    .onUpdate(event => {
      if (!selectedTrack) {
        return;
      }

      const dx = event.translationX / layout.width;
      const dy = event.translationY / layout.height;

      let x = clamp(moveStartX.value + dx, 0, 1 - selectedTrack.values.width);
      let y = clamp(moveStartY.value + dy, 0, 1 - selectedTrack.values.height);

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

      if (snapVerticalShared.value !== snapX) {
        snapVerticalShared.value = snapX;
        runOnJS(setSnapVertical)(snapX);
      }
      if (snapHorizontalShared.value !== snapY) {
        snapHorizontalShared.value = snapY;
        runOnJS(setSnapHorizontal)(snapY);
      }
      runOnJS(onUpdateTrackValues)({ x, y });
    })
    .onFinalize(() => {
      if (snapVerticalShared.value) {
        snapVerticalShared.value = false;
        runOnJS(setSnapVertical)(false);
      }
      if (snapHorizontalShared.value) {
        snapHorizontalShared.value = false;
        runOnJS(setSnapHorizontal)(false);
      }
      endTrackInteractionWorklet();
    });

  const pinch = Gesture.Pinch()
    .onStart(() => {
      if (!selectedTrack) {
        return;
      }

      beginTrackInteractionWorklet();
      startWidth.value = selectedTrack.values.width;
      startHeight.value = selectedTrack.values.height;
    })
    .onUpdate(event => {
      if (!selectedTrack) {
        return;
      }

      const width = clamp(startWidth.value * event.scale, 0.08, 0.95);
      const height = clamp(startHeight.value * event.scale, 0.08, 0.95);
      runOnJS(onUpdateTrackValues)({ width, height });
    })
    .onFinalize(() => {
      endTrackInteractionWorklet();
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
    Gesture.Exclusive(doubleTap, longPress),
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
            {renderState.tracks.map(track => {
              if (!track.visible) {
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
                    selected={selectedTrackId === track.id}
                    width={width}
                    height={height}
                  />
                </Pressable>
              );
            })}
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
