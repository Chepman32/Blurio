import type { Project, RenderState, RenderStateTrack, Track } from '../types';
import { interpolateTrackValuesAtTime } from './interpolation';

const toRenderTrack = (track: Track, playheadMs: number): RenderStateTrack => ({
  id: track.id,
  visible: track.visible,
  locked: track.locked,
  blendMode: track.blendMode,
  type: track.type,
  zIndex: track.zIndex,
  values: interpolateTrackValuesAtTime(track, playheadMs),
  pathPoints: track.pathPoints.map(point => ({ ...point })),
});

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
