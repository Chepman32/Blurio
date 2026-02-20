import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useHeaderHeight } from '@react-navigation/elements';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Pause,
  Play,
  Plus,
  Share2,
  Trash2,
} from 'lucide-react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import {
  AnimatedSlider,
  EditorCanvas,
  ParamsPanel,
  RegionsPanel,
  Timeline,
  ToolDock,
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
  DEFAULT_KEYFRAME_VALUES,
  SPACING,
  STRINGS,
} from '../constants';
import { useAppLifecycle, useHaptics, useProjectHealthChecks } from '../hooks';
import { useAppTheme } from '../theme';
import { useCurrentRenderState, useEditorStore, useSelectedProject } from '../store';
import type { EditorPanel, RootStackParamList } from '../types';
import { checkAssetAvailability } from '../utils';

type Props = NativeStackScreenProps<RootStackParamList, 'Editor'>;

const REGIONS_COLLAPSED_HEIGHT = 92;
const PARAMS_EXPANDED_HEIGHT = 340;

export const EditorScreen: React.FC<Props> = ({ navigation, route }) => {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
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
  const removeAllTracks = useEditorStore(state => state.removeAllTracks);
  const toggleTrackVisibility = useEditorStore(state => state.toggleTrackVisibility);
  const toggleTrackLock = useEditorStore(state => state.toggleTrackLock);
  const reorderTracks = useEditorStore(state => state.reorderTracks);
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
  const setTrackTimeRange = useEditorStore(state => state.setTrackTimeRange);

  const setAssetUnavailablePromptVisible = useEditorStore(
    state => state.setAssetUnavailablePromptVisible,
  );
  const setUnsupportedVideoPromptVisible = useEditorStore(
    state => state.setUnsupportedVideoPromptVisible,
  );

  const [paused, setPaused] = useState(false);

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
  const activePanel = ui.activePanel === 'params' ? 'params' : 'regions';
  const handleSelectPanel = useCallback(
    (panel: EditorPanel) => {
      setActivePanel(panel);
      setSheetExpanded(true);
    },
    [setActivePanel, setSheetExpanded],
  );
  const collapsedSheetHeight = REGIONS_COLLAPSED_HEIGHT;
  const expandedSheetHeight =
    activePanel === 'params' ? PARAMS_EXPANDED_HEIGHT : MAX_SHEET_HEIGHT;

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
    switch (activePanel) {
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
            onChangeValues={updateSelectedTrackValuesLive}
            onBeginValueChange={beginTrackValueInteraction}
            onEndValueChange={endTrackValueInteraction}
            onChangeBlendMode={blendMode => {
              if (selectedTrack) {
                setTrackBlendMode(selectedTrack.id, blendMode);
              }
            }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <GradientBackground>
      <View
        style={[
          styles.container,
          {
            paddingTop: headerHeight + SPACING.xs,
            paddingBottom: Math.max(insets.bottom + SPACING.xs, SPACING.md),
          },
        ]}>
        <View style={styles.header}>
          <View style={styles.leftSpacer} />

          <View style={styles.headerActionsWrap}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.headerActionsRow}>
              {selectedTrack ? (
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel={STRINGS.editor.removeRegion}
                  onPress={() => {
                    removeTrack(selectedTrack.id);
                    warning();
                  }}
                  style={[styles.headerActionButton, { borderColor: colors.cardBorder }]}>
                  <Trash2 size={16} color={colors.destructive} />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel={STRINGS.editor.removeAllRegions}
                  disabled={project.tracks.length === 0}
                  onPress={() => {
                    removeAllTracks();
                    warning();
                  }}
                  style={[
                    styles.headerActionButton,
                    { borderColor: colors.cardBorder },
                    project.tracks.length === 0 ? styles.headerActionDisabled : null,
                  ]}>
                  <Trash2 size={16} color={colors.destructive} />
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>

          <View style={styles.headerRightActions}>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={
                paused ? STRINGS.editor.playPreview : STRINGS.editor.pausePreview
              }
              onPress={() => setPaused(current => !current)}
              style={[styles.topButton, { borderColor: colors.cardBorder }]}>
              {paused ? (
                <Play size={18} color={colors.textPrimary} />
              ) : (
                <Pause size={18} color={colors.textPrimary} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              accessibilityLabel={STRINGS.common.export}
              onPress={() => navigation.navigate('Export', { projectId: project.id })}
              style={[styles.topButton, { borderColor: colors.cardBorder }]}>
              <Share2 size={18} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
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
            onLongPressTrack={() => undefined}
            onTimeSync={setPlayhead}
          />
        </Animated.View>

        <Timeline
          durationMs={project.video.durationMs}
          playheadMs={ui.playheadMs}
          paused={paused}
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
          onMarkerLongPress={() => undefined}
          onTrackRangeChange={setTrackTimeRange}
        />

        <ToolDock activePanel={activePanel} onSelectPanel={handleSelectPanel} />
        {activePanel === 'regions' && selectedTrack ? (
          <View
            style={[
              styles.strengthCard,
              { borderColor: colors.cardBorder, backgroundColor: `${colors.card}CC` },
            ]}>
            <AnimatedSlider
              label={STRINGS.params.strength}
              value={selectedStrength}
              onChange={strength => {
                if (!Number.isFinite(strength)) {
                  return;
                }
                updateSelectedTrackValuesLive({ strength });
              }}
              onChangeStart={beginTrackValueInteraction}
              onChangeEnd={endTrackValueInteraction}
              accessibilityLabel={STRINGS.params.strength}
            />
          </View>
        ) : activePanel === 'params' ? (
          <View style={styles.strengthCard} />
        ) : null}

        <SpringBottomSheet
          title={activePanel}
          collapsedHeight={collapsedSheetHeight}
          midHeight={MID_SHEET_HEIGHT}
          expandedHeight={expandedSheetHeight}
          expanded={ui.isSheetExpanded}
          onExpandedChange={setSheetExpanded}
          headerRight={
            activePanel === 'regions' ? (
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={STRINGS.accessibility.addRegionButton}
                onPress={() => {
                  addTrack('roundedRect');
                  impact();
                }}
                style={[
                  styles.sheetHeaderAction,
                  { borderColor: colors.cardBorder, backgroundColor: colors.card },
                ]}>
                <Plus size={14} color={colors.textPrimary} />
              </TouchableOpacity>
            ) : null
          }>
          {renderPanel()}
        </SpringBottomSheet>
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
  leftSpacer: {
    width: 42,
    height: 42,
  },
  headerActionsWrap: {
    flex: 1,
    minHeight: 42,
    justifyContent: 'center',
  },
  headerActionsRow: {
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: 2,
  },
  headerActionButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActionDisabled: {
    opacity: 0.45,
  },
  headerRightActions: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  sheetHeaderAction: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  canvasWrap: {
    flex: 1,
    minHeight: 220,
  },
  strengthCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
  },
});
