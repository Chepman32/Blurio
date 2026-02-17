import { NativeModules } from 'react-native';
import type {
  BlurioExportModuleInterface,
  ExportErrorEvent,
  ExportProgressEvent,
  ExportRequest,
  ExportSuccessEvent,
} from '../types';
import { ExportStage } from '../types';
import { STRINGS } from '../constants';
import { cleanupTempExport } from '../utils/video';

type Listener<T> = (payload: T) => void;

const progressListeners = new Set<Listener<ExportProgressEvent>>();
const successListeners = new Set<Listener<ExportSuccessEvent>>();
const errorListeners = new Set<Listener<ExportErrorEvent>>();

const emitProgress = (event: ExportProgressEvent): void => {
  progressListeners.forEach(listener => listener(event));
};

const emitSuccess = (event: ExportSuccessEvent): void => {
  successListeners.forEach(listener => listener(event));
};

const emitError = (event: ExportErrorEvent): void => {
  errorListeners.forEach(listener => listener(event));
};

const NativeExportModule =
  NativeModules.BlurioExportModule as BlurioExportModuleInterface | undefined;

let cancelRequested = false;
let activeTimeouts: ReturnType<typeof setTimeout>[] = [];

const clearTimers = (): void => {
  activeTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
  activeTimeouts = [];
};

const schedule = (delay: number, callback: () => void): void => {
  const timeoutId = setTimeout(callback, delay);
  activeTimeouts.push(timeoutId);
};

const runStubExport = async (request: ExportRequest): Promise<void> => {
  cancelRequested = false;
  clearTimers();

  const stagePlan: Array<{ stage: ExportStage; start: number; end: number; label: string; ms: number }> = [
    {
      stage: ExportStage.DECODING,
      start: 0,
      end: 0.24,
      label: STRINGS.export.stageDecoding,
      ms: 450,
    },
    {
      stage: ExportStage.APPLYING_BLUR,
      start: 0.24,
      end: 0.72,
      label: STRINGS.export.stageApplying,
      ms: 850,
    },
    {
      stage: ExportStage.ENCODING,
      start: 0.72,
      end: 0.94,
      label: STRINGS.export.stageEncoding,
      ms: 620,
    },
    {
      stage: ExportStage.SAVING,
      start: 0.94,
      end: 1,
      label: STRINGS.export.stageSaving,
      ms: 350,
    },
  ];

  await new Promise<void>((resolve, reject) => {
    let offset = 0;

    stagePlan.forEach(entry => {
      const ticks = 5;
      const tickInterval = Math.floor(entry.ms / ticks);

      for (let tick = 1; tick <= ticks; tick += 1) {
        schedule(offset + tick * tickInterval, () => {
          if (cancelRequested) {
            reject(new Error('EXPORT_CANCELLED'));
            return;
          }

          const progress = entry.start + (entry.end - entry.start) * (tick / ticks);
          emitProgress({
            stage: entry.stage,
            progress,
            message: entry.label,
          });

          if (entry.stage === ExportStage.SAVING && tick === ticks) {
            resolve();
          }
        });
      }

      offset += entry.ms + 30;
    });
  });

  if (cancelRequested) {
    throw new Error('EXPORT_CANCELLED');
  }

  emitSuccess({ outputUri: request.destinationUri });
};

export const startExport = async (request: ExportRequest): Promise<void> => {
  try {
    if (NativeExportModule?.startExport) {
      await NativeExportModule.startExport(request);
      return;
    }

    await runStubExport(request);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : STRINGS.export.failedLabel;
    emitError({
      code: message === 'EXPORT_CANCELLED' ? 'CANCELLED' : 'FAILED',
      message,
    });
    throw error;
  }
};

export const cancelExport = async (): Promise<void> => {
  cancelRequested = true;
  clearTimers();

  if (NativeExportModule?.cancelExport) {
    await NativeExportModule.cancelExport();
  }
};

export const subscribeExportProgress = (
  listener: Listener<ExportProgressEvent>,
): (() => void) => {
  progressListeners.add(listener);
  return () => {
    progressListeners.delete(listener);
  };
};

export const subscribeExportSuccess = (
  listener: Listener<ExportSuccessEvent>,
): (() => void) => {
  successListeners.add(listener);
  return () => {
    successListeners.delete(listener);
  };
};

export const subscribeExportError = (
  listener: Listener<ExportErrorEvent>,
): (() => void) => {
  errorListeners.add(listener);
  return () => {
    errorListeners.delete(listener);
  };
};

export const cleanupCancelledExport = async (path: string): Promise<void> => {
  await cleanupTempExport(path);
};
