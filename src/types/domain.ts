export type ID = string;
export type UnixMs = number;

export type NormalizedScalar = number;

export interface NormalizedPoint {
  x: NormalizedScalar;
  y: NormalizedScalar;
}

export interface NormalizedRect extends NormalizedPoint {
  width: NormalizedScalar;
  height: NormalizedScalar;
}

export type RegionType =
  | 'rectangle'
  | 'roundedRect'
  | 'ellipse'
  | 'path'
  | 'face'
  | 'plate';

export type InterpolationType =
  | 'linear'
  | 'easeInOut'
  | 'spring'
  | 'hold';

export type BlendMode = 'normal' | 'frosted';

export type ExportCodec = 'h264' | 'hevc';

export type KeyframeParameter =
  | 'x'
  | 'y'
  | 'width'
  | 'height'
  | 'rotation'
  | 'strength'
  | 'feather'
  | 'opacity'
  | 'cornerRadius';

export interface KeyframeValues {
  x: NormalizedScalar;
  y: NormalizedScalar;
  width: NormalizedScalar;
  height: NormalizedScalar;
  rotation: number;
  strength: number;
  feather: number;
  opacity: number;
  cornerRadius: number;
}

export interface Keyframe {
  id: ID;
  timeMs: UnixMs;
  interpolation: InterpolationType;
  values: Partial<KeyframeValues>;
  createdAt: UnixMs;
  parameterMask: Record<KeyframeParameter, boolean>;
}

export interface Track {
  id: ID;
  name: string;
  type: RegionType;
  startMs?: UnixMs;
  endMs?: UnixMs;
  visible: boolean;
  locked: boolean;
  muted: boolean;
  color: string;
  zIndex: number;
  blendMode: BlendMode;
  pathPoints: NormalizedPoint[];
  keyframes: Keyframe[];
}

export type ColorSpace = 'sdr' | 'hdr10' | 'hlg';

export interface VideoMeta {
  id: ID;
  assetUri: string;
  localUri: string;
  displayName: string;
  durationMs: UnixMs;
  width: number;
  height: number;
  fps: number;
  codec: string;
  bitRate: number;
  audioChannels: number;
  fileSizeBytes: number;
  hasHdr: boolean;
  colorSpace: ColorSpace;
  isICloudAsset: boolean;
  unavailable: boolean;
  corrupted: boolean;
  unsupportedCodec: boolean;
  thumbnailUris: string[];
}

export type PreviewQuality = 'ultra' | 'balanced' | 'smooth';

export interface ExportPreset {
  resolution: '720p' | '1080p' | '4k';
  frameRate: 24 | 30 | 60;
  codec: ExportCodec;
  includeAudio: boolean;
}

export interface Project {
  id: ID;
  name: string;
  createdAt: UnixMs;
  updatedAt: UnixMs;
  thumbnailUri: string;
  accentColor: string;
  video: VideoMeta;
  tracks: Track[];
  exportPreset: ExportPreset;
}

export interface ProjectIndexItem {
  id: ID;
  name: string;
  thumbnailUri: string;
  updatedAt: UnixMs;
  durationMs: UnixMs;
}

export interface RenderState {
  projectId: ID;
  playheadMs: UnixMs;
  previewQuality: PreviewQuality;
  canvasZoom: number;
  canvasPanX: number;
  canvasPanY: number;
  tracks: RenderStateTrack[];
}

export interface RenderStateTrack {
  id: ID;
  visible: boolean;
  locked: boolean;
  blendMode: BlendMode;
  type: RegionType;
  zIndex: number;
  values: KeyframeValues;
  pathPoints: NormalizedPoint[];
}

export interface RegionTemplateValues {
  width: number;
  height: number;
  rotation: number;
  strength: number;
  feather: number;
  opacity: number;
  cornerRadius: number;
}

export interface RegionTemplate {
  id: ID;
  name: string;
  category: string;
  type: RegionType;
  values: RegionTemplateValues;
  createdAt: UnixMs;
  updatedAt: UnixMs;
}

export interface StoredSettings {
  appearance: 'system' | 'dark' | 'light';
  reduceMotionOverride: 'system' | 'on' | 'off';
  accentColor: string;
  previewQuality: PreviewQuality;
  autoGenerateThumbs: boolean;
  safeAreaOverlayDefault: boolean;
  regionTemplates: RegionTemplate[];
}
