# Blurio Onboarding Blueprint

## Recall Status

- App profile: recovered from codebase
- User transformation: drafted from the current feature set
- Blueprint: implemented
- Screen content: implemented
- Implementation: built and wired into first launch

## App Profile

- Product: React Native mobile app for privacy-safe video edits
- Core loop: import a video, place blur regions, preview live, export a cleaned version
- Aha moment: the user sees a face, plate, or address hidden before the clip leaves the device
- Audience assumption: creators, parents, freelancers, and privacy-conscious users who need quick mobile edits
- Paywall status: no subscription backend in code yet
- Permissions detected: iOS Photos read/save access; no notification, camera, location, or sign-in flow detected

## Transformation

- Before: the user has a clip they want to share, but it contains faces, plates, addresses, or badges. Existing tools feel too heavy, too slow, or too cloud-dependent for a simple privacy fix.
- After: the user can make a clip share-safe directly on their phone, keep raw footage local, and export with confidence.

## Benefit Statements

1. Keep raw footage on-device instead of handing private clips to a cloud-first editor.
2. Turn a privacy fix into a short mobile workflow instead of a full editing session.
3. Check faces, plates, and other details before export so one missed frame does not slip through.
4. Keep control over resolution, codec, and audio when the final video is saved.

## Implemented Flow

1. Welcome: show the transformation and a mock editor preview inspired by Blurio’s timeline/canvas UI.
2. Goal question: ask what the user wants to protect first.
3. Pain points: surface the reasons privacy edits feel frustrating.
4. Social proof: placeholder testimonials matched to Blurio’s audience assumptions.
5. Pain amplification: interactive quote cards to deepen identification.
6. Personalized solution: map selected pain points to specific Blurio strengths.
7. Comparison table: embedded with the solution screen to keep the flow tight.
8. Preference configuration: choose the blur presets to prioritize in the demo.
9. Permission primer: explain Photos access before the first real import/export.
10. Processing moment: short anticipation screen.
11. App demo: pick three details to blur in a simplified first-use interaction.
12. Value delivery: reveal a shareable starter pack based on those demo choices.
13. Paywall: polished placeholder with trial pricing and CTA copy, ready for purchase SDK wiring.

## Skipped Screens

- Account creation: skipped because the current app has no auth flow.
- Separate comparison step: merged into the personalized solution screen to avoid bloating the flow.

## Implementation Files

- `src/screens/OnboardingScreen.tsx`
- `src/onboarding/content.ts`
- `src/navigation/RootNavigator.tsx`
- `src/screens/SplashScreen.tsx`
- `src/store/editorStore.ts`
- `src/utils/storage.ts`
- `src/constants/defaults.ts`
- `src/types/domain.ts`
