import React, { useMemo, useState } from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Check, ChevronRight, Circle } from 'lucide-react-native';
import Animated, {
  FadeInDown,
  FadeOutUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ACCENT_COLORS,
  RADIUS,
  SPACING,
  useStrings,
} from '../constants';
import {
  AppText,
  BlurButton,
  GlassCard,
  GradientBackground,
  SegmentedControl,
  SwitchRow,
} from '../components/common';
import { useAppTheme } from '../theme';
import { useEditorStore, useProjectList } from '../store';
import { estimateProjectCacheSizeBytes } from '../utils';
import {
  DEVICE_LOCALE,
  SUPPORTED_LOCALES,
  type LocaleSelection,
  type SupportedLocale,
} from '../localization';

const formatBytes = (bytes: number): string => {
  if (bytes <= 0) {
    return '0 B';
  }

  const units = ['B', 'KB', 'MB', 'GB'];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** exponent;
  return `${value.toFixed(exponent === 0 ? 0 : 1)} ${units[exponent]}`;
};

const LANGUAGE_LABELS: Record<SupportedLocale, string> = {
  en: 'English',
  'zh-Hans': '简体中文',
  ja: '日本語',
  ko: '한국어',
  de: 'Deutsch',
  fr: 'Français',
  es: 'Español',
  'pt-BR': 'Português (Brasil)',
  ar: 'العربية',
  ru: 'Русский',
  it: 'Italiano',
  nl: 'Nederlands',
  tr: 'Türkçe',
  th: 'ไทย',
  vi: 'Tiếng Việt',
  id: 'Bahasa Indonesia',
  pl: 'Polski',
  uk: 'Українська',
  hi: 'हिन्दी',
  he: 'עברית',
  sv: 'Svenska',
  no: 'Norsk',
  da: 'Dansk',
  fi: 'Suomi',
  cs: 'Čeština',
  hu: 'Magyar',
  ro: 'Română',
  el: 'Ελληνικά',
  ms: 'Bahasa Melayu',
};

const FLAG_IMAGES: Record<SupportedLocale, ReturnType<typeof require>> = {
  en: require('../assets/icons/flags/en.png'),
  'zh-Hans': require('../assets/icons/flags/zh.png'),
  ja: require('../assets/icons/flags/ja.png'),
  ko: require('../assets/icons/flags/ko.png'),
  de: require('../assets/icons/flags/de.png'),
  fr: require('../assets/icons/flags/fr.png'),
  es: require('../assets/icons/flags/es.png'),
  'pt-BR': require('../assets/icons/flags/pt-BR.png'),
  ar: require('../assets/icons/flags/ar.png'),
  ru: require('../assets/icons/flags/ru.png'),
  it: require('../assets/icons/flags/it.png'),
  nl: require('../assets/icons/flags/nl.png'),
  tr: require('../assets/icons/flags/tr.png'),
  th: require('../assets/icons/flags/th.png'),
  vi: require('../assets/icons/flags/vi.png'),
  id: require('../assets/icons/flags/id.png'),
  pl: require('../assets/icons/flags/pl.png'),
  uk: require('../assets/icons/flags/uk.png'),
  hi: require('../assets/icons/flags/hi.png'),
  he: require('../assets/icons/flags/he.png'),
  sv: require('../assets/icons/flags/sv.png'),
  no: require('../assets/icons/flags/no.png'),
  da: require('../assets/icons/flags/da.png'),
  fi: require('../assets/icons/flags/fi.png'),
  cs: require('../assets/icons/flags/cs.png'),
  hu: require('../assets/icons/flags/hu.png'),
  ro: require('../assets/icons/flags/ro.png'),
  el: require('../assets/icons/flags/el.png'),
  ms: require('../assets/icons/flags/ms.png'),
};

export const SettingsScreen: React.FC = () => {
  const STRINGS = useStrings();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();

  const settings = useEditorStore(state => state.settings);
  const setLocalePreference = useEditorStore(state => state.setLocaleOverride);
  const setAppearance = useEditorStore(state => state.setAppearance);
  const setReduceMotionOverride = useEditorStore(
    state => state.setReduceMotionOverride,
  );
  const setAccentColor = useEditorStore(state => state.setAccentColor);
  const setPreviewQuality = useEditorStore(state => state.setPreviewQuality);
  const setAutoGenerateThumbs = useEditorStore(state => state.setAutoGenerateThumbs);
  const setSafeAreaOverlayDefault = useEditorStore(
    state => state.setSafeAreaOverlayDefault,
  );
  const cleanTrash = useEditorStore(state => state.cleanTrash);

  const projects = useProjectList();
  const trashCount = useMemo(
    () => projects.filter(project => project.trashedAt !== null).length,
    [projects],
  );

  const estimatedStorage = useMemo(
    () => projects.reduce((sum, project) => sum + estimateProjectCacheSizeBytes(project), 0),
    [projects],
  );

  const [languageExpanded, setLanguageExpanded] = useState(false);
  const chevronRotation = useSharedValue(0);
  const selectedLanguage = (settings.localeOverride ?? 'system') as LocaleSelection;

  const sortedLocales = useMemo(
    () => [...SUPPORTED_LOCALES].sort((a, b) =>
      LANGUAGE_LABELS[a].localeCompare(LANGUAGE_LABELS[b]),
    ),
    [],
  );

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${chevronRotation.value}deg` }],
  }));

  const toggleLanguageAccordion = () => {
    const next = !languageExpanded;
    chevronRotation.value = withSpring(next ? 90 : 0, {
      damping: 14,
      stiffness: 200,
      mass: 0.8,
    });
    setLanguageExpanded(next);
  };

  const selectLanguage = (value: LocaleSelection) => {
    setLocalePreference(value === 'system' ? null : value);
    chevronRotation.value = withSpring(0, {
      damping: 14,
      stiffness: 200,
      mass: 0.8,
    });
    setLanguageExpanded(false);
  };

  return (
    <GradientBackground>
      <View
        style={[
          styles.container,
          {
            paddingTop: insets.top + SPACING.sm,
          },
        ]}>
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          <GlassCard style={styles.sectionCard}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={toggleLanguageAccordion}
              style={styles.accordionHeader}>
              <View style={styles.accordionHeaderLeft}>
                <AppText variant="section" style={styles.sectionTitle}>
                  {STRINGS.settings.language}
                </AppText>
              </View>
              <View style={styles.accordionHeaderRight}>
                {selectedLanguage !== 'system' && (
                  <Image
                    source={FLAG_IMAGES[selectedLanguage]}
                    style={styles.flagImageSmall}
                  />
                )}
                <AppText variant="body" color={colors.textSecondary}>
                  {selectedLanguage === 'system'
                    ? STRINGS.settings.languageSystem
                    : LANGUAGE_LABELS[selectedLanguage]}
                </AppText>
                <Animated.View style={chevronStyle}>
                  <ChevronRight size={16} color={colors.textSecondary} />
                </Animated.View>
              </View>
            </TouchableOpacity>
            {languageExpanded && (
              <View style={[styles.languageList, { borderColor: colors.cardBorder }]}>
                <Animated.View
                  entering={FadeInDown.springify().damping(18).stiffness(200).mass(0.8)}
                  exiting={FadeOutUp.duration(150)}>
                  <TouchableOpacity
                    style={[
                      styles.languageRow,
                      selectedLanguage === 'system' && {
                        backgroundColor: `${colors.accent}22`,
                      },
                    ]}
                    onPress={() => selectLanguage('system')}>
                    <Image
                      source={FLAG_IMAGES[DEVICE_LOCALE]}
                      style={styles.flagImage}
                    />
                    <AppText
                      variant="body"
                      color={selectedLanguage === 'system' ? colors.accent : colors.textPrimary}
                      style={styles.languageLabel}>
                      {STRINGS.settings.languageSystem}
                    </AppText>
                    {selectedLanguage === 'system' && (
                      <Check size={18} color={colors.accent} />
                    )}
                  </TouchableOpacity>
                </Animated.View>
                {sortedLocales.map((locale, index) => (
                  <Animated.View
                    key={locale}
                    entering={FadeInDown.delay(index * 20).springify().damping(18).stiffness(200).mass(0.8)}
                    exiting={FadeOutUp.duration(100)}>
                    <TouchableOpacity
                      style={[
                        styles.languageRow,
                        selectedLanguage === locale && {
                          backgroundColor: `${colors.accent}22`,
                        },
                      ]}
                      onPress={() => selectLanguage(locale)}>
                      <Image
                        source={FLAG_IMAGES[locale]}
                        style={styles.flagImage}
                      />
                      <AppText
                        variant="body"
                        color={selectedLanguage === locale ? colors.accent : colors.textPrimary}
                        style={styles.languageLabel}>
                        {LANGUAGE_LABELS[locale]}
                      </AppText>
                      {selectedLanguage === locale && (
                        <Check size={18} color={colors.accent} />
                      )}
                    </TouchableOpacity>
                  </Animated.View>
                ))}
              </View>
            )}
          </GlassCard>

          <GlassCard style={styles.sectionCard}>
            <AppText variant="section" style={styles.sectionTitle}>
              {STRINGS.settings.appearance}
            </AppText>
            <SegmentedControl
              value={settings.appearance}
              options={[
                { label: STRINGS.settings.appearanceSystem, value: 'system' },
                { label: STRINGS.settings.appearanceDark, value: 'dark' },
                { label: STRINGS.settings.appearanceLight, value: 'light' },
              ]}
              onChange={setAppearance}
              accessibilityLabel={STRINGS.settings.appearance}
              size="large"
            />
            <AppText variant="bodyStrong" color={colors.textSecondary}>
              {STRINGS.settings.accentColor}
            </AppText>
            <View style={styles.colorRow}>
              {ACCENT_COLORS.map(color => {
                const active = color === settings.accentColor;
                return (
                  <TouchableOpacity
                    key={color}
                    accessibilityLabel={STRINGS.settings.accentColorOption(color)}
                    onPress={() => setAccentColor(color)}
                    style={[
                      styles.colorSwatch,
                      {
                        backgroundColor: color,
                        borderColor: active ? colors.textPrimary : 'transparent',
                      },
                    ]}>
                    {active ? <Circle size={16} color="#fff" fill="#fff" /> : null}
                  </TouchableOpacity>
                );
              })}
            </View>
          </GlassCard>

          <GlassCard style={styles.sectionCard}>
            <AppText variant="section" style={styles.sectionTitle}>
              {STRINGS.settings.motion}
            </AppText>
            <SegmentedControl
              value={settings.reduceMotionOverride}
              options={[
                { label: STRINGS.settings.reduceMotionSystem, value: 'system' },
                { label: STRINGS.settings.reduceMotionOn, value: 'on' },
                { label: STRINGS.settings.reduceMotionOff, value: 'off' },
              ]}
              onChange={setReduceMotionOverride}
              accessibilityLabel={STRINGS.settings.motion}
              size="large"
            />
          </GlassCard>

          <GlassCard style={styles.sectionCard}>
            <AppText variant="section" style={styles.sectionTitle}>
              {STRINGS.settings.preview}
            </AppText>
            <SegmentedControl
              value={settings.previewQuality}
              options={[
                { label: STRINGS.view.ultra, value: 'ultra' },
                { label: STRINGS.view.balanced, value: 'balanced' },
                { label: STRINGS.view.smooth, value: 'smooth' },
              ]}
              onChange={setPreviewQuality}
              accessibilityLabel={STRINGS.settings.previewQualityDefault}
              size="large"
            />
            <SwitchRow
              title={STRINGS.settings.autoThumbs}
              value={settings.autoGenerateThumbs}
              onValueChange={setAutoGenerateThumbs}
              accessibilityLabel={STRINGS.settings.autoThumbs}
            />
            <SwitchRow
              title={STRINGS.settings.safeAreaDefault}
              value={settings.safeAreaOverlayDefault}
              onValueChange={setSafeAreaOverlayDefault}
              accessibilityLabel={STRINGS.settings.safeAreaDefault}
            />
          </GlassCard>

          <GlassCard style={styles.sectionCard}>
            <AppText variant="section" style={styles.sectionTitle}>
              {STRINGS.settings.storage}
            </AppText>
            <AppText variant="body" color={colors.textSecondary}>
              {STRINGS.settings.storageUsage}
            </AppText>
            <AppText variant="bodyStrong">{formatBytes(estimatedStorage)}</AppText>
            <AppText variant="micro" color={colors.textMuted}>
              {STRINGS.settings.projectsCached}: {projects.length}
            </AppText>
            <AppText variant="micro" color={colors.textMuted}>
              {STRINGS.home.trashFolder}: {trashCount}
            </AppText>
            <BlurButton
              label={STRINGS.settings.cleanTrash}
              disabled={trashCount === 0}
              onPress={() =>
                Alert.alert(
                  STRINGS.settings.cleanTrashTitle,
                  STRINGS.settings.cleanTrashBody,
                  [
                    { text: STRINGS.common.cancel, style: 'cancel' },
                    {
                      text: STRINGS.settings.cleanTrash,
                      style: 'destructive',
                      onPress: () => cleanTrash(),
                    },
                  ],
                )
              }
              accessibilityLabel={STRINGS.settings.cleanTrash}
              variant="secondary"
              style={styles.cleanTrashButton}
            />
          </GlassCard>

          <GlassCard style={styles.sectionCard}>
            <AppText variant="section" style={styles.sectionTitle}>
              {STRINGS.settings.about}
            </AppText>
            <AppText variant="micro" color={colors.textSecondary}>
              {STRINGS.settings.version}: 1.0.0
            </AppText>
            <AppText variant="micro" color={colors.textSecondary}>
              {STRINGS.settings.offlineOnly}
            </AppText>
          </GlassCard>
        </ScrollView>
      </View>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
  },
  scrollArea: {
    flex: 1,
    marginTop: SPACING.sm,
    paddingTop: SPACING.md,
  },
  scrollContent: {
    gap: SPACING.sm,
    paddingBottom: SPACING.md,
  },
  sectionCard: {
    gap: SPACING.md,
  },
  sectionTitle: {
    fontSize: 18,
    lineHeight: 24,
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  colorSwatch: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cleanTrashButton: {
    marginTop: SPACING.xs,
  },
  accordionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  accordionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  accordionHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  languageList: {
    borderTopWidth: 1,
    paddingTop: SPACING.xs,
  },
  languageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.control,
    gap: SPACING.sm,
  },
  flagImage: {
    width: 24,
    height: 24,
    borderRadius: 4,
  },
  flagImageSmall: {
    width: 20,
    height: 20,
    borderRadius: 3,
  },
  languageLabel: {
    flex: 1,
  },
});
