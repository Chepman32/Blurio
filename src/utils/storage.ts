import { createMMKV } from 'react-native-mmkv';
import { DEFAULT_SETTINGS } from '../constants';
import type { Project, ProjectFolder, StoredSettings } from '../types';

const PROJECTS_KEY = 'projects_v1';
const FOLDERS_KEY = 'folders_v1';
const SETTINGS_KEY = 'settings_v1';

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

export const loadProjects = (): Record<string, Project> =>
  parseJson<Record<string, Project>>(projectsMMKV.getString(PROJECTS_KEY), {});

export const saveProjects = (projects: Record<string, Project>): void => {
  projectsMMKV.set(PROJECTS_KEY, JSON.stringify(projects));
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

export const loadSettings = (): StoredSettings => ({
  ...DEFAULT_SETTINGS,
  ...parseJson<Partial<StoredSettings>>(settingsMMKV.getString(SETTINGS_KEY), {}),
});

export const saveSettings = (settings: StoredSettings): void => {
  settingsMMKV.set(SETTINGS_KEY, JSON.stringify(settings));
};

export const estimatePersistedProjectsBytes = (): number => {
  const raw = projectsMMKV.getString(PROJECTS_KEY) ?? '';
  return raw.length;
};
