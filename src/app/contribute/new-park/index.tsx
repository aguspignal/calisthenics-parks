import { RequireAuth } from '@/components/require-auth';
import { NewParkLocationScreen } from '@/screens/new-park/location';

export default function NewParkRoute() {
  return (
    <RequireAuth reason="Adding a park needs an account.">
      <NewParkLocationScreen />
    </RequireAuth>
  );
}
