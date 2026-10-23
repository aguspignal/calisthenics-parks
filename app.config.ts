import type { ConfigContext, ExpoConfig } from 'expo/config';

// Static config lives in app.json; this file only adds values that come from the environment.
// GOOGLE_MAPS_ANDROID_API_KEY is an EAS environment variable (see README), read at build time.
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: config.name ?? 'Parks',
  slug: config.slug ?? 'parks',
  plugins: [
    ...(config.plugins ?? []),
    ['react-native-maps', { androidGoogleMapsApiKey: process.env.GOOGLE_MAPS_ANDROID_API_KEY }],
  ],
});
