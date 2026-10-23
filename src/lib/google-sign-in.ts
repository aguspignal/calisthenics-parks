import {
  GoogleSignin,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from '@react-native-google-signin/google-signin';

import { getSupabase } from './supabase';

const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

/** False until `.env` has the Google web client ID (see README). */
export const isGoogleSignInConfigured = Boolean(webClientId);

if (webClientId) {
  // The web client ID makes Google return an ID token that Supabase can verify.
  GoogleSignin.configure({ webClientId });
}

/** Opens the Google account picker and signs in to Supabase. Resolves false if the user closes the picker. */
export async function signInWithGoogle(): Promise<boolean> {
  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const response = await GoogleSignin.signIn();
    if (!isSuccessResponse(response)) return false;

    const { idToken } = response.data;
    if (!idToken) throw new Error('Google did not return an ID token.');

    const { error } = await getSupabase().auth.signInWithIdToken({ provider: 'google', token: idToken });
    if (error) {
      // Show the account picker again on the next attempt.
      await signOutOfGoogle();
      throw error;
    }
    return true;
  } catch (error) {
    if (isErrorWithCode(error)) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED || error.code === statusCodes.IN_PROGRESS) return false;
      if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        throw new Error('Google Play services is missing or out of date on this device.');
      }
    }
    throw error;
  }
}

/** Forgets the Google account on the device, so the next sign-in shows the account picker. */
export async function signOutOfGoogle() {
  if (!isGoogleSignInConfigured) return;
  await GoogleSignin.signOut().catch(() => {});
}
