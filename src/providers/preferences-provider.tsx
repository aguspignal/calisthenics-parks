import 'expo-sqlite/localStorage/install';

import { createContext, use, useState, type ReactNode } from 'react';

export type DistanceUnit = 'km' | 'mi';

type Preferences = {
  distanceUnit: DistanceUnit;
  setDistanceUnit: (unit: DistanceUnit) => void;
};

const STORAGE_KEY = 'preferences.distanceUnit';

const PreferencesContext = createContext<Preferences>({
  distanceUnit: 'km',
  setDistanceUnit: () => {},
});

/** Device-local preferences, persisted with expo-sqlite's localStorage. */
export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [distanceUnit, setUnit] = useState<DistanceUnit>(() =>
    localStorage.getItem(STORAGE_KEY) === 'mi' ? 'mi' : 'km',
  );

  const setDistanceUnit = (unit: DistanceUnit) => {
    localStorage.setItem(STORAGE_KEY, unit);
    setUnit(unit);
  };

  return <PreferencesContext value={{ distanceUnit, setDistanceUnit }}>{children}</PreferencesContext>;
}

export function usePreferences() {
  return use(PreferencesContext);
}
