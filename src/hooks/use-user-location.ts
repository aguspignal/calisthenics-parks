import * as Location from 'expo-location';
import { useCallback } from 'react';
import { Alert, Linking } from 'react-native';

export type Coordinates = { latitude: number; longitude: number };

/**
 * Foreground location. `getLocation` asks for permission when needed and returns null when
 * the user declines (pointing them to Settings if Android won't ask again).
 */
export function useUserLocation() {
  const [permission, requestPermission] = Location.useForegroundPermissions();

  const getLocation = useCallback(
    async ({ explainDenial = true }: { explainDenial?: boolean } = {}): Promise<Coordinates | null> => {
      let current = permission;
      if (!current?.granted) {
        current = await requestPermission();
      }
      if (!current.granted) {
        if (explainDenial && !current.canAskAgain) {
          Alert.alert('Location is off', 'Allow location access in Settings to see parks around you.', [
            { text: 'Not now', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ]);
        }
        return null;
      }

      const position =
        (await Location.getLastKnownPositionAsync({ maxAge: 60_000, requiredAccuracy: 100 })) ??
        (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
      return { latitude: position.coords.latitude, longitude: position.coords.longitude };
    },
    [permission, requestPermission],
  );

  return { hasPermission: permission?.granted ?? false, getLocation };
}
