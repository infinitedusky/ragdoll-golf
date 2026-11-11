// PROTOTYPE (RG-1): the address pose, solved by scripts/solve-address.mjs on the dummy skeleton (body and girdles by hand, arms by two-bone IK).
// Local Euler XYZ in degrees relative to the rest pose; bones not listed stay at rest.
export const ADDRESS_POSE = {
  pelvis: [32, 0, 0],
  lowerBack: [5, 0, 6],
  upperBack: [3, 0, 5],
  neck: [-14, 0, -6],
  head: [-10, 0, -4],
  leadGirdle: [0, 20, 0],
  leadShoulder: [-67.2, -30.9, -27.1],
  leadElbow: [-32.5, 0, 0],
  leadWrist: [18.1, 29.8, 7.5],
  trailGirdle: [0, 30, 20],
  trailShoulder: [-31.5, 45.9, -44.8],
  trailElbow: [-36.3, 0, 0],
  trailWrist: [29.3, -40.2, -16.1],
  leadHip: [-50, 0, 7],
  leadKnee: [34, 0, 0],
  leadAnkle: [-14.5, 11.7, -6.8],
  trailHip: [-50, 0, -7],
  trailKnee: [34, 0, 0],
  trailAnkle: [-15.2, -5.8, 6.7],
}

// Where the pelvis (the root bone) stands, metres: feet flat on the ground, arms nearly straight
export const ADDRESS_ROOT = [0, 0.8947, -0.03]

// The club in the trail wrist's frame (metres, unit quaternion)
export const CLUB_IN_TRAIL_WRIST = { position: [0.04, -0.8301, -0.0028], quaternion: [0.23769, 0, 0, 0.97134] }
