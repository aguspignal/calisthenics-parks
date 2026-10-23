import { focusManager, QueryClient } from '@tanstack/react-query';
import { AppState, Platform } from 'react-native';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 1,
    },
  },
});

// React Native has no window focus events: refetch stale queries when the app returns to the foreground.
AppState.addEventListener('change', (state) => {
  if (Platform.OS !== 'web') {
    focusManager.setFocused(state === 'active');
  }
});
