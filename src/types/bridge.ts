import type { ExportCodec, ID, PreviewQuality, RenderState } from './domain';
import type { ExportStage } from './ui';

export interface BlurioPreviewNativeProps {
  renderState: RenderState;
  sourceUri: string;
  paused: boolean;
  quality: PreviewQuality;
  onReady?: () => void;
  onTimeSync?: (timeMs: number) => void;
  onPreviewError?: (message: string) => void;
}

export interface ExportRequest {
  projectId: ID;
  sourceUri: string;
  destinationUri: string;
  renderState: RenderState;
  width: number;
  height: number;
  frameRate: number;
  codec: ExportCodec;
  includeAudio: boolean;
  preserveHdr: boolean;
}

export interface ExportProgressEvent {
  stage: ExportStage;
  progress: number;
  message: string;
}

export interface ExportSuccessEvent {
  outputUri: string;
}

export interface ExportErrorEvent {
  code: string;
  message: string;
}

export interface BlurioExportModuleInterface {
  startExport(request: ExportRequest): Promise<void>;
  cancelExport(): Promise<void>;
}
