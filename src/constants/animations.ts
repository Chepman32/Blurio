export const SPRINGS = {
  snappy: {
    damping: 16,
    stiffness: 190,
    mass: 0.8,
  },
  gentle: {
    damping: 18,
    stiffness: 120,
    mass: 1,
  },
  bouncy: {
    damping: 10,
    stiffness: 220,
    mass: 0.9,
  },
} as const;

export const DURATIONS = {
  short: 140,
  medium: 240,
  long: 420,
  splash: 1200,
} as const;
