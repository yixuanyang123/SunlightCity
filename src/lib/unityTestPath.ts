/**
 * Unity ↔ WGS84 test nodes (Upper West Manhattan ~125th St).
 * Used only for map overlay debugging — safe to remove when done testing.
 */
export const UNITY_TEST_MAP_PATH: { lat: number; lng: number; label: string }[] = [
  { lat: 40.800534, lng: -73.938083, label: '1' },
  { lat: 40.799627, lng: -73.935891, label: '2' },
  { lat: 40.799007, lng: -73.936422, label: '3' },
  { lat: 40.79826, lng: -73.936881, label: '4' },
  { lat: 40.799273, lng: -73.939023, label: '5' },
]

/** Extra reference point only (not part of the 1→5 polyline). */
export const UNITY_EXTRA_DEBUG_POINTS: { lat: number; lng: number; label: string }[] = [
  { lat: 40.748471, lng: -73.984492, label: 'Ref' },
  { lat: 40.7482, lng: -73.9855, label: 'P' },
]

/** West Village / Greenwich Village test path (nodes 1→5, table order). */
export const UNITY_WEST_VILLAGE_PATH: { lat: number; lng: number; label: string }[] = [
  { lat: 40.7327, lng: -74.0087, label: '1' },
  { lat: 40.7319, lng: -74.0088, label: '2' },
  { lat: 40.732, lng: -74.0102, label: '3' },
  { lat: 40.7324, lng: -74.0102, label: '4' },
  { lat: 40.7325, lng: -74.0099, label: '5' },
]

/** Lower East / ~Bowery area test path (nodes 1→5, table order). */
export const UNITY_LOWER_EAST_PATH: { lat: number; lng: number; label: string }[] = [
  { lat: 40.72158, lng: -73.986593, label: '1' },
  { lat: 40.721355, lng: -73.985821, label: '2' },
  { lat: 40.720197, lng: -73.986447, label: '3' },
  { lat: 40.720427, lng: -73.987216, label: '4' },
  { lat: 40.720659, lng: -73.988009, label: '5' },
]

/** ~Central Park West / West 60s test path (nodes 1→5, table order). */
export const UNITY_CPW_PATH: { lat: number; lng: number; label: string }[] = [
  { lat: 40.772349, lng: -73.982412, label: '1' },
  { lat: 40.772307, lng: -73.982208, label: '2' },
  { lat: 40.772572, lng: -73.982059, label: '3' },
  { lat: 40.772684, lng: -73.982355, label: '4' },
  { lat: 40.773686, lng: -73.984796, label: '5' },
]

/** East Harlem test path (nodes 1→5, table order). */
export const UNITY_EAST_HARLEM_PATH: { lat: number; lng: number; label: string }[] = [
  { lat: 40.799291, lng: -73.941067, label: '1' },
  { lat: 40.798619, lng: -73.94156, label: '2' },
  { lat: 40.799198, lng: -73.942952, label: '3' },
  { lat: 40.799335, lng: -73.943272, label: '4' },
  { lat: 40.799999, lng: -73.942726, label: '5' },
]
