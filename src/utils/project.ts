import {
  DEFAULT_EXPORT_PRESET,
  DEFAULT_KEYFRAME_PARAM_MASK,
  DEFAULT_KEYFRAME_VALUES,
  FOUR_K_HEIGHT,
  FOUR_K_WIDTH,
} from '../constants';
import type {
  ID,
  Keyframe,
  KeyframeParameter,
  KeyframeValues,
  Project,
  RegionType,
  Track,
  VideoMeta,
} from '../types';
import { createId } from './id';

const keyframeMask = (): Record<KeyframeParameter, boolean> => ({
  ...DEFAULT_KEYFRAME_PARAM_MASK,
});

const createBaseKeyframe = (
  timeMs: number,
  values?: Partial<KeyframeValues>,
): Keyframe => ({
  id: createId('kf'),
  timeMs,
  interpolation: 'linear',
  values: {
    ...DEFAULT_KEYFRAME_VALUES,
    ...values,
  },
  createdAt: Date.now(),
  parameterMask: keyframeMask(),
});

export const createTrack = (
  name: string,
  type: RegionType,
  color: string,
  zIndex: number,
  values?: Partial<KeyframeValues>,
): Track => ({
  id: createId('track'),
  name,
  type,
  visible: true,
  locked: false,
  muted: false,
  color,
  zIndex,
  blendMode: 'gaussian',
  pathPoints: [],
  keyframes: [createBaseKeyframe(0, values)],
});

export const duplicateTrack = (track: Track): Track => ({
  ...track,
  id: createId('track'),
  name: `${track.name} copy`,
  keyframes: track.keyframes.map(keyframe => ({
    ...keyframe,
    id: createId('kf'),
    values: { ...keyframe.values },
    parameterMask: { ...keyframe.parameterMask },
  })),
  pathPoints: track.pathPoints.map(point => ({ ...point })),
});

export const createProject = (
  video: VideoMeta,
  accentColor: string,
  providedName?: string,
  folderId = 'folder-unassigned',
): Project => {
  const id = createId('project');
  const timestamp = Date.now();

  return {
    id,
    name: providedName ?? `Project ${new Date(timestamp).toLocaleDateString()}`,
    createdAt: timestamp,
    updatedAt: timestamp,
    folderId,
    trashedAt: null,
    thumbnailUri: video.thumbnailUris[0] ?? '',
    accentColor,
    video,
    tracks: [
      createTrack('Region 1', 'roundedRect', accentColor, 1, {
        x: 0.23,
        y: 0.25,
      }),
    ],
    exportPreset: { ...DEFAULT_EXPORT_PRESET },
  };
};

export const duplicateProject = (project: Project): Project => {
  const timestamp = Date.now();
  return {
    ...project,
    id: createId('project'),
    name: `${project.name} copy`,
    createdAt: timestamp,
    updatedAt: timestamp,
    trashedAt: null,
    tracks: project.tracks.map(track => duplicateTrack(track)),
    video: {
      ...project.video,
      id: createId('video'),
      thumbnailUris: [...project.video.thumbnailUris],
    },
  };
};

export const updateProjectTrack = (
  project: Project,
  trackId: ID,
  updater: (track: Track) => Track,
): Project => ({
  ...project,
  updatedAt: Date.now(),
  tracks: project.tracks.map(track => (track.id === trackId ? updater(track) : track)),
});

export const isLarge4KVideo = (video: VideoMeta): boolean =>
  video.width >= FOUR_K_WIDTH || video.height >= FOUR_K_HEIGHT;

export const estimateProjectCacheSizeBytes = (project: Project): number => {
  const base = project.video.fileSizeBytes;
  const thumbBudget = project.video.thumbnailUris.length * 150_000;
  const metadata = JSON.stringify(project).length;
  return base + thumbBudget + metadata;
};

const UNSUPPORTED_CODEC_PATTERNS = ['vp9', 'mpeg2'];

export const isCodecUnsupported = (codec: string): boolean => {
  const normalized = codec.toLowerCase();
  return UNSUPPORTED_CODEC_PATTERNS.some(pattern => normalized.includes(pattern));
};
