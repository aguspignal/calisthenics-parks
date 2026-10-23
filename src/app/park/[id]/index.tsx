import { useLocalSearchParams } from 'expo-router';

import { ParkScreen } from '@/screens/park';

export default function ParkRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ParkScreen id={id} />;
}
