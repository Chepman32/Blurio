export enum BlurioErrorCode {
  UNSUPPORTED_CODEC = 'UNSUPPORTED_CODEC',
  CORRUPTED_VIDEO = 'CORRUPTED_VIDEO',
  LOW_STORAGE = 'LOW_STORAGE',
  ASSET_UNAVAILABLE = 'ASSET_UNAVAILABLE',
  EXPORT_FAILED = 'EXPORT_FAILED',
}

export class BlurioError extends Error {
  code: BlurioErrorCode;

  constructor(code: BlurioErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = 'BlurioError';
  }
}
