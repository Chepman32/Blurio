export const clamp = (value: number, min: number, max: number): number => {
  'worklet';
  return Math.min(Math.max(value, min), max);
};

export const lerp = (from: number, to: number, t: number): number => {
  'worklet';
  return from + (to - from) * t;
};

export const easeInOut = (t: number): number => {
  'worklet';
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};

export const springEase = (t: number): number => {
  'worklet';
  const clamped = clamp(t, 0, 1);
  return 1 - Math.exp(-7 * clamped) * Math.cos(12 * clamped);
};

export const formatPercent = (value: number): string => `${Math.round(value * 100)}%`;
