This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

Use `bunx` instead of `npx` if the project uses bun (`bun.lock` present).

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
npx expo lint               # lint
npx tsc --noEmit            # typecheck
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

Run lint and typecheck before declaring any task done.

## Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `src/app/` — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `src/app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: https://docs.expo.dev/router/introduction.md

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md

## This project: Parks

- Spec: `spec.txt`. Product rules: `docs/DECISIONS.md` (no admins, 2-confirm / 2-reject, 250 m proximity, ...). Ask the user before changing any of them.
- Android only. The app runs in an EAS development build, not Expo Go. A new native dependency or config plugin means a new `eas build --profile development --platform android`.
- Design system: tokens in `src/theme` come from https://claude.ai/artifact/PkYEXEUpE6nkx4rNFAeNiT. Dark theme only. Build UI from `src/components` (`Text`, `Button`, `IconButton`, `Chip`, `OptionRow`, `TextField`, `EmptyState`) and theme roles; never hardcode colors, font sizes or spacing in screens. Icons: `lucide-react-native`.
- Database: never edit an applied migration; add a new file in `supabase/migrations`. API roles are read-only; every write is a security definer RPC that enforces sign-in, proximity and voting rules. After a schema change, update `src/lib/database.types.ts` (`npm run db:types` once the project is linked).
- Data access goes through TanStack Query hooks in `src/data`.
