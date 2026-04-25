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


/** Morningside Heights test path (nodes 1→5, table order). */
export const UNITY_MORNINGSIDE_PATH: { lat: number; lng: number; label: string }[] = [
  { lat: 40.804448, lng: -73.957577, label: '1' },
  { lat: 40.804126, lng: -73.956805, label: '2' },
  { lat: 40.804803, lng: -73.9563, label: '3' },
  { lat: 40.804213, lng: -73.954891, label: '4' },
  { lat: 40.803204, lng: -73.952229, label: '5' },
]

/** Tribeca / Soho edge test path (nodes 1→5, purple line on map). */
export const UNITY_TRIBECA_PATH: { lat: number; lng: number; label: string }[] = [
  { lat: 40.7169, lng: -73.9862, label: '1' },
  { lat: 40.7164, lng: -73.9845, label: '2' },
  { lat: 40.7162, lng: -73.9837, label: '3' },
  { lat: 40.7152, lng: -73.9842, label: '4' },
  { lat: 40.7149, lng: -73.9833, label: '5' },
]

/** Morningside / ~120th St corridor (nodes 1→5, user order). */
export const UNITY_MORNINGSIDE_CORRIDOR_PATH: { lat: number; lng: number; label: string }[] = [
  { lat: 40.8033, lng: -73.9527, label: '1' },
  { lat: 40.8044, lng: -73.9554, label: '2' },
  { lat: 40.805, lng: -73.9569, label: '3' },
  { lat: 40.8044, lng: -73.9573, label: '4' },
  { lat: 40.8047, lng: -73.9582, label: '5' },
]

/** Upper East / ~Lenox Hill (nodes 1→5, green line on map). */
export const UNITY_UPPER_EAST_PATH: { lat: number; lng: number; label: string }[] = [
  { lat: 40.7631, lng: -73.9625, label: '1' },
  { lat: 40.7625, lng: -73.963, label: '2' },
  { lat: 40.7619, lng: -73.9634, label: '3' },
  { lat: 40.7615, lng: -73.9624, label: '4' },
  { lat: 40.7609, lng: -73.9611, label: '5' },
]

/** Morningside / east campus loop (nodes 1→5, pink line on map). */
export const UNITY_MORNINGSIDE_EAST_LOOP_PATH: { lat: number; lng: number; label: string }[] = [
  { lat: 40.803, lng: -73.9363, label: '1' },
  { lat: 40.8037, lng: -73.9359, label: '2' },
  { lat: 40.8044, lng: -73.9374, label: '3' },
  { lat: 40.8051, lng: -73.9369, label: '4' },
  { lat: 40.8044, lng: -73.9354, label: '5' },
]

/** Morningside west / ~Riverside (nodes 1→5, gold line on map). */
export const UNITY_MORNINGSIDE_WEST_PATH: { lat: number; lng: number; label: string }[] = [
  { lat: 40.7796, lng: -73.9578, label: '1' },
  { lat: 40.7795, lng: -73.9576, label: '2' },
  { lat: 40.7789, lng: -73.9561, label: '3' },
  { lat: 40.7782, lng: -73.9544, label: '4' },
  { lat: 40.7772, lng: -73.9522, label: '5' },
]

/** Financial District / WTC edge (nodes 1→5, light-blue senary line on map). */
export const UNITY_FIDI_PATH: { lat: number; lng: number; label: string }[] = [
  { lat: 40.7083, lng: -74.0113, label: '1' },
  { lat: 40.7086, lng: -74.0111, label: '2' },
  { lat: 40.7088, lng: -74.0109, label: '3' },
  { lat: 40.7081, lng: -74.0098, label: '4' },
  { lat: 40.7077, lng: -74.0102, label: '5' },
]

/** Upper West / Central Park south (nodes 1→5, coral septenary line on map). */
export const UNITY_CENTRAL_WEST_PATH: { lat: number; lng: number; label: string }[] = [
  { lat: 40.7832, lng: -73.9804, label: '1' },
  { lat: 40.7825, lng: -73.9788, label: '2' },
  { lat: 40.7813, lng: -73.976, label: '3' },
  { lat: 40.782, lng: -73.9755, label: '4' },
  { lat: 40.7831, lng: -73.9783, label: '5' },
]

/** Upper West / ~72nd & Amsterdam (nodes 1→5, violet octonary line on map). */
export const UNITY_UWS_72_PATH: { lat: number; lng: number; label: string }[] = [
  { lat: 40.771, lng: -73.9871, label: '1' },
  { lat: 40.7717, lng: -73.9867, label: '2' },
  { lat: 40.7723, lng: -73.9862, label: '3' },
  { lat: 40.7711, lng: -73.9834, label: '4' },
  { lat: 40.7713, lng: -73.9833, label: '5' },
]

/** Upper West / Columbus corridor (nodes 1→5, teal nonary line on map). */
export const UNITY_UWS_COLUMBUS_PATH: { lat: number; lng: number; label: string }[] = [
  { lat: 40.7702, lng: -73.9678, label: '1' },
  { lat: 40.7709, lng: -73.9673, label: '2' },
  { lat: 40.7705, lng: -73.9664, label: '3' },
  { lat: 40.7698, lng: -73.9649, label: '4' },
  { lat: 40.7692, lng: -73.9653, label: '5' },
]

/** Hudson Yards / west 30s (nodes 1→5, rose denary line on map). */
export const UNITY_HUDSON_YARDS_PATH: { lat: number; lng: number; label: string }[] = [
  { lat: 40.7558, lng: -74, label: '1' },
  { lat: 40.7553, lng: -73.9987, label: '2' },
  { lat: 40.7546, lng: -73.9971, label: '3' },
  { lat: 40.754, lng: -73.9976, label: '4' },
  { lat: 40.7546, lng: -73.9991, label: '5' },
]

/** Washington Heights / Harlem river edge (nodes 1→5, amber-600 11th line on map). */
export const UNITY_HARLEM_RIVER_PATH: { lat: number; lng: number; label: string }[] = [
  { lat: 40.8172, lng: -73.9523, label: '1' },
  { lat: 40.8178, lng: -73.9518, label: '2' },
  { lat: 40.8184, lng: -73.9509, label: '3' },
  { lat: 40.8203, lng: -73.9494, label: '4' },
  { lat: 40.8197, lng: -73.9478, label: '5' },
]

/** SoHo / Canal corridor (nodes 1→5, indigo 12th line on map). */
export const UNITY_SOHO_CANAL_PATH: { lat: number; lng: number; label: string }[] = [
  { lat: 40.727, lng: -73.9999, label: '1' },
  { lat: 40.7269, lng: -74, label: '2' },
  { lat: 40.7265, lng: -73.9992, label: '3' },
  { lat: 40.7261, lng: -73.9984, label: '4' },
  { lat: 40.7281, lng: -73.998, label: '5' },
]

/** Gramercy / Flatiron (nodes 1→5, orange 13th line on map). */
export const UNITY_GRAMERCY_PATH: { lat: number; lng: number; label: string }[] = [
  { lat: 40.7445, lng: -73.9791, label: '1' },
  { lat: 40.7439, lng: -73.9795, label: '2' },
  { lat: 40.7429, lng: -73.9772, label: '3' },
  { lat: 40.7435, lng: -73.9769, label: '4' },
  { lat: 40.7441, lng: -73.9764, label: '5' },
]

/** Midtown / ~6th Ave (nodes 1→5, slate 14th line on map). */
export const UNITY_MIDTOWN_CENTRAL_PATH: { lat: number; lng: number; label: string }[] = [
  { lat: 40.7567, lng: -73.9786, label: '1' },
  { lat: 40.7561, lng: -73.979, label: '2' },
  { lat: 40.7554, lng: -73.9795, label: '3' },
  { lat: 40.7548, lng: -73.9799, label: '4' },
  { lat: 40.7561, lng: -73.9832, label: '5' },
]


/** Lower Manhattan / west village edge (nodes 1→5, cyan-700 15th line on map). */
export const UNITY_WEST_VILLAGE_EDGE_PATH: { lat: number; lng: number; label: string }[] = [
  { lat: 40.7189, lng: -74.0048, label: '1' },
  { lat: 40.719, lng: -74.0051, label: '2' },
  { lat: 40.7191, lng: -74.0051, label: '3' },
  { lat: 40.7198, lng: -74.0052, label: '4' },
  { lat: 40.7206, lng: -74.0052, label: '5' },
]


/** Chelsea / Hudson west side (nodes 1→5, lime-600 16th line on map). */
export const UNITY_CHELSEA_HUDSON_PATH: { lat: number; lng: number; label: string }[] = [
  { lat: 40.7385, lng: -74.0039, label: '1' },
  { lat: 40.7388, lng: -74.0039, label: '2' },
  { lat: 40.7388, lng: -74.0055, label: '3' },
  { lat: 40.7388, lng: -74.0064, label: '4' },
  { lat: 40.7388, lng: -74.0081, label: '5' },
]


/** Inwood east ridge (nodes 1→5, emerald 17th line on map). */
export const UNITY_INWOOD_EAST_PATH: { lat: number; lng: number; label: string }[] = [
  { lat: 40.8267, lng: -73.9431, label: '1' },
  { lat: 40.826, lng: -73.9434, label: '2' },
  { lat: 40.8254, lng: -73.9438, label: '3' },
  { lat: 40.8259, lng: -73.9453, label: '4' },
  { lat: 40.8265, lng: -73.9467, label: '5' },
]


/** East Harlem central (nodes 1→5, sky-500 18th line on map). */
export const UNITY_EAST_HARLEM_CENTRAL_PATH: { lat: number; lng: number; label: string }[] = [
  { lat: 40.791, lng: -73.9472, label: '1' },
  { lat: 40.7903, lng: -73.9456, label: '2' },
  { lat: 40.7909, lng: -73.9452, label: '3' },
  { lat: 40.7916, lng: -73.9447, label: '4' },
  { lat: 40.7907, lng: -73.9424, label: '5' },
]


/** Upper East / Yorkville arc (nodes 1→5, violet-red 19th line on map). */
export const UNITY_YORKVILLE_ARC_PATH: { lat: number; lng: number; label: string }[] = [
  { lat: 40.7947, lng: -73.9699, label: '1' },
  { lat: 40.7941, lng: -73.9704, label: '2' },
  { lat: 40.7934, lng: -73.9709, label: '3' },
  { lat: 40.7927, lng: -73.9713, label: '4' },
  { lat: 40.7916, lng: -73.9685, label: '5' },
]


/** East Village / Lower East connector (nodes 1→5, blue-gray 20th line on map). */
export const UNITY_EAST_VILLAGE_CONNECTOR_PATH: { lat: number; lng: number; label: string }[] = [
  { lat: 40.7331, lng: -73.9844, label: '1' },
  { lat: 40.7343, lng: -73.9835, label: '2' },
  { lat: 40.734, lng: -73.9827, label: '3' },
  { lat: 40.7333, lng: -73.9812, label: '4' },
  { lat: 40.732, lng: -73.9821, label: '5' },
]

export const UNITY_PATH_21: { lat: number; lng: number; label: string }[] = [
  { lat: 40.8051, lng: -73.9528, label: '1' },
  { lat: 40.8059, lng: -73.9528, label: '2' },
  { lat: 40.8064, lng: -73.9540, label: '3' },
  { lat: 40.8057, lng: -73.9544, label: '4' },
  { lat: 40.8063, lng: -73.9559, label: '5' },
]

export const UNITY_PATH_22: { lat: number; lng: number; label: string }[] = [
  { lat: 40.7773, lng: -73.9522, label: '1' },
  { lat: 40.7766, lng: -73.9527, label: '2' },
  { lat: 40.7759, lng: -73.9532, label: '3' },
  { lat: 40.7769, lng: -73.9554, label: '4' },
  { lat: 40.7762, lng: -73.9559, label: '5' },
]

export const UNITY_PATH_23: { lat: number; lng: number; label: string }[] = [
  { lat: 40.7818, lng: -73.9793, label: '1' },
  { lat: 40.7812, lng: -73.9798, label: '2' },
  { lat: 40.7806, lng: -73.9802, label: '3' },
  { lat: 40.7794, lng: -73.9774, label: '4' },
  { lat: 40.7787, lng: -73.9779, label: '5' },
]

export const UNITY_PATH_24: { lat: number; lng: number; label: string }[] = [
  { lat: 40.7546, lng: -73.9991, label: '1' },
  { lat: 40.7553, lng: -73.9987, label: '2' },
  { lat: 40.7559, lng: -73.9982, label: '3' },
  { lat: 40.7552, lng: -73.9965, label: '4' },
  { lat: 40.7546, lng: -73.9971, label: '5' },
]

export const UNITY_PATH_25: { lat: number; lng: number; label: string }[] = [
  { lat: 40.7284, lng: -73.9997, label: '1' },
  { lat: 40.7273, lng: -74.0006, label: '2' },
  { lat: 40.7272, lng: -74.0007, label: '3' },
  { lat: 40.7269, lng: -74.0000, label: '4' },
  { lat: 40.7258, lng: -74.0009, label: '5' },
]

export const UNITY_PATH_26: { lat: number; lng: number; label: string }[] = [
  { lat: 40.7333, lng: -73.9832, label: '1' },
  { lat: 40.7326, lng: -73.9814, label: '2' },
  { lat: 40.7322, lng: -73.9803, label: '3' },
  { lat: 40.7331, lng: -73.9796, label: '4' },
  { lat: 40.7334, lng: -73.9797, label: '5' },
]
