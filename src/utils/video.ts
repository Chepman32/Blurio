import RNFS from 'react-native-fs';
import type { Asset } from 'react-native-image-picker';
import { createThumbnail } from 'react-native-create-thumbnail';
import {
  MIN_FREE_SPACE_FOR_EXPORT_BYTES,
  FOUR_K_HEIGHT,
  FOUR_K_WIDTH,
} from '../constants';
import type { VideoMeta } from '../types';
import { createId } from './id';
import { isCodecUnsupported } from './project';

const DEFAULT_DURATION_MS = 12_000;
const DEFAULT_FPS = 30;
const DEFAULT_CODEC = 'h264';
const DEFAULT_THUMBNAIL_COUNT = 12;
const BLURIO_MEDIA_DIRECTORY = `${RNFS.DocumentDirectoryPath}/blurio/media`;
const BLURIO_THUMBNAILS_DIRECTORY = `${RNFS.DocumentDirectoryPath}/blurio/thumbnails`;

const sanitizePathSegment = (value: string, fallback: string): string => {
  const normalized = value.trim().replace(/[^a-zA-Z0-9_-]+/g, '_');
  return normalized.length > 0 ? normalized : fallback;
};

const stripFileUri = (value: string): string =>
  value.startsWith('file://') ? value.replace(/^file:\/\//, '') : value;

const toLocalPath = (value: string): string => {
  const raw = stripFileUri(value);
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
};

const isLocalFileUri = (value: string): boolean =>
  value.startsWith('file://') || value.startsWith('/');

const extensionFromValue = (value: string): string => {
  const base = value.split('?')[0] ?? value;
  const matched = base.match(/\.([a-zA-Z0-9]{1,6})$/);
  return matched ? `.${matched[1]}` : '';
};

const ensureDirectory = async (path: string): Promise<void> => {
  try {
    await RNFS.mkdir(path);
  } catch {
    // ignore
  }
};

const fileExists = async (value: string): Promise<boolean> => {
  try {
    return await RNFS.exists(toLocalPath(value));
  } catch {
    return false;
  }
};

const estimateBitrate = (asset: Asset): number => {
  const size = asset.fileSize ?? 0;
  const durationMs = Math.max(asset.duration ?? DEFAULT_DURATION_MS / 1000, 1) * 1000;
  return Math.round((size * 8 * 1000) / durationMs);
};

const toFileUri = (path: string): string => {
  if (path.startsWith('file://')) {
    return path;
  }

  if (path.startsWith('/')) {
    return `file://${path}`;
  }

  return path;
};

const normalizeThumbnailPath = (path: string): string =>
  path.startsWith('file://') ? path : `file://${path}`;

const persistGeneratedThumbnail = async (
  sourcePath: string,
  persistKey: string,
  index: number,
): Promise<string | null> => {
  const directory = `${BLURIO_THUMBNAILS_DIRECTORY}/${sanitizePathSegment(
    persistKey,
    'default',
  )}`;
  await ensureDirectory(BLURIO_THUMBNAILS_DIRECTORY);
  await ensureDirectory(directory);

  const extension = extensionFromValue(sourcePath) || '.jpg';
  const targetPath = `${directory}/thumb_${index}${extension}`;
  const sourceLocalPath = toLocalPath(sourcePath);

  try {
    if (sourceLocalPath !== targetPath) {
      await RNFS.copyFile(sourceLocalPath, targetPath);
    }
    return normalizeThumbnailPath(targetPath);
  } catch {
    return null;
  }
};

export const isICloudOnlyAsset = (asset: Asset): boolean => {
  const uri = asset.uri ?? '';
  return uri.startsWith('ph://') && !asset.originalPath;
};

export const createVideoMetaFromAsset = (asset: Asset): VideoMeta | null => {
  if (!asset.uri) {
    return null;
  }

  const durationMs = Math.max(Math.round((asset.duration ?? DEFAULT_DURATION_MS / 1000) * 1000), 1);
  const width = asset.width ?? 1920;
  const height = asset.height ?? 1080;
  const codec = DEFAULT_CODEC;
  const hasHdr = false;

  return {
    id: createId('video'),
    assetUri: asset.uri,
    localUri: asset.originalPath ? toFileUri(asset.originalPath) : asset.uri,
    displayName: asset.fileName ?? `Video ${new Date().toLocaleTimeString()}`,
    durationMs,
    width,
    height,
    fps: DEFAULT_FPS,
    codec,
    bitRate: estimateBitrate(asset),
    audioChannels: 2,
    fileSizeBytes: asset.fileSize ?? 0,
    hasHdr,
    colorSpace: hasHdr ? 'hdr10' : 'sdr',
    isICloudAsset: isICloudOnlyAsset(asset),
    unavailable: false,
    corrupted: false,
    unsupportedCodec: isCodecUnsupported(codec),
    thumbnailUris: [],
  };
};

export const persistVideoSource = async (video: VideoMeta): Promise<VideoMeta> => {
  const currentLocal = video.localUri;
  const currentLocalPath = toLocalPath(currentLocal);
  if (
    currentLocalPath.startsWith(`${BLURIO_MEDIA_DIRECTORY}/`) &&
    (await fileExists(currentLocal))
  ) {
    return {
      ...video,
      unavailable: false,
    };
  }

  await ensureDirectory(BLURIO_MEDIA_DIRECTORY);

  const candidates = [video.localUri, video.assetUri].filter(Boolean);
  for (const candidate of candidates) {
    if (!isLocalFileUri(candidate)) {
      continue;
    }

    if (!(await fileExists(candidate))) {
      continue;
    }

    const localCandidatePath = toLocalPath(candidate);
    const ext =
      extensionFromValue(video.displayName) ||
      extensionFromValue(localCandidatePath) ||
      '.mp4';
    const targetPath = `${BLURIO_MEDIA_DIRECTORY}/${sanitizePathSegment(video.id, 'video')}${ext}`;

    try {
      if (localCandidatePath !== targetPath && !(await RNFS.exists(targetPath))) {
        await RNFS.copyFile(localCandidatePath, targetPath);
      }

      return {
        ...video,
        localUri: toFileUri(targetPath),
        unavailable: false,
      };
    } catch {
      // try next candidate
    }
  }

  return video;
};

export const generateVideoThumbnails = async (
  sourceUri: string,
  durationMs: number,
  count = 12,
  persistKey?: string,
): Promise<string[]> => {
  const thumbnails: string[] = [];
  const boundedCount = Math.max(1, Math.min(count, 20));
  const safeDurationMs = Math.max(durationMs, 1);
  const stepMs = safeDurationMs / boundedCount;
  const normalizedPersistKey =
    persistKey && persistKey.trim().length > 0
      ? persistKey
      : `thumbset_${Date.now()}`;

  for (let index = 0; index < boundedCount; index += 1) {
    try {
      const frameTimeMs = Math.round(stepMs * (index + 0.5));
      const thumbnailSourceUrl = isLocalFileUri(sourceUri)
        ? toLocalPath(sourceUri)
        : sourceUri;

      const result = await createThumbnail({
        url: thumbnailSourceUrl,
        timeStamp: frameTimeMs,
        cacheName: `blurio_thumb_${Date.now()}_${index}`,
      });

      const persisted = await persistGeneratedThumbnail(result.path, normalizedPersistKey, index);
      thumbnails.push(persisted ?? normalizeThumbnailPath(result.path));
    } catch {
      // ignore failed frame extraction and continue with remaining frames
    }
  }

  return thumbnails;
};

export const restoreVideoMetaFiles = async (
  video: VideoMeta,
): Promise<VideoMeta> => {
  const withPersistentSource = await persistVideoSource(video);
  const available = await checkAssetAvailability(withPersistentSource.localUri);
  if (!available) {
    // Local video copy is missing (e.g. after pod reinstall / clean install).
    // Try to restore thumbnails from assetUri (e.g. a persistent ph:// photo-library
    // reference) so the project card stays functional while the source is unlinked.
    const assetUri = video.assetUri ?? '';
    if (assetUri) {
      const assetAvailable = await checkAssetAvailability(assetUri);
      if (assetAvailable) {
        const firstThumbnail = withPersistentSource.thumbnailUris[0] ?? '';
        const hasThumbnail = firstThumbnail
          ? await checkAssetAvailability(firstThumbnail)
          : false;
        if (!hasThumbnail) {
          const regenerated = await generateVideoThumbnails(
            assetUri,
            withPersistentSource.durationMs,
            Math.max(withPersistentSource.thumbnailUris.length, DEFAULT_THUMBNAIL_COUNT),
            withPersistentSource.id,
          );
          return {
            ...withPersistentSource,
            unavailable: true,
            thumbnailUris:
              regenerated.length > 0 ? regenerated : withPersistentSource.thumbnailUris,
          };
        }
      }
    }
    return {
      ...withPersistentSource,
      unavailable: true,
    };
  }

  const firstThumbnail = withPersistentSource.thumbnailUris[0] ?? '';
  const hasThumbnail = firstThumbnail ? await checkAssetAvailability(firstThumbnail) : false;
  if (hasThumbnail) {
    return {
      ...withPersistentSource,
      unavailable: false,
    };
  }

  const regenerated = await generateVideoThumbnails(
    withPersistentSource.localUri,
    withPersistentSource.durationMs,
    Math.max(withPersistentSource.thumbnailUris.length, DEFAULT_THUMBNAIL_COUNT),
    withPersistentSource.id,
  );

  return {
    ...withPersistentSource,
    unavailable: false,
    thumbnailUris: regenerated.length > 0 ? regenerated : withPersistentSource.thumbnailUris,
  };
};

export const isLargeVideo = (video: VideoMeta): boolean =>
  video.width >= FOUR_K_WIDTH || video.height >= FOUR_K_HEIGHT;

export const checkLowStorageForExport = async (
  requestedBytes = MIN_FREE_SPACE_FOR_EXPORT_BYTES,
): Promise<boolean> => {
  try {
    const info = await RNFS.getFSInfo();
    return info.freeSpace < requestedBytes;
  } catch {
    return false;
  }
};

export const buildExportPath = (projectId: string): string =>
  `${RNFS.TemporaryDirectoryPath ?? RNFS.CachesDirectoryPath}/blurio_export_${projectId}_${Date.now()}.mp4`;

export const cleanupTempExport = async (path: string): Promise<void> => {
  try {
    const exists = await RNFS.exists(path);
    if (exists) {
      await RNFS.unlink(path);
    }
  } catch {
    // no-op
  }
};

export const checkAssetAvailability = async (uri: string): Promise<boolean> => {
  if (!uri) {
    return false;
  }

  if (!isLocalFileUri(uri)) {
    return true;
  }

  const filePath = toLocalPath(uri);
  try {
    return await RNFS.exists(filePath);
  } catch {
    return false;
  }
};
