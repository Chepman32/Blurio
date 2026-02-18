import { useMemo } from 'react';
import { useEditorStore } from './editorStore';
import type { Project, ProjectFolder, RenderState, Track } from '../types';
import { buildRenderState } from '../utils/renderState';

export const useSelectedProject = (): Project | null =>
  useEditorStore(state => {
    const selectedId = state.ui.selectedProjectId;
    if (!selectedId) {
      return null;
    }

    const project = state.projects[selectedId] ?? null;
    if (!project || project.trashedAt !== null) {
      return null;
    }

    return project;
  });

export const useSelectedTrack = (): Track | null =>
  useEditorStore(state => {
    const projectId = state.ui.selectedProjectId;
    const trackId = state.ui.selectedTrackId;
    if (!projectId || !trackId) {
      return null;
    }

    const project = state.projects[projectId];
    if (!project || project.trashedAt !== null) {
      return null;
    }
    return project.tracks.find(track => track.id === trackId) ?? null;
  });

export const useProjectList = (): Project[] => {
  const projects = useEditorStore(state => state.projects);

  return useMemo(
    () => Object.values(projects).sort((a, b) => b.updatedAt - a.updatedAt),
    [projects],
  );
};

export const useActiveProjectList = (): Project[] =>
  useProjectList().filter(project => project.trashedAt === null);

export const useTrashProjectList = (): Project[] =>
  useProjectList().filter(project => project.trashedAt !== null);

export const useFolderList = (): ProjectFolder[] => {
  const folders = useEditorStore(state => state.folders);

  return useMemo(
    () => Object.values(folders).sort((a, b) => a.createdAt - b.createdAt),
    [folders],
  );
};

export const useCurrentRenderState = (): RenderState | null => {
  const project = useSelectedProject();
  const playheadMs = useEditorStore(state => state.ui.playheadMs);
  const previewQuality = useEditorStore(state => state.ui.previewQuality);
  const canvasZoom = useEditorStore(state => state.ui.canvasZoom);
  const canvasPanX = useEditorStore(state => state.ui.canvasPanX);
  const canvasPanY = useEditorStore(state => state.ui.canvasPanY);

  return useMemo(() => {
    if (!project) {
      return null;
    }

    return buildRenderState(
      project,
      playheadMs,
      previewQuality,
      canvasZoom,
      canvasPanX,
      canvasPanY,
    );
  }, [project, playheadMs, previewQuality, canvasZoom, canvasPanX, canvasPanY]);
};
