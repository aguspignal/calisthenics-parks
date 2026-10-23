import { ShieldCheck } from 'lucide-react-native';

import { RequireAuth } from '@/components/require-auth';
import { ComingSoon } from '@/screens/coming-soon';

export default function VerifyRoute() {
  return (
    <RequireAuth reason="Confirming changes needs an account.">
      <ComingSoon
        icon={ShieldCheck}
        description="See this park's pending changes and confirm or reject each one."
        rules={['Only from near the park.', "You can't vote on your own changes."]}
      />
    </RequireAuth>
  );
}
