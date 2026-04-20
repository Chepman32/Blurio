import { createMMKV } from 'react-native-mmkv';
import RNFS from 'react-native-fs';
import { DEFAULT_SETTINGS } from '../constants';
import type { Project, ProjectFolder, StoredSettings } from '../types';

const PROJECTS_KEY = 'projects_v1';
const FOLDERS_KEY = 'folders_v1';
const SETTINGS_KEY = 'settings_v1';
const RELATIVE_PREFIX = 'rel://';

export const projectsMMKV = createMMKV({ id: 'blurio.projects' });
export const settingsMMKV = createMMKV({ id: 'blurio.settings' });

const parseJson = <T>(value: string | undefined, fallback: T): T => {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

const isLocalFileUri = (value: string): boolean =>
  value.startsWith('file://') || value.startsWith('/');

const toRelativePath = (path: string): string => {
  if (!path || !isLocalFileUri(path)) {
    return path;
  }

  const stripped = path.startsWith('file://') ? path.slice(7) : path;
  const currentDocPath = RNFS.DocumentDirectoryPath;

  if (stripped.startsWith(`${currentDocPath}/`)) {
    const relative = stripped.slice(currentDocPath.length + 1);
    return `${RELATIVE_PREFIX}${relative}`;
  }

  return path;
};

const toAbsolutePath = (path: string): string => {
  if (!path || !path.startsWith(RELATIVE_PREFIX)) {
    return path;
  }

  const relative = path.slice(RELATIVE_PREFIX.length);
  return `file://${RNFS.DocumentDirectoryPath}/${relative}`;
};

const migratePath = (path: string): string => {
  if (!path || !isLocalFileUri(path)) {
    return path;
  }

  const stripped = path.startsWith('file://') ? path.slice(7) : path;
  const currentDocPath = RNFS.DocumentDirectoryPath;

  // Already using current Documents path
  if (stripped.startsWith(`${currentDocPath}/`)) {
    return path;
  }

  // Already relative-encoded
  if (path.startsWith(RELATIVE_PREFIX)) {
    return toAbsolutePath(path);
  }

  // Old Documents path (different app container UUID) — remap to current
  const docsIndex = stripped.indexOf('/Documents/');
  if (docsIndex !== -1) {
    const relative = stripped.slice(docsIndex + '/Documents/'.length);
    return `file://${currentDocPath}/${relative}`;
  }

  return path;
};

const normalizeProjectPaths = (project: Project): Project => ({
  ...project,
  thumbnailUri: toRelativePath(project.thumbnailUri),
  video: {
    ...project.video,
    localUri: toRelativePath(project.video.localUri),
    thumbnailUris: project.video.thumbnailUris.map(toRelativePath),
  },
});

const denormalizeProjectPaths = (project: Project): Project => ({
  ...project,
  thumbnailUri: toAbsolutePath(migratePath(project.thumbnailUri)),
  video: {
    ...project.video,
    localUri: toAbsolutePath(migratePath(project.video.localUri)),
    thumbnailUris: project.video.thumbnailUris.map(uri =>
      toAbsolutePath(migratePath(uri)),
    ),
  },
});

export const loadProjects = (): Record<string, Project> => {
  const raw = parseJson<Record<string, Project>>(
    projectsMMKV.getString(PROJECTS_KEY),
    {},
  );

  const migrated: Record<string, Project> = {};
  let anyChanged = false;

  Object.entries(raw).forEach(([id, project]) => {
    const denormalized = denormalizeProjectPaths(project);
    migrated[id] = denormalized;
    if (
      denormalized.video.localUri !== project.video.localUri ||
      denormalized.thumbnailUri !== project.thumbnailUri ||
      denormalized.video.thumbnailUris.some(
        (uri, i) => uri !== project.video.thumbnailUris[i],
      )
    ) {
      anyChanged = true;
    }
  });

  if (anyChanged) {
    // Persist the migrated (now relative-encoded) paths back to storage
    const normalized: Record<string, Project> = {};
    Object.entries(migrated).forEach(([id, project]) => {
      normalized[id] = normalizeProjectPaths(project);
    });
    projectsMMKV.set(PROJECTS_KEY, JSON.stringify(normalized));
  }

  return migrated;
};

export const saveProjects = (projects: Record<string, Project>): void => {
  const normalized: Record<string, Project> = {};
  Object.entries(projects).forEach(([id, project]) => {
    normalized[id] = normalizeProjectPaths(project);
  });
  projectsMMKV.set(PROJECTS_KEY, JSON.stringify(normalized));
};

export const loadFolders = (): Record<string, ProjectFolder> =>
  parseJson<Record<string, ProjectFolder>>(projectsMMKV.getString(FOLDERS_KEY), {});

export const saveFolders = (folders: Record<string, ProjectFolder>): void => {
  projectsMMKV.set(FOLDERS_KEY, JSON.stringify(folders));
};

export const clearProjectsStorage = (): void => {
  projectsMMKV.remove(PROJECTS_KEY);
  projectsMMKV.remove(FOLDERS_KEY);
};

export const loadSettings = (): StoredSettings => {
  const stored = parseJson<Partial<StoredSettings>>(settingsMMKV.getString(SETTINGS_KEY), {});

  return {
    ...DEFAULT_SETTINGS,
    ...stored,
    onboarding: {
      ...DEFAULT_SETTINGS.onboarding,
      ...stored.onboarding,
    },
  };
};

export const saveSettings = (settings: StoredSettings): void => {
  settingsMMKV.set(SETTINGS_KEY, JSON.stringify(settings));
};

export const estimatePersistedProjectsBytes = (): number => {
  const raw = projectsMMKV.getString(PROJECTS_KEY) ?? '';
  return raw.length;
};
