import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Share2 } from 'lucide-react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import {
  AddRegionPanel,
  EditorCanvas,
  KeyframesPanel,
  ParamsPanel,
  RegionsPanel,
  Timeline,
  ToolDock,
  ViewPanel,
} from '../components/editor';
import {
  ActionSheetModal,
  AppText,
  GradientBackground,
  SpringBottomSheet,
} from '../components/common';
import {
  MAX_SHEET_HEIGHT,
  MID_SHEET_HEIGHT,
  MIN_SHEET_HEIGHT,
  DEFAULT_KEYFRAME_VALUES,
  SPACING,
  STRINGS,
} from '../constants';
import { useAppLifecycle, useHaptics, useProjectHealthChecks } from '../hooks';
import { useAppTheme } from '../theme';
import { useCurrentRenderState, useEditorStore, useSelectedProject } from '../store';
import type { ID, RootStackParamList } from '../types';
import { checkAssetAvailability } from '../utils';

type Props = NativeStackScreenProps<RootStackParamList, 'Editor'>;

export const EditorScreen: React.FC<Props> = ({ navigation, route }) => {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { tick, impact, warning } = useHaptics();

  const project = useSelectedProject();
  const renderState = useCurrentRenderState();

  const ui = useEditorStore(state => state.ui);
  const setPlayhead = useEditorStore(state => state.setPlayhead);
  const setTimelineZoom = useEditorStore(state => state.setTimelineZoom);
  const setTimelineExpanded = useEditorStore(state => state.setTimelineExpanded);
  const setTimelinePrecisionMode = useEditorStore(
    state => state.setTimelinePrecisionMode,
  );
  const setCanvasTransform = useEditorStore(state => state.setCanvasTransform);
  const setActivePanel = useEditorStore(state => state.setActivePanel);
  const setSheetExpanded = useEditorStore(state => state.setSheetExpanded);
  const addTrack = useEditorStore(state => state.addTrack);
  const selectTrack = useEditorStore(state => state.selectTrack);
  const removeTrack = useEditorStore(state => state.removeTrack);
  const toggleTrackVisibility = useEditorStore(state => state.toggleTrackVisibility);
  const toggleTrackLock = useEditorStore(state => state.toggleTrackLock);
  const reorderTracks = useEditorStore(state => state.reorderTracks);
  const updateSelectedTrackValuesAtPlayhead = useEditorStore(
    state => state.updateSelectedTrackValuesAtPlayhead,
  );
  const updateSelectedTrackValuesLive = useEditorStore(
    state => state.updateSelectedTrackValuesLive,
  );
  const beginTrackValueInteraction = useEditorStore(
    state => state.beginTrackValueInteraction,
  );
  const endTrackValueInteraction = useEditorStore(
    state => state.endTrackValueInteraction,
  );
  const setTrackBlendMode = useEditorStore(state => state.setTrackBlendMode);
  const addKeyframeAtPlayhead = useEditorStore(state => state.addKeyframeAtPlayhead);
  const deleteKeyframeAtPlayhead = useEditorStore(state => state.deleteKeyframeAtPlayhead);
  const setInterpolationPicker = useEditorStore(state => state.setInterpolationPicker);
  const setKeyframeInterpolationAtPlayhead = useEditorStore(
    state => state.setKeyframeInterpolationAtPlayhead,
  );
  const toggleKeyframeParameterEnabled = useEditorStore(
    state => state.toggleKeyframeParameterEnabled,
  );
  const setPreviewQuality = useEditorStore(state => state.setPreviewQuality);
  const setGuidesVisible = useEditorStore(state => state.setGuidesVisible);
  const setThumbnailsVisible = useEditorStore(state => state.setThumbnailsVisible);
  const setSafeAreaOverlayVisible = useEditorStore(state => state.setSafeAreaOverlayVisible);
  const undo = useEditorStore(state => state.undo);
  const redo = useEditorStore(state => state.redo);

  const setAssetUnavailablePromptVisible = useEditorStore(
    state => state.setAssetUnavailablePromptVisible,
  );
  const setUnsupportedVideoPromptVisible = useEditorStore(
    state => state.setUnsupportedVideoPromptVisible,
  );

  const [paused, setPaused] = useState(false);
  const [markerContext, setMarkerContext] = useState<{
    trackId: ID;
    keyframeId: ID;
  } | null>(null);

  useProjectHealthChecks();

  const lastSnappedKeyframeRef = useRef<number | null>(null);

  const appear = useSharedValue(0.9);
  const appearOpacity = useSharedValue(0);

  useEffect(() => {
    appear.value = withSpring(1, {
      damping: 16,
      stiffness: 180,
    });
    appearOpacity.value = withSpring(1, {
      damping: 16,
      stiffness: 170,
    });
  }, [appear, appearOpacity]);

  const appearStyle = useAnimatedStyle(() => ({
    transform: [{ scale: appear.value }],
    opacity: appearOpacity.value,
  }));

  useEffect(() => {
    const state = useEditorStore.getState();
    if (state.ui.selectedProjectId !== route.params.projectId) {
      state.selectProject(route.params.projectId);
    }
  }, [route.params.projectId]);

  useEffect(() => {
    const validateAsset = async () => {
      if (!project) {
        return;
      }

      const available = await checkAssetAvailability(project.video.localUri);
      setAssetUnavailablePromptVisible(!available);
    };

    validateAsset().catch(() => undefined);
  }, [project, setAssetUnavailablePromptVisible]);

  useEffect(() => {
    if (!project || !ui.selectedTrackId) {
      return;
    }

    const track = project.tracks.find(item => item.id === ui.selectedTrackId);
    if (!track) {
      return;
    }

    const nearest = track.keyframes.find(
      keyframe => Math.abs(keyframe.timeMs - ui.playheadMs) <= 120,
    );

    if (nearest && lastSnappedKeyframeRef.current !== nearest.timeMs) {
      tick();
      lastSnappedKeyframeRef.current = nearest.timeMs;
    }

    if (!nearest) {
      lastSnappedKeyframeRef.current = null;
    }
  }, [project, tick, ui.playheadMs, ui.selectedTrackId]);

  const handleBackground = useCallback(() => {
    setPaused(true);
  }, []);

  const handleForeground = useCallback(() => {
    setPaused(false);
  }, []);

  useAppLifecycle({
    onBackground: handleBackground,
    onForeground: handleForeground,
  });

  const selectedTrack = useMemo(() => {
    if (!project || !ui.selectedTrackId) {
      return null;
    }

    return project.tracks.find(track => track.id === ui.selectedTrackId) ?? null;
  }, [project, ui.selectedTrackId]);

  const selectedTrackValues = useMemo(() => {
    if (!renderState || !ui.selectedTrackId) {
      return null;
    }

    return (
      renderState.tracks.find(track => track.id === ui.selectedTrackId)?.values ?? null
    );
  }, [renderState, ui.selectedTrackId]);

  const selectedBlendMode = selectedTrack?.blendMode ?? null;
  const selectedStrengthValue = selectedTrackValues?.strength;
  const selectedStrength =
    typeof selectedStrengthValue === 'number' && Number.isFinite(selectedStrengthValue)
    ? selectedStrengthValue
    : DEFAULT_KEYFRAME_VALUES.strength;

  if (!project || !renderState) {
    return (
      <GradientBackground>
        <View style={styles.emptyWrap}>
          <AppText variant="section">{STRINGS.editor.previewUnavailable}</AppText>
        </View>
      </GradientBackground>
    );
  }

  const renderPanel = () => {
    switch (ui.activePanel) {
      case 'addRegion':
        return (
          <AddRegionPanel
            onAddRegion={(type, template) => {
              addTrack(type, template);
              impact();
            }}
            strength={selectedStrength}
            onChangeStrength={strength => {
              if (!Number.isFinite(strength)) {
                return;
              }
              updateSelectedTrackValuesAtPlayhead({ strength });
            }}
          />
        );
      case 'regions':
        return (
          <RegionsPanel
            tracks={project.tracks}
            selectedTrackId={ui.selectedTrackId}
            onSelectTrack={selectTrack}
            onToggleVisibility={toggleTrackVisibility}
            onToggleLock={toggleTrackLock}
            onRemoveTrack={trackId => {
              removeTrack(trackId);
              warning();
            }}
            onReorderTracks={reorderTracks}
          />
        );
      case 'params':
        return (
          <ParamsPanel
            values={selectedTrackValues}
            blendMode={selectedBlendMode}
            onChangeValues={updateSelectedTrackValuesAtPlayhead}
            onChangeBlendMode={blendMode => {
              if (selectedTrack) {
                setTrackBlendMode(selectedTrack.id, blendMode);
              }
            }}
          />
        );
      case 'keyframes':
        return (
          <KeyframesPanel
            interpolation={ui.interpolationPickerValue}
            enabledParameters={ui.enabledKeyframeParams}
            onInterpolationChange={value => {
              setInterpolationPicker(value);
              setKeyframeInterpolationAtPlayhead(value);
            }}
            onAdd={() => {
              addKeyframeAtPlayhead();
              tick();
            }}
            onDelete={() => {
              deleteKeyframeAtPlayhead();
              warning();
            }}
            onToggleParameter={toggleKeyframeParameterEnabled}
          />
        );
      case 'view':
      default:
        return (
          <ViewPanel
            previewQuality={ui.previewQuality}
            showGuides={ui.showGuides}
            showThumbnails={ui.showThumbnails}
            showSafeAreaOverlay={ui.showSafeAreaOverlay}
            onPreviewQualityChange={setPreviewQuality}
            onGuidesChange={setGuidesVisible}
            onThumbnailsChange={setThumbnailsVisible}
            onSafeAreaOverlayChange={setSafeAreaOverlayVisible}
          />
        );
    }
  };

  return (
    <GradientBackground>
      <View
        style={[
          styles.container,
          {
            paddingTop: insets.top + SPACING.sm,
            paddingBottom: Math.max(insets.bottom + SPACING.xs, SPACING.md),
          },
        ]}>
        <View style={styles.header}>
          <TouchableOpacity
            accessibilityLabel={STRINGS.common.back}
            onPress={() => navigation.goBack()}
            style={[styles.topButton, { borderColor: colors.cardBorder }]}> 
            <ArrowLeft size={18} color={colors.textPrimary} />
          </TouchableOpacity>

          <View style={styles.titleWrap}>
            <AppText variant="section" numberOfLines={1}>
              {project.name}
            </AppText>
            <AppText variant="micro" color={colors.textMuted}>
              {project.video.displayName}
            </AppText>
          </View>

          <TouchableOpacity
            accessibilityLabel={STRINGS.common.export}
            onPress={() => navigation.navigate('Export', { projectId: project.id })}
            style={[styles.topButton, { borderColor: colors.cardBorder }]}> 
            <Share2 size={18} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <Animated.View style={[styles.canvasWrap, appearStyle]}>
          <EditorCanvas
            project={project}
            renderState={renderState}
            selectedTrackId={ui.selectedTrackId}
            showGuides={ui.showGuides}
            showSafeAreaOverlay={ui.showSafeAreaOverlay}
            paused={paused}
            onSelectTrack={selectTrack}
            onStartTrackInteraction={beginTrackValueInteraction}
            onEndTrackInteraction={endTrackValueInteraction}
            onUpdateTrackValues={updateSelectedTrackValuesLive}
            onCanvasTransformChange={setCanvasTransform}
            onLongPressTrack={() => setMarkerContext(null)}
          />
        </Animated.View>

        <Timeline
          durationMs={project.video.durationMs}
          playheadMs={ui.playheadMs}
          zoom={ui.timelineZoom}
          expanded={ui.timelineExpanded}
          precisionMode={ui.timelinePrecisionMode}
          selectedTrackId={ui.selectedTrackId}
          tracks={project.tracks}
          thumbnailUris={project.video.thumbnailUris}
          showThumbnails={ui.showThumbnails}
          onPlayheadChange={setPlayhead}
          onZoomChange={setTimelineZoom}
          onExpandedChange={setTimelineExpanded}
          onPrecisionModeChange={setTimelinePrecisionMode}
          onMarkerLongPress={(trackId, keyframeId) => setMarkerContext({ trackId, keyframeId })}
        />

        <ToolDock
          activePanel={ui.activePanel}
          onSelectPanel={setActivePanel}
          onUndo={undo}
          onRedo={redo}
        />

        <SpringBottomSheet
          title={ui.activePanel}
          collapsedHeight={MIN_SHEET_HEIGHT}
          midHeight={MID_SHEET_HEIGHT}
          expandedHeight={MAX_SHEET_HEIGHT}
          expanded={ui.isSheetExpanded}
          onExpandedChange={setSheetExpanded}>
          {renderPanel()}
        </SpringBottomSheet>

        <ActionSheetModal
          visible={Boolean(markerContext)}
          title={STRINGS.editor.markerMenuTitle}
          onClose={() => setMarkerContext(null)}
          options={
            markerContext
              ? [
                  {
                    id: 'jump',
                    label: STRINGS.editor.jumpToMarker,
                    onPress: () => {
                      const track = project.tracks.find(item => item.id === markerContext.trackId);
                      const keyframe = track?.keyframes.find(item => item.id === markerContext.keyframeId);
                      if (keyframe) {
                        setPlayhead(keyframe.timeMs, false);
                      }
                    },
                  },
                  {
                    id: 'interp',
                    label: STRINGS.editor.editMarker,
                    onPress: () => setActivePanel('keyframes'),
                  },
                  {
                    id: 'delete',
                    label: STRINGS.editor.deleteMarker,
                    destructive: true,
                    onPress: () => {
                      const track = project.tracks.find(item => item.id === markerContext.trackId);
                      const keyframe = track?.keyframes.find(item => item.id === markerContext.keyframeId);
                      if (keyframe) {
                        setPlayhead(keyframe.timeMs, false);
                        deleteKeyframeAtPlayhead();
                      }
                    },
                  },
                ]
              : []
          }
        />
      </View>

      <ActionSheetModal
        visible={ui.unavailableAssetPromptVisible}
        title={STRINGS.edgeCases.assetUnavailableTitle}
        onClose={() => setAssetUnavailablePromptVisible(false)}
        options={[
          {
            id: 'relink',
            label: STRINGS.import.relinkButton,
            onPress: () => navigation.navigate('Import'),
          },
        ]}
      />

      <ActionSheetModal
        visible={ui.unsupportedVideoPromptVisible}
        title={STRINGS.import.unsupportedTitle}
        onClose={() => setUnsupportedVideoPromptVisible(false)}
        options={[
          {
            id: 'retry',
            label: STRINGS.common.retry,
            onPress: () => navigation.navigate('Import'),
          },
        ]}
      />
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  topButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleWrap: {
    flex: 1,
  },
  canvasWrap: {
    flex: 1,
    minHeight: 220,
  },
});
