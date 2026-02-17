import RNFS from 'react-native-fs';
import type { Asset } from 'react-native-image-picker';
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

const estimateBitrate = (asset: Asset): number => {
  const size = asset.fileSize ?? 0;
  const durationMs = Math.max(asset.duration ?? DEFAULT_DURATION_MS / 1000, 1) * 1000;
  return Math.round((size * 8 * 1000) / durationMs);
};

const generateThumbnailUris = (uri: string, count = 14): string[] =>
  Array.from({ length: count }, (_, index) => `${uri}#frame=${index}`);

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
    localUri: asset.originalPath ? `file://${asset.originalPath}` : asset.uri,
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
    thumbnailUris: generateThumbnailUris(asset.uri),
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
  if (!uri.startsWith('file://')) {
    return true;
  }

  const filePath = uri.replace('file://', '');
  try {
    return await RNFS.exists(filePath);
  } catch {
    return false;
  }
};
