import {
  DEFAULT_KEYFRAME_VALUES,
  KEYFRAME_SNAP_DISTANCE_MS,
} from '../constants';
import type {
  InterpolationType,
  Keyframe,
  KeyframeParameter,
  KeyframeValues,
  Track,
} from '../types';
import { clamp, easeInOut, lerp, springEase } from './math';

const PARAMS: KeyframeParameter[] = [
  'x',
  'y',
  'width',
  'height',
  'rotation',
  'strength',
  'feather',
  'opacity',
  'cornerRadius',
];

const hasParamValue = (keyframe: Keyframe, parameter: KeyframeParameter): boolean =>
  Boolean(keyframe.parameterMask[parameter]) &&
  typeof keyframe.values[parameter] === 'number';

const resolveValueAroundTime = (
  sorted: Keyframe[],
  parameter: KeyframeParameter,
  timeMs: number,
): {
  previous: Keyframe | null;
  next: Keyframe | null;
} => {
  let previous: Keyframe | null = null;
  let next: Keyframe | null = null;

  for (const keyframe of sorted) {
    if (!hasParamValue(keyframe, parameter)) {
      continue;
    }

    if (keyframe.timeMs <= timeMs) {
      previous = keyframe;
      continue;
    }

    next = keyframe;
    break;
  }

  return { previous, next };
};

const interpolationProgress = (
  interpolation: InterpolationType,
  progress: number,
): number => {
  const t = clamp(progress, 0, 1);

  switch (interpolation) {
    case 'hold':
      return 0;
    case 'easeInOut':
      return easeInOut(t);
    case 'spring':
      return springEase(t);
    case 'linear':
    default:
      return t;
  }
};

const resolveParamValue = (
  track: Track,
  parameter: KeyframeParameter,
  timeMs: number,
): number => {
  const sorted = [...track.keyframes].sort((a, b) => a.timeMs - b.timeMs);
  const { previous, next } = resolveValueAroundTime(sorted, parameter, timeMs);
  const fallback = DEFAULT_KEYFRAME_VALUES[parameter];

  if (!previous && !next) {
    return fallback;
  }

  if (previous && !next) {
    return previous.values[parameter] ?? fallback;
  }

  if (!previous && next) {
    return next.values[parameter] ?? fallback;
  }

  const prev = previous as Keyframe;
  const nextFrame = next as Keyframe;
  const previousValue = prev.values[parameter] ?? fallback;
  const nextValue = nextFrame.values[parameter] ?? previousValue;
  const duration = Math.max(nextFrame.timeMs - prev.timeMs, 1);
  const rawProgress = (timeMs - prev.timeMs) / duration;
  const t = interpolationProgress(prev.interpolation, rawProgress);

  return lerp(previousValue, nextValue, t);
};

export const interpolateTrackValuesAtTime = (
  track: Track,
  timeMs: number,
): KeyframeValues => ({
  x: resolveParamValue(track, 'x', timeMs),
  y: resolveParamValue(track, 'y', timeMs),
  width: resolveParamValue(track, 'width', timeMs),
  height: resolveParamValue(track, 'height', timeMs),
  rotation: resolveParamValue(track, 'rotation', timeMs),
  strength: resolveParamValue(track, 'strength', timeMs),
  feather: resolveParamValue(track, 'feather', timeMs),
  opacity: resolveParamValue(track, 'opacity', timeMs),
  cornerRadius: resolveParamValue(track, 'cornerRadius', timeMs),
});

export const buildInitialKeyframeValues = (
  input?: Partial<KeyframeValues>,
): KeyframeValues => ({
  ...DEFAULT_KEYFRAME_VALUES,
  ...input,
});

export const nearestKeyframeTime = (
  track: Track,
  timeMs: number,
): number | null => {
  if (track.keyframes.length === 0) {
    return null;
  }

  let nearest: number | null = null;
  let distance = Number.MAX_SAFE_INTEGER;

  for (const keyframe of track.keyframes) {
    const delta = Math.abs(keyframe.timeMs - timeMs);

    if (delta < distance) {
      distance = delta;
      nearest = keyframe.timeMs;
    }
  }

  if (nearest === null || distance > KEYFRAME_SNAP_DISTANCE_MS) {
    return null;
  }

  return nearest;
};

export const getAllTrackKeyframeTimes = (tracks: Track[]): number[] => {
  const times = new Set<number>();

  tracks.forEach(track => {
    track.keyframes.forEach(keyframe => {
      times.add(keyframe.timeMs);
    });
  });

  return [...times].sort((a, b) => a - b);
};

export const PARAMETERS = PARAMS;
