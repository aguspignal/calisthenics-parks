# Decisions

Product and technical decisions made when the project started (2026-10-13). Change them deliberately: most are enforced by the database (`supabase/migrations`).

## Product rules

| Topic | Decision |
| --- | --- |
| Platform | Android only. |
| Accounts | Anyone can browse the map and park details. Adding, editing, confirming, reviewing and uploading photos need an account. |
| Sign-in methods | Google, email one-time code, email + password. |
| Moderation | No admins. New parks, edits and removals are **pending** until other users decide: **2 confirmations** approve, **2 rejections** discard. The author can't vote on their own change. |
| Proximity | Adding, editing, confirming, reviewing and uploading photos require being within **250 m** of the park. The app sends the device location and the server checks it. This stops casual abuse, not GPS spoofing. |
| Unverified parks | Shown on the map with a grey marker so nearby users can find and confirm them. They stay pending until decided (no expiry). |
| Reviews and photos | Only from within 250 m. Publish immediately. Each user has one review per park (editable). Other users can report a review or photo; **3 reports** hide it. |
| Ratings | A review rates **Overall, Equipment quality, Environment, Cleanliness, Safety** (1–5, all required) plus optional text and photos. Parks show the averages. |
| Equipment quality | Each piece of equipment also has a condition: good / worn / broken, changed through the confirmed-edit flow. |
| Removal | A park that no longer exists is removed through the same confirm flow ("propose removal"). |
| Duplicates | A new park within 30 m of a visible park is refused. |
| Theme | Dark only, from the design system tokens. |
| Language | English only; strings are inline for now. |
| Settings | Account (sign in/out, delete account), distance units (km/mi), notifications (placeholder), about & legal. |

Thresholds live in the `app_settings` table (`confirmations_required`, `rejections_required`, `proximity_meters`, `duplicate_radius_meters`, `report_hide_threshold`) and can change without an app release.

The equipment and amenity lists in the first migration are a proposal; change them with a new migration.

## Technical choices

| Topic | Choice | Why |
| --- | --- | --- |
| App | Expo SDK 57, TypeScript, Expo Router, React Compiler | Spec; current SDK. |
| Builds | EAS development builds (APK) on a physical phone | No local Android SDK; Google Maps and other native modules need a dev build. |
| Map | Google Maps via `react-native-maps`, dark JSON style | Mature, satellite imagery for placing parks; needs an API key. |
| Backend | Supabase: Postgres + PostGIS, Auth, Storage | Spec. |
| Writes | Security definer RPCs (`create_park`, `vote_on_submission`, ...) | Proximity and voting rules must be enforced server-side; tables are read-only for API roles. |
| Data fetching | TanStack Query | Caching, loading and error states. |
| Icons | Lucide (`lucide-react-native`) | Minimal line icons; the design system has none. |
| Sheets and switches | `@expo/ui` (native Compose) | Native behavior; content inside sheets is styled with the design tokens. |
| Session storage | `expo-sqlite` localStorage | Expo's recommended Supabase setup. |
| Font | Inter (400/600/700) embedded with the `expo-font` config plugin | Design system font; no runtime loading. |
