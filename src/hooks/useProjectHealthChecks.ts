import { useEffect } from 'react';
import { useSelectedProject, useEditorStore } from '../store';
import { isLargeVideo } from '../utils/video';

export const useProjectHealthChecks = (): void => {
  const project = useSelectedProject();
  const previewQuality = useEditorStore(state => state.ui.previewQuality);
  const setPreviewQuality = useEditorStore(state => state.setPreviewQuality);
  const setUnsupportedVideoPromptVisible = useEditorStore(
    state => state.setUnsupportedVideoPromptVisible,
  );

  useEffect(() => {
    if (!project) {
      return;
    }

    const unsupported =
      project.video.corrupted ||
      project.video.unsupportedCodec ||
      !project.video.localUri;

    setUnsupportedVideoPromptVisible(unsupported);

    if (isLargeVideo(project.video) && previewQuality !== 'smooth') {
      setPreviewQuality('smooth');
    }
  }, [
    previewQuality,
    project,
    setPreviewQuality,
    setUnsupportedVideoPromptVisible,
  ]);
};
