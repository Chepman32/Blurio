import { useSyncExternalStore } from 'react';
import { getLocales } from 'react-native-localize';

export const SUPPORTED_LOCALES = [
  'en',
  'zh-Hans',
  'ja',
  'ko',
  'de',
  'fr',
  'es',
  'pt-BR',
  'ar',
  'ru',
  'it',
  'nl',
  'tr',
  'th',
  'vi',
  'id',
  'pl',
  'uk',
  'hi',
  'he',
  'sv',
  'no',
  'da',
  'fi',
  'cs',
  'hu',
  'ro',
  'el',
  'ms',
] as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];
export type LocaleSelection = SupportedLocale | 'system';

const RTL_LANGUAGES = new Set(['ar', 'he']);
type LocaleListener = () => void;
const localeListeners = new Set<LocaleListener>();
let localeOverride: SupportedLocale | null = null;

const normalizeLocale = (locale: string | null | undefined): string =>
  (locale ?? '').trim().replace(/_/g, '-');

export const matchSupportedLocale = (rawLocale: string): SupportedLocale => {
  const locale = normalizeLocale(rawLocale).toLowerCase();

  if (!locale) {
    return 'en';
  }

  if (locale.startsWith('zh-hans') || locale.startsWith('zh-cn') || locale.startsWith('zh-sg')) {
    return 'zh-Hans';
  }

  if (locale.startsWith('pt-br')) {
    return 'pt-BR';
  }

  if (locale.startsWith('nb') || locale.startsWith('nn') || locale.startsWith('no')) {
    return 'no';
  }

  if (locale.startsWith('iw') || locale.startsWith('he')) {
    return 'he';
  }

  const language = locale.split('-')[0];

  if (SUPPORTED_LOCALES.includes(language as SupportedLocale)) {
    return language as SupportedLocale;
  }

  return 'en';
};

const resolvePreferredLocale = (): SupportedLocale => {
  const locales = getLocales();

  for (const locale of locales) {
    const matched = matchSupportedLocale(locale.languageTag);
    if (matched !== 'en' || locale.languageCode?.toLowerCase() === 'en') {
      return matched;
    }
  }

  return 'en';
};

export const DEVICE_LOCALE = resolvePreferredLocale();

const emitLocaleChange = (): void => {
  localeListeners.forEach(listener => listener());
};

export const subscribeToLocale = (listener: LocaleListener): (() => void) => {
  localeListeners.add(listener);
  return () => localeListeners.delete(listener);
};

export const getLocaleOverride = (): SupportedLocale | null => localeOverride;

export const getActiveLocale = (): SupportedLocale => localeOverride ?? DEVICE_LOCALE;

export const setLocaleOverride = (locale: SupportedLocale | null): void => {
  if (localeOverride === locale) {
    return;
  }

  localeOverride = locale;
  emitLocaleChange();
};

export const sanitizeLocaleOverride = (
  locale: string | null | undefined,
): SupportedLocale | null => {
  const normalized = normalizeLocale(locale);
  if (!normalized) {
    return null;
  }

  const matched = matchSupportedLocale(normalized);
  return SUPPORTED_LOCALES.includes(matched) ? matched : null;
};

export const useActiveLocale = (): SupportedLocale =>
  useSyncExternalStore(subscribeToLocale, getActiveLocale, getActiveLocale);

export const APP_LOCALE = DEVICE_LOCALE;
export const APP_LANGUAGE = getActiveLocale().split('-')[0] ?? 'en';
export const IS_RTL_LOCALE = RTL_LANGUAGES.has(getActiveLocale().split('-')[0] ?? 'en');

export const formatList = (items: string[]): string => {
  if (items.length === 0) {
    return '';
  }

  if (items.length === 1) {
    return items[0] ?? '';
  }

  if (items.length === 2) {
    return `${items[0]} / ${items[1]}`;
  }

  return `${items.slice(0, -1).join(', ')}, ${items[items.length - 1]}`;
};
