import React, { useEffect, useMemo, useState } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ChevronDown } from 'lucide-react-native';
import {
  ActionSheetModal,
  AppText,
  BlurButton,
  GradientBackground,
  ProgressRing,
  SegmentedControl,
} from '../components/common';
import { StageProgressList, SuccessShardConfetti } from '../components/export';
import { SPACING, STRINGS } from '../constants';
import type {
  ExportPreset,
  ExportRequest,
  RootStackParamList
} from '../types';
import { ExportStage } from '../types';
import { useAppTheme } from '../theme';
import { useCurrentRenderState, useEditorStore } from '../store';
import {
  buildExportPath,
  checkLowStorageForExport
} from '../utils';
import {
  cancelExport,
  cleanupCancelledExport,
  startExport,
  subscribeExportError,
  subscribeExportProgress,
  subscribeExportSuccess,
} from '../native';

type Props = NativeStackScreenProps<RootStackParamList, 'Export'>;

export const ExportScreen: React.FC<Props> = ({ navigation, route }) => {
  const { colors } = useAppTheme();

  const project = useEditorStore(state => state.projects[route.params.projectId] ?? null);
  const renderState = useCurrentRenderState();

  const ui = useEditorStore(state => state.ui);
  const updateProject = useEditorStore(state => state.updateProject);
  const startExportState = useEditorStore(state => state.startExport);
  const updateExportProgress = useEditorStore(state => state.updateExportProgress);
  const completeExportState = useEditorStore(state => state.completeExport);
  const cancelExportState = useEditorStore(state => state.cancelExport);
  const failExport = useEditorStore(state => state.failExport);
  const setLowStorageWarningVisible = useEditorStore(
    state => state.setLowStorageWarningVisible,
  );
  const setHdrWarningVisible = useEditorStore(state => state.setHdrWarningVisible);

  const [outputPath, setOutputPath] = useState<string>('');
  const [settingsExpanded, setSettingsExpanded] = useState(true);

  useEffect(() => {
    const unsubProgress = subscribeExportProgress(event => {
      updateExportProgress(event.stage, event.progress, event.message);
    });

    const unsubSuccess = subscribeExportSuccess(() => {
      completeExportState();
    });

    const unsubError = subscribeExportError(event => {
      if (event.code === 'CANCELLED') {
        cancelExportState();
        return;
      }
      failExport(event.message);
    });

    return () => {
      unsubProgress();
      unsubSuccess();
      unsubError();
    };
  }, [cancelExportState, completeExportState, failExport, updateExportProgress]);

  const startPipeline = async () => {
    if (!project || !renderState) {
      return;
    }

    const lowStorage = await checkLowStorageForExport();
    if (lowStorage) {
      setLowStorageWarningVisible(true);
      return;
    }

    if (project.video.hasHdr) {
      setHdrWarningVisible(true);
    }

    const destinationUri = buildExportPath(project.id);
    setOutputPath(destinationUri);

    const request: ExportRequest = {
      projectId: project.id,
      sourceUri: project.video.localUri,
      destinationUri,
      renderState,
      width:
        project.exportPreset.resolution === '4k'
          ? 3840
          : project.exportPreset.resolution === '1080p'
          ? 1920
          : 1280,
      height:
        project.exportPreset.resolution === '4k'
          ? 2160
          : project.exportPreset.resolution === '1080p'
          ? 1080
          : 720,
      frameRate: project.exportPreset.frameRate,
      codec: project.exportPreset.codec,
      includeAudio: project.exportPreset.includeAudio,
      preserveHdr: project.video.hasHdr,
    };

    startExportState();

    try {
      await startExport(request);
    } catch {
      // handled by subscription callbacks
    }
  };

  const onCancelExport = async () => {
    await cancelExport();
    cancelExportState();
    if (outputPath) {
      await cleanupCancelledExport(outputPath);
    }
  };

  const updatePreset = <T extends keyof ExportPreset>(
    key: T,
    value: ExportPreset[T],
  ) => {
    if (!project) {
      return;
    }

    updateProject(project.id, current => ({
      ...current,
      exportPreset: {
        ...current.exportPreset,
        [key]: value,
      },
    }));
  };

  const stageLabel = useMemo(() => {
    switch (ui.exportStage) {
      case ExportStage.DECODING:
        return STRINGS.export.stageDecoding;
      case ExportStage.APPLYING_BLUR:
        return STRINGS.export.stageApplying;
      case ExportStage.ENCODING:
        return STRINGS.export.stageEncoding;
      case ExportStage.SAVING:
        return STRINGS.export.stageSaving;
      case ExportStage.COMPLETE:
        return STRINGS.export.successTitle;
      case ExportStage.FAILED:
        return ui.exportMessage || STRINGS.export.failedLabel;
      case ExportStage.CANCELLED:
        return STRINGS.export.cancelledLabel;
      case ExportStage.IDLE:
      default:
        return STRINGS.export.settingsTitle;
    }
  }, [ui.exportMessage, ui.exportStage]);

  if (!project) {
    return (
      <GradientBackground>
        <View style={styles.emptyWrap}>
          <AppText variant="section">{STRINGS.common.noProjectSelected}</AppText>
        </View>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <View style={styles.container}>
        <TouchableOpacity
          accessibilityLabel={STRINGS.export.toggleSettings}
          onPress={() => setSettingsExpanded(prev => !prev)}
          style={[styles.sheetHeader, { borderColor: colors.cardBorder }]}>
          <AppText variant="section">{STRINGS.export.settingsTitle}</AppText>
          <ChevronDown
            size={18}
            color={colors.textPrimary}
            style={{
              transform: [{ rotate: settingsExpanded ? '180deg' : '0deg' }],
            }}
          />
        </TouchableOpacity>

        {settingsExpanded ? (
          <View style={[styles.settingsCard, { borderColor: colors.cardBorder }]}>
            <SegmentedControl
              value={project.exportPreset.resolution}
              options={[
                { label: '720p', value: '720p' },
                { label: '1080p', value: '1080p' },
                { label: '4K', value: '4k' },
              ]}
              onChange={value => updatePreset('resolution', value)}
              accessibilityLabel={STRINGS.export.resolutionLabel}
            />
            <SegmentedControl
              value={String(project.exportPreset.frameRate) as '24' | '30' | '60'}
              options={[
                { label: '24', value: '24' },
                { label: '30', value: '30' },
                { label: '60', value: '60' },
              ]}
              onChange={value =>
                updatePreset('frameRate', Number(value) as 24 | 30 | 60)
              }
              accessibilityLabel={STRINGS.export.framerateLabel}
            />
            <SegmentedControl
              value={project.exportPreset.codec}
              options={[
                { label: STRINGS.export.codecH264, value: 'h264' },
                { label: STRINGS.export.codecHevc, value: 'hevc' },
              ]}
              onChange={value => updatePreset('codec', value)}
              accessibilityLabel={STRINGS.export.codecLabel}
            />
            <SegmentedControl
              value={project.exportPreset.includeAudio ? 'on' : 'off'}
              options={[
                { label: STRINGS.export.includeAudioOn, value: 'on' },
                { label: STRINGS.export.includeAudioOff, value: 'off' },
              ]}
              onChange={value => updatePreset('includeAudio', value === 'on')}
              accessibilityLabel={STRINGS.export.includeAudioLabel}
            />
          </View>
        ) : null}

        <View style={styles.progressWrap}>
          {ui.exportSuccess ? <SuccessShardConfetti /> : null}
          <ProgressRing
            progress={ui.exportProgress}
            accessibilityLabel={STRINGS.accessibility.exportProgress}
          />
          <AppText variant="section" style={styles.stageLabel}>
            {stageLabel}
          </AppText>
          <StageProgressList stage={ui.exportStage} />
        </View>

        <BlurButton
          label={ui.isExporting ? STRINGS.export.cancelButton : STRINGS.export.startButton}
          onPress={ui.isExporting ? onCancelExport : startPipeline}
          accessibilityLabel={ui.isExporting ? STRINGS.export.cancelButton : STRINGS.export.startButton}
          variant={ui.isExporting ? 'danger' : 'primary'}
          style={styles.primaryButton}
        />

        {ui.exportSuccess ? (
          <BlurButton
            label={STRINGS.common.done}
            onPress={() => navigation.goBack()}
            accessibilityLabel={STRINGS.common.done}
            variant="secondary"
          />
        ) : null}
      </View>

      <ActionSheetModal
        visible={ui.lowStorageWarningVisible}
        title={STRINGS.export.lowStorageTitle}
        onClose={() => setLowStorageWarningVisible(false)}
        options={[
          {
            id: 'close',
            label: STRINGS.common.close,
            onPress: () => setLowStorageWarningVisible(false),
          },
        ]}
      />

      <ActionSheetModal
        visible={ui.hdrWarningVisible}
        title={STRINGS.export.hdrWarning}
        onClose={() => setHdrWarningVisible(false)}
        options={[
          {
            id: 'ok',
            label: STRINGS.common.continue,
            onPress: () => setHdrWarningVisible(false),
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
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.lg,
    gap: SPACING.md,
  },
  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 12,
    minHeight: 44,
    paddingHorizontal: SPACING.sm,
  },
  settingsCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: SPACING.sm,
    gap: SPACING.sm,
  },
  progressWrap: {
    borderRadius: 16,
    padding: SPACING.md,
    gap: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stageLabel: {
    marginTop: 4,
  },
  primaryButton: {
    marginTop: 'auto',
  },
});
