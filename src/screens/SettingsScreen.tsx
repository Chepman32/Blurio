import React, { useMemo } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Circle } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ACCENT_COLORS,
  SPACING,
  STRINGS,
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
import type { RootStackParamList } from '../types';

const formatBytes = (bytes: number): string => {
  if (bytes <= 0) {
    return '0 B';
  }

  const units = ['B', 'KB', 'MB', 'GB'];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** exponent;
  return `${value.toFixed(exponent === 0 ? 0 : 1)} ${units[exponent]}`;
};

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

export const SettingsScreen: React.FC<Props> = ({ navigation }) => {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();

  const settings = useEditorStore(state => state.settings);
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
            <AppText variant="section">{STRINGS.settings.appearance}</AppText>
            <SegmentedControl
              value={settings.appearance}
              options={[
                { label: STRINGS.settings.appearanceSystem, value: 'system' },
                { label: STRINGS.settings.appearanceDark, value: 'dark' },
                { label: STRINGS.settings.appearanceLight, value: 'light' },
              ]}
              onChange={setAppearance}
              accessibilityLabel={STRINGS.settings.appearance}
            />
            <AppText variant="micro" color={colors.textSecondary}>
              {STRINGS.settings.accentColor}
            </AppText>
            <View style={styles.colorRow}>
              {ACCENT_COLORS.map(color => {
                const active = color === settings.accentColor;
                return (
                  <TouchableOpacity
                    key={color}
                    accessibilityLabel={`Accent color ${color}`}
                    onPress={() => setAccentColor(color)}
                    style={[
                      styles.colorSwatch,
                      {
                        backgroundColor: color,
                        borderColor: active ? colors.textPrimary : 'transparent',
                      },
                    ]}>
                    {active ? <Circle size={12} color="#fff" fill="#fff" /> : null}
                  </TouchableOpacity>
                );
              })}
            </View>
          </GlassCard>

          <GlassCard style={styles.sectionCard}>
            <AppText variant="section">{STRINGS.settings.motion}</AppText>
            <SegmentedControl
              value={settings.reduceMotionOverride}
              options={[
                { label: STRINGS.settings.reduceMotionSystem, value: 'system' },
                { label: STRINGS.settings.reduceMotionOn, value: 'on' },
                { label: STRINGS.settings.reduceMotionOff, value: 'off' },
              ]}
              onChange={setReduceMotionOverride}
              accessibilityLabel={STRINGS.settings.motion}
            />
          </GlassCard>

          <GlassCard style={styles.sectionCard}>
            <AppText variant="section">{STRINGS.settings.preview}</AppText>
            <SegmentedControl
              value={settings.previewQuality}
              options={[
                { label: STRINGS.view.ultra, value: 'ultra' },
                { label: STRINGS.view.balanced, value: 'balanced' },
                { label: STRINGS.view.smooth, value: 'smooth' },
              ]}
              onChange={setPreviewQuality}
              accessibilityLabel={STRINGS.settings.previewQualityDefault}
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
            <AppText variant="section">{STRINGS.settings.storage}</AppText>
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
            <AppText variant="section">{STRINGS.settings.about}</AppText>
            <AppText variant="micro" color={colors.textSecondary}>
              {STRINGS.settings.version}: 1.0.0
            </AppText>
            <AppText variant="micro" color={colors.textSecondary}>
              {STRINGS.settings.offlineOnly}
            </AppText>
          </GlassCard>
        </ScrollView>

        <BlurButton
          label={STRINGS.common.done}
          onPress={() => navigation.goBack()}
          accessibilityLabel={STRINGS.common.done}
          variant="secondary"
          style={styles.bottomButton}
        />
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
  },
  scrollContent: {
    gap: SPACING.sm,
    paddingBottom: SPACING.md,
  },
  sectionCard: {
    gap: SPACING.sm,
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  colorSwatch: {
    width: 28,
    height: 28,
    borderRadius: 16,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomButton: {
    marginTop: SPACING.md,
  },
  cleanTrashButton: {
    marginTop: SPACING.xs,
  },
});
