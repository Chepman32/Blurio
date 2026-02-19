import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useHeaderHeight } from '@react-navigation/elements';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Layers,
  Pause,
  Play,
  Plus,
  PlusSquare,
  Redo2,
  Share2,
  Trash2,
  Undo2,
} from 'lucide-react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import {
  AddRegionPanel,
  AnimatedSlider,
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
  RADIUS,
  SPACING,
  STRINGS,
} from '../constants';
import { useAppLifecycle, useHaptics, useProjectHealthChecks } from '../hooks';
import { useAppTheme } from '../theme';
import { useCurrentRenderState, useEditorStore, useSelectedProject } from '../store';
import type { ID, RegionType, RootStackParamList } from '../types';
import { checkAssetAvailability } from '../utils';

type Props = NativeStackScreenProps<RootStackParamList, 'Editor'>;

const DEFAULT_TEMPLATE_CATEGORIES = ['Faces', 'Vehicles', 'Plates', 'People', 'Objects'] as const;
const REGIONS_COLLAPSED_HEIGHT = 92;
const PARAMS_EXPANDED_HEIGHT = 460;

const templateTypeLabel = (type: RegionType): string => {
  switch (type) {
    case 'rectangle':
      return STRINGS.editor.rectangle;
    case 'roundedRect':
      return STRINGS.editor.roundedRect;
    case 'ellipse':
      return STRINGS.editor.ellipse;
    case 'path':
      return STRINGS.editor.path;
    case 'face':
      return STRINGS.editor.faceTemplate;
    case 'plate':
      return STRINGS.editor.plateTemplate;
    default:
      return STRINGS.editor.addRegion;
  }
};

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
  const applyRegionTemplate = useEditorStore(state => state.applyRegionTemplate);
  const selectTrack = useEditorStore(state => state.selectTrack);
  const removeTrack = useEditorStore(state => state.removeTrack);
  const removeAllTracks = useEditorStore(state => state.removeAllTracks);
  const saveSelectedTrackAsTemplate = useEditorStore(
    state => state.saveSelectedTrackAsTemplate,
  );
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
  const regionTemplates = useEditorStore(state => state.settings.regionTemplates);
  const canUndo = useEditorStore(state => state.undoStack.length > 0);
  const canRedo = useEditorStore(state => state.redoStack.length > 0);

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
  const [saveTemplateModalVisible, setSaveTemplateModalVisible] = useState(false);
  const [applyTemplateModalVisible, setApplyTemplateModalVisible] = useState(false);
  const [addRegionModalVisible, setAddRegionModalVisible] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateCategory, setTemplateCategory] = useState<string>(
    STRINGS.editor.templateDefaultCategory,
  );
  const saveModalProgress = useSharedValue(0);
  const saveModalBackdropProgress = useSharedValue(0);
  const applyModalProgress = useSharedValue(0);
  const applyModalBackdropProgress = useSharedValue(0);

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
  const sortedTemplates = useMemo(
    () => [...regionTemplates].sort((a, b) => b.updatedAt - a.updatedAt),
    [regionTemplates],
  );
  const canSaveTemplate = templateName.trim().length > 0;
  const templateCategories = useMemo(() => {
    const dynamic = regionTemplates
      .map(template => template.category.trim())
      .filter(category => category.length > 0);
    return Array.from(
      new Set([
        STRINGS.editor.templateDefaultCategory,
        ...DEFAULT_TEMPLATE_CATEGORIES,
        ...dynamic,
      ]),
    );
  }, [regionTemplates]);

  const openSaveTemplateModal = useCallback(() => {
    setTemplateName('');
    setTemplateCategory(templateCategories[0] ?? STRINGS.editor.templateDefaultCategory);
    setSaveTemplateModalVisible(true);
  }, [templateCategories]);

  const closeSaveTemplateModal = useCallback(() => {
    saveModalProgress.value = withSpring(0, {
      damping: 22,
      stiffness: 260,
      velocity: -2.2,
    });
    saveModalBackdropProgress.value = withTiming(0, { duration: 170 }, finished => {
      if (finished) {
        runOnJS(setSaveTemplateModalVisible)(false);
      }
    });
  }, [saveModalBackdropProgress, saveModalProgress]);

  const openApplyTemplateModal = useCallback(() => {
    setApplyTemplateModalVisible(true);
  }, []);

  const closeApplyTemplateModal = useCallback(() => {
    applyModalProgress.value = withSpring(0, {
      damping: 22,
      stiffness: 260,
      velocity: -2.2,
    });
    applyModalBackdropProgress.value = withTiming(0, { duration: 170 }, finished => {
      if (finished) {
        runOnJS(setApplyTemplateModalVisible)(false);
      }
    });
  }, [applyModalBackdropProgress, applyModalProgress]);

  const openAddRegionModal = useCallback(() => {
    setSheetExpanded(false);
    setAddRegionModalVisible(true);
  }, [setSheetExpanded]);

  const closeAddRegionModal = useCallback(() => {
    setAddRegionModalVisible(false);
  }, []);

  useEffect(() => {
    if (!saveTemplateModalVisible) {
      return;
    }

    saveModalBackdropProgress.value = 0;
    saveModalProgress.value = 0;
    saveModalBackdropProgress.value = withTiming(1, { duration: 220 });
    saveModalProgress.value = withSpring(1, {
      damping: 18,
      stiffness: 250,
      mass: 0.9,
      velocity: 2.8,
    });
  }, [saveModalBackdropProgress, saveModalProgress, saveTemplateModalVisible]);

  useEffect(() => {
    if (!applyTemplateModalVisible) {
      return;
    }

    applyModalBackdropProgress.value = 0;
    applyModalProgress.value = 0;
    applyModalBackdropProgress.value = withTiming(1, { duration: 220 });
    applyModalProgress.value = withSpring(1, {
      damping: 18,
      stiffness: 250,
      mass: 0.9,
      velocity: 2.8,
    });
  }, [applyModalBackdropProgress, applyModalProgress, applyTemplateModalVisible]);

  const saveModalBackdropStyle = useAnimatedStyle(() => ({
    opacity: saveModalBackdropProgress.value,
  }));

  const saveModalCardStyle = useAnimatedStyle(() => ({
    opacity: saveModalProgress.value,
    transform: [
      { translateY: (1 - saveModalProgress.value) * 56 },
      { scale: 0.88 + saveModalProgress.value * 0.12 },
    ],
  }));

  const applyModalBackdropStyle = useAnimatedStyle(() => ({
    opacity: applyModalBackdropProgress.value,
  }));

  const applyModalCardStyle = useAnimatedStyle(() => ({
    opacity: applyModalProgress.value,
    transform: [
      { translateY: (1 - applyModalProgress.value) * 56 },
      { scale: 0.88 + applyModalProgress.value * 0.12 },
    ],
  }));

  const activePanel = ui.activePanel === 'addRegion' ? 'regions' : ui.activePanel;
  const collapsedSheetHeight =
    activePanel === 'regions' || activePanel === 'params'
      ? REGIONS_COLLAPSED_HEIGHT
      : MIN_SHEET_HEIGHT;
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
                <>
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel={STRINGS.editor.saveAsTemplate}
                    onPress={openSaveTemplateModal}
                    style={[styles.headerActionButton, { borderColor: colors.cardBorder }]}>
                    <PlusSquare size={16} color={colors.textPrimary} />
                  </TouchableOpacity>
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
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel={STRINGS.editor.undo}
                    disabled={!canUndo}
                    onPress={undo}
                    style={[
                      styles.headerActionButton,
                      { borderColor: colors.cardBorder },
                      !canUndo ? styles.headerActionDisabled : null,
                    ]}>
                    <Undo2 size={16} color={colors.textPrimary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel={STRINGS.editor.redo}
                    disabled={!canRedo}
                    onPress={redo}
                    style={[
                      styles.headerActionButton,
                      { borderColor: colors.cardBorder },
                      !canRedo ? styles.headerActionDisabled : null,
                    ]}>
                    <Redo2 size={16} color={colors.textPrimary} />
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel={STRINGS.editor.applyTemplate}
                    onPress={openApplyTemplateModal}
                    style={[styles.headerActionButton, { borderColor: colors.cardBorder }]}>
                    <Layers size={16} color={colors.textPrimary} />
                  </TouchableOpacity>
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
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel={STRINGS.editor.undo}
                    disabled={!canUndo}
                    onPress={undo}
                    style={[
                      styles.headerActionButton,
                      { borderColor: colors.cardBorder },
                      !canUndo ? styles.headerActionDisabled : null,
                    ]}>
                    <Undo2 size={16} color={colors.textPrimary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel={STRINGS.editor.redo}
                    disabled={!canRedo}
                    onPress={redo}
                    style={[
                      styles.headerActionButton,
                      { borderColor: colors.cardBorder },
                      !canRedo ? styles.headerActionDisabled : null,
                    ]}>
                    <Redo2 size={16} color={colors.textPrimary} />
                  </TouchableOpacity>
                </>
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
            onLongPressTrack={() => setMarkerContext(null)}
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
          onMarkerLongPress={(trackId, keyframeId) => setMarkerContext({ trackId, keyframeId })}
          onTrackRangeChange={setTrackTimeRange}
        />

        <ToolDock
          activePanel={activePanel}
          onSelectPanel={setActivePanel}
          onUndo={undo}
          onRedo={redo}
        />
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
        ) : null}

        {!addRegionModalVisible ? (
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
                  onPress={openAddRegionModal}
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
        ) : null}

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

        <Modal
          transparent
          animationType="fade"
          visible={addRegionModalVisible}
          onRequestClose={closeAddRegionModal}>
          <View style={styles.modalRoot}>
            <View style={styles.modalDimmer} />
            <Pressable style={StyleSheet.absoluteFill} onPress={closeAddRegionModal} />
            <View
              style={[
                styles.modalCard,
                styles.addRegionModalCard,
                { backgroundColor: colors.sheet, borderColor: colors.cardBorder },
              ]}>
              <AppText variant="section">{STRINGS.editor.addRegion}</AppText>
              <AddRegionPanel
                onAddRegion={(type, template) => {
                  addTrack(type, template);
                  impact();
                  closeAddRegionModal();
                }}
              />
            </View>
          </View>
        </Modal>

        <Modal
          transparent
          animationType="none"
          visible={saveTemplateModalVisible}
          onRequestClose={closeSaveTemplateModal}>
          <View style={styles.modalRoot}>
            <Animated.View style={[styles.modalDimmer, saveModalBackdropStyle]} />
            <Pressable style={StyleSheet.absoluteFill} onPress={closeSaveTemplateModal} />
            <Animated.View
              style={[
                styles.modalCard,
                { backgroundColor: colors.sheet, borderColor: colors.cardBorder },
                saveModalCardStyle,
              ]}>
              <AppText variant="section">{STRINGS.editor.saveTemplateTitle}</AppText>
              <View style={styles.inputGroup}>
                <AppText variant="micro" color={colors.textSecondary}>
                  {STRINGS.editor.templateNameLabel}
                </AppText>
                <TextInput
                  value={templateName}
                  onChangeText={setTemplateName}
                  placeholder={STRINGS.editor.templateNamePlaceholder}
                  placeholderTextColor={colors.textMuted}
                  style={[
                    styles.input,
                    { borderColor: colors.cardBorder, color: colors.textPrimary },
                  ]}
                />
              </View>
              <View style={styles.inputGroup}>
                <AppText variant="micro" color={colors.textSecondary}>
                  {STRINGS.editor.templateCategoryLabel}
                </AppText>
                <View style={styles.categoryList}>
                  {templateCategories.map(category => {
                    const selected = category === templateCategory;
                    const chipStyle = {
                      borderColor: selected ? `${colors.accent}88` : colors.cardBorder,
                      backgroundColor: selected ? `${colors.accent}22` : 'transparent',
                    };
                    return (
                      <TouchableOpacity
                        key={category}
                        accessibilityRole="button"
                        accessibilityLabel={`${STRINGS.editor.templateCategoryLabel} ${category}`}
                        onPress={() => setTemplateCategory(category)}
                        style={[styles.categoryChip, chipStyle]}>
                        <AppText
                          variant="micro"
                          color={selected ? colors.accent : colors.textSecondary}>
                          {category}
                        </AppText>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
              <View style={styles.modalActionsRow}>
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel={STRINGS.common.cancel}
                  onPress={closeSaveTemplateModal}
                  style={[styles.modalActionButton, { borderColor: colors.cardBorder }]}>
                  <AppText variant="section">{STRINGS.common.cancel}</AppText>
                </TouchableOpacity>
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel={STRINGS.common.save}
                  disabled={!canSaveTemplate}
                  onPress={() => {
                    if (!canSaveTemplate) {
                      return;
                    }
                    saveSelectedTrackAsTemplate(templateName, templateCategory);
                    impact();
                    closeSaveTemplateModal();
                  }}
                  style={[
                    styles.modalActionButton,
                    { borderColor: colors.cardBorder, backgroundColor: colors.accent },
                    !canSaveTemplate ? styles.modalActionDisabled : null,
                  ]}>
                  <AppText variant="section" color="#FFFFFF">
                    {STRINGS.common.save}
                  </AppText>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </View>
        </Modal>

        <Modal
          transparent
          animationType="none"
          visible={applyTemplateModalVisible}
          onRequestClose={closeApplyTemplateModal}>
          <View style={styles.modalRoot}>
            <Animated.View style={[styles.modalDimmer, applyModalBackdropStyle]} />
            <Pressable style={StyleSheet.absoluteFill} onPress={closeApplyTemplateModal} />
            <Animated.View
              style={[
                styles.modalCard,
                styles.applyModalCard,
                { backgroundColor: colors.sheet, borderColor: colors.cardBorder },
                applyModalCardStyle,
              ]}>
              <AppText variant="section">{STRINGS.editor.applyTemplateTitle}</AppText>
              {sortedTemplates.length === 0 ? (
                <AppText variant="micro" color={colors.textMuted}>
                  {STRINGS.editor.noTemplatesYet}
                </AppText>
              ) : (
                <ScrollView
                  style={styles.templateList}
                  contentContainerStyle={styles.templateListContent}
                  showsVerticalScrollIndicator={false}>
                  {sortedTemplates.map(template => (
                    <TouchableOpacity
                      key={template.id}
                      accessibilityRole="button"
                      accessibilityLabel={template.name}
                      onPress={() => {
                        applyRegionTemplate(template.id);
                        impact();
                        closeApplyTemplateModal();
                      }}
                      style={[styles.templateItem, { borderColor: colors.cardBorder }]}>
                      <AppText variant="bodyStrong">{template.name}</AppText>
                      <AppText variant="micro" color={colors.textSecondary}>
                        {`${template.category} • ${templateTypeLabel(template.type)}`}
                      </AppText>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={STRINGS.common.close}
                onPress={closeApplyTemplateModal}
                style={[styles.modalActionButton, { borderColor: colors.cardBorder }]}>
                <AppText variant="section">{STRINGS.common.close}</AppText>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </Modal>
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
  modalRoot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
  },
  modalDimmer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  applyModalCard: {
    maxHeight: 420,
  },
  addRegionModalCard: {
    maxWidth: 460,
  },
  inputGroup: {
    gap: SPACING.xs,
  },
  categoryList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  categoryChip: {
    borderWidth: 1,
    borderRadius: RADIUS.pill,
    minHeight: 30,
    paddingHorizontal: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    borderWidth: 1,
    borderRadius: RADIUS.control,
    minHeight: 42,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  modalActionButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: RADIUS.control,
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.sm,
  },
  modalActionDisabled: {
    opacity: 0.5,
  },
  templateList: {
    maxHeight: 240,
  },
  templateListContent: {
    gap: SPACING.xs,
  },
  templateItem: {
    borderWidth: 1,
    borderRadius: RADIUS.control,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    gap: 2,
  },
});
