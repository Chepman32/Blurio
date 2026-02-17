import {
  ACCENT_COLORS,
  DARK_THEME,
  LIGHT_THEME,
  type ThemeColors,
} from './colors';
import type {
  ExportPreset,
  KeyframeParameter,
  KeyframeValues,
  PreviewQuality,
  StoredSettings,
} from '../types';

export const DEFAULT_KEYFRAME_VALUES: KeyframeValues = {
  x: 0.25,
  y: 0.2,
  width: 0.26,
  height: 0.2,
  rotation: 0,
  strength: 0.8,
  feather: 0.32,
  opacity: 1,
  cornerRadius: 0.14,
};

export const DEFAULT_KEYFRAME_PARAM_MASK: Record<KeyframeParameter, boolean> = {
  x: true,
  y: true,
  width: true,
  height: true,
  rotation: true,
  strength: true,
  feather: true,
  opacity: true,
  cornerRadius: true,
};

export const DEFAULT_EXPORT_PRESET: ExportPreset = {
  resolution: '1080p',
  frameRate: 30,
  codec: 'h264',
  includeAudio: true,
};

export const MIN_SHEET_HEIGHT = 144;
export const MID_SHEET_HEIGHT = 328;
export const MAX_SHEET_HEIGHT = 540;

export const TIMELINE_MIN_ZOOM = 0.4;
export const TIMELINE_MAX_ZOOM = 5;

export const KEYFRAME_SNAP_DISTANCE_MS = 120;

export const PREVIEW_QUALITY_ORDER: PreviewQuality[] = [
  'ultra',
  'balanced',
  'smooth',
];

export const DEFAULT_SETTINGS: StoredSettings = {
  appearance: 'system',
  reduceMotionOverride: 'system',
  accentColor: ACCENT_COLORS[0],
  previewQuality: 'balanced',
  autoGenerateThumbs: true,
  safeAreaOverlayDefault: false,
};

export const THEME_BY_APPEARANCE: Record<'dark' | 'light', ThemeColors> = {
  dark: DARK_THEME,
  light: LIGHT_THEME,
};

export const MIN_FREE_SPACE_FOR_EXPORT_BYTES = 1_500_000_000;

export const FOUR_K_WIDTH = 3840;
export const FOUR_K_HEIGHT = 2160;
