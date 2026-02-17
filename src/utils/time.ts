export const formatMsToClock = (timeMs: number): string => {
  const totalSeconds = Math.max(Math.floor(timeMs / 1000), 0);
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
};

export const clampToDuration = (value: number, durationMs: number): number =>
  Math.max(0, Math.min(durationMs, value));
