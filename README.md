# Parks

Android app for finding calisthenics parks nearby. Users add parks and keep them up to date; other users nearby confirm every change. See [docs/DECISIONS.md](docs/DECISIONS.md) for the product rules.

Stack: Expo SDK 57 (React Native, TypeScript, Expo Router) · Supabase (Postgres + PostGIS, Auth, Storage) · Google Maps (`react-native-maps`) · TanStack Query · Lucide icons.

## Status

| Built | Placeholder (not built yet) |
| --- | --- |
| Map with Google Maps dark style, user location, verified/unverified markers | Sign-in with email (one-time code, email + password) |
| Filters: equipment, amenities, minimum rating, verified only | Write a review, upload photos |
| Park details: equipment and condition, amenities, ratings, reviews, photos, directions | Suggest an edit / removal, confirm or reject changes |
| Contribute hub: parks you can contribute to near you | Notifications |
| Add a park: pin within your range, name picked from address suggestions, description, equipment and condition, amenities | |
| Settings: account, distance units, about | |
| Sign-in with Google (native account picker) | |
| Database schema, rules and storage (`supabase/migrations`) | |

## Setup

You need Node.js (an LTS release is safest; v24 is a good choice), an Expo account, an Android phone, a Supabase project and a Google Cloud project.

### 1. Install

```bash
npm install
```

### 2. Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Link it and apply the schema (the project ref is in the dashboard URL):
   ```bash
   npx supabase login
   npx supabase link --project-ref <project-ref>
   npm run db:push
   ```
3. Copy `.env.example` to `.env` and fill in the project URL and publishable key (Project Settings → API).
4. Regenerate the database types from the live schema:
   ```bash
   npm run db:types
   ```
5. Optional: to see sample parks on the map without adding them one by one, set your coordinates at the top of `supabase/seed.sql` and run it in the SQL editor.

### 3. App identity

The Android package is `com.aguspignal.parks` (`app.json`, `android.package`). The Google Maps key and Google sign-in are tied to it, so don't change it.

### 4. Google Maps key

1. In the Google Cloud console, enable **Maps SDK for Android** and create an API key (the project needs billing enabled; Android map loads are free).
2. Store it as an EAS environment variable; `app.config.ts` reads it at build time:
   ```bash
   eas env:set --name GOOGLE_MAPS_ANDROID_API_KEY --value <key> --visibility sensitive --environment development --environment preview --environment production
   ```
3. After the first build (step 6), restrict the key to Android apps: your package name plus the SHA-1 fingerprint that `eas credentials -p android` shows.

### 5. Google sign-in

The app gets a Google ID token with `@react-native-google-signin/google-signin` and passes it to `supabase.auth.signInWithIdToken`. The library's config plugin only changes iOS, so it is not in `app.json`.

1. Google Cloud console → Google Auth Platform: set up branding and audience (External; add test users while the app is in Testing). Check that the `openid`, `userinfo.email` and `userinfo.profile` scopes are there.
2. Create two OAuth clients:
   - **Web application**, with the redirect URI `https://<project-ref>.supabase.co/auth/v1/callback`.
   - **Android**, with package `com.aguspignal.parks` and the SHA-1 from `eas credentials -p android`. When you publish, add another Android client for the Play Store signing SHA-1.
3. Supabase dashboard → Authentication → Providers → Google: enable it. Set **Client IDs** to `<web client ID>,<android client ID>` (web first) and **Client secret** to the web client's secret.
4. Put the web client ID in `.env` as `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`.

The downloaded `client_secret*.json` files are ignored by git. The client secret goes in Supabase only, never in the app.

For preview and production builds, set the three `EXPO_PUBLIC_*` values from `.env` as EAS environment variables too: EAS doesn't upload `.env`.

### 6. Development build

```bash
eas init
eas build --profile development --platform android
```

Install the APK on the phone from the link EAS prints. Because `app.config.ts` exists, `eas init` may ask you to add the project ID yourself: put it in `app.json` under `expo.extra.eas.projectId`.

Rebuild only when native dependencies or `app.json` plugins change; JavaScript changes load from the dev server.

### 7. Run

```bash
npm start
```

Open the Parks dev build on the phone and connect to the dev server (same Wi-Fi, or scan the QR code).

## Scripts

| Script | What it does |
| --- | --- |
| `npm start` | Dev server for the development build |
| `npm run lint` | ESLint (Expo config) |
| `npm run typecheck` | TypeScript |
| `npm run db:push` | Apply `supabase/migrations` to the linked project |
| `npm run db:types` | Regenerate `src/lib/database.types.ts` from the linked project |

## Project structure

```
src/
  app/          Routes only (Expo Router): map, park/[id], contribute, settings, sign-in
  screens/      Screen bodies and their private components
  components/   Shared UI: Text, Button, IconButton, Chip, OptionRow, TextField, EmptyState, RequireAuth
  data/         TanStack Query hooks over Supabase
  hooks/        useUserLocation
  lib/          Supabase client, query client, database types
  providers/    Auth session, device preferences
  theme/        Design system tokens and the map style
  utils/        Geo helpers
supabase/
  migrations/   Schema, row level security, rules (RPCs), storage bucket
  seed.sql      Optional sample parks
```

## Design system

Tokens come from the Parks design system ([artifact](https://claude.ai/artifact/PkYEXEUpE6nkx4rNFAeNiT)) and live in `src/theme`. The app is dark only, so the palette maps to roles in `src/theme/colors.ts` (`background`, `surface`, `text`, `accent`, ...). Use the roles and the `Text` variants (`title`, `subtitles`, `text_bold`, `text`, `notes`, `caption`); never hardcode colors, font sizes or spacing in screens.

Contrast notes: text on the orange accent must be `onAccent` (black); red (`danger`) is for icons and large text only.

## Database rules

API roles can only read. All writes go through security definer functions in the first migration, which check sign-in, distance to the park and voting rules:

`create_park`, `propose_park_edit`, `propose_park_removal`, `vote_on_submission`, `upsert_review`, `add_park_photo`, `report_content`, `delete_account`. Reads: `parks_in_view`, `nearby_parks`, and the tables.

Errors use HTTP-style codes (`PT401`, `PT403`, `PT404`, `PT409`, `PT400`) with a message that can be shown to the user.
