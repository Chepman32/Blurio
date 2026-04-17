import { useStrings } from '../constants';
import type { RegionType } from '../types';

export type OnboardingStepKey =
  | 'welcome'
  | 'goal'
  | 'pains'
  | 'proof'
  | 'statements'
  | 'solution'
  | 'preferences'
  | 'processing';

export interface OnboardingChoice {
  id: string;
  emoji: string;
  title: string;
  body: string;
  accent: string;
  goalPhrase?: string;
}

export interface OnboardingTestimonial {
  id: string;
  name: string;
  persona: string;
  quote: string;
}

export interface OnboardingStatement {
  id: string;
  quote: string;
}

export interface PersonalizedSolutionItem {
  id: string;
  eyebrow: string;
  headline: string;
  detail: string;
}

export interface DemoTarget {
  id: string;
  title: string;
  subtitle: string;
  label: string;
  detail: string;
  accent: string;
  regionType: RegionType;
}

export const ONBOARDING_STEPS: OnboardingStepKey[] = [
  'welcome',
  'goal',
  'pains',
  'proof',
  'statements',
  'solution',
  'preferences',
  'processing',
];

const GOAL_EMOJIS: Record<string, string> = {
  'faces-fast': '😶',
  'cover-plates': '🚗',
  'protect-family': '👨‍👩‍👧',
  'client-footage': '🎬',
  'stay-offline': '🔒',
  'ship-faster': '⚡',
};

const GOAL_ACCENTS: Record<string, string> = {
  'faces-fast': '#56CFE1',
  'cover-plates': '#4EA8DE',
  'protect-family': '#50C878',
  'client-footage': '#F4A259',
  'stay-offline': '#A78BFA',
  'ship-faster': '#F25F5C',
};

const PAIN_EMOJIS: Record<string, string> = {
  'cloud-risk': '☁️',
  'too-slow': '⏱️',
  'too-complex': '🧩',
  'miss-detail': '🫣',
  'quality-loss': '🎞️',
  'mobile-workflow': '📱',
};

const PAIN_ACCENTS: Record<string, string> = {
  'cloud-risk': '#A78BFA',
  'too-slow': '#F4A259',
  'too-complex': '#56CFE1',
  'miss-detail': '#F25F5C',
  'quality-loss': '#4EA8DE',
  'mobile-workflow': '#50C878',
};

const PREFERENCE_EMOJIS: Record<string, string> = {
  face: '🙂',
  plate: '🚘',
  address: '🏠',
  badge: '🪪',
  document: '📄',
  tattoo: '✍️',
};

const PREFERENCE_ACCENTS: Record<string, string> = {
  face: '#56CFE1',
  plate: '#4EA8DE',
  address: '#50C878',
  badge: '#F4A259',
  document: '#A78BFA',
  tattoo: '#F25F5C',
};

export const DEFAULT_SOLUTION_ORDER = [
  'cloud-risk',
  'too-slow',
  'miss-detail',
  'quality-loss',
] as const;

const DEMO_ACCENTS: Record<string, string> = {
  face: '#56CFE1',
  plate: '#4EA8DE',
  address: '#50C878',
  badge: '#F4A259',
  document: '#A78BFA',
  tattoo: '#F25F5C',
};

const DEMO_REGION_TYPES: Record<string, RegionType> = {
  face: 'face',
  plate: 'plate',
  address: 'roundedRect',
  badge: 'rectangle',
  document: 'rectangle',
  tattoo: 'ellipse',
};

export const useOnboardingContent = () => {
  const STRINGS = useStrings();

  const onboardingGoals: OnboardingChoice[] = STRINGS.onboardingContent.goals.map(item => ({
    ...item,
    emoji: GOAL_EMOJIS[item.id] ?? '✨',
    accent: GOAL_ACCENTS[item.id] ?? '#56CFE1',
  }));

  const onboardingPainPoints: OnboardingChoice[] = STRINGS.onboardingContent.pains.map(item => ({
    ...item,
    emoji: PAIN_EMOJIS[item.id] ?? '✨',
    accent: PAIN_ACCENTS[item.id] ?? '#56CFE1',
  }));

  const onboardingPreferences: OnboardingChoice[] =
    STRINGS.onboardingContent.preferences.map(item => ({
      ...item,
      emoji: PREFERENCE_EMOJIS[item.id] ?? '✨',
      accent: PREFERENCE_ACCENTS[item.id] ?? '#56CFE1',
    }));

  const demoTargets: DemoTarget[] = STRINGS.onboardingContent.demoTargets.map(item => ({
    ...item,
    accent: DEMO_ACCENTS[item.id] ?? '#56CFE1',
    regionType: DEMO_REGION_TYPES[item.id] ?? 'rectangle',
  }));

  return {
    onboardingGoals,
    onboardingPainPoints,
    onboardingTestimonials: STRINGS.onboardingContent.testimonials,
    onboardingStatements: STRINGS.onboardingContent.statements,
    onboardingPreferences,
    personalizedSolutions: STRINGS.onboardingContent.solutions,
    demoTargets,
    paywallFeatures: STRINGS.onboardingContent.paywallFeatures,
    comparisonRows: STRINGS.onboardingContent.comparisonRows,
  };
};
