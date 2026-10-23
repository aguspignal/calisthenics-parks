import { PencilLine } from 'lucide-react-native';

import { RequireAuth } from '@/components/require-auth';
import { ComingSoon } from '@/screens/coming-soon';

export default function EditParkRoute() {
  return (
    <RequireAuth reason="Suggesting changes needs an account.">
      <ComingSoon
        icon={PencilLine}
        description="Change the name, description or location, add or remove equipment and update its condition, change amenities, or report that the park is gone."
        rules={['Only from near the park.', 'Applies once two other users nearby confirm it; two rejections discard it.']}
      />
    </RequireAuth>
  );
}
