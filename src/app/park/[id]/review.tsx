import { MessageSquare } from 'lucide-react-native';

import { RequireAuth } from '@/components/require-auth';
import { ComingSoon } from '@/screens/coming-soon';

export default function ReviewRoute() {
  return (
    <RequireAuth reason="Reviewing a park needs an account.">
      <ComingSoon
        icon={MessageSquare}
        description="Rate overall, equipment quality, environment, cleanliness and safety from 1 to 5, and add a comment and photos."
        rules={['Only from near the park.', 'Publishes right away; reports from other users can hide it.']}
      />
    </RequireAuth>
  );
}
