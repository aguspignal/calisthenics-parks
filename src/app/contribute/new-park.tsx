import { MapPinned } from 'lucide-react-native';

import { RequireAuth } from '@/components/require-auth';
import { ComingSoon } from '@/screens/coming-soon';

export default function NewParkRoute() {
  return (
    <RequireAuth reason="Adding a park needs an account.">
      <ComingSoon
        icon={MapPinned}
        description="Place the pin, name the park, pick its equipment and amenities, and add photos."
        rules={[
          'The pin must be near where you are standing.',
          'The park shows as unverified until two other users nearby confirm it.',
          'Two rejections remove it.',
        ]}
      />
    </RequireAuth>
  );
}
