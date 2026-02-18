import { create } from 'zustand';
import {
  DEFAULT_KEYFRAME_PARAM_MASK,
  DEFAULT_SETTINGS,
  KEYFRAME_SNAP_DISTANCE_MS,
} from '../constants';
import type {
  ID,
  InterpolationType,
  Keyframe,
  KeyframeParameter,
  KeyframeValues,
  PreviewQuality,
  Project,
  RegionType,
  StoredSettings,
  Track,
  UIState,
  UndoEntry,
  VideoMeta,
} from '../types';
import { ExportStage } from '../types';
import { createId } from '../utils/id';
import {
  buildInitialKeyframeValues,
  interpolateTrackValuesAtTime,
  nearestKeyframeTime,
} from '../utils/interpolation';
import { createProject, createTrack, duplicateProject } from '../utils/project';
import {
  loadProjects,
  loadSettings,
  saveProjects,
  saveSettings,
} from '../utils/storage';
import { isLargeVideo } from '../utils/video';

interface SharedTransitionState {
  projectId: ID;
  originX: number;
  originY: number;
  width: number;
  height: number;
}

interface BlurioStore {
  projects: Record<ID, Project>;
  settings: StoredSettings;
  ui: UIState;
  undoStack: UndoEntry[];
  redoStack: UndoEntry[];
  bootstrapCompleted: boolean;
  sharedTransition: SharedTransitionState | null;
  initializeFromDisk: () => void;
  createProjectFromVideo: (video: VideoMeta, name?: string) => ID;
  updateProject: (projectId: ID, updater: (project: Project) => Project) => void;
  deleteProject: (projectId: ID) => void;
  duplicateProjectById: (projectId: ID) => ID | null;
  selectProject: (projectId: ID | null) => void;
  selectTrack: (trackId: ID | null) => void;
  addTrack: (type: RegionType, template?: 'face' | 'plate') => void;
  reorderTracks: (orderedTrackIds: ID[]) => void;
  removeTrack: (trackId: ID) => void;
  toggleTrackVisibility: (trackId: ID) => void;
  toggleTrackLock: (trackId: ID) => void;
  setTrackBlendMode: (trackId: ID, blendMode: Track['blendMode']) => void;
  renameTrack: (trackId: ID, name: string) => void;
  setPlayhead: (timeMs: number, withSnap?: boolean) => void;
  setTimelineZoom: (zoom: number) => void;
  setTimelineExpanded: (expanded: boolean) => void;
  setTimelinePrecisionMode: (enabled: boolean) => void;
  setCanvasTransform: (zoom: number, panX: number, panY: number) => void;
  setActivePanel: (panel: UIState['activePanel']) => void;
  setSheetExpanded: (expanded: boolean) => void;
  setPreviewQuality: (quality: PreviewQuality) => void;
  setGuidesVisible: (visible: boolean) => void;
  setThumbnailsVisible: (visible: boolean) => void;
  setSafeAreaOverlayVisible: (visible: boolean) => void;
  beginTrackValueInteraction: () => void;
  endTrackValueInteraction: () => void;
  updateSelectedTrackValuesLive: (partial: Partial<KeyframeValues>) => void;
  updateSelectedTrackValuesAtPlayhead: (partial: Partial<KeyframeValues>) => void;
  setInterpolationPicker: (interpolation: InterpolationType) => void;
  toggleKeyframeParameterEnabled: (parameter: KeyframeParameter, enabled: boolean) => void;
  addKeyframeAtPlayhead: () => void;
  deleteKeyframeAtPlayhead: () => void;
  setKeyframeInterpolationAtPlayhead: (interpolation: InterpolationType) => void;
  startExport: () => void;
  updateExportProgress: (
    stage: ExportStage,
    progress: number,
    message: string,
  ) => void;
  cancelExport: () => void;
  completeExport: () => void;
  failExport: (message: string) => void;
  setLowStorageWarningVisible: (visible: boolean) => void;
  setHdrWarningVisible: (visible: boolean) => void;
  setAssetUnavailablePromptVisible: (visible: boolean) => void;
  setUnsupportedVideoPromptVisible: (visible: boolean) => void;
  setSharedTransition: (payload: SharedTransitionState | null) => void;
  setAppearance: (appearance: StoredSettings['appearance']) => void;
  setReduceMotionOverride: (
    value: StoredSettings['reduceMotionOverride'],
  ) => void;
  setAccentColor: (color: string) => void;
  setAutoGenerateThumbs: (enabled: boolean) => void;
  setSafeAreaOverlayDefault: (enabled: boolean) => void;
  pushUndoSnapshot: (description: string) => void;
  undo: () => void;
  redo: () => void;
}

const emptyUIState = (settings: StoredSettings): UIState => ({
  selectedProjectId: null,
  selectedTrackId: null,
  playheadMs: 0,
  timelineZoom: 1,
  timelinePrecisionMode: false,
  timelineExpanded: false,
  canvasZoom: 1,
  canvasPanX: 0,
  canvasPanY: 0,
  activePanel: 'addRegion',
  isSheetExpanded: false,
  showGuides: true,
  showThumbnails: true,
  showSafeAreaOverlay: settings.safeAreaOverlayDefault,
  previewQuality: settings.previewQuality,
  interpolationPickerValue: 'linear',
  enabledKeyframeParams: { ...DEFAULT_KEYFRAME_PARAM_MASK },
  isExporting: false,
  exportProgress: 0,
  exportStage: ExportStage.IDLE,
  exportMessage: '',
  exportSuccess: false,
  lowStorageWarningVisible: false,
  hdrWarningVisible: false,
  unavailableAssetPromptVisible: false,
  unsupportedVideoPromptVisible: false,
});

const getSortedProjectIds = (projects: Record<ID, Project>): ID[] =>
  Object.values(projects)
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .map(project => project.id);

const persistProjects = (projects: Record<ID, Project>): void => {
  saveProjects(projects);
};

const persistSettings = (settings: StoredSettings): void => {
  saveSettings(settings);
};

const maxUndoEntries = 80;
const EPSILON = 0.0001;
let trackValueInteractionDepth = 0;
let trackValueInteractionSnapshot: UndoEntry | null = null;

const approxEqual = (a: number, b: number): boolean => Math.abs(a - b) <= EPSILON;

const updateProjectAndPersist = (
  projects: Record<ID, Project>,
  projectId: ID,
  updater: (project: Project) => Project,
): Record<ID, Project> => {
  const project = projects[projectId];
  if (!project) {
    return projects;
  }

  const updated = updater(project);
  const merged = {
    ...projects,
    [projectId]: {
      ...updated,
      updatedAt: Date.now(),
    },
  };

  persistProjects(merged);
  return merged;
};

const projectSnapshot = (
  state: BlurioStore,
  projectId: ID,
): UndoEntry | null => {
  const project = state.projects[projectId];
  if (!project) {
    return null;
  }

  const selectedTrackId = state.ui.selectedTrackId;
  const tracksJson = JSON.stringify(project.tracks);

  return {
    id: createId('undo'),
    timestamp: Date.now(),
    description: 'edit',
    snapshot: {
      projectId,
      selectedTrackId,
      playheadMs: state.ui.playheadMs,
      tracksDigest: tracksJson,
      tracks: tracksJson,
    },
  };
};

const findSelectedProject = (
  state: Pick<BlurioStore, 'projects' | 'ui'>,
): Project | null => {
  const selected = state.ui.selectedProjectId;
  if (!selected) {
    return null;
  }

  return state.projects[selected] ?? null;
};

const pushUndoEntry = (state: BlurioStore, entry: UndoEntry | null): void => {
  if (!entry) {
    return;
  }

  state.undoStack.push(entry);
  if (state.undoStack.length > maxUndoEntries) {
    state.undoStack.shift();
  }
  state.redoStack = [];
};

const findKeyframeAtPlayhead = (
  track: Track,
  playheadMs: number,
): Keyframe | null => {
  const threshold = KEYFRAME_SNAP_DISTANCE_MS;
  const exact = track.keyframes.find(
    keyframe => Math.abs(keyframe.timeMs - playheadMs) <= threshold,
  );

  return exact ?? null;
};

const sanitizeKeyframePartial = (
  partial: Partial<KeyframeValues>,
): Partial<KeyframeValues> => {
  const sanitized: Partial<KeyframeValues> = {};

  for (const [parameter, value] of Object.entries(partial) as Array<
    [keyof KeyframeValues, number | undefined]
  >) {
    if (typeof value === 'number' && Number.isFinite(value)) {
      sanitized[parameter] = value;
    }
  }

  return sanitized;
};

const buildParameterMaskForPartial = (
  mask: Record<KeyframeParameter, boolean> | undefined,
  partial: Partial<KeyframeValues>,
): Record<KeyframeParameter, boolean> => {
  const nextMask: Record<KeyframeParameter, boolean> = {
    ...DEFAULT_KEYFRAME_PARAM_MASK,
    ...mask,
  };

  for (const parameter of Object.keys(partial) as KeyframeParameter[]) {
    nextMask[parameter] = true;
  }

  return nextMask;
};

const applySelectedTrackValuesAtPlayhead = (
  state: Pick<BlurioStore, 'projects' | 'ui'>,
  partial: Partial<KeyframeValues>,
): { projects: Record<ID, Project>; projectId: ID } | null => {
  const safePartial = sanitizeKeyframePartial(partial);
  if (Object.keys(safePartial).length === 0) {
    return null;
  }

  const project = findSelectedProject(state);
  const selectedTrackId = state.ui.selectedTrackId;
  if (!project || !selectedTrackId) {
    return null;
  }

  const track = project.tracks.find(item => item.id === selectedTrackId);
  if (!track || track.locked) {
    return null;
  }

  const existingKeyframe = findKeyframeAtPlayhead(track, state.ui.playheadMs);
  const updatedProject: Project = {
    ...project,
    tracks: project.tracks.map(candidate => {
      if (candidate.id !== selectedTrackId) {
        return candidate;
      }

      if (existingKeyframe) {
        return {
          ...candidate,
          keyframes: candidate.keyframes.map(keyframe =>
            keyframe.id === existingKeyframe.id
              ? {
                  ...keyframe,
                  values: {
                    ...keyframe.values,
                    ...safePartial,
                  },
                  parameterMask: buildParameterMaskForPartial(
                    keyframe.parameterMask,
                    safePartial,
                  ),
                }
              : keyframe,
          ),
        };
      }

      const values = {
        ...interpolateTrackValuesAtTime(candidate, state.ui.playheadMs),
        ...safePartial,
      };

      const keyframe: Keyframe = {
        id: createId('kf'),
        timeMs: state.ui.playheadMs,
        interpolation: state.ui.interpolationPickerValue,
        values,
        createdAt: Date.now(),
        parameterMask: buildParameterMaskForPartial(
          state.ui.enabledKeyframeParams,
          safePartial,
        ),
      };

      return {
        ...candidate,
        keyframes: [...candidate.keyframes, keyframe].sort((a, b) => a.timeMs - b.timeMs),
      };
    }),
  };

  return {
    projects: {
      ...state.projects,
      [project.id]: updatedProject,
    },
    projectId: project.id,
  };
};

const applyTemplateValues = (template?: 'face' | 'plate'): Partial<KeyframeValues> => {
  switch (template) {
    case 'face':
      return {
        x: 0.33,
        y: 0.18,
        width: 0.24,
        height: 0.24,
        cornerRadius: 0.6,
      };
    case 'plate':
      return {
        x: 0.32,
        y: 0.68,
        width: 0.36,
        height: 0.12,
        cornerRadius: 0.12,
      };
    default:
      return {};
  }
};

const generateTrackName = (project: Project): string =>
  `Region ${project.tracks.length + 1}`;

export const useEditorStore = create<BlurioStore>((set, get) => ({
  projects: {},
  settings: { ...DEFAULT_SETTINGS },
  ui: emptyUIState(DEFAULT_SETTINGS),
  undoStack: [],
  redoStack: [],
  bootstrapCompleted: false,
  sharedTransition: null,

  initializeFromDisk: () => {
    const projects = loadProjects();
    const settings = loadSettings();
    const ids = getSortedProjectIds(projects);
    const selectedProjectId = ids[0] ?? null;
    const selectedTrackId =
      selectedProjectId && projects[selectedProjectId]
        ? projects[selectedProjectId].tracks[0]?.id ?? null
        : null;

    set({
      projects,
      settings,
      ui: {
        ...emptyUIState(settings),
        selectedProjectId,
        selectedTrackId,
        previewQuality: settings.previewQuality,
      },
      bootstrapCompleted: true,
    });
  },

  createProjectFromVideo: (video, name) => {
    const state = get();
    const project = createProject(video, state.settings.accentColor, name);
    const previewQuality = isLargeVideo(video) ? 'smooth' : state.ui.previewQuality;

    const projects = {
      ...state.projects,
      [project.id]: project,
    };

    persistProjects(projects);

    set({
      projects,
      ui: {
        ...state.ui,
        selectedProjectId: project.id,
        selectedTrackId: project.tracks[0]?.id ?? null,
        playheadMs: 0,
        previewQuality,
      },
    });

    return project.id;
  },

  updateProject: (projectId, updater) => {
    set(state => ({
      projects: updateProjectAndPersist(state.projects, projectId, updater),
    }));
  },

  deleteProject: projectId => {
    const state = get();
    if (!state.projects[projectId]) {
      return;
    }

    const projects = { ...state.projects };
    delete projects[projectId];
    persistProjects(projects);

    const nextSelectedId =
      state.ui.selectedProjectId === projectId
        ? getSortedProjectIds(projects)[0] ?? null
        : state.ui.selectedProjectId;

    const selectedTrackId =
      nextSelectedId && projects[nextSelectedId]
        ? projects[nextSelectedId].tracks[0]?.id ?? null
        : null;

    set({
      projects,
      ui: {
        ...state.ui,
        selectedProjectId: nextSelectedId,
        selectedTrackId,
      },
    });
  },

  duplicateProjectById: projectId => {
    const state = get();
    const project = state.projects[projectId];
    if (!project) {
      return null;
    }

    const duplicated = duplicateProject(project);
    const projects = {
      ...state.projects,
      [duplicated.id]: duplicated,
    };

    persistProjects(projects);
    set({ projects });
    return duplicated.id;
  },

  selectProject: projectId => {
    set(state => {
      const project = projectId ? state.projects[projectId] : null;
      const selectedTrackId = project?.tracks[0]?.id ?? null;
      if (
        state.ui.selectedProjectId === projectId &&
        state.ui.selectedTrackId === selectedTrackId &&
        state.ui.playheadMs === 0
      ) {
        return state;
      }

      return {
        ui: {
          ...state.ui,
          selectedProjectId: projectId,
          selectedTrackId,
          playheadMs: 0,
        },
      };
    });
  },

  selectTrack: trackId => {
    set(state =>
      state.ui.selectedTrackId === trackId
        ? state
        : {
            ui: {
              ...state.ui,
              selectedTrackId: trackId,
            },
          },
    );
  },

  addTrack: (type, template) => {
    const state = get();
    const project = findSelectedProject(state);
    if (!project) {
      return;
    }

    const snapshot = projectSnapshot(state, project.id);

    const newTrack = createTrack(
      generateTrackName(project),
      type,
      state.settings.accentColor,
      project.tracks.length + 1,
      applyTemplateValues(template),
    );

    const projects = updateProjectAndPersist(state.projects, project.id, current => ({
      ...current,
      tracks: [...current.tracks, newTrack],
    }));

    pushUndoEntry(state, snapshot);

    set({
      projects,
      undoStack: [...state.undoStack],
      redoStack: [],
      ui: {
        ...state.ui,
        selectedTrackId: newTrack.id,
      },
    });
  },

  reorderTracks: orderedTrackIds => {
    const state = get();
    const project = findSelectedProject(state);
    if (!project) {
      return;
    }

    const snapshot = projectSnapshot(state, project.id);

    const trackMap = new Map(project.tracks.map(track => [track.id, track]));
    const reordered = orderedTrackIds
      .map((trackId, index) => {
        const track = trackMap.get(trackId);
        if (!track) {
          return null;
        }

        return {
          ...track,
          zIndex: index + 1,
        };
      })
      .filter((track): track is Track => Boolean(track));

    const projects = updateProjectAndPersist(state.projects, project.id, current => ({
      ...current,
      tracks: reordered,
    }));

    pushUndoEntry(state, snapshot);

    set({
      projects,
      undoStack: [...state.undoStack],
      redoStack: [],
    });
  },

  removeTrack: trackId => {
    const state = get();
    const project = findSelectedProject(state);
    if (!project || project.tracks.length === 1) {
      return;
    }

    const snapshot = projectSnapshot(state, project.id);

    const projects = updateProjectAndPersist(state.projects, project.id, current => ({
      ...current,
      tracks: current.tracks.filter(track => track.id !== trackId),
    }));

    const remaining = projects[project.id]?.tracks ?? [];

    pushUndoEntry(state, snapshot);

    set({
      projects,
      undoStack: [...state.undoStack],
      redoStack: [],
      ui: {
        ...state.ui,
        selectedTrackId:
          state.ui.selectedTrackId === trackId
            ? remaining[0]?.id ?? null
            : state.ui.selectedTrackId,
      },
    });
  },

  toggleTrackVisibility: trackId => {
    const state = get();
    const project = findSelectedProject(state);
    if (!project) {
      return;
    }

    const snapshot = projectSnapshot(state, project.id);

    const projects = updateProjectAndPersist(state.projects, project.id, current => ({
      ...current,
      tracks: current.tracks.map(track =>
        track.id === trackId
          ? {
              ...track,
              visible: !track.visible,
            }
          : track,
      ),
    }));

    pushUndoEntry(state, snapshot);

    set({
      projects,
      undoStack: [...state.undoStack],
      redoStack: [],
    });
  },

  toggleTrackLock: trackId => {
    const state = get();
    const project = findSelectedProject(state);
    if (!project) {
      return;
    }

    const snapshot = projectSnapshot(state, project.id);

    const projects = updateProjectAndPersist(state.projects, project.id, current => ({
      ...current,
      tracks: current.tracks.map(track =>
        track.id === trackId
          ? {
              ...track,
              locked: !track.locked,
            }
          : track,
      ),
    }));

    pushUndoEntry(state, snapshot);

    set({
      projects,
      undoStack: [...state.undoStack],
      redoStack: [],
    });
  },

  setTrackBlendMode: (trackId, blendMode) => {
    const state = get();
    const project = findSelectedProject(state);
    if (!project) {
      return;
    }

    const snapshot = projectSnapshot(state, project.id);

    const projects = updateProjectAndPersist(state.projects, project.id, current => ({
      ...current,
      tracks: current.tracks.map(track =>
        track.id === trackId
          ? {
              ...track,
              blendMode,
            }
          : track,
      ),
    }));

    pushUndoEntry(state, snapshot);

    set({
      projects,
      undoStack: [...state.undoStack],
      redoStack: [],
    });
  },

  renameTrack: (trackId, name) => {
    const state = get();
    const project = findSelectedProject(state);
    if (!project) {
      return;
    }

    const projects = updateProjectAndPersist(state.projects, project.id, current => ({
      ...current,
      tracks: current.tracks.map(track =>
        track.id === trackId
          ? {
              ...track,
              name,
            }
          : track,
      ),
    }));

    set({ projects });
  },

  setPlayhead: (timeMs, withSnap = false) => {
    const state = get();
    const project = findSelectedProject(state);

    let playheadMs = Math.max(0, timeMs);
    if (project) {
      playheadMs = Math.min(playheadMs, project.video.durationMs);

      if (withSnap && state.ui.selectedTrackId) {
        const track = project.tracks.find(item => item.id === state.ui.selectedTrackId);
        if (track) {
          const snappedTime = nearestKeyframeTime(track, playheadMs);
          if (snappedTime !== null) {
            playheadMs = snappedTime;
          }
        }
      }
    }

    if (approxEqual(state.ui.playheadMs, playheadMs)) {
      return;
    }

    set({
      ui: {
        ...state.ui,
        playheadMs,
      },
    });
  },

  setTimelineZoom: zoom => {
    set(state => {
      const timelineZoom = Math.max(0.4, Math.min(zoom, 5));
      if (approxEqual(state.ui.timelineZoom, timelineZoom)) {
        return state;
      }

      return {
        ui: {
          ...state.ui,
          timelineZoom,
        },
      };
    });
  },

  setTimelineExpanded: expanded => {
    set(state =>
      state.ui.timelineExpanded === expanded
        ? state
        : {
            ui: {
              ...state.ui,
              timelineExpanded: expanded,
            },
          },
    );
  },

  setTimelinePrecisionMode: enabled => {
    set(state =>
      state.ui.timelinePrecisionMode === enabled
        ? state
        : {
            ui: {
              ...state.ui,
              timelinePrecisionMode: enabled,
            },
          },
    );
  },

  setCanvasTransform: (zoom, panX, panY) => {
    set(state =>
      approxEqual(state.ui.canvasZoom, zoom) &&
      approxEqual(state.ui.canvasPanX, panX) &&
      approxEqual(state.ui.canvasPanY, panY)
        ? state
        : {
            ui: {
              ...state.ui,
              canvasZoom: zoom,
              canvasPanX: panX,
              canvasPanY: panY,
            },
          },
    );
  },

  setActivePanel: panel => {
    set(state =>
      state.ui.activePanel === panel
        ? state
        : {
            ui: {
              ...state.ui,
              activePanel: panel,
            },
          },
    );
  },

  setSheetExpanded: expanded => {
    set(state =>
      state.ui.isSheetExpanded === expanded
        ? state
        : {
            ui: {
              ...state.ui,
              isSheetExpanded: expanded,
            },
          },
    );
  },

  setPreviewQuality: quality => {
    const state = get();
    if (
      state.ui.previewQuality === quality &&
      state.settings.previewQuality === quality
    ) {
      return;
    }

    const settings = {
      ...state.settings,
      previewQuality: quality,
    };

    persistSettings(settings);

    set({
      settings,
      ui: {
        ...state.ui,
        previewQuality: quality,
      },
    });
  },

  setGuidesVisible: visible => {
    set(state =>
      state.ui.showGuides === visible
        ? state
        : {
            ui: {
              ...state.ui,
              showGuides: visible,
            },
          },
    );
  },

  setThumbnailsVisible: visible => {
    set(state =>
      state.ui.showThumbnails === visible
        ? state
        : {
            ui: {
              ...state.ui,
              showThumbnails: visible,
            },
          },
    );
  },

  setSafeAreaOverlayVisible: visible => {
    set(state =>
      state.ui.showSafeAreaOverlay === visible
        ? state
        : {
            ui: {
              ...state.ui,
              showSafeAreaOverlay: visible,
            },
          },
    );
  },

  beginTrackValueInteraction: () => {
    const state = get();
    if (trackValueInteractionDepth === 0) {
      const selectedProjectId = state.ui.selectedProjectId;
      trackValueInteractionSnapshot = selectedProjectId
        ? projectSnapshot(state, selectedProjectId)
        : null;
      if (trackValueInteractionSnapshot) {
        trackValueInteractionSnapshot.description = 'transform';
      }
    }
    trackValueInteractionDepth += 1;
  },

  endTrackValueInteraction: () => {
    if (trackValueInteractionDepth === 0) {
      return;
    }

    trackValueInteractionDepth = Math.max(0, trackValueInteractionDepth - 1);
    if (trackValueInteractionDepth > 0) {
      return;
    }

    const state = get();
    const snapshot = trackValueInteractionSnapshot;
    trackValueInteractionSnapshot = null;

    const projectId = snapshot?.snapshot.projectId ?? state.ui.selectedProjectId;
    if (!projectId) {
      return;
    }

    const project = state.projects[projectId];
    if (!project) {
      return;
    }

    const currentDigest = JSON.stringify(project.tracks);
    const changed = snapshot
      ? currentDigest !== snapshot.snapshot.tracksDigest
      : true;
    if (!changed) {
      return;
    }

    const projects = {
      ...state.projects,
      [projectId]: {
        ...project,
        updatedAt: Date.now(),
      },
    };
    persistProjects(projects);

    if (snapshot) {
      pushUndoEntry(state, snapshot);
    }

    set({
      projects,
      undoStack: [...state.undoStack],
      redoStack: [...state.redoStack],
    });
  },

  updateSelectedTrackValuesLive: partial => {
    const state = get();
    const next = applySelectedTrackValuesAtPlayhead(state, partial);
    if (!next) {
      return;
    }

    set({
      projects: next.projects,
    });
  },

  updateSelectedTrackValuesAtPlayhead: partial => {
    const state = get();
    const next = applySelectedTrackValuesAtPlayhead(state, partial);
    if (!next) {
      return;
    }

    const snapshot = projectSnapshot(state, next.projectId);
    const nextProject = next.projects[next.projectId];
    if (!nextProject) {
      return;
    }

    const projects: Record<ID, Project> = {
      ...next.projects,
      [next.projectId]: {
        ...nextProject,
        updatedAt: Date.now(),
      },
    };
    persistProjects(projects);

    pushUndoEntry(state, snapshot);

    set({
      projects,
      undoStack: [...state.undoStack],
      redoStack: [],
    });
  },

  setInterpolationPicker: interpolation => {
    set(state =>
      state.ui.interpolationPickerValue === interpolation
        ? state
        : {
            ui: {
              ...state.ui,
              interpolationPickerValue: interpolation,
            },
          },
    );
  },

  toggleKeyframeParameterEnabled: (parameter, enabled) => {
    set(state =>
      state.ui.enabledKeyframeParams[parameter] === enabled
        ? state
        : {
            ui: {
              ...state.ui,
              enabledKeyframeParams: {
                ...state.ui.enabledKeyframeParams,
                [parameter]: enabled,
              },
            },
          },
    );
  },

  addKeyframeAtPlayhead: () => {
    const state = get();
    const project = findSelectedProject(state);
    const selectedTrackId = state.ui.selectedTrackId;
    if (!project || !selectedTrackId) {
      return;
    }

    const snapshot = projectSnapshot(state, project.id);

    const projects = updateProjectAndPersist(state.projects, project.id, current => ({
      ...current,
      tracks: current.tracks.map(track => {
        if (track.id !== selectedTrackId) {
          return track;
        }

        const existing = findKeyframeAtPlayhead(track, state.ui.playheadMs);
        if (existing) {
          return track;
        }

        const values = buildInitialKeyframeValues(
          interpolateTrackValuesAtTime(track, state.ui.playheadMs),
        );

        const keyframe: Keyframe = {
          id: createId('kf'),
          timeMs: state.ui.playheadMs,
          interpolation: state.ui.interpolationPickerValue,
          values,
          createdAt: Date.now(),
          parameterMask: { ...state.ui.enabledKeyframeParams },
        };

        return {
          ...track,
          keyframes: [...track.keyframes, keyframe].sort(
            (a, b) => a.timeMs - b.timeMs,
          ),
        };
      }),
    }));

    pushUndoEntry(state, snapshot);

    set({
      projects,
      undoStack: [...state.undoStack],
      redoStack: [],
    });
  },

  deleteKeyframeAtPlayhead: () => {
    const state = get();
    const project = findSelectedProject(state);
    const selectedTrackId = state.ui.selectedTrackId;
    if (!project || !selectedTrackId) {
      return;
    }

    const snapshot = projectSnapshot(state, project.id);

    const projects = updateProjectAndPersist(state.projects, project.id, current => ({
      ...current,
      tracks: current.tracks.map(track => {
        if (track.id !== selectedTrackId) {
          return track;
        }

        return {
          ...track,
          keyframes: track.keyframes.filter(
            keyframe =>
              Math.abs(keyframe.timeMs - state.ui.playheadMs) >
              KEYFRAME_SNAP_DISTANCE_MS,
          ),
        };
      }),
    }));

    pushUndoEntry(state, snapshot);

    set({
      projects,
      undoStack: [...state.undoStack],
      redoStack: [],
    });
  },

  setKeyframeInterpolationAtPlayhead: interpolation => {
    const state = get();
    const project = findSelectedProject(state);
    const selectedTrackId = state.ui.selectedTrackId;
    if (!project || !selectedTrackId) {
      return;
    }

    const projects = updateProjectAndPersist(state.projects, project.id, current => ({
      ...current,
      tracks: current.tracks.map(track => {
        if (track.id !== selectedTrackId) {
          return track;
        }

        return {
          ...track,
          keyframes: track.keyframes.map(keyframe =>
            Math.abs(keyframe.timeMs - state.ui.playheadMs) <=
            KEYFRAME_SNAP_DISTANCE_MS
              ? {
                  ...keyframe,
                  interpolation,
                }
              : keyframe,
          ),
        };
      }),
    }));

    set({
      projects,
      ui: {
        ...state.ui,
        interpolationPickerValue: interpolation,
      },
    });
  },

  startExport: () => {
    set(state => ({
      ui: {
        ...state.ui,
        isExporting: true,
        exportProgress: 0,
        exportStage: ExportStage.DECODING,
        exportMessage: '',
        exportSuccess: false,
      },
    }));
  },

  updateExportProgress: (stage, progress, message) => {
    set(state => ({
      ui: {
        ...state.ui,
        isExporting: stage !== ExportStage.COMPLETE,
        exportStage: stage,
        exportProgress: Math.max(0, Math.min(progress, 1)),
        exportMessage: message,
      },
    }));
  },

  cancelExport: () => {
    set(state => ({
      ui: {
        ...state.ui,
        isExporting: false,
        exportStage: ExportStage.CANCELLED,
        exportProgress: 0,
      },
    }));
  },

  completeExport: () => {
    set(state => ({
      ui: {
        ...state.ui,
        isExporting: false,
        exportStage: ExportStage.COMPLETE,
        exportProgress: 1,
        exportSuccess: true,
      },
    }));
  },

  failExport: message => {
    set(state => ({
      ui: {
        ...state.ui,
        isExporting: false,
        exportStage: ExportStage.FAILED,
        exportMessage: message,
      },
    }));
  },

  setLowStorageWarningVisible: visible => {
    set(state =>
      state.ui.lowStorageWarningVisible === visible
        ? state
        : {
            ui: {
              ...state.ui,
              lowStorageWarningVisible: visible,
            },
          },
    );
  },

  setHdrWarningVisible: visible => {
    set(state =>
      state.ui.hdrWarningVisible === visible
        ? state
        : {
            ui: {
              ...state.ui,
              hdrWarningVisible: visible,
            },
          },
    );
  },

  setAssetUnavailablePromptVisible: visible => {
    set(state =>
      state.ui.unavailableAssetPromptVisible === visible
        ? state
        : {
            ui: {
              ...state.ui,
              unavailableAssetPromptVisible: visible,
            },
          },
    );
  },

  setUnsupportedVideoPromptVisible: visible => {
    set(state =>
      state.ui.unsupportedVideoPromptVisible === visible
        ? state
        : {
            ui: {
              ...state.ui,
              unsupportedVideoPromptVisible: visible,
            },
          },
    );
  },

  setSharedTransition: payload => {
    set({ sharedTransition: payload });
  },

  setAppearance: appearance => {
    const state = get();
    if (state.settings.appearance === appearance) {
      return;
    }

    const settings = {
      ...state.settings,
      appearance,
    };

    persistSettings(settings);
    set({ settings });
  },

  setReduceMotionOverride: value => {
    const state = get();
    if (state.settings.reduceMotionOverride === value) {
      return;
    }

    const settings = {
      ...state.settings,
      reduceMotionOverride: value,
    };

    persistSettings(settings);
    set({ settings });
  },

  setAccentColor: color => {
    const state = get();
    if (state.settings.accentColor === color) {
      return;
    }

    const settings = {
      ...state.settings,
      accentColor: color,
    };

    persistSettings(settings);

    const projectId = state.ui.selectedProjectId;
    const projects = projectId
      ? updateProjectAndPersist(state.projects, projectId, project => ({
          ...project,
          accentColor: color,
        }))
      : state.projects;

    set({
      settings,
      projects,
    });
  },

  setAutoGenerateThumbs: enabled => {
    const state = get();
    if (state.settings.autoGenerateThumbs === enabled) {
      return;
    }

    const settings = {
      ...state.settings,
      autoGenerateThumbs: enabled,
    };

    persistSettings(settings);
    set({ settings });
  },

  setSafeAreaOverlayDefault: enabled => {
    const state = get();
    if (
      state.settings.safeAreaOverlayDefault === enabled &&
      state.ui.showSafeAreaOverlay === enabled
    ) {
      return;
    }

    const settings = {
      ...state.settings,
      safeAreaOverlayDefault: enabled,
    };

    persistSettings(settings);
    set({
      settings,
      ui: {
        ...state.ui,
        showSafeAreaOverlay: enabled,
      },
    });
  },

  pushUndoSnapshot: description => {
    const state = get();
    const selectedProjectId = state.ui.selectedProjectId;
    if (!selectedProjectId) {
      return;
    }

    const snapshot = projectSnapshot(state, selectedProjectId);
    if (!snapshot) {
      return;
    }

    snapshot.description = description;
    pushUndoEntry(state, snapshot);

    set({
      undoStack: [...state.undoStack],
      redoStack: [],
    });
  },

  undo: () => {
    const state = get();
    const entry = state.undoStack[state.undoStack.length - 1];
    if (!entry) {
      return;
    }

    const project = state.projects[entry.snapshot.projectId];
    if (!project) {
      return;
    }

    const currentSnapshot = projectSnapshot(state, entry.snapshot.projectId);

    const tracks = JSON.parse(entry.snapshot.tracks) as Track[];
    const projects = updateProjectAndPersist(state.projects, project.id, current => ({
      ...current,
      tracks,
    }));

    const nextUndo = state.undoStack.slice(0, -1);
    const nextRedo = currentSnapshot ? [...state.redoStack, currentSnapshot] : state.redoStack;

    set({
      projects,
      undoStack: nextUndo,
      redoStack: nextRedo,
      ui: {
        ...state.ui,
        playheadMs: entry.snapshot.playheadMs,
        selectedTrackId: entry.snapshot.selectedTrackId,
      },
    });
  },

  redo: () => {
    const state = get();
    const entry = state.redoStack[state.redoStack.length - 1];
    if (!entry) {
      return;
    }

    const project = state.projects[entry.snapshot.projectId];
    if (!project) {
      return;
    }

    const currentSnapshot = projectSnapshot(state, entry.snapshot.projectId);

    const tracks = JSON.parse(entry.snapshot.tracks) as Track[];
    const projects = updateProjectAndPersist(state.projects, project.id, current => ({
      ...current,
      tracks,
    }));

    const nextRedo = state.redoStack.slice(0, -1);
    const nextUndo = currentSnapshot ? [...state.undoStack, currentSnapshot] : state.undoStack;

    set({
      projects,
      redoStack: nextRedo,
      undoStack: nextUndo,
      ui: {
        ...state.ui,
        playheadMs: entry.snapshot.playheadMs,
        selectedTrackId: entry.snapshot.selectedTrackId,
      },
    });
  },
}));
