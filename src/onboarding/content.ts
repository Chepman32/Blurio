import type { RegionType } from '../types';

export type OnboardingStepKey =
  | 'welcome'
  | 'goal'
  | 'pains'
  | 'proof'
  | 'statements'
  | 'solution'
  | 'preferences'
  | 'permissions'
  | 'processing'
  | 'demo'
  | 'value'
  | 'paywall';

export interface OnboardingChoice {
  id: string;
  emoji: string;
  title: string;
  body: string;
  accent: string;
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
  'permissions',
  'processing',
  'demo',
  'value',
  'paywall',
];

export const ONBOARDING_GOALS: OnboardingChoice[] = [
  {
    id: 'faces-fast',
    emoji: '😶',
    title: 'Hide faces fast',
    body: 'Make people unrecognizable before a clip ever leaves your phone.',
    accent: '#56CFE1',
  },
  {
    id: 'cover-plates',
    emoji: '🚗',
    title: 'Cover plates and street details',
    body: 'Blur car plates, building numbers, and other identifiers in one pass.',
    accent: '#4EA8DE',
  },
  {
    id: 'protect-family',
    emoji: '👨‍👩‍👧',
    title: 'Protect family footage',
    body: 'Keep kids, homes, and everyday moments private before sharing.',
    accent: '#50C878',
  },
  {
    id: 'client-footage',
    emoji: '🎬',
    title: 'Clean up client clips on the go',
    body: 'Handle fast privacy edits without opening a desktop editor.',
    accent: '#F4A259',
  },
  {
    id: 'stay-offline',
    emoji: '🔒',
    title: 'Keep raw footage offline',
    body: 'Avoid sending sensitive videos to cloud-first tools.',
    accent: '#A78BFA',
  },
  {
    id: 'ship-faster',
    emoji: '⚡',
    title: 'Get to export quicker',
    body: 'Turn a privacy fix into a short mobile workflow instead of a full session.',
    accent: '#F25F5C',
  },
];

export const ONBOARDING_PAIN_POINTS: OnboardingChoice[] = [
  {
    id: 'cloud-risk',
    emoji: '☁️',
    title: 'I do not want to upload private footage',
    body: 'Cloud tools feel wrong for raw videos with faces, plates, or addresses.',
    accent: '#A78BFA',
  },
  {
    id: 'too-slow',
    emoji: '⏱️',
    title: 'Frame-by-frame edits take too long',
    body: 'A quick privacy fix turns into a full editing session.',
    accent: '#F4A259',
  },
  {
    id: 'too-complex',
    emoji: '🧩',
    title: 'Most editors feel heavier than I need',
    body: 'I only want the privacy tools, not an entire post-production workflow.',
    accent: '#56CFE1',
  },
  {
    id: 'miss-detail',
    emoji: '🫣',
    title: 'I am worried I will miss one detail',
    body: 'One plate, badge, or face slipping through is enough to ruin the post.',
    accent: '#F25F5C',
  },
  {
    id: 'quality-loss',
    emoji: '🎞️',
    title: 'Other apps wreck quality or exports',
    body: 'I still want control over resolution, codec, and audio.',
    accent: '#4EA8DE',
  },
  {
    id: 'mobile-workflow',
    emoji: '📱',
    title: 'I need to finish edits on my phone',
    body: 'The fix has to happen wherever I am, not later at a desk.',
    accent: '#50C878',
  },
];

export const ONBOARDING_TESTIMONIALS: OnboardingTestimonial[] = [
  {
    id: 'parent',
    name: 'Mila K.',
    persona: 'Family creator',
    quote:
      'Placeholder review: I can hide kids and house details before I post, and I never have to send the raw clip anywhere.',
  },
  {
    id: 'rideshare',
    name: 'Dante R.',
    persona: 'Street videographer',
    quote:
      'Placeholder review: Blurio makes number plates and background faces feel like a 30-second fix instead of a desktop job.',
  },
  {
    id: 'freelance',
    name: 'Noah P.',
    persona: 'Freelance editor',
    quote:
      'Placeholder review: When a client needs a quick privacy pass, I can handle it from my phone and still export cleanly.',
  },
];

export const ONBOARDING_STATEMENTS: OnboardingStatement[] = [
  {
    id: 'delay-posting',
    quote: 'I delay posting because I still need to hide something personal in the frame.',
  },
  {
    id: 'zoom-check',
    quote: 'I zoom in again and again because I am afraid I missed a face, plate, or address.',
  },
  {
    id: 'privacy-tools',
    quote: 'Sending private footage to an online editor feels like the opposite of privacy.',
  },
  {
    id: 'overkill',
    quote: 'Most editing apps turn a tiny privacy fix into a whole project.',
  },
];

export const ONBOARDING_PREFERENCES: OnboardingChoice[] = [
  {
    id: 'face',
    emoji: '🙂',
    title: 'Faces',
    body: 'People in the foreground, crowds, and accidental passersby.',
    accent: '#56CFE1',
  },
  {
    id: 'plate',
    emoji: '🚘',
    title: 'License plates',
    body: 'Cars, motorcycles, and anything parked in the background.',
    accent: '#4EA8DE',
  },
  {
    id: 'address',
    emoji: '🏠',
    title: 'Street numbers',
    body: 'House numbers, mailboxes, building names, and doors.',
    accent: '#50C878',
  },
  {
    id: 'badge',
    emoji: '🪪',
    title: 'Badges and IDs',
    body: 'Work tags, access cards, and visible credentials.',
    accent: '#F4A259',
  },
  {
    id: 'document',
    emoji: '📄',
    title: 'Documents and screens',
    body: 'Paperwork, monitors, receipts, and anything readable.',
    accent: '#A78BFA',
  },
  {
    id: 'tattoo',
    emoji: '✍️',
    title: 'Distinctive marks',
    body: 'Tattoos, logos, uniforms, and recognizable details.',
    accent: '#F25F5C',
  },
];

export const PERSONALIZED_SOLUTIONS: Record<string, PersonalizedSolutionItem> = {
  'cloud-risk': {
    id: 'cloud-risk',
    eyebrow: 'Need more privacy?',
    headline: 'Keep the whole workflow on-device from import to export.',
    detail: 'Blurio is built for local edits, so your raw clip does not need a cloud handoff.',
  },
  'too-slow': {
    id: 'too-slow',
    eyebrow: 'Need more speed?',
    headline: 'Create a blur region and see it working before you leave the screen.',
    detail: 'The live preview trims the back-and-forth that makes privacy fixes drag on.',
  },
  'too-complex': {
    id: 'too-complex',
    eyebrow: 'Need less friction?',
    headline: 'Open one video, place the blur, and keep moving.',
    detail: 'The workflow stays focused on privacy edits instead of full production controls.',
  },
  'miss-detail': {
    id: 'miss-detail',
    eyebrow: 'Need more confidence?',
    headline: 'Stack multiple blur regions and scrub the timeline before export.',
    detail: 'You can check the exact frame where a face, plate, or badge appears.',
  },
  'quality-loss': {
    id: 'quality-loss',
    eyebrow: 'Need cleaner output?',
    headline: 'Tune export quality before you save the final clip.',
    detail: 'Resolution, frame rate, codec, and audio settings stay under your control.',
  },
  'mobile-workflow': {
    id: 'mobile-workflow',
    eyebrow: 'Need it done on the go?',
    headline: 'Handle a privacy edit from the same phone you filmed with.',
    detail: 'Import from Photos, blur what matters, and save the cleaned version back out.',
  },
};

export const DEFAULT_SOLUTION_ORDER = [
  'cloud-risk',
  'too-slow',
  'miss-detail',
  'quality-loss',
] as const;

export const DEMO_TARGETS: DemoTarget[] = [
  {
    id: 'face',
    title: 'Busy sidewalk selfie',
    subtitle: 'Blur the bystander before you share the moment.',
    label: 'Face blur',
    detail: 'Tap to hide the stranger in the background with a soft privacy mask.',
    accent: '#56CFE1',
    regionType: 'face',
  },
  {
    id: 'plate',
    title: 'Street reel with parked cars',
    subtitle: 'Cover the visible plate before the post goes live.',
    label: 'Plate blur',
    detail: 'Use a plate-safe region so the scene still reads cleanly after export.',
    accent: '#4EA8DE',
    regionType: 'plate',
  },
  {
    id: 'address',
    title: 'Front door delivery clip',
    subtitle: 'Hide the building number in one quick pass.',
    label: 'Address blur',
    detail: 'Drop a rounded blur over the number so the location stays private.',
    accent: '#50C878',
    regionType: 'roundedRect',
  },
  {
    id: 'badge',
    title: 'Backstage team update',
    subtitle: 'Blur the access badge without re-editing the whole video.',
    label: 'Badge blur',
    detail: 'Mask the credential while keeping the rest of the shot untouched.',
    accent: '#F4A259',
    regionType: 'rectangle',
  },
  {
    id: 'document',
    title: 'Desk clip with paperwork',
    subtitle: 'Hide the readable details before the clip leaves your phone.',
    label: 'Document blur',
    detail: 'Protect names and numbers without rebuilding the entire scene.',
    accent: '#A78BFA',
    regionType: 'rectangle',
  },
  {
    id: 'tattoo',
    title: 'Behind-the-scenes portrait',
    subtitle: 'Soften a distinctive mark that could identify the subject.',
    label: 'Detail blur',
    detail: 'Keep the shot usable while removing one identifying element.',
    accent: '#F25F5C',
    regionType: 'ellipse',
  },
];

export const PAYWALL_FEATURES = [
  'Unlimited privacy edits and project history',
  'Reusable blur templates for the details you hide most',
  'Future pro blur tools and faster export presets',
];

export const COMPARISON_ROWS = [
  {
    id: 'privacy',
    label: 'Raw footage stays private',
    withApp: 'On-device workflow',
    withoutApp: 'Often needs cloud upload',
  },
  {
    id: 'speed',
    label: 'Quick phone-first fix',
    withApp: 'Focused privacy workflow',
    withoutApp: 'Full editor overhead',
  },
  {
    id: 'confidence',
    label: 'Check every sensitive detail',
    withApp: 'Timeline scrub + stacked regions',
    withoutApp: 'Easy to miss one frame',
  },
];
