import type { MapStyleElement } from 'react-native-maps';

import { palette } from './colors';

/** Google Maps style: dark, minimal, only parks kept among points of interest. */
export const mapStyle: MapStyleElement[] = [
  { elementType: 'geometry', stylers: [{ color: palette.black_1 }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: palette.gray_0 }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: palette.black_1 }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: palette.black_3 }] },
  { featureType: 'administrative.land_parcel', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.park', stylers: [{ visibility: 'on' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: palette.black_2 }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: palette.black_3 }] },
  { featureType: 'road', elementType: 'labels.text.stroke', stylers: [{ color: palette.black_1 }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: palette.black_0 }] },
];
