import type { Project, RenderState, RenderStateTrack, Track } from '../types';
import { interpolateTrackValuesAtTime } from './interpolation';

const getTrackRange = (
  track: Track,
): {
  startMs: number;
  endMs: number;
} => {
  const startMs = Number.isFinite(track.startMs) ? Math.max(0, track.startMs as number) : 0;
  const endCandidate = Number.isFinite(track.endMs)
    ? Math.max(0, track.endMs as number)
    : Number.POSITIVE_INFINITY;
  return {
    startMs,
    endMs: Math.max(startMs, endCandidate),
  };
};

const toRenderTrack = (track: Track, playheadMs: number): RenderStateTrack => {
  const range = getTrackRange(track);
  const inRange = playheadMs >= range.startMs && playheadMs <= range.endMs;

  return {
    id: track.id,
    visible: track.visible && inRange,
    locked: track.locked,
    blendMode: track.blendMode,
    type: track.type,
    zIndex: track.zIndex,
    values: interpolateTrackValuesAtTime(track, playheadMs),
    pathPoints: track.pathPoints.map(point => ({ ...point })),
  };
};

export const buildRenderState = (
  project: Project,
  playheadMs: number,
  previewQuality: RenderState['previewQuality'],
  canvasZoom: number,
  canvasPanX: number,
  canvasPanY: number,
): RenderState => ({
  projectId: project.id,
  playheadMs,
  previewQuality,
  canvasZoom,
  canvasPanX,
  canvasPanY,
  tracks: project.tracks
    .slice()
    .sort((a, b) => a.zIndex - b.zIndex)
    .map(track => toRenderTrack(track, playheadMs)),
});

export const renderStateDigest = (renderState: RenderState): string =>
  JSON.stringify({
    projectId: renderState.projectId,
    playheadMs: Math.round(renderState.playheadMs),
    tracks: renderState.tracks.map(track => ({
      id: track.id,
      visible: track.visible,
      locked: track.locked,
      values: track.values,
    })),
  });
