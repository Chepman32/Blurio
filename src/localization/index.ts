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

const RTL_LANGUAGES = new Set(['ar', 'he']);

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

export const APP_LOCALE = resolvePreferredLocale();
export const APP_LANGUAGE = APP_LOCALE.split('-')[0] ?? 'en';
export const IS_RTL_LOCALE = RTL_LANGUAGES.has(APP_LANGUAGE);

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
