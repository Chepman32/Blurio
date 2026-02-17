export const ACCENT_COLORS = [
  '#4EA8DE',
  '#50C878',
  '#F4A259',
  '#F25F5C',
  '#56CFE1',
  '#A78BFA',
] as const;

export type AccentColor = (typeof ACCENT_COLORS)[number];

export interface ThemeColors {
  backgroundTop: string;
  backgroundBottom: string;
  card: string;
  cardBorder: string;
  sheet: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  trackStroke: string;
  safeArea: string;
  destructive: string;
  success: string;
  warning: string;
  shimmerBase: string;
  shimmerHighlight: string;
  noise: string;
  accent: string;
}

export const IOS_DESTRUCTIVE = '#FF3B30';

export const DARK_THEME: ThemeColors = {
  backgroundTop: '#040508',
  backgroundBottom: '#111219',
  card: 'rgba(24, 27, 36, 0.78)',
  cardBorder: 'rgba(255, 255, 255, 0.09)',
  sheet: 'rgba(16, 18, 25, 0.92)',
  textPrimary: '#F4F6FB',
  textSecondary: '#C2C8D6',
  textMuted: '#9FA7BA',
  trackStroke: 'rgba(255, 255, 255, 0.72)',
  safeArea: 'rgba(255, 255, 255, 0.2)',
  destructive: IOS_DESTRUCTIVE,
  success: '#34C759',
  warning: '#FF9F0A',
  shimmerBase: 'rgba(255, 255, 255, 0.08)',
  shimmerHighlight: 'rgba(255, 255, 255, 0.16)',
  noise: 'rgba(255, 255, 255, 0.07)',
  accent: ACCENT_COLORS[0],
};

export const LIGHT_THEME: ThemeColors = {
  backgroundTop: '#EEF2FF',
  backgroundBottom: '#DDE5F5',
  card: 'rgba(255, 255, 255, 0.75)',
  cardBorder: 'rgba(30, 41, 59, 0.09)',
  sheet: 'rgba(255, 255, 255, 0.94)',
  textPrimary: '#101321',
  textSecondary: '#3C445A',
  textMuted: '#616B82',
  trackStroke: 'rgba(15, 23, 42, 0.75)',
  safeArea: 'rgba(15, 23, 42, 0.2)',
  destructive: IOS_DESTRUCTIVE,
  success: '#248A3D',
  warning: '#B36B00',
  shimmerBase: 'rgba(15, 23, 42, 0.06)',
  shimmerHighlight: 'rgba(15, 23, 42, 0.13)',
  noise: 'rgba(2, 6, 23, 0.05)',
  accent: ACCENT_COLORS[0],
};
