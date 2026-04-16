import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Check,
  ChevronLeft,
  CloudOff,
  Lock,
  PlayCircle,
  Shield,
  Sparkles,
  Star,
  Wand2,
  X,
} from 'lucide-react-native';
import Animated, {
  Easing,
  FadeInDown,
  FadeInLeft,
  FadeInRight,
  FadeOut,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import {
  AppText,
  BlurButton,
  GlassCard,
  GradientBackground,
} from '../components/common';
import { RADIUS, SHADOWS, SPACING, STRINGS } from '../constants';
import { SPRINGS } from '../constants/animations';
import { useReducedMotion } from '../hooks';
import {
  COMPARISON_ROWS,
  DEFAULT_SOLUTION_ORDER,
  DEMO_TARGETS,
  ONBOARDING_GOALS,
  ONBOARDING_PAIN_POINTS,
  ONBOARDING_PREFERENCES,
  ONBOARDING_STATEMENTS,
  ONBOARDING_STEPS,
  ONBOARDING_TESTIMONIALS,
  PERSONALIZED_SOLUTIONS,
  PAYWALL_FEATURES,
  type DemoTarget,
  type OnboardingChoice,
  type OnboardingStepKey,
} from '../onboarding/content';
import { useEditorStore } from '../store';
import { useAppTheme } from '../theme';
import type { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

const TOTAL_STEPS = ONBOARDING_STEPS.length;
const STEP_INDEX: Record<OnboardingStepKey, number> = ONBOARDING_STEPS.reduce(
  (accumulator, step, index) => ({
    ...accumulator,
    [step]: index,
  }),
  {} as Record<OnboardingStepKey, number>,
);
const PROCESSING_DURATION_MS = 1700;
const RESULT_SELECTION_COUNT = 3;

const GOAL_TO_PREFERENCE: Record<string, string[]> = {
  'faces-fast': ['face', 'tattoo', 'badge'],
  'cover-plates': ['plate', 'address', 'badge'],
  'protect-family': ['face', 'address', 'document'],
  'client-footage': ['badge', 'document', 'face'],
  'stay-offline': ['document', 'badge', 'plate'],
  'ship-faster': ['face', 'plate', 'address'],
};

const ORDERED_PAIN_IDS = ONBOARDING_PAIN_POINTS.map(item => item.id);

const uniq = (ids: string[]): string[] => Array.from(new Set(ids));

const toggleId = (items: string[], id: string): string[] =>
  items.includes(id) ? items.filter(item => item !== id) : [...items, id];

const clampStep = (step: string | null): number => {
  if (!step) {
    return 0;
  }

  const key = step as OnboardingStepKey;
  return STEP_INDEX[key] ?? 0;
};

const resolveSolutionItems = (painPointIds: string[]) => {
  const ids = uniq([...painPointIds, ...DEFAULT_SOLUTION_ORDER]).slice(0, 4);
  return ids
    .map(id => PERSONALIZED_SOLUTIONS[id])
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
};

const buildDemoOrder = (goalId: string | null, preferenceIds: string[]): DemoTarget[] => {
  const rankedIds = uniq([
    ...preferenceIds,
    ...(goalId ? GOAL_TO_PREFERENCE[goalId] ?? [] : []),
    ...DEMO_TARGETS.map(item => item.id),
  ]);

  return rankedIds
    .map(id => DEMO_TARGETS.find(target => target.id === id))
    .filter((item): item is DemoTarget => Boolean(item));
};

const getGoalCopy = (goalId: string | null): string => {
  const goal = ONBOARDING_GOALS.find(item => item.id === goalId);
  return goal?.goalPhrase ?? STRINGS.onboarding.defaultGoalPhrase;
};

const ProgressBar: React.FC<{
  index: number;
  colors: ReturnType<typeof useAppTheme>['colors'];
  reducedMotion: boolean;
}> = ({ index, colors, reducedMotion }) => {
  const fillWidth = useSharedValue(((index + 1) / TOTAL_STEPS) * 100);

  useEffect(() => {
    const target = ((index + 1) / TOTAL_STEPS) * 100;
    fillWidth.value = reducedMotion
      ? withTiming(target, { duration: 200 })
      : withSpring(target, {
          damping: SPRINGS.gentle.damping,
          stiffness: SPRINGS.gentle.stiffness,
          mass: SPRINGS.gentle.mass,
        });
  }, [fillWidth, index, reducedMotion]);

  const fillStyle = useAnimatedStyle(() => ({ width: `${fillWidth.value}%` }));

  return (
    <View style={styles.progressTrack}>
      <Animated.View
        style={[styles.progressFill, { backgroundColor: colors.accent }, fillStyle]}
      />
    </View>
  );
};

const PreviewDevice: React.FC<{ colors: ReturnType<typeof useAppTheme>['colors'] }> = ({
  colors,
}) => (
  <GlassCard style={styles.previewShell} padding={0}>
    <LinearGradient
      colors={[`${colors.accent}33`, `${colors.backgroundTop}F5`, `${colors.backgroundBottom}FA`]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.previewGradient}>
      <View style={styles.previewTopRow}>
        <View style={[styles.previewBadge, { backgroundColor: `${colors.accent}22` }]}>
          <Shield size={14} color={colors.accent} />
          <AppText variant="micro" color={colors.accent}>
            {STRINGS.onboarding.welcomeMetricPrivate}
          </AppText>
        </View>
        <View style={[styles.previewDot, { backgroundColor: colors.success }]} />
      </View>

      <View style={[styles.previewCanvas, { borderColor: `${colors.cardBorder}AA` }]}>
        <LinearGradient
          colors={['#111827', '#1F2937', '#0F172A']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={[styles.previewFace, { borderColor: '#7DD3FC' }]} />
        <View style={[styles.previewPlate, { borderColor: '#FBBF24' }]} />
        <View style={[styles.previewBadgeFloat, { backgroundColor: `${colors.sheet}CC` }]}>
          <AppText variant="micro">{STRINGS.onboarding.previewFaceChip}</AppText>
        </View>
      </View>

      <View style={styles.previewTimeline}>
        <View style={[styles.timelineBar, { backgroundColor: `${colors.cardBorder}AA` }]}>
          <View style={[styles.timelineFill, { backgroundColor: colors.accent }]} />
        </View>
        <View style={styles.timelineChips}>
          <View style={[styles.timelineChip, { backgroundColor: `${colors.accent}22` }]}>
            <AppText variant="micro" color={colors.accent}>
              {STRINGS.editor.faceTemplate}
            </AppText>
          </View>
          <View style={[styles.timelineChip, { backgroundColor: `${colors.warning}22` }]}>
            <AppText variant="micro" color={colors.warning}>
              {STRINGS.editor.plateTemplate}
            </AppText>
          </View>
        </View>
      </View>
    </LinearGradient>
  </GlassCard>
);

const SelectionCard: React.FC<{
  item: OnboardingChoice;
  selected: boolean;
  colors: ReturnType<typeof useAppTheme>['colors'];
  onPress: () => void;
}> = ({ item, selected, colors, onPress }) => {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={animStyle}>
      <Pressable
        onPressIn={() => {
          scale.value = withSpring(0.97, {
            damping: SPRINGS.snappy.damping,
            stiffness: SPRINGS.snappy.stiffness,
          });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, {
            damping: SPRINGS.snappy.damping,
            stiffness: SPRINGS.snappy.stiffness,
          });
        }}
        onPress={onPress}>
        <GlassCard
          style={[
            styles.selectionCard,
            {
              borderColor: selected ? item.accent : colors.cardBorder,
              backgroundColor: selected ? `${item.accent}22` : colors.card,
            },
          ]}>
          <View style={styles.selectionCardRow}>
            <View style={[styles.selectionEmojiWrap, { backgroundColor: `${item.accent}22` }]}>
              <AppText style={styles.selectionEmoji}>{item.emoji}</AppText>
            </View>
            <View style={styles.selectionTextWrap}>
              <AppText variant="bodyStrong">{item.title}</AppText>
              <AppText variant="micro" color={colors.textSecondary}>
                {item.body}
              </AppText>
            </View>
            <View
              style={[
                styles.checkPill,
                {
                  borderColor: selected ? item.accent : colors.cardBorder,
                  backgroundColor: selected ? item.accent : 'transparent',
                },
              ]}>
              {selected ? <Check size={14} color="#FFFFFF" /> : null}
            </View>
          </View>
        </GlassCard>
      </Pressable>
    </Animated.View>
  );
};

const ComparisonTable: React.FC<{ colors: ReturnType<typeof useAppTheme>['colors'] }> = ({
  colors,
}) => (
  <GlassCard style={styles.comparisonCard}>
    <AppText variant="bodyStrong" style={styles.comparisonTitle}>
      {STRINGS.onboarding.comparisonTitle}
    </AppText>
    <View style={styles.comparisonHeader}>
      <AppText variant="micro" color={colors.textMuted}>
        {STRINGS.onboarding.comparisonWhatMatters}
      </AppText>
      <View style={styles.comparisonHeaderRight}>
        <AppText variant="micro" color={colors.accent}>
          {STRINGS.onboarding.comparisonWithApp}
        </AppText>
        <AppText variant="micro" color={colors.textMuted}>
          {STRINGS.onboarding.comparisonWithout}
        </AppText>
      </View>
    </View>
    {COMPARISON_ROWS.map(row => (
      <View
        key={row.id}
        style={[styles.comparisonRow, { borderTopColor: `${colors.cardBorder}AA` }]}>
        <AppText variant="micro" style={styles.comparisonLabel}>
          {row.label}
        </AppText>
        <View style={styles.comparisonValues}>
          <View style={styles.comparisonValueWrap}>
            <Check size={14} color={colors.success} />
            <AppText variant="micro" color={colors.textSecondary}>
              {row.withApp}
            </AppText>
          </View>
          <View style={styles.comparisonValueWrap}>
            <X size={14} color={colors.destructive} />
            <AppText variant="micro" color={colors.textSecondary}>
              {row.withoutApp}
            </AppText>
          </View>
        </View>
      </View>
    ))}
  </GlassCard>
);

const DemoSceneCard: React.FC<{
  item: DemoTarget;
  colors: ReturnType<typeof useAppTheme>['colors'];
}> = ({ item, colors }) => (
  <GlassCard style={styles.demoCard} padding={0}>
    <LinearGradient
      colors={[`${item.accent}DD`, `${item.accent}88`, `${colors.backgroundBottom}F4`]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.demoGradient}>
      <View style={styles.demoHeader}>
        <View style={[styles.demoTag, { backgroundColor: `${colors.sheet}CC` }]}>
          <AppText variant="micro">{item.label}</AppText>
        </View>
        <PlayCircle size={18} color="#FFFFFF" />
      </View>

      <View style={styles.demoStage}>
        <View style={[styles.demoSubject, { backgroundColor: `${colors.sheet}33` }]} />
        <View style={[styles.demoBlurTarget, { borderColor: '#FFFFFF' }]} />
        <View style={[styles.demoCaption, { backgroundColor: `${colors.sheet}BB` }]}>
          <AppText variant="micro">{item.subtitle}</AppText>
        </View>
      </View>
    </LinearGradient>
  </GlassCard>
);

const ProcessingPulse: React.FC<{
  colors: ReturnType<typeof useAppTheme>['colors'];
  reducedMotion: boolean;
}> = ({ colors, reducedMotion }) => {
  const r1 = useSharedValue(1);
  const r2 = useSharedValue(1);
  const r3 = useSharedValue(1);

  useEffect(() => {
    if (reducedMotion) {
      return;
    }

    const cfg = { duration: 1400, easing: Easing.inOut(Easing.sin) };
    r1.value = withRepeat(withTiming(1.08, cfg), -1, true);
    r2.value = withDelay(200, withRepeat(withTiming(1.10, cfg), -1, true));
    r3.value = withDelay(400, withRepeat(withTiming(1.13, cfg), -1, true));
  }, [r1, r2, r3, reducedMotion]);

  const s1 = useAnimatedStyle(() => ({ transform: [{ scale: r1.value }] }));
  const s2 = useAnimatedStyle(() => ({ transform: [{ scale: r2.value }] }));
  const s3 = useAnimatedStyle(() => ({ transform: [{ scale: r3.value }] }));

  return (
    <View style={styles.processingWrap}>
      <Animated.View style={[styles.processingRingOuter, { borderColor: `${colors.accent}33` }, s3]}>
        <Animated.View style={[styles.processingRingMid, { borderColor: `${colors.accent}66` }, s2]}>
          <Animated.View
            style={[styles.processingRingInner, { backgroundColor: `${colors.accent}22` }, s1]}>
            <Sparkles size={28} color={colors.accent} />
          </Animated.View>
        </Animated.View>
      </Animated.View>
    </View>
  );
};

const PreferenceCard: React.FC<{
  item: OnboardingChoice;
  active: boolean;
  recommended: boolean;
  width: number;
  colors: ReturnType<typeof useAppTheme>['colors'];
  onPress: () => void;
}> = ({ item, active, recommended, width, colors, onPress }) => {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={[{ width }, animStyle]}>
      <Pressable
        onPressIn={() => {
          scale.value = withSpring(0.97, {
            damping: SPRINGS.snappy.damping,
            stiffness: SPRINGS.snappy.stiffness,
          });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, {
            damping: SPRINGS.snappy.damping,
            stiffness: SPRINGS.snappy.stiffness,
          });
        }}
        onPress={onPress}>
        <GlassCard
          style={[
            styles.preferenceCard,
            {
              width,
              borderColor: active ? item.accent : colors.cardBorder,
              backgroundColor: active ? `${item.accent}22` : colors.card,
            },
          ]}>
          <View style={styles.preferenceCardHeader}>
            <View style={[styles.preferenceIconWrap, { backgroundColor: `${item.accent}20` }]}>
              <AppText style={styles.preferenceEmoji}>{item.emoji}</AppText>
            </View>
            <View
              style={[
                styles.preferenceSelectPill,
                {
                  backgroundColor: active ? item.accent : 'transparent',
                  borderColor: active ? item.accent : colors.cardBorder,
                },
              ]}>
              {active ? (
                <Check size={13} color="#FFFFFF" />
              ) : recommended ? (
                <Sparkles size={13} color={item.accent} />
              ) : null}
            </View>
          </View>
          <View style={styles.preferenceTextBlock}>
            {recommended ? (
              <AppText variant="micro" color={item.accent}>
                {STRINGS.onboarding.preferencesRecommended}
              </AppText>
            ) : null}
            <AppText variant="bodyStrong" numberOfLines={2} style={styles.preferenceTitle}>
              {item.title}
            </AppText>
          </View>
          <AppText
            variant="micro"
            color={colors.textSecondary}
            numberOfLines={4}
            style={styles.preferenceBody}>
            {item.body}
          </AppText>
          <View style={styles.preferenceFooter}>
            <AppText variant="micro" color={active ? item.accent : colors.textMuted}>
              {active
                ? STRINGS.onboarding.preferencesIncluded
                : STRINGS.onboarding.preferencesTapToInclude}
            </AppText>
          </View>
        </GlassCard>
      </Pressable>
    </Animated.View>
  );
};

export const OnboardingScreen: React.FC<Props> = ({ navigation }) => {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const onboarding = useEditorStore(state => state.settings.onboarding);
  const saveOnboardingProgress = useEditorStore(state => state.saveOnboardingProgress);
  const completeOnboarding = useEditorStore(state => state.completeOnboarding);
  const reducedMotion = useReducedMotion();
  const navDirection = useRef<'forward' | 'back'>('forward');
  const scrollRef = useRef<ScrollView>(null);

  const [stepIndex, setStepIndex] = useState(() => clampStep(onboarding.lastSeenStep));
  const [goalId, setGoalId] = useState<string | null>(onboarding.goalId);
  const [painPointIds, setPainPointIds] = useState<string[]>(onboarding.painPointIds);
  const [preferenceIds, setPreferenceIds] = useState<string[]>(onboarding.preferenceIds);
  const [affirmedStatementIds, setAffirmedStatementIds] = useState<string[]>(
    onboarding.affirmedStatementIds,
  );
  const [demoSelectionIds, setDemoSelectionIds] = useState<string[]>(
    onboarding.demoSelectionIds,
  );
  const [statementCursor, setStatementCursor] = useState(
    Math.min(onboarding.affirmedStatementIds.length, ONBOARDING_STATEMENTS.length - 1),
  );
  const [demoCursor, setDemoCursor] = useState(
    Math.min(onboarding.demoSelectionIds.length, DEMO_TARGETS.length - 1),
  );

  const currentStep = ONBOARDING_STEPS[stepIndex] ?? ONBOARDING_STEPS[0];
  const selectedPains = useMemo(
    () => ORDERED_PAIN_IDS.filter(id => painPointIds.includes(id)),
    [painPointIds],
  );
  const solutionItems = useMemo(() => resolveSolutionItems(selectedPains), [selectedPains]);
  const recommendedPreferenceIds = useMemo(
    () => (goalId ? GOAL_TO_PREFERENCE[goalId] ?? [] : []),
    [goalId],
  );
  const preferenceCardWidth = useMemo(() => {
    const horizontalPadding = SPACING.md * 2;
    const interItemGap = SPACING.sm;
    const availableWidth = Math.max(0, windowWidth - horizontalPadding - interItemGap);

    return Math.floor(availableWidth / 2);
  }, [windowWidth]);
  const demoTargets = useMemo(
    () => buildDemoOrder(goalId, preferenceIds),
    [goalId, preferenceIds],
  );
  const activeStatement = ONBOARDING_STATEMENTS[statementCursor] ?? null;
  const activeDemoTarget = demoTargets[demoCursor] ?? null;
  const resultTargets = useMemo(() => {
    const chosen = demoSelectionIds
      .map(id => demoTargets.find(item => item.id === id))
      .filter((item): item is DemoTarget => Boolean(item));

    if (chosen.length > 0) {
      return chosen.slice(0, RESULT_SELECTION_COUNT);
    }

    return demoTargets.slice(0, RESULT_SELECTION_COUNT);
  }, [demoSelectionIds, demoTargets]);

  const stepEntering = reducedMotion
    ? FadeInDown.duration(160)
    : navDirection.current === 'back'
    ? FadeInLeft.springify()
        .damping(SPRINGS.snappy.damping)
        .stiffness(SPRINGS.snappy.stiffness)
        .mass(SPRINGS.snappy.mass)
    : FadeInRight.springify()
        .damping(SPRINGS.snappy.damping)
        .stiffness(SPRINGS.snappy.stiffness)
        .mass(SPRINGS.snappy.mass);

  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [stepIndex]);

  useEffect(() => {
    saveOnboardingProgress({
      goalId,
      painPointIds,
      preferenceIds,
      affirmedStatementIds,
      demoSelectionIds,
      lastSeenStep: currentStep,
    });
  }, [
    affirmedStatementIds,
    currentStep,
    demoSelectionIds,
    goalId,
    painPointIds,
    preferenceIds,
    saveOnboardingProgress,
  ]);

  useEffect(() => {
    if (currentStep !== 'processing') {
      return;
    }

    const timer = setTimeout(() => {
      navDirection.current = 'forward';
      setStepIndex(STEP_INDEX.demo);
    }, PROCESSING_DURATION_MS);

    return () => clearTimeout(timer);
  }, [currentStep]);

  useEffect(() => {
    if (currentStep !== 'demo') {
      return;
    }

    if (demoSelectionIds.length < RESULT_SELECTION_COUNT && demoCursor < demoTargets.length) {
      return;
    }

    const timer = setTimeout(() => {
      navDirection.current = 'forward';
      setStepIndex(STEP_INDEX.value);
    }, 220);

    return () => clearTimeout(timer);
  }, [currentStep, demoCursor, demoSelectionIds.length, demoTargets.length]);

  const goNext = () => {
    if (stepIndex >= TOTAL_STEPS - 1) {
      return;
    }

    navDirection.current = 'forward';
    setStepIndex(previous => Math.min(previous + 1, TOTAL_STEPS - 1));
  };

  const goBack = () => {
    if (stepIndex === 0) {
      return;
    }

    navDirection.current = 'back';
    setStepIndex(previous => Math.max(previous - 1, 0));
  };

  const onSelectStatement = (affirm: boolean) => {
    if (!activeStatement) {
      goNext();
      return;
    }

    if (affirm) {
      setAffirmedStatementIds(previous => uniq([...previous, activeStatement.id]));
    }

    const nextCursor = statementCursor + 1;
    if (nextCursor >= ONBOARDING_STATEMENTS.length) {
      navDirection.current = 'forward';
      setStepIndex(STEP_INDEX.solution);
      return;
    }

    setStatementCursor(nextCursor);
  };

  const onSelectDemoTarget = (select: boolean) => {
    if (!activeDemoTarget) {
      navDirection.current = 'forward';
      setStepIndex(STEP_INDEX.value);
      return;
    }

    if (select) {
      setDemoSelectionIds(previous => uniq([...previous, activeDemoTarget.id]));
    }

    setDemoCursor(previous => previous + 1);
  };

  const shareSetup = async () => {
    await Share.share({
      message: STRINGS.onboarding.shareSetupMessage(
        resultTargets.map(item => item.label),
      ),
    });
  };

  const finishOnboarding = (paywallIntent: 'trial' | 'free') => {
    // Placeholder until a purchase SDK is connected to the paywall CTA.
    saveOnboardingProgress({
      paywallIntent,
      lastSeenStep: 'paywall',
    });
    completeOnboarding();
    navigation.reset({
      index: 1,
      routes: [{ name: 'Home' }, { name: 'Import' }],
    });
  };

  const renderContent = () => {
    switch (currentStep) {
      case 'welcome':
        return (
          <Animated.View
            key={currentStep}
            entering={stepEntering}
            exiting={FadeOut.duration(120)}
            style={styles.stepBody}>
            <View style={styles.heroCopy}>
              <View style={[styles.heroBadge, { backgroundColor: `${colors.accent}22` }]}>
                <Lock size={14} color={colors.accent} />
                <AppText variant="micro" color={colors.accent}>
                  {STRINGS.onboarding.welcomeBadge}
                </AppText>
              </View>
              <AppText style={styles.heroTitle}>
                {STRINGS.onboarding.welcomeTitle}
              </AppText>
              <AppText variant="body" color={colors.textSecondary} style={styles.heroBody}>
                {STRINGS.onboarding.welcomeBody}
              </AppText>
            </View>

            <PreviewDevice colors={colors} />

            <GlassCard style={styles.metricStrip}>
              <View style={styles.metricItem}>
                <Shield size={16} color={colors.accent} />
                <AppText variant="micro">{STRINGS.onboarding.welcomeMetricPrivate}</AppText>
              </View>
              <View style={styles.metricItem}>
                <CloudOff size={16} color={colors.accent} />
                <AppText variant="micro">{STRINGS.onboarding.welcomeMetricNoUpload}</AppText>
              </View>
              <View style={styles.metricItem}>
                <Wand2 size={16} color={colors.accent} />
                <AppText variant="micro">{STRINGS.onboarding.welcomeMetricFastPresets}</AppText>
              </View>
            </GlassCard>
          </Animated.View>
        );
      case 'goal':
        return (
          <Animated.View
            key={currentStep}
            entering={stepEntering}
            exiting={FadeOut.duration(120)}
            style={styles.stepBody}>
            <AppText style={styles.stepTitle}>{STRINGS.onboarding.goalTitle}</AppText>
            <AppText variant="body" color={colors.textSecondary} style={styles.stepLead}>
              {STRINGS.onboarding.goalLead}
            </AppText>
            <View style={styles.cardList}>
              {ONBOARDING_GOALS.map((item, index) => (
                <Animated.View
                  key={item.id}
                  entering={
                    reducedMotion
                      ? undefined
                      : FadeInDown.delay(index * 55)
                          .springify()
                          .damping(SPRINGS.gentle.damping)
                          .stiffness(SPRINGS.gentle.stiffness)
                          .mass(SPRINGS.gentle.mass)
                  }>
                  <SelectionCard
                    item={item}
                    selected={goalId === item.id}
                    colors={colors}
                    onPress={() => setGoalId(item.id)}
                  />
                </Animated.View>
              ))}
            </View>
          </Animated.View>
        );
      case 'pains':
        return (
          <Animated.View
            key={currentStep}
            entering={stepEntering}
            exiting={FadeOut.duration(120)}
            style={styles.stepBody}>
            <AppText style={styles.stepTitle}>{STRINGS.onboarding.painsTitle(getGoalCopy(goalId))}</AppText>
            <AppText variant="body" color={colors.textSecondary} style={styles.stepLead}>
              {STRINGS.onboarding.painsLead}
            </AppText>
            <View style={styles.cardList}>
              {ONBOARDING_PAIN_POINTS.map((item, index) => (
                <Animated.View
                  key={item.id}
                  entering={
                    reducedMotion
                      ? undefined
                      : FadeInDown.delay(index * 55)
                          .springify()
                          .damping(SPRINGS.gentle.damping)
                          .stiffness(SPRINGS.gentle.stiffness)
                          .mass(SPRINGS.gentle.mass)
                  }>
                  <SelectionCard
                    item={item}
                    selected={painPointIds.includes(item.id)}
                    colors={colors}
                    onPress={() => setPainPointIds(previous => toggleId(previous, item.id))}
                  />
                </Animated.View>
              ))}
            </View>
          </Animated.View>
        );
      case 'proof':
        return (
          <Animated.View
            key={currentStep}
            entering={stepEntering}
            exiting={FadeOut.duration(120)}
            style={styles.stepBody}>
            <AppText style={styles.stepTitle}>{STRINGS.onboarding.proofTitle}</AppText>
            <AppText variant="body" color={colors.textSecondary} style={styles.stepLead}>
              {STRINGS.onboarding.proofLead}
            </AppText>
            <View style={styles.cardList}>
              {ONBOARDING_TESTIMONIALS.map((item, index) => (
                <Animated.View
                  key={item.id}
                  entering={
                    reducedMotion
                      ? undefined
                      : FadeInDown.delay(index * 55)
                          .springify()
                          .damping(SPRINGS.gentle.damping)
                          .stiffness(SPRINGS.gentle.stiffness)
                          .mass(SPRINGS.gentle.mass)
                  }>
                  <GlassCard style={styles.testimonialCard}>
                    <View style={styles.testimonialHeader}>
                      <View style={[styles.personaPill, { backgroundColor: `${colors.accent}22` }]}>
                        <AppText variant="micro" color={colors.accent}>
                          {item.persona}
                        </AppText>
                      </View>
                      <View style={styles.starRow}>
                        {Array.from({ length: 5 }, (_, i) => (
                          <Star key={`${item.id}-${i}`} size={12} color="#FDBA74" fill="#FDBA74" />
                        ))}
                      </View>
                    </View>
                    <AppText variant="bodyStrong">{item.name}</AppText>
                    <AppText variant="body" color={colors.textSecondary}>
                      {item.quote}
                    </AppText>
                  </GlassCard>
                </Animated.View>
              ))}
            </View>
          </Animated.View>
        );
      case 'statements':
        return (
          <Animated.View
            key={currentStep}
            entering={stepEntering}
            exiting={FadeOut.duration(120)}
            style={styles.stepBody}>
            <AppText style={styles.stepTitle}>{STRINGS.onboarding.statementsTitle}</AppText>
            <AppText variant="body" color={colors.textSecondary} style={styles.stepLead}>
              {STRINGS.onboarding.statementsLead}
            </AppText>
            <Animated.View
              key={activeStatement?.id ?? 'statement-empty'}
              entering={
                reducedMotion
                  ? FadeInDown.duration(160)
                  : FadeInRight.springify()
                      .damping(SPRINGS.snappy.damping)
                      .stiffness(SPRINGS.snappy.stiffness)
                      .mass(SPRINGS.snappy.mass)
              }
              exiting={FadeOut.duration(100)}>
              <GlassCard style={styles.statementCard}>
                <AppText variant="micro" color={colors.accent}>
                  {STRINGS.onboarding.statementProgress(
                    Math.min(statementCursor + 1, ONBOARDING_STATEMENTS.length),
                    ONBOARDING_STATEMENTS.length,
                  )}
                </AppText>
                <AppText style={styles.statementQuote}>{activeStatement?.quote}</AppText>
                <View style={styles.statementDots}>
                  {ONBOARDING_STATEMENTS.map((item, index) => (
                    <View
                      key={item.id}
                      style={[
                        styles.statementDot,
                        {
                          backgroundColor:
                            index <= statementCursor ? colors.accent : `${colors.cardBorder}AA`,
                        },
                      ]}
                    />
                  ))}
                </View>
              </GlassCard>
            </Animated.View>
          </Animated.View>
        );
      case 'solution':
        return (
          <Animated.View
            key={currentStep}
            entering={stepEntering}
            exiting={FadeOut.duration(120)}
            style={styles.stepBody}>
            <AppText style={styles.stepTitle}>{STRINGS.onboarding.solutionTitle}</AppText>
            <AppText variant="body" color={colors.textSecondary} style={styles.stepLead}>
              {STRINGS.onboarding.solutionLead}
            </AppText>
            <View style={styles.cardList}>
              {solutionItems.map(item => (
                <GlassCard key={item.id} style={styles.solutionCard}>
                  <AppText variant="micro" color={colors.textMuted}>
                    {item.eyebrow}
                  </AppText>
                  <AppText variant="bodyStrong">{item.headline}</AppText>
                  <AppText variant="micro" color={colors.textSecondary}>
                    {item.detail}
                  </AppText>
                </GlassCard>
              ))}
            </View>
            <ComparisonTable colors={colors} />
          </Animated.View>
        );
      case 'preferences':
        return (
          <Animated.View
            key={currentStep}
            entering={stepEntering}
            exiting={FadeOut.duration(120)}
            style={styles.stepBody}>
            <AppText style={styles.stepTitle}>{STRINGS.onboarding.preferencesTitle}</AppText>
            <AppText variant="body" color={colors.textSecondary} style={styles.stepLead}>
              {STRINGS.onboarding.preferencesLead}
            </AppText>
            <GlassCard style={styles.preferenceSummaryCard}>
              <View style={styles.preferenceSummaryHeader}>
                <View style={styles.preferenceSummaryCopy}>
                  <AppText variant="micro" color={colors.accent}>
                    {STRINGS.onboarding.preferencesSummaryEyebrow}
                  </AppText>
                  <AppText variant="bodyStrong">
                    {STRINGS.onboarding.preferencesSummaryTitle}
                  </AppText>
                  <AppText variant="micro" color={colors.textSecondary}>
                    {STRINGS.onboarding.preferencesSummaryBody}
                  </AppText>
                </View>
                <View
                  style={[
                    styles.preferenceCountPill,
                    { backgroundColor: `${colors.accent}1E` },
                  ]}>
                  <AppText variant="micro" color={colors.accent}>
                    {preferenceIds.length}/6
                  </AppText>
                </View>
              </View>
              {recommendedPreferenceIds.length > 0 ? (
                <View style={styles.preferenceHintRow}>
                  <AppText variant="micro" color={colors.textMuted}>
                    {STRINGS.onboarding.preferencesBestMatches}
                  </AppText>
                  <View style={styles.preferenceHintChips}>
                    {recommendedPreferenceIds.map(id => {
                      const item = ONBOARDING_PREFERENCES.find(option => option.id === id);
                      if (!item) {
                        return null;
                      }

                      return (
                        <View
                          key={item.id}
                          style={[
                            styles.preferenceHintChip,
                            { backgroundColor: `${item.accent}20` },
                          ]}>
                          <AppText variant="micro" color={item.accent}>
                            {item.title}
                          </AppText>
                        </View>
                      );
                    })}
                  </View>
                </View>
              ) : null}
            </GlassCard>
            <View style={styles.grid}>
              {ONBOARDING_PREFERENCES.map((item, index) => {
                const active = preferenceIds.includes(item.id);
                const recommended = recommendedPreferenceIds.includes(item.id);
                return (
                  <Animated.View
                    key={item.id}
                    entering={
                      reducedMotion
                        ? undefined
                        : FadeInDown.delay(index * 55)
                            .springify()
                            .damping(SPRINGS.gentle.damping)
                            .stiffness(SPRINGS.gentle.stiffness)
                            .mass(SPRINGS.gentle.mass)
                    }>
                    <PreferenceCard
                      item={item}
                      active={active}
                      recommended={recommended}
                      width={preferenceCardWidth}
                      colors={colors}
                      onPress={() => setPreferenceIds(previous => toggleId(previous, item.id))}
                    />
                  </Animated.View>
                );
              })}
            </View>
          </Animated.View>
        );
      case 'permissions':
        return (
          <Animated.View
            key={currentStep}
            entering={stepEntering}
            exiting={FadeOut.duration(120)}
            style={styles.stepBody}>
            <AppText style={styles.stepTitle}>{STRINGS.onboarding.permissionsTitle}</AppText>
            <AppText variant="body" color={colors.textSecondary} style={styles.stepLead}>
              {STRINGS.onboarding.permissionsLead}
            </AppText>
            <GlassCard style={styles.permissionCard}>
              <View style={[styles.permissionIcon, { backgroundColor: `${colors.accent}22` }]}>
                <Shield size={28} color={colors.accent} />
              </View>
              <View style={styles.permissionBulletList}>
                <View style={styles.permissionBullet}>
                  <Check size={16} color={colors.success} />
                  <AppText variant="bodyStrong">{STRINGS.onboarding.permissionsImport}</AppText>
                </View>
                <View style={styles.permissionBullet}>
                  <Check size={16} color={colors.success} />
                  <AppText variant="bodyStrong">{STRINGS.onboarding.permissionsExport}</AppText>
                </View>
                <View style={styles.permissionBullet}>
                  <Check size={16} color={colors.success} />
                  <AppText variant="bodyStrong">
                    {STRINGS.onboarding.permissionsSystemPrompts}
                  </AppText>
                </View>
              </View>
              <AppText variant="micro" color={colors.textMuted}>
                {STRINGS.onboarding.permissionsFooter}
              </AppText>
            </GlassCard>
          </Animated.View>
        );
      case 'processing':
        return (
          <Animated.View
            key={currentStep}
            entering={stepEntering}
            exiting={FadeOut.duration(120)}
            style={styles.processingStep}>
            <ProcessingPulse colors={colors} reducedMotion={reducedMotion} />
            <AppText style={styles.stepTitle}>{STRINGS.onboarding.processingTitle}</AppText>
            <AppText variant="body" color={colors.textSecondary} style={styles.processingLead}>
              {STRINGS.onboarding.processingLead(getGoalCopy(goalId))}
            </AppText>
            <GlassCard style={styles.processingCard}>
              <View style={styles.processingChecklistItem}>
                <Check size={16} color={colors.success} />
                <AppText variant="bodyStrong">{STRINGS.onboarding.processingSelected}</AppText>
              </View>
              <View style={styles.processingChecklistItem}>
                <Check size={16} color={colors.success} />
                <AppText variant="bodyStrong">{STRINGS.onboarding.processingOnDevice}</AppText>
              </View>
              <View style={styles.processingChecklistItem}>
                <Check size={16} color={colors.success} />
                <AppText variant="bodyStrong">{STRINGS.onboarding.processingDemoQueued}</AppText>
              </View>
            </GlassCard>
          </Animated.View>
        );
      case 'demo':
        return (
          <Animated.View
            key={currentStep}
            entering={stepEntering}
            exiting={FadeOut.duration(120)}
            style={styles.stepBody}>
            <AppText style={styles.stepTitle}>{STRINGS.onboarding.demoTitle}</AppText>
            <AppText variant="body" color={colors.textSecondary} style={styles.stepLead}>
              {STRINGS.onboarding.demoLead(RESULT_SELECTION_COUNT)}
            </AppText>
            <View style={styles.demoCounterRow}>
              <AppText variant="micro" color={colors.accent}>
                {STRINGS.onboarding.demoSelected(
                  Math.min(demoSelectionIds.length, RESULT_SELECTION_COUNT),
                  RESULT_SELECTION_COUNT,
                )}
              </AppText>
              <View style={styles.demoCounterChips}>
                {resultTargets.map(item => (
                  <Animated.View
                    key={item.id}
                    entering={FadeInRight.duration(180)}
                    layout={LinearTransition.springify().damping(20).stiffness(180)}
                    style={[styles.demoCounterChip, { backgroundColor: `${item.accent}22` }]}>
                    <AppText variant="micro" color={item.accent}>
                      {item.label}
                    </AppText>
                  </Animated.View>
                ))}
              </View>
            </View>
            {activeDemoTarget ? (
              <Animated.View
                key={activeDemoTarget.id}
                entering={
                  reducedMotion
                    ? FadeInDown.duration(160)
                    : FadeInRight.springify()
                        .damping(SPRINGS.snappy.damping)
                        .stiffness(SPRINGS.snappy.stiffness)
                        .mass(SPRINGS.snappy.mass)
                }
                exiting={FadeOut.duration(100)}>
                <DemoSceneCard item={activeDemoTarget} colors={colors} />
                <GlassCard style={styles.demoDetailCard}>
                  <AppText variant="bodyStrong">{activeDemoTarget.title}</AppText>
                  <AppText variant="body" color={colors.textSecondary}>
                    {activeDemoTarget.detail}
                  </AppText>
                </GlassCard>
              </Animated.View>
            ) : (
              <Animated.View key="demo-ready" entering={FadeInDown.duration(160)}>
                <GlassCard style={styles.demoDetailCard}>
                  <AppText variant="bodyStrong">{STRINGS.onboarding.demoReadyTitle}</AppText>
                  <AppText variant="body" color={colors.textSecondary}>
                    {STRINGS.onboarding.demoReadyBody}
                  </AppText>
                </GlassCard>
              </Animated.View>
            )}
          </Animated.View>
        );
      case 'value':
        return (
          <Animated.View
            key={currentStep}
            entering={stepEntering}
            exiting={FadeOut.duration(120)}
            style={styles.stepBody}>
            <AppText style={styles.stepTitle}>{STRINGS.onboarding.valueTitle}</AppText>
            <AppText variant="body" color={colors.textSecondary} style={styles.stepLead}>
              {STRINGS.onboarding.valueLead}
            </AppText>
            <GlassCard style={styles.resultCard}>
              <View style={styles.resultHeader}>
                <View>
                  <AppText variant="micro" color={colors.accent}>
                    {STRINGS.onboarding.valueEyebrow}
                  </AppText>
                  <AppText style={styles.resultTitle}>{STRINGS.onboarding.valueCardTitle}</AppText>
                </View>
                <Image source={require('../assets/appIcon.png')} style={styles.resultIcon} />
              </View>
              <View style={styles.resultList}>
                {resultTargets.map(item => (
                  <Animated.View
                    key={item.id}
                    entering={FadeInRight.duration(180)}
                    layout={LinearTransition.springify().damping(20).stiffness(180)}
                    style={[styles.resultItem, { borderColor: `${colors.cardBorder}AA` }]}>
                    <View style={[styles.resultItemBadge, { backgroundColor: `${item.accent}22` }]}>
                      <AppText variant="micro" color={item.accent}>
                        {item.label}
                      </AppText>
                    </View>
                    <View style={styles.resultItemText}>
                      <AppText variant="bodyStrong">{item.title}</AppText>
                      <AppText variant="micro" color={colors.textSecondary}>
                        {item.subtitle}
                      </AppText>
                    </View>
                  </Animated.View>
                ))}
              </View>
            </GlassCard>

            <View style={styles.metricRow}>
              <GlassCard style={styles.metricCard}>
                <AppText variant="bodyStrong">{STRINGS.onboarding.valueMetricOnDeviceTitle}</AppText>
                <AppText variant="micro" color={colors.textSecondary}>
                  {STRINGS.onboarding.valueMetricOnDeviceBody}
                </AppText>
              </GlassCard>
              <GlassCard style={styles.metricCard}>
                <AppText variant="bodyStrong">{STRINGS.onboarding.valueMetricExportTitle}</AppText>
                <AppText variant="micro" color={colors.textSecondary}>
                  {STRINGS.onboarding.valueMetricExportBody}
                </AppText>
              </GlassCard>
            </View>
          </Animated.View>
        );
      case 'paywall':
        return (
          <Animated.View
            key={currentStep}
            entering={stepEntering}
            exiting={FadeOut.duration(120)}
            style={styles.stepBody}>
            <GlassCard style={styles.paywallCard}>
              <View style={styles.paywallTop}>
                <Image source={require('../assets/appIcon.png')} style={styles.paywallIcon} />
                <View style={styles.paywallHeadCopy}>
                  <AppText variant="micro" color={colors.accent}>
                    {STRINGS.onboarding.paywallEyebrow}
                  </AppText>
                  <AppText style={styles.stepTitle}>{STRINGS.onboarding.paywallTitle}</AppText>
                </View>
              </View>

              <AppText variant="body" color={colors.textSecondary} style={styles.stepLead}>
                {STRINGS.onboarding.paywallLead}
              </AppText>

              <View style={styles.paywallPriceWrap}>
                <AppText style={styles.priceTitle}>{STRINGS.onboarding.paywallTrialTitle}</AppText>
                <AppText variant="body" color={colors.textSecondary}>
                  {STRINGS.onboarding.paywallTrialPrice}
                </AppText>
              </View>

              <View style={styles.paywallFeatureList}>
                {PAYWALL_FEATURES.map(item => (
                  <View key={item} style={styles.paywallFeatureItem}>
                    <Check size={16} color={colors.success} />
                    <AppText variant="bodyStrong">{item}</AppText>
                  </View>
                ))}
              </View>

              <GlassCard style={styles.paywallReviewCard}>
                <View style={styles.starRow}>
                  {Array.from({ length: 5 }, (_, index) => (
                    <Star key={`paywall-star-${index}`} size={12} color="#FDBA74" fill="#FDBA74" />
                  ))}
                </View>
                <AppText variant="bodyStrong">{STRINGS.onboarding.paywallReviewTitle}</AppText>
                <AppText variant="micro" color={colors.textSecondary}>
                  {STRINGS.onboarding.paywallReviewBody}
                </AppText>
              </GlassCard>
            </GlassCard>
          </Animated.View>
        );
      default:
        return null;
    }
  };

  const renderFooter = () => {
    switch (currentStep) {
      case 'welcome':
        return (
          <BlurButton
            label={STRINGS.onboarding.footerWelcome}
            onPress={goNext}
            accessibilityLabel={STRINGS.onboarding.footerWelcome}
          />
        );
      case 'goal':
        return (
          <BlurButton
            label={STRINGS.onboarding.footerGoal}
            onPress={goNext}
            disabled={!goalId}
            accessibilityLabel={STRINGS.onboarding.footerGoal}
          />
        );
      case 'pains':
        return (
          <BlurButton
            label={STRINGS.onboarding.footerPains}
            onPress={goNext}
            accessibilityLabel={STRINGS.onboarding.footerPains}
          />
        );
      case 'proof':
        return (
          <BlurButton
            label={STRINGS.common.continue}
            onPress={goNext}
            accessibilityLabel={STRINGS.accessibility.continueAfterTestimonials}
          />
        );
      case 'statements':
        return (
          <View style={styles.dualFooter}>
            <BlurButton
              label={STRINGS.onboarding.footerNotReally}
              onPress={() => onSelectStatement(false)}
              accessibilityLabel={STRINGS.onboarding.footerNotReally}
              variant="secondary"
              style={styles.flexButton}
            />
            <BlurButton
              label={STRINGS.onboarding.footerThatIsMe}
              onPress={() => onSelectStatement(true)}
              accessibilityLabel={STRINGS.onboarding.footerThatIsMe}
              style={styles.flexButton}
            />
          </View>
        );
      case 'solution':
        return (
          <BlurButton
            label={STRINGS.onboarding.footerSolution}
            onPress={goNext}
            accessibilityLabel={STRINGS.onboarding.footerSolution}
          />
        );
      case 'preferences':
        return (
          <BlurButton
            label={STRINGS.onboarding.footerPreferences}
            onPress={goNext}
            accessibilityLabel={STRINGS.onboarding.footerPreferences}
          />
        );
      case 'permissions':
        return (
          <BlurButton
            label={STRINGS.onboarding.footerReady}
            onPress={goNext}
            accessibilityLabel={STRINGS.onboarding.footerReady}
          />
        );
      case 'processing':
        return null;
      case 'demo':
        return activeDemoTarget ? (
          <View style={styles.dualFooter}>
            <BlurButton
              label={STRINGS.onboarding.footerSkipThis}
              onPress={() => onSelectDemoTarget(false)}
              accessibilityLabel={STRINGS.onboarding.footerSkipThis}
              variant="secondary"
              style={styles.flexButton}
            />
            <BlurButton
              label={STRINGS.onboarding.footerBlurIt}
              onPress={() => onSelectDemoTarget(true)}
              accessibilityLabel={STRINGS.onboarding.footerBlurIt}
              style={styles.flexButton}
            />
          </View>
        ) : null;
      case 'value':
        return (
          <View style={styles.valueFooter}>
            <BlurButton
              label={STRINGS.onboarding.footerPlans}
              onPress={() => {
                navDirection.current = 'forward';
                setStepIndex(STEP_INDEX.paywall);
              }}
              accessibilityLabel={STRINGS.onboarding.footerPlans}
            />
            <BlurButton
              label={STRINGS.onboarding.footerShare}
              onPress={() => {
                shareSetup().catch(() => undefined);
              }}
              accessibilityLabel={STRINGS.onboarding.footerShare}
              variant="secondary"
            />
          </View>
        );
      case 'paywall':
        return (
          <View style={styles.valueFooter}>
            <BlurButton
              label={STRINGS.onboarding.footerStartTrial}
              onPress={() => finishOnboarding('trial')}
              accessibilityLabel={STRINGS.onboarding.footerStartTrial}
            />
            <BlurButton
              label={STRINGS.onboarding.footerContinueFree}
              onPress={() => finishOnboarding('free')}
              accessibilityLabel={STRINGS.onboarding.footerContinueFree}
              variant="secondary"
            />
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <GradientBackground>
      <View
        style={[
          styles.container,
          {
            paddingTop: insets.top + SPACING.sm,
            paddingBottom: Math.max(insets.bottom, SPACING.md),
          },
        ]}>
        <View style={styles.topBar}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={STRINGS.common.back}
            disabled={stepIndex === 0}
            onPress={goBack}
            style={[
              styles.backButton,
              { borderColor: colors.cardBorder, opacity: stepIndex === 0 ? 0.45 : 1 },
            ]}>
            <ChevronLeft size={18} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.progressWrap}>
            <AppText variant="micro" color={colors.textMuted}>
              {stepIndex + 1} / {TOTAL_STEPS}
            </AppText>
            <ProgressBar index={stepIndex} colors={colors} reducedMotion={reducedMotion} />
          </View>
        </View>

        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          {renderContent()}
        </ScrollView>

        <View style={styles.footer}>{renderFooter()}</View>
      </View>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: SPACING.md,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  progressWrap: {
    flex: 1,
    gap: SPACING.xs,
  },
  progressTrack: {
    height: 8,
    borderRadius: RADIUS.pill,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  progressFill: {
    height: '100%',
    borderRadius: RADIUS.pill,
  },
  scroll: {
    flex: 1,
    marginTop: SPACING.md,
  },
  scrollContent: {
    paddingBottom: SPACING.lg,
  },
  stepBody: {
    gap: SPACING.md,
  },
  heroCopy: {
    gap: SPACING.sm,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.pill,
  },
  heroTitle: {
    fontSize: 34,
    lineHeight: 38,
    fontWeight: '700',
  },
  heroBody: {
    maxWidth: 340,
  },
  previewShell: {
    overflow: 'hidden',
    ...SHADOWS.card,
  },
  previewGradient: {
    padding: SPACING.md,
    gap: SPACING.md,
  },
  previewTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
  },
  previewDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  previewCanvas: {
    height: 260,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewFace: {
    width: 92,
    height: 124,
    borderRadius: 46,
    borderWidth: 3,
  },
  previewPlate: {
    position: 'absolute',
    bottom: 42,
    width: 110,
    height: 32,
    borderRadius: 12,
    borderWidth: 3,
  },
  previewBadgeFloat: {
    position: 'absolute',
    top: 24,
    right: 18,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
  },
  previewTimeline: {
    gap: SPACING.sm,
  },
  timelineBar: {
    height: 6,
    borderRadius: RADIUS.pill,
    overflow: 'hidden',
  },
  timelineFill: {
    width: '58%',
    height: '100%',
    borderRadius: RADIUS.pill,
  },
  timelineChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  timelineChip: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
  },
  metricStrip: {
    gap: SPACING.sm,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  stepTitle: {
    fontSize: 30,
    lineHeight: 34,
    fontWeight: '700',
  },
  stepLead: {
    marginTop: -4,
  },
  cardList: {
    gap: SPACING.sm,
  },
  selectionCard: {
    padding: SPACING.md,
  },
  selectionCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  selectionEmojiWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectionEmoji: {
    fontSize: 22,
  },
  selectionTextWrap: {
    flex: 1,
    gap: 2,
  },
  checkPill: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  testimonialCard: {
    gap: SPACING.sm,
  },
  testimonialHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  personaPill: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
  },
  starRow: {
    flexDirection: 'row',
    gap: 2,
  },
  statementCard: {
    minHeight: 280,
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  statementQuote: {
    fontSize: 30,
    lineHeight: 38,
    fontWeight: '600',
  },
  statementDots: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  statementDot: {
    flex: 1,
    height: 6,
    borderRadius: RADIUS.pill,
  },
  solutionCard: {
    gap: SPACING.xs,
  },
  comparisonCard: {
    gap: SPACING.sm,
  },
  comparisonTitle: {
    fontSize: 18,
    lineHeight: 24,
  },
  comparisonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  comparisonHeaderRight: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  comparisonRow: {
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    gap: SPACING.xs,
  },
  comparisonLabel: {
    fontWeight: '600',
  },
  comparisonValues: {
    gap: SPACING.xs,
  },
  comparisonValueWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    justifyContent: 'space-between',
    alignItems: 'stretch',
  },
  preferenceSummaryCard: {
    gap: SPACING.sm,
    paddingVertical: SPACING.sm,
  },
  preferenceSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  preferenceSummaryCopy: {
    flex: 1,
    gap: 2,
    minHeight: 56,
  },
  preferenceCountPill: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
  },
  preferenceHintRow: {
    gap: SPACING.xs,
  },
  preferenceHintChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  preferenceHintChip: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
  },
  preferenceCard: {
    minHeight: 188,
    padding: SPACING.sm,
    gap: SPACING.xs,
    justifyContent: 'space-between',
  },
  preferenceCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  preferenceIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  preferenceSelectPill: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  preferenceEmoji: {
    fontSize: 24,
  },
  preferenceTextBlock: {
    gap: 2,
  },
  preferenceTitle: {
    lineHeight: 21,
  },
  preferenceBody: {
    lineHeight: 18,
  },
  preferenceFooter: {
    paddingTop: SPACING.xs,
  },
  permissionCard: {
    gap: SPACING.md,
  },
  permissionIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionBulletList: {
    gap: SPACING.sm,
  },
  permissionBullet: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  processingStep: {
    minHeight: 540,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.md,
  },
  processingWrap: {
    paddingVertical: SPACING.sm,
  },
  processingRingOuter: {
    width: 142,
    height: 142,
    borderRadius: 71,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  processingRingMid: {
    width: 108,
    height: 108,
    borderRadius: 54,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  processingRingInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  processingLead: {
    textAlign: 'center',
    maxWidth: 280,
  },
  processingCard: {
    width: '100%',
    gap: SPACING.sm,
  },
  processingChecklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  demoCounterRow: {
    gap: SPACING.sm,
  },
  demoCounterChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  demoCounterChip: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
  },
  demoCard: {
    overflow: 'hidden',
    ...SHADOWS.card,
  },
  demoGradient: {
    padding: SPACING.md,
    gap: SPACING.lg,
    minHeight: 340,
  },
  demoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  demoTag: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
  },
  demoStage: {
    flex: 1,
    borderRadius: RADIUS.card,
    backgroundColor: 'rgba(15, 23, 42, 0.22)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.md,
  },
  demoSubject: {
    width: 118,
    height: 180,
    borderRadius: 36,
  },
  demoBlurTarget: {
    position: 'absolute',
    width: 116,
    height: 44,
    borderRadius: 16,
    borderWidth: 3,
    bottom: 82,
  },
  demoCaption: {
    position: 'absolute',
    left: SPACING.md,
    right: SPACING.md,
    bottom: SPACING.md,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.card,
  },
  demoDetailCard: {
    gap: SPACING.xs,
  },
  resultCard: {
    gap: SPACING.md,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  resultTitle: {
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '700',
  },
  resultIcon: {
    width: 58,
    height: 58,
    borderRadius: 18,
  },
  resultList: {
    gap: SPACING.sm,
  },
  resultItem: {
    borderWidth: 1,
    borderRadius: RADIUS.card,
    padding: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  resultItemBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
  },
  resultItemText: {
    flex: 1,
    gap: 2,
  },
  metricRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  metricCard: {
    flex: 1,
    gap: SPACING.xs,
  },
  paywallCard: {
    gap: SPACING.md,
  },
  paywallTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
  },
  paywallIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
  },
  paywallHeadCopy: {
    flex: 1,
    gap: SPACING.xs,
  },
  paywallPriceWrap: {
    gap: 2,
  },
  priceTitle: {
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '700',
  },
  paywallFeatureList: {
    gap: SPACING.sm,
  },
  paywallFeatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  paywallReviewCard: {
    gap: SPACING.xs,
  },
  footer: {
    paddingTop: SPACING.sm,
  },
  dualFooter: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  flexButton: {
    flex: 1,
  },
  valueFooter: {
    gap: SPACING.sm,
  },
});
