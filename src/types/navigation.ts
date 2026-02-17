import type { Project } from './domain';

export type RootStackParamList = {
  Splash: undefined;
  Home: undefined;
  Import: { fromProjectId?: string } | undefined;
  Editor: { projectId: string; fromImport?: boolean };
  Export: { projectId: string };
  Settings: undefined;
};

export interface SharedThumbnailTransition {
  project: Project;
  originX: number;
  originY: number;
  width: number;
  height: number;
}
