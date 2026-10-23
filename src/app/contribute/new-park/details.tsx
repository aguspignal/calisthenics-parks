import { useLocalSearchParams } from 'expo-router';

import { RequireAuth } from '@/components/require-auth';
import { NewParkDetailsScreen } from '@/screens/new-park/details';

export default function NewParkDetailsRoute() {
  const { lat, lng } = useLocalSearchParams<{ lat: string; lng: string }>();
  return (
    <RequireAuth reason="Adding a park needs an account.">
      <NewParkDetailsScreen location={{ latitude: Number(lat), longitude: Number(lng) }} />
    </RequireAuth>
  );
}
