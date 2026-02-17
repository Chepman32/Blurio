import type { ID, InterpolationType, KeyframeParameter, PreviewQuality } from './domain';

export type EditorPanel =
  | 'addRegion'
  | 'regions'
  | 'params'
  | 'keyframes'
  | 'view';

export interface UIState {
  selectedProjectId: ID | null;
  selectedTrackId: ID | null;
  playheadMs: number;
  timelineZoom: number;
  timelinePrecisionMode: boolean;
  timelineExpanded: boolean;
  canvasZoom: number;
  canvasPanX: number;
  canvasPanY: number;
  activePanel: EditorPanel;
  isSheetExpanded: boolean;
  showGuides: boolean;
  showThumbnails: boolean;
  showSafeAreaOverlay: boolean;
  previewQuality: PreviewQuality;
  interpolationPickerValue: InterpolationType;
  enabledKeyframeParams: Record<KeyframeParameter, boolean>;
  isExporting: boolean;
  exportProgress: number;
  exportStage: ExportStage;
  exportMessage: string;
  exportSuccess: boolean;
  lowStorageWarningVisible: boolean;
  hdrWarningVisible: boolean;
  unavailableAssetPromptVisible: boolean;
  unsupportedVideoPromptVisible: boolean;
}

export enum ExportStage {
  IDLE = 'idle',
  DECODING = 'decoding',
  APPLYING_BLUR = 'applyingBlur',
  ENCODING = 'encoding',
  SAVING = 'saving',
  COMPLETE = 'complete',
  CANCELLED = 'cancelled',
  FAILED = 'failed',
}

export interface UndoEntry {
  id: ID;
  timestamp: number;
  description: string;
  snapshot: UndoSnapshot;
}

export interface UndoSnapshot {
  projectId: ID;
  selectedTrackId: ID | null;
  playheadMs: number;
  tracksDigest: string;
  tracks: string;
}

export interface HomeContextMenuState {
  projectId: ID | null;
  visible: boolean;
}
